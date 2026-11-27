/* NSBiz App: "Print designs" (#pd) and the design / paper choice in every bill's Print box and Preview. App only, English only.
   Reuses the design engine of the document makers (docs.js: classic, modern, compact, bold, elegant, bill book, minimal; paper A4, A5,
   thermal rolls): the screen draws the REAL paper for each design, from the maker's own NSDocOut.show(), filled with this business's own
   details, so what is chosen is exactly what prints. The choice is kept per business and per kind of document in the voucher type's own
   configuration (settings.vt[type] = { design, paper }, the same place Masters › Voucher types edits), and is used for NEW documents only:
   a saved document keeps the design it was made with. In the Print box and Preview a bill can use another design or paper for that
   one print without being changed.
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var A = window.NSApp, NS = window.NS;
  if (!A || !NS) return;
  var $ = NS.$, esc = NS.esc;
  var ACCENTS = ['#0B3B5B', '#1D4ED8', '#047857', '#B45309', '#9D174D', '#334155'];
  var PAPERS = NS.PAPER_ALL.map(function (k) { return [k, NS.ppName(k)]; });   /* every voucher and document maker prints on every size and on both rolls */
  /* kinds of document made by docs.js: [maker site, type, kind, name, key in settings.vt, number prefix, usual paper] */
  var DOCS = [
    ['billing', 'invoice', '', 'Tax invoice and bills', 'invoice', 'INV', 'a4'],
    ['cash-memo', 'cashmemo', '', 'Cash memo', 'cashmemo', 'CM', 'th80'],
    ['quotation', 'quote', 'quote', 'Quotation', 'quote.quote', 'QT', 'a4'],
    ['quotation', 'quote', 'estimate', 'Estimate', 'quote.estimate', 'EST', 'a4'],
    ['proforma', 'proforma', '', 'Proforma invoice', 'proforma', 'PI', 'a4'],
    ['sales-order', 'so', '', 'Sales order', 'so', 'SO', 'a4'],
    ['challan', 'challan', '', 'Delivery challan', 'challan', 'DC', 'a4'],
    ['purchase-order', 'po', '', 'Purchase order', 'po', 'PO', 'a4'],
    ['credit-note', 'note', 'credit', 'Credit note', 'note.credit', 'CN', 'a4'],
    ['debit-note', 'note', 'debit', 'Debit note', 'note.debit', 'DN', 'a4'],
    ['self-invoice', 'self', '', 'Self invoice', 'self', 'SI', 'a4'],
    ['receipt', 'receipt', '', 'Receipt voucher', 'receipt', 'RCT', 'a4', 'slip'],
    ['voucher', 'voucher', '', 'Payment voucher', 'voucher', 'PV', 'a4', 'slip'],
    ['rent-receipt', 'rent', '', 'Rent receipt', 'rent', 'RR', 'a4', 'slip'],
    ['', 'pbill', '', 'Purchase voucher', 'pbill', 'PV', 'a4', 'acct'],
    ['', 'contra', '', 'Contra voucher', 'contra', 'CV', 'a4', 'acct'],
    ['', 'jv', '', 'Journal voucher', 'jv', 'JV', 'a4', 'acct'],
    ['', 'exp', '', 'Expense voucher', 'exp', 'EXP', 'a4', 'acct'],
    ['salary-slip', 'salary', '', 'Salary slip', 'salary', 'SAL', 'a4', 'slip', ['a4', 'a5']],
    ['pos', 'pos', '', 'POS bill (counter)', 'pos', 'POS', 'th80', 'kit', ['th80', 'th58', 'a5', 'a4']],
    ['pharmacy', 'pharma', '', 'Pharmacy bill', 'pharma', 'PH', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['restaurant', 'resto', '', 'Restaurant bill', 'resto', 'RB', 'th80', 'kit', ['th80', 'th58', 'a5', 'a4']],
    ['bilty', 'lr', '', 'Bilty / LR (transport)', 'lr', 'LR', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['job-card', 'job', '', 'Job card (workshop)', 'job', 'JC', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['fee-receipt', 'fee', '', 'Fee receipt', 'fee', 'FR', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['contractor-bill', 'rabill', '', 'Contractor running bill', 'rabill', 'RA', 'a4', 'kit', ['a4', 'th80', 'th58']],
    ['hotel', 'hotel', '', 'Hotel bill', 'hotel', 'HT', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['rent', 'rentb', '', 'Rent bill (monthly)', 'rentb', 'RM', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['clinic', 'visit', '', 'Clinic visit slip', 'visit', 'OPD', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['salon', 'svc', '', 'Salon / service bill', 'svc', 'SV', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['jewellery', 'jewel', '', 'Jewellery bill', 'jewel', 'JW', 'a4', 'kit', ['a4', 'a5', 'th80', 'th58']],
    ['garment', 'garment', '', 'Garment bill', 'garment', 'GM', 'a4', 'kit', ['a4', 'a5', 'th80', 'th58']],
    ['garage', 'gjob', '', 'Garage job card', 'gjob', 'GJ', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['mandi', 'mandi', '', 'Mandi bill', 'mandi', 'MN', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['petrol', 'pump', '', 'Petrol pump shift report', 'pump', 'SR', 'a4', 'kit', ['a4', 'a5', 'th80', 'th58']],
    ['dairy', 'dairy', '', 'Dairy bill', 'dairy', 'DY', 'a4', 'kit', ['a4', 'a5', 'th80', 'th58']],
    ['subscribers', 'subs', '', 'Subscription bill', 'subs', 'SUB', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['tripsheet', 'tsh', '', 'Trip sheet', 'tsh', 'TS', 'a5', 'kit', ['a5', 'a4', 'th80', 'th58']],
    ['amc', 'amc', '', 'AMC contract', 'amc', 'AMC', 'a4', 'kit', ['a4', 'th80', 'th58']],
    ['petty-cash', 'petty', '', 'Petty cash book', 'petty', 'PCB', 'a4', 'slip', ['a4']]
  ];
  function rowOf(d) {
    var ty = d && (d.type || 'invoice'), k = d && d.kind || '';
    if (ty === 'note') k = (k === 'debit' || k === 'debitp') ? 'debit' : 'credit';
    return DOCS.filter(function (r) { return r[1] === ty && (r[2] === '' || r[2] === k); })[0] || null;
  }
  function siteOf(d) { return window.NSVDocs && NSVDocs.siteOf ? (NSVDocs.siteOf(d) || (NSVDocs.slipSite ? NSVDocs.slipSite(d) : '')) : ''; }
  function supports(d) { var r = d && rowOf(d); return !!(r && (r[7] === 'acct' || siteOf(d))); }
  /* the design a voucher without one of its own (purchase voucher, journal...) prints in */
  function designFor(d) { var r = rowOf(d); return r ? current(r).design : 'classic'; }
  /* the paper a voucher without one of its own (purchase voucher, journal...) prints on */
  function paperFor(d) { var r = rowOf(d); return r ? current(r).paper : 'a4'; }
  function names() { return NS.DESIGNS.map(function (k) { return [k, NS.t('ds.' + k)]; }); }
  function cfg() { return NS.cfgFor(A.cfg(), A.biz()); }
  /* the design and paper a NEW document of this kind gets now */
  function current(row) {
    var c = {}; try { c = NS.vtCfg(cfg(), row[1], row[2], null) || {}; } catch (e) {}
    var inv = (cfg().invoice || {});
    return { design: NS.DESIGNS.indexOf(c.design) >= 0 ? c.design : NS.DESIGNS.indexOf(inv.design) >= 0 ? inv.design : 'classic', paper: c.paper || row[6] };
  }
  /* the papers a kind of document can use (a salary slip has no thermal roll) */
  function papersOf(row) { return PAPERS; }
  function opts(list, cur) { return list.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === cur ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); }

  /* what is saved: one or more kinds of document get this design and paper (new documents only) */
  function save(rows, design, paper, accent) {
    var biz = A.biz(); if (!biz) { NS.toast('Add your business first', 'warn'); return Promise.resolve(); }
    return NS.cfgEdit(biz, function (V) {
      V.vt = V.vt || {};
      rows.forEach(function (r) { var c = V.vt[r[4]] = V.vt[r[4]] || {}; c.design = design; if (paper) c.paper = paper; });
      if (accent) { V.invoice = V.invoice || {}; V.invoice.accent = accent; }
    }, { why: 'print design' }).then(function (F) { Object.assign(A.cfg(), NS.cfgFor(F, biz.id)); });
  }

  /* ---------- the Print box and the Preview header (vtools.js) ---------- */
  function printBox(d) {
    var r = rowOf(d), cur = current(r), mine = d.design && NS.DESIGNS.indexOf(d.design) >= 0 ? d.design : cur.design, paper = d.paper || cur.paper;
    return '<fieldset class="vt-cpf vt-dz"><legend>Design on paper</legend><div class="vt-dzr">' +
      '<label>Design <select data-dz>' + opts(names(), mine) + '</select></label>' +
      '<label>Paper <select data-pz>' + opts(PAPERS, paper) + '</select></label>' +
      (r[7] === 'acct' ? '' : '<button type="button" class="btn sm" data-dzv data-ic="eye">Preview</button>') + '</div>' +
      '<label class="vt-cpl"><input type="checkbox" data-dzd> <span>Use this design and paper for my new <b>' + esc(r[3].toLowerCase()) + '</b> from now on</span></label>' +
      '<p class="soft vt-cpn">This bill is not changed. The choice is for this print only, unless you tick the box. Change more in Utilities › Print designs.</p></fieldset>';
  }
  /* reads the box: the design / paper for this one print (A._printOv), and the new default when ticked. peek = only read */
  function readBox(dlg, d, peek) {
    var dz = $('[data-dz]', dlg), pz = $('[data-pz]', dlg), o = { design: dz ? dz.value : '', paper: pz ? pz.value : '' };
    if (peek) return o;
    var own = { design: d.design || current(rowOf(d)).design, paper: d.paper || current(rowOf(d)).paper };
    A._printOv = (o.design !== own.design || o.paper !== own.paper) ? { design: o.design !== own.design ? o.design : '', paper: o.paper !== own.paper ? o.paper : '' } : null;
    var rem = $('[data-dzd]', dlg);
    if (rem && rem.checked) save([rowOf(d)], o.design, o.paper).then(function () { NS.toast('Saved: new ' + rowOf(d)[3].toLowerCase() + ' will use this design.'); });
    return o;
  }
  function pickers(d, cur) {
    return '<label class="vt-pvl">Design <select data-dz>' + opts(names(), cur.design) + '</select></label><label class="vt-pvl">Paper <select data-pz>' + opts(PAPERS, cur.paper) + '</select></label>';
  }

  /* ---------- the screen ---------- */
  var S = null;   /* { row, design, paper, accent, fr } */
  var KEEP = null;   /* what was chosen, kept when saving redraws the screen: { i, design, paper, accent, msg } */
  function html() {
    var biz = A.biz();
    if (!biz) return '<div class="pane-hd"><h2>Print designs</h2></div><p class="soft">Add your business first (Settings and saved data › My businesses). The designs are drawn with your own name, address and bank details.</p>';
    return '<div class="pane-hd"><h2>Print designs</h2></div>' +
      '<p class="soft">Choose how your bills and documents look on paper. Every design below is drawn from your own business details, so you see what will print. The choice is for <b>new</b> documents: a document you already made keeps its design, and you can still pick another design in the Print box of any bill.</p>' +
      '<div class="card pd-ctl"><div class="fg">' +
      '<div class="f"><label for="pd-type">Kind of document</label><select id="pd-type">' + DOCS.map(function (r, i) { return r[7] === 'acct' ? '' : '<option value="' + i + '">' + esc(r[3]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="pd-paper">Paper size</label><select id="pd-paper">' + opts(PAPERS, 'a4') + '</select></div>' +
      '<div class="f"><span class="lbl" id="pd-acl">Colour of the headings</span><div class="pd-acc" role="radiogroup" aria-labelledby="pd-acl">' +
        ACCENTS.map(function (c) { return '<button type="button" role="radio" class="pd-ac" data-pdac="' + c + '" style="background:' + c + '" aria-label="Colour ' + c + '" aria-checked="false"></button>'; }).join('') + '</div></div>' +
      '</div><div class="btns pd-btns"><button type="button" class="btn primary" data-pdsave data-ic="save"><span data-pdlbl>Use for new documents</span></button>' +
      '<button type="button" class="btn" data-pdall>Use for every kind of document</button></div>' +
      '<p class="soft pd-st" data-pdst role="status"></p></div>' +
      '<div class="pd-stage"><p class="soft" data-pdwait>Getting the designs ready…</p></div>';
  }
  function sample(row) {
    var biz = JSON.parse(JSON.stringify(A.biz() || {})); ['id', 'created', 'updated'].forEach(function (k) { delete biz[k]; });
    var P = (A.data().party || []).filter(function (p) { return p && p.name && p.role !== 'supplier'; })[0];
    var buyer = P ? { name: P.name, addr: P.addr || '', city: P.city || '', pin: P.pin || '', state: P.state || biz.state || '', gstin: P.gstin || '', phone: P.phone || '' } :
      { name: 'Sample Customer', addr: '12 Market Road', city: biz.city || '', pin: biz.pin || '', state: biz.state || '', gstin: '', phone: '' };
    var d = { kind: row[2] || undefined, seller: biz, buyer: buyer, no: row[5] + '/' + NS.fy(NS.today()) + '/001', date: NS.today(), design: S.design, paper: S.paper, accent: S.accent,
      items: [{ desc: 'Sample item A', hsn: '7326', qty: 2, unit: 'Nos', rate: 1250, disc: '', gst: 18 }, { desc: 'Sample item B', hsn: '8708', qty: 5, unit: 'Nos', rate: 340, disc: '', gst: 18 }, { desc: 'Service charge', hsn: '9987', qty: 1, unit: 'Nos', rate: 500, disc: '', gst: 18 }] };
    if (row[2] === undefined || row[2] === '') delete d.kind;
    if (row[1] === 'receipt') Object.assign(d, { amount: '12500', mode: 'upi', ref: 'Sample reference', against: 'Invoice INV/' + NS.fy(NS.today()) + '/001' });
    if (row[1] === 'voucher') Object.assign(d, { lines: [{ desc: 'Office expenses', head: 'office', amt: '4500' }, { desc: 'Courier charges', head: 'misc', amt: '800' }], mode: 'cash' });
    if (row[1] === 'salary') Object.assign(d, { buyer: { name: 'Sample Employee', addr: '', city: '', pin: '', state: biz.state || '', gstin: '', phone: '' }, month: NS.today().slice(0, 7), days: '30', paid: '30', regime: 'new',
      emp: { code: 'E-101', desig: 'Accountant', dept: 'Accounts', doj: '', pan: 'ABCDE1234F', uan: '', esi: '', bankName: 'Sample Bank', bankAcc: '000111222333', bankIfsc: 'SBIN0000001' },
      earn: [{ desc: 'Basic salary', amt: '15000' }, { desc: 'House rent allowance (HRA)', amt: '6000' }, { desc: 'Conveyance allowance', amt: '1600' }, { desc: 'Special allowance', amt: '2400' }],
      ded: [{ desc: 'Provident fund (PF)', amt: '1800' }, { desc: 'ESI', amt: '' }, { desc: 'Professional tax', amt: '200' }, { desc: 'TDS (income tax)', amt: '' }] });
    if (row[1] === 'pos') Object.assign(d, { type: 'invoice', counter: 1, pos: 'Counter 1', kind: 'tax', incl: true, round: true, status: 'paid', payMode: 'cash', tender: '500', time: '11:30',
      items: [{ desc: 'Sample item A', code: '', hsn: '7326', qty: 2, unit: 'Nos', price: '118', rate: '100', disc: '', gst: 18 }, { desc: 'Sample item B', code: '', hsn: '8708', qty: 1, unit: 'Nos', price: '236', rate: '200', disc: '', gst: 18 }] });
    /* the shop and trade makers fill what they need from their own blank(); these are the common boxes */
    if (row[7] === 'kit' && row[1] !== 'pos') Object.assign(d, { kind: 'plain', round: true, status: 'paid', payMode: 'cash',
      items: [{ desc: 'Sample item A', code: '', hsn: '7326', qty: 2, unit: 'Nos', price: '1250', rate: '1250', disc: '', gst: 0, amt: '2500' }, { desc: 'Sample item B', code: '', hsn: '8708', qty: 1, unit: 'Nos', price: '340', rate: '340', disc: '', gst: 0, amt: '340' }] });
    if (row[1] === 'jewel') d.items = [{ desc: 'Gold chain', metal: 'g', purity: '916', huid: 'AB12CD', gross: '10', stoneWt: '0', wast: '0', mrate: '6200', mkt: 'pg', mk: '300', stoneVal: '', ld: '', pcs: 1, gst: 3, hsn: '7113' }, { desc: 'Gold ring', metal: 'g', purity: '916', huid: '', gross: '4.5', stoneWt: '0', wast: '0', mrate: '6200', mkt: 'pg', mk: '300', stoneVal: '', ld: '', pcs: 1, gst: 3, hsn: '7113' }];
    if (row[1] === 'petty') Object.assign(d, { from: NS.today().slice(0, 8) + '01', to: NS.today(), opening: '5000', cashier: 'Sample cashier', appr: 'Sample approver',
      lines: [{ date: NS.today(), vno: '1', desc: 'Tea and snacks', head: 'office', recd: '', paid: '250' }, { date: NS.today(), vno: '2', desc: 'Cash from owner', head: '', recd: '2000', paid: '' }] });
    if (row[1] === 'rent') Object.assign(d, { rent: '15000', prop: 'Shop 12, main market', from: NS.today().slice(0, 7), to: NS.today().slice(0, 7), mode: 'bank' });
    return d;
  }
  function wire(pane) {
    var box = $('.pd-stage', pane); if (!box) return;
    var typ = $('#pd-type', pane), pap = $('#pd-paper', pane), st = $('[data-pdst]', pane);
    var inv = (cfg().invoice || {});
    S = { row: DOCS[0], design: 'classic', paper: 'a4', accent: inv.accent || ACCENTS[0], fr: null };
    function keep(msg) { KEEP = { i: DOCS.indexOf(S.row), design: S.design, paper: S.paper, accent: S.accent, msg: msg != null ? msg : (KEEP && KEEP.msg) || '' }; }
    function setRow(i, k) { S.row = DOCS[i]; var c = current(S.row); S.design = k ? k.design : c.design; S.paper = k ? k.paper : c.paper; if (k) S.accent = k.accent; typ.value = String(i); pap.innerHTML = opts(papersOf(S.row), S.paper); pap.value = S.paper; $('[data-pdlbl]', pane).textContent = 'Use for new ' + S.row[3].toLowerCase(); mark(); keep(k ? k.msg : ''); st.textContent = KEEP.msg; build(); }
    function mark() { [].slice.call(pane.querySelectorAll('[data-pdac]')).forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-pdac') === S.accent)); b.classList.toggle('on', b.getAttribute('data-pdac') === S.accent); }); }
    typ.addEventListener('change', function () { setRow(+typ.value); });
    pap.addEventListener('change', function () { S.paper = pap.value; keep(''); draw(); });
    pane.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-pdac]'); if (a) { S.accent = a.getAttribute('data-pdac'); keep(''); mark(); draw(); return; }
      if (e.target.closest('[data-pdsave]')) save([S.row], S.design, S.paper, S.accent).then(function () { var m = 'Saved. New ' + S.row[3].toLowerCase() + ' will use the ' + NS.t('ds.' + S.design) + ' design on ' + (PAPERS.filter(function (p) { return p[0] === S.paper; })[0] || [])[1] + '.'; keep(m); st.textContent = m; NS.toast('Saved'); });
      if (e.target.closest('[data-pdall]')) save(DOCS, S.design, null, S.accent).then(function () { var m = 'Saved. Every kind of document will use the ' + NS.t('ds.' + S.design) + ' design (each keeps its own paper size).'; keep(m); st.textContent = m; NS.toast('Saved'); });
    });
    var tries = 0, wrap = null;
    function build() {
      if (S.fr) S.fr.remove();
      var fr = S.fr = document.createElement('iframe'); fr.title = 'Designs'; fr.className = 'pd-fr'; fr.src = '/do/' + S.row[0] + '/?pv=1'; fr.style.visibility = 'hidden';
      box.appendChild(fr); var w0 = $('[data-pdwait]', pane); if (w0) { w0.hidden = false; w0.textContent = 'Getting the designs ready…'; }
      tries = 0; (function on() {
        var ok = false; try { var w = fr.contentWindow; ok = !!(w && w.NSDocOut && w.NSDocOut.show); } catch (e) {}
        if (!ok) { if (++tries < 150 && fr.isConnected) setTimeout(on, 100); else if (fr.isConnected && w0) w0.textContent = 'The designs could not be drawn here. Open a bill and use its Print box instead.'; return; }
        draw(); if (!S.failed) { fr.style.visibility = ''; if (w0) w0.hidden = true; }
      })();
    }
    function draw() {
      var fr = S.fr, w = null; try { w = fr && fr.contentWindow; if (!w || !w.NSDocOut || !w.NSDocOut.show) return; } catch (e) { return; }
      var doc = w.document, base = sample(S.row), cards = [], main; S.failed = false;
      try {   /* a maker that cannot draw this made-up document must not break the screen */
        NS.DESIGNS.forEach(function (k) { var d = Object.assign({}, base, { design: k }); cards.push({ k: k, nodes: w.NSDocOut.show(d).map(function (n) { return n.cloneNode(true); }) }); });
        main = w.NSDocOut.show(Object.assign({}, base, { design: S.design })).map(function (n) { return n.cloneNode(true); });
      } catch (er) { var w1 = $('[data-pdwait]', pane); if (w1) { w1.hidden = false; w1.textContent = 'This kind of document could not be drawn here. Open one and use its Print box instead.'; } S.failed = true; if (S.fr) S.fr.style.visibility = 'hidden'; return; }
      if (wrap) wrap.remove();
      wrap = doc.createElement('div'); wrap.className = 'pd-wrap';
      var strip = doc.createElement('div'); strip.className = 'pd-strip'; strip.setAttribute('role', 'radiogroup'); strip.setAttribute('aria-label', 'Designs');
      cards.forEach(function (c) {
        var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(c.k === S.design)); b.className = 'pd-th' + (c.k === S.design ? ' on' : ''); b.setAttribute('data-k', c.k);
        var sc = doc.createElement('span'); sc.className = 'pd-sc'; var inner = doc.createElement('span'); inner.className = 'pd-in'; inner.appendChild(c.nodes[0]); sc.appendChild(inner); b.appendChild(sc);
        var nm = doc.createElement('b'); nm.textContent = NS.t('ds.' + c.k); b.appendChild(nm);
        b.addEventListener('click', function () { S.design = c.k; keep(''); st.textContent = ''; draw(); });
        strip.appendChild(b);
      });
      var big = doc.createElement('div'); big.className = 'pd-big'; var bin = doc.createElement('div'); bin.className = 'pd-bin'; main.forEach(function (n) { bin.appendChild(n); }); big.appendChild(bin);
      wrap.appendChild(strip); wrap.appendChild(big); doc.body.appendChild(wrap);
      if (!doc.getElementById('pd-st')) { var s = doc.createElement('style'); s.id = 'pd-st'; s.textContent = frameCss(); doc.head.appendChild(s); }
      /* scale the real paper into its box */
      [].slice.call(doc.querySelectorAll('.pd-sc')).forEach(function (sc) { fit(sc, 112, 158); });
      fit(big, Math.min(640, Math.max(260, fr.clientWidth - 40)), 0, bin);
    }
    function fit(box, wide, tall, inner) {
      var el = inner || box.firstChild, sh = el.querySelector('.sh') || el, wd = sh.offsetWidth || 794, hd = sh.offsetHeight || 1123, k = wide / wd;
      el.style.zoom = k; el.style.width = wd + 'px';   /* zoom, not transform: the real paper keeps its own layout and the box takes the scaled size */
      box.style.width = wide + 'px'; box.style.height = (tall ? Math.min(tall, hd * k) : hd * k) + 'px'; box.style.overflow = 'hidden'; box.style.position = 'relative';
    }
    mark(); setRow(KEEP ? KEEP.i : 0, KEEP);
  }
  /* the designs frame takes the colours of the pack in use, so a dark pack does not get a light strip */
  function frameCss() {
    var cs = getComputedStyle(document.documentElement), v = function (k, d) { return (cs.getPropertyValue(k) || '').trim() || d; };
    var bg = v('--surface2', '#eef1f5'), sf = v('--surface', '#fff'), ink = v('--ink', '#0f1b2a'), ln = v('--line', '#cbd5e1'), ac = v('--accent', '#0b5f8f');
    return 'body>*:not(.pd-wrap){display:none!important}body{background:' + bg + '!important;margin:0;padding:12px;font-family:system-ui,sans-serif}' +
      '.pd-wrap{display:grid;gap:14px}.pd-strip{display:flex;flex-wrap:wrap;gap:8px;padding:4px 2px 8px}' +
      '.pd-th{flex:none;background:' + sf + ';border:2px solid ' + ln + ';border-radius:10px;padding:8px;cursor:pointer;display:grid;gap:6px;justify-items:center;font:inherit;color:' + ink + '}' +
      '.pd-th.on{border-color:' + ac + ';box-shadow:0 0 0 2px ' + ac + '}.pd-th b{font-size:13px}.pd-th .sh{box-shadow:none!important;margin:0!important;pointer-events:none}' +
      '.pd-big{background:#fff;border:1px solid ' + ln + ';border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.15);margin:0 auto}.pd-big .sh{margin:0!important;box-shadow:none!important}';
  }
  A.addSection('pd', html, wire);
  window.NSPrintDesign = { siteOf: siteOf, designFor: designFor, paperFor: paperFor, supports: supports, printBox: printBox, readBox: readBox, pickers: pickers, save: save, rows: DOCS };
})();
