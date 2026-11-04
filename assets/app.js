/* Nivesh Sahayak App (app.niveshsahayak.in): the full software on the same data home as the document sites.
   Phase 2, money in and out: dashboard, sales list with what is still due on each bill, money received and paid
   (linked to bills, part payments, advances), purchase bills and returns, expenses, dues with ageing,
   party statements (print, PDF, WhatsApp reminder), cash and bank books, opening balances, one-click convert.
   Accounts come from NSBooks (books.js); every record lives in the data home's 'doc' store, so the receipt and
   voucher sites can print what is saved here. Screen words: NS.t('app.<key>') when a language pack has it, else English below. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, B = NSBooks, key = B.key;
  var EN = {
    title: 'Nivesh Sahayak App', home: 'Dashboard', sales: 'Sales', buy: 'Purchases and expenses', money: 'Money in and out', dues: 'Dues', parties: 'Parties', cash: 'Cash and bank',
    biz: 'Business', nobiz: 'Add your business first', nobizp: 'Your business name, address and GSTIN are typed once in My data and used on every document.', addbiz: 'Add my business',
    today: 'Sales today', month: 'Sales this month', recv: 'To receive', pay: 'To pay', cashin: 'Cash in hand', bank: 'Bank and UPI',
    quick: 'Quick add', newinv: 'New invoice', min: 'Money received', mout: 'Money paid', pbill: 'Purchase bill', exp: 'Expense', ob: 'Opening balance', pret: 'Purchase return',
    overdue: 'Oldest dues', nodues: 'Nobody owes you anything right now.', recent: 'Latest entries', none: 'Nothing here yet.',
    remind: 'WhatsApp reminder', stmt: 'Statement', recpay: 'Record payment', open: 'Open', edit: 'Edit', del: 'Delete', print: 'Print', pdf: 'Share PDF', convert: 'Convert to',
    search: 'Search by name or number', all: 'All', unpaid: 'Due', paid: 'Paid', part: 'Part paid', left: '{a} due',
    d_invoice: 'Invoice', d_cashmemo: 'Cash memo', d_credit: 'Credit note', d_debit: 'Debit note', d_quote: 'Quotation', d_estimate: 'Estimate', d_proforma: 'Proforma invoice', d_so: 'Sales order', d_challan: 'Delivery challan',
    d_receipt: 'Money received', d_adv: 'Advance received', d_ref: 'Refund paid', d_voucher: 'Payment', d_vexp: 'Expense paid (voucher)', d_pbill: 'Purchase bill', d_pret: 'Purchase return', d_exp: 'Expense', d_ob: 'Opening balance', d_self: 'Self invoice', d_po: 'Purchase order',
    date: 'Date', party: 'Party', cust: 'Customer', supp: 'Supplier', amount: 'Amount (₹)', mode: 'Paid by', ref: 'Cheque / UTR / reference no.', note: 'Note',
    m_cash: 'Cash', m_upi: 'UPI', m_cheque: 'Cheque', m_bank: 'Bank transfer', m_card: 'Card', m_dd: 'Demand draft', m_other: 'Other', m_credit: 'Not paid yet (on credit)',
    tdsin: 'TDS cut by the customer (₹)', tdsinh: 'Only if they paid less because of TDS. The bill is settled by the money plus the TDS.',
    tdsout: 'TDS you cut (%)', tdsouth: 'Only if you deduct TDS from this payment. Ask your accountant which section applies.',
    against: 'Against which bills?', againsth: 'Ticked bills are settled first, oldest first. Anything left stays as an advance.', noopen: 'No unpaid bills. The whole amount is saved as an advance.',
    advleft: '{a} will be kept as an advance.', settle: 'Settles {a}', tickall: 'Tick oldest first',
    sno: 'Supplier\'s bill no.', due: 'Due date', gstin: 'Supplier GSTIN', state: 'Supplier state', items: 'Items', item: 'Item / service', hsn: 'HSN/SAC', qty: 'Qty', rate: 'Rate (₹)', gst: 'GST %', addline: '+ Add a line', rmline: 'Remove line',
    nogst: 'No GST on this bill (unregistered supplier or exempt goods)', round: 'Round off the total', taxable: 'Taxable value', tax: 'GST', total: 'Total', origno: 'Return against bill no.',
    paidnow: 'Paid now?', paidnowh: 'Pick how you paid if you paid at once. A payment entry is saved with it.',
    cat: 'Expense type', payee: 'Paid to', incgst: 'GST included in the amount (%)', itc: 'I will claim input tax credit on this GST', inter: 'Bill from another state (IGST)', billno: 'Bill / receipt no.',
    side: 'Who owes whom on the start date?', s_recv: 'They owe me', s_pay: 'I owe them', obh: 'Use this once per party for money already due before you started using the app, for example on 1 April.',
    save: 'Save', cancel: 'Cancel', saved: 'Saved', deleted: 'Deleted', cdel: 'Delete {x}? This cannot be undone.', need: 'Please fill: {f}', samebill: 'A purchase bill {no} from {p} is already saved. Save another?',
    from: 'From', to: 'To', opening: 'Opening balance', closing: 'Closing balance', debit: 'Debit (₹)', credit: 'Credit (₹)', balance: 'Balance (₹)', particulars: 'Particulars',
    dr: 'Dr', cr: 'Cr', theyowe: '{p} owes you {a}', weowe: 'You owe {p} {a}', settled: 'All settled with {p}',
    age: 'Age', a0: '0–30 days', a1: '31–60 days', a2: '61–90 days', a3: 'Over 90 days', totaldue: 'Total due', days: '{n} days', ageh: 'Age is counted from the bill date.',
    wamsg: 'Dear {p},\nThis is a gentle reminder that {a} is due to {b} as on {d}.{bills}\nPlease pay at your earliest convenience.{upi}\nThank you.',
    wabills: '\nBills: {l}', waupi: '\nUPI: {u}', nophone: 'No phone number saved for {p}. Add it in My data, or pick the contact in WhatsApp.',
    cashbook: 'Cash book', bankbook: 'Bank book (UPI, cheque, transfer, card)', in: 'In (₹)', out: 'Out (₹)', cbh: 'Every cash and bank entry from your sales, receipts, payments, purchase bills and expenses.',
    makeinv: 'Invoice', makeso: 'Sales order', makedc: 'Delivery challan', made: 'Made: {x}',
    stp: 'Statement of account', stpfor: 'Statement of account of {p}', stpfrom: 'From {a} to {b}', gen: 'Made with the Nivesh Sahayak App on {d}',
    local: 'Saved only on this site in this browser, because the data home could not load. It moves into the data home next time.', vault: 'Saved in this browser\'s data home, shared by every Nivesh Sahayak tool. Nothing is sent to us.',
    help: 'How it works', helpp: 'Bills you make on billing., cash-memo. and credit-note. show up here by themselves. Record money received and paid here; the app links it to bills, keeps advances and works out dues and cash in hand.',
    invfix: 'Invoices settled here are marked Paid on the billing site too.', ex_rent: 'Rent', ex_power: 'Electricity', ex_salary: 'Salary and wages', ex_transport: 'Transport and freight', ex_phone: 'Phone and internet', ex_repair: 'Repairs and maintenance',
    ex_office: 'Office expenses', ex_fuel: 'Fuel', ex_bank: 'Bank charges', ex_prof: 'Professional fees', ex_ads: 'Advertising', ex_misc: 'Miscellaneous',
    back: '‹ Back', more: 'Show more', fy: 'Financial year {y}', advance: 'Advance', advh: 'Money received or paid ahead of a bill.', advof: 'Advance with {p}: {a}'
  };
  function T(k, v) { var s = NS.t('app.' + k, v); if (s !== 'app.' + k) return s; s = EN[k] != null ? EN[k] : k; return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; }

  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var TOOLS = (window.NS_CFG && NS_CFG.tools) || [];
  var SITEOF = { invoice: 'billing', quote: 'quotation', proforma: 'proforma', so: 'sales-order', challan: 'challan', po: 'purchase-order', self: 'self-invoice', note: 'credit-note', cashmemo: 'cash-memo', receipt: 'receipt', voucher: 'voucher' };
  function toolUrl(site) { var x = TOOLS.filter(function (x) { return x[0] === site; })[0]; if (!x) return '#'; return LOCAL ? 'http://localhost:' + x[4] + '/' : 'https://' + x[1] + '/'; }
  function myUrl(h) { return (LOCAL ? 'http://localhost:8862/' : 'https://my.niveshsahayak.in/') + (h || ''); }
  var MODES = ['cash', 'upi', 'cheque', 'bank', 'card', 'dd', 'other'];
  var EXP = ['rent', 'power', 'salary', 'transport', 'phone', 'repair', 'office', 'fuel', 'bank', 'prof', 'ads', 'misc'];
  var SALES = { invoice: 1, cashmemo: 1, note: 1, quote: 1, proforma: 1, so: 1, challan: 1 };
  var CONVERT = { quote: ['so', 'challan', 'invoice'], proforma: ['invoice'], so: ['challan', 'invoice'], challan: ['invoice'] };
  var SECS = ['home', 'sales', 'buy', 'money', 'dues', 'parties', 'cash', 'st'];

  var C = { biz: [], party: [], item: [], doc: [] }, CFG = {}, BIZ = null, cur = 'home', arg = '', q = '', filt = 'all';

  function load() {
    return Promise.all(['biz', 'party', 'item', 'doc'].map(function (s) { return NSStore.list(s); }).concat([NSStore.meta('settings')])).then(function (r) {
      C = { biz: r[0], party: r[1], item: r[2], doc: r[3] }; CFG = r[4] || {};
      var want; try { want = localStorage.getItem('ns-app-biz'); } catch (e) {}
      BIZ = C.biz.filter(function (b) { return b.id === want; })[0] || C.biz.filter(function (b) { return b.id === CFG.defBiz; })[0] || C.biz[0] || null;
      if (!BIZ) {   /* no business master yet: use the seller name of the newest bill */
        var d = C.doc.slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); }).filter(function (d) { return d.seller && d.seller.name; })[0];
        if (d) BIZ = Object.assign({ id: '', name: d.seller.name }, d.seller);
      }
    });
  }
  function bizName() { return BIZ ? BIZ.name : ''; }
  function mine() { var b = key(bizName()); return C.doc.filter(function (d) { return key(d.seller && d.seller.name) === b; }); }
  function sellerCopy() { var s = JSON.parse(JSON.stringify(BIZ || {})); delete s.id; delete s.created; delete s.updated; return s; }
  function docName(d) {
    var ty = d.type || 'invoice';
    if (ty === 'note') return T(d.kind === 'debit' ? 'd_debit' : 'd_credit');
    if (ty === 'quote') return T(d.kind === 'estimate' ? 'd_estimate' : 'd_quote');
    if (ty === 'receipt') return T(d.kind === 'adv' ? 'd_adv' : d.kind === 'ref' ? 'd_ref' : 'd_receipt');
    if (ty === 'voucher') return T(d.forBill ? 'd_voucher' : 'd_vexp');
    if (ty === 'pbill') return T(d.kind === 'return' ? 'd_pret' : 'd_pbill');
    return T('d_' + ty);
  }
  function ldate(iso) { return NS.fmtDate(iso); }
  function fyStart(iso) { return NS.fy(iso).slice(0, 4) + '-04-01'; }
  function amountOf(d) {
    var R = B.role(d);
    if (R === 'in' || R === 'refund' || R === 'exp' || R === 'ob') return num(d.amount);
    if (R === 'out' || R === 'outexp') return r2((d.lines || []).reduce(function (a, l) { return a + num(l.amt); }, 0));
    return num(d.total);
  }

  /* ---------- sections ---------- */
  function route() {
    var h = decodeURIComponent(location.hash.slice(1)), p = h.split('/');
    cur = SECS.indexOf(p[0]) >= 0 ? p[0] : 'home'; arg = p.slice(1).join('/');
    show(true);
  }
  function go(h) { location.hash = h; }
  function show(focus) {
    $$('[data-sec]').forEach(function (b) { var on = b.getAttribute('data-sec') === (cur === 'st' ? 'parties' : cur); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    return load().then(function () {
      var pane = $('[data-pane]');
      $('[data-mode]').textContent = T(NSStore.mode() === 'vault' ? 'vault' : 'local');
      labels();
      if (!BIZ) { pane.innerHTML = noBiz(); return; }
      pane.innerHTML = bizBar() + ({ home: homeHtml, sales: salesHtml, buy: buyHtml, money: moneyHtml, dues: duesHtml, parties: partiesHtml, cash: cashHtml, st: stHtml })[cur]();
      wire(pane);
      if (focus) { var h2 = $('h2', pane); if (h2) { h2.tabIndex = -1; h2.focus({ preventScroll: true }); } }
    });
  }
  function labels() {
    $$('[data-sec]').forEach(function (b) { $('span', b).textContent = T(b.getAttribute('data-sec')); });
    $$('[data-t]').forEach(function (e) { e.textContent = T(e.getAttribute('data-t')); });
  }
  function noBiz() {
    return '<div class="card"><h2>' + esc(T('nobiz')) + '</h2><p>' + esc(T('nobizp')) + '</p><p><a class="btn primary" href="' + myUrl('#biz') + '">' + esc(T('addbiz')) + '</a></p></div>';
  }
  function bizBar() {
    if (C.biz.length < 2) return '';
    return '<div class="bizbar"><label for="app-biz">' + esc(T('biz')) + '</label><select id="app-biz" data-biz>' + C.biz.map(function (b) {
      return '<option value="' + esc(b.id) + '"' + (BIZ && b.id === BIZ.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select></div>';
  }

  /* ---------- dashboard ---------- */
  function homeHtml() {
    var D = mine(), today = NS.today(), mon = today.slice(0, 7), A = B.accounts(D, bizName()), P = B.parties(D, bizName());
    var sales = function (pred) { return r2(D.filter(function (d) { return B.role(d) === 'sale' && pred(d.date || ''); }).reduce(function (a, d) { return a + num(d.total); }, 0)); };
    var recv = 0, pay = 0;
    Object.keys(P).forEach(function (k) { if (P[k].bal > 0) recv += P[k].bal; else pay -= P[k].bal; });
    var bw = B.bills(D, bizName()).bills.filter(function (b) { return b.side === 'recv'; }).sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 6);
    var tiles = [['today', sales(function (x) { return x === today; }), '#sales'], ['month', sales(function (x) { return x.slice(0, 7) === mon; }), '#sales'],
      ['recv', r2(recv), '#dues'], ['pay', r2(pay), '#dues/pay'], ['cashin', A.cash || 0, '#cash'], ['bank', A.bank || 0, '#cash/bank']];
    var recent = D.filter(function (d) { return B.role(d); }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.updated || 0) - (a.updated || 0); }).slice(0, 8);
    return '<h2>' + esc(T('home')) + ' <small class="soft">' + esc(bizName()) + '</small></h2>' +
      '<div class="tiles">' + tiles.map(function (x) { return '<a href="' + x[2] + '" class="tile' + (x[1] < 0 ? ' neg' : '') + '"><span>' + esc(T(x[0])) + '</span><b>' + money(x[1]) + '</b></a>'; }).join('') + '</div>' +
      '<div class="card"><h3>' + esc(T('quick')) + '</h3><div class="quick">' +
        '<a class="btn primary" href="' + toolUrl('billing') + '">+ ' + esc(T('newinv')) + '</a>' +
        ['min', 'mout', 'pbill', 'exp', 'ob'].map(function (f) { return '<button type="button" class="btn" data-form="' + f + '">+ ' + esc(T(f)) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card"><h3>' + esc(T('overdue')) + '</h3>' + (bw.length ? '<ul class="rows">' + bw.map(function (b) {
        return '<li><a href="#st/' + encodeURIComponent(key(b.party)) + '"><b>' + esc(b.party) + '</b><span class="soft">' + esc(docName(b)) + ' ' + esc(b.no) + ' · ' + ldate(b.date) + ' · ' + esc(T('days', { n: B.daysBetween(b.date, today) })) + '</span></a><b class="amt">' + money(b.left) + '</b></li>'; }).join('') + '</ul>'
        : '<p class="soft">' + esc(T('nodues')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('recent')) + '</h3>' + rowsHtml(recent) + '</div>' +
      '<details class="card"><summary><b>' + esc(T('help')) + '</b></summary><p>' + esc(T('helpp')) + '</p><p class="soft">' + esc(T('invfix')) + '</p></details>';
  }

  /* one line per record, with its actions */
  function rowsHtml(list, opts) {
    opts = opts || {};
    if (!list.length) return '<p class="soft">' + esc(T('none')) + '</p>';
    var left = opts.left || {};
    return '<ul class="rows">' + list.map(function (d) {
      var ty = d.type || 'invoice', site = SITEOF[ty], appMade = d.app || /^(pbill|exp|ob)$/.test(ty), pills = '';
      if (left[d.id] != null) pills = left[d.id] <= 0.004 ? '<span class="pill ok">' + esc(T('paid')) + '</span>' : left[d.id] < amountOf(d) - 0.004 ? '<span class="pill warn">' + esc(T('left', { a: money(left[d.id]) })) + '</span>' : '<span class="pill warn">' + esc(T('unpaid')) + '</span>';
      if (d.nextNo) pills += ' <span class="pill">' + esc(T('made', { x: d.nextNo })) + '</span>';
      if (d.status === 'inv' && d.invNo) pills += ' <span class="pill ok">' + esc(T('made', { x: d.invNo })) + '</span>';
      var acts = [];
      if (appMade && !/^(receipt|voucher)$/.test(ty)) acts.push('<button type="button" class="btn sm" data-edit="' + d.id + '">' + esc(T('edit')) + '</button>');
      else if (site) acts.push('<a class="btn sm" href="' + toolUrl(site) + '?open=' + encodeURIComponent(d.id) + '">' + esc(T('open')) + '</a>');
      if (left[d.id] > 0.004 && (ty === 'invoice' || ty === 'cashmemo')) acts.push('<button type="button" class="btn sm" data-form="min" data-for="' + d.id + '">' + esc(T('recpay')) + '</button>');
      if (left[d.id] > 0.004 && ty === 'pbill') acts.push('<button type="button" class="btn sm" data-form="mout" data-for="' + d.id + '">' + esc(T('recpay')) + '</button>');
      if (CONVERT[ty] && !opts.noconv) acts.push('<select class="sm conv" data-conv="' + d.id + '" aria-label="' + esc(T('convert')) + ' ' + esc(d.no || '') + '"><option value="">' + esc(T('convert')) + '…</option>' +
        CONVERT[ty].map(function (x) { return '<option value="' + x + '">' + esc(T(x === 'invoice' ? 'makeinv' : x === 'so' ? 'makeso' : 'makedc')) + '</option>'; }).join('') + '</select>');
      if (appMade) acts.push('<button type="button" class="btn sm danger" data-del="' + d.id + '">' + esc(T('del')) + '</button>');
      return '<li><div class="ln"><span><b>' + esc(docName(d)) + ' ' + esc(d.no || d.billNo || '') + '</b> ' + pills + '<span class="soft"> · ' + ldate(d.date) + (B.partyName(d) ? ' · ' + esc(B.partyName(d)) : d.cat ? ' · ' + esc(d.cat) : '') + '</span></span>' +
        '<b class="amt">' + money(amountOf(d)) + '</b></div><div class="acts">' + acts.join('') + '</div></li>';
    }).join('') + '</ul>';
  }
  function leftMap(D) { var m = {}; D.forEach(function (d) { if (/^(sale|buy|sdeb)$/.test(B.role(d))) m[d.id] = 0; }); B.bills(D, bizName()).bills.forEach(function (b) { m[b.id] = b.left; }); return m; }
  function searchBar(filters) {
    return '<div class="tools-row"><label class="sr" for="app-q">' + esc(T('search')) + '</label><input id="app-q" type="search" data-q value="' + esc(q) + '" placeholder="' + esc(T('search')) + '">' +
      (filters ? '<div class="seg" role="group">' + filters.map(function (f) { return '<button type="button" class="btn sm" data-filt="' + f + '" aria-pressed="' + (filt === f) + '">' + esc(T(f)) + '</button>'; }).join('') + '</div>' : '') + '</div>';
  }
  function match(d) { return !q || JSON.stringify([d.no, d.billNo, B.partyName(d), d.cat, d.ref]).toLowerCase().indexOf(q.toLowerCase()) >= 0; }
  function byDate(a, b) { return (b.date || '').localeCompare(a.date || '') || (b.updated || 0) - (a.updated || 0); }

  function salesHtml() {
    var D = mine(), L = leftMap(D);
    var list = D.filter(function (d) { return SALES[d.type || 'invoice']; }).filter(match).filter(function (d) {
      if (filt === 'unpaid') return L[d.id] > 0.004; if (filt === 'paid') return L[d.id] != null && L[d.id] <= 0.004; return true; }).sort(byDate);
    return '<div class="pane-hd"><h2>' + esc(T('sales')) + '</h2><a class="btn primary" href="' + toolUrl('billing') + '">+ ' + esc(T('newinv')) + '</a></div>' + searchBar(['all', 'unpaid', 'paid']) + rowsHtml(list.slice(0, 200), { left: L });
  }
  function buyHtml() {
    var D = mine(), L = leftMap(D);
    var list = D.filter(function (d) { return /^(pbill|exp|self|po)$/.test(d.type) || d.type === 'voucher' && !d.forBill; }).filter(match).filter(function (d) {
      if (filt === 'unpaid') return L[d.id] > 0.004 || d.type === 'exp' && d.mode === 'credit'; if (filt === 'paid') return L[d.id] != null && L[d.id] <= 0.004; return true; }).sort(byDate);
    return '<div class="pane-hd"><h2>' + esc(T('buy')) + '</h2><div class="quick">' + ['pbill', 'exp', 'pret'].map(function (f) { return '<button type="button" class="btn' + (f === 'pbill' ? ' primary' : '') + '" data-form="' + f + '">+ ' + esc(T(f)) + '</button>'; }).join('') + '</div></div>' +
      searchBar(['all', 'unpaid', 'paid']) + rowsHtml(list.slice(0, 200), { left: L });
  }
  function moneyHtml() {
    var list = mine().filter(function (d) { return d.type === 'receipt' || d.type === 'voucher' && d.forBill || d.type === 'ob'; }).filter(match).sort(byDate);
    return '<div class="pane-hd"><h2>' + esc(T('money')) + '</h2><div class="quick"><button type="button" class="btn primary" data-form="min">+ ' + esc(T('min')) + '</button><button type="button" class="btn" data-form="mout">+ ' + esc(T('mout')) + '</button><button type="button" class="btn" data-form="ob">+ ' + esc(T('ob')) + '</button></div></div>' +
      searchBar() + rowsHtml(list.slice(0, 200));
  }

  /* ---------- dues with ageing ---------- */
  function duesHtml() {
    var side = arg === 'pay' ? 'pay' : 'recv', D = mine(), today = NS.today(), R = B.bills(D, bizName());
    var by = {};
    R.bills.filter(function (b) { return b.side === side; }).forEach(function (b) { var k = key(b.party); (by[k] = by[k] || { name: b.party, list: [] }).list.push(b); });
    var P = B.parties(D, bizName()), rows = Object.keys(by).map(function (k) { var a = B.ageing(by[k].list, today); return { k: k, name: by[k].name, a: a, tot: r2(a[0] + a[1] + a[2] + a[3]), phone: phoneOf(k, P) }; })
      .filter(function (r) { return !q || r.name.toLowerCase().indexOf(q.toLowerCase()) >= 0; }).sort(function (a, b) { return b.tot - a.tot; });
    var tot = [0, 0, 0, 0]; rows.forEach(function (r) { r.a.forEach(function (v, i) { tot[i] = r2(tot[i] + v); }); });
    var advs = Object.keys(R.advances).filter(function (k) { return R.advances[k][side] > 0.004; });
    return '<div class="pane-hd"><h2>' + esc(T('dues')) + '</h2><div class="seg" role="group"><a class="btn sm" href="#dues" aria-pressed="' + (side === 'recv') + '">' + esc(T('recv')) + '</a><a class="btn sm" href="#dues/pay" aria-pressed="' + (side === 'pay') + '">' + esc(T('pay')) + '</a></div></div>' +
      '<div class="tiles">' + ['a0', 'a1', 'a2', 'a3'].map(function (x, i) { return '<div class="tile' + (i === 3 && tot[3] ? ' warn' : '') + '"><span>' + esc(T(x)) + '</span><b>' + money(tot[i]) + '</b></div>'; }).join('') + '</div>' +
      searchBar() +
      (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('party')) + '</th>' + ['a0', 'a1', 'a2', 'a3'].map(function (x) { return '<th class="n">' + esc(T(x)) + '</th>'; }).join('') + '<th class="n">' + esc(T('totaldue')) + '</th><th></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><th scope="row"><a href="#st/' + encodeURIComponent(r.k) + '">' + esc(r.name) + '</a></th>' + r.a.map(function (v) { return '<td class="n">' + (v ? money(v, false) : '—') + '</td>'; }).join('') +
            '<td class="n"><b>' + money(r.tot, false) + '</b></td><td class="acts">' + (side === 'recv' ? '<button type="button" class="btn sm wa" data-wa="' + esc(r.k) + '">' + esc(T('remind')) + '</button>' : '') +
            '<button type="button" class="btn sm" data-form="' + (side === 'recv' ? 'min' : 'mout') + '" data-party="' + esc(r.name) + '">' + esc(T('recpay')) + '</button></td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="soft">' + esc(T('nodues')) + '</p>') +
      '<p class="soft">' + esc(T('ageh')) + '</p>' +
      (advs.length ? '<div class="card"><h3>' + esc(T('advance')) + '</h3><p class="soft">' + esc(T('advh')) + '</p><ul class="rows">' + advs.map(function (k) {
        return '<li><a href="#st/' + encodeURIComponent(k) + '"><b>' + esc((P[k] || { name: k }).name) + '</b></a><b class="amt">' + money(R.advances[k][side]) + '</b></li>'; }).join('') + '</ul></div>' : '');
  }
  function phoneOf(k, P) {
    var m = C.party.filter(function (p) { return key(p.name) === k; })[0];
    return String(m && m.phone || P && P[k] && P[k].phone || '').replace(/\D/g, '');
  }

  function partiesHtml() {
    var P = B.parties(mine(), bizName()), list = Object.keys(P).map(function (k) { return P[k]; }).filter(function (p) { return !q || p.name.toLowerCase().indexOf(q.toLowerCase()) >= 0; })
      .sort(function (a, b) { return Math.abs(b.bal) - Math.abs(a.bal); });
    return '<div class="pane-hd"><h2>' + esc(T('parties')) + '</h2><a class="btn" href="' + myUrl('#party') + '">' + esc(NS.t('my.t.party')) + ' ›</a></div>' + searchBar() +
      (list.length ? '<ul class="rows">' + list.map(function (p) {
        return '<li><a href="#st/' + encodeURIComponent(p.key) + '"><b>' + esc(p.name) + '</b><span class="soft">' + esc(p.bal > 0.004 ? T('theyowe', { p: '', a: '' }).trim() : p.bal < -0.004 ? T('weowe', { p: '', a: '' }).replace(/\s+/g, ' ').trim() : T('settled', { p: '' }).trim()) + '</span></a>' +
          '<b class="amt' + (p.bal < 0 ? ' neg' : '') + '">' + money(Math.abs(p.bal)) + (p.bal > 0.004 ? ' ' + T('dr') : p.bal < -0.004 ? ' ' + T('cr') : '') + '</b></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('none')) + '</p>');
  }

  /* ---------- statement of account ---------- */
  var stFrom = '', stTo = '';
  function stHtml() {
    var k = arg, D = mine(), P = B.parties(D, bizName()), p = P[k] || { name: (C.party.filter(function (x) { return key(x.name) === k; })[0] || {}).name || k, bal: 0 };
    var today = NS.today(); if (!stTo) stTo = today; if (!stFrom) stFrom = fyStart(today);
    var S = B.statement(D, bizName(), k, stFrom, stTo), open = B.bills(D, bizName(), k).bills;
    var bal = function (v) { return money(Math.abs(v), false) + (v > 0.004 ? ' ' + T('dr') : v < -0.004 ? ' ' + T('cr') : ''); };
    var line = p.bal > 0.004 ? T('theyowe', { p: p.name, a: money(p.bal) }) : p.bal < -0.004 ? T('weowe', { p: p.name, a: money(-p.bal) }) : T('settled', { p: p.name });
    return '<p><a href="#parties" class="link">' + esc(T('back')) + '</a></p><div class="pane-hd"><h2>' + esc(p.name) + '</h2><div class="quick">' +
        (p.bal > 0.004 ? '<button type="button" class="btn wa" data-wa="' + esc(k) + '">' + esc(T('remind')) + '</button>' : '') +
        '<button type="button" class="btn" data-form="' + (p.bal < 0 ? 'mout' : 'min') + '" data-party="' + esc(p.name) + '">' + esc(T('recpay')) + '</button>' +
        '<button type="button" class="btn" data-print>' + esc(T('print')) + '</button><button type="button" class="btn" data-pdf>' + esc(T('pdf')) + '</button></div></div>' +
      '<p class="big">' + esc(line) + '</p>' +
      '<div class="tools-row"><label>' + esc(T('from')) + ' <input type="date" data-stfrom value="' + stFrom + '"></label><label>' + esc(T('to')) + ' <input type="date" data-stto value="' + stTo + '"></label></div>' +
      '<div class="tbl-wrap"><div class="stsheet sh" data-sheet>' +
        '<div class="st-hd"><div><b>' + esc(bizName()) + '</b>' + (BIZ.addr ? '<br>' + esc(BIZ.addr).replace(/\n/g, '<br>') : '') + (BIZ.gstin ? '<br>GSTIN ' + esc(BIZ.gstin) : '') + (BIZ.phone ? '<br>' + esc(BIZ.phone) : '') + '</div>' +
        '<div class="r"><b>STATEMENT OF ACCOUNT</b><br>' + esc(p.name) + '<br>' + ldate(stFrom) + ' to ' + ldate(stTo) + '</div></div>' +
        '<table class="tbl st"><thead><tr><th>Date</th><th>Particulars</th><th class="n">Debit</th><th class="n">Credit</th><th class="n">Balance</th></tr></thead><tbody>' +
        '<tr><td>' + ldate(stFrom) + '</td><td>Opening balance</td><td class="n"></td><td class="n"></td><td class="n">' + bal(S.open) + '</td></tr>' +
        S.rows.map(function (r) { return '<tr><td>' + ldate(r.date) + '</td><td>' + esc(enName(r.d)) + ' ' + esc(r.d.no || '') + (r.d.ref ? ' <span class="soft">(' + esc(r.d.ref) + ')</span>' : '') + '</td><td class="n">' + (r.dr ? money(r.dr, false) : '') + '</td><td class="n">' + (r.cr ? money(r.cr, false) : '') + '</td><td class="n">' + bal(r.bal) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th colspan="2">Closing balance</th><th class="n">' + money(S.dr, false) + '</th><th class="n">' + money(S.cr, false) + '</th><th class="n">' + bal(S.close) + '</th></tr></tfoot></table>' +
        (open.length ? '<p class="st-open"><b>Unpaid bills:</b> ' + open.map(function (b) { return esc(b.no || enName(b)) + ' (' + ldate(b.date) + ') ' + money(b.left); }).join(', ') + '</p>' : '') +
        '<p class="st-ft">Made with the Nivesh Sahayak App on ' + ldate(today) + '. Dr = amount due to ' + esc(bizName()) + '; Cr = amount due from ' + esc(bizName()) + '.</p></div></div>' +
      '<h3>' + esc(T('recent')) + '</h3>' + rowsHtml(D.filter(function (d) { return key(B.partyName(d)) === k && B.role(d); }).sort(byDate).slice(0, 30), { left: leftMap(D) });
  }
  /* the statement is printed in English like every document */
  var ENDOC = { invoice: 'Invoice', cashmemo: 'Cash memo', credit: 'Credit note', debit: 'Debit note', receipt: 'Receipt', adv: 'Advance received', ref: 'Refund paid', voucher: 'Payment', pbill: 'Purchase bill', pret: 'Purchase return', exp: 'Expense', ob: 'Opening balance', self: 'Self invoice' };
  function enName(d) {
    var ty = d.type || 'invoice';
    return ENDOC[ty === 'note' ? d.kind : ty === 'receipt' && d.kind !== 'pay' ? d.kind : ty === 'pbill' && d.kind === 'return' ? 'pret' : ty] || ty;
  }

  /* ---------- cash and bank ---------- */
  function cashHtml() {
    var acct = arg === 'bank' ? 'bank' : 'cash', today = NS.today();
    if (!stTo) stTo = today; if (!stFrom) stFrom = fyStart(today);
    var Bk = B.book(mine(), bizName(), acct, stFrom, stTo);
    return '<div class="pane-hd"><h2>' + esc(T('cash')) + '</h2><div class="seg" role="group"><a class="btn sm" href="#cash" aria-pressed="' + (acct === 'cash') + '">' + esc(T('cashbook')) + '</a><a class="btn sm" href="#cash/bank" aria-pressed="' + (acct === 'bank') + '">' + esc(T('bankbook')) + '</a></div></div>' +
      '<p class="soft">' + esc(T('cbh')) + '</p>' +
      '<div class="tools-row"><label>' + esc(T('from')) + ' <input type="date" data-stfrom value="' + stFrom + '"></label><label>' + esc(T('to')) + ' <input type="date" data-stto value="' + stTo + '"></label></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('date')) + '</th><th>' + esc(T('particulars')) + '</th><th class="n">' + esc(T('in')) + '</th><th class="n">' + esc(T('out')) + '</th><th class="n">' + esc(T('balance')) + '</th></tr></thead><tbody>' +
      '<tr><td>' + ldate(stFrom) + '</td><td>' + esc(T('opening')) + '</td><td></td><td></td><td class="n">' + money(Bk.open, false) + '</td></tr>' +
      Bk.rows.map(function (r) { return '<tr><td>' + ldate(r.date) + '</td><td>' + esc(docName(r.d)) + ' ' + esc(r.d.no || '') + (B.partyName(r.d) ? ' · ' + esc(B.partyName(r.d)) : r.d.cat ? ' · ' + esc(r.d.cat) : '') + '</td><td class="n">' + (r.dr ? money(r.dr, false) : '') + '</td><td class="n">' + (r.cr ? money(r.cr, false) : '') + '</td><td class="n">' + money(r.bal, false) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th colspan="4">' + esc(T('closing')) + '</th><th class="n">' + money(Bk.close, false) + '</th></tr></tfoot></table></div>';
  }

  /* ---------- events ---------- */
  function wire(pane) {
    var bs = $('[data-biz]', pane);
    if (bs) bs.addEventListener('change', function () { try { localStorage.setItem('ns-app-biz', bs.value); } catch (e) {} show(); });
    var qi = $('[data-q]', pane);
    if (qi) qi.addEventListener('input', function () { q = qi.value; var pos = qi.selectionStart; show().then(function () { var n = $('[data-q]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); });
    $$('[data-filt]', pane).forEach(function (b) { b.addEventListener('click', function () { filt = b.getAttribute('data-filt'); show(); }); });
    $$('[data-stfrom],[data-stto]', pane).forEach(function (i) { i.addEventListener('change', function () { if (i.hasAttribute('data-stfrom')) stFrom = i.value; else stTo = i.value; show(); }); });
    pane.addEventListener('click', onClick);
    $$('[data-conv]', pane).forEach(function (s) { s.addEventListener('change', function () { if (!s.value) return; location.href = toolUrl(SITEOF[s.value]) + '?from=' + encodeURIComponent(s.getAttribute('data-conv')); }); });
  }
  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-form')) openForm(b.getAttribute('data-form'), { forId: b.getAttribute('data-for'), party: b.getAttribute('data-party') });
    else if (b.hasAttribute('data-edit')) { var d = C.doc.filter(function (x) { return x.id === b.getAttribute('data-edit'); })[0]; if (d) openForm(formOf(d), { rec: d }); }
    else if (b.hasAttribute('data-del')) delRec(b.getAttribute('data-del'));
    else if (b.hasAttribute('data-wa')) whatsapp(b.getAttribute('data-wa'));
    else if (b.hasAttribute('data-print')) window.print();
    else if (b.hasAttribute('data-pdf')) { var p = B.parties(mine(), bizName())[arg]; NS.sharePdf($$('[data-sheet]'), 'Statement ' + (p ? p.name : arg) + ' ' + stTo, 'a4', 'Statement of account', ''); }
  }
  function formOf(d) { return d.type === 'exp' ? 'exp' : d.type === 'ob' ? 'ob' : d.type === 'pbill' ? (d.kind === 'return' ? 'pret' : 'pbill') : d.type === 'receipt' ? 'min' : 'mout'; }

  function delRec(id) {
    var d = C.doc.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    if (!confirm(T('cdel', { x: docName(d) + ' ' + (d.no || '') }))) return;
    var jobs = [NSStore.del('doc', id)];
    /* bills this payment had marked Paid go back to unpaid */
    C.doc.forEach(function (x) { if (x.paidBy === id) { x.status = 'unpaid'; delete x.paidBy; jobs.push(NSStore.put('doc', x)); } });
    Promise.all(jobs).then(function () { NS.toast(T('deleted')); show(); });
  }

  function whatsapp(k) {
    var D = mine(), P = B.parties(D, bizName()), p = P[k]; if (!p || p.bal <= 0) return;
    var open = B.bills(D, bizName(), k).bills.filter(function (b) { return b.side === 'recv'; });
    var msg = T('wamsg', { p: p.name, a: money(p.bal), b: bizName(), d: ldate(NS.today()),
      bills: open.length ? T('wabills', { l: open.slice(0, 8).map(function (b) { return (b.no || docName(b)) + ' ' + ldate(b.date) + ' ' + money(b.left); }).join(', ') }) : '',
      upi: BIZ.upi ? T('waupi', { u: BIZ.upi }) : '' });
    var ph = phoneOf(k, P);
    if (ph.length === 10) ph = '91' + ph;
    if (!ph) NS.toast(T('nophone', { p: p.name }));
    window.open('https://wa.me/' + (ph.length >= 11 ? ph : '') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }

  /* ---------- forms ---------- */
  var dlg, form, F = null;
  function fld(id, label, html, o) { o = o || {}; return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + html + (o.hint ? '<small class="soft">' + esc(o.hint) + '</small>' : '') + '</div>'; }
  function inp(id, v, o) { o = o || {}; return '<input id="' + id + '" name="' + id + '" value="' + esc(v == null ? '' : v) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ltr ? ' dir="ltr"' : ' dir="auto"') + (o.req ? ' required' : '') + (o.list ? ' list="' + o.list + '"' : '') + ' autocomplete="off">'; }
  function sel(id, v, opts) { return '<select id="' + id + '" name="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function modeOpts(credit) { return (credit ? [['credit', T('m_credit')]] : []).concat(MODES.map(function (m) { return [m, T('m_' + m)]; })); }
  function partyList(role) {
    var seen = {}, out = [];
    C.party.forEach(function (p) { if (!role || !p.role || p.role === role || p.role === 'both') { seen[key(p.name)] = 1; out.push(p.name); } });
    mine().forEach(function (d) { var n = B.partyName(d); if (n && !seen[key(n)]) { seen[key(n)] = 1; out.push(n); } });
    return '<datalist id="dl-party">' + out.sort().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>';
  }
  function nextNo(type, pre, date) {
    var fy = NS.fy(date), short = fy.slice(2, 4) + '-' + fy.slice(5), c = CFG[type] || {}, digits = Math.min(6, Math.max(1, +((CFG.invoice || {}).digits) || 3)), max = 0;
    pre = String(c.prefix != null && c.prefix !== '' ? c.prefix : pre).replace(/[^A-Za-z0-9\/\-]/g, '');
    mine().forEach(function (d) { if (d.type !== type || NS.fy(d.date) !== fy) return; var m = String(d.no || '').match(/(\d+)\s*$/); if (m) max = Math.max(max, +m[1]); });
    return (pre ? pre + '/' : '') + short + '/' + String(max + 1).padStart(digits, '0');
  }

  function openForm(kind, o) {
    o = o || {};
    if (!dlg) { dlg = $('#app-form'); form = $('form', dlg); form.addEventListener('submit', function (e) { e.preventDefault(); submit(); }); form.addEventListener('input', onFormInput); form.addEventListener('change', onFormInput); }
    var rec = o.rec || null, today = NS.today(), h = '';
    F = { kind: kind, rec: rec, forId: o.forId };
    var forDoc = o.forId && C.doc.filter(function (d) { return d.id === o.forId; })[0];
    var party = rec ? B.partyName(rec) : o.party || (forDoc ? B.partyName(forDoc) : '');
    if (kind === 'min' || kind === 'mout') {
      var out = kind === 'mout', amt = rec ? (out ? amountOf(rec) : num(rec.amount)) : '';
      if (!rec && forDoc) { var bl = B.bills(mine(), bizName()).bills.filter(function (b) { return b.id === forDoc.id; })[0]; amt = bl ? bl.left : ''; }
      h = '<div class="fg">' + fld('f-date', T('date'), inp('f-date', rec ? rec.date : today, { type: 'date', req: 1 })) +
        fld('f-party', T(out ? 'supp' : 'cust'), inp('f-party', party, { req: 1, list: 'dl-party' }) + partyList(out ? 'supplier' : 'customer')) +
        fld('f-amt', T('amount'), inp('f-amt', amt, { mode: 'decimal', ltr: 1, req: 1 })) +
        fld('f-mode', T('mode'), sel('f-mode', rec ? rec.mode : 'upi', modeOpts())) +
        (out ? fld('f-tds', T('tdsout'), inp('f-tds', rec ? rec.tdsRate : '', { mode: 'decimal', ltr: 1 }), { hint: T('tdsouth') }) : fld('f-tds', T('tdsin'), inp('f-tds', rec ? rec.tds : '', { mode: 'decimal', ltr: 1 }), { hint: T('tdsinh') })) +
        fld('f-ref', T('ref'), inp('f-ref', rec ? rec.ref : '', { ltr: 1 })) +
        fld('f-note', T('note'), inp('f-note', rec ? (out ? (rec.lines && rec.lines[0] || {}).desc : rec.purpose) : ''), { wide: 1 }) + '</div>' +
        '<fieldset class="alloc"><legend>' + esc(T('against')) + '</legend><p class="soft">' + esc(T('againsth')) + '</p><div data-alloc></div><p class="soft" data-advleft></p></fieldset>';
    } else if (kind === 'pbill' || kind === 'pret') {
      var r = rec || { date: today, items: [{ desc: '', hsn: '', qty: 1, rate: '', gst: 18 }], round: true, buyer: { name: party } };
      var pm = C.party.filter(function (p) { return key(p.name) === key(party); })[0] || {};
      h = '<div class="fg">' + fld('f-party', T('supp'), inp('f-party', party, { req: 1, list: 'dl-party' }) + partyList('supplier')) +
        fld('f-gstin', T('gstin'), inp('f-gstin', (r.buyer && r.buyer.gstin) || pm.gstin || '', { ltr: 1 })) +
        fld('f-state', T('state'), sel('f-state', (r.buyer && r.buyer.state) || pm.state || (BIZ.state || ''), [['', '—']].concat(NS.STATES.map(function (s) { return [s[0], s[0] + ' · ' + s[1]]; })))) +
        fld('f-no', T(kind === 'pret' ? 'billno' : 'sno'), inp('f-no', r.no || '', { ltr: 1, req: kind === 'pbill' })) +
        fld('f-date', T('date'), inp('f-date', r.date, { type: 'date', req: 1 })) +
        (kind === 'pret' ? fld('f-orig', T('origno'), inp('f-orig', r.orig && r.orig.no || '', { ltr: 1 })) : fld('f-due', T('due'), inp('f-due', r.due || '', { type: 'date' }))) + '</div>' +
        '<fieldset><legend>' + esc(T('items')) + '</legend><div data-lines></div><button type="button" class="btn sm" data-addline>' + esc(T('addline')) + '</button>' +
        '<label class="chk"><input type="checkbox" id="f-nogst"' + (r.noGst ? ' checked' : '') + '> ' + esc(T('nogst')) + '</label><label class="chk"><input type="checkbox" id="f-round"' + (r.round !== false ? ' checked' : '') + '> ' + esc(T('round')) + '</label>' +
        '<div class="sum" data-sum></div></fieldset>' +
        (kind === 'pbill' && !rec ? '<div class="fg">' + fld('f-mode', T('paidnow'), sel('f-mode', 'credit', modeOpts(true)), { hint: T('paidnowh') }) + '</div>' : '');
      F.lines = JSON.parse(JSON.stringify(r.items));
    } else if (kind === 'exp') {
      var x = rec || { date: today, mode: 'cash', gst: '' };
      h = '<div class="fg">' + fld('f-date', T('date'), inp('f-date', x.date, { type: 'date', req: 1 })) +
        fld('f-cat', T('cat'), inp('f-cat', x.cat || '', { req: 1, list: 'dl-cat' }) + '<datalist id="dl-cat">' + EXP.map(function (k) { return '<option value="' + esc(T('ex_' + k)) + '">'; }).join('') + '</datalist>') +
        fld('f-amt', T('amount'), inp('f-amt', x.amount || '', { mode: 'decimal', ltr: 1, req: 1 })) +
        fld('f-mode', T('mode'), sel('f-mode', x.mode, modeOpts(true))) +
        fld('f-party', T('payee'), inp('f-party', B.partyName(x), { list: 'dl-party' }) + partyList('supplier')) +
        fld('f-no', T('billno'), inp('f-no', x.no || '', { ltr: 1 })) +
        fld('f-gst', T('incgst'), sel('f-gst', x.gst || '', [['', '—'], ['5', '5%'], ['12', '12%'], ['18', '18%'], ['40', '40%']])) +
        '<div class="f wide"><label class="chk"><input type="checkbox" id="f-itc"' + (x.itc ? ' checked' : '') + '> ' + esc(T('itc')) + '</label><label class="chk"><input type="checkbox" id="f-inter"' + (x.inter ? ' checked' : '') + '> ' + esc(T('inter')) + '</label></div>' +
        fld('f-note', T('note'), inp('f-note', x.notes || ''), { wide: 1 }) + '</div>';
    } else if (kind === 'ob') {
      var ob = rec || { date: fyStart(today), side: 'recv' };
      h = '<p class="soft">' + esc(T('obh')) + '</p><div class="fg">' + fld('f-party', T('party'), inp('f-party', party, { req: 1, list: 'dl-party' }) + partyList()) +
        fld('f-side', T('side'), sel('f-side', ob.side, [['recv', T('s_recv')], ['pay', T('s_pay')]])) +
        fld('f-amt', T('amount'), inp('f-amt', ob.amount || '', { mode: 'decimal', ltr: 1, req: 1 })) +
        fld('f-date', T('date'), inp('f-date', ob.date, { type: 'date', req: 1 })) + '</div>';
    }
    $('[data-form-title]', dlg).textContent = T(kind) + (rec && rec.no ? ' ' + rec.no : '');
    form.innerHTML = h + '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(T('save')) + '</button><button type="button" class="btn" data-close>' + esc(T('cancel')) + '</button></div>';
    $('[data-close]', form).addEventListener('click', function () { dlg.close(); });
    var al = $('[data-addline]', form);
    if (al) al.addEventListener('click', function () { F.lines.push({ desc: '', hsn: '', qty: 1, rate: '', gst: $('#f-nogst', form).checked ? 0 : 18 }); drawLines(); });
    if (F.lines) drawLines();
    if (kind === 'min' || kind === 'mout') drawAlloc(true);
    dlg.showModal();
    var first = $('input:not([type=date]),select', form); if (first && !first.value) first.focus();
  }
  function onFormInput(e) {
    var id = e.target.id || '';
    if (F.lines && e.target.hasAttribute('data-li')) { var i = +e.target.getAttribute('data-li'), k = e.target.getAttribute('data-lk'); F.lines[i][k] = e.target.value; if (k === 'desc') fillItem(i); drawSum(); return; }
    if (F.lines && /f-(nogst|round|state)/.test(id)) drawSum();
    /* the first two digits of a GSTIN are the supplier's state code */
    if (id === 'f-gstin') { var st = e.target.value.trim().slice(0, 2); if (/^\d\d$/.test(st) && NS.stateName(st)) { $('#f-state', form).value = st; drawSum(); } }
    if (id === 'f-party' && F.lines) { var pm = C.party.filter(function (p) { return key(p.name) === key(e.target.value); })[0]; if (pm) { if (pm.gstin && !$('#f-gstin', form).value) $('#f-gstin', form).value = pm.gstin; if (pm.state) $('#f-state', form).value = pm.state; drawSum(); } }
    if ((F.kind === 'min' || F.kind === 'mout') && (id === 'f-party' || id === 'f-amt' || id === 'f-tds')) drawAlloc();
    if (e.target.hasAttribute && e.target.hasAttribute('data-al')) advLeft();
  }
  function fillItem(i) {
    var m = C.item.filter(function (x) { return key(x.desc) === key(F.lines[i].desc); })[0]; if (!m) return;
    var L = F.lines[i]; if (!L.hsn) L.hsn = m.hsn || ''; if (!num(L.rate) && m.rate) L.rate = m.rate; if (m.gst !== '' && m.gst != null) L.gst = m.gst;
    var row = $$('[data-row]', form)[i]; if (row) { $('[data-lk=hsn]', row).value = L.hsn; $('[data-lk=rate]', row).value = L.rate; $('[data-lk=gst]', row).value = L.gst; }
  }
  function drawLines() {
    var box = $('[data-lines]', form);
    box.innerHTML = '<datalist id="dl-item">' + C.item.map(function (x) { return '<option value="' + esc(x.desc) + '">'; }).join('') + '</datalist>' + F.lines.map(function (L, i) {
      function c(k, lbl, o) { o = o || {}; return '<label class="lc lc-' + k + '"><span>' + esc(lbl) + '</span><input data-li="' + i + '" data-lk="' + k + '" value="' + esc(L[k] == null ? '' : L[k]) + '"' + (o.mode ? ' inputmode="' + o.mode + '" dir="ltr"' : ' dir="auto"') + (o.list ? ' list="' + o.list + '"' : '') + ' autocomplete="off"></label>'; }
      return '<div class="line" data-row>' + c('desc', T('item'), { list: 'dl-item' }) + c('hsn', T('hsn'), { mode: 'numeric' }) + c('qty', T('qty'), { mode: 'decimal' }) + c('rate', T('rate'), { mode: 'decimal' }) + c('gst', T('gst'), { mode: 'decimal' }) +
        (F.lines.length > 1 ? '<button type="button" class="icon-btn rm" data-rm="' + i + '" aria-label="' + esc(T('rmline')) + '">✕</button>' : '') + '</div>';
    }).join('');
    $$('[data-rm]', box).forEach(function (b) { b.addEventListener('click', function () { F.lines.splice(+b.getAttribute('data-rm'), 1); drawLines(); }); });
    drawSum();
  }
  function billFromForm() {
    var d = { type: 'pbill', kind: F.kind === 'pret' ? 'return' : 'bill', seller: sellerCopy(), buyer: { name: $('#f-party', form).value.trim(), gstin: $('#f-gstin', form).value.trim().toUpperCase(), state: $('#f-state', form).value },
      no: $('#f-no', form).value.trim(), date: $('#f-date', form).value, noGst: $('#f-nogst', form).checked, round: $('#f-round', form).checked,
      items: F.lines.filter(function (L) { return String(L.desc).trim() || num(L.rate); }).map(function (L) { return { desc: String(L.desc).trim(), hsn: String(L.hsn || '').trim(), qty: L.qty === '' ? 1 : num(L.qty), unit: 'Nos', rate: num(L.rate), gst: num(L.gst) }; }) };
    if ($('#f-due', form)) d.due = $('#f-due', form).value; else d.orig = { no: $('#f-orig', form).value.trim() };
    var t = B.itemTotals(d), total = r2(t.taxable + t.cgst + t.sgst + t.igst);   /* IGST when the supplier's state differs from ours */
    d.total = d.round ? Math.round(total) : total;
    d.tax = { taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst };
    return d;
  }
  function drawSum() {
    var d = billFromForm(), t = d.tax;
    $('[data-sum]', form).innerHTML = '<span>' + esc(T('taxable')) + ' <b>' + money(t.taxable) + '</b></span><span>' + esc(T('tax')) + ' <b>' + money(t.cgst + t.sgst + t.igst) + '</b>' + (t.igst ? ' (IGST)' : t.cgst ? ' (CGST + SGST)' : '') + '</span><span>' + esc(T('total')) + ' <b>' + money(d.total) + '</b></span>';
  }
  /* open bills of the party on the right side, ticked oldest first up to the amount */
  function drawAlloc(prefill) {
    var out = F.kind === 'mout', side = out ? 'pay' : 'recv', p = key($('#f-party', form).value), box = $('[data-alloc]', form);
    var D = mine().filter(function (d) { return !F.rec || d.id !== F.rec.id; });
    var open = p ? B.bills(D, bizName(), p).bills.filter(function (b) { return b.side === side; }).sort(function (a, b) { return a.date.localeCompare(b.date); }) : [];
    var gross = num($('#f-amt', form).value) + (out ? 0 : num($('#f-tds', form).value));
    var had = {}; ((F.rec && F.rec.alloc) || []).forEach(function (a) { had[a.id] = num(a.amt); });
    var left = gross;
    if (F.forId && open.some(function (b) { return b.id === F.forId; })) open.sort(function (a, b) { return (b.id === F.forId) - (a.id === F.forId); });
    box.innerHTML = open.length ? open.map(function (b) {
      var v = F.rec ? (had[b.id] || 0) : r2(Math.max(0, Math.min(b.left, left))); if (!F.rec) left = r2(left - v);
      return '<div class="al"><label class="chk"><input type="checkbox" data-al="' + b.id + '"' + (v > 0 ? ' checked' : '') + '> <span><b>' + esc(b.no || docName(b)) + '</b> <span class="soft">' + ldate(b.date) + ' · ' + esc(T('left', { a: money(b.left) })) + '</span></span></label>' +
        '<input data-al="' + b.id + '" data-max="' + b.left + '" inputmode="decimal" dir="ltr" value="' + (v > 0 ? v : '') + '" aria-label="' + esc(T('settle', { a: b.no })) + '"></div>'; }).join('')
      : '<p class="soft">' + esc(p ? T('noopen') : '') + '</p>';
    $$('input[type=checkbox][data-al]', box).forEach(function (c) {
      c.addEventListener('change', function () {
        var amtI = $('input[data-al="' + c.getAttribute('data-al') + '"]:not([type=checkbox])', box);
        if (!c.checked) amtI.value = ''; else { var used = sumAlloc() - num(amtI.value); amtI.value = r2(Math.max(0, Math.min(num(amtI.getAttribute('data-max')), gross - used))) || amtI.getAttribute('data-max'); }
        advLeft();
      });
    });
    advLeft();
  }
  function sumAlloc() { return r2($$('[data-alloc] input[data-al]:not([type=checkbox])', form).reduce(function (a, i) { return a + num(i.value); }, 0)); }
  function advLeft() {
    var out = F.kind === 'mout', gross = num($('#f-amt', form).value) + (out ? 0 : num($('#f-tds', form).value)), x = r2(gross - sumAlloc());
    $('[data-advleft]', form).textContent = x > 0.004 && $('#f-party', form).value.trim() ? T('advleft', { a: money(x) }) : '';
  }

  function submit() {
    var k = F.kind, miss = $$('[required]', form).filter(function (i) { return !String(i.value).trim(); });
    if (miss.length) { NS.toast(T('need', { f: miss.map(function (i) { return $('label[for="' + i.id + '"]', form).textContent; }).join(', ') }), 'bad'); miss[0].focus(); return; }
    var rec = F.rec ? JSON.parse(JSON.stringify(F.rec)) : null, jobs = [], party = $('#f-party', form) ? $('#f-party', form).value.trim() : '', d;
    if (k === 'min' || k === 'mout') {
      var out = k === 'mout', amt = r2(num($('#f-amt', form).value)), alloc = $$('[data-alloc] input[data-al]:not([type=checkbox])', form).filter(function (i) { return num(i.value) > 0; }).map(function (i) {
        var b = C.doc.filter(function (x) { return x.id === i.getAttribute('data-al'); })[0]; return { id: i.getAttribute('data-al'), no: b ? b.no || '' : '', amt: r2(Math.min(num(i.value), num(i.getAttribute('data-max')))) }; });
      var date = $('#f-date', form).value, nos = alloc.map(function (a) { return a.no; }).filter(Boolean).join(', ');
      if (out) {
        d = Object.assign(rec || { type: 'voucher', no: nextNo('voucher', 'PV', date), paper: 'a4', design: 'classic', copies: 1, copyLabel: 'orig', tdsSec: '', rcm: false, rcmRate: '18', prep: '', appr: '', status: '' }, {
          app: 1, forBill: true, date: date, seller: Object.assign(rec ? rec.seller : {}, sellerCopy()), mode: $('#f-mode', form).value, ref: $('#f-ref', form).value.trim(), tdsRate: $('#f-tds', form).value.trim(), alloc: alloc,
          lines: [{ desc: $('#f-note', form).value.trim() || (nos ? 'Payment against bill ' + nos : 'Payment on account'), head: 'Supplier payment', amt: amt }] });
        d.buyer = Object.assign(rec ? rec.buyer : { addr: '', phone: '', gstin: '', pan: '' }, { name: party });
      } else {
        var unpaidLeft = r2(amt + num($('#f-tds', form).value) - alloc.reduce(function (a, x) { return a + x.amt; }, 0));
        d = Object.assign(rec || { type: 'receipt', no: nextNo('receipt', 'RCT', date), paper: 'a4', design: 'classic', copies: 1, copyLabel: '', gstAdv: false, rate: '18', pos: '', sac: '', rv: '', rvDate: '', refDate: '', bank: '', balance: '', status: '' }, {
          app: 1, kind: alloc.length ? 'pay' : 'adv', date: date, seller: Object.assign(rec ? rec.seller : {}, sellerCopy()), amount: amt, tds: $('#f-tds', form).value.trim(), mode: $('#f-mode', form).value,
          ref: $('#f-ref', form).value.trim(), against: nos, purpose: $('#f-note', form).value.trim() || (unpaidLeft > 0.004 && alloc.length ? 'Part advance' : ''), alloc: alloc });
        d.buyer = Object.assign(rec ? rec.buyer : { addr: '', phone: '', gstin: '', pan: '' }, { name: party });
      }
      d.total = amt;
      jobs.push(savePartyRole(party, out ? 'supplier' : 'customer'));
      return Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function (saved) { return markPaid(saved); }).then(done);
    }
    if (k === 'pbill' || k === 'pret') {
      d = billFromForm();
      if (!d.items.length) { NS.toast(T('need', { f: T('items') }), 'bad'); return; }
      if (rec) d = Object.assign(rec, d, { id: rec.id });
      var dup = k === 'pbill' && C.doc.filter(function (x) { return x.type === 'pbill' && x.kind !== 'return' && x.id !== (rec && rec.id) && key(x.no) === key(d.no) && key(B.partyName(x)) === key(party) && key(x.seller && x.seller.name) === key(bizName()); })[0];
      if (dup && !confirm(T('samebill', { no: d.no, p: party }))) return;
      var mode = $('#f-mode', form) ? $('#f-mode', form).value : 'credit';
      jobs.push(savePartyRole(party, 'supplier', { gstin: d.buyer.gstin, state: d.buyer.state }));
      d.items.forEach(function (it) {
        if (!it.desc) return;
        var hit = C.item.filter(function (x) { return key(x.desc) === key(it.desc); })[0];
        if (!hit) jobs.push(NSStore.put('item', { desc: it.desc, hsn: it.hsn, unit: it.unit, rate: '', gst: it.gst, kind: 'goods' }));
      });
      return Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function (saved) {
        if (mode === 'credit' || k !== 'pbill') return saved;
        /* paid at once: a payment entry linked to this bill */
        var v = { type: 'voucher', app: 1, forBill: true, no: nextNo('voucher', 'PV', saved.date), date: saved.date, paper: 'a4', design: 'classic', copies: 1, copyLabel: 'orig', tdsSec: '', tdsRate: '', rcm: false, rcmRate: '18', prep: '', appr: '', status: '',
          seller: sellerCopy(), buyer: { name: party, addr: '', phone: '', gstin: saved.buyer.gstin, pan: '' }, mode: mode, ref: '', alloc: [{ id: saved.id, no: saved.no, amt: saved.total }],
          lines: [{ desc: 'Payment against bill ' + saved.no, head: 'Supplier payment', amt: saved.total }] };
        v.total = saved.total;
        return NSStore.put('doc', v);
      }).then(done);
    }
    if (k === 'exp') {
      d = Object.assign(rec || { type: 'exp', app: 1 }, { date: $('#f-date', form).value, seller: sellerCopy(), cat: $('#f-cat', form).value.trim(), amount: r2(num($('#f-amt', form).value)), mode: $('#f-mode', form).value,
        buyer: { name: party }, no: $('#f-no', form).value.trim(), gst: $('#f-gst', form).value, itc: $('#f-itc', form).checked, inter: $('#f-inter', form).checked, notes: $('#f-note', form).value.trim() });
      d.total = d.amount;
      if (d.mode === 'credit' && !party) { NS.toast(T('need', { f: T('payee') }), 'bad'); $('#f-party', form).focus(); return; }
      if (party) jobs.push(savePartyRole(party, 'supplier'));
      return Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(done);
    }
    if (k === 'ob') {
      d = Object.assign(rec || { type: 'ob', app: 1 }, { date: $('#f-date', form).value, seller: sellerCopy(), buyer: { name: party }, side: $('#f-side', form).value, amount: r2(num($('#f-amt', form).value)) });
      d.total = d.amount; d.no = '';
      return savePartyRole(party, d.side === 'pay' ? 'supplier' : 'customer').then(function () { return NSStore.put('doc', d); }).then(done);
    }
  }
  function done() { dlg.close(); NS.toast(T('saved')); NS.checkReminder && NS.checkReminder(); show(); }
  function savePartyRole(name, want, extra) {
    if (!name) return Promise.resolve();
    var hit = C.party.filter(function (x) { return key(x.name) === key(name); })[0];
    if (hit && (hit.role === want || hit.role === 'both') && !extra) return Promise.resolve();
    var role = !hit || !hit.role ? want : hit.role === want || hit.role === 'both' ? hit.role : 'both';
    var rec = Object.assign(hit || { name: name }, { role: role });
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k] && !rec[k]) rec[k] = extra[k]; });
    return NSStore.put('party', rec);
  }
  /* sales bills fully settled by money linked to them are marked Paid (so the billing site's list agrees); bills it no longer settles go back */
  function markPaid(pay) {
    return NSStore.list('doc').then(function (all) {
      var R = B.bills(all, bizName()), open = {}; R.bills.forEach(function (b) { open[b.id] = b.left; });
      var jobs = [];
      all.forEach(function (d) {
        if (d.type !== 'invoice' && d.type !== 'cashmemo') return;
        var linked = (pay.alloc || []).some(function (a) { return a.id === d.id; });
        if (linked && !open[d.id] && d.status !== 'paid') { d.status = 'paid'; d.paidBy = pay.id; jobs.push(NSStore.put('doc', d)); }
        else if (d.paidBy === pay.id && !linked) { d.status = 'unpaid'; delete d.paidBy; jobs.push(NSStore.put('doc', d)); }
      });
      return Promise.all(jobs);
    });
  }

  function init() {
    if (!$('#app')) return;
    $$('[data-sec]').forEach(function (b) { b.addEventListener('click', function () { q = ''; filt = 'all'; }); });
    window.addEventListener('hashchange', route);
    document.addEventListener('ns-lang', function () { show(); });
    NSStore.ready().then(route).then(function () { NSStore.persist().catch(function () {}); });
    window.addEventListener('focus', function () { if (!dlg || !dlg.open) show(); });   /* bills made in another tab show up when you come back */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
