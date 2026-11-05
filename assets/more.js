/* Batch 2 screens of the Nivesh Sahayak App (sections added through NSApp, like money.js):
     b2jv     journal entries (adjustments between any accounts, parties included)
     b2fa     fixed assets register: add, sell, depreciation by the Companies Act Schedule II (posted as a journal entry) and the
              Income-tax block of assets (for the return only, never posted)
     b2year   year end: summary, checks, close a year (read-only), carry forward into a new data file
     b2gd     godowns and stock transfer, batches near expiry, serial / IMEI lookup
     b2make   production: bill of materials on the item, production entry (raw material out, finished goods in)
     b2profit profit per bill, item and party, and month-by-month trends
     b2sman   salesman-wise sales and commission
   Logic lives in acctcore.js (NSAcct) and stockcore.js (NSStock); records go to the data home's 'doc' store
   ('jv', 'fa', 'stk' move / make) and item masters ('bom', 'track'). Settings (meta 'settings'): godowns [names],
   salesmen [{ name, rate, basis }], closed { '<business key>': ['2025-26'] }. Printed sheets stay in English. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, B = NSBooks, S = NSStock, X = NSAcct, key = B.key;
  function T(k, v) { return NS.t('b2.' + k, v); }
  function m(v) { return v ? money(v, false) : '—'; }
  function cfg() { return (A.cfg && A.cfg()) || {}; }
  function items() { return A.data().item; }
  function biz() { return A.biz() || {}; }
  function sellerCopy() { var s = JSON.parse(JSON.stringify(biz())); delete s.id; delete s.created; delete s.updated; return s; }
  function today() { return NS.today(); }
  function curFy() { return X.fyOf(today()); }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function download(name, text, type) {
    var a = NS.el('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'text/csv;charset=utf-8' })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function csv(name, rows) { download(name, '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')); }
  function head(title, sub) {
    var b = biz();
    return '<div class="st-hd"><div><b>' + esc(b.name) + '</b>' + (b.gstin ? '<br>GSTIN ' + esc(b.gstin) : '') + '</div><div class="r"><b>' + esc(title) + '</b><br>' + esc(sub) + '</div></div>';
  }
  function foot() { return '<p class="st-ft">Made with Nivesh Sahayak on ' + A.ldate(today()) + '.</p>'; }
  function dates() {
    var r = A.range();
    return '<div class="tools-row"><label>' + esc(A.T('from')) + ' <input type="date" data-stfrom value="' + r[0] + '"></label><label>' + esc(A.T('to')) + ' <input type="date" data-stto value="' + r[1] + '"></label></div>';
  }
  var fySel = '';
  function fyPick(first) {
    var cur = curFy(), list = [], y = first && first < cur ? first : cur;
    for (var n = 0; n < 30 && y <= cur; n++, y = X.nextFy(y)) list.push(y);
    if (!fySel || list.indexOf(fySel) < 0) fySel = cur;
    return '<div class="tools-row"><label>' + esc(T('fy')) + ' <select data-b2fy>' + list.reverse().map(function (f) { return '<option' + (f === fySel ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></label></div>';
  }
  function wireFy(pane) { var s = $('[data-b2fy]', pane); if (s) s.addEventListener('change', function () { fySel = s.value; A.show(); }); }
  function saveCfg(fn) {
    return NSStore.meta('settings').then(function (c) { c = c || {}; fn(c); return NSStore.meta('settings', c); });
  }
  function nextNo(type, pre, date, kind) {
    var fy = NS.fy(date), max = 0;
    A.mine().forEach(function (d) { if (d.type !== type || kind && d.kind !== kind || NS.fy(d.date) !== fy || d.cf) return; var x = String(d.no || '').match(/(\d+)\s*$/); if (x) max = Math.max(max, +x[1]); });
    return pre + '/' + fy.slice(2, 4) + '-' + fy.slice(5) + '/' + String(max + 1).padStart(3, '0');
  }
  function del(id) {
    var d = A.data().doc.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    if (closedMsg(d.date)) { NS.toast(closedMsg(d.date), 'bad'); return; }
    if (!confirm(A.T('cdel', { x: A.enName(d) + ' ' + (d.no || '') }))) return;
    NSStore.del('doc', id).then(function () { NS.toast(A.T('deleted')); A.show(); });
  }
  function closedMsg(iso) { return X.isClosed(cfg().closed, A.bizName(), iso) ? T('closedmsg', { fy: X.fyOf(iso) }) : ''; }
  A.closedMsg = closedMsg;

  /* ---------- a small dialog of its own ---------- */
  var dlg, form, onSave;
  function open(title, html, save, wire) {
    if (!dlg) {
      dlg = NS.el('dialog', { 'class': 'hub-dlg b2-dlg', 'aria-labelledby': 'b2-dlg-t' });
      dlg.innerHTML = '<div class="dlg-hd"><h2 id="b2-dlg-t"></h2><button type="button" class="icon-btn" data-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><form novalidate></form>';
      document.body.appendChild(dlg); form = $('form', dlg);
      $('[data-x]', dlg).addEventListener('click', function () { dlg.close(); });
      form.addEventListener('submit', function (e) { e.preventDefault(); if (onSave) onSave(); });
    }
    $('#b2-dlg-t', dlg).textContent = title;
    form.innerHTML = html + '<div class="dlg-foot btns"><button type="submit" class="btn primary">' + esc(A.T('save')) + '</button><button type="button" class="btn" data-cancel>' + esc(A.T('cancel')) + '</button></div>';
    $('[data-cancel]', form).addEventListener('click', function () { dlg.close(); });
    onSave = save;
    if (wire) wire(form);
    dlg.showModal();
    var f1 = $('input:not([type=hidden]),select', form); if (f1) f1.focus();
  }
  function fld(id, label, html, o) { o = o || {}; return '<div class="f' + (o.wide ? ' wide' : '') + '"' + (o.hidden ? ' hidden' : '') + '><label for="' + id + '">' + esc(label) + '</label>' + html + (o.hint ? '<small class="soft">' + esc(o.hint) + '</small>' : '') + '</div>'; }
  function inp(id, v, o) { o = o || {}; return '<input id="' + id + '" value="' + esc(v == null ? '' : v) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '" dir="ltr"' : ' dir="auto"') + (o.req ? ' required' : '') + (o.list ? ' list="' + o.list + '"' : '') + ' autocomplete="off">'; }
  function sel(id, v, opts) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function val(id) { var e = $('#' + id, form); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : ''; }
  var MODES = ['cash', 'upi', 'cheque', 'bank', 'card', 'other'];
  function modeOpts(credit) { return (credit ? [['credit', A.T('m_credit')]] : []).concat(MODES.map(function (x) { return [x, A.T('m_' + x)]; })); }
  function dl(id, list) { return '<datalist id="' + id + '">' + list.filter(Boolean).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>'; }
  function partyNames() { var o = {}; A.data().party.forEach(function (p) { o[key(p.name)] = p.name; }); A.mine().forEach(function (d) { var n = B.partyName(d); if (n) o[key(n)] = o[key(n)] || n; }); return Object.keys(o).map(function (k) { return o[k]; }).sort(); }
  function itemNames(goods) { return items().filter(function (x) { return !goods || x.kind !== 'service'; }).map(function (x) { return x.desc; }).sort(); }
  function need(ok, f) { if (ok) return true; NS.toast(A.T('need', { f: f }), 'bad'); return false; }
  function lockOk(date, rec) { var msg = closedMsg(date) || rec && closedMsg(rec.date); if (msg) NS.toast(msg, 'bad'); return !msg; }

  /* ---------- journal entries ---------- */
  var ACC = ['party', 'cash', 'bank', 'exp', 'inc', 'cap', 'drw', 'loan', 'given', 'fa', 'sales', 'purchases', 'tdsr', 'tdsp', 'gin-c', 'gin-s', 'gin-i', 'gout-c', 'gout-s', 'gout-i', 'round'];
  var NAMED = { party: 1, exp: 1, inc: 1, cap: 1, drw: 1, loan: 1, given: 1, fa: 1 };
  var FIXED = { cash: 'cash', bank: 'bank', sales: 'sales', purchases: 'purchases', tdsr: 'tds-receivable', tdsp: 'tds-payable', 'gin-c': 'gst-in-cgst', 'gin-s': 'gst-in-sgst', 'gin-i': 'gst-in-igst',
    'gout-c': 'gst-out-cgst', 'gout-s': 'gst-out-sgst', 'gout-i': 'gst-out-igst', round: 'round-off' };
  function acctKey(t, nm) {
    if (t === 'party') return 'party';
    if (FIXED[t]) return FIXED[t];
    if (t === 'cap') return 'cap:' + key(nm || 'Capital');
    if (t === 'drw') return 'drw:' + key(nm || 'Drawings');
    return nm ? t + ':' + key(nm) : '';
  }
  function acctName(l) {
    var t = l.t || Object.keys(FIXED).filter(function (k) { return FIXED[k] === l.a; })[0] || String(l.a || '').split(':')[0];
    return T('ac_' + t) + (l.party || l.nm ? ': ' + (l.party || l.nm) : !FIXED[t] && String(l.a).indexOf(':') > 0 ? ': ' + l.a.split(':')[1] : '');
  }
  function jvTotal(d) { return r2((d.lines || []).reduce(function (s, l) { return s + num(l.dr); }, 0)); }
  A.addSection('b2jv', function () {
    var list = A.mine().filter(function (d) { return d.type === 'jv'; }).filter(A.match).sort(A.byDate);
    return '<div class="pane-hd"><h2>' + esc(T('jv')) + '</h2><div class="quick"><button type="button" class="btn primary" data-b2="jv">+ ' + esc(T('newjv')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('jvh')) + '</p>' + A.searchBar() +
      (list.length ? '<ul class="rows">' + list.map(function (d) {
        return '<li><div class="ln"><b>' + esc(d.no || T('jv1')) + '</b> <span class="soft">' + A.ldate(d.date) + (d.dep ? ' · ' + esc(T('depjv')) : '') + (d.cf ? ' · ' + esc(T('cfjv')) : '') + '</span>' +
          '<span class="soft">' + esc(d.narr || '') + '</span><span class="soft">' + (d.lines || []).map(function (l) { return esc(acctName(l)) + ' ' + (num(l.dr) ? 'Dr ' + money(num(l.dr), false) : 'Cr ' + money(num(l.cr), false)); }).join(' · ') + '</span></div>' +
          '<b class="amt">' + money(jvTotal(d)) + '</b><div class="acts"><button type="button" class="btn sm" data-b2edit="' + d.id + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-b2del="' + d.id + '">' + esc(A.T('del')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="soft">' + esc(T('nojv')) + '</p>') +
      '<details class="card"><summary><b>' + esc(A.T('help')) + '</b></summary><p>' + esc(T('jvhelp')) + '</p></details>';
  }, wireAll);
  function jvForm(rec) {
    var r = rec || { date: today(), narr: '', lines: [{ t: 'party', nm: '', dr: '', cr: '' }, { t: 'cash', nm: '', dr: '', cr: '' }] };
    var L = JSON.parse(JSON.stringify(r.lines)).map(function (l) { if (!l.t) l.t = acctT(l); if (l.party) l.nm = l.party; return l; });
    function lineHtml(l, i) {
      return '<div class="jl" data-jl="' + i + '"><label class="lc"><span>' + esc(T('acct')) + '</span>' + sel('jl-t-' + i, l.t, ACC.map(function (a) { return [a, T('ac_' + a)]; })) + '</label>' +
        '<label class="lc"' + (NAMED[l.t] ? '' : ' hidden') + '><span>' + esc(T(l.t === 'party' ? 'pname' : 'aname')) + '</span>' + inp('jl-n-' + i, l.nm || '', { list: l.t === 'party' ? 'b2-parties' : l.t === 'fa' ? 'b2-assets' : 'b2-heads-' + l.t }) + '</label>' +
        '<label class="lc"><span>Dr</span>' + inp('jl-d-' + i, l.dr || '', { mode: 'decimal' }) + '</label><label class="lc"><span>Cr</span>' + inp('jl-c-' + i, l.cr || '', { mode: 'decimal' }) + '</label>' +
        (L.length > 2 ? '<button type="button" class="icon-btn rm" data-jrm="' + i + '" aria-label="' + esc(A.T('rmline')) + '">✕</button>' : '<span></span>') + '</div>';
    }
    var heads = {}; A.mine().forEach(function (d) { if (d.cat) heads[d.cat] = 1; (d.lines || []).forEach(function (l) { if (l.head) heads[l.head] = 1; if (l.t && l.nm && l.t !== 'party') (heads[l.t + '|' + l.nm] = 1); }); });
    function named(t) { return Object.keys(heads).filter(function (h) { return h.indexOf(t + '|') === 0; }).map(function (h) { return h.split('|')[1]; }); }
    var assets = X.assets(A.data().doc, A.bizName()).map(function (a) { return a.name; });
    function draw() {
      $('[data-jls]', form).innerHTML = L.map(lineHtml).join('');
      $$('[data-jrm]', form).forEach(function (b) { b.addEventListener('click', function () { read(); L.splice(+b.getAttribute('data-jrm'), 1); draw(); }); });
      sum();
    }
    function read() { L.forEach(function (l, i) { l.t = val('jl-t-' + i); l.nm = val('jl-n-' + i); l.dr = val('jl-d-' + i); l.cr = val('jl-c-' + i); }); }
    function sum() {
      read(); var dr = r2(L.reduce(function (s, l) { return s + num(l.dr); }, 0)), cr = r2(L.reduce(function (s, l) { return s + num(l.cr); }, 0));
      var e = $('[data-jsum]', form); e.textContent = 'Dr ' + money(dr) + ' · Cr ' + money(cr) + (dr !== cr ? ' · ' + T('diff', { a: money(Math.abs(dr - cr)) }) : '');
      e.className = 'soft' + (dr !== cr ? ' bad' : '');
    }
    open(T(rec ? 'editjv' : 'newjv'), '<div class="fg">' + fld('jv-date', A.T('date'), inp('jv-date', r.date, { type: 'date', req: 1 })) + fld('jv-no', T('no'), inp('jv-no', r.no || nextNo('jv', 'JV', r.date), { mode: 'text' })) +
      fld('jv-narr', T('narr'), inp('jv-narr', r.narr || ''), { wide: 1 }) + '</div>' +
      '<fieldset><legend>' + esc(T('lines')) + '</legend><div data-jls></div><button type="button" class="btn sm" data-jadd>' + esc(A.T('addline')) + '</button> <p data-jsum aria-live="polite"></p></fieldset>' +
      dl('b2-parties', partyNames()) + dl('b2-assets', assets) + ['exp', 'inc', 'loan', 'given', 'cap', 'drw'].map(function (t) { return dl('b2-heads-' + t, named(t)); }).join(''),
    function () {
      read();
      var date = val('jv-date'), lines = L.filter(function (l) { return num(l.dr) || num(l.cr); });
      if (!need(date, A.T('date')) || !lockOk(date, rec)) return;
      var dr = r2(lines.reduce(function (s, l) { return s + num(l.dr); }, 0)), cr = r2(lines.reduce(function (s, l) { return s + num(l.cr); }, 0));
      if (lines.length < 2 || !dr || dr !== cr) { NS.toast(T('unbal'), 'bad'); return; }
      var bad = lines.filter(function (l) { return NAMED[l.t] && l.t !== 'cap' && l.t !== 'drw' && !l.nm; })[0];
      if (bad) { NS.toast(A.T('need', { f: T(bad.t === 'party' ? 'pname' : 'aname') }), 'bad'); return; }
      var P = A.data().party;
      var out = lines.map(function (l) {
        var o = { t: l.t, nm: l.nm, a: acctKey(l.t, l.nm), dr: r2(num(l.dr)), cr: r2(num(l.cr)) };
        if (l.t === 'party') { var pm = P.filter(function (p) { return key(p.name) === key(l.nm); })[0]; o.party = l.nm; o.side = pm && pm.role === 'supplier' ? 'pay' : 'recv'; }
        return o;
      });
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'jv', app: 1 }, { date: date, no: val('jv-no'), narr: val('jv-narr'), seller: sellerCopy(), lines: out });
      d.total = dr;
      NSStore.put('doc', d).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      draw();
      form.addEventListener('change', function (e) { var m2 = /^jl-t-(\d+)$/.exec(e.target.id); if (m2) { read(); draw(); } else sum(); });
      form.addEventListener('input', function (e) { if (/^jl-[dc]-/.test(e.target.id)) sum(); });
      $('[data-jadd]', form).addEventListener('click', function () { read(); L.push({ t: 'exp', nm: '', dr: '', cr: '' }); draw(); });
    });
  }
  function acctT(l) {
    if (l.a === 'party') return 'party';
    var f = Object.keys(FIXED).filter(function (k) { return FIXED[k] === l.a; })[0]; if (f) return f;
    var p = String(l.a || '').split(':'); if (p.length > 1) { l.nm = l.nm || p[1].replace(/^./, function (c) { return c.toUpperCase(); }); return p[0]; }
    return 'exp';
  }

  /* ---------- fixed assets ---------- */
  var KIND_ORDER = ['bldg_off', 'bldg_fac', 'bldg_res', 'pm', 'furn', 'elec', 'office', 'comp', 'server', 'car', 'bike', 'truck', 'other'];
  A.addSection('b2fa', function () {
    var D = A.data().doc, all = X.assets(D, A.bizName()), first = all.length ? X.fyOf(all[0].date) : '';
    var picker = fyPick(first), fy = fySel, R = X.register(D, A.bizName(), fy), TB = X.taxBlocks(D, A.bizName(), fy);
    return '<div class="pane-hd"><h2>' + esc(T('fa')) + '</h2><div class="quick"><button type="button" class="btn primary" data-b2="fa">+ ' + esc(T('newfa')) + '</button>' +
        (R.rows.length ? '<button type="button" class="btn" data-b2print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-b2csv="fa">' + esc(A.T('csv')) + '</button>' : '') + '</div></div>' +
      '<p class="soft">' + esc(T('fah')) + '</p>' + picker +
      (R.post.length ? '<div class="card warn-card"><p>' + esc(T('todo', { a: money(R.tot.todo), fy: fy })) + '</p><button type="button" class="btn primary" data-b2post>' + esc(T('post', { fy: fy })) + '</button></div>' : '') +
      (R.rows.length ? '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet wide" data-sheet>' + head('Fixed Assets Register', 'FY ' + fy + ' · Companies Act 2013, Schedule II') +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Asset</th><th>Put to use</th><th>Method</th><th class="n">Opening</th><th class="n">Added</th><th class="n">Depreciation</th><th class="n">Sold (book value)</th><th class="n">Closing</th><th class="acts"></th></tr></thead><tbody>' +
        R.rows.map(function (r) {
          var a = r.a;
          return '<tr><th scope="row">' + esc(a.name) + '<br><small class="soft">' + esc(T('k_' + a.cat)) + '</small></th><td>' + A.ldate(a.date) + '</td><td>' + (a.method === 'slm' ? 'SLM' : 'WDV') + ' · ' + a.life + ' yr</td>' +
            '<td class="n">' + m(r.open) + '</td><td class="n">' + m(r.add) + '</td><td class="n">' + m(r.dep) + (r.todo > 0.004 ? ' <small class="np">(' + esc(T('notposted')) + ')</small>' : '') + '</td><td class="n">' + m(r.sold) + '</td><td class="n">' + m(r.close) + '</td>' +
            '<td class="acts">' + (a.sale ? '<span class="pill">' + esc(T('soldon', { d: A.ldate(a.sale.date) })) + '</span>' : '<button type="button" class="btn sm" data-b2sell="' + a.id + '">' + esc(T('sell')) + '</button>') +
            '<button type="button" class="btn sm" data-b2fa="' + a.id + '">' + esc(A.T('edit')) + '</button></td></tr>';
        }).join('') + '</tbody><tfoot><tr><th>Total</th><th></th><th></th><th class="n">' + m(R.tot.open) + '</th><th class="n">' + m(R.tot.add) + '</th><th class="n">' + m(R.tot.dep) + '</th><th class="n">' + m(R.tot.sold) + '</th><th class="n">' + m(R.tot.close) + '</th><th></th></tr></tfoot></table></div>' + foot() + '</div></div>'
        : '<p class="soft">' + esc(T('nofa')) + '</p>') +
      (TB.length ? '<div class="card"><h3>' + esc(T('itblock', { fy: fy })) + '</h3><p class="soft">' + esc(T('itblockh')) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="n">' + esc(T('rate')) + '</th><th class="n">' + esc(T('openwdv')) + '</th><th class="n">' + esc(T('addfull')) + '</th><th class="n">' + esc(T('addhalf')) + '</th><th class="n">' + esc(T('sales')) + '</th><th class="n">' + esc(T('dep')) + '</th><th class="n">' + esc(T('closewdv')) + '</th></tr></thead><tbody>' +
        TB.map(function (b) { return '<tr><td class="n">' + b.rate + '%</td><td class="n">' + m(b.open) + '</td><td class="n">' + m(b.addFull) + '</td><td class="n">' + m(b.addHalf) + '</td><td class="n">' + m(b.sales) + '</td><td class="n">' + m(b.dep) + (b.gain ? ' <span class="pill warn">' + esc(T('gain', { a: money(b.gain) })) + '</span>' : '') + '</td><td class="n">' + m(b.close) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>' : '') +
      '<details class="card"><summary><b>' + esc(T('farules')) + '</b></summary><p>' + esc(T('farule1')) + '</p><p>' + esc(T('farule2')) + '</p><p>' + esc(T('farule3')) + '</p></details>';
  }, wireAll);
  function faForm(rec) {
    var r = rec || { date: today(), cat: 'comp', method: 'wdv', mode: 'bank', itc: true, resid: 5 }, k = X.KINDS[r.cat] || X.KINDS.other;
    open(T(rec ? 'editfa' : 'newfa'), '<div class="fg">' + fld('fa-name', T('faname'), inp('fa-name', r.name || '', { req: 1 }), { wide: 1 }) +
      fld('fa-cat', T('fakind'), sel('fa-cat', r.cat, KIND_ORDER.map(function (c) { return [c, T('k_' + c)]; }))) +
      fld('fa-date', T('putuse'), inp('fa-date', r.date, { type: 'date', req: 1 })) +
      fld('fa-amt', T('cost'), inp('fa-amt', r.amount || '', { mode: 'decimal', req: 1 }), { hint: T('costh') }) +
      fld('fa-gst', T('gstamt'), inp('fa-gst', r.gstAmt || '', { mode: 'decimal' })) +
      '<div class="f"><label class="chk"><input type="checkbox" id="fa-itc"' + (r.itc ? ' checked' : '') + '> ' + esc(T('itc')) + '</label><label class="chk"><input type="checkbox" id="fa-inter"' + (r.inter ? ' checked' : '') + '> ' + esc(T('inter')) + '</label></div>' +
      fld('fa-mode', T('paidby'), sel('fa-mode', r.mode, modeOpts(true))) +
      fld('fa-party', T('supplier'), inp('fa-party', r.buyer && r.buyer.name || '', { list: 'b2-parties' })) + fld('fa-no', T('billno'), inp('fa-no', r.no || '', { mode: 'text' })) +
      fld('fa-method', T('method'), sel('fa-method', r.method, [['wdv', T('wdv')], ['slm', T('slm')]])) +
      fld('fa-life', T('life'), inp('fa-life', r.life || k[0], { mode: 'decimal' }), { hint: T('lifeh') }) +
      fld('fa-resid', T('resid'), inp('fa-resid', r.resid == null ? 5 : r.resid, { mode: 'decimal' }), { hint: T('residh') }) +
      fld('fa-it', T('itrate'), inp('fa-it', r.itRate == null || r.itRate === '' ? k[1] : r.itRate, { mode: 'decimal' }), { hint: T('itrateh') }) + '</div>' +
      dl('b2-parties', partyNames()) + (rec ? '<p><button type="button" class="link" data-fadel>' + esc(A.T('del')) + '</button></p>' : ''),
    function () {
      var date = val('fa-date'), name = val('fa-name'), amt = r2(num(val('fa-amt'))), mode = val('fa-mode'), party = val('fa-party');
      if (!need(name, T('faname')) || !need(date, T('putuse')) || !need(amt > 0, T('cost')) || !lockOk(date, rec)) return;
      if (mode === 'credit' && !need(party, T('supplier'))) return;
      var dup = X.assets(A.data().doc, A.bizName()).filter(function (a) { return key(a.name) === key(name) && (!rec || a.id !== rec.id); })[0];
      if (dup) { NS.toast(T('fadup', { n: name }), 'bad'); return; }
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'fa', kind: 'buy', app: 1 }, { name: name, cat: val('fa-cat'), date: date, amount: amt, gstAmt: r2(num(val('fa-gst'))), itc: val('fa-itc'), inter: val('fa-inter'),
        mode: mode, buyer: { name: party }, no: val('fa-no'), method: val('fa-method'), life: num(val('fa-life')), resid: num(val('fa-resid')), itRate: num(val('fa-it')), seller: sellerCopy() });
      d.total = r2(amt + d.gstAmt);
      NSStore.put('doc', d).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      $('#fa-cat', form).addEventListener('change', function () { var kk = X.KINDS[val('fa-cat')]; $('#fa-life', form).value = kk[0]; $('#fa-it', form).value = kk[1]; });
      var dbtn = $('[data-fadel]', form); if (dbtn) dbtn.addEventListener('click', function () {
        var sold = A.data().doc.filter(function (x) { return x.type === 'fa' && x.kind === 'sale' && x.asset === rec.id; })[0];
        if (sold) { NS.toast(T('fasold'), 'bad'); return; }
        dlg.close(); del(rec.id);
      });
    });
  }
  function sellForm(a) {
    var sale = a.sale || { date: today(), mode: 'bank' };
    open(T('sellt', { n: a.name }), '<div class="fg">' + fld('fs-date', A.T('date'), inp('fs-date', sale.date, { type: 'date', req: 1 })) +
      fld('fs-amt', T('saleprice'), inp('fs-amt', sale.amount || '', { mode: 'decimal', req: 1 })) + fld('fs-gst', T('salegst'), inp('fs-gst', sale.gstAmt || '', { mode: 'decimal' }), { hint: T('salegsth') }) +
      fld('fs-mode', T('recdby'), sel('fs-mode', sale.mode, modeOpts(true))) + fld('fs-party', T('buyer'), inp('fs-party', sale.buyer && sale.buyer.name || '', { list: 'b2-parties' })) +
      '</div><p class="soft" data-bv aria-live="polite"></p>' + dl('b2-parties', partyNames()),
    function () {
      var date = val('fs-date'), amt = r2(num(val('fs-amt'))), mode = val('fs-mode'), party = val('fs-party');
      if (!need(date, A.T('date')) || !lockOk(date, a.sale) || date < a.date) return;
      if (mode === 'credit' && !need(party, T('buyer'))) return;
      var d = Object.assign(a.sale ? JSON.parse(JSON.stringify(a.sale)) : { type: 'fa', kind: 'sale', app: 1 }, { asset: a.id, name: a.name, date: date, amount: amt, gstAmt: r2(num(val('fs-gst'))), mode: mode, buyer: { name: party }, bv: X.bookValueOn(a, date), seller: sellerCopy(), no: '' });
      d.total = r2(amt + d.gstAmt);
      NSStore.put('doc', d).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      function bv() { var dt = val('fs-date'); $('[data-bv]', form).textContent = dt && dt >= a.date ? T('bvon', { a: money(X.bookValueOn(a, dt)), d: A.ldate(dt) }) : ''; }
      $('#fs-date', form).addEventListener('change', bv); bv();
    });
  }
  function postDep(fy) {
    var R = X.register(A.data().doc, A.bizName(), fy), date = X.fyEnd(fy) > today() ? today() : X.fyEnd(fy);
    if (!R.post.length || !lockOk(date)) return;
    if (!confirm(T('postq', { a: money(R.tot.todo), fy: fy }))) return;
    var d = { type: 'jv', app: 1, dep: fy, date: date, no: nextNo('jv', 'JV', date), narr: 'Depreciation for FY ' + fy + ' (Companies Act 2013, Schedule II)', seller: sellerCopy(), lines: R.post.map(function (l) { return { a: l.a, dr: l.dr, cr: l.cr }; }) };
    d.total = jvTotal(d);
    NSStore.put('doc', d).then(function () { NS.toast(A.T('saved')); A.show(); });
  }

  /* ---------- year end ---------- */
  A.addSection('b2year', function () {
    var D = A.data().doc, first = A.mine().reduce(function (f, d) { return d.date && (!f || d.date < f) ? d.date : f; }, '');
    var picker = fyPick(first ? X.fyOf(first) : ''), fy = fySel, Y = X.yearSummary(D, items(), A.bizName(), fy), closed = X.isClosed(cfg().closed, A.bizName(), X.fyStart(fy));
    var tiles = [['sales', Y.pl.rev], ['gp', Y.pl.gross], ['np', Y.pl.profit], ['cash', Y.cash], ['bank', Y.bank], ['recv', Y.recv], ['pay', Y.pay], ['stock', Y.stock.value]];
    return '<div class="pane-hd"><h2>' + esc(T('year')) + '</h2>' + (closed ? '<span class="pill ok">' + esc(T('isclosed')) + '</span>' : '') + '</div><p class="soft">' + esc(T('yearh')) + '</p>' + picker +
      '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet" data-sheet>' + head('Year-end summary', 'FY ' + fy + ' (' + A.ldate(Y.from) + ' to ' + A.ldate(Y.to) + ')') +
      '<div class="tiles">' + tiles.map(function (x) { return '<div class="tile' + (x[1] < 0 ? ' neg' : '') + '"><span>' + esc(T('y_' + x[0])) + '</span><b>' + money(x[1]) + '</b></div>'; }).join('') + '</div>' + foot() + '</div></div>' +
      '<div class="card"><h3>' + esc(T('checks')) + '</h3>' + (Y.checks.length ? '<ul>' + Y.checks.map(function (c) {
        return '<li>' + esc(T('ck_' + c[0], { n: c[0] === 'dep' || c[0] === 'diff' ? money(Math.abs(c[1])) : c[1] })) + (c[0] === 'dep' ? ' <a href="#b2fa">' + esc(T('fa')) + ' ›</a>' : c[0] === 'neg' ? ' <a href="#b2gd">' + esc(T('gd')) + ' ›</a>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('ck_ok')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('nextyear', { fy: X.nextFy(fy) })) + '</h3><p>' + esc(T('carryh')) + '</p><p>' + esc(T('numh')) + '</p></div>' +
      '<div class="card"><h3>' + esc(T('closet')) + '</h3><p>' + esc(T(closed ? 'reopenh' : 'closeh')) + '</p><div class="quick">' +
        '<button type="button" class="btn' + (closed ? '' : ' primary') + '" data-b2close="' + fy + '">' + esc(T(closed ? 'reopen' : 'close', { fy: fy })) + '</button>' +
        '<button type="button" class="btn" data-b2print>' + esc(A.T('print')) + '</button></div></div>' +
      '<div class="card"><h3>' + esc(T('newfile')) + '</h3><p>' + esc(T('newfileh')) + '</p><button type="button" class="btn" data-b2cf="' + fy + '">' + esc(T('cfdl', { fy: X.nextFy(fy) })) + '</button></div>';
  }, wireAll);
  function toggleClose(fy) {
    var b = key(A.bizName()), shut = X.isClosed(cfg().closed, A.bizName(), X.fyStart(fy));
    if (!confirm(T(shut ? 'reopenq' : 'closeq', { fy: fy }))) return;
    saveCfg(function (c) {
      c.closed = c.closed || {}; var l = c.closed[b] = c.closed[b] || [];
      if (shut) c.closed[b] = l.filter(function (x) { return x !== fy; }); else if (l.indexOf(fy) < 0) l.push(fy);
    }).then(function () { NS.toast(T(shut ? 'reopened' : 'closed', { fy: fy })); A.show(); });
  }
  function carry(fy) {
    var C = A.data(), recs = X.carryForward(C.doc, C.item, A.bizName(), fy, sellerCopy()), now = Date.now();
    recs.forEach(function (r) { r.created = r.updated = now; });
    var strip = function (l) { return JSON.parse(JSON.stringify(l)); };
    var file = { app: 'Nivesh Sahayak', kind: 'backup', version: 1, saved: new Date().toISOString(), note: 'Opening balances for FY ' + X.nextFy(fy) + ' carried forward from FY ' + fy,
      data: { biz: strip(C.biz.filter(function (b) { return b.id === biz().id; })), party: strip(C.party), item: strip(C.item), doc: recs } };
    download('nivesh-sahayak-opening-' + X.nextFy(fy) + '.json', JSON.stringify(file, null, 1), 'application/json');
    NS.toast(T('cfdone', { n: recs.length }));
  }

  /* ---------- godowns and stock transfer ---------- */
  function gdNames() { var o = {}; (cfg().godowns || []).forEach(function (g) { if (g) o[key(g)] = g; }); A.mine().forEach(function (d) { [d.gd, d.from, d.to].forEach(function (g) { if (g) o[key(g)] = o[key(g)] || g; }); }); return Object.keys(o).map(function (k) { return o[k]; }).filter(function (g) { return key(g) !== S.MAIN; }).sort(); }
  function gdLabel(g) { return g ? g : T('main'); }
  var gdView = '';
  A.addSection('b2gd', function () {
    var D = A.data().doc, I = items(), G = S.godowns(D, I, A.bizName(), today(), gdNames()), exp = S.expiring(D, I, A.bizName(), today(), 60);
    var cur = G.filter(function (g) { return key(g.g || S.MAIN) === key(gdView || S.MAIN); })[0] || G[0];
    var moves = A.mine().filter(function (d) { return d.type === 'stk' && d.kind === 'move'; }).sort(A.byDate).slice(0, 30);
    return '<div class="pane-hd"><h2>' + esc(T('gd')) + '</h2><div class="quick"><button type="button" class="btn primary" data-b2="move">+ ' + esc(T('newmove')) + '</button><a class="btn" href="' + A.myUrl('#settings') + '">' + esc(T('managegd')) + '</a></div></div>' +
      '<p class="soft">' + esc(T('gdh')) + '</p>' +
      '<div class="tiles">' + G.map(function (g) { return '<button type="button" class="tile" data-b2gdv="' + esc(g.g) + '" aria-pressed="' + (g === cur) + '"><span>' + esc(gdLabel(g.g)) + '</span><b>' + money(g.value) + '</b><small class="soft">' + esc(T('nitems', { n: g.n })) + '</small></button>'; }).join('') + '</div>' +
      (cur ? '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet" data-sheet>' + head('Stock in ' + gdLabel(cur.g), 'As on ' + A.ldate(today())) + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="n">In hand</th><th class="n">Value</th></tr></thead><tbody>' +
        (cur.items.filter(function (s) { return s.close; }).map(function (s) { return '<tr><th scope="row">' + esc(s.name) + '</th><td class="n' + (s.close < 0 ? ' neg' : '') + '">' + NS.qty(s.close) + ' ' + esc(s.unit) + '</td><td class="n">' + m(s.value) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="soft">' + esc(T('empty')) + '</td></tr>') +
        '</tbody></table></div>' + foot() + '</div></div>' : '') +
      '<div class="card"><h3>' + esc(T('moves')) + '</h3>' + (moves.length ? '<ul class="rows">' + moves.map(function (d) {
        return '<li><div class="ln"><b>' + esc(d.no || T('move1')) + '</b> <span class="soft">' + A.ldate(d.date) + ' · ' + esc(gdLabel(d.from)) + ' → ' + esc(gdLabel(d.to)) + '</span><span class="soft">' + (d.lines || []).map(function (l) { return esc(l.desc) + ' ' + NS.qty(num(l.qty)); }).join(', ') + '</span></div>' +
          '<div class="acts"><button type="button" class="btn sm" data-b2move="' + d.id + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-b2del="' + d.id + '">' + esc(A.T('del')) + '</button></div></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('nomoves')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('expiry')) + '</h3>' + (exp.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(A.T('item')) + '</th><th>' + esc(T('batch')) + '</th><th>' + esc(T('expm')) + '</th><th class="n">' + esc(A.T('qty')) + '</th></tr></thead><tbody>' +
        exp.map(function (b) { return '<tr><th scope="row">' + esc(b.name) + '</th><td class="mono">' + esc(b.batch || '—') + '</td><td>' + esc(b.exp) + ' ' + (b.gone ? '<span class="pill bad">' + esc(T('expired')) + '</span>' : '<span class="pill warn">' + esc(T('soon')) + '</span>') + '</td><td class="n">' + NS.qty(b.qty) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="soft">' + esc(T('noexp')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('snfind')) + '</h3><div class="tools-row"><input type="search" data-b2sn placeholder="' + esc(T('snph')) + '" aria-label="' + esc(T('snfind')) + '" dir="ltr"></div><p data-b2snout aria-live="polite"></p></div>';
  }, wireAll);
  function gdOpts(v) { return [['', T('main')]].concat(gdNames().map(function (g) { return [g, g]; })).concat([['+', T('newgd')]]).map(function (o) { return o; }); }
  function moveForm(rec) {
    var r = rec || { date: today(), from: '', to: gdNames()[0] || '', lines: [{ desc: '', qty: '', batch: '' }] }, L = JSON.parse(JSON.stringify(r.lines));
    function draw() {
      $('[data-mls]', form).innerHTML = L.map(function (l, i) {
        return '<div class="jl"><label class="lc"><span>' + esc(A.T('item')) + '</span>' + inp('ml-d-' + i, l.desc, { list: 'b2-items' }) + '</label><label class="lc"><span>' + esc(A.T('qty')) + '</span>' + inp('ml-q-' + i, l.qty, { mode: 'decimal' }) + '</label>' +
          '<label class="lc"><span>' + esc(T('batch')) + '</span>' + inp('ml-b-' + i, l.batch || '', { mode: 'text' }) + '</label>' + (L.length > 1 ? '<button type="button" class="icon-btn rm" data-mrm="' + i + '" aria-label="' + esc(A.T('rmline')) + '">✕</button>' : '<span></span>') + '</div>'; }).join('');
      $$('[data-mrm]', form).forEach(function (b) { b.addEventListener('click', function () { read(); L.splice(+b.getAttribute('data-mrm'), 1); draw(); }); });
      have();
    }
    function read() { L.forEach(function (l, i) { l.desc = val('ml-d-' + i); l.qty = val('ml-q-' + i); l.batch = val('ml-b-' + i); }); }
    function gdVal(id) { var v = val(id); return v === '+' ? val(id + 'n') : v; }
    function have() {
      read(); var H = S.inHand(A.data().doc.filter(function (d) { return !rec || d.id !== rec.id; }), items(), A.bizName(), val('mv-date') || today(), gdVal('mv-from') || S.MAIN);
      $('[data-mhave]', form).textContent = L.filter(function (l) { return l.desc; }).map(function (l) { return l.desc + ': ' + T('inhand', { n: NS.qty(H[key(l.desc)] || 0) }); }).join(' · ');
    }
    open(T(rec ? 'editmove' : 'newmove'), '<div class="fg">' + fld('mv-date', A.T('date'), inp('mv-date', r.date, { type: 'date', req: 1 })) + fld('mv-no', T('no'), inp('mv-no', r.no || nextNo('stk', 'ST', r.date, 'move'), { mode: 'text' })) +
      fld('mv-from', T('from'), sel('mv-from', r.from, gdOpts())) + fld('mv-fromn', T('newgdn'), inp('mv-fromn', ''), { hidden: 1 }) +
      fld('mv-to', T('to'), sel('mv-to', r.to, gdOpts())) + fld('mv-ton', T('newgdn'), inp('mv-ton', ''), { hidden: 1 }) + '</div>' +
      '<fieldset><legend>' + esc(A.T('items')) + '</legend><div data-mls></div><button type="button" class="btn sm" data-madd>' + esc(A.T('addline')) + '</button><p class="soft" data-mhave aria-live="polite"></p></fieldset>' + dl('b2-items', itemNames(true)),
    function () {
      read();
      var date = val('mv-date'), from = gdVal('mv-from'), to = gdVal('mv-to'), lines = L.filter(function (l) { return l.desc && num(l.qty) > 0; });
      if (!need(date, A.T('date')) || !lockOk(date, rec)) return;
      if (key(from || S.MAIN) === key(to || S.MAIN)) { NS.toast(T('samegd'), 'bad'); return; }
      if (!need(lines.length, A.T('items'))) return;
      var H = S.inHand(A.data().doc.filter(function (d) { return !rec || d.id !== rec.id; }), items(), A.bizName(), date, from || S.MAIN);
      var short = lines.filter(function (l) { return num(l.qty) > (H[key(l.desc)] || 0) + 0.0005; });
      if (short.length && !confirm(T('shortq', { l: short.map(function (l) { return l.desc; }).join(', ') }))) return;
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'move', app: 1 }, { date: date, no: val('mv-no'), from: from, to: to, seller: sellerCopy(),
        lines: lines.map(function (l) { var mm = items().filter(function (x) { return key(x.desc) === key(l.desc); })[0]; return { desc: l.desc, qty: num(l.qty), unit: mm && mm.unit || '', batch: l.batch }; }) });
      var add = [from, to].filter(function (g) { return g && gdNames().map(key).indexOf(key(g)) < 0; });
      (add.length ? saveCfg(function (c) { c.godowns = (c.godowns || []).concat(add); }) : Promise.resolve()).then(function () { return NSStore.put('doc', d); }).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      draw();
      ['mv-from', 'mv-to'].forEach(function (id) { $('#' + id, form).addEventListener('change', function () { $('#' + id + 'n', form).closest('.f').hidden = val(id) !== '+'; have(); }); });
      form.addEventListener('change', function (e) { if (/^ml-|mv-date/.test(e.target.id)) have(); });
      $('[data-madd]', form).addEventListener('click', function () { read(); L.push({ desc: '', qty: '', batch: '' }); draw(); });
    });
  }

  /* ---------- production (bill of materials) ---------- */
  A.addSection('b2make', function () {
    var withBom = items().filter(function (x) { return x.bom && (x.bom.lines || []).length; }).sort(function (a, b) { return a.desc.localeCompare(b.desc); });
    var made = A.mine().filter(function (d) { return d.type === 'stk' && d.kind === 'make'; }).filter(A.match).sort(A.byDate).slice(0, 40);
    return '<div class="pane-hd"><h2>' + esc(T('make')) + '</h2><div class="quick"><button type="button" class="btn primary" data-b2="make">+ ' + esc(T('newmake')) + '</button><button type="button" class="btn" data-b2="bom">+ ' + esc(T('newbom')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('makeh')) + '</p>' +
      '<div class="card"><h3>' + esc(T('boms')) + '</h3>' + (withBom.length ? '<ul class="rows">' + withBom.map(function (x) {
        return '<li><div class="ln"><b>' + esc(x.desc) + '</b><span class="soft">' + esc(T('bomper', { n: NS.qty(num(x.bom.per) || 1), u: x.unit || '' })) + ': ' + x.bom.lines.map(function (l) { return esc(l.desc) + ' ' + NS.qty(num(l.qty)) + (l.unit ? ' ' + esc(l.unit) : ''); }).join(', ') + '</span></div>' +
          '<div class="acts"><button type="button" class="btn sm" data-b2make="' + esc(x.desc) + '">' + esc(T('makeit')) + '</button><button type="button" class="btn sm" data-b2bom="' + esc(x.id) + '">' + esc(A.T('edit')) + '</button></div></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('nobom')) + '</p>') + '</div>' +
      '<div class="card"><h3>' + esc(T('made')) + '</h3>' + (made.length ? '<ul class="rows">' + made.map(function (d) {
        var o = d.out || {};
        return '<li><div class="ln"><b>' + esc(o.desc) + ' × ' + NS.qty(num(o.qty)) + '</b> <span class="soft">' + A.ldate(d.date) + ' · ' + esc(d.no || '') + (d.gd ? ' · ' + esc(d.gd) : '') + '</span><span class="soft">' + esc(T('costpu', { a: money(num(o.rate)) })) + '</span></div>' +
          '<div class="acts"><button type="button" class="btn sm" data-b2mk="' + d.id + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-b2del="' + d.id + '">' + esc(A.T('del')) + '</button></div></li>'; }).join('') + '</ul>' : '<p class="soft">' + esc(T('nomade')) + '</p>') + '</div>';
  }, wireAll);
  function linesEditor(L, pre) {
    return L.map(function (l, i) {
      return '<div class="jl"><label class="lc"><span>' + esc(T('raw')) + '</span>' + inp(pre + 'd-' + i, l.desc, { list: 'b2-items' }) + '</label><label class="lc"><span>' + esc(A.T('qty')) + '</span>' + inp(pre + 'q-' + i, l.qty, { mode: 'decimal' }) + '</label>' +
        '<label class="lc"><span>' + esc(T('unit')) + '</span>' + inp(pre + 'u-' + i, l.unit || '', { mode: 'text' }) + '</label>' + (L.length > 1 ? '<button type="button" class="icon-btn rm" data-rrm="' + i + '" aria-label="' + esc(A.T('rmline')) + '">✕</button>' : '<span></span>') + '</div>';
    }).join('');
  }
  function readLines(L, pre) { L.forEach(function (l, i) { l.desc = val(pre + 'd-' + i); l.qty = val(pre + 'q-' + i); l.unit = val(pre + 'u-' + i); }); }
  function bomForm(it) {
    var r = it || {}, b = r.bom || { per: 1, lines: [{ desc: '', qty: '', unit: '' }] }, L = JSON.parse(JSON.stringify(b.lines));
    function draw() { $('[data-rls]', form).innerHTML = linesEditor(L, 'bl-'); $$('[data-rrm]', form).forEach(function (x) { x.addEventListener('click', function () { readLines(L, 'bl-'); L.splice(+x.getAttribute('data-rrm'), 1); draw(); }); }); }
    open(T('bomt'), '<div class="fg">' + fld('bm-item', T('fin'), inp('bm-item', r.desc || '', { req: 1, list: 'b2-items' }), { wide: 1 }) + fld('bm-per', T('per'), inp('bm-per', b.per || 1, { mode: 'decimal' }), { hint: T('perh') }) + '</div>' +
      '<fieldset><legend>' + esc(T('rawlist')) + '</legend><div data-rls></div><button type="button" class="btn sm" data-radd>' + esc(A.T('addline')) + '</button></fieldset>' + dl('b2-items', itemNames(true)),
    function () {
      readLines(L, 'bl-');
      var nm = val('bm-item'), lines = L.filter(function (l) { return l.desc && num(l.qty) > 0; }).map(function (l) { return { desc: l.desc, qty: num(l.qty), unit: l.unit }; });
      if (!need(nm, T('fin')) || !need(lines.length, T('rawlist'))) return;
      if (lines.some(function (l) { return key(l.desc) === key(nm); })) { NS.toast(T('selfbom'), 'bad'); return; }
      var hit = items().filter(function (x) { return key(x.desc) === key(nm); })[0];
      var rec = Object.assign(hit ? JSON.parse(JSON.stringify(hit)) : { desc: nm, kind: 'goods', unit: 'Nos', rate: '', gst: 18 }, { bom: { per: num(val('bm-per')) || 1, lines: lines } });
      var jobs = [NSStore.put('item', rec)];
      lines.forEach(function (l) { if (!items().some(function (x) { return key(x.desc) === key(l.desc); })) jobs.push(NSStore.put('item', { desc: l.desc, kind: 'goods', unit: l.unit || 'Nos', rate: '', gst: 18 })); });
      Promise.all(jobs).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () { draw(); $('[data-radd]', form).addEventListener('click', function () { readLines(L, 'bl-'); L.push({ desc: '', qty: '', unit: '' }); draw(); }); });
  }
  function makeForm(rec, itemName) {
    var r = rec || { date: today(), gd: '', out: { desc: itemName || '', qty: '', batch: '', exp: '' }, lines: [], extra: '' }, L = JSON.parse(JSON.stringify(r.lines.length ? r.lines : [{ desc: '', qty: '', unit: '' }]));
    function bomOf(nm) { var x = items().filter(function (i) { return key(i.desc) === key(nm); })[0]; return x && x.bom; }
    function fromBom() {
      var b = bomOf(val('mk-item')), q = num(val('mk-qty')); if (!b || !q) return;
      L = b.lines.map(function (l) { return { desc: l.desc, qty: String(Math.round(num(l.qty) * q / (num(b.per) || 1) * 1000) / 1000), unit: l.unit || '' }; }); draw();
    }
    function draw() { $('[data-rls]', form).innerHTML = linesEditor(L, 'ml2-'); $$('[data-rrm]', form).forEach(function (x) { x.addEventListener('click', function () { readLines(L, 'ml2-'); L.splice(+x.getAttribute('data-rrm'), 1); draw(); }); }); cost(); }
    function others() { return A.data().doc.filter(function (d) { return !rec || d.id !== rec.id; }); }
    function cost() {
      readLines(L, 'ml2-');
      var c = S.makeCost(others(), items(), A.bizName(), L.filter(function (l) { return l.desc; }), val('mk-date') || today()), q = num(val('mk-qty')), ex = num(val('mk-extra'));
      var H = S.inHand(others(), items(), A.bizName(), val('mk-date') || today(), val('mk-gd') || S.MAIN);
      var short = L.filter(function (l) { return l.desc && num(l.qty) > (H[key(l.desc)] || 0) + 0.0005; }).map(function (l) { return l.desc; });
      var tot = r2(c.total + ex);
      $('[data-mcost]', form).innerHTML = esc(T('mcost', { r: money(c.total), e: money(ex), t: money(tot) })) + (q ? ' · <b>' + esc(T('costpu', { a: money(r2(tot / q)) })) + '</b>' : '') +
        (short.length ? '<br><span class="bad">' + esc(T('short', { l: short.join(', ') })) + '</span>' : '');
      return { total: tot, short: short };
    }
    open(T(rec ? 'editmake' : 'newmake'), '<div class="fg">' + fld('mk-date', A.T('date'), inp('mk-date', r.date, { type: 'date', req: 1 })) + fld('mk-no', T('no'), inp('mk-no', r.no || nextNo('stk', 'PRD', r.date, 'make'), { mode: 'text' })) +
      fld('mk-item', T('fin'), inp('mk-item', r.out.desc, { req: 1, list: 'b2-items' })) + fld('mk-qty', T('mkqty'), inp('mk-qty', r.out.qty, { mode: 'decimal', req: 1 })) +
      fld('mk-gd', T('gd1'), sel('mk-gd', r.gd || '', [['', T('main')]].concat(gdNames().map(function (g) { return [g, g]; })))) +
      fld('mk-extra', T('extra'), inp('mk-extra', r.extra || '', { mode: 'decimal' }), { hint: T('extrah') }) +
      fld('mk-batch', T('batch'), inp('mk-batch', r.out.batch || '', { mode: 'text' })) + fld('mk-exp', T('expm'), inp('mk-exp', r.out.exp || '', { type: 'month' })) + '</div>' +
      '<fieldset><legend>' + esc(T('rawused')) + '</legend><div data-rls></div><button type="button" class="btn sm" data-radd>' + esc(A.T('addline')) + '</button><p class="soft" data-mcost aria-live="polite"></p></fieldset>' + dl('b2-items', itemNames(true)),
    function () {
      var date = val('mk-date'), nm = val('mk-item'), q = num(val('mk-qty')), lines = L.filter(function (l) { return l.desc && num(l.qty) > 0; });
      if (!need(date, A.T('date')) || !need(nm, T('fin')) || !need(q > 0, T('mkqty')) || !need(lines.length, T('rawused')) || !lockOk(date, rec)) return;
      var c = cost();
      if (c.short.length && !confirm(T('shortq', { l: c.short.join(', ') }))) return;
      var mm = items().filter(function (x) { return key(x.desc) === key(nm); })[0];
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'stk', kind: 'make', app: 1 }, { date: date, no: val('mk-no'), gd: val('mk-gd'), extra: r2(num(val('mk-extra'))), seller: sellerCopy(),
        out: { desc: nm, qty: q, unit: mm && mm.unit || '', rate: r2(c.total / q), batch: val('mk-batch'), exp: val('mk-exp') }, lines: lines.map(function (l) { return { desc: l.desc, qty: num(l.qty), unit: l.unit }; }) });
      var jobs = [];
      if (!mm) jobs.push(NSStore.put('item', { desc: nm, kind: 'goods', unit: 'Nos', rate: '', gst: 18 }));
      Promise.all(jobs).then(function () { return NSStore.put('doc', d); }).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    }, function () {
      draw();
      $('#mk-item', form).addEventListener('change', fromBom); $('#mk-qty', form).addEventListener('change', function () { if (!rec) fromBom(); cost(); });
      form.addEventListener('input', function (e) { if (/^ml2-q|mk-extra|mk-qty/.test(e.target.id)) cost(); });
      form.addEventListener('change', function (e) { if (/^ml2-d|mk-date|mk-gd/.test(e.target.id)) cost(); });
      $('[data-radd]', form).addEventListener('click', function () { readLines(L, 'ml2-'); L.push({ desc: '', qty: '', unit: '' }); draw(); });
      if (!rec && itemName) { $('#mk-qty', form).value = num((bomOf(itemName) || {}).per) || 1; fromBom(); }
    });
  }

  /* ---------- profit and trends ---------- */
  var pView = 'bill', tBy = 'item';
  A.addSection('b2profit', function () {
    var r = A.range(), P = X.profit(A.data().doc, items(), A.bizName(), r[0], r[1]), t = P.tot;
    var tabs = ['bill', 'item', 'party', 'trend'], body = '';
    function pc(x) { return (x.value ? NS.qty(x.pct) + '%' : '—'); }
    if (pView === 'bill') body = '<table class="tbl"><thead><tr><th>Bill</th><th>Party</th><th class="n">Sale value</th><th class="n">Cost</th><th class="n">Profit</th><th class="n">Margin</th></tr></thead><tbody>' +
      P.bills.slice(0, 300).map(function (b) { return '<tr><th scope="row">' + esc(A.enName(b.d)) + ' ' + esc(b.d.no || '') + '<br><small class="soft">' + A.ldate(b.d.date) + '</small></th><td>' + esc(B.partyName(b.d) || '—') + '</td><td class="n">' + m(b.value) + '</td><td class="n">' + m(b.cost) + (b.unknown ? ' <span class="pill warn" title="' + esc(T('nocost')) + '">?</span>' : '') + '</td><td class="n' + (b.profit < 0 ? ' neg' : '') + '">' + money(b.profit, false) + '</td><td class="n">' + pc(b) + '</td></tr>'; }).join('') + '</tbody></table>';
    else if (pView === 'item' || pView === 'party') body = '<table class="tbl"><thead><tr><th>' + (pView === 'item' ? 'Item' : 'Party') + '</th><th class="n">' + (pView === 'item' ? 'Qty sold' : 'Bills') + '</th><th class="n">Sale value</th><th class="n">Cost</th><th class="n">Profit</th><th class="n">Margin</th></tr></thead><tbody>' +
      P[pView === 'item' ? 'items' : 'parties'].map(function (x) { return '<tr><th scope="row">' + esc(x.name || T('cashcust')) + '</th><td class="n">' + NS.qty(pView === 'item' ? x.qty : x.n) + '</td><td class="n">' + m(x.value) + '</td><td class="n">' + m(x.cost) + (x.unknown ? ' <span class="pill warn" title="' + esc(T('nocost')) + '">?</span>' : '') + '</td><td class="n' + (x.profit < 0 ? ' neg' : '') + '">' + money(x.profit, false) + '</td><td class="n">' + pc(x) + '</td></tr>'; }).join('') + '</tbody></table>';
    else {
      var TR = X.trend(A.data().doc, items(), A.bizName(), r[0], r[1], tBy, 10), max = Math.max.apply(null, TR.all.concat([1]));
      body = '<div class="seg" role="group">' + ['item', 'party'].map(function (b) { return '<button type="button" class="btn sm" data-b2tby="' + b + '" aria-pressed="' + (tBy === b) + '">' + esc(T('by_' + b)) + '</button>'; }).join('') + '</div>' +
        '<div class="bars" aria-hidden="true">' + TR.months.map(function (mo, i) { return '<div class="bar"><i style="height:' + Math.max(2, Math.round(TR.all[i] / max * 100)) + '%"></i><span>' + mo.slice(5) + '/' + mo.slice(2, 4) + '</span></div>'; }).join('') + '</div>' +
        '<table class="tbl"><thead><tr><th>' + (tBy === 'item' ? 'Item' : 'Party') + '</th>' + TR.months.map(function (mo) { return '<th class="n">' + mo.slice(5) + '/' + mo.slice(2, 4) + '</th>'; }).join('') + '<th class="n">Total</th><th class="n">Profit</th></tr></thead><tbody>' +
        TR.rows.map(function (x) { return '<tr><th scope="row">' + esc(x.rest ? T('others', { n: x.rest }) : x.name || T('cashcust')) + '</th>' + x.m.map(function (v) { return '<td class="n">' + (v ? money(v, false) : '') + '</td>'; }).join('') + '<td class="n"><b>' + money(x.total, false) + '</b></td><td class="n">' + money(x.profit, false) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th>Total</th>' + TR.all.map(function (v) { return '<th class="n">' + money(v, false) + '</th>'; }).join('') + '<th class="n">' + money(TR.all.reduce(function (s, v) { return s + v; }, 0), false) + '</th><th></th></tr></tfoot></table>';
    }
    return '<div class="pane-hd"><h2>' + esc(T('profit')) + '</h2><div class="quick"><button type="button" class="btn" data-b2print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-b2csv="profit">' + esc(A.T('csv')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('profith')) + '</p><p class="soft">' + esc(NS.t('uf.pfapp')) + '</p>' + dates() +
      '<div class="tiles"><div class="tile"><span>' + esc(T('sv')) + '</span><b>' + money(t.value) + '</b></div><div class="tile"><span>' + esc(T('cv')) + '</span><b>' + money(t.cost) + '</b></div>' +
        '<div class="tile' + (t.profit < 0 ? ' neg' : '') + '"><span>' + esc(T('pv')) + '</span><b>' + money(t.profit) + '</b></div><div class="tile"><span>' + esc(T('mv')) + '</span><b>' + NS.qty(t.pct) + '%</b></div></div>' +
      (t.unknown ? '<p class="soft">' + esc(T('unknown', { n: t.unknown })) + '</p>' : '') +
      '<div class="seg" role="group">' + tabs.map(function (x) { return '<button type="button" class="btn sm" data-b2pv="' + x + '" aria-pressed="' + (pView === x) + '">' + esc(T('pv_' + x)) + '</button>'; }).join('') + '</div>' +
      '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet wide" data-sheet>' + head('Profit report: ' + ({ bill: 'bill-wise', item: 'item-wise', party: 'party-wise', trend: 'monthly trend' })[pView], A.ldate(r[0]) + ' to ' + A.ldate(r[1])) + '<div class="tbl-wrap">' + body + '</div>' + foot() + '</div></div>';
  }, wireAll);

  /* ---------- salesmen ---------- */
  A.addSection('b2sman', function () {
    var r = A.range(), L = X.salesmen(A.data().doc, A.bizName(), r[0], r[1], cfg().salesmen || []), tot = { n: 0, net: 0, paid: 0, comm: 0 };
    L.forEach(function (x) { tot.n += x.n; tot.net += x.net; tot.paid += x.paid; tot.comm += x.comm; });
    return '<div class="pane-hd"><h2>' + esc(T('sman')) + '</h2><div class="quick"><a class="btn" href="' + A.myUrl('#settings') + '">' + esc(T('managesm')) + '</a><button type="button" class="btn" data-b2print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-b2csv="sman">' + esc(A.T('csv')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('smanh')) + '</p>' + dates() +
      '<div class="tbl-wrap" dir="ltr"><div lang="en-IN" class="stsheet wide" data-sheet>' + head('Salesman-wise sales and commission', A.ldate(r[0]) + ' to ' + A.ldate(r[1])) +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Salesman</th><th class="n">Bills</th><th class="n">Sales</th><th class="n">Returns</th><th class="n">Net sales</th><th class="n">Collected</th><th class="n">Commission</th></tr></thead><tbody>' +
      (L.length ? L.map(function (x) { return '<tr><th scope="row">' + esc(x.k === '-' ? T('nosm1') : x.name) + '</th><td class="n">' + x.n + '</td><td class="n">' + m(x.sales) + '</td><td class="n">' + m(x.ret) + '</td><td class="n">' + m(x.net) + '</td><td class="n">' + m(x.paid) + '</td><td class="n">' + (x.rate ? money(x.comm, false) + '<br><small class="soft">' + x.rate + '% of ' + (x.basis === 'paid' ? 'collected' : 'net sales') + '</small>' : '—') + '</td></tr>'; }).join('')
        : '<tr><td colspan="7" class="soft">' + esc(T('nosmrows')) + '</td></tr>') +
      '</tbody><tfoot><tr><th>Total</th><th class="n">' + tot.n + '</th><th></th><th></th><th class="n">' + money(tot.net, false) + '</th><th class="n">' + money(tot.paid, false) + '</th><th class="n">' + money(tot.comm, false) + '</th></tr></tfoot></table></div>' + foot() + '</div></div>';
  }, wireAll);

  /* ---------- one wire for every section ---------- */
  function wireAll(pane) {
    wireFy(pane);
    $$('[data-b2]', pane).forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-b2'); ({ jv: jvForm, fa: faForm, move: moveForm, make: makeForm, bom: bomForm })[k](); }); });
    function byId(id) { return A.data().doc.filter(function (x) { return x.id === id; })[0]; }
    $$('[data-b2edit]', pane).forEach(function (b) { b.addEventListener('click', function () { jvForm(byId(b.getAttribute('data-b2edit'))); }); });
    $$('[data-b2del]', pane).forEach(function (b) { b.addEventListener('click', function () { del(b.getAttribute('data-b2del')); }); });
    $$('[data-b2fa]', pane).forEach(function (b) { b.addEventListener('click', function () { faForm(byId(b.getAttribute('data-b2fa'))); }); });
    $$('[data-b2sell]', pane).forEach(function (b) { b.addEventListener('click', function () { var a = X.assets(A.data().doc, A.bizName()).filter(function (x) { return x.id === b.getAttribute('data-b2sell'); })[0]; if (a) sellForm(a); }); });
    $$('[data-b2post]', pane).forEach(function (b) { b.addEventListener('click', function () { postDep(fySel); }); });
    $$('[data-b2close]', pane).forEach(function (b) { b.addEventListener('click', function () { toggleClose(b.getAttribute('data-b2close')); }); });
    $$('[data-b2cf]', pane).forEach(function (b) { b.addEventListener('click', function () { carry(b.getAttribute('data-b2cf')); }); });
    $$('[data-b2print]', pane).forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    $$('[data-b2gdv]', pane).forEach(function (b) { b.addEventListener('click', function () { gdView = b.getAttribute('data-b2gdv'); A.show(); }); });
    $$('[data-b2move]', pane).forEach(function (b) { b.addEventListener('click', function () { moveForm(byId(b.getAttribute('data-b2move'))); }); });
    $$('[data-b2mk]', pane).forEach(function (b) { b.addEventListener('click', function () { makeForm(byId(b.getAttribute('data-b2mk'))); }); });
    $$('[data-b2make]', pane).forEach(function (b) { b.addEventListener('click', function () { makeForm(null, b.getAttribute('data-b2make')); }); });
    $$('[data-b2bom]', pane).forEach(function (b) { b.addEventListener('click', function () { bomForm(items().filter(function (x) { return x.id === b.getAttribute('data-b2bom'); })[0]); }); });
    $$('[data-b2pv]', pane).forEach(function (b) { b.addEventListener('click', function () { pView = b.getAttribute('data-b2pv'); A.show(); }); });
    $$('[data-b2tby]', pane).forEach(function (b) { b.addEventListener('click', function () { tBy = b.getAttribute('data-b2tby'); A.show(); }); });
    var sn = $('[data-b2sn]', pane);
    if (sn) sn.addEventListener('input', function () {
      var q = sn.value.trim(), out = $('[data-b2snout]', pane); if (q.length < 3) { out.textContent = ''; return; }
      var R = S.serials(A.data().doc, items(), A.bizName(), ''), hit = R.inHand.filter(function (x) { return key(x.sn) === key(q); })[0], gone = R.out.filter(function (x) { return key(x.sn) === key(q); })[0];
      out.textContent = hit ? T('snhave', { n: hit.name, d: A.ldate(hit.d.date), b: (A.enName(hit.d) + ' ' + (hit.d.no || '')).trim() }) : gone ? T('snout', { n: gone.name, d: A.ldate(gone.d.date), b: (A.enName(gone.d) + ' ' + (gone.d.no || '')).trim(), p: B.partyName(gone.d) || '—' }) : T('snnone');
    });
    $$('[data-b2csv]', pane).forEach(function (b) { b.addEventListener('click', function () { csvOut(b.getAttribute('data-b2csv')); }); });
  }
  function csvOut(what) {
    var r = A.range(), D = A.data().doc;
    if (what === 'fa') {
      var R = X.register(D, A.bizName(), fySel);
      csv('fixed-assets-' + fySel + '.csv', [['Asset', 'Kind', 'Put to use', 'Method', 'Life (years)', 'Opening', 'Added', 'Depreciation', 'Sold (book value)', 'Closing', 'Posted']].concat(R.rows.map(function (x) { return [x.a.name, x.a.cat, x.a.date, x.a.method.toUpperCase(), x.a.life, x.open, x.add, x.dep, x.sold, x.close, x.done]; })));
    } else if (what === 'profit') {
      var P = X.profit(D, items(), A.bizName(), r[0], r[1]);
      if (pView === 'bill') csv('profit-by-bill.csv', [['Date', 'Document', 'No', 'Party', 'Sale value', 'Cost', 'Profit', 'Margin %']].concat(P.bills.map(function (b) { return [b.d.date, A.enName(b.d), b.d.no || '', B.partyName(b.d), b.value, b.cost, b.profit, b.pct]; })));
      else if (pView === 'trend') { var TR = X.trend(D, items(), A.bizName(), r[0], r[1], tBy, 1000); csv('sales-trend-by-' + tBy + '.csv', [[tBy === 'item' ? 'Item' : 'Party'].concat(TR.months).concat(['Total', 'Profit'])].concat(TR.rows.map(function (x) { return [x.name].concat(x.m).concat([x.total, x.profit]); }))); }
      else csv('profit-by-' + pView + '.csv', [[pView === 'item' ? 'Item' : 'Party', pView === 'item' ? 'Qty sold' : 'Bills', 'Sale value', 'Cost', 'Profit', 'Margin %']].concat(P[pView === 'item' ? 'items' : 'parties'].map(function (x) { return [x.name, pView === 'item' ? x.qty : x.n, x.value, x.cost, x.profit, x.pct]; })));
    } else if (what === 'sman') {
      csv('salesman-commission.csv', [['Salesman', 'Bills', 'Sales', 'Returns', 'Net sales', 'Collected', 'Rate %', 'On', 'Commission']].concat(X.salesmen(D, A.bizName(), r[0], r[1], cfg().salesmen || []).map(function (x) { return [x.k === '-' ? '(none)' : x.name, x.n, x.sales, x.ret, x.net, x.paid, x.rate, x.basis, x.comm]; })));
    }
  }

  /* ---------- purchase bill form of the app: godown and batch / expiry / serial on lines (app.js asks through these) ---------- */
  function track(desc) { var x = items().filter(function (i) { return key(i.desc) === key(desc); })[0]; return x && x.track || ''; }
  A.lineX = function (L, i, c) {
    var t = track(L.desc) || (L.batch || L.exp ? 'batch' : L.serial ? 'serial' : '');
    if (!t) return '';
    return (t === 'batch' || t === 'both' ? c('batch', T('batch')) + c('exp', T('expm2')) : '') + (t === 'serial' || t === 'both' ? c('serial', T('serials')) : '');
  };
  A.lineCopy = function (L, it) { ['batch', 'exp', 'serial'].forEach(function (k) { if (L[k]) it[k] = String(L[k]).trim(); }); return it; };
  A.gdField = function (v) {
    var G = gdNames(); if (!G.length) return '';
    return fld('f-gd', T('gd1'), sel('f-gd', v || '', [['', T('main')]].concat(G.map(function (g) { return [g, g]; }))));
  };

  /* edit buttons in the app's own lists (recent, party statement) open these forms */
  A.editX = function (d) {
    if (d.type === 'jv') { jvForm(d); return true; }
    if (d.type === 'fa' && d.kind === 'sale') { var a = X.assets(A.data().doc, A.bizName()).filter(function (x) { return x.id === d.asset; })[0]; if (a) sellForm(a); return true; }
    if (d.type === 'fa') { faForm(d); return true; }
    if (d.type === 'stk' && d.kind === 'move') { moveForm(d); return true; }
    if (d.type === 'stk' && d.kind === 'make') { makeForm(d); return true; }
    return false;
  };

  /* ---------- menu: the Batch 2 sections join the app's menu (not on door sites) ---------- */
  var SECS = ['b2jv', 'b2fa', 'b2gd', 'b2make', 'b2profit', 'b2sman', 'b2year'];
  function menu() {
    var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs') || $('[data-sec="b2jv"]', nav)) return;
    SECS.forEach(function (s) { nav.appendChild(NS.el('a', { href: '#' + s, 'data-sec': s }, '<span>' + esc(NS.t('app.' + s)) + '</span>')); });
    $$('[data-sec^="b2"]', nav).forEach(function (b) { b.addEventListener('click', function () { A.filt('all'); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', menu); else menu();
})();
