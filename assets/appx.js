/* Batch 1 sections of the Nivesh Sahayak App (after app.js and money.js):
     repeat    repeating bills: invoices saved with "Repeat this bill" (monthly or quarterly). The list shows the copies due up to today;
               nothing is made by itself, the user ticks the bills and taps "Make these bills" (each copy gets the next invoice number).
     reports   registers and reports as Excel files between two dates: sales and purchase registers, dues with credit limits,
               stock summary, party statements, items and prices, edit history.
   The dashboard gets a card when repeating bills are waiting. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, B = NSBooks, key = B.key;
  function tt(k, v) { return NS.t('b1.' + k, v); }

  function due() { return NS.recurringDue(A.mine(), NS.today()); }
  function tpls() { return A.mine().filter(function (d) { return d.rec && d.rec.every; }); }

  A.addHome(function () {
    var n = due().length;
    return n ? '<div class="card"><h3>' + esc(tt('rep_t')) + '</h3><p>' + esc(tt('rep_waiting', { n: n })) + '</p><p><a class="btn primary" href="#repeat">' + esc(tt('rep_see')) + '</a></p></div>' : '';
  });

  A.addSection('repeat', function () {
    var list = due(), all = tpls();
    return '<div class="pane-hd"><h2>' + esc(tt('rep_t')) + '</h2></div><p class="soft">' + esc(tt('rep_p')) + '</p>' +
      '<div class="card"><h3>' + esc(tt('rep_due')) + '</h3>' + (list.length ? '<ul class="rows b1-due">' + list.map(function (x, i) {
        var tp = x.tpl;
        return '<li><label class="chk"><input type="checkbox" data-mk="' + i + '" checked> <b>' + esc(B.partyName(tp) || NS.t('h.nocust')) + '</b></label>' +
          '<span class="soft">' + esc(tt('rep_line', { d: A.ldate(x.date), no: tp.no || '' })) + '</span><b class="amt">' + NS.money(+tp.total || 0) + '</b></li>';
      }).join('') + '</ul><div class="quick"><button type="button" class="btn primary" data-mkgo>' + esc(tt('rep_make')) + '</button></div>' : '<p class="soft">' + esc(tt('rep_none')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(tt('rep_all')) + '</h3>' + (all.length ? '<ul class="rows">' + all.map(function (d) {
        var made = A.mine().filter(function (x) { return x.recOf === d.id; }).length;
        return '<li><div><b>' + esc(B.partyName(d) || NS.t('h.nocust')) + '</b> <span class="pill">' + esc(tt(d.rec.every === 'quarter' ? 'rep_q' : 'rep_m')) + '</span>' + (d.rec.stop ? ' <span class="pill">' + esc(tt('rep_stopped')) + '</span>' : '') +
          '<br><span class="soft">' + esc(tt('rep_from', { no: d.no || '', d: A.ldate(d.date), n: made })) + (d.rec.until ? ' · ' + esc(tt('repuntil')) + ' ' + A.ldate(d.rec.until) : '') + '</span></div>' +
          '<div class="acts"><a class="btn sm" href="' + A.toolUrl('billing') + '?open=' + encodeURIComponent(d.id) + '">' + esc(NS.t('h.open')) + '</a>' +
          '<button type="button" class="btn sm" data-rstop="' + esc(d.id) + '">' + esc(tt(d.rec.stop ? 'rep_restart' : 'rep_stop')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="soft">' + esc(tt('rep_how')) + '</p>') + '</div>';
  }, function (pane) {
    var go = $('[data-mkgo]', pane), list = due();
    if (go) go.addEventListener('click', function () {
      var pick = $$('[data-mk]', pane).filter(function (c) { return c.checked; }).map(function (c) { return list[+c.getAttribute('data-mk')]; });
      if (!pick.length) return;
      go.disabled = true;
      var all = A.data().doc.slice(), made = 0;
      pick.reduce(function (p, x) {
        return p.then(function () { return NS.recurringMake(x, all, A.cfg()).then(function (d) { all.push(d); made++; }); });
      }, Promise.resolve()).then(function () { NS.toast(tt('rep_made', { n: made })); A.show(); }, function (err) { NS.toast(NS.t('nosave', { e: err.message }), 'bad'); A.show(); });
    });
    $$('[data-rstop]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = A.data().doc.filter(function (x) { return x.id === b.getAttribute('data-rstop'); })[0]; if (!d) return;
        d.rec = Object.assign({}, d.rec, { stop: !d.rec.stop });
        NSStore.put('doc', d).then(function () { A.show(); }, function (err) { NS.toast(err.message, 'bad'); });
      });
    });
  });

  /* ---------- reports to Excel ---------- */
  var REPS = ['sales', 'purchases', 'dues', 'stock', 'statements', 'items', 'log', 'all'];
  A.addSection('reports', function () {
    var r = A.range();
    return '<div class="pane-hd"><h2>' + esc(tt('rp_t')) + ' <small class="soft">' + esc(A.bizName()) + '</small></h2></div><p class="soft">' + esc(tt('rp_p')) + '</p>' +
      '<div class="tools-row"><label>' + esc(A.T('from')) + ' <input type="date" data-stfrom value="' + r[0] + '"></label><label>' + esc(A.T('to')) + ' <input type="date" data-stto value="' + r[1] + '"></label></div>' +
      '<div class="b1-rep">' + REPS.map(function (k) {
        return '<div class="card"><h3>' + esc(tt('rp_' + k)) + '</h3><p class="soft">' + esc(tt('rp_' + k + 'p')) + '</p><button type="button" class="btn' + (k === 'all' ? ' primary' : '') + '" data-rp="' + k + '">' + esc(tt('xl')) + '</button></div>';
      }).join('') + '</div>';
  }, function (pane) {
    $$('[data-rp]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-rp'), r = A.range(), D = A.mine(), C = A.data(), biz = A.bizName(), today = NS.today(), R = NS.reports;
        var file = function (n) { return (biz.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'business').toLowerCase() + '-' + n + '-' + r[0] + '-to-' + r[1] + '.xlsx'; };
        var statements = function () {
          var P = B.parties(D, biz);
          return Object.keys(P).sort(function (a, c) { return P[a].name.localeCompare(P[c].name); }).slice(0, 40).map(function (pk) { return R.statement(D, biz, pk, P[pk].name, r[0], r[1]); });
        };
        var S = {
          sales: function () { return [R.sales(D, r[0], r[1])]; },
          purchases: function () { return [R.purchases(D, r[0], r[1])]; },
          dues: function () { return [R.dues(D, biz, C.party, today, 'recv'), R.dues(D, biz, C.party, today, 'pay')]; },
          stock: function () { return [R.stock(C.doc, C.item, biz, r[0], r[1])]; },
          statements: statements,
          items: function () { return [R.items(C.item)]; },
          log: function () { return NSStore.list('log').then(function (L) { return [R.log(L.filter(function (e) { var d = new Date(e.at).toISOString().slice(0, 10); return d >= r[0] && d <= r[1]; }))]; }); }
        };
        var go = k === 'all' ? Promise.all(['sales', 'purchases', 'dues', 'stock', 'items', 'log'].map(function (x) { return S[x](); })).then(function (l) { return [].concat.apply([], l); })
          : Promise.resolve(S[k]());
        go.then(function (sheets) { return NS.xlsx(file(k === 'all' ? 'reports' : k), sheets); });
      });
    });
  });
})();
