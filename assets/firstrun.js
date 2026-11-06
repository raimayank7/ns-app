/* First-run setup and feature switches of the INSTALLED Nivesh Sahayak App (after app.js and the files that add its screens).
   Only when the App runs as an installed app (display-mode standalone / window-controls-overlay, iPhone navigator.standalone;
   tests: ?installed=1 remembers it for the tab, ?installed=0 forgets it). Browser visitors and the door sites see no change.
     setup      before first use, once per business: type of business, legal form (biz.btype, the same field as My data, fahub.js),
                name, state, GST registration (biz.reg); optional address, GSTIN (GST portal fill, gstfetch.js), bank, UPI, logo.
                A business already in the data home is filled in, so the user only confirms. biz.kind = the type of business.
     features   settings.features[<biz id>] = { kind, sw: { <feature>: true|false }, at } in the data home (meta 'settings').
                A feature missing from sw follows the recommendation for the business (REC), so features added later fit in.
     off        only HIDES: menu and tab-bar entries, quick-add buttons, side-menu tools, New document choices and search results
                (one style sheet, NS.featHidden for the search box in desk.js). Nothing is deleted, the books count every record,
                a direct link still opens the screen, and switching it on again shows everything.
   Settings › Additional features (#features): a switch for each feature, grouped, recommended ones marked. */
