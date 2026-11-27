/* tripsheet.niveshsahayak.in: trip sheets for a small taxi operator, travel agency or courier agent (India plan C).
   Record type 'tsh' (mode taxi | travel | courier). The customer (or the sender of the parcels) is `buyer`, so the sheet reaches NSBiz as a
   sale to that party once it is saved (record() turns the lines into one or two bill lines). Own costs, commission and COD to hand over stay on the sheet.
   The sums are in engine/sheetcore.js (NSSheet). GST is only what the user types: this tool states no GST rate. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, S = window.NSSheet;
  var K, DOCS = [], view = 'sum', by = 'day', from = '', to = '';
  function line(mode) {
    return mode === 'travel' ? { date: '', desc: '', ref: '', base: '', svc: '', comm: '' } : mode === 'courier' ? { date: '', ref: '', to: '', n: '', wt: '', charge: '', cod: '', handed: '' } : { date: '', desc: '', km: '', rate: '', amt: '', extra: '' };
  }
  function who() { return String(K.doc().seller.name || '').trim(); }
  function mode() { return K.doc().tmode || 'taxi'; }
  function fd(x) { return NS.fmtDate(x); }
  function load() { return NSStore.list('doc').then(function (all) { DOCS = all; return all; }); }
  function sums(d) { return S.calc(d); }
  function xl(file, sheets) { NS.xlsx(file, sheets.map(function (s) { return { name: s[0], rows: s[1] }; })); }
  function leftFn() {
    var left = {};
    try { NSBooks.bills(DOCS, who()).bills.forEach(function (b) { if (b.type === 'tsh') left[b.id] = b.left; }); } catch (e) { return null; }
    return function (d) { return left[d.id] != null ? left[d.id] : 0; };
  }

  /* ---------- the summary desk ---------- */
  function tabs() {
    return '<div class="row gr-tabs">' + [['sum', 'ts.sum'], ['par', 'ts.par']].map(function (x) { return '<button type="button" class="btn sm' + (view === x[0] ? ' primary' : '') + '" data-sv="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
  }
  function show(v) {
    view = v || view; var d = $('#ts-dlg'), b = $('[data-sb]', d), m = mode(), w = who();
    load().then(function () {
      if (!from) { var td = NS.today(); from = td.slice(0, 8) + '01'; to = td; }
      var html = '';
      if (view === 'sum') {
        var s = S.summary(DOCS, w, m, from, to, by), tt = s.total;
        html = tabs() + '<p class="hint">' + esc(t('ts.mode.' + m)) + '</p><div class="row tp-per"><div class="f"><label for="tsf-from">' + esc(t('tp.from')) + '</label><input id="tsf-from" type="date" value="' + esc(from) + '"></div><div class="f"><label for="tsf-to">' + esc(t('tp.to')) + '</label><input id="tsf-to" type="date" value="' + esc(to) + '"></div>' +
          '<div class="f"><label for="tsf-by">' + esc(t('ts.by')) + '</label><select id="tsf-by"><option value="day"' + (by === 'day' ? ' selected' : '') + '>' + esc(t('ts.byday')) + '</option><option value="month"' + (by === 'month' ? ' selected' : '') + '>' + esc(t('ts.bymonth')) + '</option></select></div></div>';
        var tiles = m === 'taxi' ? [[t('ts.t.trips'), tt.items], [t('ts.t.km'), NS.qty(tt.km)], [t('ts.t.amount'), NS.money(tt.amount)], [t('ts.t.profit'), NS.money(tt.profit), 1]]
          : m === 'travel' ? [[t('ts.t.book'), tt.items], [t('ts.t.billed'), NS.money(tt.amount)], [t('ts.t.svc'), NS.money(tt.svc)], [t('ts.t.earn'), NS.money(tt.profit), 1]]
          : [[t('ts.t.parcels'), tt.parcels], [t('ts.t.charge'), NS.money(tt.amount)], [t('ts.t.cod'), NS.money(tt.cod)], [t('ts.t.hold'), NS.money(tt.codHold), 1]];
        html += '<div class="tiles">' + tiles.map(function (x) { return '<div class="tile' + (x[2] ? ' ok' : '') + '"><span>' + esc(x[0]) + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>';
        var head = m === 'taxi' ? [t('ts.h.period'), t('ts.t.trips'), t('ts.t.km'), t('ts.t.amount')] : m === 'travel' ? [t('ts.h.period'), t('ts.t.book'), t('ts.t.billed'), t('ts.t.svc'), t('ts.h.comm')] : [t('ts.h.period'), t('ts.h.entries'), t('ts.t.parcels'), t('ts.t.charge'), t('ts.t.cod'), t('ts.t.hold')];
        var row = function (x, l) { return m === 'taxi' ? [l, x.items, NS.qty(x.km), NS.money(x.amount)] : m === 'travel' ? [l, x.items, NS.money(x.amount), NS.money(x.svc), NS.money(x.comm)] : [l, x.items, x.parcels, NS.money(x.amount), NS.money(x.cod), NS.money(x.codHold)]; };
        html += s.rows.length ? '<div class="tbl-wrap"><table class="day"><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' class="n"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          s.rows.map(function (x) { return '<tr>' + row(x, by === 'day' ? fd(x.k) : x.k).map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + esc(String(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '<p>' + esc(t('ts.nodata')) + '</p>';
        if (m === 'taxi') html += '<p class="hint">' + esc(t('ts.costs', { v: NS.money(tt.costs) })) + '</p>';
        html += '<div class="row"><button type="button" class="btn" data-sx="sum">' + esc(t('tp.excel')) + '</button></div>';
      } else {
        var ps = S.parties(DOCS, w, m, leftFn());
        html = tabs() + '<p class="hint">' + esc(t('ts.mode.' + m)) + '</p>' + (ps.length ? '<ul class="gr-list">' + ps.map(function (p) {
          var txt = 'Hello ' + p.party + ', ' + (p.due ? 'amount due to ' + (w || 'us') + ': ' + S.money(p.due) + '. ' : 'your account with ' + (w || 'us') + ' is clear. ') + (p.cod ? 'COD to hand over: ' + S.money(p.cod) + '. ' : '') + 'Thank you.', ph = S.phone10(p.phone);
          return '<li' + (p.due ? ' class="warn"' : '') + '><div class="gr-m"><b>' + esc(p.party) + '</b><small>' + esc([t('ts.p.n', { n: p.n }), t('ts.p.billed') + ' ' + NS.money(p.total), p.due ? t('ts.p.due') + ' ' + NS.money(p.due) : '', p.cod ? t('ts.t.hold') + ' ' + NS.money(p.cod) : '', fd(p.last)].filter(Boolean).join(' · ')) + '</small></div><div class="gr-a">' +
            '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/' + (ph ? '91' + ph : '') + '?text=' + encodeURIComponent(txt) + '">' + esc(t('tp.wa')) + '</a></div></li>';
        }).join('') + '</ul><p class="hint">' + esc(t('ts.p.h')) + '</p><div class="row"><button type="button" class="btn" data-sx="par">' + esc(t('tp.excel')) + '</button></div>' : '<p>' + esc(t('ts.nodata')) + '</p>');
      }
      b.innerHTML = html;
      if (!d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
    });
  }

  K = NS.kit({
    type: 'tsh', prefix: 'TS', digits: 4, paper: 'a5', papers: NS.PAPER_ALL, copies: 2, copyLabels: ['Customer copy', 'Office copy'],
    name: function (d) { return d.tmode === 'travel' ? 'Booking Bill' : d.tmode === 'courier' ? 'Courier Statement' : 'Trip Sheet'; },
    blank: function () { return { tmode: 'taxi', lines: [line('taxi')], gstOn: 'none', gst: '', status2: 'unpaid', payMode: 'cash', driverPay: '', fuel: '', otherCost: '', round: false }; },
    newRow: function () { return line(mode()); },
    keepOnNew: function (d) { return { tmode: d.tmode, gstOn: d.gstOn, gst: d.gst, paper: d.paper, copies: d.copies, lines: [line(d.tmode)] }; },
    party: 'customer',
    form: function (K) {
      return K.numCard(K.f('tmode', t('ts.mode'), { type: 'select', opts: [['taxi', t('ts.m.taxi')], ['travel', t('ts.m.travel')], ['courier', t('ts.m.courier')]], hint: t('ts.modeh') }), t('ts.lg')) +
        K.card(t('ts.cust'), '<div class="fg">' + K.f('buyer.name', t('l.cname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) + K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) +
          K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + '</div>') +
        K.card(t('ts.lines'), '<p class="hint" data-lh></p>' + K.list('lines', t('ts.addline'))) +
        K.card(t('ts.money'), '<div class="fg">' + K.f('gstOn', t('ts.gston'), { type: 'select', opts: [['none', t('ts.g.none')], ['all', t('ts.g.all')], ['svc', t('ts.g.svc')]], hint: t('ts.gsth') }) +
          K.f('gst', t('ts.gstrate'), { mode: 'decimal', ltr: 1, show: '!gstOn=none', hint: t('ts.gstrateh') }) +
          K.f('status2', t('l.pay'), { type: 'select', opts: [['unpaid', t('pay.unpaid')], ['paid', t('pay.paid')]] }) + K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank']), show: 'status2=paid' }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div></div>') +
        K.card(t('ts.own'), '<p class="hint">' + esc(t('ts.ownh')) + '</p><div class="fg">' + K.f('driverPay', t('ts.driverpay'), { mode: 'decimal', ltr: 1 }) + K.f('fuel', t('ts.fuel'), { mode: 'decimal', ltr: 1 }) + K.f('otherCost', t('ts.othercost'), { mode: 'decimal', ltr: 1 }) + '</div>') +
        '<div class="row wide pos-go gr-go"><button type="button" class="btn" data-ts="wa">' + esc(t('jc.wa')) + '</button><button type="button" class="btn" data-ts="open">' + esc(t('ts.desk')) + '</button></div>' +
        K.bizCard({ lg: t('ts.lgbiz') }) + K.lookCard(K.f('terms', t('l.terms'), { type: 'textarea', wide: true }));
    },
    rows: {
      lines: function (l, i, K) {
        var m = mode(), r = function (k, lbl, o) { return K.rf('lines', i, k, lbl, o); }, dd = r('date', t('tp.date'), { type: 'date' });
        if (m === 'travel') return dd + r('desc', t('ts.l.book'), { cls: 'it-d' }) + r('ref', t('ts.l.ref')) + r('base', t('ts.l.base'), { mode: 'decimal', ltr: 1 }) + r('svc', t('ts.l.svc'), { mode: 'decimal', ltr: 1 }) + r('comm', t('ts.l.comm'), { mode: 'decimal', ltr: 1 });
        if (m === 'courier') return dd + r('ref', t('ts.l.awb')) + r('to', t('ts.l.to')) + r('n', t('ts.l.n'), { mode: 'numeric', ltr: 1 }) + r('wt', t('ts.l.wt'), { mode: 'decimal', ltr: 1 }) + r('charge', t('ts.l.charge'), { mode: 'decimal', ltr: 1 }) + r('cod', t('ts.l.cod'), { mode: 'decimal', ltr: 1 }) + r('handed', t('ts.l.handed'), { mode: 'decimal', ltr: 1 });
        return dd + r('desc', t('ts.l.trip'), { cls: 'it-d' }) + r('km', t('tp.km'), { mode: 'decimal', ltr: 1 }) + r('rate', t('ts.l.rate'), { mode: 'decimal', ltr: 1 }) + r('amt', t('ts.l.fixed'), { mode: 'decimal', ltr: 1 }) + r('extra', t('ts.l.extra'), { mode: 'decimal', ltr: 1 });
      }
    },
    input: function (p, el, d) {
      if (p === 'tmode') { d.lines = [line(d.tmode)]; if (d.tmode !== 'travel' && d.gstOn === 'svc') d.gstOn = 'all'; K.refill(); }
      if (p === 'gstOn' && d.gstOn === 'svc' && d.tmode !== 'travel') { d.gstOn = 'all'; K.refill(); }
    },
    sums: sums,
    edSums: function (d, o) {
      var m = o.mode;
      return (m === 'taxi' ? '<span>' + esc(t('ts.s.trips', { n: o.rows.length, k: NS.qty(o.km) })) + '</span>' : m === 'travel' ? '<span>' + esc(t('ts.s.book', { v: NS.money(o.base) })) + '</span><span>' + esc(t('ts.s.svc', { v: NS.money(o.svc) })) + '</span>' : '<span>' + esc(t('ts.s.parcels', { n: o.parcels })) + '</span>') +
        (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' +
        (m === 'courier' && o.cod ? '<span>' + esc(t('ts.s.hold', { v: NS.money(o.codHold) })) + '</span>' : '') + (m === 'travel' ? '<span>' + esc(t('ts.s.earn', { v: NS.money(o.profit) })) + '</span>' : (o.costs ? '<span>' + esc(t('ts.s.profit', { v: NS.money(o.profit) })) + '</span>' : ''));
    },
    drawn: function (d) { var h = $('[data-lh]'); if (h) h.textContent = t('ts.lh.' + (d.tmode || 'taxi')); },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('ts.v.cust')]);
      if (!o.rows.length) p.push(['r-lines-' + (d.tmode === 'travel' ? 'desc' : d.tmode === 'courier' ? 'ref' : 'desc') + '-0', t('ts.v.line')]);
      if (d.tmode !== 'courier' && o.rows.length && !(o.fare > 0)) p.push(['r-lines-' + (d.tmode === 'travel' ? 'base' : 'amt') + '-0', t('ts.v.amt')]);
      if (d.gstOn && d.gstOn !== 'none' && !(num(d.gst) > 0)) p.push(['k-gst', t('ts.v.rate')]);
      if (d.gstOn && d.gstOn !== 'none' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.buyer.gstin && !NS.gstinCheck(d.buyer.gstin).ok) p.push(['k-buyer-gstin', t('v.bg')]);
      if (d.tmode === 'courier' && o.handed > o.cod + 0.004) p.push(['r-lines-handed-0', t('ts.v.handed')]);
      return p;
    },
    confirm: function (d, o) { return d.status2 === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : ''; },
    /* for the books: the fare as bill lines; the customer is the party */
    record: function (rec, o) {
      var g = o.rate, nm = rec.tmode === 'travel' ? 'Travel booking' : rec.tmode === 'courier' ? 'Courier charges' : 'Taxi trips';
      rec.items = rec.tmode === 'travel' && rec.gstOn === 'svc'
        ? [{ desc: 'Tickets and bookings at cost (' + rec.no + ')', hsn: '', qty: 1, unit: 'Nos', rate: String(o.base), disc: '', gst: 0 }, { desc: 'Service charge (' + rec.no + ')', hsn: '', qty: 1, unit: 'Nos', rate: String(o.svc), disc: '', gst: g }]
        : [{ desc: nm + ' (' + rec.no + ')', hsn: '', qty: 1, unit: 'Nos', rate: String(o.fare), disc: '', gst: g }];
      rec.kind = g ? 'tax' : 'plain'; rec.withGst = !!g; rec.status = rec.status2 === 'paid' ? 'paid' : 'unpaid';
      rec.lines = (rec.lines || []).filter(function (l) { return !S.isEmpty(rec.tmode, l); });
    },
    load: function (d) { if (!d.lines || !d.lines.length) d.lines = [line(d.tmode || 'taxi')]; },
    saved: function () { load(); },
    copyOf: function (d) { d.lines = [line(d.tmode)]; d.status2 = 'unpaid'; d.driverPay = d.fuel = d.otherCost = ''; },
    histName: function (d) { return t('ts.m.' + (d.tmode || 'taxi')) + ' · ' + (d.buyer && d.buyer.name || ''); },
    histText: function (d) { return (d.lines || []).map(function (l) { return [l.desc, l.ref, l.to].join(' '); }).join(' '); },
    histPill: function (d) { return ' <span class="pill' + (d.status2 === 'paid' ? ' ok' : '') + '">' + esc(t('pay.' + (d.status2 === 'paid' ? 'paid' : 'unpaid'))) + '</span>'; },
    shareText: function (d, o) { return '\n' + S.waText(d, o, d.seller.name, fd); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var m = d.tmode || 'taxi', tax = o.tax > 0, b = d.buyer, title = m === 'travel' ? 'BOOKING BILL' : m === 'courier' ? 'COURIER STATEMENT' : 'TRIP SHEET';
      if (tax) title = (m === 'travel' ? 'TAX INVOICE (BOOKING)' : m === 'courier' ? 'TAX INVOICE (COURIER)' : 'TAX INVOICE (TRIPS)');
      var meta = [['Sheet No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', fd(d.date)], m === 'courier' ? ['Parcels', String(o.parcels)] : null, m === 'taxi' && o.km ? ['Total km', NS.qty(o.km)] : null];
      var th = m === 'taxi' ? '<th>#</th><th>Date</th><th class="l">Trip</th><th class="n">Km</th><th class="n">Rate</th><th class="n">Extra</th><th class="n">Amount</th>'
        : m === 'travel' ? '<th>#</th><th>Date</th><th class="l">Booking</th><th>Ref</th><th class="n">Fare</th><th class="n">Service charge</th><th class="n">Amount</th>'
        : '<th>#</th><th>Date</th><th>Reference</th><th class="l">To</th><th class="n">Parcels</th><th class="n">Charge</th><th class="n">COD</th>';
      var tr = o.rows.map(function (r, i) {
        var l = r.l, dt = fd(l.date || d.date), c;
        c = m === 'taxi' ? '<td class="l">' + esc(l.desc) + '</td><td class="n">' + (num(l.km) ? NS.qty(num(l.km)) : '') + '</td><td class="n">' + (num(l.rate) ? NS.money(num(l.rate)) : '') + '</td><td class="n">' + (num(l.extra) ? NS.money(num(l.extra)) : '') + '</td><td class="n">' + NS.money(r.amt) + '</td>'
          : m === 'travel' ? '<td class="l">' + esc(l.desc) + '</td><td>' + esc(l.ref) + '</td><td class="n">' + NS.money(num(l.base)) + '</td><td class="n">' + NS.money(num(l.svc)) + '</td><td class="n">' + NS.money(r.amt) + '</td>'
          : '<td>' + esc(l.ref) + '</td><td class="l">' + esc(l.to) + '</td><td class="n">' + (String(l.n).trim() === '' || l.n == null ? 1 : esc(l.n)) + '</td><td class="n">' + NS.money(num(l.charge)) + '</td><td class="n">' + (num(l.cod) ? NS.money(num(l.cod)) : '') + '</td>';
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(dt) + '</td>' + c + '</tr>';
      }).join('');
      var rows = [[m === 'courier' ? 'Charges' : 'Fare', NS.money(o.fare)]];
      if (tax) rows.push(['Taxable value', NS.money(o.gstBase)], o.cgst ? ['CGST ' + o.rate / 2 + '%', NS.money(o.cgst)] : null, o.sgst ? ['SGST ' + o.rate / 2 + '%', NS.money(o.sgst)] : null, o.igst ? ['IGST ' + o.rate + '%', NS.money(o.igst)] : null);
      rows.push(['Total', NS.money(o.total), 'grand'], d.status2 === 'paid' ? ['Received', NS.money(o.total)] : null);
      var cod = m === 'courier' && o.cod ? '<p class="small"><b>COD collected:</b> ' + NS.money(o.cod) + ' · <b>handed over:</b> ' + NS.money(o.handed) + ' · <b>to hand over:</b> ' + NS.money(o.codHold) + '</p>' : '';
      return K.open(d, 'tsh') + K.head(d, title, label || '') + K.meta(meta) + '<div class="parties">' + K.party(b, m === 'courier' ? 'Sender' : 'Customer') + '</div>' +
        '<table class="lines"><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table>' +
        '<div class="foot"><div class="foot-l">' + K.words(o.total) + cod + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + (d.terms ? '<p class="small">' + esc(d.terms).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot(rows) + (d.status2 !== 'paid' ? K.qr(d, o.due) : '') + '</div></div>' +
        '<div class="signs">' + K.blankSign('', m === 'courier' ? 'Sender’s signature' : 'Customer’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed, K0) {
      K = K0;
      $('[data-ts="open"]', ed).addEventListener('click', function () { show('sum'); });
      $('[data-ts="wa"]', ed).addEventListener('click', function () {
        var d = K.doc(), ph = S.phone10(d.buyer.phone);
        window.open('https://wa.me/' + (ph ? '91' + ph : '') + '?text=' + encodeURIComponent(S.waText(d, sums(d), d.seller.name, fd)), '_blank', 'noopener');
      });
    },
    ready: function (K0) {
      K = K0; load();
      if ($('#ts-dlg')) return;
      var x = NS.el('dialog', { id: 'ts-dlg', 'aria-labelledby': 'ts-dlg-h' }, '<div class="dlg-h"><h2 id="ts-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-sb></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      x.addEventListener('click', function (e) {
        var v = e.target.closest('[data-sv]'), xb = e.target.closest('[data-sx]');
        if (v) show(v.getAttribute('data-sv'));
        else if (xb) {
          var m = mode(), w = who();
          if (xb.getAttribute('data-sx') === 'sum') xl('trip-sheets-' + m + '-' + NS.today() + '.xlsx', [['Summary', S.summaryRows(m, S.summary(DOCS, w, m, from, to, by))], ['Entries', S.sheetRows(DOCS, w, m, from, to)]]);
          else xl('parties-' + m + '-' + NS.today() + '.xlsx', [['Parties', S.partyRows(S.parties(DOCS, w, m, leftFn()))]]);
        }
      });
      x.addEventListener('change', function (e) {
        if (e.target.id === 'tsf-from') from = e.target.value; else if (e.target.id === 'tsf-to') to = e.target.value; else if (e.target.id === 'tsf-by') by = e.target.value; else return;
        show();
      });
      function nm() { $('h2', x).textContent = t('ts.desk'); $('[data-close]', x).textContent = t('close'); }
      nm(); document.addEventListener('ns-lang', function () { nm(); if (x.open) show(); });
    }
  });
})();
