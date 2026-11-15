/* NSGarage: the pure logic of garage.niveshsahayak.in (vehicle service history and next-service reminders).
   Nothing extra is stored: a vehicle is "every garage job card (doc type 'gjob') with the same registration number" of one business,
   so the history, the last odometer reading and the next-service reminder are worked out from the saved job cards. The reminder of a
   vehicle is the one on its newest job marked as a periodic service (svc:true), which carries nextDate and/or nextKm.
   Job card fields used: reg, make, model, year, fuel, odo, svc, nextDate, nextKm, intMonths, intKm, jstat, print, date, total,
   buyer{name,phone}, items[]. No server: due lists are worked out when the page opens and shared as WhatsApp text.
   Tests: node scripts/test_garage.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function pad(x) { return String(x).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function addDays(s, k) { var d = parse(s); if (!d) return ''; d.setDate(d.getDate() + k); return iso(d); }
  function addMonths(s, k) {
    var p = String(s || '').split('-'); if (p.length !== 3) return '';
    var y = +p[0], m = +p[1] - 1 + k, day = +p[2]; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + pad(m + 1) + '-' + pad(Math.min(day, new Date(y, m + 1, 0).getDate()));
  }
  function days(a, b) { var x = parse(a), y = parse(b); return x && y ? Math.round((y - x) / 864e5) : 0; }   /* b - a */

  /* "pb 10 ab-1234" and "PB10AB1234" are one vehicle */
  function normReg(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  /* shown with the letters grouped as typed; only a clean Indian format is spaced: PB10AB1234 -> PB 10 AB 1234 */
  function showReg(s) {
    var r = normReg(s), m = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/.exec(r);
    return m ? m[1] + ' ' + m[2] + ' ' + m[3] + ' ' + m[4] : String(s || '').trim().toUpperCase();
  }
  function mine(d, who) { return d && d.type === 'gjob' && (!who || key(d.seller && d.seller.name) === key(who)); }
  function byNew(a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || n(b.odo) - n(a.odo) || (b.updated || 0) - (a.updated || 0); }

  /* every job card of one vehicle of this business, newest first */
  function history(docs, reg, who) {
    var r = normReg(reg); if (!r) return [];
    return (docs || []).filter(function (d) { return mine(d, who) && normReg(d.reg) === r; }).sort(byNew);
  }
  /* the next service to suggest from a job's date and odometer and the chosen intervals (months and/or km); empty when no interval */
  function suggestNext(d) {
    var mo = n(d.intMonths), km = n(d.intKm), o = n(d.odo);
    return { nextDate: mo > 0 && d.date ? addMonths(d.date, Math.round(mo)) : '', nextKm: km > 0 && o > 0 ? Math.round(o + km) : '' };
  }
  /* average km driven a day from the odometer readings of two or more visits at least 30 days apart; 0 when it cannot be told */
  function kmPerDay(jobs) {
    var pts = (jobs || []).filter(function (j) { return n(j.odo) > 0 && j.date; }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    if (pts.length < 2) return 0;
    var a = pts[0], b = pts[pts.length - 1], dd = days(a.date, b.date), dk = n(b.odo) - n(a.odo);
    return dd >= 30 && dk > 0 ? dk / dd : 0;
  }
  /* one row per vehicle: details from its newest job, last visit, highest odometer, reminder from its newest periodic service */
  function vehicles(docs, who) {
    var by = {};
    (docs || []).filter(function (d) { return mine(d, who) && normReg(d.reg); }).forEach(function (d) { (by[normReg(d.reg)] = by[normReg(d.reg)] || []).push(d); });
    return Object.keys(by).map(function (r) {
      var jobs = by[r].sort(byNew), last = jobs[0], svc = jobs.filter(function (j) { return j.svc && (j.nextDate || n(j.nextKm) > 0); })[0];
      var odos = jobs.map(function (j) { return n(j.odo); }), spent = 0;
      jobs.forEach(function (j) { if (j.print === 'bill') spent += n(j.total); });
      return { reg: r, show: showReg(last.reg), make: last.make || '', model: last.model || '', year: last.year || '', fuel: last.fuel || '',
        cust: last.buyer && last.buyer.name || '', phone: last.buyer && last.buyer.phone || '', jobs: jobs.length, lastDate: last.date || '', lastKm: Math.max.apply(null, odos),
        nextDate: svc ? svc.nextDate || '' : '', nextKm: svc ? n(svc.nextKm) : 0, svcDate: svc ? svc.date : '', svcNo: svc ? svc.no : '', kmDay: kmPerDay(jobs), spent: r2(spent) };
    }).sort(function (a, b) { return String(b.lastDate).localeCompare(String(a.lastDate)) || a.reg.localeCompare(b.reg); });
  }
  /* the service reminder list. o: { ahead: days before the date to list (15), kmWithin: km before the reading to list (500) }
     reasons: 'date' (due or overdue by date), 'km' (the highest odometer reading we know is within kmWithin of the target),
     'proj' (at the usual km a day the target km is reached by then). Returns rows with the vehicle, reasons, daysLate (positive = overdue),
     kmLeft and the date by which the service is expected, most urgent first. */
  function dueList(docs, today, who, o) {
    o = o || {}; var ahead = o.ahead != null ? o.ahead : 15, within = o.kmWithin != null ? o.kmWithin : 500, out = [];
    vehicles(docs, who).forEach(function (v) {
      if (!v.nextDate && !v.nextKm) return;
      var why = [], when = '', late = null, left = null;
      if (v.nextDate) { when = v.nextDate; late = days(v.nextDate, today); if (late >= -ahead) why.push('date'); }
      if (v.nextKm) {
        left = v.nextKm - v.lastKm;
        if (v.lastKm > 0 && left <= within) why.push('km');
        if (v.kmDay > 0 && v.lastKm > 0 && left > within) {
          var proj = addDays(v.lastDate, Math.ceil((v.nextKm - v.lastKm) / v.kmDay));
          if (proj <= addDays(today, ahead)) { why.push('proj'); if (!when || proj < when) when = proj; }
        }
      }
      if (!why.length) return;
      var urgent = late != null && why.indexOf('date') >= 0 ? late : (left != null && left <= 0 ? 0 : -ahead + 1);
      out.push({ v: v, why: why, when: when, daysLate: late, kmLeft: left, urgent: urgent });
    });
    return out.sort(function (a, b) { return b.urgent - a.urgent || a.v.reg.localeCompare(b.v.reg); });
  }
  /* WhatsApp text for one due vehicle (English; the owner may edit it before sending) */
  function reminderText(row, shop, fmtDate) {
    var v = row.v, fd = fmtDate || function (x) { return x; }, bits = [];
    if (v.nextDate) bits.push('on or before ' + fd(v.nextDate));
    if (v.nextKm) bits.push('at ' + v.nextKm.toLocaleString('en-IN') + ' km');
    return 'Hello ' + (v.cust || '') + ', your ' + ([v.make, v.model].filter(Boolean).join(' ') || 'vehicle') + ' (' + v.show + ') is due for its next service ' + bits.join(' or ') +
      (v.lastKm ? ' (last seen at ' + v.lastKm.toLocaleString('en-IN') + ' km on ' + fd(v.lastDate) + ')' : '') + '. Please book a slot.' + (shop ? ' ' + shop : '');
  }
  function phone10(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; }
  function waLink(row, shop, fmtDate) { var p = phone10(row.v.phone); return 'https://wa.me/' + (p ? '91' + p : '') + '?text=' + encodeURIComponent(reminderText(row, shop, fmtDate)); }
  /* CSV text (Excel opens it): cells quoted when they hold a comma, quote or line break */
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\r\n'); }
  function dueRows(list) {
    return [['Registration', 'Vehicle', 'Customer', 'Phone', 'Last visit', 'Last km', 'Next service date', 'Next service km', 'Reason', 'Days late']].concat(list.map(function (r) {
      return [r.v.show, [r.v.make, r.v.model].filter(Boolean).join(' '), r.v.cust, r.v.phone, r.v.lastDate, r.v.lastKm || '', r.v.nextDate, r.v.nextKm || '', r.why.join('+'), r.daysLate != null && r.daysLate > 0 ? r.daysLate : ''];
    }));
  }
  function vehicleRows(vs) {
    return [['Registration', 'Make', 'Model', 'Year', 'Fuel', 'Customer', 'Phone', 'Visits', 'Last visit', 'Last km', 'Next service date', 'Next service km', 'Billed (Rs)']].concat(vs.map(function (v) {
      return [v.show, v.make, v.model, v.year, v.fuel, v.cust, v.phone, v.jobs, v.lastDate, v.lastKm || '', v.nextDate, v.nextKm || '', v.spent];
    }));
  }
  function historyRows(jobs) {
    return [['Job no.', 'Date', 'Km', 'Status', 'Complaint', 'Work', 'Amount (Rs)']].concat(jobs.map(function (j) {
      return [j.no, j.date, j.odo || '', j.jstat || '', j.complaint || '', (j.items || []).filter(function (i) { return i.desc; }).map(function (i) { return i.desc; }).join('; '), j.print === 'bill' ? r2(n(j.total)) : ''];
    }));
  }
  /* the details a typed registration number can fill from its newest job (vehicle and owner), or null */
  function fillFrom(docs, reg, who) { var h = history(docs, reg, who)[0]; return h ? { make: h.make || '', model: h.model || '', year: h.year || '', fuel: h.fuel || '', buyer: h.buyer || null, last: h } : null; }

  var API = { key: key, normReg: normReg, showReg: showReg, history: history, suggestNext: suggestNext, kmPerDay: kmPerDay, vehicles: vehicles, dueList: dueList, reminderText: reminderText,
    waLink: waLink, phone10: phone10, csv: csv, dueRows: dueRows, vehicleRows: vehicleRows, historyRows: historyRows, fillFrom: fillFrom, addDays: addDays, addMonths: addMonths, days: days };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSGarage = API;
})(this);
