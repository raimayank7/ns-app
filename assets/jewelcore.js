/* NSJewel: the pure logic of jewellery.niveshsahayak.in (jeweller's bill).
   A bill line is one ornament: metal + purity, gross / stone / net weight, wastage, rate per gram, making charges, stone value.
   Its taxable value = chargeable weight x rate + making + stone - discount. For the books and the stock register the line also carries
   the plain fields every other tool reads: qty = net weight in grams (unit 'g'), rate = value / qty, gst, hsn, and stk = the stock name
   of the metal and purity ("Gold 22K (916)"), so stock is kept by weight of each metal and purity.
   Old gold taken in exchange: lines { metal, purity, gross, cut % (melting / impurity deduction), rate per g }; value = net weight x rate.
   The bill's GST is on the FULL value of the new ornaments; old gold value is taken off the amount to pay (d.exch), see books.js.
   Tests: node scripts/test_jewel.js */
(function (G) {
  'use strict';
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function r3(x) { return Math.round((x + Number.EPSILON) * 1000) / 1000; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }

  /* metals and the usual purities (fineness in parts per thousand) */
  var METALS = {
    g: { name: 'Gold', hsn: '7113', purities: [['999', '24K (999)'], ['916', '22K (916)'], ['875', '21K (875)'], ['750', '18K (750)'], ['585', '14K (585)'], ['417', '10K (417)']] },
    s: { name: 'Silver', hsn: '7113', purities: [['999', '999 fine'], ['925', '925 sterling'], ['800', '800']] },
    p: { name: 'Platinum', hsn: '7113', purities: [['950', '950']] },
    o: { name: 'Other (diamond, stone, artificial)', hsn: '7113', purities: [['', '-']] }
  };
  var K_LABEL = { '999': '24K', '916': '22K', '875': '21K', '750': '18K', '585': '14K', '417': '10K' };
  /* the name stock is kept under for a metal and purity: "Gold 22K (916)", "Silver 925" */
  function stockName(metal, purity) {
    var m = METALS[metal] || METALS.o;
    if (metal === 'g') return 'Gold ' + (K_LABEL[purity] ? K_LABEL[purity] + ' (' + purity + ')' : purity || '');
    if (metal === 'o' || !purity) return m.name.split(' ')[0];
    return m.name + ' ' + purity;
  }
  function stockNames() {
    var out = [];
    ['g', 's', 'p'].forEach(function (m) { METALS[m].purities.forEach(function (p) { out.push(stockName(m, p[0])); }); });
    return out;
  }
  /* pure metal in a weight: net weight x fineness / 1000 */
  function pure(net, purity) { var f = n(purity); return f ? r3(n(net) * f / 1000) : 0; }
  /* net weight: gross minus stone weight (never below 0); a typed net weight is used when there is no gross */
  function netOf(it) {
    var g = n(it.gross);
    if (g > 0) return Math.max(0, r3(g - n(it.stoneWt)));
    return Math.max(0, r3(n(it.net)));
  }
  /* value of one ornament line */
  function line(it) {
    var net = netOf(it), wast = n(it.wast), chg = r3(net * (1 + wast / 100)), rate = n(it.mrate);
    var metal = r2(chg * rate), mk = n(it.mk), mkType = it.mkt || 'pg', making;
    if (mkType === 'pct') making = r2(metal * mk / 100); else if (mkType === 'flat') making = r2(mk); else making = r2(net * mk);
    var stone = r2(n(it.stoneVal)), ld = r2(n(it.ld));
    var value = r2(metal + making + stone - ld);
    return { net: net, chg: chg, metal: metal, making: making, stone: stone, ld: ld, value: value, pure: pure(net, it.purity) };
  }
  function isBlank(it) { return !String(it.desc || '').trim() && !n(it.gross) && !n(it.net) && !n(it.mk) && !n(it.stoneVal); }

  /* the plain fields the books, GSTR-1 and the stock register read (call after every change of a line) */
  function sync(it, taxOn) {
    var l = line(it), q = l.net > 0 ? l.net : n(it.pcs) || 1;
    it.qty = String(q); it.unit = l.net > 0 ? 'g' : 'Nos';
    it.rate = q ? String(Math.round(l.value / q * 1e6) / 1e6) : '';
    it.disc = '';
    it.stk = l.net > 0 && it.metal !== 'o' ? stockName(it.metal, it.purity) : '';
    return it;
  }

  /* bill totals. d: { kind: tax|supply|plain, items, old, round, seller.state, buyer.state } */
  function sums(d) {
    var tax = d.kind === 'tax', o = { rows: [], metal: 0, making: 0, stone: 0, ld: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, byRate: {}, weight: 0, pure: 0 };
    var origin = d.seller && d.seller.state, dest = d.buyer && d.buyer.state || origin;
    o.intra = !origin || !dest || origin === dest;
    (d.items || []).forEach(function (it) {
      if (isBlank(it)) return;
      var l = line(it), g = tax ? n(it.gst) : 0, tx = r2(l.value * g / 100);
      o.rows.push({ it: it, l: l, g: g, tax: tx });
      o.metal += l.metal; o.making += l.making; o.stone += l.stone; o.ld += l.ld; o.taxable += l.value; o.tax += tx; o.weight += l.net; o.pure += l.pure;
      if (tax) { var b = o.byRate[g] || (o.byRate[g] = { taxable: 0, tax: 0 }); b.taxable += l.value; b.tax += tx; }
    });
    ['metal', 'making', 'stone', 'ld', 'taxable', 'tax'].forEach(function (k) { o[k] = r2(o[k]); });
    o.weight = r3(o.weight); o.pure = r3(o.pure);
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax);
    o.roundOff = d.round === false ? 0 : r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    var ox = oldSums(d.old); o.old = ox; o.exch = ox.total;
    o.pay = r2(o.total - o.exch);   /* amount to pay; negative = the jeweller pays the difference */
    return o;
  }

  /* old gold / silver taken in exchange */
  function oldLine(x) {
    var gross = n(x.gross), cut = Math.min(100, Math.max(0, n(x.cut))), net = r3(gross * (1 - cut / 100)), rate = n(x.rate);
    return { gross: gross, net: net, value: r2(net * rate), pure: pure(net, x.purity) };
  }
  function oldSums(list) {
    var o = { rows: [], total: 0, net: 0, gross: 0 };
    (list || []).forEach(function (x) {
      if (!n(x.gross) && !n(x.rate) && !String(x.desc || '').trim()) return;
      var l = oldLine(x); o.rows.push({ x: x, l: l }); o.total += l.value; o.net += l.net; o.gross += l.gross;
    });
    o.total = r2(o.total); o.net = r3(o.net); o.gross = r3(o.gross);
    return o;
  }
  /* the fields stored on the saved bill for the books and the stock register: old gold lines become stock-in lines (cost = value per gram) */
  function oldForRecord(list) {
    return (list || []).filter(function (x) { return n(x.gross) > 0; }).map(function (x) {
      var l = oldLine(x);
      return Object.assign({}, x, { net: String(l.net), value: String(l.value), stk: stockName(x.metal || 'g', x.purity), unit: 'g' });
    });
  }

  /* the day's rate board: a rate per gram for each metal and purity. rateFor gives the rate a new line starts with */
  function rateFor(board, metal, purity) { board = board || {}; return board[metal + purity] != null ? String(board[metal + purity]) : ''; }

  /* HUID: 6 letters or digits */
  function huidOk(h) { h = String(h || '').trim(); return !h || /^[A-Z0-9]{6}$/i.test(h); }

  /* stock in grams of each metal and purity from the stock register (NSStock.summary rows): only the metal names, in a fixed order */
  function weightStock(rows) {
    var order = stockNames(), byKey = {};
    (rows || []).forEach(function (r) { byKey[key(r.name)] = r; });
    return order.map(function (nm) {
      var r = byKey[key(nm)]; if (!r) return null;
      var f = /\((\d{3})\)/.exec(nm) || /(\d{3})$/.exec(nm);
      return { name: nm, open: r.open, inq: r.inq, outq: r.outq, adj: r.adj, close: r.close, value: r.value, pure: f ? pure(Math.max(0, r.close), f[1]) : 0 };
    }).filter(Boolean);
  }

  var API = { n: n, r2: r2, r3: r3, METALS: METALS, stockName: stockName, stockNames: stockNames, pure: pure, netOf: netOf, line: line, sync: sync, sums: sums, isBlank: isBlank,
    oldLine: oldLine, oldSums: oldSums, oldForRecord: oldForRecord, rateFor: rateFor, huidOk: huidOk, weightStock: weightStock };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSJewel = API;
})(this);
