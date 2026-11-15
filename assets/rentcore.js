/* NSRent: the pure logic of rent.niveshsahayak.in (property units, tenancies, monthly rent bills, dues, agreement end dates).
   A unit is an item master of the shared data home (store 'item') with runit:1:
     { desc:'Model Town Plaza – Shop 12', prop:'Model Town Plaza', unit:'Shop 12', use:'com'|'res', rate:'15000' (monthly rent), maint:'500', runit:1, hsn:'997212', unit_:'Month' }
   One record of store 'doc', type 'rentb', is one monthly (or several months) rent bill / receipt of one tenancy; it also carries the tenancy's terms
   (agStart, agEnd, rent at the start date, yearly increase, due day, deposit, GST mode), so the latest record of a tenant is the current agreement.
   Months are 'yyyy-mm'. Tests: node scripts/test_rent.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function isYm(s) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(s || ''); }
  function ym(s) { return isDate(s) ? s.slice(0, 7) : isYm(s) ? s : ''; }
  function mi(m) { return +m.slice(0, 4) * 12 + (+m.slice(5, 7) - 1); }
  function fromMi(i) { var y = Math.floor(i / 12), m = i % 12 + 1; return y + '-' + (m < 10 ? '0' : '') + m; }
  function addMonth(m, k) { return isYm(m) ? fromMi(mi(m) + k) : ''; }
  function monthDiff(a, b) { return isYm(a) && isYm(b) ? mi(b) - mi(a) : 0; }
  function monthsList(a, b) { var out = []; if (!isYm(a) || !isYm(b) || b < a || monthDiff(a, b) > 119) return out; for (var m = a; m <= b; m = addMonth(m, 1)) out.push(m); return out; }
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function label(m) { return isYm(m) ? MN[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4) : ''; }
  function ms(s) { return Date.parse(s + 'T00:00:00Z'); }
  function diffDays(a, b) { return Math.round((ms(b) - ms(a)) / 86400000); }

  /* rent of one month: the rent at the start date, raised by the yearly percentage at every anniversary month of the start (kept to paise) */
  function rentFor(t, m) {
    var base = n(t.rent), st = ym(t.agStart), pct = n(t.esc);
    if (!(base > 0) || !isYm(m)) return 0;
    if (!st || !(pct > 0) || m < st) return r2(base);
    return r2(base * Math.pow(1 + pct / 100, Math.floor(monthDiff(st, m) / 12)));
  }
  /* lines of the bill: rent of the months (months with the same rent joined in one line), maintenance, typed extra charges */
  function lines(d) {
    var months = monthsList(d.mFrom, d.mTo || d.mFrom), out = [], where = [String(d.prop || '').trim(), String(d.unit || '').trim()].filter(Boolean).join(', ');
    var sac = d.use === 'res' ? '997211' : '997212', g = d.gstMode === 'fwd' ? (d.gstRate === '' || d.gstRate == null ? 18 : n(d.gstRate)) : 0, run = null;
    function flush() {
      if (!run) return;
      out.push({ kind: 'rent', desc: 'Rent' + (where ? ' of ' + where : '') + ' for ' + (run.count > 1 ? label(run.from) + ' to ' + label(run.to) : label(run.from)), hsn: sac, unit: 'Month', qty: run.count, rate: run.rate, gst: g });
      run = null;
    }
    months.forEach(function (m) {
      var r = rentFor(d, m);
      if (run && run.rate === r) { run.count++; run.to = m; } else { flush(); run = { from: m, to: m, count: 1, rate: r }; }
    });
    flush();
    if (n(d.maint) > 0 && months.length) out.push({ kind: 'maint', desc: 'Maintenance charges for ' + (months.length > 1 ? label(months[0]) + ' to ' + label(months[months.length - 1]) : label(months[0])), hsn: sac, unit: 'Month', qty: months.length, rate: n(d.maint), gst: g });
    (d.extras || []).forEach(function (x) {
      if (!String(x.desc || '').trim() && !n(x.rate)) return;
      out.push({ kind: 'extra', desc: String(x.desc || '').trim(), hsn: String(x.hsn || sac).trim(), unit: '', qty: x.qty === '' || x.qty == null ? 1 : n(x.qty), rate: n(x.rate), gst: d.gstMode === 'fwd' ? (x.gst === '' || x.gst == null ? g : n(x.gst)) : 0 });
    });
    return out;
  }
  function sums(d, intra) {
    var o = { rows: [], rent: 0, extras: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, months: monthsList(d.mFrom, d.mTo || d.mFrom).length };
    lines(d).forEach(function (l) {
      var v = r2(l.qty * l.rate), tx = r2(v * l.gst / 100);
      o.rows.push({ l: l, value: v, g: l.gst, tax: tx }); o[l.kind === 'extra' ? 'extras' : 'rent'] += v; o.taxable += v; o.tax += tx;
    });
    ['rent', 'extras', 'taxable', 'tax'].forEach(function (k) { o[k] = r2(o[k]); });
    if (intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    o.due = d.paid === 'paid' ? 0 : o.total;
    return o;
  }
  /* the schedule printed with the agreement: month, rent, maintenance (n months from the start) */
  function schedule(d, count) {
    var st = ym(d.agStart) || ym(d.date), out = [];
    for (var i = 0; i < (count || 12) && st; i++) { var m = addMonth(st, i); out.push({ month: m, rent: rentFor(d, m), maint: n(d.maint) }); }
    return out;
  }

  /* units (property rooms and shops) from the item masters */
  function unitsOf(items) {
    return (items || []).filter(function (x) { return x && x.runit && String(x.unit || '').trim(); })
      .sort(function (a, b) { return key(a.prop).localeCompare(key(b.prop)) || String(a.unit).localeCompare(String(b.unit), 'en', { numeric: true }); });
  }
  function unitName(prop, unit) { return [String(prop || '').trim(), String(unit || '').trim()].filter(Boolean).join(' – '); }
  function cleanUnit(x) {
    var unit = String((x && x.unit) || '').trim().replace(/\s+/g, ' '), prop = String((x && x.prop) || '').trim().replace(/\s+/g, ' ');
    if (!unit || unit.length > 40 || prop.length > 60) return null;
    return { prop: prop, unit: unit, use: x && x.use === 'res' ? 'res' : 'com', rent: n(x && x.rent) > 0 ? String(r2(n(x.rent))) : '', maint: n(x && x.maint) > 0 ? String(r2(n(x.maint))) : '' };
  }
  function clash(units, c, editId) { var k = key(unitName(c.prop, c.unit)); return (units || []).some(function (u) { return key(unitName(u.prop, u.unit)) === k && u.id !== editId; }); }
  function toRecord(c, items, editId) {
    var k = key(unitName(c.prop, c.unit)), hit = (items || []).filter(function (x) { return x && x.runit && (editId ? x.id === editId : key(unitName(x.prop, x.unit)) === k); })[0] || {};
    return Object.assign({}, hit, { desc: unitName(c.prop, c.unit), prop: c.prop, unit: c.unit, use: c.use, rate: c.rent, price: c.rent, maint: c.maint, runit: 1, hsn: c.use === 'res' ? '997211' : '997212', kind: 'service', gst: '' });
  }

  /* tenancies from the saved records of one landlord. A tenancy = landlord + property + unit + tenant; its latest record gives the terms. */
  function tkey(d) { return [key(d.seller && d.seller.name), key(d.prop), key(d.unit), key(d.buyer && d.buyer.name)].join('|'); }
  function isBill(d) { return d.print === 'bill'; }
  function dueUpTo(today, dueDay) { var day = +String(today).slice(8, 10), dd = Math.min(28, Math.max(1, Math.round(n(dueDay)) || 1)); return day >= dd ? ym(today) : addMonth(ym(today), -1); }
  function tenancies(docs, today) {
    var by = {};
    (docs || []).forEach(function (d) { if (d && d.type === 'rentb') (by[tkey(d)] = by[tkey(d)] || []).push(d); });
    return Object.keys(by).map(function (k) {
      var recs = by[k], bills = recs.filter(isBill);
      var last = recs.slice().sort(function (a, b) { return String(a.agStart || '').localeCompare(String(b.agStart || '')) || String(a.date || '').localeCompare(String(b.date || '')) || (a.updated || 0) - (b.updated || 0); }).pop();
      var billed = {}, unpaid = [], unpaidAmt = 0, collected = 0;
      bills.forEach(function (b) {
        monthsList(b.mFrom, b.mTo || b.mFrom).forEach(function (m) { billed[m] = 1; });
        if (b.paid === 'paid') collected += n(b.total); else { unpaid.push(b); unpaidAmt += n(b.total); }
      });
      var billedList = Object.keys(billed).sort(), cur = ym(today);
      var left = last.tstat === 'left', endDays = isDate(last.agEnd) ? diffDays(today, last.agEnd) : null;
      var ended = left || (endDays !== null && endDays < 0);
      var first = billedList[0] || (function () { var s = ym(last.agStart), r = ym(recs.map(function (x) { return x.date || ''; }).sort()[0]); return s && r ? (s > r ? s : r) : s || r; })();
      var upto = dueUpTo(today, last.dueDay); if (isDate(last.agEnd) && ym(last.agEnd) < upto) upto = ym(last.agEnd);
      var dueMonths = !ended && first ? monthsList(first, upto).filter(function (m) { return !billed[m]; }) : [];
      var owed = dueMonths.reduce(function (a, m) { return a + rentFor(last, m) + n(last.maint); }, 0);
      return { key: k, last: last, recs: recs, tenant: last.buyer && last.buyer.name || '', prop: last.prop || '', unit: last.unit || '', rentNow: rentFor(last, cur), maint: n(last.maint), deposit: n(last.deposit),
        billedTo: billedList.length ? billedList[billedList.length - 1] : '', dueMonths: dueMonths, owed: r2(owed), unpaid: unpaid, unpaidAmt: r2(unpaidAmt), collected: r2(collected),
        endDays: endDays, ended: ended, left: left, expiring: !ended && endDays !== null && endDays <= 60, nextMonth: dueMonths.length ? dueMonths[0] : billedList.length ? addMonth(billedList[billedList.length - 1], 1) : first || cur };
    }).sort(function (a, b) { return key(a.prop).localeCompare(key(b.prop)) || String(a.unit).localeCompare(String(b.unit), 'en', { numeric: true }); });
  }
  /* which master units have a live tenancy: [{ unit, tenancy|null }] */
  function occupancy(units, tens) {
    var live = {}; (tens || []).forEach(function (t) { if (!t.ended) live[key(unitName(t.prop, t.unit))] = t; });
    return (units || []).map(function (u) { return { unit: u, tenancy: live[key(unitName(u.prop, u.unit))] || null }; });
  }
  function summary(tens, units) {
    var o = { active: 0, left: 0, vacant: 0, expiring: 0, owed: 0, unpaid: 0, tenanciesDue: 0 };
    (tens || []).forEach(function (t) { if (t.ended) o.left++; else o.active++; if (t.expiring) o.expiring++; o.owed += t.owed; o.unpaid += t.unpaidAmt; if (t.dueMonths.length || t.unpaid.length) o.tenanciesDue++; });
    o.vacant = (units || []).length ? occupancy(units, tens).filter(function (x) { return !x.tenancy; }).length : 0;
    o.owed = r2(o.owed); o.unpaid = r2(o.unpaid); return o;
  }

  function csv(rows) {
    return '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c).replace(/\r?\n/g, ' '); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
  }
  function tenancyRows(tens) {
    return [['Property', 'Unit', 'Tenant', 'Phone', 'Agreement start', 'Agreement end', 'Rent now', 'Maintenance', 'Deposit', 'Billed up to', 'Months not billed', 'Unpaid bills', 'Status']].concat((tens || []).map(function (t) {
      return [t.prop, t.unit, t.tenant, t.last.buyer && t.last.buyer.phone, t.last.agStart, t.last.agEnd, t.rentNow, t.maint, t.deposit, t.billedTo, t.dueMonths.length, t.unpaidAmt, t.ended ? (t.left ? 'Left' : 'Ended') : t.expiring ? 'Ending soon' : 'Active'];
    }));
  }
  function billRows(docs) {
    return [['Bill no.', 'Date', 'Property', 'Unit', 'Tenant', 'From month', 'To month', 'Total', 'Paid', 'Paid on', 'Mode']].concat((docs || []).filter(function (d) { return d.type === 'rentb' && isBill(d); })
      .sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')) || String(a.no || '').localeCompare(String(b.no || '')); })
      .map(function (d) { return [d.no, d.date, d.prop, d.unit, d.buyer && d.buyer.name, d.mFrom, d.mTo || d.mFrom, n(d.total), d.paid === 'paid' ? 'Yes' : 'No', d.paid === 'paid' ? d.paidOn : '', d.paid === 'paid' ? d.payMode : '']; }));
  }

  var API = { key: key, n: n, r2: r2, isDate: isDate, isYm: isYm, ym: ym, addMonth: addMonth, monthDiff: monthDiff, monthsList: monthsList, label: label, diffDays: diffDays, rentFor: rentFor, lines: lines, sums: sums, schedule: schedule,
    unitsOf: unitsOf, unitName: unitName, cleanUnit: cleanUnit, clash: clash, toRecord: toRecord, tkey: tkey, dueUpTo: dueUpTo, tenancies: tenancies, occupancy: occupancy, summary: summary, csv: csv, tenancyRows: tenancyRows, billRows: billRows };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSRent = API;
})(this);
