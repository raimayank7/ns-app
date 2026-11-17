/* NSSheet: the pure logic of tripsheet.niveshsahayak.in (India plan C): trip sheets for a small taxi operator, travel agency or courier agent.
   One saved sheet is a document of type 'tsh' with mode 'taxi' | 'travel' | 'courier' and a list of lines `lines`:
     taxi:    { date, desc, km, rate, amt, extra }          amount = km x rate when a rate is typed, else amt; plus extra (toll, parking, waiting)
     travel:  { date, desc, ref, base, svc, comm }          the customer pays base + svc; comm = commission the supplier pays the agent (not charged to the customer)
     courier: { date, ref, to, n, wt, charge, cod, handed } n parcels (default 1); cod = cash on delivery collected; handed = COD already handed over
   Own costs of a taxi sheet (driver pay, fuel, other) are typed once on the sheet and never printed. GST is only what the user types: gstOn is 'none',
   'svc' (travel: on the service charge only) or 'all', and gst is the rate typed by the user; this file contains no GST rate.
   Tests: node scripts/test_sheet.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function lineAmt(mode, l) {
    if (mode === 'taxi') return r2((n(l.rate) > 0 && n(l.km) > 0 ? n(l.km) * n(l.rate) : n(l.amt)) + n(l.extra));
    if (mode === 'travel') return r2(n(l.base) + n(l.svc));
    return r2(n(l.charge));
  }
  function isEmpty(mode, l) {
    var k = mode === 'taxi' ? ['desc', 'km', 'amt', 'extra'] : mode === 'travel' ? ['desc', 'base', 'svc'] : ['ref', 'to', 'charge', 'cod', 'n'];
    return !k.some(function (f) { return String(l[f] == null ? '' : l[f]).trim() !== ''; });
  }
  /* the money of one sheet. Taxable value, GST as typed, total, what is due, own profit, COD to hand over */
  function calc(d) {
    var mode = d.tmode || 'taxi', o = { mode: mode, rows: [], km: 0, parcels: 0, fare: 0, base: 0, svc: 0, comm: 0, charge: 0, cod: 0, handed: 0 };
    (d.lines || []).forEach(function (l) {
      if (isEmpty(mode, l)) return;
      var a = lineAmt(mode, l); o.rows.push({ l: l, amt: a }); o.fare += a;
      if (mode === 'taxi') o.km += n(l.km);
      else if (mode === 'travel') { o.base += n(l.base); o.svc += n(l.svc); o.comm += n(l.comm); }
      else { o.parcels += ((l.n == null || String(l.n).trim() === '') ? 1 : n(l.n)); o.charge += n(l.charge); o.cod += n(l.cod); o.handed += n(l.handed); }
    });
    ['fare', 'km', 'base', 'svc', 'comm', 'charge', 'cod', 'handed'].forEach(function (k) { o[k] = r2(o[k]); });
    var rate = d.gstOn && d.gstOn !== 'none' ? n(d.gst) : 0;
    o.gstBase = d.gstOn === 'svc' && mode === 'travel' ? o.svc : o.fare;
    o.tax = r2(o.gstBase * rate / 100); o.rate = rate;
    var home = d.seller && d.seller.state, there = d.buyer && d.buyer.state;
    o.intra = !home || !there || home === there;
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); o.igst = 0; } else { o.igst = o.tax; o.cgst = o.sgst = 0; }
    var total = r2(o.fare + o.tax); o.roundOff = d.round ? r2(Math.round(total) - total) : 0; o.total = r2(total + o.roundOff);
    o.due = d.status2 === 'paid' ? 0 : o.total;
    o.costs = r2(n(d.driverPay) + n(d.fuel) + n(d.otherCost));
    o.profit = mode === 'taxi' ? r2(o.fare - o.costs) : mode === 'travel' ? r2(o.svc + o.comm) : r2(o.charge - o.costs);
    o.codHold = r2(o.cod - o.handed);
    o.parcels = r2(o.parcels);
    return o;
  }
  function mine(d, who, mode) { return d && d.type === 'tsh' && (!mode || d.tmode === mode) && (!who || key(d.seller && d.seller.name) === key(who)); }
  function inRange(date, f, t) { return (!f || String(date || '') >= f) && (!t || String(date || '') <= t); }
  function sheets(docs, who, mode, from, to) { return (docs || []).filter(function (d) { return mine(d, who, mode) && inRange(d.date, from, to); }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)) || String(a.no).localeCompare(String(b.no)); }); }
  /* one row per day ('day') or month ('month') over the sheets of a mode: counts, money, profit, COD to hand over. Line dates win over the sheet date. */
  function summary(docs, who, mode, from, to, by) {
    var g = {}, len = by === 'month' ? 7 : 10;
    sheets(docs, who, mode, '', '').forEach(function (d) {
      var o = calc(d);
      o.rows.forEach(function (r) {
        var date = r.l.date || d.date; if (!inRange(date, from, to)) return;
        var k = String(date).slice(0, len), s = g[k] = g[k] || { k: k, items: 0, km: 0, parcels: 0, amount: 0, svc: 0, comm: 0, cod: 0, handed: 0 };
        s.items++; s.amount += r.amt;
        if (mode === 'taxi') s.km += n(r.l.km);
        else if (mode === 'travel') { s.svc += n(r.l.svc); s.comm += n(r.l.comm); }
        else { s.parcels += ((r.l.n == null || String(r.l.n).trim() === '') ? 1 : n(r.l.n)); s.cod += n(r.l.cod); s.handed += n(r.l.handed); }
      });
    });
    var rows = Object.keys(g).sort().map(function (k) { var s = g[k]; Object.keys(s).forEach(function (f) { if (f !== 'k') s[f] = r2(s[f]); }); s.codHold = r2(s.cod - s.handed); s.profit = mode === 'travel' ? r2(s.svc + s.comm) : null; return s; });
    var t = { items: 0, km: 0, parcels: 0, amount: 0, svc: 0, comm: 0, cod: 0, handed: 0 };
    rows.forEach(function (s) { Object.keys(t).forEach(function (f) { t[f] += s[f]; }); }); Object.keys(t).forEach(function (f) { t[f] = r2(t[f]); }); t.codHold = r2(t.cod - t.handed);
    var costs = 0; sheets(docs, who, mode, from, to).forEach(function (d) { costs += calc(d).costs; }); t.costs = r2(costs);
    t.profit = mode === 'taxi' ? r2(t.amount - t.costs) : mode === 'travel' ? r2(t.svc + t.comm) : null;
    return { rows: rows, total: t };
  }
  /* party statement: the sheets of one mode by customer, with what is due (leftFn(doc) = balance from the App's books, else status) */
  function parties(docs, who, mode, leftFn) {
    var by = {};
    sheets(docs, who, mode, '', '').forEach(function (d) {
      var p = d.buyer || {}, k = key(p.name) || '(no name)', s = by[k] = by[k] || { party: String(p.name || '').trim() || '(no name)', phone: '', n: 0, total: 0, due: 0, cod: 0, last: '' };
      var o = calc(d); s.n++; s.total += o.total; s.due += leftFn ? n(leftFn(d)) : o.due; s.cod += o.codHold; if (p.phone && !s.phone) s.phone = p.phone; if (String(d.date) > s.last) s.last = d.date;
    });
    return Object.keys(by).map(function (k) { var s = by[k]; ['total', 'due', 'cod'].forEach(function (f) { s[f] = r2(s[f]); }); return s; }).sort(function (a, b) { return b.due - a.due || a.party.localeCompare(b.party); });
  }
  function phone10(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; }
  function money(v) { return 'Rs ' + n(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  /* WhatsApp text of one sheet (English; the owner may edit it) */
  function waText(d, o, shop, fmt) {
    var f = fmt || function (x) { return x; }, b = d.buyer && d.buyer.name || '', head = 'Hello ' + b + ', ';
    if (o.mode === 'taxi') return head + 'trip sheet ' + (d.no || '') + ' (' + f(d.date) + '): ' + o.rows.length + ' trip(s)' + (o.km ? ', ' + o.km + ' km' : '') + ', total ' + money(o.total) + (o.due ? ', due ' + money(o.due) : ', paid') + '. ' + (shop || '');
    if (o.mode === 'travel') return head + 'booking ' + (d.no || '') + ' (' + f(d.date) + '): ' + o.rows.map(function (r) { return r.l.desc; }).filter(Boolean).join('; ') + '. Total ' + money(o.total) + (o.due ? ', due ' + money(o.due) : ', paid') + '. ' + (shop || '');
    return head + 'courier statement ' + (d.no || '') + ' (' + f(d.date) + '): ' + o.parcels + ' parcel(s), charges ' + money(o.charge) + (o.cod ? ', COD collected ' + money(o.cod) + ', handed over ' + money(o.handed) + ', to hand over ' + money(o.codHold) : '') + '. ' + (shop || '');
  }
  function summaryRows(mode, s) {
    var head = mode === 'taxi' ? ['Period', 'Trips', 'Km', 'Amount'] : mode === 'travel' ? ['Period', 'Bookings', 'Total billed', 'Service charge', 'Commission from suppliers', 'Own earning'] : ['Period', 'Entries', 'Parcels', 'Charges', 'COD collected', 'COD handed over', 'COD to hand over'];
    var row = function (x, lbl) { return mode === 'taxi' ? [lbl, x.items, x.km, x.amount] : mode === 'travel' ? [lbl, x.items, x.amount, x.svc, x.comm, r2(x.svc + x.comm)] : [lbl, x.items, x.parcels, x.amount, x.cod, x.handed, x.codHold]; };
    return [head].concat(s.rows.map(function (x) { return row(x, x.k); })).concat([row(s.total, 'Total')]);
  }
  function partyRows(list) { return [['Party', 'Phone', 'Sheets', 'Billed', 'Due', 'COD to hand over', 'Last sheet']].concat(list.map(function (s) { return [s.party, s.phone, s.n, s.total, s.due, s.cod, s.last]; })); }
  function sheetRows(docs, who, mode, from, to) {
    var out = [mode === 'taxi' ? ['Sheet', 'Date', 'Customer', 'Trip', 'Km', 'Rate', 'Amount'] : mode === 'travel' ? ['Sheet', 'Date', 'Customer', 'Booking', 'Ref', 'Base fare', 'Service charge', 'Commission'] : ['Sheet', 'Date', 'Sender', 'Reference', 'To', 'Parcels', 'Charge', 'COD', 'COD handed']];
    sheets(docs, who, mode, from, to).forEach(function (d) {
      var o = calc(d), b = d.buyer && d.buyer.name || '';
      o.rows.forEach(function (r) {
        var l = r.l, dt = l.date || d.date;
        out.push(mode === 'taxi' ? [d.no, dt, b, l.desc || '', n(l.km) || '', n(l.rate) || '', r.amt] : mode === 'travel' ? [d.no, dt, b, l.desc || '', l.ref || '', n(l.base), n(l.svc), n(l.comm)] : [d.no, dt, b, l.ref || '', l.to || '', (l.n == null || String(l.n).trim() === '') ? 1 : n(l.n), n(l.charge), n(l.cod), n(l.handed)]);
      });
    });
    return out;
  }
  var API = { key: key, n: n, r2: r2, lineAmt: lineAmt, isEmpty: isEmpty, calc: calc, sheets: sheets, summary: summary, parties: parties, waText: waText, phone10: phone10, summaryRows: summaryRows, partyRows: partyRows, sheetRows: sheetRows, money: money };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSSheet = API;
})(this);
