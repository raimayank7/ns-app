/* NSImport: bring data in from other billing software (Vyapar, myBillBook, Busy, Tally, any Excel sheet). Pure functions, no screen.
   Input is a table (rows of cells, from CSV or Excel) or a Tally XML export. Nothing here saves anything.
   csvRows(text)            CSV text -> rows (BOM, comma / semicolon / tab / pipe, quotes, merged lines)
   tallyXml(text)           Tally's XML export of masters -> { tables: { party, item, bill }, skipped } (same row model as a sheet)
   detect(rows)             which kind of list it is and where the headings are -> { kind, header, heads, sub, score }
   headings(rows, header)   the heading texts, a two-row heading (group row above, names below) joined
   autoMap(heads, kind)     { field: column index } by what the heading says
   build(kind, rows, header, map, opts) -> checked rows { line, rec, errs: [[code, vars]], warns: [...] }
   plan(tables, existing, opts) -> what would be saved: parties, items, opening balances (ob), opening stock, counts
   Layouts: no vendor's export is matched by its brand. Headings are matched by their words (Party Name, Opening Balance, HSN, GST %, ...),
   the user can correct every column on the mapping screen. Tally's XML structure is read from Tally's documented import format. */
(function (G) {
  'use strict';
  var deps = { gstin: null, stateCode: null, today: function () { return new Date().toISOString().slice(0, 10); } };

  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function hk(s) { return key(s).replace(/[^a-z0-9%]/g, ''); }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  /* ---------- text -> rows ---------- */
  function csvRows(txt) {
    txt = String(txt || '').replace(/^﻿/, '');
    var lines = txt.split(/\r\n|\n|\r/).slice(0, 12), best = ',', bc = -1;
    [',', ';', '\t', '|'].forEach(function (sp) {
      var c = lines.reduce(function (a, l) { var q = false, n = 0; for (var i = 0; i < l.length; i++) { if (l[i] === '"') q = !q; else if (!q && l[i] === sp) n++; } return a + n; }, 0);
      if (c > bc) { bc = c; best = sp; }
    });
    var rows = [], row = [], cell = '', inq = false, i, c;
    for (i = 0; i < txt.length; i++) {
      c = txt[i];
      if (inq) { if (c === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else inq = false; } else cell += c; }
      else if (c === '"' && cell === '') inq = true;
      else if (c === best) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim(); }); });
  }

  /* ---------- numbers and dates ---------- */
  /* 1,23,456.50  ₹ 1,200  (500)  500-  1200 Dr  3.5 Cr  1234,50 (decimal comma) -> { n, side: 'dr' | 'cr' | '' } or null when it is not a number */
  function money(v) {
    if (typeof v === 'number') return isFinite(v) ? { n: v, side: '' } : null;
    var s = String(v == null ? '' : v).trim(); if (!s) return null;
    var side = '', m = /\b(dr|cr)\b\.?\s*$/i.exec(s) || /^(dr|cr)\b\.?\s*/i.exec(s);
    if (m) { side = m[1].toLowerCase(); s = s.replace(m[0], ''); }
    s = s.replace(/[₹\s]|rs\.?|inr/gi, '');
    var neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); }
    if (/^-/.test(s)) { neg = !neg; s = s.slice(1); }
    if (/^\+/.test(s)) s = s.slice(1);
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');   /* decimal comma */
    else s = s.replace(/,/g, '');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var n = parseFloat(s); if (!isFinite(n)) return null;
    return { n: neg ? -n : n, side: side };
  }
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  /* '' = empty, null = not a date, else yyyy-mm-dd. Day first (Indian), 2-digit years, month names, Excel serial numbers, Tally's 20260401 */
  function date(v) {
    if (v instanceof Date) return isNaN(v) ? null : v.getFullYear() + '-' + p2(v.getMonth() + 1) + '-' + p2(v.getDate());
    var s = String(v == null ? '' : v).trim(); if (!s) return '';
    var y, mo, d, m;
    if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if (/^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(+s) * 864e5).toISOString().slice(0, 10);
    else if ((m = /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.\-\s]([A-Za-z]{3})[a-z]*[\/.\-\s,]*(\d{2,4})$/.exec(s))) { d = +m[1]; mo = MON[m[2].toLowerCase()]; y = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else return null;
    if (y < 100) y += y < 70 ? 2000 : 1900;
    if (!mo || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
    var dt = new Date(Date.UTC(y, mo - 1, d)); if (dt.getUTCMonth() !== mo - 1) return null;
    return y + '-' + p2(mo) + '-' + p2(d);
  }

  /* ---------- GSTIN (the same check-digit test as NS.gstinCheck) ---------- */
  function gstinCheck(g) {
    if (deps.gstin) return deps.gstin(g);
    g = String(g || '').toUpperCase().replace(/\s/g, '');
    if (!g) return { ok: true, empty: true };
    if (!/^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false };
    var C = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', sum = 0;
    for (var i = 0; i < 14; i++) { var v = C.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 36) + (v % 36); }
    if (C[(36 - (sum % 36)) % 36] !== g[14]) return { ok: false };
    return { ok: true, state: g.slice(0, 2) };
  }

  /* ---------- what a heading says ---------- */
  var FIELDS = {
    party: {
      name: ['partyname', 'name', 'customername', 'suppliername', 'ledgername', 'accountname', 'nameofparty', 'party', 'customer', 'supplier', 'ledger', 'accname', 'companyname', 'firmname', 'displayname', 'billingname', 'vendorname', 'vendor', 'clientname', 'client', 'accountsname', 'nameoftheparty'],
      gstin: ['gstin', 'gstinuin', 'gstnumber', 'gstno', 'gstinno', 'partygstin', 'gstinnumber', 'gstuin', 'gstregistrationnumber', 'gstidentificationnumber', 'gstin/uin', 'gst'],
      phone: ['phone', 'phoneno', 'phonenumber', 'mobile', 'mobileno', 'mobilenumber', 'contactno', 'contactnumber', 'contact', 'whatsapp', 'telephone', 'mob', 'cellno', 'phoneno.', 'mobileno.'],
      email: ['email', 'emailid', 'emailaddress', 'mail', 'e-mail'],
      addr: ['address', 'billingaddress', 'address1', 'addressline1', 'street', 'addr', 'location', 'billingaddr', 'addressline'],
      city: ['city', 'town', 'district'],
      pin: ['pin', 'pincode', 'zip', 'zipcode', 'postalcode', 'pinzip'],
      state: ['state', 'statecode', 'placeofsupply', 'statename', 'billingstate'],
      type: ['type', 'partytype', 'role', 'category', 'group', 'ledgergroup', 'parentgroup', 'under', 'accountgroup', 'partygroup', 'partycategory', 'ledgerunder'],
      open: ['openingbalance', 'opening', 'openingbal', 'balance', 'currentbalance', 'outstanding', 'closingbalance', 'openingamount', 'tocollect', 'topay', 'receivable', 'payable', 'dues', 'balanceamount', 'amount', 'openbalance', 'openingbalanceamount', 'obalance', 'outstandingbalance', 'currentbal'],
      baltype: ['balancetype', 'opentype', 'drcr', 'baltype', 'crdr', 'openingbalancetype', 'dr/cr', 'cr/dr', 'openingdrcr', 'balancedrcr', 'openingtype', 'balancetypedrcr'],
      opendr: ['debit', 'dr', 'drbalance', 'openingdebit', 'debitbalance', 'debitamount', 'tocollectamount'],
      opencr: ['credit', 'cr', 'crbalance', 'openingcredit', 'creditbalance', 'creditamount', 'topayamount']
    },
    item: {
      desc: ['itemname', 'name', 'productname', 'item', 'product', 'description', 'itemdescription', 'particulars', 'stockitem', 'stockitemname', 'goodsname', 'nameofitem', 'servicename', 'itemsname', 'productsname', 'nameofproduct', 'materialname', 'material', 'productdescription'],
      code: ['itemcode', 'code', 'sku', 'productcode', 'barcode', 'itemid', 'partno', 'productid', 'itemno'],
      hsn: ['hsn', 'hsncode', 'hsnsac', 'hsnsaccode', 'sac', 'saccode', 'hsnsacno', 'hsn/sac', 'hsn/saccode', 'hsnno', 'hsncodes'],
      unit: ['unit', 'uom', 'unitofmeasure', 'primaryunit', 'baseunit', 'units', 'measuringunit', 'unitname', 'unitofmeasurement'],
      gst: ['gst', 'gstrate', 'gstpercent', 'gst%', 'taxrate', 'tax', 'igst', 'igstrate', 'gstper', 'taxpercent', 'tax%', 'gstrateinpercent', 'gstpercentage', 'rateofgst', 'gstrate%', 'gst(%)', 'taxrate%'],
      rate: ['saleprice', 'sellingprice', 'salerate', 'rate', 'price', 'sellprice', 'salesprice', 'retailprice', 'sp', 'sellingrate', 'salepriceincltax', 'saleprice(inctax)', 'salesrate', 'unitprice', 'mrpprice'],
      prate: ['purchaseprice', 'purchaserate', 'buyingprice', 'costprice', 'cost', 'cp', 'purchasecost', 'buyprice', 'purchasepriceinctax', 'purchaseprice(inctax)', 'costrate', 'buyingrate'],
      mrp: ['mrp', 'maxretailprice', 'maximumretailprice'],
      wrate: ['wholesaleprice', 'wholesalerate', 'wholesale'],
      cat: ['category', 'itemcategory', 'group', 'itemgroup', 'stockgroup', 'productcategory', 'under', 'parentgroup', 'itemsgroup', 'categoryname'],
      kind: ['itemtype', 'type', 'producttype', 'goodsorservice', 'productservice', 'goods/service', 'nature'],
      qty: ['openingstock', 'openingquantity', 'openingqty', 'stock', 'currentstock', 'stockqty', 'quantity', 'qty', 'closingstock', 'stockquantity', 'currentquantity', 'openingstockqty', 'openingstockquantity', 'stockinhand', 'qtyinhand', 'availablestock', 'onhand', 'balanceqty'],
      stockvalue: ['openingstockvalue', 'stockvalue', 'openingvalue', 'value', 'stockvalueamount', 'totalvalue', 'closingvalue', 'openingstockamount', 'stockamount', 'valueofstock', 'openingstockvalue(inctax)']
    },
    bill: {
      party: ['partyname', 'name', 'customername', 'suppliername', 'party', 'customer', 'supplier', 'ledgername', 'accountname', 'vendorname', 'nameofparty'],
      no: ['invoiceno', 'invoicenumber', 'billno', 'billnumber', 'refno', 'reference', 'voucherno', 'vchno', 'invoice', 'bill', 'ref', 'referenceno', 'billref', 'invno', 'refnumber', 'vouchernumber', 'invoiceref', 'billrefno', 'transactionno'],
      date: ['date', 'invoicedate', 'billdate', 'billdt', 'vchdate', 'voucherdate', 'refdate', 'invdate', 'transactiondate'],
      amount: ['pendingamount', 'pending', 'outstanding', 'balance', 'dueamount', 'due', 'balanceamount', 'amountdue', 'amount', 'pendingbalance', 'openingamount', 'outstandingamount', 'balancedue', 'unpaidamount', 'pendingbal', 'openingbalance'],
      total: ['billamount', 'invoiceamount', 'totalamount', 'total', 'invoicevalue', 'billvalue', 'originalamount', 'invoicetotal'],
      baltype: ['balancetype', 'drcr', 'baltype', 'crdr', 'openingbalancetype', 'dr/cr', 'cr/dr', 'type', 'side', 'partytype', 'tocollectorpay', 'openingdrcr'],
      due: ['duedate', 'dueon', 'duedt']
    }
  };
  var LABEL = {
    party: { name: 'Party name', gstin: 'GSTIN', phone: 'Phone', email: 'Email', addr: 'Address', city: 'City', pin: 'PIN code', state: 'State', type: 'Customer or supplier', open: 'Opening balance', baltype: 'Balance type (Dr/Cr, To collect/To pay)', opendr: 'Debit amount', opencr: 'Credit amount' },
    item: { desc: 'Item name', code: 'Item code', hsn: 'HSN/SAC', unit: 'Unit', gst: 'GST %', rate: 'Sale price', prate: 'Purchase price', mrp: 'MRP', wrate: 'Wholesale price', cat: 'Group', kind: 'Goods or service', qty: 'Opening stock (quantity)', stockvalue: 'Opening stock value' },
    bill: { party: 'Party name', no: 'Bill number', date: 'Bill date', amount: 'Pending amount', total: 'Bill amount', baltype: 'Receivable or payable (Dr/Cr)', due: 'Due date' }
  };
  var NAMEF = { party: 'name', item: 'desc', bill: 'party' };
  var SETS = {};
  Object.keys(FIELDS).forEach(function (k) { SETS[k] = {}; Object.keys(FIELDS[k]).forEach(function (f) { SETS[k][f] = FIELDS[k][f].map(hk); }); });

  function matchField(kind, h) { var out = []; if (!h) return out; Object.keys(SETS[kind]).forEach(function (f) { if (SETS[kind][f].indexOf(h) >= 0) out.push(f); }); return out; }
  function rowScore(kind, row) {
    var seen = {}, n = 0;
    row.forEach(function (c) { var h = hk(c); if (!h || money(c)) return; matchField(kind, h).forEach(function (f) { if (!seen[f]) { seen[f] = 1; n++; } }); });
    return n;
  }
  /* kinds are told apart by the fields only one of them has (bill number, HSN, opening stock, GSTIN ...) */
  var HINT = { bill: ['no', 'due', 'total'], item: ['hsn', 'unit', 'rate', 'prate', 'qty', 'mrp', 'code', 'stockvalue', 'gst'], party: ['gstin', 'phone', 'email', 'addr', 'city', 'pin', 'state', 'open', 'type'] };
  function kindScores(row) {
    var heads = row.map(hk), sc = {};
    ['party', 'item', 'bill'].forEach(function (k) {
      var hit = {}, hint = 0;
      heads.forEach(function (h) { matchField(k, h).forEach(function (f) { hit[f] = 1; }); });
      var n = Object.keys(hit).length; if (!hit[NAMEF[k]]) n = Math.min(n, 1);
      HINT[k].forEach(function (f) { if (hit[f]) hint++; });
      sc[k] = n + (k === 'bill' ? hint * 0.4 : hint * 0.1);
    });
    return sc;
  }
  /* find the heading row among the first 30 rows; title rows and blank rows above it are skipped */
  function detect(rows, wantKind) {
    var best = null, i;
    for (i = 0; i < Math.min(rows.length, 30); i++) {
      var row = rows[i]; if (row.filter(function (c) { return String(c).trim(); }).length < 2) continue;
      var sc = kindScores(row);
      Object.keys(sc).forEach(function (k) {
        if (wantKind && k !== wantKind) return;
        if (sc[k] >= 2 && (!best || sc[k] > best.score + 0.01)) best = { kind: k, header: i, score: sc[k] };
      });
    }
    if (!best) return null;
    var lower = rows[best.header + 1], upper = rows[best.header - 1];
    best.sub = false;
    /* two-row heading: group names above, field names below */
    if (lower && lower.some(function (c) { return String(c).trim(); }) && !lower.some(function (c) { return money(c) && String(c).trim() !== ''; })) {
      var s1 = rowScore(best.kind, lower);
      if (s1 >= 1 && rows[best.header].some(function (c, j) { return !String(c).trim() && String(lower[j] || '').trim(); })) best.sub = true;
    }
    best.heads = headings(rows, best.header, best.sub);
    return best;
  }
  /* heading texts per column; with a two-row heading both rows are joined (the group name carried to the right over merged cells) */
  function headings(rows, header, sub) {
    var h = (rows[header] || []).map(function (c) { return String(c == null ? '' : c).trim(); });
    if (!sub) return h;
    var low = rows[header + 1] || [], up = h, carry = '', w = Math.max(up.length, low.length), out = [];
    for (var j = 0; j < w; j++) {
      if (String(up[j] || '').trim()) carry = String(up[j]).trim(); else if (String(low[j] || '').trim() === '') carry = '';
      var l = String(low[j] == null ? '' : low[j]).trim();
      out.push(l && carry && carry !== l ? carry + ' ' + l : l || carry);
    }
    return out;
  }
  /* column per field. When a joined two-row heading names nothing, the lower heading alone is tried (plain "Name") */
  function autoMap(heads, kind, rows, header) {
    var map = {}, used = {};
    function take(f, j) { if (map[f] == null && !used[j]) { map[f] = j; used[j] = 1; } }
    var order = Object.keys(SETS[kind]);
    /* an exact, specific word first (Opening Balance before the general "balance"); the first column wins */
    order.forEach(function (f) {
      heads.forEach(function (h, j) { var x = hk(h); if (x && SETS[kind][f].indexOf(x) >= 0 && SETS[kind][f].indexOf(x) < Math.ceil(SETS[kind][f].length / 2)) take(f, j); });
    });
    order.forEach(function (f) { heads.forEach(function (h, j) { var x = hk(h); if (x && SETS[kind][f].indexOf(x) >= 0) take(f, j); }); });
    /* the last word of a joined heading ("Party Details Name") */
    if (rows && header != null) {
      var low = rows[header + 1] || [];
      order.forEach(function (f) { if (map[f] == null) low.forEach(function (c, j) { var x = hk(c); if (x && !used[j] && SETS[kind][f].indexOf(x) >= 0) take(f, j); }); });
    }
    return map;
  }

  /* ---------- Tally XML (masters export) ---------- */
  function unent(s) { return String(s == null ? '' : s).replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&#4;/g, '').trim(); }
  function blocks(txt, tag) {
    var out = [], re = new RegExp('<' + tag + '(\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'g'), m;
    while ((m = re.exec(txt))) out.push({ attr: m[1] || '', body: m[2] });
    return out;
  }
  function one(body, tag) { var m = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>').exec(body); return m ? unent(m[1].replace(/<[^>]+>/g, '')) : ''; }
  function nameAttr(attr) { var m = /NAME="([^"]*)"/.exec(attr); return m ? unent(m[1]) : ''; }
  /* a file's bytes as text: Tally writes UTF-16 with a byte-order mark; Excel's CSV may be UTF-8 with a BOM or old Windows-1252 */
  function decode(buf) {
    var u = buf instanceof Uint8Array ? buf : new Uint8Array(buf), enc = 'utf-8';
    if (u[0] === 0xFF && u[1] === 0xFE) enc = 'utf-16le'; else if (u[0] === 0xFE && u[1] === 0xFF) enc = 'utf-16be';
    else if (u.length > 3 && u[1] === 0 && u[3] === 0 && u[0] !== 0) enc = 'utf-16le';
    var txt = new TextDecoder(enc).decode(u);
    if (enc === 'utf-8' && txt.indexOf('�') >= 0) { try { txt = new TextDecoder('windows-1252').decode(u); } catch (e) {} }
    return txt.replace(/^﻿/, '');
  }
  function tallyXml(txt) {
    var party = [], item = [], bill = [], skipped = 0, n;
    /* group chain: a ledger under a group of your own (e.g. Transporter under Sundry Creditors) still counts as a creditor */
    var gp = {}; blocks(txt, 'GROUP').forEach(function (g) { var gn = nameAttr(g.attr) || one(g.body, 'NAME'); if (gn) gp[gn] = one(g.body, 'PARENT'); });
    function root(p) { for (var i = 0; i < 12 && p; i++) { if (/^sundry\s*(debtor|creditor)s?$/i.test(p)) return p; p = gp[p]; } return ''; }
    blocks(txt, 'LEDGER').forEach(function (b) {
      var nm = nameAttr(b.attr) || one(b.body, 'NAME'), parent = root(one(b.body, 'PARENT'));
      if (!parent) { skipped++; return; }
      var own = b.body.replace(/<BILLALLOCATIONS\.LIST(\s[^>]*)?>[\s\S]*?<\/BILLALLOCATIONS\.LIST>/g, '');   /* the ledger's own fields, not those inside its bill lists */
      var ob = one(own, 'OPENINGBALANCE'), mo = money(ob), addr = blocks(b.body, 'ADDRESS').map(function (a) { return unent(a.body); }).filter(Boolean).join(', ');
      /* in Tally's XML a debit balance (the party owes you) is written with a minus sign, a credit balance without */
      var sd = mo && mo.n ? (mo.n < 0 ? 'Dr' : 'Cr') : '';
      party.push([nm, one(own, 'PARTYGSTIN') || one(own, 'GSTIN'), one(own, 'LEDGERPHONE') || one(own, 'LEDGERMOBILE'), one(own, 'EMAIL') || one(own, 'LEDGEREMAIL'), addr, '', one(own, 'PINCODE'), one(own, 'LEDSTATENAME') || one(own, 'STATENAME'), parent, mo ? Math.abs(mo.n) : '', sd]);
      blocks(b.body, 'BILLALLOCATIONS.LIST').forEach(function (a) {
        var ref = nameAttr(a.attr) || one(a.body, 'NAME'), am = money(one(a.body, 'OPENINGBALANCE')); if (!am || !am.n) return;
        bill.push([nm, ref, one(a.body, 'BILLDATE'), Math.abs(am.n), am.n < 0 ? 'Dr' : 'Cr']);
      });
    });
    blocks(txt, 'STOCKITEM').forEach(function (b) {
      var nm = nameAttr(b.attr) || one(b.body, 'NAME'); if (!nm) return;
      var ob = one(b.body, 'OPENINGBALANCE'), q = /^\s*(-?[\d,.]+)\s*(.*)$/.exec(ob) || [], hsn = one(b.body, 'HSNCODE'), gst = '';
      var rd = blocks(b.body, 'RATEDETAILS.LIST'), ig = rd.filter(function (x) { return /IGST/i.test(one(x.body, 'GSTRATEDUTYHEAD')); })[0];
      if (ig) gst = one(ig.body, 'GSTRATE'); else if (rd.length) gst = String(rd.reduce(function (a, x) { return a + (/CGST|SGST/i.test(one(x.body, 'GSTRATEDUTYHEAD')) ? (money(one(x.body, 'GSTRATE')) || { n: 0 }).n : 0); }, 0) || '');
      var ov = money(one(b.body, 'OPENINGVALUE'));
      item.push([nm, '', hsn || one(b.body, 'HSNMASTERNAME'), one(b.body, 'BASEUNITS') || (q[2] || '').trim(), gst, '', '', one(b.body, 'PARENT') && !/primary/i.test(one(b.body, 'PARENT')) ? one(b.body, 'PARENT') : '', q[1] ? Math.abs(money(q[1]).n) : '', ov ? Math.abs(ov.n) : '']);
    });
    var T = {};
    if (party.length) T.party = { heads: ['Party name', 'GSTIN', 'Phone', 'Email', 'Address', 'City', 'PIN code', 'State', 'Group', 'Opening balance', 'Balance type'], rows: party };
    if (item.length) T.item = { heads: ['Item name', 'Item code', 'HSN/SAC', 'Unit', 'GST %', 'Sale price', 'Purchase price', 'Group', 'Opening stock', 'Opening stock value'], rows: item };
    if (bill.length) T.bill = { heads: ['Party name', 'Bill number', 'Bill date', 'Pending amount', 'Dr/Cr'], rows: bill };
    return { tables: T, skipped: skipped, found: party.length + item.length };
  }

  /* ---------- check the rows of one list ---------- */
  var RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];
  function cellOf(cells, map, f) { var j = map[f]; if (j == null || j < 0) return ''; var v = cells[j]; return v == null ? '' : (typeof v === 'number' ? v : String(v).trim()); }
  function isTotalRow(name) { return /^(grand\s*)?total\b|^sub\s*total|^closing\s*balance|^opening\s*balance$|^net\s+(total|balance)|^report\b|^page\s+\d|^printed\b|^as\s+on\b/i.test(String(name).trim()); }
  function phoneFix(v) {
    var d = String(v == null ? '' : v).replace(/\.0+$/, '').replace(/\D/g, '');
    if (d.length === 12 && /^91/.test(d)) d = d.slice(2); if (d.length === 11 && /^0/.test(d)) d = d.slice(1);
    return d;
  }
  function stateOf(v) { return deps.stateCode ? deps.stateCode(v) : (/^\d{1,2}$/.test(String(v)) ? p2(+v) : ''); }
  function roleOf(v, dflt) { var s = key(v); if (!s) return dflt; if (/supp|creditor|vendor|payable|to pay/.test(s)) return /both|cust/.test(s) ? 'both' : 'supplier'; if (/both/.test(s)) return 'both'; if (/cust|debtor|client|receiv|collect/.test(s)) return 'customer'; return dflt; }

  /* opts: header (row index), sub (two-row heading), role (default for parties), dropBadGstin, asOf (date of opening balances) */
  function build(kind, rows, header, map, opts) {
    opts = opts || {};
    var out = [], seen = {}, nameF = NAMEF[kind], start = header + 1 + (opts.sub ? 1 : 0);
    rows.slice(start).forEach(function (cells, n) {
      var line = start + n + 1, E = [], W = [], rec = {};
      if (!cells.some(function (c) { return String(c == null ? '' : c).trim(); })) return;
      var name = String(cellOf(cells, map, nameF)).trim();
      if (!name) { var other = Object.keys(map).some(function (f) { return f !== nameF && String(cellOf(cells, map, f)).trim(); }); if (!other) return; return out.push({ line: line, kind: kind, rec: {}, errs: [['noname']], warns: [], skip: true }); }
      if (isTotalRow(name)) return;
      if (kind === 'party') party(cells, map, name, rec, E, W, opts);
      else if (kind === 'item') item(cells, map, name, rec, E, W, opts);
      else bill(cells, map, name, rec, E, W, opts);
      var k = kind + '|' + key(name) + (kind === 'bill' ? '|' + key(rec.no) : '');
      if (seen[k]) E.push(['twice', { row: seen[k], name: name }]); else seen[k] = line;
      out.push({ line: line, kind: kind, rec: rec, errs: E, warns: W });
    });
    return out;
  }
  function party(cells, map, name, rec, E, W, opts) {
    rec.name = name;
    var g = String(cellOf(cells, map, 'gstin')).toUpperCase().replace(/\s/g, ''), gs = null;
    if (g && !/^(NA|N\/A|NIL|UNREGISTERED|URD|-+)$/.test(g)) {
      gs = gstinCheck(g);
      if (!gs.ok) { if (opts.dropBadGstin) W.push(['gstinDropped', { g: g }]); else E.push(['gstin', { g: g }]); }
      else rec.gstin = g;
    }
    var ph = phoneFix(cellOf(cells, map, 'phone')); if (ph) { rec.phone = ph; if (ph.length !== 10) W.push(['phone', { p: ph }]); }
    var em = String(cellOf(cells, map, 'email')); if (em) { if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) rec.email = em; else W.push(['email', { e: em }]); }
    ['addr', 'city'].forEach(function (f) { var v = String(cellOf(cells, map, f)); if (v) rec[f] = v; });
    var pin = String(cellOf(cells, map, 'pin')).replace(/\.0+$/, '').replace(/\D/g, ''); if (pin) { if (/^\d{6}$/.test(pin)) rec.pin = pin; else W.push(['pin', { p: pin }]); }
    var st = cellOf(cells, map, 'state'); if (st !== '') { var sc = stateOf(st); if (sc) rec.state = sc; else W.push(['state', { v: st }]); }
    if (!rec.state && gs && gs.ok && gs.state) rec.state = gs.state;
    var tv = cellOf(cells, map, 'type'); rec.role = roleOf(tv, opts.role || 'customer');
    if (tv !== '' && !roleOf(tv, '')) rec._grp = String(tv);
    /* opening balance: side from Dr/Cr text, a balance-type column, debit / credit columns, else from the party's role and the sign */
    var ob = null, bt = String(cellOf(cells, map, 'baltype')), dr = money(cellOf(cells, map, 'opendr')), cr = money(cellOf(cells, map, 'opencr')), o = money(cellOf(cells, map, 'open'));
    var raw = cellOf(cells, map, 'open');
    if (raw !== '' && !o) W.push(['num', { v: raw }]);
    if (o && o.n) {
      var side = o.side || (/\bdr\b|collect|receiv|debit/i.test(bt) ? 'dr' : /\bcr\b|pay|credit/i.test(bt) ? 'cr' : '');
      var amt = o.n, recv;
      if (side) { recv = side === 'dr'; if (amt < 0) { recv = !recv; W.push(['neg', { v: Math.abs(amt) }]); } }
      else { recv = rec.role === 'supplier' ? false : true; if (opts.balMode === 'pay') recv = !recv; if (amt < 0) { recv = !recv; W.push(['neg', { v: Math.abs(amt) }]); } }
      ob = { side: recv ? 'recv' : 'pay', amount: r2(Math.abs(amt)) };
    } else if ((dr && dr.n) || (cr && cr.n)) {
      var d = dr ? dr.n : 0, c = cr ? cr.n : 0, net = d - c;
      if (net) ob = { side: net > 0 ? 'recv' : 'pay', amount: r2(Math.abs(net)) };
    }
    if (ob) {
      if (ob.side === 'pay' && rec.role === 'customer') W.push(['advance', { v: ob.amount }]);
      if (ob.side === 'recv' && rec.role === 'supplier') W.push(['supadv', { v: ob.amount }]);
      rec._ob = ob;
    }
    if (!rec.gstin) W.push(['nogstin']);
  }
  function item(cells, map, name, rec, E, W) {
    rec.desc = name;
    var hsn = String(cellOf(cells, map, 'hsn')).replace(/\.0+$/, '').replace(/[\s.\-]/g, '');
    if (hsn) {
      if (/^\d{3}$|^\d{5}$|^\d{7}$/.test(hsn)) hsn = '0' + hsn;
      if (/^\d{4}$|^\d{6}$|^\d{8}$/.test(hsn)) rec.hsn = hsn; else E.push(['hsn', { h: hsn }]);
    } else W.push(['nohsn']);
    var u = String(cellOf(cells, map, 'unit')); if (u) rec.unit = u;
    var c = String(cellOf(cells, map, 'code')); if (c) rec.code = c;
    var cat = String(cellOf(cells, map, 'cat')); if (cat && !/^(primary|general|none|default|-+)$/i.test(cat)) rec.cat = cat;
    var kv = key(cellOf(cells, map, 'kind')); rec.kind = /serv/.test(kv) ? 'service' : 'goods';
    var gv = cellOf(cells, map, 'gst');
    if (gv !== '') {
      var gm = money(String(gv).replace(/%/g, '').replace(/\bigst\b|\bgst\b/gi, ''));
      if (!gm) W.push(['gst', { r: gv }]);
      else { var g = gm.n; if (g > 0 && g < 1 && RATES.indexOf(g) < 0) g = r2(g * 100); if (RATES.indexOf(g) < 0) W.push(['gst', { r: g }]); else rec.gst = g; }
    }
    [['rate', 'rate'], ['prate', 'prate'], ['mrp', 'mrp'], ['wrate', 'wrate']].forEach(function (p) {
      var v = cellOf(cells, map, p[0]); if (v === '') return; var m = money(v);
      if (!m) E.push(['num', { v: v }]); else if (m.n < 0) E.push(['negprice', { v: v }]); else rec[p[1]] = r2(m.n);
    });
    var q = money(cellOf(cells, map, 'qty')), sv = money(cellOf(cells, map, 'stockvalue'));
    if (cellOf(cells, map, 'qty') !== '' && !q) W.push(['num', { v: cellOf(cells, map, 'qty') }]);
    if (q && q.n) {
      if (q.n < 0) W.push(['negstock', { v: q.n }]);
      else {
        var cost = rec.prate || (sv && sv.n > 0 ? r2(sv.n / q.n) : 0);
        rec._stk = { desc: name, unit: rec.unit || '', qty: Math.round(q.n * 1000) / 1000, rate: cost };
        if (!cost) W.push(['nocost']);
      }
    }
  }
  function bill(cells, map, name, rec, E, W, opts) {
    rec.party = name; rec.no = String(cellOf(cells, map, 'no'));
    var d = date(cellOf(cells, map, 'date'));
    if (d === null) { E.push(['date', { v: cellOf(cells, map, 'date') }]); d = ''; }
    rec.date = d;
    var a = money(cellOf(cells, map, 'amount')) || money(cellOf(cells, map, 'total'));
    if (!a || !a.n) { E.push(['amt', { v: cellOf(cells, map, 'amount') || '—' }]); return; }
    var bt = String(cellOf(cells, map, 'baltype')), side = a.side || (/\bdr\b|collect|receiv|debit|customer|debtor/i.test(bt) ? 'dr' : /\bcr\b|pay|credit|supplier|creditor/i.test(bt) ? 'cr' : ''), recv;
    if (side) recv = side === 'dr'; else recv = opts.billSide !== 'pay';
    if (a.n < 0) { recv = !recv; W.push(['neg', { v: Math.abs(a.n) }]); }
    rec.side = recv ? 'recv' : 'pay'; rec.amount = r2(Math.abs(a.n));
    if (!rec.no) W.push(['nobillno']);
  }

  /* ---------- what would be saved ---------- */
  /* tables: { party: rows[], item: rows[], bill: rows[] } of build() output. existing: { party: {key: rec}, item: {key: rec}, ob: [docs] }.
     Rows with errors are left out; a name that is already saved is left as it is (never overwritten). */
  function plan(tables, existing, opts) {
    opts = opts || {}; existing = existing || {};
    var have = { party: existing.party || {}, item: existing.item || {} }, asOf = opts.asOf || deps.today().slice(0, 4) + '-04-01';
    var P = [], I = [], OB = [], STK = [], rowsOut = [], c = { party: 0, item: 0, ob: 0, stock: 0, skip: 0, bad: 0, warn: 0, exists: 0 };
    var partyByKey = {}, bills = tables.bill || [], hasBill = {};
    bills.forEach(function (r) { if (!r.errs.length) hasBill[key(r.rec.party) + '|' + r.rec.side] = 1; });
    var obSeen = {};
    function addOb(name, side, amount, refs, role) {
      var k = key(name) + '|' + side;
      if (obSeen[k]) { obSeen[k].amount = r2(obSeen[k].amount + amount); if (refs) obSeen[k].refs = obSeen[k].refs.concat(refs); return; }
      var dup = (existing.ob || []).some(function (d) { return key(d.buyer && d.buyer.name) === key(name) && d.side === side; });
      if (dup) { c.exists++; return 'exists'; }
      obSeen[k] = { party: name, side: side, amount: amount, date: asOf, refs: refs || [] }; OB.push(obSeen[k]); c.ob++;
      if (!have.party[key(name)] && !partyByKey[key(name)]) { var np = { name: name, role: side === 'pay' ? 'supplier' : 'customer' }; partyByKey[key(name)] = np; P.push(np); c.party++; rowsOut.push({ s: 'party', line: 0, rec: np, errs: [], warns: [['fromBill']], status: 'new' }); }
    }
    (tables.party || []).forEach(function (r) {
      var o = { s: 'party', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() };
      rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.name);
      if (have.party[k]) { o.status = 'exists'; c.exists++; } else {
        var rec = Object.assign({}, r.rec); delete rec._ob; delete rec._grp;
        P.push(rec); partyByKey[k] = rec; c.party++; o.status = 'new';
      }
      if (r.rec._ob && !hasBill[k + '|' + r.rec._ob.side]) { var res = addOb(r.rec.name, r.rec._ob.side, r.rec._ob.amount, null); if (res === 'exists') o.warns.push(['obExists']); }
      else if (r.rec._ob) o.warns.push(['billsWin']);
    });
    (tables.item || []).forEach(function (r) {
      var o = { s: 'item', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() }; rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.desc);
      if (have.item[k]) { o.status = 'exists'; c.exists++; return; }
      var rec = Object.assign({}, r.rec), stk = rec._stk; delete rec._stk;
      I.push(rec); c.item++; o.status = 'new';
      if (stk) { STK.push(stk); c.stock++; }
    });
    var byPS = {};
    bills.forEach(function (r) {
      var o = { s: 'bill', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() }; rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.party) + '|' + r.rec.side; o.status = 'new';
      (byPS[k] = byPS[k] || { party: r.rec.party, side: r.rec.side, amount: 0, refs: [] });
      byPS[k].amount = r2(byPS[k].amount + r.rec.amount); byPS[k].refs.push({ no: r.rec.no, date: r.rec.date, amount: r.rec.amount });
    });
    Object.keys(byPS).forEach(function (k) { var b = byPS[k]; addOb(b.party, b.side, b.amount, b.refs); });
    rowsOut.forEach(function (o) { if (o.warns.length && o.status !== 'bad') c.warn++; });
    c.skip = c.exists;
    return { rows: rowsOut, parties: P, items: I, obs: OB, stock: STK, asOf: asOf, counts: c };
  }

  var API = { decode: decode, csvRows: csvRows, money: money, date: date, key: key, hk: hk, gstinCheck: gstinCheck, tallyXml: tallyXml, detect: detect, headings: headings, autoMap: autoMap, build: build, plan: plan, FIELDS: FIELDS, LABEL: LABEL, NAMEF: NAMEF, matchField: matchField,
    setDeps: function (d) { Object.keys(d || {}).forEach(function (k) { deps[k] = d[k]; }); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSImport = API;
})(this);
