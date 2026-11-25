/* Free tools batch 2 (owner 25 Nov 2026): Legal and dates, Office data, Sharing. Registers its tools with NSFreeTools.add(key, label, group, make).
   1. Cheque bounce dates     (legal)  s.138 / s.142 Negotiable Instruments Act timeline, with a reminder note.
   2. Limitation dates        (legal)  last day for common suits, appeals and consumer cases (Limitation Act 1963 Schedule, CPA 2019).
   3. Date calculator         (legal)  days between dates, date after N days/weeks/months/years, age, working days.
   4. Court fee               (legal)  ad valorem fee on money suits in Punjab (Court-fees Act 1870 as applicable to Punjab) + P&H High Court fixed fees.
   5. Compare two lists       (data)   two Excel/CSV lists matched by key columns: in both, only in one, amount differs; result as .xlsx.
   6. Excel helpers           (data)   join files/sheets, split by a column, remove duplicate rows, CSV <-> Excel.
   7. WhatsApp link           (share)  wa.me link from a number and a message, with ready messages and a QR code.
   Everything runs in this browser; files are never uploaded. Libraries kept inside NSBiz and loaded only when needed:
   SheetJS Community Edition 0.20.3 (Apache-2.0, engine/vendor/xlsx-0.20.3.full.min.js, the copy other NSBiz screens use) and
   qrcode-generator 1.4.4 (MIT, Kazuhiko Arase, engine/vendor/qrcode-generator-1.4.4.min.js = the cdnjs file, SRI sha384-mZT2gIty7ZDd... checked).

   OFFICIAL SOURCES, all read on 25 Nov 2026:
   - Negotiable Instruments Act 1881, s.138 provisos (a)-(c) and s.142(1)(b), India Code (indiacode.gov.in, the new address of
     indiacode.nic.in). s.138(a): presented "within a period of six months from the date on which it is drawn or within the period of
     its validity, whichever is earlier"; (b) notice "within thirty days of the receipt of information by him from the bank";
     (c) payment "within fifteen days of the receipt of the said notice"; s.142(1)(b) complaint "within one month of the date on which
     the cause of action arises under clause (c)"; proviso: a court may take a later complaint for sufficient cause.
   - RBI circular RBI/2011-12/251, DBOD.AML BC.No.47/14.01.001/2011-12, 4 Nov 2011 (rbi.org.in NotificationUser.aspx?Id=6805): from
     1 April 2012 banks should not pay cheques "presented beyond the period of three months from the date of such instrument".
   - General Clauses Act 1897 s.9 (India Code): the word "from" excludes the first day.
   - Limitation Act 1963 (India Code): s.4 (period ends when the court is closed: file on the day it re-opens), s.5, s.18-19 (signed acknowledgement or part payment starts a fresh period), s.12(1)-(2) (the
     day the period runs from is excluded; for appeals the time to get a copy of the decree is excluded), THE SCHEDULE (India Code file
     sch_196336.pdf): Articles 1, 14, 15, 18, 19, 20, 21, 22, 25, 26, 31, 35, 55, 113, 116(a)/(b), 117, 118, 136, 137.
   - Consumer Protection Act 2019 (India Code): s.69(1) two years; s.41 forty-five days; s.51(1) thirty days; s.67 thirty days.
   - Court fee: "Court Fee Table" of the Punjab and Haryana High Court (highcourtchd.gov.in > Court Fees > Court Fee Table.pdf, linked
     from the home page "last reviewed 25 November 2026"; the PDF was made in 2016). Its ad valorem table is "as prescribed in the
     Court-fees Act, 1870" as applicable to Punjab (un-amended); it says Schedules I and II of the Court Fees (Punjab Second Amendment)
     Act 2009 were stayed on 27.11.2013 in RSA No. 3311 of 2013. Haryana's own ad valorem table and Delhi's and other states' current
     schedules could NOT be read from an official source in this session, so they are left out. */
