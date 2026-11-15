/* jewellery.niveshsahayak.in: jeweller's bill. Each ornament has metal, purity, gross / stone / net weight, wastage, rate per gram,
   making charges, stone value and an optional HUID; old gold or silver taken in exchange is set off against the bill; stock is kept
   by weight of each metal and purity. Record type 'jewel' (a sale in the Nivesh Sahayak App). The pure logic is in jewelcore.js.
   GST: the rates are typed fields (default 3% on jewellery, with making charges inside the value of the supply). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, J = window.NSJewel, M = J.METALS;
  var TITLE = { tax: 'TAX INVOICE', supply: 'BILL OF SUPPLY', plain: 'CASH / CREDIT MEMO' };
  var RATES = [3, 5, 0, 18];
  var BOARD = [['g', '999'], ['g', '916'], ['g', '750'], ['g', '585'], ['s', '999'], ['s', '925'], ['p', '950']];
  var K;
  function boardLast() { try { return JSON.parse(localStorage.getItem('ns-jw-rates') || 'null') || {}; } catch (e) { return {}; } }
  function boardKeep(d) { try { localStorage.setItem('ns-jw-rates', JSON.stringify({ date: d.date, rates: d.rates })); } catch (e) {} }
  function purOpts(metal) { return (M[metal] || M.o).purities.map(function (p) { return [p[0], p[1]]; }); }
  function row(d) {
    var it = { desc: '', metal: 'g', purity: '916', huid: '', gross: '', stoneWt: '', wast: '', mrate: '', mkt: 'pg', mk: '', stoneVal: '', ld: '', pcs: 1, gst: 3, hsn: '7113' };
    if (d) it.mrate = J.rateFor(d.rates, 'g', '916');
    return it;
  }
  function oldRow(d) { return { desc: '', metal: 'g', purity: '916', gross: '', cut: '', rate: d ? J.rateFor(d.rates, 'g', '916') : '' }; }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function sums(d) { (d.items || []).forEach(function (it) { J.sync(it, d.kind === 'tax'); }); return J.sums(d); }
  function wt(x) { return (Math.round(num(x) * 1000) / 1000).toFixed(3); }
  function dl(name, rows) {
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c).replace(/\r?\n/g, ' '); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function mine() { var who = String(K.doc().seller.name || '').trim().toLowerCase(); return function (x) { return String(x.seller && x.seller.name || '').trim().toLowerCase() === who; }; }

  /* saved bills as a spreadsheet: one line per ornament */
  function billsCsv() {
    var f = mine();
    NSStore.list('doc').then(function (all) {
      var rows = [['Date', 'Bill No.', 'Customer', 'Phone', 'Ornament', 'Metal', 'Purity', 'HUID', 'Gross wt (g)', 'Net wt (g)', 'Rate per g', 'Making', 'Stone value', 'GST %', 'Taxable value', 'Bill total', 'Old gold set off', 'Paid']];
      all.filter(function (x) { return x.type === 'jewel' && f(x); }).sort(function (a, b) { return (a.date || '').localeCompare(b.date || '') || String(a.no).localeCompare(String(b.no)); }).forEach(function (b) {
        (b.items || []).forEach(function (it) {
          var l = J.line(it);
          rows.push([b.date, b.no, b.buyer && b.buyer.name, b.buyer && b.buyer.phone, it.desc, (M[it.metal] || M.o).name, it.purity, it.huid, it.gross || '', wt(l.net), it.mrate, l.making, l.stone, b.kind === 'tax' ? it.gst : 0, l.value, b.total, b.exch || 0, b.status === 'paid' ? 'Yes' : 'No']);
        });
      });
      if (rows.length < 2) { NS.toast(t('jw.nocsv'), 'bad'); return; }
      dl('Jewellery bills ' + NS.today() + '.csv', rows); NS.toast(t('jw.csvdone', { n: rows.length - 1 }));
    });
  }

  /* ---------- stock by weight ---------- */
  function stockOpen() {
    var dlg = $('#jw-stock'), f = mine(), d = K.doc();
    Promise.all([NSStore.list('doc'), NSStore.list('item')]).then(function (r) {
      var docs = r[0].filter(f), S = window.NSStock.summary(docs, r[1], String(d.seller.name || '').trim().toLowerCase(), NS.fy(NS.today()).slice(0, 4) + '-04-01', ''), rows = J.weightStock(S.items);
      var box = $('[data-stk]', dlg);
      box.innerHTML = rows.length ? '<div class="tbl-wrap"><table class="day"><thead><tr><th>' + esc(t('jw.st.name')) + '</th><th class="n">' + esc(t('jw.st.open')) + '</th><th class="n">' + esc(t('jw.st.in')) + '</th><th class="n">' + esc(t('jw.st.out')) + '</th><th class="n">' + esc(t('jw.st.close')) + '</th><th class="n">' + esc(t('jw.st.pure')) + '</th><th class="n">' + esc(t('jw.st.val')) + '</th></tr></thead><tbody>' +
        rows.map(function (x) { return '<tr' + (x.close < 0 ? ' class="warn"' : '') + '><td>' + esc(x.name) + '</td><td class="n">' + wt(x.open) + '</td><td class="n">' + wt(x.inq) + '</td><td class="n">' + wt(x.outq) + '</td><td class="n"><b>' + wt(x.close) + '</b></td><td class="n">' + wt(x.pure) + '</td><td class="n">' + NS.money(x.value) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>' + esc(t('jw.st.none')) + '</p>';
      dlg._rows = rows;
      var sel = $('[data-sname]', dlg);
      if (!sel.options.length) J.stockNames().forEach(function (n) { sel.appendChild(new Option(n, n)); });
      if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    });
  }
  function stockAdd() {
    var dlg = $('#jw-stock'), name = $('[data-sname]', dlg).value, q = num($('[data-sqty]', dlg).value), c = num($('[data-scost]', dlg).value), d = K.doc();
    if (!d.seller.name) { NS.toast(t('v.bname'), 'bad'); return; }
    if (!(q > 0)) { NS.toast(t('jw.st.vq'), 'bad'); return; }
    NSStore.put('doc', { type: 'stk', kind: 'open', no: 'OPEN/JW' + Date.now().toString(36).slice(-4).toUpperCase(), date: NS.today(), seller: { name: d.seller.name, state: d.seller.state || '' }, gd: '', note: 'Jewellery opening stock', lines: [{ desc: name, unit: 'g', qty: String(q), rate: String(c || 0) }] })
      .then(function () { NS.toast(t('jw.st.added', { x: name })); $('[data-sqty]', dlg).value = ''; stockOpen(); }, function (e) { NS.toast(e.message, 'bad'); });
  }
  function stockCsv() {
    var rows = ($('#jw-stock')._rows || []).map(function (x) { return [x.name, wt(x.open), wt(x.inq), wt(x.outq), wt(x.close), wt(x.pure), x.value]; });
    if (!rows.length) { NS.toast(t('jw.st.none'), 'bad'); return; }
    dl('Gold and silver stock ' + NS.today() + '.csv', [['Metal and purity', 'Opening (g)', 'In (g)', 'Out (g)', 'Closing (g)', 'Pure metal in closing (g)', 'Value']].concat(rows));
  }

  K = NS.kit({
    type: 'jewel', prefix: 'JW', digits: 4, paper: 'a4', papers: ['a4', 'a5'], emptyRows: true,
    name: function (d) { return d.kind === 'tax' ? 'Invoice' : d.kind === 'supply' ? 'Bill of Supply' : 'Cash Memo'; },
    blank: function () {
      var last = boardLast(), r = last.rates || {};
      return { kind: 'plain', round: true, status: 'paid', payMode: 'cash', rates: Object.assign({}, r), ratesOn: last.date || '', items: [], old: [] };
    },
    newRow: function (n, d) { return n === 'old' ? oldRow(d) : row(d); },
    keepOnNew: function (d) { return { kind: d.kind, paper: d.paper, rates: d.rates, ratesOn: d.ratesOn }; },
    load: function (d) { d.items = d.items || []; d.old = d.old || []; d.rates = d.rates || {}; },
    form: function (K) {
      var board = BOARD.map(function (b) { return K.f('rates.' + b[0] + b[1], t('jw.r.' + b[0] + b[1]), { mode: 'decimal', ltr: 1 }); }).join('');
      return K.card(t('jw.cust'), '<div class="fg">' + K.f('buyer.name', t('l.cname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) +
          '<details class="more wide"><summary>' + esc(t('jw.b2b')) + '</summary><div class="fg">' + K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + K.f('pan', t('jw.pan'), { max: 10, ltr: 1, hint: t('jw.panh') }) + '</div></details></div>') +
        K.card(t('jw.rates'), '<p class="hint">' + esc(t('jw.ratesh')) + '</p><div class="fg">' + board + '</div>') +
        K.card(t('jw.orn'), K.list('items', t('jw.addorn')) + '<div class="sums" id="ed-sums" aria-live="polite"></div>') +
        K.card(t('jw.old'), '<p class="hint">' + esc(t('jw.oldh')) + '</p>' + K.list('old', t('jw.addold'))) +
        K.card(t('pos.pay'), '<div class="fg">' + K.f('status', t('l.pay'), { type: 'select', opts: [['paid', t('pay.paid')], ['unpaid', t('pay.unpaid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank', 'cheque']), show: 'status=paid' }) + '</div>') +
        K.bizCard({ extra: K.f('huidnote', t('jw.bis'), { wide: true, ltr: 1, hint: t('jw.bish') }) }) +
        K.numCard(K.f('kind', t('pos.kind'), { type: 'select', opts: [['tax', t('k.tax')], ['supply', t('k.supply')], ['plain', t('k.cashmemo')]], wide: true, hint: t('jw.kindh') })) +
        K.lookCard(K.f('round', t('l.round'), { type: 'check' }) + '<div class="f wide row"><button type="button" class="btn" data-jw="stock">' + esc(t('jw.stock')) + '</button><button type="button" class="btn" data-jw="csv">' + esc(t('jw.csv')) + '</button></div>') +
        '<datalist id="dl-rates">' + RATES.map(function (r) { return '<option value="' + r + '">'; }).join('') + '</datalist>';
    },
    rows: {
      items: function (it, i, K) {
        var d = K.doc(), tax = d.kind === 'tax';
        return K.rf('items', i, 'desc', t('jw.desc'), { cls: 'it-d' }) +
          K.rf('items', i, 'metal', t('jw.metal'), { type: 'select', opts: [['g', t('jw.m.g')], ['s', t('jw.m.s')], ['p', t('jw.m.p')], ['o', t('jw.m.o')]] }) +
          (it.metal !== 'o' ? K.rf('items', i, 'purity', t('jw.purity'), { type: 'select', opts: purOpts(it.metal) }) : '') +
          K.rf('items', i, 'huid', t('jw.huid'), { max: 6, ltr: 1 }) +
          K.rf('items', i, 'gross', t('jw.gross'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'stoneWt', t('jw.stonewt'), { mode: 'decimal', ltr: 1 }) +
          (it.metal === 'o' ? K.rf('items', i, 'pcs', t('jw.pcs'), { mode: 'numeric', ltr: 1 }) : '') +
          K.rf('items', i, 'wast', t('jw.wast'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'mrate', t('jw.mrate'), { mode: 'decimal', ltr: 1 }) +
          K.rf('items', i, 'mkt', t('jw.mkt'), { type: 'select', opts: [['pg', t('jw.mk.pg')], ['pct', t('jw.mk.pct')], ['flat', t('jw.mk.flat')]] }) + K.rf('items', i, 'mk', t('jw.mk'), { mode: 'decimal', ltr: 1 }) +
          K.rf('items', i, 'stoneVal', t('jw.stoneval'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'ld', t('jw.ld'), { mode: 'decimal', ltr: 1 }) +
          (tax ? K.rf('items', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('items', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '') +
          '<p class="hint wide" data-linesum="' + i + '"></p>';
      },
      old: function (x, i, K) {
        return K.rf('old', i, 'desc', t('jw.old.desc'), { cls: 'it-d' }) + K.rf('old', i, 'metal', t('jw.metal'), { type: 'select', opts: [['g', t('jw.m.g')], ['s', t('jw.m.s')], ['p', t('jw.m.p')]] }) +
          K.rf('old', i, 'purity', t('jw.purity'), { type: 'select', opts: purOpts(x.metal) }) + K.rf('old', i, 'gross', t('jw.oldgross'), { mode: 'decimal', ltr: 1 }) +
          K.rf('old', i, 'cut', t('jw.cut'), { mode: 'decimal', ltr: 1 }) + K.rf('old', i, 'rate', t('jw.oldrate'), { mode: 'decimal', ltr: 1 }) + '<p class="hint wide" data-oldsum="' + i + '"></p>';
      }
    },
    rowInput: function (n, i, k, d, el, K) {
      var it = d[n][i];
      if (n === 'items') {
        if (k === 'huid') it.huid = el.value = el.value.toUpperCase();
        if (k === 'metal') { it.purity = purOpts(it.metal)[0][0]; it.mrate = J.rateFor(d.rates, it.metal, it.purity); if (it.metal === 'o') it.mkt = 'flat'; K.refill(); }
        else if (k === 'purity') { it.mrate = J.rateFor(d.rates, it.metal, it.purity) || it.mrate; K.refill(); }
        J.sync(it, d.kind === 'tax');
      } else {
        if (k === 'metal') { it.purity = purOpts(it.metal)[0][0]; it.rate = J.rateFor(d.rates, it.metal, it.purity); K.refill(); }
        else if (k === 'purity') { it.rate = J.rateFor(d.rates, it.metal, it.purity) || it.rate; K.refill(); }
      }
    },
    input: function (p, el, d, K) {
      if (/^rates\./.test(p)) { d.ratesOn = d.date; boardKeep(d); }
      if (p === 'kind') K.refill();
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
    },
    pickParty: function (p, d) { d.buyer.addr = p.addr || ''; },
    sums: sums,
    drawn: function (d, o, K) {
      var root = K.root();
      d.items.forEach(function (it, i) {
        var e = root.querySelector('[data-linesum="' + i + '"]'); if (!e) return;
        if (J.isBlank(it)) { e.textContent = ''; return; }
        var l = J.line(it); e.textContent = t('jw.linesum', { net: wt(l.net), pure: wt(l.pure), metal: NS.money(l.metal), mk: NS.money(l.making), v: NS.money(l.value) });
      });
      (d.old || []).forEach(function (x, i) {
        var e = root.querySelector('[data-oldsum="' + i + '"]'); if (!e) return;
        var l = J.oldLine(x); e.textContent = n0(l.gross) ? t('jw.oldsum', { net: wt(l.net), pure: wt(l.pure), v: NS.money(l.value) }) : '';
      });
    },
    edSums: function (d, o) {
      var warn = o.rows.some(function (r) { return r.it.metal === 'g' && !r.it.huid; });
      return '<span>' + esc(t('jw.es.w', { n: wt(o.weight), p: wt(o.pure) })) + '</span>' + (d.kind === 'tax' ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') +
        (o.exch ? '<span>' + esc(t('jw.es.old', { v: NS.money(o.exch) })) + '</span>' : '') + '<b>' + esc(t(o.exch ? 'jw.es.pay' : 'sum.total', { v: NS.money(o.exch ? o.pay : o.total) })) + '</b>' +
        (warn ? '<span class="warn">' + esc(t('jw.es.huid')) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!o.rows.length) p.push(['r-items-desc-0', t('jw.v.orn')]);
      d.items.forEach(function (it, i) {
        if (J.isBlank(it)) return;
        var l = J.line(it);
        if (!String(it.desc || '').trim()) p.push(['r-items-desc-' + i, t('jw.v.desc')]);
        if (it.metal !== 'o' && !(l.net > 0)) p.push(['r-items-gross-' + i, t('jw.v.wt', { n: it.desc || i + 1 })]);
        if (it.metal !== 'o' && !(num(it.mrate) > 0)) p.push(['r-items-mrate-' + i, t('jw.v.rate', { n: it.desc || i + 1 })]);
        if (!(l.value > 0)) p.push(['r-items-mk-' + i, t('jw.v.val', { n: it.desc || i + 1 })]);
        if (!J.huidOk(it.huid)) p.push(['r-items-huid-' + i, t('jw.v.huid')]);
        if (num(it.stoneWt) > num(it.gross) && num(it.gross) > 0) p.push(['r-items-stoneWt-' + i, t('jw.v.stone')]);
      });
      (d.old || []).forEach(function (x, i) { if (num(x.gross) > 0 && !(num(x.rate) > 0)) p.push(['r-old-rate-' + i, t('jw.v.oldrate')]); });
      if (o.exch > o.total) p.push(['r-old-gross-0', t('jw.v.exch')]);
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.kind === 'tax' && !d.buyer.gstin && o.taxable >= 50000 && (!d.buyer.name || !d.buyer.addr || !d.buyer.state)) p.push([!d.buyer.name ? 'k-buyer-name' : !d.buyer.addr ? 'k-buyer-addr' : 'k-buyer-state', t('v.b2c')]);
      return p;
    },
    confirm: function (d, o) { return d.status === 'paid' && d.payMode === 'cash' && o.pay >= 200000 ? t('c.cash2l') : ''; },
    record: function (rec, o) {
      rec.items = rec.items.filter(function (it) { return !J.isBlank(it); }).map(function (it) { return J.sync(it, rec.kind === 'tax'); });
      rec.old = (rec.old || []).filter(function (x) { return num(x.gross) > 0; });
      rec.oldGold = J.oldForRecord(rec.old); rec.exch = o.exch; rec.withGst = rec.kind === 'tax';
      rec.rates = rec.rates || {}; boardKeep(rec);
      if (rec.status !== 'paid') delete rec.payMode;
    },
    copyOf: function (d) { d.old = []; d.items.forEach(function (it) { it.huid = ''; }); },
    histText: function (d) { return (d.items || []).map(function (it) { return it.desc + ' ' + it.huid; }).join(' '); },
    histPill: function (d) { return ' <span class="pill ' + (d.status === 'paid' ? 'ok' : '') + '">' + esc(t(d.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'; },
    histActs: function (d) { return '<button type="button" class="btn sm" data-h="paid" data-id="' + d.id + '">' + esc(t(d.status === 'paid' ? 'h.unpaid' : 'h.paid')) + '</button>'; },
    histAct: function (act, rec) { if (act !== 'paid') return; rec.status = rec.status === 'paid' ? 'unpaid' : 'paid'; return NSStore.put('doc', rec).then(function () { return { status: rec.status }; }); },
    shareText: function (d, o) { return '\nNet weight: ' + wt(o.weight) + ' g' + (o.exch ? '\nOld gold set off: ' + NS.money(o.exch) + '\nTo pay: ' + NS.money(o.pay) : ''); },
    sheet: function (d, o, K) {
      var tax = d.kind === 'tax', b = d.buyer;
      var meta = K.meta([['Bill No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], d.pan ? ['PAN of buyer', '<span class="mono">' + esc(d.pan) + '</span>'] : null, d.huidnote ? ['BIS registration', '<span class="mono">' + esc(d.huidnote) + '</span>'] : null,
        tax ? ['Place of supply', b.state ? esc(NS.stateName(b.state)) + ' (' + b.state + ')' : d.seller.state ? esc(NS.stateName(d.seller.state)) + ' (' + d.seller.state + ')' : ''] : null]);
      var rows = o.rows.map(function (r, i) {
        var it = r.it, l = r.l, m = M[it.metal] || M.o;
        return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(it.desc) + '<br><small>' + esc(m.name) + (it.purity ? ' ' + esc(it.purity) : '') + (it.huid ? ' · HUID <span class="mono">' + esc(it.huid) + '</span>' : '') + (tax && it.hsn ? ' · HSN ' + esc(it.hsn) : '') + '</small></td>' +
          '<td class="n">' + (num(it.gross) ? wt(it.gross) : '') + '</td><td class="n">' + (l.net ? wt(l.net) : '') + '</td><td class="n">' + (num(it.mrate) ? NS.money(num(it.mrate), false) : '') + '</td><td class="n">' + NS.money(l.metal, false) + (num(it.wast) ? '<br><small>+' + num(it.wast) + '% wastage</small>' : '') + '</td><td class="n">' + (l.making ? NS.money(l.making, false) : '') + '</td><td class="n">' + (l.stone ? NS.money(l.stone, false) : '') + '</td>' +
          '<td class="n">' + NS.money(l.value, false) + (l.ld ? '<br><small>after −' + NS.money(l.ld, false) + '</small>' : '') + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '</tr>';
      }).join('');
      var old = o.old.rows.length ? '<table class="lines"><caption>Old gold / silver taken in exchange</caption><thead><tr><th>#</th><th class="l">Item</th><th class="n">Gross wt (g)</th><th class="n">Cut %</th><th class="n">Net wt (g)</th><th class="n">Rate per g</th><th class="n">Value</th></tr></thead><tbody>' +
        o.old.rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.x.desc || 'Old ornament') + '<br><small>' + esc((M[r.x.metal] || M.g).name) + ' ' + esc(r.x.purity || '') + '</small></td><td class="n">' + wt(r.l.gross) + '</td><td class="n">' + (num(r.x.cut) || '') + '</td><td class="n">' + wt(r.l.net) + '</td><td class="n">' + NS.money(num(r.x.rate), false) + '</td><td class="n">' + NS.money(r.l.value, false) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
      return K.open(d, 'jewel') + (d.status === 'paid' && !o.exch ? '<div class="stamp">PAID</div>' : '') + K.head(d, TITLE[d.kind], '') + meta + '<div class="parties">' + K.party(b, 'Customer') + '</div>' +
        '<table class="lines"><thead><tr><th>#</th><th class="l">Ornament</th><th class="n">Gross wt (g)</th><th class="n">Net wt (g)</th><th class="n">Rate / g</th><th class="n">Metal value</th><th class="n">Making</th><th class="n">Stone</th><th class="n">' + (tax ? 'Taxable' : 'Amount') + '</th>' + (tax ? '<th class="n">GST</th>' : '') + '</tr></thead><tbody>' +
        (rows || '<tr><td colspan="' + (tax ? 10 : 9) + '" class="ph">Ornaments you add appear here</td></tr>') + '</tbody></table>' + old +
        '<div class="foot"><div class="foot-l">' + K.words(o.exch ? o.pay : o.total) +
          (tax && Object.keys(o.byRate).length ? '<table class="sum"><caption>Tax summary</caption><thead><tr><th class="n">GST</th><th class="n">Taxable value</th>' + (o.intra ? '<th class="n">CGST</th><th class="n">SGST</th>' : '<th class="n">IGST</th>') + '</tr></thead><tbody>' +
            Object.keys(o.byRate).sort(function (a, c) { return a - c; }).map(function (g) { var x = o.byRate[g]; return '<tr><td class="n">' + g + '%</td><td class="n">' + NS.money(x.taxable, false) + '</td>' + (o.intra ? '<td class="n">' + NS.money(x.tax / 2, false) + '</td><td class="n">' + NS.money(x.tax / 2, false) + '</td>' : '<td class="n">' + NS.money(x.tax, false) + '</td>') + '</tr>'; }).join('') + '</tbody></table>' : '') +
          '<p class="small">Total net weight ' + wt(o.weight) + ' g' + (o.exch ? ' · old gold net ' + wt(o.old.net) + ' g' : '') + '. Weights are in grams.</p>' +
          (d.kind === 'supply' ? '<p class="small">Composition taxable person, not eligible to collect tax on supplies.</p>' : '') +
        '</div><div class="foot-r">' + K.tot([['Total of ornaments', NS.money(o.taxable)], tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null,
          o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Bill total', NS.money(o.total), o.exch ? '' : 'grand'], o.exch ? ['Old gold set off', '−' + NS.money(o.exch)] : null, o.exch ? [o.pay >= 0 ? 'Amount to pay' : 'Amount payable to customer', NS.money(Math.abs(o.pay)), 'grand'] : null]) +
          (d.status !== 'paid' && o.pay > 0 ? K.qr(d, o.pay) : '') + '</div></div>' +
        (d.notes ? '<div class="nt"><div><h4>Notes</h4><p>' + esc(d.notes).replace(/\n/g, '<br>') + '</p></div></div>' : '') +
        '<div class="signs">' + K.blankSign('', 'Customer') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) {
      $('[data-jw="stock"]', ed).addEventListener('click', stockOpen);
      $('[data-jw="csv"]', ed).addEventListener('click', billsCsv);
    },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      if ($('#jw-stock')) return;
      var x = NS.el('dialog', { id: 'jw-stock', 'aria-labelledby': 'jw-stock-h' }, '<div class="dlg-h"><h2 id="jw-stock-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b"><div data-stk></div>' +
        '<h3 data-h3></h3><p class="hint" data-hint></p><div class="fg"><div class="f"><label data-l1></label><select data-sname></select></div><div class="f"><label data-l2></label><input data-sqty inputmode="decimal" dir="ltr"></div><div class="f"><label data-l3></label><input data-scost inputmode="decimal" dir="ltr"></div></div>' +
        '<div class="row"><button type="button" class="btn primary sm" data-sadd></button><button type="button" class="btn sm" data-scsv></button></div></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      $('[data-sadd]', x).addEventListener('click', stockAdd); $('[data-scsv]', x).addEventListener('click', stockCsv);
      function names() {
        $('h2', x).textContent = t('jw.stock'); $('[data-close]', x).textContent = t('close'); $('[data-h3]', x).textContent = t('jw.st.add'); $('[data-hint]', x).textContent = t('jw.st.addh');
        $('[data-l1]', x).textContent = t('jw.st.name'); $('[data-l2]', x).textContent = t('jw.st.qty'); $('[data-l3]', x).textContent = t('jw.st.cost'); $('[data-sadd]', x).textContent = t('jw.st.addb'); $('[data-scsv]', x).textContent = t('jw.csv2');
      }
      names(); document.addEventListener('ns-lang', names);
    }
  });
  function n0(v) { return num(v); }
})();
