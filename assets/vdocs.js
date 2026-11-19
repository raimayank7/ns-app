/* NSBiz voucher screens for the documents made by the makers (owner 2026-11-19: "In app everything should be like an accounting
   application"). Inside the App a delivery challan, quotation/estimate, proforma, sales order, purchase order, credit/debit note
   (sale and purchase side), cash memo, self invoice and export invoice open on the App's entry screen (the Sale bill's grid and keys:
   Enter = next box, Ctrl+S = save, Esc = back), never the web maker with its paper preview. The record saved is the maker's own
   record (docs.js blank() + the same totals and number series), so the makers, books, GSTR-1, stock and printing keep working.
   Print / PDF / Share use the maker's paper in a hidden frame of the App: the paper is never shown while entering.
   The App's links reach these screens through NSVDocs.claim() (app.js go() and route()); the standalone sites are not touched. */
(function () {
  'use strict';
  if (!window.NSApp) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2;
  function t(k, v) { return NS.t(k, v); }
  function key(s) { return String(s || '').trim().toLowerCase(); }

  /* the same table as docs.js TYPES (only what an entry screen needs); keep the two in step */
  var VT = {
    quote: { site: 'quotation', prefixes: { quote: 'QT', estimate: 'EST' }, kinds: ['quote', 'estimate'], valid: 1, gstFlag: 1, status: ['open', 'acc', 'dec', 'inv'], refLbl: 'qref' },
    proforma: { site: 'proforma', prefix: 'PI', kinds: ['proforma'], valid: 1, gstFlag: 1, status: ['open', 'acc', 'dec', 'inv'], refLbl: 'qref' },
    so: { site: 'sales-order', prefix: 'SO', kinds: ['so'], deliv: 1, gstFlag: 1, status: ['sopen', 'spart', 'sdone', 'inv', 'scan'], refLbl: 'poref' },
    challan: { site: 'challan', prefix: 'DC', kinds: ['sale', 'job', 'approval', 'transfer', 'other'], purpose: 1, transport: 1, gstFlag: 1, gstOff: 1, copy: 'dcorig', status: ['dsent', 'dret', 'inv'], refLbl: 'ref' },
    po: { site: 'purchase-order', prefix: 'PO', kinds: ['po'], deliv: 1, gstFlag: 1, status: ['popen', 'prec', 'scan'], refLbl: 'vqref', buy: 1 },
    note: { site: 'credit-note', prefixes: { credit: 'CN', debit: 'DN', creditp: 'PCN', debitp: 'PDN' }, kinds: ['credit', 'debit'], orig: 1, gstFlag: 1, copy: 'orig', status: ['nissued', 'nadj', 'nref'], refLbl: 'ref' },
    self: { site: 'self-invoice', prefix: 'SI', kinds: ['self'], alwaysTax: 1, rcFixed: 1, recv: 1, buy: 1, status: ['siopen', 'sipaid'], refLbl: 'ref' },
    exp: { site: 'export-invoice', prefix: 'EXP', kinds: ['expwp', 'expwop', 'sezwp', 'sezwop'], alwaysTax: 1, igst: 1, copy: 'orig', due: 1, pay: 1, refLbl: 'ref' },
    cashmemo: { site: 'cash-memo', prefix: 'CM', kinds: ['cashmemo'], gstFlag: 1, gstOff: 1, pay: 1, paidFirst: 1, paper: 'th80', refLbl: 'ref' },
    /* ERP round 2 (orders, ordercore.js): stock vouchers saved as { type:'stk', kind } with the party and lines of a document; printed by orders.js */
    grn: { stk: 1, prefixes: { grn: 'GRN' }, kinds: ['grn'], buy: 1, transport: 1, refLbl: 'sdc' },
    rejin: { stk: 1, prefixes: { rejin: 'RIN' }, kinds: ['rejin'], refLbl: 'ref' },
    rejout: { stk: 1, prefixes: { rejout: 'ROUT' }, kinds: ['rejout'], buy: 1, transport: 1, refLbl: 'ref' }
  };
  var SITE2 = { quotation: 'quote', proforma: 'proforma', 'sales-order': 'so', challan: 'challan', 'purchase-order': 'po', 'credit-note': 'note', 'debit-note': 'note', 'cash-memo': 'cashmemo', 'self-invoice': 'self', 'export-invoice': 'exp' };
  var REASONS = ['ret', 'price', 'disc', 'short', 'tax', 'other'];
  /* English names of the source document on the "Against" line (docs.js NAMES) */
  var NAMES = { tax: 'Invoice', supply: 'Bill of Supply', plain: 'Invoice', quote: 'Quotation', estimate: 'Estimate', proforma: 'Proforma Invoice', so: 'Sales Order', challan: 'Delivery Challan',
    po: 'Purchase Order', credit: 'Credit Note', debit: 'Debit Note', cashmemo: 'Cash Memo', self: 'Self Invoice' };
  var CUR = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'AUD', 'CAD', 'JPY', 'CNY', 'INR'];

  function vtOf(d) { var ty = (d && d.type) || 'invoice'; if (ty === 'stk') return VT[d.kind] && VT[d.kind].stk && (d.kind !== 'rejin' || d.items) ? d.kind : ''; return ty === 'expinv' ? 'exp' : VT[ty] ? ty : ''; }   /* stk: receipt note, goods back / sent back (the stock site's own goods-back entries have lines only and stay there) */
  function siteOf(d) { var v = vtOf(d); return v === 'note' && d.kind === 'debit' ? 'debit-note' : v ? VT[v].site : (d.type || 'invoice') === 'invoice' && !d.counter ? 'billing' : ''; }
  function A() { return window.NSApp; }
  function H() { return A().vh(); }
  function pur(d) { return vtOf(d) === 'note' && d.side === 'purchase'; }
  function buying(d) { return !!VT[vtOf(d)].buy || pur(d); }
  function less(d) { return d.kind === 'credit' ? !pur(d) : pur(d); }
  function sk(d) { return (d.kind || VT[vtOf(d)].kinds[0]) + (pur(d) ? 'p' : ''); }
  function taxOn(d) { var T = VT[vtOf(d)]; return !!T.alwaysTax || (T.gstFlag ? d.withGst !== false : d.kind === 'tax'); }
  function stList(d) { var T = VT[vtOf(d)]; if (vtOf(d) !== 'note') return T.status; var k = less(d) ? (pur(d) ? 'nrecv' : 'nref') : (pur(d) ? 'npaid' : 'nrecv'); return T.status.map(function (x) { return x === 'nref' ? k : x; }); }
  function reasons(d) { return vtOf(d) === 'note' && !less(d) ? ['price', 'tax', 'other'] : REASONS; }
  function rsKey(d, k) { if (vtOf(d) === 'note' && (k === 'price' || k === 'tax')) return 'rs.' + k + '_' + (less(d) ? 'c' : 'd'); return k === 'disc' && pur(d) ? 'rs.disc_p' : k === 'ret' && pur(d) ? 'rs.ret_p' : 'rs.' + k; }
  function docWord(ty, kind) { return ty === 'note' || ty === 'quote' ? t('k.' + kind) : t('Doc.' + ty); }

  /* the settings of the business (docs.js dset): the invoice defaults serve every document */
  function dset(ty, seller) {
    var C = NS.cfgFor(A().cfg() || {}, seller || A().biz()), inv = C.invoice || {};
    return Object.assign({ gst: inv.gst, unit: inv.unit, round: inv.round, accent: inv.accent, digits: inv.digits, fy: inv.fy }, C[ty] || {});
  }
  /* a new record, field for field as docs.js blank() */
  function blank(ty, kind, side) {
    var T = VT[ty], c = dset(ty), b = A().biz() || {}, k = kind && T.kinds.indexOf(kind) >= 0 ? kind : T.kinds.indexOf(c.kind) >= 0 ? c.kind : T.kinds[0];
    var seller = { name: '', addr: '', city: '', pin: '', state: '', gstin: '', phone: '', email: '', logo: '', sign: '', bankName: '', bankAcc: '', bankIfsc: '', bankBranch: '', upi: '' };
    seller = Object.assign(seller, JSON.parse(JSON.stringify(b))); delete seller.id; delete seller.created; delete seller.updated;
    var d = {
      type: ty === 'exp' ? 'expinv' : T.stk ? 'stk' : ty, kind: k, no: '', deliv: '', orig: { no: '', date: '' }, reason: k === 'debit' && side !== 'purchase' ? 'price' : 'ret', side: ty === 'note' ? (side === 'purchase' ? 'purchase' : 'sale') : undefined, tr: { veh: '', tname: '', lr: '' },
      paper: c.paper || T.paper || 'a4', design: c.design || 'classic', copies: 1, date: NS.today(), due: '', pos: '', rc: !!T.rcFixed, recv: '', ref: '',
      seller: seller, buyer: { name: '', addr: '', city: '', pin: '', state: '', gstin: '', phone: '' }, ship: null, einv: null, irn: null,
      items: [{ desc: '', hsn: '', qty: 1, unit: c.unit || 'Nos', rate: '', disc: '', gst: c.gst != null && c.gst !== '' ? +c.gst : 18 }],
      round: c.round !== false, comp: true, notes: c.notes || '', terms: c.terms || '', accent: c.accent || '#0B3B5B',
      status: T.status ? T.status[0] : T.paidFirst ? 'paid' : 'unpaid', copyLabel: T.copy || '', withGst: T.gstFlag ? !T.gstOff : undefined, valid: '',
      charges: [], tcs: { on: false, rate: '', base: 'total', sec: '' }, rec: null
    };
    if (ty === 'exp') { d.exp = { cur: 'USD', fx: '', country: '', port: '', sbNo: '', sbDate: '', lut: '', lutDate: '', refund: 'N' }; if (/^exp/.test(k)) d.pos = '96'; }
    NS.vtApply(d, vtc(d));   /* C-11 / C-14 */
    if (T.gstFlag && !NS.bizMode(A().biz(), A().cfg()).gst) d.withGst = false;   /* C-9: no GST for an unregistered / composition business */
    if (d.side === undefined) delete d.side;
    if (d.withGst === undefined) delete d.withGst;
    return d;
  }

  /* number series: the one engine (core.js NS.nextNo, ERP A-6): prefix per kind for quotation and notes, sub-types (d.vt, A-7) */
  function nxOpts(d, all) {
    var ty = vtOf(d), T = VT[ty], tag = ''; try { tag = localStorage.getItem('ns-sf-tag') || ''; } catch (e) {}
    return { type: ty, kind: T.prefixes ? sk(d) : '', sub: d.vt || '', seller: d.seller && d.seller.name || '', date: d.date, cfg: NS.cfgFor(A().cfg() || {}, d.seller || A().biz()), def: T.prefixes ? T.prefixes[sk(d)] : T.prefix, skip: d.id, tag: tag };
  }
  function nextNo(d, all) { return NS.nextNo(all || A().data().doc, nxOpts(d)).no; }
  function claimNo(d, all) {
    var x = NS.nextNo(all, nxOpts(d));
    if (x.manual) return Promise.resolve(d.no);
    if (x.suffix || x.series.restart !== 'year' || !NSStore.sfClaim) return Promise.resolve(x.no);
    return Promise.resolve(NSStore.sfClaim({ scope: key(d.seller && d.seller.name) + (d.vt ? '|' + d.vt : ''), prefix: x.head, digits: x.width, nos: x.nos })).then(function (c) { return c || x.no; }, function () { return x.no; });
  }
  /* the voucher type's own configuration (C-11): copies, paper, design, notes, print / share after saving */
  function vtc(d) { var T = VT[vtOf(d)] || {}; return NS.vtCfg(NS.cfgFor(A().cfg() || {}, d.seller || A().biz()), vtOf(d), T.prefixes ? sk(d) : '', d.vt); }
  function after(d) { var c = d ? vtc(d) : {}; return c.printAfter ? 'print' : c.shareAfter ? 'share' : ''; }

  /* a quotation, order or challan carried into the next document (docs.js fromQuote) */
  function convert(src, ty) {
    var d = blank(ty), q = JSON.parse(JSON.stringify(src)), s = VT[vtOf(q)] || {};
    d.seller = Object.assign(d.seller, q.seller); delete d.seller.id; delete d.seller.created; delete d.seller.updated;
    d.buyer = q.buyer || d.buyer; d.ship = q.ship || null; d.pos = q.pos || ''; d.items = q.items && q.items.length ? q.items : d.items; d.notes = q.notes || d.notes;
    d.round = q.round !== false; d.accent = q.accent || d.accent;
    if (VT[ty].gstFlag) d.withGst = q.withGst !== false;
    if (ty === 'challan') d.kind = 'sale';
    d.ref = q.type === 'so' || q.type === 'challan' ? (/^(Quotation|Estimate|Proforma|Sales Order|Delivery Challan)\b/.test(q.ref || '') ? '' : q.ref || '') : '';
    d.against = [q.against, (NAMES[s.purpose ? 'challan' : q.kind] || NAMES[q.type] ? (NAMES[s.purpose ? 'challan' : q.kind] || NAMES[q.type]) + ' ' : '') + q.no].filter(Boolean).join(', ');
    d.fromId = q.id;
    if (window.NSCF) NSCF.carryInto(q, d, d.type);   /* custom fields marked "copy" travel on (ERP Round 2, C-B2) */
    return d;
  }
  /* the same for a sale bill (billing ?from=): the App's own Sale bill screen opens with it */
  function toSale(src) {
    var q = JSON.parse(JSON.stringify(src)), s = VT[vtOf(q)] || {};
    var conv = { fromId: q.id, against: [q.against, (NAMES[s.purpose ? 'challan' : q.kind] || NAMES[q.type] || '') + ' ' + q.no].filter(Boolean).join(', ').trim(),
      ref: q.type === 'so' || q.type === 'challan' ? (/^(Quotation|Estimate|Proforma|Sales Order|Delivery Challan)\b/.test(q.ref || '') ? '' : q.ref || '') : '', ship: q.ship || null };
    if (q.tr && (q.tr.veh || q.tr.tname || q.tr.lr)) conv.einv = { sup: 'B2B', dist: '0', mode: '1', veh: q.tr.veh || '', vtype: 'R', tid: '', tname: q.tr.tname || '', tdoc: q.tr.lr || '', tdate: q.date || '', withEwb: false };
    var draft = { date: NS.today(), items: q.items && q.items.length ? q.items : [{ desc: '', hsn: '', qty: 1, rate: '', gst: 18 }], round: q.round !== false, buyer: q.buyer || { name: '' } };
    if (window.NSCF) NSCF.carryInto(q, draft, 'invoice', '');   /* custom fields marked "copy" (ERP Round 2, C-B2) */
    return { draft: draft, conv: conv };
  }
  /* after the next document is saved: the source says so (docs.js save2) */
  function markFrom(rec) {
    if (!rec || !rec.fromId) return Promise.resolve();
    return NSStore.get('doc', rec.fromId).then(function (q) {
      if (!q) return;
      if ((rec.type || 'invoice') === 'invoice') { if (q.status === 'inv') return; q.status = 'inv'; q.invNo = rec.no; } else { if (q.nextNo === rec.no) return; q.nextNo = rec.no; q.nextType = rec.type; }
      return NSStore.put('doc', q);
    }).catch(function () {});
  }

  /* ---------- the entry screen (app.js openForm('vdoc')) ---------- */
  function make(o, F) {
    var h = H(), T0 = A().T, d, ty;
    if (o.rec) { d = JSON.parse(JSON.stringify(o.rec)); ty = vtOf(d); }
    else if (o.from) { ty = o.ty; d = convert(o.from, ty); if (o.lines) d.items = o.lines; }   /* o.lines: lines picked from the source (orders.js) */
    else if (o.copy) { ty = vtOf(o.copy); d = JSON.parse(JSON.stringify(o.copy)); delete d.id; delete d.created; delete d.updated; delete d.fromId; delete d.nextNo; delete d.nextType; delete d.invNo; d.date = NS.today(); d.status = blank(ty).status; d.irn = null; d.einv = null; d.no = ''; d.seller = blank(ty).seller; delete d.closed; (d.items || []).forEach(function (it) { delete it.src; delete it.lid; }); }
    else { ty = o.ty; d = blank(ty, o.kind, o.side); }
    var T = VT[ty], auto = '';
    if (!o.rec) { d.no = auto = nextNo(d); }
    var V = { ty: ty, base: d, auto: auto, buy: buying(d), renum: '' };
    var fld = h.fld, inp = h.inp, sel = h.sel, opt = function (list, fn) { return list.map(function (k) { return [k, fn(k)]; }); };
    var party = d.buyer && d.buyer.name || '', buy = buying(d);
    var stOpts = [['', '—']].concat(NS.STATES.map(function (s) { return [s[0], s[0] + ' · ' + NS.stateLoc(s[0])]; }));
    var hx = '<div class="fg">';
    if (T.kinds.length > 1) hx += fld('f-kind', t(T.purpose ? 'l.purpose' : 'l.type'), sel('f-kind', d.kind, opt(T.kinds, function (k) { return t('k.' + k); })));
    if (ty === 'note') hx += fld('f-side', t('ns.l.side'), sel('f-side', d.side || 'sale', [['sale', t('ux.o.' + (d.kind === 'debit' ? 'debit' : 'credit') + '.s')], ['purchase', t('ux.o.' + (d.kind === 'debit' ? 'debit' : 'credit') + '.p')]]));
    hx += fld('f-party', T0(buy ? 'supp' : 'cust'), inp('f-party', party, { req: 1, list: 'dl-party' }) + h.partyList(buy ? 'supplier' : 'customer')) +
      (ty === 'self' ? '<input type="hidden" id="f-gstin" value="">' : fld('f-gstin', buy ? T0('gstin') : T0('qe_gstin'), inp('f-gstin', d.buyer && d.buyer.gstin || '', { ltr: 1 }))) +
      fld('f-state', buy ? T0('state') : T0('qe_state'), sel('f-state', d.buyer && d.buyer.state || (o.rec ? '' : (A().biz() || {}).state || ''), stOpts)) +
      fld('f-no', t('l.no', { Doc: docWord(ty, d.kind), doc: docWord(ty, d.kind) }), inp('f-no', d.no, { ltr: 1, req: 1 })) +
      fld('f-date', T0('date'), inp('f-date', d.date, { type: 'date', req: 1 }));
    if (T.due) hx += fld('f-due', t('l.due'), inp('f-due', d.due || '', { type: 'date' }));
    if (T.valid) hx += fld('f-valid', t('l.valid'), inp('f-valid', d.valid || '', { type: 'date' }));
    if (T.deliv) hx += fld('f-deliv', t('l.deliv'), inp('f-deliv', d.deliv || '', { type: 'date' }));
    if (T.recv) hx += fld('f-recv', t('l.recv'), inp('f-recv', d.recv || '', { type: 'date', req: 1 }));
    if (T.orig) {
      hx += fld('f-ono', t('l.ono'), inp('f-ono', (d.orig || {}).no || '', { ltr: 1, req: 1, list: 'dl-vorig' }) + '<datalist id="dl-vorig"></datalist>') +
        fld('f-odate', t('l.odate'), inp('f-odate', (d.orig || {}).date || '', { type: 'date', req: 1 })) +
        fld('f-reason', t('l.reason'), sel('f-reason', d.reason || 'ret', opt(reasons(d), function (k) { return t(rsKey(d, k)); })));
    }
    hx += fld('f-ref', t('l.' + T.refLbl), inp('f-ref', d.ref || ''));
    if (T.status || T.pay) hx += fld('f-status', t(T.pay ? 'l.pay' : 'l.qstat'), sel('f-status', d.status, T.pay ? [['unpaid', t('pay.unpaid')], ['paid', t('pay.paid')]] : opt(stList(d), function (k) { return t('qs.' + k); })));
    hx += '</div>';
    if (T.transport) hx += '<div class="fg">' + fld('f-veh', t('l.veh'), inp('f-veh', (d.tr || {}).veh || '', { ltr: 1 })) + fld('f-tname', t('l.tname'), inp('f-tname', (d.tr || {}).tname || '')) + fld('f-lr', t('l.lr'), inp('f-lr', (d.tr || {}).lr || '', { ltr: 1 })) + '</div>';
    hx += '<fieldset><legend>' + esc(T0('items')) + '</legend><div data-lines></div><button type="button" class="btn sm" data-addline>' + esc(T0('addline')) + '</button>' +
      '<input type="checkbox" id="f-nogst" hidden>' +   /* the grid's "no GST" box (new lines take GST 0 when ticked); here the document's own switch below */
      (T.gstFlag ? '<label class="chk"><input type="checkbox" id="f-vgst"' + (d.withGst !== false ? ' checked' : '') + '> ' + esc(t('l.withgst')) + '</label>' : '') +
      '<label class="chk"><input type="checkbox" id="f-round"' + (d.round !== false ? ' checked' : '') + '> ' + esc(T0('round')) + '</label><div class="sum" data-sum></div></fieldset>';
    hx += '<div class="fg">' + fld('f-vnotes', t('l.notes'), inp('f-vnotes', d.notes || ''), { wide: 1 }) + fld('f-narr', NS.t('bw.narr'), inp('f-narr', d.narr || ''), { wide: 1, hint: NS.t('bw.narrh') }) + '</div>';   /* A-26 (r2-billwise): narration for the books, apart from the printed notes */
    if (ty === 'exp') {
      var x = d.exp || {};
      hx += '<details class="more"' + (x.port || x.sbNo || x.lut ? ' open' : '') + '><summary>' + esc(t('lg.exp')) + '</summary><div class="fg">' +
        fld('f-xcur', t('x.cur'), sel('f-xcur', x.cur || 'USD', CUR.map(function (c) { return [c, c]; }))) + fld('f-xfx', t('x.fx'), inp('f-xfx', x.fx || '', { mode: 'decimal', ltr: 1 })) +
        fld('f-xcountry', t('x.country'), inp('f-xcountry', x.country || '', { ltr: 1 })) + fld('f-xport', t('x.port'), inp('f-xport', x.port || '', { ltr: 1 })) +
        fld('f-xsbno', t('x.sbno'), inp('f-xsbno', x.sbNo || '', { ltr: 1 })) + fld('f-xsbdate', t('x.sbdate'), inp('f-xsbdate', x.sbDate || '', { type: 'date' })) +
        fld('f-xlut', t('x.lut'), inp('f-xlut', x.lut || '', { ltr: 1 })) + fld('f-xlutdate', t('x.lutdate'), inp('f-xlutdate', x.lutDate || '', { type: 'date' })) +
        '<div class="f wide"><label class="chk"><input type="checkbox" id="f-xrefund"' + (x.refund === 'Y' ? ' checked' : '') + '> ' + esc(t('x.refund')) + '</label></div></div></details>';
    }
    V.html = hx;
    V.lines = JSON.parse(JSON.stringify(d.items && d.items.length ? d.items : blank(ty).items));
    V.title = docWord(ty, d.kind);
    V.wire = function (form) { wire(V, F, form); };
    V.build = function () { return build(V, F); };
    V.save = function (form) { return save(V, F, form); };
    if (o.from) setTimeout(function () { NS.toast(t('vd.conv', { doc: docWord(vtOf(o.from), o.from.kind), no: o.from.no || '' })); }, 50);
    return V;
  }
  /* the entry form is one element the App reuses: its listeners are added once and work on the screen open now */
  function wire(V, F, form) {
    if (!form._vd) { form._vd = 1; form.addEventListener('input', function (e) { var f = H().cur(); if (f && f.vd) onIn(f.vd, f, form, e); }); form.addEventListener('change', function (e) { var f = H().cur(); if (f && f.vd) onCh(f.vd, f, form, e); }); }
    origList(V, F, form);
    var nb = $('#f-no', form);
    if (!F.rec && !V.base.no) NS.noBox(nb, NS.seriesOf(nxOpts(V.base).cfg, V.ty, nxOpts(V.base).kind, V.base.vt, nxOpts(V.base)));
    NS.subPick(nb, { type: V.ty, cfg: function () { return nxOpts(V.base).cfg; }, get: function () { return V.base.vt || ''; }, saved: function () { return !!F.rec; },
      set: function (id) {
        if (id) V.base.vt = id; else delete V.base.vt;
        if (F.rec) return;
        var c = vtc(V.base), n = $('#f-vnotes', form); if (n && !n.value && c.notes) n.value = c.notes;
        if (nb.value === V.auto) nb.value = V.auto = nextNo(build(V, F));
      } });
  }
  function origList(V, F, form) {
    var g = function (id) { return $('#' + id, form); };
    {
      var dl = g('dl-vorig'); if (!dl) return;
      var p = key(g('f-party').value), side = g('f-side') ? g('f-side').value : 'sale';
      var L = A().mine().filter(function (x) { return (side === 'purchase' ? x.type === 'pbill' && x.kind !== 'return' : /^(invoice|cashmemo|expinv)$/.test(x.type || 'invoice')) && x.no && (!p || key(A().B.partyName(x)) === p); }).sort(A().byDate).slice(0, 300);
      dl.innerHTML = L.map(function (x) { return '<option value="' + esc(x.no) + '" label="' + esc(A().B.partyName(x) + ' · ' + NS.fmtDate(x.date)) + '">'; }).join('');
    }
  }
  function onIn(V, F, form, e) {
    var g = function (id) { return $('#' + id, form); };
    {
      var id = e.target.id || '';
      if (id === 'f-ono') { var x = A().mine().filter(function (y) { return key(y.no) === key(e.target.value) && (g('f-side') && g('f-side').value === 'purchase' ? y.type === 'pbill' : y.type !== 'pbill'); })[0]; if (x) { g('f-odate').value = x.date; if (!g('f-party').value.trim()) { g('f-party').value = A().B.partyName(x); g('f-gstin').value = x.buyer && x.buyer.gstin || ''; if (x.buyer && x.buyer.state) g('f-state').value = x.buyer.state; } } }
      if (id === 'f-party') origList(V, F, form);
    }
  }
  function onCh(V, F, form, e) {
    var g = function (id) { return $('#' + id, form); }, h = H();
    {
      var id = e.target.id || '';
      if (id === 'f-vgst' || id === 'f-kind' || id === 'f-side') {
        var d = build(V, F);
        if (id === 'f-kind' && V.ty === 'exp') { var wop = /wop$/.test(d.kind); F.lines.forEach(function (L) { if (wop) { if (+L.gst) L._g = L.gst; L.gst = 0; } else if (!+L.gst && L._g) { L.gst = L._g; } if (!wop) delete L._g; }); h.drawLines(); }
        if (id !== 'f-vgst' && (V.ty === 'note' || V.ty === 'quote')) {   /* the kind or side changes the number series, the reasons and the statuses */
          if (!F.rec && g('f-no').value === V.auto) g('f-no').value = V.auto = nextNo(d);
          var rs = g('f-reason'); if (rs) { var rv = rs.value; rs.innerHTML = reasons(d).map(function (k) { return '<option value="' + k + '"' + (k === rv ? ' selected' : '') + '>' + esc(t(rsKey(d, k))) + '</option>'; }).join(''); }
          var st = g('f-status'); if (st && V.ty === 'note') { var sv = st.selectedIndex; st.innerHTML = stList(d).map(function (k) { return '<option value="' + k + '">' + esc(t('qs.' + k)) + '</option>'; }).join(''); st.selectedIndex = Math.max(0, sv); }
          var lb = $('label[for="f-no"]', form); if (lb) lb.textContent = t('l.no', { Doc: docWord(V.ty, d.kind), doc: docWord(V.ty, d.kind) });
          var tt = $('[data-form-title]', form.closest('dialog') || document); if (tt) tt.textContent = docWord(V.ty, d.kind) + (F.rec && F.rec.no ? ' ' + F.rec.no : '');
          if (id === 'f-side') { var pl = $('label[for="f-party"]', form); if (pl) pl.textContent = A().T(buying(d) ? 'supp' : 'cust'); V.buy = buying(d); origList(V, F, form); }
        }
        h.drawSum();
      }
      if (id === 'f-date' && !F.rec && g('f-no').value === V.auto) g('f-no').value = V.auto = nextNo(build(V, F));   /* a new financial year: its own series */
      if (/^f-x/.test(id) || id === 'f-reason' || id === 'f-status') h.drawSum();
    }
  }
  /* the record from the screen: the saved record (or a new one) with only the screen's fields replaced */
  function build(V, F) {
    var form = H().form(), g = function (id) { return $('#' + id, form); }, v = function (id) { var e = g(id); return e ? String(e.value || '').trim() : ''; };
    var d = JSON.parse(JSON.stringify(V.base)), T = VT[V.ty], C = A().data();
    if (g('f-kind')) d.kind = g('f-kind').value;
    if (V.ty === 'note') d.side = g('f-side').value;
    var name = v('f-party'), was = key(V.base.buyer && V.base.buyer.name);
    if (key(name) !== was) {   /* another party: its saved details (address, phone, legal name) as the maker fills them */
      var p = C.party.filter(function (x) { return key(x.name) === key(name); })[0] || {};
      d.buyer = { name: name, addr: p.addr || '', city: p.city || '', pin: p.pin || '', state: p.state || '', gstin: p.gstin || '', phone: p.phone || '', legal: p.gst && p.gst.legal || '' };
      if (!d.buyer.legal) delete d.buyer.legal;
    } else d.buyer = Object.assign({}, d.buyer, { name: name });
    d.buyer.gstin = v('f-gstin').toUpperCase(); d.buyer.state = v('f-state');
    d.no = v('f-no'); d.date = v('f-date');
    if (T.due) d.due = v('f-due');
    if (T.valid) d.valid = v('f-valid');
    if (T.deliv) d.deliv = v('f-deliv');
    if (T.recv) d.recv = v('f-recv');
    if (T.orig) { d.orig = { no: v('f-ono'), date: v('f-odate') }; d.reason = v('f-reason'); }
    d.ref = v('f-ref');
    if (g('f-status')) d.status = v('f-status');
    if (T.transport) d.tr = { veh: v('f-veh').toUpperCase(), tname: v('f-tname'), lr: v('f-lr') };
    if (T.gstFlag) d.withGst = g('f-vgst').checked;
    d.round = g('f-round').checked;
    d.notes = g('f-vnotes').value;
    if (g('f-narr')) { var nr = g('f-narr').value.trim(); if (nr) d.narr = nr; else delete d.narr; }
    if (V.ty === 'exp') {
      d.exp = Object.assign({}, d.exp || {}, { cur: v('f-xcur'), fx: v('f-xfx'), country: v('f-xcountry').toUpperCase(), port: v('f-xport').toUpperCase(), sbNo: v('f-xsbno'), sbDate: v('f-xsbdate'), lut: v('f-xlut'), lutDate: v('f-xlutdate'), refund: g('f-xrefund').checked ? 'Y' : 'N' });
      if (/^exp/.test(d.kind)) d.pos = '96'; else if (d.pos === '96') d.pos = '';
    }
    var unit = dset(V.ty, d.seller).unit || 'Nos';
    d.items = F.lines.filter(function (L) { return String(L.desc || '').trim() || num(L.rate); }).map(function (L) {
      var it = { desc: String(L.desc || '').trim(), hsn: String(L.hsn || '').trim(), qty: L.qty === '' || L.qty == null ? 1 : num(L.qty), unit: L.unit || unit, rate: num(L.rate), disc: num(L.disc) || '', gst: num(L.gst) };
      return A().lineCopy ? A().lineCopy(L, it) : it;
    });
    var tt = A().B.itemTotals(Object.assign({}, d, { total: null, withGst: taxOn(d) ? d.withGst : false })), total = r2(tt.taxable + tt.cgst + tt.sgst + tt.igst + tt.tcs);
    d.total = d.round ? Math.round(total) : total;
    d.tax = { taxable: tt.taxable, cgst: tt.cgst, sgst: tt.sgst, igst: tt.igst };
    if (window.NSOrd && NSOrd.built) NSOrd.built(d, V.ty);   /* ERP round 2: line ids of orders, links of stock vouchers (orders.js) */
    return d;
  }
  /* the maker's checks (docs.js validate) that apply to what this screen shows */
  function problems(d) {
    var P = [], ty = vtOf(d), rows = d.items.length;
    if (!rows) P.push(['f-party', t('v.item')]);
    d.items.forEach(function (it, i) { if (it.desc && NS.badGst && NS.badGst(it.gst)) P.push(['f-party', t('v.badgst', { n: i + 1, v: it.gst })]); });
    if (String(d.no).length > 16) P.push(['f-no', t('v.len')]);
    if (/[^A-Za-z0-9\/\-]/.test(d.no)) P.push(['f-no', t('v.chars')]);
    if (ty === 'note' && (!d.orig.no || !d.orig.date)) P.push(['f-ono', t('v.orig')]);
    if (ty === 'self' && !d.seller.gstin) P.push(['f-party', t('v.sigst')]);
    if (ty === 'self' && !d.recv) P.push(['f-recv', t('v.recv')]);
    if (ty === 'self' && String(d.buyer.gstin || '').trim()) P.push(['f-party', t('v.sireg')]);
    if (ty === 'exp' && /wop$/.test(d.kind) && d.items.some(function (it) { return num(it.gst); })) P.push(['f-kind', t('v.lut0')]);
    if (ty === 'exp' && !d.seller.gstin) P.push(['f-kind', t('v.tax')]);
    return P;
  }
  function save(V, F, form) {
    var d = build(V, F), ty = V.ty, h = H(); delete d.tax;
    var P = problems(d); if (P.length) { NS.toast(P[0][1], 'bad'); var f = $('#' + P[0][0], form); if (f) f.focus(); return Promise.resolve(null); }
    var asks = [];
    if (ty === 'note' && d.orig.date && d.date < d.orig.date) asks.push(t('c.nbefore'));
    if (ty === 'cashmemo' && d.total >= 200000) asks.push(t('c.cash2l'));
    if (ty === 'self' && d.recv && (new Date(d.date) - new Date(d.recv)) / 864e5 > 30) asks.push(t('c.si30'));
    if (ty === 'note' && d.kind === 'credit' && !pur(d) && d.orig.date && d.date > (+NS.fy(d.orig.date).slice(0, 4) + 1) + '-11-30') asks.push(t('c.cn30'));
    var ask = function (m) { return NS.ask ? NS.ask(m) : Promise.resolve(confirm(m)); };
    return asks.reduce(function (p, m) { return p.then(function (ok) { return ok && ask(m); }); }, Promise.resolve(true)).then(function (ok) {
      if (!ok) return null;
      /* the number is checked against the saved documents NOW (another tab or person may have used it): a suggested one moves on, a typed one
         is refused for a cash memo, note or export invoice (Rule 46) and asked for the others, as the makers do */
      return NSStore.list('doc').then(function (all) {
        if (!F.rec && d.no && d.no === V.auto) return claimNo(d, all).then(function (no) { if (no !== d.no) { V.renum = NS.t('c.renum', { a: d.no, b: no }); d.no = no; $('#f-no', form).value = no; } return true; });
        var pb = NS.noProblem(all, Object.assign({}, d, { id: d.id || '_new' }), nxOpts(d));   /* one check for every type (A-6) */
        if (!pb) return true;
        if (pb.block) { NS.toast(pb.msg, 'bad'); $('#f-no', form).focus(); return false; }
        return ask(NS.t('c.dup', { no: d.no, doc: docWord(ty, d.kind), Doc: docWord(ty, d.kind) }));
      }).then(function (go) {
        if (!go) return null;
        var jobs = [h.savePartyRole(d.buyer.name, buying(d) ? 'supplier' : 'customer', { gstin: d.buyer.gstin, state: d.buyer.state })];
        d.items.forEach(function (it) {   /* the saved price list stays: a buying document notes the purchase rate; a note's rate is never a price (docs.js) */
          if (!it.desc) return;
          var hit = A().data().item.filter(function (x) { return key(x.desc) === key(it.desc); })[0], o = { desc: it.desc, hsn: it.hsn, unit: it.unit };
          if (!(NS.badGst && NS.badGst(it.gst))) o.gst = it.gst;
          if (ty === 'note') { if (hit) return; o.rate = ''; }
          else if (buying(d)) { o.prate = it.rate; if (!hit) o.rate = ''; }
          else if (!hit) o.rate = it.rate; else return;
          jobs.push(NSStore.put('item', Object.assign(hit || { kind: 'goods' }, o)));
        });
        if (F.rec) d.id = F.rec.id;
        return Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function (rec) { return markFrom(rec).then(function () { return rec; }); });
      });
    });
  }

  /* ---------- Print / PDF / Share: the maker's paper in a frame nobody sees ---------- */
  var outFr = null;
  function out(rec, how) {
    var id = typeof rec === 'string' ? rec : rec.id, d = typeof rec === 'string' ? A().data().doc.filter(function (x) { return x.id === id; })[0] : rec, site = d && siteOf(d);
    if (!site) return !!(d && window.NSOrd && NSOrd.print && NSOrd.print(d, how));   /* receipt note, goods back / sent back: printed by orders.js */
    if (outFr) outFr.remove();
    NS.toast(t(how === 'share' ? 'pdf.making' : 'vd.wait'));
    var fr = outFr = document.createElement('iframe');
    fr.className = 'vd-out'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.title = '';
    fr.style.cssText = 'position:fixed;left:-12000px;top:0;width:1100px;height:1500px;border:0;opacity:0;pointer-events:none';
    fr.src = '/do/' + site + '/?open=' + encodeURIComponent(id) + (how === 'print' ? '&print=1' : '');
    document.body.appendChild(fr);
    var gone = function () { setTimeout(function () { if (outFr === fr) outFr = null; fr.remove(); }, 1500); };
    var tries = 0;
    (function wait() {
      var w = null; try { w = fr.contentWindow; } catch (e) {}
      var o = w && w.NSDocOut;
      if (!(o && o.id() === id)) { if (++tries > 150) { NS.toast(t('vd.fail'), 'bad'); gone(); } else setTimeout(wait, 100); return; }
      if (how === 'print') { w.addEventListener('afterprint', gone); setTimeout(gone, 600000); return; }   /* the maker prints by itself (?print=1) */
      setTimeout(function () {
        w.NS.makePdf(o.nodes(), o.paper()).then(function (blob) { sharePdf(blob, o.file() + '.pdf', o.title(), o.text(), o.phone()); gone(); },
          function () { NS.toast(t('pdf.fail'), 'bad'); gone(); });
      }, 400);
    })();
    return true;
  }
  /* NS.sharePdf's last half, for a PDF made in the hidden frame: share it where the device can, else save the file */
  function sharePdf(blob, fname, title, text, phone) {
    fname = String(fname).replace(/[\\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 90);
    var file = new File([blob], fname, { type: 'application/pdf' });
    var saveIt = function () { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); NS.toast(t('pdf.saved', { file: fname })); if (NS.waBar) NS.waBar(fname, text, phone); };
    if (!(navigator.canShare && navigator.canShare({ files: [file] }))) { saveIt(); return; }
    var go = function () { return navigator.share({ files: [file], title: title, text: text }); };
    go().catch(function (e) {
      if (e && e.name === 'AbortError') return;
      /* the tap that asked for it is too long ago: one more tap shares it */
      var b = NS.el('button', { type: 'button', 'class': 'btn primary pdf-again' }, esc(t('pdf.tap')));
      b.addEventListener('click', function () { b.remove(); go().catch(function () { saveIt(); }); });
      document.body.appendChild(b); setTimeout(function () { b.remove(); }, 20000);
    });
  }

  /* ---------- the App's addresses of these documents ---------- */
  /* a: "<site>/<path>?<query>" (what app.js would show in a frame). true = handled here (an entry screen or a print) */
  function claim(a) {
    var site = a.split(/[\/?#]/)[0], rest = a.slice(site.length) || '/', path = rest.replace(/[?#].*$/, '') || '/';
    if (!SITE2[site] && site !== 'billing') return false;
    if (A().door && A().door()) return false;
    if (!/^\/([a-z]{2,3}\/)?$/.test(path)) return false;   /* a guide page of the site stays a page */
    var q = new URLSearchParams((rest.split('?')[1] || '').split('#')[0]);
    if (q.get('printall')) return false;   /* Print many vouchers: the maker prints them one after another */
    if (!A().biz()) return false;   /* no business yet: the maker asks for one */
    var open = q.get('open'), from = q.get('from'), copy = q.get('copy'), ty = SITE2[site];
    var find = function (id) { return A().data().doc.filter(function (x) { return x.id === id; })[0]; };
    if (open && q.get('print')) { A().whenReady(function () { out(open, 'print'); }); return true; }
    if (site === 'billing') {
      if (open) { var r0 = find(open); if (r0 && r0.app && !r0.counter) { A().whenReady(function () { A().openForm('sale', { rec: r0 }); }); return true; } return false; }   /* a bill made in the maker is changed there (its charges, TCS, ship-to) */
      if (copy) return false;
      if (from) { A().whenReady(function () { fresh(from).then(function (src) { if (!src) { NS.toast(t('conv.none'), 'bad'); return; } return againOk(src).then(function (ok) { if (ok) { var s = toSale(src); A().openForm('sale', { draft: s.draft, conv: s.conv }); } }); }); }); return true; }
      A().whenReady(function () { A().openForm('sale'); }); return true;
    }
    A().whenReady(function () {
      if (open) { fresh(open).then(function (r) { if (r && vtOf(r)) A().openForm('vdoc', { rec: r }); else NS.toast(t('conv.none'), 'bad'); }); return; }
      if (copy) { var c = find(copy); if (c && vtOf(c)) A().openForm('vdoc', { copy: c }); return; }
      if (from) { fresh(from).then(function (src) { if (!src) { NS.toast(t('conv.none'), 'bad'); return; } return againOk(src).then(function (ok) { if (ok) A().openForm('vdoc', { ty: ty, from: src }); }); }); return; }
      A().openForm('vdoc', { ty: ty, kind: site === 'debit-note' ? 'debit' : site === 'credit-note' ? 'credit' : '', side: q.get('side') || '' });
    });
    return true;
  }
  /* the source as saved now (the App's list may not have the "invoice made" mark of a moment ago yet) */
  function fresh(id) { return NSStore.get('doc', id).catch(function () { return null; }).then(function (r) { return r || A().data().doc.filter(function (x) { return x.id === id; })[0]; }); }
  function againOk(src) { return src.status === 'inv' && NS.ask ? NS.ask(t('c.inv2', { no: src.invNo || '' })) : Promise.resolve(true); }

  window.NSVDocs = { after: after, claim: claim, make: make, out: out, markFrom: markFrom, mine: function (d) { return !!vtOf(d); }, siteOf: siteOf, VT: VT };
})();
