/* NSBiz Configuration (ERP C-12, C-35, owner 2026-11-19: work like an ERP, Tally F11 / F12, Busy configuration).
   One App screen #config (side menu Utilities, Alt+G CF) that gathers what was spread over My data, the Features screen, Masters and
   each report: Business and year, Features (with what each switch changes, C-9), Voucher types, numbering and printing (A-6, A-7, C-11),
   Safety, Backup and data. A "Configure" gear in the title row of every App screen and every voucher entry screen opens the options of
   that screen: a voucher type opens its own numbering + printing form (masters.js A.vtEdit), other screens open this screen.
   F12 opens it only in the installed App window and the Windows program (in a browser tab F12 is the browser's developer tools).
   Words: EN only in engine/i18n.js (screens inside the App are English only, owner 19 Nov). */
(function () {
  'use strict';
  var A = window.NSApp; if (!A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function W(k, v) { return NS.t('cf.' + k, v); }
  function S() { return NS.cfgFor(A.cfg(), A.biz()); }
  function biz() { return A.biz() || {}; }
  function myLink(part) { var a = $('#ns-side a[data-ic=set]'); return (a ? a.href.split('#')[0] : 'https://my.niveshsahayak.in/') + '#' + part; }
  var TABS = [['', 'biz'], ['feat', 'feat'], ['vt', 'vt'], ['safe', 'safe'], ['data', 'data']];

  /* the voucher type an App form or screen works with (index into NS.VTYPES) */
  var FORMVT = { sale: 'invoice', min: 'receipt', mout: 'voucher', contra: 'contra', csale: 'cashmemo', exp: 'exp', jv: 'jv' };
  var SECVT = { sales: 'invoice', money: 'receipt', b2jv: 'jv' };
  function vtIndex(type, kind) { var L = NS.VTYPES; for (var i = 0; i < L.length; i++) if (L[i][0] === type && (!kind || L[i][1] === kind)) return i; return -1; }
  function formVt(F) {
    if (!F) return -1;
    if (F.vd && F.vd.ty) { var d = F.vd.build ? F.vd.build() : {}; return vtIndex(F.vd.ty, NS.nxKind(d)); }
    return FORMVT[F.kind] ? vtIndex(FORMVT[F.kind]) : -1;
  }

  /* ---------- the screen ---------- */
  function tabs(cur) { return '<nav class="seg ms-tabs" aria-label="' + esc(W('title')) + '">' + TABS.map(function (t) { return '<a class="btn sm" href="#config' + (t[0] ? '/' + t[0] : '') + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + esc(W('t_' + t[1])) + '</a>'; }).join('') + '</nav>'; }
  function row(label, value, action) { return '<tr><td class="l">' + esc(label) + '</td><td class="l">' + value + '</td><td class="noprint">' + (action || '') + '</td></tr>'; }
  function table(rows) { return '<div class="tbl-wrap"><table class="tbl cf-tbl"><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function lnk(href, label, blank) { return '<a class="btn sm" href="' + esc(href) + '"' + (blank ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>'; }
  function bizHtml() {
    var b = biz(), c = S(), fy = NS.fy(NS.today()), reg = { regular: W('reg_regular'), comp: W('reg_comp'), unreg: W('reg_unreg'), sez: W('reg_sez') }[b.reg || 'regular'] || b.reg;
    return table([
      row(W('bname'), esc(b.name || ''), lnk('#masters/biz', W('alter'))),
      row(W('gstin'), '<span class="mono">' + esc(b.gstin || '—') + '</span> · ' + esc(reg), lnk(myLink('biz'), W('inmy'), 1)),
      row(W('fy'), esc(fy), lnk('#b2year', W('yearend'))),
      row(W('lock'), esc(c.lockBefore ? NS.fmtDate(c.lockBefore) : W('none')), lnk(myLink('settings'), W('inmy'), 1)),
      row(W('defaults'), esc(W('defaultsh')), lnk(myLink('settings'), W('inmy'), 1))
    ]);
  }
  /* features that change what the entry screens ask for (C-9), then the full list of switches */
  function featHtml() {
    var b = biz(), m = NS.bizMode(b, A.cfg()), e = (A.cfg().features || {})[b.id] || {}, sw = e.sw || {};
    function swRow(f, label, help) {
      var on = !(f in sw) || !!sw[f], dis = f !== 'inv' && f !== 'billwise' && !m.inv;
      return row(W(label), '<label class="chk"><input type="checkbox" data-cfsw="' + f + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> ' + esc(on ? W('on') : W('off')) + '</label>', '') +
        row('', '<small class="soft">' + esc(W(help)) + (dis ? ' ' + esc(W('f_needinv')) : '') + '</small>', '');
    }
    return '<section class="card"><h3>' + esc(W('f_beh')) + '</h3>' + table([
      swRow('inv', 'f_inv', 'f_invh'), swRow('godown', 'f_gd', 'f_gdh'), swRow('batch', 'f_batch', 'f_batchh'), swRow('billwise', 'f_bw', 'f_bwh'),
      row(W('f_gst'), esc(m.gst ? W('f_gston') : m.comp ? W('f_gstcomp') : W('f_gstoff')), lnk(myLink('biz'), W('inmy'), 1)),
      row('', '<small class="soft">' + esc(W('f_gsth')) + '</small>', '')
    ]) + '</section><p>' + lnk('#features', W('f_all')) + '</p><p class="soft">' + esc(W('f_allh')) + '</p>';
  }
  function vtHtml() {
    var c = S(), subs = c.vsub || [];
    var rows = NS.VTYPES.map(function (v, i) {
      var ser = NS.seriesOf(c, v[0], v[1], '', { def: v[2] }), vc = NS.vtCfg(c, v[0], v[1]), bits = [];
      if (vc.copies) bits.push(W('copies', { n: vc.copies })); if (vc.paper) bits.push(vc.paper.toUpperCase()); if (vc.printAfter) bits.push(W('pafter')); if (vc.shareAfter) bits.push(W('safter'));
      var n = subs.filter(function (x) { return x.base === v[0] && (x.kind || '') === (v[1] || ''); }).length;
      return '<tr><td class="l">' + esc(NS.t(v[3])) + (n ? ' <span class="pill">' + esc(W('subs', { n: n })) + '</span>' : '') + '</td><td class="l mono">' + esc(ser.prefix) + '</td><td class="l">' + esc(NS.t('ms.vt_m_' + ser.method)) + '</td><td class="l">' + esc(bits.join(' · ')) + '</td>' +
        '<td class="noprint"><button type="button" class="btn sm" data-cfvt="' + i + '">' + esc(W('configure')) + '</button></td></tr>';
    });
    return '<div class="quick"><button type="button" class="btn primary" data-cfsub>+ ' + esc(NS.t('ms.vt_subnew')) + '</button> ' + lnk('#masters/vt', W('inmasters')) + '</div>' +
      '<div class="tbl-wrap"><table class="tbl cf-tbl"><thead><tr><th>' + esc(NS.t('ms.vtype')) + '</th><th>' + esc(NS.t('hub.pfx')) + '</th><th>' + esc(NS.t('ms.vt_meth')) + '</th><th>' + esc(W('printing')) + '</th><th class="noprint"></th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
      '<p class="soft">' + esc(W('vth')) + '</p>';
  }
  function safeHtml() {
    return table([
      row(W('pin'), esc(W('pinh')), lnk(myLink('settings'), W('inmy'), 1)),
      row(W('lock'), esc(W('lockh')), lnk(myLink('settings'), W('inmy'), 1)),
      row(W('bin'), esc(W('binh')), lnk(myLink('bin'), W('inmy'), 1)),
      row(W('log'), esc(W('logh')), lnk(myLink('log'), W('inmy'), 1))
    ]);
  }
  function dataHtml() {
    return table([
      row(W('backup'), esc(W('backuph')), lnk(myLink('backup'), W('inmy'), 1)),
      row(W('masters'), esc(W('mastersh')), lnk('#masters', W('open'))),
      row(W('mydata'), esc(W('mydatah')), lnk('#do/my/', W('open')))
    ]);
  }
  A.addSection('config', function (arg) {
    var cur = TABS.some(function (t) { return t[0] === arg; }) ? arg : '';
    var body = { '': bizHtml, feat: featHtml, vt: vtHtml, safe: safeHtml, data: dataHtml }[cur];
    return '<div class="pane-hd"><h2>' + esc(W('title')) + '</h2></div>' + tabs(cur) + '<p class="soft">' + esc(W('intro')) + '</p>' + body();
  }, function (pane) {
    if (pane._cfWired) return; pane._cfWired = 1;
    pane.addEventListener('click', function (e) {
      if (!/^#config/.test(location.hash)) return;
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-cfvt') && A.vtEdit) A.vtEdit(+b.getAttribute('data-cfvt'));
      if (b.hasAttribute('data-cfsub') && A.vtSubNew) A.vtSubNew();
    });
    pane.addEventListener('change', function (e) {
      if (!/^#config/.test(location.hash) || !e.target.hasAttribute('data-cfsw')) return;
      var on = e.target.checked, id = biz().id, f = e.target.getAttribute('data-cfsw');
      NS.cfgEdit(id, function (V) {
        V.features = V.features || {};
        var en = V.features[id] = V.features[id] || { sw: {}, at: Date.now() };
        en.sw = en.sw || {}; en.sw[f] = on; en.at = Date.now();
      }, { why: 'feature ' + f + ' ' + (on ? 'on' : 'off') }).then(function (F) { Object.assign(A.cfg(), NS.cfgFor(F, id)); NS.toast(NS.t('ms.saved')); A.show(); }, function (er) { NS.toast(NS.t('nosave', { e: er && er.message || '' }), 'bad'); });
    });
  });

  /* ---------- the gear in every title row (C-12) ---------- */
  function gearBtn(attr) { return '<button type="button" class="btn sm cf-gear" ' + attr + ' title="' + esc(W('gearh')) + '" aria-label="' + esc(W('configure')) + '">' + (NS.icSvg ? NS.icSvg('set') : '⚙') + '<span>' + esc(W('configure')) + '</span></button>'; }
  function openFor(F) {
    var i = formVt(F);
    if (i >= 0 && A.vtEdit) return A.vtEdit(i);
    var sec = (location.hash.replace(/^#/, '').split('/')[0]) || 'home', j = SECVT[sec] ? vtIndex(SECVT[sec]) : -1;
    if (j >= 0 && A.vtEdit && !F) return A.vtEdit(j);
    location.hash = '#config';
  }
  function addGears() {
    var pane = $('[data-pane]');
    if (pane && !/^#config/.test(location.hash)) $$('.pane-hd', pane).slice(0, 1).forEach(function (h) { if (!$('[data-cfgear]', h)) h.insertAdjacentHTML('beforeend', gearBtn('data-cfgear')); });
    $$('dialog[open] [data-form-title]').forEach(function (t) {
      var F = A.vh && A.vh().cur(); if (!F || formVt(F) < 0) return;
      var hd = t.parentNode; if (hd && !$('[data-cfform]', hd)) t.insertAdjacentHTML('afterend', gearBtn('data-cfform'));
    });
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('[data-cfgear],[data-cfform]'); if (!g) return;
    e.preventDefault();
    openFor(g.hasAttribute('data-cfform') ? A.vh && A.vh().cur() : null);
  });
  if (window.MutationObserver) new MutationObserver(function () { clearTimeout(addGears._t); addGears._t = setTimeout(addGears, 60); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  addGears();

  /* F12 (Tally's configuration key) only where the browser does not keep it: the installed App window and the Windows program.
     Ctrl+P on an open, saved voucher screen prints it (C-15; Alt+P is Money paid). */
  function installed() { try { return /Electron/.test(navigator.userAgent) || (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches)); } catch (e) { return false; } }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' && !e.ctrlKey && !e.altKey && !e.shiftKey && installed()) { e.preventDefault(); var dl = $('dialog[open] [data-form-title]'); openFor(dl && A.vh ? A.vh().cur() : null); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key && e.key.toLowerCase() === 'p') {
      var F = $('dialog[open] [data-form-title]') && A.vh && A.vh().cur();
      if (F && F.rec && window.NSVDocs && NSVDocs.siteOf && NSVDocs.siteOf(F.rec)) { e.preventDefault(); NSVDocs.out(F.rec, 'print'); }
    }
  });
})();
