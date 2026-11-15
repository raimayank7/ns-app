/* NSGarment: the pure logic of garment.niveshsahayak.in (garment shop bill with size and colour variants).
   A variant is an ordinary item master of the shared data home (store 'item'), so stock, GSTR-1, the App and every other tool see it:
     { desc: 'Polo T-shirt - M / Blue', base: 'Polo T-shirt', size: 'M', colour: 'Blue', variant: 1, hsn, gst, rate (price without GST), unit: 'Pcs', kind: 'goods' }
   Stock per variant is the ordinary stock register of that name (opening stock, purchases, sales). The bill is the usual items list
   (desc, qty, rate, disc, gst, hsn); tapping a size/colour cell adds one of that variant.
   Tests: node scripts/test_garment.js */
(function (G) {
  'use strict';
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function clean(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' '); }

  var SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', 'xxxl', '4xl', '5xl', 'free', 'free size', 'one size'];
  /* sizes from a typed list: commas, semicolons, new lines or slashes; duplicates (any case) dropped */
  function parseList(s) {
    var seen = {}, out = [];
    String(s == null ? '' : s).split(/[,;\n\/]+/).forEach(function (x) { x = clean(x); var k = key(x); if (x && !seen[k]) { seen[k] = 1; out.push(x); } });
    return out;
  }
  /* S, M, L, XL ... first in the usual order, then numbers from small to large, then anything else alphabetically */
  function sizeRank(s) {
    var k = key(s), i = SIZE_ORDER.indexOf(k);
    if (i >= 0) return [0, i, ''];
    var m = /^(\d+(?:\.\d+)?)/.exec(k);
    if (m) return [1, parseFloat(m[1]), k];
    return [2, 0, k];
  }
  function sizeCmp(a, b) { var x = sizeRank(a), y = sizeRank(b); return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]); }
  function sortSizes(list) { return list.slice().sort(sizeCmp); }

  /* the name a variant is stored, stocked and billed under */
  function vname(base, size, colour) {
    var tail = [clean(size), clean(colour)].filter(Boolean).join(' / ');
    return clean(base) + (tail ? ' - ' + tail : '');
  }
  /* GST usually charged on a ready-made garment, by price per piece without GST: up to 2,500 = 5%, above = 18% (checked 14 Nov 2026 from
     secondary sources; whether the limit is measured before or after tax is not settled there). Only a suggestion: the field is typed. */
  function gstFor(price) { return n(price) > 2500 ? 18 : 5; }

  /* item masters of a product: every size x colour (an empty list counts as one blank choice). Existing masters keep their id and values */
  function variantsOf(p) {
    var sizes = parseList(p.sizes), cols = parseList(p.colours), out = [];
    sortSizes(sizes);
    (sizes.length ? sortSizes(sizes) : ['']).forEach(function (sz) {
      (cols.length ? cols : ['']).forEach(function (c) {
        out.push({ desc: vname(p.name, sz, c), base: clean(p.name), size: sz, colour: c, variant: 1, hsn: clean(p.hsn), gst: p.gst === '' || p.gst == null ? String(gstFor(p.price)) : String(p.gst),
          rate: String(r2(n(p.price))), price: String(r2(n(p.price))), unit: clean(p.unit) || 'Pcs', kind: 'goods' });
      });
    });
    return out;
  }
  /* what to save for a product: new variants as they are, existing ones (same name) updated in place (id kept, price/HSN/GST refreshed) */
  function plan(p, items) {
    var by = {}; (items || []).forEach(function (m) { if (m && m.desc) by[key(m.desc)] = m; });
    var made = [], kept = 0;
    variantsOf(p).forEach(function (v) {
      var hit = by[key(v.desc)];
      if (hit) { kept++; made.push(Object.assign({}, hit, { base: v.base, size: v.size, colour: v.colour, variant: 1, hsn: v.hsn || hit.hsn, gst: v.gst, rate: v.rate, price: v.price, unit: v.unit })); }
      else made.push(v);
    });
    return { items: made, fresh: made.length - kept, updated: kept };
  }
  function problems(p) {
    var out = [];
    if (!clean(p.name)) out.push('name');
    else if (clean(p.name).length > 50) out.push('long');
    if (!(n(p.price) > 0)) out.push('price');
    if (p.gst !== '' && p.gst != null && (n(p.gst) < 0 || n(p.gst) > 40)) out.push('gst');
    var s = parseList(p.sizes).length, c = parseList(p.colours).length;
    if (!s && !c) out.push('variants');
    if (Math.max(s, 1) * Math.max(c, 1) > 150) out.push('many');
    return out;
  }

  /* products of the item masters: [{ name, sizes (in order), colours, variants }], newest base name order alphabetical */
  function products(items) {
    var by = {}, order = [];
    (items || []).forEach(function (m) {
      if (!m || !m.variant || !clean(m.base)) return;
      var k = key(m.base), p = by[k];
      if (!p) { p = by[k] = { name: clean(m.base), key: k, sizes: [], colours: [], variants: [], hsn: m.hsn || '', gst: m.gst, price: m.rate }; order.push(k); }
      p.variants.push(m);
      if (clean(m.size) && !p.sizes.some(function (x) { return key(x) === key(m.size); })) p.sizes.push(clean(m.size));
      if (clean(m.colour) && !p.colours.some(function (x) { return key(x) === key(m.colour); })) p.colours.push(clean(m.colour));
    });
    return order.map(function (k) { var p = by[k]; p.sizes = sortSizes(p.sizes); return p; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'en', { numeric: true }); });
  }
  function findVariant(p, size, colour) {
    return (p.variants || []).filter(function (m) { return key(m.size) === key(size) && key(m.colour) === key(colour); })[0] || null;
  }
  /* the grid shown on the bill: rows = colours (one blank row when the product has none), columns = sizes (one blank column likewise).
     stock: { <name key>: grams-free quantity in hand }, onBill: { <name key>: quantity already on this bill } */
  function grid(p, stock, onBill) {
    var rows = p.colours.length ? p.colours : [''], cols = p.sizes.length ? p.sizes : [''];
    return { cols: cols, rows: rows.map(function (c) {
      return { colour: c, cells: cols.map(function (s) {
        var v = findVariant(p, s, c), k = v ? key(v.desc) : '';
        var have = k && stock && stock[k] != null ? stock[k] : null, bill = k && onBill && onBill[k] || 0;
        return { v: v, size: s, colour: c, have: have, bill: bill, left: have == null ? null : r2(have - bill), out: have != null && have - bill <= 0 };
      }) };
    }) };
  }
  /* stock in hand by name key from NSStock.summary(...).items */
  function stockMap(rows) { var m = {}; (rows || []).forEach(function (r) { m[key(r.name)] = r.close; }); return m; }
  function billMap(rows) { var m = {}; (rows || []).forEach(function (r) { var k = key(r.desc); if (k) m[k] = r2((m[k] || 0) + n(r.qty)); }); return m; }

  function isBlank(row) { return !clean(row.desc) && !n(row.rate); }
  /* tap: one more of the variant; joins a line of the same name and price; a lone empty line is replaced. mk() makes an empty line */
  function tap(rows, v, mk, incl) {
    var k = key(v.desc), price = n(v.price != null && v.price !== '' ? v.price : v.rate), i;
    for (i = rows.length - 1; i >= 0; i--) if (key(rows[i].desc) === k) { rows[i].qty = String(r2(n(rows[i].qty) + 1)); return rows; }
    var row = mk(); row.desc = v.desc; row.hsn = v.hsn || row.hsn; row.unit = v.unit || 'Pcs'; row.qty = '1'; row.gst = v.gst != null && v.gst !== '' ? v.gst : row.gst; row.price = String(price);
    row.rate = rateOf(price, row.gst, incl);
    for (i = rows.length - 1; i >= 0; i--) if (isBlank(rows[i])) rows.splice(i, 1);
    rows.push(row); return rows;
  }
  function minus(rows, desc, mk) {
    var k = key(desc), i;
    for (i = rows.length - 1; i >= 0; i--) if (key(rows[i].desc) === k && n(rows[i].qty) > 0) {
      var q = r2(n(rows[i].qty) - 1);
      if (q > 0) rows[i].qty = String(q); else rows.splice(i, 1);
      if (!rows.length) rows.push(mk());
      return true;
    }
    return false;
  }
  /* price typed or shown to the customer -> the rate the books use (without GST); incl = prices include GST */
  function rateOf(price, gst, incl) { var p = n(price), g = n(gst); return p ? String(Math.round((incl && g ? p / (1 + g / 100) : p) * 10000) / 10000) : ''; }

  /* bill totals, like every item bill: line = qty x rate less discount %, GST per line, CGST+SGST or IGST, rounded to the rupee */
  function sums(d) {
    var tax = d.kind === 'tax', o = { rows: [], qty: 0, mrp: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, byRate: {}, disc: 0 };
    var origin = d.seller && d.seller.state, dest = d.buyer && d.buyer.state || origin;
    o.intra = !origin || !dest || origin === dest;
    (d.items || []).forEach(function (it) {
      var q = n(it.qty), r = n(it.rate); if (!clean(it.desc) && !r) return;
      var gross = r2(q * r), dsc = r2(gross * n(it.disc) / 100), v = r2(gross - dsc), g = tax ? n(it.gst) : 0, tx = r2(v * g / 100);
      o.rows.push({ it: it, gross: gross, value: v, g: g, tax: tx, mrp: d.incl ? r2(q * n(it.price)) : r2(q * r) });
      o.qty += q; o.taxable += v; o.tax += tx; o.disc += dsc;
      if (tax) { var b = o.byRate[g] || (o.byRate[g] = { taxable: 0, tax: 0 }); b.taxable += v; b.tax += tx; }
    });
    o.qty = r2(o.qty); o.taxable = r2(o.taxable); o.tax = r2(o.tax); o.disc = r2(o.disc);
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = d.round === false ? 0 : r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    return o;
  }

  /* label sheet: one label per piece wanted. qtyOf(variant) says how many; default one each */
  function labels(vs, qtyOf) {
    var out = [];
    (vs || []).forEach(function (v) {
      var q = Math.max(0, Math.floor(qtyOf ? qtyOf(v) : 1)); if (q > 200) q = 200;
      for (var i = 0; i < q; i++) out.push({ name: v.base || v.desc, size: v.size || '', colour: v.colour || '', price: v.price != null && v.price !== '' ? v.price : v.rate, code: v.code || '' });
    });
    return out;
  }
  /* CSV of products and variants for Excel */
  function variantRows(items, stock) {
    var rows = [['Product', 'Size', 'Colour', 'Full name', 'HSN', 'GST %', 'Price (without GST)', 'In stock']];
    products(items).forEach(function (p) { p.variants.sort(function (a, b) { return sizeCmp(a.size, b.size) || key(a.colour).localeCompare(key(b.colour)); }).forEach(function (v) {
      var k = key(v.desc); rows.push([p.name, v.size || '', v.colour || '', v.desc, v.hsn || '', v.gst, v.rate, stock && stock[k] != null ? stock[k] : '']);
    }); });
    return rows;
  }

  var API = { n: n, r2: r2, key: key, parseList: parseList, sortSizes: sortSizes, sizeCmp: sizeCmp, vname: vname, gstFor: gstFor, variantsOf: variantsOf, plan: plan, problems: problems,
    products: products, findVariant: findVariant, grid: grid, stockMap: stockMap, billMap: billMap, isBlank: isBlank, tap: tap, minus: minus, rateOf: rateOf, sums: sums, labels: labels, variantRows: variantRows };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSGarment = API;
})(this);
