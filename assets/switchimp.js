/* Switch-over import in My data: "Bring in my data from other billing software" (Vyapar, myBillBook, Busy, Tally, any Excel sheet).
   Reads an Excel / CSV file or a Tally XML export in the browser (nothing is uploaded), shows how each column was understood (the user can change it,
   and the choice is remembered), a preview with counts and problems, and saves only after the user confirms.
   Parsing and checking: engine/importcore.js (NSImport). Saves parties, items, opening balances (the App's 'ob' records, summed per party from
   outstanding bills when the file has them) and opening stock (one 'stk' open record). The last import can be undone with one tap: its ids are kept in
   meta 'lastImport' and only those records are removed. Screen words: NS.t('sw.*'). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t, I = window.NSImport;
  var XL = ['/assets/vendor/xlsx-0.20.3.full.min.js', ''];   /* SheetJS 0.20.3 kept inside NSBiz (0.18.5 had CVE-2023-30533, CVE-2024-22363) */
  var MAPKEY = 'ns-imp-maps', KINDS = ['party', 'item', 'bill'];
  var ST = null;   /* { lists, opts, have, biz, plan, done } */
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function fyStart() { return NS.fy(NS.today()).slice(0, 4) + '-04-01'; }
  function mem() { try { return JSON.parse(localStorage.getItem(MAPKEY) || '{}'); } catch (e) { return {}; } }
  function remember(l) {
    if (!l.kind) return;
    try { var m = mem(); m[l.kind + '|' + sig(l)] = { header: l.header, sub: l.sub, map: l.map }; localStorage.setItem(MAPKEY, JSON.stringify(m)); } catch (e) {}
  }
  function sig(l) { return I.hk(l.heads.join('|')); }

  /* ---------- reading the file ---------- */
  function lists(rows, name) {
    var d = I.detect(rows); if (!d) return null;
    var l = { name: name, rows: rows, kind: d.kind, header: d.header, sub: d.sub, heads: d.heads };
    return setup(l);
  }
  function setup(l) {
    l.heads = I.headings(l.rows, l.header, l.sub);
    var saved = mem()[l.kind + '|' + sig(l)];
    if (saved) { l.map = saved.map; l.remembered = true; } else { l.map = I.autoMap(l.heads, l.kind, l.rows, l.header); l.remembered = false; }
    return l;
  }
  function readFile(file) {
    var nm = file.name || '';
    if (/\.(csv|txt|tsv)$/i.test(nm)) return file.arrayBuffer().then(function (b) { var L = lists(I.csvRows(I.decode(b)), nm); return L ? [L] : []; });
    if (/\.xml$/i.test(nm)) return file.arrayBuffer().then(function (b) { return fromTally(I.decode(b)); });
    return NS.loadJs(XL[0], XL[1]).then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var head = I.decode(new Uint8Array(buf.slice(0, 400)));
      if (/<ENVELOPE|<TALLYMESSAGE|<\?xml/i.test(head)) return fromTally(I.decode(buf));
      var wb = window.XLSX.read(buf, { type: 'array' }), out = [];
      wb.SheetNames.forEach(function (n) {
        var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }).map(function (r) { return r.map(function (c) { return c == null ? '' : c; }); });   /* blank rows kept: row numbers match Excel */
        var L = lists(rows, n); if (L) out.push(L);
      });
      return out;
    });
  }
  function fromTally(x) {
    var tx = I.tallyXml(x), out = [];
    KINDS.forEach(function (k) { var T = tx.tables[k]; if (!T) return; var rows = [T.heads].concat(T.rows); out.push(setup({ name: 'Tally: ' + k, rows: rows, kind: k, header: 0, sub: false, heads: T.heads })); });
    if (out.length) out.tally = tx.skipped;
    return out;
  }

  /* ---------- the checks ---------- */
  function compute() {
    var o = ST.opts, tables = { party: [], item: [], bill: [] };
    ST.lists.forEach(function (l) {
      if (!l.kind || l.off) return;
      var rows = I.build(l.kind, l.rows, l.header, l.map, { sub: l.sub, role: o.role, dropBadGstin: o.dropBad, billSide: o.billSide });
      tables[l.kind] = tables[l.kind].concat(rows);
    });
    var have = ST.have;
    ST.plan = I.plan(tables, have, { asOf: o.asOf });
    ST.noBiz = !ST.biz && (ST.plan.obs.length || ST.plan.stock.length);
  }

  /* ---------- screen ---------- */
  function open() {
    var dlg = $('#hub-form'), f = $('form', dlg);
    I.setDeps({ gstin: NS.gstinCheck, stateCode: NS.hubCsv && NS.hubCsv.stateCode, today: NS.today });
    ST = null;
    $('[data-form-title]', dlg).textContent = t('sw.title');
    f.onsubmit = function (e) { e.preventDefault(); save(); };
    f.innerHTML = '<p class="soft">' + esc(t('sw.p')) + '</p>' +
      '<div class="btns xi-pick"><label class="btn primary" data-ic="up"><span>' + esc(t('sw.choose')) + '</span><input type="file" accept=".xlsx,.xls,.ods,.csv,.txt,.tsv,.xml" data-sw-file hidden></label></div>' +
      '<p class="soft sw-how">' + esc(t('sw.how')) + '</p>' +
      '<div data-sw-last></div><div data-sw-out aria-live="polite"></div>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary" data-sw-go disabled>' + esc(t('sw.go')) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    $('[data-sw-file]', f).addEventListener('change', function (e) { var fl = e.target.files[0]; if (fl) pick(fl, f); e.target.value = ''; });
    f.addEventListener('change', onChange);
    f.addEventListener('click', function (e) { if (e.target.closest('[data-sw-undo]')) undo(); });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    lastCard(f);
  }
  function lastCard(f) {
    NSStore.meta('lastImport').then(function (li) {
      var box = $('[data-sw-last]', f); if (!box) return;
      box.innerHTML = li && li.ids ? '<div class="callout sw-last"><b>' + esc(t('sw.lastq', { p: li.ids.party.length, i: li.ids.item.length, d: li.ids.doc.length, on: NS.fmtDate(li.on) })) + '</b> <button type="button" class="btn sm" data-sw-undo>' + esc(t('sw.undo')) + '</button></div>' : '';
    });
  }
  function pick(file, f) {
    var out = $('[data-sw-out]', f);
    out.innerHTML = '<p class="soft">' + esc(t('st.load')) + '</p>';
    Promise.all([readFile(file), NSStore.list('party'), NSStore.list('item'), NSStore.list('doc'), NSStore.list('biz'), NSStore.meta('settings')]).then(function (x) {
      var ls = x[0], S = x[5] || {}, biz = x[4].filter(function (b) { return b.id === S.defBiz; })[0] || x[4][0] || null, have = { party: {}, item: {}, ob: [] };
      x[1].forEach(function (p) { have.party[key(p.name)] = p; }); x[2].forEach(function (i) { have.item[key(i.desc)] = i; });
      have.ob = x[3].filter(function (d) { return d.type === 'ob' && biz && key(d.seller && d.seller.name) === key(biz.name); });
      if (!ls.length) { ST = null; out.innerHTML = '<p class="callout">' + esc(t('sw.none')) + '</p>'; go(f); return; }
      ST = { lists: ls, have: have, biz: biz, file: file.name, tally: ls.tally || 0, opts: { role: 'customer', billSide: 'recv', dropBad: false, asOf: fyStart() } };
      compute(); drawAll(out); go(f);
    }).catch(function (e) { ST = null; out.innerHTML = '<p class="callout">' + esc(t('sw.unread')) + '</p>'; console.error(e); go(f); });
  }
  function go(f) {
    var b = $('[data-sw-go]', f), n = ST && ST.plan ? ST.plan.parties.length + ST.plan.items.length + ST.plan.obs.length + (ST.plan.stock.length ? 1 : 0) : 0;
    b.disabled = !n || (ST && ST.noBiz); b.textContent = t('sw.go') + (n ? ' (' + n + ')' : '');
  }
  function drawAll(out) {
    var h = '<p><b>' + esc(t('sw.file', { f: ST.file })) + '</b></p>' + (ST.tally ? '<p class="soft">' + esc(t('sw.tallyskip', { n: ST.tally })) + '</p>' : '') + '<div data-sw-lists>' + ST.lists.map(listHtml).join('') + '</div>' + optsHtml() + '<div data-sw-prev></div>';
    out.innerHTML = h; drawPrev();
  }
  function kindSel(l, i) {
    return '<select data-sw-kind="' + i + '"><option value="">' + esc(t('sw.skip')) + '</option>' + KINDS.map(function (k) { return '<option value="' + k + '"' + (l.kind === k && !l.off ? ' selected' : '') + '>' + esc(t('sw.k.' + k)) + '</option>'; }).join('') + '</select>';
  }
  function listHtml(l, i) {
    var sample = l.rows[l.header + 1 + (l.sub ? 1 : 0)] || [];
    return '<details class="sw-list card"' + (l.remembered || !l.kind ? '' : ' open') + ' data-sw-l="' + i + '"><summary><b dir="auto">' + esc(l.name) + '</b> · ' + kindSel(l, i) + (l.remembered ? ' <span class="pill ok">' + esc(t('sw.remembered')) + '</span>' : '') + ' <span class="soft">' + esc(t('sw.nrows', { n: Math.max(0, l.rows.length - l.header - 1 - (l.sub ? 1 : 0)) })) + '</span></summary>' +
      (l.kind ? '<div class="sw-ctl"><label>' + esc(t('sw.hdrrow')) + ' <input type="number" min="1" max="' + Math.min(l.rows.length, 60) + '" value="' + (l.header + 1) + '" data-sw-hdr="' + i + '"></label> <label class="tcheck"><input type="checkbox" data-sw-sub="' + i + '"' + (l.sub ? ' checked' : '') + '> ' + esc(t('sw.sub')) + '</label></div>' +
        '<div class="sw-map">' + Object.keys(I.FIELDS[l.kind]).map(function (f) {
          var cur = l.map[f], need = f === I.NAMEF[l.kind];
          return '<label class="sw-f' + (need ? ' req' : '') + '"><span>' + esc(t('sw.f.' + f)) + (need ? ' *' : '') + '</span><select data-sw-f="' + i + ':' + f + '"><option value="">' + esc(t('sw.nocol')) + '</option>' +
            l.heads.map(function (h, j) { return h ? '<option value="' + j + '"' + (cur === j ? ' selected' : '') + ' dir="auto">' + esc(h + (sample[j] !== undefined && String(sample[j]) !== '' ? '  (' + String(sample[j]).slice(0, 20) + ')' : '')) + '</option>' : ''; }).join('') + '</select></label>';
        }).join('') + '</div>' : '') + '</details>';
  }
  function optsHtml() {
    var o = ST.opts;
    return '<div class="sw-opts card"><label>' + esc(t('sw.o.asof')) + ' <input type="date" data-sw-o="asOf" value="' + o.asOf + '"></label>' +
      '<label>' + esc(t('sw.o.role')) + ' <select data-sw-o="role"><option value="customer"' + (o.role === 'customer' ? ' selected' : '') + '>' + esc(t('hub.r.customer')) + '</option><option value="supplier"' + (o.role === 'supplier' ? ' selected' : '') + '>' + esc(t('hub.r.supplier')) + '</option></select></label>' +
      '<label>' + esc(t('sw.o.bside')) + ' <select data-sw-o="billSide"><option value="recv"' + (o.billSide === 'recv' ? ' selected' : '') + '>' + esc(t('xi.ob.recv')) + '</option><option value="pay"' + (o.billSide === 'pay' ? ' selected' : '') + '>' + esc(t('xi.ob.pay')) + '</option></select></label>' +
      '<label class="tcheck"><input type="checkbox" data-sw-o="dropBad"' + (o.dropBad ? ' checked' : '') + '> ' + esc(t('sw.o.dropbad')) + '</label></div>';
  }
  function onChange(e) {
    if (!ST) return;
    var el = e.target, a;
    if ((a = el.getAttribute('data-sw-kind')) != null) { var l = ST.lists[+a]; if (!el.value) l.off = true; else { l.off = false; if (l.kind !== el.value) { l.kind = el.value; l.map = I.autoMap(l.heads, l.kind, l.rows, l.header); l.remembered = false; } } rerender(+a); }
    else if ((a = el.getAttribute('data-sw-hdr')) != null) { var l2 = ST.lists[+a]; l2.header = Math.max(0, Math.min(l2.rows.length - 1, (+el.value || 1) - 1)); setup(l2); rerender(+a); }
    else if ((a = el.getAttribute('data-sw-sub')) != null) { var l3 = ST.lists[+a]; l3.sub = el.checked; setup(l3); rerender(+a); }
    else if ((a = el.getAttribute('data-sw-f')) != null) { var p = a.split(':'), l4 = ST.lists[+p[0]]; if (el.value === '') delete l4.map[p[1]]; else l4.map[p[1]] = +el.value; l4.remembered = false; }
    else if ((a = el.getAttribute('data-sw-o')) != null) { ST.opts[a] = el.type === 'checkbox' ? el.checked : el.value; if (a === 'asOf' && !el.value) ST.opts.asOf = fyStart(); }
    else return;
    compute(); drawPrev(); go(el.closest('form'));
  }
  function rerender(i) {
    var box = $('[data-sw-l="' + i + '"]'); if (!box) return;
    var wrap = document.createElement('div'); wrap.innerHTML = listHtml(ST.lists[i], i);
    var nw = wrap.firstChild; nw.open = true; box.replaceWith(nw);
  }
  function drawPrev() {
    var P = ST.plan, c = P.counts, box = $('[data-sw-prev]'); if (!box) return;
    var recv = 0, pay = 0; P.obs.forEach(function (o) { if (o.side === 'recv') recv += o.amount; else pay += o.amount; });
    var h = '<div class="tiles sw-tiles">' + [['party', P.parties.length], ['item', P.items.length], ['ob', P.obs.length], ['stock', P.stock.length]].map(function (x) { return '<div class="tile"><span>' + esc(t('sw.t.' + x[0])) + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>';
    if (P.obs.length) h += '<p class="soft">' + esc(t('sw.obsum', { r: NS.money(recv), p: NS.money(pay), d: NS.fmtDate(P.asOf) })) + '</p>';
    if (c.exists) h += '<p class="soft">' + esc(t('sw.exists', { n: c.exists })) + '</p>';
    if (ST.noBiz) h += '<p class="callout">' + esc(t('xi.e.nobiz')) + '</p>';
    var probs = P.rows.filter(function (r) { return r.errs.length || r.warns.length; });
    h += '<p><b>' + (c.bad ? '<span class="pill bad">' + esc(t('sw.nbad', { n: c.bad })) + '</span>' : '<span class="pill ok">' + esc(t('sw.allok')) + '</span>') + '</b>' + (c.warn ? ' <span class="pill">' + esc(t('sw.nwarn', { n: c.warn })) + '</span>' : '') + '</p>';
    if (probs.length) {
      h += '<div class="xi-tw"><table class="xi-t"><thead><tr><th>' + esc(t('xi.row')) + '</th><th>' + esc(t('xi.name')) + '</th><th>' + esc(t('xi.what')) + '</th></tr></thead><tbody>' +
        probs.slice(0, 200).map(function (r) {
          var nm = r.rec.name || r.rec.desc || r.rec.party || '—', msgs = r.errs.map(function (e) { return '✕ ' + t('sw.e.' + e[0], e[1]); }).concat(r.warns.map(function (w) { return '! ' + t('sw.w.' + w[0], w[1]); }));
          return '<tr class="' + (r.errs.length ? 'bad' : '') + '"><td class="n">' + (r.line || '') + '</td><td dir="auto">' + esc(nm) + '</td><td>' + esc(msgs.join(' ')) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + (probs.length > 200 ? '<p class="soft">' + esc(t('sw.more', { n: probs.length - 200 })) + '</p>' : '');
    }
    box.innerHTML = h;
  }

  /* ---------- save (only after the user pressed Import) ---------- */
  function sellerCopy() { var s = JSON.parse(JSON.stringify(ST.biz)); delete s.id; delete s.created; delete s.updated; return s; }
  function save() {
    if (!ST || !ST.plan || ST.noBiz) return;
    var P = ST.plan, f = $('#hub-form form'), b = $('[data-sw-go]', f); b.disabled = true;
    var ids = { party: [], item: [], doc: [] }, jobs = [];
    P.parties.forEach(function (r) { jobs.push(['party', r]); });
    P.items.forEach(function (r) { r.kind = r.kind || 'goods'; jobs.push(['item', r]); });
    P.obs.forEach(function (o) { jobs.push(['doc', { type: 'ob', app: 1, date: o.date, seller: sellerCopy(), buyer: { name: o.party }, side: o.side, amount: o.amount, total: o.amount, no: '', refs: o.refs && o.refs.length ? o.refs : undefined, imported: 1 }]); });
    if (P.stock.length) jobs.push(['doc', { type: 'stk', kind: 'open', app: 1, date: P.asOf, no: 'OS/import', note: t('sw.stknote'), seller: sellerCopy(), lines: P.stock, imported: 1 }]);
    var made = [];
    jobs.reduce(function (p, j) { return p.then(function () { return NSStore.put(j[0], j[1]).then(function (rec) { ids[j[0]].push(rec.id); made.push(j[0] + ':' + rec.id); }); }); }, Promise.resolve())
      .then(function () { return NSStore.meta('lastImport', { on: NS.today(), file: ST.file, ids: ids }); })
      .then(function () {
        ST.lists.forEach(remember);
        $('#hub-form').close();
        NS.toast(t('sw.done', { p: ids.party.length, i: ids.item.length, d: ids.doc.length }));
        document.dispatchEvent(new CustomEvent('ns-data'));
      }).catch(function (err) {
        /* something failed half-way: what was already saved is kept as the "last import" so one tap removes it */
        NSStore.meta('lastImport', { on: NS.today(), file: ST.file, ids: ids }).catch(function () {});
        b.disabled = false; NS.toast(t('nosave', { e: err.message }), 'bad');
      });
  }
  function undo() {
    NSStore.meta('lastImport').then(function (li) {
      if (!li || !li.ids) return;
      var n = li.ids.party.length + li.ids.item.length + li.ids.doc.length;
      return (NS.ask ? NS.ask(t('sw.undoq', { n: n }), { danger: true }) : Promise.resolve(confirm(t('sw.undoq', { n: n })))).then(function (ok) {
        if (!ok) return;
        var jobs = []; ['party', 'item', 'doc'].forEach(function (s) { li.ids[s].forEach(function (id) { jobs.push([s, id]); }); });
        return jobs.reduce(function (p, j) { return p.then(function () { return NSStore.del(j[0], j[1], { hard: true }).catch(function () {}); }); }, Promise.resolve())
          .then(function () { return NSStore.meta('lastImport', null); })
          .then(function () { NS.toast(t('sw.undone', { n: n })); var d = $('#hub-form'); if (d && d.open) d.close(); document.dispatchEvent(new CustomEvent('ns-data')); });
      });
    });
  }

  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) {
    var x = $('[data-backup-ext]', pane) || pane, c = NS.el('div', { 'class': 'card' });
    c.innerHTML = '<h3>' + esc(t('sw.title')) + '</h3><p class="soft">' + esc(t('sw.p')) + '</p><div class="btns"><button type="button" class="btn" data-swimp data-ic="up">' + esc(t('sw.open')) + '</button></div>';
    x.insertBefore(c, x.firstChild);
  }]);
  NS.swImport = { open: open, undo: undo };
})();
