/* garage.niveshsahayak.in: job cards and service bills for an auto garage or workshop, with the vehicle (registration, make, year, fuel,
   odometer), the service history of each vehicle and next-service reminders by date or km. Record type 'gjob' (like the job-card site's
   'job'): it counts as a sale in NSBiz once it is printed or saved as a service bill (print 'bill').
   Vehicles are not stored apart: a vehicle is every job card with the same registration number (engine/garagecore.js).
   Reminders need no server: the due list is worked out when the page opens and each row gives a WhatsApp message to send. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, G = window.NSGarage;
  var STAT = ['recd', 'work', 'parts', 'ready', 'done'];
  var STATP = { recd: 'Received', work: 'In progress', parts: 'Waiting for parts', ready: 'Ready for delivery', done: 'Delivered' };
  var K, lastAuto = { nextDate: '', nextKm: '' }, DOCS = [], dlgView = 'due';
  function row(kind) { return { kind: kind || 'part', desc: '', hsn: kind === 'lab' ? '9987' : '', qty: 1, rate: '', disc: '', gst: 18, unit: kind === 'lab' ? 'Job' : 'Nos' }; }
  function taxOn(d) { return d.kind === 'tax'; }
  function sums(d) {
    var tax = taxOn(d), o = { rows: [], parts: 0, lab: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0 };
    o.intra = !d.buyer.state || !d.seller.state || d.buyer.state === d.seller.state;
    d.items.forEach(function (it) {
      var q = num(it.qty), r = num(it.rate); if (!it.desc && !r) return;
      var v = r2(q * r - q * r * num(it.disc) / 100), g = tax ? num(it.gst) : 0, tx = r2(v * g / 100);
      o.rows.push({ it: it, value: v, g: g, tax: tx }); o[it.kind === 'lab' ? 'lab' : 'parts'] += v; o.taxable += v; o.tax += tx;
    });
    o.parts = r2(o.parts); o.lab = r2(o.lab); o.taxable = r2(o.taxable); o.tax = r2(o.tax);
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    o.adv = num(d.adv); o.due = d.status2 === 'paid' ? 0 : r2(o.total - o.adv);
    return o;
  }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function who() { return String(K.doc().seller.name || '').trim(); }
  function vehName(d) { return [d.make, d.model, d.year].filter(Boolean).join(' '); }
  function load() { return NSStore.list('doc').then(function (all) { DOCS = all; return all; }); }
  function fd(x) { return NS.fmtDate(x); }
  function nextTxt(d) {
    var b = []; if (d.nextDate) b.push('on or before ' + fd(d.nextDate)); if (num(d.nextKm)) b.push('at ' + Math.round(num(d.nextKm)).toLocaleString('en-IN') + ' km');
    return b.join(' or ');
  }
  function waText(d, o) {
    var v = [vehName(d), G.showReg(d.reg)].filter(Boolean).join(' · ') || 'vehicle';
    var base = d.jstat === 'ready' ? 'Hello ' + (d.buyer.name || '') + ', your ' + v + ' (job ' + d.no + ') is ready for pickup.' + (o.total ? ' Bill amount ' + NS.money(o.total) + (o.due && o.due !== o.total ? ', balance ' + NS.money(o.due) : '') + '.' : '')
      : 'Hello ' + (d.buyer.name || '') + ', we have received your ' + v + ' (job ' + d.no + ').' + (num(d.est) ? ' Estimate ' + NS.money(num(d.est)) + '.' : '') + (d.promise ? ' Expected by ' + fd(d.promise) + '.' : '');
    return base + (d.svc && nextTxt(d) && d.jstat === 'ready' ? ' Next service ' + nextTxt(d) + '.' : '') + ' ' + (d.seller.name || '');
  }
  function csvDownload(name, rows) {
    var blob = new Blob(['﻿' + G.csv(rows)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  /* next service from the intervals, unless the person typed their own values */
  function applyNext(d, force) {
    if (!d.svc) return false;
    var s = G.suggestNext(d), ch = false;
    ['nextDate', 'nextKm'].forEach(function (k) { if (s[k] !== '' && (force || !d[k] || String(d[k]) === String(lastAuto[k]))) { if (String(d[k]) !== String(s[k])) { d[k] = s[k]; ch = true; } lastAuto[k] = s[k]; } });
    return ch;
  }

  /* ---------- the dialog: open jobs / service due / vehicles / one vehicle's history ---------- */
  function dlg() { return $('#gr-dlg'); }
  function head(view, extra) {
    var tabs = [['board', 'jc.board'], ['due', 'gr.due'], ['veh', 'gr.vehicles']].map(function (x) { return '<button type="button" class="btn sm' + (view === x[0] ? ' primary' : '') + '" data-gv="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('');
    return '<div class="row gr-tabs">' + tabs + '</div>' + (extra || '');
  }
  function show(view, arg) {
    dlgView = view; var d = dlg(), body = $('[data-gb]', d);
    load().then(function (all) {
      var w = who(), shop = w, html = '';
      function li(main, sub, acts, warn) { return '<li' + (warn ? ' class="warn"' : '') + '><div class="gr-m">' + main + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="gr-a">' + acts + '</div></li>'; }
      function btn(a, v, label) { return '<button type="button" class="btn sm" ' + a + '="' + esc(v) + '">' + esc(label) + '</button>'; }
      if (view === 'board') {
        var jobs = all.filter(function (x) { return x.type === 'gjob' && x.jstat !== 'done' && G.key(x.seller && x.seller.name) === G.key(w); }).sort(function (a, b) { return (a.promise || '9').localeCompare(b.promise || '9'); });
        html = head(view) + (jobs.length ? '<ul class="gr-list">' + jobs.map(function (x) {
          var late = x.promise && x.promise < NS.today();
          return li('<b class="mono">' + esc(G.showReg(x.reg)) + '</b> ' + esc(vehName(x)), esc([x.no, x.buyer && x.buyer.name, t('jc.s.' + (x.jstat || 'recd')), x.promise ? t('jc.promise') + ' ' + fd(x.promise) : ''].filter(Boolean).join(' · ')), btn('data-open', x.id, t('h.open')), late);
        }).join('') + '</ul>' : '<p>' + esc(t('jc.nojobs')) + '</p>');
      } else if (view === 'due') {
        var list = G.dueList(all, NS.today(), w);
        html = head(view, '<p class="hint">' + esc(t('gr.dueh')) + '</p>') + (list.length ? '<ul class="gr-list">' + list.map(function (r) {
          var v = r.v, late = r.daysLate != null && r.daysLate > 0, wt = [];
          if (v.nextDate) wt.push(fd(v.nextDate)); if (v.nextKm) wt.push(v.nextKm.toLocaleString('en-IN') + ' km');
          var why = r.why.map(function (x) { return t('gr.w.' + x); }).join(', ') + (late ? ' · ' + t('gr.late', { n: r.daysLate }) : r.daysLate != null && r.why.indexOf('date') >= 0 ? ' · ' + t('gr.in', { n: -r.daysLate }) : '');
          return li('<b class="mono">' + esc(v.show) + '</b> ' + esc([vehName(v), v.cust].filter(Boolean).join(' · ')),
            esc(t('gr.nextsvc') + ': ' + wt.join(' / ')) + '<br>' + esc(why) + '<br>' + esc(v.lastKm ? t('gr.lastat', { km: v.lastKm.toLocaleString('en-IN'), d: fd(v.lastDate) }) : t('gr.lastd', { d: fd(v.lastDate) })),
            '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(G.waLink(r, shop, fd)) + '">' + esc(t('gr.wa')) + '</a> ' + btn('data-gh', v.reg, t('gr.hist')), late);
        }).join('') + '</ul><div class="row"><button type="button" class="btn" data-gx="due">' + esc(t('gr.excel')) + '</button></div>' : '<p>' + esc(t('gr.nodue')) + '</p>');
      } else if (view === 'veh') {
        var vs = G.vehicles(all, w), q = String(arg || '').toLowerCase();
        var f = vs.filter(function (v) { return !q || [v.reg, v.show, v.make, v.model, v.cust, v.phone].join(' ').toLowerCase().indexOf(q) >= 0; });
        html = head(view) + '<div class="f"><label for="gr-q">' + esc(t('h.search')) + '</label><input id="gr-q" type="search" value="' + esc(arg || '') + '" dir="auto"></div>' + (f.length ? '<ul class="gr-list">' + f.map(function (v) {
          return li('<b class="mono">' + esc(v.show) + '</b> ' + esc(vehName(v)), esc([v.cust, v.phone, t('gr.visits') + ' ' + v.jobs, fd(v.lastDate)].filter(Boolean).join(' · ')), btn('data-gh', v.reg, t('gr.hist')));
        }).join('') + '</ul><div class="row"><button type="button" class="btn" data-gx="veh">' + esc(t('gr.excel')) + '</button></div>' : '<p>' + esc(t('gr.noveh')) + '</p>');
      } else if (view === 'hist') {
        var jobsH = G.history(all, arg, w), v1 = G.vehicles(all, w).filter(function (v) { return v.reg === G.normReg(arg); })[0];
        html = head('veh') + '<h3>' + esc(t('gr.histof', { reg: G.showReg(arg) })) + '</h3>' + (v1 ? '<p>' + esc([vehName(v1), v1.cust, v1.phone].filter(Boolean).join(' · ')) + '</p>' + (nextTxt(v1) ? '<p><b>' + esc(t('gr.nextsvc')) + ':</b> ' + esc(nextTxt(v1)) + '</p>' : '') : '') +
          (jobsH.length ? '<ul class="gr-list">' + jobsH.map(function (x) {
            var did = (x.items || []).filter(function (i) { return i.desc; }).map(function (i) { return i.desc; }).join(', ') || x.complaint || '';
            return li('<b class="mono">' + esc(x.no) + '</b> ' + fd(x.date) + (x.odo ? ' · ' + esc(x.odo) + ' km' : ''), esc(did) + (x.print === 'bill' ? ' · ' + NS.money(num(x.total)) : ''), btn('data-open', x.id, t('h.open')));
          }).join('') + '</ul><div class="row"><button type="button" class="btn" data-gx="hist" data-reg="' + esc(arg) + '">' + esc(t('gr.excel')) + '</button></div>' : '<p>' + esc(t('gr.nohist')) + '</p>');
      }
      body.innerHTML = html;
      var q2 = $('#gr-q', body); if (q2) { q2.addEventListener('input', function () { var pos = q2.selectionStart; show('veh', q2.value); }); if (arg) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); } }
      if (!d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
    });
  }
  function badge() {
    load().then(function (all) {
      var n = G.dueList(all, NS.today(), who()).length, b = $('[data-gr="due"]');
      if (b) b.textContent = t('gr.due') + (n ? ' (' + n + ')' : '');
    }, function () {});
  }

  K = NS.kit({
    acctLines: true,   /* ERP C-9: particulars and value only when the business keeps no items */
    type: 'gjob', prefix: 'GJ', digits: 4, paper: 'a5', papers: NS.PAPER_ALL, copies: 2, copyLabels: ['Customer copy', 'Workshop copy'],
    name: function (d) { return d.print === 'bill' ? 'Service Bill' : 'Job Card'; },
    blank: function () { return { print: 'card', jstat: 'recd', reg: '', make: '', model: '', year: '', fuel: 'petrol', odo: '', acc: '', cond: '', complaint: '', est: '', promise: '', tech: '', svc: false, intMonths: '', intKm: '', nextDate: '', nextKm: '', kind: 'plain', adv: '', status2: 'unpaid', payMode: 'cash', terms: 'Estimate is approximate; we will call before extra work. Vehicles not collected within 30 days of the ready message are at the owner’s risk.', items: [row('lab')] }; },
    newRow: function () { return row('part'); },
    keepOnNew: function (d) { return { kind: d.kind, paper: d.paper, terms: d.terms, intMonths: d.intMonths, intKm: d.intKm }; },
    form: function (K) {
      return K.card(t('jc.cust'), '<div class="fg">' + K.f('buyer.name', t('l.cname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) + K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + '</div>') +
        K.card(t('gr.vehicle'), '<div class="fg">' + K.f('reg', t('gr.reg'), { ltr: 1, max: 14, ph: 'PB 10 AB 1234', list: 'dl-regs', hint: t('gr.regh') }) + '<div class="f wide" id="gr-known" aria-live="polite" hidden></div>' +
          K.f('make', t('jc.make')) + K.f('model', t('jc.model')) + K.f('year', t('gr.year'), { mode: 'numeric', max: 4, ltr: 1 }) +
          K.f('fuel', t('gr.fuel'), { type: 'select', opts: ['petrol', 'diesel', 'cng', 'ev', 'other'].map(function (x) { return [x, t('gr.f.' + x)]; }) }) +
          K.f('odo', t('gr.odo'), { mode: 'numeric', ltr: 1 }) + K.f('acc', t('jc.acc'), { wide: true, ph: t('gr.accph') }) + K.f('cond', t('jc.cond'), { type: 'textarea', wide: true, ph: t('gr.condph') }) +
          K.f('complaint', t('jc.complaint'), { type: 'textarea', wide: true }) + '<datalist id="dl-regs"></datalist></div>') +
        K.numCard(K.f('jstat', t('jc.status'), { type: 'select', opts: STAT.map(function (s) { return [s, t('jc.s.' + s)]; }) }) + K.f('promise', t('jc.promise'), { type: 'date' }) +
          K.f('est', t('jc.est'), { mode: 'decimal', ltr: 1 }) + K.f('tech', t('gr.tech')) +
          K.f('print', t('lr.print'), { type: 'select', opts: [['card', t('jc.pcard')], ['bill', t('jc.pbill')]], wide: true, hint: t('jc.printh') }), t('jc.lgjob')) +
        K.card(t('jc.work'), K.list('items', t('jc.addline')) + '<div class="fg">' +
          K.f('kind', t('pos.kind'), { type: 'select', wide: true, opts: [['tax', t('k.tax')], ['supply', t('k.supply')], ['plain', t('k.plain')]] }) +
          K.f('adv', t('lr.adv'), { mode: 'decimal', ltr: 1 }) + K.f('status2', t('l.pay'), { type: 'select', opts: [['unpaid', t('pay.unpaid')], ['paid', t('pay.paid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank']), show: 'status2=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div></div>') +
        K.card(t('gr.lgnext'), '<div class="fg">' + K.f('svc', t('gr.svc'), { type: 'check', hint: t('gr.svch') }) +
          K.f('intMonths', t('gr.intm'), { mode: 'numeric', ltr: 1, show: 'svc' }) + K.f('intKm', t('gr.intk'), { mode: 'numeric', ltr: 1, show: 'svc' }) +
          K.f('nextDate', t('gr.nextd'), { type: 'date', show: 'svc' }) + K.f('nextKm', t('gr.nextk'), { mode: 'numeric', ltr: 1, show: 'svc' }) + '</div>') +
        '<div class="row wide pos-go gr-go"><button type="button" class="btn" data-gr="wa">' + esc(t('jc.wa')) + '</button><button type="button" class="btn" data-gr="board">' + esc(t('jc.board')) + '</button>' +
          '<button type="button" class="btn" data-gr="due">' + esc(t('gr.due')) + '</button><button type="button" class="btn" data-gr="hist">' + esc(t('gr.hist')) + '</button></div>' +
        K.bizCard({}) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true })) +
        '<datalist id="dl-rates"><option value="0"><option value="5"><option value="18"><option value="40"></datalist>';
    },
    rows: {
      items: function (it, i, K) {
        return K.rf('items', i, 'kind', t('jc.lk'), { type: 'select', opts: [['part', t('jc.part')], ['lab', t('jc.lab')]] }) + K.rf('items', i, 'desc', t('l.desc'), { cls: 'it-d', sug: 'item' }) +
          K.rf('items', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'rate', t('l.rate'), { mode: 'decimal', ltr: 1 }) +
          (taxOn(K.doc()) ? K.rf('items', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('items', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '');
      }
    },
    rowInput: function (n, i, k, d) { var it = d.items[i]; if (k === 'kind' && it.kind === 'lab') { if (!it.hsn) it.hsn = '9987'; it.unit = 'Job'; K.refill(); } },
    input: function (p, el, d, K, e) {
      if (p === 'kind') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      if (p === 'jstat' && d.jstat === 'done' && d.print !== 'bill') { d.print = 'bill'; K.refill(); }
      if (p === 'seller.name') badge();
      if (p === 'reg' && e && e.type === 'change') knownVehicle(d);
      if (p === 'svc' && d.svc && !d.intMonths && !d.intKm) { d.intMonths = '6'; d.intKm = '5000'; }
      if (['svc', 'intMonths', 'intKm', 'odo', 'date'].indexOf(p) >= 0 && applyNext(d, p === 'svc' || p === 'intMonths' || p === 'intKm')) K.refill();
      else if (p === 'svc') K.refill();
    },
    sums: sums,
    edSums: function (d, o) {
      return '<span>' + esc(t('jc.sum.parts', { v: NS.money(o.parts) })) + '</span><span>' + esc(t('jc.sum.lab', { v: NS.money(o.lab) })) + '</span>' + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') +
        '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (o.due && o.total ? '<span>' + esc(t('lr.s.due', { v: NS.money(o.due) })) + '</span>' : '') +
        (num(d.est) && o.total > num(d.est) * 1.1 ? '<span class="warn">' + esc(t('jc.over', { v: NS.money(num(d.est)) })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('jc.v.cust')]);
      if (!G.normReg(d.reg)) p.push(['k-reg', t('gr.v.reg')]);
      if (d.print === 'bill' && !o.rows.length) p.push(['r-items-desc-0', t('v.item')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.svc && !d.nextDate && !num(d.nextKm)) p.push(['k-nextDate', t('gr.v.next')]);
      if (d.svc && d.nextDate && d.date && d.nextDate <= d.date) p.push(['k-nextDate', t('gr.v.nextd')]);
      return p;
    },
    confirm: function (d, o) { return d.status2 === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : ''; },
    masterItems: function (d) { return d.items.filter(function (it) { return it.desc; }).map(function (it) { return { desc: String(it.desc).trim(), hsn: it.hsn || '', unit: it.unit || '', rate: it.rate, gst: d.kind === 'tax' ? it.gst : '', kind: it.kind === 'lab' ? 'service' : '' }; }); },
    record: function (rec) { rec.reg = G.showReg(rec.reg); rec.items = rec.items.filter(function (it) { return it.desc || num(it.rate); }); rec.withGst = rec.kind === 'tax'; rec.status = rec.status2 === 'paid' ? 'paid' : 'unpaid'; },
    saved: function () { load().then(function () { regList(); badge(); }); },
    load: function (d) { if (!d.items || !d.items.length) d.items = [row('lab')]; lastAuto = { nextDate: d.nextDate || '', nextKm: d.nextKm || '' }; },
    copyOf: function (d) { d.jstat = 'recd'; d.print = 'card'; d.status2 = 'unpaid'; d.adv = ''; d.complaint = ''; d.cond = ''; d.promise = ''; d.svc = false; d.nextDate = ''; d.nextKm = ''; d.items = [row('lab')]; },
    copyLbl: 'gr.again',
    histName: function (d) { return [G.showReg(d.reg), vehName(d)].filter(Boolean).join(' ') + ' · ' + (d.buyer && d.buyer.name || ''); },
    histText: function (d) { return [d.reg, d.make, d.model, d.buyer && d.buyer.phone].join(' '); },
    histPill: function (d) { return ' <span class="pill' + (d.jstat === 'done' ? ' ok' : '') + '">' + esc(t('jc.s.' + (d.jstat || 'recd'))) + '</span>'; },
    shareText: function (d, o) { return '\n' + waText(d, o); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var bill = d.print === 'bill', b = d.buyer, tax = taxOn(d);
      var meta = [[bill ? 'Bill No.' : 'Job No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Status', STATP[d.jstat] || ''], d.promise ? ['Promised by', NS.fmtDate(d.promise)] : null,
        ['Registration', '<span class="mono">' + esc(G.showReg(d.reg)) + '</span>'], ['Make / model', esc([d.make, d.model, d.year].filter(Boolean).join(' '))], d.fuel ? ['Fuel', esc({ petrol: 'Petrol', diesel: 'Diesel', cng: 'CNG', ev: 'Electric', other: 'Other' }[d.fuel] || d.fuel)] : null,
        d.odo ? ['Odometer', esc(d.odo) + ' km'] : null, d.tech ? ['Mechanic', esc(d.tech)] : null];
      var title = bill ? (d.kind === 'tax' ? 'TAX INVOICE (SERVICE BILL)' : d.kind === 'supply' ? 'BILL OF SUPPLY (SERVICE BILL)' : 'SERVICE BILL') : 'JOB CARD';
      var head = K.open(d, 'job') + K.head(d, title, label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Customer') + '</div>';
      var intake = (d.complaint ? '<div class="nt"><div><h4>Complaint / work asked</h4><p>' + esc(d.complaint).replace(/\n/g, '<br>') + '</p></div>' + (d.acc || d.cond ? '<div><h4>Received with</h4><p>' + esc(d.acc) + (d.cond ? '<br>Condition: ' + esc(d.cond).replace(/\n/g, '<br>') : '') + '</p></div>' : '') + '</div>' : '');
      var nx = d.svc && nextTxt(d) ? '<p class="small"><b>Next service:</b> ' + esc(nextTxt(d)) + '</p>' : '';
      var lines = o.rows.length ? '<table class="lines"><thead><tr><th>#</th><th class="l">Parts and labour</th>' + (tax ? '<th>HSN/SAC</th>' : '') + '<th class="n">Qty</th><th class="n">Rate</th><th class="n">' + (tax ? 'Taxable' : 'Amount') + '</th>' + (tax ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
        o.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + ' <small>(' + (r.it.kind === 'lab' ? 'labour' : 'part') + ')</small></td>' + (tax ? '<td class="mono">' + esc(r.it.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(num(r.it.qty)) + '</td><td class="n">' + NS.money(num(r.it.rate), false) + '</td><td class="n">' + NS.money(r.value, false) + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' : '';
      var tot = K.tot([['Parts', NS.money(o.parts)], ['Labour', NS.money(o.lab)], tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null,
        o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand'], o.adv ? ['Advance received', '−' + NS.money(o.adv)] : null, o.due && o.due !== o.total ? ['Balance due', NS.money(o.due)] : null]);
      if (!bill) {
        return head + intake + (num(d.est) ? '<p class="small"><b>Estimate: ' + NS.money(num(d.est)) + '</b> (approximate)' + (o.adv ? ', advance received ' + NS.money(o.adv) : '') + '</p>' : '') + lines +
          (d.terms ? '<div class="nt"><div><h4>Terms</h4><p>' + esc(d.terms).replace(/\n/g, '<br>') + '</p></div></div>' : '') +
          '<div class="signs">' + K.blankSign('I agree to the terms above.', 'Customer’s signature') + K.sign(d, '', 'Received by (workshop)') + '</div>' + K.made() + '</div>';
      }
      return head + lines + '<div class="foot"><div class="foot-l">' + K.words(o.total) + (d.kind === 'supply' ? '<p class="small">Composition taxable person, not eligible to collect tax on supplies.</p>' : '') +
        (d.complaint ? '<p class="small"><b>Work:</b> ' + esc(d.complaint) + '</p>' : '') + nx + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        '</div><div class="foot-r">' + tot + (d.status2 !== 'paid' ? K.qr(d, o.due) : '') + '</div></div>' +
        '<div class="signs">' + K.blankSign('Received the vehicle in good condition.', 'Customer’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed, K0) {
      K = K0;   /* NS.kit has not returned yet when the first form is built */
      $('[data-gr="board"]', ed).addEventListener('click', function () { show('board'); });
      $('[data-gr="due"]', ed).addEventListener('click', function () { show('due'); });
      $('[data-gr="hist"]', ed).addEventListener('click', function () { var r = K.doc().reg; show(G.normReg(r) ? 'hist' : 'veh', G.normReg(r) ? r : ''); });
      $('[data-gr="wa"]', ed).addEventListener('click', function () {
        var d = K.doc(), ph = String(d.buyer.phone || '').replace(/\D/g, '').slice(-10);
        window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(waText(d, sums(d))), '_blank', 'noopener');
      });
      regList(); badge();
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      load().then(function () { regList(); badge(); }, function () {});
      if ($('#gr-dlg')) return;
      var x = NS.el('dialog', { id: 'gr-dlg', 'aria-labelledby': 'gr-dlg-h' }, '<div class="dlg-h"><h2 id="gr-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-gb></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      x.addEventListener('click', function (e) {
        var o = e.target.closest('[data-open]'), v = e.target.closest('[data-gv]'), h = e.target.closest('[data-gh]'), xl = e.target.closest('[data-gx]');
        if (o) { NSStore.get('doc', o.getAttribute('data-open')).then(function (r) { if (r) { x.close(); K.openDoc(r, false); } }); }
        else if (v) show(v.getAttribute('data-gv'));
        else if (h) show('hist', h.getAttribute('data-gh'));
        else if (xl) {
          var w = who(), a = xl.getAttribute('data-gx');
          load().then(function (all) {
            if (a === 'due') csvDownload('service-due-' + NS.today() + '.csv', G.dueRows(G.dueList(all, NS.today(), w)));
            else if (a === 'veh') csvDownload('vehicles-' + NS.today() + '.csv', G.vehicleRows(G.vehicles(all, w)));
            else csvDownload('history-' + G.normReg(xl.getAttribute('data-reg')) + '.csv', G.historyRows(G.history(all, xl.getAttribute('data-reg'), w)));
          });
        }
      });
      function names() { $('h2', x).textContent = t('gr.title'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', function () { names(); if (x.open) show(dlgView === 'hist' ? 'veh' : dlgView); });
    }
  });

  /* registration numbers already used, as suggestions while typing */
  function regList() {
    var l = $('#dl-regs'); if (!l) return;
    l.innerHTML = G.vehicles(DOCS, who()).map(function (v) { return '<option value="' + esc(v.show) + '" label="' + esc([vehName(v), v.cust].filter(Boolean).join(' · ')) + '">'; }).join('');
  }
  /* a registration number seen before fills the vehicle and the owner (never over what is already typed) and shows its last visit */
  function knownVehicle(d) {
    var box = $('#gr-known'); if (!box) return;
    load().then(function (all) {
      var h = G.history(all, d.reg, who()).filter(function (x) { return x.id !== (K.editing() || ''); }), f = h[0];
      if (!f) { box.hidden = true; return; }
      var ch = false;
      ['make', 'model', 'year', 'fuel'].forEach(function (k) { if (!d[k] || (k === 'fuel' && d[k] === 'petrol' && f[k] !== 'petrol' && !d.make)) { if (f[k] && d[k] !== f[k]) { d[k] = f[k]; ch = true; } } });
      if (!String(d.buyer.name || '').trim() && f.buyer) { d.buyer = Object.assign({}, d.buyer, f.buyer); ch = true; }
      if (ch) K.refill();
      box = $('#gr-known'); if (!box) return;
      var km = Math.max.apply(null, h.map(function (x) { return num(x.odo); }));
      box.hidden = false; box.className = 'f wide hint';
      box.innerHTML = '<b>' + esc(t('gr.known', { n: h.length })) + '</b> ' + esc(t('gr.lastat', { km: km ? km.toLocaleString('en-IN') : '–', d: fd(f.date) })) + (nextTxt(h.filter(function (x) { return x.svc; })[0] || {}) ? ' · ' + esc(t('gr.nextsvc')) + ': ' + esc(nextTxt(h.filter(function (x) { return x.svc; })[0])) : '') + ' <button type="button" class="link" data-gr-h>' + esc(t('gr.hist')) + '</button>';
      $('[data-gr-h]', box).addEventListener('click', function () { show('hist', d.reg); });
    });
  }
})();
