/* Type of business and partners in My data (my.niveshsahayak.in), through NS.hubExt (my.js); the App's final accounts read them
   (facore.js / famore.js):
     business form   btype 'prop' (proprietor, the default) | 'firm' (partnership firm) | 'llp' | 'co' (company) | 'npo' (trust or
                     society, non-profit, school); partners [{ name, share (profit share %), ic (interest on capital % a year),
                     sal (salary / remuneration a year) }] for a firm or LLP. */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t, $ = NS.$, $$ = NS.$$;
  var TYPES = ['prop', 'firm', 'llp', 'co', 'npo'];
  function row(p) {
    p = p || {};
    function inp(n, v, lbl, ltr) { return '<label><span>' + esc(t(lbl)) + '</span><input data-fmp="' + n + '" value="' + esc(v == null ? '' : v) + '"' + (ltr ? ' inputmode="decimal" dir="ltr"' : ' dir="auto"') + ' autocomplete="off"></label>'; }
    return '<div class="fm-prow" data-fmrow>' + inp('name', p.name, 'fm.p_name') + inp('share', p.share, 'fm.p_share', 1) + inp('ic', p.ic, 'fm.p_ic', 1) + inp('sal', p.sal, 'fm.p_sal', 1) +
      '<button type="button" class="btn sm" data-fmrm aria-label="' + esc(t('fm.p_rm')) + '">' + esc(t('fm.p_rm')) + '</button></div>';
  }
  function form(s, r) {
    if (s !== 'biz') return '';
    var bt = TYPES.indexOf(r.btype) >= 0 ? r.btype : 'prop', P = (r.partners || []).length ? r.partners : [{}, {}];
    return '<fieldset class="card b2-sec fm-biz"><legend>' + esc(t('fm.btype')) + '</legend><div class="fg">' +
      '<div class="f"><label for="fm-bt" class="vh">' + esc(t('fm.btype')) + '</label><select id="fm-bt" name="fmbtype" data-fmbt>' + TYPES.map(function (k) {
        return '<option value="' + k + '"' + (k === bt ? ' selected' : '') + '>' + esc(t('fm.b_' + k)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f wide"><small class="hint">' + esc(t('fm.btypeh')) + '</small></div></div>' +
      '<div data-fmparts' + (bt === 'firm' || bt === 'llp' ? '' : ' hidden') + '><h4>' + esc(t('fm.partners')) + '</h4><div data-fmlist>' + P.map(row).join('') + '</div>' +
      '<button type="button" class="btn sm" data-fmadd>' + esc(t('fm.p_add')) + '</button><small class="hint">' + esc(t('fm.p_h')) + '</small></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'biz' || !f.elements.fmbtype) return;
    var bt = f.elements.fmbtype.value;
    if (bt && bt !== 'prop') r.btype = bt; else delete r.btype;
    var P = $$('[data-fmrow]', f).map(function (el) {
      function v(n) { return $('[data-fmp="' + n + '"]', el).value.trim(); }
      return { name: v('name'), share: NS.num(v('share')), ic: NS.num(v('ic')), sal: NS.num(v('sal')) };
    }).filter(function (p) { return p.name; });
    if (bt === 'firm' || bt === 'llp') { if (P.length) r.partners = P; else delete r.partners; }   /* another type keeps the list, in case it is switched back */
  }
  /* add / remove partner rows and show them only for a firm or LLP (the form is drawn again on every open) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-fmadd],[data-fmrm]'); if (!a) return;
    var box = a.closest('.fm-biz'); if (!box) return;
    if (a.hasAttribute('data-fmadd')) { var l = $('[data-fmlist]', box); l.insertAdjacentHTML('beforeend', row({})); $('[data-fmrow]:last-child input', l).focus(); }
    else a.closest('[data-fmrow]').remove();
  });
  document.addEventListener('change', function (e) {
    var s = e.target; if (!s.hasAttribute || !s.hasAttribute('data-fmbt')) return;
    var p = $('[data-fmparts]', s.closest('.fm-biz')); if (p) p.hidden = !(s.value === 'firm' || s.value === 'llp');
  });
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();
