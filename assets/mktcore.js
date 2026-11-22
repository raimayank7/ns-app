/* NSMkt: marketplace sales reports and payment-gateway reports, read into entries for the books (NSBiz Helper phase 7).
   Pure functions, no screen (mktimp.js is the screen; node scripts/test_mktimp.js tests this file).

   Sales / tax reports (the marketplace makes the invoices for the seller, so the seller's books need them):
     Amazon.in Merchant Tax Report (MTR B2C / B2B), Flipkart Sales Report, Meesho tcs_sales / tcs_sales_return,
     or any report with an invoice no., date, state, taxable value and GST (found by the headings).
     Headings follow docs/marketplace-reports.md in the add-on repo (Amazon: official column list + a real March 2026 file;
     Meesho: a real June 2026 file; Flipkart: two independent import tools, no official sample).
   Payment-gateway reports (money a customer paid through the gateway, less its fee):
     Razorpay settlement recon / payments, Paytm settlement report, PhonePe settlement report (official column lists).

   kind(rows)                   -> { src, type: 'sales'|'pay', head (header row index) } or null
   sales(rows, k, opt)          -> { lines, skipped }   one line per invoice line: { inv, date, order, pos, gstin, buyer, hsn, qty, taxable, rate, igst, cgst, sgst, tcs, ret, orig }
   salesDocs(lines, opt)        -> documents (invoices, credit notes) for NSStore, one per marketplace invoice / credit note
   tcsCheck(lines)              -> by month: taxable sales, returns, TCS in the report, TCS at 0.5 %
   table14(lines)               -> GSTR-1 Table 14(a) figures by month (supplies through the marketplace)
   pays(rows, k, opt)           -> { lines }   one line per payment: { id, date, amount, fee, gst, net, ref, utr, settled, email, phone, refund }
   matchPays(pays, bills, parties) -> each payment with the open sale bill it most likely pays, and how sure */
