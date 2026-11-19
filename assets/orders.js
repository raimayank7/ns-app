/* NSBiz Orders (ERP round 2, r2-orders): the App's screens over ordercore.js (NSOrders).
   - I-12  Orders section (#ord, Alt+G OU): sales and purchase orders outstanding line by line (by order, party or item, overdue
           first), order book, Close short / Reopen, Make bill / challan / receipt note from an order (the open lines picked).
           Entry screens (sale bill, purchase bill, challan, sales order, receipt note, goods back / sent back): when the party has
           open orders, challans or receipt notes, a line says so and "Pick lines" lists them with what is still pending; the lines
           picked keep a link to their source line (it.src), so part deliveries and part bills are tracked.
   - I-4   Receipt note (GRN), goods back from a customer (rejection in) and goods sent back to a supplier (rejection out) are App
           voucher screens (vdocs.js VT grn / rejin / rejout, saved as { type:'stk', kind }); printed here. Unbilled receipt notes.
   - B-12  Challans out (sale / on approval) not billed yet, with days out: part bill, part goods back.
   - I-14  Additional cost on a purchase (a transport bill from another party): { type:'stk', kind:'lcost' } (stockcore.js spreads it).
   Words on these screens are English (owner rule 19 Nov: App screens English only): keys 'or.*' in i18n.js EN. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NSOrders || (A.door && A.door())) return;
  var O = window.NSOrders, $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2;
  function t(k, v) { return NS.t('or.' + k, v); }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function money(v) { return NS.money(v); }
  function qty(v) { return String(Math.round(num(v) * 1000) / 1000); }
  function today() { return NS.today(); }
  var SRC = { quote: 1, proforma: 1, so: 1, po: 1, challan: 1, grn: 1 };
  var EN = { quote: 'Quotation', estimate: 'Estimate', proforma: 'Proforma invoice', so: 'Sales order', po: 'Purchase order', challan: 'Delivery challan', approval: 'Challan on approval', grn: 'Receipt note', rejin: 'Goods back', rejout: 'Goods sent back', invoice: 'Sale bill', cashmemo: 'Cash memo', expinv: 'Export invoice', pharma: 'Pharmacy bill', jewel: 'Jewellery bill', garment: 'Garment bill', pbill: 'Purchase bill', self: 'Self invoice' };
  function nameOf(d) { var ty = d.type === 'stk' ? d.kind : d.type; return ty === 'quote' && d.kind === 'estimate' ? EN.estimate : ty === 'challan' && d.kind === 'approval' ? EN.approval : EN[ty] || ty; }

  /* ---------- 1. lines keep their links (lid, src), landed-cost tick and due date through every entry screen ---------- */
  var prevLC = A.lineCopy;
  A.lineCopy = function (L, it) {
    if (prevLC) it = prevLC(L, it) || it;
    ['lid', 'src', 'lc', 'due'].forEach(function (k) { if (L[k] != null && L[k] !== '') it[k] = typeof L[k] === 'object' ? JSON.parse(JSON.stringify(L[k])) : L[k]; });
    return it;
  };
  /* ---------- 2. hooks for vdocs.js: line ids on orders, printing of the stock vouchers ---------- */
  window.NSOrd = {
    built: function (d, ty) { if (SRC[ty]) O.ensureLids(d); },
    print: function (d, how) { printStk(d, how); return true; },
    makeFrom: function (id, what) { var E = T0().byId[id]; if (E) make(E, what); else NS.toast(t('nothing'), 'bad'); }
  };

  function T0() { return O.track(A.mine(), A.bizName(), { today: today() }); }

  /* ---------- 3. "pick lines" on the entry screens ---------- */
  function intoOf(F, form) {
    if (!F) return '';
    if (F.kind === 'sale') return 'sale';
    if (F.kind === 'pbill') return 'pbill';
    if (F.kind === 'vdoc' && F.vd) {
      if (F.vd.ty === 'challan') { var k = $('#f-kind', form); return !k || k.value === 'sale' || k.value === 'approval' ? 'dn' : ''; }
      return { so: 'so', grn: 'grn', rejin: 'rejin', rejout: 'rejout' }[F.vd.ty] || '';
    }
    return '';
  }
  var hintT = 0;
  function hint() {
    var h = A.vh(), F = h.cur(), form = h.form(); if (!form || !F) return;
    var box = $('[data-orhint]', form), into = intoOf(F, form), party = ($('#f-party', form) || {}).value || '';
    var H = into && O.hint(A.mine(), A.bizName(), party, into, { skip: F.rec && F.rec.id, today: today() });
    if (!H) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('p'); box.className = 'note or-hint'; box.setAttribute('data-orhint', ''); box.setAttribute('role', 'status');
      var fs = $('[data-lines]', form); fs = fs && fs.closest('fieldset');
      if (fs) fs.parentNode.insertBefore(box, fs); else form.insertBefore(box, form.firstChild);
    }
    var docs = H.list.map(function (e) { return nameOf(e.d) + ' ' + (e.d.no || ''); });
    box.innerHTML = '<span>' + esc(t('hint', { n: H.n, lines: H.lines, docs: docs.slice(0, 3).join(', ') + (docs.length > 3 ? ' …' : '') })) + '</span> <button type="button" class="btn sm" data-orpick>' + esc(t('pick')) + '</button>';
  }
  function soon() { clearTimeout(hintT); hintT = setTimeout(hint, 250); }
  /* I-14 per line: on a purchase bill, every line that is not goods (freight, cartage, loading, packing ...) gets a tick
     "add to the goods' cost"; it.lc true / false (stockcore.js); untouched lines follow the name rule (NSStock.LC_WORDS) */
  var lcT = 0;
  function isGoods(L) {
    var m = A.data().item.filter(function (x) { return key(x.desc) === key(L.desc); })[0];
    return !(m && m.kind === 'service' || /^99/.test(String(L.hsn || m && m.hsn || '').replace(/\D/g, '')));
  }
  function lcBox() {
    lcT = 0;
    var h = A.vh(), F = h.cur(), form = h.form(); if (!form || !F || F.kind !== 'pbill') return;
    var box = $('[data-orlc]', form), lines = (F.lines || []).map(function (L, i) { return { L: L, i: i }; }).filter(function (x) { return String(x.L.desc || '').trim() && !isGoods(x.L); });
    var W = window.NSStock && NSStock.LC_WORDS;
    if (!lines.length || (F.lines || []).filter(function (L) { return String(L.desc || '').trim() && isGoods(L); }).length === 0) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.className = 'or-lc'; box.setAttribute('data-orlc', ''); var fs = $('[data-lines]', form); fs = fs && fs.closest('fieldset'); if (fs) fs.parentNode.insertBefore(box, fs.nextSibling); else return; }
    var html = '<p class="soft">' + esc(t('lc_line')) + '</p>' + lines.map(function (x) {
      var on = x.L.lc === true || (x.L.lc !== false && !!(W && W.test(x.L.desc)));
      return '<label class="chk"><input type="checkbox" data-orlci="' + x.i + '"' + (on ? ' checked' : '') + '> ' + esc(x.L.desc) + '</label>';
    }).join(' ');
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
  }
  function lcSoon() { clearTimeout(lcT); lcT = setTimeout(lcBox, 300); }
  document.addEventListener('input', function (e) { if (e.target && e.target.closest && e.target.closest('#app-form') && !e.target.hasAttribute('data-orlci')) lcSoon(); });
  document.addEventListener('change', function (e) {
    if (!e.target || !e.target.hasAttribute || !e.target.hasAttribute('data-orlci')) return;
    var F = A.vh().cur(), L = F && F.lines && F.lines[+e.target.getAttribute('data-orlci')]; if (!L) return;
    L.lc = !!e.target.checked; var dl = e.target.closest('dialog'); if (dl) dl.setAttribute('data-dirty', '1');
  });
  document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#app-form [data-addline], #app-form [data-rm]')) lcSoon(); });
  document.addEventListener('input', function (e) { if (e.target && (e.target.id === 'f-party' || e.target.id === 'f-kind') && e.target.closest('#app-form')) soon(); });
  document.addEventListener('change', function (e) { if (e.target && (e.target.id === 'f-party' || e.target.id === 'f-kind') && e.target.closest('#app-form')) soon(); });
  document.addEventListener('focusin', function (e) {   /* a form just opened (openForm focuses its first box): check once per form */
    var f = e.target && e.target.closest && e.target.closest('#app-form form'); if (!f) return;
    var F = A.vh().cur(); if (!F || F._orSeen) return; F._orSeen = 1; soon(); lcSoon();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-orpick]'); if (!b) return;
    e.preventDefault();
    var h = A.vh(), F = h.cur(), form = h.form(), into = intoOf(F, form);
    var list = O.pickable(A.mine(), A.bizName(), ($('#f-party', form) || {}).value || '', into, { skip: F.rec && F.rec.id, today: today() });
    pickDlg(list, function (lines) {
      var used = {}; (F.lines || []).forEach(function (L) { if (L.src) used[L.src.id + '|' + L.src.lid] = 1; });
      F.lines = (F.lines || []).filter(function (L) { return String(L.desc || '').trim() || num(L.rate); });
      var added = 0;
      lines.forEach(function (it) { if (used[it.src.id + '|' + it.src.lid]) return; F.lines.push(it); added++; });
      if (!F.lines.length) F.lines.push({ desc: '', hsn: '', qty: 1, rate: '', gst: 18 });
      h.drawLines(); if (form.closest('dialog')) form.closest('dialog').setAttribute('data-dirty', '1');
      NS.toast(t('added', { n: added }));
      var box = $('[data-orhint]', form); if (box) box.remove();
    });
  });
  /* the list of open lines: tick the lines, change the quantity (part delivery / part bill) */
  function pickDlg(list, done) {
    var dlg = document.createElement('dialog'); dlg.className = 'or-pick b2-dlg';
    var body = list.map(function (e) {
      return '<section class="or-src"><h4>' + esc(nameOf(e.d)) + ' ' + esc(e.d.no || '') + ' <span class="soft">· ' + esc(A.ldate(e.d.date)) + (e.due ? ' · ' + esc(t('due', { d: A.ldate(e.due) })) : '') + '</span>' +
        ' <button type="button" class="btn sm" data-orall="' + esc(e.id) + '">' + esc(t('tickall')) + '</button></h4>' +
        '<table class="tbl or-tbl"><thead><tr><th></th><th>' + esc(t('c_item')) + '</th><th class="n">' + esc(t('c_ord')) + '</th><th class="n">' + esc(t('c_pend')) + '</th><th class="n">' + esc(t('c_take')) + '</th></tr></thead><tbody>' +
        e.lines.filter(function (L) { return L.pending > 0; }).map(function (L) {
          var id = e.id + '|' + L.lid;
          return '<tr><td><input type="checkbox" data-ork="' + esc(id) + '" aria-label="' + esc(L.name) + '"></td><td>' + esc(L.name) + (L.late ? ' <span class="pill bad">' + esc(t('late')) + '</span>' : '') + '</td><td class="n">' + qty(L.qty) + ' ' + esc(L.unit) + '</td><td class="n">' + qty(L.pending) + '</td>' +
            '<td class="n"><input data-orq="' + esc(id) + '" value="' + qty(L.pending) + '" inputmode="decimal" dir="ltr" size="6" autocomplete="off"></td></tr>';
        }).join('') + '</tbody></table></section>';
    }).join('');
    dlg.innerHTML = '<form method="dialog"><header class="dlg-hd"><h3>' + esc(t('pick_t')) + '</h3></header><p class="soft">' + esc(t('pick_h')) + '</p>' + (body || '<p class="soft">' + esc(t('none')) + '</p>') +
      '<div class="dlg-foot"><button type="submit" class="btn primary" value="ok">' + esc(t('addsel')) + '</button><button type="button" class="btn" data-orx>' + esc(A.T('cancel')) + '</button></div></form>';
    document.body.appendChild(dlg);
    var close = function () { dlg.close(); dlg.remove(); };
    dlg.addEventListener('input', function (e) { var q = e.target.getAttribute('data-orq'); if (q) { var c = $('[data-ork="' + q + '"]', dlg); if (c) c.checked = num(e.target.value) > 0; } });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-orx]')) close();
      var a = e.target.closest('[data-orall]'); if (a) { var sec = a.closest('.or-src'), boxes = $$('[data-ork]', sec), on = !boxes.every(function (c) { return c.checked; }); boxes.forEach(function (c) { c.checked = on; }); }
    });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
    $('form', dlg).addEventListener('submit', function (e) {
      e.preventDefault();
      var out = [];
      list.forEach(function (E) { E.lines.forEach(function (L) {
        var id = E.id + '|' + L.lid, c = $('[data-ork="' + id + '"]', dlg), q = $('[data-orq="' + id + '"]', dlg);
        if (c && c.checked && q && num(q.value) > 0) out.push(O.lineFrom(E, L, Math.min(num(q.value), L.pending)));
      }); });
      close(); if (out.length) done(out);
    });
    dlg.showModal();
    var first = $('[data-ork]', dlg); if (first) first.focus();
  }

  /* ---------- 4. make the next document from a source (all its open lines) ---------- */
  function openLines(e) { return e.lines.filter(function (L) { return L.pending > 0; }).map(function (L) { return O.lineFrom(e, L, L.pending); }); }
  function make(e, what) {
    var lines = openLines(e); if (!lines.length) { NS.toast(t('nothing'), 'bad'); return; }
    var b = e.d.buyer || {}, buyer = { name: b.name || '', gstin: b.gstin || '', state: b.state || '' };
    if (what === 'bill') A.openForm('sale', { draft: { date: today(), items: lines, buyer: buyer, round: e.d.round !== false } });
    else if (what === 'pbill') A.openForm('pbill', { draft: { date: today(), items: lines, buyer: buyer, round: e.d.round !== false } });
    else A.openForm('vdoc', { ty: what, from: e.d, lines: lines });
  }
  function closeDlg(e) {
    if (e.d.closed && !e.pending) {   /* closed already: open it again */
      NS.ask(t('reopenq', { no: e.d.no || '' })).then(function (ok) { if (ok) NSStore.put('doc', O.reopen(e.d)).then(function () { NS.toast(t('reopened')); A.show(); }); });
      return;
    }
    var L = e.lines.filter(function (x) { return x.pending > 0; });
    var dlg = document.createElement('dialog'); dlg.className = 'or-pick b2-dlg';
    dlg.innerHTML = '<form method="dialog"><header class="dlg-hd"><h3>' + esc(t('close_t', { doc: nameOf(e.d), no: e.d.no || '' })) + '</h3></header><p class="soft">' + esc(t('close_h')) + '</p>' +
      '<div class="fg"><label class="f" for="or-cdate"><span>' + esc(A.T('date')) + '</span><input type="date" id="or-cdate" value="' + today() + '" required></label></div>' +
      '<table class="tbl or-tbl"><thead><tr><th>' + esc(t('c_item')) + '</th><th class="n">' + esc(t('c_pend')) + '</th><th class="n">' + esc(t('c_close')) + '</th></tr></thead><tbody>' +
      L.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td class="n">' + qty(x.pending) + ' ' + esc(x.unit) + '</td><td class="n"><input data-orc="' + esc(x.lid) + '" value="' + qty(x.pending) + '" inputmode="decimal" dir="ltr" size="6"></td></tr>'; }).join('') +
      '</tbody></table><div class="dlg-foot"><button type="submit" class="btn primary">' + esc(t('close_do')) + '</button><button type="button" class="btn" data-orx>' + esc(A.T('cancel')) + '</button></div></form>';
    document.body.appendChild(dlg);
    var close = function () { dlg.close(); dlg.remove(); };
    dlg.addEventListener('click', function (ev) { if (ev.target.closest('[data-orx]')) close(); });
    $('form', dlg).addEventListener('submit', function (ev) {
      ev.preventDefault();
      var lines = L.map(function (x) { var i = $('[data-orc="' + x.lid + '"]', dlg); return { lid: x.lid, qty: Math.min(num(i && i.value), x.pending) }; }).filter(function (x) { return x.qty > 0; });
      var date = $('#or-cdate', dlg).value || today(); close();
      if (!lines.length) return;
      NSStore.put('doc', O.closeShort(e.d, date, lines)).then(function () { NS.toast(t('closed_ok')); A.show(); }, function (err) { NS.toast(NS.t('nosave', { e: err && err.message || '' }), 'bad'); });
    });
    dlg.showModal();
  }

  /* ---------- 5. the Orders section ---------- */
  var VIEWS = ['so', 'po', 'dn', 'grn', 'book', 'lc'];
  var dnKind = '';
  function pill(st) { var c = st === 'done' ? 'ok' : st === 'closed' ? '' : st === 'part' ? 'warn' : 'warn'; return '<span class="pill ' + c + '">' + esc(t('st_' + st)) + '</span>'; }
  function eye(id) { return '<button type="button" class="btn sm ib" data-view="' + esc(id) + '" title="' + esc(A.T('open')) + '" aria-label="' + esc(A.T('open')) + '">' + NS.icSvg('eye') + '</button>'; }
  function act(lbl, attrs, primary) { return '<button type="button" class="btn sm' + (primary ? ' primary' : '') + '" ' + attrs + '>' + esc(lbl) + '</button>'; }
  function tabs(view) {
    return '<div class="seg or-tabs" role="tablist">' + VIEWS.map(function (v) { return '<a class="btn sm" role="tab" href="#ord/' + v + '" aria-pressed="' + (v === view) + '" aria-selected="' + (v === view) + '">' + esc(t('v_' + v)) + '</a>'; }).join('') + '</div>';
  }
  function head(view) {
    /* a report screen, as in Tally: the entries (receipt note, goods back, additional cost) are under Transactions › Inventory Vouchers,
       sales and purchase orders under Other Documents (owner 19 Nov 2026) */
    return '<div class="pane-hd"><h2>' + esc(t('title')) + '</h2></div>' + tabs(view);
  }
  function outView(side, by, filt) {
    var TT = T0(), kinds = side === 'buy' ? ['po'] : ['so'];
    var rows = O.outstanding(A.mine(), A.bizName(), { side: side, kinds: kinds, today: today(), T: TT });
    if (filt) rows = rows.filter(function (r) { return filt.p ? r.pkey === filt.p : key(r.name) === filt.i; });
    var tot = rows.reduce(function (s, r) { return s + r.value; }, 0), late = rows.filter(function (r) { return r.late; }).length;
    var base = '#ord/' + (side === 'buy' ? 'po' : 'so');
    var bar = '<div class="lg-bar no-print"><div class="seg" role="group">' + [['', t('by_order')], ['party', t('by_party')], ['item', t('by_item')]].map(function (x) { return '<a class="btn sm" href="' + base + (x[0] ? '/' + x[0] : '') + '" aria-pressed="' + ((by || '') === x[0] && !filt) + '">' + esc(x[1]) + '</a>'; }).join('') + '</div>' +
      (filt ? ' <a class="btn sm" href="' + base + '">' + esc(t('all')) + '</a>' : '') + '<button type="button" class="btn sm" data-print>' + esc(A.T('print')) + '</button><button type="button" class="btn sm" data-orxl="' + side + '">' + esc(A.T('lg_xl')) + '</button></div>';
    var sumP = '<p class="soft">' + esc(t('out_sum', { n: rows.length, v: money(tot), l: late })) + '</p>';
    if (!rows.length) return bar + '<p class="note ok">' + esc(t(side === 'buy' ? 'none_po' : 'none_so')) + '</p>';
    if (by === 'party' || by === 'item') {
      var G = O.groupBy(rows, by);
      return bar + sumP + '<div class="tbl-wrap"><table class="tbl st lg-tbl"><thead><tr><th>' + esc(t(by === 'item' ? 'c_item' : 'c_party')) + '</th><th class="n">' + esc(t('c_lines')) + '</th>' + (by === 'item' ? '<th class="n">' + esc(t('c_pend')) + '</th>' : '') + '<th class="n">' + esc(t('c_value')) + '</th><th class="n">' + esc(t('c_late')) + '</th></tr></thead><tbody>' +
        G.map(function (g) { return '<tr><td><a href="' + base + '/' + (by === 'item' ? 'i' : 'p') + '/' + encodeURIComponent(g.id) + '">' + esc(g.name || '—') + '</a></td><td class="n">' + g.n + '</td>' + (by === 'item' ? '<td class="n">' + qty(g.pending) + ' ' + esc(g.unit) + '</td>' : '') + '<td class="n">' + money(g.value) + '</td><td class="n">' + (g.late || '') + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th>' + esc(t('total')) + '</th><th class="n">' + rows.length + '</th>' + (by === 'item' ? '<th></th>' : '') + '<th class="n">' + money(tot) + '</th><th class="n">' + (late || '') + '</th></tr></tfoot></table></div>';
    }
    var byOrd = {}, order = [];
    rows.forEach(function (r) { if (!byOrd[r.id]) { byOrd[r.id] = []; order.push(r.id); } byOrd[r.id].push(r); });
    order.sort(function (a, b) { var x = byOrd[a][0], y = byOrd[b][0]; return (byOrd[b].some(function (r) { return r.late; }) - byOrd[a].some(function (r) { return r.late; })) || String(x.due || '9999').localeCompare(String(y.due || '9999')) || x.date.localeCompare(y.date); });
    var moved = side === 'buy' ? t('c_recd') : t('c_deliv');
    return bar + sumP + '<div class="tbl-wrap"><table class="tbl st lg-tbl or-out"><thead><tr><th>' + esc(t('c_item')) + '</th><th class="n">' + esc(t('c_ord')) + '</th><th class="n">' + esc(moved) + '</th><th class="n">' + esc(t('c_billed')) + '</th><th class="n">' + esc(t('c_closed')) + '</th><th class="n">' + esc(t('c_pend')) + '</th><th class="n">' + esc(t('c_value')) + '</th><th>' + esc(t('c_due')) + '</th></tr></thead><tbody>' +
      order.map(function (id) {
        var R = byOrd[id], r0 = R[0];
        var acts = side === 'buy' ? act(t('mk_grn'), 'data-ormk="grn" data-id="' + esc(id) + '"', 1) + act(t('mk_pbill'), 'data-ormk="pbill" data-id="' + esc(id) + '"')
          : act(t('mk_bill'), 'data-ormk="bill" data-id="' + esc(id) + '"', 1) + act(t('mk_dn'), 'data-ormk="challan" data-id="' + esc(id) + '"');
        return '<tr class="or-head"><th colspan="8"><span class="or-h"><b>' + esc(nameOf({ type: r0.type }) + ' ' + r0.no) + '</b> · ' + esc(A.ldate(r0.date)) + ' · <a href="#st/' + encodeURIComponent(r0.pkey) + '">' + esc(r0.party || '—') + '</a> ' + pill(r0.state) + '</span> <span class="or-acts no-print">' + acts + act(t('close'), 'data-orclose="' + esc(id) + '"') + eye(id) + '</span></th></tr>' +
          R.map(function (r) {
            return '<tr' + (r.late ? ' class="os-late"' : '') + '><td>' + esc(r.name) + '</td><td class="n">' + qty(r.ordered) + ' ' + esc(r.unit) + '</td><td class="n">' + (r.done ? qty(r.done) : '') + '</td><td class="n">' + (r.billed ? qty(r.billed) : '') + '</td><td class="n">' + (r.closed ? qty(r.closed) : '') + '</td><td class="n"><b>' + qty(r.pending) + '</b></td><td class="n">' + money(r.value) + '</td><td>' + (r.due ? esc(A.ldate(r.due)) + (r.late ? ' <span class="pill bad">' + esc(t('late')) + '</span>' : '') : '') + '</td></tr>';
          }).join('');
      }).join('') + '</tbody><tfoot><tr><th colspan="6">' + esc(t('total')) + '</th><th class="n">' + money(tot) + '</th><th></th></tr></tfoot></table></div>';
  }
  function bookView() {
    var r = A.range(), TT = T0();
    var L = TT.list.filter(function (e) { return (e.d.type === 'so' || e.d.type === 'po') && (!r[0] || e.d.date >= r[0]) && (!r[1] || e.d.date <= r[1]); }).sort(function (a, b) { return String(b.d.date).localeCompare(String(a.d.date)); });
    if (!L.length) return '<p class="soft">' + esc(t('none')) + '</p>';
    var val = function (e) { return r2(e.lines.reduce(function (s, x) { return s + x.qty * x.rate; }, 0)); };
    return '<p class="soft">' + esc(t('book_h', { a: A.ldate(r[0]), b: A.ldate(r[1]) })) + '</p><div class="tbl-wrap"><table class="tbl st lg-tbl"><thead><tr><th>' + esc(t('c_doc')) + '</th><th>' + esc(A.T('date')) + '</th><th>' + esc(t('c_party')) + '</th><th class="n">' + esc(t('c_ordval')) + '</th><th class="n">' + esc(t('c_value')) + '</th><th>' + esc(t('c_state')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      L.map(function (e) { return '<tr><td>' + esc(nameOf(e.d) + ' ' + (e.d.no || '')) + '</td><td>' + esc(A.ldate(e.d.date)) + '</td><td>' + esc(e.party) + '</td><td class="n">' + money(val(e)) + '</td><td class="n">' + money(e.value) + '</td><td>' + pill(e.state) + '</td><td class="no-print">' + (e.pending > 0 || e.d.closed ? act(t('close'), 'data-orclose="' + esc(e.id) + '"') : '') + eye(e.id) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function unbilledView(side) {
    var U = O.unbilled(A.mine(), A.bizName(), side, { today: today(), kind: side === 'sale' ? dnKind : '' });
    var bar = side === 'sale' ? '<div class="lg-bar no-print"><div class="seg" role="group">' + [['', t('dn_all')], ['approval', t('dn_appr')], ['sale', t('dn_sale')]].map(function (x) { return '<button type="button" class="btn sm" data-ordnk="' + x[0] + '" aria-pressed="' + (dnKind === x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>' : '';
    var h = '<p class="soft">' + esc(t(side === 'sale' ? 'dn_h' : 'grn_h')) + '</p>';
    if (!U.length) return bar + h + '<p class="note ok">' + esc(t(side === 'sale' ? 'none_dn' : 'none_grn')) + '</p>';
    return bar + h + '<div class="tbl-wrap"><table class="tbl st lg-tbl"><thead><tr><th>' + esc(t('c_doc')) + '</th><th>' + esc(A.T('date')) + '</th><th>' + esc(t('c_party')) + '</th><th class="n">' + esc(t('c_pend')) + '</th><th class="n">' + esc(t('c_value')) + '</th><th class="n">' + esc(t('c_days')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      U.map(function (u) {
        var acts = side === 'sale' ? act(t('mk_bill'), 'data-ormk="bill" data-id="' + esc(u.id) + '"', 1) + act(t('mk_back'), 'data-ormk="rejin" data-id="' + esc(u.id) + '"')
          : act(t('mk_pbill'), 'data-ormk="pbill" data-id="' + esc(u.id) + '"', 1) + act(t('mk_sendback'), 'data-ormk="rejout" data-id="' + esc(u.id) + '"');
        return '<tr' + (u.days > 30 ? ' class="os-late"' : '') + '><td>' + esc(nameOf(u.e.d) + ' ' + u.no) + ' ' + pill(u.state) + '</td><td>' + esc(A.ldate(u.date)) + '</td><td><a href="#st/' + encodeURIComponent(u.pkey) + '">' + esc(u.party || '—') + '</a></td><td class="n">' + qty(u.pending) + '</td><td class="n">' + money(u.value) + '</td><td class="n">' + u.days + '</td><td class="no-print">' + acts + eye(u.id) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function lcView() {
    var L = A.mine().filter(function (d) { return d.type === 'stk' && d.kind === 'lcost'; }).sort(A.byDate);
    var bills = byId();
    return '<p class="soft">' + esc(t('lc_h')) + '</p>' + (L.length ? '<div class="tbl-wrap"><table class="tbl st lg-tbl"><thead><tr><th>' + esc(t('c_doc')) + '</th><th>' + esc(A.T('date')) + '</th><th>' + esc(t('lc_bill')) + '</th><th>' + esc(t('lc_to')) + '</th><th>' + esc(t('lc_by')) + '</th><th class="n">' + esc(t('c_value')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      L.map(function (d) { var b = bills[d.ref]; return '<tr><td>' + esc(d.no || '') + '</td><td>' + esc(A.ldate(d.date)) + '</td><td>' + (b ? esc((b.no || '') + ' · ' + (b.buyer && b.buyer.name || '')) : '<span class="pill bad">' + esc(t('lc_gone')) + '</span>') + '</td><td>' + esc(d.buyer && d.buyer.name || '') + '</td><td>' + esc(t(d.basis === 'qty' ? 'lc_qty' : 'lc_val')) + '</td><td class="n">' + money(num(d.amt)) + '</td><td class="no-print"><button type="button" class="btn sm ib" data-edit="' + esc(d.id) + '" title="' + esc(A.T('edit')) + '" aria-label="' + esc(A.T('edit')) + '">' + NS.icSvg('edit') + '</button><button type="button" class="btn sm ib danger" data-del="' + esc(d.id) + '" title="' + esc(A.T('del')) + '" aria-label="' + esc(A.T('del')) + '">' + NS.icSvg('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="soft">' + esc(t('none')) + '</p>');
  }
  function byId() { var o = {}; A.data().doc.forEach(function (d) { o[d.id] = d; }); return o; }
  function recent(kinds) {
    var L = A.mine().filter(function (d) { return d.type === 'stk' && kinds.indexOf(d.kind) >= 0 && (d.items || []).length; }).sort(A.byDate).slice(0, 15);
    return L.length ? '<h3>' + esc(t('recent')) + '</h3>' + A.rowsHtml(L, { noconv: 1 }) : '';
  }
  A.addSection('ord', function (arg) {
    var p = String(arg || '').split('/'), view = VIEWS.indexOf(p[0]) >= 0 ? p[0] : 'so', body;
    if (view === 'so' || view === 'po') {
      var filt = p[1] === 'p' ? { p: decodeURIComponent(p[2] || '') } : p[1] === 'i' ? { i: decodeURIComponent(p[2] || '') } : null;
      body = '<p class="soft">' + esc(t(view === 'po' ? 'po_h' : 'so_h')) + '</p>' + outView(view === 'po' ? 'buy' : 'sale', filt ? '' : p[1], filt);
    }
    else if (view === 'dn') body = unbilledView('sale') + recent(['rejin']);
    else if (view === 'grn') body = unbilledView('buy') + recent(['grn', 'rejout']);
    else if (view === 'book') body = bookView();
    else body = lcView();
    return head(view) + '<div data-sheet>' + body + '</div>';
  }, function (pane) { pane.addEventListener('click', onPane); });   /* one listener (the App draws into the same pane every time) */
  A.orAct = function (k) { if (k === 'lc') lcForm(); else A.openForm('vdoc', { ty: k }); };   /* the menu's Inventory Vouchers entries (desk.js) */
  function onPane(e) {
      var b = e.target.closest('button'); if (!b) return;
      var TT;
      if (b.hasAttribute('data-ormk')) { TT = T0(); var E = TT.byId[b.getAttribute('data-id')]; if (E) make(E, b.getAttribute('data-ormk')); }
      else if (b.hasAttribute('data-orclose')) { TT = T0(); var E2 = TT.byId[b.getAttribute('data-orclose')]; if (E2) closeDlg(E2); }
      else if (b.hasAttribute('data-ornew')) A.newDoc(b.getAttribute('data-ornew'));
      else if (b.hasAttribute('data-orform')) A.openForm('vdoc', { ty: b.getAttribute('data-orform') });
      else if (b.hasAttribute('data-orlc')) lcForm();
      else if (b.hasAttribute('data-ordnk')) { dnKind = b.getAttribute('data-ordnk'); A.show(); }
      else if (b.hasAttribute('data-orxl')) xl(b.getAttribute('data-orxl'));
  }
  function xl(side) {
    var rows = O.outstanding(A.mine(), A.bizName(), { side: side, kinds: side === 'buy' ? ['po'] : ['so'], today: today() });
    var out = [[(side === 'buy' ? 'Purchase' : 'Sales') + ' orders outstanding', 'As on ' + today()], ['Order', 'Date', 'Party', 'Item', 'Unit', 'Ordered', side === 'buy' ? 'Received' : 'Delivered', 'Billed', 'Closed short', 'Pending', 'Rate', 'Value', 'Due', 'Overdue']];
    rows.forEach(function (r) { out.push([r.no, r.date, r.party, r.name, r.unit, r.ordered, r.done, r.billed, r.closed, r.pending, r.rate, r.value, r.due, r.late ? 'Yes' : '']); });
    if (NS.xlsx) NS.xlsx(String(A.bizName() || 'orders').replace(/[^A-Za-z0-9]+/g, '-') + '-orders-outstanding-' + today() + '.xlsx', [{ name: 'Orders', rows: out }]);
  }

  /* ---------- 6. additional cost on a purchase (I-14) ---------- */
  function nextLc(date) {
    var fy = NS.fy(date), max = 0;
    A.mine().forEach(function (d) { if (d.type === 'stk' && d.kind === 'lcost' && NS.fy(d.date) === fy) { var m = String(d.no || '').match(/(\d+)\s*$/); if (m) max = Math.max(max, +m[1]); } });
    return 'LC/' + fy.slice(2, 4) + '-' + fy.slice(5) + '/' + String(max + 1).padStart(3, '0');
  }
  function lcForm(rec) {
    var bills = A.mine().filter(function (d) { return (d.type === 'pbill' && d.kind !== 'return' || d.type === 'self') && !d.cancelled; }).sort(A.byDate).slice(0, 300);
    var r = rec || { date: today(), basis: 'value' };
    var dlg = document.createElement('dialog'); dlg.className = 'or-pick b2-dlg';
    dlg.innerHTML = '<form method="dialog"><header class="dlg-hd"><h3>' + esc(t(rec ? 'lc_edit' : 'new_lc')) + '</h3></header><p class="soft">' + esc(t('lc_h')) + '</p><div class="fg">' +
      '<label class="f" for="lc-date"><span>' + esc(A.T('date')) + '</span><input type="date" id="lc-date" value="' + esc(r.date) + '" required></label>' +
      '<label class="f" for="lc-no"><span>' + esc(t('c_doc')) + '</span><input id="lc-no" value="' + esc(r.no || nextLc(r.date)) + '" dir="ltr"></label>' +
      '<label class="f wide" for="lc-bill"><span>' + esc(t('lc_bill')) + '</span><select id="lc-bill" required><option value=""></option>' + bills.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === r.ref ? ' selected' : '') + '>' + esc((b.no || '') + ' · ' + (b.buyer && b.buyer.name || '') + ' · ' + A.ldate(b.date) + ' · ' + money(num(b.total))) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f" for="lc-to"><span>' + esc(t('lc_to')) + '</span><input id="lc-to" value="' + esc(r.buyer && r.buyer.name || '') + '" list="dl-party" autocomplete="off"></label>' +
      '<label class="f" for="lc-amt"><span>' + esc(t('lc_amt')) + '</span><input id="lc-amt" value="' + esc(r.amt || '') + '" inputmode="decimal" dir="ltr" required></label>' +
      '<label class="f" for="lc-by"><span>' + esc(t('lc_by')) + '</span><select id="lc-by"><option value="value"' + (r.basis !== 'qty' ? ' selected' : '') + '>' + esc(t('lc_val')) + '</option><option value="qty"' + (r.basis === 'qty' ? ' selected' : '') + '>' + esc(t('lc_qty')) + '</option></select></label>' +
      '<label class="f wide" for="lc-note"><span>' + esc(A.T('note')) + '</span><input id="lc-note" value="' + esc(r.note || '') + '"></label></div>' +
      '<p class="soft">' + esc(t('lc_books')) + '</p><div class="dlg-foot"><button type="submit" class="btn primary">' + esc(A.T('save')) + '</button><button type="button" class="btn" data-orx>' + esc(A.T('cancel')) + '</button></div></form>';
    document.body.appendChild(dlg);
    var close = function () { dlg.close(); dlg.remove(); };
    dlg.addEventListener('click', function (e) { if (e.target.closest('[data-orx]')) close(); });
    $('form', dlg).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return String($('#' + id, dlg).value || '').trim(); };
      if (!v('lc-bill') || !(num(v('lc-amt')) > 0)) { NS.toast(t('lc_need'), 'bad'); return; }
      var seller = JSON.parse(JSON.stringify(A.biz() || {})); delete seller.id; delete seller.created; delete seller.updated;
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'lcost', app: 1 }, { date: v('lc-date'), no: v('lc-no'), ref: v('lc-bill'), amt: r2(num(v('lc-amt'))), basis: v('lc-by'), note: v('lc-note'), buyer: { name: v('lc-to') }, seller: rec ? rec.seller : seller });
      NSStore.put('doc', d).then(function () { close(); NS.toast(t('lc_ok')); A.show(); }, function (err) { NS.toast(NS.t('nosave', { e: err && err.message || '' }), 'bad'); });
    });
    dlg.showModal();
  }
  var prevX = A.editX;
  A.editX = function (d) { if (d && d.type === 'stk' && d.kind === 'lcost') { lcForm(d); return true; } return prevX ? prevX(d) : false; };

  /* ---------- 6b. year end: goods received or sent with no bill by the year's last day (Tally: "bills pending") ---------- */
  if (window.NSAcct && NSAcct.yearSummary) {
    var ys = NSAcct.yearSummary;
    NSAcct.yearSummary = function (docs, items, biz, fy) {
      var Y = ys.apply(this, arguments);
      try {
        var end = (+String(fy).slice(0, 4) + 1) + '-03-31', D = (docs || []).filter(function (d) { return d && (!d.date || d.date <= end); });
        var g = O.unbilled(D, biz, 'buy').length, c = O.unbilled(D, biz, 'sale').length;
        if (Y && Y.checks) { if (g) Y.checks.push(['grn', g]); if (c) Y.checks.push(['dnopen', c]); }
      } catch (e) {}
      return Y;
    };
  }

  /* ---------- 7. print / PDF of a receipt note or a goods back / sent back voucher ---------- */
  var TITLE = { grn: 'RECEIPT NOTE (GOODS RECEIVED NOTE)', rejin: 'GOODS RETURNED BY CUSTOMER (REJECTION IN)', rejout: 'GOODS RETURNED TO SUPPLIER (REJECTION OUT)' };
  function sheet(d) {
    var s = d.seller || {}, b = d.buyer || {}, L = (d.items || d.lines || []).filter(function (it) { return String(it.desc || '').trim(); }), tot = 0;
    var who = d.kind === 'rejin' ? 'Customer' : 'Supplier', tr = d.tr || {};
    var rows = L.map(function (it, i) { var q = it.qty === '' || it.qty == null ? 1 : num(it.qty), a = r2(q * num(it.rate) * (1 - num(it.disc) / 100)); tot = r2(tot + a); return '<tr><td>' + (i + 1) + '</td><td>' + esc(it.desc) + (it.batch ? ' <small>Batch ' + esc(it.batch) + (it.exp ? ' · Exp ' + esc(it.exp) : '') + '</small>' : '') + '</td><td>' + esc(it.hsn || '') + '</td><td class="n">' + qty(q) + ' ' + esc(it.unit || '') + '</td><td class="n">' + (num(it.rate) ? NS.money(num(it.rate), false) : '') + '</td><td class="n">' + (a ? NS.money(a, false) : '') + '</td></tr>'; }).join('');
    return '<div class="stsheet sh vw-print" dir="ltr"><div class="sh-head"><b>' + esc(s.name || '') + '</b><br>' + esc([s.addr, s.city, s.pin].filter(Boolean).join(', ')) + (s.gstin ? '<br>GSTIN ' + esc(s.gstin) : '') + '</div>' +
      '<h3 style="text-align:center">' + esc(TITLE[d.kind] || 'STOCK VOUCHER') + '</h3>' +
      '<table class="tbl"><tbody><tr><th>No.</th><td>' + esc(d.no || '') + '</td><th>Date</th><td>' + esc(NS.fmtDate(d.date)) + '</td></tr><tr><th>' + who + '</th><td colspan="3">' + esc(b.name || '') + (b.gstin ? ' · GSTIN ' + esc(b.gstin) : '') + '</td></tr>' +
      (d.against ? '<tr><th>Against</th><td colspan="3">' + esc(d.against) + '</td></tr>' : '') + (d.ref ? '<tr><th>' + (d.kind === 'grn' ? 'Supplier challan no.' : 'Reference') + '</th><td colspan="3">' + esc(d.ref) + '</td></tr>' : '') +
      (tr.veh || tr.tname || tr.lr ? '<tr><th>Transport</th><td colspan="3">' + esc([tr.tname, tr.veh, tr.lr && 'LR ' + tr.lr].filter(Boolean).join(' · ')) + '</td></tr>' : '') + '</tbody></table>' +
      '<table class="tbl"><thead><tr><th>#</th><th>Item</th><th>HSN</th><th class="n">Quantity</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><th colspan="5">Total</th><th class="n">' + NS.money(tot, false) + '</th></tr></tfoot></table>' +
      (d.notes ? '<p>' + esc(d.notes) + '</p>' : '') +
      '<table class="tbl" style="margin-top:3em"><tbody><tr><td>' + (d.kind === 'grn' ? 'Received by' : d.kind === 'rejin' ? 'Received back by' : 'Sent by') + '</td><td>Checked by</td><td>Authorised signatory</td></tr></tbody></table>' + (NS.creditLine ? NS.creditLine('st-ft') : '') + '</div>';
  }
  function printStk(d, how) {
    var html = sheet(d);
    if (how === 'share' && NS.sharePdf) { var w = document.createElement('div'); w.innerHTML = html; var n = w.firstChild; n.classList.add('lg-paper'); NS.sharePdf([n], (d.no || 'voucher').replace(/[^A-Za-z0-9]+/g, '-'), 'a4', TITLE[d.kind] || '', ''); return; }
    var host = $('#vch-print');
    if (!host) { host = document.createElement('div'); host.id = 'vch-print'; host.className = 'vch-print'; document.body.appendChild(host); }
    host.innerHTML = html;
    document.documentElement.classList.add('vch-on');
    var off = function () { window.removeEventListener('afterprint', off); document.documentElement.classList.remove('vch-on'); host.innerHTML = ''; };
    window.addEventListener('afterprint', off);
    setTimeout(function () { window.print(); }, 60);
  }
})();
