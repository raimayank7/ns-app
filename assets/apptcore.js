/* NSAppt (pure, no page): the shared appointment, booking and membership logic of the clinic site (clinic.niveshsahayak.in) and
   the salon, gym and coaching site (salon.niveshsahayak.in). Dates are 'YYYY-MM-DD' strings, times 'HH:MM'; every function works
   on plain records, so `node scripts/test_appt.js` tests it without a browser.
   Records live in the shared 'doc' store like every other record: type 'appt' (an appointment), 'pat' / 'mem' (a patient or a
   client, with the details the bill does not hold) and the site's own bill (type 'visit' or 'svc'). */
(function (root) {
  'use strict';
  var NSAppt = {};

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(s) { return String(s || '').trim().toLowerCase(); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }

  /* ---------- dates and times ---------- */
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function iso(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(s, n) { var d = parse(s); if (!d) return ''; d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function daysBetween(a, b) { var x = parse(a), y = parse(b); return x && y ? Math.round((y - x) / 864e5) : 0; }
  /* n months after s, the day kept where the month has it, else the last day of that month (31 Jan + 1 month = 28/29 Feb) */
  function addMonths(s, n) {
    var d = parse(s); if (!d) return '';
    var day = d.getUTCDate(), y = d.getUTCFullYear(), m = d.getUTCMonth() + n;
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return iso(new Date(Date.UTC(y, m, Math.min(day, last))));
  }
  function toMin(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
  function fromMin(n) { n = Math.max(0, Math.round(n)); return pad(Math.floor(n / 60) % 24) + ':' + pad(n % 60); }
  /* 'HH:MM' as 9:30 AM for screens and messages */
  function clock(t) { var n = toMin(t); if (n == null) return ''; var h = Math.floor(n / 60), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(n % 60) + ' ' + ap; }
  function age(dob, today) {
    var a = parse(dob), b = parse(today); if (!a || !b || b < a) return null;
    var y = b.getUTCFullYear() - a.getUTCFullYear();
    if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) y--;
    if (y >= 1) return { y: y, m: 0, text: y + ' y' };
    var m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() - (b.getUTCDate() < a.getUTCDate() ? 1 : 0);
    if (m >= 1) return { y: 0, m: m, text: m + ' m' };
    return { y: 0, m: 0, text: daysBetween(dob, today) + ' d' };
  }

  /* ---------- appointments ---------- */
  var STATUS = ['booked', 'arrived', 'done', 'cancelled', 'noshow'];
  /* a quick tap moves an appointment one step on its way; cancelled and no-show are chosen on purpose */
  function nextStatus(s) { return s === 'booked' ? 'arrived' : s === 'arrived' ? 'done' : s; }
  function live(a) { return a && a.status !== 'cancelled' && a.status !== 'noshow'; }
  function span(a) { var s = toMin(a.time); if (s == null) return null; return [s, s + Math.max(5, num(a.dur) || 15)]; }
  /* appointments that overlap a (same day, same person who serves: staff / doctor / chair; an empty name is one shared resource) */
  function conflicts(list, a) {
    var sa = span(a); if (!sa || !live(a)) return [];
    return (list || []).filter(function (b) {
      if (b === a || (a.id && b.id === a.id) || b.type !== 'appt' || !live(b) || b.date !== a.date || key(b.staff) !== key(a.staff)) return false;
      var sb = span(b); return sb && sa[0] < sb[1] && sb[0] < sa[1];
    });
  }
  /* free start times on a day: every `step` minutes from open to close where `dur` minutes fit; today skips what is past (now = 'HH:MM') */
  function freeSlots(list, date, o) {
    o = o || {};
    var open = toMin(o.open || '09:00'), close = toMin(o.close || '18:00'), step = Math.max(5, num(o.step) || 15), dur = Math.max(5, num(o.dur) || 15), out = [];
    if (open == null || close == null) return out;
    var now = o.now ? toMin(o.now) : null, blank = { type: 'appt', status: 'booked', date: date, staff: o.staff || '', dur: dur };
    for (var m = open; m + dur <= close; m += step) {
      if (now != null && o.today === date && m < now) continue;
      blank.time = fromMin(m);
      if (!conflicts(list, blank).length) out.push(blank.time);
    }
    return out;
  }
  /* the first free slot on `date` or the days after it (up to `days` days); null when none */
  function nextFree(list, date, o, days) {
    for (var i = 0; i < (days || 14); i++) {
      var d = addDays(date, i), s = freeSlots(list, d, o);
      if (s.length) return { date: d, time: s[0] };
    }
    return null;
  }
  function dayRows(list, date, site) {
    return (list || []).filter(function (a) { return a.type === 'appt' && a.date === date && (!site || !a.site || a.site === site); })
      .sort(function (a, b) { return (toMin(a.time) == null ? 1e4 : toMin(a.time)) - (toMin(b.time) == null ? 1e4 : toMin(b.time)) || String(a.created || '').localeCompare(String(b.created || '')); });
  }
  function dayCounts(rows) {
    var o = { total: 0, booked: 0, arrived: 0, done: 0, cancelled: 0, noshow: 0 };
    rows.forEach(function (a) { var s = STATUS.indexOf(a.status) >= 0 ? a.status : 'booked'; o[s]++; o.total++; });
    return o;
  }
  /* people to remind: live appointments of a day that have a phone */
  function reminders(rows) { return rows.filter(function (a) { return a.status === 'booked' && digits(a.buyer && a.buyer.phone).length >= 10; }); }

  /* ---------- memberships and packages ---------- */
  /* last day a plan is valid: `n` months or days counted from `from` (a 1 month plan from 5 Jan is valid through 4 Feb) */
  function planEnd(from, unit, n) {
    n = Math.max(0, Math.floor(num(n))); if (!parse(from) || !n) return '';
    return unit === 'days' ? addDays(from, n - 1) : addDays(addMonths(from, n), -1);
  }
  function usedCount(m) { return Array.isArray(m.used) ? m.used.length : 0; }
  /* where a plan stands today: upcoming, active, soon (ends within `soon` days), expired, finished (all sessions used) */
  function planState(m, today, soon) {
    var ms = m.mship || {}, end = ms.to || '', start = ms.from || '', total = Math.floor(num(ms.sessions)), left = total ? total - usedCount(m) : null;
    soon = soon == null ? 7 : soon;
    var st = 'active';
    if (start && start > today) st = 'upcoming';
    else if (end && end < today) st = 'expired';
    else if (total && left <= 0) st = 'finished';
    else if (end && daysBetween(today, end) <= soon) st = 'soon';
    return { state: st, daysLeft: end ? daysBetween(today, end) : null, sessionsLeft: left, total: total };
  }
  function personKey(d) { var b = d.buyer || {}, p = digits(b.phone).slice(-10); return p.length === 10 ? 'p' + p : 'n' + key(b.name); }
  /* the plan that counts for each person: the one that ends last */
  function latestPlans(list, site) {
    var by = {};
    (list || []).forEach(function (d) {
      if (d.type !== 'svc' || !d.mship || !d.mship.to || (site && d.site && d.site !== site) || !key(d.buyer && d.buyer.name)) return;
      var k = personKey(d), cur = by[k];
      if (!cur || String(d.mship.to) > String(cur.mship.to) || (d.mship.to === cur.mship.to && String(d.date) > String(cur.date))) by[k] = d;
    });
    return Object.keys(by).map(function (k) { return by[k]; });
  }
  /* members whose latest plan has ended or ends within `soon` days, or has no sessions left; `grace` days of expired plans stay on the list */
  function renewalsDue(list, today, soon, grace, site) {
    grace = grace == null ? 60 : grace;
    return latestPlans(list, site).map(function (d) { return { d: d, s: planState(d, today, soon) }; })
      .filter(function (x) { return x.s.state === 'soon' || x.s.state === 'finished' || (x.s.state === 'expired' && -x.s.daysLeft <= grace); })
      .sort(function (a, b) { return (a.s.daysLeft == null ? 1e6 : a.s.daysLeft) - (b.s.daysLeft == null ? 1e6 : b.s.daysLeft); });
  }
  /* a renewal starts the day after the plan ends when it is still running, else today */
  function renewalStart(m, today) { var to = m.mship && m.mship.to; return to && to >= today ? addDays(to, 1) : today; }

  /* ---------- text and files ---------- */
  function waLink(phone, text) { var p = digits(phone).slice(-10); return 'https://wa.me/' + (p.length === 10 ? '91' + p : '') + '?text=' + encodeURIComponent(text); }
  /* one CSV line per row; cells quoted when needed; a leading = + - @ is made harmless so a spreadsheet never runs it as a formula */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?\d+(\.\d+)?$/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csv(head, rows) { return [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }

  Object.assign(NSAppt, { STATUS: STATUS, addDays: addDays, addMonths: addMonths, daysBetween: daysBetween, toMin: toMin, fromMin: fromMin, clock: clock, age: age,
    nextStatus: nextStatus, live: live, conflicts: conflicts, freeSlots: freeSlots, nextFree: nextFree, dayRows: dayRows, dayCounts: dayCounts, reminders: reminders,
    planEnd: planEnd, usedCount: usedCount, planState: planState, personKey: personKey, latestPlans: latestPlans, renewalsDue: renewalsDue, renewalStart: renewalStart,
    waLink: waLink, csv: csv, csvCell: csvCell, digits: digits });
  if (typeof module !== 'undefined' && module.exports) module.exports = NSAppt; else root.NSAppt = NSAppt;
})(typeof window !== 'undefined' ? window : this);
