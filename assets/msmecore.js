/* NSMsme: compliance helpers, pure functions with no screen (node scripts/test_msme.js).
   1  MSME payables   bills owed to micro and small suppliers past the time limit of section 15 of the MSMED Act, 2006.
                      Beyond that limit the amount is deductible only in the year it is actually paid: section 43B(h) of the Income-tax Act,
                      1961, and section 37(2)(g) of the Income-tax Act, 2025 from 1 April 2026 (paying before the return due date does NOT help).
                      Time limit: with a written agreement the agreed days, never more than 45; with none, 15 days. Counted from the bill date,
                      which stands in for the day of acceptance (the App does not know that day).
   2  limits          the business's own sales against the composition, e-invoice and e-way bill limits.
   3  backup          days since the last backup file, and the auto-save folder.
   Rules read from the official texts on 17 Nov 2026; every screen says "as of 17 November 2026, check the current notification". */
(function (G) {
  'use strict';
  var B = (typeof require === 'function' && typeof module !== 'undefined') ? require('./books.js') : G.NSBooks;
  var num = B.num, r2 = B.r2, key = B.key;
  var AS_OF = '2026-11-17';
  var SIZES = ['micro', 'small', 'medium', 'other', 'unknown'];

  function addDays(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function gap(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5); }
  function fyOf(iso) { var y = +iso.slice(0, 4), m = +iso.slice(5, 7), s = m >= 4 ? y : y - 1; return s + '-' + String(s + 1).slice(2); }
  function fyEnd(fy) { return (+fy.slice(0, 4) + 1) + '-03-31'; }
  function fyStart(fy) { return fy.slice(0, 4) + '-04-01'; }
  function prevFy(fy) { var s = +fy.slice(0, 4) - 1; return s + '-' + String(s + 1).slice(2); }
  function covered(size) { return size === 'micro' || size === 'small'; }

  /* ---------- Udyam number: format only (UDYAM-XX-00-0000000), nothing is looked up ---------- */
  function udyam(s) {
    var t = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), m = /^UDYAM([A-Z]{2})(\d{2})(\d{7})$/.exec(t);
    return m ? 'UDYAM-' + m[1] + '-' + m[2] + '-' + m[3] : '';
  }

  /* ---------- the time limit ---------- */
  /* days allowed: agreed days (1 to 45; more than 45 counts as 45), or 15 when there is no written agreement */
  function limitDays(ag) { var n = Math.floor(num(ag)); return n <= 0 ? 15 : n > 45 ? 45 : n; }
  function deadline(billDate, ag) { return addDays(billDate, limitDays(ag)); }   /* last day to pay without crossing the limit */

  function index(parties) { var m = {}; (parties || []).forEach(function (p) { if (p && p.name) m[key(p.name)] = p; }); return m; }
  function sizeOf(p) { return p && SIZES.indexOf(p.msme) >= 0 ? p.msme : 'unknown'; }

  /* interest for the buyer to pay the supplier (section 16): 3 times the RBI bank rate, compounded each month, from the day after the
     last day. An ESTIMATE only: needs the bank rate (a yearly %), which the user types. */
  function interest(amt, dl, asOf, rate) {
    var days = gap(dl, asOf), r = num(rate);
    if (!(days > 0) || !(r > 0) || !(amt > 0)) return 0;
    var i = 3 * r / 100 / 12, m = days / 30.4375, whole = Math.floor(m), frac = m - whole;
    return r2(amt * (Math.pow(1 + i, whole) * (1 + i * frac) - 1));
  }

  /* ---------- 1. payables ---------- */
  /* ctx: { docs, biz, today, parties: the party records, soon (days, default 7), rate (bank rate %, optional) }
     rows: open bills to micro and small suppliers, worst first. state: late (past the limit), soon (within `soon` days), ok.
     unknown: suppliers with open bills whose size is not set (so nothing can be said about them). */
  function payables(ctx) {
    var pm = index(ctx.parties), today = ctx.today, soon = ctx.soon == null ? 7 : ctx.soon, rows = [], unk = {};
    B.bills(ctx.docs || [], ctx.biz).bills.forEach(function (b) {
      if (b.side !== 'pay' || !(b.left > 0.004)) return;
      var k = key(b.party), p = pm[k] || {}, size = sizeOf(p);
      if (size === 'unknown') { var u = unk[k] = unk[k] || { party: b.party, n: 0, amt: 0 }; u.n++; u.amt = r2(u.amt + b.left); return; }
      if (!covered(size)) return;
      var dl = deadline(b.date, p.agdays), left = gap(today, dl);
      rows.push({ id: b.id, no: b.no, date: b.date, party: b.party, size: size, amt: b.left, total: b.total, dl: dl, daysLeft: left, days: limitDays(p.agdays), agreed: num(p.agdays) > 0,
        state: left < 0 ? 'late' : left <= soon ? 'soon' : 'ok', interest: left < 0 ? interest(b.left, dl, today, ctx.rate) : 0 });
    });
    rows.sort(function (a, c) { return a.daysLeft - c.daysLeft; });
    var late = rows.filter(function (x) { return x.state === 'late'; }), sn = rows.filter(function (x) { return x.state === 'soon'; });
    function sum(l, f) { return r2(l.reduce(function (a, x) { return a + (f ? x[f] : x.amt); }, 0)); }
    return { rows: rows, late: late.length, lateAmt: sum(late), soon: sn.length, soonAmt: sum(sn), interest: sum(late, 'interest'),
      unknown: Object.keys(unk).map(function (k) { return unk[k]; }).sort(function (a, c) { return c.amt - a.amt; }) };
  }

  /* the year-end report: what is still unpaid, beyond the limit, as at `asOn` (31 March of the year). Records after that day are left
     out, so a past year shows what stood on its 31 March. For the current year the report reads "if still unpaid on 31 March". */
  function yearEnd(ctx, fy) {
    var asOn = fyEnd(fy), docs = (ctx.docs || []).filter(function (d) { return !d.date || d.date <= asOn; });
    var R = payables(Object.assign({}, ctx, { docs: docs, today: asOn, soon: -1 }));
    var rows = R.rows.filter(function (x) { return x.state === 'late'; });
    return { fy: fy, asOn: asOn, rows: rows, n: rows.length, amt: R.lateAmt, interest: R.interest, unknown: R.unknown };
  }

  /* ---------- 2. limits ---------- */
  var SPECIAL = ['05', '11', '12', '13', '14', '15', '16', '17'];   /* Uttarakhand, Sikkim, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Meghalaya */
  var EWB_LIMIT = 50000;
  /* a document that moves goods: not one whose every line carries a service code (SAC, 99...) and not a service-type bill. A line with no code counts as goods (the data cannot tell). */
  var SERVICE_TYPES = { visit: 1, svc: 1, fee: 1, rentb: 1, hotel: 1, rabill: 1 };
  function movesGoods(d) {
    if (SERVICE_TYPES[d.type]) return false;
    var l = (d.items || []).filter(function (it) { return String(it.desc || '').trim() || num(it.rate); });
    return !(l.length && l.every(function (it) { return /^99/.test(String(it.hsn || '').trim()); }));
  }
  function status(v, limit) { return v > limit ? 'over' : v >= 0.8 * limit ? 'near' : 'under'; }
  /* ctx: { docs, biz, today, state (2-digit code of the business) }  -> sales without tax per financial year, and the lines */
  function limits(ctx) {
    var biz = key(ctx.biz), fy = fyOf(ctx.today), py = prevFy(fy), tot = {}, bigBills = 0, biggest = 0;
    (ctx.docs || []).forEach(function (d) {
      if (key(d.seller && d.seller.name) !== biz || !d.date) return;
      var R = B.role(d), sign = R === 'sale' || R === 'sdeb' ? 1 : R === 'sret' ? -1 : 0; if (!sign) return;
      var t = B.itemTotals(d), f = fyOf(d.date);
      tot[f] = r2((tot[f] || 0) + sign * t.taxable);
      if (sign > 0 && f === fy && movesGoods(d)) { if (t.total > EWB_LIMIT) bigBills++; if (t.total > biggest) biggest = r2(t.total); }
    });
    var cur = tot[fy] || 0, prev = tot[py] || 0, special = SPECIAL.indexOf(String(ctx.state || '').slice(0, 2)) >= 0;
    function line(id, limit, basis, st) { return { id: id, limit: limit, basis: basis, cur: cur, prev: prev, pctCur: Math.round(100 * cur / limit), pctPrev: Math.round(100 * prev / limit), status: st, curStatus: status(cur, limit), prevStatus: status(prev, limit) }; }
    var L = [];
    var cg = special ? 7500000 : 15000000; L.push(Object.assign(line('comp_goods', cg, 'turnover', status(prev, cg)), { special: special }));
    L.push(line('comp_serv', 5000000, 'turnover', status(prev, 5000000)));
    L.push(line('einv', 50000000, 'turnover', status(Math.max(cur, prev), 50000000)));
    L.push({ id: 'ewb', limit: EWB_LIMIT, basis: 'consignment', n: bigBills, max: biggest, status: bigBills ? 'over' : 'under' });
    return { fy: fy, prevFy: py, cur: cur, prev: prev, special: special, lines: L, asOf: AS_OF };
  }

  /* ---------- 3. backup health ---------- */
  /* last: ms time of the last backup file (or auto save), docs: how many documents exist, folder: NS.folderStatus() or null.
     level: empty (nothing to lose), never, ok, old (7 days or more) */
  function backup(last, now, docs, folder) {
    var f = folder && folder.supported ? (folder.on ? (folder.allowed ? 'on' : 'ask') : 'off') : 'na';
    if (!docs) return { level: 'empty', days: null, folder: f };
    if (!last) return { level: 'never', days: null, folder: f };
    var days = Math.max(0, Math.floor((now - last) / 864e5));
    return { level: days >= 7 ? 'old' : 'ok', days: days, folder: f };
  }

  var API = { AS_OF: AS_OF, SIZES: SIZES, SPECIAL: SPECIAL, udyam: udyam, limitDays: limitDays, deadline: deadline, interest: interest, payables: payables, yearEnd: yearEnd,
    limits: limits, backup: backup, fyOf: fyOf, fyEnd: fyEnd, fyStart: fyStart, prevFy: prevFy, covered: covered, movesGoods: movesGoods, sizeOf: sizeOf, addDays: addDays, gap: gap };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSMsme = API;
})(typeof window !== 'undefined' ? window : globalThis);