(function (G) {
  'use strict';
  function s(v) { return String(v == null ? '' : v).trim(); }
  function key(v) { return s(v).toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim(); }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var t = s(v), neg = /^\(.*\)$/.test(t) || /^-/.test(t);
    t = t.replace(/[^0-9.]/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? (neg ? -n : n) : 0;
  }
  var STATES = (G.NS && G.NS.STATES) || [['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'],
    ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'], ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'],
    ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
    ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'], ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'], ['33', 'Tamil Nadu'],
    ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh'], ['97', 'Other Territory']];
  var SBYNAME = {};
  STATES.forEach(function (x) { SBYNAME[key(x[1])] = x[0]; });
  /* the names marketplace files use that differ from the official list */
  [['orissa', '21'], ['pondicherry', '34'], ['new delhi', '07'], ['nct of delhi', '07'], ['jammu kashmir', '01'], ['j k', '01'], ['andaman nicobar', '35'], ['andaman nicobar islands', '35'],
    ['dadra and nagar haveli', '26'], ['daman and diu', '26'], ['dadra nagar haveli', '26'], ['daman diu', '26'], ['the dadra and nagar haveli and daman and diu', '26'], ['uttaranchal', '05'], ['chattisgarh', '22'],
    ['telengana', '36'], ['tamilnadu', '33']].forEach(function (x) { SBYNAME[x[0]] = x[1]; });
  function stateCode(v) {
    var t = key(v); if (!t) return '';
    if (/^\d{1,2}$/.test(t)) return ('0' + t).slice(-2);
    if (SBYNAME[t]) return SBYNAME[t];
    var t2 = t.replace(/^state of /, '').replace(/ state$/, '').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
    var hit = Object.keys(SBYNAME).filter(function (k) { return k.replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim() === t2; })[0];
    return hit ? SBYNAME[hit] : '';
  }
  function gstinOk(g) { return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s(g).toUpperCase()); }
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  /* a date in any of the forms these files use -> yyyy-mm-dd ('' when not a date). Excel serial numbers too. */
  function isoDate(v) {
    if (typeof v === 'number' && v > 20000 && v < 80000) { var d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
    var t = s(v); if (!t) return '';
    var m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);   /* dd/mm/yyyy: Indian files */
    m = t.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[a-z]*[\s\-,]+(\d{4})/); if (m && MON[m[2].toLowerCase()]) return m[3] + '-' + ('0' + MON[m[2].toLowerCase()]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    m = t.match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})/); if (m && MON[m[1].toLowerCase()]) return m[3] + '-' + ('0' + MON[m[1].toLowerCase()]).slice(-2) + '-' + ('0' + m[2]).slice(-2);
    if (/^\d{10}(\d{3})?$/.test(t)) { var u = +t; return new Date(t.length === 13 ? u : u * 1000).toISOString().slice(0, 10); }   /* Unix time (Razorpay API style) */
    return '';
  }
  /* GST % from a rate cell: 0.09 (fraction) or 9 (percent) */
  function pct(v) { var n = num(v); return n > 0 && n < 1 ? r2(n * 100) : r2(n); }

  /* ---------- which report is this ---------- */
  var KINDS = [
    { src: 'amazon', type: 'sales', name: 'Amazon Merchant Tax Report', need: ['invoice number', 'transaction type', 'tax exclusive gross', 'ship to state'] },
    { src: 'flipkart', type: 'sales', name: 'Flipkart Sales Report', need: ['order item id', 'event type', 'customer s delivery state'] },
    { src: 'meesho', type: 'sales', name: 'Meesho GST report (tcs_sales)', need: ['sub order num', 'total taxable sale value', 'end customer state new'] },
    { src: 'meesho', type: 'sales', name: 'Meesho GST report (older layout)', need: ['sub order num', 'tcs taxable amount', 'end customer state new'] },
    { src: 'razorpay', type: 'pay', name: 'Razorpay report', need: ['entity id', 'fee', 'tax'], any: ['settlement utr', 'settlement id', 'amount'] },
    { src: 'razorpay', type: 'pay', name: 'Razorpay payments', need: ['id', 'amount', 'fee', 'tax', 'status'], any: ['email', 'contact'] },
    { src: 'paytm', type: 'pay', name: 'Paytm settlement report', need: ['transaction id', 'amount', 'commission', 'settled amount'] },
    { src: 'phonepe', type: 'pay', name: 'PhonePe settlement report', need: ['phonepereferenceid', 'amount', 'fee'] },
    { src: 'amazonpay', type: 'none', name: 'Amazon payments (Date Range) report: open it in the Marketplace payout tool', need: ['settlement id', 'product sales', 'total'] },
    { src: 'flipkartpay', type: 'none', name: 'Flipkart payments report: open it in the Marketplace payout tool', need: ['neft id', 'bank settlement value rs'] }
  ];
  function heads(r) { return (r || []).map(key); }
  function kind(rows) {
    for (var i = 0; i < Math.min(40, (rows || []).length); i++) {
      var h = heads(rows[i]);
      for (var j = 0; j < KINDS.length; j++) {
        var k = KINDS[j];
        if (k.need.every(function (n) { return h.indexOf(n) >= 0; }) && (!k.any || k.any.some(function (n) { return h.indexOf(n) >= 0; })))
          return { src: k.src, type: k.type, name: k.name, head: i };
      }
    }
    return generic(rows);
  }
  /* any other sales register: invoice no., date, state, taxable value, and a rate or tax amounts */
  var GEN = [['inv', /^(invoice|bill|document|voucher)\s*(no|number|id)?$|^invoice\s*(no|number)/], ['date', /^(invoice|bill|document)?\s*date$/], ['pos', /place of supply|^(ship to |delivery |customer s )?state$|^pos$/],
    ['taxable', /^taxable( value| amount)?$|taxable value/], ['rate', /^(gst|tax)\s*(rate|%)|^rate$/], ['igst', /^igst( amount)?$/], ['cgst', /^cgst( amount)?$/], ['sgst', /^(sgst|utgst|sgst utgst)( amount)?$/],
    ['gstin', /gstin|gst no|customer gst/], ['buyer', /^(customer|buyer|party)( name)?$/], ['hsn', /hsn/], ['qty', /^(qty|quantity)$/], ['type', /^(type|transaction type|document type)$/]];
  function genMap(h) { var m = {}; h.forEach(function (x, i) { GEN.some(function (g) { if (m[g[0]] == null && g[1].test(x)) { m[g[0]] = i; return true; } return false; }); }); return m; }
  function generic(rows) {
    for (var i = 0; i < Math.min(40, (rows || []).length); i++) {
      var m = genMap(heads(rows[i]));
      if (m.inv != null && m.date != null && m.taxable != null && (m.rate != null || m.igst != null || m.cgst != null)) return { src: 'other', type: 'sales', name: 'Sales register (found by its headings)', head: i, map: m };
    }
    return null;
  }

  /* ---------- sales reports -> lines ---------- */
  function col(h) { return function (name) { var i = h.indexOf(key(name)); return i; }; }
  function sales(rows, k, opt) {
    opt = opt || {};
    var h = heads(rows[k.head]), C = col(h), lines = [], skipped = { other: 0, cancel: 0, empty: 0 }, myG = s(opt.gstin).toUpperCase(), myS = s(opt.state) || (myG ? myG.slice(0, 2) : '');
    function get(r, name) { var i = typeof name === 'number' ? name : C(name); return i >= 0 && i != null ? r[i] : ''; }
    function first(r, names) { for (var i = 0; i < names.length; i++) { var v = get(r, names[i]); if (s(v) !== '') return v; } return ''; }
    rows.slice(k.head + 1).forEach(function (r) {
      if (!r || !r.some(function (c) { return s(c); })) return;
      var L = { src: k.src };
      if (k.src === 'amazon') {
        var tt = key(get(r, 'Transaction Type'));
        if (/cancel/.test(tt)) { skipped.cancel++; return; }
        var sg = s(get(r, 'Seller Gstin')).toUpperCase();
        if (myG && sg && sg !== myG) { skipped.other++; return; }
        L.ret = /refund|return/.test(tt);
        L.inv = s(L.ret && s(get(r, 'Credit Note No')) ? get(r, 'Credit Note No') : get(r, 'Invoice Number'));
        L.orig = L.ret ? { no: s(get(r, 'Invoice Number')), date: isoDate(get(r, 'Invoice Date')) } : null;
        L.date = isoDate(L.ret && s(get(r, 'Credit Note Date')) ? get(r, 'Credit Note Date') : get(r, 'Invoice Date'));
        L.order = s(get(r, 'Order Id')); L.pos = stateCode(get(r, 'Ship To State')); L.hsn = s(get(r, 'Hsn/sac')); L.qty = Math.abs(num(get(r, 'Quantity'))) || 1;
        L.desc = s(get(r, 'Item Description'));
        L.taxable = num(get(r, 'Tax Exclusive Gross'));
        var tot = num(get(r, 'Total Tax Amount')), ig = num(get(r, 'Igst Rate'));
        L.rate = pct(ig) || r2(pct(get(r, 'Cgst Rate')) + pct(get(r, 'Sgst Rate')) + pct(get(r, 'Utgst Rate')));
        if (ig) { L.igst = tot; L.cgst = 0; L.sgst = 0; } else { L.igst = 0; L.cgst = r2(tot / 2); L.sgst = r2(tot - r2(tot / 2)); }
        L.tcs = num(get(r, 'Tcs Cgst Amount')) + num(get(r, 'Tcs Sgst Amount')) + num(get(r, 'Tcs Utgst Amount')) + num(get(r, 'Tcs Igst Amount'));
        L.gstin = s(get(r, 'Customer Bill To Gstid')).toUpperCase(); L.buyer = s(get(r, 'Buyer Name'));
      } else if (k.src === 'flipkart') {
        var ev = key(get(r, 'Event Type')) + ' ' + key(get(r, 'Event Sub Type'));
        var sgf = s(get(r, 'Seller GSTIN')).toUpperCase();
        if (myG && sgf && sgf !== myG) { skipped.other++; return; }
        if (/cancel/.test(ev) && !/return/.test(ev)) { skipped.cancel++; return; }
        L.taxable = num(get(r, 'Taxable Value (Final Invoice Amount -Taxes)') || first(r, ['Taxable Value']));
        L.ret = /return/.test(ev) || L.taxable < 0;
        L.inv = s(get(r, 'Buyer Invoice ID')) || s(get(r, 'Order Item ID'));
        L.date = isoDate(first(r, ['Buyer Invoice Date', 'Order Date']));
        L.order = s(get(r, 'Order Item ID')) || s(get(r, 'Order ID'));
        L.pos = stateCode(get(r, "Customer's Delivery State")) || stateCode(get(r, "Customer's Billing State"));
        L.hsn = s(get(r, 'HSN Code')); L.qty = Math.abs(num(get(r, 'Item Quantity'))) || 1; L.desc = s(get(r, 'Product Title/Description'));
        L.igst = num(get(r, 'IGST Amount')); L.cgst = num(get(r, 'CGST Amount')); L.sgst = num(get(r, 'SGST Amount (Or UTGST as applicable)'));
        L.rate = pct(get(r, 'IGST Rate')) || r2(pct(get(r, 'CGST Rate')) + pct(get(r, 'SGST Rate (or UTGST as applicable)')));
        L.tcs = num(get(r, 'Total TCS Deducted'));
        L.gstin = s(get(r, 'Business GST Number')).toUpperCase(); L.buyer = s(get(r, 'Business Name'));
        L.orig = L.ret ? { no: L.inv, date: '' } : null;
        if (L.ret) L.inv = 'R-' + L.inv;   /* a return gets its own credit note no. */
      } else if (k.src === 'meesho') {
        var rr = opt.isReturn || C('cancel_return_date') >= 0 || /return/.test(key(get(r, 'transaction_type')));
        L.ret = !!rr;
        L.taxable = num(first(r, ['total_taxable_sale_value', 'tcs_taxable_amount']));
        L.rate = pct(get(r, 'gst_rate'));
        var tx = num(get(r, 'tax_amount')) || r2(Math.abs(L.taxable) * L.rate / 100);
        L.pos = stateCode(first(r, ['end_customer_state_new', 'end_customer_state']));
        var inter = myS && L.pos ? myS !== L.pos : true;
        L.igst = inter ? tx : 0; L.cgst = inter ? 0 : r2(tx / 2); L.sgst = inter ? 0 : r2(tx - r2(tx / 2));
        L.order = s(first(r, ['sub_order_num', 'order_num']));
        L.inv = (L.ret ? 'R-' : '') + L.order;
        L.date = isoDate(L.ret ? first(r, ['cancel_return_date', 'order_date']) : get(r, 'order_date'));
        L.hsn = s(get(r, 'hsn_code')); L.qty = Math.abs(num(get(r, 'quantity'))) || 1; L.desc = '';
        L.tcs = 0; L.tcsMissing = true;   /* Meesho's file has no TCS column */
        L.eco = s(get(r, 'eco_tcs_gstin')).toUpperCase();
        L.orig = L.ret ? { no: L.order, date: isoDate(get(r, 'order_date')) } : null;
        L.gstin = ''; L.buyer = '';
      } else {   /* other sales register */
        var m = k.map, ty = key(get(r, m.type));
        L.taxable = num(get(r, m.taxable)); L.ret = /return|credit/.test(ty) || L.taxable < 0;
        L.inv = s(get(r, m.inv)); L.date = isoDate(get(r, m.date)); L.pos = stateCode(get(r, m.pos)); L.hsn = s(get(r, m.hsn)); L.qty = Math.abs(num(get(r, m.qty))) || 1; L.desc = '';
        L.igst = num(get(r, m.igst)); L.cgst = num(get(r, m.cgst)); L.sgst = num(get(r, m.sgst));
        L.rate = m.rate != null ? pct(get(r, m.rate)) : (Math.abs(L.taxable) ? r2((Math.abs(L.igst) + Math.abs(L.cgst) + Math.abs(L.sgst)) * 100 / Math.abs(L.taxable)) : 0);
        L.gstin = s(get(r, m.gstin)).toUpperCase(); L.buyer = s(get(r, m.buyer)); L.tcs = 0; L.orig = null; L.order = '';
      }
      ['taxable', 'igst', 'cgst', 'sgst', 'tcs'].forEach(function (f) { L[f] = r2(Math.abs(num(L[f]))); });
      if (!L.inv || !L.date || !L.taxable) { skipped.empty++; return; }
      if (!gstinOk(L.gstin)) L.gstin = '';
      if (L.gstin && !L.pos) L.pos = L.gstin.slice(0, 2);
      lines.push(L);
    });
    return { lines: lines, skipped: skipped };
  }

  /* ---------- lines -> documents ----------
     opt: { seller (the business record as saved on documents), party (the marketplace's party name), src name }
     One document per invoice / credit note no.; one item per GST rate and HSN, qty 1 at the taxable value (the
     marketplace's own invoice is the real one; this is its copy in the books). The buyer is the marketplace (it collects
     the money); a business buyer's GSTIN is kept so GSTR-1 puts the invoice in B2B. */
  function salesDocs(lines, opt) {
    opt = opt || {};
    var by = {}, order = [];
    lines.forEach(function (L) {
      var k = (L.ret ? 'R|' : 'S|') + L.inv;
      if (!by[k]) { by[k] = { L: L, items: {}, keys: [], tcs: 0 }; order.push(k); }
      var g = by[k], ik = L.rate + '|' + (L.hsn || '');
      if (!g.items[ik]) { g.items[ik] = { taxable: 0, qty: 0, rate: L.rate, hsn: L.hsn || '', desc: L.desc || '' }; g.keys.push(ik); }
      g.items[ik].taxable = r2(g.items[ik].taxable + L.taxable); g.items[ik].qty += L.qty || 1;
      g.tcs = r2(g.tcs + (L.tcs || 0));
    });
    var src = opt.srcName || 'marketplace';
    return order.map(function (k) {
      var g = by[k], L = g.L;
      var items = g.keys.map(function (ik) {
        var it = g.items[ik];
        return { desc: (L.ret ? 'Return through ' : 'Sold through ') + src + (it.desc ? ': ' + it.desc.slice(0, 80) : '') + (it.qty > 1 ? ' (' + it.qty + ' pcs)' : ''), hsn: it.hsn, qty: 1, unit: 'Nos', rate: it.taxable, disc: '', gst: it.rate };
      });
      var buyer = { name: opt.party || src, addr: '', city: '', pin: '', state: L.pos || '', gstin: L.gstin || '', phone: '' };
      if (L.buyer) buyer.legal = L.buyer;
      var d = { type: L.ret ? 'note' : 'invoice', kind: L.ret ? 'credit' : 'tax', no: L.inv, date: L.date, pos: L.pos || '', rc: false, ref: L.order ? 'Order ' + L.order : '',
        seller: opt.seller || {}, buyer: buyer, ship: null, items: items, round: false, withGst: true, status: 'unpaid', notes: 'Copy of the ' + src + ' invoice, read from its report on ' + (opt.today || '') + '.',
        total: r2(items.reduce(function (a, it) { return a + it.rate * (1 + (+it.gst || 0) / 100); }, 0)), paper: 'a4', design: 'classic', copies: 1, mkt: { src: L.src, tcs: g.tcs, order: L.order || '', eco: L.eco || '' } };
      if (L.ret) { d.side = 'sale'; d.reason = 'ret'; d.orig = L.orig || { no: '', date: '' }; }
      return d;
    });
  }

  /* ---------- TCS: what the report says the marketplace kept, and what 0.5 % of the net sales would be (s.52 CGST Act,
     0.25 % + 0.25 % or 0.5 % IGST from 10 July 2024, Notification 15/2024-Central Tax) ---------- */
  var TCS_RATE = 0.5;
  function months(lines) { var o = {}; lines.forEach(function (L) { o[L.date.slice(0, 7)] = 1; }); return Object.keys(o).sort(); }
  function tcsCheck(lines) {
    return months(lines).map(function (m) {
      var x = { month: m, sales: 0, returns: 0, tcs: 0, missing: false };
      lines.forEach(function (L) { if (L.date.slice(0, 7) !== m) return; if (L.ret) { x.returns = r2(x.returns + L.taxable); x.tcs = r2(x.tcs - (L.tcs || 0)); } else { x.sales = r2(x.sales + L.taxable); x.tcs = r2(x.tcs + (L.tcs || 0)); } if (L.tcsMissing) x.missing = true; });
      x.net = r2(x.sales - x.returns); x.expected = r2(x.net * TCS_RATE / 100); x.diff = x.missing ? null : r2(x.tcs - x.expected);
      return x;
    });
  }
  /* GSTR-1 Table 14(a): supplies made through an e-commerce operator who collects TCS, by month (net of returns). The
     same sales also stay in the B2B / B2C tables; Table 14 is a summary by the marketplace's GSTIN (typed by the seller,
     or from Meesho's file). */
  function table14(lines, myState) {
    return months(lines).map(function (m) {
      var x = { month: m, taxable: 0, igst: 0, cgst: 0, sgst: 0, eco: '' };
      lines.forEach(function (L) {
        if (L.date.slice(0, 7) !== m) return; var sg = L.ret ? -1 : 1;
        x.taxable = r2(x.taxable + sg * L.taxable); x.igst = r2(x.igst + sg * L.igst); x.cgst = r2(x.cgst + sg * L.cgst); x.sgst = r2(x.sgst + sg * L.sgst);
        if (L.eco && !x.eco) x.eco = L.eco;
      });
      return x;
    });
  }

  /* ---------- payment-gateway reports -> payments ---------- */
  function pays(rows, k, opt) {
    opt = opt || {};
    var h = heads(rows[k.head]), C = col(h), out = [], paise = !!opt.paise;
    function get(r, name) { var i = C(name); return i >= 0 ? r[i] : ''; }
    function first(r, names) { for (var i = 0; i < names.length; i++) { var v = get(r, names[i]); if (s(v) !== '') return v; } return ''; }
    function amt(v) { var n = num(v); return paise ? r2(n / 100) : r2(n); }
    rows.slice(k.head + 1).forEach(function (r) {
      if (!r || !r.some(function (c) { return s(c); })) return;
      var P = { src: k.src };
      if (k.src === 'razorpay') {
        var ty = key(first(r, ['type', 'entity']));
        if (ty && !/payment|refund/.test(ty)) return;   /* transfers, adjustments: not a customer's payment */
        var st = key(get(r, 'status')); if (st && !/captured|settled|processed/.test(st)) return;
        P.refund = /refund/.test(ty);
        P.id = s(first(r, ['entity_id', 'id'])); P.date = isoDate(first(r, ['created_at', 'created at']));
        P.amount = amt(first(r, ['amount', 'credit', 'debit'])); P.fee = Math.abs(amt(get(r, 'fee'))); P.gst = Math.abs(amt(get(r, 'tax')));
        P.utr = s(get(r, 'settlement_utr')); P.settled = isoDate(get(r, 'settled_at')) || '';
        P.ref = s(first(r, ['order_receipt', 'description', 'notes'])); P.email = s(get(r, 'email')); P.phone = s(get(r, 'contact'));
      } else if (k.src === 'paytm') {
        var tt = key(get(r, 'Transaction Type')), sp = key(get(r, 'Status'));
        if (sp && !/success|settled/.test(sp)) return;
        P.refund = /refund/.test(tt);
        P.id = s(get(r, 'Transaction ID')); P.date = isoDate(get(r, 'Transaction Date'));
        P.amount = Math.abs(amt(get(r, 'Amount'))); P.fee = r2(Math.abs(amt(get(r, 'Commission'))) + Math.abs(amt(get(r, 'GST')))); P.gst = Math.abs(amt(get(r, 'GST')));
        P.utr = s(first(r, ['UTR no.', 'UTR number'])); P.settled = isoDate(get(r, 'Settled Date'));
        P.ref = s(get(r, 'Order ID')); P.email = ''; P.phone = '';
      } else if (k.src === 'phonepe') {
        P.refund = /refund/.test(key(get(r, 'PaymentType')));
        P.id = s(get(r, 'PhonePeReferenceId')); P.date = isoDate(first(r, ['TransactionDate', 'CreationDate']));
        P.amount = Math.abs(amt(get(r, 'Amount')));
        P.gst = r2(Math.abs(amt(get(r, 'IGST'))) + Math.abs(amt(get(r, 'CGST'))) + Math.abs(amt(get(r, 'SGST'))));
        P.fee = r2(Math.abs(amt(get(r, 'Fee'))) + P.gst);   /* PhonePe: fee and GST in separate columns, both negative */
        P.utr = s(get(r, 'BankReferenceNo')); P.settled = isoDate(get(r, 'SettlementDate'));
        P.ref = s(get(r, 'MerchantReferenceId')); P.email = ''; P.phone = s(get(r, 'From'));
      }
      P.amount = Math.abs(P.amount); P.net = r2(P.amount - P.fee);
      if (!P.id || !P.amount || !P.date) return;
      out.push(P);
    });
    return { lines: out };
  }
  /* amounts that look like paise: Razorpay's API-style export gives whole numbers 100 times the rupees */
  function looksPaise(rows, k) {
    var h = heads(rows[k.head]), i = h.indexOf('amount'); if (i < 0 || k.src !== 'razorpay') return false;
    var v = rows.slice(k.head + 1).map(function (r) { return r[i]; }).filter(function (x) { return s(x) !== ''; });
    return v.length > 0 && v.every(function (x) { var n = num(x); return Math.round(n) === n && n >= 100; }) && h.indexOf('entity id') >= 0;
  }

  /* ---------- payments -> the open sale bills they pay ----------
     bills: [{ id, no, date, party, left, side }] (NSBooks.bills, open sale bills); parties: [{ name, phone, email }]
     sure: 'no' = the bill no. is in the payment's reference; 'party' = the payer's phone or e-mail is the party's and the
     amount equals one open bill; 'amount' = only one open bill of that amount within 60 days before; '' = none */
  function digits(v) { return s(v).replace(/\D/g, '').slice(-10); }
  function normNo(v) { return s(v).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function matchPays(list, bills, parties) {
    var open = (bills || []).filter(function (b) { return b.side === 'recv' && b.left > 0.005; }).map(function (b) { return Object.assign({ n: normNo(b.no), k: key(b.party) }, b); });
    var who = {};
    (parties || []).forEach(function (p) { var k = key(p.name); if (digits(p.phone).length === 10) who['p' + digits(p.phone)] = k; if (s(p.email)) who['e' + s(p.email).toLowerCase()] = k; });
    var used = {};
    return list.map(function (P) {
      var res = { pay: P, bill: null, sure: '' };
      if (P.refund) return res;
      var R = normNo(P.ref);
      var byNo = open.filter(function (b) { return !used[b.id] && b.n && b.n.length >= 3 && R.indexOf(b.n) >= 0; });
      if (byNo.length) { byNo.sort(function (a, b) { return b.n.length - a.n.length; }); res.bill = byNo[0]; res.sure = 'no'; }
      else {
        var pk = who['p' + digits(P.phone)] || (P.email ? who['e' + P.email.toLowerCase()] : '');
        var same = function (b) { return !used[b.id] && Math.abs(b.left - P.amount) <= 0.5 && b.date <= P.date && (Date.parse(P.date) - Date.parse(b.date)) / 864e5 <= 60; };
        var byParty = pk ? open.filter(function (b) { return b.k === pk && same(b); }) : [];
        if (byParty.length) { res.bill = byParty[0]; res.sure = 'party'; }
        else { var byAmt = open.filter(same); if (byAmt.length === 1) { res.bill = byAmt[0]; res.sure = 'amount'; } }
      }
      if (res.bill) used[res.bill.id] = 1;
      return res;
    });
  }
  /* per settlement (UTR): the payments, their fees and GST on fees, and what reached the bank */
  function settlements(list) {
    var by = {}, order = [];
    list.forEach(function (P) {
      var k = P.utr || ('day ' + (P.settled || P.date));
      if (!by[k]) { by[k] = { utr: P.utr, date: P.settled || P.date, amount: 0, fee: 0, gst: 0, refunds: 0, n: 0 }; order.push(k); }
      var x = by[k]; x.n++;
      if (P.refund) x.refunds = r2(x.refunds + P.amount); else x.amount = r2(x.amount + P.amount);
      x.fee = r2(x.fee + P.fee); x.gst = r2(x.gst + P.gst);
      if ((P.settled || P.date) > x.date) x.date = P.settled || P.date;
    });
    return order.map(function (k) { var x = by[k]; x.net = r2(x.amount - x.refunds - x.fee); return x; });
  }

  var API = { num: num, isoDate: isoDate, stateCode: stateCode, gstinOk: gstinOk, kind: kind, sales: sales, salesDocs: salesDocs, tcsCheck: tcsCheck, table14: table14,
    pays: pays, looksPaise: looksPaise, matchPays: matchPays, settlements: settlements, TCS_RATE: TCS_RATE, KINDS: KINDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSMkt = API;
})(typeof window !== 'undefined' ? window : globalThis);
