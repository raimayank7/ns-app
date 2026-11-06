/* Income and expense heads in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js); Accounts coverage WP-1.
   Lists the ready heads of heads.js (NSHeads) by type with their Tally group, GST credit rule and usual TDS section, and the
   business's own heads (meta 'heads' = { custom: [{ name, t }] }, shared by every business like the other masters).
   An own head can also be made from the App's expense form: a new name asks its type once (acctx.js). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t, H = window.NSHeads; if (!H) return;
  var TYPES = ['dexp', 'iexp', 'oinc', 'dinc'];
  function tl(k, v) { return t('hd.' + k, v); }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  var META = { custom: [] };
  function settings() {
    return '<form class="set hd-set" data-hdset id="hd-set"><fieldset class="card"><legend>' + esc(tl('set')) + '</legend><p class="hint">' + esc(tl('seth')) + '</p>' +
      '<div data-hdlist><p class="soft">…</p></div>' +
      '<h3 class="dc-sub">' + esc(tl('own')) + '</h3><p class="hint">' + esc(tl('ownh')) + '</p><div data-hdown></div>' +
      '<p><button type="button" class="btn sm" data-hdadd>' + esc(tl('add')) + '</button></p></fieldset>' +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(tl('save')) + '</button></div></form>';
  }
  function gstText(g) { return tl('g_' + g); }
  function readyTable() {
    return TYPES.map(function (ty) {
      var rows = H.HEADS.filter(function (h) { return h.t === ty; });
      return '<details class="hd-grp"><summary><b>' + esc(tl('t_' + ty)) + '</b> <span class="soft">(' + rows.length + ') · Tally: ' + esc(H.TALLY[ty]) + '</span></summary>' +
        '<div class="tbl-wrap"><table class="tbl hd-t"><thead><tr><th class="l">' + esc(tl('head')) + '</th><th class="l">' + esc(tl('gst')) + '</th><th class="l">TDS</th></tr></thead><tbody>' +
        rows.map(function (h) { return '<tr><th scope="row" class="l">' + esc(H.label(h)) + (h.fa ? ' <small class="soft">' + esc(tl('fahint')) + '</small>' : '') + '</th><td class="l">' + esc(gstText(h.gst)) + '</td><td class="l" dir="ltr">' + esc(H.tdsLabel(h.tds)) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details>';
    }).join('');
  }
  function ownRow(c, i) {
    return '<div class="hd-own" data-hdrow="' + i + '"><label class="lc"><span>' + esc(tl('head')) + '</span><input id="hd-n' + i + '" value="' + esc(c.name || '') + '" dir="auto" autocomplete="off"></label>' +
      '<label class="lc"><span>' + esc(tl('type')) + '</span><select id="hd-t' + i + '">' + TYPES.map(function (ty) { return opt(ty, tl('t_' + ty), c.t || 'iexp'); }).join('') + '</select></label>' +
      '<button type="button" class="icon-btn rm" data-hdrm="' + i + '" aria-label="' + esc(tl('rm', { h: c.name || '' })) + '">✕</button></div>';
  }
  function wireSettings(pane) {
    var f = $('[data-hdset]', pane); if (!f) return;
    var own = [];
    function drawOwn() {
      $('[data-hdown]', f).innerHTML = own.length ? own.map(ownRow).join('') : '<p class="soft">' + esc(tl('noown')) + '</p>';
      $$('[data-hdrm]', f).forEach(function (b) { b.addEventListener('click', function () { read(); own.splice(+b.getAttribute('data-hdrm'), 1); drawOwn(); }); });
    }
    function read() { own.forEach(function (c, i) { var n = $('#hd-n' + i, f), s = $('#hd-t' + i, f); if (n) c.name = n.value.trim(); if (s) c.t = s.value; }); }
    NSStore.meta('heads').then(function (m) {
      META = m && typeof m === 'object' ? m : { custom: [] };
      own = (META.custom || []).map(function (c) { return { name: c.name, t: c.t }; });
      H.setCustom(own);
      $('[data-hdlist]', f).innerHTML = readyTable();
      drawOwn();
    });
    $('[data-hdadd]', f).addEventListener('click', function () { read(); own.push({ name: '', t: 'iexp' }); drawOwn(); var n = $('#hd-n' + (own.length - 1), f); if (n) n.focus(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); read();
      var seen = {}, bad = '';
      own = own.filter(function (c) { return c.name; }).filter(function (c) {
        var k = H.key(c.name), r = H.find(c.name);
        if (seen[k]) return false; seen[k] = 1;
        if (r && !r.custom) { bad = bad || c.name; return false; }   /* a ready head of the same name: use it instead */
        return true;
      });
      META.custom = own.map(function (c) { return { name: c.name, t: c.t }; });
      NSStore.meta('heads', META).then(function () { H.setCustom(META.custom); drawOwn(); NS.toast(bad ? tl('isready', { h: bad }) : t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();