(function () {
  'use strict';
  var W = typeof window !== 'undefined' ? window : this;

  /* ================= pure part (also used by scripts/test_ft-office.js) ================= */
  function pd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function ok(s) { var d = pd(s); return !!d && iso(d) === s; }
  function addDays(s, n) { var d = pd(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function lastDom(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  /* calendar months: 31 Jan + 1 month = 28/29 Feb (that month has no 31st) */
  function addMonths(s, n) { var d = pd(s), y = d.getUTCFullYear(), m = d.getUTCMonth() + n, dd = d.getUTCDate(); y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return iso(new Date(Date.UTC(y, m, Math.min(dd, lastDom(y, m))))); }
  function diff(a, b) { return Math.round((pd(b) - pd(a)) / 864e5); }
  function age(from, to) {
    var a = pd(from), b = pd(to); if (!a || !b || b < a) return null;
    var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) { m--; d += lastDom(b.getUTCFullYear(), b.getUTCMonth() - 1); }   /* borrow the days of the month before */
    if (m < 0) { y--; m += 12; }
    return { y: y, m: m, d: d };
  }
  /* closed days: Sundays (unless sun:false), 2nd and 4th Saturdays (sat24), every Saturday (satAll), typed holidays (hol) */
  function closed(s, o) {
    o = o || {}; var d = pd(s), wd = d.getUTCDay(), nth = Math.ceil(d.getUTCDate() / 7);
    if (o.hol && o.hol[s]) return o.hol[s] === true ? 'Holiday' : o.hol[s];
    if (wd === 0 && o.sun !== false) return 'Sunday';
    if (wd === 6 && o.satAll) return 'Saturday';
    if (wd === 6 && o.sat24 && (nth === 2 || nth === 4)) return nth === 2 ? 'Second Saturday' : 'Fourth Saturday';
    return '';
  }
  function nextOpen(s, o) { var t = s, i = 0; while (closed(t, o) && i++ < 60) t = addDays(t, 1); return t; }
  function workDays(a, b, o) {   /* both ends counted */
    if (!ok(a) || !ok(b)) return null; if (b < a) { var t = a; a = b; b = t; }
    var n = 0, off = 0, c = a; while (c <= b) { if (closed(c, o)) off++; else n++; c = addDays(c, 1); if (n + off > 40000) break; }
    return { work: n, off: off, all: n + off };
  }
  function holidays(text) {   /* one date per line: 2026-12-25, 25-12-2026, 25/12/2026 or 25.12.2026; words after the date = its name */
    var h = {};
    String(text || '').split(/\r?\n/).forEach(function (l) {
      l = l.trim(); var m = /^(\d{4})-(\d{1,2})-(\d{1,2})\s*(.*)$/.exec(l), s = '', nm = '';
      if (m) { s = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2); nm = m[4]; }
      else if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})\s*(.*)$/.exec(l))) { s = m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); nm = m[4]; }
      if (s && ok(s)) h[s] = nm.replace(/^[-–:,\s]+/, '') || 'Holiday';
    });
    return h;
  }

  /* ---- s.138 NI Act timeline ---- */
  function cheque(o) {
    var r = { steps: [], warn: [] };
    if (ok(o.chq)) {
      r.valid = addDays(addMonths(o.chq, 3), -1);   /* RBI 4 Nov 2011: not paid when presented beyond three months from the cheque date */
      r.steps.push(['Last day to present the cheque', r.valid, 'Three months from the cheque date (RBI circular of 4 Nov 2011). Section 138(a) needs the cheque presented within its validity.']);
      if (ok(o.pres) && o.pres > r.valid) r.warn.push('The cheque was presented after its three-month validity. Section 138 needs it presented within its validity.');
      if (ok(o.pres) && o.pres < o.chq) r.warn.push('A cheque cannot be presented before the date written on it.');
    }
    if (ok(o.memo)) {
      r.noticeBy = addDays(o.memo, 30);
      r.steps.push(['Last day to send the demand notice', r.noticeBy, 'Within 30 days of getting the bank’s return memo (section 138(b)). The day of the memo is not counted.']);
      if (ok(o.sent) && o.sent > r.noticeBy) r.warn.push('The notice was sent after the 30 days. Section 138(b) needs it within 30 days of the return memo.');
      if (ok(o.sent) && o.sent < o.memo) r.warn.push('The notice date is before the return memo date. Please check the dates.');
      if (ok(o.chq) && o.memo < o.chq) r.warn.push('The return memo date is before the cheque date. Please check the dates.');
    }
    var recv = ok(o.recv) ? o.recv : (ok(o.sent) && +o.post > 0 ? addDays(o.sent, +o.post) : '');
    if (recv) {
      r.recv = recv; r.guess = !ok(o.recv);
      r.payBy = addDays(recv, 15);
      r.cause = addDays(recv, 16);
      r.complaintBy = addMonths(r.cause, 1);
      r.steps.push(['Notice received by the drawer', recv, r.guess ? 'Estimated: the sent date + ' + (+o.post) + ' days. Use the real delivery date from the tracking or the acknowledgement.' : 'The date the drawer got the notice.']);
      r.steps.push(['Last day for the drawer to pay', r.payBy, '15 days after the notice is received (section 138(c)).']);
      r.steps.push(['Cause of action arises', r.cause, 'The day after the 15 days end without payment.']);
      r.steps.push(['Last day to file the complaint', r.complaintBy, 'One month from the day the cause of action arises (section 142(1)(b)), that day not counted. A court can take a later complaint only for sufficient cause.']);
      if (ok(o.sent) && recv < o.sent) r.warn.push('The notice cannot be received before it was sent. Please check the dates.');
    }
    return r;
  }

  /* ---- limitation: [key, label, period, unit (y/d), period starts, source, appeal (copy time counts)] ---- */
  var LIM = [
    ['a19', 'Recover money lent (loan)', 3, 'y', 'The date the loan was made', 'Limitation Act 1963, Schedule, Article 19'],
    ['a21', 'Recover money lent, payable on demand', 3, 'y', 'The date the loan was made', 'Article 21'],
    ['a20', 'Recover money lent, when the lender gave a cheque for it', 3, 'y', 'The date the cheque was paid', 'Article 20'],
    ['a14', 'Price of goods sold and delivered (no fixed credit period)', 3, 'y', 'The date the goods were delivered', 'Article 14'],
    ['a15', 'Price of goods sold on a fixed credit period', 3, 'y', 'The date the credit period ends', 'Article 15'],
    ['a18', 'Price of work done (no time fixed for payment)', 3, 'y', 'The date the work was done', 'Article 18'],
    ['a1', 'Balance due on a mutual, open and current account', 3, 'y', 'The close of the year in which the last admitted or proved item is entered (the year as kept in the account)', 'Article 1'],
    ['a22', 'Money deposited, payable on demand (also money with a banker)', 3, 'y', 'The date the demand was made', 'Article 22'],
    ['a25', 'Interest on money due', 3, 'y', 'The date the interest became due', 'Article 25'],
    ['a26', 'Money found due on accounts stated (signed)', 3, 'y', 'The date the accounts were stated in writing and signed (or the later date fixed for payment)', 'Article 26'],
    ['a31', 'Bill of exchange or promissory note payable at a fixed time after date', 3, 'y', 'The date the bill or note fell due', 'Article 31'],
    ['a35', 'Bill of exchange (a cheque is one) or promissory note payable on demand', 3, 'y', 'The date of the bill or note', 'Article 35 (section 2(c): "bill of exchange" includes a cheque)'],
    ['a55', 'Compensation for breach of contract', 3, 'y', 'The date the contract was broken', 'Article 55'],
    ['a113', 'Any other suit (no period given elsewhere)', 3, 'y', 'The date the right to sue accrued', 'Article 113'],
    ['a116a', 'Appeal to a High Court from a decree or order (Civil Procedure Code)', 90, 'd', 'The date of the decree or order', 'Article 116(a)', 1],
    ['a116b', 'Appeal to any other court, e.g. the District Court (Civil Procedure Code)', 30, 'd', 'The date of the decree or order', 'Article 116(b)', 1],
    ['a117', 'Appeal from a High Court decree or order to the same High Court', 30, 'd', 'The date of the decree or order', 'Article 117', 1],
    ['a118', 'Leave to appear and defend a summary suit', 10, 'd', 'The date the summons was served', 'Article 118'],
    ['a136', 'Execution of a decree or order of a civil court', 12, 'y', 'The date the decree or order became enforceable', 'Article 136'],
    ['a137', 'Any other application (no period given elsewhere)', 3, 'y', 'The date the right to apply accrued', 'Article 137'],
    ['c69', 'Consumer complaint (District, State or National Commission)', 2, 'y', 'The date the cause of action arose', 'Consumer Protection Act 2019, section 69(1)'],
    ['c41', 'Consumer appeal: District Commission order to the State Commission', 45, 'd', 'The date of the order', 'Consumer Protection Act 2019, section 41 (50% of the amount ordered must be deposited first)'],
    ['c51', 'Consumer appeal: State Commission order to the National Commission', 30, 'd', 'The date of the order', 'Consumer Protection Act 2019, section 51(1) (50% of the amount ordered must be deposited first)'],
    ['c67', 'Consumer appeal: National Commission order to the Supreme Court', 30, 'd', 'The date of the order', 'Consumer Protection Act 2019, section 67 (50% of the amount ordered must be deposited first)']
  ];
  function limitation(key, start, o) {
    o = o || {}; var a = LIM.filter(function (x) { return x[0] === key; })[0]; if (!a || !ok(start)) return null;
    var copy = a[6] ? Math.max(0, Math.floor(+o.copy || 0)) : 0;   /* s.12(2): time to get a copy of the decree is left out (appeals under the Limitation Act) */
    var end = a[3] === 'y' ? addMonths(start, 12 * a[2]) : addDays(start, a[2]);   /* the start day is not counted (s.12(1)) */
    if (copy) end = addDays(end, copy);
    var shut = closed(end, o), file = shut ? nextOpen(end, o) : end;
    return { art: a, last: end, closed: shut, file: file, copy: copy, left: ok(o.today) ? diff(o.today, file) : null };
  }

  /* ---- court fee: ad valorem, Court-fees Act 1870 as applicable to Punjab (P&H High Court table, read 25 Nov 2026) ----
     The table rises in steps: [up to value, fee where the band starts, step, fee per step, band starts at]. Above Rs 4,00,000:
     Rs 6,248 + Rs 48.80 for each Rs 5,000 or part (the note under the table); the last band carries on with the same rule. The table
     gives no upper limit. Rs 500-1,000: the first step above Rs 500 is Rs 76.50 = 75 + 1.50.
     All 280 rows of the table were checked against this rule (scripts/test_ft-office.js has samples). One row breaks the series:
     the PDF prints Rs 995.20 for Rs 8,000-8,250 (Rs 930.80 before it, Rs 979.60 after it): a typing slip for Rs 955.20, which this uses. */
  var PB = [[100, 0, 5, 0.5, 0], [500, 10, 10, 1, 100], [1000, 75, 10, 1.5, 500], [5000, 150, 100, 12.2, 1000], [10000, 638, 250, 24.4, 5000], [20000, 1126, 500, 36.5, 10000],
    [30000, 1856, 1000, 48.8, 20000], [50000, 2344, 2000, 48.8, 30000], [Infinity, 2832, 5000, 48.8, 50000]];
  function feePunjab(v) {
    v = +v; if (!(v > 0)) return 0;
    for (var i = 0; i < PB.length; i++) {
      var r = PB[i]; if (v > r[0]) continue;
      return Math.round((r[1] + Math.ceil((v - r[4]) / r[2] - 1e-9) * r[3]) * 100) / 100;
    }
    return 0;
  }
  /* fixed fees from the same P&H High Court table (cases in the High Court) */
  var HCFEE = [
    ['Civil Writ Petition (CWP)', '₹50 per petitioner'], ['Letters Patent Appeal (LPA)', '₹5.25'], ['Execution First Appeal (EFA)', '₹25'],
    ['Regular First Appeal (RFA), land acquisition', '₹100 (other RFAs: ad valorem)'], ['Civil Revision under section 115 CPC', '₹5.25'],
    ['Civil Revision under Article 227', '₹2.65'], ['Civil Misc. Application (CM)', '₹2.65'], ['Caveat petition', '₹6.50'],
    ['Power of attorney', '₹2.65'], ['Annexures', '₹0.65 per page'], ['Review application', 'Half the court fee within 90 days of the order, full fee after'],
    ['FAO in matrimonial cases', '₹19.50 (Punjab, UT Chandigarh), ₹24.50 (Haryana)'], ['Anticipatory bail (CRM-M)', '₹2.65'], ['Regular bail (CRM-M)', 'Nil'],
    ['Quashing petition (CRM-M)', '₹2.65'], ['Criminal revision (CRR)', '₹2.65 (nil if the petitioner is in custody)'], ['Company petition: winding up', '₹260']
  ];

  /* ---- lists: keys and matching ---- */
  function normKey(v, o) {
    o = o || {}; var s = String(v == null ? '' : v).trim();
    if (o.loose !== false) s = s.toLowerCase().replace(/[^a-z0-9\u0080-￿]+/g, '');
    if (o.zeros !== false) s = s.replace(/(^|[^0-9])0+(?=\d)/g, '$1');   /* INV-0042 = INV-42, 00123 = 123 */
    return s;
  }
  function amount(v) {
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    var s = String(v == null ? '' : v).trim(); if (!s) return NaN;
    var neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s);
    s = s.replace(/rs\.?|inr|[₹,\s()]/gi, '').replace(/^-|-$/g, '');
    if (!/^\d*\.?\d+$/.test(s)) return NaN;
    var n = parseFloat(s); return isFinite(n) ? (neg ? -n : n) : NaN;
  }
  function keyOf(row, cols, o) { return cols.map(function (c) { return normKey(row[c], o); }).join('|'); }
  /* A, B: rows without the heading row; kA/kB: key column indexes; aA/aB: amount column or -1; o.tol: allowed difference */
  function compare(A, B, kA, kB, aA, aB, o) {
    o = o || {}; var tol = +o.tol || 0, map = {}, res = { both: [], diff: [], onlyA: [], onlyB: [], blankA: 0, blankB: 0 }, used = {};
    B.forEach(function (r, i) { var k = keyOf(r, kB, o); if (!k.replace(/\|/g, '')) { res.blankB++; return; } (map[k] = map[k] || []).push(i); });
    A.forEach(function (r, i) {
      var k = keyOf(r, kA, o); if (!k.replace(/\|/g, '')) { res.blankA++; return; }
      var L = map[k]; if (!L || !L.length) { res.onlyA.push(i); return; }
      var j = L.shift(); used[j] = 1;   /* the same key twice in both lists: first with first, second with second */
      if (aA >= 0 && aB >= 0) {
        var x = amount(r[aA]), y = amount(B[j][aB]);
        if (isNaN(x) !== isNaN(y) || (!isNaN(x) && Math.abs(x - y) > tol + 1e-9)) { res.diff.push([i, j, isNaN(x) || isNaN(y) ? null : Math.round((x - y) * 100) / 100]); return; }
      }
      res.both.push([i, j]);
    });
    B.forEach(function (r, j) { if (!used[j] && keyOf(r, kB, o).replace(/\|/g, '')) res.onlyB.push(j); });
    return res;
  }
  /* duplicate rows by the chosen columns (whole row when none); the first one is kept */
  function dedupe(rows, cols, o) {
    var seen = {}, keep = [], gone = [];
    rows.forEach(function (r, i) { var k = cols && cols.length ? keyOf(r, cols, o) : r.map(function (c) { return normKey(c, o); }).join('|'); if (seen['~' + k]) gone.push(i); else { seen['~' + k] = 1; keep.push(i); } });
    return { keep: keep, gone: gone };
  }
  /* rows grouped by one column: [[value, [row indexes]]] in the order first seen (capitals ignored) */
  function splitBy(rows, col) {
    var g = {}, order = [];
    rows.forEach(function (r, i) { var v = String(r[col] == null ? '' : r[col]).trim() || '(blank)', k = '~' + v.toLowerCase(); if (!g[k]) { g[k] = [v, []]; order.push(k); } g[k][1].push(i); });
    return order.map(function (k) { return g[k]; });
  }
  /* tables with a heading row joined: columns matched by heading (loose), new headings added at the end */
  function joinTables(tables, o) {
    o = o || {}; var head = [], idx = {}, out = [];
    tables.forEach(function (t) {
      var h = t.rows[0] || [], m = h.map(function (x, c) { var k = '~' + (normKey(x, { zeros: false }) || 'col' + (c + 1)); if (!(k in idx)) { idx[k] = head.length; head.push(String(x || 'Column ' + (c + 1))); } return idx[k]; });
      t.rows.slice(1).forEach(function (r) { var row = []; m.forEach(function (to, c) { row[to] = r[c]; }); out.push({ r: row, f: t.file, s: t.sheet }); });
    });
    var H = (o.src ? ['File', 'Sheet'] : []).concat(head);
    return [H].concat(out.map(function (x) { var a = []; for (var i = 0; i < head.length; i++) a.push(x.r[i] == null ? '' : x.r[i]); return (o.src ? [x.f, x.s] : []).concat(a); }));
  }
  function csv(rows) { return rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) || /^\s|\s$/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n'); }

  /* ---- WhatsApp ---- */
  function waNumber(s) {
    var d = String(s || '').replace(/[^\d+]/g, ''), plus = d.charAt(0) === '+'; d = d.replace(/\+/g, '');
    if (!d) return { num: '', note: '' };
    if (plus) return { num: d, note: d.length < 8 ? 'This number looks too short.' : '' };
    if (/^0?[6-9]\d{9}$/.test(d)) return { num: '91' + d.slice(-10), note: '' };
    if (/^91[6-9]\d{9}$/.test(d)) return { num: d, note: '' };
    if (/^0091[6-9]\d{9}$/.test(d)) return { num: d.slice(2), note: '' };
    if (d.length === 10) return { num: '91' + d, note: 'An Indian mobile number starts with 6, 7, 8 or 9. Please check it.' };
    return { num: d.replace(/^00/, ''), note: 'Not a 10-digit Indian mobile number: used as typed. For another country, type its code first, e.g. +971.' };
  }
  function waLink(num, text) { return 'https://wa.me/' + (num || '') + (text ? '?text=' + encodeURIComponent(text) : ''); }

  var CORE = { pd: pd, iso: iso, ok: ok, addDays: addDays, addMonths: addMonths, diff: diff, age: age, closed: closed, nextOpen: nextOpen, workDays: workDays, holidays: holidays,
    cheque: cheque, LIM: LIM, limitation: limitation, feePunjab: feePunjab, HCFEE: HCFEE, normKey: normKey, amount: amount, compare: compare, dedupe: dedupe, splitBy: splitBy,
    joinTables: joinTables, csv: csv, waNumber: waNumber, waLink: waLink };
  W.NSFtOffice = CORE;

  /* ================= screens ================= */
  var NS = W.NS, FT = W.NSFreeTools; if (!NS || !FT || typeof document === 'undefined') return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var XL = '/assets/vendor/xlsx-0.20.3.full.min.js', QR = '/assets/vendor/qrcode-generator-1.4.4.min.js';
  var READ = 'read on 25 Nov 2026';
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function today() { return NS.today ? NS.today() : iso(new Date()); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function show(s, noDay) { if (!ok(s)) return '—'; var d = pd(s); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + (noDay ? '' : ', ' + DAY[d.getUTCDay()]); }
  function fmt(n, d) { return (+n || 0).toLocaleString('en-IN', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d }); }
  function copyText(t) {
    function done() { NS.toast('Copied.'); }
    function fallback() { var a = el('textarea'); a.value = t; a.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { NS.toast('Select the text and copy it.', 'bad'); } a.remove(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  }
  function xlLib() { return NS.loadJs(XL).then(function () { if (!W.XLSX) throw new Error('load'); return W.XLSX; }); }
  function libFail() { NS.toast('The Excel part did not load. Open NSBiz once with the internet on, then it works offline too.', 'bad'); }
  var CSS = '.fo-out{display:grid;gap:8px;margin:12px 0}.fo-step{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;background:var(--surface2);border-radius:10px;padding:10px 12px;min-width:0}' +
    '.fo-step b{font-size:1.05rem;text-align:right;overflow-wrap:anywhere}.fo-step span{font-weight:600;min-width:0}.fo-step small{grid-column:1/-1;color:var(--soft);font-size:.85rem}' +
    '@media (max-width:480px){.fo-step{grid-template-columns:1fr}.fo-step b{text-align:left}}' +
    '.fo-warn{background:color-mix(in srgb,var(--bad) 12%,transparent);border-left:4px solid var(--bad);padding:8px 12px;border-radius:8px;margin:8px 0}' +
    '.fo-src{font-size:.85rem;color:var(--soft);margin-top:10px}.fo-src summary{cursor:pointer;min-height:40px;display:flex;align-items:center;font-weight:600}' +
    '.fo-ta{display:block;width:100%;min-height:90px;box-sizing:border-box;font:inherit;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--surface,transparent);color:inherit}' +
    '.fo-tbl{overflow-x:auto;max-width:100%;margin:8px 0}.fo-tbl table{border-collapse:collapse;font-size:.88rem;min-width:100%}.fo-tbl th,.fo-tbl td{border:1px solid var(--line);padding:4px 8px;text-align:left;vertical-align:top}' +
    '.fo-tbl.fo-wide td,.fo-tbl.fo-wide th{white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis}.fo-tbl th{background:var(--surface2)}' +
    '.fo-chips{display:flex;flex-wrap:wrap;gap:6px}.fo-chips label{display:flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border:1px solid var(--line);border-radius:20px;font-weight:500;max-width:100%;overflow-wrap:anywhere}' +
    '.fo-chips input{width:18px;height:18px;flex:none}.fo-qr{background:#fff;padding:8px;border-radius:10px;display:inline-block;width:200px;max-width:100%;box-sizing:border-box;margin-top:8px}.fo-qr svg{display:block;width:100%;height:auto}' +
    '.fo-link{overflow-wrap:anywhere;font-family:var(--mono,monospace);font-size:.85rem;background:var(--surface2);padding:8px;border-radius:8px;margin:0 0 8px}' +
    '.fo-files{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}.fo-files li{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;background:var(--surface2);border-radius:8px;padding:4px 10px;min-width:0}.fo-files li span{overflow-wrap:anywhere;min-width:0}' +
    '.fo-tool .fz-row input[type=date]{min-width:150px}.fo-tool .fz-row input[type=text],.fo-tool .fz-row input[type=tel]{width:200px;max-width:100%}.fo-tool .fz-row .fz-wide input{width:100%}' +
    '.fo-tool .btn,.fo-tool select,.fo-tool input:not([type=checkbox]):not([type=radio]){min-height:40px;box-sizing:border-box}.fo-tool .btn{display:inline-flex;align-items:center;justify-content:center}' +
    '@media (max-width:480px){.fo-tool .fz-row>label:not(.fz-chk){flex:1 1 100%}.fo-tool .fz-row>label:not(.fz-chk) input,.fo-tool .fz-row>label:not(.fz-chk) select{width:100%}}' +
    '.fo-tool .fz-row select{max-width:100%}.fo-tool .fz-row label.fz-wide select{width:100%}.fo-tool h3{overflow-wrap:anywhere}';
  function style() { if (document.getElementById('fo-css')) return; var s = el('style'); s.id = 'fo-css'; s.textContent = CSS; document.head.appendChild(s); }
  function tool(html) { style(); var n = el('div', 'fz-tool fo-tool'); n.innerHTML = html; return n; }
  /* steps: [label, date, note, text shown instead of the date] */
  function stepsHtml(L) { return L.map(function (s) { return '<div class="fo-step"><span>' + esc(s[0]) + '</span><b>' + esc(s[3] || show(s[1])) + '</b>' + (s[2] ? '<small>' + esc(s[2]) + '</small>' : '') + '</div>'; }).join(''); }
  var LAWYER = '<p class="fz-note"><b>Please check with a lawyer.</b> These dates follow the words of the law. Courts decide the exact day in each case (for example when a notice is refused or never delivered), and holidays differ from court to court.</p>';

  /* ---------- 1. cheque bounce ---------- */
  function chqNode() {
    var n = tool('<h3>Cheque bounce dates (section 138)</h3><p class="soft">Type the dates you know. The tool shows the last day for each step of a cheque bounce case under the Negotiable Instruments Act.</p>' +
      '<div class="fz-card"><div class="fz-row"><label>Date on the cheque <input type="date" data-k="chq"></label><label>Presented to the bank on <input type="date" data-k="pres"></label>' +
      '<label>Bank return memo received on <input type="date" data-k="memo"></label></div>' +
      '<div class="fz-row"><label>Demand notice sent on <input type="date" data-k="sent"></label><label>Notice received by the drawer on <input type="date" data-k="recv"></label>' +
      '<label>Not known? Assume delivery after <select data-k="post"><option value="0">Do not guess</option><option value="3">3 days</option><option value="5">5 days</option><option value="7">7 days</option><option value="10">10 days</option></select></label></div>' +
      '<div class="fz-row"><label class="fz-wide">Cheque details for the note (optional) <input type="text" data-k="info" placeholder="e.g. Cheque no. 123456, ₹50,000, from Sharma Traders"></label></div></div>' +
      '<div data-warn></div><div class="fo-out" data-out aria-live="polite"></div>' +
      '<div data-remw hidden><h3>Note to keep</h3><textarea class="fo-ta" data-rem rows="7" aria-label="Note with the dates"></textarea><div class="pr-bar"><button type="button" class="btn primary" data-copy>Copy the note</button></div></div>' + LAWYER +
      '<details class="fo-src"><summary>Where these rules come from (' + READ + ')</summary><p>Negotiable Instruments Act 1881, section 138 provisos (a), (b), (c) and section 142(1)(b), from India Code (indiacode.gov.in). Cheque validity of three months: RBI circular DBOD.AML BC.No.47/14.01.001/2011-12 of 4 November 2011, for cheques dated 1 April 2012 or later (rbi.org.in). "From" a date leaves that day out: General Clauses Act 1897, section 9.</p></details>');
    function run() {
      var S = {}; $$('[data-k]', n).forEach(function (i) { S[i.getAttribute('data-k')] = i.value.trim(); });
      var r = cheque(S);
      $('[data-warn]', n).innerHTML = r.warn.map(function (x) { return '<p class="fo-warn" role="alert">' + esc(x) + '</p>'; }).join('');
      $('[data-out]', n).innerHTML = r.steps.length ? stepsHtml(r.steps) : '<p class="fz-note">Start with the cheque date or the date of the bank’s return memo.</p>';
      $('[data-remw]', n).hidden = !r.steps.length;
      if (r.steps.length) $('[data-rem]', n).value = 'Cheque bounce: dates to remember' + (S.info ? '\n' + S.info : '') + '\n' + r.steps.map(function (s) { return '- ' + s[0] + ': ' + show(s[1]); }).join('\n') + (r.warn.length ? '\nNote: ' + r.warn.join(' ') : '') + '\n(Worked out with NSBiz. Please confirm the dates with your lawyer.)';
    }
    n.addEventListener('input', run); n.addEventListener('change', run);
    $('[data-copy]', n).addEventListener('click', function () { copyText($('[data-rem]', n).value); });
    run(); return n;
  }

  /* ---------- closed days (limitation and working days) ---------- */
  function closedBox(id) {
    return '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-sun checked> Sundays are closed</label><label class="fz-chk"><input type="checkbox" data-sat24> 2nd and 4th Saturdays are closed</label><label class="fz-chk"><input type="checkbox" data-satall> Every Saturday is closed</label></div>' +
      '<label for="' + id + '" class="fz-note">Other holidays (one per line, e.g. 25-12-2026 Christmas)</label><textarea class="fo-ta" id="' + id + '" data-hol rows="3" placeholder="26-01-2027 Republic Day"></textarea>';
  }
  function closedOpts(n) { return { sun: $('[data-sun]', n).checked, sat24: $('[data-sat24]', n).checked, satAll: $('[data-satall]', n).checked, hol: holidays($('[data-hol]', n).value) }; }

  /* ---------- 2. limitation ---------- */
  function limNode() {
    function opt(a) { return '<option value="' + a[0] + '">' + esc(a[1]) + '</option>'; }
    function grp(label, f) { return '<optgroup label="' + label + '">' + LIM.filter(f).map(opt).join('') + '</optgroup>'; }
    var APPL = ['a118', 'a136', 'a137'];
    var n = tool('<h3>Limitation: last day to file</h3><p class="soft">Pick the kind of case and the date the period starts. The tool shows the last day, and moves it to the next working day when the court is closed that day (section 4).</p>' +
      '<div class="fz-card"><div class="fz-row"><label class="fz-wide">Kind of case <select data-art>' +
      grp('Suits for money (Limitation Act 1963)', function (a) { return /^a/.test(a[0]) && !a[6] && APPL.indexOf(a[0]) < 0; }) +
      grp('Appeals (Limitation Act 1963)', function (a) { return !!a[6]; }) +
      grp('Applications (Limitation Act 1963)', function (a) { return APPL.indexOf(a[0]) >= 0; }) +
      grp('Consumer cases (Consumer Protection Act 2019)', function (a) { return /^c/.test(a[0]); }) + '</select></label></div>' +
      '<div class="fz-row"><label><span data-startl>Start date</span> <input type="date" data-start></label><label data-copyl hidden>Days taken to get the certified copy <input type="number" min="0" step="1" inputmode="numeric" data-copy value="0"></label></div>' +
      '<p class="fz-note" data-period></p>' + closedBox('fo-lhol') + '</div>' +
      '<div class="fo-out" data-out aria-live="polite"></div>' + LAWYER +
      '<p class="fz-note">Late filing: an appeal or an application can still be admitted for "sufficient cause" (section 5), but a suit cannot. A written acknowledgement of the debt or a part payment made before the period ends starts a fresh period (sections 18 and 19); this tool does not count that.</p>' +
      '<details class="fo-src"><summary>Where these periods come from (' + READ + ')</summary><p>Limitation Act 1963: sections 4, 5, 12, 18 and 19 and the Schedule (Articles 1, 14, 15, 18 to 22, 25, 26, 31, 35, 55, 113, 116, 117, 118, 136 and 137), from India Code (indiacode.gov.in). Consumer Protection Act 2019: sections 41, 51(1), 67 and 69, from India Code.</p></details>');
    function run() {
      var key = $('[data-art]', n).value, a = LIM.filter(function (x) { return x[0] === key; })[0], o = closedOpts(n);
      $('[data-startl]', n).textContent = a[4]; $('[data-copyl]', n).hidden = !a[6];
      $('[data-period]', n).textContent = 'Period: ' + a[2] + (a[3] === 'y' ? (a[2] === 1 ? ' year' : ' years') : ' days') + '. It runs from: ' + a[4].charAt(0).toLowerCase() + a[4].slice(1) + '. Source: ' + a[5] + '.';
      o.copy = $('[data-copy]', n).value; o.today = today();
      var r = limitation(key, $('[data-start]', n).value, o), out = $('[data-out]', n);
      if (!r) { out.innerHTML = '<p class="fz-note">Type the start date.</p>'; return; }
      var L = [['Period ends on', r.last, (r.copy ? 'Includes ' + r.copy + ' days taken to get the copy (section 12(2)). ' : '') + 'The start day itself is not counted (section 12(1)).']];
      if (r.closed) L.push(['Court closed that day (' + r.closed + '). File by', r.file, 'Section 4: when the period ends on a day the court is closed, you can file on the day it re-opens.']);
      L.push(['Days left from today', '', '', r.left < 0 ? 'Time ran out ' + (-r.left) + (r.left === -1 ? ' day' : ' days') + ' ago' : r.left === 0 ? 'Today is the last day' : r.left + (r.left === 1 ? ' day' : ' days')]);
      out.innerHTML = stepsHtml(L);
    }
    n.addEventListener('input', run); n.addEventListener('change', run);
    run(); return n;
  }

  /* ---------- 3. date tools ---------- */
  function dateNode() {
    var t = today();
    var n = tool('<h3>Date calculator</h3>' +
      '<div class="fz-card"><h3>Days between two dates</h3><div class="fz-row"><label>From <input type="date" data-a value="' + t + '"></label><label>To <input type="date" data-b></label></div><div class="fo-out" data-o1></div></div>' +
      '<div class="fz-card"><h3>Working days between these dates</h3><p class="fz-note">Both dates are counted. The closed days you tick and the holidays you type are left out.</p>' + closedBox('fo-dhol') + '<div class="fo-out" data-o4></div></div>' +
      '<div class="fz-card"><h3>Date after or before a period</h3><div class="fz-row"><label>Start <input type="date" data-s value="' + t + '"></label><label>After or before <select data-sg><option value="1">After</option><option value="-1">Before</option></select></label>' +
      '<label>Number <input type="number" min="0" step="1" inputmode="numeric" data-n value="30"></label><label>Of <select data-u><option value="d">Days</option><option value="w">Weeks</option><option value="m">Months</option><option value="y">Years</option></select></label></div><div class="fo-out" data-o2></div></div>' +
      '<div class="fz-card"><h3>Age on a date</h3><div class="fz-row"><label>Date of birth <input type="date" data-dob></label><label>Age on <input type="date" data-on value="' + t + '"></label></div><div class="fo-out" data-o3></div></div>');
    function ymd(g) { return g.y + (g.y === 1 ? ' year, ' : ' years, ') + g.m + (g.m === 1 ? ' month, ' : ' months, ') + g.d + (g.d === 1 ? ' day' : ' days'); }
    function nextBday(dob, on) { var k = +on.slice(0, 4) - +dob.slice(0, 4), c = addMonths(dob, 12 * k); if (c <= on) c = addMonths(dob, 12 * (k + 1)); return c; }
    function run() {
      var a = $('[data-a]', n).value, b = $('[data-b]', n).value, o1 = $('[data-o1]', n), o4 = $('[data-o4]', n);
      if (ok(a) && ok(b)) {
        var d = diff(a, b), x = Math.abs(d), lo = a < b ? a : b, hi = a < b ? b : a;
        o1.innerHTML = stepsHtml([['Days between (first day not counted)', '', d < 0 ? 'The second date is earlier than the first.' : '', fmt(x) + (x === 1 ? ' day' : ' days')], ['Counting both days', '', '', fmt(x + 1) + ' days'],
          ['In weeks', '', '', Math.floor(x / 7) + ' weeks, ' + (x % 7) + ' days'], ['In years, months and days', '', '', ymd(age(lo, hi))]]);
        var w = workDays(a, b, closedOpts(n));
        o4.innerHTML = stepsHtml([['Working days', '', '', fmt(w.work)], ['Closed days left out', '', '', fmt(w.off)], ['All days', '', '', fmt(w.all)]]);
      } else { o1.innerHTML = '<p class="fz-note">Pick both dates.</p>'; o4.innerHTML = '<p class="fz-note">Pick both dates in "Days between two dates".</p>'; }
      var s = $('[data-s]', n).value, k = Math.max(0, Math.floor(+$('[data-n]', n).value || 0)) * +$('[data-sg]', n).value, u = $('[data-u]', n).value;
      $('[data-o2]', n).innerHTML = ok(s) ? stepsHtml([['Result', u === 'd' ? addDays(s, k) : u === 'w' ? addDays(s, 7 * k) : addMonths(s, u === 'm' ? k : 12 * k), u === 'm' || u === 'y' ? 'When that month has no such day (like 31 February), the last day of the month is used.' : '']]) : '<p class="fz-note">Pick the start date.</p>';
      var dob = $('[data-dob]', n).value, on = $('[data-on]', n).value, g = ok(dob) && ok(on) ? age(dob, on) : null;
      $('[data-o3]', n).innerHTML = g ? stepsHtml([['Age', '', '', ymd(g)], ['Next birthday', nextBday(dob, on), '']]) : '<p class="fz-note">' + (ok(dob) && ok(on) ? 'The date of birth is after the second date.' : 'Pick the date of birth.') + '</p>';
    }
    n.addEventListener('input', run); n.addEventListener('change', run);
    run(); return n;
  }

  /* ---------- 4. court fee ---------- */
  function feeNode() {
    var n = tool('<h3>Court fee</h3><p class="soft">Court fee on a suit or appeal for money (ad valorem fee), worked out from the value of the claim.</p>' +
      '<div class="fz-card"><div class="fz-row"><label class="fz-wide">State <select data-st><option value="pb">Punjab (Court-fees Act 1870 as applicable to Punjab)</option></select></label>' +
      '<label>Value of the claim ₹ <input type="number" min="0" step="any" inputmode="decimal" data-v placeholder="e.g. 250000"></label></div>' +
      '<div class="fz-res" data-res aria-live="polite"></div><p class="fz-note" data-how></p></div>' +
      '<p class="fz-note">States included now: Punjab only. Haryana, Chandigarh, Delhi and other states are not included yet, because their current fee tables could not be read from a government source when this tool was made. Courts may also charge process fees and other small fees; ask at the court’s filing counter.</p>' +
      '<div class="fz-card"><h3>Fixed fees in the Punjab and Haryana High Court</h3><div class="fo-tbl"><table><thead><tr><th scope="col">Case or paper</th><th scope="col">Court fee</th></tr></thead><tbody>' +
      HCFEE.map(function (f) { return '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<details class="fo-src" open><summary>Where these fees come from (' + READ + ')</summary><p>The "Court Fee Table" published by the Punjab and Haryana High Court on highcourtchd.gov.in (Court Fees section). Its ad valorem table follows the Court-fees Act 1870 as applicable to Punjab (the un-amended Act). The High Court notes that Schedules I and II of the Court Fees (Punjab Second Amendment) Act 2009 were stayed on 27 November 2013 in RSA No. 3311 of 2013, and that the chart may change without notice. Please confirm with the court before you pay.</p></details>');
    function run() {
      var v = +$('[data-v]', n).value, res = $('[data-res]', n);
      if (!(v > 0)) { res.innerHTML = ''; $('[data-how]', n).textContent = 'Type the value of the claim.'; return; }
      res.innerHTML = '<div><span>Court fee</span><b>₹' + fmt(feePunjab(v), 2) + '</b></div><div><span>Value of the claim</span><b>₹' + fmt(v, 2) + '</b></div>';
      $('[data-how]', n).textContent = v > 400000 ? 'Above ₹4,00,000: ₹6,248 plus ₹48.80 for each ₹5,000 or part of it above ₹4,00,000. The table gives no upper limit.' : 'From the table of ad valorem fees: the fee goes up in steps, and a part of a step counts as a full step.' + (v > 8000 && v <= 8250 ? ' The printed table shows ₹995.20 for this step; the steps around it (₹930.80 before, ₹979.60 after) show it should be ₹955.20, which is used here. Please confirm at the court.' : '');
    }
    n.addEventListener('input', run); run(); return n;
  }

  /* ---------- reading Excel / CSV (SheetJS) ---------- */
  function readBook(file) {
    return xlLib().then(function (X) { return file.arrayBuffer().then(function (buf) {
      var wb = /\.(csv|txt|tsv)$/i.test(file.name) ? X.read(new TextDecoder().decode(buf).replace(/^﻿/, ''), { type: 'string', raw: true }) : X.read(buf, { type: 'array' });   /* raw: CSV codes like 00123 stay as typed */
      return wb.SheetNames.map(function (nm) {
        return { file: file.name, sheet: nm, rows: X.utils.sheet_to_json(wb.Sheets[nm], { header: 1, defval: '', raw: false, blankrows: false }).map(function (r) { return r.map(function (c) { return String(c == null ? '' : c).trim(); }); }).filter(function (r) { return r.some(Boolean); }) };
      });
    }); });
  }
  function pasteRows(text) {
    return String(text || '').replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return (l.indexOf('\t') >= 0 ? l.split('\t') : l.split(',')).map(function (c) { return c.trim(); }); });
  }
  function bookBlob(X, sheets) {
    var wb = X.utils.book_new(), used = {};
    sheets.forEach(function (s) {
      var nm = String(s[0]).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 28) || 'Sheet', b = nm, i = 2; while (used[nm.toLowerCase()]) nm = b.slice(0, 25) + ' ' + (i++); used[nm.toLowerCase()] = 1;
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(s[1].length ? s[1] : [['(nothing)']]), nm);
    });
    return new Blob([X.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function preview(rows, max) {
    max = max || 6; if (!rows.length) return '';
    var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0), h = rows[0], cells = function (r, t) { var s = ''; for (var i = 0; i < w; i++) s += '<' + t + '>' + esc(r[i] == null ? '' : r[i]) + '</' + t + '>'; return s; };
    return '<div class="fo-tbl fo-wide"><table><thead><tr>' + cells(h, 'th') + '</tr></thead><tbody>' + rows.slice(1, max).map(function (r) { return '<tr>' + cells(r, 'td') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (rows.length > max ? '<p class="fz-note">Showing ' + (max - 1) + ' of ' + (rows.length - 1) + ' rows.</p>' : '');
  }
  function colOpts(head, sel, none) { return (none ? '<option value="-1">' + none + '</option>' : '') + head.map(function (h, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(h || ('Column ' + (i + 1))) + '</option>'; }).join(''); }
  function guess(head, re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; }
  var RE_KEY = /inv|bill|voucher|vch|doc|ref|\bno\b|number/i, RE_AMT = /amount|amt|total|value|taxable|net|\brs\b|₹|inr/i;

  /* ---------- 5. compare two lists ---------- */
  function cmpNode() {
    var n = tool('<h3>Compare two lists</h3><p class="soft">Match two Excel or CSV lists: your purchase register and GSTR-2B, your books and the party’s ledger, two price lists. Choose the column(s) that identify a row, such as invoice number and GSTIN. The first row of each list must be the headings.</p>' +
      [1, 2].map(function (k) { return '<div class="fz-card" data-side="' + k + '"><h3>' + (k === 1 ? 'First list' : 'Second list') + '</h3><div class="pr-bar">' +
        '<label class="btn' + (k === 1 ? ' primary' : '') + '" for="fo-cf' + k + '">Choose a file</label><input type="file" id="fo-cf' + k + '" class="sr" accept=".xlsx,.xls,.xlsm,.ods,.csv,.txt" data-file>' +
        '<button type="button" class="btn" data-pastebtn aria-expanded="false">Paste instead</button></div><div data-pastew hidden><textarea class="fo-ta" data-paste aria-label="Rows pasted from Excel" placeholder="Copy the rows in Excel, with the heading row, and paste them here"></textarea><div class="pr-bar"><button type="button" class="btn" data-usepaste>Use these rows</button></div></div>' +
        '<div class="fz-row" data-sheetw hidden><label>Sheet <select data-sheet></select></label></div><p class="fz-note" data-info></p><div data-prev></div>' +
        '<div class="fz-row" data-colsw hidden><label>Key column <select data-k1></select></label><label>Second key (optional) <select data-k2></select></label><label>Amount column <select data-am></select></label></div></div>'; }).join('') +
      '<div class="fz-card"><div class="fz-row"><label class="fz-chk"><input type="checkbox" data-loose checked> Ignore capitals, spaces and signs (INV-12 = inv 12)</label><label class="fz-chk"><input type="checkbox" data-zeros checked> Ignore leading zeros (0042 = 42)</label>' +
      '<label>Allowed amount difference ₹ <input type="number" min="0" step="any" inputmode="decimal" data-tol value="1"></label></div>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-go>Compare</button></div></div><div data-res aria-live="polite"></div>');
    var L = { 1: null, 2: null }, books = { 1: null, 2: null }, last = null;
    $$('[data-side]', n).forEach(function (box) {
      var k = box.getAttribute('data-side');
      function setRows(rows, info) {
        L[k] = rows; $('[data-info]', box).textContent = info + ': ' + Math.max(0, rows.length - 1) + ' rows.'; $('[data-prev]', box).innerHTML = preview(rows);
        var h = rows[0] || [], g1 = guess(h, RE_KEY), ga = guess(h, RE_AMT), gs = guess(h, /gstin/i);
        $('[data-k1]', box).innerHTML = colOpts(h, g1 < 0 ? 0 : g1); $('[data-k2]', box).innerHTML = colOpts(h, -1, 'None'); $('[data-am]', box).innerHTML = colOpts(h, ga, 'Do not compare amounts');
        if (gs >= 0 && gs !== (g1 < 0 ? 0 : g1)) $('[data-k2]', box).value = gs;
        $('[data-colsw]', box).hidden = !rows.length; $('[data-res]', n).innerHTML = ''; last = null;
      }
      $('[data-file]', box).addEventListener('change', function (e) {
        var f = e.target.files[0]; e.target.value = ''; if (!f) return;
        $('[data-info]', box).textContent = 'Reading ' + f.name + '…';
        readBook(f).then(function (sh) {
          books[k] = sh; $('[data-sheet]', box).innerHTML = sh.map(function (s, i) { return '<option value="' + i + '">' + esc(s.sheet) + '</option>'; }).join('');
          $('[data-sheetw]', box).hidden = sh.length < 2; setRows(sh[0] ? sh[0].rows : [], f.name);
        }).catch(function (er) { if (er && er.message === 'load') libFail(); $('[data-info]', box).textContent = 'This file could not be read. Save it as .xlsx or .csv and try again.'; });
      });
      $('[data-sheet]', box).addEventListener('change', function (e) { var s = books[k][+e.target.value]; setRows(s.rows, s.file + ' › ' + s.sheet); });
      $('[data-pastebtn]', box).addEventListener('click', function (e) { var w = $('[data-pastew]', box); w.hidden = !w.hidden; e.currentTarget.setAttribute('aria-expanded', !w.hidden); if (!w.hidden) $('[data-paste]', box).focus(); });
      $('[data-usepaste]', box).addEventListener('click', function () { var r = pasteRows($('[data-paste]', box).value); if (r.length < 2) { NS.toast('Paste the heading row and at least one row.', 'bad'); return; } books[k] = null; $('[data-sheetw]', box).hidden = true; setRows(r, 'Pasted rows'); });
    });
    function cols(k) { var b = $('[data-side="' + k + '"]', n), a = +$('[data-k1]', b).value, c = +$('[data-k2]', b).value; return { keys: c >= 0 && c !== a ? [a, c] : [a], am: +$('[data-am]', b).value }; }
    $('[data-go]', n).addEventListener('click', function () {
      if (!L[1] || !L[2] || L[1].length < 2 || L[2].length < 2) { NS.toast('Load both lists first.', 'bad'); return; }
      var c1 = cols(1), c2 = cols(2);
      if (c1.keys.length !== c2.keys.length) { NS.toast('Choose the same number of key columns in both lists.', 'bad'); return; }
      var o = { loose: $('[data-loose]', n).checked, zeros: $('[data-zeros]', n).checked, tol: +$('[data-tol]', n).value || 0 };
      var A = L[1].slice(1), B = L[2].slice(1), r = compare(A, B, c1.keys, c2.keys, c1.am, c2.am, o), H1 = L[1][0], H2 = L[2][0], useAm = c1.am >= 0 && c2.am >= 0;
      last = { r: r, A: A, B: B, H1: H1, H2: H2, c1: c1, c2: c2, useAm: useAm };
      $('[data-res]', n).innerHTML = '<div class="fz-res"><div><span>In both lists' + (useAm ? ', same amount' : '') + '</span><b>' + r.both.length + '</b></div>' + (useAm ? '<div><span>In both, amount differs</span><b>' + r.diff.length + '</b></div>' : '') +
        '<div><span>Only in the first list</span><b>' + r.onlyA.length + '</b></div><div><span>Only in the second list</span><b>' + r.onlyB.length + '</b></div></div>' +
        (r.blankA || r.blankB ? '<p class="fz-note">Rows with an empty key were left out: ' + r.blankA + ' in the first list, ' + r.blankB + ' in the second.</p>' : '') +
        (useAm && r.diff.length ? '<h3>Amount differs</h3>' + preview([[H1[c1.keys[0]] || 'Key', 'First list', 'Second list', 'Difference']].concat(r.diff.map(function (d) { return [A[d[0]][c1.keys[0]], A[d[0]][c1.am], B[d[1]][c2.am], d[2] == null ? '' : fmt(d[2], 2)]; })), 11) : '') +
        (r.onlyA.length ? '<h3>Only in the first list</h3>' + preview([H1].concat(r.onlyA.map(function (i) { return A[i]; })), 11) : '') +
        (r.onlyB.length ? '<h3>Only in the second list</h3>' + preview([H2].concat(r.onlyB.map(function (i) { return B[i]; })), 11) : '') +
        '<div class="pr-bar"><button type="button" class="btn primary" data-dl>Download the result (.xlsx)</button></div>';
      $('[data-dl]', n).addEventListener('click', dl);
    });
    function num(v) { var x = amount(v); return isNaN(x) ? v : x; }
    function dl() {
      var x = last; if (!x) return;
      xlLib().then(function (X) {
        var r = x.r, HB = x.H1.concat([''], x.H2);
        function pair(p, d) { var a = x.A[p[0]].slice(), b = x.B[p[1]].slice(); while (a.length < x.H1.length) a.push(''); if (x.useAm) { a[x.c1.am] = num(a[x.c1.am]); b[x.c2.am] = num(b[x.c2.am]); } return a.concat([''], b, d ? [p[2] == null ? '' : p[2]] : []); }
        var sh = [['Summary', [['Result', 'Rows'], ['In both lists' + (x.useAm ? ', same amount' : ''), r.both.length]].concat(x.useAm ? [['In both, amount differs', r.diff.length]] : [],
          [['Only in the first list', r.onlyA.length], ['Only in the second list', r.onlyB.length], ['Rows with an empty key: first list', r.blankA], ['Rows with an empty key: second list', r.blankB], ['Made with NSBiz free tools on', today()]])],
          ['In both', [HB].concat(r.both.map(function (p) { return pair(p); }))]];
        if (x.useAm) sh.push(['Amount differs', [HB.concat(['Difference (first - second)'])].concat(r.diff.map(function (p) { return pair(p, 1); }))]);
        sh.push(['Only in first', [x.H1].concat(r.onlyA.map(function (i) { return x.A[i]; }))], ['Only in second', [x.H2].concat(r.onlyB.map(function (i) { return x.B[i]; }))]);
        NS.saveFile(bookBlob(X, sh), 'compare-' + today() + '.xlsx');
      }).catch(libFail);
    }
    return n;
  }

  /* ---------- 6. Excel helpers ---------- */
  function xhNode() {
    var MODES = [['join', 'Join files'], ['split', 'Split by a column'], ['dup', 'Remove duplicates'], ['conv', 'CSV and Excel']];
    var n = tool('<h3>Excel helpers</h3><div class="pr-bar fz-tabs" role="group" aria-label="Excel helper">' + MODES.map(function (m, i) { return '<button type="button" class="btn' + (i ? '' : ' primary') + '" data-m="' + m[0] + '" aria-pressed="' + !i + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<p class="fz-note" data-help></p><div class="fz-card"><div class="pr-bar"><label class="btn primary" for="fo-xh">Choose file(s)</label><input type="file" id="fo-xh" class="sr" multiple accept=".xlsx,.xls,.xlsm,.ods,.csv,.txt" data-file></div>' +
      '<ul class="fo-files" data-list></ul><div data-opts></div></div><div data-res aria-live="polite"></div>');
    var mode = 'join', T = [];   /* T: tables {file, sheet, rows, on} */
    var HELP = { join: 'Choose several Excel or CSV files. Every sheet you tick is put one below the other in one sheet. Columns are matched by their heading, so the order of columns may differ. The first row of each sheet must be the headings.',
      split: 'Choose one file. Pick a column (such as Party). You get one file for each value, or one workbook with a sheet for each value.',
      dup: 'Choose one file. Rows that repeat in the columns you tick are removed; the first one stays.',
      conv: 'Choose .csv files to get Excel files, or Excel files to get one .csv file for each sheet.' };
    function setMode(m) { mode = m; $$('[data-m]', n).forEach(function (b) { var on = b.getAttribute('data-m') === m; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', on); }); $('[data-help]', n).textContent = HELP[m]; $('[data-file]', n).multiple = m === 'join' || m === 'conv'; T = []; paint(); }
    $$('[data-m]', n).forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-m')); }); });
    $('[data-file]', n).addEventListener('change', function (e) {
      var fl = [].slice.call(e.target.files); e.target.value = ''; if (!fl.length) return;
      if (mode === 'split' || mode === 'dup') T = [];
      Promise.all(fl.map(function (f) { return readBook(f).catch(function (er) { if (er && er.message === 'load') throw er; NS.toast(f.name + ' could not be read.', 'bad'); return []; }); })).then(function (all) {
        all.forEach(function (sh) { sh.forEach(function (s) { s.on = s.rows.length > 0; T.push(s); }); });
        if (mode === 'split' || mode === 'dup') { var f = -1; T.forEach(function (t, i) { if (t.on && f < 0) f = i; t.on = i === f; }); }
        paint();
      }).catch(libFail);
    });
    function cur() { return T.filter(function (t) { return t.on; })[0]; }
    function paint() {
      var one = mode === 'split' || mode === 'dup';
      $('[data-list]', n).innerHTML = T.map(function (t, i) { return '<li><label class="fz-chk"><input type="' + (one ? 'radio' : 'checkbox') + '" name="fo-xhsel" data-on="' + i + '"' + (t.on ? ' checked' : '') + (mode === 'conv' ? ' disabled' : '') + '> <span>' + esc(t.file) + ' › ' + esc(t.sheet) + '</span></label><span class="fz-note">' + Math.max(0, t.rows.length - 1) + ' rows</span>' + (one ? '' : '<button type="button" class="btn sm" data-del="' + i + '">Remove</button>') + '</li>'; }).join('');
      var o = $('[data-opts]', n), t = cur(); $('[data-res]', n).innerHTML = '';
      if (!T.length) { o.innerHTML = ''; return; }
      if (mode === 'join') o.innerHTML = '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-src checked> Add the file and sheet name to each row</label></div><div class="pr-bar"><button type="button" class="btn primary" data-go>Join into one sheet</button></div>';
      else if (mode === 'split') o.innerHTML = t ? '<div class="fz-row"><label>Split by <select data-col>' + colOpts(t.rows[0] || [], Math.max(0, guess(t.rows[0] || [], /party|name|customer|supplier|ledger|state/i))) + '</select></label><label>Give me <select data-as><option value="zip">One file for each value (zip)</option><option value="book">One workbook, a sheet for each value</option></select></label></div><div class="pr-bar"><button type="button" class="btn primary" data-go>Split</button></div>' : '';
      else if (mode === 'dup') o.innerHTML = t ? '<p class="fz-note">Rows are the same when these columns match (tick none to compare whole rows):</p><div class="fo-chips">' + (t.rows[0] || []).map(function (h, i) { return '<label><input type="checkbox" data-dc="' + i + '"> ' + esc(h || ('Column ' + (i + 1))) + '</label>'; }).join('') + '</div><div class="fz-row"><label class="fz-chk"><input type="checkbox" data-loose checked> Ignore capitals, spaces and signs</label></div><div class="pr-bar"><button type="button" class="btn primary" data-go>Remove duplicates</button></div>' : '';
      else o.innerHTML = '<div class="pr-bar"><button type="button" class="btn primary" data-go>Convert</button></div>';
      var g = $('[data-go]', n); if (g) g.addEventListener('click', go);
    }
    $('[data-list]', n).addEventListener('change', function (e) { var i = e.target.getAttribute('data-on'); if (i == null) return; if (mode === 'split' || mode === 'dup') T.forEach(function (t, k) { t.on = k === +i; }); else T[+i].on = e.target.checked; paint(); });
    $('[data-list]', n).addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-del]'); if (!b) return; T.splice(+b.getAttribute('data-del'), 1); paint(); });
    function res(html) { $('[data-res]', n).innerHTML = html; }
    function safe(s) { return String(s).replace(/[\\/:*?"<>|]+/g, '-').replace(/^\.+/, '').slice(0, 80) || 'blank'; }
    function go() {
      xlLib().then(function (X) {
        var on = T.filter(function (t) { return t.on && t.rows.length; });
        if (mode === 'join') {
          if (!on.length) { NS.toast('Tick at least one sheet.', 'bad'); return; }
          var rows = joinTables(on, { src: $('[data-src]', n).checked });
          NS.saveFile(bookBlob(X, [['Joined', rows]]), 'joined-' + today() + '.xlsx');
          res('<p class="fz-ok">Joined ' + on.length + (on.length === 1 ? ' sheet: ' : ' sheets: ') + (rows.length - 1) + ' rows, ' + rows[0].length + ' columns.</p>' + preview(rows));
        } else if (mode === 'split') {
          var t = on[0]; if (!t) return; var c = +$('[data-col]', n).value, g = splitBy(t.rows.slice(1), c), H = t.rows[0];
          if (!g.length) { NS.toast('No rows to split.', 'bad'); return; }
          var parts = g.map(function (x) { return [x[0], [H].concat(x[1].map(function (i) { return t.rows[i + 1]; }))]; });
          if ($('[data-as]', n).value === 'book') NS.saveFile(bookBlob(X, parts), 'split-' + today() + '.xlsx');
          else FT.zip(parts.map(function (p) { return { name: safe(p[0]) + '.xlsx', blob: bookBlob(X, [[p[0], p[1]]]) }; })).then(function (z) { NS.saveFile(z, 'split-' + today() + '.zip'); });
          res('<p class="fz-ok">' + g.length + ' parts made from ' + (t.rows.length - 1) + ' rows.</p><div class="fo-tbl"><table><thead><tr><th scope="col">' + esc(H[c] || 'Value') + '</th><th scope="col">Rows</th></tr></thead><tbody>' + g.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td>' + x[1].length + '</td></tr>'; }).join('') + '</tbody></table></div>');
        } else if (mode === 'dup') {
          var u = on[0]; if (!u) return; var cs = $$('[data-dc]', n).filter(function (b) { return b.checked; }).map(function (b) { return +b.getAttribute('data-dc'); }), d = dedupe(u.rows.slice(1), cs, { loose: $('[data-loose]', n).checked });
          var out = [u.rows[0]].concat(d.keep.map(function (i) { return u.rows[i + 1]; })), gone = [u.rows[0]].concat(d.gone.map(function (i) { return u.rows[i + 1]; }));
          NS.saveFile(bookBlob(X, [['Without duplicates', out], ['Removed rows', gone]]), safe(u.file.replace(/\.[^.]+$/, '')) + ' - no duplicates.xlsx');
          res('<p class="fz-ok">' + d.gone.length + ' repeated ' + (d.gone.length === 1 ? 'row' : 'rows') + ' removed, ' + d.keep.length + ' kept. The removed rows are in the second sheet.</p>');
        } else {
          var files = [];
          T.forEach(function (t) {
            var base = safe(t.file.replace(/\.[^.]+$/, ''));
            if (/\.(csv|txt|tsv)$/i.test(t.file)) files.push({ name: base + '.xlsx', blob: bookBlob(X, [[base, t.rows]]) });
            else files.push({ name: base + (T.filter(function (x) { return x.file === t.file; }).length > 1 ? ' - ' + safe(t.sheet) : '') + '.csv', blob: new Blob(['﻿' + csv(t.rows)], { type: 'text/csv' }) });
          });
          if (!files.length) return;
          if (files.length === 1) NS.saveFile(files[0].blob, files[0].name); else FT.zip(files).then(function (z) { NS.saveFile(z, 'converted-' + today() + '.zip'); });
          res('<p class="fz-ok">' + files.length + (files.length === 1 ? ' file made: ' : ' files made: ') + files.map(function (f) { return esc(f.name); }).join(', ') + '</p><p class="fz-note">CSV files are saved as UTF-8, so Hindi and other scripts stay readable in Excel.</p>');
        }
      }).catch(libFail);
    }
    setMode('join'); return n;
  }

  /* ---------- 7. WhatsApp link ---------- */
  var TPL = [['', 'Write my own'],
    ['pay', 'Payment reminder', 'Dear {name}, this is a gentle reminder that ₹{amt} against bill no. {bill} is due on {date}. Kindly arrange the payment. Thank you. - {from}'],
    ['ready', 'Order ready', 'Dear {name}, your order {bill} is ready. You can collect it, or tell us a good time for delivery. - {from}'],
    ['thanks', 'Thank you for the payment', 'Dear {name}, we have received your payment of ₹{amt}. Thank you for your business. - {from}'],
    ['quote', 'Quotation sent', 'Dear {name}, we have sent you our quotation {bill}. Please let us know if you have any questions. - {from}'],
    ['visit', 'Thank you for visiting', 'Dear {name}, thank you for visiting us today. We look forward to serving you again. - {from}']];
  var BLANK = { name: 'name', amt: 'amount', bill: 'number', date: 'date', from: 'your name' };
  function waNode() {
    var n = tool('<h3>WhatsApp message link</h3><p class="soft">Make a link that opens a WhatsApp chat with your message already typed. The number is not saved anywhere.</p>' +
      '<div class="fz-card"><div class="fz-row"><label>Mobile number <input type="tel" inputmode="tel" data-num placeholder="98765 43210" autocomplete="off"></label><label>Ready message <select data-tpl>' + TPL.map(function (t) { return '<option value="' + t[0] + '">' + esc(t[1]) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="fz-row" data-fill hidden><label>Name <input type="text" data-f="name" autocomplete="off"></label><label>Amount ₹ <input type="text" inputmode="decimal" data-f="amt"></label><label>Bill / order no. <input type="text" data-f="bill"></label><label>Due date <input type="date" data-f="date"></label><label>From (your business) <input type="text" data-f="from"></label></div>' +
      '<label for="fo-wam"><b>Message</b></label><textarea class="fo-ta" id="fo-wam" data-msg rows="5" placeholder="Type your message"></textarea><p class="fz-note" data-numnote></p></div>' +
      '<div class="fz-card"><p class="fo-link" data-link></p><div class="pr-bar"><a class="btn primary" data-open target="_blank" rel="noopener">Open in WhatsApp</a><button type="button" class="btn" data-copy>Copy link</button><button type="button" class="btn" data-copymsg>Copy message</button><button type="button" class="btn" data-qrdl hidden>Download QR (PNG)</button></div>' +
      '<div data-qr class="fo-qr" role="img" aria-label="QR code of the link" hidden></div><p class="fz-note">Anyone who scans this QR code opens the same chat with the same message. Without a number, WhatsApp asks whom to send it to.</p></div>');
    try { var bid = NS.curBiz && NS.curBiz(); if (bid && W.NSStore) W.NSStore.get('biz', bid).then(function (b) { var f = $('[data-f="from"]', n); if (b && !f.value) { f.value = b.name || b.trade || b.legal || ''; fill(); run(); } }, function () {}); } catch (e) {}
    function fill() {
      var k = $('[data-tpl]', n).value, t = TPL.filter(function (x) { return x[0] === k; })[0]; $('[data-fill]', n).hidden = !k; if (!k) return;
      var v = {}; $$('[data-f]', n).forEach(function (i) { var x = i.value.trim(); v[i.getAttribute('data-f')] = i.type === 'date' && ok(x) ? show(x, 1) : x; });
      $('[data-msg]', n).value = t[2].replace(/\{(\w+)\}/g, function (_, f) { return v[f] || '[' + BLANK[f] + ']'; }).replace(/ - \[your name\]$/, '');
    }
    var qrT = 0;
    function run() {
      var w = waNumber($('[data-num]', n).value), link = waLink(w.num, $('[data-msg]', n).value.trim());
      $('[data-numnote]', n).textContent = w.num ? 'Number used: +' + w.num + (w.note ? '. ' + w.note : '') : 'No number: WhatsApp will ask whom to send it to.';
      $('[data-link]', n).textContent = link; $('[data-open]', n).href = link;
      clearTimeout(qrT); qrT = setTimeout(function () { drawQr(link); }, 250);
    }
    function drawQr(link) {
      NS.loadJs(QR).then(function () {
        var q = W.qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(link))); q.make();   /* qrcode-generator 1.4.4 takes a byte string: the UTF-8 bytes of the link */
        var box = $('[data-qr]', n); box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); box.hidden = false; $('[data-qrdl]', n).hidden = false; box._q = q;
      }).catch(function () { $('[data-qr]', n).hidden = true; $('[data-qrdl]', n).hidden = true; });
    }
    $('[data-tpl]', n).addEventListener('change', function () { fill(); run(); });
    $$('[data-f]', n).forEach(function (i) { i.addEventListener('input', function () { fill(); run(); }); });
    $('[data-num]', n).addEventListener('input', run); $('[data-msg]', n).addEventListener('input', run);
    $('[data-copy]', n).addEventListener('click', function () { copyText($('[data-link]', n).textContent); });
    $('[data-copymsg]', n).addEventListener('click', function () { copyText($('[data-msg]', n).value); });
    $('[data-qrdl]', n).addEventListener('click', function () {
      var q = $('[data-qr]', n)._q; if (!q) return; var c = q.getModuleCount(), s = 10, m = 4, cv = document.createElement('canvas'); cv.width = cv.height = (c + 2 * m) * s;
      var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#000';
      for (var r = 0; r < c; r++) for (var k = 0; k < c; k++) if (q.isDark(r, k)) x.fillRect((k + m) * s, (r + m) * s, s, s);
      cv.toBlob(function (b) { NS.saveFile(b, 'whatsapp-qr.png'); }, 'image/png');
    });
    run(); return n;
  }

  FT.add('chequebounce', 'Cheque bounce dates', 'legal', chqNode);
  FT.add('limitation', 'Limitation dates', 'legal', limNode);
  FT.add('datecalc', 'Date calculator', 'legal', dateNode);
  FT.add('courtfee', 'Court fee', 'legal', feeNode);
  FT.add('listcompare', 'Compare two lists', 'data', cmpNode);
  FT.add('excelhelp', 'Excel helpers', 'data', xhNode);
  FT.add('walink', 'WhatsApp link', 'share', waNode);
}).call(this);
