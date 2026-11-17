/* NS warrcore (India plan D, 2026-11-17): warranty and service-due tracking for sellers of electronics, mobiles and appliances. PURE functions.
   Data (nothing new is stored): bill lines carry the optional fields  it.warr = warranty in months,  it.svcm = service every N months (0 / empty = none),
   it.serial = serial / IMEI numbers (comma separated; the stock screens already use this field). Sale documents of type invoice, cashmemo and pos (the
   App's bills) are read; a job card (type 'job', site job-card) whose serial equals a sold serial counts as that unit's last service visit.
   Rules: warranty ends on the same day-of-month `warr` months after the bill date (the last day of a shorter month); a unit with a credit note that
   lists its serial is treated as returned and left out; the next service is `svcm` months after the last visit (or the bill) and is listed only while
   it falls inside the warranty period. What the warranty covers is the seller's own promise, printed on his bill; this file only counts dates.
   Tests: node scripts/test_warr.js */
(function (G) {
  'use strict';
  function num(v) { v = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(v) ? v : 0; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var SALE = { invoice: 1, cashmemo: 1, pos: 1 };
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function lastDay(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function addMonths(date, n) {
    var y = +date.slice(0, 4), m = +date.slice(5, 7) - 1 + Math.round(n), d = +date.slice(8, 10);
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return iso(y, m + 1, Math.min(d, lastDay(y, m + 1)));
  }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function serialsOf(it) { return String(it && it.serial || '').split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function digits(s) { return String(s || '').replace(/\D/g, '').slice(-10); }

  /* every warranty unit: one record per serial (or one per line without serials) */
  function records(docs, biz, today) {
    var b = key(biz), jobs = {}, returned = {}, out = [];
    (docs || []).forEach(function (d) {
      if (d.type === 'job' && d.serial) { var k = key(d.serial), v = jobs[k] || (jobs[k] = []); v.push({ date: d.date, no: d.no, id: d.id }); }
      if (d.type === 'note' && d.kind !== 'debit' && d.side !== 'purchase') (d.items || []).forEach(function (it) { serialsOf(it).forEach(function (s) { returned[key(s)] = d.date || '1'; }); });
    });
    (docs || []).forEach(function (d) {
      if (!SALE[d.type] || key(d.seller && d.seller.name) !== b || !d.date || d.status === 'cancelled') return;
      (d.items || []).forEach(function (it, i) {
        var m = Math.floor(num(it.warr)); if (!(m > 0)) return;
        var sn = serialsOf(it), list = sn.length ? sn : [''];
        list.forEach(function (s, j) {
          if (s && returned[key(s)] && returned[key(s)] >= d.date) return;
          var end = addMonths(d.date, m), svcm = Math.floor(num(it.svcm));
          var visits = s ? (jobs[key(s)] || []).filter(function (x) { return x.date >= d.date; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; }) : [];
          var last = visits.length ? visits[visits.length - 1].date : '', base = last && last > d.date ? last : d.date, next = svcm > 0 ? addMonths(base, svcm) : '';
          if (next && next > end) next = '';
          var by = d.buyer || {};
          out.push({ id: d.id + '#' + i + '#' + j, doc: d, docNo: d.no || '', date: d.date, cust: String(by.name || '').trim(), phone: by.phone || '', item: it.desc || '', sn: s, months: m, end: end, svcm: svcm,
            lastVisit: last, visits: visits, next: next, daysEnd: daysBetween(today, end), daysSvc: next ? daysBetween(today, next) : null });
        });
      });
    });
    return out.sort(function (a, c) { return a.end < c.end ? -1 : a.end > c.end ? 1 : 0; });
  }
  /* warranty bucket of a record: expired, 30, 60, 90 or later (days left) */
  function bucket(r) { return r.daysEnd < 0 ? 'expired' : r.daysEnd <= 30 ? '30' : r.daysEnd <= 60 ? '60' : r.daysEnd <= 90 ? '90' : 'later'; }
  function svcBucket(r) { return !r.next ? '' : r.daysSvc < 0 ? 'overdue' : r.daysSvc <= 30 ? '30' : r.daysSvc <= 60 ? '60' : r.daysSvc <= 90 ? '90' : 'later'; }
  /* counts for the tiles and the filter chips (e30 = warranty ends within 30 days, e60 within 60, ...; same for service s30...) */
  function counts(recs) {
    var c = { all: recs.length, expired: 0, e30: 0, e60: 0, e90: 0, active: 0, overdue: 0, s30: 0, s60: 0, s90: 0 };
    recs.forEach(function (r) {
      var b = bucket(r), s = svcBucket(r);
      if (b === 'expired') c.expired++; else { c.active++; if (b === '30') c.e30++; if (b === '30' || b === '60') c.e60++; if (b !== 'later') c.e90++; }
      if (s === 'overdue') c.overdue++;
      if (s === '30') c.s30++; if (s === '30' || s === '60') c.s60++; if (s === '30' || s === '60' || s === '90') c.s90++;
    });
    return c;
  }
  /* view: 'all' | 'active' | 'expired' | 'e30' | 'e60' | 'e90' | 'overdue' | 's30' | 's60' | 's90' */
  function filter(recs, view) {
    return recs.filter(function (r) {
      var b = bucket(r), s = svcBucket(r);
      switch (view) {
        case 'active': return b !== 'expired';
        case 'expired': return b === 'expired';
        case 'e30': return b === '30';
        case 'e60': return b === '30' || b === '60';
        case 'e90': return b === '30' || b === '60' || b === '90';
        case 'overdue': return s === 'overdue';
        case 's30': return s === '30';
        case 's60': return s === '30' || s === '60';
        case 's90': return s === '30' || s === '60' || s === '90';
        default: return true;
      }
    });
  }
  /* look-up: serial / IMEI (any part, 3+ characters), phone (4+ digits), customer name, bill number or item */
  function lookup(recs, q) {
    q = String(q || '').trim(); if (q.length < 3) return [];
    var k = key(q), dg = q.replace(/\D/g, '');
    return recs.filter(function (r) {
      if (r.sn && key(r.sn).indexOf(k) >= 0) return true;
      if (dg.length >= 4 && digits(r.phone) && digits(r.phone).indexOf(dg.slice(-10)) >= 0) return true;
      return key(r.cust).indexOf(k) >= 0 || key(r.docNo).indexOf(k) >= 0 || key(r.item).indexOf(k) >= 0;
    });
  }
  function fmt(d) { return d ? d.slice(8, 10) + '-' + d.slice(5, 7) + '-' + d.slice(0, 4) : ''; }
  /* WhatsApp texts (shown to the seller to edit; the App sends nothing itself) */
  function text(kind, r, shop) {
    var what = r.item + (r.sn ? ' (S/N ' + r.sn + ')' : ''), hi = 'Hello ' + (r.cust || ''), by = shop ? ' ' + shop : '';
    if (kind === 'service') return hi + ', your ' + what + ' is due for its service' + (r.next ? ' on ' + fmt(r.next) : '') + '. Please call or visit us to book it.' + by;
    if (kind === 'expired') return hi + ', the warranty of your ' + what + ' ended on ' + fmt(r.end) + '. We are happy to help with a repair or an extended plan.' + by;
    return hi + ', the warranty of your ' + what + ' ends on ' + fmt(r.end) + '. If anything needs checking, please bring it in before that date.' + by;
  }
  function toCsv(rows) {
    return rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v) && isNaN(+v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
  }
  /* the line printed under an item on the bill */
  function lineNote(it) {
    var m = Math.floor(num(it && it.warr)); if (!(m > 0)) return '';
    var s = Math.floor(num(it.svcm));
    return 'Warranty: ' + m + ' month' + (m === 1 ? '' : 's') + (s > 0 ? ' · service every ' + s + ' months' : '');
  }

  var API = { num: num, key: key, addMonths: addMonths, daysBetween: daysBetween, serialsOf: serialsOf, records: records, bucket: bucket, svcBucket: svcBucket, counts: counts, filter: filter, lookup: lookup, text: text, fmt: fmt, toCsv: toCsv, lineNote: lineNote };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSWarr = API;
})(this);
