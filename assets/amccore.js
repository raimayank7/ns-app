/* NSAmc: the pure logic of amc.niveshsahayak.in (annual maintenance contracts and subscriptions that repeat).
   A contract is a saved document of type 'amc' (it is NOT a sale and not in the books). It fixes a start date, a term in months, how often
   it is billed (monthly, quarterly, half-yearly, yearly), the taxable amount of each period, GST, whether each period is billed in advance
   (on its first day) or in arrears (on its last day), and how many service visits a year. Each period becomes ONE ordinary invoice
   (type 'invoice', amcOf = the contract id, amcFor = the period number) that the person makes with a tap, so it reaches dues, GST and
   reports in the App like any bill; nothing is made by itself. Visits done are kept on the contract (visitsDone). Renewals are new
   contracts that start the day after the old one ends (renewOf).
   No server: the lists are worked out when the page opens. Tests: node scripts/test_amc.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function pad(x) { return String(x).padStart(2, '0'); }
  function parse(s) { var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(s, k) { var d = parse(s); if (!d) return ''; d.setDate(d.getDate() + k); return iso(d); }
  function addMonths(s, k) {
    var p = String(s || '').split('-'); if (p.length !== 3) return '';
    var y = +p[0], m = +p[1] - 1 + k, day = +p[2]; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + pad(m + 1) + '-' + pad(Math.min(day, new Date(y, m + 1, 0).getDate()));
  }
  function days(a, b) { var x = parse(a), y = parse(b); return x && y ? Math.round((y - x) / 864e5) : 0; }   /* b - a */
  var STEP = { month: 1, quarter: 3, half: 6, year: 12 };
  function step(c) { return STEP[c.freq] || 1; }
  function term(c) { var t = Math.round(n(c.termMonths)); return t > 0 ? t : 12; }
  function isAmc(d, who) { return d && d.type === 'amc' && (!who || key(d.seller && d.seller.name) === key(who)); }
  function mine(docs, who) { return (docs || []).filter(function (d) { return isAmc(d, who); }); }
  function active(c) { return c.status !== 'cancelled'; }

  /* the last day of the contract: start + term months - 1 day */
  /* GST % charged: only on a GST (tax invoice) contract */
  function gstOf(c) { return c.kind && c.kind !== 'tax' ? 0 : n(c.gst); }
  function endOf(c) { return c.start ? addDays(addMonths(c.start, term(c)), -1) : ''; }
  /* the terms must fit whole billing periods (12 months monthly, quarterly, ... ; 18 months half-yearly, not yearly) */
  function fits(c) { return term(c) % step(c) === 0; }
  /* every billing period: number k (1...), first and last day, the date it is billed, the taxable amount, GST and the invoice total */
  function periods(c) {
    if (!c.start || !fits(c)) return [];
    var st = step(c), cnt = term(c) / st, out = [], base = n(c.amount), g = gstOf(c);
    for (var k = 1; k <= cnt; k++) {
      var a = addMonths(c.start, (k - 1) * st), b = addDays(addMonths(c.start, k * st), -1), tax = r2(base * g / 100);
      out.push({ k: k, from: a, to: b, bill: c.billWhen === 'arrears' ? b : a, taxable: r2(base), tax: tax, total: r2(base + tax) });
    }
    return out;
  }
  function value(c) { var p = periods(c); return r2(p.reduce(function (s, x) { return s + x.total; }, 0)); }

  /* which periods of which contracts have an invoice (made from the contract): { <contract id>: { <period k>: invoice } } */
  function invoiced(docs) {
    var m = {};
    (docs || []).forEach(function (d) { if (d && d.amcOf && d.amcFor != null && (d.type || 'invoice') === 'invoice') (m[d.amcOf] = m[d.amcOf] || {})[d.amcFor] = d; });
    return m;
  }
  /* periods the person billed before using the tool are typed as billed0 (a count from period 1): they are never offered again */
  function isBilled(c, have, k) { return k <= Math.round(n(c.billed0)) || !!(have[c.id] && have[c.id][k]); }
  /* invoices that can be made now: billing date today or earlier (or within `ahead` days, default 0), not made yet; oldest first */
  function invoicesDue(docs, today, who, ahead) {
    var have = invoiced(docs), lim = addDays(today, ahead || 0), out = [];
    mine(docs, who).forEach(function (c) {
      if (!active(c) || !c.id) return;
      periods(c).forEach(function (p) { if (p.bill <= lim && !isBilled(c, have, p.k)) out.push({ c: c, p: p, late: Math.max(0, days(p.bill, today)) }); });
    });
    return out.sort(function (a, b) { return a.p.bill.localeCompare(b.p.bill) || a.c.no.localeCompare(b.c.no); });
  }
  /* the invoice record of one period, ready for NSStore.put('doc', ...): one service line, GST as on the contract, due after `days` */
  function makeInvoice(c, p, today, no) {
    var d = String(c.title || 'Maintenance contract').trim(), when = p.from + ' to ' + p.to, cd = Math.round(n(c.credit));
    return { type: 'invoice', kind: c.kind || 'tax', no: no || '', deliv: '', orig: { no: '', date: '' }, reason: 'ret', tr: { veh: '', tname: '', lr: '' },
      paper: c.paper || 'a4', design: c.design || 'classic', copies: 1, date: today, due: cd > 0 ? addDays(today, cd) : '', pos: '', rc: false, recv: '', ref: 'AMC ' + (c.no || ''),
      seller: JSON.parse(JSON.stringify(c.seller || {})), buyer: JSON.parse(JSON.stringify(c.buyer || {})), ship: null, einv: null, irn: null,
      items: [{ desc: d + ' (' + when + ')', hsn: c.sac || '9987', qty: 1, unit: 'Nos', rate: r2(n(c.amount)), disc: '', gst: gstOf(c) }],
      round: true, comp: true, notes: 'Contract ' + (c.no || '') + (c.site ? ' · ' + c.site : '') + ' · period ' + p.k + ' of ' + periods(c).length, terms: c.billTerms || '', accent: c.accent || '#0B3B5B',
      status: 'unpaid', copyLabel: '', withGst: (c.kind || 'tax') === 'tax', valid: '', charges: [], tcs: { on: false, rate: '', base: 'total', sec: '' }, rec: null,
      amcOf: c.id, amcFor: p.k, amcNo: c.no || '', total: Math.round(p.taxable + p.tax) };   /* the invoice maker rounds the grand total to the rupee */
  }

  /* contracts to renew: active ones ending within `within` days (default 60), or ended up to 30 days ago, with no renewal made yet */
  function renewalsDue(docs, today, who, within) {
    var w = within != null ? within : 60, out = [], renewed = {};
    (docs || []).forEach(function (d) { if (d && d.type === 'amc' && d.renewOf) renewed[d.renewOf] = 1; });
    mine(docs, who).forEach(function (c) {
      if (!active(c) || !c.id || renewed[c.id]) return;
      var e = endOf(c); if (!e) return;
      var left = days(today, e);
      if (left <= w && left >= -30) out.push({ c: c, end: e, left: left });
    });
    return out.sort(function (a, b) { return a.left - b.left; });
  }
  /* the next contract: starts the day after this one ends, same terms, amount raised by `pct` percent (rounded to the rupee), no visits done */
  function renew(c, pct) {
    var r = JSON.parse(JSON.stringify(c)), e = endOf(c);
    ['id', 'created', 'updated', 'no', 'total'].forEach(function (k) { delete r[k]; });
    r.start = addDays(e, 1); r.date = r.start; r.visitsDone = []; r.status = 'active'; r.renewOf = c.id;
    var up = n(pct); if (up) r.amount = Math.round(n(c.amount) * (1 + up / 100));
    return r;
  }

  /* service visits: `visits` a year spread evenly (at the middle of each equal part of the term); the visits already logged count from the first */
  function visitPlan(c) {
    var v = Math.round(n(c.visits)), tm = term(c); if (!c.start || v <= 0) return [];
    var cnt = Math.max(1, Math.round(v * tm / 12)), total = days(c.start, addDays(addMonths(c.start, tm), -1)) + 1, out = [], done = (c.visitsDone || []).length;
    for (var i = 0; i < cnt; i++) out.push({ i: i + 1, date: addDays(c.start, Math.round(total * (i + 0.5) / cnt)), done: i < done });
    return out;
  }
  /* visits to do: for each contract the first visit not yet logged, when its planned date is within `ahead` days (default 7) or past; `behind` = planned visits whose date has passed and are not logged; oldest first */
  function visitsDue(docs, today, who, ahead) {
    var lim = addDays(today, ahead != null ? ahead : 7), out = [];
    mine(docs, who).forEach(function (c) {
      if (!active(c)) return;
      var open = visitPlan(c).filter(function (x) { return !x.done; }), first = open[0];
      if (first && first.date <= lim && first.date <= endOf(c)) out.push({ c: c, v: first, late: Math.max(0, days(first.date, today)), behind: open.filter(function (x) { return x.date <= today; }).length });
    });
    return out.sort(function (a, b) { return a.v.date.localeCompare(b.v.date) || a.c.no.localeCompare(b.c.no); });
  }
  /* unpaid invoices made from contracts (payments recorded in the App mark an invoice paid): [{ c, d, over }], oldest first; over = days past due */
  function unpaid(docs, who, today) {
    var by = {}; mine(docs, who).forEach(function (c) { by[c.id] = c; });
    return (docs || []).filter(function (d) { return d && d.amcOf && by[d.amcOf] && d.status !== 'paid' && (d.type || 'invoice') === 'invoice'; })
      .map(function (d) { return { c: by[d.amcOf], d: d, over: d.due ? Math.max(0, days(d.due, today)) : 0 }; }).sort(function (a, b) { return String(a.d.date).localeCompare(String(b.d.date)); });
  }
  /* one line for the contract list: periods billed, next billing date, end date, visits done / planned, state: 'active' | 'ended' | 'cancelled' | 'renewed' */
  function summary(c, docs, today) {
    var p = periods(c), all = invoiced(docs), billed = p.filter(function (x) { return isBilled(c, all, x.k); }).length;
    var next = p.filter(function (x) { return !isBilled(c, all, x.k); })[0], e = endOf(c), renewed = (docs || []).some(function (d) { return d && d.type === 'amc' && d.renewOf === c.id; });
    var st = c.status === 'cancelled' ? 'cancelled' : renewed ? 'renewed' : e && e < today ? 'ended' : 'active';
    return { periods: p.length, billed: billed, nextBill: next ? next.bill : '', end: e, visits: (c.visitsDone || []).length, plan: visitPlan(c).length, state: st, value: value(c) };
  }
  /* WhatsApp texts (English; edited in WhatsApp before sending) */
  function renewText(r, shop, fmt) {
    var c = r.c, f = fmt || function (x) { return x; };
    return 'Hello ' + (c.buyer && c.buyer.name || '') + ', your ' + (c.title || 'maintenance contract') + ' (contract ' + (c.no || '') + ') ' + (r.left >= 0 ? 'ends on ' + f(r.end) : 'ended on ' + f(r.end)) + '. Shall we renew it? ' + (shop || '');
  }
  function dueText(u, shop, fmt) {
    var f = fmt || function (x) { return x; }, d = u.d;
    return 'Hello ' + (d.buyer && d.buyer.name || '') + ', invoice ' + d.no + ' dated ' + f(d.date) + ' for ' + (u.c.title || 'your maintenance contract') + ' (Rs ' + r2(n(d.total)).toLocaleString('en-IN') + ')' + (u.over ? ' is overdue by ' + u.over + ' days' : ' is due' + (d.due ? ' on ' + f(d.due) : '')) + '. Kindly pay. ' + (shop || '');
  }
  function visitText(x, shop, fmt) {
    var f = fmt || function (y) { return y; }, c = x.c;
    return 'Hello ' + (c.buyer && c.buyer.name || '') + ', your ' + (c.title || 'maintenance') + ' service visit ' + x.v.i + ' (contract ' + (c.no || '') + ') is due around ' + f(x.v.date) + '. When is a good day to visit? ' + (shop || '');
  }
  function phone10(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; }
  function wa(phone, text) { var p = phone10(phone); return 'https://wa.me/' + (p ? '91' + p : '') + '?text=' + encodeURIComponent(text); }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\r\n'); }
  function contractRows(docs, who, today) {
    return [['Contract', 'Customer', 'Phone', 'Service', 'Site', 'Start', 'End', 'Billed every', 'Per period (taxable)', 'GST %', 'Contract value', 'Periods billed', 'Visits done', 'Visits planned', 'State']].concat(mine(docs, who).sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); }).map(function (c) {
      var s = summary(c, docs, today);
      return [c.no, c.buyer && c.buyer.name, c.buyer && c.buyer.phone, c.title, c.site, c.start, s.end, c.freq, n(c.amount), n(c.gst), s.value, s.billed + '/' + s.periods, s.visits, s.plan, s.state];
    }));
  }
  function scheduleRows(c, docs) {
    var have = invoiced(docs)[c.id] || {};
    return [['Period', 'From', 'To', 'Bill on', 'Taxable', 'GST', 'Total', 'Invoice']].concat(periods(c).map(function (p) { return [p.k, p.from, p.to, p.bill, p.taxable, p.tax, p.total, have[p.k] ? have[p.k].no : p.k <= Math.round(n(c.billed0)) ? 'before' : '']; }));
  }

  var API = { gstOf: gstOf, key: key, STEP: STEP, endOf: endOf, fits: fits, periods: periods, value: value, invoiced: invoiced, invoicesDue: invoicesDue, makeInvoice: makeInvoice, renewalsDue: renewalsDue, renew: renew,
    visitPlan: visitPlan, visitsDue: visitsDue, unpaid: unpaid, summary: summary, renewText: renewText, dueText: dueText, visitText: visitText, wa: wa, csv: csv, contractRows: contractRows, scheduleRows: scheduleRows,
    addDays: addDays, addMonths: addMonths, days: days, term: term, mine: mine };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSAmc = API;
})(this);
