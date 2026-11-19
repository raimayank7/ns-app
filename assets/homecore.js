/* NSHome: the owner's day, worked out from the saved records (pure functions, no screen; node scripts/test_home.js).
   1  todayList   "what needs me today": bills to chase, bills to pay, cheques, low stock, repeating bills, GST/TDS dates,
                  yesterday's sales; other files add lines through addSource (PF/ESI dates, student fees, rent, hotel dues ...)
   2  MONTHEND    the guided month-end steps, hints worked out from the records, ticks kept per business and month
   3  health      business health score: cash cover, receivable days, margin trend, expense creep (every figure kept in `facts`)
   4  remind      what to tell the user when the App opens, and a calendar (.ics) file for the phone's own alarms
   Every line is { id, group, sev (0 now, 1 soon, 2 for information), k (text key), v (values), href, amt, date }.
   Words: NS.t('hm.' + k, v) (English in i18n.js, other languages in engine/lang). Nothing leaves the device. */
(function (G) {
  'use strict';
  var B = (typeof require === 'function' && typeof module !== 'undefined') ? require('./books.js') : G.NSBooks;
  var num = B.num, r2 = B.r2, key = B.key;
  var SOURCES = [];   /* addSource(fn(ctx) -> lines): hooks for features that may not be in this build yet */

  function addDays(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function gap(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5); }
  function monthOf(iso) { return String(iso || '').slice(0, 7); }
  function addMonth(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + String(m + 1).padStart(2, '0'); }
  function monthEnd(ym) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)); return d.toISOString().slice(0, 10); }
  function mine(docs, biz) { var b = key(biz); return (docs || []).filter(function (d) { return key(d.seller && d.seller.name) === b; }); }

  /* ---------- 1. today ---------- */
  function line(group, sev, k, v, href, amt, date, id) { return { id: id || group + ':' + k + ':' + (v && v.p || '') + (date || ''), group: group, sev: sev, k: k, v: v || {}, href: href || '', amt: amt || 0, date: date || '' }; }

  function dueOfBill(b, cdays) { return b.due || (cdays && cdays[key(b.party)] ? addDays(b.date, num(cdays[key(b.party)])) : ''); }

  function todayList(ctx) {
    var today = ctx.today, out = [], D = ctx.docs || [], biz = ctx.biz, bl = B.bills(D, biz).bills, cd = ctx.cdays || {};
    /* money to collect: past its due date (credit days where the party has them, else 30 days after the bill) */
    var over = bl.filter(function (b) { return b.side === 'recv'; }).map(function (b) {
      var due = dueOfBill(b, cd) || addDays(b.date, 30); return { b: b, due: due, late: gap(due, today) };
    }).filter(function (x) { return x.late > 0; }).sort(function (a, c) { return c.late - a.late; });
    if (over.length) {
      var tot = r2(over.reduce(function (a, x) { return a + x.b.left; }, 0));
      out.push(line('money', over.some(function (x) { return x.late > 30; }) ? 0 : 1, 'chase', { n: over.length, a: tot }, '#dues', tot));
      over.slice(0, 3).forEach(function (x) { var l = line('money', 2, 'chase1', { p: x.b.party, a: x.b.left, n: x.late }, '#st/' + encodeURIComponent(key(x.b.party)), x.b.left, x.due, 'chase1:' + x.b.id); l.dot = x.late > 30 ? 0 : 1; out.push(l); });
    }
    /* bills we have to pay: overdue or due within 7 days (only when the bill carries a due date or the party's credit days) */
    var pay = bl.filter(function (b) { return b.side === 'pay'; }).map(function (b) { var due = dueOfBill(b, cd); return due ? { b: b, due: due, left: gap(today, due) } : null; })
      .filter(function (x) { return x && x.left <= 7; }).sort(function (a, c) { return a.left - c.left; });
    if (pay.length) {
      var pt = r2(pay.reduce(function (a, x) { return a + x.b.left; }, 0));
      out.push(line('money', pay.some(function (x) { return x.left < 0; }) ? 0 : 1, 'pay', { n: pay.length, a: pt }, '#dues/pay', pt));
    }
    /* cheques */
    D.forEach(function (d) {
      if (d.mode !== 'cheque' || !d.chq || !d.amount) return;
      var c = d.chq, who = (d.buyer && d.buyer.name) || '', ok = key(d.seller && d.seller.name) === key(biz);
      if (!ok) return;
      if (c.st === 'hand' && (!c.date || c.date <= today)) out.push(line('money', c.date && gap(c.date, today) > 60 ? 0 : 1, 'chqin', { p: who, a: num(d.amount), no: d.no || '' }, '#cash/bank', num(d.amount), c.date, 'chqin:' + d.id));
      else if (c.st === 'dep' && c.date && gap(c.date, today) >= 3) out.push(line('money', 2, 'chqdep', { p: who, a: num(d.amount) }, '#cash/bank', num(d.amount), c.date, 'chqdep:' + d.id));
      else if (c.st === 'iss' && c.date && gap(today, c.date) >= 0 && gap(today, c.date) <= 3) out.push(line('money', 1, gap(today, c.date) === 0 ? 'chqout0' : 'chqout', { p: who, a: num(d.amount), n: gap(today, c.date) }, '#cash/bank', num(d.amount), c.date, 'chqout:' + d.id));
    });
    /* stock at or below the level the owner set */
    if (ctx.low && ctx.low.length) out.push(line('stock', 1, 'low', { n: ctx.low.length, p: ctx.low.slice(0, 3).join(', ') }, '#do/stock/'));
    if (ctx.neg) out.push(line('stock', 1, 'neg', { n: ctx.neg }, '#do/stock/'));
    /* repeating bills waiting to be made */
    if (ctx.recurring) out.push(line('sales', 1, 'recur', { n: ctx.recurring }, '#repeat'));
    /* GST and TDS dates: given by the caller (gstcal.js rules), nearest 7 days */
    (ctx.dates || []).forEach(function (e) {
      var n = gap(today, e.date); if (n < -3 || n > 7) return;
      out.push(line('tax', n <= 2 ? 0 : 1, 'date', { t: e.title, per: e.per, n: n, d: e.date }, e.link || '#', 0, e.date, 'date:' + e.code + e.date));
    });
    /* yesterday and today so far */
    var y = addDays(today, -1), sy = 0, ny = 0, st = 0;
    mine(D, biz).forEach(function (d) { if (B.role(d) !== 'sale') return; var t = num(d.total) || B.itemTotals(d).total; if (d.date === y) { sy += t; ny++; } else if (d.date === today) st += t; });
    if (ny) out.push(line('sales', 2, 'yest', { n: ny, a: r2(sy), t: r2(st) }, '#sales', r2(sy)));
    else if (st) out.push(line('sales', 2, 'today', { t: r2(st) }, '#sales', r2(st)));
    SOURCES.forEach(function (f) { try { (f(ctx) || []).forEach(function (x) { out.push(x); }); } catch (e) {} });
    return out.sort(function (a, c) { return a.sev - c.sev; });
  }
  function addSource(f) { SOURCES.push(f); }

  /* ---------- 2. month-end checklist ---------- */
  /* [id, text key, link, hint key] in the order a month is closed */
  var MONTHEND = [
    ['sales', 'me.sales', '#sales'], ['recv', 'me.recv', '#money'], ['buy', 'me.buy', '#buy'], ['chase', 'me.chase', '#dues'],
    ['cheq', 'me.cheq', '#cash/bank'], ['stock', 'me.stock', '#do/stock/'], ['staff', 'me.staff', '#stf'], ['cash', 'me.cash', '#cash'],
    ['gst', 'me.gst', '#gst'], ['tds', 'me.tds', '#do/tds/'], ['review', 'me.review', '#fin'], ['backup', 'me.backup', '#backup']];
  function monthDefault(today) { return addMonth(monthOf(today), -1); }
  function tickKey(bizId, ym) { return (bizId || 'x') + '|' + ym; }
  function ticked(state, bizId, ym) { return ((state || {})[tickKey(bizId, ym)] || {}); }
  function tick(state, bizId, ym, step, on, now) {
    var s = Object.assign({}, state || {}), k = tickKey(bizId, ym), m = Object.assign({}, s[k] || {});
    if (on) m[step] = now || 1; else delete m[step];
    s[k] = m; return s;
  }
  function progress(state, bizId, ym) { var t = ticked(state, bizId, ym); return { done: MONTHEND.filter(function (x) { return t[x[0]]; }).length, of: MONTHEND.length }; }
  /* a number or two that tell whether the step needs doing: only facts from the records, never a verdict */
  function monthHints(ctx, ym) {
    var D = mine(ctx.docs, ctx.biz), from = ym + '-01', to = monthEnd(ym), h = {};
    var ns = 0, ts = 0, np = 0, tp = 0;
    D.forEach(function (d) {
      if (!d.date || d.date < from || d.date > to) return; var R = B.role(d);
      if (R === 'sale') { ns++; ts += num(d.total) || B.itemTotals(d).total; } else if (R === 'buy') { np++; tp += B.itemTotals(d).total; } else if (R === 'exp') { np++; tp += num(d.amount); }
    });
    h.sales = { n: ns, a: r2(ts) }; h.buy = { n: np, a: r2(tp) };
    var bl = B.bills(ctx.docs, ctx.biz, null).bills, cd = ctx.cdays || {};
    var ov = bl.filter(function (b) { return b.side === 'recv' && gap(dueOfBill(b, cd) || addDays(b.date, 30), to) > 0; });
    h.chase = { n: ov.length, a: r2(ov.reduce(function (a, b) { return a + b.left; }, 0)) };
    var cq = 0; D.forEach(function (d) { if (d.mode === 'cheque' && d.chq && (d.chq.st === 'hand' || d.chq.st === 'dep' || d.chq.st === 'iss') && (!d.date || d.date <= to)) cq++; });
    h.cheq = { n: cq };
    h.stock = { low: (ctx.low || []).length, neg: ctx.neg || 0 };
    var A = B.accounts(ctx.docs, ctx.biz, to); h.cash = { cash: A.cash || 0, bank: A.bank || 0 };
    return h;
  }

  /* ---------- 3. business health ---------- */
  function lerp(x, bad, good) { if (good === bad) return 100; var t = (x - bad) / (good - bad); return Math.round(Math.max(0, Math.min(1, t)) * 100); }
  /* per month: sales, purchases, expenses (what the books say; stock in hand is NOT counted, which the page says) */
  function monthly(docs, biz, upto) {
    var M = {};
    B.inBooks(docs, biz).forEach(function (d) {
      if (!d.date || d.date > upto) return;
      var m = M[monthOf(d.date)] = M[monthOf(d.date)] || { s: 0, p: 0, e: 0 };
      B.postings(d).forEach(function (l) {
        var a = B.baseAcct ? B.baseAcct(l.a) : l.a;   /* A-9: named sales / purchase ledgers */
        if (a === 'sales') m.s += l.cr - l.dr; else if (a === 'sales-return') m.s -= l.dr - l.cr;
        else if (a === 'purchases') m.p += l.dr - l.cr; else if (a === 'purchase-return') m.p -= l.cr - l.dr;
        else if (a.indexOf('exp:') === 0) m.e += l.dr - l.cr;
      });
    });
    Object.keys(M).forEach(function (k) { M[k].s = r2(M[k].s); M[k].p = r2(M[k].p); M[k].e = r2(M[k].e); });
    return M;
  }
  /* The four parts, each 0 to 100 with the figures it came from. Needs at least 3 months of records before today. */
  function health(ctx) {
    var today = ctx.today, cur = monthOf(today), M = monthly(ctx.docs, ctx.biz, today);
    var done = []; for (var i = 1; i <= 6; i++) done.push(addMonth(cur, -i));   /* the 6 full months before this one */
    var have = done.filter(function (m) { return M[m] && (M[m].s || M[m].p || M[m].e); });
    if (have.length < 3) return { ok: false, have: have.length, need: 3 };
    function sum(ms, f) { return r2(ms.reduce(function (a, m) { return a + (M[m] ? M[m][f] : 0); }, 0)); }
    var last3 = done.slice(0, 3), prev3 = done.slice(3, 6), parts = [];
    var A = B.accounts(ctx.docs, ctx.biz, today), cashNow = r2((A.cash || 0) + (A.bank || 0));
    var out3 = r2(sum(last3, 'p') + sum(last3, 'e')), mo = last3.filter(function (m) { return M[m]; }).length || 1, burn = r2(out3 / mo);
    /* cash cover: months of purchases and expenses the cash and bank balance would pay */
    var cover = burn > 0 ? r2(cashNow / burn) : null;
    parts.push({ id: 'cash', score: cover == null ? null : cashNow <= 0 ? 0 : lerp(cover, 0, 2), facts: { cash: cashNow, burn: burn, cover: cover } });
    /* receivable days: what customers owe divided by sales a day over the last 90 days */
    var recv = 0; B.bills(ctx.docs, ctx.biz).bills.forEach(function (b) { if (b.side === 'recv') recv += b.left; }); recv = r2(recv);
    var s3 = sum(last3, 's'), perDay = s3 / (mo * 30), dso = perDay > 0 ? Math.round(recv / perDay) : null;
    parts.push({ id: 'recv', score: dso == null ? null : lerp(dso, 90, 30), facts: { recv: recv, days: dso, perDay: r2(perDay) } });
    /* margin: sales left after purchases and expenses; this quarter against the one before */
    var m3 = s3 > 0 ? r2((s3 - sum(last3, 'p') - sum(last3, 'e')) / s3 * 100) : null, sp = sum(prev3, 's');
    var m3p = prev3.some(function (m) { return M[m]; }) && sp > 0 ? r2((sp - sum(prev3, 'p') - sum(prev3, 'e')) / sp * 100) : null;
    var msc = m3 == null ? null : lerp(m3, 0, 15); if (msc != null && m3p != null && m3 < m3p - 5) msc = Math.max(0, msc - 20);
    parts.push({ id: 'margin', score: msc, facts: { now: m3, before: m3p } });
    /* expense creep: last month's expenses against the average of the three before it (only when there were such months) */
    var e1 = M[done[0]] ? M[done[0]].e : 0, base = done.slice(1, 4).filter(function (m) { return M[m]; }), eb = base.length ? sum(base, 'e') / base.length : 0;
    var up = eb > 0 ? r2((e1 - eb) / eb * 100) : null;
    parts.push({ id: 'creep', score: up == null ? null : lerp(up, 40, 5), facts: { last: e1, avg: r2(eb), up: up } });
    var sc = parts.filter(function (p) { return p.score != null; });
    if (!sc.length) return { ok: false, have: have.length, need: 3 };
    var total = Math.round(sc.reduce(function (a, p) { return a + p.score; }, 0) / sc.length);
    parts.forEach(function (p) { p.band = p.score == null ? 'na' : p.score >= 70 ? 'good' : p.score >= 40 ? 'ok' : 'low'; });
    return { ok: true, score: total, band: total >= 70 ? 'good' : total >= 40 ? 'ok' : 'low', parts: parts, months: have.length, last3: last3 };
  }

  /* ---------- 4. reminders ---------- */
  /* Lines to tell the user on opening: urgent and soon lines not told today. told = { id: 'yyyy-mm-dd' } */
  function remind(list, told, today, max) {
    var pick = list.filter(function (x) { return x.sev <= 1 && (told || {})[x.id] !== today; });
    return pick.slice(0, max || 3);
  }
  /* A calendar file the phone's own calendar can alarm from even when the browser is closed: bill due dates and tax dates. */
  function ics(entries, stamp) {
    function fold(s) { var o = '', l = s; while (l.length > 73) { o += l.slice(0, 73) + '\r\n '; l = l.slice(73); } return o + l; }
    function x(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nivesh Sahayak//My day//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Nivesh Sahayak dues'];
    entries.forEach(function (e, i) {
      var d = e.date.replace(/-/g, ''), nx = addDays(e.date, 1).replace(/-/g, '');
      L.push('BEGIN:VEVENT', 'UID:nsday-' + i + '-' + d + '@app.niveshsahayak.in', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + nx, fold('SUMMARY:' + x(e.title)),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + x(e.title), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }
  /* open bills with their date, as { date, title } rows for ics(): `names` gives the two English words */
  function dueEntries(docs, biz, today, until, cdays, names) {
    var out = [];
    B.bills(docs, biz).bills.forEach(function (b) {
      var due = dueOfBill(b, cdays || {}); if (!due || due < today || due > until) return;
      out.push({ date: due, title: (b.side === 'recv' ? names.recv : names.pay) + ': ' + b.party + ' ' + (b.no || '') + ' Rs ' + b.left });
    });
    return out.sort(function (a, c) { return a.date.localeCompare(c.date); });
  }

  /* ---------- the front door: sites grouped by job ---------- */
  var JOBS = [
    ['sell', ['billing', 'quotation', 'proforma', 'sales-order', 'challan', 'cash-memo', 'pos', 'restaurant', 'pharmacy', 'export-invoice', 'e-invoice', 'price-list', 'barcode']],
    ['buy', ['purchase', 'purchase-order', 'self-invoice', 'expenses', 'petty-cash', 'voucher']],
    ['money', ['khata', 'receipt', 'cheque', 'cash-book', 'bank-reco', 'credit-note', 'debit-note']],
    ['gst', ['gstr1', 'gstr3b', 'gstr2b', 'cmp08', 'tds', 'declaration', 'gst-calendar', 'eway-bill', 'gstin', 'hsn', 'ifsc', 'pincode', 'distance']],
    ['people', ['salary-slip', 'rent-receipt', 'fee-receipt']],
    ['stock', ['stock', 'bilty', 'job-card', 'contractor-bill']],
    ['books', ['profit-loss', 'tally', 'my']]];
  function jobsFor(sites) {
    var left = sites.slice(), out = JOBS.map(function (j) {
      var have = j[1].filter(function (s) { return sites.indexOf(s) >= 0; }); have.forEach(function (s) { var i = left.indexOf(s); if (i >= 0) left.splice(i, 1); });
      return { id: j[0], sites: have };
    }).filter(function (j) { return j.sites.length; });
    left = left.filter(function (s) { return s !== 'app'; });
    if (left.length) out.push({ id: 'more', sites: left });
    return out;
  }

  var API = { todayList: todayList, addSource: addSource, MONTHEND: MONTHEND, monthDefault: monthDefault, tick: tick, ticked: ticked, progress: progress, monthHints: monthHints,
    monthly: monthly, health: health, remind: remind, ics: ics, dueEntries: dueEntries, JOBS: JOBS, jobsFor: jobsFor, addDays: addDays, addMonth: addMonth, monthEnd: monthEnd };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSHome = API;
})(typeof window !== 'undefined' ? window : globalThis);
