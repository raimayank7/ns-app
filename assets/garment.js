/* garment.niveshsahayak.in: garment shop bill with size and colour variants. A product (Polo T-shirt) has sizes and colours; every
   size x colour is an item master ("Polo T-shirt - M / Blue") with its own stock, so the stock site, GSTR-1 and the App read it like
   any item. On the bill you tap a size/colour cell to add one; the cell shows the pieces in stock. Record type 'garment' (a sale in the
   NSBiz). The pure logic is in garmentcore.js; stock comes from stockcore.js. GST is a typed field (5% up to Rs 2,500 a piece
   and 18% above is only the suggestion). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, G = window.NSGarment;
  var TITLE = { tax: 'TAX INVOICE', supply: 'BILL OF SUPPLY', plain: 'CASH / CREDIT MEMO' };
  var K, PROD = [], STOCK = {}, ITEMS = [], DOCS = [], PICK = '', EDIT = null, LASTID = null;
  function row() { return { desc: '', qty: 1, price: '', rate: '', disc: '', gst: 5, hsn: '', unit: 'Pcs' }; }
  function kindFor(s) { return s.reg === 'comp' ? 'supply' : s.gstin && s.reg !== 'unreg' ? 'tax' : 'plain'; }
  function sums(d) { return G.sums(d); }
  function syncRate(d, it) { it.rate = G.rateOf(it.price, d.kind === 'tax' ? it.gst : 0, d.incl); }
  function who() { return String(K.doc().seller.name || '').trim().toLowerCase(); }
  function mineDoc(x) { return String(x.seller && x.seller.name || '').trim().toLowerCase() === who(); }
  function dl(name, rows) {
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c).replace(/\r?\n/g, ' '); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  /* products and stock, read from the data home */
  function load() {
    return Promise.all([NSStore.list('item'), NSStore.list('doc')]).then(function (r) {
      ITEMS = r[0]; DOCS = r[1].filter(mineDoc);
      PROD = G.products(ITEMS);
      var fy = NS.fy(NS.today()).slice(0, 4) + '-04-01', me = K.editing(); LASTID = me || null;   /* the bill on screen is counted from the form, not from its saved copy */
      try { STOCK = G.stockMap(window.NSStock.summary(DOCS.filter(function (x) { return x.id !== me; }), ITEMS, who(), fy, '').items); } catch (e) { STOCK = {}; }
      if (PICK && !PROD.some(function (p) { return p.key === PICK; })) PICK = '';
      if (!PICK && PROD.length) PICK = PROD[0].key;
      drawPick(); if (document.querySelector('#gm-prod[open]')) drawProd();
      var ae = document.activeElement; if (!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.closest('#ed'))) K.refill(); 
    });
  }
  function prodByKey(k) { return PROD.filter(function (p) { return p.key === k; })[0]; }

  /* ---------- pick by size and colour ---------- */
  function drawPick() {
    var box = $('#gm-pick'); if (!box) return;
    if (!PROD.length) { box.innerHTML = '<p class="hint">' + esc(t('gm.none')) + '</p>'; return; }
    var p = prodByKey(PICK) || PROD[0], d = K.doc(), g = G.grid(p, STOCK, G.billMap(d.items));
    var sel = '<div class="f"><label for="gm-sel">' + esc(t('gm.prodsel')) + '</label><select id="gm-sel" data-gm="sel">' + PROD.map(function (x) { return '<option value="' + esc(x.key) + '"' + (x.key === p.key ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>';
    var price = p.variants[0] ? NS.money(num(p.variants[0].price || p.variants[0].rate)) : '';
    box.innerHTML = sel + '<p class="hint">' + esc(t('gm.legend', { v: price })) + '</p><div class="tbl-wrap"><table class="gm-grid"><thead><tr><th></th>' +
      g.cols.map(function (s) { return '<th scope="col">' + esc(s || '-') + '</th>'; }).join('') + '</tr></thead><tbody>' +
      g.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r.colour || '-') + '</th>' + r.cells.map(function (c) {
          if (!c.v) return '<td><span class="gm-none">·</span></td>';
          var nm = c.v.desc, cls = 'gm-cell' + (c.out ? ' out' : '') + (c.bill ? ' on' : '');
          return '<td><div class="gm-c"><button type="button" class="' + cls + '" data-gm="tap" data-d="' + esc(nm) + '" aria-label="' + esc(t('gm.cell', { x: nm }) + (c.left != null ? ', ' + t('gm.instock', { n: c.left }) : '')) + '">' +
            '<b>' + (c.left == null ? '·' : esc(String(c.left))) + '</b>' + (c.bill ? '<span class="gm-badge">' + esc(String(c.bill)) + '</span>' : '') + '</button>' +
            (c.bill ? '<button type="button" class="gm-minus" data-gm="minus" data-d="' + esc(nm) + '" aria-label="' + esc(t('gm.minus', { x: nm })) + '">−</button>' : '') + '</div></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function pickClick(e) {
    var b = e.target.closest('[data-gm]'); if (!b) return;
    var a = b.getAttribute('data-gm'), d = K.doc();
    if (a === 'tap' || a === 'minus') {
      var nm = b.getAttribute('data-d'), v = ITEMS.filter(function (m) { return m.desc === nm; })[0];
      if (a === 'minus') G.minus(d.items, nm, row);
      else if (v) { G.tap(d.items, v, row, d.kind === 'tax' && d.incl); var hv = STOCK[G.key(nm)], inb = G.billMap(d.items)[G.key(nm)]; if (hv != null && inb > hv) NS.toast(t('gm.es.low', { n: Math.max(0, hv), x: nm }), 'bad'); }   /* F5-9 */
      K.refill(); drawPick();
    } else if (a === 'prod') openProd();
    else if (a === 'csvp') { if (!PROD.length) NS.toast(t('gm.none'), 'bad'); else dl('Garment products ' + NS.today() + '.csv', G.variantRows(ITEMS, STOCK)); }
    else if (a === 'csvb') billsCsv();
  }
  function pickChange(e) { var s = e.target.closest('[data-gm="sel"]'); if (s) { PICK = s.value; drawPick(); } }

  function billsCsv() {
    var rows = [['Date', 'Bill No.', 'Customer', 'Phone', 'Item', 'Qty', 'Rate (without GST)', 'Disc %', 'GST %', 'Taxable value', 'Bill total', 'Paid']];
    DOCS.filter(function (x) { return x.type === 'garment'; }).sort(function (a, b) { return (a.date || '').localeCompare(b.date || '') || String(a.no).localeCompare(String(b.no)); }).forEach(function (b) {
      (b.items || []).forEach(function (it) {
        var q = num(it.qty), r = num(it.rate), v = r2(q * r - q * r * num(it.disc) / 100);
        rows.push([b.date, b.no, b.buyer && b.buyer.name, b.buyer && b.buyer.phone, it.desc, it.qty, it.rate, it.disc || '', b.kind === 'tax' ? it.gst : 0, v, b.total, b.status === 'paid' ? 'Yes' : 'No']);
      });
    });
    if (rows.length < 2) { NS.toast(t('gm.nocsv'), 'bad'); return; }
    dl('Garment bills ' + NS.today() + '.csv', rows); NS.toast(t('gm.csvdone', { n: rows.length - 1 }));
  }

  /* ---------- products and variants dialog ---------- */
  var PRESETS = { adult: 'XS, S, M, L, XL, XXL', kids: '2-3, 4-5, 6-7, 8-9, 10-11, 12-13', waist: '28, 30, 32, 34, 36, 38, 40', free: 'Free size' };
  function formVal() {
    var dlg = $('#gm-prod'), f = function (k) { return $('[data-pf="' + k + '"]', dlg).value; };
    return { name: f('name'), hsn: f('hsn'), gst: f('gst'), price: f('price'), unit: f('unit'), sizes: f('sizes'), colours: f('colours') };
  }
  function formSet(p) {
    var dlg = $('#gm-prod'); p = p || {};
    ['name', 'hsn', 'gst', 'price', 'unit', 'sizes', 'colours'].forEach(function (k) { $('[data-pf="' + k + '"]', dlg).value = p[k] == null ? '' : p[k]; });
    previewForm();
  }
  function previewForm() {
    var dlg = $('#gm-prod'), p = formVal(), n = G.variantsOf(p).length, pl = G.plan(p, ITEMS), e = $('[data-pprev]', dlg);
    var s = G.parseList(p.sizes).length, c = G.parseList(p.colours).length;
    e.textContent = (s || c) && p.name ? t('gm.d.prev', { n: n, s: s, c: c, f: pl.fresh }) : '';
    var gh = $('[data-pgst]', dlg); if (gh) gh.placeholder = num(p.price) ? String(G.gstFor(p.price)) : '5';
  }
  function saveProd() {
    var p = formVal(), pr = G.problems(p);
    if (pr.length) { NS.toast(t('gm.pr.' + pr[0]), 'bad'); return; }
    var pl = G.plan(p, ITEMS);
    Promise.all(pl.items.map(function (m) { return NSStore.put('item', m); })).then(function () {
      NS.toast(t('gm.d.made', { n: pl.fresh, m: pl.updated })); NS.folderWrite && NS.folderWrite(false); return load();
    }).then(function () { PICK = G.key(p.name); drawPick(); formSet(null); }, function (e) { NS.toast(e.message, 'bad'); });
  }
  function drawProd() {
    var dlg = $('#gm-prod'), box = $('[data-plist]', dlg);
    box.innerHTML = PROD.length ? PROD.map(function (p) {
      var have = p.variants.reduce(function (a, v) { var s = STOCK[G.key(v.desc)]; return a + (s > 0 ? s : 0); }, 0);
      return '<li><div><b>' + esc(p.name) + '</b><br><span class="soft">' + esc(t('gm.d.line', { n: p.variants.length, s: p.sizes.length, c: p.colours.length, h: have, v: NS.money(num(p.price)) })) + '</span></div>' +
        '<div class="row"><button type="button" class="btn sm" data-pa="edit" data-k="' + esc(p.key) + '">' + esc(t('gm.d.edit')) + '</button><button type="button" class="btn sm" data-pa="stock" data-k="' + esc(p.key) + '">' + esc(t('gm.d.stock')) + '</button>' +
        '<button type="button" class="btn sm" data-pa="labels" data-k="' + esc(p.key) + '">' + esc(t('gm.labels')) + '</button><button type="button" class="btn sm danger" data-pa="del" data-k="' + esc(p.key) + '">' + esc(t('gm.d.del')) + '</button></div></li>';
    }).join('') : '<li class="empty">' + esc(t('gm.d.empty')) + '</li>';
    if (EDIT) drawStockForm();
  }
  function drawStockForm() {
    var dlg = $('#gm-prod'), box = $('[data-pstock]', dlg), p = prodByKey(EDIT);
    if (!p) { box.innerHTML = ''; return; }
    var g = G.grid(p, STOCK, {});
    box.innerHTML = '<h3>' + esc(t('gm.d.stock')) + ': ' + esc(p.name) + '</h3><p class="hint">' + esc(t('gm.d.stockh')) + '</p><div class="tbl-wrap"><table class="gm-grid"><thead><tr><th></th>' + g.cols.map(function (s) { return '<th>' + esc(s || '-') + '</th>'; }).join('') + '</tr></thead><tbody>' +
      g.rows.map(function (r) { return '<tr><th scope="row">' + esc(r.colour || '-') + '</th>' + r.cells.map(function (c) { return c.v ? '<td><input class="gm-q" inputmode="numeric" dir="ltr" data-sq="' + esc(c.v.desc) + '" aria-label="' + esc(c.v.desc) + '"></td>' : '<td></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="fg"><div class="f"><label for="gm-cost">' + esc(t('gm.d.cost')) + '</label><input id="gm-cost" inputmode="decimal" dir="ltr" data-scost></div></div><div class="row"><button type="button" class="btn primary sm" data-pa="stocksave">' + esc(t('gm.d.save')) + '</button><button type="button" class="btn sm" data-pa="stockhide">' + esc(t('close')) + '</button></div>';
  }
  function saveStock() {
    var dlg = $('#gm-prod'), lines = [], cost = num($('[data-scost]', dlg).value), d = K.doc();
    if (!d.seller.name) { NS.toast(t('v.bname'), 'bad'); return; }
    $$('[data-sq]', dlg).forEach(function (i) { var q = Math.floor(num(i.value)); if (q > 0) lines.push({ desc: i.getAttribute('data-sq'), unit: 'Pcs', qty: String(q), rate: String(cost || 0) }); });
    if (!lines.length) { NS.toast(t('gm.d.noq'), 'bad'); return; }
    NSStore.put('doc', { type: 'stk', kind: 'open', no: 'OPEN/GM' + Date.now().toString(36).slice(-4).toUpperCase(), date: NS.today(), seller: { name: d.seller.name, state: d.seller.state || '' }, gd: '', note: 'Garment opening stock', lines: lines })
      .then(function () { NS.toast(t('gm.d.saved', { n: lines.length })); return load(); }, function (e) { NS.toast(e.message, 'bad'); });
  }
  function printLabels(k) {
    var p = prodByKey(k); if (!p) return; var d = K.doc();
    var vs = p.variants.slice().sort(function (a, b) { return G.sizeCmp(a.size, b.size) || G.key(a.colour).localeCompare(G.key(b.colour)); });
    var ls = G.labels(vs.map(function (v) { return Object.assign({}, v, { code: String(v.id || '').slice(-6).toUpperCase() }); }), function (v) { var s = STOCK[G.key(v.desc)]; return s > 0 ? s : 1; });
    if (!ls.length) return;
    var old = $('#gm-lbl'); if (old) old.remove();
    var el = NS.el('div', { id: 'gm-lbl', 'aria-hidden': 'true' }, ls.map(function (l) {
      return '<div class="gm-l"><b>' + esc(d.seller.name || '') + '</b><span>' + esc(l.name) + '</span><span>' + esc([l.size && 'Size ' + l.size, l.colour].filter(Boolean).join(' · ')) + '</span><strong>' + (d.incl ? 'MRP ' : '') + NS.money(num(l.price)) + (d.incl ? '' : ' + GST') + '</strong><small class="mono">' + esc(l.code) + '</small></div>';
    }).join(''));
    document.body.appendChild(el); document.documentElement.classList.add('gm-lbl-on');
    function done() { document.documentElement.classList.remove('gm-lbl-on'); el.remove(); window.removeEventListener('afterprint', done); }
    window.addEventListener('afterprint', done); setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }
  function openProd() {
    var dlg = $('#gm-prod'); if (!dlg) return;
    load().then(function () { drawProd(); previewForm(); if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); });
  }
  function buildProd() {
    if ($('#gm-prod')) return;
    var f = function (k, id, lbl, o) { o = o || {}; return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="gm-' + id + '" data-l="' + lbl + '"></label><input id="gm-' + id + '" data-pf="' + k + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ltr ? ' dir="ltr"' : ' dir="auto"') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.pg ? ' data-pgst' : '') + '></div>'; };
    var x = NS.el('dialog', { id: 'gm-prod', 'aria-labelledby': 'gm-prod-h', class: 'gm-dlg' }, '<div class="dlg-h"><h2 id="gm-prod-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b">' +
      '<h3 data-l="gm.d.new"></h3><div class="fg">' + f('name', 'n', 'gm.d.name', { wide: 1, max: 50 }) + f('hsn', 'h', 'gm.d.hsn', { mode: 'numeric', ltr: 1, max: 8 }) + f('gst', 'g', 'gm.d.gst', { mode: 'decimal', ltr: 1, pg: 1 }) + f('price', 'p', 'gm.d.price', { mode: 'decimal', ltr: 1 }) + f('unit', 'u', 'gm.d.unit', { max: 12 }) +
      '<p class="hint wide" data-l="gm.d.gsth"></p>' + f('sizes', 's', 'gm.d.sizes', { wide: 1 }) + '<div class="f wide"><span class="lbl" data-l="gm.d.preset"></span><div class="row">' + Object.keys(PRESETS).map(function (k) { return '<button type="button" class="btn sm" data-preset="' + k + '" data-l="gm.p.' + k + '"></button>'; }).join('') + '</div></div>' +
      f('colours', 'c', 'gm.d.colours', { wide: 1 }) + '</div><p class="hint" data-pprev></p><div class="row"><button type="button" class="btn primary sm" data-pa="make" data-l="gm.d.make"></button><button type="button" class="btn sm" data-pa="clear" data-l="gm.d.clear"></button></div>' +
      '<h3 data-l="gm.d.list"></h3><ul class="gm-pl" data-plist></ul><div data-pstock></div></div>');
    document.body.appendChild(x);
    function names() { $$('[data-l]', x).forEach(function (e) { e.textContent = t(e.getAttribute('data-l')); }); $('h2', x).textContent = t('gm.manage'); $('[data-close]', x).textContent = t('close'); var s = $('[data-pf="sizes"]', x); s.placeholder = 'S, M, L, XL'; $('[data-pf="colours"]', x).placeholder = t('gm.d.colph'); $('[data-pf="unit"]', x).placeholder = 'Pcs'; }
    names(); document.addEventListener('ns-lang', function () { names(); drawProd(); });
    $('[data-close]', x).addEventListener('click', function () { x.close(); });
    x.addEventListener('input', function (e) { if (e.target.closest('[data-pf]')) previewForm(); });
    x.addEventListener('click', function (e) {
      var pre = e.target.closest('[data-preset]');
      if (pre) { $('[data-pf="sizes"]', x).value = PRESETS[pre.getAttribute('data-preset')]; previewForm(); return; }
      var b = e.target.closest('[data-pa]'); if (!b) return;
      var a = b.getAttribute('data-pa'), k = b.getAttribute('data-k'), p = k && prodByKey(k);
      if (a === 'make') saveProd();
      else if (a === 'clear') { EDIT = null; formSet(null); $('[data-pstock]', x).innerHTML = ''; }
      else if (a === 'edit' && p) formSet({ name: p.name, hsn: p.hsn, gst: p.gst, price: p.price, unit: (p.variants[0] || {}).unit || 'Pcs', sizes: p.sizes.join(', '), colours: p.colours.join(', ') });
      else if (a === 'stock' && p) { EDIT = k; drawStockForm(); }
      else if (a === 'stocksave') saveStock();
      else if (a === 'stockhide') { EDIT = null; $('[data-pstock]', x).innerHTML = ''; }
      else if (a === 'labels') printLabels(k);
      else if (a === 'del' && p && NS.okSync(t('gm.d.cdel', { x: p.name, n: p.variants.length }))) {
        Promise.all(p.variants.map(function (v) { return v.id ? NSStore.del('item', v.id) : null; })).then(function () { NS.toast(t('gm.d.deleted', { x: p.name })); return load(); });
      }
    });
  }

  K = NS.kit({
    type: 'garment', prefix: 'GM', digits: 4, paper: 'a4', papers: NS.PAPER_ALL,
    name: function (d) { return d.kind === 'tax' ? 'Invoice' : d.kind === 'supply' ? 'Bill of Supply' : 'Cash Memo'; },
    blank: function () { return { kind: 'plain', round: true, incl: false, status: 'paid', payMode: 'cash', items: [row()] }; },
    newRow: function () { return row(); },
    keepOnNew: function (d) { return { kind: d.kind, paper: d.paper, incl: d.incl }; },
    form: function (K) {
      return K.card(t('gm.cust'), '<div class="fg">' + K.f('buyer.name', t('l.cname'), { wide: true }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
          '<details class="more wide"><summary>' + esc(t('gm.b2b')) + '</summary><div class="fg">' + K.f('buyer.addr', t('l.addr'), { type: 'textarea', wide: true }) + K.f('buyer.gstin', t('l.cgstin'), { max: 15, ltr: 1 }) + K.f('buyer.state', t('l.state'), { type: 'select', opts: K.states() }) + '</div></details></div>') +
        K.card(t('gm.pick'), '<p class="hint">' + esc(t('gm.pickh')) + '</p><div id="gm-pick"></div><div class="row gm-tools"><button type="button" class="btn sm" data-gm="prod">' + esc(t('gm.manage')) + '</button><button type="button" class="btn sm" data-gm="csvp">' + esc(t('gm.csvp')) + '</button><button type="button" class="btn sm" data-gm="csvb">' + esc(t('gm.csvb')) + '</button></div>') +
        K.card(t('gm.items'), K.list('items', t('gm.additem')) + '<div class="sums" id="ed-sums" aria-live="polite"></div>') +
        K.card(t('pos.pay'), '<div class="fg">' + K.f('status', t('l.pay'), { type: 'select', opts: [['paid', t('pay.paid')], ['unpaid', t('pay.unpaid')]] }) +
          K.f('payMode', t('pos.mode'), { type: 'select', opts: K.modes(['cash', 'upi', 'card', 'bank', 'cheque']), show: 'status=paid' }) + '</div>') +
        K.bizCard() +
        K.numCard(K.f('kind', t('pos.kind'), { type: 'select', opts: [['tax', t('k.tax')], ['supply', t('k.supply')], ['plain', t('k.cashmemo')]], wide: true, hint: t('gm.kindh') })) +
        K.lookCard(K.f('incl', t('gm.incl'), { type: 'check', hint: t('gm.inclh') }) + K.f('round', t('l.round'), { type: 'check' })) +
        '<datalist id="dl-rates"><option value="5"><option value="18"><option value="12"><option value="0"></datalist>';
    },
    rows: {
      items: function (it, i, K) {
        var d = K.doc();
        return K.rf('items', i, 'desc', t('gm.item'), { cls: 'it-d', sug: 'item' }) + K.rf('items', i, 'qty', t('l.qty'), { mode: 'decimal', ltr: 1 }) + K.rf('items', i, 'price', t('gm.price'), { mode: 'decimal', ltr: 1 }) +
          K.rf('items', i, 'disc', t('l.disc'), { mode: 'decimal', ltr: 1 }) + (d.kind === 'tax' ? K.rf('items', i, 'gst', t('l.gst'), { mode: 'decimal', ltr: 1, list: 'dl-rates' }) + K.rf('items', i, 'hsn', t('l.hsn'), { mode: 'numeric', max: 8, ltr: 1 }) : '');
      }
    },
    rowInput: function (n, i, k, d) { if (k === 'price' || k === 'gst') { var it = d.items[i]; if (k === 'price' && !String(it.gst).length) it.gst = G.gstFor(it.price); syncRate(d, it); } },
    pickItem: function (it, m, d) {
      it.desc = m.desc; it.hsn = m.hsn || it.hsn; it.unit = m.unit || it.unit || 'Pcs'; if (m.gst !== '' && m.gst != null) it.gst = m.gst;
      it.price = String(m.price != null && m.price !== '' ? m.price : m.rate != null ? m.rate : ''); syncRate(d, it);
    },
    input: function (p, el, d, K) {
      if (p === 'kind' || p === 'incl') { d.items.forEach(function (it) { syncRate(d, it); }); K.refill(); }
      if ((p === 'seller.gstin' || p === 'seller.name') && !K.editing()) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; d.items.forEach(function (it) { syncRate(d, it); }); K.refill(); } if (p === 'seller.name') load(); }
    },
    pickParty: function (p, d) { d.buyer.addr = p.addr || ''; },
    sums: sums,
    drawn: function () { if (!K) return; if ((K.editing() || null) !== LASTID && ITEMS.length) load(); else drawPick(); },
    edSums: function (d, o) {
      var warn = '', bm = G.billMap(d.items);
      Object.keys(bm).some(function (k) { var have = STOCK[k]; if (have != null && bm[k] > have) { var r = d.items.filter(function (it) { return G.key(it.desc) === k; })[0]; warn = t('gm.es.low', { n: Math.max(0, have), x: r ? r.desc : k }); return true; } return false; });
      return '<span>' + esc(t('gm.es.pcs', { n: o.qty })) + '</span>' + (o.disc ? '<span>' + esc(t('gm.es.disc', { v: NS.money(o.disc) })) + '</span>' : '') + (d.kind === 'tax' ? '<span>' + esc(t('sum.gst', { v: NS.money(o.tax) })) + '</span>' : '') +
        '<b>' + esc(t('sum.total', { v: NS.money(o.total) })) + '</b>' + (warn ? '<span class="warn">' + esc(warn) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!o.rows.length) p.push(['r-items-desc-0', t('gm.v.item')]);
      d.items.forEach(function (it, i) {
        if (G.isBlank(it)) return;
        if (!String(it.desc || '').trim()) p.push(['r-items-desc-' + i, t('gm.v.desc')]);
        if (!(num(it.qty) > 0)) p.push(['r-items-qty-' + i, t('gm.v.qty', { n: it.desc || i + 1 })]);
        if (!(num(it.rate) > 0)) p.push(['r-items-price-' + i, t('gm.v.price', { n: it.desc || i + 1 })]);
      });
      if (d.kind === 'tax' && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      if (d.kind === 'tax' && !d.buyer.gstin && o.taxable >= 50000 && (!d.buyer.name || !d.buyer.addr || !d.buyer.state)) p.push([!d.buyer.name ? 'k-buyer-name' : !d.buyer.addr ? 'k-buyer-addr' : 'k-buyer-state', t('v.b2c')]);
      return p;
    },
    confirm: function (d, o) { return d.status === 'paid' && d.payMode === 'cash' && o.total >= 200000 ? t('c.cash2l') : ''; },
    record: function (rec) { rec.items = rec.items.filter(function (it) { return !G.isBlank(it); }); rec.withGst = rec.kind === 'tax'; if (rec.status !== 'paid') delete rec.payMode; },
    saved: function () { load(); },
    histText: function (d) { return (d.items || []).map(function (it) { return it.desc; }).join(' '); },
    histPill: function (d) { return ' <span class="pill ' + (d.status === 'paid' ? 'ok' : '') + '">' + esc(t(d.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'; },
    histActs: function (d) { return '<button type="button" class="btn sm" data-h="paid" data-id="' + d.id + '">' + esc(t(d.status === 'paid' ? 'h.unpaid' : 'h.paid')) + '</button>'; },
    histAct: function (act, rec) { if (act !== 'paid') return; rec.status = rec.status === 'paid' ? 'unpaid' : 'paid'; return NSStore.put('doc', rec).then(function () { return { status: rec.status }; }); },
    shareText: function (d, o) { return '\nPieces: ' + o.qty + (d.status !== 'paid' ? '\nBalance due: ' + NS.money(o.total) : ''); },
    sheet: function (d, o, K) {
      var tax = d.kind === 'tax', b = d.buyer;
      if (/^th/.test(d.paper)) {
        return K.thOpen(d, TITLE[d.kind]) + K.kv([['Bill No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Customer', esc(b.name)]]) +
          '<table class="tl"><thead><tr><th class="l">Item</th><th class="n">Amount</th></tr></thead><tbody>' + o.rows.map(function (r) {
            return '<tr><td colspan="2" class="l">' + esc(r.it.desc) + '</td></tr><tr class="q"><td class="l">' + NS.qty(num(r.it.qty)) + '×' + NS.money(num(r.it.rate), false) + (num(r.it.disc) ? ' −' + num(r.it.disc) + '%' : '') + '</td><td class="n">' + NS.money(r.value, false) + '</td></tr>';
          }).join('') + '</tbody></table>' +
          K.kv([tax ? ['Taxable value', NS.money(o.taxable)] : null, tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null,
            o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand']], 'tot') +
          (d.status === 'paid' ? '<p class="paidline">PAID</p>' : '') + (d.notes ? '<p class="nt1">' + esc(d.notes) + '</p>' : '') + '<p class="thanks">Thank you, visit again</p>' + K.made() + '</div>';
      }
      return K.open(d, 'garment') + (d.status === 'paid' ? '<div class="stamp">PAID</div>' : '') + K.head(d, TITLE[d.kind], '') +
        K.meta([['Bill No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], tax ? ['Place of supply', b.state ? esc(NS.stateName(b.state)) + ' (' + b.state + ')' : d.seller.state ? esc(NS.stateName(d.seller.state)) + ' (' + d.seller.state + ')' : ''] : null]) +
        '<div class="parties">' + K.party(b, 'Customer') + '</div>' +
        '<table class="lines"><thead><tr><th>#</th><th class="l">Item</th>' + (tax ? '<th>HSN</th>' : '') + '<th class="n">Qty</th><th class="n">Rate</th><th class="n">Disc.</th>' + (tax ? '<th class="n">GST</th>' : '') + '<th class="n">Amount</th></tr></thead><tbody>' +
        (o.rows.length ? o.rows.map(function (r, i) {
          return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + '</td>' + (tax ? '<td class="mono">' + esc(r.it.hsn) + '</td>' : '') + '<td class="n">' + NS.qty(num(r.it.qty)) + ' ' + esc(r.it.unit || '') + '</td><td class="n">' + NS.money(num(r.it.rate), false) + '</td><td class="n">' + (num(r.it.disc) ? num(r.it.disc) + '%' : '') + '</td>' + (tax ? '<td class="n">' + r.g + '%</td>' : '') + '<td class="n">' + NS.money(r.value, false) + '</td></tr>';
        }).join('') : '<tr><td colspan="' + (tax ? 8 : 6) + '" class="ph">Items you add appear here</td></tr>') + '</tbody></table>' +
        '<div class="foot"><div class="foot-l">' + K.words(o.total) +
          (tax && Object.keys(o.byRate).length ? '<table class="sum"><caption>Tax summary</caption><thead><tr><th class="n">GST</th><th class="n">Taxable value</th>' + (o.intra ? '<th class="n">CGST</th><th class="n">SGST</th>' : '<th class="n">IGST</th>') + '</tr></thead><tbody>' +
            Object.keys(o.byRate).sort(function (a, c) { return a - c; }).map(function (g) { var x = o.byRate[g]; return '<tr><td class="n">' + g + '%</td><td class="n">' + NS.money(x.taxable, false) + '</td>' + (o.intra ? '<td class="n">' + NS.money(x.tax / 2, false) + '</td><td class="n">' + NS.money(x.tax / 2, false) + '</td>' : '<td class="n">' + NS.money(x.tax, false) + '</td>') + '</tr>'; }).join('') + '</tbody></table>' : '') +
          '<p class="small">Total pieces ' + o.qty + '.</p>' + (d.kind === 'supply' ? '<p class="small">Composition taxable person, not eligible to collect tax on supplies.</p>' : '') +
        '</div><div class="foot-r">' + K.tot([['Taxable value', NS.money(o.taxable)], tax && o.intra ? ['CGST', NS.money(o.cgst)] : null, tax && o.intra ? ['SGST', NS.money(o.sgst)] : null, tax && !o.intra ? ['IGST', NS.money(o.igst)] : null,
          o.roundOff ? ['Round off', (o.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(o.roundOff))] : null, ['Total', NS.money(o.total), 'grand']]) + (d.status !== 'paid' ? K.qr(d, o.total) : '') + '</div></div>' +
        (d.notes ? '<div class="nt"><div><h4>Notes</h4><p>' + esc(d.notes).replace(/\n/g, '<br>') + '</p></div></div>' : '') +
        '<div class="signs">' + K.blankSign('', 'Customer') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed) { if (ed._gm) return; ed._gm = 1; ed.addEventListener('click', pickClick); ed.addEventListener('change', pickChange); },
    ready: function (K) {
      var d = K.doc(); if (!K.editing() && d.seller.name) { var k = kindFor(d.seller); if (k !== d.kind) { d.kind = k; K.refill(); } }
      buildProd(); load();
    }
  });
})();
