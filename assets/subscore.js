/* NSSubs: the pure logic of subscribers.niveshsahayak.in (cable TV, internet, tiffin, water-can and other monthly subscribers).
   A subscriber is a saved document of type 'subs' (NOT a sale, not in the books): who, which plan, the monthly amount (before GST), the day the bill is dated,
   a discount, when the connection started and stopped, and pauses (holidays, tiffin off, connection suspended). Each month becomes ONE ordinary
   invoice (type 'invoice') made with a tap, never by itself, so it reaches dues, ageing, GST and reports in NSBiz like any bill.
   The invoice carries the markers of the repeating-bill engine (recOf = the subscriber, recFor = 'yyyy-mm') and subOf / subFor of its own.
   Amount of a month = monthly amount x (days the service ran / days in the month), then the discount, rounded to paise.
     days the service ran = days from the start date to the stop date (both included), less the days inside a pause;
     first month (part month)  'prorata' = only the days from the start date, 'full' = the whole month, 'free' = no bill that month;
     last month (stop inside it) 'prorata' = only the days up to the stop date, 'full' = the whole month. A pause always takes its days off.
     discount: a percentage of the amount, or a fixed amount which is cut in the same proportion as the days.
   This is the usual way of billing a part month, not a rule of law: the user chooses the policy and the invoice names the days.
   No server: the lists are worked out when the page opens. Tests: node scripts/test_subs.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function isYm(s) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(s || ''); }
  function dim(ym) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); }
  function addMonth(ym, k) { var i = +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1) + k; return Math.floor(i / 12) + '-' + pad(i % 12 + 1); }
  function addDays(s, k) { var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + k); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function days(a, b) { var x = a.split('-'), y = b.split('-'); return Math.round((new Date(+y[0], +y[1] - 1, +y[2]) - new Date(+x[0], +x[1] - 1, +x[2])) / 864e5); }
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function label(ym) { return isYm(ym) ? MN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) : ''; }
  function isSub(d, who) { return d && d.type === 'subs' && (!who || key(d.seller && d.seller.name) === key(who)); }
  function mine(docs, who) { return (docs || []).filter(function (d) { return isSub(d, who); }); }
  function gstOf(s) { return s.kind === 'tax' ? n(s.gst) : 0; }

  /* the first and last day of a month */
  function span(ym) { return { from: ym + '-01', to: ym + '-' + pad(dim(ym)) }; }
  /* how many days of this month the pauses take away from the days in [a, b] */
  function heldDays(s, a, b) {
    var cnt = 0;
    for (var d = a, i = 0; d <= b && i < 40; d = addDays(d, 1), i++) {
      if ((s.holds || []).some(function (h) { return isDate(h.from) && isDate(h.to) && h.from <= d && d <= h.to; })) cnt++;
    }
    return cnt;
  }
  /* what one month of one subscriber comes to: { ym, days (billed), dim, full:bool, base (amount for those days), disc, taxable, tax, total, skip:'' | 'before' | 'after' | 'free' | 'nothing' } */
  function month(s, ym) {
    var sp = span(ym), D = dim(ym), o = { ym: ym, dim: D, days: 0, held: 0, full: false, base: 0, disc: 0, taxable: 0, tax: 0, total: 0, skip: '', part: '' };
    if (!isDate(s.start)) { o.skip = 'nostart'; return o; }
    if (s.start > sp.to) { o.skip = 'before'; return o; }
    if (isDate(s.stop) && s.stop < sp.from) { o.skip = 'after'; return o; }
    var a = sp.from, b = sp.to, first = s.start > sp.from, last = isDate(s.stop) && s.stop < sp.to;
    if (first && (s.firstMonth || 'prorata') === 'free') { o.skip = 'free'; return o; }
    if (first && (s.firstMonth || 'prorata') !== 'full') a = s.start;
    if (last && (s.lastMonth || 'prorata') !== 'full') b = s.stop;
    o.held = heldDays(s, a, b);
    o.days = Math.max(0, days(a, b) + 1 - o.held);
    o.full = o.days === D;
    o.part = first ? 'start' : last ? 'stop' : o.held ? 'pause' : '';
    var frac = o.days / D, amt = n(s.amount);
    o.base = r2(amt * frac);
    var dv = n(s.disc), cut = s.discType === 'pct' ? o.base * Math.min(100, Math.max(0, dv)) / 100 : Math.max(0, dv) * frac;
    o.disc = r2(Math.min(o.base, cut));
    o.taxable = r2(o.base - o.disc); o.tax = r2(o.taxable * gstOf(s) / 100); o.total = Math.round(o.taxable + o.tax);   /* the invoice maker rounds the grand total to the rupee */
    if (!(o.taxable > 0)) o.skip = 'nothing';
    return o;
  }
  /* the date a month's bill is dated: the bill day (1-28, default 1) of that month */
  function billDate(s, ym) { var d = Math.min(Math.max(1, Math.round(n(s.billDay)) || 1), dim(ym)); return ym + '-' + pad(d); }
  function startMonth(s) {
    var m = isYm(s.billFrom) ? s.billFrom : isDate(s.start) ? s.start.slice(0, 7) : '';
    return isDate(s.start) && s.start.slice(0, 7) > m ? s.start.slice(0, 7) : m;
  }

  /* invoices already made: { <subscriber id>: { <yyyy-mm>: invoice } } */
  function invoiced(docs) {
    var m = {};
    (docs || []).forEach(function (d) { if (d && d.subOf && d.subFor && (d.type || 'invoice') === 'invoice') (m[d.subOf] = m[d.subOf] || {})[d.subFor] = d; });
    return m;
  }
  /* bills that can be made now: bill date today or earlier (or within `ahead` days), month not billed yet, something to charge. At most `back` months (default 12) back from today, oldest first */
  function billsDue(docs, today, who, ahead, back) {
    var have = invoiced(docs), lim = addDays(today, ahead || 0), out = [], cur = today.slice(0, 7), oldest = addMonth(cur, -(back || 12));
    mine(docs, who).forEach(function (s) {
      var st = startMonth(s); if (!s.id || !st || s.status === 'cancelled') return;
      for (var m = st < oldest ? oldest : st, i = 0; m <= addMonth(cur, 1) && i < 40; m = addMonth(m, 1), i++) {
        var bd = billDate(s, m); if (bd > lim) break;
        if (have[s.id] && have[s.id][m]) continue;
        var o = month(s, m); if (o.skip) continue;
        out.push({ s: s, ym: m, bill: bd, o: o, late: Math.max(0, days(bd, today)) });
      }
    });
    return out.sort(function (a, b) { return a.bill.localeCompare(b.bill) || String(a.s.no).localeCompare(String(b.s.no)); });
  }
  /* the invoice record of one month, ready for NSStore.put('doc', ...) */
  function makeInvoice(s, x, today, no) {
    var o = x.o, plan = String(s.plan || 'Subscription').trim(), cd = Math.round(n(s.dueDays)), when = label(x.ym);
    var part = o.full ? '' : ', ' + o.days + ' of ' + o.dim + ' days';
    var notes = [];
    if (o.disc > 0) notes.push('Discount ' + (s.discType === 'pct' ? n(s.disc) + '%' : 'Rs ' + n(s.disc)) + ' allowed');
    if (o.held) notes.push(o.held + ' day' + (o.held > 1 ? 's' : '') + ' paused');
    if (s.stop && o.part === 'stop') notes.push('Service stopped on ' + s.stop);
    notes.push('Subscriber ' + (s.no || ''));
    var tax = s.kind === 'tax';
    return { type: 'invoice', kind: s.kind || 'plain', no: no || '', deliv: '', orig: { no: '', date: '' }, reason: 'ret', tr: { veh: '', tname: '', lr: '' },
      paper: s.paper || 'a4', design: s.design || 'classic', copies: 1, date: x.bill, due: cd > 0 ? addDays(x.bill, cd) : '', pos: '', rc: false, recv: '', ref: 'Subscriber ' + (s.no || ''),
      seller: JSON.parse(JSON.stringify(s.seller || {})), buyer: JSON.parse(JSON.stringify(s.buyer || {})), ship: null, einv: null, irn: null,
      items: [{ desc: plan + ' (' + when + part + ')', hsn: tax ? String(s.sac || '') : '', qty: 1, unit: 'Nos', rate: o.taxable, disc: '', gst: tax ? n(s.gst) : 0 }],
      round: true, comp: true, notes: notes.join('. '), terms: s.billTerms || '', accent: s.accent || '#0B3B5B',
      status: 'unpaid', copyLabel: '', withGst: tax, valid: '', charges: [], tcs: { on: false, rate: '', base: 'total', sec: '' }, rec: null,
      recOf: s.id, recFor: x.ym, subOf: s.id, subFor: x.ym, subNo: s.no || '', total: o.total };
  }

  /* who has not paid: the invoices made from subscribers with an amount still left (from the books when they are given, else not marked paid). rows: { s, d, left, over } */
  function unpaid(docs, who, today, B) {
    var by = {}; mine(docs, who).forEach(function (s) { by[s.id] = s; });
    var mineDocs = (docs || []).filter(function (d) { return d && key(d.seller && d.seller.name) === key(who); }), left = {}, useBooks = false;
    /* NSBooks.bills lists only the bills with something still open, so an invoice that is not in its list is settled */
    if (B && B.bills) { try { B.bills(mineDocs, who).bills.forEach(function (b) { left[b.id] = b.left; }); useBooks = true; } catch (e) { left = {}; useBooks = false; } }
    return (docs || []).filter(function (d) { return d && d.subOf && by[d.subOf] && (d.type || 'invoice') === 'invoice'; }).map(function (d) {
      var l = useBooks ? (left[d.id] != null ? left[d.id] : 0) : d.status === 'paid' ? 0 : n(d.total);
      return { s: by[d.subOf], d: d, left: r2(l), over: d.due ? Math.max(0, days(d.due, today)) : 0 };
    }).filter(function (u) { return u.left > 0.004; }).sort(function (a, b) { return String(a.d.date).localeCompare(String(b.d.date)); });
  }
  /* the same grouped by subscriber: { s, bills:[...], left, oldest } for reminders */
  function owing(docs, who, today, B) {
    var by = {};
    unpaid(docs, who, today, B).forEach(function (u) { var g = by[u.s.id] || (by[u.s.id] = { s: u.s, bills: [], left: 0, over: 0 }); g.bills.push(u); g.left = r2(g.left + u.left); g.over = Math.max(g.over, u.over); });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.left - a.left; });
  }

  /* connected, paused, stopped, not started: the state on a date */
  function state(s, today) {
    if (s.status === 'cancelled') return 'stopped';
    if (!isDate(s.start) || s.start > today) return 'new';
    if (isDate(s.stop) && s.stop < today) return 'stopped';
    return (s.holds || []).some(function (h) { return isDate(h.from) && isDate(h.to) && h.from <= today && today <= h.to; }) ? 'paused' : 'live';
  }
  function summary(docs, who, today) {
    var o = { live: 0, paused: 0, stopped: 0, monthly: 0, owed: 0, owedN: 0 };
    mine(docs, who).forEach(function (s) { var st = state(s, today); if (st === 'live' || st === 'paused') { o[st]++; var mm = month(s, today.slice(0, 7)); o.monthly += mm.skip ? 0 : mm.total; } else if (st === 'stopped') o.stopped++; });
    return o;
  }
  function phone10(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; }
  function wa(phone, text) { var p = phone10(phone); return 'https://wa.me/' + (p ? '91' + p : '') + '?text=' + encodeURIComponent(text); }
  function inr(x) { return 'Rs ' + r2(x).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  /* WhatsApp texts (English; edited in WhatsApp before sending) */
  function dueText(g, shop, fmt) {
    var f = fmt || function (x) { return x; }, s = g.s, name = s.buyer && s.buyer.name || '', months = g.bills.map(function (u) { return label(u.d.subFor); });
    return 'Hello ' + name + ', your ' + (s.plan || 'subscription') + ' bill' + (g.bills.length > 1 ? 's for ' + months.join(', ') + ' are' : ' for ' + months[0] + ' is') + ' pending: ' + inr(g.left) + (g.over ? ' (overdue by ' + g.over + ' days)' : '') + '.' + (s.seller && s.seller.upi ? ' Pay by UPI: ' + s.seller.upi + '.' : '') + ' Thank you. ' + (shop || '');
  }
  function billText(x, shop) { var s = x.s, name = s.buyer && s.buyer.name || ''; return 'Hello ' + name + ', your ' + (s.plan || 'subscription') + ' bill for ' + label(x.ym) + ' is ' + inr(x.o.total) + (x.o.full ? '' : ' (' + x.o.days + ' of ' + x.o.dim + ' days)') + '.' + (s.seller && s.seller.upi ? ' Pay by UPI: ' + s.seller.upi + '.' : '') + ' ' + (shop || ''); }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { var v = String(c == null ? '' : c); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n'); }
  function subscriberRows(docs, who, today) {
    return [['No.', 'Name', 'Phone', 'Plan', 'Monthly amount', 'Discount', 'GST %', 'Bill day', 'Start', 'Stop', 'State']].concat(mine(docs, who).sort(function (a, b) { return String(a.no).localeCompare(String(b.no)); }).map(function (s) {
      return [s.no, s.buyer && s.buyer.name, s.buyer && s.buyer.phone, s.plan, n(s.amount), n(s.disc) ? (s.discType === 'pct' ? n(s.disc) + '%' : n(s.disc)) : '', gstOf(s), s.billDay || 1, s.start, s.stop || '', state(s, today)];
    }));
  }
  function owingRows(docs, who, today, B) {
    return [['Subscriber', 'Phone', 'Invoice', 'Month', 'Date', 'Due', 'Amount left', 'Days overdue']].concat(unpaid(docs, who, today, B).map(function (u) { return [u.s.buyer && u.s.buyer.name, u.s.buyer && u.s.buyer.phone, u.d.no, label(u.d.subFor), u.d.date, u.d.due || '', u.left, u.over]; }));
  }

  var API = { key: key, n: n, label: label, isYm: isYm, isDate: isDate, month: month, billDate: billDate, startMonth: startMonth, heldDays: heldDays, invoiced: invoiced, billsDue: billsDue, makeInvoice: makeInvoice, unpaid: unpaid, owing: owing, state: state, summary: summary,
    dueText: dueText, billText: billText, wa: wa, csv: csv, subscriberRows: subscriberRows, owingRows: owingRows, mine: mine, addDays: addDays, addMonth: addMonth, days: days, dim: dim, gstOf: gstOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSSubs = API;
})(this);
