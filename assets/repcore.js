/* NSRep: the sums behind the report screens of NSBiz (ERP review, Round 1 reports). Pure functions over the saved records and
   NSBooks, so node tests can run them (scripts/test_reports.js). The screens are in reports.js, ledger.js, money.js, finrep.js.
     opp(d, acct, nameOf)      the other side of a voucher in one account's ledger ("To Sales", "By Cash"): Tally's Particulars (R-18)
     monthly(book, from, to)   a ledger month by month: opening, debit, credit, closing (R-6)
     regRow(d)                 one line of a sales / purchase register: taxable, CGST, SGST, IGST, round off, TCS, total, taxable per GST rate (R-12)
     ageLimits(v)              ageing buckets from a typed list ("30, 60, 90, 180"), sorted, at least one (R-13)
     bucket(days, limits)      which bucket a number of days falls in
     outstanding(docs, biz, asOn, opt)  every unpaid bill of every party as on a date, with due date, overdue days and bucket (R-13)
     exceptions(docs, biz, opt)         things to check: negative cash, duplicate bill numbers, future dates, over credit limit... (R-15) */
(function (G) {
  'use strict';
  var B = G.NSBooks || (typeof require !== 'undefined' ? require('./books.js') : null);
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function monthEnd(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return ym + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0'); }

  /* ---------- Particulars: the account(s) on the other side of this account's line ---------- */
  function opp(d, acct, nameOf) {
    var L = B.postings(d), dr = 0, cr = 0;
    L.forEach(function (l) { if (l.a === acct) { dr += l.dr; cr += l.cr; } });
    var debit = dr >= cr, other = L.filter(function (l) { return l.a !== acct && (debit ? l.cr : l.dr); });
    if (!other.length) other = L.filter(function (l) { return l.a !== acct; });
    var by = {}; other.forEach(function (l) { by[l.a] = (by[l.a] || 0) + (debit ? l.cr || l.dr : l.dr || l.cr); });
    var names = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (a) { return nameOf ? nameOf(a, d) : a; });
    var seen = {}; names = names.filter(function (n) { if (seen[n]) return false; seen[n] = 1; return true; });
    return { side: debit ? 'To' : 'By', names: names, text: names.length ? (debit ? 'To ' : 'By ') + names.slice(0, 3).join(', ') + (names.length > 3 ? ' and ' + (names.length - 3) + ' more' : '') : '' };
  }
  /* the narration of a voucher, whatever the record calls it */
  function narr(d) { var t = String(d.narr || d.narration || (d.items && d.items.length ? '' : d.notes || d.note) || d.remarks || '').trim(); return t.length > 160 ? t.slice(0, 157) + '...' : t; }

  /* ---------- a ledger month by month (from NSBooks.book of the whole period) ---------- */
  function months(from, to) {
    var out = [], y = +from.slice(0, 4), m = +from.slice(5, 7);
    while (out.length < 60) { var ym = y + '-' + String(m).padStart(2, '0'); if (ym + '-01' > to) break; out.push(ym); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  function monthly(bk, from, to) {
    var bal = bk.open, by = {};
    bk.rows.forEach(function (x) { var ym = String(x.date || '').slice(0, 7), o = by[ym] = by[ym] || { dr: 0, cr: 0, n: 0 }; o.dr += x.dr; o.cr += x.cr; o.n++; });
    return months(from, to).map(function (ym) {
      var o = by[ym] || { dr: 0, cr: 0, n: 0 }, open = bal; bal = r2(bal + o.dr - o.cr);
      return { m: ym, from: ym + '-01' < from ? from : ym + '-01', to: monthEnd(ym) > to ? to : monthEnd(ym), open: r2(open), dr: r2(o.dr), cr: r2(o.cr), n: o.n, close: bal };
    });
  }

  /* ---------- one line of a register ---------- */
  function regRow(d, amountOf) {
    var R = B.role(d), sg = /ret$/.test(R) ? -1 : 1, has = d.items && d.items.length, t = has ? B.itemTotals(d) : null;
    var noTax = d.kind === 'supply' || d.kind === 'plain' || d.withGst === false || d.type === 'pbill' && d.noGst;
    var total = amountOf ? num(amountOf(d)) : t ? t.total : num(d.amount || d.total);
    var rates = {};
    if (has) (d.items || []).concat(B.chargeLines ? B.chargeLines(d) : []).forEach(function (it) {
      var q = it.qty === '' || it.qty == null ? 1 : num(it.qty), rate = num(it.rate); if (!it.desc && !rate) return;
      var tx = r2(q * rate - q * rate * num(it.disc) / 100), g = noTax ? 0 : num(it.gst);
      rates[g] = r2((rates[g] || 0) + sg * tx);
    });
    var gstin = String(d.buyer && d.buyer.gstin || '').toUpperCase();
    return { d: d, id: d.id, date: d.date || '', no: d.no || d.billNo || '', party: String(d.buyer && d.buyer.name || d.cat || '').trim(), gstin: gstin,
      pos: d.pos || d.buyer && d.buyer.state || '', sign: sg,
      taxable: r2(sg * (t ? t.taxable : total)), cgst: r2(sg * (t ? t.cgst : 0)), sgst: r2(sg * (t ? t.sgst : 0)), igst: r2(sg * (t ? t.igst : 0)),
      tcs: r2(sg * (t ? t.tcs || 0 : 0)), round: r2(sg * (t ? t.round || 0 : 0)), total: r2(sg * total), rates: rates };
  }
  function regTotals(rows) {
    var T = { taxable: 0, cgst: 0, sgst: 0, igst: 0, tcs: 0, round: 0, total: 0, rates: {} };
    rows.forEach(function (r) { ['taxable', 'cgst', 'sgst', 'igst', 'tcs', 'round', 'total'].forEach(function (k) { T[k] = r2(T[k] + r[k]); }); Object.keys(r.rates).forEach(function (g) { T.rates[g] = r2((T.rates[g] || 0) + r.rates[g]); }); });
    return T;
  }
  /* the GST rates used, low to high (columns of the columnar register) */
  function rateCols(rows) { var o = {}; rows.forEach(function (r) { Object.keys(r.rates).forEach(function (g) { o[g] = 1; }); }); return Object.keys(o).map(Number).sort(function (a, b) { return a - b; }); }

  /* ---------- ageing ---------- */
  function ageLimits(v) {
    var L = (Array.isArray(v) ? v : String(v || '').split(/[\s,;]+/)).map(function (x) { return Math.round(num(x)); }).filter(function (x) { return x > 0 && x < 10000; });
    L = L.filter(function (x, i) { return L.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
    return L.length ? L.slice(0, 8) : [30, 60, 90];
  }
  function bucket(days, limits) { for (var i = 0; i < limits.length; i++) if (days <= limits[i]) return i; return limits.length; }
  function bucketNames(limits) {
    var out = [], lo = 0;
    limits.forEach(function (l) { out.push(lo + '-' + l + ' days'); lo = l + 1; });
    out.push('Over ' + limits[limits.length - 1] + ' days');
    return out;
  }

  /* ---------- bill-wise outstanding of every party as on a date ----------
     opt: { side 'recv' | 'pay' | '', byDue (age from the due date), limits, cdays: { partyKey: days } (party credit days for bills
     without a due date), min (smallest amount left) } -> { rows: [{ party, pkey, no, date, due, total, settled, left, days, overdue, b }], tot, buckets } */
  function outstanding(docs, biz, asOn, opt) {
    opt = opt || {};
    var D = (docs || []).filter(function (d) { return !d.date || d.date <= asOn; }), lim = ageLimits(opt.limits), cd = opt.cdays || {};
    var R = B.bills(D, biz), rows = [];
    R.bills.forEach(function (b) {
      if (opt.side && b.side !== opt.side) return;
      if (opt.min && b.left < num(opt.min)) return;
      var pk = key(b.party), due = b.due || (num(cd[pk]) ? B.addDays(b.date, num(cd[pk])) : '');
      var age = B.daysBetween(opt.byDue && due ? due : b.date, asOn), over = due ? Math.max(0, B.daysBetween(due, asOn)) : Math.max(0, B.daysBetween(b.date, asOn));
      rows.push({ party: b.party, pkey: pk, id: String(b.id).split('#')[0], no: b.no, date: b.date, due: due, side: b.side, type: b.type, kind: b.kind, total: b.total, settled: r2(b.total - b.left), left: b.left, days: age, overdue: due && due >= asOn ? 0 : over, b: bucket(Math.max(0, age), lim) });
    });
    rows.sort(function (a, b) { return b.overdue - a.overdue || b.left - a.left; });
    var buckets = lim.map(function () { return 0; }).concat([0]), tot = 0;
    rows.forEach(function (r) { buckets[r.b] = r2(buckets[r.b] + r.left); tot = r2(tot + r.left); });
    return { rows: rows, tot: tot, buckets: buckets, names: bucketNames(lim), limits: lim };
  }

  /* ---------- things to check ----------
     opt: { from, to, today, parties: [party master records], days (overdue limit, default 90), banks: [bank account keys], odBanks: { key: 1 } }
     -> [{ id, n, items: [{ text, date, id, href }] }] (only the checks with something to show) */
  function exceptions(docs, biz, opt) {
    opt = opt || {};
    var today = opt.today, from = opt.from || '', to = opt.to || today, out = [];
    var L = B.inBooks(docs, biz);
    function add(id, items) { if (items.length) out.push({ id: id, n: items.length, items: items }); }
    /* 1. cash in hand below zero on any day: the first voucher that took it below */
    function negDays(acct) {
      var bal = 0, low = [], was = false;
      L.slice().sort(function (x, y) { return (x.date || '').localeCompare(y.date || ''); }).forEach(function (d) {
        var v = 0; B.postings(d).forEach(function (l) { if (l.a === acct) v += l.dr - l.cr; });
        if (!v) return; bal = r2(bal + v);
        if (bal < -0.004 && !was && (!to || d.date <= to)) low.push({ date: d.date, id: d.id, no: d.no || '', bal: bal });
        was = bal < -0.004;
      });
      return low;
    }
    add('negcash', negDays('cash').map(function (x) { return { text: x.no, date: x.date, id: x.id, amt: x.bal, acct: 'cash' }; }));
    var nb = [];
    (opt.banks || ['bank']).forEach(function (k) { if ((opt.odBanks || {})[k]) return; negDays(k).forEach(function (x) { nb.push({ text: x.no, date: x.date, id: x.id, amt: x.bal, acct: k }); }); });
    add('negbank', nb);
    /* 2. bills overdue beyond the limit */
    var lim = num(opt.days) || 90, O = outstanding(docs, biz, today, { side: 'recv' });
    add('overdue', O.rows.filter(function (r) { return r.overdue > lim; }).map(function (r) { return { text: r.party + ' ' + r.no, date: r.date, id: r.id, amt: r.left, days: r.overdue, pkey: r.pkey }; }));
    /* 3. money received and not set against any bill for over 30 days (advances) */
    var R = B.bills(docs, biz), adv = [];
    Object.keys(R.advances).forEach(function (p) { ['recv', 'pay'].forEach(function (s) { if (R.advances[p][s] > 0.004) adv.push({ text: p, side: s, amt: R.advances[p][s], pkey: p }); }); });
    add('advance', adv);
    /* 4. the same number twice in one series (type and financial year) */
    var seen = {}, dup = [];
    (docs || []).forEach(function (d) {
      if (!d || !d.no || d.deleted || biz && key(d.seller && d.seller.name) !== key(biz)) return;
      if (!/^(invoice|cashmemo|note|receipt|voucher|self|expinv|quote|so|challan|po|proforma)$/.test(d.type || 'invoice')) return;
      var fy = d.date ? (+d.date.slice(5, 7) >= 4 ? d.date.slice(0, 4) : String(+d.date.slice(0, 4) - 1)) : '', k = (d.type || 'invoice') + '|' + (d.kind || '') + '|' + fy + '|' + key(d.no);
      if (seen[k]) dup.push({ text: d.no, date: d.date, id: d.id, other: seen[k] }); else seen[k] = d.id;
    });
    add('dupno', dup);
    /* 5. entries dated after today */
    add('future', L.filter(function (d) { return d.date && today && d.date > today; }).map(function (d) { return { text: d.no || '', date: d.date, id: d.id }; }));
    /* 6. customers over their credit limit */
    var P = B.parties(docs, biz), over = [];
    (opt.parties || []).forEach(function (p) { var k = key(p.name), lim2 = num(p.climit), bal = P[k] ? P[k].bal : 0; if (lim2 > 0 && bal > lim2 + 0.004) over.push({ text: p.name, amt: bal, limit: lim2, pkey: k }); });
    add('climit', over);
    /* 7. cheques: post-dated ones due in the next 7 days, and bounced ones */
    var wk = today ? B.addDays(today, 7) : '', pdc = [], bnc = [];
    (docs || []).forEach(function (d) {
      if (!d || d.mode !== 'cheque' || !(d.type === 'receipt' || d.type === 'voucher') || biz && key(d.seller && d.seller.name) !== key(biz)) return;
      var c = d.chq || {}; if (c.st === 'bounce') { bnc.push({ text: (d.ref || d.no || '') + ' ' + B.partyName(d), date: c.on || d.date, id: d.id }); return; }
      var cd = c.date || d.date; if (c.st && c.st !== 'ok' && cd && today && cd >= today && cd <= wk) pdc.push({ text: (d.ref || d.no || '') + ' ' + B.partyName(d), date: cd, id: d.id });
    });
    add('pdc', pdc); add('bounced', bnc);
    /* 8. bills of unregistered buyers of Rs 50,000 or more with no name or address (Rule 46) */
    add('b2c', L.filter(function (d) { return B.role(d) === 'sale' && (!from || d.date >= from) && (!to || d.date <= to) && !(d.buyer && d.buyer.gstin) && num(d.total) >= 50000 && !(d.buyer && String(d.buyer.name || '').trim() && String(d.buyer.addr || d.buyer.address || '').trim()); })
      .map(function (d) { return { text: d.no || '', date: d.date, id: d.id, amt: num(d.total) }; }));
    return out;
  }

  var API = { opp: opp, narr: narr, months: months, monthly: monthly, monthEnd: monthEnd, regRow: regRow, regTotals: regTotals, rateCols: rateCols, ageLimits: ageLimits, bucket: bucket, bucketNames: bucketNames, outstanding: outstanding, exceptions: exceptions };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSRep = API;
})(this);
