/* my.niveshsahayak.in: the Configuration Hub of the Nivesh Sahayak document tools.
   Masters (businesses, customers and suppliers, items and services) can be added, edited, imported and exported here;
   Settings (default business, numbering, new-document defaults, backup reminder) are saved in the data home as meta 'settings'
   and read by every document tool (docs.js). Everything stays in this browser. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t;
  var UNITS = ['Nos', 'Pcs', 'Kg', 'Gm', 'Ltr', 'Ml', 'Mtr', 'Sq ft', 'Box', 'Pack', 'Set', 'Pair', 'Dozen', 'Bag', 'Ton', 'Hrs', 'Days', 'Month', 'Job'];
  /* GST rates in use today (same list as the document makers from 1 Feb 2026: 28% is gone); an old saved rate still shows so it can be changed */
  var RATES = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 40];
  function ratesWith(v) { return v === '' || v == null || RATES.some(function (g) { return String(g) === String(v); }) ? RATES : RATES.concat([Number(v)]).sort(function (a, b) { return a - b; }); }
  var ACCENTS = ['#0B3B5B', '#1D4ED8', '#047857', '#B45309', '#9D174D', '#334155'];
  var LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var BILLING = LOCAL ? 'http://localhost:8861/' : 'https://billing.niveshsahayak.in/';
  /* every document tool [site, host, name key, line key, local port] (build.py TOOLS); which site makes which document type */
  var TOOLS = (window.NS_CFG && NS_CFG.tools) || [['billing', 'billing.niveshsahayak.in', 'nav.billing', 'hub.billing', 8861]];
  var SITEOF = { invoice: 'billing', quote: 'quotation', proforma: 'proforma', so: 'sales-order', challan: 'challan', po: 'purchase-order', self: 'self-invoice', note: 'credit-note', cashmemo: 'cash-memo',
    receipt: 'receipt', voucher: 'voucher', rent: 'rent-receipt', salary: 'salary-slip', petty: 'petty-cash' };
  /* shop and trade records (kit.js): type -> [site, name key]; they open in their own site with ?open=<id> */
  var KITOF = { pos: ['pos', 'nav.pos'], pharma: ['pharmacy', 'nav.pharmacy'], resto: ['restaurant', 'nav.restaurant'], lr: ['bilty', 'nav.bilty'], job: ['job-card', 'nav.jobcard'], hotel: ['hotel', 'nav.hotel'], rentb: ['rent', 'nav.rentmgr'],
    rabill: ['contractor-bill', 'nav.contractorbill'], fee: ['fee-receipt', 'nav.feereceipt'] };
  KITOF.visit = ['clinic', 'nav.clinic']; KITOF.svc = ['salon', 'nav.salon'];
  KITOF.jewel = ['jewellery', 'nav.jewellery']; KITOF.garment = ['garment', 'nav.garment'];   /* group C trade tools */
  KITOF.dairy = ['dairy', 'nav.dairy']; KITOF.subs = ['subscribers', 'nav.subs'];   /* India plan B */
  KITOF.mandi = ['mandi', 'nav.mandi']; KITOF.pump = ['petrol', 'nav.petrol']; KITOF.tsh = ['tripsheet', 'nav.tripsheet'];   /* group E trade tools */
  function toolUrl(site) { if (site === 'app') return APP; var x = TOOLS.filter(function (x) { return x[0] === site; })[0] || TOOLS[0]; return LOCAL ? 'http://localhost:' + x[4] + '/' : 'https://' + x[1] + '/'; }
  /* records made in NSBiz (purchase bills, expenses, opening balances) open there */
  var APP = LOCAL ? 'http://localhost:8880/' : 'https://app.niveshsahayak.in/';
  var APPDOC = { pbill: ['Purchase bill', '#buy'], exp: ['Expense', '#buy'], ob: ['Opening balance', '#money'],
    /* records made only in the App (F7-1: they showed raw codes and a billing link that cannot open them) */
    jv: ['Journal entry', '#b2jv'], fa: ['Fixed asset', '#b2fa'], stk: ['Stock entry', '#b2gd'], contra: ['Cash and bank transfer', '#cash'], oinc: ['Other income', '#acx'],
    taxpay: ['Tax payment', '#acx'], gstset: ['GST set-off', '#acx'], wo: ['Write off', '#dues'], pdd: ['Provision for doubtful debts', '#acx'], sadv: ['Employee advance', '#stf'],
    loan: ['Loan', '#stf'], emi: ['Loan EMI', '#stf'], cap: ['Capital', '#capl'] };
  /* number prefixes of the other documents (Settings); quotation and credit note have two series each */
  var PREFIXES = [['quote', 'quote', 'QT', 'k.quote'], ['quote', 'estimate', 'EST', 'k.estimate'], ['proforma', '', 'PI', 'Doc.proforma'], ['so', '', 'SO', 'Doc.so'], ['challan', '', 'DC', 'Doc.challan'],
    ['po', '', 'PO', 'Doc.po'], ['self', '', 'SI', 'Doc.self'], ['note', 'credit', 'CN', 'k.credit'], ['note', 'creditp', 'PCN', 'k.creditp'], ['note', 'debit', 'DN', 'k.debit'], ['note', 'debitp', 'PDN', 'k.debitp'], ['cashmemo', '', 'CM', 'Doc.cashmemo'], ['receipt', '', 'RCT', 'Doc.receipt'],
    ['voucher', '', 'PV', 'Doc.voucher'], ['rent', '', 'RR', 'Doc.rent'], ['salary', '', 'SAL', 'Doc.salary'], ['petty', '', 'PCB', 'Doc.petty'], ['refund', '', 'RFV', 'k.ref'],   /* refund voucher: its own series on the receipt maker (slip.js C.refund) */
    /* shop and trade sites (kit.js): fixed digits (5th item), always with the financial year */
    ['exp', '', 'EXP', 'Doc.exp'], ['pos', '', 'POS', 'nav.pos', 4], ['pharma', '', 'PH', 'nav.pharmacy', 4], ['resto', '', 'RB', 'nav.restaurant', 4], ['lr', '', 'LR', 'nav.bilty', 4],
    ['job', '', 'JC', 'nav.jobcard', 4], ['hotel', '', 'HT', 'nav.hotel', 4], ['rentb', '', 'RM', 'nav.rentmgr', 4], ['rabill', '', 'RA', 'nav.contractorbill', 3], ['fee', '', 'FR', 'nav.feereceipt', 4]];
  PREFIXES.push(['visit', '', 'OPD', 'nav.clinic', 4], ['svc', '', 'SV', 'nav.salon', 4]);
  PREFIXES.push(['jewel', '', 'JW', 'nav.jewellery', 4], ['garment', '', 'GM', 'nav.garment', 4]);
  PREFIXES.push(['dairy', '', 'DY', 'nav.dairy', 3], ['subs', '', 'SUB', 'nav.subs', 3]);   /* India plan B */
  PREFIXES.push(['mandi', '', 'MN', 'nav.mandi', 3], ['pump', '', 'SR', 'nav.petrol', 4], ['tsh', '', 'TS', 'nav.tripsheet', 4]);
  /* Settings: one small card per document, grouped: [group key, [[type, maker site, name key], ...]]; a card shows that type's PREFIXES rows */
  /* the App's own vouchers (numbered by the App, same settings: S[type].prefix, S.series[type]) */
  PREFIXES.push(['contra', '', 'CV', 'hub.v.contra'], ['jv', '', 'JV', 'hub.v.jv'], ['oinc', '', 'OI', 'hub.v.oinc'], ['taxpay', '', 'TX', 'hub.v.taxpay'], ['wo', '', 'WO', 'hub.v.wo'], ['pdd', '', 'PDD', 'hub.v.pdd'],
    ['make', '', 'PRD', 'hub.v.make'], ['jobout', '', 'JWO', 'hub.v.jobout'], ['jobin', '', 'JWR', 'hub.v.jobin'], ['sadv', '', 'SA', 'hub.v.sadv'], ['loan', '', 'LN', 'hub.v.loan'], ['emi', '', 'EMI', 'hub.v.emi']);
  /* Settings: one small card per voucher, grouped like Tally's voucher types (owner 20 Nov): [group key, [[type, maker site ('' = made in the App), name key, kind], ...]] */
  var DOCCARDS = [
    ['hub.grp.acc', [['cashmemo', 'cash-memo', 'Doc.cashmemo'], ['exp', 'export-invoice', 'Doc.exp'], ['note', 'credit-note', 'nav.note', 'credit'], ['note', 'debit-note', 'nav.dnote', 'debit'],
      ['receipt', 'receipt', 'Doc.receipt'], ['refund', 'receipt', 'k.ref'], ['voucher', 'voucher', 'Doc.voucher'], ['contra', '', 'hub.v.contra'], ['jv', '', 'hub.v.jv'], ['self', 'self-invoice', 'Doc.self'],
      ['oinc', '', 'hub.v.oinc'], ['taxpay', '', 'hub.v.taxpay'], ['wo', '', 'hub.v.wo'], ['pdd', '', 'hub.v.pdd']]],
    ['hub.grp.ord', [['quote', 'quotation', 'nav.quote'], ['proforma', 'proforma', 'Doc.proforma'], ['so', 'sales-order', 'Doc.so'], ['po', 'purchase-order', 'Doc.po']]],
    ['hub.grp.inv', [['challan', 'challan', 'Doc.challan'], ['make', '', 'hub.v.make'], ['jobout', '', 'hub.v.jobout'], ['jobin', '', 'hub.v.jobin']]],
    ['hub.grp.pay', [['salary', 'salary-slip', 'Doc.salary'], ['sadv', '', 'hub.v.sadv'], ['loan', '', 'hub.v.loan'], ['emi', '', 'hub.v.emi']]],
    ['hub.grp.oth', [['petty', 'petty-cash', 'Doc.petty'], ['rent', 'rent-receipt', 'Doc.rent']]],
    ['hub.grp.trade', [['pos', 'pos', 'nav.pos'], ['pharma', 'pharmacy', 'nav.pharmacy'], ['resto', 'restaurant', 'nav.restaurant'], ['lr', 'bilty', 'nav.bilty'], ['job', 'job-card', 'nav.jobcard'], ['hotel', 'hotel', 'nav.hotel'], ['rentb', 'rent', 'nav.rentmgr'],
      ['rabill', 'contractor-bill', 'nav.contractorbill'], ['fee', 'fee-receipt', 'nav.feereceipt'], ['visit', 'clinic', 'nav.clinic'], ['svc', 'salon', 'nav.salon']]]];
  DOCCARDS[DOCCARDS.length - 1][1].push(['jewel', 'jewellery', 'nav.jewellery'], ['garment', 'garment', 'nav.garment']);
  DOCCARDS.filter(function (g) { return g[0] === 'hub.grp.trade'; })[0][1].push(['dairy', 'dairy', 'nav.dairy'], ['subs', 'subscribers', 'nav.subs']);   /* India plan B */
  DOCCARDS.filter(function (g) { return g[0] === 'hub.grp.trade'; })[0][1].push(['mandi', 'mandi', 'nav.mandi'], ['pump', 'petrol', 'nav.petrol'], ['tsh', 'tripsheet', 'nav.tripsheet']);
  /* ERP A-6 / C-11 on the document cards: each series row folds out its numbering (settings.series[<type>|<type>.<kind>]), each card its
     printing defaults (settings.vt[<type>|<type>.<kind>]); only values that differ from what the type gives by itself are kept */
  var INVX = ['invoice', '', 'INV', 'Doc.invoice'], INVD = ['invoice', 'billing', 'Doc.invoice'];   /* the invoice block at the top of Settings */
  var NXOUT = { invoice: 1, cashmemo: 1, exp: 1, self: 1, 'note.credit': 1, 'note.debit': 1 };
  function serKey(x) { return x[1] ? x[0] + '.' + x[1] : x[0]; }
  function serDef(S, x) { var k = serKey(x), keep = JSON.parse(JSON.stringify(S || {})); if (keep.series) delete keep.series[k]; return NS.seriesOf(keep, x[0], x[1], '', { def: x[2], width: x[4] || null, fy: x[4] ? true : null }); }
  function selH(name, v, opts) { return '<select data-sx="' + name + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function serHtml(S, x, lite) {
    var s = NS.seriesOf(S, x[0], x[1], '', { def: x[2], width: x[4] || null, fy: x[4] ? true : null }), out = NXOUT[serKey(x)], L = function (k, h) { return '<label class="dc-f"><span>' + esc(t('ms.' + k)) + '</span>' + h + '</label>'; };
    return '<details class="dc-more" data-ser="' + esc(serKey(x)) + '"><summary>' + esc(t('ms.vt_num')) + '</summary>' +
      L('vt_meth', selH('method', s.method, [['auto', t('ms.vt_m_auto')], ['fixed', t('ms.vt_m_fixed')], ['manual', t('ms.vt_m_manual')]])) +
      L('vt_sfx', '<input data-sx="suffix" dir="ltr" maxlength="6" value="' + esc(s.suffix) + '">') + L('vt_start', '<input data-sx="start" inputmode="numeric" dir="ltr" value="' + s.start + '">') +
      (lite ? '' : L('vt_width', selH('width', s.width, [1, 2, 3, 4, 5, 6].map(function (n) { return [n, n]; })))) +
      L('vt_rst', selH('restart', s.restart, [['year', t('ms.vt_r_year')], ['month', t('ms.vt_r_month')], ['never', t('ms.vt_r_never')]])) +
      L('vt_dup', selH('dup', out ? 'block' : s.dup, out ? [['block', t('ms.vt_d_block')]] : [['block', t('ms.vt_d_block')], ['warn', t('ms.vt_d_warn')]])) +
      (lite ? '' : '<label class="chk"><input type="checkbox" data-sx="fy"' + (s.fy ? ' checked' : '') + '> ' + esc(t('ms.vt_fy')) + '</label>') + '</details>';
  }
  function vtKeyOf(d) { return d[3] ? d[0] + '.' + d[3] : d[0]; }
  function vtcHtml(S, d, lite) {
    var v = (S.vt || {})[vtKeyOf(d)] || {}, L = function (lbl, h) { return '<label class="dc-f"><span>' + esc(lbl) + '</span>' + h + '</label>'; };
    return '<details class="dc-more" data-vtc="' + esc(vtKeyOf(d)) + '"' + (Object.keys(v).length ? ' open' : '') + '><summary>' + esc(t('ms.vt_print')) + '</summary>' +
      L(t('ms.vt_copies'), selH('copies', v.copies || '', [['', t('ms.vt_tool')], [1, 1], [2, 2], [3, 3]])) +
      L(t('ms.vt_paper'), selH('paper', v.paper || '', [['', t('ms.vt_tool')], ['a4', 'A4'], ['a5', 'A5'], ['th80', '80 mm'], ['th58', '58 mm']])) +
      L(t('l.design'), selH('design', v.design || '', [['', t('ms.vt_tool')]].concat(NS.DESIGNS.map(function (k) { return [k, t('ds.' + k)]; })))) +
      (lite ? '' : L(t('l.notes'), '<input data-sx="notes" dir="auto" value="' + esc(v.notes || '') + '">') + L(t('ms.vt_terms'), '<input data-sx="terms" dir="auto" value="' + esc(v.terms || '') + '">')) +
      '<label class="chk"><input type="checkbox" data-sx="printAfter"' + (v.printAfter ? ' checked' : '') + '> ' + esc(t('ms.vt_pafter')) + '</label>' +
      '<label class="chk"><input type="checkbox" data-sx="shareAfter"' + (v.shareAfter ? ' checked' : '') + '> ' + esc(t('ms.vt_safter')) + '</label><small class="hint">' + esc(t('ms.vt_printh')) + '</small></details>';
  }
  function readSx(box) { var o = {}; $$('[data-sx]', box).forEach(function (e) { o[e.getAttribute('data-sx')] = e.type === 'checkbox' ? e.checked : e.value.trim(); }); return o; }
  function siteUrl(site) { return TOOLS.some(function (x) { return x[0] === site; }) ? toolUrl(site) : 'https://' + site + '.niveshsahayak.in/'; }

  /* field: [key, label key, kind, extra]; kinds: text, area, state, gstin, sel, num, img, unit, gst, ltr */
  var FORM = {
    biz: [
      ['name', 'l.bname', 'text', { req: 1, wide: 1 }], ['addr', 'l.addr', 'area', { wide: 1 }], ['city', 'l.city', 'text'], ['pin', 'l.pin', 'ltr', { mode: 'numeric', max: 6 }], ['state', 'l.state', 'state'], ['gstin', 'l.gstin', 'gstin'],
      ['reg', 'hub.reg', 'sel', { opts: [['regular', 'hub.rg.regular'], ['comp', 'hub.rg.comp'], ['unreg', 'hub.rg.unreg'], ['sez', 'hub.rg.sez']] }],
      ['aato', 'ei.aato', 'sel', { opts: [['', 'ei.a.none'], ['lt5', 'ei.a.lt5'], ['5to10', 'ei.a.5to10'], ['10p', 'ei.a.10p']] }],
      ['phone', 'l.phone', 'ltr', { mode: 'tel' }], ['email', 'l.email', 'ltr', { type: 'email' }], ['tan', 'hub.tan', 'ltr', { max: 10, upper: 1 }],   /* ERP round 2: TAN for TDS certificates and returns */
      ['bankName', 'l.bank', 'text'], ['bankAcc', 'l.acc', 'ltr', { mode: 'numeric' }], ['bankIfsc', 'l.ifsc', 'ltr', { max: 11, upper: 1 }], ['bankBranch', 'l.branch', 'text'],
      ['upi', 'l.upi', 'ltr', { wide: 1, ph: 'name@bank' }], ['logo', 'l.logo', 'img', { max: 360 }], ['sign', 'l.sign', 'img', { max: 420 }]
    ],
    party: [
      ['role', 'hub.role', 'sel', { opts: [['customer', 'hub.r.customer'], ['supplier', 'hub.r.supplier'], ['both', 'hub.r.both']] }],
      ['group', 'grp.group', 'pgroup', { hint: 'grp.h_pgroup' }], ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }],
      ['name', 'my.f.name', 'text', { req: 1 }], ['phone', 'l.phone', 'ltr', { mode: 'tel' }], ['email', 'l.email', 'ltr', { type: 'email' }],
      ['gstin', 'l.cgstin', 'gstin'], ['state', 'l.state', 'state'], ['addr', 'l.addr', 'area', { wide: 1 }], ['city', 'l.city', 'text'], ['pin', 'l.pin', 'ltr', { mode: 'numeric', max: 6 }],
      ['ship.addr', 'l.shaddr', 'area', { wide: 1, hint: 'hub.h.ship' }], ['ship.state', 'l.shstate', 'state'],
      /* Batch 1: price type and credit terms */
      ['ptype', 'b1.ptype', 'sel', { opts: [['retail', 'b1.pt_retail'], ['wholesale', 'b1.pt_whole']], hint: 'b1.h_ptype' }],
      ['climit', 'b1.climit', 'num', { hint: 'b1.h_climit' }], ['cdays', 'b1.cdays', 'num', { hint: 'b1.h_cdays' }],
      /* India plan A: route / beat and scheme (distributors) */
      ['route', 'rtb.route', 'text', { hint: 'rtb.h_route' }], ['scheme', 'rtb.scheme', 'text', { hint: 'rtb.h_scheme' }],
      /* Evershine's account master (owner 19 Nov 2026): agent (salesman) and the road distance in km for e-way bills */
      ['agent', 'ms.agent', 'text', { hint: 'ms.h_agent' }], ['km', 'ms.km', 'num', { hint: 'ms.h_km' }],
      /* compliance pack: MSME payables (size, Udyam number as typed by the supplier, days agreed in writing) */
      ['msme', 'cp.f_size', 'sel', { opts: [['', 'cp.sz_none'], ['micro', 'cp.sz_micro'], ['small', 'cp.sz_small'], ['medium', 'cp.sz_medium'], ['other', 'cp.sz_other']], hint: 'cp.h_size' }],
      ['udyam', 'cp.f_ud', 'ltr', { max: 22, upper: 1, ph: 'UDYAM-XX-00-0000000' }], ['agdays', 'cp.f_ag', 'num', { hint: 'cp.f_ag_h' }],
      /* ERP round 1 (r1-gst S-2): GST registration type and PAN (gstcore.js partyReg; empty = worked out from the GSTIN) */
      ['reg', 'ms.reg', 'sel', { opts: [['', 'ms.reg_auto'], ['regular', 'ms.reg_regular'], ['comp', 'ms.reg_comp'], ['unreg', 'ms.reg_unreg'], ['sez', 'ms.reg_sez'], ['uin', 'ms.reg_uin'], ['overseas', 'ms.reg_overseas'], ['eco', 'ms.reg_eco']] }],
      ['pan', 'ms.pan', 'ltr', { max: 10, upper: 1 }]
    ],
    item: [
      ['desc', 'hub.f.iname', 'text', { req: 1, wide: 1 }], ['kind', 'l.type', 'sel', { opts: [['goods', 'hub.k.goods'], ['service', 'hub.k.service']] }],
      ['group', 'grp.group', 'igroup', { hint: 'grp.h_igroup' }], ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }],
      ['code', 'hub.f.code', 'ltr'], ['hsn', 'l.hsn', 'ltr', { mode: 'numeric', max: 8 }], ['unit', 'l.unit', 'unit'],
      ['rate', 'b1.retail', 'num', { hint: 'b1.h_retail' }], ['wrate', 'b1.whole', 'num'], ['mrp', 'b1.mrp', 'num'], ['prate', 'b1.prate', 'num'], ['gst', 'l.gst', 'gst'],
      /* ERP Round 2 (r2-billwise, A-9): the item's own sales / purchase ledger in the accounts; empty = Sales / Purchases */
      ['sl', 'bw.isl', 'text', { hint: 'bw.islh' }], ['pl', 'bw.ipl', 'text'],
      /* ERP round 1 (r1-gst S-1, S-5): taxability and input tax credit; dated rate changes are made in the App's Masters */
      ['tax.kind', 'ms.tk', 'sel', { opts: [['taxable', 'ms.tk_taxable'], ['nil', 'ms.tk_nil'], ['exempt', 'ms.tk_exempt'], ['nongst', 'ms.tk_nongst']] }],
      ['tax.itc', 'ms.itc', 'sel', { opts: [['ok', 'ms.itc_ok'], ['blocked', 'ms.itc_blocked'], ['ineligible', 'ms.itc_inel']], hint: 'ms.itch' }]
    ]
  };
  /* CSV columns (English headers, so a file works in any language) */
  var CSV = {
    biz: [['name', 'Name'], ['addr', 'Address'], ['city', 'City'], ['pin', 'PIN code'], ['state', 'State code'], ['gstin', 'GSTIN'], ['phone', 'Phone'], ['email', 'Email'], ['bankName', 'Bank'], ['bankAcc', 'Account no'], ['bankIfsc', 'IFSC'], ['bankBranch', 'Branch'], ['upi', 'UPI ID'], ['gst.legal', 'Legal name'], ['gst.trade', 'Trade name']],
    party: [['role', 'Type'], ['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['addr', 'Address'], ['city', 'City'], ['pin', 'PIN code'], ['state', 'State code'], ['gstin', 'GSTIN'], ['ship.addr', 'Ship-to address'], ['ship.state', 'Ship-to state code'], ['gst.legal', 'Legal name'], ['gst.trade', 'Trade name'],
      ['ptype', 'Price type'], ['climit', 'Credit limit'], ['cdays', 'Credit days'], ['route', 'Route / beat'], ['scheme', 'Scheme'], ['msme', 'MSME size'], ['udyam', 'Udyam no'], ['agdays', 'Agreed credit days'], ['group', 'Group']],
    item: [['desc', 'Name'], ['kind', 'Type'], ['cat', 'Group'], ['code', 'Item code'], ['hsn', 'HSN/SAC'], ['unit', 'Unit'], ['rate', 'Rate'], ['wrate', 'Wholesale rate'], ['mrp', 'MRP'], ['prate', 'Purchase price'], ['gst', 'GST %'], ['sl', 'Sales ledger'], ['pl', 'Purchase ledger']]
  };
  var NAMEKEY = { biz: 'name', party: 'name', item: 'desc' };
  var SECS = ['home', 'biz', 'party', 'pgroups', 'item', 'igroups', 'doc', 'settings', 'backup', 'bin', 'log'];
  var GSEC = { pgroups: 'party', igroups: 'item' };   /* the Groups screen of each master */
  var NUMS = { rate: 1, wrate: 1, mrp: 1, prate: 1, climit: 1, cdays: 1, agdays: 1 };
  var cur = 'home', q = '', gf = '', S = {}, RAW = {}, SB = '', cache = {}, G = { party: [], item: [] };

  function key(s) { return String(s || '').trim().toLowerCase(); }
  function get(o, k) { return k.split('.').reduce(function (a, p) { return a == null ? a : a[p]; }, o); }
  function set(o, k, v) { var p = k.split('.'), last = p.pop(); p.forEach(function (x) { o = o[x] = o[x] && typeof o[x] === 'object' ? o[x] : {}; }); o[last] = v; }
  function load() {
    return Promise.all(['biz', 'party', 'item', 'doc', 'bin', 'log'].map(function (s) { return NSStore.list(s); }).concat([NSStore.meta('settings'), NSStore.meta('lastBackup'), NSStore.meta('who'), NSStore.meta('pin'), NSStore.meta('groups')])).then(function (r) {
      cache = { biz: r[0], party: r[1], item: r[2], doc: r[3], bin: r[4], log: r[5] };
      /* settings per business: the stored record (RAW) and the copy for the business chosen on the Settings screen (S) */
      RAW = r[6] || {}; NS.bizCache = cache.biz;
      if (NS.cfgSplit(RAW, cache.biz)) NSStore.meta('settings', RAW).catch(function () {});
      /* inside the App: the App tab's own business first (round C: Settings opened on another business) */
      var inApp = document.documentElement.classList.contains('embed') && NS.curBiz ? NS.curBiz() : '';
      if (!cache.biz.some(function (b) { return b.id === SB; })) SB = inApp && cache.biz.some(function (b) { return b.id === inApp; }) ? inApp : cache.biz.some(function (b) { return b.id === RAW.defBiz; }) ? RAW.defBiz : (cache.biz[0] || {}).id || '';
      S = NS.cfgFor(RAW, SB); S._last = r[7] || 0; S._who = r[8] || ''; S._pin = r[9] || null;
      G = gNorm(r[10]);
      return catGroups();
    }).then(function () { return cache; });
  }
  function title(s, r) {
    if (s === 'doc' && APPDOC[r.type]) { var ak = 'app.d_' + (r.type === 'pbill' && r.kind === 'return' ? 'pret' : r.type), av = t(ak); return (av !== ak ? av : r.type === 'pbill' && r.kind === 'return' ? 'Purchase return' : APPDOC[r.type][0]) + ' ' + (r.no || ''); }   /* in the screen language (round C) */
    if (s === 'doc') return t(r.kind === 'estimate' ? 'doc.estimate' : r.type === 'note' ? 'k.' + r.kind : 'doc.' + (r.type || 'invoice')).replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + (r.no || '');
    return r[NAMEKEY[s]] || t('my.noname');
  }
  /* POS bills are saved as invoices (counter: 1) but open in the POS site */
  function kitType(r) { return r.counter && (!r.type || r.type === 'invoice') ? 'pos' : r.type; }
  function sub(s, r) {
    if (s === 'doc') return NS.fmtDate(r.date) + ' · ' + esc(r.buyer && r.buyer.name || (r.type === 'exp' ? (function (c) { var k = 'app.ex_' + c, v = t(k); return v !== k ? v : c; })(r.cat || r.head || '') : t('h.nocust'))) + ' · <b>' + NS.money(r.total || 0) + '</b> · ' + esc(r.seller && r.seller.name || '') +
      (!r.type || r.type === 'invoice' || r.type === 'cashmemo' ? ' <span class="pill' + (r.status === 'paid' ? ' ok' : '') + '">' + esc(t(r.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'
        : r.status ? ' <span class="pill' + (/^(acc|inv|sdone|prec|nadj|nref|nrecv|npaid|paid)$/.test(r.status) ? ' ok' : '') + '">' + esc(r.status === 'paid' ? t('h.paidp') : r.status === 'unpaid' ? t('h.unpaidp') : t('qs.' + r.status)) + '</span>' : '') +
      (APPDOC[r.type] ? ' <a href="' + APP + APPDOC[r.type][1] + '" target="_blank" rel="noopener">NSBiz ›</a>' :
      KITOF[kitType(r)] ? ' <a href="' + siteUrl(KITOF[kitType(r)][0]) + '?open=' + encodeURIComponent(r.id) + '" target="_blank" rel="noopener">' + esc(t(KITOF[kitType(r)][1])) + ' ›</a>' :
      ' <a href="' + toolUrl(r.type === 'note' && r.kind === 'debit' ? 'debit-note' : SITEOF[r.type || 'invoice']) + '" target="_blank" rel="noopener">' + esc(t(TOOLS.filter(function (x) { return x[0] === (r.type === 'note' && r.kind === 'debit' ? 'debit-note' : SITEOF[r.type || 'invoice']); }).map(function (x) { return x[2]; })[0] || 'nav.billing')) + ' ›</a>');
    if (s === 'item') return [NS.itemGroup(r, G).id && '<span class="pill">' + esc(gPath('item', NS.itemGroup(r, G).id)) + '</span>', r.code && esc(r.code), r.hsn && 'HSN ' + esc(r.hsn), !(NS.num(r.rate) > 0) && NS.num(r.prate) > 0 && esc(t('prl.c.prate')) + ' ' + NS.money(NS.num(r.prate)), NS.num(r.rate) > 0 && NS.money(NS.num(r.rate)) + (r.unit ? ' / ' + esc(r.unit) : ''),
      NS.num(r.wrate) && esc(t('b1.whole')) + ' ' + NS.money(NS.num(r.wrate)), NS.num(r.mrp) && 'MRP ' + NS.money(NS.num(r.mrp)), r.gst !== '' && r.gst != null && 'GST ' + esc(r.gst) + '%', r.kind === 'service' && esc(t('hub.k.service')), r.sample && '<span class="b1-pill">' + esc(t('b1.sample')) + '</span>'].filter(Boolean).join(' · ');
    var bits = [r.gstin && '<span class="mono">' + esc(r.gstin) + '</span>', r.state && esc(NS.stateName(r.state)), r.phone && esc(r.phone)];
    if (s === 'party' && r.role && r.role !== 'customer') bits.unshift(esc(t('hub.r.' + r.role)));
    if (s === 'party') { var pg = NS.partyGroup(r, G); bits.unshift('<span class="pill">' + esc(gPath('party', pg.id)) + '</span>'); }
    if (r.gst && r.gst.legal && key(r.gst.legal) !== key(r.name)) bits.push(esc(t('gf.legal')) + ': ' + esc(r.gst.legal));
    if (s === 'party' && r.ptype === 'wholesale') bits.push(esc(t('b1.pt_whole')));
    if (s === 'party' && NS.num(r.climit)) bits.push(esc(t('b1.climit')) + ' ' + NS.money(NS.num(r.climit)));
    if (s === 'party' && NS.num(r.cdays)) bits.push(esc(t('b1.ndays', { n: NS.num(r.cdays) })));
    if (s === 'party' && r.route) bits.push(esc(t('rtb.route')) + ': ' + esc(r.route));
    if (s === 'party' && r.scheme) bits.push(esc(t('rtb.scheme')) + ': ' + esc(r.scheme));
    if (r.sample) bits.push('<span class="b1-pill">' + esc(t('b1.sample')) + '</span>');
    return bits.filter(Boolean).join(' · ');
  }

  /* ---------- sections ---------- */
  function show(sec, focus) {
    if (SECS.indexOf(sec) < 0) sec = 'home';
    if (cur !== sec) gf = '';
    cur = sec; q = '';
    $$('[data-sec]').forEach(function (b) {
      var on = b.getAttribute('data-sec') === sec;
      b.setAttribute('aria-current', on ? 'page' : 'false');
      if (on && b.parentNode.scrollWidth > b.parentNode.clientWidth) b.parentNode.scrollLeft = b.offsetLeft - 40;
    });
    if (routed && location.hash.slice(1) !== sec) history.replaceState(null, '', sec === 'home' ? location.pathname : '#' + sec);   /* not before the first routing: an early redraw wiped #biz, #item... (F5-1) */
    secPick();
    return load().then(function () {
      counts();
      var pane = $('[data-pane]');
      pane.innerHTML = (NS.sample.has(cache) ? NS.sample.note() : '') + (GSEC[sec] ? groupsHtml(GSEC[sec]) : sec === 'home' ? homeHtml() : sec === 'settings' ? settingsHtml() : sec === 'backup' ? backupHtml() : sec === 'bin' ? binHtml() : sec === 'log' ? logHtml() : listHtml(sec));
      if (sec === 'home' && !cache.biz.length) wireWizard(pane);
      if (sec === 'settings') { wireSettings(pane); wirePin(pane); setNav(pane); }
      if (sec === 'backup') wireBackup(pane);
      if (FORM[sec] || sec === 'doc') renderList();
      if (focus) { var h = $('h2', pane); if (h) { h.tabIndex = -1; h.focus(); } }
    });
  }
  /* screen readers: "My businesses, 2" instead of the name and count run together */
  function secNames() {
    $$('[data-sec]').forEach(function (b) {
      var l = $('span', b), c = $('.n', b), n = c ? c.textContent.trim() : '';
      if (l && l.textContent.trim()) b.setAttribute('aria-label', l.textContent.trim() + (n ? ', ' + n : ''));
    });
  }
  document.addEventListener('ns-lang', function () { setTimeout(secNames, 0); });
  /* the sections as one dropdown above the screen, on phones and computers (owner, 2026-11-06); the link list stays in the page,
     hidden, so section links, counts and the parts other files add (hubmore, hubstaff...) keep working */
  function secPick() {
    var nav = $('.hub-nav'), hub = nav && nav.parentNode; if (!nav) return;
    var box = $('.hub-pick', hub), sel;
    if (!box) {
      box = NS.el('div', { 'class': 'hub-pick' });
      box.innerHTML = '<select aria-label="' + esc(nav.getAttribute('aria-label') || '') + '"></select>';
      hub.insertBefore(box, nav); hub.classList.add('picked');
      $('select', box).addEventListener('change', function () { show(this.value, true); });
      new MutationObserver(function () { clearTimeout(secPick.t); secPick.t = setTimeout(secPick, 30); }).observe(nav, { childList: true, subtree: true, characterData: true });
    }
    sel = $('select', box);
    var html = $$('[data-sec]', nav).map(function (a) {
      var s = a.getAttribute('data-sec'), l = $('span', a), c = $('.n', a), n = c ? c.textContent.trim() : '';
      var txt = (a.classList.contains('sub') ? ' ' : '') + (l ? l.textContent.trim() : a.textContent.trim()) + (n ? ' (' + n + ')' : '');
      return '<option value="' + esc(s) + '"' + (s === cur ? ' selected' : '') + '>' + esc(txt) + '</option>';
    }).join('');
    if (sel.innerHTML !== html) sel.innerHTML = html;
    sel.value = cur;
  }
  function counts() {
    var n = { biz: cache.biz.length, party: cache.party.length, item: cache.item.length, doc: cache.doc.length, bin: cache.bin.length || '', pgroups: G.party.length || '', igroups: G.item.length || '' };
    $$('[data-sec]').forEach(function (b) { var c = $('.n', b), s = b.getAttribute('data-sec'); if (c) c.textContent = n[s] != null ? n[s] : ''; });
    secNames(); secPick();
    var m = $('[data-mode]'); if (m) m.textContent = t(NSStore.mode() === 'vault' ? 'my.vault' : 'my.local');
  }
  function homeHtml() {
    var c = cache, steps = [
      ['biz', c.biz.length > 0, 'hub.s1', '#biz'], ['party', c.party.length > 0, 'hub.s2', '#party'], ['item', c.item.length > 0, 'hub.s3', '#item'],
      ['settings', !!(S.invoice || S.defBiz), 'hub.s4', '#settings'], ['doc', c.doc.length > 0, 'hub.s5', BILLING], ['backup', !!S._last, 'hub.s6', '#backup']
    ];
    var done = steps.filter(function (s) { return s[1]; }).length;
    return '<h2>' + esc(t('hub.home')) + '</h2>' + (c.biz.length ? '' : wizardHtml()) +
      '<div class="tiles">' + ['biz', 'party', 'item', 'doc'].map(function (s) {
        return '<a href="#' + s + '" class="tile"><b>' + c[s].length + '</b><span>' + esc(t('my.t.' + s)) + '</span></a>';
      }).join('') + '</div>' +
      '<div class="card"><h3>' + esc(t('hub.start')) + ' <small class="soft">' + done + ' / ' + steps.length + '</small></h3><ol class="steps">' + steps.map(function (s) {
        var ext = /^http/.test(s[3]);
        return '<li class="' + (s[1] ? 'ok' : '') + '"><span class="tick" aria-hidden="true">' + (s[1] ? '✓' : '') + '</span><a href="' + s[3] + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(t(s[2])) + '</a>' +
          (s[1] ? '<span class="sr">' + esc(t('hub.done')) + '</span>' : '') + '</li>';
      }).join('') + '</ol></div>' +
      '<div class="card"><h3>' + esc(t('hub.tools')) + '</h3><div class="cards">' + '<a href="' + APP + '" target="_blank" rel="noopener"><b>' + esc(t('nav.app')) + '</b><span>' + esc(t('hub.app')) + '</span></a>' + TOOLS.map(function (x) {
        return '<a href="' + toolUrl(x[0]) + '" target="_blank" rel="noopener"><b>' + esc(t(x[2])) + '</b><span>' + esc(t(x[3])) + '</span></a>'; }).join('') + '</div>' +
      '<p class="soft">' + esc(t('hub.toolsp')) + '</p></div>';
  }

  /* ---------- masters list ---------- */
  function listHtml(s) {
    var add = s === 'doc' ? '<a class="btn primary" href="' + BILLING + '" target="_blank" rel="noopener">' + esc(t('hub.newdoc')) + '</a>'
      : '<button type="button" class="btn primary" data-add>+ ' + esc(t('hub.add.' + s)) + '</button>';
    return '<div class="pane-hd"><h2>' + esc(t('my.t.' + s)) + '</h2>' + add + '</div>' + gTabs(s, false) +
      '<p class="soft">' + esc(t('hub.p.' + s)) + '</p>' +
      '<div class="tools-row"><label class="sr" for="my-q">' + esc(t('my.search')) + '</label><input id="my-q" type="search" placeholder="' + esc(t('my.ph')) + '">' +
      (s === 'doc' ? '' : '<label class="btn sm">' + esc(t('hub.imp')) + '<input type="file" accept=".csv,text/csv" data-imp hidden></label>') +
      (s === 'party' || s === 'item' ? '<button type="button" class="btn sm" data-xlimp data-ic="up">' + esc(t('xi.open')) + '</button>' : '') +
      (s === 'party' || s === 'item' ? '<button type="button" class="btn sm" data-swimp data-ic="up">' + esc(t('sw.open')) + '</button>' : '') +
      '<button type="button" class="btn sm" data-exp>' + esc(t('hub.exp')) + '</button>' +
      (s === 'doc' ? '<button type="button" class="btn sm" data-xl>' + esc(t('b1.xl_reg')) + '</button>' : s === 'item' ? '<button type="button" class="btn sm" data-xl>' + esc(t('b1.xl_items')) + '</button>' : '') +
      (s === 'doc' ? '' : '<button type="button" class="link" data-tpl>' + esc(t('hub.tpl')) + '</button>') + '</div>' +
      (s === 'party' || s === 'item' ? gFilter(s) : '') +
      '<ul class="my-list" data-list></ul>';
  }
  function renderList() {
    var list = $('[data-list]'); if (!list) return;
    var s = cur, rows = (cache[s] || []).filter(function (r) {
      return !q || JSON.stringify([title(s, r), r.gstin, r.hsn, r.code, r.cat, r.phone, r.buyer && r.buyer.name, r.seller && r.seller.name]).toLowerCase().indexOf(q) >= 0;
    }).filter(function (r) { return !gf || (s !== 'party' && s !== 'item') || (gf === '-' ? !NS.itemGroup(r, G).id : inGroup(s, r, gf)); });
    rows.sort(function (a, b) { return s === 'doc' ? (b.date || '').localeCompare(a.date || '') || (b.no || '').localeCompare(a.no || '') : title(s, a).localeCompare(title(s, b)); });
    list.innerHTML = rows.length ? rows.map(function (r) {
      var def = s === 'biz' && S.defBiz === r.id;
      return '<li data-id="' + esc(r.id) + '"><div class="hd2"><div class="who">' + (s === 'biz' && r.logo ? '<img src="' + esc(r.logo) + '" alt="">' : '') +
        '<div><b class="ttl">' + esc(title(s, r)) + '</b>' + (def ? ' <span class="pill ok">' + esc(t('hub.default')) + '</span>' : '') + '<div class="sub">' + sub(s, r) + (s === 'doc' && r.sample ? ' <span class="b1-pill">' + esc(t('b1.sample')) + '</span>' : '') + (s === 'doc' && r.rec && r.rec.every ? ' <span class="pill">' + esc(t(r.rec.every === 'quarter' ? 'b1.rep_q' : 'b1.rep_m')) + '</span>' : '') + '</div></div></div><div class="row">' +
        (s === 'biz' && !def ? '<button type="button" class="btn sm" data-def>' + esc(t('hub.makedef')) + '</button>' : '') +
        (s === 'doc' ? '' : '<button type="button" class="btn sm" data-edit>' + esc(t('my.edit')) + '</button>') +
        '<button type="button" class="btn sm" data-log>' + esc(t('b1.changes')) + '</button>' +
        '<button type="button" class="btn sm danger" data-del>' + esc(t('h.del')) + '</button></div></div></li>';
    }).join('') : '<li class="empty">' + esc(t(q ? 'h.nomatch' : 'hub.empty.' + s)) + '</li>';
  }

  /* ---------- add / edit form ---------- */
  function fieldHtml(f, r) {
    var k = f[0], lbl = t(f[1]), kind = f[2], x = f[3] || {}, v = get(r, k), id = 'fm-' + k.replace('.', '-');
    v = v == null ? '' : v;
    var cls = 'f' + (x.wide || kind === 'area' ? ' wide' : ''), req = x.req ? ' required' : '', h;
    if (kind === 'area') h = '<textarea id="' + id + '" name="' + k + '" rows="2" dir="auto">' + esc(v) + '</textarea>';
    else if (kind === 'state') h = '<select id="' + id + '" name="' + k + '"><option value="">—</option>' + NS.STATES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === v ? ' selected' : '') + '>' + s[0] + ' · ' + esc(NS.stateLoc(s[0])) + '</option>'; }).join('') + '</select>';
    else if (kind === 'usedby') {   /* with two or more businesses: this customer / item for every business, or only one */
      if (cache.biz.length < 2 && !v) return '';
      h = '<select id="' + id + '" name="' + k + '"><option value="">' + esc(t('pb.allbiz')) + '</option>' + cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === v ? ' selected' : '') + '>' + esc(t('pb.only', { b: b.name })) + '</option>'; }).join('') + '</select>';
    }
    else if (kind === 'sel') h = '<select id="' + id + '" name="' + k + '">' + x.opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') + '</select>';
    else if (kind === 'pgroup' || kind === 'igroup') {
      var gk = kind === 'pgroup' ? 'party' : 'item';
      v = gk === 'party' ? NS.partyGroup(r, G).id : NS.itemGroup(r, G).id;
      h = '<select id="' + id + '" name="' + k + '">' + (gk === 'item' ? '<option value="">' + esc(t('grp.none')) + '</option>' : '') + gOptions(gk, v) +
        '<option value="+">' + esc(t('grp.newopt')) + '</option></select>' +
        '<span class="gnew" data-gnew hidden><label class="sr" for="' + id + '-new">' + esc(t('grp.newname')) + '</label><input id="' + id + '-new" dir="auto" maxlength="60" placeholder="' + esc(t('grp.newname')) + '">' +
        '<button type="button" class="btn sm" data-gnew-add>' + esc(t('grp.addbtn')) + '</button></span>';
    }
    else if (kind === 'gst') h = '<select id="' + id + '" name="' + k + '"><option value="">—</option>' + ratesWith(v).map(function (g) { return '<option value="' + g + '"' + (String(g) === String(v) ? ' selected' : '') + '>' + g + '%' + (RATES.indexOf(g) < 0 ? ' ⚠' : '') + '</option>'; }).join('') + '</select>';
    else if (kind === 'img') h = '<div class="imgf"><img alt="" data-img="' + k + '"' + (v ? ' src="' + esc(v) + '"' : ' hidden') + '><input id="' + id + '" type="file" accept="image/*" data-imgin="' + k + '" data-max="' + x.max + '">' +
      (k === 'sign' ? '<button type="button" class="btn" data-imgdraw="' + k + '">Draw signature</button>' : '') +
      '<button type="button" class="link" data-imgrm="' + k + '"' + (v ? '' : ' hidden') + '>' + esc(t('hub.rmimg')) + '</button></div>';
    else {
      var attrs = ' id="' + id + '" name="' + k + '" value="' + esc(v) + '"' + req;
      if (kind === 'ltr' || kind === 'gstin' || kind === 'num' || kind === 'unit') attrs += ' dir="ltr"'; else attrs += ' dir="auto"';
      if (x.type) attrs += ' type="' + x.type + '"';
      if (x.mode) attrs += ' inputmode="' + x.mode + '"';
      if (kind === 'num') attrs += ' inputmode="decimal"';
      if (x.max) attrs += ' maxlength="' + x.max + '"';
      if (kind === 'gstin') attrs += ' maxlength="15" autocapitalize="characters" spellcheck="false"';
      if (x.upper) attrs += ' autocapitalize="characters"';
      if (x.ph) attrs += ' placeholder="' + esc(x.ph) + '"';
      if (kind === 'unit') attrs += ' list="hub-units"';
      if (kind === 'cat') attrs += ' list="hub-cats"';
      h = '<input' + attrs + '>';
    }
    var hint = kind === 'gstin' ? '<small class="hint" data-gst-hint aria-live="polite"></small>' : x.hint ? '<small class="hint">' + esc(t(x.hint)) + '</small>' : '';
    return '<div class="' + cls + '"><label for="' + id + '">' + esc(lbl) + (x.req ? ' *' : '') + '</label>' + h + hint + '</div>';
  }
  function openForm(s, id) {
    var dlg = $('#hub-form'), r = id ? JSON.parse(JSON.stringify(cache[s].filter(function (x) { return x.id === id; })[0] || {})) : (s === 'party' ? { role: 'customer' } : s === 'item' ? { kind: 'goods', unit: 'Nos', gst: 18 } : {});
    var imgs = { logo: r.logo || '', sign: r.sign || '' };
    $('[data-form-title]', dlg).textContent = t(id ? 'hub.edit.' + s : 'hub.add.' + s);
    var f = $('form', dlg);
    f.innerHTML = '<div class="fg">' + FORM[s].map(function (x) { return fieldHtml(x, r); }).join('') + '</div>' +
      hubExt('form', s, r) +   /* sections added by other files (hubmore.js: stock tracking) */
      '<datalist id="hub-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(t(id ? 'my.savech' : 'hub.save')) + '</button>' +
      (id ? '' : '<button type="submit" class="btn" data-again>' + esc(t('hub.saveadd')) + '</button>') +
      '<button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    if (r.gst && r.gst.legal && key(r.gst.legal) !== key(r.name) && $('[name=name]', f)) {
      var lh = document.createElement('small'); lh.className = 'hint'; lh.textContent = t('gf.legal') + ': ' + r.gst.legal;
      $('[name=name]', f).parentNode.appendChild(lh);
    }
    var g = $('[name=gstin]', f);
    function gstHint(ev) {
      if (!g) return;
      g.value = g.value.toUpperCase().replace(/\s/g, '');
      var c = NS.gstinCheck(g.value), h = $('[data-gst-hint]', f), st = $('[name=state]', f);
      if (c.empty) { h.textContent = ''; h.className = 'hint'; return; }
      if (g.value.length < 15) { h.textContent = t('hub.gst.typing', { n: 15 - g.value.length }); h.className = 'hint'; return; }
      h.textContent = c.ok ? t('hub.gst.ok', { state: NS.stateLoc(c.state) || '—', pan: c.pan }) : c.msg;
      h.className = 'hint ' + (c.ok ? 'good' : 'bad');
      if (c.ok && c.state && st && !st.value) st.value = c.state;
      /* a valid GSTIN on a business marked "not registered": it is registered (round C) */
      var rg = $('[name=reg]', f); if (ev && c.ok && rg && rg.value === 'unreg') { rg.value = 'regular'; NS.toast(t('hub.rg.toreg')); }
    }
    if (g) { g.addEventListener('input', gstHint); gstHint(); }
    wireGroupField(s, f);
    if (g && NS.gstFetchButton) NS.gstFetchButton(g, function (d) {
      ['name', 'addr', 'city', 'pin', 'state'].forEach(function (k) { var el = f.elements[k]; if (el && d[k]) el.value = d[k]; });
      if (s === 'biz' && d.reg && f.elements.reg) f.elements.reg.value = d.reg;
      var cs = String(d.constitution || ''), bt = /limited liability|\bllp\b/i.test(cs) ? 'llp' : /partnership/i.test(cs) ? 'firm' : /company|limited/i.test(cs) ? 'co' : /trust|society|association|club/i.test(cs) ? 'npo' : /propriet/i.test(cs) ? 'prop' : '';
      if (s === 'biz' && bt && f.elements.fmbtype) { f.elements.fmbtype.value = bt; f.elements.fmbtype.dispatchEvent(new Event('change', { bubbles: true })); }   /* F7-4 */
      if (s === 'party' && d.reg) r.reg = d.reg;
      r.gst = { legal: d.legal || '', trade: d.trade || '', status: d.status || '', type: d.type || '', since: d.since || '', checked: d.checked };
      gstHint();
      if (f.requestSubmit) f.requestSubmit(); else $('[type=submit]', f).click();
    });
    $$('[data-imgin]', f).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var file = inp.files[0], k = inp.getAttribute('data-imgin');
        if (file) shrink(file, +inp.getAttribute('data-max')).then(function (u) { imgs[k] = u; var im = $('[data-img="' + k + '"]', f); im.src = u; im.hidden = !u; $('[data-imgrm="' + k + '"]', f).hidden = !u; });
      });
    });
    $$('[data-imgdraw]', f).forEach(function (b) {   /* draw the signature on screen (NS.drawSign, signature_pad) */
      b.addEventListener('click', function () { var k = b.getAttribute('data-imgdraw'); NS.drawSign().then(function (u) { if (!u) return; imgs[k] = u; var im = $('[data-img="' + k + '"]', f); im.src = u; im.hidden = false; $('[data-imgrm="' + k + '"]', f).hidden = false; }); });
    });
    $$('[data-imgrm]', f).forEach(function (b) {
      b.addEventListener('click', function () { var k = b.getAttribute('data-imgrm'); imgs[k] = ''; $('[data-img="' + k + '"]', f).hidden = true; b.hidden = true; $('[data-imgin="' + k + '"]', f).value = ''; });
    });
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    var again = false;
    var ag = $('[data-again]', f); if (ag) ag.addEventListener('click', function () { again = true; });
    f.onsubmit = function (e) {
      e.preventDefault();
      FORM[s].forEach(function (x) {
        if (x[2] === 'img') { r[x[0]] = imgs[x[0]]; return; }
        var el = f.elements[x[0]]; if (!el) return;
        var v = el.value.trim();
        if (x[2] === 'gstin' || (x[3] && x[3].upper)) v = v.toUpperCase().replace(/\s/g, '');
        set(r, x[0], v);
      });
      if (s === 'item') { if (r.gst !== '') r.gst = +r.gst; }
      if (s === 'item' && window.NSGst && r.tax) {   /* r1-gst: a rate changed here on an item with dated rates applies from today; defaults are not stored */
        if (r.tax.kind === 'taxable') delete r.tax.kind; if (r.tax.itc === 'ok') delete r.tax.itc;
        if (r.gst !== '' && NSGst.hist(r).some(function (h) { return h.from; }) && NSGst.itemRate(r, NS.today()).rate !== r.gst) Object.assign(r, NSGst.addRate(r, NS.today(), r.gst, NS.today()));
        if (!Object.keys(r.tax).length) delete r.tax;
      }
      if (s === 'party' && r.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(r.pan)) { NS.toast(NS.t('ms.panbad'), 'bad'); return; }
      if (r.group === '+') r.group = '';
      if (!r.biz) delete r.biz;
      if (s === 'item') { if (r.group) r.cat = gName('item', r.group); else { delete r.group; r.cat = ''; } }
      if (s === 'party' && (!r.group || r.group === (r.role === 'supplier' ? 'creditors' : 'debtors'))) delete r.group;   /* the built-in for its type: follows the type */
      Object.keys(NUMS).forEach(function (k) { if (r[k] != null && r[k] !== '') r[k] = NS.num(r[k]); });
      hubExt('read', s, r, f);
      if (s === 'party' && r.ship && !r.ship.addr) delete r.ship;
      var nm = key(r[NAMEKEY[s]]);
      if (!nm) { NS.toast(t('hub.v.name'), 'bad'); again = false; return; }
      if (cache[s].some(function (x) { return x.id !== r.id && key(x[NAMEKEY[s]]) === nm; })) { NS.toast(t('hub.v.dup', { name: r[NAMEKEY[s]] }), 'bad'); again = false; return; }
      if (r.gstin && !NS.gstinCheck(r.gstin).ok) { NS.toast(NS.gstinCheck(r.gstin).msg, 'bad'); g.focus(); again = false; return; }
      if (s === 'party') {   /* compliance pack: Udyam number (format only, nothing is looked up), agreed days at most 45 */
        if (r.udyam) { var ud = udyamFmt(r.udyam); if (!ud) { NS.toast(t('cp.udbad'), 'bad'); f.elements.udyam.focus(); again = false; return; } r.udyam = ud; } else delete r.udyam;
        if (r.agdays != null && r.agdays !== '') r.agdays = Math.max(0, Math.min(45, Math.floor(r.agdays))); else delete r.agdays;
        if (!r.msme) delete r.msme;
      }
      if (r.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.bankIfsc)) { NS.toast(t('hub.v.ifsc'), 'bad'); f.elements.bankIfsc.focus(); again = false; return; }
      var first = s === 'biz' && !cache.biz.length && !S.defBiz;
      NSStore.put(s, r).then(function (saved) {
        NS.toast(t('my.saved'));
        if (first) { S.defBiz = saved.id; return saveSettings(); }
      }).then(function () {
        var a = again; again = false;
        return show(s).then(function () { if (a) openForm(s); else dlg.close(); });
      }).catch(function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    var firstIn = $('input:not([type=file]),select,textarea', f); if (firstIn && !(s === 'party')) firstIn.focus(); else if ($('[name=name]', f)) $('[name=name]', f).focus();
  }
  function udyamFmt(s) { var m = /^UDYAM([A-Z]{2})(\d{2})(\d{7})$/.exec(String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')); return m ? 'UDYAM-' + m[1] + '-' + m[2] + '-' + m[3] : ''; }
  function shrink(file, max) {
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/png'));
      };
      img.onerror = function () { NS.toast(t('img.bad'), 'bad'); res(''); };
      img.src = url;
    });
  }

  /* ---------- party and stock groups (meta 'groups'; reader NS.groupsOf / NS.partyGroup / NS.itemGroup in core.js) ---------- */
  var gq = Promise.resolve();
  function gNorm(m) { m = m && typeof m === 'object' ? m : {}; return { party: Array.isArray(m.party) ? m.party : [], item: Array.isArray(m.item) ? m.item : [] }; }
  function gNewId() { return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  /* read the newest list, change it, save it: one change at a time, so two quick saves never lose each other's groups */
  function editGroups(fn) {
    gq = gq.catch(function () {}).then(function () { return NSStore.meta('groups'); }).then(function (m) {
      var fresh = gNorm(m);
      if (fn(fresh) === false) { G = fresh; return; }
      return NSStore.meta('groups', fresh).then(function () { G = fresh; });
    });
    return gq;
  }
  /* every item category typed so far becomes an item group (items keep their cat text) */
  function catGroups() {
    var have = {}, add = [];
    G.item.forEach(function (g) { have[key(g.name)] = 1; });
    cache.item.forEach(function (i) { var c = String(i.cat || '').trim(); if (c && !have[key(c)] && !(i.group && G.item.some(function (g) { return g.id === i.group; }))) { have[key(c)] = 1; add.push(c); } });
    if (!add.length) return Promise.resolve();
    return editGroups(function (m) {
      var n = 0;
      add.forEach(function (c) { if (!m.item.some(function (g) { return key(g.name) === key(c); })) m.item.push({ id: gNewId() + (n++), name: c, under: '' }); });
      return n > 0;
    });
  }
  function gList(kind) { return NS.groupsOf(G, kind); }
  function gGet(kind, id) { return gList(kind).filter(function (g) { return g.id === id; })[0]; }
  function gName(kind, id) { var g = gGet(kind, id); return g ? g.name : ''; }
  function gPath(kind, id) {
    var g = gGet(kind, id); if (!g) return '';
    var up = g.under && gGet(kind, g.under);
    return up && !up.builtin ? up.name + ' › ' + g.name : g.name;
  }
  function gKids(kind, id) { return gList(kind).filter(function (g) { return g.under === id && !g.builtin; }); }
  function gRoots(kind) { return kind === 'party' ? gList('party').filter(function (g) { return g.builtin; }) : gList('item').filter(function (g) { return !g.under || !gGet('item', g.under); }); }
  function gOf(kind, r) { return kind === 'party' ? NS.partyGroup(r, G) : NS.itemGroup(r, G); }
  /* a record is in a group when it is in it, in one of its sub-groups, or (built-ins) anywhere under it */
  function inGroup(kind, r, id) { var g = gOf(kind, r); return g.id === id || g.under === id || (kind === 'party' && g.top === id); }
  function members(kind, id) { return cache[kind].filter(function (r) { return gOf(kind, r).id === id; }); }
  /* <option>s: tops then their sub-groups, indented; skip = ids left out; topOnly = no sub-groups (only groups that may hold a sub-group) */
  function gOptions(kind, sel, skip, topOnly) {
    skip = skip || [];
    var opt = function (g, lv) { return skip.indexOf(g.id) >= 0 ? '' : '<option value="' + esc(g.id) + '"' + (g.id === sel ? ' selected' : '') + '>' + new Array(lv * 3 + 1).join(' ') + esc(g.name) + '</option>'; };
    return gRoots(kind).map(function (r) {
      var h = opt(r, 0);
      if (kind === 'party') h += gKids('party', r.id).map(function (g) { return opt(g, 1) + (topOnly ? '' : gKids('party', g.id).map(function (x) { return opt(x, 2); }).join('')); }).join('');
      else if (!topOnly) h += gKids('item', r.id).map(function (g) { return opt(g, 1); }).join('');
      return h;
    }).join('');
  }
  function gTabs(s, groups) {
    if (s !== 'party' && s !== 'item') return '';
    return '<nav class="seg cats gtabs" aria-label="' + esc(t('my.t.' + s)) + '"><a class="btn sm" href="#' + s + '"' + (groups ? '' : ' aria-current="page"') + '>' + esc(t('grp.list')) + '</a>' +
      '<a class="btn sm" href="#' + (s === 'party' ? 'pgroups' : 'igroups') + '"' + (groups ? ' aria-current="page"' : '') + '>' + esc(t('grp.nav')) + ' <small class="mono">' + (s === 'party' ? G.party.length + 2 : G.item.length) + '</small></a></nav>';
  }
  function gFilter(s) {
    if (s === 'item' && !G.item.length) return '';
    return '<div class="gfilter"><label for="my-gf">' + esc(t('grp.group')) + '</label><select id="my-gf"><option value="">' + esc(t('grp.all')) + '</option>' + gOptions(s, gf) +
      (s === 'item' ? '<option value="-"' + (gf === '-' ? ' selected' : '') + '>' + esc(t('grp.none')) + '</option>' : '') + '</select></div>';
  }
  function gSelect(kind, sel) { return (kind === 'item' ? '<option value="">' + esc(t('grp.none')) + '</option>' : '') + gOptions(kind, sel) + '<option value="+">' + esc(t('grp.newopt')) + '</option>'; }
  /* the Group select on the party and item forms: "+ New group…" opens a name box under it */
  function wireGroupField(s, f) {
    var sel = f.elements.group; if (!sel) return;
    var box = $('[data-gnew]', f), inp = $('input', box), last = sel.value;
    sel.addEventListener('change', function () {
      if (sel.value === '+') { box.hidden = false; inp.focus(); } else { box.hidden = true; last = sel.value; }
    });
    if (s === 'party' && f.elements.role) f.elements.role.addEventListener('change', function () {
      var g = gGet('party', sel.value);
      if (!g || g.builtin) { sel.value = last = f.elements.role.value === 'supplier' ? 'creditors' : 'debtors'; box.hidden = true; }
    });
    function add() {
      var nm = inp.value.trim().replace(/\s+/g, ' ');
      if (!nm) { NS.toast(t('grp.v_name'), 'bad'); inp.focus(); return; }
      if (gDup(s, nm)) { NS.toast(t('grp.v_dup', { name: nm }), 'bad'); inp.focus(); return; }
      var id = gNewId(), under = s === 'party' ? (f.elements.role && f.elements.role.value === 'supplier' ? 'creditors' : 'debtors') : '';
      editGroups(function (m) { m[s].push({ id: id, name: nm, under: under }); }).then(function () {
        sel.innerHTML = gSelect(s, id); sel.value = last = id; inp.value = ''; box.hidden = true; sel.focus(); NS.toast(t('grp.saved')); counts();
      }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    }
    $('[data-gnew-add]', box).addEventListener('click', add);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  }
  function gDup(kind, nm, not) {
    var k = key(nm);
    if (kind === 'party' && ['sundry debtors', 'sundry creditors', 'customers', 'suppliers'].indexOf(k) >= 0) return true;
    return gList(kind).some(function (g) { return g.id !== not && key(g.name) === k; });
  }
  function groupsHtml(kind) {
    var noun = function (n) { return t(kind === 'party' ? 'grp.n_party' : 'grp.n_item', { n: n }); };
    function row(g, lv) {
      var n = members(kind, g.id).length, kids = gKids(kind, g.id), all = cache[kind].filter(function (r) { return inGroup(kind, r, g.id); }).length;
      var bits = [noun(all)];
      if (kids.length) bits.push(t('grp.subs', { n: kids.length }));
      if (g.builtin) bits.push(t('grp.builtin'), 'Tally: ' + (g.id === 'debtors' ? 'Sundry Debtors' : 'Sundry Creditors'));
      return '<li data-gid="' + esc(g.id) + '" class="glv' + lv + '"><div class="hd2"><div class="who"><div><b class="ttl">' + esc(g.name) + '</b><div class="sub">' + esc(bits.join(' · ')) + '</div></div></div>' +
        (g.builtin ? '' : '<div class="row"><button type="button" class="btn sm" data-gedit>' + esc(t('grp.rename')) + '</button><button type="button" class="btn sm" data-gmerge>' + esc(t('grp.merge')) + '</button>' +
          '<button type="button" class="btn sm danger" data-gdel' + (n || kids.length ? ' aria-disabled="true" title="' + esc(t('grp.notempty', { name: g.name })) + '"' : '') + '>' + esc(t('grp.del')) + '</button></div>') + '</div></li>' +
        kids.map(function (x) { return row(x, lv + 1); }).join('');
    }
    var roots = gRoots(kind), none = kind === 'item' ? cache.item.filter(function (r) { return !NS.itemGroup(r, G).id; }).length : 0;
    return '<div class="pane-hd"><h2>' + esc(t('grp.t_' + kind)) + '</h2><button type="button" class="btn primary" data-gadd>+ ' + esc(t('grp.add')) + '</button></div>' + gTabs(kind, true) +
      '<p class="soft">' + esc(t('grp.p_' + kind)) + '</p><ul class="my-list glist">' +
      (roots.length ? roots.map(function (g) { return row(g, 0); }).join('') : '<li class="empty">' + esc(t('grp.empty')) + '</li>') + '</ul>' +
      (none ? '<p class="soft">' + esc(t('grp.none')) + ': ' + esc(noun(none)) + '</p>' : '');
  }
  function openDlg(ttl, html, ok) {
    var dlg = $('#hub-form'), f = $('form', dlg);
    $('[data-form-title]', dlg).textContent = ttl;
    f.onsubmit = null;
    f.innerHTML = html + '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(ok) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    return f;
  }
  /* new group, or rename / move one; a group with sub-groups stays at the top (one level of sub-groups) */
  function groupForm(kind, id) {
    var g = id ? gGet(kind, id) : null, kids = id ? gKids(kind, id) : [];
    var under = g ? g.under : kind === 'party' ? (gf && gGet('party', gf) && gGet('party', gf).builtin ? gf : 'debtors') : '';
    var opts = kind === 'party' ? (kids.length ? gRoots('party').map(function (r) { return '<option value="' + r.id + '"' + (r.id === under ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') : gOptions('party', under, [id], true))
      : '<option value="">' + esc(t('grp.top')) + '</option>' + (kids.length ? '' : gOptions('item', under, [id], true));
    var f = openDlg(t(id ? 'grp.edit' : 'grp.add'), '<div class="fg"><div class="f wide"><label for="gf-name">' + esc(t('grp.name')) + ' *</label><input id="gf-name" name="name" dir="auto" maxlength="60" required value="' + esc(g ? g.name : '') + '"></div>' +
      '<div class="f wide"><label for="gf-under">' + esc(t('grp.under')) + '</label><select id="gf-under" name="under">' + opts + '</select><small class="hint">' + esc(t('grp.h_under')) + '</small></div></div>',
      t(id ? 'my.savech' : 'hub.save'));
    var nmIn = f.elements.name; nmIn.focus();
    f.onsubmit = function (e) {
      e.preventDefault();
      var nm = nmIn.value.trim().replace(/\s+/g, ' '), up = f.elements.under.value;
      if (!nm) { NS.toast(t('grp.v_name'), 'bad'); nmIn.focus(); return; }
      if (gDup(kind, nm, id)) { NS.toast(t('grp.v_dup', { name: nm }), 'bad'); nmIn.focus(); return; }
      var moved = kind === 'item' && g && g.name !== nm ? members('item', id) : [];
      editGroups(function (m) {
        var x = id && m[kind].filter(function (y) { return y.id === id; })[0];
        if (x) { x.name = nm; x.under = up; } else m[kind].push({ id: gNewId(), name: nm, under: up });
      }).then(function () {
        /* items keep cat = their group's name, for code that reads cat */
        return moved.reduce(function (p, r) { return p.then(function () { r.group = id; r.cat = nm; return NSStore.put('item', r); }); }, Promise.resolve());
      }).then(function () { NS.toast(t('grp.saved')); $('#hub-form').close(); return show(cur); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
  }
  /* merge: every member moves to the chosen group, sub-groups go under it, then the group is deleted */
  function mergeForm(kind, id) {
    var g = gGet(kind, id), kids = gKids(kind, id), skip = [id].concat(kids.map(function (k) { return k.id; }));
    var opts = gOptions(kind, '', skip, kids.length > 0);
    if (!opts) { NS.toast(t('grp.nomerge'), 'bad'); return; }
    var f = openDlg(t('grp.mergeinto', { name: g.name }), '<div class="fg"><div class="f wide"><label for="gf-into">' + esc(t('grp.mergeinto', { name: g.name })) + '</label><select id="gf-into" name="into">' + opts + '</select>' +
      '<small class="hint">' + esc(t('grp.h_merge', { name: g.name })) + '</small></div></div>', t('grp.mergebtn'));
    f.onsubmit = function (e) {
      e.preventDefault();
      var to = f.elements.into.value, toG = gGet(kind, to), recs = members(kind, id);
      if (!toG || !NS.okSync(t('grp.c_merge', { n: recs.length, a: g.name, b: toG.name }))) return;
      recs.reduce(function (p, r) {
        return p.then(function () {
          r.group = to;
          if (kind === 'item') r.cat = toG.name;
          if (kind === 'party' && to === (r.role === 'supplier' ? 'creditors' : 'debtors')) delete r.group;
          return NSStore.put(kind, r);
        });
      }, Promise.resolve()).then(function () {
        return editGroups(function (m) { m[kind] = m[kind].filter(function (y) { return y.id !== id; }); m[kind].forEach(function (y) { if (y.under === id) y.under = to; }); });
      }).then(function () { NS.toast(t('grp.merged', { n: recs.length })); $('#hub-form').close(); return show(cur); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
  }
  function delGroup(kind, id) {
    var g = gGet(kind, id); if (!g || g.builtin) return;
    if (members(kind, id).length || gKids(kind, id).length) { NS.toast(t('grp.notempty', { name: g.name }), 'bad'); return; }
    if (!NS.okSync(t('grp.c_del', { name: g.name }))) return;
    editGroups(function (m) { m[kind] = m[kind].filter(function (y) { return y.id !== id; }); })
      .then(function () { NS.toast(t('grp.deleted')); return show(cur); }, function (err) { NS.toast(err.message, 'bad'); });
  }
  /* CSV: a group name -> its id; a name not known yet becomes a new group (parties: under Customers or Suppliers by type) */
  function gFromCsv(kind, nm, role, made) {
    var k = key(nm); if (!k) return '';
    if (kind === 'party') { if (k === 'sundry debtors' || k === 'customers') return 'debtors'; if (k === 'sundry creditors' || k === 'suppliers') return 'creditors'; }
    var hit = gList(kind).concat(made).filter(function (g) { return key(g.name) === k; })[0];
    if (hit) return hit.id;
    var g = { id: gNewId() + made.length, name: String(nm).trim(), under: kind === 'party' ? (role === 'supplier' ? 'creditors' : 'debtors') : '' };
    made.push(g); return g.id;
  }

  /* ---------- Batch 1: getting started, categories, recycle bin, edit history, Excel ---------- */
  function wizardHtml() {
    return '<div class="card b1-wiz"><h3>' + esc(t('b1.wiz')) + '</h3><p class="soft">' + esc(t('b1.wizp')) + '</p><form data-wiz novalidate><div class="fg">' +
      '<div class="f wide"><label for="wz-name">' + esc(t('l.bname')) + ' *</label><input id="wz-name" name="name" dir="auto" required></div>' +
      '<div class="f"><label for="wz-state">' + esc(t('l.state')) + '</label><select id="wz-state" name="state"><option value="">—</option>' + NS.STATES.map(function (x) { return '<option value="' + x[0] + '">' + x[0] + ' · ' + esc(NS.stateLoc(x[0])) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="wz-gstin">' + esc(t('l.gstin')) + '</label><input id="wz-gstin" name="gstin" dir="ltr" maxlength="15" autocapitalize="characters" spellcheck="false"><small class="hint">' + esc(t('b1.wiz_gst')) + '</small></div>' +
      '<div class="f"><label for="wz-phone">' + esc(t('l.phone')) + '</label><input id="wz-phone" name="phone" dir="ltr" inputmode="tel"></div>' +
      '<div class="f"><label for="wz-gst">' + esc(t('hub.defgst')) + '</label><select id="wz-gst" name="gst">' + RATES.map(function (g) { return '<option value="' + g + '"' + (g === 18 ? ' selected' : '') + '>' + g + '%</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="wz-pre">' + esc(t('hub.prefix')) + '</label><input id="wz-pre" name="prefix" dir="ltr" maxlength="8" value="INV" autocapitalize="characters"></div>' +
      '</div><div class="btns"><button type="submit" class="btn primary">' + esc(t('b1.wiz_go')) + '</button><a class="btn" href="' + APP + '">' + esc(t('b1.samp_try')) + '</a></div>' +
      '<p class="soft">' + esc(t('b1.samp_h')) + '</p></form></div>';
  }
  function wireWizard(pane) {
    var f = $('[data-wiz]', pane); if (!f) return;
    f.elements.gstin.addEventListener('input', function () {
      var g = f.elements.gstin; g.value = g.value.toUpperCase().replace(/\s/g, '');
      var c = NS.gstinCheck(g.value); if (c.ok && c.state && !f.elements.state.value) f.elements.state.value = c.state;
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var E = f.elements, name = E.name.value.trim(), g = E.gstin.value.trim();
      if (!name) { NS.toast(t('hub.v.name'), 'bad'); E.name.focus(); return; }
      if (g && !NS.gstinCheck(g).ok) { NS.toast(NS.gstinCheck(g).msg, 'bad'); E.gstin.focus(); return; }
      NSStore.put('biz', { name: name, state: E.state.value, gstin: g, phone: E.phone.value.trim(), reg: g ? 'regular' : 'unreg' }).then(function (b) {
        S.defBiz = b.id;
        S.invoice = Object.assign(S.invoice || {}, { prefix: E.prefix.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), gst: +E.gst.value });
        return saveSettings();
      }).then(function () { NS.toast(t('b1.wiz_done')); show('home'); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    });
  }
  function binHtml() {
    /* a record that is back (restored here or from a backup file) no longer shows in the bin (round C) */
    var rows = cache.bin.filter(function (b) { var id = (b.rec || {}).id; return !id || !(cache[b.store] || []).some(function (x) { return x.id === id; }); }).sort(function (a, b) { return b.at - a.at; });
    return '<div class="pane-hd"><h2>' + esc(t('b1.bin')) + '</h2>' + (rows.length ? '<button type="button" class="btn sm danger" data-binempty>' + esc(t('b1.binempty')) + '</button>' : '') + '</div>' +
      '<p class="soft">' + esc(t('b1.binp', { n: NSStore.binDays })) + '</p><ul class="my-list">' + (rows.length ? rows.map(function (b) {
        var left = Math.max(0, NSStore.binDays - Math.floor((Date.now() - b.at) / 864e5));
        /* a deleted document says what it was: date, party or head, amount (round C: only "Expense") */
        return '<li data-id="' + esc(b.id) + '"><div class="hd2"><div class="who"><div><b class="ttl">' + esc(title(b.store, b.rec || {})) + '</b>' + (b.store === 'doc' && b.rec ? '<div class="sub">' + sub('doc', b.rec) + '</div>' : '') + '<div class="sub">' + esc(t('my.t.' + b.store)) + ' · ' +
          esc(t('b1.delon', { d: NS.when(b.at) })) + (b.who ? ' · ' + esc(b.who) : '') + ' · ' + esc(t('b1.daysleft', { n: left })) + '</div></div></div><div class="row">' +
          '<button type="button" class="btn sm primary" data-restore>' + esc(t('b1.restore')) + '</button></div></div></li>';
      }).join('') : '<li class="empty">' + esc(t('b1.binnone')) + '</li>') + '</ul>';
  }
  function logHtml() {
    var rows = cache.log.slice().sort(function (a, b) { return b.at - a.at; });
    return '<div class="pane-hd"><h2>' + esc(t('b1.hist')) + '</h2>' + (rows.length ? '<button type="button" class="btn sm" data-xllog>' + esc(t('b1.xl')) + '</button>' : '') + '</div>' +
      '<p class="soft">' + esc(t('b1.logp')) + '</p><p class="soft">' + esc(t('b1.logrule')) + '</p>' +
      (NS.logView ? '<div data-au-view></div>' + logLater(rows) : NS.logHtml(rows.slice(0, 300), true) + (rows.length > 300 ? '<p class="soft">' + esc(t('b1.logmore', { n: rows.length })) + '</p>' : ''));
  }
  /* filters and "Check edit history" (extras.js NS.logView), filled once the pane is on the page (ERP Round 1, A-1 / C-18) */
  function logLater(rows) {
    setTimeout(function () { var el = document.querySelector('[data-au-view]'); if (el) NS.logView(el, rows, S.lockBefore || '', true); }, 0);
    return '';
  }
  function excel(s) {
    if (s === 'item') return NS.xlsx('items-and-prices-' + NS.today() + '.xlsx', [NS.reports.items(cache.item)]);
    var D = cache.doc, biz = (cache.biz.filter(function (b) { return b.id === S.defBiz; })[0] || cache.biz[0] || {}).name || '';
    NS.xlsx('registers-' + NS.today() + '.xlsx', [NS.reports.sales(D), NS.reports.purchases(D), NS.reports.dues(D, biz, cache.party, NS.today(), 'recv'), NS.reports.dues(D, biz, cache.party, NS.today(), 'pay')]);
  }

  /* ---------- settings ---------- */
  function saveSettings(why) {
    var o = JSON.parse(JSON.stringify(S));
    Object.keys(o).forEach(function (k) { if (k.charAt(0) === '_') delete o[k]; });
    /* years closed in the App (Batch 2) and its feature switches are changed there only: keep the newest */
    delete o.closed; delete o.features;
    return NSStore.meta('settings').then(function (fresh) {
      fresh = fresh || {}; NS.cfgSplit(fresh, cache.biz);
      NS.cfgSave(fresh, SB, o);   /* business keys under this business, the rest shared */
      RAW = fresh; S.closed = fresh.closed; S.features = fresh.features;
      return NSStore.meta('settings', fresh, { why: typeof why === 'string' ? why : '' });   /* lock moves are logged with their reason (A-4) */
    });
  }
  function settingsHtml() {
    var c = S.invoice || {}, sel = function (v, w) { return String(v) === String(w) ? ' selected' : ''; };
    var gst = c.gst != null && c.gst !== '' ? c.gst : 18, acc = c.accent || ACCENTS[0];
    var pick = cache.biz.length > 1 ? '<div class="card set-biz"><div class="f"><label for="st-for">' + esc(t('pb.setfor')) + '</label><select id="st-for" data-setbiz>' +
      cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + sel(b.id, SB) + '>' + esc(b.name) + '</option>'; }).join('') + '</select><small class="hint">' + esc(t('pb.setforh')) + '</small></div></div>' : '';
    return '<h2>' + esc(t('my.t.settings')) + '</h2><p class="soft">' + esc(t('hub.p.settings')) + '</p>' + pick + '<form class="set" data-set>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.gen')) + '</legend><div class="fg">' +
        '<div class="f wide"><label for="st-def">' + esc(t('hub.defbiz')) + '</label><select id="st-def" name="defBiz"><option value="">' + esc(t('hub.nodef')) + '</option>' +
          cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + sel(b.id, S.defBiz) + '>' + esc(b.name) + '</option>'; }).join('') + '</select><small class="hint">' + esc(t('hub.h.defbiz')) + '</small></div>' +
        '<div class="f"><label for="st-rem">' + esc(t('hub.remind')) + '</label><select id="st-rem" name="remindDays">' + [7, 15, 30, 0].map(function (d) {
          return '<option value="' + d + '"' + sel(d, S.remindDays != null ? S.remindDays : 7) + '>' + esc(d ? t('hub.every', { n: d }) : t('hub.never')) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-lang">' + esc(t('lang')) + '</label>' + NS.langSelect('st-lang') + '<small class="hint">' + esc(t('hub.h.lang2')) + '</small></div>' +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.inv')) + '</legend><p class="dc-top"><a class="dc-open" href="' + siteUrl('billing') + '" target="_blank" rel="noopener">' + esc(t('hub.openmk')) + ' ›</a></p>' +
        '<h3 class="dc-sub">' + esc(t('hub.g.num')) + '</h3><div class="fg">' +
        '<div class="f"><label for="st-pre">' + esc(t('hub.prefix')) + '</label><input id="st-pre" name="prefix" dir="ltr" maxlength="8" value="' + esc(c.prefix != null ? c.prefix : 'INV') + '" autocapitalize="characters"></div>' +
        '<div class="f"><label for="st-dig">' + esc(t('hub.digits')) + '</label><select id="st-dig" name="digits">' + [1, 2, 3, 4, 5, 6].map(function (d) { return '<option' + sel(d, NS.seriesOf(S, 'invoice', '', '', { def: 'INV' }).width) + '>' + d + '</option>'; }).join('') + '</select></div>' +
        '<div class="f wide"><label class="chk"><input type="checkbox" name="fy"' + (NS.seriesOf(S, 'invoice', '', '', { def: 'INV' }).fy ? ' checked' : '') + '> ' + esc(t('hub.fy')) + '</label></div>' +
        '<div class="f wide"><span class="lbl">' + esc(t('hub.next')) + '</span><b class="mono preview-no" data-no-pv></b><small class="hint">' + esc(t('hub.h.num')) + '</small></div>' +
        '<div class="f wide dc-inv">' + serHtml(S, INVX, 1) + vtcHtml(S, INVD, 1) + '</div>' +   /* ERP A-6 / C-11 for the invoice */
      '</div>' +
        '<h3 class="dc-sub">' + esc(t('hub.g.new')) + '</h3><div class="fg">' +
        '<div class="f"><label for="st-kind">' + esc(t('l.type')) + '</label><select id="st-kind" name="kind">' + ['tax', 'supply', 'plain'].map(function (k) { return '<option value="' + k + '"' + sel(k, c.kind || 'tax') + '>' + esc(t('k.' + k)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-gst">' + esc(t('hub.defgst')) + '</label><select id="st-gst" name="gst">' + ratesWith(gst).map(function (g) { return '<option value="' + g + '"' + sel(g, gst) + '>' + g + '%</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-unit">' + esc(t('hub.defunit')) + '</label><input id="st-unit" name="unit" dir="ltr" list="st-units" value="' + esc(c.unit || 'Nos') + '"><datalist id="st-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist></div>' +
        '<div class="f"><label class="chk"><input type="checkbox" name="round"' + (c.round === false ? '' : ' checked') + '> ' + esc(t('l.round')) + '</label></div>' +
        '<div class="f wide"><span class="lbl" id="st-acc-l">' + esc(t('l.colour')) + '</span><div class="swatches" role="radiogroup" aria-labelledby="st-acc-l">' + ACCENTS.map(function (a, i) {
          return '<button type="button" role="radio" aria-checked="' + (a === acc) + '" data-acc="' + a + '" style="background:' + a + '" aria-label="' + esc(t('l.colour')) + ' ' + (i + 1) + '"></button>'; }).join('') + '</div></div>' +
        '<div class="f wide"><label for="st-notes">' + esc(t('l.notes')) + '</label><textarea id="st-notes" name="notes" rows="2" dir="auto" placeholder="' + esc(t('ph.notes')) + '">' + esc(c.notes || '') + '</textarea></div>' +
        '<div class="f wide"><label for="st-terms">' + esc(t('l.terms')) + '</label><textarea id="st-terms" name="terms" rows="3" dir="auto" placeholder="' + esc(t('ph.terms')) + '">' + esc(c.terms || '') + '</textarea><small class="hint">' + esc(t('hub.h.new')) + '</small></div>' +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.docs')) + '</legend><p class="hint">' + esc(t('hub.h.docs')) + '</p>' + DOCCARDS.map(function (g) {
        return '<h3 class="dc-sub">' + esc(t(g[0])) + '</h3><div class="dcards">' + g[1].map(function (d) {
          var rows = PREFIXES.filter(function (x) { return x[0] === d[0] && (!d[3] || x[1].indexOf(d[3]) === 0); }), c2 = S[d[0]] || {};
          return '<div class="dcard"><div class="dc-h"><b>' + esc(t(d[2])) + '</b>' + (d[1] ? '<a class="dc-open" href="' + siteUrl(d[1]) + '" target="_blank" rel="noopener">' + esc(t('hub.openmk')) + ' ›</a>' : '<span class="soft dc-app">' + esc(t('hub.inapp')) + '</span>') + '</div>' + rows.map(function (x) {
            var v = x[1] ? (c2.prefixes || {})[x[1]] : c2.prefix, id = 'st-p-' + x[0] + (x[1] ? '-' + x[1] : '');
            return '<div class="dc-row"><label for="' + id + '">' + esc(rows.length > 1 ? t(x[3]) : t('hub.pfx')) + '</label><input id="' + id + '" data-pre="' + x[0] + '|' + x[1] + '"' + (x[4] ? ' data-fix="' + x[4] + '"' : '') + ' dir="ltr" maxlength="8" autocapitalize="characters" value="' + esc(v != null ? v : x[2]) + '">' +
              '<small class="dc-next">' + esc(t('hub.nextno')) + ' <b class="mono" data-pre-pv></b></small>' + serHtml(S, x) + '</div>'; }).join('') + vtcHtml(S, d) + '</div>'; }).join('') + '</div>'; }).join('') +
      '</fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('b1.g_safe')) + '</legend><div class="fg">' +
        '<div class="f"><label for="st-who">' + esc(t('b1.who')) + '</label><input id="st-who" name="who" dir="auto" maxlength="40" value="' + esc(S._who) + '"><small class="hint">' + esc(t('b1.h_who')) + '</small></div>' +
        '<div class="f"><label for="st-lock">' + esc(t('b1.lock')) + '</label><input id="st-lock" name="lockBefore" type="date" value="' + esc(S.lockBefore || '') + '"><small class="hint">' + esc(t('b1.h_lock')) + '</small></div>' +
        '<div class="f"><label class="chk"><input type="checkbox" name="allowDel"' + (S.allowDel ? ' checked' : '') + '> ' + esc(t('au.allowdel')) + '</label><small class="hint">' + esc(t('au.allowdelh')) + '</small></div>' +
      '</div></fieldset>' +
      '<div class="btns sticky-save"><button type="submit" class="btn primary">' + esc(t('hub.saveset')) + '</button><button type="button" class="btn" data-reset>' + esc(t('hub.reset')) + '</button></div></form>' + pinHtml() +
      hubExt('settings', S);
  }
  /* other files add sections to the item form and Settings: NS.hubExt.push({ form(s, r), read(s, r, f), settings(S), wireSettings(pane, S, save) }) */
  function hubExt(hook) {
    var a = [].slice.call(arguments, 1);
    return (NS.hubExt || []).map(function (x) { try { return x[hook] ? x[hook].apply(null, a) || '' : ''; } catch (e) { console.error(e); return ''; } }).join('');
  }
  function pinHtml() {
    var on = !!S._pin, mins = on ? S._pin.mins || 15 : 15;
    var pinIn = function (id, lbl) { return '<div class="f"><label for="' + id + '">' + esc(lbl) + '</label><input id="' + id + '" name="' + id + '" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div>'; };
    return '<form class="card" data-pin novalidate><h3>' + esc(t('b1.pin_t')) + ' <span class="pill' + (on ? ' ok' : '') + '">' + esc(t(on ? 'b1.pin_on' : 'b1.pin_off')) + '</span></h3><p class="soft">' + esc(t('b1.pin_p')) + '</p><div class="fg">' +
      (on ? pinIn('pin-cur', t('b1.pin_cur')) : '') + pinIn('pin-new', t(on ? 'b1.pin_new2' : 'b1.pin_new')) + pinIn('pin-rep', t('b1.pin_rep')) +
      '<div class="f"><label for="pin-mins">' + esc(t('b1.pin_after')) + '</label><select id="pin-mins" name="pin-mins">' + [5, 15, 30, 60].map(function (m) { return '<option value="' + m + '"' + (m === mins ? ' selected' : '') + '>' + esc(t('b1.mins', { n: m })) + '</option>'; }).join('') + '</select></div>' +
      '</div><div class="btns"><button type="submit" class="btn primary">' + esc(t(on ? 'b1.pin_change' : 'b1.pin_set')) + '</button>' +
      (on ? '<button type="button" class="btn" data-pin-lock>' + esc(t('b1.pin_lock')) + '</button><button type="button" class="btn danger" data-pin-off>' + esc(t('b1.pin_rm')) + '</button>' : '') + '</div></form>';
  }
  function wirePin(pane) {
    var f = $('[data-pin]', pane); if (!f) return;
    var E = f.elements, on = !!S._pin;
    function cur() { return on ? NS.pin.check(E['pin-cur'].value) : Promise.resolve(true); }
    function done(k) { NS.toast(t(k)); show('settings'); }
    E['pin-mins'].addEventListener('change', function () { if (on) NS.pin.mins(E['pin-mins'].value).then(function () { NS.toast(t('hub.setsaved')); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = E['pin-new'].value, b = E['pin-rep'].value;
      if (!/^\d{4,8}$/.test(a)) { NS.toast(t('b1.pin_v'), 'bad'); E['pin-new'].focus(); return; }
      if (a !== b) { NS.toast(t('b1.pin_v2'), 'bad'); E['pin-rep'].focus(); return; }
      cur().then(function (ok) {
        if (!ok) { NS.toast(t('b1.pin_wrong'), 'bad'); E['pin-cur'].focus(); return; }
        return NS.pin.set(a, E['pin-mins'].value).then(function () { done('b1.pin_saved'); });
      });
    });
    var off = $('[data-pin-off]', f), lk = $('[data-pin-lock]', f);
    if (off) off.addEventListener('click', function () {
      cur().then(function (ok) { if (!ok) { NS.toast(t('b1.pin_wrong'), 'bad'); E['pin-cur'].focus(); return; } return NS.pin.remove().then(function () { done('b1.pin_gone'); }); });
    });
    if (lk) lk.addEventListener('click', function () { NS.pin.lock(); });
  }


  /* the settings page as a list of groups (Tally F12 style): one group shown at a time, the choice remembered in this browser */
  function setNav(pane) {
    var form = $('form.set', pane); if (!form || $('.set-nav', pane)) return;
    /* every part of the page: the main settings form and the forms or cards other files add (each with its own Save button).
       A group = one card; it is shown inside its own form, so that form's Save button shows with it and never on its own. */
    var host = form.parentNode, holders = [form].concat([].slice.call(host.children).filter(function (c) { return c !== form && !c.classList.contains('set-biz') && (c.tagName === 'FORM' || c.classList.contains('card') || c.tagName === 'SECTION'); }));
    var items = [], uid = 0;
    holders.forEach(function (hd) {
      var fs = [].slice.call(hd.querySelectorAll(':scope > fieldset.card'));
      (fs.length ? fs : [hd]).forEach(function (c) {
        var lg = c.querySelector(':scope > legend, :scope > h3, :scope > h2, legend, h3'), name = lg ? lg.textContent.replace(/\s+(On|Off|चालू|बंद)$/, '').trim() : 'More';
        var subs = [].slice.call(c.querySelectorAll(':scope > h3.dc-sub')).filter(function (h) { return h.nextElementSibling && h.nextElementSibling.classList.contains('dcards'); });
        if (subs.length > 1) subs.forEach(function (h) { items.push({ id: 'g' + (uid++), card: c, hold: hd, sub: h, name: h.textContent.trim(), head: name }); });
        else items.push({ id: 'g' + (uid++), card: c, hold: hd, name: name });
      });
    });
    if (items.length < 3) return;
    var nav = NS.el('nav', { 'class': 'set-nav', 'aria-label': 'Settings' }), last = '';
    nav.innerHTML = items.map(function (x) { var h = x.head && x.head !== last ? '<p class="set-nh">' + esc(x.head) + '</p>' : ''; last = x.head || ''; return h + '<button type="button" class="set-ni' + (x.head ? ' sub' : '') + '" data-setgo="' + x.id + '">' + esc(x.name) + '</button>'; }).join('');
    var wrap = NS.el('div', { 'class': 'set-wrap' }), body = NS.el('div', { 'class': 'set-body' });
    host.insertBefore(wrap, form); wrap.appendChild(nav); wrap.appendChild(body);
    holders.forEach(function (hd) { body.appendChild(hd); });
    var save = $('.sticky-save', form);
    function pick(id) {
      var x = items.filter(function (y) { return y.id === id; })[0] || items[0];
      holders.forEach(function (hd) { hd.hidden = hd !== x.hold; });
      [].slice.call(x.hold.querySelectorAll(':scope > fieldset.card')).forEach(function (c) { c.hidden = c !== x.card; });
      [].slice.call(x.card.children).forEach(function (e) {
        var isSub = e.tagName === 'H3' && e.classList.contains('dc-sub');
        if (isSub || e.classList.contains('dcards')) e.hidden = x.sub ? !(isSub ? e === x.sub : e.previousElementSibling === x.sub) : false;
      });
      if (save) save.hidden = x.hold !== form;
      [].slice.call(nav.querySelectorAll('[data-setgo]')).forEach(function (b) { var me = b.getAttribute('data-setgo') === x.id; b.classList.toggle('on', me); if (me) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      try { localStorage.setItem('ns-setpick', x.name); } catch (e) {}
    }
    /* like a desktop settings window: the list and the chosen group each scroll by themselves and fill the window, so a group
       always opens from its first line and the page does not move (owner 20 Nov: groups opened cut off or out of view) */
    function fit() {
      if (innerWidth <= 760) { wrap.style.height = ''; wrap.classList.remove('set-win'); return; }
      var hp = $('.hub-pick', document), off = hp && /sticky|fixed/.test(getComputedStyle(hp).position) ? hp.getBoundingClientRect().height + 10 : 10;
      wrap.classList.add('set-win'); wrap.style.scrollMarginTop = off + 'px'; wrap.style.height = Math.max(360, innerHeight - off - 12) + 'px';
    }
    function show() { fit(); body.scrollTop = 0; if (innerWidth > 760) wrap.scrollIntoView({ block: 'start' }); else body.scrollIntoView({ behavior: 'smooth', block: 'start' }); }   /* phone test 21 Nov: on a phone the chosen group opens below the list; bring it into view */
    window.addEventListener('resize', fit);
    nav.addEventListener('click', function (e) { var b = e.target.closest('[data-setgo]'); if (!b) return; pick(b.getAttribute('data-setgo')); show(); });
    var k = ''; try { k = localStorage.getItem('ns-setpick') || ''; } catch (e) {}
    pick((items.filter(function (y) { return y.name === k; })[0] || items[0]).id); fit();
    var on = $('.set-ni.on', nav); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function wireSettings(pane) {
    var sb = $('[data-setbiz]', pane);
    var setDirty = false; pane.addEventListener('input', function (e) { if (e.target !== sb) setDirty = true; }); pane.addEventListener('submit', function () { setDirty = false; }, true); pane.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button[type=submit],[data-save]')) setTimeout(function () { setDirty = false; }, 0); });
    if (sb) sb.addEventListener('change', function () { var prev = SB, go = function () { SB = sb.value; show('settings'); }; if (!setDirty) return go(); NS.ask(t('pb.unsaved')).then(function (y) { if (y) go(); else sb.value = prev; }); });   /* settings of another business; unsaved changes ask first (F7-5) */
    hubExt('wireSettings', pane, S, saveSettings);
    var f = $('[data-set]', pane), acc = (S.invoice && S.invoice.accent) || ACCENTS[0];
    function pv() {
      var fy = NS.fy(NS.today()), short = fy.slice(2, 4) + '-' + fy.slice(5), pre = f.elements.prefix.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, '');
      f.elements.prefix.value = pre;
      var ix = readSx($('[data-ser="invoice"]', f)), isfx = String(ix.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '');
      $('[data-no-pv]', f).textContent = ix.method === 'manual' ? t('ms.vt_manual') : (pre ? pre + '/' : '') + (f.elements.fy.checked ? short + '/' : '') + (ix.restart === 'month' ? NS.today().slice(5, 7) + '/' : '') + String(Math.max(1, +ix.start || 1)).padStart(+f.elements.digits.value, '0') + isfx;
      $$('[data-pre]', f).forEach(function (inp) {
        var p2 = inp.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), fix = +inp.getAttribute('data-fix'), sb = $('[data-ser]', inp.parentNode), x = sb ? readSx(sb) : {};
        var w = +x.width || fix || +f.elements.digits.value, sfx = String(x.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), withFy = sb ? x.fy : (fix || f.elements.fy.checked);
        $('[data-pre-pv]', inp.parentNode).textContent = x.method === 'manual' ? t('ms.vt_manual') : (p2 ? p2 + '/' : '') + (withFy ? short + '/' : '') + (x.restart === 'month' ? NS.today().slice(5, 7) + '/' : '') + String(Math.max(1, +x.start || 1)).padStart(w, '0') + sfx;
      });
    }
    $$('[data-pre]', f).forEach(function (inp) { inp.addEventListener('input', pv); });
    $$('[data-ser] [data-sx]', f).forEach(function (e) { e.addEventListener('input', pv); e.addEventListener('change', pv); });
    ['prefix', 'digits', 'fy'].forEach(function (n) { f.elements[n].addEventListener('input', pv); f.elements[n].addEventListener('change', pv); });
    pv();
    $$('[data-acc]', f).forEach(function (b) {
      b.addEventListener('click', function () { acc = b.getAttribute('data-acc'); $$('[data-acc]', f).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var E = f.elements;
      S.defBiz = E.defBiz.value || '';
      S.remindDays = +E.remindDays.value;
      /* moving the lock earlier or clearing it opens old entries: PIN (when set) and a reason, logged (A-4, C-18) */
      var oldLk = S.lockBefore || '', newLk = E.lockBefore.value || '', earlier = oldLk && (!newLk || newLk < oldLk);
      if (newLk !== oldLk && !earlier && !NS.okSync(newLk ? t('b1.lockc', { d: NS.fmtDate(newLk) }) : t('b1.unlockc'))) return;
      (earlier || !!S.allowDel !== !!(E.allowDel && E.allowDel.checked) && E.allowDel.checked ? NS.guard({ title: t(earlier ? 'au.lockt' : 'au.allowdel'), msg: earlier ? t('au.lockp') : t('au.allowdelh'), why: 'need' }) : Promise.resolve({ why: '' })).then(function (g) { saveSet(E, g.why); }, function () {});
    });
    function saveSet(E, why) {
      S.lockBefore = E.lockBefore.value || '';
      S.allowDel = !!(E.allowDel && E.allowDel.checked);
      NSStore.meta('who', E.who.value.trim());
      S.invoice = { prefix: E.prefix.value.trim(), digits: +E.digits.value, fy: E.fy.checked, kind: E.kind.value, gst: +E.gst.value, unit: E.unit.value.trim() || 'Nos',
        round: E.round.checked, accent: acc, notes: E.notes.value.trim(), terms: E.terms.value.trim() };
      $$('[data-pre]', f).forEach(function (inp) {
        var k = inp.getAttribute('data-pre').split('|'), v = inp.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), c2 = S[k[0]] = S[k[0]] || {};
        if (k[1]) { c2.prefixes = c2.prefixes || {}; c2.prefixes[k[1]] = v; } else c2.prefix = v;
      });
      /* numbering of each series and printing of each card (A-6, C-11) */
      S.series = S.series || {}; S.vt = S.vt || {};
      $$('[data-ser]', f).forEach(function (b) {
        var k = b.getAttribute('data-ser'), x = k === 'invoice' ? INVX : PREFIXES.filter(function (p) { return serKey(p) === k; })[0]; if (!x) return;
        var r = readSx(b), d00 = serDef(S, x); if (r.width == null) r.width = d00.width; if (r.fy == null) r.fy = d00.fy;
        var nx = { method: r.method, suffix: String(r.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '').slice(0, 6), fy: !!r.fy, width: +r.width, start: Math.max(1, Math.floor(+r.start || 1)), restart: r.restart, dup: r.dup };
        var d0 = serDef(S, x), o = {}; Object.keys(nx).forEach(function (q) { if (nx[q] !== d0[q]) o[q] = nx[q]; });
        if (Object.keys(o).length) S.series[k] = o; else delete S.series[k];
      });
      $$('[data-vtc]', f).forEach(function (b) {
        var k = b.getAttribute('data-vtc'), r = readSx(b), o = {}, old = (S.vt || {})[k] || {};
        Object.keys(old).forEach(function (q) { if (!(q in r)) o[q] = old[q]; });
        if (r.copies) o.copies = +r.copies; ['paper', 'design', 'notes', 'terms'].forEach(function (q) { if (r[q]) o[q] = r[q]; }); if (r.printAfter) o.printAfter = true; if (r.shareAfter) o.shareAfter = true;
        if (Object.keys(o).length) S.vt[k] = o; else delete S.vt[k];
      });
      saveSettings(why).then(function () { NS.toast(t('hub.setsaved')); counts(); });
    }
    $('[data-reset]', f).addEventListener('click', function () {
      if (!NS.okSync(t('hub.c.reset'))) return;
      delete S.invoice; PREFIXES.forEach(function (x) { delete S[x[0]]; }); delete S.series; delete S.vt; S.remindDays = 7;
      saveSettings().then(function () { NS.toast(t('hub.setsaved')); show('settings'); });
    });
  }

  /* ---------- backup and devices ---------- */
  function backupHtml() {
    return '<h2>' + esc(t('hub.backup')) + '</h2><p class="soft">' + esc(t('hub.p.backup')) + '</p>' +
      '<div class="card"><p>' + esc(t('md.last')) + ' <b>' + (S._last ? esc(NS.fmtDate(new Date(S._last - new Date(S._last).getTimezoneOffset() * 6e4).toISOString().slice(0, 10)) + ', ' + new Date(S._last).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })) : esc(t('md.never'))) + '</b></p>' +
      '<div class="btns"><button type="button" class="btn primary" data-act="backup">' + esc(t('md.save')) + '</button>' +
      '<label class="btn"><span>' + esc(t('md.restore')) + '</span><input type="file" accept=".json,application/json" data-act="restore" hidden></label>' +
      '<button type="button" class="btn" data-act="my-data" data-tab="af">' + esc(t('my.auto')) + '</button></div>' +
      '<p class="soft" data-store-info></p><p class="soft">' + t('hub.move', { link: '<a href="' + BILLING + 'move-data/" target="_blank" rel="noopener">' + esc(t('nav.move')) + '</a>' }) + '</p></div>' +
      '<div data-backup-ext></div>' +
      '<div class="card danger-zone"><h3>' + esc(t('my.wipe.t')) + '</h3><p class="soft">' + esc(t('my.wipe.p')) + '</p>' +
      '<button type="button" class="btn danger" data-wipe>' + esc(t('my.wipe.b')) + '</button></div>';
  }
  function wireBackup(pane) {
    NSStore.estimate().then(function (e) {
      if (e && e.usage != null) $('[data-store-info]', pane).textContent = t('hub.used', { mb: (e.usage / 1048576).toFixed(1) });
    }).catch(function () {});
    (NS.hubBackupExt || []).forEach(function (f) { try { f(pane); } catch (e) {} });   /* locked backup, Drive sync, send to accountant (safe.js) */
    $('[data-wipe]', pane).addEventListener('click', function () {
      if (!NS.okSync(t('my.wipe.c1'))) return;
      if (prompt(t('my.wipe.c2')) !== 'DELETE') return;
      /* PIN when set, a reason; the edit history and earlier versions stay (A-1, C-18) */
      NS.guard({ title: t('au.wipet'), msg: t('au.wipep'), why: 'ask', danger: 1 }).then(function (g) { return NSStore.wipe(g.why); })
        .then(function () { NS.toast(t('my.wiped')); show('backup'); }, function (err) { if (!err.quiet) NS.toast(err.message, 'bad'); });
    });
  }

  /* ---------- CSV import / export ---------- */
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function download(name, text) {
    var a = NS.el('a', { href: URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function exportCsv(s, blankOnly) {
    if (s === 'doc') {
      var hd = ['Type', 'Number', 'Date', 'Customer', 'Customer GSTIN', 'Business', 'Total', 'Status'];
      var rows = cache.doc.slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).map(function (d) {
        return [d.type, d.no, d.date, d.buyer && d.buyer.name, d.buyer && d.buyer.gstin, d.seller && d.seller.name, NS.r2(d.total || 0), d.type === 'quote' ? { open: 'Waiting for reply', acc: 'Accepted', dec: 'Not accepted', inv: 'Invoice made' }[d.status] || '' : d.status === 'paid' ? 'Paid' : 'Not paid'];
      });
      return download('documents-' + NS.today() + '.csv', [hd].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'));
    }
    var cols = csvCols(s), lines = [cols.map(function (c) { return c[1]; })];
    if (blankOnly) lines.push(cols.map(function (c) { return { role: 'customer', kind: 'goods', unit: 'Nos', gst: '18', state: '03' }[c[0]] || ''; }));
    else cache[s].forEach(function (r) { lines.push(cols.map(function (c) { return csvGet(s, r, c[0]); })); });
    download((blankOnly ? 'template-' : '') + { biz: 'businesses', party: 'customers-suppliers', item: 'items-services' }[s] + (blankOnly ? '' : '-' + NS.today()) + '.csv', lines.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'));
  }
  /* group columns hold the group's name (built-ins in English, so the file reads back in any language) */
  /* the party / item custom fields as extra columns named by their label (ERP Round 2, cfields.js) */
  function csvCols(s) { return CSV[s].concat(window.NSCF && (s === 'party' || s === 'item') ? NSCF.defs(NSCF.list(), s, 'head', '', true).map(function (f) { return ['cf.' + f.id, f.label]; }) : []); }
  function csvGet(s, r, k) {
    if (k.indexOf('cf.') === 0 && window.NSCF) { var cfd = NSCF.get(k.slice(3)); return cfd ? NSCF.fmt(cfd, r.cf && r.cf[cfd.id]) : ''; }
    if (s === 'party' && k === 'group') { var pg = NS.partyGroup(r, G); return pg.id === 'debtors' ? 'Customers' : pg.id === 'creditors' ? 'Suppliers' : pg.name; }
    if (s === 'item' && k === 'cat') return NS.itemGroup(r, G).name || r.cat || '';
    return get(r, k);
  }
  function parseCsv(txt) {
    txt = txt.replace(/^﻿/, '');
    var rows = [], row = [], cell = '', inq = false, i, c;
    var sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (i = 0; i < txt.length; i++) {
      c = txt[i];
      if (inq) { if (c === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else inq = false; } else cell += c; }
      else if (c === '"') inq = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  function stateCode(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^\d{1,2}$/.test(v)) { v = v.padStart(2, '0'); return NS.stateName(v) ? v : ''; }
    var hit = NS.STATES.filter(function (s) { return key(s[1]) === key(v); })[0];
    return hit ? hit[0] : '';
  }
  function importCsv(s, file) {
    file.text().then(function (txt) {
      var rows = parseCsv(txt);
      if (rows.length < 2) throw new Error(t('hub.imp.empty'));
      var cols = csvCols(s), head = rows[0].map(function (h) { return key(h).replace(/[^a-z0-9%]/g, ''); });
      var idx = cols.map(function (c) { var n = key(c[1]).replace(/[^a-z0-9%]/g, ''), alt = key(c[0]).replace(/[^a-z0-9]/g, ''); var i = head.indexOf(n); if (i < 0) i = head.indexOf(alt); if (i < 0 && c[0] === 'cat') i = head.indexOf('category'); return i; });
      var nameCol = cols.map(function (c) { return c[0]; }).indexOf(NAMEKEY[s]);
      if (idx[nameCol] < 0) throw new Error(t('hub.imp.nohead', { col: cols[nameCol][1] }));
      var byName = {}; cache[s].forEach(function (r) { byName[key(r[NAMEKEY[s]])] = r; });
      var add = 0, upd = 0, bad = [], puts = [], made = [];
      rows.slice(1).forEach(function (cells, n) {
        var r = {}, line = n + 2;
        cols.forEach(function (c, j) { if (idx[j] >= 0 && cells[idx[j]] != null && String(cells[idx[j]]).trim() !== '') set(r, c[0], String(cells[idx[j]]).trim()); });
        var nm = key(r[NAMEKEY[s]]); if (!nm) return;
        if (r.state) r.state = stateCode(r.state);
        if (r.ship && r.ship.state) r.ship.state = stateCode(r.ship.state);
        if (r.gstin) { r.gstin = r.gstin.toUpperCase().replace(/\s/g, ''); var g = NS.gstinCheck(r.gstin); if (!g.ok) { bad.push(line); return; } if (!r.state && g.state) r.state = g.state; }
        if (r.role) r.role = /supp/i.test(r.role) ? (/both|cust/i.test(r.role) ? 'both' : 'supplier') : /both/i.test(r.role) ? 'both' : 'customer';
        if (r.kind) r.kind = /serv/i.test(r.kind) ? 'service' : 'goods';
        Object.keys(NUMS).forEach(function (k) { if (r[k] != null) r[k] = NS.num(r[k]); });
        if (r.ptype) r.ptype = /whole/i.test(r.ptype) ? 'wholesale' : 'retail';
        if (r.msme) { var mz = String(r.msme).toLowerCase().trim(); if (['micro', 'small', 'medium', 'other'].indexOf(mz) >= 0) r.msme = mz; else delete r.msme; }
        if (r.udyam) { var uz = udyamFmt(r.udyam); if (uz) r.udyam = uz; else delete r.udyam; }
        if (r.agdays !== undefined && r.agdays !== '') r.agdays = Math.max(0, Math.min(45, Math.floor(+r.agdays || 0))); else delete r.agdays;
        if (r.gst != null) r.gst = NS.num(String(r.gst).replace('%', ''));
        if (r.cf && window.NSCF) { var cf0 = r.cf; r.cf = {}; Object.keys(cf0).forEach(function (id) { var cfd = NSCF.get(id); if (cfd) NSCF.setCf(r, cfd, cf0[id]); }); if (!r.cf || !Object.keys(r.cf).length) delete r.cf; }   /* custom field columns, typed values */
        var have = byName[nm];
        if (s === 'party' && r.group) {
          var role = r.role || (have && have.role) || 'customer';
          r.group = gFromCsv('party', r.group, role, made);
          if (r.group === (role === 'supplier' ? 'creditors' : 'debtors')) { r.group = ''; if (have) delete have.group; delete r.group; }
        }
        if (s === 'item' && r.cat) { r.group = gFromCsv('item', r.cat, '', made); r.cat = gList('item').concat(made).filter(function (g) { return g.id === r.group; })[0].name; }
        if (have) { Object.keys(r).forEach(function (k) { if (k === 'ship' || k === 'cf') have[k] = Object.assign(have[k] || {}, r[k]); else have[k] = r[k]; }); puts.push(have); upd++; }
        else { if (s === 'party' && !r.role) r.role = 'customer'; if (s === 'item' && !r.kind) r.kind = 'goods'; byName[nm] = r; puts.push(r); add++; }
      });
      /* say what will happen before anything is saved, like the Excel import does (round C) */
      var q = t('hub.imp.ask', { a: add, u: upd }) + (bad.length ? ' ' + t('hub.imp.bad', { rows: bad.slice(0, 8).join(', ') + (bad.length > 8 ? '…' : '') }) : '');   /* F7-6 */
      return (NS.ask ? NS.ask(q) : Promise.resolve(confirm(q))).then(function (ok) {
        if (!ok) { load(); return show(s); }
        var gp = made.length ? editGroups(function (m) { made.forEach(function (g) { m[s].push(g); }); }) : Promise.resolve();
        return puts.reduce(function (p, r) { return p.then(function () { return NSStore.put(s, r); }); }, gp).then(function () {
          NS.toast(t('hub.imp.done', { a: add, u: upd }) + (bad.length ? ' ' + t('hub.imp.bad', { rows: bad.slice(0, 8).join(', ') + (bad.length > 8 ? '…' : '') }) : ''), bad.length ? 'bad' : '');
          return show(s);
        });
      });
    }).catch(function (e) { NS.toast(e.message || t('bk.unread'), 'bad'); });
  }

  /* the Excel import (xlimport.js) reads the same columns */
  NS.hubCsv = { cols: CSV, stateCode: stateCode };

  /* ---------- start ---------- */
  var routed = false;   /* true once the address (#biz, #item, #settings/gd...) has been opened */
  function init() {
    if (!$('#my-app')) return;
    /* #biz/new (App "Add my business") opens the section with its add form */
    function go(h) {
      var m = /^(\w+)\/new$/.exec(h || '');
      if (m && SECS.indexOf(m[1]) >= 0) return show(m[1]).then(function () { history.replaceState(null, '', '#' + m[1]); openForm(m[1]); });
      /* #settings/gd: the section, scrolled to that part (godown names, salesmen) with the cursor in it */
      var a = /^(\w+)\/([\w-]+)$/.exec(h || '');
      if (a && SECS.indexOf(a[1]) >= 0) return show(a[1]).then(function () { history.replaceState(null, '', '#' + a[1]); setTimeout(function () { var el = document.getElementById('set-' + a[2]); if (!el) return; el.scrollIntoView({ block: 'start' }); var i = el.querySelector('textarea,input,select'); if (i) i.focus({ preventScroll: true }); }, 60); });
      return show(h || 'home');
    }
    NSStore.ready().then(function () { routed = true; return go(location.hash.slice(1)); });
    $$('[data-sec]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); show(b.getAttribute('data-sec'), true); });
    });
    window.addEventListener('hashchange', function () { var h = location.hash.slice(1) || 'home'; if (h !== cur) go(h); });
    var pane = $('[data-pane]');
    pane.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && SECS.indexOf(a.getAttribute('href').slice(1)) >= 0) { e.preventDefault(); show(a.getAttribute('href').slice(1), true); return; }
      if (e.target.closest('[data-add]')) return openForm(cur);
      if (e.target.closest('[data-exp]')) return exportCsv(cur);
      if (e.target.closest('[data-tpl]')) return exportCsv(cur, true);
      if (e.target.closest('[data-xlimp]')) return NS.xlImport && NS.xlImport.open();
      if (e.target.closest('[data-swimp]')) return NS.swImport && NS.swImport.open();
      if (e.target.closest('[data-xl]')) return excel(cur);
      if (e.target.closest('[data-xllog]')) return NS.xlsx('edit-history-' + NS.today() + '.xlsx', [NS.reports.log(cache.log)]);
      if (e.target.closest('[data-binempty]')) {   /* PIN when set, logged (C-18) */
        if (NS.okSync(t('b1.binemptyc'))) NS.guard({ title: t('au.bint'), msg: t('au.binp'), why: 'ask', danger: 1 }).then(function (g) {
          var n = cache.bin.length;
          return Promise.all(cache.bin.map(function (b) { return NSStore.del('bin', b.id); })).then(function () { return NSStore.note('binempty', { n: n, why: g.why || undefined }); });
        }).then(function () { show('bin'); }, function () {});
        return;
      }
      if (e.target.closest('[data-gadd]')) return groupForm(GSEC[cur]);
      var gl = e.target.closest('li[data-gid]');
      if (gl) {
        var gid = gl.getAttribute('data-gid');
        if (e.target.closest('[data-gedit]')) groupForm(GSEC[cur], gid);
        else if (e.target.closest('[data-gmerge]')) mergeForm(GSEC[cur], gid);
        else if (e.target.closest('[data-gdel]')) delGroup(GSEC[cur], gid);
        return;
      }
      var li = e.target.closest('li[data-id]'); if (!li) return;
      var id = li.getAttribute('data-id');
      if (e.target.closest('[data-edit]')) openForm(cur, id);
      else if (e.target.closest('[data-def]')) { S.defBiz = id; saveSettings().then(function () { NS.toast(t('hub.setsaved')); show('biz'); }); }
      else if (e.target.closest('[data-log]')) NS.showLog(id, t('b1.changesof', { no: $('.ttl', li).textContent }));
      else if (e.target.closest('[data-restore]')) {
        /* F4-12: a deleted bill whose number has since been given to another bill of the same series and year is not brought back as a second copy */
        var bn = cache.bin.filter(function (x) { return x.id === id; })[0], rr = bn && bn.store === 'doc' && bn.rec, lk = function (v) { return String(v || '').trim().toLowerCase(); };
        var clash = rr && rr.no && cache.doc.filter(function (x) { return x.id !== rr.id && (x.type || 'invoice') === (rr.type || 'invoice') && lk(x.no) === lk(rr.no) && NS.fy(x.date) === NS.fy(rr.date) && lk(x.seller && x.seller.name) === lk(rr.seller && rr.seller.name); })[0];
        if (clash) { NS.toast(t('b1.resdup', { no: rr.no }), 'bad'); return; }
        NSStore.restore(id).then(function () { NS.toast(t('b1.restored')); show('bin'); }, function (err) { NS.toast(err.message, 'bad'); });
      }
      else if (e.target.closest('[data-del]')) {
        /* a party with saved documents says so before it goes (round C); the site's own box, not the browser's confirm() */
        var nm = $('.ttl', li).textContent, kk = String(nm || '').trim().toLowerCase(), nd = cur === 'party' ? (cache.doc || []).filter(function (d) { return String((d.buyer || {}).name || '').trim().toLowerCase() === kk; }).length : 0;
        if (cur === 'item') nd = (cache.doc || []).filter(function (d) { return (d.items || []).concat(d.lines || []).some(function (l) { return l && String(l.desc || '').trim().toLowerCase() === kk; }); }).length;
        if (nd && (cur === 'party' || cur === 'item')) { NS.toast(t('ms.inuse', { n: nd }), 'bad'); return; }   /* used in vouchers: alter it, never delete (as in an accounting program) */
        var msg = nd ? t('b1.cdelp', { x: nm, n: nd }) : t('b1.cdel', { x: nm });
        (NS.ask ? NS.ask(msg, { danger: true }) : Promise.resolve(confirm(msg))).then(function (ok) {
          if (!ok) return;
          NSStore.del(cur, id).then(function () {
            if (cur === 'biz' && S.defBiz === id) { S.defBiz = ''; return saveSettings(); }
          }).then(function () { NS.toast(t('b1.binned')); show(cur); }, function (err) { NS.toast(err.message, 'bad'); });
        });
      }
    });
    pane.addEventListener('input', function (e) { if (e.target.id === 'my-q') { q = e.target.value.trim().toLowerCase(); renderList(); } });
    pane.addEventListener('change', function (e) { if (e.target.id === 'my-gf') { gf = e.target.value; renderList(); return; } if (e.target.hasAttribute('data-imp') && e.target.files[0]) { importCsv(cur, e.target.files[0]); e.target.value = ''; } });
    NS.onRestore = function () { show(cur); };
    document.addEventListener('ns-data', function () { if (routed) show(cur); });
    document.addEventListener('ns-lang', function () { if (routed) show(cur); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
