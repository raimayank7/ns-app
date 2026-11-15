/* NSHotel: the pure logic of hotel.niveshsahayak.in (rooms, bookings, stays, occupancy, the room-rate GST slab).
   A room is an ordinary item master of the shared data home (store 'item') with room:1:
     { desc:'Room 101', rno:'101', rtype:'Deluxe', rate:'2500', price:'2500', cap:'2', room:1, hsn:'996311', unit:'Night', kind:'service' }
   A stay is one record of store 'doc', type 'hotel':
     { buyer:{name,phone,..}, cin:'2026-11-14', cout:'2026-11-16', stay:'booked'|'in'|'out'|'cancel', rooms:[{rno, rate, gst}], extras:[{desc, qty, rate, gst, hsn}], ... }
   Dates are ISO yyyy-mm-dd. A night belongs to the day you sleep in: a stay 14 to 16 Nov has the nights of the 14th and the 15th.
   Tests: node scripts/test_hotel.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T00:00:00Z')); }
  function ms(s) { return Date.parse(s + 'T00:00:00Z'); }
  function addDays(s, k) { return new Date(ms(s) + k * 86400000).toISOString().slice(0, 10); }
  function diffDays(a, b) { return Math.round((ms(b) - ms(a)) / 86400000); }

  /* nights of a stay: check-out day minus check-in day; a same-day stay counts as one night; 0 when a date is missing or the order is wrong */
  function nights(cin, cout) {
    if (!isDate(cin) || !isDate(cout)) return 0;
    var d = diffDays(cin, cout); return d < 0 ? 0 : Math.max(1, d);
  }

  /* GST rate usually asked on hotel accommodation, from the room's price for one night (the "value of supply of a unit of accommodation per day"):
     from 22 Sep 2025 (Notification 15/2025-Central Tax (Rate)): up to Rs 7,500 = 5% (no input tax credit), above = 18%;
     before that date: Rs 1,001 to Rs 7,500 = 12%, above 7,500 = 18% (up to Rs 1,000 had been exempt until 17 Jul 2022, 12% from 18 Jul 2022).
     It is only a suggestion: the rate of every room line can be typed over. */
  var SLAB_CHANGE = '2025-09-22', SLAB_LIMIT = 7500;
  function slabRate(tariff, onDate) {
    var t = n(tariff); if (!(t > 0)) return 0;
    if (t > SLAB_LIMIT) return 18;
    return onDate && isDate(onDate) && onDate < SLAB_CHANGE ? 12 : 5;
  }

  /* rooms of the master list: items marked room:1 with a number */
  function roomsOf(items) {
    return (items || []).filter(function (x) { return x && x.room && String(x.rno || '').trim(); })
      .sort(function (a, b) { return String(a.rno).localeCompare(String(b.rno), 'en', { numeric: true }); });
  }
  /* a room from what was typed: number and a price per night greater than 0, else null */
  function cleanRoom(x) {
    var rno = String((x && x.rno) || '').trim().replace(/\s+/g, ' '), p = n(x && x.rate);
    if (!rno || rno.length > 12 || !(p > 0)) return null;
    return { rno: rno, rate: String(r2(p)), rtype: String((x && x.rtype) || '').trim().slice(0, 30), cap: String((x && x.cap) || '').trim().slice(0, 3) };
  }
  function clash(rooms, c, editId) { var k = key(c.rno); return (rooms || []).some(function (r) { return key(r.rno) === k && r.id !== editId; }); }
  /* the item record to save for a room (an existing one of that number is reused, so it never doubles) */
  function toRecord(c, items, editId) {
    var k = key(c.rno), hit = (items || []).filter(function (x) { return x && x.room && (editId ? x.id === editId : key(x.rno) === k); })[0] || {};
    return Object.assign({}, hit, { desc: 'Room ' + c.rno, rno: c.rno, rtype: c.rtype, cap: c.cap, price: c.rate, rate: c.rate, room: 1, hsn: '996311', unit: 'Night', kind: 'service', gst: '' });
  }

  /* is a stay in the diary (booked or in the house)? cancelled and finished stays do not hold a room, finished ones only for the nights they used */
  function holds(b) { return b && b.stay !== 'cancel'; }
  function roomNos(b) { return (b.rooms || []).map(function (r) { return String(r.rno || '').trim(); }).filter(Boolean); }
  /* does this stay occupy room rno on the night of this day? */
  function occupies(b, rno, day) {
    if (!holds(b) || !isDate(b.cin) || !isDate(b.cout)) return false;
    var last = b.cout > b.cin ? b.cout : addDays(b.cin, 1);   /* a same-day stay holds its one night */
    return day >= b.cin && day < last && roomNos(b).some(function (x) { return key(x) === key(rno); });
  }
  /* other stays that hold room rno in any night of cin..cout (the stay being edited is skipped by id) */
  function conflicts(bookings, rno, cin, cout, exceptId) {
    if (!isDate(cin) || !isDate(cout)) return [];
    var last = cout > cin ? cout : addDays(cin, 1);
    return (bookings || []).filter(function (b) {
      if (!holds(b) || b.id === exceptId || !isDate(b.cin) || !isDate(b.cout)) return false;
      var bl = b.cout > b.cin ? b.cout : addDays(b.cin, 1);
      return cin < bl && b.cin < last && roomNos(b).some(function (x) { return key(x) === key(rno); });
    });
  }
  /* every clash of one stay: [{rno, with:[stays]}] */
  function clashesOf(bookings, stay, exceptId) {
    var seen = {}, out = [];
    roomNos(stay).forEach(function (r) {
      var k = key(r); if (seen[k]) return; seen[k] = 1;
      var c = conflicts(bookings, r, stay.cin, stay.cout, exceptId); if (c.length) out.push({ rno: r, 'with': c });
    });
    return out;
  }
  /* the same room typed on two lines of one stay */
  function doubled(stay) {
    var seen = {}, d = [];
    roomNos(stay).forEach(function (r) { var k = key(r); if (seen[k] && d.indexOf(r) < 0) d.push(r); seen[k] = 1; });
    return d;
  }

  /* the diary: rows = rooms (the master list, then rooms that only appear on stays), columns = days from..from+days-1;
     a cell is null (free) or the stay that holds that night */
  function board(bookings, rooms, from, days) {
    var nos = [], seen = {};
    (rooms || []).forEach(function (r) { var k = key(r.rno); if (!seen[k]) { seen[k] = 1; nos.push(String(r.rno)); } });
    (bookings || []).forEach(function (b) { if (holds(b)) roomNos(b).forEach(function (x) { var k = key(x); if (!seen[k]) { seen[k] = 1; nos.push(x); } }); });
    var dayList = []; for (var i = 0; i < days; i++) dayList.push(addDays(from, i));
    return {
      days: dayList,
      rows: nos.map(function (rno) {
        return { rno: rno, cells: dayList.map(function (d) { return (bookings || []).filter(function (b) { return occupies(b, rno, d); })[0] || null; }) };
      })
    };
  }
  /* the day at a glance */
  function today(bookings, rooms, day) {
    var arr = [], inh = [], dep = [], busy = {};
    (bookings || []).forEach(function (b) {
      if (!holds(b) || !isDate(b.cin)) return;
      if (b.stay === 'booked' && b.cin === day) arr.push(b);
      if (b.stay === 'in' && b.cin <= day) inh.push(b);
      if (b.stay === 'in' && b.cout === day) dep.push(b);
      roomNos(b).forEach(function (r) { if ((b.stay === 'booked' || b.stay === 'in') && occupies(b, r, day)) busy[key(r)] = 1; });
    });
    var total = (rooms || []).length, used = (rooms || []).filter(function (r) { return busy[key(r.rno)]; }).length;
    return { arrivals: arr, inHouse: inh, departures: dep, rooms: total, occupied: used, vacant: total - used, percent: total ? Math.round(used * 100 / total) : 0 };
  }
  /* stays that should have been closed: still "in the house" after the planned check-out day, or still "booked" on a day after check-in */
  function overdue(bookings, day) {
    return (bookings || []).filter(function (b) { return holds(b) && isDate(b.cout) && (b.stay === 'in' && b.cout < day || b.stay === 'booked' && isDate(b.cin) && b.cin < day); });
  }

  /* the lines of the bill: one per room (price x nights at the room's GST rate), then the extras */
  function lines(d) {
    var nt = nights(d.cin, d.cout), out = [], onDate = isDate(d.cout) ? d.cout : d.date;
    (d.rooms || []).forEach(function (r) {
      var rate = n(r.rate); if (!(rate > 0) && !String(r.rno || '').trim()) return;
      var g = r.gst === '' || r.gst == null ? slabRate(rate, onDate) : n(r.gst);
      out.push({ kind: 'room', desc: ('Room ' + String(r.rno || '').trim() + (String(r.rtype || '').trim() ? ' (' + String(r.rtype).trim() + ')' : '')).trim(), hsn: '996311', unit: 'Night', qty: nt, rate: rate, disc: '', gst: g });
    });
    (d.extras || []).forEach(function (x) {
      if (!String(x.desc || '').trim() && !n(x.rate)) return;
      out.push({ kind: 'extra', desc: String(x.desc || '').trim(), hsn: String(x.hsn || '').trim(), unit: '', qty: x.qty === '' || x.qty == null ? 1 : n(x.qty), rate: n(x.rate), disc: '', gst: n(x.gst) });
    });
    return out;
  }
  /* totals of a stay. withTax false = no GST charged (not registered, composition). Total is rounded to the rupee, round-off kept. */
  function sums(d, withTax, intra) {
    var o = { rows: [], rooms: 0, extras: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, nights: nights(d.cin, d.cout) };
    lines(d).forEach(function (l) {
      var v = r2(l.qty * l.rate - l.qty * l.rate * n(l.disc) / 100), g = withTax ? l.gst : 0, tx = r2(v * g / 100);
      o.rows.push({ l: l, value: v, g: g, tax: tx }); o[l.kind === 'room' ? 'rooms' : 'extras'] += v; o.taxable += v; o.tax += tx;
    });
    ['rooms', 'extras', 'taxable', 'tax'].forEach(function (k) { o[k] = r2(o[k]); });
    if (intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    o.adv = r2(n(d.adv)); o.due = d.paid === 'paid' ? 0 : r2(o.total - o.adv);
    return o;
  }

  /* Excel (CSV) lists: a text with a byte-order mark so Excel reads Hindi names right */
  function csv(rows) {
    return '\ufeff' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c).replace(/\r?\n/g, ' '); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
  }
  function stayRows(bookings) {
    var out = [['Booking no.', 'Guest', 'Phone', 'Rooms', 'Check-in', 'Check-out', 'Nights', 'Status', 'Total', 'Advance', 'Paid']];
    (bookings || []).slice().sort(function (a, b) { return String(a.cin || '').localeCompare(String(b.cin || '')) || String(a.no || '').localeCompare(String(b.no || '')); }).forEach(function (b) {
      out.push([b.no, b.buyer && b.buyer.name, b.buyer && b.buyer.phone, roomNos(b).join(' '), b.cin, b.cout, nights(b.cin, b.cout), b.stay, n(b.total), n(b.adv), b.paid === 'paid' ? 'Yes' : 'No']);
    });
    return out;
  }
  function roomRows(rooms) {
    return [['Room', 'Type', 'Price per night', 'Sleeps']].concat((rooms || []).map(function (r) { return [r.rno, r.rtype || '', n(r.rate || r.price), r.cap || '']; }));
  }

  var API = { key: key, n: n, r2: r2, isDate: isDate, addDays: addDays, diffDays: diffDays, nights: nights, slabRate: slabRate, SLAB_LIMIT: SLAB_LIMIT, SLAB_CHANGE: SLAB_CHANGE,
    roomsOf: roomsOf, cleanRoom: cleanRoom, clash: clash, toRecord: toRecord, holds: holds, roomNos: roomNos, occupies: occupies, conflicts: conflicts, clashesOf: clashesOf, doubled: doubled,
    board: board, csv: csv, stayRows: stayRows, roomRows: roomRows, today: today, overdue: overdue, lines: lines, sums: sums };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSHotel = API;
})(this);
