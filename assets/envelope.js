/* NSBiz App: "Envelope printing" (#env, Utilities). Prints a party's address (and the business as sender) on an envelope: one party, or many at once (one envelope
   per page). Sizes DL, C6, C6/5, C5, C4, US #10, B5 or your own; plain or window envelopes; the position of the address and the sender can be moved by millimetres, the
   envelope can be turned a quarter for printers that feed the short edge; the choices are remembered on this device. App only, English only.
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var A = window.NSApp, NS = window.NS;
  if (!A || !NS) return;
  var $ = NS.$, esc = NS.esc;
  var SIZES = [['dl', 'DL (110 × 220 mm)', 110, 220], ['c6', 'C6 (114 × 162 mm)', 114, 162], ['c65', 'C6/5 (114 × 229 mm)', 114, 229], ['c5', 'C5 (162 × 229 mm)', 162, 229],
    ['c4', 'C4 (229 × 324 mm)', 229, 324], ['us10', 'US #10 (4⅛ × 9½ in)', 105, 241], ['b5', 'B5 (176 × 250 mm)', 176, 250], ['custom', 'My own size', 0, 0]];
  var KEY = 'ns-env';
  var DEF = { size: 'dl', w: 110, h: 220, mode: 'plain', fs: 13, sfs: 9, ax: 0, ay: 0, sx: 8, sy: 8, from: true, logo: false, to: true, phone: false, rot: false, bold: true };
  function load() { var o = {}; try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {} return Object.assign({}, DEF, o); }
  function store(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function dims(o) { var s = SIZES.filter(function (x) { return x[0] === o.size; })[0]; return s && s[0] !== 'custom' ? [s[2], s[3]] : [Math.max(60, +o.w || 220), Math.max(60, +o.h || 110)]; }
  /* the envelope is always drawn lying down: width is the long side */
  function wh(o) { var d = dims(o), a = Math.min(d[0], d[1]), b = Math.max(d[0], d[1]); return [b, a]; }
  /* where the address goes: a plain envelope takes it right of the middle, a window envelope in the window (DL window: 20 mm from the left, 45 mm from the top) */
  function addrPos(o) {
    var d = wh(o), W = d[0], H = d[1];
    var bx = o.mode === 'window' ? 20 : Math.round(W * 0.42), by = o.mode === 'window' ? Math.round(H * 0.42) : Math.round(H * 0.42);
    return [bx + (+o.ax || 0), by + (+o.ay || 0), o.mode === 'window' ? Math.min(90, W - 40) : Math.round(W * 0.5)];
  }
  function lines(p) {
    var b = [];
    if (p.name) b.push({ t: p.name, b: true });
    String(p.addr || '').split(/\n+/).forEach(function (l) { if (l.trim()) b.push({ t: l.trim() }); });
    var cp = [p.city, p.pin].filter(Boolean).join(' - '); if (cp && String(p.addr || '').indexOf(p.pin || '~~') < 0) b.push({ t: cp }); else if (p.city && String(p.addr || '').toLowerCase().indexOf(String(p.city).toLowerCase()) < 0) b.push({ t: p.city });
    if (p.state) { try { b.push({ t: NS.stateName(p.state) }); } catch (e) {} }
    return b;
  }
  function block(p, o, opt) {
    var ls = lines(p), out = '';
    ls.forEach(function (l, i) { out += '<div' + ((l.b && o.bold) ? ' class="b"' : '') + '>' + esc(l.t) + '</div>'; });
    if (opt && opt.phone && p.phone) out += '<div>Phone: ' + esc(p.phone) + '</div>';
    return out;
  }
  /* one envelope as HTML (used by the preview and by the print page) */
  function envHtml(o, to, from, unit) {
    var d = wh(o), W = d[0], H = d[1], pos = addrPos(o), px = function (n) { return n + 'mm'; };
    var snd = o.from && from ? '<div class="e-from" style="left:' + px(o.sx) + ';top:' + px(o.sy) + ';font-size:' + (+o.sfs || 9) + 'pt">' + (o.logo && from.logo ? '<img src="' + esc(from.logo) + '" alt="">' : '') + block(from, { bold: true }, { phone: true }) + '</div>' : '';
    var addr = '<div class="e-to" style="left:' + px(pos[0]) + ';top:' + px(pos[1]) + ';width:' + px(pos[2]) + ';font-size:' + (+o.fs || 13) + 'pt">' + (o.to ? '<div class="e-lbl">To,</div>' : '') + block(to, o, { phone: o.phone }) + '</div>';
    return '<div class="env' + (o.rot ? ' env-rot' : '') + '" style="width:' + px(W) + ';height:' + px(H) + '">' + snd + addr + '</div>';
  }
  var CSS = '.env{position:relative;box-sizing:border-box;overflow:hidden;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;line-height:1.3}' +
    '.env .e-from,.env .e-to{position:absolute}.env .e-from img{max-height:12mm;max-width:40mm;display:block;margin-bottom:1mm}.env .b{font-weight:700}.env .e-lbl{margin-bottom:.5mm}';
  function pageHtml(o, items, from) {
    var d = wh(o), W = d[0], H = d[1], pw = o.rot ? H : W, ph = o.rot ? W : H;
    var body = items.map(function (to) { return '<div class="pg">' + envHtml(o, to, from) + '</div>'; }).join('');
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Envelopes</title><style>@page{size:' + pw + 'mm ' + ph + 'mm;margin:0}html,body{margin:0;padding:0}' + CSS +
      '.pg{width:' + pw + 'mm;height:' + ph + 'mm;overflow:hidden;position:relative;page-break-after:always;break-after:page}.pg:last-child{page-break-after:auto;break-after:auto}' +
      '.pg .env-rot{transform-origin:0 0;transform:translateX(' + H + 'mm) rotate(90deg)}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>' + body + '</body></html>';
    return html;
  }
  function printPage(o, items, from) {
    var html = pageHtml(o, items, from);
    var f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var w = f.contentWindow, doc = w.document; doc.open(); doc.write(html); doc.close();
    var done = false, go = function () { if (done) return; done = true; try { w.focus(); w.print(); } catch (e) { NS.toast('The print window could not be opened here.', 'bad'); } setTimeout(function () { f.remove(); }, 60000); };
    if (doc.readyState === 'complete') setTimeout(go, 250); else f.onload = function () { setTimeout(go, 250); };
    return html;
  }
  window.NSEnvelope = { page: pageHtml, html: printPage, envHtml: envHtml, sizes: SIZES, load: load, wh: wh };   /* the test and the other screens (Print envelope from a party) use it */

  function partyOpts(list, cur) { return '<option value="">Choose a party…</option>' + list.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === cur ? ' selected' : '') + '>' + esc(p.name || '') + (p.city ? ' · ' + esc(p.city) : '') + '</option>'; }).join(''); }
  function html() {
    var o = load(), biz = A.biz();
    return '<div class="pane-hd"><h2>Envelope printing</h2></div>' +
      '<p class="soft">Print the address of a party on an envelope, with your business as the sender. Choose the envelope, check the picture, then print one envelope or one for every party you tick. Load the envelope in the printer the way the picture shows, or turn it a quarter below.</p>' +
      '<div class="env-grid"><div class="card env-ctl">' +
      '<div class="fg"><div class="f"><label for="ev-size">Envelope size</label><select id="ev-size">' + SIZES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === o.size ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f ev-cust"><label for="ev-w">Own size: long side × short side (mm)</label><div class="ev-two"><input id="ev-w" type="number" min="60" max="500" value="' + (+o.w || 220) + '"><input id="ev-h" type="number" min="60" max="500" value="' + (+o.h || 110) + '"></div></div>' +
      '<div class="f"><label for="ev-mode">Kind of envelope</label><select id="ev-mode"><option value="plain"' + (o.mode === 'plain' ? ' selected' : '') + '>Plain: address right of the middle</option><option value="window"' + (o.mode === 'window' ? ' selected' : '') + '>Window: address in the window (left)</option></select></div>' +
      '<div class="f"><label for="ev-fs">Address text size (pt)</label><input id="ev-fs" type="number" min="7" max="30" value="' + (+o.fs || 13) + '"></div>' +
      '<div class="f"><label for="ev-ax">Move address right / down (mm)</label><div class="ev-two"><input id="ev-ax" type="number" min="-60" max="120" value="' + (+o.ax || 0) + '" aria-label="Move address right in mm"><input id="ev-ay" type="number" min="-60" max="120" value="' + (+o.ay || 0) + '" aria-label="Move address down in mm"></div></div>' +
      '<div class="f"><label for="ev-sx">Sender from left / top (mm)</label><div class="ev-two"><input id="ev-sx" type="number" min="0" max="200" value="' + (+o.sx || 0) + '"><input id="ev-sy" type="number" min="0" max="200" value="' + (+o.sy || 0) + '"></div></div></div>' +
      '<div class="ev-chk"><label><input type="checkbox" id="ev-from"' + (o.from ? ' checked' : '') + '> Print my business as the sender</label>' +
      '<label><input type="checkbox" id="ev-logo"' + (o.logo ? ' checked' : '') + '> With my logo</label>' +
      '<label><input type="checkbox" id="ev-to"' + (o.to ? ' checked' : '') + '> Write “To,” above the address</label>' +
      '<label><input type="checkbox" id="ev-ph"' + (o.phone ? ' checked' : '') + '> Phone number under the address</label>' +
      '<label><input type="checkbox" id="ev-bold"' + (o.bold ? ' checked' : '') + '> Party name in bold</label>' +
      '<label><input type="checkbox" id="ev-rot"' + (o.rot ? ' checked' : '') + '> Turn a quarter (printer feeds the short edge)</label></div>' +
      '<h3 class="ev-h">Who is it for?</h3>' +
      '<div class="ev-tabs" role="tablist"><button type="button" class="btn sm on" data-evt="one">One party</button><button type="button" class="btn sm" data-evt="many">Many parties</button><button type="button" class="btn sm" data-evt="typed">Type an address</button></div>' +
      '<div data-evp="one"><div class="f"><label for="ev-party">Party</label><select id="ev-party">' + partyOpts(A.data().party || [], '') + '</select></div></div>' +
      '<div data-evp="many" hidden><div class="ev-two"><select id="ev-role"><option value="">All parties</option><option value="customer">Customers</option><option value="supplier">Suppliers</option></select><input id="ev-find" type="search" placeholder="Find a party…" aria-label="Find a party"></div>' +
      '<div class="btns"><button type="button" class="btn sm" data-evall>Tick all shown</button><button type="button" class="btn sm" data-evnone>Clear ticks</button><span class="soft" data-evn></span></div><div class="ev-list" data-evlist></div></div>' +
      '<div data-evp="typed" hidden><div class="fg"><div class="f"><label for="ev-tn">Name</label><input id="ev-tn" type="text"></div><div class="f wide"><label for="ev-ta">Address (one line per row)</label><textarea id="ev-ta" rows="3"></textarea></div>' +
      '<div class="f"><label for="ev-tc">City</label><input id="ev-tc" type="text"></div><div class="f"><label for="ev-tp">PIN code</label><input id="ev-tp" type="text" inputmode="numeric" maxlength="6"></div></div></div>' +
      '<div class="btns ev-go"><button type="button" class="btn primary" data-evprint data-ic="print"><span data-evlbl>Print envelope</span></button><span class="soft" data-evmsg role="status"></span></div>' +
      '<p class="soft">Tip: print one on plain paper first and hold it against an envelope to see where the address falls; move it with the millimetre boxes. Envelopes are not documents, so no credit line is printed on them.</p></div>' +
      '<div class="card env-pv"><h3 class="ev-h">Picture</h3><div class="ev-stage" data-evstage></div><p class="soft" data-evcap></p></div></div>' +
      (biz ? '' : '<p class="soft">Add your business first to print it as the sender.</p>');
  }
  function wire(pane) {
    var o = load(), mode = 'one', picked = {}, data = A.data(), parties = (data.party || []).filter(function (p) { return p && p.name; });
    var from = function () { var b = A.biz() || {}; return { name: b.name, addr: b.addr, city: b.city, pin: b.pin, state: b.state, phone: b.phone, logo: b.logo }; };
    function read() {
      o.size = $('#ev-size', pane).value; o.w = +$('#ev-w', pane).value || 220; o.h = +$('#ev-h', pane).value || 110; o.mode = $('#ev-mode', pane).value;
      o.fs = +$('#ev-fs', pane).value || 13; o.ax = +$('#ev-ax', pane).value || 0; o.ay = +$('#ev-ay', pane).value || 0; o.sx = +$('#ev-sx', pane).value || 0; o.sy = +$('#ev-sy', pane).value || 0;
      o.from = $('#ev-from', pane).checked; o.logo = $('#ev-logo', pane).checked; o.to = $('#ev-to', pane).checked; o.phone = $('#ev-ph', pane).checked; o.bold = $('#ev-bold', pane).checked; o.rot = $('#ev-rot', pane).checked;
      store(o);
    }
    function typed() { return { name: $('#ev-tn', pane).value.trim(), addr: $('#ev-ta', pane).value, city: $('#ev-tc', pane).value.trim(), pin: $('#ev-tp', pane).value.trim() }; }
    function one() { var id = $('#ev-party', pane).value, p = parties.filter(function (x) { return x.id === id; })[0]; return p || null; }
    function manyList() {
      var role = $('#ev-role', pane).value, q = $('#ev-find', pane).value.trim().toLowerCase();
      return parties.filter(function (p) { var r = p.role || 'customer'; return (!role || r === role || r === 'both') && (p.addr || p.city) && (!q || String(p.name + ' ' + (p.city || '')).toLowerCase().indexOf(q) >= 0); });
    }
    function drawMany() {
      var list = manyList(), box = $('[data-evlist]', pane);
      box.innerHTML = list.length ? list.map(function (p) { return '<label class="ev-row"><input type="checkbox" data-evid="' + esc(p.id) + '"' + (picked[p.id] ? ' checked' : '') + '> <b>' + esc(p.name) + '</b> <span class="soft">' + esc([p.city, p.pin].filter(Boolean).join(' ')) + '</span></label>'; }).join('') : '<p class="soft">No party with an address matches. Add the address in Masters › Parties.</p>';
      count();
    }
    function count() { var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length; $('[data-evn]', pane).textContent = n + ' ticked'; $('[data-evlbl]', pane).textContent = mode === 'many' ? 'Print ' + n + ' envelope' + (n === 1 ? '' : 's') : 'Print envelope'; }
    function current() {
      if (mode === 'many') { return parties.filter(function (p) { return picked[p.id]; }); }
      if (mode === 'typed') { var t = typed(); return t.name || t.addr ? [t] : []; }
      var p = one(); return p ? [p] : [];
    }
    function draw() {
      read();
      var stage = $('[data-evstage]', pane), cur = current(), to = cur[0] || { name: 'Party name', addr: 'Address line 1\nAddress line 2', city: 'City', pin: '000000' }, d = wh(o);
      var scale = Math.min(1, 520 / (d[0] * 3.78)) ; stage.innerHTML = '<style>' + CSS + '.ev-stage .env{border:1px solid #94a3b8;box-shadow:0 2px 8px rgba(0,0,0,.15)}</style><div class="ev-sc" style="width:' + Math.round(d[0] * 3.78 * scale) + 'px;height:' + Math.round(d[1] * 3.78 * scale) + 'px"><div style="zoom:' + scale + '">' + envHtml(Object.assign({}, o, { rot: false }), to, from()) + '</div></div>';
      $('.ev-cust', pane).style.display = o.size === 'custom' ? '' : 'none';
      $('[data-evcap]', pane).textContent = d[0] + ' × ' + d[1] + ' mm' + (o.rot ? ', printed turned a quarter' : '') + (cur[0] ? '' : '. Pick a party to see its address.');
    }
    pane.addEventListener('input', function (e) { if (e.target.matches('input,select,textarea')) { if (e.target.matches('[data-evid]')) { picked[e.target.getAttribute('data-evid')] = e.target.checked; count(); } else if (e.target.id === 'ev-role' || e.target.id === 'ev-find') drawMany(); draw(); } });
    pane.addEventListener('change', function (e) { if (e.target.matches('[data-evid]')) { picked[e.target.getAttribute('data-evid')] = e.target.checked; count(); draw(); } });
    pane.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-evt]');
      if (t) { mode = t.getAttribute('data-evt'); [].slice.call(pane.querySelectorAll('[data-evt]')).forEach(function (b) { b.classList.toggle('on', b === t); }); [].slice.call(pane.querySelectorAll('[data-evp]')).forEach(function (p) { p.hidden = p.getAttribute('data-evp') !== mode; }); if (mode === 'many') drawMany(); count(); draw(); return; }
      if (e.target.closest('[data-evall]')) { manyList().forEach(function (p) { picked[p.id] = true; }); drawMany(); draw(); return; }
      if (e.target.closest('[data-evnone]')) { picked = {}; drawMany(); draw(); return; }
      if (e.target.closest('[data-evprint]')) {
        read(); var items = current(), msg = $('[data-evmsg]', pane);
        if (!items.length) { msg.textContent = mode === 'one' ? 'Choose a party first.' : mode === 'many' ? 'Tick at least one party.' : 'Type a name or an address first.'; return; }
        if (items.length > 300) { msg.textContent = 'Print at most 300 envelopes at a time.'; return; }
        msg.textContent = items.length + ' envelope' + (items.length === 1 ? '' : 's') + ' sent to the print window.'; printPage(o, items, from());
      }
    });
    draw();
  }

  /* ---------- "Envelope" button on party and bill screens (parties list, party ledger, dues, bill rows, bill view) ---------- */
  function key(n) { return String(n || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function masterOf(name) { var k = key(name); return ((A.data() || {}).party || []).filter(function (p) { return key(p.name) === k; })[0] || null; }
  function docById(id) { return ((A.data() || {}).doc || []).filter(function (d) { return d.id === id; })[0] || null; }
  function partyFromDoc(d) { var b = d && d.buyer || {}; var m = masterOf(b.name); return m || { name: b.name, addr: b.addr, city: b.city, pin: b.pin, state: b.state, phone: b.phone }; }
  function senderOf() { var b = A.biz() || {}; return { name: b.name, addr: b.addr, city: b.city, pin: b.pin, state: b.state, phone: b.phone, logo: b.logo }; }
  function quick(p) {
    if (!p || !p.name) { NS.toast('No party to print an envelope for.', 'bad'); return; }
    if (!(p.addr || p.city || p.pin)) { NS.toast(p.name + ' has no address saved yet. Add it in My data › Customers and suppliers.', 'bad'); return; }
    var o = load(), dlg = document.createElement('dialog'); dlg.className = 'b2-dlg env-q';
    dlg.innerHTML = '<form method="dialog"><h2>Print envelope</h2><p class="soft">For <b>' + esc(p.name) + '</b>. Load the envelope the way the picture on the Envelope printing screen shows.</p>' +
      '<div class="f"><label for="eq-size">Envelope</label><select id="eq-size">' + SIZES.filter(function (x) { return x[0] !== 'custom'; }).map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === o.size ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="eq-mode">Type</label><select id="eq-mode"><option value="plain"' + (o.mode === 'plain' ? ' selected' : '') + '>Plain</option><option value="window"' + (o.mode === 'window' ? ' selected' : '') + '>With a window</option></select></div>' +
      '<div class="ev-chk"><label><input type="checkbox" id="eq-from"' + (o.from ? ' checked' : '') + '> My business as the sender</label><label><input type="checkbox" id="eq-rot"' + (o.rot ? ' checked' : '') + '> Turn a quarter (printer feeds the short edge)</label></div>' +
      '<div class="actions"><button type="button" class="btn primary" data-eq-go>Print envelope</button> <a class="btn" href="#env" data-eq-more>More settings</a> <button type="submit" class="btn">Close</button></div></form>';
    document.body.appendChild(dlg);
    var fin = function () { try { dlg.close(); } catch (e) {} dlg.remove(); };
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.querySelector('[data-eq-go]').addEventListener('click', function () {
      var c = load(); c.size = dlg.querySelector('#eq-size').value; c.mode = dlg.querySelector('#eq-mode').value; c.from = dlg.querySelector('#eq-from').checked; c.rot = dlg.querySelector('#eq-rot').checked; store(c);
      fin(); printPage(c, [p], senderOf());
    });
    dlg.querySelector('[data-eq-more]').addEventListener('click', fin);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  window.NSEnvelope.quick = quick;
  window.NSEnvelope.btn = function (attr, small) { return '<button type="button" class="btn' + (small ? ' sm ib' : '') + '" ' + attr + ' title="Print an envelope" aria-label="Print an envelope">' + (small ? NS.icSvg('mail') : 'Envelope') + '</button>'; };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-env-name],[data-env-doc]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.hasAttribute('data-env-doc')) quick(partyFromDoc(docById(b.getAttribute('data-env-doc'))));
    else { var nm = b.getAttribute('data-env-name'); quick(masterOf(nm) || { name: nm }); }
  }, true);
  /* its link in the App's menu (Utilities), like bankimp.js: the side menu only lists screens that have one (help-update, 27 Nov 2026) */
  (function () {
    function link() { var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs') || $('[data-sec="env"]', nav)) return;
      nav.appendChild(NS.el('a', { href: '#env', 'data-sec': 'env' }, '<span>' + esc(A.T('env')) + '</span>')); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', link); else link();
  })();
  A.addSection('env', html, wire);
})();
