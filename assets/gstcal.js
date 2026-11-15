/* gst-calendar.niveshsahayak.in: GST and TDS due dates for the user's own kind of business, month by month.
   The rules (as of 5 Nov 2026; sources in the guide pages):
     GSTR-1 monthly 11th of next month (rule 59) · GSTR-3B monthly 20th (rule 61) · QRMP (turnover up to Rs 5 crore, opted in):
     IFF for months 1-2 by the 13th (optional), PMT-06 tax for months 1-2 by the 25th, GSTR-1 quarterly by the 13th after the
     quarter, GSTR-3B quarterly by the 22nd or 24th by state (Notification 76/2020-CT as amended; same list as gstr3b.js) ·
     CMP-08 18th after the quarter · GSTR-4 30 June after the year (from FY 2024-25, Notification 12/2024-CT) · GSTR-9/9C
     31 December after the year · GSTR-7 (GST TDS) and GSTR-8 (e-commerce TCS) 10th of next month · income-tax TDS/TCS deposit
     7th of next month, March by 30 April · quarterly TDS statements on the usual dates 31 Jul, 31 Oct, 31 Jan, 31 May (form
     numbers changed with the Income-tax Rules, 2026: shown as "check") · advance tax 15 Jun, 15 Sep, 15 Dec, 15 Mar.
   The profile is saved in the data home (meta 'gstcal'), so it moves with backups. Reminders: an .ics file for the phone's
   calendar (alarm 2 days before), and browser notifications for items due within 3 days when the page is opened. */
