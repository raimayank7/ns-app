/* NS warranty (India plan D, 2026-11-17): "Warranty and service due" for sellers of mobiles, electronics and appliances. An App section (#warr).
   Reads the optional warranty fields of bill lines (months of warranty, service every N months, serial / IMEI; set on the bill, docmore.js) and lists every unit
   by warranty end and next service: expired, ending within 30 / 60 / 90 days, service overdue or due. Look-up by serial / IMEI, phone, customer or bill number,
   a WhatsApp text for the customer (shown first: nothing is sent by the App), and a button that opens the Job card site with the customer, item and serial filled in.
   The date sums are warrcore.js (pure, tested by scripts/test_warr.js). A job card with the same serial counts as the unit's last service visit.
   Screen text: NS.t('wr.<key>'); the CSV file is in English. */
(function () {
  'use strict';
  var NS = window.NS, W = window.NSWarr, A = window.NSApp; if (!W || !A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function t(k, v) { return NS.t('wr.' + k, v); }
  var view = 'active', q = '', pane = null, sortBy = 'end';
  var VIEWS = [['active', 'v_active'], ['e30', 'v_e30'], ['e60', 'v_e60'], ['e90', 'v_e90'], ['expired', 'v_expired'], ['overdue', 'v_overdue'], ['s30', 'v_s30'], ['s60', 'v_s60'], ['s90', 'v_s90'], ['all', 'v_all']];

  function recs() { return W.records(A.data().doc, A.bizName(), NS.today()); }
  function pill(r) {
    var b = W.bucket(r);
    return b === 'expired' ? '<span class="pill bad">' + esc(t('p_expired', { n: -r.daysEnd })) + '</span>' : '<span class="pill ' + (b === 'later' ? 'ok' : 'warn') + '">' + esc(t('p_left', { n: r.daysEnd })) + '</span>';
  }
  function svcPill(r) {
    if (!r.next) return '<span class="soft">—</span>';
    var s = W.svcBucket(r), when = A.ldate(r.next);
    return '<span class="pill ' + (s === 'overdue' ? 'bad' : s === 'later' ? 'ok' : 'warn') + '">' + esc(s === 'overdue' ? t('s_over', { n: -r.daysSvc }) : t('s_in', { n: r.daysSvc })) + '</span><br><span class="soft">' + esc(when) + '</span>';
  }
  function html() {
    var R = recs(), C = W.counts(R), L = W.filter(R, view);
    if (q.trim().length >= 3) L = W.lookup(R, q);
    if (sortBy === 'svc') L = L.slice().sort(function (a, b) { return (a.next || '9') < (b.next || '9') ? -1 : 1; });
    var tile = function (v, n, label, warn) { return '<button type="button" class="tile wr-tile' + (warn && n ? ' warn' : '') + '" data-wrv="' + v + '" aria-pressed="' + (view === v) + '"><span>' + esc(label) + '</span><b>' + n + '</b></button>'; };
    return '<div class="pane-hd" data-nosp><h2>' + esc(t('t')) + '</h2></div><p class="soft">' + esc(t('intro')) + '</p>' +
      '<div class="tiles wr-tiles">' + tile('expired', C.expired, t('v_expired'), 1) + tile('e30', C.e30, t('v_e30')) + tile('e90', C.e90, t('v_e90')) + tile('overdue', C.overdue, t('v_overdue'), 1) + tile('s30', C.s30, t('v_s30')) + '</div>' +
      '<div class="tools-row no-print"><input type="search" data-wrq placeholder="' + esc(t('lookup')) + '" value="' + esc(q) + '" aria-label="' + esc(t('lookup')) + '"> <label>' + esc(t('show')) + ' <select data-wrview>' + VIEWS.map(function (v) { return '<option value="' + v[0] + '"' + (view === v[0] ? ' selected' : '') + '>' + esc(t(v[1])) + '</option>'; }).join('') + '</select></label> ' +
      '<label>' + esc(t('sort')) + ' <select data-wrsort><option value="end"' + (sortBy === 'end' ? ' selected' : '') + '>' + esc(t('sort_end')) + '</option><option value="svc"' + (sortBy === 'svc' ? ' selected' : '') + '>' + esc(t('sort_svc')) + '</option></select></label> <button type="button" class="btn" data-wrcsv>' + esc(t('csv')) + '</button></div>' +
      (q.trim().length > 0 && q.trim().length < 3 ? '<p class="soft">' + esc(t('min3')) + '</p>' : '') +
      (R.length ? '' : '<p class="note">' + esc(t('empty')) + '</p>') +
      '<div class="tbl-wrap"><table class="tbl wr-t"><thead><tr><th>' + esc(t('c_item')) + '</th><th>' + esc(t('c_cust')) + '</th><th>' + esc(t('c_bill')) + '</th><th>' + esc(t('c_end')) + '</th><th>' + esc(t('c_svc')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      (L.length ? L.map(function (r) {
        return '<tr><th scope="row" data-l="' + esc(t('c_item')) + '">' + esc(r.item) + (r.sn ? '<br><span class="soft mono">' + esc(r.sn) + '</span>' : '') + '</th><td data-l="' + esc(t('c_cust')) + '">' + esc(r.cust || '—') + (r.phone ? '<br><span class="soft">' + esc(r.phone) + '</span>' : '') + '</td>' +
          '<td data-l="' + esc(t('c_bill')) + '">' + esc(r.docNo) + '<br><span class="soft">' + esc(A.ldate(r.date)) + ' · ' + esc(t('months', { n: r.months })) + '</span></td><td data-l="' + esc(t('c_end')) + '">' + pill(r) + '<br><span class="soft">' + esc(A.ldate(r.end)) + '</span></td>' +
          '<td data-l="' + esc(t('c_svc')) + '">' + svcPill(r) + (r.visits.length ? '<br><span class="soft">' + esc(t('visits', { n: r.visits.length })) + '</span>' : '') + '</td>' +
          '<td class="no-print"><button type="button" class="btn sm" data-wrwa="' + esc(r.id) + '">WhatsApp</button> <button type="button" class="btn sm" data-wrjob="' + esc(r.id) + '">' + esc(t('job')) + '</button> <a class="btn sm" href="' + esc(A.docUrl(r.doc) || '#') + '">' + esc(t('bill')) + '</a></td></tr>';
      }).join('') : '<tr><td colspan="6">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div>' +
      '<p class="soft">' + esc(t('howto')) + '</p>';
  }
  function byId(id) { return recs().filter(function (r) { return r.id === id; })[0]; }
  function kindOf(r) { return r.next && W.svcBucket(r) !== 'later' && (W.svcBucket(r) === 'overdue' || r.daysSvc <= 30) ? 'service' : W.bucket(r) === 'expired' ? 'expired' : 'expiry'; }
  function waDialog(r) {
    var d = $('#wr-wa');
    if (!d) { d = NS.el('dialog', { id: 'wr-wa', 'aria-labelledby': 'wr-wa-h' }); document.body.appendChild(d); }
    var kind = kindOf(r);
    d.innerHTML = '<div class="dlg-h"><h2 id="wr-wa-h">' + esc(t('wa_t')) + '</h2><form method="dialog"><button class="btn sm">' + esc(NS.t('close')) + '</button></form></div><div class="dlg-b"><p class="soft">' + esc(t('wa_p')) + '</p>' +
      '<div class="f wide"><label for="wr-kind">' + esc(t('wa_kind')) + '</label><select id="wr-kind">' + [['service', 'wa_service'], ['expiry', 'wa_expiry'], ['expired', 'wa_expired']].map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === kind ? ' selected' : '') + '>' + esc(t(k[1])) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f wide"><label for="wr-txt">' + esc(t('wa_text')) + '</label><textarea id="wr-txt" rows="5" dir="auto"></textarea></div><div class="btns"><button type="button" class="btn primary" id="wr-send">' + esc(t('wa_open')) + '</button></div></div>';
    var ta = $('#wr-txt', d), k = $('#wr-kind', d);
    function fill() { ta.value = W.text(k.value, r, A.bizName()); } fill(); k.addEventListener('change', fill);
    $('#wr-send', d).addEventListener('click', function () {
      var ph = String(r.phone || '').replace(/\D/g, '').slice(-10);
      window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(ta.value), '_blank', 'noopener');
    });
    d.showModal ? d.showModal() : d.setAttribute('open', '');
  }
  /* open the Job card site with the customer, item and serial filled in (the job card reads ?pre=) */
  function openJob(r) {
    var phone = String(r.phone || ''), under = W.bucket(r) !== 'expired';
    var pre = { buyer: { name: r.cust, phone: phone }, make: r.item, serial: r.sn, itype: /phone|mobile|iphone|galaxy|redmi|oppo|vivo|realme/i.test(r.item) ? 'mobile' : 'appliance',
      complaint: '', cond: '', acc: '', notes: (under ? t('job_under', { d: A.ldate(r.end), b: r.docNo }) : t('job_out', { d: A.ldate(r.end), b: r.docNo })) };
    var url = A.siteHome ? A.siteHome('job-card') : 'https://job-card.niveshsahayak.in/', href = url + '?pre=' + encodeURIComponent(JSON.stringify(pre));
    if (!A.openUrl(href)) location.href = href;
  }
  function csv() {
    var R = W.filter(recs(), view), rows = [['Item', 'Serial / IMEI', 'Customer', 'Phone', 'Bill no.', 'Bill date', 'Warranty (months)', 'Warranty ends', 'Days left', 'Service every (months)', 'Last service visit', 'Next service', 'Visits']];
    R.forEach(function (r) { rows.push([r.item, r.sn, r.cust, r.phone, r.docNo, r.date, r.months, r.end, r.daysEnd, r.svcm || '', r.lastVisit, r.next, r.visits.length]); });
    var name = 'warranty-' + view + '-' + NS.today() + '.csv'; NS.saveFile(new File(['﻿' + W.toCsv(rows)], name, { type: 'text/csv' }), name); NS.toast(t('filesaved', { file: name }));
  }
  function wire(p) {
    pane = p;
    $$('[data-wrv]', p).forEach(function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-wrv'); A.show(); }); });
    var s = $('[data-wrview]', p); if (s) s.addEventListener('change', function () { view = s.value; A.show(); });
    var o = $('[data-wrsort]', p); if (o) o.addEventListener('change', function () { sortBy = o.value; A.show(); });
    var i = $('[data-wrq]', p); if (i) i.addEventListener('input', function () { q = i.value; var pos = i.selectionStart; A.show(); var n = $('[data-wrq]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
    $$('[data-wrwa]', p).forEach(function (b) { b.addEventListener('click', function () { var r = byId(b.getAttribute('data-wrwa')); if (r) waDialog(r); }); });
    $$('[data-wrjob]', p).forEach(function (b) { b.addEventListener('click', function () { var r = byId(b.getAttribute('data-wrjob')); if (r) openJob(r); }); });
    var c = $('[data-wrcsv]', p); if (c) c.addEventListener('click', csv);
  }
  /* My day / dashboard: one line when something needs a call */
  A.addHome(function () {
    var R = recs(), C = W.counts(R); if (!C.overdue && !C.s30 && !C.e30) return '';
    return '<div class="card"><h3>' + esc(t('t')) + '</h3><p>' + esc(t('home', { a: C.overdue, b: C.s30, c: C.e30 })) + '</p><p><a class="btn" href="#warr">' + esc(t('see')) + '</a></p></div>';
  });
  function mount() {
    A.addSection('warr', html, wire);
    var nav = $('.hub-nav'); if (nav && !$('[data-sec="warr"]', nav) && !(A.door && A.door())) nav.insertAdjacentHTML('beforeend', '<a href="#warr" data-sec="warr"><span data-i18n="wr.t">' + esc(t('t')) + '</span></a>');
    document.addEventListener('ns-lang', function () { var s = $('[data-sec="warr"] span'); if (s) s.textContent = t('t'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
