/* hotel.niveshsahayak.in: rooms, bookings, check-in and check-out, a diary of nights per room, and the bill with the room-rate GST slab.
   Record type 'hotel' (one record per stay: booking card first, the same record becomes the bill at check-out). Rooms are item masters with room:1
   (logic in hotelcore.js). It counts as a sale in NSBiz once it is printed as a bill (print 'bill', not cancelled). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, H = NSHotel;
  var STAY = ['booked', 'in', 'out', 'cancel'];
  var K, ROOMS = [], ITEMS = [], BOOKS = [], diaryFrom = '', diaryDays = 14;
  function rrow() { return { rno: '', rtype: '', rate: '', gst: '' }; }
  function xrow() { return { desc: '', qty: 1, rate: '', gst: 18, hsn: '' }; }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function sums(d) { return H.sums(d, d.kind === 'tax', true); }   /* accommodation: place of supply is the hotel, so CGST + SGST for every guest (IGST Act s.12(3), F6-7) */
  function mine(b) { return String(b.seller && b.seller.name || '').trim().toLowerCase() === String(K.doc().seller.name || '').trim().toLowerCase(); }

  /* ---------- rooms and stays from the shared data home ---------- */
  function loadAll() {
    return Promise.all([NSStore.list('item'), NSStore.list('doc')]).then(function (r) {
      ITEMS = NS.forBiz(r[0], K.doc().seller); ROOMS = H.roomsOf(ITEMS);
      BOOKS = r[1].filter(function (x) { return x.type === 'hotel' && mine(x); });
      var dl = $('#dl-rooms'); if (dl) dl.innerHTML = roomOpts();
    }, function () {});
  }
  function roomOpts() { return ROOMS.map(function (x) { return '<option value="' + esc(x.rno) + '" label="' + esc((x.rtype || '') + ' ' + NS.money(num(x.rate || x.price))) + '">'; }).join(''); }
  function guest(b) { return b.buyer && b.buyer.name || ''; }
  function nosText(b) { return H.roomNos(b).join(', '); }

  /* ---------- the dialog shared by rooms, diary and today ---------- */
  function dlg(title, html) {
    var x = $('#ht-dlg'); $('h2', x).textContent = title; $('[data-body]', x).innerHTML = html;
    if (!x.open) { x.showModal ? x.showModal() : x.setAttribute('open', ''); }
    return x;
  }
  function openStay(id) { NSStore.get('doc', id).then(function (r) { if (r) { $('#ht-dlg').close(); K.openDoc(r, false); } }); }

  function roomsDialog() {
    loadAll().then(function () {
      var rows = ROOMS.length ? '<table class="day"><thead><tr><th>' + esc(t('ht.room')) + '</th><th>' + esc(t('ht.rtype')) + '</th><th>' + esc(t('ht.tariff')) + '</th><th>' + esc(t('ht.cap')) + '</th><th></th></tr></thead><tbody>' + ROOMS.map(function (x) {
        return '<tr><td class="mono">' + esc(x.rno) + '</td><td>' + esc(x.rtype || '') + '</td><td>' + NS.money(num(x.rate || x.price)) + '</td><td>' + esc(x.cap || '') + '</td><td><button type="button" class="btn sm" data-rm="edit" data-id="' + x.id + '">' + esc(t('ht.edit')) + '</button> <button type="button" class="btn sm danger" data-rm="del" data-id="' + x.id + '">' + esc(t('h.del')) + '</button></td></tr>';
      }).join('') + '</tbody></table>' : '<p>' + esc(t('ht.norooms')) + '</p>';
      var f = function (id, lbl, mode) { return '<div class="f"><label for="' + id + '">' + esc(lbl) + '</label><input id="' + id + '" dir="auto"' + (mode ? ' inputmode="' + mode + '"' : '') + '></div>'; };
      dlg(t('ht.rooms'), rows + '<fieldset class="card"><legend id="ht-rl">' + esc(t('ht.addroom')) + '</legend><div class="fg">' + f('ht-rn', t('ht.room')) + f('ht-rt', t('ht.rtype')) + f('ht-rr', t('ht.tariff'), 'decimal') + f('ht-rc', t('ht.cap'), 'numeric') +
        '</div><p class="hint">' + esc(t('ht.slabnote')) + '</p><div class="row"><button type="button" class="btn primary" data-rm="save">' + esc(t('b.save')) + '</button> <button type="button" class="btn" data-rm="clear">' + esc(t('ht.clear')) + '</button> <button type="button" class="btn" data-rm="csv">' + esc(t('ht.csv.rooms')) + '</button></div></fieldset>');
    });
  }
  var editRoom = null;
  function roomClick(b) {
    var a = b.getAttribute('data-rm'), id = b.getAttribute('data-id');
    if (a === 'edit') { var x = ROOMS.filter(function (r) { return r.id === id; })[0]; if (!x) return; editRoom = id; $('#ht-rn').value = x.rno; $('#ht-rt').value = x.rtype || ''; $('#ht-rr').value = x.rate || x.price || ''; $('#ht-rc').value = x.cap || ''; $('#ht-rl').textContent = t('ht.editroom'); $('#ht-rn').focus(); }
    else if (a === 'csv') download(H.csv(H.roomRows(ROOMS)), 'Rooms');
    else if (a === 'clear') { editRoom = null; roomsDialog(); }
    else if (a === 'del') { var r = ROOMS.filter(function (q) { return q.id === id; })[0]; if (r && NS.okSync(t('ht.delroom', { n: r.rno }))) NSStore.del('item', id).then(function () { roomsDialog(); }, function (e) { NS.toast(e.message, 'bad'); }); }
    else if (a === 'save') {
      var c = H.cleanRoom({ rno: $('#ht-rn').value, rtype: $('#ht-rt').value, rate: $('#ht-rr').value, cap: $('#ht-rc').value });
      if (!c) { NS.toast(t('ht.v.room'), 'bad'); return; }
      if (H.clash(ROOMS, c, editRoom)) { NS.toast(t('ht.v.dup', { n: c.rno }), 'bad'); return; }
      var rec = H.toRecord(c, ITEMS, editRoom); if (!rec.id && K.doc().seller && K.doc().seller.id) rec.biz = K.doc().seller.id;
      NSStore.put('item', rec).then(function () { editRoom = null; NS.toast(t('ht.saved')); roomsDialog(); }, function (e) { NS.toast(e.message, 'bad'); });
    }
  }

  function download(text, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.href = u; a.download = name + ' ' + NS.today() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  function shortDate(s) { return NS.fmtDate(s).replace(/[-\s]?\d{4}$/, ''); }
  function diaryDialog() {
    loadAll().then(function () {
      if (!diaryFrom) diaryFrom = NS.today();
      var bd = H.board(BOOKS, ROOMS, diaryFrom, diaryDays);
      var head = '<tr><th class="ht-r">' + esc(t('ht.room')) + '</th>' + bd.days.map(function (d) { return '<th class="ht-d' + (d === NS.today() ? ' now' : '') + '">' + esc(d.slice(8)) + '<small>' + esc(d.slice(5, 7)) + '</small></th>'; }).join('') + '</tr>';
      var body = bd.rows.map(function (r) {
        var master = ROOMS.some(function (x) { return String(x.rno).trim().toLowerCase() === r.rno.trim().toLowerCase(); });
        return '<tr><th class="ht-r mono">' + esc(r.rno) + (master ? '' : '<small>' + esc(t('ht.unlisted')) + '</small>') + '</th>' + r.cells.map(function (c) {
          return c ? '<td class="ht-c ' + esc(c.stay) + '"><button type="button" data-open="' + c.id + '" title="' + esc(guest(c) + ' · ' + NS.fmtDate(c.cin) + ' – ' + NS.fmtDate(c.cout)) + '">' + esc(guest(c).slice(0, 8)) + '</button></td>' : '<td class="ht-c"></td>';
        }).join('') + '</tr>';
      }).join('');
      var ctl = '<div class="row ht-ctl"><button type="button" class="btn sm" data-dy="-7">‹ ' + esc(t('ht.week')) + '</button><input type="date" id="ht-from" value="' + esc(diaryFrom) + '" aria-label="' + esc(t('ht.from')) + '"><button type="button" class="btn sm" data-dy="7">' + esc(t('ht.week')) + ' ›</button>' +
        '<select id="ht-days" aria-label="' + esc(t('ht.days')) + '">' + [7, 14, 30].map(function (n) { return '<option value="' + n + '"' + (n === diaryDays ? ' selected' : '') + '>' + esc(t('ht.nday', { n: n })) + '</option>'; }).join('') + '</select><button type="button" class="btn sm" data-dy="csv">' + esc(t('ht.csv.stays')) + '</button></div>';
      var key = '<p class="hint"><span class="ht-k booked"></span> ' + esc(t('ht.s.booked')) + ' <span class="ht-k in"></span> ' + esc(t('ht.s.in')) + ' <span class="ht-k out"></span> ' + esc(t('ht.s.out')) + '</p>';
      dlg(t('ht.diary'), ctl + (bd.rows.length ? '<div class="ht-wrap"><table class="ht-diary"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' + key : '<p>' + esc(t('ht.norooms')) + '</p>'));
    });
  }

  function listTable(arr, withBtn) {
    return arr.length ? '<table class="day"><thead><tr><th>' + esc(t('ht.guest')) + '</th><th>' + esc(t('ht.rooms')) + '</th><th>' + esc(t('ht.cout')) + '</th><th></th></tr></thead><tbody>' + arr.map(function (b) {
      return '<tr><td>' + esc(guest(b)) + '<br><small>' + esc(b.buyer && b.buyer.phone || '') + '</small></td><td class="mono">' + esc(nosText(b)) + '</td><td>' + NS.fmtDate(b.cout) + '</td><td><button type="button" class="btn sm" data-open="' + b.id + '">' + esc(t('h.open')) + '</button></td></tr>';
    }).join('') + '</tbody></table>' : '<p class="hint">' + esc(t('ht.none')) + '</p>';
  }
  function todayDialog() {
    loadAll().then(function () {
      var day = NS.today(), s = H.today(BOOKS, ROOMS, day), od = H.overdue(BOOKS, day);
      dlg(t('ht.today'), '<p class="ht-sum"><b>' + esc(t('ht.occ', { a: s.occupied, b: s.rooms, p: s.percent })) + '</b> · ' + esc(t('ht.vac', { n: s.vacant })) + '</p>' +
        (od.length ? '<h3 class="warn">' + esc(t('ht.overdue')) + '</h3>' + listTable(od) : '') +
        '<h3>' + esc(t('ht.arr')) + ' (' + s.arrivals.length + ')</h3>' + listTable(s.arrivals) + '<h3>' + esc(t('ht.inh')) + ' (' + s.inHouse.length + ')</h3>' + listTable(s.inHouse) + '<h3>' + esc(t('ht.dep')) + ' (' + s.departures.length + ')</h3>' + listTable(s.departures));
    });
  }
  function waText(d, o) {
    var who = d.buyer.name || '', rs = d.rooms.map(function (r) { return r.rno; }).filter(Boolean).join(', ');
    if (d.stay === 'out') return 'Thank you ' + who + ' for staying with us. Bill ' + d.no + ': ' + NS.money(o.total) + (o.due ? ', balance ' + NS.money(o.due) : ', paid') + '. ' + (d.seller.name || '');
    return 'Hello ' + who + ', your booking at ' + (d.seller.name || 'our hotel') + ' is confirmed: room ' + rs + ', ' + NS.fmtDate(d.cin) + ' to ' + NS.fmtDate(d.cout) + ' (' + o.nights + ' night' + (o.nights === 1 ? '' : 's') + ').' + (o.adv ? ' Advance received ' + NS.money(o.adv) + '.' : '') + ' Check-in from ' + (d.cinT || '12:00') + '.';
  }

  K = NS.kit({
    type: 'hotel', prefix: 'HT', digits: 4, paper: 'a5', papers: NS.PAPER_ALL, copies: 2, copyLabels: ['Guest copy', 'Hotel copy'],
    name: function (d) { return d.print === 'bill' ? (d.kind === 'tax' ? 'Invoice' : d.kind === 'supply' ? 'Bill of Supply' : 'Bill') : 'Booking'; },
    blank: function () {
      var td = NS.today();
      return { print: 'card', stay: 'booked', cin: td, cout: H.addDays(td, 1), cinT: '12:00', coutT: '11:00', adults: '1', kids: '0', nation: 'Indian', idt: 'Aadhaar', idn: '', from: '', purpose: '', kind: 'plain', adv: '', paid: 'unpaid', payMode: 'cash',
        rooms: [rrow()], extras: [], terms: 'Check-in and check-out as above. A valid photo ID is required at check-in. The hotel is not responsible for valuables not kept in the safe.' };
    },
    newRow: function (n) { return n === 'rooms' ? rrow() : xrow(); },
    keepOnNew: function (d) { return { kind: d.kind, paper: d.paper, terms: d.terms, cinT: d.cinT, coutT: d.coutT }; },
    emptyRows: true,
    form: function (K) {
      var ST = STAY.map(function (s) { return [s, t('ht.s.' + s)]; });
      return K.card(t('ht.guest'), '<div class="fg">' + K.f('buyer.name', t('ht.gname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + K.f('buyer.gstin', t('ht.cgstin'), { max: 15, ltr: 1, hint: t('ht.cgstinh') }) + '</div>' +
          '<details class="more"><summary>' + esc(t('ht.reg')) + '</summary><div class="fg">' + K.f('nation', t('ht.nation'), { hint: t('ht.formc') }) +
          K.f('idt', t('ht.idt'), { type: 'select', opts: ['Aadhaar', 'Passport', 'Driving licence', 'Voter ID', 'PAN', 'Other'].map(function (x) { return [x, x]; }) }) + K.f('idn', t('ht.idn'), { ltr: 1 }) +
          K.f('adults', t('ht.adults'), { mode: 'numeric', ltr: 1 }) + K.f('kids', t('ht.kids'), { mode: 'numeric', ltr: 1 }) + K.f('from', t('ht.from2')) + K.f('purpose', t('ht.purpose')) + '</div></details>') +
        K.numCard(K.f('stay', t('ht.status'), { type: 'select', opts: ST }) + K.f('print', t('lr.print'), { type: 'select', opts: [['card', t('ht.pcard')], ['bill', t('ht.pbill')]], hint: t('ht.printh') }) +
          K.f('cin', t('ht.cin'), { type: 'date' }) + K.f('cout', t('ht.cout'), { type: 'date' }) + K.f('cinT', t('ht.cinT'), { ltr: 1 }) + K.f('coutT', t('ht.coutT'), { ltr: 1 }), t('ht.lgstay')) +
        K.card(t('ht.rooms'), K.list('rooms', t('ht.addr')) + '<datalist id="dl-rooms">' + roomOpts() + '</datalist><p class="hint">' + esc(t('ht.slabnote')) + '</p>') +
        K.card(t('ht.extras'), K.list('extras', t('ht.addx')) + '<datalist id="dl-rates"><option value="0"><option value="5"><option value="12"><option value="18"><option value="40"></datalist>') +
        K.card(t('ht.pay'), '<div class="fg">' + K.f('kind', t('pos.kind'), { type: 'select', wide: true, opts: [['tax', t('k.tax')], ['supply', t('k.supply')], ['plain', t('k.plain')]] }) +
          K.f('adv', t('lr.adv'), { mode: 'decimal', ltr: 1 }) + K.f('paid', t('l.pay'), { type: 'select', opts: [['unpaid', t('pay.unpaid')], ['paid', t('pay.paid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank']), show: 'paid=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="row wide pos-go"><button type="button" class="btn" data-ht="out">' + esc(t('ht.out')) + '</button><button type="button" class="btn" data-ht="wa">' + esc(t('ht.wa')) + '</button></div>' +
          '<div class="row wide pos-go"><button type="button" class="btn" data-ht="diary">' + esc(t('ht.diary')) + '</button><button type="button" class="btn" data-ht="today">' + esc(t('ht.today')) + '</button><button type="button" class="btn" data-ht="rooms">' + esc(t('ht.rooms')) + '</button></div></div>') +
        K.bizCard({}) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true }));
    },
    rows: {
      rooms: function (r, i, K) {
        return K.rf('rooms', i, 'rno', t('ht.room'), { list: 'dl-rooms', ltr: 1 }) + K.rf('rooms', i, 'rtype', t('ht.rtype')) + K.rf('rooms', i, 'rate', t('ht.tariff'), { mode: 'decimal', ltr: 1 }) +
          (K.doc().kind === 'tax' ? K.rf('rooms', i, 'gst', t('ht.gstauto'), { mode: 'decimal', ltr: 1, list: 'dl-rates', ph: String(H.slabRate(num(r.rate), K.doc().cout)) }) : '');
      },
      extras: function (x, i, K) {
        return K.rf('extras', i, 'desc', t('l.desc'), { cls: 'it-d', sug: 'item' }) + K.rf('extras', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('extras', i, 'rate', t('l.rate'), { mode: 'decimal', ltr: 1 }) +
          (K.doc().kind === 'tax' ? K.rf('extras', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('extras', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '');
      }
    },
    rowInput: function (n, i, k, d, el) {
      if (n === 'rooms' && k === 'rno') {
        var m = ROOMS.filter(function (x) { return String(x.rno).trim().toLowerCase() === String(d.rooms[i].rno || '').trim().toLowerCase(); })[0], r = d.rooms[i];
        if (m && (!num(r.rate) || r._auto)) { r._auto = true; r.rate = String(m.rate || m.price || ''); r.rtype = m.rtype || ''; var a = $('#r-rooms-rate-' + i), b = $('#r-rooms-rtype-' + i); if (a) a.value = r.rate; if (b) b.value = r.rtype; var g = $('#r-rooms-gst-' + i); if (g) g.placeholder = String(H.slabRate(num(r.rate), d.cout)); }
      }
      if (n === 'rooms' && k === 'rate') { d.rooms[i]._auto = false; var g = $('#r-rooms-gst-' + i); if (g) g.placeholder = String(H.slabRate(num(d.rooms[i].rate), d.cout)); }
    },
    input: function (p, el, d, K) {
      if (p === 'kind') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      if (p === 'stay' && d.stay === 'out' && d.print !== 'bill') { d.print = 'bill'; K.refill(); }
      if (p === 'cin' && d.cout <= d.cin) { d.cout = H.addDays(d.cin, 1); var c = $('#k-cout'); if (c) c.value = d.cout; }
    },
    sums: sums,
    edSums: function (d, o, K) {
      var cl = H.clashesOf(BOOKS, d, K.editing()), dd = H.doubled(d), warn = '';
      cl.forEach(function (c) { warn += '<span class="warn">' + esc(t('ht.clash', { r: c.rno, g: c['with'].map(function (b) { return guest(b) + ' ' + shortDate(b.cin) + '–' + shortDate(b.cout); }).join('; ') })) + '</span>'; });
      if (dd.length) warn += '<span class="warn">' + esc(t('ht.dbl', { r: dd.join(', ') })) + '</span>';
      return '<span>' + esc(t('ht.sum.n', { n: o.nights })) + '</span><span>' + esc(t('ht.sum.r', { v: NS.money(o.rooms) })) + '</span>' + (o.extras ? '<span>' + esc(t('ht.sum.x', { v: NS.money(o.extras) })) + '</span>' : '') +
        (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (o.due && o.total ? '<span>' + esc(t('lr.s.due', { v: NS.money(o.due) })) + '</span>' : '') + warn;
    },
    validate: function (d, o) {
      var p = [], rs = d.rooms.filter(function (r) { return String(r.rno || '').trim() || num(r.rate); });
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('ht.v.guest')]);
      if (!H.isDate(d.cin) || !H.isDate(d.cout) || d.cout < d.cin) p.push(['k-cout', t('ht.v.dates')]);
      if (!rs.length || rs.some(function (r) { return !String(r.rno || '').trim() || !(num(r.rate) > 0); })) p.push([rs.length ? 'r-rooms-rate-0' : 'ed', t('ht.v.rooms')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    confirm: function (d, o, K) {
      var cl = d.stay === 'cancel' ? [] : H.clashesOf(BOOKS, d, K.editing());
      if (cl.length) return t('ht.c.clash', { r: cl.map(function (c) { return c.rno; }).join(', ') });
      return d.paid === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : '';
    },
    masterItems: function (d) { return d.extras.filter(function (x) { return String(x.desc || '').trim(); }).map(function (x) { return { desc: String(x.desc).trim(), hsn: x.hsn || '', unit: '', rate: x.rate, gst: d.kind === 'tax' ? x.gst : '', kind: 'service' }; }); },
    record: function (rec) {
      rec.items = H.lines(rec).map(function (l) { return { desc: l.desc, hsn: l.hsn, unit: l.unit, qty: l.qty, rate: l.rate, disc: '', gst: rec.kind === 'tax' ? l.gst : 0 }; });
      rec.withGst = rec.kind === 'tax'; rec.status = rec.paid === 'paid' ? 'paid' : 'unpaid';
      rec.rooms = rec.rooms.filter(function (r) { return String(r.rno || '').trim() || num(r.rate); }); rec.rooms.forEach(function (r) { delete r._auto; });
      rec.extras = rec.extras.filter(function (x) { return String(x.desc || '').trim() || num(x.rate); });
    },
    load: function (d) { if (!d.rooms || !d.rooms.length) d.rooms = [rrow()]; if (!d.extras) d.extras = []; },
    copyOf: function (d) { var td = NS.today(); d.stay = 'booked'; d.print = 'card'; d.paid = 'unpaid'; d.adv = ''; d.cin = td; d.cout = H.addDays(td, 1); d.extras = []; d.items = []; },
    copyLbl: 'ht.again',
    histName: function (d) { return guest(d) + ' · ' + nosText(d); },
    histText: function (d) { return [d.buyer && d.buyer.phone, nosText(d), d.idn].join(' '); },
    histPill: function (d) { return ' <span class="pill' + (d.stay === 'out' ? ' ok' : '') + '">' + esc(t('ht.s.' + (d.stay || 'booked'))) + '</span> <small>' + esc(shortDate(d.cin) + '–' + shortDate(d.cout)) + '</small>'; },
    shareText: function (d, o) { return '\n' + waText(d, o); },
    upiShare: false,
    saved: function () { loadAll().then(function () { K.changed(); }); },
    sheet: function (d, o, K, label) {
      var bill = d.print === 'bill', b = d.buyer, tax = d.kind === 'tax';
      var meta = [[bill ? 'Bill No.' : 'Booking No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Check-in', NS.fmtDate(d.cin) + (d.cinT ? ' · ' + esc(d.cinT) : '')], ['Check-out', NS.fmtDate(d.cout) + (d.coutT ? ' · ' + esc(d.coutT) : '')],
        ['Nights', String(o.nights)], ['Guests', esc(String(d.adults || '1')) + ' adult' + (num(d.adults) === 1 ? '' : 's') + (num(d.kids) ? ', ' + esc(d.kids) + ' child' + (num(d.kids) === 1 ? '' : 'ren') : '')], ['Status', esc({ booked: 'Booked', 'in': 'Checked in', out: 'Checked out', cancel: 'Cancelled' }[d.stay] || '')]];
      var title = bill ? (d.kind === 'tax' ? 'TAX INVOICE (HOTEL ACCOMMODATION)' : d.kind === 'supply' ? 'BILL OF SUPPLY' : 'HOTEL BILL') : 'BOOKING CONFIRMATION AND REGISTRATION CARD';
      var head = K.open(d, 'hotel') + K.head(d, title, label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, 'Guest') + '</div>';
      var reg = !bill ? '<div class="nt"><div><h4>Guest details</h4><p>' + [d.nation ? 'Nationality: ' + esc(d.nation) : '', d.idn ? esc(d.idt || 'ID') + ': <span class="mono">' + esc(d.idn) + '</span>' : '', d.from ? 'Coming from: ' + esc(d.from) : '', d.purpose ? 'Purpose: ' + esc(d.purpose) : ''].filter(Boolean).join('<br>') + '</p></div></div>' : '';
      var lines = o.rows.length ? '<table class="lines"><thead><tr><th>#</th><th class="l">Room and charges</th>' + (tax && bill ? '<th>SAC</th>' : '') + '<th class="n">Qty</th><th class="n">' + (bill ? 'Rate' : 'Tariff / night') + '</th><th class="n">Amount</th>' + (tax && bill ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
        o.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.l.desc) + '</td>' + (tax && bill ? '<td class="mono">' + esc(r.l.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(r.l.qty) + (r.l.kind === 'room' ? ' night' + (r.l.qty === 1 ? '' : 's') : '') + '</td><td class="n">' + NS.money(r.l.rate, false) + '</td><td class="n">' + NS.money(r.value, false) + '</td>' + (tax && bill ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' : '';
      var tot = K.tot([['Rooms', NS.money(o.rooms)], o.extras ? ['Other charges', NS.money(o.extras)] : null, tax && bill && !o.igst ? ['CGST', NS.money(o.cgst)] : null, tax && bill && !o.igst ? ['SGST', NS.money(o.sgst)] : null, tax && bill && o.igst ? ['IGST', NS.money(o.igst)] : null,
        o.roundOff && bill ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, [bill ? 'Total' : 'Estimated total', NS.money(o.total), 'grand'], o.adv ? ['Advance received', '−' + NS.money(o.adv)] : null, o.due && o.due !== o.total ? ['Balance due', NS.money(o.due)] : null]);
      if (!bill) {
        return head + reg + lines + '<div class="foot"><div class="foot-l">' + (tax ? '<p class="small">GST is added as applicable on the day of check-out.</p>' : '') + (d.terms ? '<div class="nt"><div><h4>Terms</h4><p>' + esc(d.terms).replace(/\n/g, '<br>') + '</p></div></div>' : '') + '</div><div class="foot-r">' + tot + '</div></div>' +
          '<div class="signs">' + K.blankSign('I agree to the terms above.', 'Guest’s signature') + K.sign(d, '', 'Reception') + '</div>' + K.made() + '</div>';
      }
      return head + lines + '<div class="foot"><div class="foot-l">' + K.words(o.total) + (d.kind === 'supply' ? '<p class="small">Composition taxable person, not eligible to collect tax on supplies.</p>' : '') +
        (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + tot + (d.paid !== 'paid' ? K.qr(d, o.due) : '') + '</div></div>' +
        '<div class="signs">' + K.blankSign('Received the above with thanks.', 'Guest’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) {
      $$('[data-ht]', ed).forEach(function (b) { b.addEventListener('click', function () {
        var a = b.getAttribute('data-ht'), d = K.doc();
        if (a === 'rooms') roomsDialog(); else if (a === 'diary') diaryDialog(); else if (a === 'today') todayDialog();
        else if (a === 'wa') { var ph = String(d.buyer.phone || '').replace(/\D/g, '').slice(-10); window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(waText(d, sums(d))), '_blank', 'noopener'); }
        else if (a === 'out') { var td = NS.today(); d.stay = 'out'; d.print = 'bill'; if (td >= d.cin) d.cout = td; K.refill(); NS.toast(t('ht.outdone')); }
      }); });
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      loadAll().then(function () { K.changed(); });
      if ($('#ht-dlg')) return;
      var x = NS.el('dialog', { id: 'ht-dlg', 'aria-labelledby': 'ht-dlg-h', 'class': 'ht-dlg' }, '<div class="dlg-h"><h2 id="ht-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-body></div>');
      document.body.appendChild(x);
      $('[data-close]', x).textContent = t('close');
      document.addEventListener('ns-lang', function () { $('[data-close]', x).textContent = t('close'); });
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      x.addEventListener('click', function (e) {
        var o = e.target.closest('[data-open]'); if (o) { openStay(o.getAttribute('data-open')); return; }
        var r = e.target.closest('[data-rm]'); if (r) { roomClick(r); return; }
        var s = e.target.closest('[data-dy]'); if (s && s.getAttribute('data-dy') === 'csv') { download(H.csv(H.stayRows(BOOKS)), 'Stays'); return; } if (s) { diaryFrom = H.addDays(diaryFrom || NS.today(), +s.getAttribute('data-dy')); diaryDialog(); }
      });
      x.addEventListener('change', function (e) {
        if (e.target.id === 'ht-from' && H.isDate(e.target.value)) { diaryFrom = e.target.value; diaryDialog(); }
        if (e.target.id === 'ht-days') { diaryDays = +e.target.value; diaryDialog(); }
      });
    }
  });
})();
