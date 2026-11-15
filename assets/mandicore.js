/* NSMandi: the sums of a mandi (grain market) settlement slip, for mandi.niveshsahayak.in. Pure functions, no screen.
   One slip = one lot sold through a commission agent (arhtiya): the farmer's produce is weighed (gross, tare, cut, net), valued at a rate,
   the buyer pays the value (plus any charges put on the buyer), the farmer gets the value less commission, market fee and charges.
     lot(l)        one produce line: bags, gross kg, tare kg (typed, or bags x tare per bag), quality cut %, net kg, amount
     calc(d)       the whole slip: lots, deductions of each side, GST on the agent's own earnings (typed rate, 0 by default),
                   farmer's net, buyer's total, what is still to pay / receive
     books(d, c)   the books side as ready-made records for NSBooks (one journal entry): buyer owes the total, farmer is owed the net,
                   commission is the agent's income, market fee and other pass-through charges are payable, payments made at settlement
   Rates (commission, market fee, GST) are never filled in by the tool: they differ by state and by crop, the user types them. */
(function (G) {
  'use strict';
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function r3(n) { return Math.round((n + Number.EPSILON) * 1000) / 1000; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

  /* rate basis of a produce line */
  var PER = ['qtl', 'kg', 'bag'];
  function lot(l) {
    l = l || {};
    var bags = num(l.n), gross = num(l.gross), tare = num(l.tare) > 0 ? num(l.tare) : r3(bags * num(l.tpb));
    var after = Math.max(0, r3(gross - tare)), cut = r3(after * num(l.cut) / 100), net = Math.max(0, r3(after - cut));
    var per = PER.indexOf(l.per) >= 0 ? l.per : 'qtl', rate = num(l.rate);
    var amt = per === 'kg' ? net * rate : per === 'bag' ? bags * rate : net / 100 * rate;
    return { bags: bags, gross: gross, tare: tare, cut: cut, net: net, qtl: r3(net / 100), per: per, rate: rate, amt: r2(amt), any: !!(gross || bags || rate) };
  }

  /* one deduction / charge line: basis pct (of the produce value), bag (per bag), qtl (per quintal of net weight), fixed */
  function dedAmt(x, T) {
    var v = num(x.v);
    return r2(x.basis === 'bag' ? T.bags * v : x.basis === 'qtl' ? T.qtl * v : x.basis === 'fixed' ? v : T.gross$ * v / 100);
  }

  function calc(d) {
    var o = { lots: [], bags: 0, gross: 0, tare: 0, cut: 0, net: 0, qtl: 0, value: 0, f: [], b: [], dF: 0, dB: 0, incF: 0, incB: 0, payF: 0, payB: 0 };
    (d.lots || []).forEach(function (l) {
      var c = lot(l); o.lots.push(c);
      o.bags += c.bags; o.gross += c.gross; o.tare += c.tare; o.cut += c.cut; o.net += c.net; o.value += c.amt;
    });
    o.bags = r3(o.bags); o.gross = r3(o.gross); o.tare = r3(o.tare); o.cut = r3(o.cut); o.net = r3(o.net); o.qtl = r3(o.net / 100); o.value = r2(o.value);
    var T = { bags: o.bags, qtl: o.qtl, gross$: o.value };
    (d.ded || []).forEach(function (x) {
      var a = dedAmt(x, T); if (!a && !String(x.name || '').trim()) return;
      var row = { name: String(x.name || '').trim() || 'Charge', basis: x.basis || 'pct', v: num(x.v), amt: a, side: x.side === 'buyer' ? 'buyer' : 'farmer', keep: x.keep === 'pay' ? 'pay' : 'inc' };
      if (row.side === 'buyer') { o.b.push(row); o.dB += a; if (row.keep === 'inc') o.incB += a; else o.payB += a; }
      else { o.f.push(row); o.dF += a; if (row.keep === 'inc') o.incF += a; else o.payF += a; }
    });
    o.dF = r2(o.dF); o.dB = r2(o.dB); o.incF = r2(o.incF); o.incB = r2(o.incB); o.payF = r2(o.payF); o.payB = r2(o.payB);
    /* GST on what the agent earns himself (typed rate; commission of an agent for agricultural produce is exempt, see the guide) */
    var g = num(d.gstRate); o.g = g;
    o.gstF = r2(o.incF * g / 100); o.gstB = r2(o.incB * g / 100);
    var fs = d.buyer && d.buyer.state, bs = d.cust && d.cust.state, ms = d.seller && d.seller.state;
    o.intraF = !ms || !fs || ms === fs; o.intraB = !ms || !bs || ms === bs;
    o.farmerNet = r2(o.value - o.dF - o.gstF);
    o.buyerTotal = r2(o.value + o.dB + o.gstB);
    o.adv = r2(num(d.adv));                       /* advance already paid to the farmer earlier (shown on the slip; it is in the books as its own payment) */
    o.paid = r2(num(d.paid)); o.recv = r2(num(d.recv));
    o.toPay = r2(o.farmerNet - o.adv - o.paid);   /* still to pay the farmer after the advance and what is paid now */
    o.toGet = r2(o.buyerTotal - o.recv);          /* still to get from the buyer */
    o.income = r2(o.incF + o.incB);               /* the agent's own earning (before GST) */
    o.fee = r2(o.payF + o.payB);                  /* passed on: market fee, labour and the like */
    o.total = o.farmerNet;
    return o;
  }

  var MONEY = { cash: 'cash', upi: 'bank', bank: 'bank', cheque: 'bank', card: 'bank', other: 'bank' };
  /* the books side: one journal entry. Accounts: 'inc:' = the agent's earning, 'ocl:' = owed on to market committee / labour */
  function books(d, c) {
    var L = [], cust = String(d.cust && d.cust.name || '').trim(), farmer = String(d.buyer && d.buyer.name || '').trim();
    function line(a, dr, cr, extra) { dr = r2(dr); cr = r2(cr); if (dr || cr) L.push(Object.assign({ a: a, dr: dr, cr: cr }, extra || {})); }
    function taxOut(g, intra) {
      if (!g) return;
      if (intra) { var h = r2(g / 2); line('gst-out-cgst', 0, h); line('gst-out-sgst', 0, g - h); } else line('gst-out-igst', 0, g);
    }
    if (!farmer || !(c.value > 0)) return [];
    /* buyer side: owes the total; no buyer named = paid at once in the mode typed for "received" */
    if (cust) line('party', c.buyerTotal, 0, { party: cust, side: 'recv' });
    else line(MONEY[d.rmode] || 'cash', c.buyerTotal, 0);
    /* farmer is owed the net */
    line('party', 0, c.farmerNet, { party: farmer, side: 'pay' });
    var inc = c.incF + c.incB, pay = c.payF + c.payB;
    line('inc:commission and charges earned (mandi)', 0, inc);
    line('ocl:mandi fee and charges payable', 0, pay);
    taxOut(c.gstF, c.intraF); taxOut(c.gstB, c.intraB);
    /* money moving at settlement */
    if (cust && c.recv > 0) { line(MONEY[d.rmode] || 'cash', c.recv, 0); line('party', 0, c.recv, { party: cust, side: 'recv' }); }
    if (c.paid > 0) { line('party', c.paid, 0, { party: farmer, side: 'pay' }); line(MONEY[d.pmode] || 'cash', 0, c.paid); }
    return [{ type: 'jv', no: d.no, narr: 'Mandi slip ' + (d.no || '') + ' ' + farmer, lines: L }];
  }

  /* day totals for a list of saved slips: produce, quintals, commission earned, passed on */
  function summary(docs, from, to) {
    var o = { n: 0, qtl: 0, value: 0, income: 0, fee: 0 };
    (docs || []).forEach(function (d) {
      if (d.type !== 'mandi' || from && d.date < from || to && d.date > to) return;
      var c = calc(d); o.n++; o.qtl += c.qtl; o.value += c.value; o.income += c.income; o.fee += c.fee;
    });
    o.qtl = r3(o.qtl); o.value = r2(o.value); o.income = r2(o.income); o.fee = r2(o.fee);
    return o;
  }

  /* balances of farmers and buyers from NSBooks.parties(): farmers are owed (negative), buyers owe (positive) */
  function accounts(docs, parties) {
    var role = {};
    (docs || []).forEach(function (d) {
      if (d.type !== 'mandi') return;
      if (d.buyer && d.buyer.name) role[key(d.buyer.name)] = role[key(d.buyer.name)] || 'farmer';
      if (d.cust && d.cust.name) role[key(d.cust.name)] = role[key(d.cust.name)] === 'farmer' ? 'both' : 'buyer';
    });
    return Object.keys(role).map(function (k) {
      var p = parties[k] || { name: k, bal: 0 };
      return { key: k, name: p.name || k, role: role[k], bal: r2(p.bal || 0), phone: p.phone || '' };
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  var API = { num: num, r2: r2, lot: lot, calc: calc, books: books, summary: summary, accounts: accounts, PER: PER };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSMandi = API;
})(this);
