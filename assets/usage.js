/* Weekly usage report screen (my.niveshsahayak.in/usage/, owner only, noindex). Reads what the owner pastes or loads, shows engine/usagecore.js's report.
   Nothing leaves the browser. The weekly totals are kept in the data home (meta 'usageHistory') so the trend grows by itself.
   The screen is English only on purpose: it is the owner's own page, not part of the 23-language tools. */
(function () {
  'use strict';
  var root = document.getElementById('usage-app'), U = window.NSUsage;
  if (!root || !U) return;
  var $ = function (s) { return root.querySelector(s); }, esc = NS.esc;
  var A = $('#ua-a'), B = $('#ua-b'), out = $('#ua-out'), msg = $('#ua-msg');
  function say(t, bad) { msg.textContent = t || ''; msg.hidden = !t; msg.className = 'note' + (bad ? ' bad' : ''); }
  function load(input, area) {
    input.addEventListener('change', function () {
      var f = input.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { area.value = String(r.result || ''); }; r.onerror = function () { say('That file could not be read.', true); }; r.readAsText(f);
    });
  }
  load($('#ua-af'), A); load($('#ua-bf'), B);
  function num(n) { return Math.round(n).toLocaleString('en-IN'); }
  function chg(c) { return c == null ? '<span class="soft">new</span>' : '<b class="' + (c < 0 ? 'neg' : 'pos') + '">' + (c > 0 ? '+' : '') + c + '%</b>'; }
  function pg(r) { return esc(r.site) + ' <span class="soft">' + esc(r.path) + '</span>'; }
  function table(head, rows) {
    return rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' class="n"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '';
  }
  function tr(cells) { return '<tr>' + cells.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }
  function sentence(R, span) {
    var s = 'This week ' + num(R.visits) + ' visits and ' + num(R.views) + ' page views' + (span ? ' (' + span + ')' : '') + '. ';
    if (R.noPrev) return s + 'There is no earlier week to compare with, so only the top pages are shown.';
    s += 'Last week ' + num(R.pvisits) + ' visits' + (R.change == null ? '' : ': ' + (R.change >= 0 ? 'up ' : 'down ') + Math.abs(R.change) + '%') + '. ';
    s += 'A visit looked at ' + R.depth + ' pages on average. ';
    if (R.sites.length) s += 'Busiest site: ' + R.sites[0].site + ' (' + num(R.sites[0].visits) + ' visits). ';
    if (R.fell[0]) s += 'Biggest fall: ' + R.fell[0].site + ' ' + R.fell[0].path + ' (' + num(R.fell[0].pvisits) + ' to ' + num(R.fell[0].visits) + '). ';
    if (R.rose[0]) s += 'Biggest rise: ' + R.rose[0].site + ' ' + R.rose[0].path + ' (' + num(R.rose[0].pvisits) + ' to ' + num(R.rose[0].visits) + ').';
    return s;
  }
  function render(R, span, hist) {
    var h = '<div class="card"><h2>The week in a few lines</h2><p>' + esc(sentence(R, span)) + '</p></div>';
    h += '<div class="tiles"><div class="tile"><span>Visits</span><b>' + num(R.visits) + '</b><small>' + (R.noPrev ? '' : chg(R.change) + ' vs last week') + '</small></div>' +
      '<div class="tile"><span>Page views</span><b>' + num(R.views) + '</b><small>' + (R.noPrev ? '' : chg(R.viewsChange) + ' vs last week') + '</small></div>' +
      '<div class="tile"><span>Pages per visit</span><b>' + R.depth + '</b></div><div class="tile"><span>Pages seen</span><b>' + R.pages + '</b></div></div>';
    h += '<div class="card"><h2>Sites</h2>' + table(['Site', 'Visits', 'Last week', 'Change'], R.sites.map(function (s) { return tr([esc(s.site), num(s.visits), num(s.pvisits), chg(s.change)]); })) + '</div>';
    h += '<div class="card"><h2>Top pages and tools</h2>' + table(['Page', 'Visits', 'Views', 'Last week', 'Change'], R.top.map(function (r) { return tr([pg(r), num(r.visits), num(r.views), num(r.pvisits), chg(r.change)]); })) + '</div>';
    if (!R.noPrev) {
      h += '<div class="card"><h2>Fell most</h2>' + (R.fell.length ? table(['Page', 'This week', 'Last week', 'Change'], R.fell.map(function (r) { return tr([pg(r), num(r.visits), num(r.pvisits), chg(r.change)]); })) : '<p class="soft">Nothing fell with at least ' + R.min + ' visits.</p>') +
        (R.gone.length ? '<h3>Gone this week</h3>' + table(['Page', 'Last week'], R.gone.map(function (r) { return tr([pg(r), num(r.pvisits)]); })) : '') + '</div>';
      h += '<div class="card"><h2>Rose most</h2>' + (R.rose.length ? table(['Page', 'This week', 'Last week', 'Change'], R.rose.map(function (r) { return tr([pg(r), num(r.visits), num(r.pvisits), chg(r.change)]); })) : '<p class="soft">Nothing rose with at least ' + R.min + ' visits.</p>') + '</div>';
    }
    h += '<div class="card"><h2>Looked once and left</h2><p class="soft">Pages with at least ' + R.min + ' visits and about one page view per visit. Check each: a finished calculator is fine; a home page that nobody goes past needs a clearer next step.</p>' +
      (R.once.length ? table(['Page', 'Visits', 'Views per visit'], R.once.map(function (r) { return tr([pg(r), num(r.visits), r.perVisit]); })) : '<p class="soft">None.</p>') + '</div>';
    if (hist && hist.length > 1) h += '<div class="card"><h2>Weekly totals kept so far</h2>' + table(['Week ending', 'Visits', 'Page views'], hist.slice().reverse().map(function (x) { return tr([esc(x.end), num(x.visits), num(x.views)]); })) + '</div>';
    out.innerHTML = h;
    $('#ua-print').hidden = false;
  }
  function go() {
    say(''); out.innerHTML = '';
    var pa = U.parse(A.value), pb = B.value.trim() ? U.parse(B.value) : null, cur, prev, span = '', end = $('#ua-end').value, notes = [];
    if (!pa.rows.length) { say(pa.problems[0] || 'Box A has no rows.', true); return; }
    if (pb) {
      if (!pb.rows.length) { say('Box B: ' + (pb.problems[0] || 'no rows.'), true); return; }
      cur = pa.rows; prev = pb.rows;
    } else {
      var w = U.splitWeeks(pa.rows);
      if (w) {
        cur = w.cur; prev = w.prev; end = end || w.end; span = w.start + ' to ' + w.end;
        if (w.undated) notes.push(w.undated + ' lines without a date were left out.');
        if (w.older) notes.push(w.older + ' lines older than two weeks were left out.');
        if (!prev.length) notes.push('The file holds only one week, so there is nothing to compare with.');
      } else { cur = pa.rows; prev = []; notes.push('Box B is empty and box A has no dates: showing only this week.'); }
    }
    pa.problems.concat(pb ? pb.problems : []).forEach(function (p) { notes.push(p); });
    var R = U.report(cur, prev, { min: Math.max(1, +$('#ua-min').value || 20) });
    NSStore.ready().then(function () { return NSStore.meta('usageHistory'); }).then(function (h) { return Array.isArray(h) ? h : []; }, function () { return []; }).then(function (h) {
      if (end) { h = U.addHistory(h, end, R); NSStore.meta('usageHistory', h).catch(function () {}); }
      render(R, span, h);
      if (notes.length) say(notes.join(' '));
    });
  }
  $('#ua-go').addEventListener('click', go);
  $('#ua-clear').addEventListener('click', function () { A.value = ''; B.value = ''; out.innerHTML = ''; say(''); $('#ua-print').hidden = true; });
  $('#ua-print').addEventListener('click', function () { window.print(); });
})();
