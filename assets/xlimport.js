/* Excel import in My data (my.niveshsahayak.in): items, customers and suppliers, and opening balances from ONE .xlsx.
   Blank template with sheets Items, Parties, Opening balances (English headers = the CSV headers of my.js, so a file works in any language).
   The file is read with SheetJS (same copy as extras.js NS.xlsx), every row is checked and shown first (GSTIN check digit, HSN digits,
   GST rate, names twice in the file), then "Import N rows" saves the good rows: a name already saved is updated, a new one is added.
   Opening balances become the App's own 'ob' documents (side recv | pay | cash | bank) for the default business; a second import of the
   same party and side replaces the amount instead of adding another one. Screen words: NS.t('xi.*'). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t;
  var XL = ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw'];
  var RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];
  var OBCOLS = [['party', 'Party'], ['side', 'Type'], ['amount', 'Amount'], ['date', 'Date']];
  var SIDES = [['recv', /receiv|due to us|debtor|customer|recv|lena|^dr$/i], ['pay', /payab|we owe|creditor|supplier|pay|dena|^cr$/i], ['cash', /cash/i], ['bank', /bank/i]];
  var NUMS = { rate: 1, wrate: 1, mrp: 1, prate: 1, climit: 1, cdays: 1 };
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function hk(s) { return key(s).replace(/[^a-z0-9%]/g, ''); }
  function set(o, k, v) { var p = k.split('.'), last = p.pop(); p.forEach(function (x) { o = o[x] = o[x] && typeof o[x] === 'object' ? o[x] : {}; }); o[last] = v; }
  function cols(s) { return s === 'ob' ? OBCOLS : NS.hubCsv.cols[s]; }
  function fyStart() { return NS.fy(NS.today()).slice(0, 4) + '-04-01'; }

  /* ---------- template ---------- */
  function template() {
    var help = [['Sheet', 'What to type'],
      ['Items', 'One item or service a row. Name is needed. Type: Goods or Service. HSN/SAC: 4, 6 or 8 digits. GST %: 0, 0.25, 3, 5, 12, 18, 28 or 40. Group: any name (a new group is made).'],
      ['Parties', 'One customer or supplier a row. Name is needed. Type: Customer, Supplier or Both. GSTIN: 15 characters (state code is filled from it). State code: 2 digits, e.g. 03 for Punjab.'],
      ['Opening balances', 'Party: customer or supplier name (leave empty for Cash or Bank). Type: Receivable (they owe you), Payable (you owe them), Cash or Bank. Amount: more than 0. Date: the start date, e.g. 2026-04-01.'],
      ['', 'A name that is already saved is updated, a new name is added. Delete these help rows only if you like: this sheet is not read.']];
    var c = NS.hubCsv.cols;
    NS.xlsx('nivesh-sahayak-import-template.xlsx', [
      { name: 'Items', rows: [c.item.map(function (x) { return x[1]; })] },
      { name: 'Parties', rows: [c.party.map(function (x) { return x[1]; })] },
      { name: 'Opening balances', rows: [OBCOLS.map(function (x) { return x[1]; })] },
      { name: 'How to fill', rows: help }]);
  }

  /* ---------- read and check ---------- */
  function sheetOf(name) { var n = key(name); return /open|balance/.test(n) ? 'ob' : /item|product|service|stock/.test(n) ? 'item' : /part|customer|supplier|debtor|creditor|ledger/.test(n) ? 'party' : ''; }
  function cell(v) {
    if (v == null) return '';
    if (v instanceof Date) return v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
    return String(v).trim();
  }
  function isoDate(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^\d{5}(\.\d+)?$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + Math.round(+v) * 864e5).toISOString().slice(0, 10);
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v) || /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(v);
    if (!m) return null;
    var y = m[1].length === 4 ? m[1] : m[3], mo = m[2], d = m[1].length === 4 ? m[3] : m[1], out = y + '-' + mo.padStart(2, '0') + '-' + d.padStart(2, '0');
    return isNaN(new Date(out + 'T00:00:00')) ? null : out;
  }
  function readFile(file) {
    return NS.loadJs(XL[0], XL[1]).then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: 'array' }), got = {};
      wb.SheetNames.forEach(function (n) {
        var s = sheetOf(n); if (!s || got[s]) return;
        got[s] = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }).map(function (r) { return r.map(cell); }).filter(function (r) { return r.some(Boolean); });
      });
      return got;
    });
  }
  /* rows of one sheet -> [{ line, rec, errs: [key, values], upd }] */
  function parse(s, rows, have, seen) {
    if (!rows || rows.length < 2) return [];
    var C = cols(s), head = rows[0].map(hk);
    var idx = C.map(function (c) {
      var i = head.indexOf(hk(c[1])); if (i < 0) i = head.indexOf(hk(c[0]));
      if (i < 0 && c[0] === 'cat') i = head.indexOf('category');
      if (i < 0 && c[0] === 'party') i = head.indexOf('name');
      return i;
    });
    var nameKey = s === 'item' ? 'desc' : s === 'ob' ? 'party' : 'name';
    return rows.slice(1).map(function (cells, n) {
      var r = {}, E = [], line = n + 2;
      C.forEach(function (c, j) { var v = idx[j] >= 0 ? cells[idx[j]] : ''; if (v !== '' && v != null) set(r, c[0], String(v).trim()); });
      if (s === 'ob') return obRow(r, line, E);
      var nm = key(r[nameKey]);
      if (!nm) { E.push(['noname']); return { line: line, rec: r, errs: E, s: s }; }
      if (seen[s + nm]) E.push(['twice', { row: seen[s + nm] }]); else seen[s + nm] = line;
      if (r.state) { var sc = NS.hubCsv.stateCode(r.state); if (!sc) E.push(['state', { v: r.state }]); r.state = sc; }
      if (r.ship && r.ship.state) r.ship.state = NS.hubCsv.stateCode(r.ship.state);
      if (r.gstin) {
        r.gstin = r.gstin.toUpperCase().replace(/\s/g, '');
        var g = NS.gstinCheck(r.gstin);
        if (!g.ok) E.push(['gstin', { g: r.gstin }]); else if (!r.state && g.state) r.state = g.state;
      }
      if (r.hsn) {
        r.hsn = r.hsn.replace(/\s/g, '');
        if (/^\d{3}$|^\d{5}$|^\d{7}$/.test(r.hsn)) r.hsn = '0' + r.hsn;   /* Excel drops the first 0 of 0401 */
        if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(r.hsn)) E.push(['hsn', { h: r.hsn }]);
      }
      if (r.gst != null) { r.gst = NS.num(String(r.gst).replace('%', '')); if (r.gst > 0 && r.gst < 1 && RATES.indexOf(r.gst) < 0) r.gst = Math.round(r.gst * 10000) / 100; if (RATES.indexOf(r.gst) < 0) E.push(['gst', { r: r.gst }]); }
      if (r.role) r.role = /supp/i.test(r.role) ? (/both|cust/i.test(r.role) ? 'both' : 'supplier') : /both/i.test(r.role) ? 'both' : 'customer';
      if (r.kind) r.kind = /serv/i.test(r.kind) ? 'service' : 'goods';
      if (r.ptype) r.ptype = /whole/i.test(r.ptype) ? 'wholesale' : 'retail';
      Object.keys(NUMS).forEach(function (k) { if (r[k] != null) { if (isNaN(NS.num(r[k])) || !/\d/.test(r[k])) E.push(['num', { v: r[k] }]); r[k] = NS.num(r[k]); } });
      return { line: line, rec: r, errs: E, s: s, upd: !!have[s][nm] };
    });
  }
  function obRow(r, line, E) {
    var side = '';
    SIDES.some(function (x) { if (x[1].test(r.side || '')) { side = x[0]; return true; } return false; });
    if (!side) E.push(['side', { v: r.side || '—' }]);
    var amt = NS.num(String(r.amount || '').replace(/[,₹\s]/g, ''));
    if (!(amt > 0)) E.push(['amt', { v: r.amount || '—' }]);
    var d = r.date ? isoDate(r.date) : fyStart();
    if (d === null) E.push(['date', { v: r.date }]);
    if ((side === 'recv' || side === 'pay') && !key(r.party)) E.push(['noparty']);
    return { line: line, rec: { party: side === 'cash' || side === 'bank' ? '' : String(r.party || '').trim(), side: side, amount: Math.round(amt * 100) / 100, date: d || '' }, errs: E, s: 'ob' };
  }

  /* ---------- the box ---------- */
  var DATA = null, rowsAll = [];
  function open() {
    var dlg = $('#hub-form'), f = $('form', dlg);
    $('[data-form-title]', dlg).textContent = t('xi.open');
    f.onsubmit = function (e) { e.preventDefault(); save(); };
    f.innerHTML = '<p class="soft">' + esc(t('xi.p')) + '</p>' +
      '<div class="btns xi-pick"><label class="btn primary" data-ic="up"><span>' + esc(t('xi.choose')) + '</span><input type="file" accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-xi-file hidden></label>' +
      '<button type="button" class="btn" data-xi-tpl>' + esc(t('xi.tpl')) + '</button></div>' +
      '<div data-xi-out aria-live="polite"></div>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary" data-xi-go disabled>' + esc(t('xi.go', { n: 0 })) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    $('[data-xi-tpl]', f).addEventListener('click', template);
    $('[data-xi-file]', f).addEventListener('change', function (e) { var fl = e.target.files[0]; if (fl) pick(fl, f); e.target.value = ''; });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }
  function pick(file, f) {
    var out = $('[data-xi-out]', f);
    out.innerHTML = '<p class="soft">' + esc(t('st.load')) + '</p>';
    Promise.all([readFile(file), NSStore.list('party'), NSStore.list('item'), NSStore.list('doc'), NSStore.list('biz'), NSStore.meta('settings')]).then(function (x) {
      var got = x[0], have = { party: {}, item: {} };
      x[1].forEach(function (p) { have.party[key(p.name)] = p; });
      x[2].forEach(function (i) { have.item[key(i.desc)] = i; });
      var S = x[5] || {}, biz = x[4].filter(function (b) { return b.id === S.defBiz; })[0] || x[4][0] || null;
      DATA = { have: have, party: x[1], item: x[2], doc: x[3], biz: biz };
      var seen = {};
      rowsAll = ['item', 'party', 'ob'].reduce(function (a, s) { return a.concat(parse(s, got[s], have, seen)); }, []);
      if (!biz) rowsAll.forEach(function (r) { if (r.s === 'ob') r.errs.push(['nobiz']); });
      if (!rowsAll.length) { out.innerHTML = '<p class="callout">' + esc(t('xi.empty')) + '</p>'; go(f, 0); return; }
      draw(out, biz);
      go(f, rowsAll.filter(function (r) { return !r.errs.length; }).length);
    }).catch(function (e) { out.innerHTML = '<p class="callout">' + esc(t('xi.unread')) + '</p>'; console.error(e); go(f, 0); });
  }
  function go(f, n) { var b = $('[data-xi-go]', f); b.disabled = !n; b.textContent = t('xi.go', { n: n }); }
  function draw(out, biz) {
    var by = { item: [], party: [], ob: [] };
    rowsAll.forEach(function (r) { by[r.s].push(r); });
    var bad = rowsAll.filter(function (r) { return r.errs.length; }).length;
    var h = '<p><b>' + esc(t('xi.found', { i: by.item.length, p: by.party.length, o: by.ob.length })) + '</b>' + (bad ? ' <span class="pill bad">' + esc(t('xi.nbad', { n: bad })) + '</span>' : ' <span class="pill ok">' + esc(t('xi.allok')) + '</span>') + '</p>' +
      (by.ob.length && biz ? '<p class="soft">' + esc(t('xi.obfor', { b: biz.name })) + '</p>' : '');
    ['item', 'party', 'ob'].forEach(function (s) {
      if (!by[s].length) return;
      h += '<h3 class="xi-h">' + esc(t('xi.s.' + s)) + '</h3><div class="xi-tw"><table class="xi-t"><thead><tr><th>' + esc(t('xi.row')) + '</th><th>' + esc(t('xi.name')) + '</th><th>' + esc(t('xi.what')) + '</th></tr></thead><tbody>' +
        by[s].map(function (r) {
          var nm = s === 'item' ? r.rec.desc : s === 'ob' ? (r.rec.party || (r.rec.side ? t('xi.ob.' + r.rec.side) : '—')) + (r.rec.amount ? ' · ' + NS.money(r.rec.amount, false) : '') : r.rec.name;
          var what = r.errs.length ? r.errs.map(function (e) { return t('xi.e.' + e[0], e[1]); }).join(' ') : t(s === 'ob' ? 'xi.ob.' + r.rec.side : r.upd ? 'xi.upd' : 'xi.new');
          return '<tr class="' + (r.errs.length ? 'bad' : '') + '"><td class="n">' + r.line + '</td><td dir="auto">' + esc(nm || '—') + '</td><td>' + (r.errs.length ? '✕ ' : '✓ ') + esc(what) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    });
    out.innerHTML = h;
  }

  /* ---------- save ---------- */
  function groupsFor(recs) {
    /* party Group / item Group names -> group ids; names not known yet become new groups (like the CSV import) */
    var need = recs.filter(function (r) { return r.s === 'party' && r.rec.group || r.s === 'item' && r.rec.cat; });
    if (!need.length) return Promise.resolve();
    return NSStore.meta('groups').then(function (m) {
      m = m && typeof m === 'object' ? m : {}; m.party = m.party || []; m.item = m.item || [];
      var n = 0, made = 0;
      need.forEach(function (r) {
        var kind = r.s, nm = String(kind === 'item' ? r.rec.cat : r.rec.group).trim(), k = key(nm);
        if (kind === 'party') {
          var role = r.rec.role || (DATA.have.party[key(r.rec.name)] || {}).role || 'customer';
          if (/^(customers?|sundry debtors|debtors)$/.test(k)) { delete r.rec.group; return; }
          if (/^(suppliers?|sundry creditors|creditors)$/.test(k)) { delete r.rec.group; return; }
          var g = m.party.filter(function (x) { return key(x.name) === k; })[0];
          if (!g) { g = { id: 'g' + Date.now().toString(36) + (n++), name: nm, under: role === 'supplier' ? 'creditors' : 'debtors' }; m.party.push(g); made++; }
          r.rec.group = g.id;
        } else {
          var gi = m.item.filter(function (x) { return key(x.name) === k; })[0];
          if (!gi) { gi = { id: 'g' + Date.now().toString(36) + (n++), name: nm, under: '' }; m.item.push(gi); made++; }
          r.rec.group = gi.id; r.rec.cat = gi.name;
        }
      });
      return made ? NSStore.meta('groups', m) : null;
    });
  }
  function save() {
    var ok = rowsAll.filter(function (r) { return !r.errs.length; });
    if (!ok.length || !DATA) return;
    var f = $('#hub-form form'), b = $('[data-xi-go]', f); b.disabled = true;
    var biz = DATA.biz, seller = biz ? JSON.parse(JSON.stringify(biz)) : null;
    if (seller) { delete seller.id; delete seller.created; delete seller.updated; }
    var add = 0, upd = 0, ob = 0, partyRoles = {};
    groupsFor(ok).then(function () {
      var jobs = [];
      ok.forEach(function (r) {
        if (r.s === 'ob') { if (r.rec.party) partyRoles[key(r.rec.party)] = { name: r.rec.party, role: r.rec.side === 'pay' ? 'supplier' : 'customer' }; return; }
        var nm = key(r.s === 'item' ? r.rec.desc : r.rec.name), cur = DATA.have[r.s][nm];
        if (cur) { Object.keys(r.rec).forEach(function (k) { if (k === 'ship') cur.ship = Object.assign(cur.ship || {}, r.rec.ship); else cur[k] = r.rec[k]; }); jobs.push([r.s, cur]); upd++; }
        else { var rec = r.rec; if (r.s === 'party' && !rec.role) rec.role = 'customer'; if (r.s === 'item' && !rec.kind) rec.kind = 'goods'; DATA.have[r.s][nm] = rec; jobs.push([r.s, rec]); add++; }
      });
      /* a party named only in Opening balances: add it, or make a customer also a supplier when needed */
      Object.keys(partyRoles).forEach(function (k) {
        var want = partyRoles[k], cur = DATA.have.party[k];
        if (!cur) { cur = DATA.have.party[k] = { name: want.name, role: want.role }; jobs.push(['party', cur]); add++; }
        else if (cur.role && cur.role !== want.role && cur.role !== 'both') { cur.role = 'both'; if (!jobs.some(function (j) { return j[1] === cur; })) jobs.push(['party', cur]); }
      });
      ok.forEach(function (r) {
        if (r.s !== 'ob') return;
        var old = DATA.doc.filter(function (d) { return d.type === 'ob' && d.side === r.rec.side && key(d.seller && d.seller.name) === key(biz.name) && key(d.buyer && d.buyer.name) === key(r.rec.party); })[0];
        var d = Object.assign(old || { type: 'ob', app: 1 }, { date: r.rec.date, seller: seller, buyer: { name: r.rec.party }, side: r.rec.side, amount: r.rec.amount, total: r.rec.amount, no: '' });
        jobs.push(['doc', d]); ob++;
      });
      return jobs.reduce(function (p, j) { return p.then(function () { return NSStore.put(j[0], j[1]); }); }, Promise.resolve());
    }).then(function () {
      $('#hub-form').close();
      NS.toast(t('xi.done', { a: add, u: upd, o: ob }));
      document.dispatchEvent(new CustomEvent('ns-data'));
    }).catch(function (err) { b.disabled = false; NS.toast(t('nosave', { e: err.message }), 'bad'); });
  }

  /* a card in the Backup section too (the masters lists have their own button) */
  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) {
    var x = $('[data-backup-ext]', pane) || pane, c = NS.el('div', { 'class': 'card' });
    c.innerHTML = '<h3>' + esc(t('xi.open')) + '</h3><p class="soft">' + esc(t('xi.p')) + '</p><div class="btns"><button type="button" class="btn" data-xlimp data-ic="up">' + esc(t('xi.open')) + '</button></div>';
    x.insertBefore(c, x.firstChild);
  }]);
  NS.xlImport = { open: open, template: template, parse: parse, isoDate: isoDate };
})();
