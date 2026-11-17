/* NS trustcore (India plan D, 2026-11-17): donations, member subscriptions and the donor register for trusts, NGOs, gurdwaras, temples, mosques,
   churches, societies and clubs. PURE functions (no screen, no storage); tests: node scripts/test_trust.js.
   Data (all in the shared data home):
     setup    meta 'trust:<business key>': { name, pan, addr, reg80g, from, to, reg12a, prefix, funds [names], plans [{id, name, amt, freq 'month'|'year'|'once'}] }
              (the 80G number and its dates are typed by the trust from its own approval order; nothing here looks them up)
     member   a 'party' record with member:1 { mplan (plan id), since 'YYYY-MM-DD', phone, addr, pan, left 'YYYY-MM-DD' optional, bizKey }
     receipt  a 'doc' record, type 'don': { no, date, seller:{name,...}, buyer:{name, phone, addr, pan}, kind 'don'|'sub', head, amount, total, mode, ref,
              fund, purpose, memberId, periods ['2026-11', ...] or ['2026-27'] or ['once'], notes, narr }
              books.js reads it like other income received: Dr cash/bank, Cr income head (so Income and Expenditure / Receipts and Payments count it).
   What the official text says (incometax.gov.in 80G FAQ, read 2026-11-17): the donor needs the donee's name, PAN, address, the 80G registration number
   and the amount; Form 10BE (Rule 18AB) carries the donee's name, address, PAN and the Unique Registration Number; no 80G deduction for a cash donation above
   Rs 2,000 (section 80G(5D)); Form 10BD lists each donor's PAN or Aadhaar, name, address and amount. The percentage of deduction, limits, the validity
   period and which donees must file 10BD / issue 10BE are NOT handled here: the trust's own CA decides. */
