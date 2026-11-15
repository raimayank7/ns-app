/* clinic.niveshsahayak.in: a doctor's or clinic's day. Appointments, patient records, a prescription and the consultation bill on one
   page. Record type 'visit' (the bill and prescription of one visit; it counts as a sale in the Nivesh Sahayak App when it has an
   amount), 'appt' (an appointment) and 'pat' (what the bill does not hold about a patient). Everything stays on this device: the
   browser's own storage, the shared my.niveshsahayak.in data home that lives in the same browser, and the backup file you save.
   The site suggests no medicine, dose or diagnosis: the doctor types them. Screen text comes from NS.t; the print is English. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, A = window.NSAppt;
  var K, ui, lastRx = {};
  var FREQ = ['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS', 'Stat', '1-0-1', '1-1-1', '0-0-1', '1-0-0'];
  var WHEN = [['', 'cli.w.none'], ['after', 'cli.w.after'], ['before', 'cli.w.before'], ['with', 'cli.w.with'], ['empty', 'cli.w.empty'], ['bed', 'cli.w.bed']];
  var WHENP = { after: 'after food', before: 'before food', 'with': 'with food', empty: 'on an empty stomach', bed: 'at bedtime' };
  function rx() { return { drug: '', dose: '', freq: '', days: '', when: 'after', note: '' }; }
  function line(desc, rate) { return { desc: desc || '', qty: 1, rate: rate || '', disc: '', gst: 0, hsn: '9993' }; }
  function taxOn(d) { return d.kind === 'tax'; }
  function sums(d) {
    var tax = taxOn(d), o = { rows: [], taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0 };
    o.intra = !d.buyer.state || !d.seller.state || d.buyer.state === d.seller.state;
    d.items.forEach(function (it) {
      var q = it.qty === '' || it.qty == null ? 1 : num(it.qty), r = num(it.rate); if (!it.desc && !r) return;
      var v = r2(q * r - q * r * num(it.disc) / 100), g = tax ? num(it.gst) : 0, tx = r2(v * g / 100);
      o.rows.push({ it: it, q: q, value: v, g: g, tax: tx }); o.taxable += v; o.tax += tx;
    });
    o.taxable = r2(o.taxable); o.tax = r2(o.tax);
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    o.adv = num(d.adv); o.due = d.status2 === 'paid' ? 0 : r2(o.total - o.adv);
    return o;
  }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'supply' : 'plain'; }
  function hasBill(d) { return d.show !== 'rx'; }
  function hasRx(d) { return d.show !== 'bill'; }
  function ageYears(a) { var m = /^\s*(\d{1,3})\s*(y|yr|yrs|years?)?\s*$/i.exec(String(a || '')); return m ? +m[1] : null; }
  function drugsFrom(all) {
    var by = {};
    all.filter(function (x) { return x.type === 'visit'; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).forEach(function (v) {
      (v.rx || []).forEach(function (r) { if (String(r.drug || '').trim()) by[String(r.drug).trim().toLowerCase()] = { drug: String(r.drug).trim(), dose: r.dose || '', freq: r.freq || '', days: r.days || '', when: r.when || '' }; });
    });
    return by;
  }
  function fillDrugList() {
    var dl = $('#cl-drugs'); if (!dl) return;
    dl.innerHTML = Object.keys(lastRx).sort().map(function (k) { return '<option value="' + esc(lastRx[k].drug) + '">'; }).join('');
  }
  /* what is known about this patient from earlier visits: age, sex, allergies */
  function recall(d) {
    var nm = String(d.buyer.name || '').trim(); if (!nm || !ui) return Promise.resolve(false);
    return ui.findPerson(d.seller, nm, d.buyer.phone).then(function (p) {
      if (!p) return false;
      var ch = false;
      if (!d.buyer.phone && p.buyer.phone) { d.buyer.phone = p.buyer.phone; ch = true; }
      if (!d.age && (p.dob || p.age)) { d.age = A.ageNow(p, d.date).replace(/ y$/, ''); ch = true; }
      if (!d.sex && p.sex) { d.sex = p.sex; ch = true; }
      if (!d.allergy && p.allergy) { d.allergy = p.allergy; ch = true; }
      return ch;
    });
  }
  function startVisit(ctx) {
    K.startNew();
    var d = K.doc(); d.buyer.name = ctx.name || ''; d.buyer.phone = ctx.phone || '';
    if (ctx.appt) { d.apptId = ctx.appt.id; d.complaint = ctx.appt.reason || ''; if (ctx.appt.staff) d.doctor = ctx.appt.staff; }
    recall(d).then(function () { K.refill(); });
    K.refill(); K.showTab('edit');
    var f = $('#k-complaint'); if (f) f.focus();
  }
  function waText(d, o) {
    var who = d.seller.name || '', nx = d.next ? NS.fmtDate(d.next) : '';
    return 'Hello ' + (d.buyer.name || '') + (nx ? ', your next visit at ' + who + ' is on ' + nx + '.' : ', thank you for visiting ' + who + '.') + (o.due ? ' Balance due ' + NS.money(o.due) + '.' : '') + ' ' + who + (d.seller.phone ? ' ' + d.seller.phone : '');
  }

  /* kit starts at once when the page is already parsed, so the screens it draws must exist first; they reach the kit only when used */
  var LK = { doc: function () { return K.doc(); }, openDoc: function (r, a) { return K.openDoc(r, a); } };
  ui = NS.apptUi({
    K: LK, site: 'clinic', billType: 'visit', personType: 'pat', titleKey: 'cli.desk', peopleKey: 'cli.t.pat', staffKey: 'cli.doctor', staffEn: 'Doctor', reasonKey: 'cli.reason', reasonEn: 'Reason', billKey: 'cli.startvisit', addKey: 'cli.addpat', dur: 15, peopleFile: 'patients', billsFile: 'visits',
    fields: [['dob', 'cli.dob', 'date', {}, 'Date of birth'], ['age', 'cli.age', 'text', { mode: 'numeric' }, 'Age (years)'], ['sex', 'cli.sex', 'sel', { opts: [['', 'cli.sx.none'], ['f', 'sx.f'], ['m', 'sx.m'], ['o', 'sx.o']] }, 'Sex'],
      ['allergy', 'cli.allergy', 'area', { wide: 1 }, 'Allergies'], ['chronic', 'cli.chronic', 'area', { wide: 1 }, 'Long-term conditions'], ['notes', 'l.notes', 'area', { wide: 1 }, 'Notes']],
    staffList: function (data) { var s = {}; data.appts.concat(data.bills).forEach(function (x) { var n = String(x.staff || x.doctor || '').trim(); if (n) s[n] = 1; }); return Object.keys(s).sort(); },
    onBill: startVisit,
    remindText: function (a, day) { return 'Hello ' + a.buyer.name + ', this is a reminder of your appointment at ' + (K.doc().seller.name || 'the clinic') + ' on ' + day + (a.time ? ' at ' + A.clock(a.time) : '') + '. ' + (K.doc().seller.phone || ''); },
    histText: function (d) { return [d.diag, d.doctor].filter(Boolean).join(' · '); },
    listExtra: function (p) { return (p.allergy ? '<br><small class="warn">' + esc(t('cli.allergy')) + ': ' + esc(p.allergy) + '</small>' : '') + (p.chronic ? '<br><small>' + esc(p.chronic) + '</small>' : ''); },
    csvHead: ['Doctor', 'Diagnosis'], csvRow: function (x) { return [x.doctor || '', x.diag || '']; }
  });

  K = NS.kit({
    type: 'visit', site: 'clinic', prefix: 'OPD', digits: 4, paper: 'a5', papers: ['a5', 'a4'], copies: 2, copyLabels: ['Patient copy', 'Clinic copy'],
    name: function (d) { return d.show === 'rx' ? 'Prescription' : d.show === 'bill' ? (d.kind === 'tax' ? 'Tax Invoice' : d.kind === 'supply' ? 'Bill of Supply' : 'Consultation Bill') : 'Visit'; },
    blank: function () { return { show: 'both', age: '', sex: '', wt: '', vit: '', allergy: '', doctor: '', qual: '', reg: '', complaint: '', diag: '', advice: '', next: '', apptId: '', rx: [rx()], kind: 'plain', adv: '', status2: 'paid', payMode: 'cash', items: [line('Consultation')] }; },
    newRow: function (n) { return n === 'rx' ? rx() : line(); },
    emptyRows: true,
    keepOnNew: function (d) { return { doctor: d.doctor, qual: d.qual, reg: d.reg, kind: d.kind, paper: d.paper, show: d.show, rx: [rx()], items: d.items.map(function (i) { return line(i.desc, i.rate); }).map(function (i, x) { i.gst = d.items[x].gst; i.hsn = d.items[x].hsn; return i; }) }; },
    form: function (K) {
      return ui.bar(K) +
        K.card(t('cli.patient'), '<div class="fg">' + K.f('buyer.name', t('cli.pname'), { wide: true, ph: t('cli.pnameph') }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('age', t('cli.age'), { ph: t('cli.ageph'), ltr: 1 }) + K.f('sex', t('cli.sex'), { type: 'select', opts: [['', t('cli.sx.none')], ['f', t('sx.f')], ['m', t('sx.m')], ['o', t('sx.o')]] }) +
          K.f('wt', t('cli.wt'), { mode: 'decimal', ltr: 1 }) + K.f('vit', t('cli.vit'), { ph: t('cli.vitph') }) + K.f('allergy', t('cli.allergy'), { wide: true, ph: t('cli.allergyph') }) +
          K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) + '</div>') +
        K.numCard(K.f('doctor', t('cli.doctor'), { ph: 'Dr …' }) + K.f('qual', t('cli.qual'), { ph: 'MBBS, MD' }) + K.f('reg', t('cli.reg'), { ltr: 1, hint: t('cli.regh') }) +
          K.f('show', t('cli.show'), { type: 'select', wide: true, opts: [['both', t('cli.show.both')], ['rx', t('cli.show.rx')], ['bill', t('cli.show.bill')]] }), t('cli.visit')) +
        K.card(t('cli.notes'), '<div class="fg">' + K.f('complaint', t('cli.complaint'), { type: 'textarea', wide: true }) + K.f('diag', t('cli.diag'), { type: 'textarea', wide: true }) + '</div>') +
        K.card(t('cli.rx'), '<p class="hint">' + esc(t('cli.rxh')) + '</p>' + K.list('rx', t('cli.addrx')) + '<div class="fg">' + K.f('advice', t('cli.advice'), { type: 'textarea', wide: true }) + K.f('next', t('cli.next'), { type: 'date' }) +
          '<div class="f"><label>&nbsp;</label><button type="button" class="btn" data-cl="follow">' + esc(t('cli.follow')) + '</button></div></div><datalist id="cl-drugs"></datalist><datalist id="cl-freq">' + FREQ.map(function (f) { return '<option value="' + f + '">'; }).join('') + '</datalist>', 'cl-rxcard') +
        K.card(t('cli.bill'), K.list('items', t('cli.addline')) + '<div class="fg">' +
          K.f('kind', t('cli.kind'), { type: 'select', wide: true, opts: [['plain', t('cli.k.plain')], ['supply', t('cli.k.supply')], ['tax', t('cli.k.tax')]], hint: t('cli.kindh') }) +
          K.f('adv', t('lr.adv'), { mode: 'decimal', ltr: 1 }) + K.f('status2', t('l.pay'), { type: 'select', opts: [['paid', t('pay.paid')], ['unpaid', t('pay.unpaid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank']), show: 'status2=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="row wide pos-go"><button type="button" class="btn" data-cl="wa">' + esc(t('cli.wa')) + '</button></div></div>', 'cl-billcard') +
        K.bizCard({ lg: t('cli.biz') }) + K.lookCard('') + '<datalist id="dl-rates"><option value="0"><option value="5"><option value="12"><option value="18"></datalist>';
    },
    rows: {
      rx: function (r, i, K) {
        return K.rf('rx', i, 'drug', t('cli.drug'), { cls: 'it-d', list: 'cl-drugs' }) + K.rf('rx', i, 'dose', t('cli.dose'), { ph: '500 mg' }) + K.rf('rx', i, 'freq', t('cli.freq'), { list: 'cl-freq', ltr: 1 }) +
          K.rf('rx', i, 'days', t('cli.days'), { ltr: 1, mode: 'numeric' }) + K.rf('rx', i, 'when', t('cli.when'), { type: 'select', opts: WHEN.map(function (x) { return [x[0], t(x[1])]; }) }) + K.rf('rx', i, 'note', t('cli.rnote'));
      },
      items: function (it, i, K) {
        return K.rf('items', i, 'desc', t('l.desc'), { cls: 'it-d', sug: 'item' }) + K.rf('items', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'rate', t('l.rate'), { mode: 'decimal', ltr: 1 }) +
          (taxOn(K.doc()) ? K.rf('items', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('items', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '');
      }
    },
    rowInput: function (n, i, k, d) {
      if (n !== 'rx' || k !== 'drug') return;
      var r = d.rx[i], h = lastRx[String(r.drug || '').trim().toLowerCase()];
      /* a medicine typed before comes back with the dose, timing and days it had last time; nothing is filled for a new one */
      if (h && !r.dose && !r.freq && !r.days) { r.dose = h.dose; r.freq = h.freq; r.days = h.days; if (h.when != null) r.when = h.when; K.refill(); }
    },
    input: function (p, el, d) {
      if (p === 'kind') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      if (p === 'show') K.refill();
    },
    pickParty: function (p, d) { recall(d).then(function (c) { if (c) K.refill(); }); },
    sums: sums,
    edSums: function (d, o) {
      if (!hasBill(d)) return '<span>' + esc(t('cli.norx')) + '</span>';
      return '<span>' + esc(t('sum.taxable', { v: NS.money(o.taxable) })) + '</span>' + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (o.due && o.total ? '<span>' + esc(t('lr.s.due', { v: NS.money(o.due) })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('cli.v.name')]);
      if (hasBill(d) && !o.rows.length) p.push(['r-items-desc-0', t('v.item')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    masterItems: function (d) { return d.items.filter(function (it) { return it.desc; }).map(function (it) { return { desc: String(it.desc).trim(), hsn: it.hsn || '', unit: 'Nos', rate: it.rate, gst: d.kind === 'tax' ? it.gst : '', kind: 'service' }; }); },
    record: function (rec) {
      rec.items = rec.items.filter(function (it) { return it.desc || num(it.rate); }); rec.rx = rec.rx.filter(function (r) { return String(r.drug || '').trim(); });
      if (!hasBill(rec)) { rec.items = []; }
      rec.withGst = rec.kind === 'tax'; rec.status = rec.status2 === 'paid' ? 'paid' : 'unpaid';
    },
    saved: function (rec) {
      Object.assign(lastRx, drugsFrom([rec]));
      fillDrugList();
      var y = ageYears(rec.age);
      ui.upsertPerson(rec.seller, rec.buyer, { sex: rec.sex, allergy: rec.allergy, age: y != null ? String(y) : '', ageAt: y != null ? rec.date : '' });
      return ui.doneAppt(rec.apptId);
    },
    load: function (d) { if (!d.items) d.items = []; if (!d.rx || !d.rx.length) d.rx = [rx()]; if (!d.items.length && hasBill(d)) d.items = [line()]; },
    copyOf: function (d) { d.complaint = ''; d.diag = ''; d.advice = ''; d.next = ''; d.vit = ''; d.apptId = ''; d.status2 = 'paid'; d.adv = ''; if (!d.items.length) d.items = [line('Consultation')]; },
    copyLbl: 'cli.again',
    histName: function (d) { return (d.buyer && d.buyer.name || '') + (d.diag ? ' · ' + String(d.diag).slice(0, 40) : ''); },
    histText: function (d) { return [d.buyer && d.buyer.phone, d.doctor, d.complaint, d.diag, (d.rx || []).map(function (r) { return r.drug; }).join(' ')].join(' '); },
    histPill: function (d) { return d.status === 'unpaid' && d.total ? ' <span class="pill">' + esc(t('pay.unpaid')) + '</span>' : ''; },
    shareText: function (d, o) { return '\n' + waText(d, o); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var b = d.buyer, tax = taxOn(d), bill = hasBill(d) && o.rows.length, doRx = hasRx(d);
      var ag = d.age ? esc(d.age) + (ageYears(d.age) != null ? ' y' : '') : '', sx = { f: 'Female', m: 'Male', o: 'Other' }[d.sex] || '';
      var title = !bill ? 'PRESCRIPTION' : !doRx ? (tax ? 'TAX INVOICE' : d.kind === 'supply' ? 'BILL OF SUPPLY' : 'CONSULTATION BILL') : (tax ? 'TAX INVOICE' : d.kind === 'supply' ? 'BILL OF SUPPLY · PRESCRIPTION' : 'PRESCRIPTION AND BILL');
      var dr = (d.doctor ? '<p><b>' + esc(d.doctor) + '</b>' + (d.qual ? ', ' + esc(d.qual) : '') + '</p>' : '') + (d.reg ? '<p>Reg. No.: <span class="mono">' + esc(d.reg) + '</span></p>' : '');
      var meta = [['Visit No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Patient', '<b>' + esc(b.name || '') + '</b>'], ['Age / sex', [ag, sx].filter(Boolean).join(' / ')], b.phone ? ['Phone', esc(b.phone)] : null, d.wt ? ['Weight', esc(d.wt) + ' kg'] : null, d.vit ? ['Vitals', esc(d.vit)] : null];
      var head = K.open(d, 'visit') + K.head(d, title, label || '', dr) + K.meta(meta) + (b.addr ? '<p class="small">' + esc(b.addr).replace(/\n/g, '<br>') + '</p>' : '') + (d.allergy ? '<p class="small"><b>Allergies:</b> ' + esc(d.allergy) + '</p>' : '');
      var out = head;
      if (doRx) {
        var rows = d.rx.filter(function (r) { return String(r.drug || '').trim(); });
        out += (d.complaint || d.diag ? '<div class="nt">' + (d.complaint ? '<div><h4>Complaints</h4><p>' + esc(d.complaint).replace(/\n/g, '<br>') + '</p></div>' : '') + (d.diag ? '<div><h4>Diagnosis</h4><p>' + esc(d.diag).replace(/\n/g, '<br>') + '</p></div>' : '') + '</div>' : '') +
          '<p class="dt" style="text-align:left;margin:10px 0 4px"><b style="font-size:1.4em">&#8478;</b></p>' +
          (rows.length ? '<table class="lines"><thead><tr><th>#</th><th class="l">Medicine</th><th>Dose</th><th>How often</th><th>Days</th><th class="l">Instruction</th></tr></thead><tbody>' + rows.map(function (r, i) {
            return '<tr><td>' + (i + 1) + '</td><td class="l"><b>' + esc(r.drug) + '</b></td><td>' + esc(r.dose) + '</td><td>' + esc(r.freq) + '</td><td>' + esc(r.days) + '</td><td class="l">' + esc([WHENP[r.when], r.note].filter(Boolean).join('; ')) + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="small ph">Medicines</p>') +
          (d.advice ? '<div class="nt"><div><h4>Advice</h4><p>' + esc(d.advice).replace(/\n/g, '<br>') + '</p></div></div>' : '') + (d.next ? '<p><b>Next visit:</b> ' + NS.fmtDate(d.next) + '</p>' : '');
      }
      if (bill) {
        out += '<table class="lines"><thead><tr><th>#</th><th class="l">Particulars</th>' + (tax ? '<th>SAC</th>' : '') + '<th class="n">Qty</th><th class="n">Rate</th><th class="n">' + (tax ? 'Taxable' : 'Amount') + '</th>' + (tax ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
          o.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + '</td>' + (tax ? '<td class="mono">' + esc(r.it.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(r.q) + '</td><td class="n">' + NS.money(num(r.it.rate), false) + '</td><td class="n">' + NS.money(r.value, false) + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' +
          '<div class="foot"><div class="foot-l">' + K.words(o.total) + (d.kind === 'supply' ? '<p class="small">Health care services are exempt from GST.</p>' : '') + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' +
          K.tot([tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null, o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand'],
            o.adv ? ['Advance received', '−' + NS.money(o.adv)] : null, d.status2 === 'paid' ? ['Received (' + K.mode(d.payMode) + ')', NS.money(o.total)] : ['Balance due', NS.money(o.due)]]) + '</div></div>';
      } else if (d.notes) out += '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>';
      return out + '<div class="signs">' + K.sign(d, '', d.doctor ? esc(d.doctor) : 'Doctor’s signature') + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) {
      ui.wire(ed);
      var nm = $('[data-b="buyer.name"]', ed);
      if (nm) nm.addEventListener('change', function () { recall(K.doc()).then(function (c) { if (c) K.refill(); }); });
      $('[data-cl="wa"]', ed).addEventListener('click', function () {
        var d = K.doc(), ph = String(d.buyer.phone || '').replace(/\D/g, '').slice(-10);
        window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(waText(d, sums(d))), '_blank', 'noopener');
      });
      $('[data-cl="follow"]', ed).addEventListener('click', function () {
        var d = K.doc();
        if (!d.next) { NS.toast(t('cli.v.next'), 'bad'); $('#k-next').focus(); return; }
        if (!String(d.buyer.name || '').trim() || !String(d.seller.name || '').trim()) { NS.toast(t('cli.v.name'), 'bad'); return; }
        NSStore.put('doc', { type: 'appt', site: 'clinic', seller: { name: d.seller.name }, buyer: { name: d.buyer.name, phone: d.buyer.phone || '' }, date: d.next, time: '', dur: '15', staff: d.doctor || '', reason: t('cli.followup'), notes: '', status: 'booked' })
          .then(function () { NS.toast(t('cli.followed', { d: NS.fmtDate(d.next) })); });
      });
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      NSStore.list('doc').then(function (all) { lastRx = drugsFrom(all); fillDrugList(); });
    }
  });

})();
