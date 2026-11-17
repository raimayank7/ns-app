/* Compliance pack of the Nivesh Sahayak App (after home.js; the figures come from msmecore.js, node scripts/test_msme.js):
     #msme     MSME payables: bills owed to micro and small suppliers against the MSMED Act section 15 time limit (the income-tax deduction is at
               risk when they are paid late), the suppliers' size / Udyam number / agreed credit days, and the year-end (31 March) report to Excel or print
     #limits   limits helper: the business's own sales against the composition, e-invoice and e-way bill limits
   Also: lines on My day, a card on the dashboard, and the backup health card (days since the last backup file, auto-save folder, one-tap backup).
   Nothing here is sent anywhere; there is no server and no look-up (the Udyam number is only checked for its format). Words: NS.t('cp.<key>'). */
(function () {
  'use strict';
  var A = window.NSApp, M = window.NSMsme; if (!A || !M) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, B = A.B, key = B.key, money = NS.money;
  function t(k, v) { return NS.t('cp.' + k, v); }
  var ST = { rate: '', loaded: false, fy: '', bk: null };
  var LINKS = { cbic: 'https://cbic-gst.gov.in/', gst: 'https://www.gst.gov.in/', einv: 'https://einvoice1.gst.gov.in/', ewb: 'https://ewaybillgst.gov.in/', udyam: 'https://udyamregistration.gov.in/', it: 'https://incometaxindia.gov.in/' };

  /* the bank rate the user types for the interest estimate lives in the data home (meta 'msme'), so it travels with the backup */
  function load() {
    NSStore.meta('msme').then(function (m) { ST.rate = m && m.rate != null ? m.rate : ''; }).catch(function () {}).then(function () { ST.loaded = true; if (/^#(msme|limits)/.test(location.hash)) A.show(); });
  }
  function ctx(o) {
    var C = A.data();
    return Object.assign({ docs: C.doc, biz: A.bizName(), today: NS.today(), parties: C.party, rate: ST.rate, state: (A.biz() || {}).state }, o || {});
  }
  function day(iso) { return A.ldate(iso); }

  /* ---------- the supplier's size, Udyam number and agreed days ---------- */
  function saveSup(name, f, v) {
    var C = A.data(), k = key(name), hit = C.party.filter(function (p) { return key(p.name) === k; })[0], rec = hit ? Object.assign({}, hit) : { name: name, role: 'supplier' };
    if (rec.role === 'customer') rec.role = 'both';
    if (f === 'udyam') { var u = M.udyam(v); if (v && !u) { NS.toast(t('udbad'), 'bad'); A.show(); return; } rec.udyam = u; }
    else if (f === 'agdays') rec.agdays = v === '' ? '' : Math.max(0, Math.min(45, Math.floor(+v || 0)));
    else rec.msme = v;
    NSStore.put('party', rec).then(function () { NS.toast(NS.t('app.saved')); A.show(); }, function (e) { NS.toast(NS.t('nosave', { e: e.message }), 'bad'); });
  }
  /* suppliers worth listing: those with an open bill to pay, and every party saved as a supplier */
  function suppliers() {
    var C = A.data(), by = {};
    C.party.forEach(function (p) { if (p.role === 'supplier' || p.role === 'both') by[key(p.name)] = { name: p.name, rec: p, due: 0 }; });
    B.bills(C.doc, A.bizName()).bills.forEach(function (b) {
      if (b.side !== 'pay') return;
      var k = key(b.party), e = by[k] = by[k] || { name: b.party, rec: C.party.filter(function (p) { return key(p.name) === k; })[0] || {}, due: 0 };
      e.due = NS.r2(e.due + b.left);
    });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, c) { return c.due - a.due || a.name.localeCompare(c.name); });
  }

  /* ---------- #msme ---------- */
  function ago(r) { return r.daysLeft < 0 ? (r.daysLeft === -1 ? t('late1') : t('late', { n: -r.daysLeft })) : r.daysLeft === 0 ? t('today') : r.daysLeft === 1 ? t('left1') : t('left', { n: r.daysLeft }); }
  function rowsTable(rows, withInt) {
    return '<div class="tbl-wrap"><table class="tbl cp-t"><thead><tr><th>' + esc(t('c_sup')) + '</th><th>' + esc(t('c_bill')) + '</th><th>' + esc(t('c_last')) + '</th><th>' + esc(t('c_days')) + '</th><th class="n">' + esc(t('c_amt')) + '</th>' + (withInt ? '<th class="n">' + esc(t('c_int')) + '</th>' : '') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th scope="row"><a href="#st/' + encodeURIComponent(key(r.party)) + '">' + esc(r.party) + '</a><br><span class="soft">' + esc(t('sz_' + r.size)) + (r.agreed ? ' · ' + esc(t('agr', { n: r.days })) : '') + '</span></th>' +
          '<td data-l="' + esc(t('c_bill')) + '">' + esc(r.no || '') + '<br><span class="soft">' + esc(day(r.date)) + '</span></td><td data-l="' + esc(t('c_last')) + '">' + esc(day(r.dl)) + '</td>' +
          '<td data-l="' + esc(t('c_days')) + '"><span class="pill ' + (r.state === 'late' ? 'bad' : r.state === 'soon' ? 'warn' : 'ok') + '">' + esc(ago(r)) + '</span></td>' +
          '<td class="n" data-l="' + esc(t('c_amt')) + '"><b>' + money(r.amt, false) + '</b></td>' + (withInt ? '<td class="n" data-l="' + esc(t('c_int')) + '">' + (r.interest ? money(r.interest, false) : '—') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function fyChoices() { var c = M.fyOf(NS.today()), l = [c, M.prevFy(c), M.prevFy(M.prevFy(c))]; return l; }
  function yearCard(Y) {
    var cur = Y.fy === M.fyOf(NS.today()), has = ST.rate !== '' && +ST.rate > 0;
    return '<div class="card"><h3>' + esc(t('ye_t')) + '</h3><p class="soft no-print">' + esc(t('ye_p')) + '</p>' +
      '<div class="tools-row no-print"><label>' + esc(t('ye_fy')) + ' <select data-cpfy>' + fyChoices().map(function (f) { return '<option value="' + f + '"' + (f === Y.fy ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="stsheet wide cp-sheet"><h4>' + esc(t('ye_h', { b: A.bizName(), d: day(Y.asOn) })) + '</h4>' + (cur && Y.asOn > NS.today() ? '<p class="soft">' + esc(t('ye_cur')) + '</p>' : '') +
      (Y.n ? '<p><b>' + esc(t('ye_sum', { n: Y.n, a: money(Y.amt) })) + '</b></p>' + rowsTable(Y.rows, has) +
        '<p class="soft">' + esc(t('ye_note')) + '</p>' + (has ? '<p class="soft">' + esc(t('int_note')) + ' ' + money(Y.interest) + '</p>' : '') : '<p>' + esc(t('ye_none')) + '</p>') +
      (Y.unknown.length ? '<p class="soft">' + esc(t('ye_unk', { n: Y.unknown.length })) + '</p>' : '') +
      '<p class="soft">' + esc(t('scope')) + ' ' + esc(t('law')) + '</p></div>' +
      '<div class="quick no-print"><button type="button" class="btn" data-cpxl' + (Y.n ? '' : ' disabled') + '>' + esc(t('xl')) + '</button> <button type="button" class="btn" data-cpprint' + (Y.n ? '' : ' disabled') + '>' + esc(t('print')) + '</button></div></div>';
  }
  var CUR = null;
  function msmeHtml() {
    if (!ST.loaded) { load(); return '<div class="pane-hd"><h2>' + esc(A.T('msme')) + '</h2></div><p class="soft">…</p>'; }
    var c = ctx(), R = M.payables(c), Y = M.yearEnd(c, ST.fy || M.fyOf(c.today)), sup = suppliers(), has = ST.rate !== '' && +ST.rate > 0;
    CUR = { Y: Y, c: c };
    var SZ = M.SIZES;
    return '<div class="pane-hd" data-nosp><h2>' + esc(A.T('msme')) + '</h2></div><div class="no-print"><p class="soft">' + esc(t('intro')) + '</p>' +
      '<p class="note">' + esc(t('check')) + ' ' + esc(t('scope')) + ' <a class="link" href="' + LINKS.udyam + '" target="_blank" rel="noopener">' + esc(t('udlink')) + ' ↗</a></p>' +
      '<div class="tiles"><div class="tile' + (R.late ? ' warn' : '') + '"><span>' + esc(t('t_late', { n: R.late })) + '</span><b>' + money(R.lateAmt) + '</b></div>' +
      '<div class="tile"><span>' + esc(t('t_soon', { n: R.soon })) + '</span><b>' + money(R.soonAmt) + '</b></div>' + (has ? '<div class="tile"><span>' + esc(t('t_int')) + '</span><b>' + money(R.interest) + '</b></div>' : '') + '</div>' +
      '<div class="card"><h3>' + esc(t('rows_t')) + '</h3>' + (R.rows.length ? rowsTable(R.rows, has) : '<p class="soft">' + esc(sup.length ? t('rows_none') : t('rows_nosup')) + '</p>') +
      '<p class="soft">' + esc(t('accept')) + '</p></div>' +
      '<div class="card"><h3>' + esc(t('rate_t')) + '</h3><div class="tools-row"><label>' + esc(t('rate_l')) + ' <input type="number" inputmode="decimal" min="0" max="30" step="0.01" data-cprate value="' + esc(ST.rate) + '"></label></div>' +
      '<p class="soft">' + esc(t('rate_p')) + '</p></div></div>' +
      yearCard(Y) +
      '<div class="card no-print"><h3>' + esc(t('sup_t')) + '</h3><p class="soft">' + esc(t('sup_p')) + '</p>' + (sup.length ?
        '<div class="tbl-wrap"><table class="tbl cp-t cp-sup"><thead><tr><th>' + esc(t('c_sup')) + '</th><th>' + esc(t('f_size')) + '</th><th>' + esc(t('f_ud')) + '</th><th>' + esc(t('f_ag')) + '</th></tr></thead><tbody>' +
        sup.slice(0, 80).map(function (s) {
          var p = s.rec || {}, size = M.sizeOf(p), nm = esc(s.name);
          return '<tr><th scope="row">' + nm + (s.due ? '<br><span class="soft">' + esc(t('owe', { a: money(s.due) })) + '</span>' : '') + '</th>' +
            '<td data-l="' + esc(t('f_size')) + '"><select data-cps="' + nm + '" data-f="msme" aria-label="' + esc(t('f_size') + ' ' + s.name) + '">' + SZ.map(function (z) { return '<option value="' + z + '"' + (z === size ? ' selected' : '') + '>' + esc(t('sz_' + z)) + '</option>'; }).join('') + '</select></td>' +
            '<td data-l="' + esc(t('f_ud')) + '"><input type="text" dir="ltr" maxlength="22" data-cps="' + nm + '" data-f="udyam" placeholder="UDYAM-XX-00-0000000" value="' + esc(p.udyam || '') + '" aria-label="' + esc(t('f_ud') + ' ' + s.name) + '"></td>' +
            '<td data-l="' + esc(t('f_ag')) + '"><input type="number" inputmode="numeric" min="0" max="45" step="1" data-cps="' + nm + '" data-f="agdays" placeholder="0" value="' + esc(p.agdays || '') + '" aria-label="' + esc(t('f_ag') + ' ' + s.name) + '"></td></tr>';
        }).join('') + '</tbody></table></div><p class="soft">' + esc(t('f_ag_h')) + '</p>' : '<p class="soft">' + esc(t('sup_none')) + '</p>') + '</div>' +
      (R.unknown.length ? '<div class="card no-print"><h3>' + esc(t('unk_t', { n: R.unknown.length })) + '</h3><p class="soft">' + esc(t('unk_p')) + '</p><ul class="rows">' + R.unknown.slice(0, 8).map(function (u) {
        return '<li><b>' + esc(u.party) + '</b><span class="soft">' + esc(t('unk_l', { n: u.n })) + '</span><b class="amt">' + money(u.amt) + '</b></li>'; }).join('') + '</ul></div>' : '') +
      '<p class="sb-note no-print">' + esc(t('disc')) + '</p>';
  }
  function msmeWire(pane) {
    var r = $('[data-cprate]', pane); if (r) r.addEventListener('change', function () { ST.rate = r.value; NSStore.meta('msme', { rate: r.value }).then(function () { A.show(); }); });
    var fy = $('[data-cpfy]', pane); if (fy) fy.addEventListener('change', function () { ST.fy = fy.value; A.show(); });
    $$('[data-cps]', pane).forEach(function (el) { el.addEventListener('change', function () { saveSup(el.getAttribute('data-cps'), el.getAttribute('data-f'), el.value.trim()); }); });
    var x = $('[data-cpxl]', pane); if (x) x.addEventListener('click', excel);
    var p = $('[data-cpprint]', pane); if (p) p.addEventListener('click', function () { window.print(); });
  }
  function excel() {
    if (!CUR) return;
    var Y = CUR.Y, pm = {}; CUR.c.parties.forEach(function (p) { pm[key(p.name)] = p; });
    var has = ST.rate !== '' && +ST.rate > 0;
    var rows = [['Supplier', 'Size', 'Udyam no.', 'Bill no.', 'Bill date', 'Days allowed', 'Last day to pay', 'Unpaid on ' + Y.asOn, 'Days past the limit'].concat(has ? ['Interest estimate'] : [])];
    Y.rows.forEach(function (r) { var p = pm[key(r.party)] || {}; rows.push([r.party, r.size, p.udyam || '', r.no, r.date, r.days, r.dl, r.amt, -r.daysLeft].concat(has ? [r.interest] : [])); });
    rows.push(['Total', '', '', '', '', '', '', Y.amt, ''].concat(has ? [Y.interest] : []));
    rows.push([]); rows.push(['Section 43B(h) of the Income-tax Act, 1961 / section 37(2)(g) of the Income-tax Act, 2025: amounts owed to micro and small enterprises beyond the time limit of section 15 of the MSMED Act, 2006 are deductible only in the year they are paid. Time is counted from the bill date, which stands in for the day of acceptance. Rules as of ' + M.AS_OF + '. Ask your CA.']);
    var nm = (A.bizName().replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'business').toLowerCase();
    NS.xlsx(nm + '-msme-unpaid-' + Y.fy + '.xlsx', [{ name: 'MSME unpaid ' + Y.fy, rows: rows }]);
  }
  A.addSection('msme', msmeHtml, msmeWire);

  /* ---------- #limits ---------- */
  var OFFICIAL = { comp_goods: ['cbic', 'cl_comp_g'], comp_serv: ['cbic', 'cl_comp_s'], einv: ['einv', 'cl_einv'], ewb: ['ewb', 'cl_ewb'] };
  function bar(p, st) { return '<div class="hm-bar cp-bar ' + st + '" role="img" aria-label="' + p + '%"><i style="width:' + Math.min(100, p) + '%"></i></div>'; }
  function limitsHtml() {
    var c = ctx(), L = M.limits(c), big = function (v) { return money(v); };
    var cards = L.lines.map(function (x) {
      var o = OFFICIAL[x.id], name = x.id === 'comp_goods' ? t('l_comp_g', { l: big(x.limit) }) : t('l_' + x.id, { l: big(x.limit) }), st = x.status;
      var body;
      if (x.basis === 'consignment') {
        body = '<p>' + esc(t('ewb_p', { l: big(x.limit) })) + '</p><p><b>' + esc(x.n ? t('ewb_n', { n: x.n, m: big(x.max) }) : t('ewb_0')) + '</b></p>';
      } else {
        body = bar(x.pctPrev, x.prevStatus) + '<p>' + esc(t('prev_l', { fy: L.prevFy, a: big(x.prev), p: x.pctPrev })) + '</p>' + bar(x.pctCur, x.curStatus) + '<p>' + esc(t('cur_l', { fy: L.fy, a: big(x.cur), p: x.pctCur })) + '</p>' +
          '<p class="soft">' + esc(t('rule_' + x.id + (x.special ? '_sp' : ''))) + '</p>';
      }
      return '<div class="card cp-lim ' + st + '"><div class="hm-ph"><h3>' + esc(name) + '</h3><span class="pill ' + (st === 'over' ? 'bad' : st === 'near' ? 'warn' : 'ok') + '">' + esc(t('st_' + (x.id.indexOf('comp') === 0 ? 'comp' : x.id) + '_' + st)) + '</span></div>' + body +
        '<p class="soft">' + esc(t('asof', { d: day(M.AS_OF) })) + ' <a class="link" href="' + LINKS[o[0]] + '" target="_blank" rel="noopener">' + esc(t(o[1])) + ' ↗</a></p></div>';
    }).join('');
    return '<div class="pane-hd" data-nosp><h2>' + esc(A.T('limits')) + ' <small class="soft">' + esc(A.bizName()) + '</small></h2></div><p class="soft">' + esc(t('lim_p')) + '</p>' +
      '<div class="tiles"><div class="tile"><span>' + esc(t('s_cur', { fy: L.fy })) + '</span><b>' + money(L.cur) + '</b></div><div class="tile"><span>' + esc(t('s_prev', { fy: L.prevFy })) + '</span><b>' + money(L.prev) + '</b></div></div>' +
      (L.special ? '<p class="note">' + esc(t('special')) + '</p>' : '') + cards +
      '<div class="card"><h3>' + esc(t('rc_t')) + '</h3><p>' + esc(t('rc_p')) + '</p><p class="soft">' + esc(t('asof', { d: day(M.AS_OF) })) + ' <a class="link" href="' + LINKS.cbic + '" target="_blank" rel="noopener">' + esc(t('cl_einv')) + ' ↗</a></p></div>' +
      '<p class="sb-note">' + esc(t('lim_disc')) + '</p>';
  }
  A.addSection('limits', limitsHtml, function () {});

  /* ---------- side menu ---------- */
  function menu() {
    var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs')) return;
    ['msme', 'limits'].forEach(function (s) {
      if ($('[data-sec="' + s + '"]', nav)) return;
      var at = $('[data-sec="dues"]', nav) || $('[data-sec="money"]', nav), a = NS.el('a', { href: '#' + s, 'data-sec': s }, '<span>' + esc(A.T(s)) + '</span>');
      var after = s === 'limits' ? $('[data-sec="msme"]', nav) || at : at;
      if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
    });
  }

  /* ---------- the dashboard card and My day lines ---------- */
  A.addHome(function () {
    if (!ST.loaded) return '';
    var R = M.payables(ctx());
    return R.late || R.soon ? '<div class="card"><h3>' + esc(A.T('msme')) + '</h3><p>' + esc(R.late ? t('h_late', { n: R.late, a: money(R.lateAmt) }) : t('h_soon', { n: R.soon, a: money(R.soonAmt) })) + '</p><p><a class="btn" href="#msme">' + esc(t('h_see')) + '</a></p></div>' : '';
  });
  A.addHome(function () { setTimeout(function () { fillBackup(); }, 0); return '<div class="card cp-bk" data-cpbk data-warnonly hidden></div>'; });
  if (window.NSHome && NSHome.addSource) NSHome.addSource(function (c) {
    if (!ST.loaded) return [];
    var R = M.payables({ docs: c.docs, biz: c.biz, today: c.today, parties: A.data().party, rate: ST.rate }), out = [];
    if (R.late) out.push({ id: 'msme:late', group: 'money', sev: 0, k: 'msme_late', v: { n: R.late, a: R.lateAmt }, href: '#msme', amt: R.lateAmt, date: '' });
    if (R.soon) out.push({ id: 'msme:soon', group: 'money', sev: 1, k: 'msme_soon', v: { n: R.soon, a: R.soonAmt }, href: '#msme', amt: R.soonAmt, date: '' });
    return out;
  });

  /* the payables side of Dues: one line above the table when micro or small suppliers are near or past their limit */
  A.duesExtra = function (side) {
    if (side !== 'pay' || !ST.loaded) return '';
    var R = M.payables(ctx()); if (!R.late && !R.soon) return '';
    return '<p class="note cp-dues' + (R.late ? ' bad' : '') + '"><b>' + esc(A.T('msme')) + ':</b> ' + esc(R.late ? t('h_late', { n: R.late, a: money(R.lateAmt) }) : t('h_soon', { n: R.soon, a: money(R.soonAmt) })) + ' <a class="link" href="#msme">' + esc(t('h_see')) + ' ›</a></p>';
  };

  /* ---------- backup health ---------- */
  function bkHtml(h) {
    var lvl = h.level, txt = lvl === 'empty' ? t('bk_empty') : lvl === 'never' ? t('bk_never') : h.days === 0 ? t('bk_today') : h.days === 1 ? t('bk_day1') : t('bk_days', { n: h.days });
    var fol = t('bk_f_' + h.folder);
    return '<div class="hm-ph"><h3>' + esc(t('bk_t')) + '</h3><span class="pill ' + (lvl === 'old' || lvl === 'never' ? 'warn' : 'ok') + '">' + esc(t('bk_' + (lvl === 'old' || lvl === 'never' ? 'warn' : 'ok'))) + '</span></div>' +
      '<p>' + esc(txt) + '</p><p class="soft">' + esc(fol) + '</p>' +
      (lvl === 'empty' ? '' : '<p><button type="button" class="btn' + (lvl === 'old' || lvl === 'never' ? ' primary' : '') + '" data-cpbknow>' + esc(t('bk_now')) + '</button> <a class="link" href="' + A.myUrl('#backup') + '">' + esc(t('bk_more')) + ' ›</a></p>');
  }
  function paintBackup(h) {
    $$('[data-cpbk]').forEach(function (e) { e.innerHTML = bkHtml(h); e.hidden = e.hasAttribute('data-warnonly') && h.level !== 'old' && h.level !== 'never'; });
  }
  function fillBackup() {
    if (!$('[data-cpbk]')) return;
    if (ST.bk) paintBackup(ST.bk);
    Promise.all([NSStore.meta('lastBackup'), NS.folderStatus ? NS.folderStatus().catch(function () { return null; }) : null]).then(function (r) {
      ST.bk = M.backup(r[0] || 0, Date.now(), A.data().doc.length, r[1]); paintBackup(ST.bk);
    }).catch(function () {});
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cpbknow]'); if (!b) return;
    b.disabled = true;
    NS.downloadBackup().then(function () { ST.bk = null; fillBackup(); }, function (er) { NS.toast(er && er.message || '', 'bad'); }).then(function () { b.disabled = false; });
  });
  if (window.NSHome) { NSHome.tops = NSHome.tops || []; NSHome.tops.push(function () { setTimeout(fillBackup, 0); return '<div class="card cp-bk" data-cpbk></div>'; }); }

  function start() { menu(); load(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  A.compliance = { ctx: ctx };
})();
