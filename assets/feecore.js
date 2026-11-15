/* NS feecore (gap round, 2026-11-14): student fee dues for schools, coaching centres and tuition, PURE functions (no screen, no storage).
   Data (all in the shared data home, nothing new is invented):
     student   a 'party' record with student:1 and { cls, sec, roll, adm, guardian, phone, joined 'YYYY-MM', left 'YYYY-MM', transport {route, amt},
               conc {type 'none'|'pct'|'amt', v, heads: [head ids] or [] = tuition only... see concOf, why}, bizKey }
     setup     meta 'feeSetup:<business key>': { session '2026-27', startMonth 4, dueDay 10, heads [{id,name,freq}], fees {<class key>: {<head id>: amount}},
               routes [{name, amt}], sib {on, pct, heads [ids]} }
     receipts  the existing fee receipt (type 'fee', fee.js). A receipt made from the dues screen also carries studentId and pay: [{k: '<yyyy-mm>|<head id>', amt}]
   Rules:
     monthly heads every month from the joining month (or session start); quarterly heads in the first month of each quarter of the session, the
     quarter of joining included; annual heads once at the session start (or the joining month if later); one-time heads (admission) only for a
     student who joined inside the session; transport monthly from the student's route (own amount over the route's); nothing after the leaving month.
     Concession: a student's own concession (per cent or fixed amount a month, on chosen heads) and the sibling discount (second and later child of
     one family, per cent on chosen heads): on each head the LARGER of the two applies (they do not stack). A fixed concession is shared over
     its heads in proportion to their amounts.
     Payments: a receipt's pay lines go to the charge they name; any other money of the student (receipts without pay lines, made by hand in this
     session's dates) goes to the oldest charges first. Money beyond all charges shows as an advance. */
