/* amc.niveshsahayak.in: repeating service contracts and subscriptions (annual maintenance contracts, monthly services, yearly renewals).
   A contract is a saved document of type 'amc'; every billing period becomes ONE ordinary invoice (made with a tap, never by itself) that
   reaches the Nivesh Sahayak App's dues, GST and reports. The page lists on opening: invoices to make, renewals due, service visits due
   and unpaid contract invoices, each with a WhatsApp text. No server. The logic is in engine/amccore.js. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, A = window.NSAmc;
  var K, DOCS = [], view = 'inv', raise = '0';
  function who() { return String(K.doc().seller.name || '').trim(); }
  function fd(x) { return NS.fmtDate(x); }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function load() { return NSStore.list('doc').then(function (all) { DOCS = all; return all; }); }
  function billingUrl(id) {
    var x = ((window.NS_CFG && NS_CFG.tools) || []).filter(function (y) { return y[0] === 'billing'; })[0];
    if (!x) return '#';
    return (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:' + x[4] + '/' : 'https://' + x[1] + '/') + '?open=' + encodeURIComponent(id);
  }
  function csvDownload(name, rows) {
    var blob = new Blob(['﻿' + A.csv(rows)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function sums(d) {
    var p = A.periods(d), o = { periods: p.length, per: p.length ? p[0].total : 0, taxable: p.length ? p[0].taxable : 0, tax: p.length ? p[0].tax : 0, total: A.value(d), rows: p };
    return o;
  }
  function freqName(c) { return t('am.f.' + (c.freq || 'month')); }

  /* ---------- the desk dialog ---------- */
  function head(v) {
    var tabs = [['inv', 'am.inv'], ['ren', 'am.ren'], ['vis', 'am.vis'], ['unp', 'am.unp'], ['all', 'am.all']];
    return '<div class="row gr-tabs">' + tabs.map(function (x) { return '<button type="button" class="btn sm' + (v === x[0] ? ' primary' : '') + '" data-av="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
  }
  function li(main, sub, acts, warn) { return '<li' + (warn ? ' class="warn"' : '') + '><div class="gr-m">' + main + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="gr-a">' + acts + '</div></li>'; }
  function btn(a, v, label, cls) { return '<button type="button" class="btn sm' + (cls ? ' ' + cls : '') + '" ' + a + '="' + esc(v) + '">' + esc(label) + '</button>'; }
  function show(v) {
    view = v || view; var d = $('#am-dlg'), body = $('[data-ab]', d), today = NS.today(), w = who();
    load().then(function (all) {
      var html = '', shop = w;
      if (view === 'inv') {
        var due = A.invoicesDue(all, today, w, 0);
        html = head(view) + '<p class="hint">' + esc(t('am.invh')) + '</p>' + (due.length ? '<ul class="gr-list">' + due.map(function (x, i) {
          return li('<b>' + esc(x.c.buyer && x.c.buyer.name || '') + '</b> · ' + esc(x.c.title || ''), esc(t('am.period', { k: x.p.k + '/' + A.periods(x.c).length, from: fd(x.p.from), to: fd(x.p.to) }) + ' · ' + NS.money(x.p.total) + (x.late ? ' · ' + t('am.late', { n: x.late }) : '')), btn('data-mk', i, t('am.make'), 'primary'), x.late > 30);
        }).join('') + '</ul><div class="row"><button type="button" class="btn primary" data-mkall>' + esc(t('am.makeall', { n: due.length })) + '</button></div>' : '<p>' + esc(t('am.noinv')) + '</p>');
        body._due = due;
      } else if (view === 'ren') {
        var rn = A.renewalsDue(all, today, w);
        html = head(view) + '<p class="hint">' + esc(t('am.renh')) + '</p><div class="f"><label for="am-raise">' + esc(t('am.raise')) + '</label><input id="am-raise" inputmode="decimal" dir="ltr" value="' + esc(raise) + '"></div>' + (rn.length ? '<ul class="gr-list">' + rn.map(function (x, i) {
          var ph = x.c.buyer && x.c.buyer.phone;
          return li('<b>' + esc(x.c.buyer && x.c.buyer.name || '') + '</b> · ' + esc(x.c.title || ''), esc((x.left >= 0 ? t('am.ends', { d: fd(x.end) }) : t('am.ended', { d: fd(x.end) })) + ' · ' + NS.money(A.value(x.c))), btn('data-rn', x.c.id, t('am.renew'), 'primary') + ' <a class="btn sm" target="_blank" rel="noopener" href="' + esc(A.wa(ph, A.renewText(x, shop, fd))) + '">' + esc(t('gr.wa')) + '</a>', x.left < 0);
        }).join('') + '</ul>' : '<p>' + esc(t('am.noren')) + '</p>');
      } else if (view === 'vis') {
        var vs = A.visitsDue(all, today, w, 7);
        html = head(view) + '<p class="hint">' + esc(t('am.visith')) + '</p>' + (vs.length ? '<ul class="gr-list">' + vs.map(function (x) {
          var ph = x.c.buyer && x.c.buyer.phone;
          return li('<b>' + esc(x.c.buyer && x.c.buyer.name || '') + '</b> · ' + esc(x.c.title || ''), esc(t('am.visitn', { i: x.v.i, no: x.c.no }) + ' · ' + fd(x.v.date) + (x.late ? ' · ' + t('am.over', { n: x.late }) : '') + (x.behind > 1 ? ' · ' + t('am.behind', { n: x.behind }) : '') + (x.c.site ? ' · ' + x.c.site : '')),
            btn('data-vd', x.c.id, t('am.done'), 'primary') + ' <a class="btn sm" target="_blank" rel="noopener" href="' + esc(A.wa(ph, A.visitText(x, shop, fd))) + '">' + esc(t('gr.wa')) + '</a>', x.late > 0);
        }).join('') + '</ul>' : '<p>' + esc(t('am.novis')) + '</p>');
      } else if (view === 'unp') {
        var up = A.unpaid(all, w, today);
        html = head(view) + (up.length ? '<ul class="gr-list">' + up.map(function (u) {
          return li('<b>' + esc(u.d.buyer && u.d.buyer.name || '') + '</b> · ' + esc(u.d.no), esc(fd(u.d.date) + ' · ' + NS.money(num(u.d.total)) + (u.over ? ' · ' + t('am.over', { n: u.over }) : '')),
            '<a class="btn sm" href="' + esc(billingUrl(u.d.id)) + '" target="_blank" rel="noopener">' + esc(t('am.openinv')) + '</a> <a class="btn sm" target="_blank" rel="noopener" href="' + esc(A.wa(u.d.buyer && u.d.buyer.phone, A.dueText(u, shop, fd))) + '">' + esc(t('gr.wa')) + '</a>', u.over > 0);
        }).join('') + '</ul>' : '<p>' + esc(t('am.nounp')) + '</p>');
      } else {
        var cs = A.mine(all, w).sort(function (a, b) { return String(b.start).localeCompare(String(a.start)); });
        html = head(view) + (cs.length ? '<ul class="gr-list">' + cs.map(function (c) {
          var s = A.summary(c, all, today);
          return li('<b>' + esc(c.buyer && c.buyer.name || '') + '</b> · ' + esc(c.no), esc([c.title, t('am.st.' + s.state), t('am.billed', { a: s.billed, b: s.periods }), t('am.visitsl', { a: s.visits, b: s.plan }), fd(c.start) + ' – ' + fd(s.end)].filter(Boolean).join(' · ')), btn('data-open', c.id, t('h.open')));
        }).join('') + '</ul><div class="row"><button type="button" class="btn" data-ax="all">' + esc(t('am.excel')) + '</button></div>' : '<p>' + esc(t('am.nocon')) + '</p>');
      }
      body.innerHTML = html;
      var rz = $('#am-raise', body); if (rz) rz.addEventListener('input', function () { raise = rz.value; });
      if (!d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
    });
  }
  /* make the invoices: numbers follow the invoice series of the business, one after the other */
  function makeInvoices(items) {
    var today = NS.today();
    return NS.loadCfg().then(function (cfgAll) {
      var all = DOCS.slice(), made = 0;
      return items.reduce(function (p, x) {
        return p.then(function () {
          var no = NS.nextInvNo(all, x.c.seller && x.c.seller.name, today, NS.cfgFor(cfgAll || {}, x.c.seller));
          return NSStore.put('doc', A.makeInvoice(x.c, x.p, today, no)).then(function (rec) { all.push(rec); made++; });
        });
      }, Promise.resolve()).then(function () { NS.toast(t('am.made', { n: made })); NS.folderWrite(false); return made; });
    });
  }
  function badge() {
    load().then(function (all) {
      var w = who(), today = NS.today(), c = { inv: A.invoicesDue(all, today, w, 0).length, ren: A.renewalsDue(all, today, w).length, vis: A.visitsDue(all, today, w, 7).length, unp: A.unpaid(all, w, today).filter(function (u) { return u.over > 0; }).length };
      [['inv', 'am.inv'], ['ren', 'am.ren'], ['vis', 'am.vis'], ['unp', 'am.unp']].forEach(function (x) { var b = $('[data-am="' + x[0] + '"]'); if (b) b.textContent = t(x[1]) + (c[x[0]] ? ' (' + c[x[0]] + ')' : ''); });
    }, function () {});
  }

  K = NS.kit({
    type: 'amc', prefix: 'AMC', digits: 4, paper: 'a4', papers: ['a4'], copies: 0,
    name: function () { return 'Contract'; },
    blank: function () { return { title: '', site: '', start: NS.today(), termMonths: 12, freq: 'quarter', billWhen: 'advance', amount: '', gst: 18, sac: '9987', visits: 0, credit: 15, billed0: '', kind: 'plain', status: 'active', visitsDone: [], terms: 'Visits are made during working hours on a day agreed with the customer. Parts and consumables are charged extra unless written above. The customer gives access to the equipment. Either side may end the contract with 30 days’ written notice.' }; },
    keepOnNew: function (d) { return { kind: d.kind, terms: d.terms, freq: d.freq, billWhen: d.billWhen, gst: d.gst, sac: d.sac, credit: d.credit }; },
    form: function (K) {
      return '<div class="row wide pos-go gr-go"><button type="button" class="btn" data-am="inv">' + esc(t('am.inv')) + '</button><button type="button" class="btn" data-am="ren">' + esc(t('am.ren')) + '</button>' +
          '<button type="button" class="btn" data-am="vis">' + esc(t('am.vis')) + '</button><button type="button" class="btn" data-am="unp">' + esc(t('am.unp')) + '</button><button type="button" class="btn" data-am="all">' + esc(t('am.all')) + '</button></div>' +
        K.partyCard(t('am.cust')) +
        K.card(t('am.contract'), '<div class="fg">' + K.f('title', t('am.title'), { wide: true, ph: t('am.titleph') }) + K.f('site', t('am.site'), { wide: true }) +
          K.f('start', t('am.start'), { type: 'date' }) + K.f('termMonths', t('am.term'), { mode: 'numeric', ltr: 1 }) +
          K.f('freq', t('am.freq'), { type: 'select', opts: ['month', 'quarter', 'half', 'year'].map(function (x) { return [x, t('am.f.' + x)]; }) }) +
          K.f('billWhen', t('am.when'), { type: 'select', opts: [['advance', t('am.w.advance')], ['arrears', t('am.w.arrears')]] }) +
          K.f('amount', t('am.amount'), { mode: 'decimal', ltr: 1 }) + K.f('kind', t('pos.kind'), { type: 'select', opts: [['tax', t('k.tax')], ['plain', t('k.plain')]] }) +
          K.f('gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates', show: 'kind=tax' }) + K.f('sac', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1, show: 'kind=tax' }) +
          K.f('visits', t('am.visits'), { mode: 'numeric', ltr: 1 }) + K.f('credit', t('am.credit'), { mode: 'numeric', ltr: 1 }) +
          K.f('billed0', t('am.billed0'), { mode: 'numeric', ltr: 1, hint: t('am.billed0h') }) + K.f('status', t('am.state'), { type: 'select', opts: [['active', t('am.s.active')], ['cancelled', t('am.s.cancelled')]] }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div></div><datalist id="dl-rates"><option value="0"><option value="5"><option value="18"><option value="40"></datalist>') +
        K.numCard('', t('am.numlg')) + K.bizCard({}) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true, rows: 4 }));
    },
    rows: {},
    input: function (p, el, d, K) {
      if (p === 'kind' || p === 'status') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== 'supply' && k !== d.kind) { d.kind = k; K.refill(); } }
      if (p === 'seller.name') badge();
    },
    sums: sums,
    edSums: function (d, o) {
      if (!o.periods) return '<span class="warn">' + esc(A.fits(d) ? t('am.v.start') : t('am.v.fit')) + '</span>';
      return '<span>' + esc(t('am.sum.n', { n: o.periods })) + '</span><span>' + esc(t('am.sum.per', { v: NS.money(o.per) })) + '</span><b>' + esc(t('am.sum.val', { v: NS.money(o.total) })) + '</b><span>' + esc(t('am.ends', { d: fd(A.endOf(d)) })) + '</span>';
    },
    validate: function (d) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('am.v.cust')]);
      if (!String(d.title || '').trim()) p.push(['k-title', t('am.v.title')]);
      if (!d.start) p.push(['k-start', t('am.v.start')]);
      if (d.start && !A.fits(d)) p.push(['k-termMonths', t('am.v.fit')]);
      if (!(num(d.amount) > 0)) p.push(['k-amount', t('am.v.amount')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    record: function (rec) { rec.withGst = rec.kind === 'tax'; rec.items = []; delete rec._renew; },
    saved: function () { load().then(badge); },
    load: function (d) { if (!d.visitsDone) d.visitsDone = []; },
    copyOf: function (d, rec) { d.visitsDone = []; d.billed0 = ''; d.status = 'active'; if (rec && rec._renew) { d.renewOf = rec.renewOf; d.start = rec.start; } else delete d.renewOf; delete d._renew; },
    copyLbl: 'am.again',
    histName: function (d) { return (d.title || '') + ' · ' + (d.buyer && d.buyer.name || ''); },
    histText: function (d) { return [d.title, d.site, d.buyer && d.buyer.phone].join(' '); },
    histPill: function (d) { return ' <span class="pill' + (d.status === 'cancelled' ? '' : ' ok') + '">' + esc(t('am.s.' + (d.status || 'active'))) + '</span>'; },
    shareText: function (d, o) { return '\n' + (d.title || '') + ' · ' + fd(d.start) + ' – ' + fd(A.endOf(d)) + ' · ' + freqName(d) + ' ' + NS.money(o.per); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var tax = d.kind === 'tax', b = d.buyer, e = A.endOf(d), pl = A.visitPlan(d);
      var meta = [['Contract No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Starts', NS.fmtDate(d.start)], ['Ends', e ? NS.fmtDate(e) : ''],
        ['Billing', esc({ month: 'Every month', quarter: 'Every 3 months', half: 'Every 6 months', year: 'Every year' }[d.freq] || '') + (d.billWhen === 'arrears' ? ', in arrears' : ', in advance')],
        num(d.visits) ? ['Service visits', esc(String(Math.round(num(d.visits)))) + ' a year (' + pl.length + ' in this term)'] : null, num(d.credit) ? ['Payment due', esc(String(Math.round(num(d.credit)))) + ' days from the invoice'] : null,
        d.status === 'cancelled' ? ['Status', 'Cancelled'] : null];
      var head = K.open(d, 'amc') + K.head(d, 'MAINTENANCE CONTRACT', label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Customer') + '</div>';
      var scope = '<div class="nt"><div><h4>Service covered</h4><p>' + esc(d.title || '') + (d.site ? '<br>Site / equipment: ' + esc(d.site) : '') + '</p></div></div>';
      var rows = o.rows.length ? '<table class="lines"><thead><tr><th>#</th><th class="l">Period</th><th class="n">Bill on</th><th class="n">' + (tax ? 'Taxable' : 'Amount') + '</th>' + (tax ? '<th class="n">GST ' + esc(String(num(d.gst))) + '%</th><th class="n">Total</th>' : '') + '</tr></thead><tbody>' +
        o.rows.map(function (p) { return '<tr><td>' + p.k + '</td><td class="l">' + NS.fmtDate(p.from) + ' – ' + NS.fmtDate(p.to) + '</td><td class="n">' + NS.fmtDate(p.bill) + '</td><td class="n">' + NS.money(p.taxable, false) + '</td>' + (tax ? '<td class="n">' + NS.money(p.tax, false) + '</td><td class="n">' + NS.money(p.total, false) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' : '';
      var vis = pl.length ? '<p class="small"><b>Planned service visits:</b> ' + pl.map(function (x) { return NS.fmtDate(x.date); }).join(', ') + ' (dates are approximate; we will agree each visit with you).</p>' : '';
      return head + scope + rows + '<div class="foot"><div class="foot-l">' + K.words(o.total) + vis + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot([['Per period', NS.money(o.per)], ['Periods', String(o.periods)], ['Contract value', NS.money(o.total), 'grand']]) + '</div></div>' +
        (d.terms ? '<div class="nt"><div><h4>Terms</h4><p>' + esc(d.terms).replace(/\n/g, '<br>') + '</p></div></div>' : '') +
        '<div class="signs">' + K.blankSign('Accepted by the customer.', 'Customer’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed, K0) {
      K = K0;
      ['inv', 'ren', 'vis', 'unp', 'all'].forEach(function (v) { var b = $('[data-am="' + v + '"]', ed); if (b) b.addEventListener('click', function () { show(v); }); });
      badge();
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== 'supply' && k !== d.kind) { d.kind = k; K.refill(); } }
      load().then(badge, function () {});
      if ($('#am-dlg')) return;
      var x = NS.el('dialog', { id: 'am-dlg', 'aria-labelledby': 'am-dlg-h' }, '<div class="dlg-h"><h2 id="am-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-ab></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); badge(); });
      x.addEventListener('click', function (e) {
        var o = e.target.closest('[data-open]'), v = e.target.closest('[data-av]'), mk = e.target.closest('[data-mk]'), all = e.target.closest('[data-mkall]'), rn = e.target.closest('[data-rn]'), vd = e.target.closest('[data-vd]'), ax = e.target.closest('[data-ax]');
        var body = $('[data-ab]', x);
        if (o) NSStore.get('doc', o.getAttribute('data-open')).then(function (r) { if (r) { x.close(); K.openDoc(r, false); } });
        else if (v) show(v.getAttribute('data-av'));
        else if (mk) makeInvoices([body._due[+mk.getAttribute('data-mk')]]).then(function () { show('inv'); badge(); }, function (er) { NS.toast(er.message, 'bad'); });
        else if (all) makeInvoices(body._due).then(function () { show('inv'); badge(); }, function (er) { NS.toast(er.message, 'bad'); });
        else if (rn) NSStore.get('doc', rn.getAttribute('data-rn')).then(function (c) { if (!c) return; var nx = A.renew(c, raise); nx._renew = 1; x.close(); K.openDoc(Object.assign(nx, { seller: c.seller }), true); NS.toast(t('am.renewing')); });
        else if (vd) NSStore.get('doc', vd.getAttribute('data-vd')).then(function (c) { if (!c) return; c.visitsDone = (c.visitsDone || []).concat([{ date: NS.today() }]); return NSStore.put('doc', c).then(function () { NS.toast(t('am.vdone')); show('vis'); badge(); }); });
        else if (ax) load().then(function (all2) { csvDownload('contracts-' + NS.today() + '.csv', A.contractRows(all2, who(), NS.today())); });
      });
      function names() { $('h2', x).textContent = t('am.deskt'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', function () { names(); if (x.open) show(); });
    }
  });
})();