(function (G) {
  'use strict';
  function num(v) { v = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(v) ? v : 0; }
  function r2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var CASH_LIMIT = 2000;   /* section 80G(5D), as the Income Tax Department's 80G FAQ states it */
  var FREQ = ['month', 'year', 'once'];
  var HEAD = { don: 'Donations received', sub: 'Membership subscriptions' };

  function defaults() {
    return { name: '', pan: '', addr: '', reg80g: '', from: '', to: '', reg12a: '', prefix: 'DON', funds: ['General fund', 'Corpus fund', 'Building fund'], plans: [] };
  }
  /* '2026-27' for a date; start and end of a financial year */
  function fyOf(date) { var y = +String(date).slice(0, 4), m = +String(date).slice(5, 7); if (m < 4) y--; return y + '-' + pad((y + 1) % 100); }
  function fyRange(fy) { var y = +String(fy).slice(0, 4); return [y + '-04-01', (y + 1) + '-03-31']; }
  function ym(d) { return String(d || '').slice(0, 7); }
  function addMonth(m, n) { var y = +m.slice(0, 4), k = +m.slice(5, 7) - 1 + n; y += Math.floor(k / 12); k = ((k % 12) + 12) % 12; return y + '-' + pad(k + 1); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function periodName(p) { return /^\d{4}-\d{2}$/.test(p) && +p.slice(5) <= 12 && p.length === 7 && +p.slice(5) >= 1 ? MON[+p.slice(5) - 1] + ' ' + p.slice(0, 4) : p === 'once' ? 'One time' : p; }

  /* ---------- receipts ---------- */
  function mine(docs, biz) { var b = key(biz); return (docs || []).filter(function (d) { return d.type === 'don' && key(d.seller && d.seller.name) === b; }); }
  /* next number: PREFIX/26-27/001 (the highest number of that financial year + 1) */
  function nextNo(docs, biz, prefix, date) {
    var fy = fyOf(date), short = fy.slice(2, 4) + '-' + fy.slice(5), pre = (String(prefix || 'DON').trim().replace(/[^A-Za-z0-9\/\-]/g, '')), head = (pre ? pre + '/' : '') + short + '/', mx = 0;
    mine(docs, biz).forEach(function (d) { var n = String(d.no || ''); if (n.indexOf(head) === 0) { var v = parseInt(n.slice(head.length), 10); if (v > mx) mx = v; } });
    return head + String(mx + 1).padStart(3, '0');
  }
  function amountOf(d) { return r2(num(d.amount)); }
  /* a cash gift above the limit: shown on the receipt so the donor is not surprised (the rule is the donor's deduction, not the receipt) */
  function cashOver(d) { return d.mode === 'cash' && amountOf(d) > CASH_LIMIT && d.kind !== 'sub'; }
  /* in an inclusive date range */
  function between(docs, biz, from, to) { return mine(docs, biz).filter(function (d) { return (!from || d.date >= from) && (!to || d.date <= to); }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.no).localeCompare(String(b.no)); }); }
  /* totals by fund and by kind, and by mode */
  function summary(docs, biz, from, to) {
    var L = between(docs, biz, from, to), fund = {}, mode = {}, tot = 0, don = 0, sub = 0;
    L.forEach(function (d) {
      var a = amountOf(d), f = String(d.fund || '').trim() || '—'; tot = r2(tot + a);
      if (d.kind === 'sub') sub = r2(sub + a); else don = r2(don + a);
      var o = fund[f] || (fund[f] = { fund: f, n: 0, don: 0, sub: 0, total: 0 }); o.n++; o[d.kind === 'sub' ? 'sub' : 'don'] = r2(o[d.kind === 'sub' ? 'sub' : 'don'] + a); o.total = r2(o.total + a);
      mode[d.mode || 'cash'] = r2((mode[d.mode || 'cash'] || 0) + a);
    });
    return { n: L.length, total: tot, don: don, sub: sub, funds: Object.keys(fund).sort(function (a, b) { return fund[b].total - fund[a].total; }).map(function (k) { return fund[k]; }), modes: mode, list: L };
  }

  /* ---------- donor register ---------- */
  function donorKey(d) { var b = d.buyer || {}, p = String(b.pan || '').trim().toUpperCase(); return p ? 'pan:' + p : 'n:' + key(b.name); }
  /* one row per donor (PAN when given, else name): gifts of the kind 'don' only unless withSubs */
  function donors(docs, biz, from, to, withSubs) {
    var by = {};
    between(docs, biz, from, to).forEach(function (d) {
      if (d.kind === 'sub' && !withSubs) return;
      var k = donorKey(d), b = d.buyer || {}, o = by[k] || (by[k] = { k: k, name: b.name || '', pan: String(b.pan || '').trim().toUpperCase(), addr: b.addr || '', phone: b.phone || '', n: 0, total: 0, first: d.date, last: d.date, cashOver: 0 });
      o.n++; o.total = r2(o.total + amountOf(d)); if (d.date < o.first) o.first = d.date; if (d.date >= o.last) { o.last = d.date; if (b.addr) o.addr = b.addr; if (b.phone) o.phone = b.phone; }
      if (!o.pan && b.pan) o.pan = String(b.pan).trim().toUpperCase();
      if (cashOver(d)) o.cashOver = r2(o.cashOver + amountOf(d));
    });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.total - a.total || a.name.localeCompare(b.name); });
  }
  /* PAN format: five letters, four digits, one letter (format only; nothing is looked up) */
  function panOk(p) { return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(p || '').trim().toUpperCase()); }
  /* the receipts of one donor in a range, for the yearly statement */
  function statement(docs, biz, dk, from, to, withSubs) {
    var L = between(docs, biz, from, to).filter(function (d) { return donorKey(d) === dk && (withSubs || d.kind !== 'sub'); });
    return { list: L, total: r2(L.reduce(function (s, d) { return s + amountOf(d); }, 0)) };
  }

  /* ---------- members and subscriptions ---------- */
  function planOf(setup, id) { return ((setup && setup.plans) || []).filter(function (p) { return p.id === id; })[0] || null; }
  /* the periods a plan has charged from `since` to `asOf` (inclusive), as period ids */
  function periodsFor(plan, since, asOf, left) {
    if (!plan || !since) return [];
    var end = left && left < asOf ? left : asOf, out = [], i;
    if (plan.freq === 'once') return since <= asOf ? ['once'] : [];
    if (plan.freq === 'year') { var f = fyOf(since), l = fyOf(end); for (i = +f.slice(0, 4); i <= +l.slice(0, 4); i++) out.push(i + '-' + pad((i + 1) % 100)); return since <= end ? out : []; }
    var m = ym(since), e = ym(end); while (m <= e && out.length < 600) { out.push(m); m = addMonth(m, 1); }
    return out;
  }
  /* what each member owes: periods charged, money received against each (a receipt's amount is shared over the periods it names) */
  function memberLedger(setup, member, docs, biz, asOf) {
    var plan = planOf(setup, member.mplan), per = periodsFor(plan, member.since, asOf, member.left), paid = {}, rcpt = {};
    mine(docs, biz).filter(function (d) { return d.kind === 'sub' && d.memberId === member.id && (d.periods || []).length; }).forEach(function (d) {
      var share = amountOf(d) / d.periods.length;
      d.periods.forEach(function (p) { paid[p] = r2((paid[p] || 0) + share); (rcpt[p] = rcpt[p] || []).push(d.no); });
    });
    var amt = plan ? num(plan.amt) : 0, rows = per.map(function (p) { var got = r2(paid[p] || 0), left = Math.max(0, r2(amt - got)); return { p: p, amt: amt, paid: got, left: left, state: left <= 0.004 ? 'paid' : got > 0 ? 'part' : 'due', rcpt: rcpt[p] || [] }; });
    var due = r2(rows.reduce(function (s, r) { return s + r.left; }, 0)), rec = r2(rows.reduce(function (s, r) { return s + Math.min(r.paid, r.amt); }, 0));
    var advance = r2(Object.keys(paid).filter(function (p) { return per.indexOf(p) < 0; }).reduce(function (s, p) { return s + paid[p]; }, 0));
    return { plan: plan, rows: rows, due: due, received: rec, unpaid: rows.filter(function (r) { return r.left > 0.004; }).length, advance: advance };
  }
  /* all members: one row each, with dues; filter 'due' keeps those who owe */
  function members(setup, list, docs, biz, asOf) {
    return (list || []).map(function (m) { var L = memberLedger(setup, m, docs, biz, asOf); return { m: m, plan: L.plan, due: L.due, unpaid: L.unpaid, received: L.received, advance: L.advance, ledger: L }; })
      .sort(function (a, b) { return b.due - a.due || String(a.m.name).localeCompare(String(b.m.name)); });
  }
  function memberTotals(rows) { return { n: rows.length, due: r2(rows.reduce(function (s, r) { return s + r.due; }, 0)), owing: rows.filter(function (r) { return r.due > 0.004; }).length, received: r2(rows.reduce(function (s, r) { return s + r.received; }, 0)) }; }

  /* ---------- text and files ---------- */
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v) && isNaN(+v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCsv(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }
  function reminderText(trust, row, asOf) {
    var m = row.m, n = row.unpaid, p = row.plan ? row.plan.name : '';
    return 'Namaste ' + (m.name || '') + ', this is a gentle reminder from ' + (trust.name || 'our trust') + ': your ' + p + ' has ' + n + ' period' + (n === 1 ? '' : 's') + ' pending, Rs ' + row.due.toFixed(2).replace(/\.00$/, '') + ' in all. Thank you for your support.';
  }
  function thanksText(trust, d) {
    return 'Thank you ' + (d.buyer && d.buyer.name || '') + ' for your ' + (d.kind === 'sub' ? 'subscription' : 'donation') + ' of Rs ' + amountOf(d).toFixed(2).replace(/\.00$/, '') + ' to ' + (trust.name || 'us') + '. Receipt no. ' + d.no + ' dated ' + d.date + '.';
  }

  var API = { num: num, r2: r2, key: key, CASH_LIMIT: CASH_LIMIT, FREQ: FREQ, HEAD: HEAD, defaults: defaults, fyOf: fyOf, fyRange: fyRange, addMonth: addMonth, periodName: periodName, mine: mine, nextNo: nextNo, cashOver: cashOver,
    between: between, summary: summary, donorKey: donorKey, donors: donors, panOk: panOk, statement: statement, planOf: planOf, periodsFor: periodsFor, memberLedger: memberLedger, members: members, memberTotals: memberTotals,
    toCsv: toCsv, reminderText: reminderText, thanksText: thanksText };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSTrust = API;
})(this);