(function (G) {
  'use strict';
  function num(v) { v = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(v) ? v : 0; }
  function r2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var FREQ = ['month', 'quarter', 'annual', 'once'];
  function defaults(today) {
    var d = new Date(today || Date.now()), y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return { session: y + '-' + String((y + 1) % 100).padStart(2, '0'), startMonth: 4, dueDay: 10,
      heads: [{ id: 'tuition', name: 'Tuition fee', freq: 'month' }, { id: 'annual', name: 'Annual charges', freq: 'annual' }, { id: 'adm', name: 'Admission fee', freq: 'once' }],
      fees: {}, routes: [], sib: { on: false, pct: 10, heads: ['tuition'] } };
  }
  /* the twelve months of the session, 'YYYY-MM' */
  function months(S) {
    var y = parseInt(String(S.session || '').slice(0, 4), 10) || new Date().getFullYear(), sm = S.startMonth || 4, out = [];
    for (var i = 0; i < 12; i++) { var m = sm + i, yy = y + Math.floor((m - 1) / 12), mm = ((m - 1) % 12) + 1; out.push(yy + '-' + pad(mm)); }
    return out;
  }
  function headOf(S, id) { return (S.heads || []).filter(function (h) { return h.id === id; })[0]; }
  function feeOf(S, cls, id) { var row = (S.fees || {})[key(cls)] || {}; return num(row[id]); }
  function famKey(st) { var g = key(st.guardian), p = String(st.phone || '').replace(/\D/g, '').slice(-10); return g || p ? g + '|' + p : ''; }
  /* sibling rank: 1 = eldest (first joined, then the higher class), 2 = second child ... within one family key */
  function sibRanks(students) {
    var fam = {}, out = {};
    students.forEach(function (s) { var f = famKey(s); if (f) (fam[f] = fam[f] || []).push(s); else out[s.id] = 1; });
    Object.keys(fam).forEach(function (f) {
      fam[f].sort(function (a, b) { return String(a.joined || a.adm || '').localeCompare(String(b.joined || b.adm || '')) || String(a.name).localeCompare(String(b.name)); })
        .forEach(function (s, i) { out[s.id] = i + 1; });
    });
    return out;
  }
  function conc(S, st, rank, gross) {
    /* gross: { headId: amount } of one month's charges -> { headId: concession } */
    var out = {}, ids = Object.keys(gross);
    ids.forEach(function (h) { out[h] = 0; });
    var sib = S.sib && S.sib.on && rank >= 2 ? num(S.sib.pct) : 0, sh = (S.sib && S.sib.heads) || [];
    var c = st.conc || {}, ch = c.heads && c.heads.length ? c.heads : ['tuition'];
    var fixed = c.type === 'amt' ? num(c.v) : 0, base = 0;
    if (fixed) ids.forEach(function (h) { if (ch.indexOf(h) >= 0) base += gross[h]; });
    ids.forEach(function (h) {
      var a = 0, b = 0;
      if (sib && sh.indexOf(h) >= 0) a = r2(gross[h] * sib / 100);
      if (c.type === 'pct' && ch.indexOf(h) >= 0) b = r2(gross[h] * num(c.v) / 100);
      else if (fixed && base && ch.indexOf(h) >= 0) b = r2(Math.min(fixed, base) * gross[h] / base);
      out[h] = Math.min(gross[h], Math.max(a, b));
    });
    return out;
  }
  function monthIdx(S, m) { return months(S).indexOf(m); }
  /* every charge of one student for the session (all months): [{ k, m, h, name, gross, conc, net, due }] */
  function charges(S, st, rank) {
    var ms = months(S), first = ms[0], last = ms[ms.length - 1];
    var j = st.joined && st.joined > first ? st.joined : first, lv = st.left && st.left < last ? st.left : last;
    var joinedIn = st.joined && st.joined >= first;
    var out = [];
    var ji = ms.indexOf(j);
    ms.forEach(function (m, i) {
      if (m < j || m > lv) return;
      var g = {}, names = {};
      (S.heads || []).forEach(function (h) {
        var amt = feeOf(S, st.cls, h.id), on = false;
        if (!amt) return;
        if (h.freq === 'month') on = true;
        else if (h.freq === 'quarter') on = i % 3 === 0 || (i === ji && ji % 3 !== 0);   /* the quarter of joining is charged in the month of joining */
        else if (h.freq === 'annual') on = m === j;
        else if (h.freq === 'once') on = joinedIn && m === j;
        if (on) { g[h.id] = amt; names[h.id] = h.name; }
      });
      var tr = transportOf(S, st);
      if (tr) { g.transport = tr; names.transport = 'Transport fee'; }
      var ids = Object.keys(g); if (!ids.length) return;
      var cc = conc(S, st, rank || 1, g), order = (S.heads || []).map(function (h) { return h.id; }).concat(['transport']);
      ids.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      ids.forEach(function (h) { out.push({ k: m + '|' + h, m: m, h: h, name: names[h], gross: g[h], conc: cc[h], net: r2(g[h] - cc[h]), due: m + '-' + pad(S.dueDay || 10) }); });
    });
    return out;
  }
  function transportOf(S, st) {
    var t = st.transport; if (!t) return 0;
    if (num(t.amt)) return num(t.amt);
    var r = (S.routes || []).filter(function (x) { return key(x.name) === key(t.route); })[0];
    return r ? num(r.amt) : 0;
  }
  /* money of one student: { keyed: {charge key: amount}, loose } from receipts (docs of type 'fee') */
  function payments(S, st, docs) {
    var keyed = {}, loose = 0, ms = months(S), from = ms[0] + '-01', to = ms[ms.length - 1] + '-31', n = key(st.name);
    (docs || []).forEach(function (d) {
      if (!d || d.type !== 'fee') return;
      var mine = d.studentId ? d.studentId === st.id : (key(d.buyer && d.buyer.name) === n && (!d.cls || !st.cls || key(d.cls) === key(st.cls)) && d.date >= from && d.date <= to);
      if (!mine) return;
      if (Array.isArray(d.pay) && d.pay.length) d.pay.forEach(function (p) { keyed[p.k] = r2((keyed[p.k] || 0) + num(p.amt)); });
      else loose = r2(loose + num(d.total != null && d.total !== '' ? d.total : d.paid));
    });
    return { keyed: keyed, loose: loose };
  }
  /* put the money on the charges: returns the charges with paid, left; and the advance (money beyond every charge) */
  function allocate(list, pay) {
    var L = list.map(function (c) { return Object.assign({}, c, { paid: 0 }); }), spill = pay.loose || 0;
    L.forEach(function (c) { var a = Math.min(c.net, pay.keyed[c.k] || 0); c.paid = r2(a); spill = r2(spill + Math.max(0, (pay.keyed[c.k] || 0) - c.net)); });
    Object.keys(pay.keyed).forEach(function (k) { if (!L.some(function (c) { return c.k === k; })) spill = r2(spill + pay.keyed[k]); });   /* money for a charge that is no longer in the structure */
    L.forEach(function (c) { var room = r2(c.net - c.paid), a = Math.min(room, spill); if (a > 0) { c.paid = r2(c.paid + a); spill = r2(spill - a); } c.left = r2(c.net - c.paid); });
    return { charges: L, advance: spill };
  }
  /* the whole class register: one row per student as of a month ('YYYY-MM') and a day ('YYYY-MM-DD', for overdue) */
  function ledger(S, students, docs, asOf, today) {
    var ranks = sibRanks(students), rows = [];
    students.forEach(function (st) {
      if (!st.student) return;
      var all = charges(S, st, ranks[st.id]), a = allocate(all, payments(S, st, docs)), billed = 0, paid = 0, over = 0, pend = [];
      a.charges.forEach(function (c) {
        if (c.m > asOf) return;
        billed = r2(billed + c.net); paid = r2(paid + c.paid);
        if (c.left > 0.004) { pend.push(c); if (c.due < today) over = r2(over + c.left); }
      });
      var advance = a.advance + a.charges.reduce(function (s, c) { return s + (c.m > asOf ? c.paid : 0); }, 0);
      rows.push({ st: st, rank: ranks[st.id], billed: billed, paid: paid, balance: r2(billed - paid), overdue: over, pending: pend, advance: r2(advance), all: a.charges, sibling: ranks[st.id] >= 2 });
    });
    return rows.sort(function (x, y) { return String(x.st.cls || '').localeCompare(String(y.st.cls || ''), 'en', { numeric: true }) || String(x.st.sec || '').localeCompare(String(y.st.sec || '')) || String(x.st.name).localeCompare(String(y.st.name)); });
  }
  /* what a receipt for the chosen charges and the money paid looks like: lines (gross), concession, pay allocation (net), balance */
  function plan(S, charges, paid) {
    var sel = charges.slice().sort(function (a, b) { return a.m.localeCompare(b.m) || 0; });
    var net = r2(sel.reduce(function (s, c) { return s + c.left; }, 0));
    paid = paid == null || paid === '' ? net : r2(num(paid));
    var left = paid, pay = [], lines = [], cn = 0;
    sel.forEach(function (c) {
      var a = Math.min(c.left, left); left = r2(left - a);
      if (a > 0.004) pay.push({ k: c.k, amt: r2(a) });
      lines.push({ desc: c.name + ' (' + monthName(c.m) + ')', amt: String(r2(c.left + c.conc * (c.left / (c.net || 1)))) });
      cn = r2(cn + c.conc * (c.left / (c.net || 1)));
    });
    var ms = sel.map(function (c) { return c.m; }).sort();
    return { lines: lines, conc: cn, net: net, paid: paid, pay: pay, balance: r2(net - paid), mFrom: ms[0] || '', mTo: ms[ms.length - 1] || '', advance: Math.max(0, left) };
  }
  /* collection report for a date range: rows per class, columns per head, plus modes */
  function report(S, students, docs, from, to) {
    var byId = {}, cols = {}, rows = {}, modes = {}, tot = 0, n = 0, unsplit = 0;
    students.forEach(function (s) { byId[s.id] = s; });
    var hname = {}; (S.heads || []).forEach(function (h) { hname[h.id] = h.name; }); hname.transport = 'Transport fee';
    (docs || []).forEach(function (d) {
      if (!d || d.type !== 'fee' || d.date < from || d.date > to) return;
      var st = d.studentId && byId[d.studentId], cls = String(d.cls || (st && st.cls) || '—').trim() || '—', r = rows[cls] || (rows[cls] = { cls: cls, n: 0, total: 0, h: {} }), amt = num(d.total != null && d.total !== '' ? d.total : d.paid);
      r.n++; r.total = r2(r.total + amt); tot = r2(tot + amt); n++;
      var md = d.mode || 'cash'; modes[md] = r2((modes[md] || 0) + amt);
      if (Array.isArray(d.pay) && d.pay.length) {
        var sp = 0; d.pay.forEach(function (p) { var h = String(p.k).split('|')[1]; cols[h] = 1; r.h[h] = r2((r.h[h] || 0) + num(p.amt)); sp += num(p.amt); });
        if (amt - sp > 0.004) { cols['_other'] = 1; r.h._other = r2((r.h._other || 0) + amt - sp); }
      } else { cols['_other'] = 1; r.h._other = r2((r.h._other || 0) + amt); unsplit = r2(unsplit + amt); }
    });
    var order = (S.heads || []).map(function (h) { return h.id; }).concat(['transport', '_other']);
    var cl = Object.keys(cols).sort(function (a, b) { var x = order.indexOf(a), y = order.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var colTot = {}; cl.forEach(function (h) { colTot[h] = r2(Object.keys(rows).reduce(function (s, c) { return s + (rows[c].h[h] || 0); }, 0)); });
    return { cols: cl.map(function (h) { return { id: h, name: h === '_other' ? 'Not split by head' : hname[h] || h }; }), rows: Object.keys(rows).sort(function (a, b) { return a.localeCompare(b, 'en', { numeric: true }); }).map(function (c) { return rows[c]; }), colTot: colTot, total: tot, n: n, modes: modes, unsplit: unsplit };
  }
  /* CSV text of students for import / export; the first row names the columns */
  var COLS = ['Name', 'Class', 'Section', 'Roll no', 'Admission no', 'Guardian', 'Phone', 'Joined (YYYY-MM)', 'Transport route', 'Concession type (none/pct/amt)', 'Concession value', 'Concession reason'];
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCsv(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false, i, c;
    text = String(text || '').replace(/^﻿/, '');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',' || c === '\t') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(function (x) { return x.trim() !== ''; })) rows.push(row); row = []; }
      else cell += c;
    }
    row.push(cell); if (row.some(function (x) { return x.trim() !== ''; })) rows.push(row);
    return rows;
  }
  /* rows (first row = headings) to student records; { students: [...], problems: [[line, why]] }; columns found by heading words */
  function fromRows(rows, setup) {
    var head = (rows[0] || []).map(function (h) { return key(h); });
    function col(re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; }
    var ix = { name: col(/^(student|name)/), cls: col(/^class/), sec: col(/^sec/), roll: col(/^roll/), adm: col(/^adm/), g: col(/guardian|parent|father/), ph: col(/phone|mobile/), j: col(/join/), tr: col(/transport|route|bus/), ct: col(/concession.*type|^type/), cv: col(/concession.*value|^value/), cr: col(/reason/) };
    var out = [], bad = [];
    if (ix.name < 0 || ix.cls < 0) return { students: [], problems: [[0, 'need the headings Name and Class']] };
    rows.slice(1).forEach(function (r, n) {
      var name = String(r[ix.name] || '').trim(); if (!name) return;
      var cls = String(r[ix.cls] || '').trim(), j = ix.j >= 0 ? String(r[ix.j] || '').trim() : '';
      if (!cls) { bad.push([n + 2, 'no class for ' + name]); return; }
      if (setup && setup.fees && Object.keys(setup.fees).length && !setup.fees[key(cls)]) bad.push([n + 2, 'class "' + cls + '" has no fee amounts yet (' + name + ')']);
      if (j && !/^\d{4}-\d{2}$/.test(j)) { bad.push([n + 2, 'joined month must look like 2026-04 (' + name + ')']); j = ''; }
      var ct = ix.ct >= 0 ? key(r[ix.ct]) : '', cv = ix.cv >= 0 ? num(r[ix.cv]) : 0;
      var s = { name: name, student: 1, role: 'customer', cls: cls, sec: ix.sec >= 0 ? String(r[ix.sec] || '').trim() : '', roll: ix.roll >= 0 ? String(r[ix.roll] || '').trim() : '', adm: ix.adm >= 0 ? String(r[ix.adm] || '').trim() : '',
        guardian: ix.g >= 0 ? String(r[ix.g] || '').trim() : '', phone: ix.ph >= 0 ? String(r[ix.ph] || '').trim() : '', joined: j };
      var rt = ix.tr >= 0 ? String(r[ix.tr] || '').trim() : ''; if (rt) s.transport = { route: rt, amt: '' };
      if ((ct === 'pct' || ct === 'amt') && cv) s.conc = { type: ct, v: cv, heads: [], why: ix.cr >= 0 ? String(r[ix.cr] || '').trim() : '' };
      out.push(s);
    });
    return { students: out, problems: bad };
  }
  function monthName(m) { return /^\d{4}-\d{2}$/.test(m || '') ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m.slice(5) - 1] + ' ' + m.slice(0, 4) : ''; }

  var API = { num: num, r2: r2, key: key, defaults: defaults, months: months, headOf: headOf, famKey: famKey, sibRanks: sibRanks, charges: charges, payments: payments, allocate: allocate, ledger: ledger, plan: plan, report: report, COLS: COLS, toCsv: toCsv, parseCsv: parseCsv, fromRows: fromRows, monthName: monthName, FREQ: FREQ, transportOf: transportOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSFees = API;
})(this);
