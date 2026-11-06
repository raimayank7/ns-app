/* Nivesh Sahayak App: speed habits.
   Search everything (Ctrl K or /): parties, documents, items, menu screens and actions in one box.
   One-key shortcuts while not typing: N new invoice, R money received, P money paid, E expense, B purchase bill, 1-9 menu screens.
   The app opens on the screen used last, and offers "Install app" when the browser allows it. */
(function () {
  'use strict';
  var A = window.NSApp;
  if (!A || !document.getElementById('app') || document.getElementById('app').getAttribute('data-secs')) return;   /* full app only, not door sites */
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, B = A.B, T = A.T;
  var SITEOF = { invoice: 'billing', quote: 'quotation', proforma: 'proforma', so: 'sales-order', challan: 'challan', po: 'purchase-order', self: 'self-invoice', note: 'credit-note', cashmemo: 'cash-memo', receipt: 'receipt', voucher: 'voucher' };
  var NEW = [['billing', 'invoice'], ['quotation', 'quote'], ['proforma', 'proforma'], ['sales-order', 'so'], ['challan', 'challan'], ['purchase-order', 'po'], ['credit-note', 'note', 'k.credit'], ['debit-note', 'note', 'k.debit'], ['cash-memo', 'cashmemo'], ['receipt', 'receipt'], ['voucher', 'voucher']];
  var FORMS = ['min', 'mout', 'pbill', 'exp', 'ob'];
  function formOf(d) { return d.type === 'contra' ? 'contra' : d.type === 'exp' ? 'exp' : d.type === 'ob' ? 'ob' : d.type === 'pbill' ? (d.kind === 'return' ? 'pret' : 'pbill') : d.type === 'receipt' ? 'min' : 'mout'; }
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  /* the software window (desk.js, every site) has its own command box, Ctrl K and Install button: then only the one-key shortcuts and last screen stay here */
  var DESK = !!document.getElementById('ns-side');
  function busy() { return $$('dialog').some(function (d) { return d.open; }); }

  /* ---------- what the search box can find ---------- */
  function entries() {
    var C = A.data(), out = [];
    $$('[data-sec]').forEach(function (a) { out.push({ k: 'go', label: a.textContent.trim(), sub: T('qk_go'), run: function () { location.hash = a.getAttribute('href').replace(/^#?/, ''); } }); });
    FORMS.forEach(function (f) { out.push({ k: 'act', label: '+ ' + T(f), sub: T('qk_new'), run: function () { A.openForm(f); } }); });
    NEW.forEach(function (n) { out.push({ k: 'act', label: '+ ' + NS.t(n[2] || 'Doc.' + n[1]), sub: T('qk_new'), run: function () { A.openUrl(A.toolUrl(n[0])); } }); });
    out.push({ k: 'go', label: NS.t('my.title'), sub: T('qk_go'), run: function () { A.openUrl(A.myUrl()); } });
    C.party.forEach(function (p) { out.push({ k: 'party', label: p.name, sub: [T('qk_party'), p.gstin, p.phone, p.city].filter(Boolean).join(' · '), run: function () { location.hash = 'st/' + encodeURIComponent(B.key(p.name)); } }); });
    A.mine().slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).forEach(function (d) {
      var site = (d.type === 'note' && d.kind === 'debit' ? 'debit-note' : SITEOF[d.type || 'invoice']), app = d.app && !/^(receipt|voucher|cashmemo)$/.test(d.type || '');
      if (!site && !/^(pbill|exp|ob|contra)$/.test(d.type)) return;   /* other sites' records (rent, salary, petty cash…) open there */
      out.push({ k: 'doc', label: A.docName(d) + (d.no ? ' ' + d.no : ''), sub: [B.partyName(d), A.ldate(d.date), NS.money(A.amountOf(d))].filter(Boolean).join(' · '),
        run: function () { if (site && !app) A.openUrl(A.docUrl ? A.docUrl(d) : A.toolUrl(site) + '?open=' + encodeURIComponent(d.id)); else if (!site || app) A.openForm(formOf(d), { rec: d }); } });
    });
    C.item.forEach(function (it) { out.push({ k: 'item', label: it.desc, sub: [T('qk_item'), it.hsn && 'HSN ' + it.hsn, it.rate !== '' && it.rate != null && NS.money(NS.num(it.rate))].filter(Boolean).join(' · '), run: function () { A.openUrl(A.myUrl('#item')); } }); });
    return out;
  }
  function find(all, q) {
    var w = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!w.length) return all.filter(function (x) { return x.k === 'act' || x.k === 'go'; }).slice(0, 12).concat(all.filter(function (x) { return x.k === 'doc'; }).slice(0, 6));
    return all.filter(function (x) { var s = (x.label + ' ' + x.sub).toLowerCase(); return w.every(function (t) { return s.indexOf(t) >= 0; }); })
      .sort(function (a, b) { var p = w[0], A2 = a.label.toLowerCase().indexOf(p) === 0, B2 = b.label.toLowerCase().indexOf(p) === 0; return A2 === B2 ? 0 : A2 ? -1 : 1; }).slice(0, 40);
  }

  /* ---------- the search box ---------- */
  var dlg, inp, list, hits = [], sel = 0, all = [];
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'qk'; dlg.setAttribute('aria-label', T('qk_btn'));
    dlg.innerHTML = '<div class="qk-in"><input type="search" role="combobox" aria-expanded="true" aria-controls="qk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false"></div>' +
      '<ul id="qk-list" class="qk-list" role="listbox"></ul><p class="qk-help"></p>';
    document.body.appendChild(dlg);
    inp = $('input', dlg); list = $('ul', dlg);
    inp.addEventListener('input', function () { sel = 0; draw(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, hits.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) pick(+li.getAttribute('data-i')); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
  function draw() {
    hits = find(all, inp.value);
    list.innerHTML = hits.length ? hits.map(function (x, i) {
      return '<li role="option" id="qk-o' + i + '" data-i="' + i + '" class="qk-' + x.k + '"><b>' + esc(x.label) + '</b>' + (x.sub ? '<span>' + esc(x.sub) + '</span>' : '') + '</li>'; }).join('')
      : '<li class="qk-none">' + esc(T('qk_none')) + '</li>';
    mark();
  }
  function mark() {
    $$('[data-i]', list).forEach(function (li, i) { li.setAttribute('aria-selected', String(i === sel)); if (i === sel) li.scrollIntoView({ block: 'nearest' }); });
    inp.setAttribute('aria-activedescendant', hits.length ? 'qk-o' + sel : '');
  }
  function pick(i) { var x = hits[i]; if (!x) return; dlg.close(); x.run(); }
  function open() {
    if (!dlg) build();
    inp.placeholder = T('qk_ph'); $('.qk-help', dlg).textContent = T('qk_help') + ' · ' + T('qk_keys');
    all = entries(); inp.value = ''; sel = 0; draw();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    inp.focus();
  }

  /* ---------- keys ---------- */
  document.addEventListener('keydown', function (e) {
    if (!DESK && (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (dlg && dlg.open) dlg.close(); else open(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e) || busy()) return;
    var k = e.key;
    if (k === '/' && !DESK) { e.preventDefault(); open(); return; }
    var act = { n: function () { A.openUrl(A.toolUrl('billing')); }, r: function () { A.openForm('min'); }, p: function () { A.openForm('mout'); }, e: function () { A.openForm('exp'); }, b: function () { A.openForm('pbill'); } }[k.toLowerCase()];
    if (act) { e.preventDefault(); act(); return; }
    if (/^[1-9]$/.test(k)) { var a = $$('[data-sec]')[+k - 1]; if (a) { e.preventDefault(); location.hash = a.getAttribute('href').replace(/^#?/, ''); } }
  });

  /* ---------- search button in the header ---------- */
  var nav = $('.hd nav');
  if (nav && !DESK) {
    var sb = document.createElement('button');
    sb.type = 'button'; sb.className = 'btn sm qk-btn'; sb.setAttribute('aria-keyshortcuts', 'Control+K /');
    sb.innerHTML = '<span aria-hidden="true">⌕</span> <span data-qk-t></span> <kbd>Ctrl K</kbd>';
    sb.addEventListener('click', open);
    nav.insertBefore(sb, nav.firstChild);
  }
  function labels() { var t = $('[data-qk-t]'); if (t) t.textContent = T('qk_btn'); var ib = $('.qk-install'); if (ib) ib.textContent = T('install'); }
  labels(); document.addEventListener('ns-lang', labels);

  /* ---------- open on the screen used last ---------- */
  var KEY = 'ns-app-last';
  try {
    var last = localStorage.getItem(KEY);
    /* a plain visit reopens the last screen; a link to "#" (the Dashboard) means the Dashboard (round C) */
    if (!location.hash && !/#$/.test(location.href) && last && !/^do\//.test(last)) location.replace('#' + last);
  } catch (e) {}
  window.addEventListener('hashchange', function () { try { localStorage.setItem(KEY, location.hash.slice(1)); } catch (e) {} });

  /* ---------- install as an app (own window, no browser bars) ---------- */
  var later;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); later = e;
    if (DESK || !nav || $('.qk-install')) return;
    var ib = document.createElement('button');
    ib.type = 'button'; ib.className = 'btn sm primary qk-install'; ib.textContent = T('install');
    ib.addEventListener('click', function () { if (!later) return; later.prompt(); later.userChoice.then(function () { later = null; ib.remove(); }); });
    nav.insertBefore(ib, nav.firstChild);
  });
  window.addEventListener('appinstalled', function () { var ib = $('.qk-install'); if (ib) ib.remove(); });
})();
