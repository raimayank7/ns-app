/* restaurant.niveshsahayak.in: restaurant bill and kitchen order ticket (KOT). Running tables are saved orders with status 'open';
   settling one makes it a paid (or credit) bill. Record type 'resto' (a sale in the Nivesh Sahayak App once settled).
   GST on restaurant service is one rate for the whole bill: 5% without input tax credit for most restaurants, 18% in "specified
   premises" (hotels with a room tariff above Rs 7,500 a day), none under composition or without registration. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t;
  var K, OPEN = [];
  function row() { return { desc: '', qty: 1, price: '', rate: '', note: '', kot: 0, hsn: '9963', unit: 'Plate', disc: '', gst: 5 }; }
  function gstOf(d) { return d.gstMode === '18' ? 18 : d.gstMode === '5' ? 5 : 0; }
  function kindOf(d) { return d.gstMode === 'comp' ? 'supply' : d.gstMode === 'none' ? 'plain' : 'tax'; }
  function sync(d) {
    var g = gstOf(d);
    d.items.forEach(function (it) { var p = num(it.price); it.gst = g; it.disc = d.disc || ''; it.hsn = '9963'; it.rate = p ? String(d.incl && g ? Math.round(p / (1 + g / 100) * 10000) / 10000 : p) : ''; });
  }
  function sums(d) {
    var g = gstOf(d), o = { rows: [], food: 0, disc: 0, sc: 0, taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, qty: 0 };
    d.items.forEach(function (it) {
      var q = num(it.qty), r = num(it.rate);
      if (!it.desc && !r) return;
      var v = r2(q * r); o.rows.push({ it: it, value: v, show: r2(q * num(it.price)) }); o.food += v; o.qty += q;
    });
    o.food = r2(o.food); o.disc = r2(o.food * num(d.disc) / 100);
    o.sc = d.sc ? r2((o.food - o.disc) * num(d.scRate) / 100) : 0;
    o.taxable = r2(o.food - o.disc + o.sc); o.tax = r2(o.taxable * g / 100);
    o.intra = !d.buyer.state || !d.seller.state || d.buyer.state === d.seller.state;
    if (o.intra) { o.cgst = r2(o.tax / 2); o.sgst = r2(o.tax - o.cgst); } else o.igst = o.tax;
    var total = r2(o.taxable + o.tax); o.roundOff = r2(Math.round(total) - total); o.total = r2(total + o.roundOff);
    o.split = num(d.split) > 1 ? r2(o.total / Math.floor(num(d.split))) : 0;
    o.newKot = d.items.filter(function (it) { return it.desc && !it.kot; }).length;
    return o;
  }
  function loadOpen() {
    var who = String(K.doc().seller.name || '').trim().toLowerCase();
    return NSStore.list('doc').then(function (all) {
      OPEN = all.filter(function (x) { return x.type === 'resto' && x.status === 'open' && String(x.seller && x.seller.name || '').trim().toLowerCase() === who; })
        .sort(function (a, b) { return String(a.table).localeCompare(String(b.table), 'en', { numeric: true }); });
      var bar = $('#rt-tables'); if (!bar) return;
      bar.innerHTML = '<b>' + esc(t('rt.running')) + '</b> ' + (OPEN.length ? OPEN.map(function (x) { return '<button type="button" class="btn sm' + (x.id === K.editing() ? ' primary' : '') + '" data-tbl="' + x.id + '">' + esc(x.table || x.no) + ' · ' + NS.money(x.total || 0) + '</button>'; }).join('') : '<span class="soft">' + esc(t('rt.none')) + '</span>') +
        ' <button type="button" class="btn sm" data-rt="newtable">' + esc(t('rt.newt')) + '</button>';
    });
  }
  function kot() {
    var d = K.doc(), o = sums(d);
    if (!o.newKot) { NS.toast(t('rt.nokot'), 'bad'); return; }
    if (!String(d.table || '').trim() && d.otype === 'dine') { NS.toast(t('rt.v.table'), 'bad'); var f = $('#k-table'); if (f) f.focus(); return; }
    var n = (d.kotNo || 0) + 1;
    d.items.forEach(function (it) { if (it.desc && !it.kot) it.kot = n; });
    d.kotNo = n; d._kot = n;
    if (d.status !== 'open' && !K.editing()) d.status = 'open';
    K.save().then(function () { K.print(); setTimeout(function () { delete d._kot; K.changed(); loadOpen(); }, 1500); }, function () { delete d._kot; d.items.forEach(function (it) { if (it.kot === n) it.kot = 0; }); d.kotNo = n - 1; K.changed(); });
  }
  function settle(print) {
    var d = K.doc(); d.status = d.payMode === 'credit' ? 'unpaid' : 'paid';
    K.save().then(function () { if (print) K.print(); setTimeout(function () { K.startNew(); loadOpen(); }, print ? 1500 : 0); }, function () { d.status = 'open'; K.changed(); });
  }

  K = NS.kit({
    type: 'resto', prefix: 'RB', digits: 4, paper: 'th80', papers: ['th80', 'th58', 'a5', 'a4'],
    name: function (d) { return d._kot ? 'KOT' : kindOf(d) === 'tax' ? 'Invoice' : kindOf(d) === 'supply' ? 'Bill of Supply' : 'Bill'; },
    blank: function () { return { status: 'open', otype: 'dine', table: '', waiter: '', guests: '', gstMode: '5', incl: false, disc: '', sc: false, scRate: '5', split: '', payMode: 'cash', kotNo: 0, kind: 'tax', withGst: true, items: [row()] }; },
    newRow: function (n, d) { var it = row(); it.gst = gstOf(d); return it; },
    keepOnNew: function (d) { return { gstMode: d.gstMode, incl: d.incl, paper: d.paper, scRate: d.scRate }; },
    emptyRows: false,
    form: function (K) {
      return '<div class="rt-tables" id="rt-tables"></div>' +
        K.card(t('rt.order'), '<div class="fg">' +
          K.f('otype', t('rt.otype'), { type: 'select', opts: [['dine', t('rt.dine')], ['take', t('rt.take')], ['del', t('rt.del')]] }) +
          K.f('table', t('rt.table'), { ltr: 1, show: 'otype=dine', ph: 'T4' }) + K.f('guests', t('rt.guests'), { mode: 'numeric', ltr: 1, show: 'otype=dine' }) + K.f('waiter', t('rt.waiter')) +
          '</div>' + K.list('items', t('rt.additem')) + '<div class="sums" id="ed-sums" aria-live="polite"></div>' +
          '<div class="row pos-go"><button type="button" class="btn" data-rt="kot">' + esc(t('rt.kot')) + '</button><button type="button" class="btn" data-rt="hold">' + esc(t('rt.hold')) + '</button></div>') +
        K.card(t('rt.billcard'), '<div class="fg">' +
          K.f('disc', t('rt.disc'), { mode: 'decimal', ltr: 1 }) +
          K.f('sc', t('rt.sc'), { type: 'check', hint: t('rt.sch') }) + K.f('scRate', t('rt.scrate'), { mode: 'decimal', ltr: 1, show: 'sc' }) +
          K.f('split', t('rt.split'), { mode: 'numeric', ltr: 1, hint: t('rt.splith') }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card']).concat([['credit', t('rt.credit')]]) }) +
          K.f('buyer.name', t('rt.guest'), { hint: t('rt.guesth') }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states(), show: 'buyer.gstin' }) +
          '</div><div class="row pos-go"><button type="button" class="btn primary" data-rt="settle">' + esc(t('rt.settle')) + '</button><button type="button" class="btn" data-rt="settlenp">' + esc(t('rt.settlenp')) + '</button></div>') +
        '<details class="more card"' + (K.doc().seller.name ? '' : ' open') + '><summary>' + esc(t('rt.setup')) + '</summary>' +
          K.bizCard({}).replace(/^<fieldset class="card">/, '<fieldset class="card flat">') +
          K.card(t('pos.billset'), '<div class="fg">' +
            K.f('gstMode', t('rt.gst'), { type: 'select', wide: true, opts: [['5', t('rt.g5')], ['18', t('rt.g18')], ['comp', t('rt.gcomp')], ['none', t('rt.gnone')]], hint: t('rt.gsth') }) +
            K.f('incl', t('rt.incl'), { type: 'check', show: '!gstMode=comp|none' }) +
            K.f('no', K.tw('l.no'), { max: 16, ltr: 1, hint: t('h.no2') }) + K.f('date', t('l.date'), { type: 'date' }) +
            K.f('paper', t('l.paper'), { type: 'select', opts: ['th80', 'th58', 'a5', 'a4'].map(function (k) { return [k, t('pp.' + k)]; }) }) +
            K.f('notes', t('l.notes'), { type: 'textarea', wide: true, ph: t('rt.noteph') }) + '</div>') + '</details>';
    },
    rows: {
      items: function (it, i, K) {
        return K.rf('items', i, 'desc', t('rt.dish'), { cls: 'it-d', sug: 'item' }) +
          '<div class="f pos-qty"><label for="r-items-qty-' + i + '">' + esc(t('l.qty')) + '</label><div class="step"><button type="button" class="btn sm" data-step="' + i + ':-1" aria-label="−1">−</button><input id="r-items-qty-' + i + '" data-r="items" data-i="' + i + '" data-k="qty" value="' + esc(it.qty) + '" inputmode="decimal" dir="ltr"><button type="button" class="btn sm" data-step="' + i + ':1" aria-label="+1">+</button></div></div>' +
          K.rf('items', i, 'price', t('l.rate'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'note', t('rt.knote'), { ph: t('rt.knoteph'), cls: 'it-d' }) +
          (it.kot ? '<p class="hint wide">' + esc(t('rt.sent', { n: it.kot })) + '</p>' : '');
      }
    },
    rowInput: function (n, i, k, d) { if (k === 'price' || k === 'qty') sync(d); },
    rowsDrawn: function (n, box, K) {
      $$('[data-step]', box).forEach(function (b) {
        b.addEventListener('click', function () {
          var x = b.getAttribute('data-step').split(':'), d = K.doc(), it = d.items[+x[0]];
          it.qty = String(Math.max(0, r2(num(it.qty) + +x[1])));
          if (!num(it.qty) && d.items.length > 1 && !it.kot) d.items.splice(+x[0], 1);
          sync(d); K.refill();
        });
      });
    },
    pickItem: function (it, m, d) { it.desc = m.desc; if (m.price != null && m.price !== '') it.price = String(m.price); else if (m.rate !== '' && m.rate != null) it.price = String(num(m.rate)); sync(d); },
    input: function (p, el, d, K) { if (p === 'gstMode' || p === 'incl' || p === 'disc') { d.kind = kindOf(d); d.withGst = d.kind === 'tax'; sync(d); K.refill(); } if (p === 'seller.name') loadOpen(); },
    sums: sums,
    edSums: function (d, o) {
      return '<span>' + esc(t('sum.items', { n: o.rows.length })) + '</span>' + (o.tax ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') + '<b class="pos-big">' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' +
        (o.split ? '<span>' + esc(t('rt.each', { n: Math.floor(num(d.split)), v: NS.money(o.split) })) + '</span>' : '') + (o.newKot ? '<span class="warn">' + esc(t('rt.newk', { n: o.newKot })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!o.rows.length) p.push(['r-items-desc-0', t('v.item')]);
      d.items.forEach(function (it, i) { if (!it.desc && num(it.price)) p.push(['r-items-desc-' + i, t('pos.v.name')]); });
      if (kindOf(d) === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.otype === 'dine' && d.status === 'open' && !String(d.table || '').trim()) p.push(['k-table', t('rt.v.table')]);
      return p;
    },
    confirm: function (d, o) { return d.status === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : ''; },
    masterItems: function (d) { return d.items.filter(function (it) { return it.desc; }).map(function (it) { return { desc: String(it.desc).trim(), price: it.price, rate: d.incl ? it.rate : it.price, hsn: '9963', unit: 'Plate', gst: gstOf(d) || '', kind: 'service' }; }); },
    /* the saved bill: every line carries the bill discount, and a service charge becomes its own line, so the App reads the taxable value right */
    record: function (rec, o) {
      rec.kind = kindOf(rec); rec.withGst = rec.kind === 'tax';
      rec.items = rec.items.filter(function (it) { return it.desc || num(it.rate); });
      if (o.sc) rec.items.push({ desc: 'Service charge', sc: 1, qty: 1, rate: String(o.sc), price: String(o.sc), disc: '', gst: gstOf(rec), hsn: '9963', unit: '' });
      if (rec.payMode === 'credit') { delete rec.payMode; }
      delete rec._kot;
    },
    load: function (d) { d.items = (d.items || []).filter(function (it) { return !it.sc; }); if (!d.payMode) d.payMode = d.status === 'unpaid' ? 'credit' : 'cash'; if (!d.items.length) d.items = [row()]; },
    saved: function () { loadOpen(); },
    copyOf: function (d) { d.status = 'open'; d.kotNo = 0; d.table = ''; d.items.forEach(function (it) { it.kot = 0; }); },
    histName: function (d) { return (d.table ? d.table + ' · ' : '') + (d.buyer && d.buyer.name || t({ dine: 'rt.dine', take: 'rt.take', del: 'rt.del' }[d.otype] || 'rt.dine')); },
    histPill: function (d) { return ' <span class="pill ' + (d.status === 'paid' ? 'ok' : '') + '">' + esc(t(d.status === 'open' ? 'rt.open' : d.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'; },
    upiShare: false,
    sheet: function (d, o, K) {
      var kind = kindOf(d), g = gstOf(d), b = d.buyer, ot = { dine: 'Dine-in', take: 'Takeaway', del: 'Delivery' }[d.otype] || '';
      var meta = [['Bill No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], d.otype === 'dine' ? ['Table', esc(d.table)] : ['Order', ot], d.guests ? ['Guests', esc(d.guests)] : null, d.waiter ? ['Served by', esc(d.waiter)] : null,
        b.name ? ['Guest', esc(b.name)] : null, b.gstin ? ['GSTIN', '<span class="mono">' + esc(b.gstin) + '</span>'] : null];
      if (d._kot) {
        var lines = d.items.filter(function (it) { return it.desc && it.kot === d._kot; });
        return '<div class="sh th ' + esc(d.paper === 'th58' ? 'th58' : 'th80') + ' kot" lang="en-IN" dir="ltr"><p class="dt">KITCHEN ORDER TICKET</p>' +
          K.kv([['KOT No.', d._kot], [d.otype === 'dine' ? 'Table' : 'Order', d.otype === 'dine' ? '<b>' + esc(d.table) + '</b>' : ot], ['Time', new Date().toTimeString().slice(0, 5)], d.waiter ? ['Waiter', esc(d.waiter)] : null]) +
          '<table class="tl"><thead><tr><th class="l">Item</th><th class="n">Qty</th></tr></thead><tbody>' + lines.map(function (it) { return '<tr><td class="l"><b>' + esc(it.desc) + '</b>' + (it.note ? '<br><small>' + esc(it.note) + '</small>' : '') + '</td><td class="n"><b>' + NS.qty(num(it.qty)) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
      }
      var title = kind === 'tax' ? 'TAX INVOICE' : kind === 'supply' ? 'BILL OF SUPPLY' : 'BILL';
      var tot = [['Food and beverages', NS.money(o.food)], o.disc ? ['Discount (' + num(d.disc) + '%)', '−' + NS.money(o.disc)] : null, o.sc ? ['Service charge (' + num(d.scRate) + '%)', NS.money(o.sc)] : null,
        g ? ['Taxable value', NS.money(o.taxable)] : null, g && o.intra ? ['CGST ' + g / 2 + '%', NS.money(o.cgst)] : null, g && o.intra ? ['SGST ' + g / 2 + '%', NS.money(o.sgst)] : null, g && !o.intra ? ['IGST ' + g + '%', NS.money(o.igst)] : null,
        o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand'],
        o.split ? ['Split ' + Math.floor(num(d.split)) + ' ways', NS.money(o.split) + ' each'] : null];
      var notes = (kind === 'supply' ? 'Composition taxable person, not eligible to collect tax on supplies.' : '') + (d.incl && g ? (kind === 'supply' ? ' ' : '') + 'Menu prices include GST.' : '') + (g ? ' SAC 9963, restaurant service.' : '');
      var pay = d.status === 'open' ? 'NOT SETTLED' : d.status === 'paid' ? 'PAID · ' + K.mode(d.payMode) : 'ON CREDIT';
      if (/^th/.test(d.paper)) {
        return K.thOpen(d, title) + K.kv(meta) + '<table class="tl"><thead><tr><th class="l">Item</th><th class="n">Amount</th></tr></thead><tbody>' + o.rows.map(function (r) {
          return '<tr><td class="l">' + esc(r.it.desc) + '<br><small>' + NS.qty(num(r.it.qty)) + ' × ' + NS.money(num(r.it.price), false) + '</small></td><td class="n">' + NS.money(d.incl ? r.show : r.value, false) + '</td></tr>';
        }).join('') + '</tbody></table>' + K.kv(tot, 'tot') + (o.total ? '<p class="words">' + NS.inWords(o.total) + '</p>' : '') +
          '<p class="paidline">' + pay + '</p>' + (notes.trim() ? '<p class="nt1">' + notes.trim() + '</p>' : '') + (d.status === 'open' || d.status === 'unpaid' ? K.qr(d, o.total) : '') +
          (d.notes ? '<p class="nt1">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '<p class="thanks">Thank you, visit again</p>' + K.made() + '</div>';
      }
      return K.open(d, 'resto') + K.head(d, title, '') + K.meta(meta) +
        '<table class="lines"><thead><tr><th>#</th><th class="l">Item</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' + o.rows.map(function (r, i) {
          return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + '</td><td class="n">' + NS.qty(num(r.it.qty)) + '</td><td class="n">' + NS.money(num(r.it.price), false) + '</td><td class="n">' + NS.money(d.incl ? r.show : r.value, false) + '</td></tr>';
        }).join('') + '</tbody></table>' +
        '<div class="foot"><div class="foot-l">' + K.words(o.total) + '<p class="small"><b>' + pay + '</b></p>' + (notes.trim() ? '<p class="small">' + notes.trim() + '</p>' : '') + '</div><div class="foot-r">' + K.tot(tot) + (d.status !== 'paid' ? K.qr(d, o.total) : '') + '</div></div>' +
        (d.notes ? '<div class="nt"><div><p>' + esc(d.notes).replace(/\n/g, '<br>') + '</p></div></div>' : '') + K.made() + '</div>';
    },
    wire: function (ed, K) {
      if (ed._rt) return; ed._rt = 1;   /* the form element stays when the editor is redrawn */
      ed.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rt],[data-tbl]'); if (!b) return;
        var a = b.getAttribute('data-rt'), id = b.getAttribute('data-tbl');
        if (id) { NSStore.get('doc', id).then(function (rec) { if (rec) { K.openDoc(rec, false); loadOpen(); } }); return; }
        if (a === 'kot') kot();
        else if (a === 'hold') { K.doc().status = 'open'; K.save().then(function () { K.startNew(); loadOpen(); }).catch(function () {}); }
        else if (a === 'newtable') { K.startNew(); loadOpen(); }
        else if (a === 'settle') settle(true);
        else if (a === 'settlenp') settle(false);
      });
    },
    ready: function () { loadOpen(); }
  });
})();
