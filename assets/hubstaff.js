/* Employees in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js); Accounts coverage WP-5.
   Shows the employee list kept in the data home (NSStaff, meta 'staff', filled by every saved salary slip and by the App's
   Staff, salary and loans screen) with their business, and opens the App to add or change them. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t, S = window.NSStaff; if (!S) return;
  function F(k, v) { return t('sf.' + k, v); }
  var APP = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8985/' : 'https://app.niveshsahayak.in/';
  function settings() {
    return '<fieldset class="card sf-set" data-sfset><legend>' + esc(F('t_emp')) + '</legend><p class="hint">' + esc(F('myh')) + '</p><div data-sflist><p class="soft">…</p></div>' +
      '<p><a class="btn sm" href="' + APP + '#stf/emp" target="_blank" rel="noopener">' + esc(F('manage')) + ' ›</a></p></fieldset>';
  }
  function wireSettings(pane) {
    var box = $('[data-sflist]', pane); if (!box) return;
    S.list('').then(function (l) {
      box.innerHTML = l.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(F('name')) + '</th><th class="l">' + esc(F('desig')) + '</th><th class="l">' + esc(F('biz')) + '</th><th class="l">' + esc(F('status')) + '</th></tr></thead><tbody>' +
        l.map(function (e) { return '<tr><th scope="row" class="l">' + esc(e.name) + '</th><td class="l">' + esc(e.desig || '') + '</td><td class="l">' + esc(e.biz || F('allbiz')) + '</td><td class="l">' + esc(e.left ? F('leftp', { d: NS.fmtDate(e.left) }) : F('working')) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="soft">' + esc(F('noemps')) + '</p>';
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();