(function () {
  'use strict';
  var NS = window.NS, $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function T(k, v) { return NS.t(k, v); }
  var D22 = { '22': 1, '23': 1, '24': 1, '26': 1, '27': 1, '29': 1, '30': 1, '32': 1, '33': 1, '36': 1, '37': 1, '34': 1, '35': 1, '31': 1 };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LINK = { gstr1: 'https://gstr1.niveshsahayak.in/', gstr3b: 'https://gstr3b.niveshsahayak.in/', cmp08: 'https://cmp08.niveshsahayak.in/', tds: 'https://tds.niveshsahayak.in/' };
  var FROM = '';   /* name of the saved business the state and filing were taken from */
  var P = { gst: 'monthly', state: '03', tds: false, adv: false, annual: true, g7: false, g8: false };
  var box, view;

  function ymd(y, m, d) { var x = new Date(y, m, d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function mname(y, m) { var x = new Date(y, m, 1); return MON[x.getMonth()] + ' ' + x.getFullYear(); }
  function qname(y, m) { var x = new Date(y, m, 1), q = Math.floor(((x.getMonth() + 9) % 12) / 3); return T('gc.q', { q: q + 1 }) + ' ' + NS.fy(ymd(x.getFullYear(), x.getMonth(), 1)); }
  function fyOf(y, m) { var x = new Date(y, m, 1); return NS.fy(ymd(x.getFullYear(), x.getMonth(), 1)); }

  /* every due date that falls in calendar month (y, m), for profile p */
  function dueIn(p, y, m) {
    var out = [], pm = m - 1;   /* the period is mostly the month before */
    function add(day, code, per, link, note) { out.push({ date: ymd(y, m, day), code: code, title: T('gc.t.' + code), per: per, link: link || '', note: note || '' }); }
    var qEnd = (new Date(y, pm, 1).getMonth() + 1) % 3 === 0;   /* the month before ended a quarter (Jun, Sep, Dec, Mar) */
    if (p.gst === 'monthly') { add(11, 'gstr1', mname(y, pm), LINK.gstr1); add(20, 'gstr3b', mname(y, pm), LINK.gstr3b); }
    if (p.gst === 'qrmp') {
      if (qEnd) { add(13, 'gstr1q', qname(y, pm), LINK.gstr1); add(D22[p.state] ? 22 : 24, 'gstr3bq', qname(y, pm), LINK.gstr3b, T(D22[p.state] ? 'gc.n.22' : 'gc.n.24')); }
      else { add(13, 'iff', mname(y, pm), LINK.gstr1); add(25, 'pmt06', mname(y, pm), LINK.gstr3b); }
    }
    if (p.gst === 'comp') {
      if (qEnd) add(18, 'cmp08', qname(y, pm), LINK.cmp08);
      if (new Date(y, m, 1).getMonth() === 5) add(30, 'gstr4', 'FY ' + fyOf(y, m - 12), '');
    }
    if (p.g7) add(10, 'gstr7', mname(y, pm));
    if (p.g8) add(10, 'gstr8', mname(y, pm));
    if (p.annual && p.gst !== 'none' && p.gst !== 'comp' && new Date(y, m, 1).getMonth() === 11) add(31, 'gstr9', 'FY ' + fyOf(y, m - 12));
    if (p.tds) {
      var mo = new Date(y, m, 1).getMonth();
      if (mo !== 3) add(7, 'tdsdep', mname(y, pm), LINK.tds); else add(30, 'tdsdepmar', mname(y, pm), LINK.tds);   /* March: by 30 April */
      var qd = { 6: [31, 1], 9: [31, 2], 0: [31, 3], 4: [31, 4] }[mo];
      if (qd) add(qd[0], 'tdsret', T('gc.q', { q: qd[1] }) + ' ' + fyOf(y, mo === 4 ? m - 2 : m - 1), LINK.tds, T('gc.n.tdsret'));
    }
    if (p.adv) {
      var am = new Date(y, m, 1).getMonth(), ad = { 5: '15%', 8: '45%', 11: '75%', 2: '100%' }[am];
      if (ad) add(15, 'adv', 'FY ' + fyOf(y, m), '', T('gc.n.adv', { pc: ad }));
    }
    return out.sort(function (a, b) { return a.date.localeCompare(b.date); });
  }
  function upcoming(p, days) {
    var now = new Date(), today = NS.today(), end = new Date(now.getTime() + days * 864e5), list = [];
    for (var k = -1; k <= Math.ceil(days / 28) + 1; k++) list = list.concat(dueIn(p, now.getFullYear(), now.getMonth() + k));
    var last = ymd(end.getFullYear(), end.getMonth(), end.getDate());
    return list.filter(function (e) { return e.date >= today && e.date <= last; });
  }
  function left(date) { return NSdays(NS.today(), date); }
  function NSdays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5); }
  function badge(date) {
    var n = left(date);
    if (n < 0) return '<span class="gc-b past">' + esc(T('gc.past')) + '</span>';
    if (n === 0) return '<span class="gc-b now">' + esc(T('gc.today')) + '</span>';
    return '<span class="gc-b' + (n <= 3 ? ' now' : n <= 7 ? ' soon' : '') + '">' + esc(T('gc.left', { n: n })) + '</span>';
  }
  function row(e) {
    var wk = new Date(e.date + 'T00:00:00').getDay();
    return '<li class="gc-i"><span class="gc-d"><b>' + e.date.slice(8) + '</b><small>' + MON[+e.date.slice(5, 7) - 1] + '</small></span><span class="gc-x"><b>' + esc(e.title) + '</b>' +
      '<small>' + esc(T('gc.for')) + ' ' + esc(e.per) + (e.note ? ' · ' + esc(e.note) : '') + (wk === 0 ? ' · ' + esc(T('gc.sun')) : '') + '</small>' +
      (e.link ? '<a href="' + e.link + '">' + esc(T('gc.open')) + '</a>' : '') + '</span>' + badge(e.date) + '</li>';
  }

  function form() {
    var st = NS.STATES.filter(function (s) { return s[0] !== '96'; }).map(function (s) { return '<option value="' + s[0] + '"' + (P.state === s[0] ? ' selected' : '') + '>' + s[0] + ' ' + esc(s[1]) + '</option>'; }).join('');
    function chk(k, l) { return '<label class="chk"><input type="checkbox" data-p="' + k + '"' + (P[k] ? ' checked' : '') + '> ' + esc(T(l)) + '</label>'; }
    return '<div class="gt-card gc-prof"><h2>' + esc(T('gc.prof')) + '</h2>' +
      '<label class="gt-lbl" for="gc-gst">' + esc(T('gc.gst')) + '</label><select id="gc-gst" data-p="gst">' +
      ['monthly', 'qrmp', 'comp', 'none'].map(function (v) { return '<option value="' + v + '"' + (P.gst === v ? ' selected' : '') + '>' + esc(T('gc.g.' + v)) + '</option>'; }).join('') + '</select>' +
      '<label class="gt-lbl" for="gc-st">' + esc(T('gc.state')) + '</label><select id="gc-st" data-p="state">' + st + '</select>' +
      '<div class="gc-chk">' + chk('tds', 'gc.c.tds') + chk('adv', 'gc.c.adv') + chk('annual', 'gc.c.annual') + chk('g7', 'gc.c.g7') + chk('g8', 'gc.c.g8') + '</div>' +
      (FROM && !P.own ? '<p class="note gc-from">' + esc(T('gc.frombiz', { b: FROM })) + '</p>' : '') +
      '<p class="note">' + esc(T('gc.saved')) + '</p></div>';
  }
  function render() {
    var now = new Date(); view = view || { y: now.getFullYear(), m: now.getMonth() };
    var up = upcoming(P, 30), month = dueIn(P, view.y, view.m);
    box.innerHTML = '<div class="gt-grid">' + form() +
      '<div class="gt-card"><h2>' + esc(T('gc.next')) + '</h2>' + (up.length ? '<ul class="gc-l">' + up.map(row).join('') + '</ul>' : '<p class="note">' + esc(T('gc.nothing')) + '</p>') +
      '<div class="row gt-acts"><button type="button" class="btn primary" data-gc="ics">' + esc(T('gc.ics')) + '</button><button type="button" class="btn" data-gc="notify">' + esc(T('gc.notify')) + '</button><button type="button" class="btn" data-gc="print">' + esc(T('gc.print')) + '</button></div>' +
      '<p class="soft" data-gc-msg aria-live="polite"></p></div></div>' +
      '<div class="gt-card"><div class="gc-mh"><button type="button" class="btn sm" data-gc="prev" aria-label="' + esc(T('gc.prev')) + '">‹</button><h2>' + esc(T('gc.month', { m: mname(view.y, view.m) })) + '</h2><button type="button" class="btn sm" data-gc="next" aria-label="' + esc(T('gc.nextm')) + '">›</button></div>' +
      (month.length ? '<ul class="gc-l">' + month.map(row).join('') + '</ul>' : '<p class="note">' + esc(T('gc.none')) + '</p>') +
      '<p class="note">' + esc(T('gc.hol')) + '</p></div>';
  }
  function save() {
    try { localStorage.setItem('ns-gstcal', JSON.stringify(P)); } catch (e) {}
    NSStore.meta('gstcal', P).catch(function () {});
  }

  /* ---------- reminders ---------- */
  function icsText() {
    var now = new Date(), ev = [], stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    for (var k = 0; k < 12; k++) ev = ev.concat(dueIn(P, now.getFullYear(), now.getMonth() + k));
    ev = ev.filter(function (e) { return e.date >= NS.today(); });
    function fold(s) { var o = '', l = s; while (l.length > 73) { o += l.slice(0, 73) + '\r\n '; l = l.slice(73); } return o + l; }
    function x(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nivesh Sahayak//GST Calendar//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:GST and TDS due dates'];
    ev.forEach(function (e) {
      var d = e.date.replace(/-/g, ''), nx = new Date(e.date + 'T00:00:00'); nx.setDate(nx.getDate() + 1);
      var d2 = ymd(nx.getFullYear(), nx.getMonth(), nx.getDate()).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', 'UID:' + e.code + '-' + d + '@gst-calendar.niveshsahayak.in', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + d2,
        fold('SUMMARY:' + x(EN_T[e.code] + ' (' + e.per + ')')),
        fold('DESCRIPTION:' + x('Due date for ' + e.per + '. ' + (e.link ? 'Work it out at ' + e.link + ' - ' : 'Check the date on the official portal.') + ' From https://gst-calendar.niveshsahayak.in/')),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + x(EN_T[e.code]), 'TRIGGER:-P2D', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return { text: lines.join('\r\n') + '\r\n', n: ev.length };
  }
  /* the calendar file is English like every printed document (a calendar shared with an accountant reads the same) */
  var EN_T = { gstr1: 'GSTR-1 (monthly)', gstr3b: 'GSTR-3B (monthly)', iff: 'IFF (optional, QRMP)', pmt06: 'PMT-06 tax payment (QRMP)', gstr1q: 'GSTR-1 (quarterly, QRMP)', gstr3bq: 'GSTR-3B (quarterly, QRMP)',
    cmp08: 'CMP-08 (composition)', gstr4: 'GSTR-4 annual return (composition)', gstr7: 'GSTR-7 (GST TDS)', gstr8: 'GSTR-8 (e-commerce TCS)', gstr9: 'GSTR-9 annual return (and GSTR-9C if it applies)',
    tdsdep: 'Deposit TDS/TCS', tdsdepmar: 'Deposit March TDS', tdsret: 'Quarterly TDS statement (check the date on TRACES)', adv: 'Advance tax instalment' };
  function notifyDue(ask) {
    var msg = $('[data-gc-msg]', box);
    if (!('Notification' in window)) { if (ask) msg.textContent = T('gc.nonote'); return; }
    var go = function () {
      if (Notification.permission !== 'granted') { if (ask) msg.textContent = T('gc.denied'); return; }
      var told = {}; try { told = JSON.parse(localStorage.getItem('ns-gstcal-told') || '{}'); } catch (e) {}
      var day = NS.today(), n = 0;
      upcoming(P, 3).forEach(function (e) {
        var k = e.code + e.date;
        if (told[k] === day) return;
        told[k] = day; n++;
        try { new Notification(e.title, { body: T('gc.due', { d: NS.fmtDate(e.date), p: e.per }), tag: k, icon: '/icons/icon-192.png' }); } catch (x) {}
      });
      try { localStorage.setItem('ns-gstcal-told', JSON.stringify(told)); localStorage.setItem('ns-gstcal-note', '1'); } catch (e) {}
      if (ask) msg.textContent = T('gc.noteon', { n: n });
    };
    if (ask && Notification.permission === 'default') Notification.requestPermission().then(go); else go();
  }

  function wire() {
    box.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-p'); if (!k) return;
      P[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k === 'gst' || k === 'state') P.own = 1;   /* chosen by hand: the saved business no longer fills these */
      save(); render();
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gc]'); if (!b) return;
      var a = b.getAttribute('data-gc');
      if (a === 'prev' || a === 'next') { var d = new Date(view.y, view.m + (a === 'next' ? 1 : -1), 1); view = { y: d.getFullYear(), m: d.getMonth() }; render(); }
      else if (a === 'ics') { var r = icsText(); NS.saveFile(new Blob([r.text], { type: 'text/calendar' }), 'gst-due-dates-' + NS.today() + '.ics'); $('[data-gc-msg]', box).textContent = T('gc.icsdone', { n: r.n }); }
      else if (a === 'notify') notifyDue(true);
      else if (a === 'print') window.print();
    });
  }
  function init() {
    box = $('#gc-tool'); if (!box) return;
    try { Object.assign(P, JSON.parse(localStorage.getItem('ns-gstcal') || '{}')); } catch (e) {}
    render(); wire();
    NSStore.ready().then(function () { return NSStore.meta('gstcal'); }).then(function (m) { if (m) { Object.assign(P, m); render(); } return Promise.all([NSStore.list('biz'), NSStore.meta('settings')]); }).then(function (x) {
      /* until the user picks the state or the GST filing by hand: the state and scheme of their default business (a suggestion
         they can change; QRMP is not kept with the business, so a regular business keeps monthly or QRMP as chosen here) */
      var bs = x[0] || [], cfg = x[1] || {};
      if (P.own || !bs.length) return;
      var b = bs.filter(function (y) { return y.id === cfg.defBiz; })[0] || bs[0];
      if (b.state) P.state = String(b.state).slice(0, 2);
      if (b.reg === 'comp') P.gst = 'comp'; else if (b.reg === 'unreg') P.gst = 'none'; else if (P.gst === 'comp' || P.gst === 'none') P.gst = 'monthly';
      FROM = b.name || '';
      render();
    }).catch(function () {});
    try { if (localStorage.getItem('ns-gstcal-note') && window.Notification && Notification.permission === 'granted') notifyDue(false); } catch (e) {}
    document.addEventListener('ns-lang', render);
  }
  NS.gstcal = { dueIn: dueIn, upcoming: upcoming };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
