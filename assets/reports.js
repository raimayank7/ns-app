/* Reports that work like an ERP (ERP review Round 1: reports.md R-1, R-3, R-4, R-13, R-15; config-ux.md C-5). After finrep.js, the full App only.
     Keys on every report: Up / Down move a row cursor, Enter opens what the row shows (its ledger, the voucher), Home / End,
     Esc goes back one level (desk.js, by the App's trail) and the screen comes back on the same row, scrolled where it was.
     Alt+F2 (or the period in the status bar) = the working period of every report (core.js NS.period).
     os/recv, os/pay   bill-wise outstanding of every party as on a date, ageing buckets the user sets (Tally: Outstandings)
     exc               things to check: negative cash, overdue bills, unused advances, duplicate numbers, future dates... with a Dashboard tile
   The sums are in repcore.js (NSRep). Printed sheets are in English like every printed report. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NSRep) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, money = NS.money, B = NSBooks, R = NSRep, key = B.key;
  function T(k, v) { return NS.t('rp.' + k, v); }
  function fileName(s) { return String(s).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'business'; }
  function bizHead(title, sub) {
    var Z = A.biz() || {};
    return '<div class="st-hd"><div><b>' + esc(A.bizName()) + '</b>' + (Z.gstin ? '<br>GSTIN ' + esc(Z.gstin) : '') + '</div><div class="r"><b>' + esc(title) + '</b><br>' + sub + '</div></div>';
  }
  function eye(id) { return '<button type="button" class="btn sm ib" data-view="' + esc(id) + '" title="' + esc(A.T('open')) + '" aria-label="' + esc(A.T('open')) + '">' + NS.icSvg('eye') + '</button>'; }
  function typing(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }

  /* ---------- R-4: a row cursor on every report table ---------- */
  var ROWSEL = 'table.lg-tbl > tbody > tr, table.fr-st > tbody > tr, table.fr-tb > tbody > tr, table.sm-tbl > tbody > tr, table.sl-led > tbody > tr';
  function target(tr) { return tr.querySelector('a[href^="#"]') || tr.querySelector('[data-view]'); }
  function rows() {
    var pane = $('[data-pane]'); if (!pane) return [];
    return $$(ROWSEL, pane).filter(function (tr) { return tr.offsetParent !== null && !tr.closest('.fr-print') && target(tr); });
  }
  function rowKey(tr) { var t = target(tr); return tr.getAttribute('data-k') || (t && (t.getAttribute('href') || t.getAttribute('data-view'))) || (tr.textContent || '').trim().slice(0, 60); }
  function setCur(tr, focus) {
    $$('tr.rp-cur').forEach(function (x) { if (x !== tr) x.classList.remove('rp-cur'); });
    if (!tr) return;
    tr.classList.add('rp-cur'); tr.tabIndex = -1;
    if (focus) { tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' }); }
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || $('dialog[open]') || typing(e.target)) return;
    if (!/^(ArrowDown|ArrowUp|Home|End|Enter)$/.test(e.key)) return;
    var L = rows(); if (!L.length) return;
    var cur = $('tr.rp-cur'), i = L.indexOf(cur);
    if (e.key === 'Enter') {
      if (i < 0 || document.activeElement !== cur) return;   /* Enter on a link or button keeps its own job */
      e.preventDefault(); remember(cur); var t = target(cur); if (t) t.click(); return;
    }
    e.preventDefault();
    i = e.key === 'Home' ? 0 : e.key === 'End' ? L.length - 1 : i < 0 ? (e.key === 'ArrowUp' ? L.length - 1 : 0) : Math.max(0, Math.min(L.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    setCur(L[i], true);
  });
  /* a click on a row marks it (so Esc comes back to it); a click on its link remembers where the screen was */
  window.addEventListener('click', function (e) {
    var tr = e.target.closest && e.target.closest('tr'); if (!tr || !tr.closest('[data-pane]')) return;
    if (rows().indexOf(tr) < 0) return;
    setCur(tr, false);
    if (e.target.closest('a[href^="#"]')) remember(tr);
  }, true);

  /* ---------- R-1: back on the same row, scrolled where it was ---------- */
  var STATE = {};
  function here() { return decodeURIComponent(location.hash.slice(1)); }
  function remember(tr) { STATE[here()] = { k: tr ? rowKey(tr) : '', y: window.scrollY, at: Date.now() }; }
  function restore(tries) {
    var s = STATE[here()]; if (!s) return;
    var tr = rows().filter(function (x) { return rowKey(x) === s.k; })[0];
    if (!tr && tries > 0) { setTimeout(function () { restore(tries - 1); }, 220); return; }
    delete STATE[here()];
    try { window.scrollTo(0, s.y); } catch (e) {}
    if (tr) setCur(tr, true);
  }
  window.addEventListener('hashchange', function () { setTimeout(function () { restore(4); }, 40); });
  /* a Back link of a report (party ledger) goes back the way the user came, not always to one list */
  window.addEventListener('click', function (e) {   /* window, capture: before the App's own link handling */
    var a = e.target.closest && e.target.closest('a[data-back]'); if (!a || e.button || e.ctrlKey || e.metaKey) return;
    var tr = A.trail && A.trail(); if (tr && tr.length > 1) { e.preventDefault(); e.stopImmediatePropagation(); history.back(); }
  }, true);

  /* ---------- R-3 / C-5: the working period box (Alt+F2, the status bar) ---------- */
  var pdlg;
  function periodBox() {
    if (!A.biz()) return;
    if (!pdlg) {
      pdlg = NS.el('dialog', { 'class': 'hub-dlg rp-per', 'aria-labelledby': 'rp-per-t' });
      document.body.appendChild(pdlg);
    }
    var p = NS.period(), P = NS.periodPresets(NS.today()), on = NS.periodPre(p.from, p.to);
    pdlg.innerHTML = '<div class="dlg-hd"><h2 id="rp-per-t">' + esc(T('per_t')) + '</h2><button type="button" class="icon-btn" data-x aria-label="' + esc(NS.t('close')) + '">✕</button></div>' +
      '<form method="dialog" class="rp-perf"><p class="soft">' + esc(T('per_h')) + '</p><div class="fg">' +
      '<div class="f"><label for="rp-pre">' + esc(A.T('lg_period')) + '</label><select id="rp-pre">' + Object.keys(P).concat(['custom']).map(function (k) { return '<option value="' + k + '"' + (k === on ? ' selected' : '') + '>' + esc(A.T('lg_p_' + k)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="rp-from">' + esc(A.T('from')) + '</label><input id="rp-from" type="date" value="' + p.from + '"></div>' +
      '<div class="f"><label for="rp-to">' + esc(A.T('to')) + ' <small class="soft">(' + esc(T('per_ason')) + ')</small></label><input id="rp-to" type="date" value="' + p.to + '"></div></div>' +
      '<div class="dlg-foot btns"><button type="submit" class="btn primary" value="ok">' + esc(T('per_ok')) + '</button><button type="button" class="btn" data-x>' + esc(A.T('cancel')) + '</button></div></form>';
    var f = $('#rp-from', pdlg), t = $('#rp-to', pdlg), s = $('#rp-pre', pdlg);
    s.addEventListener('change', function () { var q = P[s.value]; if (q) { f.value = q[0]; t.value = q[1]; } });
    [f, t].forEach(function (x) { x.addEventListener('change', function () { s.value = NS.periodPre(f.value, t.value); }); });
    $$('[data-x]', pdlg).forEach(function (b) { b.addEventListener('click', function () { pdlg.close(); }); });
    $('form', pdlg).addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.value || !t.value) return;
      NS.periodSet(f.value, t.value, s.value === 'custom' ? 'custom' : s.value); pdlg.close(); A.show(); status();
    });
    pdlg.showModal(); s.focus();
  }
  NS.periodBox = periodBox;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'F2' || !e.altKey || e.ctrlKey || e.metaKey || $('dialog[open]')) return;
    e.preventDefault(); periodBox();
  });
  /* the status bar shows the period; a tap on it opens the box. A year other than the current one is coloured (C-5 d). */
  function status() {
    var c = $('[data-s-fy]'); if (!c || !A.biz()) return;
    var p = NS.period();
    c.textContent = NS.fmtDate(p.from) + ' – ' + NS.fmtDate(p.to);
    c.setAttribute('role', 'button'); c.tabIndex = 0; c.title = T('per_t') + '  ·  Alt+F2';
    c.classList.toggle('rp-oldyr', NS.fy(p.to) !== NS.fy(NS.today()));
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-s-fy]') && A.biz()) periodBox(); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-s-fy]')) { e.preventDefault(); periodBox(); } });
  window.addEventListener('ns-period', function () { setTimeout(status, 0); });
  window.addEventListener('hashchange', function () { setTimeout(status, 60); });
  if (window.NSStore && NSStore.ready) NSStore.ready().then(function () { setTimeout(status, 600); });

  /* ---------- R-2 in the T format (tfview.js draws its own rows): each account / head name opens what makes it up ---------- */
  function tfLinks() {
    if (!/^#fin\/(pl|bs)/.test(location.hash) || !A.fin || !A.fin.calc) return;
    var cells = $$('[data-pane] .tf-t th.l').filter(function (th) { return !th.closest('.fr-print') && !th.querySelector('a') && !th.closest('thead'); });
    if (!cells.length) return;
    var C = A.fin.calc(), map = {}, norm = function (t) { return String(t || '').replace(/[\u2066-\u2069]/g, '').replace(/^\s*(To|By|Less:)\s+/i, '').trim().toLowerCase(); };
    C.rows.forEach(function (x) { var h = A.fin.hrefOf(x.k); if (h && x.loc) map[norm(x.loc)] = h; });
    A.fin.plLines(C).concat(A.fin.bsLines(C)).forEach(function (x) { if (x.h && x.loc && !map[norm(x.loc)]) map[norm(x.loc)] = x.h; });
    Object.assign(map, { 'opening stock': '#do/stock/', 'closing stock': '#do/stock/', 'sales': map.sales || '#acl/sales', 'purchases': map.purchases || '#acl/purchases', 'indirect expenses': '#gsum/oth', 'sundry debtors': '#dlist', 'sundry creditors': '#clist' });
    cells.forEach(function (th) { var h = map[norm(th.textContent)]; if (h) th.innerHTML = '<a href="' + h + '">' + th.innerHTML + '</a>'; });
  }
  (function () {
    var t = 0, mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { try { tfLinks(); } catch (e) {} }, 60); });
    function go() { var p = $('[data-pane]'); if (p) mo.observe(p, { childList: true, subtree: false }); else setTimeout(go, 300); }
    go();
  })();

  /* ---------- R-13: bill-wise outstanding of every party ---------- */
  var osSide = 'recv', osAs = '', osDue = true, osMin = '';
  function ageStore(v) {
    var id = (A.biz() || {}).id || '-', o = {};
    try { o = JSON.parse(localStorage.getItem('ns-ageing') || '{}') || {}; } catch (e) {}
    if (v == null) return R.ageLimits(o[id]);
    o[id] = R.ageLimits(v).join(', ');
    try { localStorage.setItem('ns-ageing', JSON.stringify(o)); } catch (e) {}
    return R.ageLimits(v);
  }
  A.ageLimits = function () { return ageStore(); };
  function osData() {
    var as = osAs || A.range()[1], cd = {}, P = B.parties(A.mine(), A.bizName());
    A.data().party.forEach(function (p) { if (num(p.cdays)) cd[key(p.name)] = num(p.cdays); });
    var X = R.outstanding(A.mine(), A.bizName(), as, { side: osSide, byDue: osDue, limits: ageStore(), cdays: cd, min: num(osMin) });
    X.rows = X.rows.filter(function (r) { return A.grpKeep(r.pkey, P); });
    X.buckets = X.buckets.map(function () { return 0; }); X.tot = 0;
    X.rows.forEach(function (r) { X.buckets[r.b] = NS.r2(X.buckets[r.b] + r.left); X.tot = NS.r2(X.tot + r.left); });
    X.as = as; return X;
  }
  A.addSection('os', function (arg) {
    if (arg === 'pay' || arg === 'recv') osSide = arg;
    var X = osData(), recv = osSide === 'recv';
    var bar = '<div class="lg-bar"><div class="seg" role="group">' + [['recv', A.T('recv')], ['pay', A.T('pay')]].map(function (x) { return '<a class="btn sm" href="#os/' + x[0] + '" aria-pressed="' + (x[0] === osSide) + '">' + esc(x[1]) + '</a>'; }).join('') + '</div>' +
      '<label><span>' + esc(T('os_as')) + '</span> <input type="date" data-osas value="' + X.as + '"></label>' + A.grpSel() +
      '<label><span>' + esc(T('os_age')) + '</span> <select data-osdue><option value="1"' + (osDue ? ' selected' : '') + '>' + esc(T('os_duedt')) + '</option><option value="0"' + (osDue ? '' : ' selected') + '>' + esc(T('os_billdt')) + '</option></select></label>' +
      '<label><span>' + esc(T('os_buckets')) + '</span> <input data-osb value="' + esc(X.limits.join(', ')) + '" inputmode="numeric" style="width:9em" autocomplete="off"></label>' +
      '<label><span>' + esc(A.T('dc_min')) + '</span> <input type="number" min="0" step="1" data-osmin value="' + esc(osMin) + '" style="width:8em"></label></div>';
    var sum = '<table class="tbl st lg-tbl os-sum"><thead><tr>' + X.names.map(function (n) { return '<th class="n">' + esc(n) + '</th>'; }).join('') + '<th class="n">Total</th></tr></thead><tbody><tr>' +
      X.buckets.map(function (v) { return '<td class="n">' + (v ? money(v, false) : '—') + '</td>'; }).join('') + '<td class="n"><b>' + money(X.tot, false) + '</b></td></tr></tbody></table>';
    var body = X.rows.length ? '<table class="tbl st lg-tbl os-tbl"><thead><tr><th>Party</th><th>Bill</th><th>Date</th><th>Due date</th><th class="n">Amount</th><th class="n">Settled</th><th class="n">Pending</th><th class="n">Overdue days</th><th>Age</th><th class="noprint"></th></tr></thead><tbody>' +
      X.rows.map(function (r) {
        return '<tr data-k="' + esc(r.id) + '"' + (r.overdue > 0 ? ' class="os-late"' : '') + '><td><a href="#st/' + encodeURIComponent(r.pkey) + '">' + esc(r.party) + '</a></td><td>' + esc(A.enName(r) + ' ' + (r.no || '')) + '</td><td>' + esc(A.ldate(r.date)) + '</td><td>' + (r.due ? esc(A.ldate(r.due)) : '') + '</td>' +
          '<td class="n">' + money(r.total, false) + '</td><td class="n">' + (r.settled ? money(r.settled, false) : '') + '</td><td class="n"><b>' + money(r.left, false) + '</b></td><td class="n">' + (r.overdue || '') + '</td><td>' + esc(X.names[r.b]) + '</td>' +
          '<td class="noprint">' + (r.type === 'jv' || r.type === 'paid' ? '' : eye(r.id)) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><th colspan="6">Total (' + X.rows.length + ')</th><th class="n">' + money(X.tot, false) + '</th><th colspan="2"></th><th class="noprint"></th></tr></tfoot></table>'
      : '<p class="soft">' + esc(A.T('nodues')) + '</p>';
    var title = recv ? 'BILL-WISE OUTSTANDING: RECEIVABLE' : 'BILL-WISE OUTSTANDING: PAYABLE';
    return '<div class="pane-hd"><h2>' + esc(T('os_t')) + '</h2><div class="quick no-print"><button type="button" class="btn" data-print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-ospdf>' + esc(A.T('pdf')) + '</button><button type="button" class="btn" data-osxl>' + esc(A.T('lg_xl')) + '</button></div></div>' +
      bar + '<p class="soft">' + esc(T('os_h')) + '</p>' +
      '<div class="tbl-wrap"><div class="lg-print"><div class="stsheet sh lg-rep wide" dir="ltr" data-sheet>' + bizHead(title, 'As on ' + esc(A.ldate(X.as)) + '<br>Age from the ' + (osDue ? 'due date' : 'bill date')) + sum + body + NS.creditLine('st-ft') + '</div></div></div>';
  }, function (pane) {
    var a = $('[data-osas]', pane); if (a) a.addEventListener('change', function () { osAs = a.value; A.show(); });
    var d = $('[data-osdue]', pane); if (d) d.addEventListener('change', function () { osDue = d.value === '1'; A.show(); });
    var b = $('[data-osb]', pane); if (b) b.addEventListener('change', function () { ageStore(b.value); A.show(); });
    var m = $('[data-osmin]', pane); if (m) m.addEventListener('change', function () { osMin = m.value; A.show(); });
    var pb = $('[data-ospdf]', pane); if (pb) pb.addEventListener('click', function () { var n = $('.lg-print > .stsheet', pane).cloneNode(true); n.classList.add('lg-paper'); NS.sharePdf([n], fileName(A.bizName()) + '-outstanding-' + osSide, 'a4', T('os_t'), ''); });
    var xb = $('[data-osxl]', pane); if (xb) xb.addEventListener('click', function () {
      var X = osData(), rows = [['Bill-wise outstanding: ' + (osSide === 'recv' ? 'receivable' : 'payable'), 'As on ' + X.as, 'Age from the ' + (osDue ? 'due date' : 'bill date')], ['Party', 'Bill', 'Bill no.', 'Date', 'Due date', 'Amount', 'Settled', 'Pending', 'Overdue days', 'Age']];
      X.rows.forEach(function (r) { rows.push([r.party, A.enName(r), r.no, r.date, r.due, r.total, r.settled, r.left, r.overdue, X.names[r.b]]); });
      rows.push(['Total', '', '', '', '', '', '', X.tot]); rows.push([]); rows.push(X.names.concat(['Total'])); rows.push(X.buckets.concat([X.tot]));
      NS.xlsx(fileName(A.bizName()) + '-outstanding-' + osSide + '-' + X.as + '.xlsx', [{ name: 'Outstanding', rows: rows }]);
    });
  });

  /* ---------- R-15: things to check ---------- */
  var XL = { negcash: '#books/cash', overdue: '#os/recv', pdc: '#chq', bounced: '#chq' };
  function excData() {
    var r = A.range(), BL = A.banks ? A.banks() : [{ k: 'bank' }], od = {};
    BL.forEach(function (b) { if (b && (b.od || b.type === 'od')) od[b.k] = 1; });
    return R.exceptions(A.mine(), A.bizName(), { today: NS.today(), from: r[0], to: r[1], parties: A.data().party, days: 90, banks: BL.map(function (b) { return b.k; }), odBanks: od });
  }
  function itemHtml(id, x) {
    var amt = x.amt != null ? ' <b>' + money(Math.abs(x.amt)) + (x.amt < 0 ? ' Cr' : '') + '</b>' : '';
    var lab = esc(x.text || '') + (x.date ? ' <span class="soft">' + esc(A.ldate(x.date)) + '</span>' : '') + amt + (x.days ? ' <span class="soft">· ' + esc(T('x_days', { n: x.days })) + '</span>' : '') + (x.limit ? ' <span class="soft">· ' + esc(T('x_limit', { a: money(x.limit) })) + '</span>' : '');
    var go = x.pkey ? '#st/' + encodeURIComponent(x.pkey) : x.acct ? '#books/' + x.acct : '';
    return '<tr data-k="' + esc(x.id || x.pkey || x.text) + '"><td>' + (go ? '<a href="' + go + '">' + lab + '</a>' : lab) + '</td><td class="noprint">' + (x.id ? eye(x.id) : '') + '</td></tr>';
  }
  A.addSection('exc', function () {
    var X = excData(), n = X.reduce(function (s, x) { return s + x.n; }, 0);
    var body = X.length ? X.map(function (g) {
      return '<h3>' + esc(T('x_' + g.id)) + ' <span class="pill' + (/^(negcash|negbank|dupno|future)$/.test(g.id) ? ' bad' : '') + '">' + g.n + '</span>' + (XL[g.id] ? ' <a class="btn sm" href="' + XL[g.id] + '">' + esc(T('x_open')) + ' ›</a>' : '') + '</h3>' +
        '<p class="soft">' + esc(T('xh_' + g.id)) + '</p><table class="tbl st lg-tbl exc-tbl"><tbody>' + g.items.slice(0, 25).map(function (x) { return itemHtml(g.id, x); }).join('') + '</tbody></table>' +
        (g.items.length > 25 ? '<p class="soft">' + esc(A.T('lg_more', { n: g.items.length - 25 })) + '</p>' : '');
    }).join('') : '<p class="note ok">' + esc(T('exc_none')) + '</p>';
    return '<div class="pane-hd"><h2>' + esc(T('exc_t')) + (n ? ' <span class="pill bad">' + n + '</span>' : '') + '</h2></div><p class="soft">' + esc(T('exc_h')) + '</p>' + body;
  });
  /* the Dashboard tile: how many things to check (only when there is something) */
  A.addHome(function () {
    if (!A.biz()) return '';
    var n = 0; try { n = excData().reduce(function (s, x) { return s + x.n; }, 0); } catch (e) { return ''; }
    return n ? '<a class="card rp-exc" href="#exc">' + NS.icSvg('flag') + ' <b>' + esc(T('exc_tile', { n: n })) + '</b> <span class="soft">' + esc(T('exc_tileh')) + '</span></a>' : '';
  });
})();
