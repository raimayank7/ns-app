/* rent.niveshsahayak.in: rent management for landlords: units (shops, flats, rooms), tenants and agreements with end dates, monthly rent bills and receipts,
   a board of rent still to bill or collect, and the GST note (forward charge, reverse charge, none). Record type 'rentb' (logic in rentcore.js).
   Units are item masters with runit:1. A bill counts as a sale in NSBiz once it is printed as a bill (print 'bill'). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, R = NSRent;
  var K, ITEMS = [], UNITS = [], DOCS = [], TENS = [], NEXT = null;
  function xrow() { return { desc: '', qty: 1, rate: '', gst: '' }; }
  function mine(b) { return String(b.seller && b.seller.name || '').trim().toLowerCase() === String(K.doc().seller.name || '').trim().toLowerCase(); }
  function intra(d) { var ps = d.pstate || d.seller.state; return !ps || !d.seller.state || ps === d.seller.state; }
  function sums(d) { return R.sums(d, intra(d)); }
  function taxOn(d) { return d.gstMode === 'fwd'; }
  function tname(d) { return d.buyer && d.buyer.name || ''; }
  function where(d) { return [d.prop, d.unit].filter(Boolean).join(' – '); }
  function mrange(d) { return R.label(d.mFrom) + ((d.mTo || d.mFrom) !== d.mFrom ? ' – ' + R.label(d.mTo) : ''); }

  function loadAll() {
    return Promise.all([NSStore.list('item'), NSStore.list('doc')]).then(function (r) {
      ITEMS = NS.forBiz(r[0], K.doc().seller); UNITS = R.unitsOf(ITEMS);
      DOCS = r[1].filter(function (x) { return x.type === 'rentb' && mine(x); });
      TENS = R.tenancies(DOCS, NS.today());
      var dl = $('#dl-units'); if (dl) dl.innerHTML = unitOpts();
    }, function () {});
  }
  function unitOpts() { return UNITS.map(function (u) { return '<option value="' + esc(R.unitName(u.prop, u.unit)) + '">'; }).join(''); }

  /* ---------- dialog shared by the board and the units ---------- */
  function dlg(title, html) {
    var x = $('#rq-dlg'); $('h2', x).textContent = title; $('[data-body]', x).innerHTML = html;
    if (!x.open) { x.showModal ? x.showModal() : x.setAttribute('open', ''); }
  }
  function download(text, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.href = u; a.download = name + ' ' + NS.today() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  function remindText(tn) {
    var l = tn.last, ms = tn.dueMonths.map(R.label), up = tn.unpaid.map(function (b) { return b.no; });
    return 'Dear ' + tn.tenant + ', ' + (ms.length ? 'rent for ' + ms.join(', ') + ' of ' + where(l) + ' is due' + (tn.owed ? ' (about ' + NS.money(tn.owed) + ')' : '') + '.' : '') + (up.length ? ' Bill' + (up.length > 1 ? 's' : '') + ' ' + up.join(', ') + ' (' + NS.money(tn.unpaidAmt) + ') ' + (up.length > 1 ? 'are' : 'is') + ' still unpaid.' : '') + ' Kindly pay at the earliest. ' + (l.seller && l.seller.name || '');
  }
  function dueText(ms) { return ms.length > 3 ? R.label(ms[0]) + ' – ' + R.label(ms[ms.length - 1]) + ' (' + ms.length + ')' : ms.map(R.label).join(', '); }
  function endText(tn) { return tn.left ? t('rq.left') : tn.ended ? t('rq.ended') : tn.endDays === null ? '' : tn.endDays === 0 ? t('rq.endtoday') : t('rq.endin', { n: tn.endDays }); }

  function boardDialog() {
    loadAll().then(function () {
      var s = R.summary(TENS, UNITS), live = TENS.filter(function (x) { return !x.ended || x.unpaid.length; });
      var head = '<p class="ht-sum"><b>' + esc(t('rq.sum', { a: s.active, o: NS.money(s.owed), u: NS.money(s.unpaid) })) + '</b>' + (UNITS.length ? ' · ' + esc(t('rq.vacant', { n: s.vacant })) : '') + (s.expiring ? ' · <span class="warn">' + esc(t('rq.expn', { n: s.expiring })) + '</span>' : '') + '</p>';
      var rows = live.map(function (tn) {
        var late = tn.dueMonths.length || tn.unpaid.length, ph = String(tn.last.buyer && tn.last.buyer.phone || '').replace(/\D/g, '').slice(-10);
        return '<tr' + (late || tn.expiring ? ' class="warn"' : '') + '><td><b>' + esc(tn.tenant) + '</b><br><small>' + esc(where(tn.last)) + '</small></td><td>' + NS.money(tn.rentNow + tn.maint) + '</td><td>' + esc(R.label(tn.billedTo) || '—') + '</td><td>' + (tn.dueMonths.length ? esc(dueText(tn.dueMonths)) : '—') + '</td><td>' + (tn.unpaidAmt ? NS.money(tn.unpaidAmt) : '—') + '</td><td>' + esc(endText(tn)) + '</td>' +
          '<td class="rq-acts">' + (tn.ended ? '' : '<button type="button" class="btn sm" data-rq="make" data-k="' + esc(tn.key) + '">' + esc(t('rq.make')) + '</button> ') + '<button type="button" class="btn sm" data-rq="open" data-k="' + esc(tn.key) + '">' + esc(t('h.open')) + '</button>' +
          (late ? ' <a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(remindText(tn)) + '">' + esc(t('rq.remind')) + '</a>' : '') + '</td></tr>';
      }).join('');
      dlg(t('rq.board'), head + (live.length ? '<div class="ht-wrap"><table class="day rq-board"><thead><tr><th>' + esc(t('rq.tenant')) + '</th><th>' + esc(t('rq.rentm')) + '</th><th>' + esc(t('rq.billedto')) + '</th><th>' + esc(t('rq.notbilled')) + '</th><th>' + esc(t('rq.unpaid')) + '</th><th>' + esc(t('rq.agr')) + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">' + esc(t('rq.boardh')) + '</p>' : '<p>' + esc(t('rq.none')) + '</p>') +
        '<div class="row"><button type="button" class="btn" data-rq="csvt">' + esc(t('rq.csv.t')) + '</button> <button type="button" class="btn" data-rq="csvb">' + esc(t('rq.csv.b')) + '</button></div>');
    });
  }
  function boardClick(b) {
    var a = b.getAttribute('data-rq'), k = b.getAttribute('data-k'), tn = TENS.filter(function (x) { return x.key === k; })[0];
    if (a === 'csvt') download(R.csv(R.tenancyRows(TENS)), 'Tenancies'); else if (a === 'csvb') download(R.csv(R.billRows(DOCS)), 'Rent bills');
    else if (a === 'open' && tn) { var recs = tn.recs.slice().sort(function (x, y) { return String(y.date || '').localeCompare(String(x.date || '')) || (y.updated || 0) - (x.updated || 0); }); $('#rq-dlg').close(); K.openDoc(recs[0], false); }
    else if (a === 'make' && tn) { NEXT = { from: tn.nextMonth }; $('#rq-dlg').close(); K.openDoc(tn.last, true); }
  }

  function unitsDialog() {
    loadAll().then(function () {
      var occ = R.occupancy(UNITS, TENS);
      var rows = occ.length ? '<table class="day"><thead><tr><th>' + esc(t('rq.property')) + '</th><th>' + esc(t('rq.unit')) + '</th><th>' + esc(t('rq.rentm')) + '</th><th>' + esc(t('rq.tenant')) + '</th><th></th></tr></thead><tbody>' + occ.map(function (o) {
        var u = o.unit; return '<tr><td>' + esc(u.prop || '') + '</td><td>' + esc(u.unit) + '</td><td>' + (num(u.rate || u.price) ? NS.money(num(u.rate || u.price)) : '') + '</td><td>' + (o.tenancy ? esc(o.tenancy.tenant) : '<i>' + esc(t('rq.vacantl')) + '</i>') + '</td><td><button type="button" class="btn sm" data-um="edit" data-id="' + u.id + '">' + esc(t('ht.edit')) + '</button> <button type="button" class="btn sm danger" data-um="del" data-id="' + u.id + '">' + esc(t('h.del')) + '</button></td></tr>';
      }).join('') + '</tbody></table>' : '<p>' + esc(t('rq.nounits')) + '</p>';
      var f = function (id, lbl, mode) { return '<div class="f"><label for="' + id + '">' + esc(lbl) + '</label><input id="' + id + '" dir="auto"' + (mode ? ' inputmode="' + mode + '"' : '') + '></div>'; };
      dlg(t('rq.units'), rows + '<fieldset class="card"><legend id="rq-ul">' + esc(t('rq.addunit')) + '</legend><div class="fg">' + f('rq-up', t('rq.property')) + f('rq-un', t('rq.unit')) + f('rq-ur', t('rq.rentm'), 'decimal') + f('rq-um', t('rq.maint'), 'decimal') +
        '<div class="f"><label for="rq-uu">' + esc(t('rq.use')) + '</label><select id="rq-uu"><option value="com">' + esc(t('rq.com')) + '</option><option value="res">' + esc(t('rq.res')) + '</option></select></div></div>' +
        '<div class="row"><button type="button" class="btn primary" data-um="save">' + esc(t('b.save')) + '</button> <button type="button" class="btn" data-um="clear">' + esc(t('ht.clear')) + '</button></div></fieldset>');
    });
  }
  var editUnit = null;
  function unitClick(b) {
    var a = b.getAttribute('data-um'), id = b.getAttribute('data-id'), u = UNITS.filter(function (x) { return x.id === id; })[0];
    if (a === 'edit' && u) { editUnit = id; $('#rq-up').value = u.prop || ''; $('#rq-un').value = u.unit; $('#rq-ur').value = u.rate || u.price || ''; $('#rq-um').value = u.maint || ''; $('#rq-uu').value = u.use === 'res' ? 'res' : 'com'; $('#rq-ul').textContent = t('rq.editunit'); $('#rq-un').focus(); }
    else if (a === 'clear') { editUnit = null; unitsDialog(); }
    else if (a === 'del' && u) { if (NS.okSync(t('rq.delunit', { n: R.unitName(u.prop, u.unit) }))) NSStore.del('item', id).then(function () { unitsDialog(); }, function (e) { NS.toast(e.message, 'bad'); }); }
    else if (a === 'save') {
      var c = R.cleanUnit({ prop: $('#rq-up').value, unit: $('#rq-un').value, rent: $('#rq-ur').value, maint: $('#rq-um').value, use: $('#rq-uu').value });
      if (!c) { NS.toast(t('rq.v.unit'), 'bad'); return; }
      if (R.clash(UNITS, c, editUnit)) { NS.toast(t('rq.v.dup', { n: R.unitName(c.prop, c.unit) }), 'bad'); return; }
      var rec = R.toRecord(c, ITEMS, editUnit); if (!rec.id && K.doc().seller && K.doc().seller.id) rec.biz = K.doc().seller.id;
      NSStore.put('item', rec).then(function () { editUnit = null; NS.toast(t('rq.saved')); unitsDialog(); }, function (e) { NS.toast(e.message, 'bad'); });
    }
  }
  function waText(d, o) {
    var who = tname(d), what = where(d);
    return d.paid === 'paid' ? 'Dear ' + who + ', received ' + NS.money(o.total) + ' as rent of ' + what + ' for ' + mrange(d) + '. Thank you. ' + (d.seller.name || '')
      : 'Dear ' + who + ', rent bill ' + d.no + ' of ' + NS.money(o.total) + ' for ' + what + ' (' + mrange(d) + ') is due.' + (d.seller.upi ? ' Pay by UPI: ' + d.seller.upi + '.' : '') + ' ' + (d.seller.name || '');
  }
  var GSTNOTE = { fwd: 'Tax invoice: GST is charged on this supply of renting of immovable property.', rcm: 'Tax on this supply is payable by the recipient under reverse charge, so none is charged on this bill.', none: '' };

  K = NS.kit({
    type: 'rentb', prefix: 'RM', digits: 4, paper: 'a5', papers: ['a5', 'a4', 'th80'], copies: 2, copyLabels: ['Tenant copy', 'Landlord copy'],
    name: function (d) { return d.print === 'agr' ? 'Tenancy details' : d.gstMode === 'fwd' ? 'Rent invoice' : d.paid === 'paid' ? 'Rent receipt' : 'Rent bill'; },
    blank: function () {
      var m = R.ym(NS.today());
      return { print: 'bill', tstat: 'active', prop: '', unit: '', use: 'com', pstate: '', agStart: NS.today(), agEnd: '', rent: '', maint: '', esc: '', dueDay: '1', deposit: '', gstMode: 'none', gstRate: '18',
        mFrom: m, mTo: m, extras: [], paid: 'unpaid', paidOn: '', payMode: 'upi', kind: 'plain', terms: 'Rent is payable by the due day of each month. The deposit is returned when the premises are handed back in good condition, after dues are cleared.' };
    },
    newRow: function () { return xrow(); },
    keepOnNew: function (d) { return { paper: d.paper, terms: d.terms }; },
    emptyRows: true,
    form: function (K) {
      return K.card(t('rq.tenant'), '<div class="fg">' + K.f('buyer.name', t('rq.tname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) + K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) +
          K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + K.f('buyer.gstin', t('rq.tgstin'), { max: 15, ltr: 1, hint: t('rq.tgstinh') }) + '</div>') +
        K.card(t('rq.property'), '<div class="fg">' + K.f('unit', t('rq.unitpick'), { list: 'dl-units', hint: t('rq.unitpickh') }) + K.f('prop', t('rq.property'), { wide: true }) +
          K.f('use', t('rq.use'), { type: 'select', opts: [['com', t('rq.com')], ['res', t('rq.res')]] }) + K.f('pstate', t('rq.pstate'), { type: 'select', opts: K.states(t('rq.pstate0')), hint: t('rq.pstateh') }) +
          K.f('tstat', t('rq.tstat'), { type: 'select', opts: [['active', t('rq.active')], ['left', t('rq.leftopt')]] }) + '<datalist id="dl-units">' + unitOpts() + '</datalist></div>') +
        K.card(t('rq.agreement'), '<div class="fg">' + K.f('agStart', t('rq.agstart'), { type: 'date' }) + K.f('agEnd', t('rq.agend'), { type: 'date' }) + K.f('rent', t('rq.rent'), { mode: 'decimal', ltr: 1, hint: t('rq.renth') }) + K.f('maint', t('rq.maint'), { mode: 'decimal', ltr: 1 }) +
          K.f('esc', t('rq.esc'), { mode: 'decimal', ltr: 1, hint: t('rq.esch') }) + K.f('dueDay', t('rq.dueday'), { mode: 'numeric', ltr: 1 }) + K.f('deposit', t('rq.deposit'), { mode: 'decimal', ltr: 1 }) +
          K.f('gstMode', t('rq.gst'), { type: 'select', wide: true, opts: [['none', t('rq.g.none')], ['fwd', t('rq.g.fwd')], ['rcm', t('rq.g.rcm')]], hint: t('rq.gsth') }) + K.f('gstRate', t('rq.gstrate'), { mode: 'decimal', ltr: 1, show: 'gstMode=fwd' }) + '</div>') +
        K.numCard(K.f('print', t('lr.print'), { type: 'select', opts: [['bill', t('rq.pbill')], ['agr', t('rq.pagr')]], hint: t('rq.printh') }) + K.f('mFrom', t('rq.mfrom'), { type: 'month' }) + K.f('mTo', t('rq.mto'), { type: 'month' }), t('rq.lgbill')) +
        K.card(t('rq.extras'), K.list('extras', t('rq.addx')) + '<datalist id="dl-rates"><option value="0"><option value="5"><option value="12"><option value="18"></datalist>') +
        K.card(t('rq.pay'), '<div class="fg">' + K.f('paid', t('l.pay'), { type: 'select', opts: [['unpaid', t('pay.unpaid')], ['paid', t('pay.paid')]] }) + K.f('paidOn', t('rq.paidon'), { type: 'date', show: 'paid=paid' }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'cheque', 'bank']), show: 'paid=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="row wide pos-go"><button type="button" class="btn" data-rq="wa">' + esc(t('rq.wa')) + '</button><button type="button" class="btn" data-rq="board">' + esc(t('rq.board')) + '</button><button type="button" class="btn" data-rq="units">' + esc(t('rq.units')) + '</button></div></div>') +
        K.bizCard({ lg: t('rq.landlord') }) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true }));
    },
    rows: {
      extras: function (x, i, K) {
        return K.rf('extras', i, 'desc', t('l.desc'), { cls: 'it-d', sug: 'item', ph: t('rq.xph') }) + K.rf('extras', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('extras', i, 'rate', t('l.rate'), { mode: 'decimal', ltr: 1 }) +
          (taxOn(K.doc()) ? K.rf('extras', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) : '');
      }
    },
    input: function (p, el, d, K) {
      if (p === 'gstMode') K.refill();
      if (p === 'unit') {
        var m = UNITS.filter(function (u) { return R.key(R.unitName(u.prop, u.unit)) === R.key(d.unit); })[0];
        if (m) { d.prop = m.prop || ''; d.unit = m.unit; d.use = m.use === 'res' ? 'res' : 'com'; if (!num(d.rent)) d.rent = String(m.rate || m.price || ''); if (!num(d.maint)) d.maint = m.maint || ''; K.refill(); }
      }
      if (p === 'mFrom' && (!d.mTo || d.mTo < d.mFrom)) { d.mTo = d.mFrom; var e = $('#k-mTo'); if (e) e.value = d.mTo; }
      if (p === 'paid' && d.paid === 'paid' && !d.paidOn) { d.paidOn = NS.today(); K.refill(); }
    },
    sums: sums,
    edSums: function (d, o) {
      var rn = R.rentFor(d, d.mFrom);
      return '<span>' + esc(t('rq.sum.m', { n: o.months })) + '</span>' + (rn ? '<span>' + esc(t('rq.sum.r', { v: NS.money(rn) })) + '</span>' : '') + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') +
        '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (d.gstMode === 'rcm' ? '<span>' + esc(t('rq.rcmnote')) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(tname(d)).trim()) p.push(['k-buyer-name', t('rq.v.tenant')]);
      if (!String(d.unit || d.prop).trim()) p.push(['k-unit', t('rq.v.where')]);
      if (!(num(d.rent) > 0)) p.push(['k-rent', t('rq.v.rent')]);
      if (d.agEnd && d.agStart && d.agEnd < d.agStart) p.push(['k-agEnd', t('rq.v.dates')]);
      if (d.print === 'bill' && (!R.isYm(d.mFrom) || !R.isYm(d.mTo || d.mFrom) || (d.mTo || d.mFrom) < d.mFrom || !o.months)) p.push(['k-mFrom', t('rq.v.months')]);
      if (d.gstMode === 'fwd' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    confirm: function (d, o) {
      if (d.print === 'bill') {
        var dup = R.monthsList(d.mFrom, d.mTo || d.mFrom).filter(function (m) { return DOCS.some(function (b) { return b.id !== K.editing() && b.print === 'bill' && R.tkey(b) === R.tkey(d) && R.monthsList(b.mFrom, b.mTo || b.mFrom).indexOf(m) >= 0; }); });
        if (dup.length) return t('rq.c.dup', { m: dup.map(R.label).join(', ') });
      }
      return d.paid === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : '';
    },
    masterItems: function (d) { return d.extras.filter(function (x) { return String(x.desc || '').trim(); }).map(function (x) { return { desc: String(x.desc).trim(), hsn: '', unit: '', rate: x.rate, gst: taxOn(d) ? x.gst : '', kind: 'service' }; }); },
    record: function (rec) {
      rec.items = R.lines(rec).map(function (l) { return { desc: l.desc, hsn: l.hsn, unit: l.unit, qty: l.qty, rate: l.rate, disc: '', gst: l.gst }; });
      rec.kind = rec.seller.gstin && taxOn(rec) ? 'tax' : 'plain'; rec.withGst = rec.kind === 'tax'; rec.status = rec.paid === 'paid' ? 'paid' : 'unpaid';
      rec.pos = rec.pstate || rec.seller.state || ''; rec.mTo = rec.mTo || rec.mFrom;
      rec.extras = rec.extras.filter(function (x) { return String(x.desc || '').trim() || num(x.rate); });
      if (rec.paid === 'paid' && rec.payMode && !rec.mode) rec.mode = rec.payMode;
    },
    load: function (d) { if (!d.extras) d.extras = []; },
    copyOf: function (d, rec) {
      var from = NEXT && NEXT.from || R.addMonth(R.ym(rec.mTo || rec.mFrom) || R.ym(NS.today()), 1);
      NEXT = null; d.print = 'bill'; d.paid = 'unpaid'; d.paidOn = ''; d.mFrom = from; d.mTo = from; d.extras = []; d.items = [];
    },
    copyLbl: 'rq.next',
    histName: function (d) { return tname(d) + ' · ' + where(d); },
    histText: function (d) { return [d.buyer && d.buyer.phone, d.prop, d.unit].join(' '); },
    histPill: function (d) {
      return d.print === 'agr' ? ' <span class="pill">' + esc(t('rq.agrcard')) + '</span>' : ' <span class="pill' + (d.paid === 'paid' ? ' ok' : '') + '">' + esc(t(d.paid === 'paid' ? 'pay.paid' : 'pay.unpaid')) + '</span> <small>' + esc(mrange(d)) + '</small>';
    },
    shareText: function (d, o) { return '\n' + waText(d, o); },
    upiShare: true,
    saved: function () { loadAll(); },
    sheet: function (d, o, K, label) {
      var agr = d.print === 'agr', b = d.buyer, tax = taxOn(d) && !!d.seller.gstin, res = d.use === 'res';
      var title = agr ? 'TENANCY DETAILS AND RENT SCHEDULE' : tax ? 'TAX INVOICE (RENT)' : d.paid === 'paid' ? 'RENT RECEIPT' : 'RENT BILL';
      var meta = agr ? [['Ref. no.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Property', esc(d.prop)], ['Unit', esc(d.unit)], ['Use', res ? 'Residential' : 'Shop / office / other'], ['Agreement from', NS.fmtDate(d.agStart)], d.agEnd ? ['Agreement to', NS.fmtDate(d.agEnd)] : null,
          ['Monthly rent', NS.money(num(d.rent))], num(d.maint) ? ['Maintenance a month', NS.money(num(d.maint))] : null, num(d.esc) ? ['Yearly increase', esc(String(d.esc)) + '%'] : null, ['Due by day', esc(String(d.dueDay || 1)) + ' of the month'], num(d.deposit) ? ['Security deposit', NS.money(num(d.deposit))] : null]
        : [['Bill no.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Property', esc(where(d))], ['For months', esc(mrange(d))], d.paid === 'paid' ? ['Received on', NS.fmtDate(d.paidOn || d.date)] : null, d.paid === 'paid' ? ['Paid by', esc(K.mode(d.payMode))] : null];
      var head = K.open(d, 'rentb') + K.head(d, title, label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Tenant') + '</div>';
      if (agr) {
        var sc = R.schedule(d, 12);
        return head + (sc.length ? '<table class="lines"><thead><tr><th class="l">Month</th><th class="n">Rent</th>' + (num(d.maint) ? '<th class="n">Maintenance</th>' : '') + '</tr></thead><tbody>' + sc.map(function (r) { return '<tr><td class="l">' + esc(R.label(r.month)) + '</td><td class="n">' + NS.money(r.rent, false) + '</td>' + (num(d.maint) ? '<td class="n">' + NS.money(r.maint, false) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' : '') +
          '<div class="nt"><div><h4>GST</h4><p>' + esc(d.gstMode === 'fwd' ? 'GST at ' + (d.gstRate === '' ? 18 : d.gstRate) + '% is added to the rent and maintenance.' : d.gstMode === 'rcm' ? 'GST on the rent is payable by the tenant under reverse charge.' : 'No GST is charged on the rent.') + '</p></div>' +
          '<div><h4>Note</h4><p>This sheet records the agreed terms. A lease for more than one year must be registered under the Registration Act; ask a lawyer for the agreement itself.</p></div></div>' + (d.terms ? '<div class="nt"><div><h4>Terms</h4><p>' + esc(d.terms).replace(/\n/g, '<br>') + '</p></div></div>' : '') +
          '<div class="signs">' + K.blankSign('Tenant accepts the terms above.', 'Tenant’s signature') + K.sign(d, '', 'Landlord') + '</div>' + K.made() + '</div>';
      }
      var lines = '<table class="lines"><thead><tr><th>#</th><th class="l">Particulars</th>' + (tax ? '<th>SAC</th>' : '') + '<th class="n">Months</th><th class="n">Rate</th><th class="n">Amount</th>' + (tax ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
        o.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.l.desc) + '</td>' + (tax ? '<td class="mono">' + esc(r.l.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(r.l.qty) + '</td><td class="n">' + NS.money(r.l.rate, false) + '</td><td class="n">' + NS.money(r.value, false) + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
      var tot = K.tot([['Rent and charges', NS.money(o.taxable)], tax && o.cgst ? ['CGST', NS.money(o.cgst)] : null, tax && o.sgst ? ['SGST', NS.money(o.sgst)] : null, tax && o.igst ? ['IGST', NS.money(o.igst)] : null, o.roundOff && tax ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, [d.paid === 'paid' ? 'Received' : 'Total due', NS.money(o.total), 'grand']]);
      return head + lines + '<div class="foot"><div class="foot-l">' + K.words(o.total) + (GSTNOTE[d.gstMode] && d.gstMode !== 'none' ? '<p class="small">' + esc(GSTNOTE[d.gstMode]) + '</p>' : '') + (tax ? '' : '') + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        '</div><div class="foot-r">' + tot + (d.paid !== 'paid' ? K.qr(d, o.total) : '') + '</div></div><div class="signs">' + (d.paid === 'paid' ? K.blankSign('Received with thanks.', 'Tenant’s signature') : K.blankSign('Received the bill.', 'Tenant’s signature')) + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) {
      $$('[data-rq]', ed).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = b.getAttribute('data-rq'), d = K.doc();
          if (a === 'board') boardDialog(); else if (a === 'units') unitsDialog();
          else if (a === 'wa') { var ph = String(d.buyer.phone || '').replace(/\D/g, '').slice(-10); window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(waText(d, sums(d))), '_blank', 'noopener'); }
        });
      });
    },
    ready: function (K) {
      loadAll().then(function () { K.changed(); });
      if ($('#rq-dlg')) return;
      var x = NS.el('dialog', { id: 'rq-dlg', 'aria-labelledby': 'rq-dlg-h', 'class': 'ht-dlg' }, '<div class="dlg-h"><h2 id="rq-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-body></div>');
      document.body.appendChild(x);
      $('[data-close]', x).textContent = t('close');
      document.addEventListener('ns-lang', function () { $('[data-close]', x).textContent = t('close'); });
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      x.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rq]'); if (b) { boardClick(b); return; }
        var u = e.target.closest('[data-um]'); if (u) unitClick(u);
      });
    }
  });
})();
