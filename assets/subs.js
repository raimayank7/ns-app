/* subscribers.niveshsahayak.in: monthly subscribers of a cable, internet, tiffin, water-can or similar business.
   A subscriber is a saved document of type 'subs' (logic in subscore.js); every month becomes ONE ordinary invoice (made with a tap, never by itself,
   pro-rata for a part month, less any discount and pauses) that reaches the Nivesh Sahayak App's dues, ageing, GST and reports. The page lists on
   opening: bills to make, who has not paid (with a WhatsApp reminder each) and every subscriber. No server. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, S = window.NSSubs;
  var K, DOCS = [], view = 'inv';
  function who() { return String(K.doc().seller.name || '').trim(); }
  function fd(x) { return x ? NS.fmtDate(x) : ''; }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function load() { return NSStore.list('doc').then(function (all) { DOCS = all; return all; }); }
  function holdRow() { return { from: '', to: '', note: '' }; }
  function billingUrl(id) {
    var x = ((window.NS_CFG && NS_CFG.tools) || []).filter(function (y) { return y[0] === 'billing'; })[0];
    if (!x) return '#';
    return (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:' + x[4] + '/' : 'https://' + x[1] + '/') + '?open=' + encodeURIComponent(id);
  }
  function csvDownload(name, rows) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + S.csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  /* a whole month of this subscriber (o) and the first month the bill will be made for (o.first) */
  function sums(d) {
    var o = S.month(Object.assign({}, d, { start: '2000-01-01', stop: '', holds: [] }), '2001-01');
    o.first = isDateOk(d.start) ? S.month(d, S.startMonth(d)) : { skip: 'nostart' }; return o;
  }
  function isDateOk(x) { return S.isDate(x); }
  function li(main, sub, acts, warn) { return '<li' + (warn ? ' class="warn"' : '') + '><div class="gr-m">' + main + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="gr-a">' + acts + '</div></li>'; }
  function btn(a, v, label, cls) { return '<button type="button" class="btn sm' + (cls ? ' ' + cls : '') + '" ' + a + '="' + esc(v) + '">' + esc(label) + '</button>'; }
  function head(v) {
    return '<div class="row gr-tabs">' + [['inv', 'sq.inv'], ['unp', 'sq.unp'], ['all', 'sq.all']].map(function (x) { return '<button type="button" class="btn sm' + (v === x[0] ? ' primary' : '') + '" data-sv="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
  }
  function monthLine(x) {
    var o = x.o, bits = [t('sq.forwhom', { m: S.label(x.ym) }), NS.money(o.total)];
    if (!o.full) bits.push(t('sq.days', { a: o.days, b: o.dim }));
    if (o.disc > 0) bits.push(t('sq.discl', { v: NS.money(o.disc) }));
    if (x.late) bits.push(t('sq.late', { n: x.late }));
    return bits.join(' · ');
  }
  function show(v) {
    view = v || view; var d = $('#sq-dlg'), body = $('[data-sb]', d), today = NS.today(), w = who();
    load().then(function (all) {
      var html = '';
      if (view === 'inv') {
        var due = S.billsDue(all, today, w, 0);
        html = head(view) + '<p class="hint">' + esc(t('sq.invh')) + '</p>' + (due.length ? '<ul class="gr-list">' + due.map(function (x, i) {
          return li('<b>' + esc(x.s.buyer && x.s.buyer.name || '') + '</b> · ' + esc(x.s.plan || ''), esc(monthLine(x)), btn('data-mk', i, t('sq.make'), 'primary') + ' <a class="btn sm" target="_blank" rel="noopener" href="' + esc(S.wa(x.s.buyer && x.s.buyer.phone, S.billText(x, w))) + '">' + esc(t('sq.wa')) + '</a>', x.late > 45);
        }).join('') + '</ul><div class="row"><button type="button" class="btn primary" data-mkall>' + esc(t('sq.makeall', { n: due.length })) + '</button></div>' : '<p>' + esc(t('sq.noinv')) + '</p>');
        body._due = due;
      } else if (view === 'unp') {
        var ow = S.owing(all, w, today, window.NSBooks), tot = ow.reduce(function (a, g) { return a + g.left; }, 0);
        html = head(view) + (ow.length ? '<p class="hint"><b>' + esc(t('sq.owedt', { n: ow.length, v: NS.money(tot) })) + '</b></p><ul class="gr-list">' + ow.map(function (g) {
          var ph = g.s.buyer && g.s.buyer.phone;
          return li('<b>' + esc(g.s.buyer && g.s.buyer.name || '') + '</b> · ' + esc(g.s.plan || ''), esc(g.bills.map(function (u) { return S.label(u.d.subFor); }).join(', ') + ' · ' + NS.money(g.left) + (g.over ? ' · ' + t('sq.over', { n: g.over }) : '')),
            '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(billingUrl(g.bills[0].d.id)) + '">' + esc(t('sq.openinv')) + '</a> <a class="btn sm" target="_blank" rel="noopener" href="' + esc(S.wa(ph, S.dueText(g, w, fd))) + '">' + esc(t('sq.wa')) + '</a>', g.over > 0);
        }).join('') + '</ul><div class="row"><button type="button" class="btn" data-sx="owing">' + esc(t('sq.excelo')) + '</button></div><p class="hint">' + esc(t('sq.unph')) + '</p>' : head(view) + '<p>' + esc(t('sq.nounp')) + '</p>');
      } else {
        var cs = S.mine(all, w).sort(function (a, b) { return String(a.buyer && a.buyer.name).localeCompare(String(b.buyer && b.buyer.name)); }), sm = S.summary(all, w, today);
        html = head(view) + (cs.length ? '<p class="hint">' + esc(t('sq.sumt', { a: sm.live, b: sm.paused, c: sm.stopped, v: NS.money(sm.monthly) })) + '</p><ul class="gr-list">' + cs.map(function (s) {
          var st = S.state(s, today);
          return li('<b>' + esc(s.buyer && s.buyer.name || '') + '</b> · ' + esc(s.no), esc([s.plan, NS.money(num(s.amount)), t('sq.st.' + st), fd(s.start) + (s.stop ? ' – ' + fd(s.stop) : '')].filter(Boolean).join(' · ')), btn('data-open', s.id, t('h.open')), st === 'stopped');
        }).join('') + '</ul><div class="row"><button type="button" class="btn" data-sx="all">' + esc(t('sq.excel')) + '</button></div>' : '<p>' + esc(t('sq.nosub')) + '</p>');
      }
      body.innerHTML = html;
      if (!d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
    });
  }
  /* make the invoices: numbers follow the invoice series of the business, one after the other */
  function makeInvoices(items) {
    return NS.loadCfg().then(function (cfgAll) {
      var all = DOCS.slice(), made = 0;
      return items.reduce(function (p, x) {
        return p.then(function () {
          var no = NS.nextInvNo(all, x.s.seller && x.s.seller.name, x.bill, NS.cfgFor(cfgAll || {}, x.s.seller));
          return NSStore.put('doc', S.makeInvoice(x.s, x, NS.today(), no)).then(function (rec) { all.push(rec); made++; });
        });
      }, Promise.resolve()).then(function () { NS.toast(t('sq.made', { n: made })); NS.folderWrite(false); return made; });
    });
  }
  function badge() {
    load().then(function (all) {
      var w = who(), today = NS.today(), c = { inv: S.billsDue(all, today, w, 0).length, unp: S.owing(all, w, today, window.NSBooks).length };
      [['inv', 'sq.inv'], ['unp', 'sq.unp']].forEach(function (x) { var b = $('[data-sq="' + x[0] + '"]'); if (b) b.textContent = t(x[1]) + (c[x[0]] ? ' (' + c[x[0]] + ')' : ''); });
    }, function () {});
  }

  K = NS.kit({
    type: 'subs', prefix: 'SUB', digits: 3, paper: 'a5', papers: ['a5', 'a4'], copies: 0,
    name: function () { return 'Subscriber Card'; },
    blank: function () { return { plan: '', amount: '', kind: 'plain', gst: '', sac: '', billDay: '1', dueDays: '7', disc: '', discType: 'amt', start: NS.today(), stop: '', billFrom: NS.today().slice(0, 7), firstMonth: 'prorata', lastMonth: 'prorata', holds: [], status: 'active', billTerms: '' }; },
    newRow: function () { return holdRow(); },
    emptyRows: true,
    keepOnNew: function (d) { return { kind: d.kind, gst: d.gst, sac: d.sac, billDay: d.billDay, dueDays: d.dueDays, firstMonth: d.firstMonth, lastMonth: d.lastMonth, paper: d.paper, plan: d.plan, amount: d.amount }; },
    form: function (K) {
      return '<div class="row wide pos-go gr-go"><button type="button" class="btn primary" data-sq="inv">' + esc(t('sq.inv')) + '</button><button type="button" class="btn" data-sq="unp">' + esc(t('sq.unp')) + '</button><button type="button" class="btn" data-sq="all">' + esc(t('sq.all')) + '</button></div>' +
        K.partyCard(t('sq.who'), { nameLbl: t('sq.name'), ph: '', gstin: false, state: false }) +
        K.card(t('sq.plan'), '<div class="fg">' + K.f('plan', t('sq.planl'), { wide: true, ph: t('sq.planph') }) + K.f('amount', t('sq.amount'), { mode: 'decimal', ltr: 1, hint: t('sq.amounth') }) +
          K.f('disc', t('sq.disc'), { mode: 'decimal', ltr: 1 }) + K.f('discType', t('sq.disctype'), { type: 'select', opts: [['amt', t('sq.d.amt')], ['pct', t('sq.d.pct')]], hint: t('sq.disch') }) +
          K.f('kind', t('pos.kind'), { type: 'select', opts: [['tax', t('k.tax')], ['plain', t('k.plain')]], hint: t('sq.kindh') }) + K.f('gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates', show: 'kind=tax', hint: t('sq.gsth') }) + K.f('sac', t('sq.sac'), { mode: 'numeric', max: 8, ltr: 1, show: 'kind=tax' }) +
          '<datalist id="dl-rates"><option value="0"><option value="5"><option value="12"><option value="18"></datalist></div>') +
        K.card(t('sq.dates'), '<div class="fg">' + K.f('start', t('sq.start'), { type: 'date', hint: t('sq.starth') }) + K.f('stop', t('sq.stop'), { type: 'date', hint: t('sq.stoph') }) +
          K.f('billFrom', t('sq.billfrom'), { type: 'month', hint: t('sq.billfromh') }) + K.f('billDay', t('sq.billday'), { mode: 'numeric', ltr: 1, hint: t('sq.billdayh') }) + K.f('dueDays', t('sq.duedays'), { mode: 'numeric', ltr: 1 }) +
          K.f('firstMonth', t('sq.first'), { type: 'select', opts: [['prorata', t('sq.f.prorata')], ['full', t('sq.f.full')], ['free', t('sq.f.free')]] }) + K.f('lastMonth', t('sq.last'), { type: 'select', opts: [['prorata', t('sq.f.prorata')], ['full', t('sq.f.full')]] }) +
          K.f('status', t('am.state'), { type: 'select', opts: [['active', t('am.s.active')], ['cancelled', t('am.s.cancelled')]] }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div></div>') +
        K.card(t('sq.holds'), '<p class="hint">' + esc(t('sq.holdsh')) + '</p>' + K.list('holds', t('sq.addhold'))) +
        K.numCard('', t('sq.numlg')) + K.bizCard({}) + K.lookCard(K.f('billTerms', t('sq.terms'), { type: 'textarea', wide: true, rows: 3 }));
    },
    rows: {
      holds: function (x, i, K) { return K.rf('holds', i, 'from', t('sq.hfrom'), { type: 'date' }) + K.rf('holds', i, 'to', t('sq.hto'), { type: 'date' }) + K.rf('holds', i, 'note', t('sq.hnote'), { cls: 'it-d' }); }
    },
    input: function (p, el, d, K) {
      if (p === 'kind' || p === 'status') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== 'supply' && k !== d.kind) { d.kind = k; K.refill(); } }
      if (p === 'seller.name') badge();
    },
    sums: sums,
    edSums: function (d, o) {
      if (o.first.skip === 'nostart') return '<span class="warn">' + esc(t('sq.v.start')) + '</span>';
      var f = o.first;
      return (f.skip ? '' : '<span>' + esc(t('sq.s.first', { m: S.label(f.ym), v: NS.money(f.total), a: f.days, b: f.dim })) + '</span>') + (o.disc > 0 ? '<span>' + esc(t('sq.s.disc', { v: NS.money(o.disc) })) + '</span>' : '') + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b>' + esc(t('sq.s.month', { v: NS.money(o.total) })) + '</b>';
    },
    validate: function (d) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('sq.v.name')]);
      if (!String(d.plan || '').trim()) p.push(['k-plan', t('sq.v.plan')]);
      if (!(num(d.amount) > 0)) p.push(['k-amount', t('sq.v.amount')]);
      if (!d.start) p.push(['k-start', t('sq.v.start')]);
      if (d.start && d.stop && d.stop < d.start) p.push(['k-stop', t('sq.v.stop')]);
      if (d.discType === 'pct' && num(d.disc) > 100) p.push(['k-disc', t('sq.v.disc')]);
      if (num(d.disc) < 0 || num(d.amount) < 0) p.push(['k-disc', t('sq.v.neg')]);
      if (num(d.billDay) < 0 || num(d.billDay) > 28) p.push(['k-billDay', t('sq.v.day')]);
      if ((d.holds || []).some(function (h) { return h.from && h.to && h.to < h.from; })) p.push(['k-start', t('sq.v.hold')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.kind === 'tax' && (num(d.gst) < 0 || num(d.gst) > 40)) p.push(['k-gst', t('sq.v.gst')]);
      return p;
    },
    record: function (rec) { rec.withGst = rec.kind === 'tax'; rec.items = []; rec.holds = (rec.holds || []).filter(function (h) { return h.from && h.to; }); },
    saved: function (rec) {
      var b = rec.buyer; if (b && String(b.name || '').trim()) NSStore.list('party').then(function (all) {
        var hit = all.filter(function (x) { return S.key(x.name) === S.key(b.name); })[0];
        if (!hit) return NSStore.put('party', { name: b.name.trim(), addr: b.addr || '', phone: b.phone || '', gstin: '', state: '', role: 'customer' });
        if (b.phone && !hit.phone) return NSStore.put('party', Object.assign(hit, { phone: b.phone }));
      });
      load().then(badge);
    },
    load: function (d) { if (!d.holds) d.holds = []; },
    copyOf: function (d) { d.stop = ''; d.holds = []; d.status = 'active'; d.start = NS.today(); d.billFrom = NS.today().slice(0, 7); d.buyer = { name: '', addr: '', city: '', pin: '', state: '', gstin: '', phone: '' }; },
    copyLbl: 'sq.again',
    histName: function (d) { return (d.buyer && d.buyer.name || '') + ' · ' + (d.plan || ''); },
    histText: function (d) { return [d.plan, d.buyer && d.buyer.phone, d.buyer && d.buyer.addr].join(' '); },
    histPill: function (d) { var st = S.state(d, NS.today()); return ' <span class="pill' + (st === 'live' ? ' ok' : '') + '">' + esc(t('sq.st.' + st)) + '</span> <small>' + esc(NS.money(num(d.amount))) + '</small>'; },
    shareText: function (d) { return '\n' + (d.plan || '') + ' · ' + NS.money(num(d.amount)) + ' a month · from ' + fd(d.start); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var tax = d.kind === 'tax', b = d.buyer || {};
      var meta = [['Subscriber No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Connection from', fd(d.start)], d.stop ? ['Stopped on', fd(d.stop)] : null, ['Bill dated', 'Day ' + (Math.round(num(d.billDay)) || 1) + ' of each month'], num(d.dueDays) ? ['Payment due', Math.round(num(d.dueDays)) + ' days after the bill'] : null];
      var rows = [['Monthly amount', NS.money(num(d.amount))], num(d.disc) ? ['Discount', d.discType === 'pct' ? num(d.disc) + '%' : NS.money(num(d.disc))] : null, tax ? ['GST', num(d.gst) + '%'] : null, ['Bill for a full month', NS.money(o.total || 0), 'grand']];
      var holds = (d.holds || []).filter(function (h) { return h.from && h.to; });
      return K.open(d, 'subs') + K.head(d, 'SUBSCRIBER CARD', label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Subscriber') + '</div>' +
        '<div class="nt"><div><h4>Plan</h4><p>' + esc(d.plan || '') + '</p></div></div><div class="foot"><div class="foot-l"><p class="small">A part month is billed for the days the service ran (' + esc({ prorata: 'from the start date', full: 'in full', free: 'free' }[d.firstMonth || 'prorata']) + ' in the first month; ' + esc({ prorata: 'to the stop date', full: 'in full' }[d.lastMonth || 'prorata']) + ' in the last month).</p>' +
        (holds.length ? '<p class="small"><b>Paused:</b> ' + holds.map(function (h) { return fd(h.from) + ' – ' + fd(h.to) + (h.note ? ' (' + esc(h.note) + ')' : ''); }).join('; ') + '</p>' : '') + (d.billTerms ? '<p class="small">' + esc(d.billTerms).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot(rows) + '</div></div>' +
        '<div class="signs">' + K.blankSign('Subscriber agrees to the plan above.', 'Subscriber’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed, K0) {
      K = K0;
      ['inv', 'unp', 'all'].forEach(function (v) { var b = $('[data-sq="' + v + '"]', ed); if (b) b.addEventListener('click', function () { show(v); }); });
      badge();
    },
    ready: function (K0) {
      K = K0; var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== 'supply' && k !== d.kind) { d.kind = k; K.refill(); } }
      load().then(badge, function () {});
      if ($('#sq-dlg')) return;
      var x = NS.el('dialog', { id: 'sq-dlg', 'aria-labelledby': 'sq-dlg-h' }, '<div class="dlg-h"><h2 id="sq-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-sb></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); badge(); });
      x.addEventListener('click', function (e) {
        var o = e.target.closest('[data-open]'), v = e.target.closest('[data-sv]'), mk = e.target.closest('[data-mk]'), all = e.target.closest('[data-mkall]'), ax = e.target.closest('[data-sx]'), body = $('[data-sb]', x);
        if (o) NSStore.get('doc', o.getAttribute('data-open')).then(function (r) { if (r) { x.close(); K.openDoc(r, false); } });
        else if (v) show(v.getAttribute('data-sv'));
        else if (mk) makeInvoices([body._due[+mk.getAttribute('data-mk')]]).then(function () { show('inv'); badge(); }, function (er) { NS.toast(er.message, 'bad'); });
        else if (all) makeInvoices(body._due).then(function () { show('inv'); badge(); }, function (er) { NS.toast(er.message, 'bad'); });
        else if (ax) load().then(function (all2) { var today = NS.today(); if (ax.getAttribute('data-sx') === 'owing') csvDownload('who-has-not-paid-' + today + '.csv', S.owingRows(all2, who(), today, window.NSBooks)); else csvDownload('subscribers-' + today + '.csv', S.subscriberRows(all2, who(), today)); });
      });
      function names() { $('h2', x).textContent = t('sq.deskt'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', function () { names(); if (x.open) show(); });
    }
  });
})();
