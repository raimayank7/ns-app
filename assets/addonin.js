/* NSBiz Helper add-on, phase 4: "From the add-on" (#inbox). What the person sent from other websites with the add-on's
   right-click menu waits here until they check it and press Add: a party, an item, a table of parties or items, a supplier's
   price, a snipped picture of a bill (read by the bill-photo reader, billscan.js). Nothing goes into the books without that.
   App only, English only. Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var A = window.NSApp, NS = window.NS;
  if (!A || !NS) return;
  var $ = NS.$, esc = NS.esc, LIST = [];
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function money(n) { return NS.money ? NS.money(+n || 0) : String(n); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '')); return isFinite(n) ? n : null; }
  var STATE_BY_NAME = {};
  (NS.STATES || []).forEach(function (s) { STATE_BY_NAME[key(s[1])] = s[0]; });

  /* table headings -> fields */
  var PCOLS = [['name', /^(name|party|party name|customer|supplier|vendor|firm|company|buyer|seller|account)/], ['gstin', /gstin|gst no|gst number|gstn/], ['phone', /phone|mobile|contact|cell|whatsapp/],
    ['email', /e-?mail/], ['addr', /address|addr/], ['city', /^city|town/], ['state', /^state/], ['pin', /pin|postal|zip/]];
  var ICOLS = [['desc', /^(item|description|product|particulars|name|goods|service)/], ['hsn', /hsn|sac/], ['unit', /^(unit|uom|qty unit)/],
    ['prate', /purchase|cost|buy/], ['rate', /rate|price|mrp|amount|sale/], ['gst', /gst ?%|tax ?%|gst rate|^gst$|^tax$/]];
  function mapCols(head, cols) {
    var out = {}, used = {};
    head.forEach(function (h, i) { var k = key(h); cols.some(function (c) { if (!used[c[0]] && c[1].test(k)) { out[i] = c[0]; used[c[0]] = 1; return true; } return false; }); });
    return out;
  }
  function guessKind(head) {
    var p = Object.keys(mapCols(head, PCOLS)).length, it = Object.keys(mapCols(head, ICOLS)).length;
    return it > p ? 'item' : 'party';
  }
  function rowsToRecs(rows, kind) {
    var head = rows[0] || [], m = mapCols(head, kind === 'item' ? ICOLS : PCOLS);
    return rows.slice(1).map(function (r) {
      var o = {}; Object.keys(m).forEach(function (i) { var v = String(r[i] == null ? '' : r[i]).trim(); if (v) o[m[i]] = v; });
      return o;
    }).filter(function (o) { return kind === 'item' ? o.desc : o.name; });
  }
  function partyRec(d) {
    var r = { name: String(d.name || '').trim(), role: d.role || 'customer' };
    ['gstin', 'phone', 'email', 'addr', 'city', 'pin', 'pan'].forEach(function (k) { if (d[k]) r[k] = String(d[k]).trim(); });
    if (r.gstin) { r.gstin = r.gstin.toUpperCase().replace(/\s/g, ''); r.state = r.gstin.slice(0, 2); }
    else if (d.state) r.state = /^\d\d$/.test(d.state) ? d.state : STATE_BY_NAME[key(d.state)] || '';
    return r;
  }
  function itemRec(d) {
    var r = { desc: String(d.desc || '').trim(), kind: 'goods', unit: d.unit || 'Nos', gst: num(d.gst) != null ? num(d.gst) : 18 };
    if (d.hsn) r.hsn = String(d.hsn).replace(/\s/g, '');
    if (num(d.rate) != null) r.rate = num(d.rate);
    if (num(d.prate) != null) r.prate = num(d.prate);
    return r;
  }
  /* adds what is not there yet (same name, or same GSTIN for parties); returns how many were added */
  function addMany(store, recs) {
    return NSStore.list(store).then(function (have) {
      var names = {}, gst = {}, n = 0;
      have.forEach(function (x) { names[key(store === 'item' ? x.desc : x.name)] = 1; if (x.gstin) gst[x.gstin] = 1; });
      return recs.reduce(function (p, r) {
        return p.then(function () {
          var k = key(store === 'item' ? r.desc : r.name);
          if (!k || names[k] || (r.gstin && gst[r.gstin])) return;
          names[k] = 1; if (r.gstin) gst[r.gstin] = 1; n++;
          return NSStore.put(store, r);
        });
      }, Promise.resolve()).then(function () { return n; });
    });
  }

  function done(id) { return NS.addon.call('inboxDone', { id: id }).then(function () { LIST = LIST.filter(function (x) { return x.id !== id; }); draw(); }); }
  function when(t) { return new Date(t).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
  function src(x) { return x.data && x.data.url ? '<p class="soft">From <bdi>' + esc(x.data.title || x.data.url) + '</bdi> · ' + esc(when(x.at)) + '</p>' : '<p class="soft">' + esc(when(x.at)) + '</p>'; }
  function f(id, label, val, attrs) { return '<label class="ai-f" for="' + id + '"><span>' + esc(label) + '</span><input id="' + id + '" value="' + esc(val || '') + '"' + (attrs || '') + '></label>'; }

  /* courier tracking number -> the dispatch details of a sale bill or challan (challans: doc.tr, others: doc.disp) */
  var TRACK_TYPES = { invoice: 'Invoice', challan: 'Challan', cashmemo: 'Cash memo', so: 'Sales order', proforma: 'Proforma', expinv: 'Export invoice' };
  function trackDocs() {
    return (A.mine ? A.mine() : []).filter(function (d) { return TRACK_TYPES[d.type] && !d.del; })
      .sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || (b.upd || 0) - (a.upd || 0); }).slice(0, 300);
  }
  function trackLabel(d) { return TRACK_TYPES[d.type] + ' ' + (d.no || '') + ' · ' + ((d.buyer && d.buyer.name) || '') + ' · ' + (d.date || ''); }
  function setTrack(d, courier, no) {
    if (d.type === 'challan') { d.tr = d.tr || {}; if (courier) d.tr.tname = courier; d.tr.lr = no; }
    else { d.disp = d.disp || {}; if (courier) d.disp.through = courier; d.disp.lr = no; if (!d.disp.mode) d.disp.mode = 'Courier'; }
    d.upd = Date.now();
    return d;
  }

  function card(x) {
    var d = x.data || {}, b = '<div class="card ai-card" data-ai="' + esc(x.id) + '">';
    if (x.kind === 'party') {
      b += '<h3>New party</h3>' + src(x) + '<div class="ai-grid">' + f('ai-n-' + x.id, 'Name', d.name, ' required') + f('ai-g-' + x.id, 'GSTIN', d.gstin) + f('ai-p-' + x.id, 'Phone', d.phone) +
        '<label class="ai-f"><span>Is a</span><select id="ai-r-' + x.id + '"><option value="customer">Customer</option><option value="supplier"' + (d.role === 'supplier' ? ' selected' : '') + '>Supplier</option><option value="both">Both</option></select></label></div>' +
        (d.note ? '<p class="note">' + esc(d.note) + '</p>' : '') +
        '<div class="row"><button type="button" class="btn primary" data-ai-party>Add party</button><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    } else if (x.kind === 'item') {
      b += '<h3>New item</h3>' + src(x) + '<div class="ai-grid">' + f('ai-d-' + x.id, 'Item name', d.desc, ' required') + f('ai-h-' + x.id, 'HSN / SAC', d.hsn) + f('ai-u-' + x.id, 'Unit', d.unit || 'Nos') +
        f('ai-rt-' + x.id, 'Sale rate', d.rate, ' inputmode="decimal"') + f('ai-gs-' + x.id, 'GST %', d.gst != null ? d.gst : 18, ' inputmode="decimal"') + '</div>' +
        '<div class="row"><button type="button" class="btn primary" data-ai-item>Add item</button><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    } else if (x.kind === 'table') {
      var rows = d.rows || [], kind = guessKind(rows[0] || []), recs = rowsToRecs(rows, kind);
      b += '<h3>Table: ' + (rows.length - 1) + ' rows</h3>' + src(x) +
        '<label class="ai-f"><span>Add the rows as</span><select data-ai-tkind><option value="party"' + (kind === 'party' ? ' selected' : '') + '>Parties</option><option value="item"' + (kind === 'item' ? ' selected' : '') + '>Items</option></select></label>' +
        '<div class="tbl-wrap"><table class="ai-tbl"><tbody>' + rows.slice(0, 8).map(function (r, i) { return '<tr>' + r.map(function (c) { return (i ? '<td>' : '<th>') + esc(c) + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        (rows.length > 8 ? '<p class="soft">and ' + (rows.length - 8) + ' more rows</p>' : '') +
        '<p class="soft" data-ai-tsum>' + recs.length + ' can be added (the first row is taken as the headings; names already saved are left out).</p>' +
        '<div class="row"><button type="button" class="btn primary" data-ai-table>Add them</button><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    } else if (x.kind === 'price') {
      var items = (A.data().item || []).map(function (i) { return i.desc; }).filter(Boolean);
      b += '<h3>Supplier price</h3>' + src(x) + '<p>“' + esc(d.text || '') + '”</p><div class="ai-grid">' +
        f('ai-it-' + x.id, 'Item', d.item || '', ' list="ai-items" required') + f('ai-pr-' + x.id, 'Price', d.rate != null ? d.rate : '', ' inputmode="decimal" required') + f('ai-sp-' + x.id, 'Supplier', d.supplier || '') + '</div>' +
        '<datalist id="ai-items">' + items.slice(0, 3000).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
        '<label class="md-chk"><input type="checkbox" id="ai-pp-' + x.id + '"> Also make it the purchase rate of the item</label>' +
        '<div class="row"><button type="button" class="btn primary" data-ai-price>Save price</button><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    } else if (x.kind === 'track') {
      var L = trackDocs();
      b += '<h3>Courier tracking number</h3>' + src(x) + '<div class="ai-grid">' + f('ai-tn-' + x.id, 'Tracking (AWB / docket) no.', d.no, ' required') + f('ai-tc-' + x.id, 'Courier', d.courier || '') +
        '<label class="ai-f ai-wide"><span>Put it on</span><select id="ai-td-' + x.id + '">' + (L.length ? L.map(function (y) { return '<option value="' + esc(y.id) + '">' + esc(trackLabel(y)) + '</option>'; }).join('') : '<option value="">No sale bill or challan yet</option>') + '</select></label></div>' +
        '<p class="soft">It goes into the document’s dispatch details (LR / docket no. and courier) and prints on it.</p>' +
        '<div class="row"><button type="button" class="btn primary" data-ai-track' + (L.length ? '' : ' disabled') + '>Add to this document</button><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    } else if (x.kind === 'image') {
      b += '<h3>Snipped picture</h3>' + src(x) + (d.img ? '<img class="ai-img" alt="Snipped part of a page" src="' + esc(d.img) + '">' : '') +
        '<div class="row"><button type="button" class="btn primary" data-ai-scan>Read this bill</button>' + (NS.einvQR ? '<button type="button" class="btn" data-ai-qr>Check e-invoice QR</button>' : '') + '<button type="button" class="btn" data-ai-drop>Remove</button></div><div data-ai-qrout aria-live="polite"></div>';
    } else b += '<p>' + esc(x.kind) + '</p><div class="row"><button type="button" class="btn" data-ai-drop>Remove</button></div>';
    return b + '</div>';
  }
  function body() {
    if (!NS.addon || !NS.addon.on) return '<div class="card"><p>Things sent from other websites with the NSBiz Helper add-on show here. The add-on is not in this browser.</p></div>';
    if (!LIST.length) return '<div class="card"><p>Nothing waiting. On any website, select a GSTIN, a name, a price or a table and right-click: <b>NSBiz Helper</b>.</p></div>';
    return LIST.map(card).join('');
  }
  function draw() { var el = $('#ai-list'); if (el) el.innerHTML = body(); }
  function load() {
    if (!NS.addon || !NS.addon.on) return draw();
    NS.addon.call('inbox').then(function (l) { LIST = (l || []).slice().reverse(); draw(); }, function () { draw(); });
  }
  function html(arg) {
    /* #inbox/<stamp>: the add-on sends a new address each time, so the list is read again even when this screen is open */
    if (arg) try { history.replaceState(null, '', '#inbox'); } catch (e) {}
    return '<div class="pane-hd"><h2>From the add-on</h2></div><p class="soft">Check each one and press Add. Nothing goes into your books until you do.</p><div id="ai-list"><p class="soft">Loading…</p></div>';
  }
  function wire(pane) {
    var root = $('#ai-list', pane); if (!root) return;   /* the list box is new on every visit, so its listeners never pile up */
    load();
    root.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-ai]'); if (!c) return;
      var id = c.getAttribute('data-ai'), x = LIST.filter(function (y) { return y.id === id; })[0]; if (!x) return;
      var v = function (p) { var el = document.getElementById(p + id); return el ? el.value.trim() : ''; };
      if (e.target.closest('[data-ai-drop]')) return done(id);
      if (e.target.closest('[data-ai-party]')) {
        var r = partyRec({ name: v('ai-n-'), gstin: v('ai-g-'), phone: v('ai-p-'), role: v('ai-r-'), pan: x.data.pan });
        if (!r.name) { NS.toast('Type the party name.', 'bad'); return; }
        return addMany('party', [r]).then(function (n) { NS.toast(n ? 'Party added: ' + r.name : r.name + ' is already saved.', n ? '' : 'bad'); return done(id); });
      }
      if (e.target.closest('[data-ai-item]')) {
        var it = itemRec({ desc: v('ai-d-'), hsn: v('ai-h-'), unit: v('ai-u-'), rate: v('ai-rt-'), gst: v('ai-gs-') });
        if (!it.desc) { NS.toast('Type the item name.', 'bad'); return; }
        return addMany('item', [it]).then(function (n) { NS.toast(n ? 'Item added: ' + it.desc : it.desc + ' is already saved.', n ? '' : 'bad'); return done(id); });
      }
      if (e.target.closest('[data-ai-table]')) {
        var kind = $('[data-ai-tkind]', c).value, recs = rowsToRecs(x.data.rows || [], kind).map(kind === 'item' ? itemRec : partyRec);
        return addMany(kind, recs).then(function (n) { NS.toast(n + (kind === 'item' ? ' items' : ' parties') + ' added.'); return done(id); });
      }
      if (e.target.closest('[data-ai-price]')) {
        var name = v('ai-it-'), rate = num(v('ai-pr-')), item = (A.data().item || []).filter(function (i) { return key(i.desc) === key(name); })[0];
        if (!item) { NS.toast('Pick an item you have saved (or add it first).', 'bad'); return; }
        if (rate == null) { NS.toast('Type the price.', 'bad'); return; }
        item.prices = (item.prices || []).concat([{ date: NS.today(), rate: rate, supplier: v('ai-sp-'), url: x.data.url || '' }]).slice(-20);
        if (document.getElementById('ai-pp-' + id).checked) item.prate = rate;
        return NSStore.put('item', item).then(function () { NS.toast('Price saved on ' + item.desc + ': ' + money(rate)); return done(id); });
      }
      if (e.target.closest('[data-ai-track]')) {
        var no = v('ai-tn-').toUpperCase(), cour = v('ai-tc-'), did = v('ai-td-'), doc = trackDocs().filter(function (y) { return y.id === did; })[0];
        if (!no) { NS.toast('Type the tracking number.', 'bad'); return; }
        if (!doc) { NS.toast('Pick the document.', 'bad'); return; }
        return NSStore.put('doc', setTrack(doc, cour, no)).then(function () { NS.toast('Tracking no. ' + no + ' added to ' + trackLabel(doc).split(' · ')[0] + '.'); document.dispatchEvent(new CustomEvent('ns-data')); return done(id); });
      }
      if (e.target.closest('[data-ai-qr]')) {
        var qo = $('[data-ai-qrout]', c); qo.innerHTML = '<p class="soft">Reading the QR…</p>';
        return NS.einvQR.readQR(x.data.img).then(function (txt) {
          if (!txt) { qo.innerHTML = '<p class="note">No QR code found in this picture. Snip again around the QR, a little larger.</p>'; return; }
          return NS.einvQR.check(txt).then(function (r) {
            var me = A.biz && A.biz() || {};
            qo.innerHTML = r ? NS.einvQR.html(r, me.gstin || '') : '<p class="note">This QR is not a signed e-invoice QR (it has no IRN).</p>';
          });
        }).catch(function () { qo.innerHTML = '<p class="note bad">The QR could not be read.</p>'; });
      }
      if (e.target.closest('[data-ai-scan]')) {
        if (!A.scanFile) { NS.toast('The bill reader is not on this page.', 'bad'); return; }
        return fetch(x.data.img).then(function (r) { return r.blob(); }).then(function (bl) { A.scanFile(new File([bl], 'snip.jpg', { type: bl.type || 'image/jpeg' })); return done(id); });
      }
    });
    root.addEventListener('change', function (e) {
      var s = e.target.closest && e.target.closest('[data-ai-tkind]'); if (!s) return;
      var c = s.closest('[data-ai]'), x = LIST.filter(function (y) { return y.id === c.getAttribute('data-ai'); })[0];
      $('[data-ai-tsum]', c).textContent = rowsToRecs(x.data.rows || [], s.value).length + ' can be added (the first row is taken as the headings; names already saved are left out).';
    });
  }
  A.addSection('inbox', html, wire);
  /* pure parts, for tests */
  NS.addonInbox = { setTrack: setTrack, mapCols: mapCols, guessKind: guessKind, rowsToRecs: rowsToRecs, partyRec: partyRec, itemRec: itemRec };
})();
