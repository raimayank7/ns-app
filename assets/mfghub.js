/* Manufacturing extras in My data (my.niveshsahayak.in), through NS.hubExt (my.js):
     item form   "Second unit": alt { unit, per } = 1 alt unit holds per main units (1 Box = 12 Pcs). Bills, purchases and
                 stock entries may use either unit; the stock register (mfgcore.js) counts everything in the main unit. */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t;
  function form(s, r) {
    if (s !== 'item') return '';
    var a = r.alt || {};
    return '<fieldset class="card b2-sec"><legend>' + esc(t('mf.altt')) + '</legend><div class="fg">' +
      '<div class="f"><label for="mf-alt">' + esc(t('mf.alt')) + '</label><input id="mf-alt" name="mfalt" dir="auto" list="hub-units" autocomplete="off" value="' + esc(a.unit || '') + '"></div>' +
      '<div class="f"><label for="mf-per">' + esc(t('mf.altper')) + '</label><input id="mf-per" name="mfper" inputmode="decimal" dir="ltr" autocomplete="off" value="' + esc(a.per || '') + '"></div>' +
      '<div class="f wide"><small class="hint">' + esc(t('mf.alth')) + '</small></div></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'item' || !f.elements.mfalt) return;
    var u = f.elements.mfalt.value.trim(), p = NS.num(f.elements.mfper.value);
    if (u && p > 0 && u.toLowerCase() !== String(r.unit || '').trim().toLowerCase()) r.alt = { unit: u, per: p }; else delete r.alt;
  }
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();
