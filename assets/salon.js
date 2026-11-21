/* salon.niveshsahayak.in: salons, parlours, gyms, yoga and dance classes, coaching and tuition. Bookings, a list of clients or members,
   the service bill, and memberships or prepaid packages that expire, with sessions used and renewals due. Record type 'svc' (a bill, or
   the sale of a membership or package: sell = 'plan'), 'appt' (a booking) and 'mem' (what the bill does not hold about a client).
   A bill counts as a sale in NSBiz. Screen text comes from NS.t; the print is English. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, A = window.NSAppt;
  var K, ui;
  var TRADES = ['salon', 'gym', 'coaching', 'other'];
  var STAFFEN = { salon: 'Stylist', gym: 'Trainer', coaching: 'Teacher', other: 'Employee' };
  /* GST rate and SAC heading proposed for each trade; both are typed fields. Beauty and physical well-being services (salon, gym, yoga):
     5% without input tax credit from 22 Sep 2025 (56th GST Council, reported; check the notification); private coaching: 18%, SAC 9992 */
  var RATE = { salon: 5, gym: 5, coaching: 18, other: 18 }, SAC = { salon: '9997', gym: '9997', coaching: '9992', other: '' };
  function line(desc, rate, staff, trade) { trade = trade || 'salon'; return { desc: desc || '', staff: staff || '', qty: 1, rate: rate || '', disc: '', gst: RATE[trade], hsn: SAC[trade] }; }
  function taxOn(d) { return d.kind === 'tax'; }
  function isPlan(d) { return d.sell === 'plan'; }
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
  /* these services are taxable once registered; below the registration limit a business charges no GST */
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function calcTo(d) { var m = d.mship, e = A.planEnd(m.from, m.unit, m.n); if (e) m.to = e; }
  function staffWord(d) { return STAFFEN[d.trade] || 'Employee'; }
  function planNames(all) { var s = {}; all.forEach(function (x) { if (x.type === 'svc' && x.mship && x.mship.plan) s[x.mship.plan] = x; }); return s; }
  var plans = {};
  function fillLists(all) {
    var dl = $('#sv-plans'); if (dl) dl.innerHTML = Object.keys(plans).sort().map(function (k) { return '<option value="' + esc(k) + '">'; }).join('');
    var st = {}; all.forEach(function (x) { if (x.type === 'svc') { if (x.staff) st[x.staff] = 1; (x.items || []).forEach(function (i) { if (i.staff) st[i.staff] = 1; }); } else if (x.type === 'appt' && x.staff) st[x.staff] = 1; });
    var sl = $('#sv-staff'); if (sl) sl.innerHTML = Object.keys(st).sort().map(function (k) { return '<option value="' + esc(k) + '">'; }).join('');
  }
  function startBill(ctx) {
    K.startNew();
    var d = K.doc(); d.buyer.name = ctx.name || ''; d.buyer.phone = ctx.phone || '';
    if (ctx.renew) {
      var r = ctx.renew, m = r.mship;
      d.sell = 'plan'; d.trade = r.trade || d.trade; d.staff = r.staff || '';
      d.mship = { plan: m.plan, from: A.renewalStart(r, NS.today()), unit: m.unit || 'months', n: m.n || '1', sessions: m.sessions || '', to: '' }; calcTo(d);
      d.items = (r.items || []).filter(function (i) { return i.desc || i.rate; }).slice(0, 1).map(function (i) { return Object.assign(line(), i, { qty: 1 }); });
      if (!d.items.length) d.items = [line(m.plan)];
      d.buyer.addr = (r.buyer && r.buyer.addr) || ''; d.buyer.state = (r.buyer && r.buyer.state) || '';
    } else if (ctx.appt) {
      d.apptId = ctx.appt.id; d.staff = ctx.appt.staff || d.staff;
      d.items = [line(ctx.appt.reason || '', '', ctx.appt.staff, d.trade)];
    }
    K.refill(); K.showTab('edit');
    var f = $('#r-items-rate-0'); if (f) f.focus();
  }
  function waText(d, o) {
    var who = d.seller.name || '';
    if (isPlan(d)) return 'Hello ' + (d.buyer.name || '') + ', your ' + (d.mship.plan || 'membership') + ' at ' + who + ' is valid from ' + NS.fmtDate(d.mship.from) + (d.mship.to ? ' to ' + NS.fmtDate(d.mship.to) : '') + (num(d.mship.sessions) ? ' (' + d.mship.sessions + ' sessions)' : '') + '. Thank you! ' + who + (d.seller.phone ? ' ' + d.seller.phone : '');
    return 'Hello ' + (d.buyer.name || '') + ', thank you for visiting ' + who + '. Bill ' + d.no + ': ' + NS.money(o.total) + (o.due ? ', balance ' + NS.money(o.due) : ' received') + '. ' + who + (d.seller.phone ? ' ' + d.seller.phone : '');
  }

  var LK = { doc: function () { return K.doc(); }, openDoc: function (r, a) { return K.openDoc(r, a); } };
  ui = NS.apptUi({
    K: LK, site: 'salon', billType: 'svc', personType: 'mem', plans: true, soon: 7, titleKey: 'svc.desk', peopleKey: 'svc.t.mem', staffKey: 'svc.staff', staffEn: 'Employee', reasonKey: 'svc.reason', reasonEn: 'Service', billKey: 'svc.startbill', addKey: 'svc.addmem', dur: 30, peopleFile: 'clients', billsFile: 'bills',
    fields: [['dob', 'cli.dob', 'date', {}, 'Date of birth'], ['notes', 'svc.pnotes', 'area', { wide: 1 }, 'Notes']],
    staffList: function (data) { var s = {}; data.appts.concat(data.bills).forEach(function (x) { var n = String(x.staff || '').trim(); if (n) s[n] = 1; (x.items || []).forEach(function (i) { if (i.staff) s[i.staff] = 1; }); }); return Object.keys(s).sort(); },
    onBill: startBill,
    remindText: function (a, day) { return 'Hello ' + a.buyer.name + ', this is a reminder of your booking at ' + (K.doc().seller.name || '') + ' on ' + day + (a.time ? ' at ' + A.clock(a.time) : '') + '. ' + (K.doc().seller.phone || ''); },
    renewText: function (d, s) {
      var who = K.doc().seller.name || '', ms = d.mship;
      return 'Hello ' + d.buyer.name + ', your ' + (ms.plan || 'membership') + ' at ' + who + (s.state === 'expired' ? ' ended on ' + NS.fmtDate(ms.to) : s.state === 'finished' ? ' has no sessions left' : ' ends on ' + NS.fmtDate(ms.to)) + '. Renew to carry on. ' + who + ' ' + (K.doc().seller.phone || '');
    },
    histText: function (d) { return d.mship && d.mship.plan ? d.mship.plan + ' (' + NS.fmtDate(d.mship.from) + ' – ' + NS.fmtDate(d.mship.to) + ')' : (d.items || []).map(function (i) { return i.desc; }).filter(Boolean).slice(0, 3).join(', '); },
    byStaff: function (b) { return (b.items || []).map(function (i) { var q = i.qty === '' || i.qty == null ? 1 : num(i.qty); return [String(i.staff || b.staff || '').trim(), r2(q * num(i.rate) * (1 - num(i.disc) / 100))]; }).filter(function (x) { return x[1]; }); },
    csvHead: ['Plan', 'From', 'To', 'Employee'], csvRow: function (x) { return [x.mship && x.mship.plan || '', x.mship && x.mship.from || '', x.mship && x.mship.to || '', x.staff || '']; }
  });

  K = NS.kit({
    acctLines: true,   /* ERP C-9: particulars and value only when the business keeps no items */
    type: 'svc', docType: 'svc', prefix: 'SV', digits: 4, paper: 'a5', papers: ['a5', 'a4', 'th80'], copies: 2, copyLabels: ['Customer copy', 'Office copy'],
    name: function (d) { return isPlan(d) ? 'Membership Receipt' : d.kind === 'tax' ? 'Tax Invoice' : d.kind === 'supply' ? 'Bill of Supply' : 'Service Bill'; },
    blank: function () { return { sell: 'bill', trade: 'salon', staff: '', apptId: '', mship: { plan: '', from: NS.today(), unit: 'months', n: '1', sessions: '', to: '' }, used: [], kind: 'plain', adv: '', status2: 'paid', payMode: 'cash', terms: '', items: [line()] }; },
    newRow: function (n, d) { return line('', '', '', d && d.trade); },
    emptyRows: true,
    keepOnNew: function (d) { return { trade: d.trade, tradePrev: d.trade, items: [line('', '', '', d.trade)], kind: d.kind, paper: d.paper, terms: d.terms, sell: 'bill' }; },
    form: function (K) {
      return ui.bar(K) +
        K.card(t('svc.client'), '<div class="fg">' + K.f('buyer.name', t('svc.cname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('staff', t('svc.servedby'), { list: 'sv-staff' }) + K.f('trade', t('svc.trade'), { type: 'select', opts: TRADES.map(function (x) { return [x, t('svc.tr.' + x)]; }) }) +
          K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) + K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + '</div>') +
        K.numCard(K.f('sell', t('svc.sell'), { type: 'select', wide: true, opts: [['bill', t('svc.sell.bill')], ['plan', t('svc.sell.plan')]] }), t('svc.bill')) +
        K.card(t('svc.plan'), '<p class="hint">' + esc(t('svc.planh')) + '</p><div class="fg">' + K.f('mship.plan', t('svc.planname'), { wide: true, list: 'sv-plans', ph: t('svc.planph') }) +
          K.f('mship.from', t('svc.from'), { type: 'date' }) + K.f('mship.unit', t('svc.unit'), { type: 'select', opts: [['months', t('svc.u.months')], ['days', t('svc.u.days')]] }) +
          K.f('mship.n', t('svc.n'), { mode: 'numeric', ltr: 1 }) + K.f('mship.sessions', t('svc.sessions'), { mode: 'numeric', ltr: 1, hint: t('svc.sessionsh') }) +
          K.f('mship.to', t('svc.to'), { type: 'date', hint: t('svc.toh') }) + '</div>', 'sv-plancard') +
        K.card(t('svc.lines'), K.list('items', t('svc.addline')) + '<div class="fg">' +
          K.f('kind', t('cli.kind'), { type: 'select', wide: true, opts: [['plain', t('svc.k.plain')], ['supply', t('svc.k.supply')], ['tax', t('svc.k.tax')]], hint: t('svc.kindh') }) +
          K.f('adv', t('lr.adv'), { mode: 'decimal', ltr: 1 }) + K.f('status2', t('l.pay'), { type: 'select', opts: [['paid', t('pay.paid')], ['unpaid', t('pay.unpaid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank']), show: 'status2=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="row wide pos-go"><button type="button" class="btn" data-sv="wa">' + esc(t('cli.wa')) + '</button></div></div>') +
        K.bizCard({}) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true, ph: t('svc.termsph') })) +
        '<datalist id="sv-plans"></datalist><datalist id="sv-staff"></datalist><datalist id="dl-rates"><option value="0"><option value="5"><option value="18"></datalist>';
    },
    rows: {
      items: function (it, i, K) {
        return K.rf('items', i, 'desc', t('l.desc'), { cls: 'it-d', sug: 'item' }) + K.rf('items', i, 'staff', t('svc.servedby'), { list: 'sv-staff' }) + K.rf('items', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'rate', t('l.rate'), { mode: 'decimal', ltr: 1 }) +
          K.rf('items', i, 'disc', t('l.disc'), { mode: 'decimal', ltr: 1 }) + (taxOn(K.doc()) ? K.rf('items', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('items', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '');
      }
    },
    input: function (p, el, d) {
      if (p === 'trade') {
        /* a line still carrying the old trade's proposed rate and SAC moves to the new trade's */
        var o = d.tradePrev || 'salon'; d.items.forEach(function (it) { if (num(it.gst) === RATE[o] && (it.hsn || '') === SAC[o]) { it.gst = RATE[d.trade]; it.hsn = SAC[d.trade]; } }); d.tradePrev = d.trade; K.refill();
      }
      if (p === 'kind') K.refill();
      if (p === 'sell') { if (isPlan(d)) calcTo(d); K.refill(); }
      if (/^mship\.(from|unit|n)$/.test(p)) { calcTo(d); var to = $('[data-b="mship.to"]'); if (to) to.value = d.mship.to; }
      if (p === 'mship.plan' && d.items.length) { var r0 = d.items[0], old = el.dataset.prev || ''; if (!r0.desc || r0.desc === old) { r0.desc = d.mship.plan; var f = $('#r-items-desc-0'); if (f) f.value = r0.desc; } el.dataset.prev = d.mship.plan; }
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
    },
    look: function (ed, d) { var c = $('.sv-plancard', ed); if (c) c.closest('fieldset').hidden = !isPlan(d); },
    sums: sums,
    edSums: function (d, o) {
      var s = '<span>' + esc(t('sum.taxable', { v: NS.money(o.taxable) })) + '</span>' + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (o.due && o.total ? '<span>' + esc(t('lr.s.due', { v: NS.money(o.due) })) + '</span>' : '');
      if (isPlan(d) && d.mship.from && d.mship.to) s += '<span>' + esc(t('svc.valid', { a: NS.fmtDate(d.mship.from), b: NS.fmtDate(d.mship.to) })) + '</span>';
      return s;
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('svc.v.name')]);
      if (!o.rows.length) p.push(['r-items-desc-0', t('v.item')]);
      if (isPlan(d)) {
        if (!String(d.mship.plan || '').trim()) p.push(['k-mship-plan', t('svc.v.plan')]);
        if (!d.mship.from) p.push(['k-mship-from', t('svc.v.from')]);
        if (!d.mship.to || d.mship.to < d.mship.from) p.push(['k-mship-to', t('svc.v.to')]);
      }
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    masterItems: function (d) { return d.items.filter(function (it) { return it.desc; }).map(function (it) { return { desc: String(it.desc).trim(), hsn: it.hsn || '', unit: 'Nos', rate: it.rate, gst: d.kind === 'tax' ? it.gst : '', kind: 'service' }; }); },
    record: function (rec) {
      rec.items = rec.items.filter(function (it) { return it.desc || num(it.rate); });
      rec.withGst = rec.kind === 'tax'; rec.status = rec.status2 === 'paid' ? 'paid' : 'unpaid'; rec.site = 'salon';
      if (rec.sell !== 'plan') { delete rec.mship; delete rec.used; } else { rec.mship.sessions = rec.mship.sessions === '' ? '' : String(Math.floor(num(rec.mship.sessions))); rec.used = rec.used || []; }
    },
    saved: function (rec) {
      if (rec.mship) plans[rec.mship.plan] = rec;
      ui.upsertPerson(rec.seller, rec.buyer, {});
      return ui.doneAppt(rec.apptId);
    },
    load: function (d) { if (!d.mship) d.mship = { plan: '', from: NS.today(), unit: 'months', n: '1', sessions: '', to: '' }; if (!d.items || !d.items.length) d.items = [line()]; if (!d.used) d.used = []; },
    copyOf: function (d, rec) {
      d.apptId = ''; d.status2 = 'paid'; d.adv = '';
      if (isPlan(d)) { d.mship.from = A.renewalStart(rec, NS.today()); d.used = []; calcTo(d); }
    },
    copyLbl: 'svc.again',
    histName: function (d) { return (d.buyer && d.buyer.name || '') + (d.mship && d.mship.plan ? ' · ' + d.mship.plan : ''); },
    histText: function (d) { return [d.buyer && d.buyer.phone, d.staff, d.mship && d.mship.plan, (d.items || []).map(function (i) { return i.desc; }).join(' ')].join(' '); },
    histPill: function (d) { return d.mship && d.mship.to ? ' <span class="pill ' + (d.mship.to >= NS.today() ? 'ok' : '') + '">' + esc(NS.fmtDate(d.mship.to)) + '</span>' : d.status === 'unpaid' && d.total ? ' <span class="pill">' + esc(t('pay.unpaid')) + '</span>' : ''; },
    shareText: function (d, o) { return '\n' + waText(d, o); },
    upiShare: true,
    sheet: function (d, o, K, label) {
      var b = d.buyer, tax = taxOn(d), plan = isPlan(d), ms = d.mship || {};
      var title = plan ? (tax ? 'TAX INVOICE (MEMBERSHIP)' : d.kind === 'supply' ? 'BILL OF SUPPLY (MEMBERSHIP)' : 'MEMBERSHIP RECEIPT') : (tax ? 'TAX INVOICE' : d.kind === 'supply' ? 'BILL OF SUPPLY' : 'SERVICE BILL');
      var meta = [['Bill No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], d.staff ? [staffWord(d), esc(d.staff)] : null];
      var head = K.open(d, 'svc') + K.head(d, title, label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Customer') + '</div>';
      var pl = plan ? '<div class="nt"><div><h4>' + esc(ms.plan || 'Membership') + '</h4><p>Valid from <b>' + NS.fmtDate(ms.from) + '</b>' + (ms.to ? ' to <b>' + NS.fmtDate(ms.to) + '</b>' : '') + (num(ms.sessions) ? '<br>Sessions included: <b>' + esc(ms.sessions) + '</b>' : '') + '</p></div></div>' : '';
      var staffCol = o.rows.some(function (r) { return r.it.staff; });
      var lines = '<table class="lines"><thead><tr><th>#</th><th class="l">Particulars</th>' + (staffCol ? '<th>' + staffWord(d) + '</th>' : '') + (tax ? '<th>SAC</th>' : '') + '<th class="n">Qty</th><th class="n">Rate</th><th class="n">' + (tax ? 'Taxable' : 'Amount') + '</th>' + (tax ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
        o.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + '</td>' + (staffCol ? '<td>' + esc(r.it.staff) + '</td>' : '') + (tax ? '<td class="mono">' + esc(r.it.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(r.q) + '</td><td class="n">' + NS.money(num(r.it.rate), false) + '</td><td class="n">' + NS.money(r.value, false) + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
      var tot = K.tot([tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null, o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand'],
        o.adv ? ['Advance received', '−' + NS.money(o.adv)] : null, d.status2 === 'paid' ? ['Received (' + K.mode(d.payMode) + ')', NS.money(o.total)] : ['Balance due', NS.money(o.due)]]);
      return head + pl + lines + '<div class="foot"><div class="foot-l">' + K.words(o.total) + (d.kind === 'supply' ? '<p class="small">Composition taxable person, not eligible to collect tax on supplies.</p>' : '') + (d.terms ? '<p class="small"><b>Terms:</b> ' + esc(d.terms).replace(/\n/g, '<br>') + '</p>' : '') + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        '</div><div class="foot-r">' + tot + (d.status2 !== 'paid' ? K.qr(d, o.due) : '') + '</div></div><div class="signs">' + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) {
      ui.wire(ed);
      $('[data-sv="wa"]', ed).addEventListener('click', function () {
        var d = K.doc(), ph = String(d.buyer.phone || '').replace(/\D/g, '').slice(-10);
        window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(waText(d, sums(d))), '_blank', 'noopener');
      });
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      NSStore.list('doc').then(function (all) { plans = planNames(all); fillLists(all); });
    }
  });
})();
