/* Weekly usage report, the pure part (NSUsage): reads what the owner gets out of the Cloudflare Web Analytics dashboard (a CSV, a JSON, or a table
   pasted as text) and works out the week-on-week report. No network, no storage; scripts/test_usage.js checks it.
   There is NO free API that needs no login for this: the data comes from the owner's own dashboard or the owner's own API token, never from us.
   Rows: { date: 'YYYY-MM-DD' or '', host, path, visits, views }. Visits = a person's visit (Cloudflare counts a visit per referrer session),
   views = page views. A file with only one of them is used for both. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;

  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[,\s]/g, '').replace(/%$/, '')); return isFinite(n) ? n : 0; }
  function splitUrl(u) {
    u = String(u || '').trim();
    var m = /^(?:https?:)?\/\/([^\/?#]+)([^?#]*)/i.exec(u);
    if (m) return { host: m[1].toLowerCase().replace(/^www\./, ''), path: m[2] || '/' };
    return { host: '', path: u.split(/[?#]/)[0] || '/' };
  }
  function normPath(p) { p = String(p || '/').split(/[?#]/)[0]; if (p.charAt(0) !== '/') p = '/' + p; p = p.replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, ''); if (p.length > 1) p = p.replace(/\/+$/, ''); return p.toLowerCase(); }
  function isoDate(s) {
    s = String(s || '').trim(); var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);   /* dd/mm/yyyy (India) */
    return '';
  }
  /* find the first array of objects anywhere in a JSON value (Cloudflare's GraphQL answer nests it under data.viewer.accounts[0].<group>) */
  function findRows(x, depth) {
    if (depth > 8 || x == null) return null;
    if (Array.isArray(x)) { if (x.length && typeof x[0] === 'object' && x[0] && !Array.isArray(x[0])) { var deeper = findRows(x[0], depth + 1); return deeper || x; } for (var i = 0; i < x.length; i++) { var r = findRows(x[i], depth + 1); if (r) return r; } return null; }
    if (typeof x === 'object') for (var k in x) { var r2 = findRows(x[k], depth + 1); if (r2) return r2; }
    return null;
  }
  function flat(o, out, pre) {
    Object.keys(o).forEach(function (k) { var v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, out, pre + k + '.'); else out[(pre + k).toLowerCase()] = v; });
    return out;
  }
  function pick(o, res) { for (var i = 0; i < res.length; i++) for (var k in o) if (res[i].test(k)) return o[k]; return undefined; }
  var RE = {
    path: [/(^|\.)(requestpath|path|page|pagepath|url|route|uri)$/, /path|page|url/],
    host: [/(^|\.)(requesthost|host|hostname|domain|site)$/, /host|domain/],
    visits: [/visit/, /^sum\.visits$/],
    views: [/page.?views?|pageloads?|views/, /(^|\.)count$/, /requests?|hits/],
    date: [/(^|\.)(date|day|datetime|time|timestamp)$/, /date|day|time/]
  };
  function fromObject(o) {
    var f = flat(o, {}, '');
    var pa = pick(f, RE.path), ho = pick(f, RE.host), vi = pick(f, RE.visits), pv = pick(f, RE.views), da = pick(f, RE.date);
    if (pa == null && ho == null) return null;
    var u = splitUrl(pa), host = (ho != null && String(ho) ? String(ho).toLowerCase().replace(/^www\./, '') : u.host);
    var visits = vi != null ? num(vi) : null, views = pv != null ? num(pv) : null;
    if (visits == null && views == null) return null;
    return { date: isoDate(da), host: host, path: normPath(u.path), visits: visits == null ? views : visits, views: views == null ? visits : views };
  }
  function splitLine(l) {
    if (l.indexOf('\t') >= 0) return l.split('\t');
    var out = [], cur = '', q = false;
    for (var i = 0; i < l.length; i++) { var c = l.charAt(i); if (c === '"') q = !q; else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c; }
    out.push(cur);
    return out.length > 1 ? out : l.trim().split(/\s{2,}|\s+(?=[\d,.]+%?(?:\s|$))/);
  }
  /* text in, { rows, problems } out */
  function parse(text) {
    var t = String(text || '').replace(/^﻿/, '').trim(), rows = [], problems = [];
    if (!t) return { rows: [], problems: ['empty'] };
    if (t.charAt(0) === '{' || t.charAt(0) === '[') {
      try {
        var list = findRows(JSON.parse(t), 0) || [];
        list.forEach(function (o) { var r = fromObject(o); if (r) rows.push(r); });
        if (!rows.length) problems.push('The JSON has no rows with a page (or site) and a visits or views number.');
        return { rows: rows, problems: problems };
      } catch (e) { problems.push('The JSON could not be read: ' + e.message); return { rows: [], problems: problems }; }
    }
    var lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var head = splitLine(lines[0]).map(function (s) { return s.trim().replace(/^"|"$/g, ''); }), hasHead = head.some(function (h) { return /[a-z]{3}/i.test(h) && !/^\/|^https?:/i.test(h) && !/^[\d,.%\s]+$/.test(h); });
    var col = {};
    if (hasHead) {
      head.forEach(function (h, i) {
        var s = h.toLowerCase();
        ['path', 'host', 'visits', 'views', 'date'].forEach(function (k) { if (col[k] == null && RE[k].some(function (re) { return re.test(s); })) col[k] = i; });
      });
      /* "page views" also matches /page/ for the path: the path column is the one that is not a number column */
      if (col.path === col.views || col.path === col.visits) { col.path = null; head.forEach(function (h, i) { if (col.path == null && /^(path|page|url|request ?path|route)$/i.test(h.trim())) col.path = i; }); }
      lines = lines.slice(1);
    }
    lines.forEach(function (l, n) {
      var c = splitLine(l).map(function (s) { return s.trim().replace(/^"|"$/g, ''); });
      var pa, vi, pv, da = '', ho = '';
      if (hasHead && col.path != null) { pa = c[col.path]; vi = col.visits != null ? c[col.visits] : null; pv = col.views != null ? c[col.views] : null; da = col.date != null ? c[col.date] : ''; ho = col.host != null ? c[col.host] : ''; }
      else {   /* no heading: the first cell that looks like a path or address, then the numbers after it (visits, then views) */
        var pi = -1; c.forEach(function (x, i) { if (pi < 0 && (/^(https?:)?\/\//i.test(x) || x.charAt(0) === '/')) pi = i; });
        if (pi < 0) { problems.push('Line ' + (n + 1) + ' has no page address.'); return; }
        pa = c[pi]; var nums = c.slice(pi + 1).filter(function (x) { return /^[\d,.\s]+%?$/.test(x) && x; }); vi = nums[0]; pv = nums[1];
      }
      if (pa == null || pa === '') return;
      var u = splitUrl(pa), host = (ho || u.host).toLowerCase().replace(/^www\./, '');
      var visits = vi != null && vi !== '' ? num(vi) : null, views = pv != null && pv !== '' ? num(pv) : null;
      if (visits == null && views == null) { problems.push('Line ' + (n + 1) + ' has no number.'); return; }
      rows.push({ date: isoDate(da), host: host, path: normPath(u.path), visits: visits == null ? views : visits, views: views == null ? visits : views });
    });
    if (!rows.length && !problems.length) problems.push('No rows found. Each line needs a page address and a number.');
    return { rows: rows, problems: problems.slice(0, 5) };
  }

  /* the part of the address before the first dot is the site: billing.niveshsahayak.in -> billing; the bare domain is "www" */
  function siteOf(host) {
    host = String(host || '').toLowerCase();
    if (!host) return '(unknown)';
    var m = /^([a-z0-9-]+)\.niveshsahayak\.in$/.exec(host);
    return m ? m[1] : /^niveshsahayak\.in$/.test(host) ? 'www' : host;
  }
  function addDays(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  /* one file that spans two weeks or more: this = the 7 days ending on the newest date, last = the 7 days before */
  function splitWeeks(rows) {
    var dated = rows.filter(function (r) { return r.date; });
    if (!dated.length) return null;
    var max = dated.reduce(function (a, r) { return r.date > a ? r.date : a; }, ''), cutThis = addDays(max, -6), cutLast = addDays(max, -13);
    var cur = [], prev = [], older = 0;
    dated.forEach(function (r) { if (r.date >= cutThis) cur.push(r); else if (r.date >= cutLast) prev.push(r); else older++; });
    return { cur: cur, prev: prev, end: max, start: cutThis, older: older, undated: rows.length - dated.length };
  }
  function agg(rows) {
    var m = {}, tv = 0, tw = 0;
    rows.forEach(function (r) {
      var k = r.host + '|' + r.path, o = m[k] || (m[k] = { key: k, host: r.host, site: siteOf(r.host), path: r.path, visits: 0, views: 0 });
      o.visits += r.visits; o.views += r.views; tv += r.visits; tw += r.views;
    });
    return { map: m, list: Object.keys(m).map(function (k) { return m[k]; }), visits: tv, views: tw };
  }
  function pct(a, b) { return b > 0 ? Math.round((a - b) / b * 1000) / 10 : null; }
  var MINV = 20;   /* a page needs this many visits in the bigger week before a change counts */
  function report(cur, prev, o) {
    o = o || {}; var minv = o.min || MINV;
    var C = agg(cur), P = agg(prev), sites = {};
    C.list.forEach(function (x) { var s = sites[x.site] || (sites[x.site] = { site: x.site, visits: 0, views: 0, pvisits: 0, pviews: 0 }); s.visits += x.visits; s.views += x.views; });
    P.list.forEach(function (x) { var s = sites[x.site] || (sites[x.site] = { site: x.site, visits: 0, views: 0, pvisits: 0, pviews: 0 }); s.pvisits += x.visits; s.pviews += x.views; });
    var siteList = Object.keys(sites).map(function (k) { var s = sites[k]; s.change = pct(s.visits, s.pvisits); return s; }).sort(function (a, b) { return b.visits - a.visits; });
    var rows = {};
    C.list.concat(P.list).forEach(function (x) { rows[x.key] = rows[x.key] || { key: x.key, host: x.host, site: x.site, path: x.path }; });
    var all = Object.keys(rows).map(function (k) {
      var r = rows[k], c = C.map[k] || { visits: 0, views: 0 }, p = P.map[k] || { visits: 0, views: 0 };
      r.visits = c.visits; r.views = c.views; r.pvisits = p.visits; r.pviews = p.views; r.change = pct(c.visits, p.visits); r.perVisit = c.visits ? Math.round(c.views / c.visits * 100) / 100 : 0; return r;
    });
    var top = all.filter(function (r) { return r.visits > 0; }).sort(function (a, b) { return b.visits - a.visits; });
    var enough = function (r) { return Math.max(r.visits, r.pvisits) >= minv; };
    var fell = all.filter(function (r) { return enough(r) && r.pvisits > 0 && r.visits < r.pvisits; }).sort(function (a, b) { return (a.visits - a.pvisits) - (b.visits - b.pvisits); });
    var rose = all.filter(function (r) { return enough(r) && r.visits > r.pvisits; }).sort(function (a, b) { return (b.visits - b.pvisits) - (a.visits - a.pvisits); });
    var gone = all.filter(function (r) { return r.pvisits >= minv && r.visits === 0; });
    /* "came, looked once, left": many visits but about one page view per visit. It cannot say why; it says where to look. */
    var once = top.filter(function (r) { return r.visits >= minv && r.perVisit <= 1.1; });
    var depth = C.visits ? Math.round(C.views / C.visits * 100) / 100 : 0;
    return { visits: C.visits, views: C.views, pvisits: P.visits, pviews: P.views, change: pct(C.visits, P.visits), viewsChange: pct(C.views, P.views), depth: depth,
      sites: siteList, top: top.slice(0, 15), fell: fell.slice(0, 10), rose: rose.slice(0, 10), gone: gone.slice(0, 10), once: once.slice(0, 10), pages: all.length, min: minv, noPrev: !P.list.length };
  }
  /* the weekly totals the page keeps to draw a trend: add/replace the week that ends on `end` */
  function addHistory(h, end, rep) {
    h = (h || []).filter(function (x) { return x.end !== end; });
    h.push({ end: end, visits: rep.visits, views: rep.views }); h.sort(function (a, b) { return a.end < b.end ? -1 : 1; });
    return h.slice(-26);
  }
  root.NSUsage = { parse: parse, report: report, splitWeeks: splitWeeks, siteOf: siteOf, addHistory: addHistory, pct: pct, normPath: normPath, addDays: addDays };
})();
