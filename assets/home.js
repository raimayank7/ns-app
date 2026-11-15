/* The owner's day in the Nivesh Sahayak App (after app.js; the figures come from homecore.js, node scripts/test_home.js).
     #day            what needs me today (bills to chase and pay, cheques, low stock, repeating bills, GST and TDS dates, yesterday's sales)
     #day/month      the guided month-end checklist, ticks kept per business and month in the data home (meta 'monthend')
     #day/health     business health score with every figure explained
     #day/remind     reminders: what works offline and what a browser cannot do when it is closed
     #tools          the front door: every Nivesh Sahayak site grouped by the job it does (all site addresses keep working)
   The dashboard gets one card. Other features add lines to "today" with NSHome.addSource(function (ctx) { return [line, ...]; })
   (PF/ESI dates, student fees, hotel or rent dues): a line is { id, group, sev 0|1|2, text (ready words) or k + v, href, amt, date }.
   Words: NS.t('hm.<key>'). Nothing here is sent anywhere; there is no server. */
(function () {
  'use strict';
  var A = window.NSApp, H = window.NSHome; if (!A || !H) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, money = NS.money;
  function t(k, v) { return NS.t('hm.' + k, v); }
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var STATE = null;   /* month-end ticks: meta 'monthend', read once and kept */
  var TABS = ['today', 'month', 'health', 'remind'];

  function bizId() { var b = A.biz(); return b ? (b.id || A.B.key(b.name)) : ''; }
  /* the records and settings every figure is worked out from */
  function ctx() {
    var C = A.data(), today = NS.today(), cd = {};
    C.party.forEach(function (p) { if (+p.cdays > 0) cd[A.B.key(p.name)] = +p.cdays; });
    var c = { docs: C.doc, biz: A.bizName(), today: today, cdays: cd, low: [], neg: 0, recurring: 0, dates: [] };
    try {   /* stock the owner tracks, at or below the level set on the item */
      if (window.NSStock && NSStock.summary) { var s = NSStock.summary(C.doc, C.item || [], c.biz, '', today); c.low = s.items.filter(function (x) { return x.low; }).map(function (x) { return x.name; }); c.neg = s.neg || 0; }
    } catch (e) {}
    try { if (NS.recurringDue) c.recurring = NS.recurringDue(A.mine(), today).length; } catch (e) {}
    try { c.dates = gstDates(); } catch (e) {}
    return c;
  }
  /* GST and TDS dates for this business, by the same rules as gst-calendar (gstcal.js): the profile saved there wins */
  var GP = null;
  function gstDates() {
    if (!NS.gstcal || !NS.gstcal.upcoming) return [];
    var b = A.biz() || {}, p = Object.assign({ gst: 'monthly', state: '03', tds: false, adv: false, annual: true, g7: false, g8: false }, GP && GP.own ? GP : {});
    if (!(GP && GP.own)) { if (b.state) p.state = String(b.state).slice(0, 2); p.gst = b.reg === 'comp' ? 'comp' : b.reg === 'unreg' ? 'none' : (GP && GP.gst) || 'monthly'; }
    return NS.gstcal.upcoming(p, 10);
  }
  function lineText(x) {
    if (x.text) return x.text;
    var v = Object.assign({}, x.v);
    ['a', 't'].forEach(function (k) { if (typeof v[k] === 'number') v[k] = money(v[k]); });
    if (v.d) v.d = NS.fmtDate(v.d);
    return t('l.' + x.k, v);
  }
  function lineHtml(x) {
    var href = x.href || '#day', cls = 'hm-l s' + x.sev;
    return '<li class="' + cls + '"><a href="' + esc(href) + '"><span class="hm-dot" aria-hidden="true"></span><span>' + esc(lineText(x)) + '</span></a></li>';
  }
  var GROUPS = ['money', 'tax', 'stock', 'sales', 'people', 'other'];

  /* ---------- today ---------- */
  function todayHtml() {
    var c = ctx(), list = H.todayList(c), n = list.filter(function (x) { return x.sev <= 1; }).length;
    var body = list.length ? GROUPS.map(function (g) {
      var xs = list.filter(function (x) { return (GROUPS.indexOf(x.group) >= 0 ? x.group : 'other') === g; });
      return xs.length ? '<div class="card hm-card"><h3>' + esc(t('g.' + g)) + '</h3><ul class="hm-list">' + xs.map(lineHtml).join('') + '</ul></div>' : '';
    }).join('') : '<div class="card"><p>' + esc(t('quiet')) + '</p></div>';
    return '<p class="hm-sum">' + esc(n ? t('sum', { n: n }) : t('sum0')) + '</p>' + body + '<p class="soft">' + esc(t('today.note')) + '</p>';
  }

  /* ---------- month-end checklist ---------- */
  var monthSel = '';
  function monthName(ym) { try { return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { month: 'long', year: 'numeric' }).format(new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1)); } catch (e) { return ym; } }
  function monthHtml() {
    var c = ctx(), id = bizId(), ym = monthSel || H.monthDefault(c.today), tk = H.ticked(STATE, id, ym), pr = H.progress(STATE, id, ym), hint = H.monthHints(c, ym);
    var opts = ''; for (var i = 1; i <= 12; i++) { var m = H.addMonth(c.today.slice(0, 7), 1 - i); opts += '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>' + esc(monthName(m)) + '</option>'; }
    function hintOf(s) {
      var h = hint[s]; if (s === 'sales') return h.n ? t('mh.sales', { n: h.n, a: money(h.a) }) : t('mh.none');
      if (s === 'buy') return h.n ? t('mh.buy', { n: h.n, a: money(h.a) }) : t('mh.none');
      if (s === 'chase') return h.n ? t('mh.chase', { n: h.n, a: money(h.a) }) : t('mh.chase0');
      if (s === 'cheq') return h.n ? t('mh.cheq', { n: h.n }) : '';
      if (s === 'stock') return hint.stock.low || hint.stock.neg ? t('mh.stock', { l: hint.stock.low, n: hint.stock.neg }) : '';
      if (s === 'cash') return t('mh.cash', { c: money(hint.cash.cash), b: money(hint.cash.bank) });
      if (s === 'gst') return t('mh.gst');
      return '';
    }
    return '<div class="card"><div class="hm-mh"><label>' + esc(t('month')) + ' <select data-hm-month>' + opts + '</select></label><b>' + esc(t('prog', { d: pr.done, n: pr.of })) + '</b></div>' +
      '<div class="hm-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + pr.of + '" aria-valuenow="' + pr.done + '"><i style="width:' + Math.round(pr.done / pr.of * 100) + '%"></i></div>' +
      '<ol class="hm-steps">' + H.MONTHEND.map(function (s) {
        var on = !!tk[s[0]], h = hintOf(s[0]);
        return '<li><label class="chk"><input type="checkbox" data-hm-tick="' + s[0] + '"' + (on ? ' checked' : '') + '> <b>' + esc(t(s[1])) + '</b></label><span class="soft">' + esc(t(s[1] + 'p')) + (h ? ' · ' + esc(h) : '') + '</span>' +
          '<a class="btn sm" href="' + esc(s[2]) + '">' + esc(t('open')) + '</a></li>';
      }).join('') + '</ol></div><p class="soft">' + esc(t('me.note')) + '</p>';
  }

  /* ---------- health ---------- */
  function healthHtml() {
    var c = ctx(), h = H.health(c);
    if (!h.ok) return '<div class="card"><p>' + esc(t('h.need', { n: h.have })) + '</p></div>';
    var P = {}; h.parts.forEach(function (p) { P[p.id] = p; });
    function fx(p) {
      var f = p.facts;
      if (p.id === 'cash') return f.cover == null ? '' : t('h.cash.how', { c: money(f.cash), b: money(f.burn), m: f.cover });
      if (p.id === 'recv') return f.days == null ? '' : t('h.recv.how', { r: money(f.recv), d: money(f.perDay), n: f.days });
      if (p.id === 'margin') return f.now == null ? '' : f.before == null ? t('h.margin.how1', { p: f.now }) : t('h.margin.how', { p: f.now, q: f.before });
      return f.up == null ? '' : t('h.creep.how', { l: money(f.last), a: money(f.avg), p: f.up });
    }
    return '<div class="card hm-score ' + h.band + '"><div class="hm-big" aria-label="' + esc(t('h.score')) + '"><b>' + h.score + '</b><span>/100</span></div><div><h3>' + esc(t('h.' + h.band)) + '</h3><p>' + esc(t('h.lead', { n: h.months })) + '</p></div></div>' +
      h.parts.map(function (p) {
        return '<div class="card hm-part"><div class="hm-ph"><h3>' + esc(t('h.' + p.id)) + '</h3>' + (p.score == null ? '<span class="pill">' + esc(t('h.na')) + '</span>' : '<span class="pill ' + (p.band === 'good' ? 'ok' : p.band === 'low' ? 'bad' : 'warn') + '">' + p.score + '/100</span>') + '</div>' +
          (p.score == null ? '<p class="soft">' + esc(t('h.nodata')) + '</p>' : '<p>' + esc(fx(p)) + '</p><p><b>' + esc(t('h.advice')) + '</b> ' + esc(t('h.' + p.id + '.' + p.band)) + '</p>') +
          '<details><summary>' + esc(t('h.how')) + '</summary><p class="soft">' + esc(t('h.' + p.id + '.rule')) + '</p></details></div>';
      }).join('') + '<p class="soft">' + esc(t('h.note')) + '</p>';
  }

  /* ---------- reminders ---------- */
  function noteOn() { return LS.get('ns-home-note') === '1' && window.Notification && Notification.permission === 'granted'; }
  function remindHtml() {
    var supported = 'Notification' in window, perm = supported ? Notification.permission : 'none';
    return '<div class="card"><h3>' + esc(t('rm.t')) + '</h3><p>' + esc(t('rm.p')) + '</p>' +
      '<p><label class="chk"><input type="checkbox" data-hm-note' + (noteOn() ? ' checked' : '') + (supported ? '' : ' disabled') + '> ' + esc(t('rm.on')) + '</label></p>' +
      '<p class="soft" data-hm-msg aria-live="polite">' + esc(!supported ? t('rm.nosupport') : perm === 'denied' ? t('rm.denied') : '') + '</p></div>' +
      '<div class="card"><h3>' + esc(t('rm.ics')) + '</h3><p>' + esc(t('rm.icsp')) + '</p><p><button type="button" class="btn primary" data-hm-ics>' + esc(t('rm.icsgo')) + '</button></p></div>' +
      '<div class="card hm-limit"><h3>' + esc(t('rm.lim')) + '</h3><ul><li>' + esc(t('rm.l1')) + '</li><li>' + esc(t('rm.l2')) + '</li><li>' + esc(t('rm.l3')) + '</li><li>' + esc(t('rm.l4')) + '</li></ul></div>';
  }
  function told() { var o = {}; try { o = JSON.parse(LS.get('ns-home-told') || '{}'); } catch (e) {} return o; }
  function notifyOpen() {
    if (!noteOn()) return;
    var c = ctx(), list = H.todayList(c), tl = told(), tag = NS.today(), seen = Object.keys(tl).filter(function (k) { return tl[k] === tag; }).length, pick = H.remind(list, tl, c.today, Math.max(0, 3 - seen));   /* three a day at most, however often the App is opened */
    pick.forEach(function (x) { tl[x.id] = tag; try { new Notification(t('rm.title', { b: A.bizName() }), { body: lineText(x), tag: x.id, icon: '/icons/icon-192.png' }); } catch (e) {} });
    if (pick.length) LS.set('ns-home-told', JSON.stringify(tl));
  }
  /* the number on the installed App's icon: how many things need me now (where the phone allows it) */
  function badge() {
    try {
      var n = H.todayList(ctx()).filter(function (x) { return x.sev <= 0; }).length;
      if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); }
    } catch (e) {}
  }
  function icsGo(pane) {
    var c = ctx(), until = H.addDays(c.today, 60), rows = H.dueEntries(c.docs, c.biz, c.today, until, c.cdays, { recv: t('rm.recv'), pay: t('rm.pay') });
    (c.dates || []).forEach(function (e) { rows.push({ date: e.date, title: e.title + ' (' + e.per + ')' }); });
    var msg = $('[data-hm-msg]', pane);
    if (!rows.length) { if (msg) msg.textContent = t('rm.icsnone'); return; }
    rows.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var text = H.ics(rows, new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''));
    NS.saveFile(new Blob([text], { type: 'text/calendar' }), 'nivesh-sahayak-dues-' + c.today + '.ics');
    if (msg) msg.textContent = t('rm.icsdone', { n: rows.length });
  }

  /* ---------- the day screen (tabs) ---------- */
  function dayHtml(arg) {
    var tab = TABS.indexOf(arg) >= 0 ? arg : 'today';
    var body = { today: todayHtml, month: monthHtml, health: healthHtml, remind: remindHtml }[tab]();
    return '<div class="pane-hd"><h2>' + esc(t('t')) + ' <small class="soft">' + esc(A.bizName()) + '</small></h2></div>' +
      '<div class="hm-tabs" role="tablist">' + TABS.map(function (x) { return '<a role="tab" href="#day' + (x === 'today' ? '' : '/' + x) + '" aria-selected="' + (x === tab) + '">' + esc(t('tab.' + x)) + '</a>'; }).join('') + '</div>' + body;
  }
  function dayWire(pane, arg) {
    var m = $('[data-hm-month]', pane);
    if (m) m.addEventListener('change', function () { monthSel = m.value; A.show(); });
    $$('[data-hm-tick]', pane).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var ym = monthSel || H.monthDefault(NS.today());
        STATE = H.tick(STATE, bizId(), ym, cb.getAttribute('data-hm-tick'), cb.checked, Date.now());
        NSStore.meta('monthend', STATE).then(function () { A.show(); }, function (e) { NS.toast(NS.t('nosave', { e: e.message }), 'bad'); });
      });
    });
    var nb = $('[data-hm-note]', pane);
    if (nb) nb.addEventListener('change', function () {
      var msg = $('[data-hm-msg]', pane);
      if (!nb.checked) { LS.set('ns-home-note', '0'); msg.textContent = t('rm.off'); return; }
      Notification.requestPermission().then(function (p) {
        if (p !== 'granted') { nb.checked = false; msg.textContent = t('rm.denied'); return; }
        LS.set('ns-home-note', '1'); msg.textContent = t('rm.set'); notifyOpen();
      });
    });
    var ib = $('[data-hm-ics]', pane); if (ib) ib.addEventListener('click', function () { icsGo(pane); });
  }
  A.addSection('day', function (arg) { return dayHtml(arg); }, dayWire);

  /* ---------- the front door ---------- */
  function siteName(s) {
    var x = (window.NS_CFG && NS_CFG.inapp || {})[s], k = x && x[3], v = k ? NS.t(k) : '';
    if (v && v !== k) return v;
    var n = NS.t('nav.' + s); if (n !== 'nav.' + s) return n;
    return s.replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
  }
  function toolsHtml() {
    var inapp = (window.NS_CFG && NS_CFG.inapp) || {}, sites = Object.keys(inapp), jobs = H.jobsFor(sites);
    return '<div class="pane-hd"><h2>' + esc(t('tools.t')) + '</h2></div><p class="soft">' + esc(t('tools.p')) + '</p>' +
      '<p><input type="search" class="hm-find" data-hm-find placeholder="' + esc(t('tools.find')) + '" aria-label="' + esc(t('tools.find')) + '"></p>' +
      jobs.map(function (j) {
        return '<div class="card hm-job" data-hm-job><h3>' + esc(t('job.' + j.id)) + '</h3><p class="soft">' + esc(t('job.' + j.id + 'p')) + '</p><div class="hm-sites">' + j.sites.map(function (s) {
          var nm = siteName(s); return '<a class="btn sm" href="' + esc(A.siteHome(s)) + '" data-hm-site data-n="' + esc(nm.toLowerCase()) + '">' + esc(nm) + '</a>';
        }).join('') + '</div></div>';
      }).join('');
  }
  function toolsWire(pane) {
    var f = $('[data-hm-find]', pane); if (!f) return;
    f.addEventListener('input', function () {
      var q = f.value.trim().toLowerCase();
      $$('[data-hm-site]', pane).forEach(function (a) { a.hidden = !!q && a.getAttribute('data-n').indexOf(q) < 0; });
      $$('[data-hm-job]', pane).forEach(function (j) { j.hidden = !$$('[data-hm-site]:not([hidden])', j).length; });
    });
  }
  A.addSection('tools', toolsHtml, toolsWire);

  /* ---------- dashboard card ---------- */
  A.addHome(function () {
    var c = ctx(), list = H.todayList(c).filter(function (x) { return x.sev <= 1; }), h = null;
    try { h = H.health(c); } catch (e) {}
    return '<div class="card hm-home"><h3>' + esc(t('t')) + '</h3>' +
      (list.length ? '<ul class="hm-list">' + list.slice(0, 4).map(lineHtml).join('') + '</ul>' : '<p class="soft">' + esc(t('quiet')) + '</p>') +
      '<p class="quick"><a class="btn primary" href="#day">' + esc(list.length > 4 ? t('seeall', { n: list.length }) : t('see')) + '</a>' +
      '<a class="btn" href="#day/month">' + esc(t('tab.month')) + '</a>' +
      (h && h.ok ? '<a class="btn" href="#day/health">' + esc(t('h.chip', { n: h.score })) + '</a>' : '') +
      '<a class="btn" href="#tools">' + esc(t('tools.t')) + '</a></p></div>';
  });

  /* ---------- start ---------- */
  NSStore.ready().then(function () { return Promise.all([NSStore.meta('monthend'), NSStore.meta('gstcal')]); }).then(function (r) {
    STATE = r[0] || {}; GP = r[1] || null;
    A.whenReady(function () { try { notifyOpen(); badge(); } catch (e) {} });
  }).catch(function () { STATE = STATE || {}; });
  document.addEventListener('ns-data', function () { try { badge(); } catch (e) {} });
  window.NSHomeUI = { ctx: ctx, lineText: lineText };
})();
