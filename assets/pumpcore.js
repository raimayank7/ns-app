/* NSPump: the sums of a petrol pump shift report, for petrol.niveshsahayak.in. Pure functions, no screen.
   One report = one shift (or one day): nozzle meter readings (opening, closing, testing litres put back into the tank), the price of each
   fuel, sales per fuel, credit sales to named customers, how the money came (card, UPI, other, cash), cash counted against cash expected,
   and dip stock per fuel (opening, deliveries, closing, against what the meters say was sold).
     nozzle(n, roll)  litres sold on one nozzle: closing - opening - testing; a meter that went round (closing below opening) uses roll
     calc(d)          the whole report
     books(d, c)      the books side as ready-made records for NSBooks (cash memos without GST, an expense or income for cash short / excess)
     nextOpening(d)   the nozzles of the next shift: opening = this closing
   Petrol, diesel, ATF, natural gas and crude oil are outside GST (state VAT is already in the pump price), so no fuel line carries GST. */
(function (G) {
  'use strict';
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function has(v) { return v !== '' && v != null; }

  function nozzle(n, roll) {
    n = n || {};
    var o = num(n.open), c = num(n.close), test = num(n.test), any = has(n.open) || has(n.close), bad = '', l = 0;
    if (any && (!has(n.open) || !has(n.close))) bad = 'incomplete';
    else if (any) {
      if (c >= o) l = c - o;
      else if (num(roll) > 0 && num(roll) > o) l = num(roll) - o + c;
      else bad = 'back';
    }
    l = r2(l - test);
    if (l < 0 && !bad) bad = 'test';
    return { litres: bad ? 0 : l, price: num(n.price), amt: bad ? 0 : r2(l * num(n.price)), bad: bad, any: any, fuel: String(n.fuel || '').trim() };
  }

  function calc(d) {
    var o = { noz: [], fuels: {}, order: [], litres: 0, sales: 0, credit: 0, creditRows: [], tanks: [] };
    (d.noz || []).forEach(function (n) {
      var c = nozzle(n, d.roll); o.noz.push(c);
      if (!c.any || c.bad) return;
      var k = key(c.fuel) || 'fuel', f = o.fuels[k];
      if (!f) { f = o.fuels[k] = { name: c.fuel || 'Fuel', litres: 0, amt: 0, price: c.price }; o.order.push(k); }
      f.litres = r2(f.litres + c.litres); f.amt = r2(f.amt + c.amt); if (c.price) f.price = c.price;
      o.litres += c.litres; o.sales += c.amt;
    });
    o.litres = r2(o.litres); o.sales = r2(o.sales);
    (d.credit || []).forEach(function (x) {
      var p = (o.fuels[key(x.fuel)] || {}).price || 0, a = has(x.amt) ? num(x.amt) : r2(num(x.litres) * p);
      o.creditRows.push({ cust: String(x.cust || '').trim(), veh: String(x.veh || '').trim(), fuel: String(x.fuel || '').trim(), litres: num(x.litres), amt: r2(a), slip: x.slip || '' });
      o.credit += a;
    });
    o.credit = r2(o.credit);
    o.card = r2(num(d.card)); o.upi = r2(num(d.upi)); o.other = r2(num(d.other)); o.exp = r2(num(d.exp));
    o.cashSales = r2(o.sales - o.credit - o.card - o.upi - o.other);          /* sales that came in as cash */
    o.expected = r2(o.cashSales - o.exp);                                      /* cash that should be in the till after expenses */
    o.counted = has(d.counted) ? r2(num(d.counted)) : null;
    o.diff = o.counted == null ? null : r2(o.counted - o.expected);           /* negative = short */
    /* dip stock per fuel: opening + deliveries - sold (by the meters) = what the tank should hold */
    var T = {};
    (d.tanks || []).forEach(function (t) {
      var k = key(t.fuel); if (!k && !has(t.open) && !has(t.close)) return; k = k || 'fuel';
      var x = T[k] || (T[k] = { fuel: String(t.fuel || '').trim() || 'Fuel', open: 0, recv: 0, close: 0, n: 0, closed: true });
      x.open += num(t.open); x.recv += num(t.recv); x.n++;
      if (has(t.close)) x.close += num(t.close); else x.closed = false;
    });
    Object.keys(T).forEach(function (k) {
      var x = T[k], sold = (o.fuels[k] || {}).litres || 0;
      x.sold = sold; x.book = r2(x.open + x.recv - sold);
      x.var = x.closed ? r2(x.close - x.book) : null;                          /* negative = loss, positive = gain */
      x.pct = x.closed && sold > 0 ? r2(x.var / sold * 100) : null;
      o.tanks.push(x);
    });
    o.total = o.sales;
    return o;
  }

  var MODE = { card: 'card', upi: 'upi', other: 'other' };
  function books(d, c) {
    var out = [], when = String(d.shift || '').trim();
    function memo(amount, mode, name, items) {
      amount = r2(amount); if (!(amount > 0)) return;
      var r = { type: 'cashmemo', kind: 'plain', withGst: false, buyer: { name: name || '' }, items: items || [{ desc: 'Fuel sales' + (when ? ' (' + when + ')' : ''), qty: 1, unit: 'Lot', rate: String(amount) }], narr: 'Fuel sales ' + (d.no || '') };
      if (mode) { r.status = 'paid'; r.payMode = mode; } else r.status = 'unpaid';
      out.push(r);
    }
    memo(c.cashSales, 'cash'); memo(c.card, 'card'); memo(c.upi, 'upi'); memo(c.other, 'other');
    /* credit sales: one bill per customer, one line per fill */
    var by = {}, order = [];
    c.creditRows.forEach(function (x) { if (!(x.amt > 0)) return; var k = key(x.cust) || '~'; if (!by[k]) { by[k] = { name: x.cust, rows: [] }; order.push(k); } by[k].rows.push(x); });
    order.forEach(function (k) {
      var b = by[k];
      memo(b.rows.reduce(function (a, x) { return a + x.amt; }, 0), '', b.name || 'Credit customer', b.rows.map(function (x) { return { desc: (x.fuel || 'Fuel') + (x.veh ? ' ' + x.veh : '') + (x.litres ? ' ' + x.litres + ' L' : ''), qty: 1, unit: 'Lot', rate: String(x.amt) }; }));
    });
    if (c.exp > 0) out.push({ type: 'exp', cat: 'Pump expenses', amount: String(c.exp), mode: 'cash', gst: '', narr: 'Paid from the till, shift ' + (d.no || '') });
    if (c.diff != null && c.diff < -0.004) out.push({ type: 'exp', cat: 'Cash short', amount: String(-c.diff), mode: 'cash', gst: '', narr: 'Cash short, shift ' + (d.no || '') });
    if (c.diff != null && c.diff > 0.004) out.push({ type: 'oinc', head: 'Cash excess', amount: String(c.diff), mode: 'cash', narr: 'Cash excess, shift ' + (d.no || '') });
    return out;
  }

  /* the next shift starts where this one ended: same nozzles and prices, opening = closing; tanks open at the closing dip */
  function nextOpening(d) {
    return {
      noz: (d.noz || []).map(function (n) { return { noz: n.noz, fuel: n.fuel, open: has(n.close) ? n.close : n.open, close: '', test: '', price: n.price }; }),
      tanks: (d.tanks || []).map(function (t) { return { tank: t.tank, fuel: t.fuel, open: has(t.close) ? t.close : t.open, recv: '', close: '' }; })
    };
  }

  /* day summary of saved reports: litres and sales per fuel, credit, short / excess */
  function summary(docs, from, to) {
    var o = { n: 0, fuels: {}, sales: 0, credit: 0, diff: 0 };
    (docs || []).forEach(function (d) {
      if (d.type !== 'pump' || from && d.date < from || to && d.date > to) return;
      var c = calc(d); o.n++; o.sales += c.sales; o.credit += c.credit; o.diff += c.diff || 0;
      c.order.forEach(function (k) { var f = o.fuels[k] || (o.fuels[k] = { name: c.fuels[k].name, litres: 0, amt: 0 }); f.litres += c.fuels[k].litres; f.amt += c.fuels[k].amt; });
    });
    o.sales = r2(o.sales); o.credit = r2(o.credit); o.diff = r2(o.diff);
    Object.keys(o.fuels).forEach(function (k) { o.fuels[k].litres = r2(o.fuels[k].litres); o.fuels[k].amt = r2(o.fuels[k].amt); });
    return o;
  }

  var API = { num: num, r2: r2, nozzle: nozzle, calc: calc, books: books, nextOpening: nextOpening, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSPump = API;
})(this);
