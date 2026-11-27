/* The App on a phone (widths up to 600 px) - phone.css draws it, this file adds the parts that only a phone has (after app.js and ledger.js).
   Nothing here runs on wider screens and nothing is stored: every figure comes from the same books the desktop screens use.
     home     business switcher + financial year, search, My day bell; swipeable key figures; Create / View and share / Reports tiles
     lists    Sales, Purchases and Money in and out: the title is a list switcher, + Create new, three-dot menu, search / sort / show-only
     ledger   party ledger: Ledger and Details tabs, opening balance, Dr / Cr on every line, three-dot menu (call, WhatsApp, email, share PDF)
     more     the tab bar's More opens a grouped icon list instead of the side menu
   Words: NS.t('ph.<key>') (English only, like every App screen). */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !A.data) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, money = NS.money, B = A.B, de = document.documentElement;
  var mq = window.matchMedia('(max-width:600px)');
  function t(k, v) { return NS.t('ph.' + k, v); }
  function ic(k) { return NS.icSvg(k); }
  function phone() { return mq.matches && !(A.door && A.door()); }
  function hashSec() { return decodeURIComponent(location.hash.slice(1)).split('/')[0]; }
  function hashArg() { var h = decodeURIComponent(location.hash.slice(1)), i = h.indexOf('/'); return i < 0 ? '' : h.slice(i + 1); }

  /* ---------- the bottom sheet every menu uses (a plain dialog: Back closes it like any other) ---------- */
  var dlg = null;
  function shut() { if (dlg) { var d = dlg; dlg = null; try { d.close(); } catch (e) {} d.remove(); } }
  function sheet(title, items, grid) {
    shut();
    dlg = document.createElement('dialog'); dlg.className = 'ph-sheet'; dlg.setAttribute('aria-label', title);
    var body = grid ? items.map(function (g, gi) {
      return '<section class="ph-g"><h3>' + esc(g.title) + '</h3><div class="ph-grid">' + g.items.map(function (it, i) { return tile(it, 'data-gi="' + gi + '" data-i="' + i + '"'); }).join('') + '</div></section>';
    }).join('') : '<ul class="ph-sh-l">' + items.map(function (it, i) {
      return '<li><button type="button" data-i="' + i + '"' + (it.on ? ' aria-pressed="true"' : '') + '>' + (it.ic ? ic(it.ic) : '') + '<span>' + esc(it.label) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span></button></li>';
    }).join('') + '</ul>';
    dlg.innerHTML = '<div class="ph-sh-h"><b>' + esc(title) + '</b><button type="button" class="ph-ic ph-cl" aria-label="' + esc(t('close')) + '">' + ic('x') + '</button></div><div class="ph-sh-b">' + body + '</div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { shut(); return; }
      var b = e.target.closest('button,a'); if (!b) return;
      if (b.classList.contains('ph-cl')) { shut(); return; }
      var it = grid ? (items[+b.getAttribute('data-gi')] || { items: [] }).items[+b.getAttribute('data-i')] : items[+b.getAttribute('data-i')];
      if (!it) return;
      if (b.tagName === 'A') { shut(); return; }   /* a link goes where it points */
      shut(); setTimeout(function () { try { it.run(); } catch (x) { NS.toast(String(x && x.message || x), 'bad'); } }, 0);
    });
    dlg.addEventListener('close', function () { if (dlg) { dlg.remove(); dlg = null; } });
    dlg.showModal();
  }
  /* one tile: an icon above a short name; a link when it has an address, else a button that runs */
  function tile(it, attrs) {
    var inner = '<i aria-hidden="true">' + ic(it.ic || 'list') + '</i><span>' + esc(it.label) + '</span>';
    return it.href ? '<a class="ph-tile" href="' + esc(it.href) + '" ' + (attrs || '') + '>' + inner + '</a>' : '<button type="button" class="ph-tile" ' + (attrs || '') + '>' + inner + '</button>';
  }

  /* ---------- home ---------- */
  var FORM = function (k) { return function () { A.openForm(k); }; };
  function createTiles() {
    var tl = [
      { ic: 'file', label: t('t_sale'), run: FORM('sale') }, { ic: 'cart', label: t('t_pbill'), run: FORM('pbill') },
      { ic: 'down', label: t('t_min'), run: FORM('min') }, { ic: 'up', label: t('t_mout'), run: FORM('mout') },
      { ic: 'coins', label: t('t_exp'), run: FORM('exp') },
      { ic: 'people', label: t('t_party'), run: function () { NS.quickAddNew('party'); } }, { ic: 'box', label: t('t_item'), run: function () { NS.quickAddNew('item'); } }];
    if (A.newDocs && A.newDocs().some(function (n) { return n[0] === 'quotation'; })) tl.push({ ic: 'edit', label: t('t_quote'), run: function () { A.newDoc('quotation'); } });
    return tl;
  }
  function viewTiles() { return [{ ic: 'list', label: t('t_inv'), href: '#sales' }, { ic: 'book', label: t('t_ledger'), href: '#parties' }, { ic: 'clock', label: t('t_dues'), href: '#dues' }]; }
  function reportTiles() {
    var tl = [{ ic: 'book', label: t('t_day'), href: '#cash/day' }, { ic: 'bank', label: t('t_cash'), href: '#cash' }, { ic: 'scale', label: t('t_gst'), href: '#gsum' }];
    if (!NS.featOn || NS.featOn('stock')) tl.push({ ic: 'box', label: t('t_stock'), href: '#stock' });
    return tl;
  }
  function figs(pane) {
    var out = [], tl = function (n) { var e = $('[data-tile="' + n + '"] b', pane); return e ? e.textContent : ''; }, cf = $$('[data-dash="cf"] .tile b', pane);
    if (tl('month')) out.push([t('k_sales'), tl('month'), '#sales']);
    if (cf[0]) out.push([t('k_in'), cf[0].textContent, '#money']);
    if (cf[1]) out.push([t('k_out'), cf[1].textContent, '#money']);
    if (tl('recv')) out.push([t('k_dues'), tl('recv'), '#dues']);
    if (tl('pay')) out.push([t('k_pay'), tl('pay'), '#dues/pay']);
    try {
      if ((!NS.featOn || NS.featOn('stock')) && window.NSStock && NSStock.summary) { var C = A.data(), s = NSStock.summary(C.doc, C.item || [], A.bizName(), '', NS.today()); if (s && s.value != null && (s.items || []).length) out.push([t('k_stock'), money(s.value), '#stock']); }
    } catch (e) {}
    return out;
  }
  function fyText() {
    var s = A.fyStart(NS.today()), e = (+s.slice(0, 4) + 1) + '-03-31';
    return 'FY ' + NS.fy(NS.today()) + ' · ' + A.ldate(s) + ' – ' + A.ldate(e);
  }
  function decorateHome(pane) {
    var home = $('.dash-root', pane); if (!home) return;
    var F = figs(pane), tl = [[t('create'), createTiles()], [t('view'), viewTiles()], [t('reports'), reportTiles()]];
    var top = '<header class="ph-top"><button type="button" class="ph-biz" data-ph="biz" aria-haspopup="dialog" aria-label="' + esc(t('switch')) + '"><span class="ph-bn">' + esc(A.bizName()) + '</span><span class="ph-fy">' + esc(fyText()) + '</span></button>' +
      '</header>';   /* search and the My day bell are already in the App's title bar above */
    var fg = F.length ? '<div class="ph-figs" role="list" tabindex="0" aria-label="' + esc(t('k_sales')) + '">' + F.map(function (f) { return '<a class="ph-fig" role="listitem" href="' + f[2] + '"><span>' + esc(f[0]) + '</span><b>' + esc(f[1]) + '</b></a>'; }).join('') + '</div>' : '';
    var grids = tl.map(function (g, gi) { return '<section class="ph-g"><h3>' + esc(g[0]) + '</h3><div class="ph-grid">' + g[1].map(function (it, i) { return tile(it, 'data-pgi="' + gi + '" data-pi="' + i + '"'); }).join('') + '</div></section>'; }).join('');
    var box = document.createElement('div'); box.className = 'ph-home ph-x'; box.innerHTML = top + fg + grids;
    pane.insertBefore(box, home.parentNode === pane ? home : pane.firstChild);
    pane.classList.add('ph-on-home');
    box._tl = tl;
    $$('.ph-grid [data-pgi]', box).forEach(function (b) { if (b.tagName === 'BUTTON') b.addEventListener('click', function () { tl[+b.getAttribute('data-pgi')][1][+b.getAttribute('data-pi')].run(); }); });
  }

  /* ---------- Sales, Purchases, Money in and out ---------- */
  function kinds() {
    var k = [{ label: NS.t('app.sales'), ic: 'list', run: function () { location.hash = 'sales'; } }, { label: NS.t('app.buy'), ic: 'cart', run: function () { location.hash = 'buy'; } },
      { label: t('k_money'), ic: 'money', run: function () { location.hash = 'money'; } }];
    if (A.door && A.door()) return k;
    k.push({ label: t('k_orders'), ic: 'file', run: function () { if (window.NSLedger && NSLedger.vregOf) NSLedger.vregOf('so'); else if (A.vregOf) A.vregOf('so'); location.hash = 'vreg'; } });
    k.push({ label: t('k_quotes'), ic: 'edit', run: function () { if (A.vregOf) A.vregOf('quote'); location.hash = 'vreg'; } });
    return k;
  }
  function createItems(pane) {
    var out = [];
    $$('.pane-hd a.btn, .pane-hd button.btn', pane).forEach(function (b) {
      var l = b.textContent.replace(/^\s*\+\s*/, '').trim(); if (!l || /^(ctrl|alt)/i.test(l) || /^(configure|settings)/i.test(l)) return;
      out.push({ label: l.replace(/\s*Ctrl.*$/i, ''), ic: /camera|scan/i.test(l) ? 'camera' : 'plus', run: function () { b.click(); } });
    });
    return out;
  }
  function decorateList(pane) {
    var hd = $('.pane-hd[data-phkind]', pane); if (!hd) return;
    var kind = hd.getAttribute('data-phkind'), title = $('h2', hd).textContent;
    var bar = document.createElement('div'); bar.className = 'ph-bar ph-x';
    bar.innerHTML = '<button type="button" class="ph-title" data-ph="kind" aria-haspopup="dialog" aria-label="' + esc(t('kind')) + '"><span>' + esc(title) + '</span>' + ic('chev') + '</button><span class="grow"></span>' +
      '<button type="button" class="ph-ic ph-add" data-ph="add" aria-label="' + esc(t('new')) + '">' + ic('plus') + '</button><button type="button" class="ph-ic" data-ph="menu" aria-label="' + esc(t('menu')) + '">' + ic('more') + '</button>';
    hd.parentNode.insertBefore(bar, hd);
    var row = $('.tools-row', pane);
    if (row) {
      var ib = document.createElement('span'); ib.className = 'ph-tb';
      ib.innerHTML = '<button type="button" class="ph-ic" data-ph="q" aria-label="' + esc(t('m_search')) + '">' + ic('search') + '</button><button type="button" class="ph-ic" data-ph="sort" aria-label="' + esc(t('sort')) + '">' + ic('sort') + '</button><button type="button" class="ph-ic" data-ph="type" aria-label="' + esc(t('type')) + '">' + ic('filter') + '</button>';
      row.appendChild(ib);
      if (A.q()) row.classList.add('ph-q-on');
    }
    pane.classList.add('ph-on-list');
  }
  function sortSheet() {
    var cur = A.sortBy(), L = [['new', 's_new'], ['old', 's_old'], ['high', 's_high'], ['low', 's_low']];
    sheet(t('sort'), L.map(function (x) { return { label: t(x[1]), on: cur === x[0], ic: 'sort', run: function () { A.sortBy(x[0]); A.show(); } }; }));
  }
  function typeSheet() {
    var pane = $('[data-pane]'), kind = ($('.pane-hd[data-phkind]', pane) || {}).getAttribute ? $('.pane-hd[data-phkind]', pane).getAttribute('data-phkind') : '';
    var seen = {}, D = A.mine();
    D.forEach(function (d) {
      var ty = d.type || 'invoice', ok = kind === 'sales' ? /^(invoice|cashmemo|note|quote|proforma|so|challan|exp)$/.test(ty) && !(ty === 'exp') : kind === 'buy' ? /^(pbill|exp|self|po|voucher|note)$/.test(ty) : /^(receipt|voucher|ob|contra)$/.test(ty);
      if (ok) seen[ty] = A.docName(d);
    });
    var cur = A.typeBy(), L = [{ label: t('t_all'), on: !cur, ic: 'list', run: function () { A.typeBy(''); A.show(); } }];
    Object.keys(seen).forEach(function (ty) { L.push({ label: seen[ty], on: cur === ty, ic: 'list', run: function () { A.typeBy(ty); A.show(); } }); });
    sheet(t('type'), L);
  }
  function listMenu() {
    var pane = $('[data-pane]');
    sheet(t('menu'), [{ label: t('m_search'), ic: 'search', run: function () { openSearch(pane); } }, { label: t('m_registers'), ic: 'book', run: function () { location.hash = 'vreg'; } },
      { label: t('t_day'), ic: 'book', run: function () { location.hash = 'cash/day'; } }, { label: t('m_print'), ic: 'print', run: function () { window.print(); } }]);
  }
  function openSearch(pane) {
    var row = $('.tools-row', pane || $('[data-pane]')); if (!row) return;
    row.classList.add('ph-q-on'); var i = $('[data-q]', row); if (i) i.focus();
  }

  /* ---------- party ledger ---------- */
  function bal(v) { return money(Math.abs(v)) + ' ' + (v > 0.004 ? 'Dr' : v < -0.004 ? 'Cr' : ''); }
  function decorateLedger(pane) {
    var k = hashArg(), C = A.data(), rec = C.party.filter(function (p) { return B.key(p.name) === k; })[0] || {}, hd = $('.pane-hd', pane); if (!k || !hd) return;
    var r = A.range(), S = B.ledger(A.mine(), A.bizName(), k, r[0], r[1]), name = $('h2', hd).childNodes[0].textContent.trim();
    var bar = document.createElement('div'); bar.className = 'ph-bar ph-x ph-lbar';
    bar.innerHTML = '<a class="ph-ic" href="#parties" aria-label="' + esc(NS.t('app.back')) + '">' + ic('back') + '</a><b class="ph-pn">' + esc(name) + '</b><span class="grow"></span><button type="button" class="ph-ic" data-ph="lmenu" aria-label="' + esc(t('menu')) + '">' + ic('more') + '</button>';
    var tabs = document.createElement('div'); tabs.className = 'ph-tabs ph-x'; tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<button type="button" role="tab" aria-selected="true" data-ph="ltab" data-tab="led">' + esc(t('tab_ledger')) + '</button><button type="button" role="tab" aria-selected="false" data-ph="ltab" data-tab="det">' + esc(t('tab_details')) + '</button>';
    var lines = '<div class="ph-lg ph-x"><div class="ph-ob"><span>' + esc(t('open')) + ' · ' + esc(A.ldate(r[0])) + '</span><b>' + esc(bal(S.open)) + '</b></div>' +
      (S.rows.length ? S.rows.map(function (x) {
        return '<button type="button" class="ph-le" data-ph="open" data-id="' + esc(x.d.id) + '"><span class="ph-ll"><b>' + esc(A.docName(x.d) + (x.d.no ? ' ' + x.d.no : '')) + '</b><span class="soft">' + esc(A.ldate(x.date)) + '</span></span>' +
          '<span class="ph-la"><b class="' + (x.dr ? 'dr' : 'cr') + '">' + money(x.dr || x.cr) + ' ' + (x.dr ? 'Dr' : 'Cr') + '</b><span class="soft">' + esc(bal(x.bal)) + '</span></span></button>'; }).join('') : '<p class="soft ph-none">' + esc(t('noentries')) + '</p>') +
      '<div class="ph-ob ph-cb"><span>' + esc(t('close_bal')) + ' · ' + esc(A.ldate(r[1])) + '</span><b>' + esc(bal(S.close)) + '</b></div></div>';
    var det = function (l, v) { return '<div><dt>' + esc(l) + '</dt><dd>' + (v ? esc(v) : '<span class="soft">' + esc(t('d_none')) + '</span>') + '</dd></div>'; };
    var addr = [rec.addr, [rec.city, rec.pin].filter(Boolean).join(' ')].filter(function (x) { return String(x || '').trim(); }).join(', ');
    var g = ''; try { var G = B.groupTree(A.groups()).filter(function (x) { return x.id === A.gidOf(k); })[0]; g = G ? A.gname(G) : ''; } catch (e) {}
    var dt = '<div class="ph-det ph-x" hidden><dl>' + det(t('d_phone'), rec.phone) + det(t('d_email'), rec.email) + det(t('d_gstin'), rec.gstin) + det(t('d_addr'), addr) + det(t('d_group'), g) + det(t('d_cdays'), rec.cdays) + det(t('d_limit'), rec.climit ? money(rec.climit) : '') + '</dl>' +
      '<p><a class="btn" href="' + esc(A.myUrl('#party')) + '">' + esc(t('edit_party')) + '</a></p></div>';
    var vw = $('[data-lgview][aria-pressed=true]', pane), allView = !vw || vw.getAttribute('data-lgview') === 'all';
    var wrap = document.createElement('div'); wrap.className = 'ph-led ph-x'; wrap.innerHTML = allView ? lines : '';
    pane.insertBefore(bar, pane.firstChild); hd.parentNode.insertBefore(tabs, hd.nextSibling);
    var big = $('.big', pane); if (big) tabs.parentNode.insertBefore(big, tabs);
    var after = $('.lg-bar', pane); (after || tabs).parentNode.insertBefore(wrap, after ? after.nextSibling : tabs.nextSibling);
    wrap.parentNode.insertBefore(Object.assign(document.createElement('div'), { innerHTML: dt }).firstChild, wrap.nextSibling);
    pane.classList.add('ph-on-ledger'); if (allView) pane.classList.add('ph-lgw'); pane._phRec = rec;
  }
  function ledgerMenu(pane) {
    var rec = pane._phRec || {}, ph = String(rec.phone || '').replace(/[^\d+]/g, ''), L = [];
    L.push({ label: t('call'), ic: 'phone', run: function () { if (ph) location.href = 'tel:' + ph; else NS.toast(t('nophone')); } });
    L.push({ label: t('wa'), ic: 'wa', run: function () { var b = $('[data-lgwa]', pane); if (b) b.click(); } });
    L.push({ label: t('mail'), ic: 'mail', run: function () { if (rec.email) location.href = 'mailto:' + rec.email; else NS.toast(t('noemail')); } });
    L.push({ label: t('share'), ic: 'share', run: function () { var b = $('[data-lgpdf]', pane); if (b) b.click(); } });
    var pay = $('.pane-hd [data-form]', pane); if (pay) L.push({ label: pay.textContent.trim(), ic: 'money', run: function () { pay.click(); } });
    sheet(t('menu'), L);
  }

  /* ---------- More ---------- */
  var MICON = [[/dash|home/i, 'home'], [/sale|invoice|bill|quot/i, 'file'], [/purch/i, 'cart'], [/money|receipt|payment|cash|bank|voucher/i, 'money'], [/due|outstanding|cheque|remind|day|repeat/i, 'clock'],
    [/part|ledger|group|debtor|creditor/i, 'people'], [/stock|item|inventor|godown|product/i, 'box'], [/gst|tax|tds|return|statut/i, 'scale'], [/report|account|book|final|trial|profit|balance|summary/i, 'chart'],
    [/salary|staff|employ|payroll|pf|esi/i, 'people'], [/setting|config|feature|master/i, 'gear'], [/backup|data|import|export/i, 'data'], [/help|guide|how/i, 'file']];
  function micon(s) { for (var i = 0; i < MICON.length; i++) if (MICON[i][0].test(s)) return MICON[i][1]; return 'list'; }
  function moreSheet() {
    var side = $('#ns-side') || $('.side'), groups = [];
    if (side) $$('.side-g', side).forEach(function (g) {
      var h = $('.side-h, h2, h3, summary', g), items = [];
      $$('a[href]', g).forEach(function (a) {
        var l = (a.textContent || '').replace(/\s+/g, ' ').trim(), hr = a.getAttribute('href'); if (!l || a.hidden || a.closest('[hidden]') || /^javascript/.test(hr) || a.hasAttribute('data-install')) return;
        items.push({ label: l.length > 28 ? l.slice(0, 27) + '…' : l, ic: micon(l), href: hr, target: a.target });
      });
      if (items.length) groups.push({ title: h ? h.textContent.replace(/\s+/g, ' ').trim() : t('m_all'), items: items });
    });
    groups.unshift({ title: t('m_set'), items: [{ label: NS.t('my.title'), ic: 'data', href: A.myUrl() }, { label: 'Look and feel', ic: 'gear', run: function () { if (window.NSTheme) NSTheme.open(); } }, { label: 'Print designs', ic: 'file', href: '#pd' }, { label: t('m_help'), ic: 'file', run: function () { var b = $('[data-help-open]'); if (b) b.click(); } }] });
    sheet(t('more'), groups, true);
  }

  /* ---------- drawing and taps ---------- */
  function decorate() {
    var pane = $('[data-pane]'); if (!pane) return;
    if (!phone()) { $$('.ph-x', pane).forEach(function (n) { n.remove(); }); pane.classList.remove('ph-on-home', 'ph-on-list', 'ph-on-ledger', 'ph-lgw'); return; }
    if ($('.ph-x', pane)) return;   /* already done for this drawing */
    var sec = hashSec();
    try {
      if (!sec || sec === 'home') decorateHome(pane);
      else if (sec === 'sales' || sec === 'buy' || sec === 'money') decorateList(pane);
      else if (sec === 'st') decorateLedger(pane);
    } catch (e) { if (window.console) console.warn('phone layer', e); }
  }
  var pend = 0;
  function later() { decorate(); }
  function start() {
    var pane = $('[data-pane]'); if (!pane) { setTimeout(start, 200); return; }
    new MutationObserver(later).observe(pane, { childList: true });
    mq.addEventListener ? mq.addEventListener('change', function () { de.classList.toggle('ph-on', phone()); if (phone()) A.show(false, true); else decorate(); }) : null;
    de.classList.toggle('ph-on', phone()); later();
    document.addEventListener('click', tap, true);
  }
  function tap(e) {
    if (!phone()) return;
    var mb = e.target.closest('.tabbar [data-side-btn]');
    if (mb) { e.preventDefault(); e.stopPropagation(); moreSheet(); return; }
    var pane = $('[data-pane]'); if (!pane || !pane.contains(e.target)) return;
    var b = e.target.closest('[data-ph]'), act = b && b.getAttribute('data-ph');
    if (act) {
      e.preventDefault(); e.stopPropagation();
      if (act === 'biz') { if (A.switchBiz) A.switchBiz(); }
      else if (act === 'search') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      else if (act === 'kind') sheet(t('kind'), kinds());
      else if (act === 'add') sheet(t('new'), createItems(pane));
      else if (act === 'menu') listMenu();
      else if (act === 'q') openSearch(pane);
      else if (act === 'sort') sortSheet();
      else if (act === 'type') typeSheet();
      else if (act === 'lmenu') ledgerMenu(pane);
      else if (act === 'open') A.viewDoc(b.getAttribute('data-id'));
      else if (act === 'ltab') {
        var tb = b.getAttribute('data-tab'); $$('[data-ph=ltab]', pane).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        var led = $('.ph-led', pane), det = $('.ph-det', pane), lb = $('.lg-bar', pane);
        if (led) led.hidden = tb !== 'led'; if (det) det.hidden = tb !== 'det'; if (lb) lb.hidden = tb !== 'led';
        $$('.ph-lgw > h3, .ph-lgw > ul.rows', pane).forEach(function (x) { x.hidden = tb !== 'led'; });
      }
      return;
    }
    /* a row of a voucher list: tap = look at it; the three dots = its other buttons */
    var m = e.target.closest('.ph-m');
    if (m) { var li = m.closest('li'); var on = !li.classList.contains('ph-open'); li.classList.toggle('ph-open', on); m.setAttribute('aria-expanded', String(on)); e.preventDefault(); e.stopPropagation(); return; }
    var r = e.target.closest('.ph-r');
    if (r) { var v = $('[data-view]', r.closest('li')); if (v) { e.preventDefault(); e.stopPropagation(); v.click(); } }
  }
  start();
})();
