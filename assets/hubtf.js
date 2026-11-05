/* Final accounts in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js):
     settings.tf.fmt  '' = by business type (T format; Schedule III for a company) | 't' T format (horizontal) | 'v' Schedule III (vertical)
     settings.tf.dx   { expense account key ('exp:' + head): true = direct (Trading account) | false = indirect (Profit and Loss) }
   Listed: the App's own expense heads in the screen language, then every other head found in the saved expenses and journal
   entries. The default of each comes from NSTF.defaultDirect (tfcore.js), the same rule the statements use. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t, TF = window.NSTF; if (!TF) return;
  var CODES = ['transport', 'fuel', 'salary', 'rent', 'power', 'phone', 'repair', 'office', 'bank', 'prof', 'ads', 'misc'];
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function settings(S) {
    var f = S.tf && S.tf.fmt || '';
    return '<form class="set tf-set" data-tfset id="tf-set"><fieldset class="card"><legend>' + esc(t('tf.set')) + '</legend><div class="fg"><div class="f wide"><label for="tf-fmt">' + esc(t('tf.setfmt')) + '</label><select id="tf-fmt">' +
      opt('', t('tf.f_auto'), f) + opt('t', t('tf.f_t'), f) + opt('v', t('tf.f_v'), f) + '</select><small class="hint">' + esc(t('tf.fmth')) + '</small></div></div>' +
      '<h3 class="dc-sub">' + esc(t('tf.dxt')) + '</h3><p class="hint">' + esc(t('tf.dxh')) + '</p><div data-tfdx><p class="soft">…</p></div></fieldset>' +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(t('tf.save')) + '</button></div></form>';
  }
  function wireSettings(pane, S, save) {
    var f = $('[data-tfset]', pane); if (!f) return;
    var dx = S.tf && S.tf.dx || {};
    NSStore.list('doc').then(function (docs) {
      var rows = [], seen = {};
      function add(k, name, code) { if (seen[k]) return; seen[k] = 1; rows.push({ k: k, name: name, code: code }); }
      CODES.forEach(function (c) { var n = t('app.ex_' + c); add('exp:' + key(n), n, c); });
      (docs || []).forEach(function (d) {
        var c = key(d.cat);   /* sample data and older records keep the App's code (power, rent ...) */
        if (d.type === 'exp' && d.cat && CODES.indexOf(c) < 0) add('exp:' + c, String(d.cat).trim());
        if (d.type === 'jv') (d.lines || []).forEach(function (l) { if (String(l.a || '').indexOf('exp:') === 0 && l.a !== 'exp:depreciation' && !/interest/.test(l.a)) add(l.a, l.nm || l.a.slice(4)); });
      });
      var box = $('[data-tfdx]', f);
      box.innerHTML = '<div class="tbl-wrap"><table class="tbl tf-dx"><thead><tr><th class="l">' + esc(t('tf.head')) + '</th><th class="l">' + esc(t('tf.goes')) + '</th></tr></thead><tbody>' + rows.map(function (r, i) {
        var def = r.code ? TF.defaultDirect('exp:' + r.code, '') : TF.defaultDirect(r.k, r.name);
        var on = dx[r.k] != null ? !!dx[r.k] : def;
        return '<tr><th scope="row" class="l"><label for="tf-dx' + i + '">' + esc(r.name) + '</label></th><td><select id="tf-dx' + i + '" data-k="' + esc(r.k) + '"' + (r.code ? ' data-k2="exp:' + r.code + '"' : '') + ' data-def="' + (def ? 1 : 0) + '">' +
          opt('1', t('tf.direct'), on ? '1' : '0') + opt('0', t('tf.indirect'), on ? '1' : '0') + '</select></td></tr>';
      }).join('') + '</tbody></table></div>';
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var o = {};
      Object.keys(dx).forEach(function (k) { o[k] = dx[k]; });
      $$('[data-k]', f).forEach(function (s) {
        var v = s.value === '1', same = v === (s.getAttribute('data-def') === '1');
        [s.getAttribute('data-k'), s.getAttribute('data-k2')].forEach(function (k) { if (!k) return; if (same) delete o[k]; else o[k] = v; });   /* only what differs from the default is kept; App heads also under their code */
      });
      var fm = $('#tf-fmt', f).value;
      S.tf = { fmt: fm === 't' || fm === 'v' ? fm : '', dx: o };
      save().then(function () { NS.toast(t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();
