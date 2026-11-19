/* NS fees (gap round, 2026-11-14): "Student fees" for schools, coaching centres and tuition: students, fee structure per class, dues, defaulters,
   collecting a fee through the fee receipt maker (fee.js), reminders on WhatsApp, collection reports and Excel (CSV).
   An App section (#fees) and the door site fees.niveshsahayak.in (data-secs="fees"). The sums are feecore.js (pure, tested by scripts/test_feecore.js).
   Data stays in the shared data home: students are 'party' records (student: 1), the fee set-up is meta 'feeSetup:<business>', the money is the
   ordinary fee receipt (type 'fee') which the App already counts as income. Screen text comes from NS.t; reports and files are in English. */
(function () {
  'use strict';
  var NS = window.NS, F = window.NSFees, A = window.NSApp, $ = NS.$, $$ = NS.$$, esc = NS.esc, r2 = NS.r2, num = NS.num;
  if (!F || !A) return;
  function T(k, v) { return NS.t(k, v); }
  var FREQ = { month: 'fee.fq.month', quarter: 'fee.fq.quarter', annual: 'fee.fq.annual', once: 'fee.fq.once' };
  var tab = 'dues', S = null, asOf = '', cls = '', q = '', onlyDef = false, pane = null, STUDENTS = [], DOCS = [], BK = '';
  var rFrom = '', rTo = '';

  function money(v, sym) { return NS.money(v, sym); }
  function ym(d) { return String(d || '').slice(0, 7); }
  function setupKey() { return 'feeSetup:' + F.key(A.bizName()); }
  function load() {
    BK = F.key(A.bizName());
    return Promise.all([NSStore.meta(setupKey()), NSStore.list('party'), NSStore.list('doc')]).then(function (r) {
      var def = F.defaults(NS.today());
      S = Object.assign(def, r[0] || {}); S.sib = Object.assign(def.sib, S.sib || {}); S.fees = S.fees || {}; S.routes = S.routes || []; S.heads = S.heads && S.heads.length ? S.heads : def.heads;
      STUDENTS = r[1].filter(function (p) { return p.student && (!p.bizKey || p.bizKey === BK); });
      DOCS = r[2].filter(function (d) { return d.type === 'fee' && F.key(d.seller && d.seller.name) === BK; });
      if (!asOf) { var m = ym(NS.today()), ms = F.months(S); asOf = m < ms[0] ? ms[0] : m > ms[11] ? ms[11] : m; }
      if (!rFrom) { rFrom = F.months(S)[0] + '-01'; rTo = NS.today(); }
    });
  }
  function saveSetup() { return NSStore.meta(setupKey(), S); }
  function rows() { return F.ledger(S, STUDENTS, DOCS, asOf, NS.today()); }
  function classes() { var o = {}; STUDENTS.forEach(function (s) { if (s.cls) o[s.cls] = 1; }); Object.keys(S.fees).forEach(function (k) { o[k] = o[k] || 1; }); return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, 'en', { numeric: true }); }); }
  function dlg(id, title, html) {
    var d = $('#' + id);
    if (!d) { d = NS.el('dialog', { id: id, 'aria-labelledby': id + '-h' }); document.body.appendChild(d); }
    d.innerHTML = '<div class="dlg-h"><h2 id="' + id + '-h">' + esc(title) + '</h2><form method="dialog"><button class="btn sm">' + esc(T('close')) + '</button></form></div><div class="dlg-b">' + html + '</div>';
    d.showModal ? d.showModal() : d.setAttribute('open', ''); return d;
  }
  function csvOut(name, data) {
    var f = new File(['﻿' + F.toCsv(data)], name, { type: 'text/csv' });
    NS.saveFile(f, name); NS.toast(T('pdf.saved', { file: name }));
  }
  function field(id, label, val, o) { o = o || {}; return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label><input id="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(val == null ? '' : val) + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.list ? ' list="' + o.list + '"' : '') + '></div>'; }
  function waLink(st, text) { var ph = String(st.phone || '').replace(/\D/g, '').slice(-10); return 'https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(text); }

  /* ---------- frame: tabs ---------- */
  function frame(body) {
    return '<div class="pane-hd"><h2>' + esc(T('fee.t')) + ' <span class="soft">' + esc(S.session) + '</span></h2><div class="seg" role="group" aria-label="' + esc(T('fee.t')) + '">' +
      [['dues', 'fee.tab.dues'], ['students', 'fee.tab.students'], ['setup', 'fee.tab.setup'], ['report', 'fee.tab.report']].map(function (x) { return '<button type="button" class="btn sm" data-ftab="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + esc(T(x[1])) + '</button>'; }).join('') + '</div></div>' + body;
  }
  function paint() {
    var html = tab === 'students' ? studentsHtml() : tab === 'setup' ? setupHtml() : tab === 'report' ? reportHtml() : duesHtml();
    pane.innerHTML = frame(html); wireTabs();
    if (tab === 'students') wireStudents(); else if (tab === 'setup') wireSetup(); else if (tab === 'report') wireReport(); else wireDues();
  }
  function wireTabs() { $$('[data-ftab]', pane).forEach(function (b) { b.addEventListener('click', function () { tab = b.getAttribute('data-ftab'); paint(); }); }); }
  function reload() { return load().then(paint); }

  /* ---------- dues and defaulters ---------- */
  function filtered() {
    var ql = q.toLowerCase();
    return rows().filter(function (r) {
      if (cls && F.key(r.st.cls) !== F.key(cls)) return false;
      if (onlyDef && r.overdue <= 0.004) return false;
      return !ql || [r.st.name, r.st.guardian, r.st.phone, r.st.roll, r.st.adm, r.st.cls + r.st.sec].join(' ').toLowerCase().indexOf(ql) >= 0;
    });
  }
  function duesHtml() {
    if (!STUDENTS.length) return '<div class="card"><h3>' + esc(T('fee.first')) + '</h3><p>' + esc(T('fee.firstp')) + '</p><div class="btns"><button type="button" class="btn primary" data-ftab="setup">' + esc(T('fee.tab.setup')) + '</button> <button type="button" class="btn" data-ftab="students">' + esc(T('fee.tab.students')) + '</button></div></div><p class="soft">' + esc(T('fee.priv')) + '</p>';
    var all = rows(), L = filtered(), tot = { billed: 0, paid: 0, bal: 0, over: 0, n: 0 };
    all.forEach(function (r) { tot.billed = r2(tot.billed + r.billed); tot.paid = r2(tot.paid + r.paid); tot.bal = r2(tot.bal + Math.max(0, r.balance)); tot.over = r2(tot.over + r.overdue); if (r.overdue > 0.004) tot.n++; });
    var cl = classes();
    return '<div class="tiles"><div class="tile"><span>' + esc(T('fee.s.students')) + '</span><b>' + all.length + '</b></div><div class="tile"><span>' + esc(T('fee.s.billed')) + '</span><b>' + money(tot.billed) + '</b></div><div class="tile"><span>' + esc(T('fee.s.paid')) + '</span><b>' + money(tot.paid) + '</b></div>' +
      '<div class="tile' + (tot.bal ? ' neg' : '') + '"><span>' + esc(T('fee.s.due')) + '</span><b>' + money(tot.bal) + '</b></div><div class="tile' + (tot.over ? ' neg' : '') + '"><span>' + esc(T('fee.s.over', { n: tot.n })) + '</span><b>' + money(tot.over) + '</b></div></div>' +
      '<div class="quick fe-filt"><label>' + esc(T('fee.asof')) + ' <input type="month" id="fe-asof" value="' + esc(asOf) + '" min="' + F.months(S)[0] + '" max="' + F.months(S)[11] + '"></label>' +
      '<select id="fe-cls" aria-label="' + esc(T('fee.cls')) + '"><option value="">' + esc(T('fee.allcls')) + '</option>' + cl.map(function (c) { return '<option' + (F.key(c) === F.key(cls) ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
      '<input type="search" id="fe-q" value="' + esc(q) + '" placeholder="' + esc(T('fee.search')) + '" aria-label="' + esc(T('fee.search')) + '"><label class="chk"><input type="checkbox" id="fe-def"' + (onlyDef ? ' checked' : '') + '> ' + esc(T('fee.onlydef')) + '</label>' +
      '<button type="button" class="btn" data-fe-csv>' + esc(T('fee.csv')) + '</button></div><p class="soft">' + esc(T('fee.duesh')) + '</p>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.student')) + '</th><th>' + esc(T('fee.cls')) + '</th><th class="n">' + esc(T('fee.s.billed')) + '</th><th class="n">' + esc(T('fee.s.paid')) + '</th><th class="n">' + esc(T('fee.bal')) + '</th><th class="n">' + esc(T('fee.overdue')) + '</th><th></th></tr></thead><tbody>' +
      (L.map(function (r) {
        var s = r.st;
        return '<tr' + (r.overdue > 0.004 ? ' class="warn"' : '') + '><td><b>' + esc(s.name) + '</b>' + (r.sibling ? ' <span class="pill">' + esc(T('fee.sib')) + '</span>' : '') + (s.guardian ? '<br><span class="soft">' + esc(s.guardian) + '</span>' : '') + '</td><td>' + esc(s.cls) + (s.sec ? ' – ' + esc(s.sec) : '') + '</td><td class="n">' + money(r.billed, false) + '</td><td class="n">' + money(r.paid, false) + '</td><td class="n">' + (r.balance > 0.004 ? money(r.balance, false) : r.advance > 0.004 ? '<span class="soft">+' + money(r.advance, false) + '</span>' : '—') + '</td><td class="n">' + (r.overdue > 0.004 ? '<b>' + money(r.overdue, false) + '</b>' : '—') + '</td><td>' +
          (r.balance > 0.004 ? '<button type="button" class="btn sm primary" data-fe-collect="' + esc(s.id) + '">' + esc(T('fee.collect')) + '</button> ' : '') +
          (r.overdue > 0.004 ? '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(waLink(s, remind(r))) + '">' + esc(T('fee.remind')) + '</a> ' : '') + '<button type="button" class="btn sm" data-fe-hist="' + esc(s.id) + '">' + esc(T('fee.ledger')) + '</button></td></tr>';
      }).join('') || '<tr><td colspan="7">' + esc(T('fee.none')) + '</td></tr>') + '</tbody></table></div>';
  }
  function remind(r) {
    var s = r.st, school = A.bizName(), items = r.pending.filter(function (c) { return c.due < NS.today(); });
    var ms = items.map(function (c) { return F.monthName(c.m); }).filter(function (m, i, a) { return a.indexOf(m) === i; });
    return 'Dear parent, fees of ' + s.name + (s.cls ? ' (' + s.cls + (s.sec ? '-' + s.sec : '') + ')' : '') + ' are pending for ' + ms.join(', ') + ': total ' + money(r.overdue) + '. Kindly pay at the school office or by UPI and send us the payment screenshot. Thank you. ' + school;
  }
  function wireDues() {
    var a = $('#fe-asof', pane); if (!a) return;
    a.addEventListener('change', function () { if (/^\d{4}-\d{2}$/.test(a.value)) { asOf = a.value; paint(); } });
    $('#fe-cls', pane).addEventListener('change', function (e) { cls = e.target.value; paint(); });
    $('#fe-def', pane).addEventListener('change', function (e) { onlyDef = e.target.checked; paint(); });
    var t; $('#fe-q', pane).addEventListener('input', function (e) { q = e.target.value; clearTimeout(t); t = setTimeout(function () { paint(); var n = $('#fe-q', pane); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    $('[data-fe-csv]', pane).addEventListener('click', function () {
      var out = [['Student', 'Class', 'Section', 'Roll no', 'Guardian', 'Phone', 'Billed to ' + asOf, 'Paid', 'Balance', 'Overdue today']];
      filtered().forEach(function (r) { out.push([r.st.name, r.st.cls, r.st.sec, r.st.roll, r.st.guardian, r.st.phone, r.billed, r.paid, r.balance, r.overdue]); });
      csvOut('student-fee-dues-' + asOf + '.csv', out);
    });
    pane.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-fe-collect]'); if (c) collect(c.getAttribute('data-fe-collect'));
      var h = e.target.closest && e.target.closest('[data-fe-hist]'); if (h) history(h.getAttribute('data-fe-hist'));
    });
  }

  /* ---------- collect: choose the charges, the money, then the fee receipt maker ---------- */
  function collect(id) {
    var r = rows().filter(function (x) { return x.st.id === id; })[0]; if (!r) return;
    var d = dlg('fe-col', T('fee.collect') + ': ' + r.st.name,
      '<p class="soft">' + esc(T('fee.colh')) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>' + esc(T('fee.head')) + '</th><th>' + esc(T('fee.month')) + '</th><th class="n">' + esc(T('fee.amt')) + '</th></tr></thead><tbody>' +
      r.pending.map(function (c, i) { return '<tr><td><input type="checkbox" data-fe-c="' + i + '" checked aria-label="' + esc(c.name + ' ' + c.m) + '"></td><td>' + esc(c.name) + (c.conc ? ' <span class="soft">(−' + money(c.conc, false) + ')</span>' : '') + '</td><td>' + esc(F.monthName(c.m)) + '</td><td class="n">' + money(c.left, false) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="fg"><div class="f"><label for="fe-pay">' + esc(T('fee.paidnow')) + '</label><input id="fe-pay" inputmode="decimal"></div><div class="f"><label for="fe-mode">' + esc(T('s.mode')) + '</label><select id="fe-mode">' + ['cash', 'upi', 'cheque', 'bank', 'card'].map(function (m) { return '<option value="' + m + '">' + esc(T('pm.' + m)) + '</option>'; }).join('') + '</select></div></div>' +
      '<p id="fe-sum" class="note" aria-live="polite"></p><div class="btns"><button type="button" class="btn primary" id="fe-mk">' + esc(T('fee.mk')) + '</button></div>');
    function sel() { return r.pending.filter(function (c, i) { var b = $('[data-fe-c="' + i + '"]', d); return b && b.checked; }); }
    function sum() { var s = sel(), p = F.plan(S, s, $('#fe-pay', d).value); $('#fe-sum', d).textContent = T('fee.sum', { n: money(p.net), p: money(p.paid), b: money(p.balance) }); $('#fe-pay', d).placeholder = String(p.net); return p; }
    $$('[data-fe-c]', d).forEach(function (b) { b.addEventListener('change', sum); }); $('#fe-pay', d).addEventListener('input', sum); sum();
    $('#fe-mk', d).addEventListener('click', function () {
      var s = sel(); if (!s.length) { NS.toast(T('fee.pick'), 'bad'); return; }
      var p = sum(); if (!(p.paid > 0)) { NS.toast(T('s.v.amount'), 'bad'); return; }
      var st = r.st, pre = { studentId: st.id, buyer: { name: st.name, phone: st.phone || '' }, cls: st.cls || '', sec: st.sec || '', roll: st.roll || st.adm || '', guardian: st.guardian || '', session: S.session,
        mFrom: p.mFrom, mTo: p.mTo, lines: p.lines, conc: p.conc ? String(p.conc) : '', prev: '', paid: String(p.paid), mode: $('#fe-mode', d).value, pay: p.pay, gst: S.gst || 'ex' };
      var url = A.siteHome ? A.siteHome('fee-receipt') : '';
      /* F6-10: on the fees site itself the App's site list is empty ('#'): go to the fee receipt maker by its own address */
      if (!url || url === '#') url = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.protocol + '//' + location.hostname + ':8945/' : 'https://fee-receipt.niveshsahayak.in/';
      d.close();
      var href = url + '?pre=' + encodeURIComponent(JSON.stringify(pre));
      if (!A.openUrl(href)) location.href = href;
    });
  }
  function history(id) {
    var r = rows().filter(function (x) { return x.st.id === id; })[0]; if (!r) return;
    var docs = DOCS.filter(function (x) { return x.studentId === id || (!x.studentId && F.key(x.buyer && x.buyer.name) === F.key(r.st.name)); }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    dlg('fe-hist', r.st.name + ' · ' + (r.st.cls || ''), '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.head')) + '</th><th>' + esc(T('fee.month')) + '</th><th class="n">' + esc(T('fee.amt')) + '</th><th class="n">' + esc(T('fee.s.paid')) + '</th><th class="n">' + esc(T('fee.bal')) + '</th></tr></thead><tbody>' +
      r.all.map(function (c) { return '<tr' + (c.left > 0.004 && c.m <= asOf ? ' class="warn"' : '') + '><td>' + esc(c.name) + '</td><td>' + esc(F.monthName(c.m)) + '</td><td class="n">' + money(c.net, false) + '</td><td class="n">' + money(c.paid, false) + '</td><td class="n">' + (c.left > 0.004 ? money(c.left, false) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3>' + esc(T('fee.receipts')) + '</h3>' + (docs.length ? '<ul>' + docs.map(function (x) { return '<li>' + esc(NS.fmtDate(x.date)) + ' · ' + esc(x.no || '') + ' · ' + money(num(x.total), false) + ' (' + esc(x.mode || '') + ')</li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('fee.none')) + '</p>'));
  }

  /* ---------- students ---------- */
  function studentsHtml() {
    var cl = classes(), ql = q.toLowerCase();
    var L = STUDENTS.filter(function (s) { return (!cls || F.key(s.cls) === F.key(cls)) && (!ql || [s.name, s.guardian, s.phone, s.roll, s.adm].join(' ').toLowerCase().indexOf(ql) >= 0); }).sort(function (a, b) { return String(a.cls).localeCompare(String(b.cls), 'en', { numeric: true }) || String(a.name).localeCompare(String(b.name)); });
    return '<div class="quick"><button type="button" class="btn primary" data-fe-add>+ ' + esc(T('fee.addstu')) + '</button> <button type="button" class="btn" data-fe-imp>' + esc(T('fee.import')) + '</button> <button type="button" class="btn" data-fe-tpl>' + esc(T('fee.tpl')) + '</button> <button type="button" class="btn" data-fe-exp>' + esc(T('fee.export')) + '</button></div>' +
      '<div class="quick fe-filt"><select id="fe-cls" aria-label="' + esc(T('fee.cls')) + '"><option value="">' + esc(T('fee.allcls')) + '</option>' + cl.map(function (c) { return '<option' + (F.key(c) === F.key(cls) ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select><input type="search" id="fe-q" value="' + esc(q) + '" placeholder="' + esc(T('fee.search')) + '"></div>' +
      '<p class="soft">' + esc(T('fee.stucount', { n: L.length })) + ' ' + esc(T('fee.priv')) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.student')) + '</th><th>' + esc(T('fee.cls')) + '</th><th>' + esc(T('fee.guard')) + '</th><th>' + esc(T('l.phone')) + '</th><th>' + esc(T('fee.transport')) + '</th><th>' + esc(T('fee.conc')) + '</th><th></th></tr></thead><tbody>' +
      (L.map(function (s) { return '<tr><td><b>' + esc(s.name) + '</b>' + (s.roll ? '<br><span class="soft">' + esc(s.roll) + '</span>' : '') + '</td><td>' + esc(s.cls) + (s.sec ? ' – ' + esc(s.sec) : '') + '</td><td>' + esc(s.guardian || '') + '</td><td>' + esc(s.phone || '') + '</td><td>' + esc(s.transport ? s.transport.route : '') + '</td><td>' + esc(concText(s)) + '</td><td><button type="button" class="btn sm" data-fe-edit="' + esc(s.id) + '">' + esc(T('fee.edit')) + '</button></td></tr>'; }).join('') || '<tr><td colspan="7">' + esc(T('fee.none')) + '</td></tr>') + '</tbody></table></div>';
  }
  function concText(s) { var c = s.conc; return c && c.type && c.type !== 'none' && num(c.v) ? (c.type === 'pct' ? num(c.v) + '%' : '₹' + num(c.v)) + (c.why ? ' · ' + c.why : '') : ''; }
  function wireStudents() {
    $('#fe-cls', pane).addEventListener('change', function (e) { cls = e.target.value; paint(); });
    var t; $('#fe-q', pane).addEventListener('input', function (e) { q = e.target.value; clearTimeout(t); t = setTimeout(function () { paint(); var n = $('#fe-q', pane); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    $('[data-fe-add]', pane).addEventListener('click', function () { studentForm(null); });
    $('[data-fe-imp]', pane).addEventListener('click', importBox);
    $('[data-fe-tpl]', pane).addEventListener('click', function () { csvOut('students-template.csv', [F.COLS, ['Asha Kumari', '5', 'A', '12', 'A-0123', 'Ramesh Kumar', '9876500001', '2026-04', '', '', '', '']]); });
    $('[data-fe-exp]', pane).addEventListener('click', function () {
      csvOut('students-' + NS.today() + '.csv', [F.COLS].concat(STUDENTS.map(function (s) { var c = s.conc || {}; return [s.name, s.cls, s.sec, s.roll, s.adm, s.guardian, s.phone, s.joined, s.transport ? s.transport.route : '', c.type || '', c.v || '', c.why || '']; })));
    });
    pane.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-fe-edit]'); if (b) studentForm(STUDENTS.filter(function (s) { return s.id === b.getAttribute('data-fe-edit'); })[0]); });
  }
  function studentForm(s) {
    var n = !s, c = (s && s.conc) || {}, tr = (s && s.transport) || {};
    s = s || { student: 1, role: 'customer', conc: { type: 'none' } };
    var hs = S.heads.map(function (h) { return '<label class="chk"><input type="checkbox" data-fe-ch="' + esc(h.id) + '"' + ((c.heads && c.heads.length ? c.heads.indexOf(h.id) >= 0 : h.id === 'tuition') ? ' checked' : '') + '> ' + esc(h.name) + '</label>'; }).join('');
    var d = dlg('fe-stu', n ? T('fee.addstu') : s.name,
      '<div class="fg">' + field('fs-name', T('fee.student'), s.name, { wide: true }) + field('fs-cls', T('fee.cls'), s.cls, { list: 'fe-cl' }) + field('fs-sec', T('fee.sec'), s.sec) + field('fs-roll', T('fee.roll'), s.roll) + field('fs-adm', T('fee.adm'), s.adm) +
      field('fs-g', T('fee.guard'), s.guardian) + field('fs-ph', T('l.phone'), s.phone, { type: 'tel', mode: 'tel' }) + field('fs-j', T('fee.joined'), s.joined, { type: 'month' }) + field('fs-l', T('fee.left'), s.left, { type: 'month' }) +
      '<div class="f"><label for="fs-tr">' + esc(T('fee.transport')) + '</label><select id="fs-tr"><option value="">' + esc(T('fee.notrans')) + '</option>' + S.routes.map(function (r) { return '<option' + (F.key(r.name) === F.key(tr.route) ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') + '</select></div>' + field('fs-tra', T('fee.transamt'), tr.amt, { mode: 'decimal' }) + '</div>' +
      '<datalist id="fe-cl">' + classes().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<fieldset class="ac-w"><legend>' + esc(T('fee.conc')) + '</legend><div class="fg"><div class="f"><label for="fs-ct">' + esc(T('fee.ctype')) + '</label><select id="fs-ct">' + [['none', 'fee.cnone'], ['pct', 'fee.cpct'], ['amt', 'fee.camt']].map(function (x) { return '<option value="' + x[0] + '"' + ((c.type || 'none') === x[0] ? ' selected' : '') + '>' + esc(T(x[1])) + '</option>'; }).join('') + '</select></div>' + field('fs-cv', T('fee.cvalue'), c.v, { mode: 'decimal' }) + field('fs-cw', T('fee.cwhy'), c.why, { wide: true, ph: T('fee.cwhyph') }) + '</div><p class="soft">' + esc(T('fee.cheads')) + '</p>' + hs + '<p class="soft">' + esc(T('fee.cnote')) + '</p></fieldset>' +
      '<div class="btns"><button type="button" class="btn primary" id="fs-save">' + esc(T('fee.save')) + '</button>' + (n ? '' : ' <button type="button" class="btn danger" id="fs-del">' + esc(T('fee.delete')) + '</button>') + '</div><p id="fs-err" class="note bad" role="alert" hidden></p>');
    var err = function (m) { var e = $('#fs-err', d); e.hidden = false; e.textContent = m; };
    $('#fs-save', d).addEventListener('click', function () {
      var name = $('#fs-name', d).value.trim(), cl = $('#fs-cls', d).value.trim(), j = $('#fs-j', d).value, l = $('#fs-l', d).value;
      if (!name) return err(T('fee.v.name')); if (!cl) return err(T('fee.v.cls'));
      if (j && l && l < j) return err(T('fe.v.months'));
      var dup = STUDENTS.concat([]).filter(function (x) { return x.id !== s.id && F.key(x.name) === F.key(name); })[0];
      if (dup) return err(T('fee.v.dup', { n: name }));
      var rec = Object.assign({}, s, { name: name, student: 1, role: s.role || 'customer', bizKey: BK, cls: cl, sec: $('#fs-sec', d).value.trim(), roll: $('#fs-roll', d).value.trim(), adm: $('#fs-adm', d).value.trim(), guardian: $('#fs-g', d).value.trim(), phone: $('#fs-ph', d).value.trim(), joined: j, left: l });
      var rt = $('#fs-tr', d).value; if (rt) rec.transport = { route: rt, amt: $('#fs-tra', d).value.trim() }; else delete rec.transport;
      var ct = $('#fs-ct', d).value, heads = $$('[data-fe-ch]', d).filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute('data-fe-ch'); });
      if (ct !== 'none' && num($('#fs-cv', d).value)) rec.conc = { type: ct, v: num($('#fs-cv', d).value), heads: heads, why: $('#fs-cw', d).value.trim() }; else delete rec.conc;
      NSStore.list('party').then(function (all) {   /* a customer already saved under this name becomes the student (the books name parties by name) */
        var hit = all.filter(function (x) { return F.key(x.name) === F.key(name) && x.id !== s.id; })[0];
        if (hit && !hit.student) rec = Object.assign({}, hit, rec, { id: hit.id });
        return NSStore.put('party', rec);
      }).then(function () { d.close(); NS.toast(T('ca.saved')); return reload(); }, function (e) { err(e.message || String(e)); });
    });
    var del = $('#fs-del', d);
    if (del) del.addEventListener('click', function () { if (!NS.okSync(T('fee.v.del', { n: s.name }))) return; NSStore.del('party', s.id).then(function () { d.close(); return reload(); }, function (e) { err(e.message); }); });
  }
  function importBox() {
    var d = dlg('fe-imp', T('fee.import'), '<p class="soft">' + esc(T('fee.imph')) + '</p><div class="btns"><button type="button" class="btn" id="fi-file">' + esc(T('fee.pickcsv')) + '</button><input type="file" id="fi-in" accept=".csv,.txt,text/csv,text/plain" hidden></div>' +
      '<label for="fi-text">' + esc(T('fee.pastelbl')) + '</label><textarea id="fi-text" rows="6" spellcheck="false"></textarea><div class="btns"><button type="button" class="btn primary" id="fi-go">' + esc(T('fee.checkimp')) + '</button></div><div id="fi-out" aria-live="polite"></div>');
    $('#fi-file', d).addEventListener('click', function () { $('#fi-in', d).click(); });
    $('#fi-in', d).addEventListener('change', function (e) { var f = e.target.files[0]; if (f) f.text().then(function (t) { $('#fi-text', d).value = t; run(); }); });
    var plan = null;
    function run() {
      var res = F.fromRows(F.parseCsv($('#fi-text', d).value), S), have = {}; STUDENTS.forEach(function (s) { have[F.key(s.name)] = s; });
      var add = [], upd = [], seen = {}, probs = res.problems.slice();
      res.students.forEach(function (s, i) { var k = F.key(s.name); if (seen[k]) { probs.push([i + 2, T('fee.imp.dupin', { n: s.name })]); return; } seen[k] = 1; (have[k] ? upd : add).push(s); });
      plan = { add: add, upd: upd };
      $('#fi-out', d).innerHTML = '<p class="note ' + (add.length + upd.length ? 'ok-note' : 'bad') + '">' + esc(T('fee.imp.sum', { a: add.length, u: upd.length })) + '</p>' + (probs.length ? '<ul class="note">' + probs.slice(0, 12).map(function (p) { return '<li>' + esc((p[0] ? T('fee.imp.line', { n: p[0] }) + ' ' : '') + p[1]) + '</li>'; }).join('') + (probs.length > 12 ? '<li>…</li>' : '') + '</ul>' : '') +
        (add.length + upd.length ? '<div class="btns"><button type="button" class="btn primary" id="fi-do">' + esc(T('fee.imp.do', { n: add.length + upd.length })) + '</button></div>' : '');
      var go = $('#fi-do', d); if (go) go.addEventListener('click', doImport);
    }
    function doImport() {
      NSStore.list('party').then(function (all) {
        var by = {}; all.forEach(function (p) { by[F.key(p.name)] = p; });
        var recs = plan.add.concat(plan.upd).map(function (s) { var old = by[F.key(s.name)]; return Object.assign({}, old || {}, s, { bizKey: BK, id: old ? old.id : undefined }); });
        recs.forEach(function (r) { if (!r.id) delete r.id; });
        return recs.reduce(function (p, r) { return p.then(function () { return NSStore.put('party', r); }); }, Promise.resolve());
      }).then(function () { d.close(); NS.toast(T('fee.imp.done')); return reload(); }, function (e) { $('#fi-out', d).innerHTML = '<p class="note bad">' + esc(e.message || String(e)) + '</p>'; });
    }
    $('#fi-go', d).addEventListener('click', run);
  }

  /* ---------- fee set-up ---------- */
  function setupHtml() {
    var cl = classes();
    return '<p class="soft">' + esc(T('fee.setuph')) + '</p>' +
      '<div class="card"><h3>' + esc(T('fee.sess')) + '</h3><div class="fg">' + field('fu-ses', T('fee.session'), S.session, { ph: '2026-27' }) +
      '<div class="f"><label for="fu-sm">' + esc(T('fee.startm')) + '</label><select id="fu-sm">' + [4, 6, 7, 1, 9, 10].map(function (m) { return '<option value="' + m + '"' + (S.startMonth === m ? ' selected' : '') + '>' + esc(['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]) + '</option>'; }).join('') + '</select></div>' +
      field('fu-due', T('fee.dueday'), S.dueDay, { mode: 'numeric' }) + '<div class="f"><label for="fu-gst">' + esc(T('fee.gst')) + '</label><select id="fu-gst">' + [['ex', 'fe.gex'], ['18', 'fe.g18'], ['none', 'fe.gnone']].map(function (x) { return '<option value="' + x[0] + '"' + ((S.gst || 'ex') === x[0] ? ' selected' : '') + '>' + esc(T(x[1])) + '</option>'; }).join('') + '</select></div></div></div>' +
      '<div class="card"><h3>' + esc(T('fee.heads')) + '</h3><p class="soft">' + esc(T('fee.headsh')) + '</p>' + S.heads.map(function (h, i) {
        return '<div class="fg fe-head"><div class="f"><label for="fh-n' + i + '">' + esc(T('fee.head')) + '</label><input id="fh-n' + i + '" data-fh="' + i + '" value="' + esc(h.name) + '"></div><div class="f"><label for="fh-f' + i + '">' + esc(T('fee.freq')) + '</label><select id="fh-f' + i + '" data-fhf="' + i + '">' + Object.keys(FREQ).map(function (k) { return '<option value="' + k + '"' + (h.freq === k ? ' selected' : '') + '>' + esc(T(FREQ[k])) + '</option>'; }).join('') + '</select></div><div class="f"><button type="button" class="btn sm danger" data-fh-del="' + i + '">' + esc(T('fee.delete')) + '</button></div></div>';
      }).join('') + '<div class="btns"><button type="button" class="btn" data-fh-add>+ ' + esc(T('fee.addhead')) + '</button></div></div>' +
      '<div class="card"><h3>' + esc(T('fee.struct')) + '</h3><p class="soft">' + esc(T('fee.structh')) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.cls')) + '</th>' + S.heads.map(function (h) { return '<th class="n">' + esc(h.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (cl.map(function (c) { var row = S.fees[F.key(c)] || {}; return '<tr><th scope="row">' + esc(c) + '</th>' + S.heads.map(function (h) { return '<td class="n"><input class="fe-amt" inputmode="decimal" data-fk="' + esc(F.key(c)) + '" data-fh2="' + esc(h.id) + '" value="' + esc(row[h.id] || '') + '" aria-label="' + esc(c + ' ' + h.name) + '"></td>'; }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + (S.heads.length + 1) + '">' + esc(T('fee.none')) + '</td></tr>') + '</tbody></table></div>' +
      '<div class="quick"><input id="fu-newcls" placeholder="' + esc(T('fee.newcls')) + '" aria-label="' + esc(T('fee.newcls')) + '"> <button type="button" class="btn" data-fc-add>+ ' + esc(T('fee.addcls')) + '</button> <button type="button" class="btn" data-fc-std>' + esc(T('fee.stdcls')) + '</button></div></div>' +
      '<div class="card"><h3>' + esc(T('fee.routes')) + '</h3><p class="soft">' + esc(T('fee.routesh')) + '</p>' + S.routes.map(function (r, i) { return '<div class="fg"><div class="f"><label for="fr-n' + i + '">' + esc(T('fee.route')) + '</label><input id="fr-n' + i + '" data-fr="' + i + '" value="' + esc(r.name) + '"></div><div class="f"><label for="fr-a' + i + '">' + esc(T('fee.monthly')) + '</label><input id="fr-a' + i + '" data-fra="' + i + '" inputmode="decimal" value="' + esc(r.amt) + '"></div><div class="f"><button type="button" class="btn sm danger" data-fr-del="' + i + '">' + esc(T('fee.delete')) + '</button></div></div>'; }).join('') + '<div class="btns"><button type="button" class="btn" data-fr-add>+ ' + esc(T('fee.addroute')) + '</button></div></div>' +
      '<div class="card"><h3>' + esc(T('fee.sibt')) + '</h3><label class="chk"><input type="checkbox" id="fs-on"' + (S.sib.on ? ' checked' : '') + '> ' + esc(T('fee.sibon')) + '</label><div class="fg">' + field('fs-pct', T('fee.sibpct'), S.sib.pct, { mode: 'decimal' }) + '</div><p class="soft">' + esc(T('fee.sibheads')) + '</p>' +
      S.heads.map(function (h) { return '<label class="chk"><input type="checkbox" data-fsh="' + esc(h.id) + '"' + (S.sib.heads.indexOf(h.id) >= 0 ? ' checked' : '') + '> ' + esc(h.name) + '</label>'; }).join('') + '<p class="soft">' + esc(T('fee.sibnote')) + '</p></div>' +
      '<div class="btns"><button type="button" class="btn primary" data-fu-save>' + esc(T('fee.save')) + '</button></div>';
  }
  function slug(n) { return F.key(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'h' + Date.now().toString(36); }
  function readSetup() {
    S.session = $('#fu-ses', pane).value.trim() || S.session; S.startMonth = +$('#fu-sm', pane).value; S.dueDay = Math.min(28, Math.max(1, +$('#fu-due', pane).value || 10)); S.gst = $('#fu-gst', pane).value;
    $$('[data-fh]', pane).forEach(function (i) { S.heads[+i.getAttribute('data-fh')].name = i.value.trim() || S.heads[+i.getAttribute('data-fh')].name; });
    $$('[data-fhf]', pane).forEach(function (s) { S.heads[+s.getAttribute('data-fhf')].freq = s.value; });
    $$('.fe-amt', pane).forEach(function (i) { var k = i.getAttribute('data-fk'), h = i.getAttribute('data-fh2'); S.fees[k] = S.fees[k] || {}; var v = num(i.value); if (v) S.fees[k][h] = v; else delete S.fees[k][h]; });
    $$('[data-fr]', pane).forEach(function (i) { S.routes[+i.getAttribute('data-fr')].name = i.value.trim(); });
    $$('[data-fra]', pane).forEach(function (i) { S.routes[+i.getAttribute('data-fra')].amt = num(i.value); });
    S.sib = { on: $('#fs-on', pane).checked, pct: num($('#fs-pct', pane).value), heads: $$('[data-fsh]', pane).filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute('data-fsh'); }) };
  }
  function wireSetup() {
    function again() { readSetup(); paint(); }
    $('[data-fh-add]', pane).addEventListener('click', function () { readSetup(); var n = T('fee.newhead'); S.heads.push({ id: slug(n + S.heads.length), name: n, freq: 'month' }); paint(); });
    $$('[data-fh-del]', pane).forEach(function (b) { b.addEventListener('click', function () { readSetup(); var h = S.heads.splice(+b.getAttribute('data-fh-del'), 1)[0]; Object.keys(S.fees).forEach(function (k) { delete S.fees[k][h.id]; }); paint(); }); });
    $('[data-fc-add]', pane).addEventListener('click', function () { var n = $('#fu-newcls', pane).value.trim(); if (!n) return; readSetup(); S.fees[F.key(n)] = S.fees[F.key(n)] || {}; paint(); });
    $('[data-fc-std]', pane).addEventListener('click', function () { readSetup(); ['Nursery', 'LKG', 'UKG'].concat(Array.apply(null, Array(12)).map(function (_, i) { return String(i + 1); })).forEach(function (c) { S.fees[F.key(c)] = S.fees[F.key(c)] || {}; }); paint(); });
    $('[data-fr-add]', pane).addEventListener('click', function () { readSetup(); S.routes.push({ name: T('fee.route') + ' ' + (S.routes.length + 1), amt: 0 }); paint(); });
    $$('[data-fr-del]', pane).forEach(function (b) { b.addEventListener('click', function () { readSetup(); S.routes.splice(+b.getAttribute('data-fr-del'), 1); paint(); }); });
    $('[data-fu-save]', pane).addEventListener('click', function () { readSetup(); asOf = ''; saveSetup().then(function () { NS.toast(T('ca.saved')); return load(); }).then(paint); });
  }

  /* ---------- reports ---------- */
  function reportHtml() {
    var rep = F.report(S, STUDENTS, DOCS, rFrom, rTo), all = rows(), byc = {};
    all.forEach(function (r) { var k = r.st.cls || '—', o = byc[k] || (byc[k] = { cls: k, n: 0, billed: 0, paid: 0, bal: 0, over: 0 }); o.n++; o.billed = r2(o.billed + r.billed); o.paid = r2(o.paid + r.paid); o.bal = r2(o.bal + Math.max(0, r.balance)); o.over = r2(o.over + r.overdue); });
    var cl = Object.keys(byc).sort(function (a, b) { return a.localeCompare(b, 'en', { numeric: true }); });
    return '<div class="quick fe-filt"><label>' + esc(T('b3.ac.from')) + ' <input type="date" id="fr-f" value="' + esc(rFrom) + '"></label><label>' + esc(T('b3.ac.to')) + ' <input type="date" id="fr-t" value="' + esc(rTo) + '"></label><button type="button" class="btn" data-fr-csv>' + esc(T('fee.csv')) + '</button></div>' +
      '<h3>' + esc(T('fee.rep.coll')) + '</h3><p class="soft">' + esc(T('fee.rep.collh', { n: rep.n, v: money(rep.total) })) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.cls')) + '</th><th class="n">' + esc(T('fee.rep.rc')) + '</th>' + rep.cols.map(function (c) { return '<th class="n">' + esc(c.name) + '</th>'; }).join('') + '<th class="n">' + esc(T('cv.total')) + '</th></tr></thead><tbody>' +
      (rep.rows.map(function (r) { return '<tr><th scope="row">' + esc(r.cls) + '</th><td class="n">' + r.n + '</td>' + rep.cols.map(function (c) { return '<td class="n">' + (r.h[c.id] ? money(r.h[c.id], false) : '') + '</td>'; }).join('') + '<td class="n"><b>' + money(r.total, false) + '</b></td></tr>'; }).join('') || '<tr><td colspan="' + (rep.cols.length + 3) + '">' + esc(T('fee.none')) + '</td></tr>') +
      '</tbody><tfoot><tr><th>' + esc(T('cv.total')) + '</th><td class="n">' + rep.n + '</td>' + rep.cols.map(function (c) { return '<td class="n">' + money(rep.colTot[c.id] || 0, false) + '</td>'; }).join('') + '<td class="n"><b>' + money(rep.total, false) + '</b></td></tr></tfoot></table></div>' +
      (Object.keys(rep.modes).length ? '<p class="soft">' + esc(T('fee.rep.modes')) + ' ' + Object.keys(rep.modes).map(function (m) { return esc(m) + ' ' + money(rep.modes[m], false); }).join(' · ') + '</p>' : '') +
      '<h3>' + esc(T('fee.rep.cls', { m: F.monthName(asOf) })) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('fee.cls')) + '</th><th class="n">' + esc(T('fee.s.students')) + '</th><th class="n">' + esc(T('fee.s.billed')) + '</th><th class="n">' + esc(T('fee.s.paid')) + '</th><th class="n">' + esc(T('fee.bal')) + '</th><th class="n">' + esc(T('fee.overdue')) + '</th></tr></thead><tbody>' +
      (cl.map(function (k) { var o = byc[k]; return '<tr><th scope="row">' + esc(k) + '</th><td class="n">' + o.n + '</td><td class="n">' + money(o.billed, false) + '</td><td class="n">' + money(o.paid, false) + '</td><td class="n">' + money(o.bal, false) + '</td><td class="n">' + money(o.over, false) + '</td></tr>'; }).join('') || '<tr><td colspan="6">' + esc(T('fee.none')) + '</td></tr>') + '</tbody></table></div>';
  }
  function wireReport() {
    function go() { var f = $('#fr-f', pane).value, t = $('#fr-t', pane).value; if (f && t && f <= t) { rFrom = f; rTo = t; paint(); } }
    $('#fr-f', pane).addEventListener('change', go); $('#fr-t', pane).addEventListener('change', go);
    $('[data-fr-csv]', pane).addEventListener('click', function () {
      var rep = F.report(S, STUDENTS, DOCS, rFrom, rTo), out = [['Class', 'Receipts'].concat(rep.cols.map(function (c) { return c.name; }), ['Total'])];
      rep.rows.forEach(function (r) { out.push([r.cls, r.n].concat(rep.cols.map(function (c) { return r.h[c.id] || ''; }), [r.total])); });
      out.push(['Total', rep.n].concat(rep.cols.map(function (c) { return rep.colTot[c.id] || ''; }), [rep.total]));
      csvOut('fee-collection-' + rFrom + '-to-' + rTo + '.csv', out);
    });
  }

  function mount() {
    A.addSection('fees', function () { return '<div class="shim" style="height:160px"></div>'; }, function (p) { pane = p; load().then(paint); });
    var nav = $('.hub-nav'); if (nav && !$('[data-sec="fees"]', nav) && !(A.door && A.door())) nav.insertAdjacentHTML('beforeend', '<a href="#fees" data-sec="fees"><span data-i18n="fee.t">' + esc(T('fee.t')) + '</span></a>');
  }
  window.NSFeesUI = { load: load };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