(function () {
  'use strict';
  /* ---------- what can be switched: group, [feature, name key, what it hides] ----------
     sec = App screens (data-sec), form = quick-add forms (data-form), ic = side-menu tools (data-ic; d-<site> also leaves New document),
     href = links inside a screen. Dashboard, Sales, Money in and out, Dues and Parties are always on. */
  var CAT = [
    ['sell', [['buy', 'app.buy', { sec: ['buy'], form: ['pbill', 'pret', 'exp'], ic: ['t-purchase', 't-expenses'] }],
      ['orders', 'fr.f_orders', { ic: ['d-proforma', 'd-sales-order', 'd-challan', 'd-purchase-order'] }],
      ['repeat', 'app.repeat', { sec: ['repeat'] }], ['export', 'nav.exp', { ic: ['t-export-invoice'] }]]],
    ['money', [['books', 'app.books', { sec: ['books'], ic: ['t-cash-book'] }], ['chq', 'app.chq', { sec: ['chq'], ic: ['t-cheque'] }],
      ['bankreco', 'nav.bankreco', { ic: ['t-bank-reco'] }], ['khata', 'nav.khata', { ic: ['t-khata'] }]]],
    ['stock', [['stock', 'nav.stock', { ic: ['t-stock', 't-price-list'] }], ['godown', 'app.b2gd', { sec: ['b2gd'] }], ['barcode', 'nav.barcode', { ic: ['t-barcode'] }]]],
    ['mfg', [['make', 'app.b2make', { sec: ['b2make'] }], ['job', 'app.b2job', { sec: ['b2job'] }], ['mfgac', 'fm.t_mfg', { href: ['#fam/mfg'] }]]],
    ['acct', [['reports', 'app.reports', { sec: ['reports'] }], ['fin', 'app.fin', { sec: ['fin', 'capl'], ic: ['t-profit-loss'] }], ['jv', 'app.b2jv', { sec: ['b2jv'] }],
      ['fa', 'app.b2fa', { sec: ['b2fa'] }], ['profit', 'app.b2profit', { sec: ['b2profit'] }], ['year', 'app.b2year', { sec: ['b2year'] }],
      ['grp', 'app.grp', { sec: ['grp'] }], ['tally', 'nav.tally', { ic: ['t-tally'] }]]],
    ['gst', [['gstr', 'fr.f_gstr', { ic: ['t-gstr1', 't-gstr3b', 't-gstr2b', 't-gst-calendar'] }], ['cmp08', 'nav.cmp08', { ic: ['t-cmp08'] }],
      ['einv', 'fr.f_einv', { ic: ['t-e-invoice', 't-eway-bill'] }], ['tds', 'nav.tds', { ic: ['t-tds'] }], ['gsttools', 'fr.f_gsttools', { ic: ['t-hsn', 't-gstin', 'd-self-invoice'] }]]],
    ['ind', [['pos', 'nav.pos', { ic: ['t-pos'] }], ['pharmacy', 'nav.pharmacy', { ic: ['t-pharmacy'] }], ['resto', 'nav.restaurant', { ic: ['t-restaurant'] }],
      ['bilty', 'nav.bilty', { ic: ['t-bilty'] }], ['rabill', 'fr.f_rabill', { ic: ['t-contractor-bill'] }], ['fee', 'nav.feereceipt', { ic: ['t-fee-receipt'] }], ['jobcard', 'nav.jobcard', { ic: ['t-job-card'] }]]],
    ['staff', [['sman', 'app.b2sman', { sec: ['b2sman'] }], ['salary', 'nav.salary', { ic: ['d-salary-slip'] }]]]
  ];
  var FEAT = {}; CAT.forEach(function (g) { g[1].forEach(function (f) { FEAT[f[0]] = f; }); });

  /* ---------- what each business gets ON at the start (owner's idea: only what the business needs) ---------- */
  var KINDS = ['shop', 'whole', 'mfg', 'svc', 'resto', 'pharma', 'trans', 'contr', 'school', 'other'];
  var BASE = ['buy', 'books', 'reports'];
  var REC = {
    shop: ['stock', 'barcode', 'khata', 'chq', 'pos'],
    whole: ['orders', 'stock', 'godown', 'chq', 'bankreco', 'grp', 'sman', 'einv'],
    mfg: ['orders', 'stock', 'godown', 'make', 'job', 'mfgac', 'fin', 'chq', 'bankreco', 'einv'],
    svc: ['repeat', 'tds', 'bankreco'],
    resto: ['resto', 'stock'],
    pharma: ['pharmacy', 'stock', 'barcode', 'khata'],
    trans: ['bilty', 'chq', 'tds', 'bankreco'],
    contr: ['rabill', 'orders', 'tds', 'chq', 'fa'],
    school: ['fee', 'salary', 'repeat'],
    other: []
  };
  var FORMS = ['prop', 'firm', 'llp', 'co', 'npo'], REGS = ['regular', 'comp', 'unreg'];
  function rec(kind, reg, btype) {
    var o = {};
    BASE.concat(REC[kind] || []).forEach(function (f) { o[f] = 1; });
    if (reg === 'regular' || reg === 'sez') { o.gstr = 1; o.gsttools = 1; } else { delete o.einv; if (reg === 'comp') o.cmp08 = 1; }
    if (btype && btype !== 'prop') o.fin = 1;   /* a firm, LLP, company or trust needs its final accounts (capital, appropriation, I&E) */
    if (btype === 'co') { o.fa = 1; o.jv = 1; o.year = 1; }
    return o;
  }
  NS.featMap = { CAT: CAT, KINDS: KINDS, rec: rec };   /* read only: the feature map for tests (scripts/test_firstrun.js) */

  var A = window.NSApp, appEl = document.getElementById('app');
  if (!A || !appEl || appEl.getAttribute('data-secs')) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function T(k, v) { return NS.t('fr.' + k, v); }

  /* ---------- installed or not ---------- */
  function installed() {
    try {
      var q = new URLSearchParams(location.search).get('installed');
      if (q === '1') sessionStorage.setItem('ns-fr-installed', '1'); else if (q === '0') sessionStorage.removeItem('ns-fr-installed');
      if (sessionStorage.getItem('ns-fr-installed') === '1') return true;
    } catch (e) {}
    return matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay)').matches || navigator.standalone === true;
  }
  if (!installed()) return;

  /* ---------- the data: current business, its switches ---------- */
  var SET = {}, BIZL = [], CUR = null, ENTRY = null, HIDESEL = '', FORMOFF = {};
  function pickBiz() {
    var want = NS.curBiz();
    return BIZL.filter(function (b) { return b.id === want; })[0] || BIZL.filter(function (b) { return b.id === SET.defBiz; })[0] || BIZL[0] || null;
  }
  function load() {
    return Promise.all([NSStore.list('biz'), NSStore.meta('settings')]).then(function (r) {
      BIZL = r[0] || []; SET = r[1] || {}; CUR = pickBiz();
      ENTRY = CUR && CUR.id && SET.features && SET.features[CUR.id] || null;
    });
  }
  function isOn(f, e) {
    e = e || ENTRY; if (!e) return true;
    if (e.sw && f in e.sw) return !!e.sw[f];
    return !!rec(e.kind, CUR && CUR.reg, CUR && CUR.btype)[f];
  }
  function saveEntry(id, entry) {   /* read the newest settings first: My data and the App's year end write the same record */
    return NSStore.meta('settings').then(function (s) {
      s = s || {}; s.features = s.features || {}; s.features[id] = entry; SET = s;
      return NSStore.meta('settings', s);
    });
  }

  /* ---------- hide what is off ---------- */
  function apply() {
    var sel = [], off = {}; FORMOFF = {};
    if (ENTRY && !(CUR && CUR.sample)) Object.keys(FEAT).forEach(function (f) {
      if (isOn(f)) return;
      var h = FEAT[f][2];
      (h.sec || []).forEach(function (s) { off[s] = 1; sel.push('a[data-sec="' + s + '"]'); });
      (h.form || []).forEach(function (s) { FORMOFF[s] = 1; sel.push('.quick [data-form="' + s + '"]'); });
      (h.ic || []).forEach(function (s) { sel.push('#ns-side a[data-ic="' + s + '"]'); if (s.indexOf('d-') === 0) sel.push('select[data-newdoc] option[value="' + s.slice(2) + '"]'); });
      (h.href || []).forEach(function (s) { sel.push('[data-pane] a[href="' + s + '"]'); });
    });
    HIDESEL = sel.join(',');
    var st = document.getElementById('nsf-hide');
    if (!st) { st = document.createElement('style'); st.id = 'nsf-hide'; document.head.appendChild(st); }
    st.textContent = HIDESEL ? HIDESEL + '{display:none!important}' : '';
    document.documentElement.classList.toggle('nsf-on', !!HIDESEL);
    syncTab(off);
  }
  /* the search box (desk.js) leaves out what is hidden: a side-menu link (element) or a quick-add form (its name) */
  NS.featHidden = function (x) {
    if (typeof x === 'string') return !!FORMOFF[x];
    try { return !!(HIDESEL && x && x.matches && x.matches(HIDESEL)); } catch (e) { return false; }
  };
  /* phones: the tab bar (desk.js) shows the first four screens that are on */
  var lastOff = {};
  function syncTab(off) {
    if (off) lastOff = off;
    var tb = $('.tabbar'), hub = $('.hub-nav'); if (!tb || !hub) return;
    var want = $$('a[data-sec]', hub).filter(function (a) { var s = a.getAttribute('data-sec'); return !lastOff[s] && s !== 'features'; }).slice(0, 4);
    var have = $$('a[data-sec]', tb).map(function (a) { return a.getAttribute('data-sec'); }).join(' ');
    if (have === want.map(function (a) { return a.getAttribute('data-sec'); }).join(' ')) return;
    $$('a[data-sec]', tb).forEach(function (a) { a.remove(); });
    var more = $('[data-side-btn]', tb);
    want.forEach(function (a) {
      var c = a.cloneNode(true); ['aria-keyshortcuts', 'title', 'id'].forEach(function (n) { c.removeAttribute(n); });
      tb.insertBefore(c, more);
    });
  }
  new MutationObserver(function () { if ($('.tabbar')) syncTab(); }).observe(document.body, { childList: true });

  /* ---------- Settings › Additional features: its menu entry (at the end of the App's screens) ---------- */
  function menuLink() {
    var nav = $('.hub-nav'); if (!nav) return;
    var a = $('a[data-sec="features"]', nav);
    if (!a) { a = NS.el('a', { href: '#features', 'data-sec': 'features', 'data-ic': 'set' }, '<span></span>'); nav.appendChild(a); }
    $('span', a).textContent = T('menu'); a.title = T('menu');
  }

  /* ---------- the setup ---------- */
  var S = null, dlg = null, step = 1, firstRun = false;
  function fill(b) {
    b = b || {};
    var bt = b.btype && FORMS.indexOf(b.btype) >= 0 ? b.btype : (b.id ? 'prop' : '');
    return { id: b.id || '', kind: KINDS.indexOf(b.kind) >= 0 ? b.kind : '', btype: bt, name: b.name || '', state: b.state || '', reg: REGS.indexOf(b.reg) >= 0 ? b.reg : b.reg === 'sez' ? 'regular' : '',
      sez: b.reg === 'sez', gstin: b.gstin || '', addr: b.addr || '', city: b.city || '', pin: b.pin || '', phone: b.phone || '', bankName: b.bankName || '', bankAcc: b.bankAcc || '',
      bankIfsc: b.bankIfsc || '', upi: b.upi || '', logo: b.logo || '', sw: null, found: !!(b.id || b.name) };
  }
  function lbl(k) { return esc(NS.t(k)); }
  function always() { return T('always', { list: ['home', 'sales', 'money', 'dues', 'parties'].map(function (k) { return NS.t('app.' + k); }).join(', ') }); }
  function stateOpts(v) {
    return '<option value="">' + esc(T('choose')) + '</option>' + NS.STATES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === v ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('');
  }
  function inp(k, label, o) {
    o = o || {};
    return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="nsf-' + k + '">' + lbl(label) + '</label>' +
      (o.area ? '<textarea id="nsf-' + k + '" data-k="' + k + '" rows="2" dir="auto">' + esc(S[k]) + '</textarea>' :
        '<input id="nsf-' + k + '" data-k="' + k + '" value="' + esc(S[k]) + '"' + (o.ltr ? ' dir="ltr"' : ' dir="auto"') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + ' autocomplete="off">') + '</div>';
  }
  function swList(on, recd) {
    return CAT.map(function (g) {
      return '<fieldset class="nsf-grp"><legend>' + esc(T('g_' + g[0])) + '</legend>' + g[1].map(function (f) {
        return '<label class="nsf-sw"><input type="checkbox" role="switch" data-sw="' + f[0] + '"' + (on[f[0]] ? ' checked' : '') + '><span>' + lbl(f[1]) +
          (recd[f[0]] ? ' <span class="pill ok">' + esc(T('rec')) + '</span>' : '') + '</span></label>';
      }).join('') + '</fieldset>';
    }).join('');
  }
  function body() {
    if (step === 1) return '<p>' + esc(T('intro')) + '</p><fieldset class="nsf-kinds" data-need="kind"><legend><h3>' + esc(T('s1')) + '</h3></legend>' + KINDS.map(function (k) {
      return '<label class="nsf-kind"><input type="radio" name="nsf-kind" value="' + k + '"' + (S.kind === k ? ' checked' : '') + '><span><b>' + esc(T('k_' + k)) + '</b><small>' + esc(T('kh_' + k)) + '</small></span></label>';
    }).join('') + '</fieldset>';
    if (step === 2) return '<h3>' + esc(T('s2')) + '</h3>' + (S.found ? '<p class="note">' + esc(T('prefill', { name: S.name || '' })) + '</p>' : '') +
      '<div class="fg">' + inp('name', 'l.bname', { wide: 1 }) +
      '<div class="f"><label for="nsf-btype">' + lbl('fr.legal') + '</label><select id="nsf-btype" data-k="btype"><option value="">' + esc(T('choose')) + '</option>' +
        FORMS.map(function (k) { return '<option value="' + k + '"' + (S.btype === k ? ' selected' : '') + '>' + lbl('fm.b_' + k) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="nsf-state">' + lbl('l.state') + '</label><select id="nsf-state" data-k="state">' + stateOpts(S.state) + '</select></div>' +
      '<fieldset class="f wide nsf-reg" data-need="reg"><legend class="lbl">' + lbl('hub.reg') + '</legend><div class="f choice">' + REGS.map(function (k) {
        return '<label class="chk"><input type="radio" name="nsf-reg" value="' + k + '"' + (S.reg === k ? ' checked' : '') + '> ' + lbl('hub.rg.' + k) + '</label>'; }).join('') + '</div></fieldset>' +
      '</div><h4 class="nsf-opt">' + esc(T('opt')) + '</h4><div class="fg">' +
      inp('gstin', 'l.gstin', { ltr: 1, max: 15 }) + inp('phone', 'l.phone', { ltr: 1, mode: 'tel' }) + inp('addr', 'l.addr', { wide: 1, area: 1 }) + inp('city', 'l.city') + inp('pin', 'l.pin', { ltr: 1, mode: 'numeric', max: 6 }) +
      inp('bankName', 'l.bank') + inp('bankAcc', 'l.acc', { ltr: 1, mode: 'numeric' }) + inp('bankIfsc', 'l.ifsc', { ltr: 1, max: 11 }) + inp('upi', 'l.upi', { ltr: 1 }) +
      '<div class="f imgf"><label for="nsf-logo">' + lbl('l.logo') + '</label>' + (S.logo ? '<img src="' + esc(S.logo) + '" alt="">' : '') + '<input type="file" id="nsf-logo" accept="image/*"></div></div>';
    var R = rec(S.kind, S.reg, S.btype), on = S.sw || R;
    return '<h3>' + esc(T('s3')) + '</h3><p>' + esc(T('s3p', { kind: T('k_' + S.kind) })) + '</p><p class="soft">' + esc(always()) + '</p>' + swList(on, R);
  }
  function draw() {
    if (!dlg) {
      dlg = NS.el('dialog', { class: 'hub-dlg nsf-dlg', 'aria-labelledby': 'nsf-t' });
      document.body.appendChild(dlg);
      /* Esc / phone Back = Later: the App keeps every feature on and asks again on the next start */
      dlg.addEventListener('cancel', function () { if (firstRun) later(); });
      dlg.addEventListener('input', read); dlg.addEventListener('change', read);
      dlg.addEventListener('click', click);
    }
    var cl = NS.lang ? NS.lang() : document.documentElement.getAttribute('lang');
    dlg.innerHTML = '<div class="dlg-hd"><h2 id="nsf-t">' + esc(T('title')) + ' <small class="soft">' + esc(T('step', { n: step })) + '</small></h2>' +
      '<button type="button" class="icon-btn" data-nsf-x aria-label="' + lbl(firstRun ? 'later' : 'close') + '" title="' + lbl(firstRun ? 'later' : 'close') + '">✕</button></div>' +
      '<form novalidate class="nsf-form">' +
      /* the header's language picker sits behind this box: the setup has its own */
      (step === 1 && NS.LANGS ? '<div class="nsf-lang"><label for="nsf-lang">' + lbl('lang') + '</label> <select id="nsf-lang" data-nsf-lang>' + NS.LANGS.map(function (l) {
        return '<option value="' + l[0] + '" lang="' + l[0] + '"' + (String(cl || 'en').indexOf(l[0]) === 0 ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></div>' : '') +
      '<div class="nsf-bar" aria-hidden="true"><i style="inline-size:' + Math.round(step / 3 * 100) + '%"></i></div>' + body() +
      '<p class="nsf-err" role="alert" hidden></p>' +
      '<div class="dlg-foot">' + (step > 1 ? '<button type="button" class="btn" data-nsf-back>' + esc(T('back')) + '</button>' : '') +
      '<button type="submit" class="btn primary">' + esc(T(step < 3 ? 'next' : 'start')) + '</button>' +
      (firstRun && step === 1 && !S.found && window.NSSample ? '<button type="button" class="btn" data-nsf-sample>' + esc(T('sample')) + '</button>' : '') +
      (firstRun ? '<button type="button" class="btn" data-nsf-later>' + lbl('later') + '</button>' : '') + '</div>' +
      (firstRun ? '<p class="soft nsf-laterp">' + lbl('ux.frlater') + '</p>' : '') + '</form>';
    var ls = $('[data-nsf-lang]', dlg);
    if (ls) ls.addEventListener('change', function () { if (NS.setLang) NS.setLang(ls.value); });
    $('form', dlg).addEventListener('submit', next);
    var g = $('[data-k="gstin"]', dlg);
    if (g && NS.gstFetchButton) NS.gstFetchButton(g, function (d) {
      ['name', 'addr', 'city', 'pin', 'state', 'gstin'].forEach(function (k) { if (d[k]) S[k] = d[k]; });
      if (d.reg === 'regular' || d.reg === 'comp') S.reg = d.reg; else if (d.reg === 'sez') { S.reg = 'regular'; S.sez = true; }
      if (/propriet/i.test(d.constitution || '') && d.trade) S.name = d.trade;
      draw(); NS.toast(T('filled'));
    });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    var h = $('h3', dlg) || $('h2', dlg); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    $('form', dlg).scrollTop = 0; dlg.scrollTop = 0;   /* each step starts at its top (step 3 kept step 2's scroll) */
  }
  function read(e) {
    var el = e.target;
    if (el.name === 'nsf-kind' && el.checked) { if (S.kind !== el.value) S.sw = null; S.kind = el.value; }
    else if (el.name === 'nsf-reg' && el.checked) { if (S.reg !== el.value) S.sw = null; S.reg = el.value; }
    else if (el.hasAttribute('data-sw')) { S.sw = S.sw || rec(S.kind, S.reg, S.btype); S.sw[el.getAttribute('data-sw')] = el.checked ? 1 : 0; }
    else if (el.id === 'nsf-logo' && e.type === 'change' && el.files[0]) shrink(el.files[0], 360).then(function (u) { S.logo = u; draw(); }, function () { NS.toast(T('nologo'), 'bad'); });
    else if (el.hasAttribute('data-k')) {
      var k = el.getAttribute('data-k'), v = el.value;
      if (k === 'gstin' || k === 'bankIfsc') { v = v.toUpperCase().replace(/\s/g, ''); if (el.value !== v) el.value = v; }
      if (k === 'btype' && S.btype !== v) S.sw = null;
      S[k] = v;
      if (k === 'gstin') { var c = NS.gstinCheck(v); if (c.ok && c.state && !S.state) { S.state = c.state; var s = $('[data-k="state"]', dlg); if (s) s.value = c.state; } }
    }
    if (el.getAttribute && el.getAttribute('aria-invalid')) { el.removeAttribute('aria-invalid'); var er = $('.nsf-err', dlg); if (er) er.hidden = true; }
  }
  function shrink(file, max) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onerror = rej;
      r.onload = function () {
        var im = new Image(); im.onerror = rej;
        im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/png'));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function bad(el, msg) { var er = dlg && $('.nsf-err', dlg); if (er) { er.textContent = msg; er.hidden = false; }   /* a toast would sit behind the box */
    if (el) { el.setAttribute('aria-invalid', 'true'); var f = el.matches('fieldset') ? $('input', el) : el; if (f) f.focus(); } NS.toast(msg, 'bad'); return false; }
  function check() {
    if (step === 1 && !S.kind) return bad($('[data-need="kind"]', dlg), T('need', { what: T('s1') }));
    if (step === 2) {
      S.name = S.name.trim();
      if (!S.name) return bad($('[data-k="name"]', dlg), T('need', { what: NS.t('l.bname') }));
      if (!S.btype) return bad($('[data-k="btype"]', dlg), T('need', { what: T('legal') }));
      if (!S.state) return bad($('[data-k="state"]', dlg), T('need', { what: NS.t('l.state') }));
      if (!S.reg) return bad($('[data-need="reg"]', dlg), T('need', { what: NS.t('hub.reg') }));
      if (S.gstin && !NS.gstinCheck(S.gstin).ok) return bad($('[data-k="gstin"]', dlg), NS.gstinCheck(S.gstin).msg);
      if (S.pin && !/^\d{6}$/.test(S.pin)) return bad($('[data-k="pin"]', dlg), T('need', { what: NS.t('l.pin') }));
      var dup = BIZL.filter(function (b) { return b.id !== S.id && NSBooks.key(b.name) === NSBooks.key(S.name); })[0];
      if (dup) return bad($('[data-k="name"]', dlg), NS.t('hub.v.dup', { name: S.name }));
    }
    return true;
  }
  function next(e) {
    e.preventDefault();
    if (!check()) return;
    if (step < 3) { step++; draw(); return; }
    finish();
  }
  function click(e) {
    if (e.target.closest('[data-nsf-back]')) { step--; draw(); }
    else if (e.target.closest('[data-nsf-x]') || e.target.closest('[data-nsf-later]')) { if (firstRun) later(); dlg.close(); }
    else if (e.target.closest('[data-nsf-sample]')) {
      var b = e.target.closest('button'); b.disabled = true;
      NSSample.add().then(function () { dlg.close(); NS.setCurBiz(''); location.hash = ''; return refresh(true); }, function (x) { b.disabled = false; NS.toast(NS.t('nosave', { e: x.message }), 'bad'); });
    }
  }
  function finish() {
    var base = BIZL.filter(function (b) { return b.id && b.id === S.id; })[0] || {}, r = JSON.parse(JSON.stringify(base));
    ['name', 'state', 'kind'].forEach(function (k) { r[k] = S[k]; });
    r.reg = S.reg === 'regular' && S.sez ? 'sez' : S.reg;
    if (S.btype === 'prop') delete r.btype; else r.btype = S.btype;
    /* the optional fields: what is typed replaces, an empty box removes only what was typed here (My data keeps the rest) */
    ['gstin', 'addr', 'city', 'pin', 'phone', 'bankName', 'bankAcc', 'bankIfsc', 'upi', 'logo'].forEach(function (k) { var v = String(S[k] || '').trim(); if (v) r[k] = v; else delete r[k]; });
    var R = rec(S.kind, S.reg, S.btype), on = S.sw || R, sw = {};
    Object.keys(FEAT).forEach(function (f) { sw[f] = on[f] ? true : false; });
    var btn = $('button[type=submit]', dlg); btn.disabled = true;
    NSStore.put('biz', r).then(function (saved) {
      var id = (saved && saved.id) || r.id;
      NS.setCurBiz(id);
      return saveEntry(id, { kind: S.kind, sw: sw, at: Date.now() }).then(function () {
        /* read again: saveEntry has just stored the feature switches, and other businesses keep their own settings (byBiz) */
        if (!SET.defBiz) return NSStore.meta('settings').then(function (s) { s = s || {}; if (!s.defBiz) { s.defBiz = id; SET.defBiz = id; return NSStore.meta('settings', s); } });
      });
    }).then(function () {
      firstRun = false; dlg.close(); NS.toast(T('done', { name: S.name }));
      if (location.hash.slice(1) !== 'features') location.hash = '';
      return refresh(true);
    }, function (x) { btn.disabled = false; NS.toast(NS.t('nosave', { e: x.message }), 'bad'); });
  }
  /* "Later": not again in this session (the next start of the App asks again); until then every feature stays on */
  function later() { try { sessionStorage.setItem('ns-fr-later', '1'); } catch (e) {} firstRun = false; }
  function laterSet() { try { return sessionStorage.getItem('ns-fr-later') === '1'; } catch (e) { return false; } }
  /* never over work in progress: a document open in the App's frame, or another box (an entry form) open */
  function busy() { return document.documentElement.classList.contains('app-frame-on') || !!document.querySelector('dialog[open]:not(.nsf-dlg)'); }
  function openSetup(first) {
    firstRun = !!first; step = 1;
    S = fill(CUR || pseudo());
    /* run again from Settings: start from today's switches; a new type of business, legal form or GST registration starts from its recommendation */
    if (ENTRY) { S.kind = S.kind || ENTRY.kind; S.sw = {}; Object.keys(FEAT).forEach(function (f) { S.sw[f] = isOn(f) ? 1 : 0; }); }
    draw();
  }
  /* no business saved yet but bills were made: their seller (as the App does) */
  function pseudo() {
    var b = A.biz && A.biz(); return b && !b.id ? { name: b.name, state: b.state, gstin: b.gstin, addr: b.addr, city: b.city, pin: b.pin, phone: b.phone } : null;
  }

  /* ---------- the Additional features screen ---------- */
  A.addSection('features', function () {
    if (!ENTRY) return '<h2>' + esc(T('menu')) + '</h2><p>' + esc(T('first')) + '</p><p><button type="button" class="btn primary" data-nsf-setup>' + esc(T('title')) + '</button></p>';
    var R = rec(ENTRY.kind, CUR.reg, CUR.btype), on = {};
    Object.keys(FEAT).forEach(function (f) { on[f] = isOn(f); });
    return '<div class="pane-hd"><h2><small class="soft">' + esc(T('settings')) + ' ›</small> ' + esc(T('menu')) + '</h2></div>' +
      '<p>' + esc(T('set_p', { name: CUR.name })) + '</p>' +
      '<div class="card nsf-now"><p><b>' + esc(T('kind_now')) + '</b> ' + esc(T('k_' + ENTRY.kind)) + ' · ' + lbl(CUR.btype ? 'fm.b_' + CUR.btype : 'fm.b_prop') + '</p>' +
      '<div class="quick"><button type="button" class="btn" data-nsf-setup>' + esc(T('change')) + '</button><button type="button" class="btn" data-nsf-all>' + esc(T('all_on')) + '</button>' +
      '<button type="button" class="btn" data-nsf-rec>' + esc(T('reset')) + '</button></div></div>' +
      '<p class="soft">' + esc(always()) + '</p><div class="nsf-set">' + swList(on, R) + '</div>';
  }, function (pane) {
    var b = $('[data-nsf-setup]', pane); if (b) b.addEventListener('click', function () { openSetup(!ENTRY); });
    if (!ENTRY) return;
    function store(sw, msg) {
      ENTRY = Object.assign({}, ENTRY, { sw: sw, at: Date.now() });
      apply();
      return saveEntry(CUR.id, ENTRY).then(function () { NS.toast(msg || T('saved')); }, function (x) { NS.toast(NS.t('nosave', { e: x.message }), 'bad'); });
    }
    function all(fn) { var sw = {}; Object.keys(FEAT).forEach(function (f) { sw[f] = fn(f); }); return sw; }
    $$('[data-sw]', pane).forEach(function (c) {
      c.addEventListener('change', function () { var sw = all(isOn); sw[c.getAttribute('data-sw')] = c.checked; store(sw); });
    });
    $('[data-nsf-all]', pane).addEventListener('click', function () { store(all(function () { return true; })).then(function () { A.show(); }); });
    $('[data-nsf-rec]', pane).addEventListener('click', function () { var R = rec(ENTRY.kind, CUR.reg, CUR.btype); store(all(function (f) { return !!R[f]; })).then(function () { A.show(); }); });
  });

  /* ---------- when to look again: start, data from the data home, coming back to the window, another business picked ---------- */
  var queue = Promise.resolve();
  function refresh(redraw) {
    queue = queue.then(load).then(function () {
      menuLink(); apply();
      if (!(CUR && CUR.sample) && (!CUR || !ENTRY) && !(dlg && dlg.open) && !laterSet() && !busy()) openSetup(true);
      if (redraw) return A.show();
    }).catch(function () {});
    return queue;
  }
  function start() {
    menuLink();
    NSStore.ready().then(function () { return refresh(false); }).then(function () {
      /* opened straight at #features: the App may have routed before this screen was there (as finrep.js) */
      var a = $('a[data-sec="features"]');
      if (/^#features/.test(location.hash) && a && a.getAttribute('aria-current') !== 'page') window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    document.addEventListener('ns-data', function () { refresh(false); });
    window.addEventListener('focus', function () { if (!(dlg && dlg.open)) refresh(false); });
    window.addEventListener('hashchange', function () { if (!(dlg && dlg.open)) setTimeout(function () { refresh(false); }, 120); });   /* left the document: the setup may ask now */
    document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-biz]')) setTimeout(function () { refresh(false); }, 60); });
    document.addEventListener('ns-lang', function () { menuLink(); if (dlg && dlg.open) draw(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
