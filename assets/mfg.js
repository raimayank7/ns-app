/* Manufacturing extras in the Nivesh Sahayak App (Stock Step C), through NSApp like more.js. Logic lives in mfgcore.js (NSMfg).
     b2make  replaces more.js's Production screen: bill of materials versions (name + in use from), multi-level BOM
             (sub-parts made in the same entry or used from stock, loops refused), by-products and scrap in a production entry
     b2job   job work: sent to a job worker / received back (stock records 'jobout' / 'jobin'), goods still with job workers
             with the 1-year (inputs) and 3-year (capital goods) limits, ITC-04 Table 4 and 5A with Excel download
   Printed sheets stay in English like the other App reports. */
(function () {
  'use strict';
  var A = window.NSApp, F = window.NSMfg; if (!A || !F || !window.NSStock) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, S = NSStock, key = F.key, qty = NS.qty;
  function T(k, v) { return NS.t('mf.' + k, v); }
  function B2(k, v) { return NS.t('b2.' + k, v); }
  function items() { return A.data().item; }
  function item(nm) { return items().filter(function (x) { return key(x.desc) === key(nm); })[0]; }
  function today() { return NS.today(); }
  function biz() { return A.biz() || {}; }
  function sellerCopy() { var s = JSON.parse(JSON.stringify(biz())); delete s.id; delete s.created; delete s.updated; return s; }
  function byId(id) { return A.data().doc.filter(function (x) { return x.id === id; })[0]; }
  function m(v) { return v ? money(v, false) : '—'; }
  function nextNo(kind, pre, date) {
    var fy = NS.fy(date), max = 0;
    A.mine().forEach(function (d) { if (d.type !== 'stk' || d.kind !== kind || NS.fy(d.date) !== fy) return; var x = String(d.no || '').match(/(\d+)\s*$/); if (x) max = Math.max(max, +x[1]); });
    return pre + '/' + fy.slice(2, 4) + '-' + fy.slice(5) + '/' + String(max + 1).padStart(3, '0');
  }
  function lockOk(date, rec) { var c = A.closedMsg || function () { return ''; }, msg = c(date) || rec && c(rec.date); if (msg) NS.toast(msg, 'bad'); return !msg; }
  function need(ok, f) { if (ok) return true; NS.toast(A.T('need', { f: f }), 'bad'); return false; }
  function del(id) {
    var d = byId(id); if (!d || !lockOk(d.date)) return;
    if (d.kind === 'jobout' && A.data().doc.some(function (x) { return x.kind === 'jobin' && x.ref === id; })) { NS.toast(T('hasback'), 'bad'); return; }
    var ask = NS.ask ? NS.ask(A.T('cdel', { x: (d.no || '') })) : Promise.resolve(confirm(A.T('cdel', { x: d.no || '' })));
    Promise.resolve(ask).then(function (ok) { if (ok) return NSStore.del('doc', id).then(function () { NS.toast(A.T('deleted')); A.show(); }); });
  }
  function gdNames() { var o = {}; ((A.cfg && A.cfg() || {}).godowns || []).forEach(function (g) { if (g) o[key(g)] = g; }); A.mine().forEach(function (d) { [d.gd, d.from, d.to].forEach(function (g) { if (g && !F.isJw(g)) o[key(g)] = o[key(g)] || g; }); }); return Object.keys(o).map(function (k) { return o[k]; }).filter(function (g) { return key(g) !== S.MAIN; }).sort(); }
  function gdOpts() { return [['', B2('main')]].concat(gdNames().map(function (g) { return [g, g]; })); }
  function head(title, sub) { var b = biz(); return '<div class="st-hd"><div><b>' + esc(b.name) + '</b>' + (b.gstin ? '<br>GSTIN ' + esc(b.gstin) : '') + '</div><div class="r"><b>' + esc(title) + '</b><br>' + esc(sub) + '</div></div>'; }
  function foot() { return '<p class="st-ft">Made with Nivesh Sahayak on ' + A.ldate(today()) + '.</p>'; }

  /* ---------- dialog ---------- */
  var dlg, form, onSave;
  function open(title, html, save, wire) {
    if (!dlg) {
      dlg = NS.el('dialog', { 'class': 'hub-dlg b2-dlg mf-dlg', 'aria-labelledby': 'mf-dlg-t' });
      dlg.innerHTML = '<div class="dlg-hd"><h2 id="mf-dlg-t"></h2><button type="button" class="icon-btn" data-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><form novalidate></form>';
      document.body.appendChild(dlg); form = $('form', dlg);
      $('[data-x]', dlg).addEventListener('click', function () { dlg.close(); });
      form.addEventListener('submit', function (e) { e.preventDefault(); if (onSave) onSave(); });
    }
    $('#mf-dlg-t', dlg).textContent = title;
    form.innerHTML = html + '<div class="dlg-foot btns"><button type="submit" class="btn primary">' + esc(A.T('save')) + '</button><button type="button" class="btn" data-cancel>' + esc(A.T('cancel')) + '</button></div>';
    $('[data-cancel]', form).addEventListener('click', function () { dlg.close(); });
    onSave = save; if (wire) wire(form);
    dlg.showModal();
    var f1 = $('input:not([type=hidden]),select', form); if (f1) f1.focus();
  }
  function fld(id, label, html, o) { o = o || {}; return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + html + (o.hint ? '<small class="soft">' + esc(o.hint) + '</small>' : '') + '</div>'; }
  function inp(id, v, o) { o = o || {}; return '<input id="' + id + '" value="' + esc(v == null ? '' : v) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '" dir="ltr"' : ' dir="auto"') + (o.req ? ' required' : '') + (o.list ? ' list="' + o.list + '"' : '') + (o.ro ? ' readonly' : '') + ' autocomplete="off">'; }
  function sel(id, v, opts) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function val(id) { var e = $('#' + id, form); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : ''; }
  function dl(id, list) { return '<datalist id="' + id + '">' + list.filter(Boolean).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>'; }
  function itemNames() { return items().filter(function (x) { return x.kind !== 'service'; }).map(function (x) { return x.desc; }).sort(); }
  function unitsOf(nm) { var x = item(nm), a = F.altOf(x); return [x && x.unit || ''].concat(a ? [a.unit] : []).filter(Boolean); }

  /* line editor: cols = [[field, label, opts]], one row per line; a field 'cap' is a tick box */
  function lines(L, pre, cols) {
    return L.map(function (l, i) {
      return '<div class="mf-l" style="--n:' + (cols.length - 1) + '">' + cols.map(function (c) {
        var id = pre + c[0] + '-' + i;
        if (c[0] === 'cap') return '<label class="chk mf-cap"><input type="checkbox" id="' + id + '"' + (l.cap ? ' checked' : '') + '> ' + esc(c[1]) + '</label>';
        if (c[2] && c[2].ro) return '<div class="lc"><span>' + esc(c[1]) + '</span><b class="mf-ro">' + esc(l[c[0]]) + '</b></div>';
        return '<label class="lc"><span>' + esc(c[1]) + '</span>' + inp(id, l[c[0]], c[2] || {}) + '</label>';
      }).join('') + (L.length > 1 && pre !== 'ri-' ? '<button type="button" class="icon-btn rm" data-mfrm="' + pre + '|' + i + '" aria-label="' + esc(A.T('rmline')) + '">✕</button>' : '<span></span>') + '</div>';
    }).join('');
  }
  function read(L, pre, cols) { L.forEach(function (l, i) { cols.forEach(function (c) { if (c[2] && c[2].ro) return; var v = val(pre + c[0] + '-' + i); l[c[0]] = v; }); }); }
  function unitList(id) { return dl(id, ['Nos', 'Pcs', 'Kg', 'Mtr', 'Ltr', 'Box', 'Set', 'Bag', 'Doz']); }

  /* ---------- production ---------- */
  A.addSection('b2make', function () {
    var withBom = items().filter(function (x) { return F.bomList(x).length; }).sort(function (a, b) { return a.desc.localeCompare(b.desc); });
    var made = A.mine().filter(function (d) { return d.type === 'stk' && d.kind === 'make'; }).filter(A.match).sort(A.byDate).slice(0, 40);
    function vline(x, v, n) {
      return '<li><div class="ln"><b>' + esc(x.desc) + (n > 1 || v.name ? ' · ' + esc(v.name || T('v1')) : '') + '</b>' + (v.from ? ' <span class="soft">' + esc(T('inuse', { d: A.ldate(v.from) })) + '</span>' : '') +
        '<span class="soft">' + esc(B2('bomper', { n: qty(num(v.per) || 1), u: x.unit || '' })) + ': ' + (v.lines || []).map(function (l) { var sub = F.bomList(item(l.desc)).length; return esc(l.desc) + ' ' + qty(num(l.qty)) + (l.unit ? ' ' + esc(l.unit) : '') + (sub ? ' ⚙' : ''); }).join(', ') +
        ((v.by || []).length ? ' · ' + esc(T('bylist')) + ': ' + v.by.map(function (b) { return esc(b.desc) + ' ' + qty(num(b.qty)); }).join(', ') : '') + '</span></div>' +
        '<div class="acts"><button type="button" class="btn sm" data-mfmake="' + esc(x.desc) + '" data-ver="' + esc(v.name || '') + '">' + esc(B2('makeit')) + '</button><button type="button" class="btn sm" data-mfbom="' + esc(x.id) + '" data-ver="' + esc(v.name || '') + '">' + esc(A.T('edit')) + '</button></div></li>';
    }
    return '<div class="pane-hd"><h2>' + esc(B2('make')) + '</h2><div class="quick"><button type="button" class="btn primary" data-mf="make">+ ' + esc(B2('newmake')) + '</button><button type="button" class="btn" data-mf="bom">+ ' + esc(B2('newbom')) + '</button></div></div>' +
      '<p class="soft">' + esc(B2('makeh')) + ' ' + esc(T('makeh2')) + '</p>' +
      '<div class="card"><h3>' + esc(B2('boms')) + '</h3>' + (withBom.length ? '<ul class="rows">' + withBom.map(function (x) {
        var V = F.bomList(x);
        return V.map(function (v) { return vline(x, v, V.length); }).join('') + '<li class="mf-newv"><button type="button" class="btn sm" data-mfbom="' + esc(x.id) + '" data-new="1">+ ' + esc(T('vnew')) + ': ' + esc(x.desc) + '</button></li>';
      }).join('') + '</ul>' : '<p class="soft">' + esc(B2('nobom')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(B2('made')) + '</h3>' + (made.length ? '<ul class="rows">' + made.map(function (d) {
        var o = d.out || {};
        return '<li><div class="ln"><b>' + esc(o.desc) + ' × ' + qty(num(o.qty)) + '</b> <span class="soft">' + A.ldate(d.date) + ' · ' + esc(d.no || '') + (d.ver ? ' · ' + esc(d.ver) : '') + (d.gd ? ' · ' + esc(d.gd) : '') + '</span><span class="soft">' + esc(B2('costpu', { a: money(num(o.rate)) })) +
          ((d.subs || []).length ? ' · ' + esc(T('subsmade')) + ': ' + d.subs.map(function (s) { return esc(s.desc) + ' ' + qty(num(s.qty)); }).join(', ') : '') +
          ((d.by || []).length ? ' · ' + esc(T('bylist')) + ': ' + d.by.map(function (b) { return esc(b.desc) + ' ' + qty(num(b.qty)); }).join(', ') : '') + '</span></div>' +
          '<div class="acts"><button type="button" class="btn sm" data-mfmk="' + d.id + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-mfdel="' + d.id + '">' + esc(A.T('del')) + '</button></div></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(B2('nomade')) + '</p>') + '</div>';
  }, wire);

  var RAWC = function () { return [['desc', B2('raw'), { list: 'mf-items' }], ['qty', A.T('qty'), { mode: 'decimal' }], ['unit', B2('unit'), { list: 'mf-units' }]]; };
  var BYC = function () { return [['desc', T('byitem'), { list: 'mf-items' }], ['qty', A.T('qty'), { mode: 'decimal' }], ['unit', B2('unit'), { list: 'mf-units' }], ['rate', T('byrate'), { mode: 'decimal' }]]; };
  function blank(c) { var o = {}; c.forEach(function (x) { o[x[0]] = ''; }); return o; }
  /* sets of lines in one form: { pre: [array, cols] }; add / remove buttons call back draw() */
  function multi(sets, draw) {
    $$('[data-mfadd]', form).forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-mfadd'), s = sets[p]; read(s[0], p, s[1]); s[0].push(blank(s[1])); draw(p); }); });
    form.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-mfrm]'); if (!b) return;
      var x = b.getAttribute('data-mfrm').split('|'), s = sets[x[0]]; read(s[0], x[0], s[1]); s[0].splice(+x[1], 1); if (!s[0].length) s[0].push(blank(s[1])); draw(x[0]);
    });
  }

  function bomForm(it, verName, isNew) {
    var r = it || {}, V = F.bomList(r), cur = isNew ? null : F.pickBom(r, today(), verName) || null;
    /* a new version starts as a copy of the one in use (usually one quantity changes) */
    var base0 = isNew ? F.pickBom(r, today()) : null;
    var b = cur ? JSON.parse(JSON.stringify(cur)) : base0 ? Object.assign(JSON.parse(JSON.stringify(base0)), { name: '', from: today() }) : { name: '', from: isNew ? today() : '', per: 1, lines: [], by: [] };
    var L = b.lines.length ? b.lines : [blank(RAWC())], Y = (b.by || []).length ? b.by : [blank(BYC())];
    var sets = { 'bl-': [L, RAWC()], 'by-': [Y, BYC()] };
    function draw(p) { (p ? [p] : Object.keys(sets)).forEach(function (k) { $('[data-ls="' + k + '"]', form).innerHTML = lines(sets[k][0], k, sets[k][1]); }); }
    open(B2('bomt'), '<div class="fg">' + fld('bm-item', B2('fin'), inp('bm-item', r.desc || '', { req: 1, list: 'mf-items' }), { wide: 1 }) +
      fld('bm-ver', T('vname'), inp('bm-ver', b.name || '', {}), { hint: T('vnameh') }) + fld('bm-from', T('vfrom'), inp('bm-from', b.from || '', { type: 'date' }), { hint: T('vfromh') }) +
      fld('bm-per', B2('per'), inp('bm-per', b.per || 1, { mode: 'decimal' }), { hint: B2('perh') }) + '</div>' +
      '<fieldset><legend>' + esc(B2('rawlist')) + '</legend><p class="soft">' + esc(T('subh')) + '</p><div data-ls="bl-"></div><button type="button" class="btn sm" data-mfadd="bl-">' + esc(A.T('addline')) + '</button></fieldset>' +
      '<fieldset><legend>' + esc(T('bylist')) + '</legend><p class="soft">' + esc(T('byh')) + '</p><div data-ls="by-"></div><button type="button" class="btn sm" data-mfadd="by-">' + esc(A.T('addline')) + '</button></fieldset>' +
      (cur && V.length > 1 ? '<p><button type="button" class="btn sm" data-vdel>' + esc(T('vdel')) + '</button></p>' : '') + dl('mf-items', itemNames()) + unitList('mf-units'),
    function () {
      read(L, 'bl-', RAWC()); read(Y, 'by-', BYC());
      var nm = val('bm-item'), lines2 = L.filter(function (l) { return l.desc && num(l.qty) > 0; }).map(function (l) { return { desc: l.desc, qty: num(l.qty), unit: l.unit }; });
      var by = Y.filter(function (l) { return l.desc && num(l.qty) > 0; }).map(function (l) { return { desc: l.desc, qty: num(l.qty), unit: l.unit, rate: num(l.rate) }; });
      if (!need(nm, B2('fin')) || !need(lines2.length, B2('rawlist'))) return;
      if (lines2.some(function (l) { return key(l.desc) === key(nm); })) { NS.toast(B2('selfbom'), 'bad'); return; }
      var lp = F.bomLoop(items(), nm, lines2); if (lp) { NS.toast(T('loop', { l: lp.join(' → ') }), 'bad'); return; }
      var hit = item(nm), vn = val('bm-ver'), was = cur ? cur.name || '' : null;
      if (hit && F.bomList(hit).some(function (x) { return key(x.name) === key(vn) && (was == null || key(x.name) !== key(was)); })) { NS.toast(T('vdup', { n: vn || T('v1') }), 'bad'); return; }
      var base = hit && key(hit.desc) === key(r.desc || nm) ? hit : (hit || { desc: nm, kind: 'goods', unit: 'Nos', rate: '', gst: 18 });
      var rec = F.saveVersion(base, { name: vn, from: val('bm-from'), per: num(val('bm-per')) || 1, lines: lines2, by: by }, hit === it ? was : null, today());
      var jobs = [NSStore.put('item', rec)];
      lines2.concat(by).forEach(function (l) { if (!item(l.desc)) jobs.push(NSStore.put('item', { desc: l.desc, kind: 'goods', unit: l.unit || 'Nos', rate: '', gst: 18 })); });
      Promise.all(jobs).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      draw(); multi(sets, draw);
      /* a picked raw material or by-product brings its unit (and a by-product its value) from the item list (round C) */
      form.addEventListener('change', function (e) {
        var m = /^(bl|by)-desc-(\d+)$/.exec(e.target.id || ''), x = m && item(e.target.value); if (!x) return;
        var u = $('#' + m[1] + '-unit-' + m[2], form); if (u && !u.value) u.value = x.unit || '';
        var rt = m[1] === 'by' && $('#by-rate-' + m[2], form); if (rt && !num(rt.value)) rt.value = num(x.rate) || num(x.prate) || '';
      });
      /* typing in "One batch makes" replaces the 1 shown there (round C: typing 10 gave 110) */
      var pe = $('#bm-per', form); if (pe) { pe.addEventListener('focus', function () { setTimeout(function () { pe.select(); }, 0); }); pe.addEventListener('mouseup', function (e) { e.preventDefault(); }, { once: true }); }
      var vd = $('[data-vdel]', form);
      if (vd) vd.addEventListener('click', function () { if (!confirm(T('vdelq', { n: cur.name || T('v1') }))) return; NSStore.put('item', F.dropVersion(r, cur.name, today())).then(function () { dlg.close(); A.show(); }); });
    });
  }

  function makeForm(rec, itemName, verName) {
    var r = rec ? JSON.parse(JSON.stringify(rec)) : { date: today(), gd: '', out: { desc: itemName || '', qty: '', batch: '', exp: '' }, lines: [], extra: '', ver: verName || '', subs: [], by: [] };
    var L = r.lines.length ? r.lines : [blank(RAWC())], Y = (r.by || []).length ? r.by : [blank(BYC())], made = {};
    (r.subs || []).forEach(function (s) { made[key(s.desc)] = true; });
    var sets = { 'ml-': [L, RAWC()], 'mb-': [Y, BYC()] }, subs = [], useK = null;
    function others() { return A.data().doc.filter(function (d) { return !rec || d.id !== rec.id; }); }
    function verOpts() { var x = item(val('mk-item')), V = F.bomList(x); return V.map(function (v) { return [v.name || '', (v.name || T('v1')) + (v.from ? ' · ' + T('inuse', { d: A.ldate(v.from) }) : '')]; }); }
    function draw(p) { (p ? [p] : Object.keys(sets)).forEach(function (k) { $('[data-ls="' + k + '"]', form).innerHTML = lines(sets[k][0], k, sets[k][1]); }); cost(); }
    function drawVers(keep) {
      var o = verOpts(), s = $('#mk-ver', form), w = s.closest('.f');
      w.hidden = o.length < 2;
      var cur = keep != null ? keep : (F.pickBom(item(val('mk-item')), val('mk-date') || today()) || {}).name || '';
      s.innerHTML = o.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (key(x[0]) === key(cur) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('');
    }
    /* explode the chosen version: sub-parts to make here are ticked; raw lines and by-products refilled */
    function explode(first) {
      var nm = val('mk-item'), q = num(val('mk-qty')), x = item(nm); if (!x || !q || !F.bomList(x).length) { subs = []; drawSubs(); return; }
      var date = val('mk-date') || today(), H = S.inHand(others(), items(), A.bizName(), date, val('mk-gd') || S.MAIN);
      if (useK == null) {
        useK = {};
        var all = F.explode(items(), nm, q, date, { ver: verOf(nm) });
        if (!all.ok) { NS.toast(all.err === 'loop' ? T('loop', { l: all.loop.join(' → ') }) : B2('nobom'), 'bad'); return; }
        all.subs.forEach(function (s) { if (rec ? !made[key(s.desc)] : (H[key(s.desc)] || 0) >= s.qty) useK[key(s.desc)] = true; });
      }
      var E = F.explode(items(), nm, q, date, { use: useK, ver: verOf(nm) });
      if (!E.ok) { NS.toast(E.err === 'loop' ? T('loop', { l: E.loop.join(' → ') }) : B2('nobom'), 'bad'); return; }
      /* sub-parts list: every sub-part (a part with its own BOM) whose parents are all made here, from the full tree */
      var full = F.explode(items(), nm, q, date, { ver: verOf(nm) }); subs = [];
      (function walk(n) { (n.kids || []).forEach(function (k) { if (!k.kids.length) return; var mk = !useK[key(k.desc)]; subs.push({ desc: k.desc, qty: k.qty, unit: k.unit, level: k.level, make: mk, have: H[key(k.desc)] || 0 }); if (mk) walk(k); }); })(full.tree);
      if (!(first && rec)) {
        L.length = 0; E.raw.forEach(function (l) { L.push({ desc: l.desc, qty: String(l.qty), unit: l.unit }); }); if (!L.length) L.push(blank(RAWC()));
        var b = F.pickBom(x, date, val('mk-ver')), per = num(b && b.per) || 1;
        Y.length = 0; (b && b.by || []).forEach(function (l) { Y.push({ desc: l.desc, qty: String(F.r3(num(l.qty) * q / per)), unit: l.unit || '', rate: l.rate === '' || l.rate == null ? '' : String(l.rate) }); }); if (!Y.length) Y.push(blank(BYC()));
        draw();
      }
      drawSubs();
    }
    function verOf(nm) { var o = {}; o[key(nm)] = val('mk-ver'); return o; }
    function drawSubs() {
      var box = $('[data-subs]', form); box.hidden = !subs.length;
      $('[data-subl]', form).innerHTML = subs.map(function (s, i) {
        return '<label class="chk mf-sub" style="--lv:' + (s.level - 1) + '"><input type="checkbox" data-sub="' + i + '"' + (s.make ? ' checked' : '') + '> ' + esc(T('makehere', { n: s.desc, q: qty(s.qty) + (s.unit ? ' ' + s.unit : '') })) + ' <small class="soft">' + esc(B2('inhand', { n: qty(s.have) })) + '</small></label>';
      }).join('');
      $$('[data-sub]', form).forEach(function (c) { c.addEventListener('change', function () { var s = subs[+c.getAttribute('data-sub')]; if (c.checked) delete useK[key(s.desc)]; else useK[key(s.desc)] = true; read(L, 'ml-', RAWC()); explode(); }); });
    }
    function cost() {
      read(L, 'ml-', RAWC()); read(Y, 'mb-', BYC());
      var date = val('mk-date') || today(), base = L.filter(function (l) { return l.desc; }).map(function (l) { return F.toBase(item(l.desc), l); });
      var c = S.makeCost(others(), items(), A.bizName(), base, date), q = num(val('mk-qty'));
      var H = S.inHand(others(), items(), A.bizName(), date, val('mk-gd') || S.MAIN);
      var short = base.filter(function (l) { return num(l.qty) > (H[key(l.desc)] || 0) + 0.0005; }).map(function (l) { return l.desc; });
      var t = F.makeTotals(c.total, val('mk-extra'), Y.filter(function (b) { return b.desc; }), q);
      $('[data-mcost]', form).innerHTML = esc(T('cost', { r: money(t.raw), e: money(t.extra), b: money(t.by), t: money(t.total) })) + (q ? ' · <b>' + esc(B2('costpu', { a: money(t.per) })) + '</b>' : '') +
        (t.tooBig ? '<br><span class="bad">' + esc(T('bybig')) + '</span>' : '') + (short.length ? '<br><span class="bad">' + esc(B2('short', { l: short.join(', ') })) + '</span>' : '');
      return { t: t, short: short };
    }
    open(B2(rec ? 'editmake' : 'newmake'), '<div class="fg">' + fld('mk-date', A.T('date'), inp('mk-date', r.date, { type: 'date', req: 1 })) + fld('mk-no', B2('no'), inp('mk-no', r.no || nextNo('make', 'PRD', r.date), { mode: 'text' })) +
      fld('mk-item', B2('fin'), inp('mk-item', r.out.desc, { req: 1, list: 'mf-items' })) + fld('mk-ver', T('ver'), '<select id="mk-ver"></select>') + fld('mk-qty', B2('mkqty'), inp('mk-qty', r.out.qty, { mode: 'decimal', req: 1 })) +
      fld('mk-gd', B2('gd1'), sel('mk-gd', r.gd || '', gdOpts())) + fld('mk-extra', B2('extra'), inp('mk-extra', r.extra || '', { mode: 'decimal' }), { hint: B2('extrah') }) +
      fld('mk-batch', B2('batch'), inp('mk-batch', r.out.batch || '', { mode: 'text' })) + fld('mk-exp', B2('expm'), inp('mk-exp', r.out.exp || '', { type: 'month' })) + '</div>' +
      '<fieldset data-subs hidden><legend>' + esc(T('subs')) + '</legend><p class="soft">' + esc(T('subsh')) + '</p><div data-subl></div></fieldset>' +
      '<fieldset><legend>' + esc(B2('rawused')) + '</legend><div data-ls="ml-"></div><button type="button" class="btn sm" data-mfadd="ml-">' + esc(A.T('addline')) + '</button></fieldset>' +
      '<fieldset><legend>' + esc(T('bylist')) + '</legend><p class="soft">' + esc(T('byh2')) + '</p><div data-ls="mb-"></div><button type="button" class="btn sm" data-mfadd="mb-">' + esc(A.T('addline')) + '</button><p class="soft" data-mcost aria-live="polite"></p></fieldset>' +
      dl('mf-items', itemNames()) + unitList('mf-units'),
    function () {
      var date = val('mk-date'), nm = val('mk-item'), q = num(val('mk-qty')), raw = L.filter(function (l) { return l.desc && num(l.qty) > 0; });
      if (!need(date, A.T('date')) || !need(nm, B2('fin')) || !need(q > 0, B2('mkqty')) || !need(raw.length, B2('rawused')) || !lockOk(date, rec)) return;
      var c = cost(); if (c.t.tooBig) { NS.toast(T('bybig'), 'bad'); return; }
      if (c.short.length && !confirm(B2('shortq', { l: c.short.join(', ') }))) return;
      var mm = item(nm), by = Y.filter(function (b) { return b.desc && num(b.qty) > 0; });
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'make', app: 1 }, { date: date, no: val('mk-no'), gd: val('mk-gd'), extra: r2(num(val('mk-extra'))), seller: sellerCopy(), ver: val('mk-ver') || '',
        out: { desc: nm, qty: q, unit: mm && mm.unit || '', rate: c.t.per, batch: val('mk-batch'), exp: val('mk-exp') }, lines: raw.map(function (l) { return { desc: l.desc, qty: num(l.qty), unit: l.unit }; }),
        subs: subs.filter(function (s) { return s.make; }).map(function (s) { return { desc: s.desc, qty: s.qty, unit: s.unit }; }), by: by.map(function (b) { return { desc: b.desc, qty: num(b.qty), unit: b.unit, rate: num(b.rate) }; }) });
      if (!d.subs.length) delete d.subs; if (!d.by.length) delete d.by; if (!d.ver) delete d.ver;
      var jobs = [];
      [nm].concat(by.map(function (b) { return b.desc; })).forEach(function (n) { if (!item(n)) jobs.push(NSStore.put('item', { desc: n, kind: 'goods', unit: 'Nos', rate: '', gst: 18 })); });
      Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      drawVers(r.ver || null); draw(); multi(sets, draw);
      $('#mk-item', form).addEventListener('change', function () { useK = null; drawVers(); explode(); });
      $('#mk-ver', form).addEventListener('change', function () { useK = null; explode(); });
      $('#mk-qty', form).addEventListener('change', function () { explode(); });
      form.addEventListener('input', function (e) { if (/^ml-qty|^mb-|mk-extra|mk-qty/.test(e.target.id)) cost(); });
      form.addEventListener('change', function (e) { if (/^ml-desc|^ml-unit|mk-date|mk-gd/.test(e.target.id)) cost(); });
      if (!rec && itemName) { var b = F.pickBom(item(itemName), today(), verName); $('#mk-qty', form).value = num(b && b.per) || 1; if (verName != null) drawVers(verName); }
      if (r.out.desc) explode(true);
    });
  }

  /* ---------- job work ---------- */
  var fyJ = '', halfJ = null;
  function aatoBig() { if (halfJ != null) return halfJ; var v = ''; try { v = localStorage.getItem('ns-aato') || ''; } catch (e) {} return v === '5to10' || v === '10p'; }
  A.addSection('b2job', function () {
    var P = F.pending(A.data().doc, A.bizName(), today()), over = P.filter(function (p) { return p.over; }), soon = P.filter(function (p) { return p.soon; });
    var valAt = r2(P.reduce(function (s, p) { var l = (p.d.lines || []).filter(function (x) { return key(x.desc) === key(p.desc); })[0]; return s + p.left * num(l && l.rate); }, 0));
    var recent = A.mine().filter(function (d) { return d.type === 'stk' && (d.kind === 'jobout' || d.kind === 'jobin'); }).filter(A.match).sort(A.byDate).slice(0, 40);
    var cur = X04();
    return '<div class="pane-hd"><h2>' + esc(NS.t('app.b2job')) + '</h2><div class="quick"><button type="button" class="btn primary" data-mf="jout">+ ' + esc(T('newout')) + '</button><button type="button" class="btn" data-mf="jin">+ ' + esc(T('newin')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('jobh')) + '</p>' +
      '<div class="tiles"><div class="tile"><span>' + esc(T('tl_left')) + '</span><b>' + P.length + '</b></div><div class="tile"><span>' + esc(T('tl_val')) + '</span><b>' + money(valAt) + '</b></div>' +
        '<div class="tile' + (over.length ? ' neg' : '') + '"><span>' + esc(T('tl_over')) + '</span><b>' + over.length + '</b></div></div>' +
      (over.length ? '<p class="mf-warn bad">' + esc(T('overmsg', { n: over.length })) + '</p>' : '') + (soon.length ? '<p class="mf-warn">' + esc(T('soonmsg', { n: soon.length })) + '</p>' : '') +
      '<div class="card"><h3>' + esc(T('pend')) + '</h3>' + (P.length ? '<div class="quick no-print"><button type="button" class="btn sm" data-mfprint>' + esc(A.T('print')) + '</button><button type="button" class="btn sm" data-mfxl="pend">' + esc(T('xl')) + '</button></div>' +
        '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet wide" data-sheet>' + head('Goods with job workers', 'As on ' + A.ldate(today())) + '<div class="tbl-wrap"><table class="tbl eb"><thead><tr><th>Sent on</th><th>Challan</th><th>Job worker</th><th>Item</th><th>Type</th><th class="n">Sent</th><th class="n">Back</th><th class="n">Lost / scrap</th><th class="n">With worker</th><th class="n">Days out</th><th>Back by</th></tr></thead><tbody>' +
        P.map(function (p) { return '<tr' + (p.over ? ' class="neg"' : '') + '><td>' + A.ldate(p.d.date) + '</td><td>' + esc(p.d.dc || p.d.no || '') + '</td><td>' + esc(p.d.worker && p.d.worker.name || '') + '</td><td>' + esc(p.desc) + '</td><td>' + (p.cap ? 'Capital goods' : 'Inputs') + '</td><td class="n">' + qty(p.sent) + ' ' + esc(p.unit) + '</td><td class="n">' + qty(p.back) + '</td><td class="n">' + qty(p.lost) + '</td><td class="n"><b>' + qty(p.left) + '</b></td><td class="n">' + p.days + '</td><td>' + A.ldate(p.due) + (p.over ? ' <b>(late)</b>' : p.soon ? ' (soon)' : '') + '</td></tr>'; }).join('') +
        '</tbody></table></div>' + foot() + '</div></div>' : '<p class="soft">' + esc(T('nopend')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('recent')) + '</h3>' + (recent.length ? '<ul class="rows">' + recent.map(function (d) {
        var o = d.kind === 'jobin' ? byId(d.ref) || {} : d, w = (d.worker || o.worker || {}).name || '';
        return '<li><div class="ln"><b>' + esc(T(d.kind === 'jobout' ? 'out1' : 'in1')) + ' ' + esc(d.no || '') + '</b> <span class="soft">' + A.ldate(d.date) + ' · ' + esc(w) + (d.kind === 'jobin' && o.no ? ' · ' + esc(T('against', { n: o.dc || o.no })) : d.dc ? ' · ' + esc(d.dc) : '') + '</span>' +
          '<span class="soft">' + (d.lines || []).map(function (l) { return esc(l.desc) + ' ' + qty(num(d.kind === 'jobin' ? l.back : l.qty)) + (num(l.lost) ? ' (−' + qty(num(l.lost)) + ')' : ''); }).join(', ') + (d.out && d.out.desc ? ' → ' + esc(d.out.desc) + ' ' + qty(num(d.out.qty)) : '') + '</span></div>' +
          '<div class="acts"><button type="button" class="btn sm" data-mfjob="' + d.id + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-mfdel="' + d.id + '">' + esc(A.T('del')) + '</button></div></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('norecent')) + '</p>') + '</div>' +
      '<div class="card mf-itc"><h3>' + esc(T('itc')) + '</h3><p class="soft">' + esc(T('itch')) + '</p>' +
        '<div class="tools-row"><label>' + esc(B2('fy')) + ' <select data-mffy>' + cur.fys.map(function (f) { return '<option' + (f === cur.fy ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></label>' +
        '<label class="chk"><input type="checkbox" data-mfhalf' + (cur.half ? ' checked' : '') + '> ' + esc(T('half')) + '</label>' +
        '<label>' + esc(T('period')) + ' <select data-mfper>' + cur.P.map(function (p) { return '<option value="' + p.id + '"' + (p.id === cur.p.id ? ' selected' : '') + '>' + esc(T('p_' + p.id)) + '</option>'; }).join('') + '</select></label></div>' +
        '<p class="soft">' + esc(T('due', { d: A.ldate(cur.p.due) })) + '</p><div class="quick no-print"><button type="button" class="btn sm" data-mfxl="itc">' + esc(T('xl')) + '</button></div>' +
        '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet wide">' + head('ITC-04: goods sent to and received from job workers', A.ldate(cur.p.from) + ' to ' + A.ldate(cur.p.to)) +
        '<h4>Table 4: goods sent to job workers</h4><div class="tbl-wrap"><table class="tbl eb"><thead><tr>' + H4.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          (cur.R.sent.map(function (x) { return '<tr>' + row4(x).map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + H4.length + '" class="soft">Nothing sent in this period.</td></tr>') + '</tbody></table></div>' +
        '<h4>Table 5A: goods received back from job workers</h4><div class="tbl-wrap"><table class="tbl eb"><thead><tr>' + H5.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          (cur.R.back.map(function (x) { return '<tr>' + row5(x).map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + H5.length + '" class="soft">Nothing received back in this period.</td></tr>') + '</tbody></table></div>' + foot() + '</div></div></div>';
  }, wire);
  var H4 = ['GSTIN of job worker', 'State (if no GSTIN)', 'Job worker', 'Challan no.', 'Challan date', 'Type of goods', 'Description', 'UQC', 'Quantity', 'Taxable value', 'IGST %', 'CGST %', 'SGST/UTGST %', 'Cess'];
  var H5 = ['GSTIN of job worker', 'State (if no GSTIN)', 'Job worker', "Job worker's challan no.", "Job worker's challan date", 'Description', 'UQC', 'Quantity', 'Original challan no.', 'Original challan date', 'Nature of job work', 'Losses and wastes UQC', 'Losses and wastes quantity'];
  function row4(x) { return [x.gstin, x.gstin ? '' : NS.stateName && NS.stateName(x.state) || x.state, x.name, x.dc, A.ldate(x.date), x.type, x.desc, x.uqc, x.qty, x.value, x.igst, x.cgst, x.sgst, x.cess]; }
  function row5(x) { return [x.gstin, x.gstin ? '' : NS.stateName && NS.stateName(x.state) || x.state, x.name, x.wdc, A.ldate(x.date), x.desc, x.uqc, x.qty, x.odc, x.odate ? A.ldate(x.odate) : '', x.nature, x.lossUqc, x.loss]; }
  var perJ = '';
  function X04() {
    var cur = NS.fy(today()), fys = [], y = +cur.slice(0, 4);
    A.mine().forEach(function (d) { if (d.kind === 'jobout' || d.kind === 'jobin') { var f = NS.fy(d.date); if (fys.indexOf(f) < 0) fys.push(f); } });
    for (var i = 0; i < 2; i++) { var f2 = (y - i) + '-' + String((y - i + 1) % 100).padStart(2, '0'); if (fys.indexOf(f2) < 0) fys.push(f2); }
    fys.sort().reverse(); if (!fyJ || fys.indexOf(fyJ) < 0) fyJ = cur;
    var half = aatoBig(), P = F.periods(fyJ, half), p = P.filter(function (x) { return x.id === perJ; })[0] || P.filter(function (x) { return x.from <= today() && today() <= x.to; })[0] || P[0];
    return { fys: fys, fy: fyJ, half: half, P: P, p: p, R: F.itc04(A.data().doc, A.bizName(), p.from, p.to) };
  }

  function challans() { return A.mine().filter(function (d) { return d.type === 'challan' && d.kind === 'job'; }).sort(A.byDate); }
  var OUTC = function () { return [['desc', A.T('item'), { list: 'mf-items' }], ['qty', A.T('qty'), { mode: 'decimal' }], ['unit', B2('unit'), { list: 'mf-units' }], ['rate', T('value'), { mode: 'decimal' }], ['gst', T('gstp'), { mode: 'decimal' }], ['cap', T('cap')]]; };
  function outForm(rec) {
    var r = rec ? JSON.parse(JSON.stringify(rec)) : { date: today(), gd: '', worker: { name: '', gstin: '' }, dc: '', lines: [] };
    var L = r.lines.length ? r.lines.map(function (l) { return Object.assign({}, l, { cap: !!l.cap }); }) : [blank(OUTC())], sets = { 'jo-': [L, OUTC()] };
    function draw(p) { $('[data-ls="jo-"]', form).innerHTML = lines(L, 'jo-', OUTC()); }
    function readAll() { read(L, 'jo-', OUTC()); }
    var C = challans();
    open(T(rec ? 'editout' : 'newout'), '<div class="fg">' + fld('jo-date', A.T('date'), inp('jo-date', r.date, { type: 'date', req: 1 })) + fld('jo-no', B2('no'), inp('jo-no', r.no || nextNo('jobout', 'JWO', r.date), { mode: 'text' })) +
      (C.length ? fld('jo-pick', T('dcpick'), sel('jo-pick', r.dcid || '', [['', '—']].concat(C.map(function (d) { return [d.id, (d.no || '') + ' · ' + A.ldate(d.date) + ' · ' + (d.buyer && d.buyer.name || '')]; }))), { wide: 1, hint: T('dcpickh') }) : '') +
      fld('jo-w', T('worker'), inp('jo-w', r.worker.name, { req: 1, list: 'mf-parties' })) + fld('jo-wg', T('wgstin'), inp('jo-wg', r.worker.gstin || '', { mode: 'text' })) +
      fld('jo-dc', T('dc'), inp('jo-dc', r.dc || '', { mode: 'text' }), { hint: T('dch') }) + fld('jo-gd', T('sentfrom'), sel('jo-gd', r.gd || '', gdOpts())) + '</div>' +
      '<p class="soft"><a href="' + esc(A.toolUrl ? A.toolUrl('challan') : 'https://challan.niveshsahayak.in/') + '" data-mfdc>' + esc(T('dcmake')) + '</a></p>' +
      '<fieldset><legend>' + esc(T('goods')) + '</legend><p class="soft">' + esc(T('caph')) + '</p><div data-ls="jo-"></div><button type="button" class="btn sm" data-mfadd="jo-">' + esc(A.T('addline')) + '</button></fieldset>' +
      dl('mf-items', itemNames()) + unitList('mf-units') + dl('mf-parties', A.data().party.map(function (p) { return p.name; })),
    function () {
      readAll();
      var date = val('jo-date'), w = val('jo-w'), ls = L.filter(function (l) { return l.desc && num(l.qty) > 0; });
      if (!need(date, A.T('date')) || !need(w, T('worker')) || !need(ls.length, T('goods')) || !lockOk(date, rec)) return;
      var g = val('jo-wg').toUpperCase().replace(/\s/g, ''); if (g && NS.gstinCheck && !NS.gstinCheck(g).ok) { NS.toast(NS.gstinCheck(g).msg, 'bad'); return; }
      var p = A.data().party.filter(function (x) { return key(x.name) === key(w); })[0] || {};
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'jobout', app: 1 }, { date: date, no: val('jo-no'), gd: val('jo-gd'), dc: val('jo-dc'), dcid: val('jo-pick') || '', seller: sellerCopy(),
        worker: { name: w, gstin: g || p.gstin || '', state: (g || p.gstin || '').slice(0, 2) || p.state || '' },
        lines: ls.map(function (l) { var o = { desc: l.desc, qty: num(l.qty), unit: l.unit, rate: num(l.rate), gst: num(l.gst) }; if (l.cap) o.cap = 1; return o; }) });
      NSStore.put('doc', d).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      draw(); multi(sets, draw);
      $('[data-mfdc]', form).addEventListener('click', function () { dlg.close(); });
      var pk = $('#jo-pick', form);
      if (pk) pk.addEventListener('change', function () {
        var c = byId(pk.value); if (!c) return;
        $('#jo-w', form).value = c.buyer && c.buyer.name || ''; $('#jo-wg', form).value = c.buyer && c.buyer.gstin || ''; $('#jo-dc', form).value = c.no || '';
        var date = val('jo-date') || today(), base = (c.items || []).filter(function (it) { return it.desc; }), cst = S.makeCost(A.data().doc, items(), A.bizName(), base.map(function (it) { return { desc: it.desc, qty: 1 }; }), date);
        L.length = 0; base.forEach(function (it, i) { L.push({ desc: it.desc, qty: String(it.qty || ''), unit: it.unit || '', rate: String(num(it.rate) || cst.lines[i].cost || ''), gst: String(it.gst == null ? '' : it.gst), cap: false }); });
        if (!L.length) L.push(blank(OUTC())); draw();
      });
      form.addEventListener('change', function (e) {   /* value per unit = average cost, when left empty */
        var mt = /^jo-desc-(\d+)$/.exec(e.target.id); if (!mt) return; readAll(); var l = L[+mt[1]], x = item(l.desc);
        if (x && !l.unit) l.unit = x.unit || ''; if (x && l.gst === '' && x.gst != null) l.gst = String(x.gst);
        if (!l.rate) { var c = S.makeCost(A.data().doc, items(), A.bizName(), [{ desc: l.desc, qty: 1 }], val('jo-date') || today()); if (c.lines[0].cost) l.rate = String(c.lines[0].cost); }
        draw();
      });
    });
  }

  var INC = function () { return [['desc', A.T('item'), { ro: 1 }], ['left', T('withw'), { ro: 1 }], ['back', T('back'), { mode: 'decimal' }], ['lost', T('lost'), { mode: 'decimal' }]]; };
  function inForm(rec, refId) {
    var r = rec ? JSON.parse(JSON.stringify(rec)) : { date: today(), gd: '', ref: refId || '', wdc: '', nature: '', lines: [], out: { desc: '', qty: '', unit: '', rate: '' }, charges: '' };
    var others = A.data().doc.filter(function (d) { return !rec || d.id !== rec.id; });
    var P = F.pending(others, A.bizName(), '', false), outs = {}; P.forEach(function (p) { outs[p.d.id] = p.d; });
    if (r.ref && byId(r.ref)) outs[r.ref] = byId(r.ref);
    var ids = Object.keys(outs).sort(function (a, b) { return outs[a].date.localeCompare(outs[b].date); });
    if (!ids.length) { NS.toast(T('nosent'), 'bad'); return; }
    if (!r.ref) r.ref = ids[ids.length - 1];
    var L = [];
    function fill() {
      var o = outs[val('ji-ref') || r.ref], left = {}; F.pending(others, A.bizName(), '', true).forEach(function (p) { if (p.d.id === o.id) left[key(p.desc)] = p.left; });
      var had = {}; L.forEach(function (l) { had[key(l.desc)] = l; }); (rec && key(rec.ref) === key(o.id) ? rec.lines : []).forEach(function (l) { had[key(l.desc)] = had[key(l.desc)] || l; });
      L = (o.lines || []).map(function (l) { var h = had[key(l.desc)] || {}; return { desc: l.desc, unit: l.unit || '', left: qty(left[key(l.desc)] || 0) + (l.unit ? ' ' + l.unit : ''), back: h.back == null ? '' : String(h.back), lost: h.lost == null ? '' : String(h.lost), rate: num(l.rate) }; });
      $('[data-ls="ri-"]', form).innerHTML = lines(L, 'ri-', INC()); calc();
    }
    function calc() {
      read(L, 'ri-', INC());
      var v = r2(L.reduce(function (s, l) { return s + num(l.back) * l.rate; }, 0)), ch = num(val('ji-ch')), q = num(val('ji-oq'));
      $('[data-jcost]', form).textContent = val('ji-od') && q ? T('proccost', { v: money(v), c: money(ch), a: money(r2((v + ch) / q)) }) : '';
      return { v: v, ch: ch, q: q };
    }
    open(T(rec ? 'editin' : 'newin'), '<div class="fg">' + fld('ji-ref', T('sentpick'), sel('ji-ref', r.ref, ids.map(function (id) { var o = outs[id]; return [id, (o.no || '') + (o.dc ? ' / ' + o.dc : '') + ' · ' + A.ldate(o.date) + ' · ' + (o.worker && o.worker.name || '')]; })), { wide: 1 }) +
      fld('ji-date', A.T('date'), inp('ji-date', r.date, { type: 'date', req: 1 })) + fld('ji-no', B2('no'), inp('ji-no', r.no || nextNo('jobin', 'JWR', r.date), { mode: 'text' })) +
      fld('ji-wdc', T('wdc'), inp('ji-wdc', r.wdc || '', { mode: 'text' })) + fld('ji-nat', T('nature'), inp('ji-nat', r.nature || '', {}), { hint: T('natureh') }) +
      fld('ji-gd', T('into'), sel('ji-gd', r.gd || '', gdOpts())) + '</div>' +
      '<fieldset><legend>' + esc(T('goods')) + '</legend><p class="soft">' + esc(T('backh')) + '</p><div data-ls="ri-"></div></fieldset>' +
      '<fieldset><legend>' + esc(T('proc')) + '</legend><p class="soft">' + esc(T('proch')) + '</p><div class="fg">' + fld('ji-od', A.T('item'), inp('ji-od', r.out && r.out.desc || '', { list: 'mf-items' })) +
        fld('ji-oq', A.T('qty'), inp('ji-oq', r.out && r.out.qty || '', { mode: 'decimal' })) + fld('ji-ou', B2('unit'), inp('ji-ou', r.out && r.out.unit || '', { list: 'mf-units' })) +
        fld('ji-ch', T('charges'), inp('ji-ch', r.charges || '', { mode: 'decimal' }), { hint: T('chargesh') }) + '</div><p class="soft" data-jcost aria-live="polite"></p></fieldset>' + dl('mf-items', itemNames()) + unitList('mf-units'),
    function () {
      var date = val('ji-date'), o = outs[val('ji-ref')]; if (!need(date, A.T('date')) || !lockOk(date, rec)) return;
      var c = calc(), ls = L.filter(function (l) { return num(l.back) > 0 || num(l.lost) > 0; });
      if (!need(ls.length, T('back'))) return;
      if (date < o.date) { NS.toast(T('early'), 'bad'); return; }
      var od = val('ji-od');
      if (od && !need(c.q > 0, A.T('qty'))) return;
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'jobin', app: 1 }, { date: date, no: val('ji-no'), ref: o.id, gd: val('ji-gd'), wdc: val('ji-wdc'), nature: val('ji-nat'), seller: sellerCopy(), worker: o.worker,
        lines: ls.map(function (l) { return { desc: l.desc, unit: l.unit, back: num(l.back), lost: num(l.lost) }; }) });
      if (od) { d.out = { desc: od, qty: c.q, unit: val('ji-ou') || (item(od) || {}).unit || '', rate: r2((c.v + c.ch) / c.q) }; d.charges = c.ch; } else { delete d.out; delete d.charges; }
      var jobs = []; if (od && !item(od)) jobs.push(NSStore.put('item', { desc: od, kind: 'goods', unit: d.out.unit || 'Nos', rate: '', gst: 18 }));
      Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      fill();
      $('#ji-ref', form).addEventListener('change', function () { L = []; fill(); });
      form.addEventListener('input', function (e) { if (/^ri-|ji-ch|ji-oq|ji-od/.test(e.target.id)) calc(); });
    });
  }

  /* ---------- Excel ---------- */
  function xl(what) {
    if (typeof NS.xlsx !== 'function') return;
    if (what === 'pend') {
      NS.xlsx('goods-with-job-workers-' + today() + '.xlsx', [{ name: 'With job workers', rows: [['Sent on', 'Challan', 'Job worker', 'GSTIN', 'Item', 'Type', 'Unit', 'Sent', 'Back', 'Lost / scrap', 'With worker', 'Days out', 'Back by', 'Late']].concat(
        F.pending(A.data().doc, A.bizName(), today()).map(function (p) { return [p.d.date, p.d.dc || p.d.no || '', p.d.worker && p.d.worker.name || '', p.d.worker && p.d.worker.gstin || '', p.desc, p.cap ? 'Capital goods' : 'Inputs', p.unit, p.sent, p.back, p.lost, p.left, p.days, p.due, p.over ? 'Yes' : '']; })) }]);
      return;
    }
    var c = X04();
    NS.xlsx('ITC-04-' + c.fy + '-' + c.p.id + '.xlsx', [{ name: 'Table 4 sent', rows: [H4].concat(c.R.sent.map(row4)) }, { name: 'Table 5A received', rows: [H5].concat(c.R.back.map(row5)) },
      { name: 'Read me', rows: [['Note'], ['Made by Nivesh Sahayak for ' + (biz().name || '') + ', period ' + c.p.from + ' to ' + c.p.to + ', due ' + c.p.due + '.'], ['Check the current ITC-04 format of the GST portal (offline tool) before filing; copy these rows into it.'],
        ['Tables 5B and 5C (goods sent on from one job worker to another, or supplied from the place of the job worker) are not made here.']] }]);
  }

  /* ---------- wiring ---------- */
  function wire(pane) {
    $$('[data-mf]', pane).forEach(function (b) { b.addEventListener('click', function () { ({ make: function () { makeForm(); }, bom: function () { bomForm(); }, jout: function () { outForm(); }, jin: function () { inForm(); } })[b.getAttribute('data-mf')](); }); });
    $$('[data-mfmake]', pane).forEach(function (b) { b.addEventListener('click', function () { makeForm(null, b.getAttribute('data-mfmake'), b.getAttribute('data-ver')); }); });
    $$('[data-mfbom]', pane).forEach(function (b) { b.addEventListener('click', function () { bomForm(items().filter(function (x) { return x.id === b.getAttribute('data-mfbom'); })[0], b.getAttribute('data-ver'), b.hasAttribute('data-new')); }); });
    $$('[data-mfmk]', pane).forEach(function (b) { b.addEventListener('click', function () { makeForm(byId(b.getAttribute('data-mfmk'))); }); });
    $$('[data-mfjob]', pane).forEach(function (b) { b.addEventListener('click', function () { var d = byId(b.getAttribute('data-mfjob')); if (d.kind === 'jobout') outForm(d); else inForm(d); }); });
    $$('[data-mfdel]', pane).forEach(function (b) { b.addEventListener('click', function () { del(b.getAttribute('data-mfdel')); }); });
    $$('[data-mfprint]', pane).forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    $$('[data-mfxl]', pane).forEach(function (b) { b.addEventListener('click', function () { xl(b.getAttribute('data-mfxl')); }); });
    var fy = $('[data-mffy]', pane); if (fy) fy.addEventListener('change', function () { fyJ = fy.value; perJ = ''; A.show(); });
    var hf = $('[data-mfhalf]', pane); if (hf) hf.addEventListener('change', function () { halfJ = hf.checked; perJ = ''; A.show(); });
    var pr = $('[data-mfper]', pane); if (pr) pr.addEventListener('change', function () { perJ = pr.value; A.show(); });
  }
  /* edit buttons in the app's own lists open these forms; production too (this file's form replaces more.js's) */
  var oldX = A.editX;
  A.editX = function (d) {
    if (d.type === 'stk' && d.kind === 'make') { makeForm(d); return true; }
    if (d.type === 'stk' && d.kind === 'jobout') { outForm(d); return true; }
    if (d.type === 'stk' && d.kind === 'jobin') { inForm(d); return true; }
    return oldX ? oldX(d) : false;
  };

  /* menu: Job work after Production */
  function menu() {
    var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs') || $('[data-sec="b2job"]', nav)) return;
    var a = NS.el('a', { href: '#b2job', 'data-sec': 'b2job' }, '<span>' + esc(NS.t('app.b2job')) + '</span>'), after = $('[data-sec="b2make"]', nav);
    if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
    a.addEventListener('click', function () { A.filt('all'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', menu); else menu();
  document.addEventListener('ns-lang', function () { var a = $('.hub-nav [data-sec="b2job"] span'); if (a) a.textContent = NS.t('app.b2job'); });
})();
