/* Batch 2 in My data (my.niveshsahayak.in), through NS.hubExt (my.js):
     item form   "Stock tracking": track '' | 'batch' (batch and expiry) | 'serial' (serial or IMEI numbers) | 'both'
     Settings    godowns [names], salesmen [{ name, rate, basis 'sales' | 'paid' }],
                 custom fields on documents cfields [{ id, label, types: [document types], print }],
                 stock valuation stockValue 'avg' (weighted average, default) | 'fifo' (NSStock.valuation),
                 and the financial years closed in the App's Year end (shown here, changed there). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t;
  var TYPES = ['invoice', 'quote', 'proforma', 'so', 'challan', 'po', 'note', 'cashmemo', 'self'];
  var TRACK = ['', 'batch', 'serial', 'both'];
  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur || '') ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function form(s, r) {
    if (s !== 'item') return '';
    var bom = r.bom && (r.bom.lines || []).length ? '<p class="hint">' + esc(t('b2.hasbom', { l: r.bom.lines.map(function (l) { return l.desc + ' ' + l.qty; }).join(', ') })) + '</p>' : '';
    return '<fieldset class="card b2-sec"><legend>' + esc(t('b2.trackt')) + '</legend><div class="fg"><div class="f wide"><label for="b2-track">' + esc(t('b2.track')) + '</label><select id="b2-track" name="b2track">' +
      TRACK.map(function (k) { return opt(k, t('b2.tr_' + (k || 'none')), r.track); }).join('') + '</select><small class="hint">' + esc(t('b2.trackh')) + '</small></div></div>' + bom + '</fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'item' || !f.elements.b2track) return;
    if (f.elements.b2track.value) r.track = f.elements.b2track.value; else delete r.track;
  }

  var SM = [], CF = [];
  function smRow(x, i) {
    return '<div class="b2-row" data-smi="' + i + '"><label><span>' + esc(t('b2.smname')) + '</span><input data-sm="name" dir="auto" value="' + esc(x.name || '') + '"></label>' +
      '<label><span>' + esc(t('b2.smrate')) + '</span><input data-sm="rate" inputmode="decimal" dir="ltr" value="' + esc(x.rate == null ? '' : x.rate) + '"></label>' +
      '<label><span>' + esc(t('b2.smbasis')) + '</span><select data-sm="basis">' + opt('sales', t('b2.on_sales'), x.basis) + opt('paid', t('b2.on_paid'), x.basis) + '</select></label>' +
      '<button type="button" class="icon-btn" data-smrm="' + i + '" aria-label="' + esc(t('b2.rm')) + '">✕</button></div>';
  }
  function cfRow(x, i) {
    return '<div class="b2-row cf" data-cfi="' + i + '"><label><span>' + esc(t('b2.cflabel')) + '</span><input data-cf="label" dir="auto" maxlength="40" value="' + esc(x.label || '') + '" placeholder="' + esc(t('b2.cfph')) + '"></label>' +
      '<label class="chk"><input type="checkbox" data-cf="print"' + (x.print ? ' checked' : '') + '> ' + esc(t('b2.cfprint')) + '</label>' +
      '<button type="button" class="icon-btn" data-cfrm="' + i + '" aria-label="' + esc(t('b2.rm')) + '">✕</button>' +
      '<fieldset class="b2-types"><legend>' + esc(t('b2.cftypes')) + '</legend>' + TYPES.map(function (ty) {
        var on = !x.types || !x.types.length || x.types.indexOf(ty) >= 0;
        return '<label class="chk"><input type="checkbox" data-cft="' + ty + '"' + (on ? ' checked' : '') + '> ' + esc(t('Doc.' + ty)) + '</label>'; }).join('') + '</fieldset></div>';
  }
  function settings(S) {
    SM = JSON.parse(JSON.stringify(S.salesmen || [])); CF = JSON.parse(JSON.stringify(S.cfields || []));
    var closed = []; Object.keys(S.closed || {}).forEach(function (b) { (S.closed[b] || []).forEach(function (fy) { closed.push(fy); }); });
    return '<form class="set b2-set" data-b2set>' +
      '<fieldset class="card"><legend>' + esc(t('b2.gds')) + '</legend><p class="hint">' + esc(t('b2.gdsh')) + '</p><div class="fg"><div class="f wide"><label for="b2-gds">' + esc(t('b2.gdlist')) + '</label>' +
        '<textarea id="b2-gds" rows="3" dir="auto" placeholder="' + esc(t('b2.gdph')) + '">' + esc((S.godowns || []).join('\n')) + '</textarea></div></div></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('b2.sms')) + '</legend><p class="hint">' + esc(t('b2.smsh')) + '</p><div data-sms></div><button type="button" class="btn sm" data-smadd>+ ' + esc(t('b2.smadd')) + '</button></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('b2.cfs')) + '</legend><p class="hint">' + esc(t('b2.cfsh')) + '</p><div data-cfs></div><button type="button" class="btn sm" data-cfadd>+ ' + esc(t('b2.cfadd')) + '</button></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('fr.val')) + '</legend><div class="fg"><div class="f wide"><label for="b2-val">' + esc(t('fr.valq')) + '</label><select id="b2-val">' +
        [['avg', 'fr.val_avg'], ['fifo', 'fr.val_fifo']].map(function (o) { return '<option value="' + o[0] + '"' + ((S.stockValue === 'fifo' ? 'fifo' : 'avg') === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') +
        '</select><small class="hint">' + esc(t('fr.valh')) + '</small></div></div></fieldset>' +
      (closed.length ? '<fieldset class="card"><legend>' + esc(t('b2.closedy')) + '</legend><p>' + esc(closed.sort().join(', ')) + '</p><p class="hint">' + esc(t('b2.closedyh')) + '</p></fieldset>' : '') +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(t('b2.saveset')) + '</button></div></form>';
  }
  function wireSettings(pane, S, save) {
    var f = $('[data-b2set]', pane); if (!f) return;
    function readSm() { $$('[data-smi]', f).forEach(function (row) { var x = SM[+row.getAttribute('data-smi')]; $$('[data-sm]', row).forEach(function (i) { x[i.getAttribute('data-sm')] = i.value.trim(); }); }); }
    function readCf() {
      $$('[data-cfi]', f).forEach(function (row) {
        var x = CF[+row.getAttribute('data-cfi')];
        x.label = $('[data-cf=label]', row).value.trim(); x.print = $('[data-cf=print]', row).checked;
        var ty = $$('[data-cft]', row).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-cft'); });
        x.types = ty.length === TYPES.length ? [] : ty;
      });
    }
    function draw() {
      $('[data-sms]', f).innerHTML = SM.map(smRow).join('') || '<p class="soft">' + esc(t('b2.nosm')) + '</p>';
      $('[data-cfs]', f).innerHTML = CF.map(cfRow).join('') || '<p class="soft">' + esc(t('b2.nocf')) + '</p>';
      $$('[data-smrm]', f).forEach(function (b) { b.addEventListener('click', function () { readSm(); SM.splice(+b.getAttribute('data-smrm'), 1); draw(); }); });
      $$('[data-cfrm]', f).forEach(function (b) { b.addEventListener('click', function () { readCf(); CF.splice(+b.getAttribute('data-cfrm'), 1); draw(); }); });
    }
    draw();
    $('[data-smadd]', f).addEventListener('click', function () { readSm(); SM.push({ name: '', rate: '', basis: 'sales' }); draw(); var i = $$('[data-sm=name]', f); i[i.length - 1].focus(); });
    $('[data-cfadd]', f).addEventListener('click', function () { readCf(); CF.push({ id: 'f' + Date.now().toString(36), label: '', types: [], print: true }); draw(); var i = $$('[data-cf=label]', f); i[i.length - 1].focus(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); readSm(); readCf();
      var seen = {};
      S.godowns = $('#b2-gds', f).value.split(/\n+/).map(function (x) { return x.trim(); }).filter(function (x) { var k = x.toLowerCase(); if (!x || seen[k] || k === 'main') return false; seen[k] = 1; return true; });
      S.salesmen = SM.filter(function (x) { return x.name; }).map(function (x) { return { name: x.name, rate: NS.num(x.rate), basis: x.basis === 'paid' ? 'paid' : 'sales' }; });
      S.cfields = CF.filter(function (x) { return x.label; });
      S.stockValue = $('#b2-val', f).value === 'fifo' ? 'fifo' : 'avg';
      save().then(function () { NS.toast(t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read, settings: settings, wireSettings: wireSettings });
})();
