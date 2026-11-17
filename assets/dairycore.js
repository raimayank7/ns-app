/* NSDairy: the sums of a milk diary, for dairy.niveshsahayak.in. Pure functions, no screen. Tests: node scripts/test_dairy.js
   One saved record (type 'dairy') is ONE PASSBOOK: one person for one period (a fortnight or a month).
     role 'collect'  the dairy buys milk from a farmer / supplier: litres each morning and evening, fat and SNF if measured, a rate, the amount
     role 'deliver'  the dairy (or milkman) sells milk to a customer: litres a day, a rate, days skipped
   The passbook is also the statement: every day, the period total, adjustments (cattle feed on credit, advance, anything added or cut),
   what is paid now and the balance. Rates are never filled in by the tool: they differ by dairy, by season and by milk quality, so the user types them.
   Rate of one day, in this order:
     1. a rate typed on that day's row (row.rate)
     2. method 'flat'   one rate for every litre (d.rate)
     3. method 'point'  rate = base + fat% x rate per 1% fat + SNF% x rate per 1% SNF (all typed; needs the fat of that day)
     4. method 'chart'  a rate chart typed as lines "fat:rate" (for example 3.5:34); the row with the highest fat that is not above the day's fat
   A day with milk but no usable rate shows up as 'missing' so the user never signs a statement with a silent zero.
   Books: one journal entry per passbook (books()), the way mandi does it: collect = Dr purchases, Cr farmer; deliver = Dr customer, Cr sales;
   adjustments and payments move the party's account; milk bought or sold on credit is shown in the App's party ledger. */
