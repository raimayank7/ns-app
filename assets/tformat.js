/* T format (horizontal) final accounts in the Nivesh Sahayak App (after finrep.js). finrep.js asks four hooks:
     A.finT(view, C)           screen body and money tiles of fin/pl and fin/bs when the T format is chosen (else null)
     A.finT(view, C, 'sheet')  the English printed sheet (print, PDF) in the T format (else null)
     A.finWire(pane, view)     the format switch "T format (horizontal)" / "Schedule III (vertical)" above the statement
     A.finXl(C, tb, file)      the Excel file in the T format (trial balance + trading and P&L + balance sheet); true = done
   The choice is meta settings.tf.fmt ('t' | 'v'; none = T format unless the business is a company), the same setting as
   My data › Settings (hubtf.js), so every screen and profit-loss. use it. Sums: NSTF (tfcore.js), drawing: NSTFV (tfview.js). */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NSTF || !window.NSTFV) return;
  var $ = NS.$, esc = NS.esc, money = NS.money, TF = NSTF, V = NSTFV;
  function T(k, v) { return NS.t('tf.' + k, v); }
  function on() { return TF.fmt(A.cfg(), A.biz()) === 't'; }
  function iso(t) { return '⁦' + t + '⁩'; }

  /* trading and P&L + balance sheet figures from finrep's calc() */
  function figs(C) {
    var R = TF.tradingPL(C.rows, C.cs, V.dx(A.cfg())), r = C.r, open = {};
    if (r[0] && window.NSPL) {
      var acc = NSBooks.accounts(A.data().doc, A.bizName(), NSPL.prevDay(r[0]));
      Object.keys(acc).forEach(function (k) { if (k.indexOf('cap:') === 0) open[k] = -acc[k]; });
    }
    var firm = A.famFirm ? A.famFirm(C) : null;   /* famore.js: a firm's partners get the same interest, salary and share as Schedule III */
    return { R: R, firm: !!firm, B: TF.balanceSheet(NSPL.gstNet(C.rows), C.cs, R.net, { capOpen: open, dep: TF.depOf(A.mine(), r[0], r[1]), firm: firm }) };
  }
  function bizHead(title, sub) {
    var Z = A.biz() || {};
    return '<div class="st-hd"><div><b>' + esc(A.bizName()) + '</b>' + (Z.gstin ? '<br>GSTIN ' + esc(Z.gstin) : '') + '</div><div class="r"><b>' + esc(title) + '</b><br>' + esc(sub) + '</div></div>';
  }
  function valEn() { return NSStock.valuation && NSStock.valuation() === 'fifo' ? 'FIFO cost (first in, first out)' : 'weighted average cost'; }
  function sheet(view, C, F) {
    var r = C.r, E = V.EN;
    var top = view === 'pl' ? bizHead(E.t_tpl.toUpperCase(), 'For ' + A.ldate(r[0]) + ' to ' + A.ldate(r[1])) + V.html(F.R, 'tpl', { en: true, firm: F.firm }) +
        '<p>Gross profit = sales less (opening stock + purchases + direct expenses − closing stock). Closing stock valued at ' + valEn() + '.</p>'
      : bizHead(E.t_bs.toUpperCase(), 'As at ' + A.ldate(r[1])) + V.html(F.B, 'bs', { en: true });
    return '<div class="stsheet sh tf-sheet" dir="ltr" lang="en-IN" data-sheet>' + top +
      '<p class="st-ft">Made with the Nivesh Sahayak App on ' + A.ldate(NS.today()) + ' from the saved records. Traditional (T) format. Not audited.</p></div>';
  }

  A.finT = function (view, C, what) {
    if (view !== 'pl' && view !== 'bs' || !on()) return null;
    var F = figs(C);
    if (what === 'sheet') return sheet(view, C, F);
    var R = F.R, r = C.r;
    if (view === 'pl') return {
      tiles: [['k_rev', money(R.sales), 1], ['k_gross', money(R.gross), 1], [R.net < 0 ? 'k_loss' : 'k_profit', money(Math.abs(R.net)), 1]],
      body: '<h3>' + esc(T('plfor', { a: iso(A.ldate(r[0])), b: iso(A.ldate(r[1])) })) + '</h3><div class="tbl-wrap">' + V.html(R, 'tpl', { firm: F.firm }) + '</div>' +
        '<p class="soft">' + esc(R.gross < 0 ? NS.t('fx.gpnotel', { g: money(-R.gross), d: money(R.direct) }) : T('gpnote', { g: money(R.gross), d: money(R.direct) })) + ' <a href="' + esc(A.myUrl('#settings')) + '">' + esc(T('dxchg')) + ' ›</a></p>'
    };
    return { body: '<h3>' + esc(T('bsat', { d: iso(A.ldate(r[1])) })) + '</h3><div class="tbl-wrap">' + V.html(F.B, 'bs') + '</div><p class="soft">' + esc(T('bsnote')) + '</p>' };
  };

  /* the format switch above the statement; the choice is saved for every screen */
  A.finWire = function (pane, view) {
    if (view !== 'pl' && view !== 'bs') return;
    var at = $('.seg', pane); if (!at || $('[data-tffmt]', pane)) return;
    var t = on(), box = NS.el('div', { 'class': 'seg tf-fmt', role: 'group', 'aria-label': T('fmt'), 'data-tffmt': '' },
      [['t', 'f_t'], ['v', 'f_v']].map(function (x) { var p = (x[0] === 't') === t; return '<button type="button" class="btn sm" data-f="' + x[0] + '" aria-pressed="' + p + '">' + esc(T(x[1])) + '</button>'; }).join(''));
    at.parentNode.insertBefore(box, at.nextSibling);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
      var f = b.getAttribute('data-f');
      NS.cfgEdit(A.biz() && A.biz().id || '', function (s) {   /* the format of this business */
        s.tf = Object.assign({}, s.tf, { fmt: f });
        var c = A.cfg(); c.tf = s.tf;   /* the loaded copy, so this screen redraws at once */
      }).then(function () { NS.toast(T('fmtsaved')); A.show(); });
    });
  };

  /* Excel: trial balance as finrep made it, then the two T format sheets (English) */
  A.finXl = function (C, tb, file) {
    if (!on()) return false;
    var F = figs(C), r = C.r, b = A.bizName();
    function top(t, s) { return [[b], [t], [s], []]; }
    NS.xlsx(file, [{ name: 'Trial balance', rows: tb },
      { name: 'Trading and P&L', rows: top('Trading and Profit and Loss Account', 'For ' + A.ldate(r[0]) + ' to ' + A.ldate(r[1])).concat(V.rows(F.R, 'tpl', { firm: F.firm })) },
      { name: 'Balance sheet', rows: top('Balance Sheet', 'As at ' + A.ldate(r[1])).concat(V.rows(F.B, 'bs')) }]);
    return true;
  };

  /* the App can draw fin/pl or fin/bs before this file has loaded (deferred files run one by one): draw it again once */
  function again() { if (/^#fin\/(pl|bs)/.test(location.hash) && $('.fr-print') && !$('[data-tffmt]')) A.show(); }
  again();
  if (window.NSStore && NSStore.ready) NSStore.ready().then(function () { setTimeout(again, 0); });
})();