(function (G) {
  'use strict';
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function r3(n) { return Math.round((n + Number.EPSILON) * 1000) / 1000; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function dim(y, m) { return new Date(y, m, 0).getDate(); }   /* days in month m (1-12) */
  function addDays(s, k) { var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + k); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var METHODS = ['flat', 'point', 'chart'], ROLES = ['collect', 'deliver'];

  /* the period (first and last day) that holds a date: 'fn' = 1st to 15th or 16th to month end, 'mo' = the calendar month */
  function periodOf(date, per) {
    if (!isDate(date)) return { from: '', to: '' };
    var y = +date.slice(0, 4), m = +date.slice(5, 7), d = +date.slice(8, 10), last = dim(y, m), ym = y + '-' + pad(m) + '-';
    if (per === 'fn') return d <= 15 ? { from: ym + '01', to: ym + '15' } : { from: ym + '16', to: ym + pad(last) };
    return { from: ym + '01', to: ym + pad(last) };
  }
  function nextPeriod(from, to, per) { return periodOf(addDays(to, 1), per); }
  function dayList(from, to) {
    var out = [];
    if (!isDate(from) || !isDate(to) || to < from) return out;
    for (var d = from, i = 0; d <= to && i < 62; d = addDays(d, 1), i++) out.push(d);
    return out;
  }

  /* the rate chart: "3.5:34" or "3.5=34" or "3.5 34", one per line, highest fat last */
  function chartParse(text) {
    var out = [];
    String(text || '').split(/\r?\n|;/).forEach(function (l) {
      var m = /^\s*(\d+(?:\.\d+)?)\s*[:=\s]\s*(\d+(?:\.\d+)?)\s*$/.exec(l); if (m) out.push({ f: +m[1], r: +m[2] });
    });
    return out.sort(function (a, b) { return a.f - b.f; });
  }
  function chartRate(chart, fat) {
    var hit = 0; chart.forEach(function (x) { if (x.f <= fat + 1e-9) hit = x.r; });
    return hit;
  }

  /* rate per litre of one day's row (0 when it cannot be worked out) */
  function dayRate(d, row) {
    var own = num(row && row.rate); if (own > 0) return r2(own);
    var fat = num(row && row.fat), snf = num(row && row.snf), m = METHODS.indexOf(d.method) >= 0 ? d.method : 'flat';
    if (m === 'flat') return r2(num(d.rate));
    if (m === 'point') {
      if (!(fat > 0)) return 0;
      if (num(d.snfRate) > 0 && !(snf > 0)) return 0;
      return r2(num(d.base) + fat * num(d.fatRate) + snf * num(d.snfRate));
    }
    if (!(fat > 0)) return 0;
    return r2(chartRate(chartParse(d.chart), fat));
  }

  /* one day */
  function day(d, row) {
    row = row || {};
    var skip = row.skip === 'skip', am = skip ? 0 : num(row.am), pm = skip ? 0 : num(row.pm), L = r3(am + pm), rate = dayRate(d, row);
    return { date: row.date || '', am: r3(am), pm: r3(pm), litres: L, fat: num(row.fat), snf: num(row.snf), rate: rate, amt: L > 0 ? r2(L * rate) : 0, skip: skip, any: L > 0 || skip, missing: L > 0 && !(rate > 0), own: num(row.rate) > 0 };
  }

  /* the whole passbook */
  function calc(d) {
    d = d || {};
    var rows = (d.days || []).map(function (r) { return day(d, r); }), o = { rows: rows, litres: 0, amt: 0, days: 0, skipped: 0, missing: 0, fatL: 0, fatSum: 0, snfL: 0, snfSum: 0 };
    rows.forEach(function (x) {
      o.litres += x.litres; o.amt += x.amt; if (x.litres > 0) o.days++; if (x.skip) o.skipped++; if (x.missing) o.missing++;
      if (x.litres > 0 && x.fat > 0) { o.fatL += x.litres; o.fatSum += x.litres * x.fat; }
      if (x.litres > 0 && x.snf > 0) { o.snfL += x.litres; o.snfSum += x.litres * x.snf; }
    });
    o.litres = r3(o.litres); o.amt = r2(o.amt);
    o.avgFat = o.fatL > 0 ? r2(o.fatSum / o.fatL) : 0; o.avgSnf = o.snfL > 0 ? r2(o.snfSum / o.snfL) : 0;
    o.avgRate = o.litres > 0 ? r2(o.amt / o.litres) : 0;
    o.add = 0; o.less = 0;
    (d.adj || []).forEach(function (a) { var v = r2(num(a.amt)); if (!(v > 0)) return; if (a.side === 'add') o.add += v; else o.less += v; });
    o.add = r2(o.add); o.less = r2(o.less);
    o.net = r2(o.amt + o.add - o.less);           /* worth of this period */
    o.open = r2(num(d.open));                      /* balance brought forward from the last passbook (typed, or filled when the next period is started) */
    o.adv = r2(num(d.adv));                        /* advance already given or taken before (shown; it is in the books as its own payment) */
    o.paid = r2(num(d.paid));                      /* paid or received at settlement now */
    o.due = r2(o.net + o.open - o.adv - o.paid);   /* balance after this passbook: collect = still to pay the farmer, deliver = still to get from the customer */
    o.total = o.net;
    return o;
  }

  var MONEY = { cash: 'cash', upi: 'bank', bank: 'bank', cheque: 'bank', card: 'bank', other: 'bank' };
  /* the books side: one journal entry. Nothing is booked for a passbook without a name or without value */
  function books(d, o) {
    o = o || calc(d);
    var who = String(d.buyer && d.buyer.name || '').trim(), L = [], collect = d.role !== 'deliver';
    function line(a, dr, cr, extra) { dr = r2(dr); cr = r2(cr); if (dr || cr) L.push(Object.assign({ a: a, dr: dr, cr: cr }, extra || {})); }
    if (!who || !(o.amt > 0 || o.add > 0)) return [];
    var side = collect ? 'pay' : 'recv';
    if (collect) {
      line('purchases', o.amt, 0); line('party', 0, o.amt, { party: who, side: side });
    } else {
      line('party', o.amt, 0, { party: who, side: side }); line('sales', 0, o.amt);
    }
    /* things added to or cut from the amount (feed given on credit and the like) only change what is settled: they are NOT booked here,
       because the dairy's own sale of feed has its own bill, and a typed cut may be anything */
    if (o.paid > 0) {
      var m = MONEY[d.pmode] || 'cash';
      if (collect) { line('party', o.paid, 0, { party: who, side: side }); line(m, 0, o.paid); } else { line(m, o.paid, 0); line('party', 0, o.paid, { party: who, side: side }); }
    }
    return L.length ? [{ type: 'jv', no: d.no, narr: 'Milk ' + (collect ? 'collection ' : 'delivery ') + (d.no || '') + ' ' + who, lines: L }] : [];
  }

  /* ---------- the diary of one day over every passbook ---------- */
  function covers(d, date) { return d && d.type === 'dairy' && d.from && d.to && d.from <= date && date <= d.to && d.status !== 'closed'; }
  function mine(docs, who) { return (docs || []).filter(function (d) { return d && d.type === 'dairy' && (!who || key(d.seller && d.seller.name) === key(who)); }); }
  /* the passbook of each person (and role) that covers a date: the one entered last wins when two overlap */
  function onDate(docs, date, who) {
    var by = {};
    mine(docs, who).filter(function (d) { return covers(d, date); }).sort(function (a, b) { return (a.updated || 0) - (b.updated || 0); }).forEach(function (d) { by[key(d.buyer && d.buyer.name) + '|' + d.role] = d; });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return a.role === b.role ? String(a.buyer.name).localeCompare(String(b.buyer.name)) : a.role === 'collect' ? -1 : 1; });
  }
  /* put one day's figures into a passbook: the row of that date is replaced or added in date order. vals: { am, pm, fat, snf, skip } (empty text leaves a figure empty) */
  function setDay(d, date, vals) {
    var days = d.days || (d.days = []), row = days.filter(function (r) { return r.date === date; })[0];
    if (!row) { row = { date: date, am: '', pm: '', fat: '', snf: '', rate: '', skip: '' }; days.push(row); days.sort(function (a, b) { return a.date.localeCompare(b.date); }); }
    ['am', 'pm', 'fat', 'snf'].forEach(function (k) { if (vals && vals[k] != null) row[k] = String(vals[k]); });
    if (vals && 'skip' in vals) row.skip = vals.skip ? 'skip' : '';
    return row;
  }
  /* every date of the period as an empty row, keeping figures already typed; `usual` = { am, pm } for the days that have nothing yet (customers get their usual litres) */
  function fillDays(d, usual) {
    var have = {}; (d.days || []).forEach(function (r) { have[r.date] = r; });
    d.days = dayList(d.from, d.to).map(function (dt) {
      if (have[dt]) return have[dt];
      return { date: dt, am: usual && num(usual.am) ? String(usual.am) : '', pm: usual && num(usual.pm) ? String(usual.pm) : '', fat: usual && num(usual.fat) ? String(usual.fat) : '', snf: usual && num(usual.snf) ? String(usual.snf) : '', rate: '', skip: '' };
    });
    return d.days;
  }
  /* the next passbook of the same person: same terms, the next period, brought-forward balance = what was left, no days, no payment */
  function next(d) {
    var o = calc(d), n = JSON.parse(JSON.stringify(d)), p = nextPeriod(d.from, d.to, d.per || 'mo');
    ['id', 'created', 'updated', 'no', 'books', 'balance'].forEach(function (k) { delete n[k]; });
    n.from = p.from; n.to = p.to; n.pdate = p.from; n.date = p.from; n.days = []; n.adj = []; n.paid = ''; n.adv = ''; n.open = o.due ? String(o.due) : ''; n.status = '';
    if (d.role === 'deliver' || num(d.usualAm) || num(d.usualPm)) fillDays(n, { am: d.usualAm, pm: d.usualPm, fat: d.role === 'deliver' ? '' : d.usualFat, snf: d.role === 'deliver' ? '' : d.usualSnf });
    return n;
  }
  /* people with a passbook that ended before `date` and no passbook after it: their next period can be started */
  function toStart(docs, date, who) {
    var last = {};
    mine(docs, who).forEach(function (d) { var k = key(d.buyer && d.buyer.name) + '|' + d.role; if (!last[k] || d.to > last[k].to || d.to === last[k].to && (d.updated || 0) > (last[k].updated || 0)) last[k] = d; });
    return Object.keys(last).map(function (k) { return last[k]; }).filter(function (d) { return d.to < date && d.status !== 'closed'; }).sort(function (a, b) { return String(a.buyer.name).localeCompare(String(b.buyer.name)); });
  }

  /* ---------- totals and accounts ---------- */
  function summary(docs, from, to, who) {
    var o = { passbooks: 0, collLitres: 0, collAmt: 0, delLitres: 0, delAmt: 0 };
    mine(docs, who).forEach(function (d) {
      var c = calc(d), rows = c.rows.filter(function (x) { return (!from || x.date >= from) && (!to || x.date <= to); }); if (!rows.length) return;
      o.passbooks++;
      rows.forEach(function (x) { if (d.role === 'deliver') { o.delLitres += x.litres; o.delAmt += x.amt; } else { o.collLitres += x.litres; o.collAmt += x.amt; } });
    });
    ['collLitres', 'delLitres'].forEach(function (k) { o[k] = r3(o[k]); }); ['collAmt', 'delAmt'].forEach(function (k) { o[k] = r2(o[k]); });
    o.margin = r2(o.delAmt - o.collAmt);
    return o;
  }
  /* what is open with each person: the newest passbook's balance after its own payment, and its period */
  function accounts(docs, who) {
    var by = {};
    mine(docs, who).forEach(function (d) {
      var k = key(d.buyer && d.buyer.name) + '|' + d.role, cur = by[k];
      if (!cur || d.to > cur.d.to || d.to === cur.d.to && (d.updated || 0) > (cur.d.updated || 0)) by[k] = { d: d };
    });
    return Object.keys(by).map(function (k) {
      var d = by[k].d, c = calc(d);
      return { key: k, name: d.buyer.name, phone: d.buyer.phone || '', role: d.role === 'deliver' ? 'deliver' : 'collect', from: d.from, to: d.to, due: c.due, litres: c.litres, amt: c.net, id: d.id, status: d.status || '' };
    }).sort(function (a, b) { return a.role === b.role ? String(a.name).localeCompare(String(b.name)) : a.role === 'collect' ? -1 : 1; });
  }
  function phone10(p) { var s = String(p || '').replace(/\D/g, '').slice(-10); return s.length === 10 ? s : ''; }
  function wa(phone, text) { var p = phone10(phone); return 'https://wa.me/' + (p ? '91' + p : '') + '?text=' + encodeURIComponent(text); }
  function inr(n) { return 'Rs ' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  /* WhatsApp text of a statement (English; the owner edits it in WhatsApp before sending) */
  function statementText(d, o, fmt) {
    o = o || calc(d); var f = fmt || function (x) { return x; }, collect = d.role !== 'deliver', who = d.buyer && d.buyer.name || '';
    var t = 'Dear ' + who + ', milk ' + (collect ? 'collection' : 'delivery') + ' statement ' + f(d.from) + ' to ' + f(d.to) + ': ' + o.litres + ' litres' + (o.avgFat ? ', average fat ' + o.avgFat : '') + ', amount ' + inr(o.net) + '.';
    if (o.open) t += ' Brought forward ' + inr(o.open) + '.';
    if (o.adv) t += ' Advance ' + inr(o.adv) + '.';
    if (o.paid) t += ' ' + (collect ? 'Paid now ' : 'Received ') + inr(o.paid) + '.';
    t += o.due > 0.004 ? (collect ? ' Balance we will pay: ' : ' Balance due from you: ') + inr(o.due) + '.' : o.due < -0.004 ? ' Excess ' + inr(-o.due) + ' (' + (collect ? 'paid more than due' : 'paid in advance') + ').' : ' Nothing is due.';
    return t + ' ' + (d.seller && d.seller.name || '');
  }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\r\n'); }
  function dayRows(docs, who) {
    var out = [['Date', 'Name', 'Kind', 'Morning litres', 'Evening litres', 'Total litres', 'Fat', 'SNF', 'Rate', 'Amount']];
    mine(docs, who).forEach(function (d) { calc(d).rows.forEach(function (x) { if (x.any) out.push([x.date, d.buyer.name, d.role === 'deliver' ? 'Delivery' : 'Collection', x.am, x.pm, x.litres, x.fat || '', x.snf || '', x.rate, x.amt]); }); });
    return out.sort(function (a, b) { return a === out[0] ? -1 : b === out[0] ? 1 : String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])); });
  }

  var API = { num: num, r2: r2, r3: r3, key: key, METHODS: METHODS, ROLES: ROLES, periodOf: periodOf, nextPeriod: nextPeriod, dayList: dayList, chartParse: chartParse, chartRate: chartRate, dayRate: dayRate, day: day, calc: calc, books: books,
    covers: covers, mine: mine, onDate: onDate, setDay: setDay, fillDays: fillDays, next: next, toStart: toStart, summary: summary, accounts: accounts, wa: wa, statementText: statementText, csv: csv, dayRows: dayRows, addDays: addDays, isDate: isDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSDairy = API;
})(this);
