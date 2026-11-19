/* NSBiz Masters (owner 2026-11-19: "a place where every accounting, item, voucher configuration stays; create, edit, delete from
   there", like the Gateway of an accounting program). One App screen #masters with Create / Alter / Display / Delete for:
     led    Ledgers       every account: parties (customers / suppliers, with their group and opening balance), the business's own
                          income and expense heads, and the accounts the books made themselves (cash, bank, GST, capital, loans...)
     grp    Account groups the standard groups (shown) and the business's own party groups (meta 'groups'.party)
     vt     Voucher types the number series of every document (prefix per business, next number), same settings as My data
     item   Stock items   goods and services (party / item records are shared masters, as in My data)
     igrp   Stock groups  meta 'groups'.item
     unit   Units         the unit master (ERP round 1, I-3): data home meta 'units' = [{ sym, name, uqc, dec, compound: { per, second } }]
                          (1 sym = per second, e.g. 1 Box = 12 Nos), plus the units items use that are not in it yet; mfgcore.js
                          converts every line through it (NSMfg.setUnits). Items name their own other units (item.alts) and
                          reorder fields (min, rq, max, lead, supplier) and how stock is kept (track) on the item form.
     biz    Businesses    the companies; their full form (logo, bank, signature) stays in My data
     bank   Bank accounts the business's banks (ERP masters step 3): the bank on the business record is the default bank (account 'bank');
                          more banks are kept in data home meta 'banks' = { <business id>: [{ id, name, acc, ifsc, branch }] } and post to
                          'bank:<name>' (NSBooks.bankKey). Opening balance = an 'ob' record, side 'bank', with bacct. A bank used by a saved
                          voucher cannot be deleted; renaming it moves every voucher (d.bacct, contra from / to, journal lines) to the new name.
   Rules, as in an accounting program: a party, item, head or group used in saved vouchers cannot be deleted (the screen says how
   many use it); renaming a party, item or head changes the name on every saved voucher. Godowns, employees, salesmen, bills of
   materials and opening balances keep their own screens and are reached from here. Screen words: NS.t('ms.*'). */
(function () {
  'use strict';
  var A = window.NSApp, X = A && A.acx, B = window.NSBooks; if (!A || !X || !B) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, key = B.key, H = window.NSHeads;
  var fld = X.fld, inp = X.inp, sel = X.sel, val = X.val;
  function M(k, v) { return NS.t('ms.' + k, v); }
  function today() { return NS.today(); }
  function fyStart() { return NS.fy(today()).slice(0, 4) + '-04-01'; }
  function ask(m, o) { return NS.ask ? NS.ask(m, o) : Promise.resolve(window.confirm(m)); }
  function C() { return A.data(); }
  function GRP() { return (A.groups && A.groups()) || {}; }
  function metaEdit(name, fn) { return NSStore.meta(name).then(function (m) { m = m || {}; fn(m); return NSStore.meta(name, m).then(function () { return m; }); }); }
  var HEADS = { custom: [] }; var headsAsked = false;
  function loadHeads() { if (headsAsked) return; headsAsked = true; NSStore.meta('heads').then(function (m) { HEADS = m && m.custom ? m : { custom: [] }; if (/^#masters/.test(location.hash)) A.show(); }).catch(function () {}); }

  /* ---------- which saved vouchers use a master (all businesses: masters are shared) ---------- */
  function usesParty(nm) { var k = key(nm); return C().doc.filter(function (d) { return d.type !== 'ob' && (key(d.buyer && d.buyer.name) === k || key(d.lender) === k || key(d.payer) === k); }).length; }
  function usesItem(nm) { var k = key(nm); return C().doc.filter(function (d) { return (d.items || []).concat(d.lines || [], d.by || []).some(function (l) { return l && key(l.desc) === k; }); }).length; }
  function usesHead(nm) { var k = key(nm); return C().doc.filter(function (d) { return key(d.cat) === k || key(d.head) === k || (d.lines || []).some(function (l) { return l && key(l.head) === k; }); }).length; }
  /* renaming changes the name on every saved voucher (one by one, so a stop half-way leaves each voucher whole) */
  function renameIn(test, change) {
    var L = C().doc.filter(test);
    return L.reduce(function (p, d) { return p.then(function () { var x = JSON.parse(JSON.stringify(d)); change(x); return NSStore.put('doc', x); }); }, Promise.resolve()).then(function () { return L.length; });
  }
  function renameParty(a, b) { var k = key(a); return renameIn(function (d) { return key(d.buyer && d.buyer.name) === k || key(d.lender) === k || key(d.payer) === k; }, function (d) { if (d.buyer && key(d.buyer.name) === k) d.buyer.name = b; if (key(d.lender) === k) d.lender = b; if (key(d.payer) === k) d.payer = b; }); }
  function renameItem(a, b) { var k = key(a); return renameIn(function (d) { return (d.items || []).concat(d.lines || [], d.by || []).some(function (l) { return l && key(l.desc) === k; }); }, function (d) { ['items', 'lines', 'by'].forEach(function (f) { (d[f] || []).forEach(function (l) { if (l && key(l.desc) === k) l.desc = b; }); }); }); }
  function renameHead(a, b) { var k = key(a); return renameIn(function (d) { return key(d.cat) === k || key(d.head) === k || (d.lines || []).some(function (l) { return l && key(l.head) === k; }); }, function (d) { if (key(d.cat) === k) d.cat = b; if (key(d.head) === k) d.head = b; (d.lines || []).forEach(function (l) { if (l && key(l.head) === k) l.head = b; }); }); }

  /* ---------- the standard groups (as in Tally), with where NSBiz keeps each ---------- */
  var PRIMARY = [['cap', 'Capital Account', 'liab'], ['loan', 'Loans (Liability)', 'liab'], ['cl', 'Current Liabilities', 'liab'], ['dt', 'Duties & Taxes', 'liab', 'cl'], ['creditors', 'Sundry Creditors', 'liab', 'cl'], ['prov', 'Provisions', 'liab', 'cl'],
    ['fa', 'Fixed Assets', 'asset'], ['inv', 'Investments', 'asset'], ['ca', 'Current Assets', 'asset'], ['bank', 'Bank Accounts', 'asset', 'ca'], ['cash', 'Cash-in-Hand', 'asset', 'ca'], ['debtors', 'Sundry Debtors', 'asset', 'ca'],
    ['stock', 'Stock-in-Hand', 'asset', 'ca'], ['adv', 'Loans & Advances (Asset)', 'asset', 'ca'], ['sales', 'Sales Accounts', 'inc'], ['dinc', 'Direct Incomes', 'inc'], ['oinc', 'Indirect Incomes', 'inc'],
    ['pur', 'Purchase Accounts', 'exp'], ['dexp', 'Direct Expenses', 'exp'], ['iexp', 'Indirect Expenses', 'exp']];
  function pName(id) { var p = PRIMARY.filter(function (x) { return x[0] === id; })[0]; return p ? p[1] : id; }
  /* the group of an account the books made (key) */
  function groupOfKey(k, v) {
    if (k === 'cash') return 'cash'; if (k === 'bank' || k.indexOf('bank:') === 0 || /^chq-/.test(k)) return 'bank';
    if (/^(gst|tds|tcs|pf|esi|pt)-|^gstcash/.test(k)) return 'dt'; if (/^(cap|drw):/.test(k)) return 'cap'; if (/^(loan|od):/.test(k)) return 'loan';
    if (k.indexOf('fa:') === 0) return 'fa'; if (/^(sadv|given|oca):/.test(k)) return 'adv'; if (/^ocl:|payable$/.test(k)) return 'cl';
    if (k === 'sales' || k === 'sales-return' || k.indexOf('sales:') === 0) return 'sales'; if (k === 'purchases' || k === 'purchase-return' || k.indexOf('purchases:') === 0) return 'pur';
    if (k.indexOf('inc:') === 0) return 'oinc'; if (k.indexOf('exp:') === 0) return 'iexp'; if (k.indexOf('p:') === 0) return v < 0 ? 'creditors' : 'debtors';
    return v < 0 ? 'cl' : 'ca';
  }
  function accName(k) { return A.accName ? A.accName(k, {}) : k; }

  /* ---------- ledgers ---------- */
  function ledgers() {
    var acc = B.accounts(C().doc, A.bizName(), today()), seen = {}, rows = [];
    (A.banks ? A.banks() : []).forEach(function (b) { seen[b.k] = 1; rows.push({ kind: 'bank', rec: b, k: b.k, name: b.name, group: pName('bank'), gid: 'bank', bal: acc[b.k] || 0 }); });
    NS.forBiz(C().party, A.biz()).forEach(function (p) {
      var k = 'p:' + key(p.name); if (seen[k]) return; seen[k] = 1;
      var g = NS.partyGroup(p, GRP()); rows.push({ kind: 'party', rec: p, name: p.name, group: g.name, gid: g.id, bal: acc[k] || 0 });
    });
    (HEADS.custom || []).forEach(function (h) {
      var k = (h.t === 'oinc' || h.t === 'dinc' ? 'inc:' : 'exp:') + key(h.name); if (seen[k]) return; seen[k] = 1;
      rows.push({ kind: 'head', rec: h, name: h.name, group: pName(h.t), gid: h.t, bal: acc[k] || 0 });
    });
    Object.keys(acc).forEach(function (k) {
      if (seen[k] || Math.abs(acc[k]) < 0.005 && k.indexOf('p:') !== 0) return; seen[k] = 1;
      var g = groupOfKey(k, acc[k]), head = /^(exp|inc):/.test(k);
      rows.push({ kind: head ? 'used' : k.indexOf('p:') === 0 ? 'party0' : 'sys', k: k, name: k.indexOf('p:') === 0 ? k.slice(2) : accName(k), group: pName(g), gid: g, bal: acc[k] });
    });
    return rows.sort(function (a, b) { return String(a.group).localeCompare(String(b.group)) || String(a.name).localeCompare(String(b.name)); });
  }
  function inact(r) { return '<div class="f wide"><label class="chk"><input type="checkbox" id="ms-inact"' + (r && r.inactive ? ' checked' : '') + '> <span>' + esc(M('inact')) + '</span></label><small class="hint">' + esc(M('inacth')) + '</small></div>'; }
  function offPill(r) { return r && r.inactive ? ' <span class="pill">' + esc(M('inactp')) + '</span>' : ''; }
  function balTxt(v) { return Math.abs(v) < 0.005 ? '—' : money(Math.abs(v), false) + (v > 0 ? ' Dr' : ' Cr'); }
  function underOpts(cur) {
    var o = NS.groupsOf(GRP(), 'party').map(function (g) { var up = g.under ? NS.groupsOf(GRP(), 'party').filter(function (x) { return x.id === g.under; })[0] : null; return [g.id, g.name + (up ? ' (' + up.name + ')' : '')]; });
    return o.concat([['dexp', pName('dexp')], ['iexp', pName('iexp')], ['dinc', pName('dinc')], ['oinc', pName('oinc')]]).map(function (x) { return [x[0], x[1]]; });
  }
  function isHeadG(g) { return /^(dexp|iexp|dinc|oinc)$/.test(g); }
  function topOf(gid) { var L = NS.groupsOf(GRP(), 'party'), g = L.filter(function (x) { return x.id === gid; })[0]; if (!g) return 'debtors'; if (g.builtin) return g.id; var up = L.filter(function (x) { return x.id === g.under; })[0]; return up && up.builtin ? up.id : up && up.under || 'debtors'; }
  function obOf(name) { var k = key(name), b = key(A.bizName()); return C().doc.filter(function (d) { return d.type === 'ob' && key(d.buyer && d.buyer.name) === k && key(d.seller && d.seller.name) === b; })[0]; }
  function ledgerForm(row, startGroup) {
    var p = row && row.kind === 'party' ? row.rec : null, h = row && row.kind === 'head' ? row.rec : null, g0 = p ? NS.partyGroup(p, GRP()).id : h ? h.t : (startGroup || 'debtors');
    var ob = p ? obOf(p.name) : null, obv = ob ? num(ob.amount) : '', obs = ob ? (ob.side === 'pay' ? 'cr' : 'dr') : (g0 === 'creditors' ? 'cr' : 'dr');
    var states = [['', '']].concat(NS.STATES.map(function (s) { return [s[0], s[1] + ' (' + s[0] + ')']; }));
    var ready = H ? H.list().map(function (x) { return '<option value="' + esc(H.label(x)) + '">'; }).join('') : '';
    X.open(M(row ? 'led_alter' : 'led_new'), '<div class="fg">' +
      fld('ms-name', M('name'), inp('ms-name', (p && p.name) || (h && h.name) || '', { req: 1, list: 'ms-ready' }) + '<datalist id="ms-ready">' + ready + '</datalist>') +
      fld('ms-under', M('under'), sel('ms-under', g0, underOpts())) +
      '<div class="f wide" data-mspart><div class="fg">' +
      fld('ms-gstin', NS.t('l.cgstin'), inp('ms-gstin', p && p.gstin || '', { ltr: 1 })) + fld('ms-state', NS.t('l.state'), sel('ms-state', p && p.state || '', states)) +
      partyTaxFields(p) +
      fld('ms-phone', NS.t('l.phone'), inp('ms-phone', p && p.phone || '', { ltr: 1, mode: 'tel' })) + fld('ms-email', NS.t('l.email'), inp('ms-email', p && p.email || '', { ltr: 1 })) +
      fld('ms-addr', NS.t('l.addr'), inp('ms-addr', p && p.addr || ''), { wide: 1 }) + fld('ms-city', NS.t('l.city'), inp('ms-city', p && p.city || '')) + fld('ms-pin', NS.t('l.pin'), inp('ms-pin', p && p.pin || '', { ltr: 1, mode: 'numeric' })) +
      fld('ms-cdays', NS.t('b1.cdays'), inp('ms-cdays', p && p.cdays || '', { mode: 'numeric', ltr: 1 })) + fld('ms-climit', NS.t('b1.climit'), inp('ms-climit', p && p.climit || '', { mode: 'decimal', ltr: 1 })) +
      fld('ms-ob', M('obal', { d: NS.fmtDate(fyStart()) }), inp('ms-ob', obv, { mode: 'decimal', ltr: 1 })) + fld('ms-obs', M('drcr'), sel('ms-obs', obs, [['dr', M('dr')], ['cr', M('cr')]])) +
      inact(p) +
      '</div></div></div>' + (window.NSCF ? NSCF.formHtml('party', p) : '') + '<p class="soft" data-msnote></p>',
    function () {
      var nm = val('ms-name').replace(/\s+/g, ' '), g = val('ms-under'), head = isHeadG(g);
      if (!nm) { NS.toast(A.T('need', { f: M('name') }), 'bad'); return; }
      var dupP = C().party.filter(function (x) { return key(x.name) === key(nm) && (!p || x.id !== p.id); })[0], dupH = (HEADS.custom || []).filter(function (x) { return key(x.name) === key(nm) && x !== h; })[0];
      if (dupP || dupH) { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      if (head) {
        if (p) { NS.toast(M('nomove'), 'bad'); return; }
        var old = h && h.name;
        return metaEdit('heads', function (m) { m.custom = m.custom || []; var i = old ? m.custom.findIndex(function (x) { return key(x.name) === key(old); }) : -1; var r = { name: nm, t: g }; if (i >= 0) m.custom[i] = r; else m.custom.push(r); }).then(function (m) {
          HEADS = m; if (H) H.setCustom(m.custom); return old && key(old) !== key(nm) ? renameHead(old, nm) : 0;
        }).then(done, fail);
      }
      if (h) { NS.toast(M('nomove'), 'bad'); return; }
      var gst = val('ms-gstin').toUpperCase().replace(/\s/g, ''), gc = NS.gstinCheck(gst); if (gst && !gc.ok) { NS.toast(gc.msg || NS.t('gst.chk'), 'bad'); return; }
      var top = topOf(g), r = p ? JSON.parse(JSON.stringify(p)) : { };
      var oldName = p && p.name;
      r.name = nm; r.role = p && p.role === 'both' ? 'both' : top === 'creditors' ? 'supplier' : 'customer';
      if (NS.groupsOf(GRP(), 'party').some(function (x) { return x.id === g && !x.builtin; })) r.group = g; else delete r.group;
      ['gstin', 'state', 'phone', 'email', 'addr', 'city', 'pin'].forEach(function (f) { var v = f === 'gstin' ? gst : val('ms-' + f); if (v) r[f] = v; else delete r[f]; });
      if (!r.state && gc.state) r.state = gc.state;
      ['cdays', 'climit'].forEach(function (f) { var v = val('ms-' + f); if (v !== '') r[f] = num(v); else delete r[f]; });
      if (partyTaxSave(r) === false) return;
      if (val('ms-inact')) r.inactive = true; else delete r.inactive;
      if (window.NSCF) NSCF.formRead('party', $('.acx-dlg form'), r);   /* custom fields (ERP Round 2, B-1) */
      var obAmt = r2(num(val('ms-ob'))), obSide = val('ms-obs') === 'cr' ? 'pay' : 'recv', ob0 = oldName ? obOf(oldName) : null;
      return NSStore.put('party', r).then(function () {
        if (obAmt > 0) return NSStore.put('doc', Object.assign(ob0 ? JSON.parse(JSON.stringify(ob0)) : { type: 'ob', app: 1, no: '', date: fyStart(), seller: X.sellerCopy() }, { buyer: { name: nm }, side: obSide, amount: obAmt, total: obAmt }));
        if (ob0) return NSStore.del('doc', ob0.id);
      }).then(function () { return oldName && key(oldName) !== key(nm) ? renameParty(oldName, nm) : 0; }).then(done, fail);
    }, function (form) {
      function part() { var hd = isHeadG($('#ms-under', form).value); $('[data-mspart]', form).hidden = hd; }
      $('#ms-under', form).addEventListener('change', part); part();
      var gi = $('#ms-gstin', form); gi.addEventListener('input', function () { var c = NS.gstinCheck(gi.value); if (c.ok && c.state) $('#ms-state', form).value = c.state; var pn = $('#ms-pan', form), g15 = gi.value.trim().toUpperCase(); if (c.ok && pn && !pn.value) pn.value = g15.slice(2, 12); });
      if (row && row.kind !== 'head' && row.rec) { var n = usesParty(row.rec.name); if (n) $('[data-msnote]', form).textContent = M('usedin', { n: n }); }
    });
  }
  function done(n) { var d = $('.acx-dlg'); if (d && d.open) d.close(); NS.toast(n ? M('savedren', { n: n }) : M('saved')); A.show(); }
  function fail(e) { NS.toast(NS.t('nosave', { e: e && e.message || '' }), 'bad'); }
  function delLedger(row) {
    var n = row.kind === 'head' ? usesHead(row.name) : usesParty(row.name);
    if (n) { NS.toast(M('inuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: row.name }), { danger: true, ok: NS.t('desk.del') }).then(function (y) {
      if (!y) return;
      if (row.kind === 'head') return metaEdit('heads', function (m) { m.custom = (m.custom || []).filter(function (x) { return key(x.name) !== key(row.name); }); }).then(function (m) { HEADS = m; if (H) H.setCustom(m.custom); NS.toast(M('deleted')); A.show(); });
      var ob = obOf(row.name);
      return NSStore.del('party', row.rec.id).then(function () { return ob ? NSStore.del('doc', ob.id) : 0; }).then(function () { NS.toast(M('deleted')); A.show(); }, fail);
    });
  }

  /* ---------- account and stock groups (own groups; the standard ones are fixed) ---------- */
  function groupUse(kind, id) { var L = kind === 'party' ? C().party : C().item; return L.filter(function (r) { return r.group === id; }).length + NS.groupsOf(GRP(), kind).filter(function (g) { return g.under === id && !g.builtin; }).length; }
  function groupForm(kind, g) {
    var L = NS.groupsOf(GRP(), kind), tops = L.filter(function (x) { return kind === 'party' ? (x.builtin || L.some(function (y) { return y.builtin && y.id === x.under; })) : !x.under; }).filter(function (x) { return !g || x.id !== g.id; });
    var opts = (kind === 'item' ? [['', M('primary')]] : []).concat(tops.map(function (x) { return [x.id, x.name]; }));
    X.open(M(g ? 'grp_alter' : 'grp_new'), '<div class="fg">' + fld('ms-gname', M('name'), inp('ms-gname', g && g.name || '', { req: 1 })) + fld('ms-gunder', M('under'), sel('ms-gunder', g ? g.under || '' : kind === 'party' ? 'debtors' : '', opts)) + '</div>', function () {
      var nm = val('ms-gname').replace(/\s+/g, ' '), un = val('ms-gunder');
      if (!nm) { NS.toast(A.T('need', { f: M('name') }), 'bad'); return; }
      if (L.some(function (x) { return key(x.name) === key(nm) && (!g || x.id !== g.id); })) { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      metaEdit('groups', function (m) {
        m[kind] = m[kind] || [];
        var old = g ? m[kind].filter(function (x) { return x.id === g.id; })[0] : null;
        if (old) { old.name = nm; old.under = un; }
        else m[kind].push({ id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: nm, under: un });
      }).then(function (m) { var G = GRP(); G[kind] = m[kind]; done(0); }, fail);
    });
  }
  function delGroup(kind, g) {
    var n = groupUse(kind, g.id); if (n) { NS.toast(M('grpuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: g.name }), { danger: true, ok: NS.t('desk.del') }).then(function (y) {
      if (y) metaEdit('groups', function (m) { m[kind] = (m[kind] || []).filter(function (x) { return x.id !== g.id; }); }).then(function (m) { var G = GRP(); G[kind] = m[kind]; NS.toast(M('deleted')); A.show(); }, fail);
    });
  }

  /* ---------- voucher types (ERP A-6, A-7, C-11): the number series and the defaults of each document, per business.
     The prefix stays where My data and the makers keep it; method, suffix, year, width, start, restart and duplicates go to
     settings.series[<type>|<type>.<kind>], the printing defaults to settings.vt[...]; sub-types are settings.vsub. Read by core.js
     NS.seriesOf / NS.nextNo / NS.vtCfg, so the makers, the voucher screens and the App forms all number the same way. ---------- */
  var VT = NS.VTYPES;
  var NXOUT = { invoice: 1, cashmemo: 1, exp: 1, self: 1, 'note.credit': 1, 'note.debit': 1 };
  function vtKey(v) { return v[1] ? v[0] + '.' + v[1] : v[0]; }
  function vtS() { return NS.cfgFor(A.cfg(), A.biz()); }
  function vtSub(id) { return NS.nxSub(vtS(), id); }
  function vtBase(x) { return x && x.base ? VT.filter(function (v) { return v[0] === x.base && (v[1] || '') === (x.kind || ''); })[0] || VT.filter(function (v) { return v[0] === x.base; })[0] : null; }
  function vtSer(v, sub) { return NS.seriesOf(vtS(), v[0], v[1], sub || '', { def: v[2], width: /^(contra|jv)$/.test(v[0]) ? 3 : null, fy: /^(contra|jv)$/.test(v[0]) ? true : null }); }
  function vtPrefix(v, sub) { return vtSer(v, sub).prefix; }
  function vtNext(v, sub) {
    var x = NS.nextNo(C().doc, { type: v[0], kind: v[1], sub: sub || '', seller: A.bizName(), date: today(), series: vtSer(v, sub) });
    return x.manual ? M('vt_manual') : x.no;
  }
  function vtUsed(id) { return C().doc.filter(function (d) { return d.vt === id; }).length; }
  var METHODS = [['auto', 'vt_m_auto'], ['fixed', 'vt_m_fixed'], ['manual', 'vt_m_manual']], RESTARTS = [['year', 'vt_r_year'], ['month', 'vt_r_month'], ['never', 'vt_r_never']];
  function opts(L) { return L.map(function (x) { return [x[0], M(x[1])]; }); }
  /* one form for a voucher type or a sub-type: numbering + printing defaults */
  function vtForm(v, sub, isNew) {
    var S = vtS(), ser = isNew ? Object.assign({}, vtSer(v), { start: 1, suffix: '', method: 'auto', restart: 'year', dup: 'block' }) : vtSer(v, sub), k = sub ? 'sub:' + sub.id : vtKey(v), vc = sub ? (sub.def || {}) : ((S.vt || {})[vtKey(v)] || {}), out = NXOUT[vtKey(v)];
    var title = sub ? (isNew ? M('vt_subnew') : M('vt_alter') + ': ' + sub.name) : M('vt_alter') + ': ' + NS.t(v[3]);
    var baseOpts = VT.map(function (x, i) { return [String(i), NS.t(x[3])]; });
    var chk = function (id, on, label) { return '<div class="f wide"><label class="chk"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + esc(label) + '</label></div>'; };
    var html = (sub ? '<div class="fg">' + fld('ms-vname', M('name'), inp('ms-vname', sub.name || '', { req: 1 }), { hint: M('vt_subh') }) +
        (isNew ? fld('ms-vbase', M('vt_base'), sel('ms-vbase', String(VT.indexOf(v)), baseOpts)) : '') + '</div>' : '') +
      '<h3>' + esc(M('vt_num')) + '</h3><div class="fg">' +
      fld('ms-pfx', NS.t('hub.pfx'), inp('ms-pfx', ser.prefix, { ltr: 1 })) + fld('ms-sfx', M('vt_sfx'), inp('ms-sfx', ser.suffix, { ltr: 1 })) +
      fld('ms-meth', M('vt_meth'), sel('ms-meth', ser.method, opts(METHODS))) + fld('ms-start', M('vt_start'), inp('ms-start', ser.start, { mode: 'numeric', ltr: 1 })) +
      fld('ms-width', M('vt_width'), sel('ms-width', String(ser.width), [1, 2, 3, 4, 5, 6].map(function (n) { return [String(n), String(n)]; }))) +
      fld('ms-rst', M('vt_rst'), sel('ms-rst', ser.restart, opts(RESTARTS))) +
      fld('ms-dup', M('vt_dup'), sel('ms-dup', out ? 'block' : ser.dup, out ? [['block', M('vt_d_block')]] : [['block', M('vt_d_block')], ['warn', M('vt_d_warn')]]), { hint: out ? M('vt_d_gst') : '' }) +
      chk('ms-fy', ser.fy, M('vt_fy')) + '</div><p>' + esc(M('nextno')) + ': <b class="mono" data-vtpv></b></p>' +
      '<details class="more"' + (Object.keys(vc).length ? ' open' : '') + '><summary>' + esc(M('vt_print')) + '</summary><div class="fg">' +
      fld('ms-cps', M('vt_copies'), sel('ms-cps', String(vc.copies || ''), [['', M('vt_tool')], ['1', '1'], ['2', '2'], ['3', '3']])) +
      fld('ms-ppr', M('vt_paper'), sel('ms-ppr', vc.paper || '', [['', M('vt_tool')], ['a4', 'A4'], ['a5', 'A5'], ['th80', '80 mm'], ['th58', '58 mm']])) +
      fld('ms-dsg', NS.t('l.design'), sel('ms-dsg', vc.design || '', [['', M('vt_tool')]].concat(NS.DESIGNS.map(function (d) { return [d, NS.t('ds.' + d)]; })))) +
      fld('ms-nts', NS.t('l.notes'), inp('ms-nts', vc.notes || ''), { wide: 1 }) + fld('ms-trm', M('vt_terms'), inp('ms-trm', vc.terms || ''), { wide: 1 }) +
      chk('ms-pas', vc.printAfter, M('vt_pafter')) + chk('ms-sas', vc.shareAfter, M('vt_safter')) + '</div><p class="soft">' + esc(M('vt_printh')) + '</p></details>' +
      '<p class="soft">' + esc(M('vt_h2')) + '</p>';
    X.open(title, html, function () {
      var bv = sub && isNew ? VT[+val('ms-vbase')] : v;
      var nm = sub ? val('ms-vname') : '';
      if (sub && !nm) { NS.toast(A.T('need', { f: M('name') }), 'bad'); return; }
      if (sub && NS.nxSubs(vtS(), bv[0]).some(function (x) { return x.id !== sub.id && key(x.name) === key(nm); })) { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      var pf = val('ms-pfx').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '').slice(0, 8), sf = val('ms-sfx').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '').slice(0, 6);
      if (sub && !pf) { NS.toast(M('vt_needpfx'), 'bad'); return; }
      var nx = { method: val('ms-meth'), suffix: sf, fy: !!val('ms-fy'), width: +val('ms-width'), start: Math.max(1, Math.floor(num(val('ms-start')) || 1)), restart: val('ms-rst'), dup: val('ms-dup') };
      var pv = { copies: val('ms-cps') ? +val('ms-cps') : '', paper: val('ms-ppr'), design: val('ms-dsg'), notes: val('ms-nts'), terms: val('ms-trm'), printAfter: !!val('ms-pas'), shareAfter: !!val('ms-sas') };
      Object.keys(pv).forEach(function (f) { if (pv[f] === '' || pv[f] === false) delete pv[f]; });
      NS.cfgEdit(A.biz(), function (V) {
        if (sub) {
          V.vsub = (V.vsub || []).filter(function (x) { return x.id !== sub.id; });
          V.vsub.push(Object.assign({ id: sub.id, base: bv[0], kind: bv[1] || '', name: nm, prefix: pf, def: pv }, nx));
          return;
        }
        var c = V[v[0]] = V[v[0]] || {};
        if (v[1]) { c.prefixes = c.prefixes || {}; c.prefixes[v[1]] = pf; } else c.prefix = pf;
        /* only what differs from what the type gives by itself is kept, so My data's invoice digits / year still apply */
        var keep = JSON.parse(JSON.stringify(V)); if (keep.series) delete keep.series[k];
        var d0 = NS.seriesOf(keep, v[0], v[1], '', { def: v[2], width: /^(contra|jv)$/.test(v[0]) ? 3 : null, fy: /^(contra|jv)$/.test(v[0]) ? true : null }), o = {};
        Object.keys(nx).forEach(function (f) { if (nx[f] !== d0[f]) o[f] = nx[f]; });
        V.series = V.series || {}; if (Object.keys(o).length) V.series[k] = o; else delete V.series[k];
        V.vt = V.vt || {}; if (Object.keys(pv).length) V.vt[vtKey(v)] = pv; else delete V.vt[vtKey(v)];
      }, { why: 'voucher type ' + (sub ? nm : vtKey(v)) }).then(function (F) { Object.assign(A.cfg(), NS.cfgFor(F, A.biz() && A.biz().id)); done(0); }, fail);
    }, function (form) {
      function pv() {
        var bv = sub && isNew ? VT[+$('#ms-vbase', form).value] : v, g = function (id) { var e = $('#' + id, form); return e.type === 'checkbox' ? e.checked : e.value; };
        var tmp = { prefix: g('ms-pfx').toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), suffix: g('ms-sfx').toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), fy: g('ms-fy'), width: +g('ms-width'), start: Math.max(1, +g('ms-start') || 1), restart: g('ms-rst'), method: g('ms-meth'), sub: sub ? sub.id : '' };
        var x = NS.nextNo(C().doc, { type: bv[0], kind: bv[1], sub: sub ? sub.id : '', seller: A.bizName(), date: today(), series: tmp });
        $('[data-vtpv]', form).textContent = x.manual ? M('vt_manual') : x.no;
      }
      form.addEventListener('input', pv); form.addEventListener('change', pv); pv();
    });
  }
  function subNew() { var v = VT[0]; vtForm(v, { id: 'vs' + Date.now().toString(36), name: '', def: {} }, true); }
  function subDel(sub) {
    var n = vtUsed(sub.id);
    if (n) { NS.toast(M('vt_subused', { n: n }), 'bad'); return; }
    ask(M('vt_subdel', { x: sub.name })).then(function (ok) {
      if (!ok) return;
      NS.cfgEdit(A.biz(), function (V) { V.vsub = (V.vsub || []).filter(function (x) { return x.id !== sub.id; }); }, { why: 'voucher sub-type deleted ' + sub.name }).then(function (F) { Object.assign(A.cfg(), NS.cfgFor(F, A.biz() && A.biz().id)); done(0); }, fail);
    });
  }
  A.vtEdit = function (i) { return vtForm(VT[i]); };
  A.vtSubNew = subNew;

  /* ---------- stock items ---------- */
  var UNITS = ['Nos', 'Pcs', 'Kg', 'Gm', 'Ltr', 'Ml', 'Mtr', 'Sq ft', 'Box', 'Pack', 'Set', 'Pair', 'Dozen', 'Bag', 'Ton', 'Strip', 'Bottle', 'Hrs', 'Days', 'Month', 'Job'];
  var UQC = { nos: 'NOS', pcs: 'PCS', kg: 'KGS', gm: 'GMS', ltr: 'LTR', ml: 'MLT', mtr: 'MTR', 'sq ft': 'SQF', box: 'BOX', pack: 'PAC', set: 'SET', pair: 'PRS', dozen: 'DOZ', bag: 'BAG', ton: 'TON', strip: 'STR', bottle: 'BTL', hrs: 'OTH', days: 'OTH', month: 'OTH', job: 'OTH' };
  function stockMap() { var o = {}; try { if (window.NSStock && NSStock.summary) NSStock.summary(C().doc, C().item, A.bizName(), '', today()).items.forEach(function (s) { o[s.k] = s; }); } catch (e) {} return o; }
  function itemForm(it) {
    var G = NS.groupsOf(GRP(), 'item'), gopts = [['', M('primary')]].concat(G.map(function (g) { return [g.id, g.name]; }));
    var cur = it ? NS.itemGroup(it, GRP()).id : '';
    X.open(M(it ? 'item_alter' : 'item_new'), '<div class="fg">' +
      fld('ms-desc', M('name'), inp('ms-desc', it && it.desc || '', { req: 1 }), { wide: 1 }) + fld('ms-kind', NS.t('l.type'), sel('ms-kind', it && it.kind || 'goods', [['goods', NS.t('hub.k.goods')], ['service', NS.t('hub.k.service')]])) +
      fld('ms-igrp', M('under'), sel('ms-igrp', cur, gopts)) + fld('ms-unit', NS.t('l.unit'), inp('ms-unit', it && it.unit || 'Nos', { list: 'ms-units' }) + '<datalist id="ms-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist>') +
      fld('ms-hsn', NS.t('l.hsn'), inp('ms-hsn', it && it.hsn || '', { ltr: 1, mode: 'numeric' })) + fld('ms-gst', NS.t('l.gst'), sel('ms-gst', String(GC && it ? (GC.itemRate(it, today()).rate == null ? 18 : GC.itemRate(it, today()).rate) : it && it.gst != null && it.gst !== '' ? it.gst : 18), ['0', '0.1', '0.25', '1.5', '3', '5', '12', '18', '28', '40'].map(function (r) { return [r, r + '%']; }))) +
      gstFields(it) +
      fld('ms-rate', NS.t('b1.retail'), inp('ms-rate', it && it.rate || '', { mode: 'decimal', ltr: 1 })) + fld('ms-wrate', NS.t('b1.whole'), inp('ms-wrate', it && it.wrate || '', { mode: 'decimal', ltr: 1 })) +
      fld('ms-mrp', NS.t('b1.mrp'), inp('ms-mrp', it && it.mrp || '', { mode: 'decimal', ltr: 1 })) + fld('ms-prate', NS.t('b1.prate'), inp('ms-prate', it && it.prate || '', { mode: 'decimal', ltr: 1 })) +
      (A.bwLedList && (A.cfg() || {}).multiLed ? fld('ms-sl', NS.t('bw.isl'), inp('ms-sl', it && it.sl || '', { list: 'dl-sl' }) + A.bwLedList('sl'), { hint: NS.t('bw.islh') }) + fld('ms-pl', NS.t('bw.ipl'), inp('ms-pl', it && it.pl || '', { list: 'dl-pl' }) + A.bwLedList('pl')) : '') +   /* A-9 (r2-billwise) */
      fld('ms-alts', M('alts'), inp('ms-alts', altsText(it), { ltr: 1 }), { wide: 1 }) + fld('ms-track', M('track'), sel('ms-track', it && it.track || '', [['', M('tr_none')], ['batch', M('tr_batch')], ['serial', M('tr_serial')], ['both', M('tr_both')]])) +
      fld('ms-min', M('rlevel'), inp('ms-min', it && it.min || '', { mode: 'decimal', ltr: 1 })) + fld('ms-rq', M('rqty'), inp('ms-rq', it && it.rq || '', { mode: 'decimal', ltr: 1 })) +
      fld('ms-max', M('rmax'), inp('ms-max', it && it.max || '', { mode: 'decimal', ltr: 1 })) + fld('ms-lead', M('rlead'), inp('ms-lead', it && it.lead || '', { mode: 'numeric', ltr: 1 })) +
      fld('ms-sup', M('rsup'), inp('ms-sup', it && it.supplier || '')) +
      inact(it) + (it ? '' : fld('ms-oq', M('oqty', { d: NS.fmtDate(fyStart()) }), inp('ms-oq', '', { mode: 'decimal', ltr: 1 })) + fld('ms-or', M('orate'), inp('ms-or', '', { mode: 'decimal', ltr: 1 }))) +
      '<p class="soft wide">' + esc(M('altsh')) + '</p>' +
      '</div>' + (window.NSCF ? NSCF.formHtml('item', it) : '') + '<p class="soft" data-msnote></p>',
    function () {
      var nm = val('ms-desc').replace(/\s+/g, ' ');
      if (!nm) { NS.toast(A.T('need', { f: M('name') }), 'bad'); return; }
      if (C().item.some(function (x) { return key(x.desc) === key(nm) && (!it || x.id !== it.id); })) { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      var hsn = val('ms-hsn').replace(/\D/g, ''); if (hsn && !/^(\d{4}|\d{6}|\d{8})$/.test(hsn)) { NS.toast(M('hsnbad'), 'bad'); return; }
      var r = it ? JSON.parse(JSON.stringify(it)) : {}, old = it && it.desc, g = val('ms-igrp');
      r.desc = nm; r.kind = val('ms-kind'); r.unit = val('ms-unit') || 'Nos'; taxSave(r, it);
      if (hsn) r.hsn = hsn; else delete r.hsn;
      if (g) { r.group = g; r.cat = (G.filter(function (x) { return x.id === g; })[0] || {}).name || ''; } else { delete r.group; delete r.cat; }
      ['rate', 'wrate', 'mrp', 'prate'].forEach(function (f) { var v = val('ms-' + f); if (v !== '') r[f] = num(v); else delete r[f]; });
      ['sl', 'pl'].forEach(function (f) { if (!$('#ms-' + f)) return; var v = val('ms-' + f); if (v) r[f] = v; else delete r[f]; });   /* A-9: sales / purchase ledger of the item */
      if (val('ms-inact')) r.inactive = true; else delete r.inactive;
      var al = parseAlts(val('ms-alts'), r.unit); if (al === null) { NS.toast(M('altsbad'), 'bad'); return; }
      if (al.length) { r.alts = al; r.alt = al[0]; } else { delete r.alts; delete r.alt; }
      if (val('ms-track')) r.track = val('ms-track'); else delete r.track;
      [['min', 'ms-min'], ['rq', 'ms-rq'], ['max', 'ms-max'], ['lead', 'ms-lead']].forEach(function (f) { var v = num(val(f[1])); if (v > 0) r[f[0]] = v; else delete r[f[0]]; });
      if (val('ms-sup')) r.supplier = val('ms-sup'); else delete r.supplier;
      if (window.NSCF) NSCF.formRead('item', $('.acx-dlg form'), r);   /* custom fields (ERP Round 2, B-1) */
      var oq = it ? 0 : num(val('ms-oq')), orate = it ? 0 : num(val('ms-or'));
      NSStore.put('item', r).then(function () {
        if (oq > 0 && r.kind !== 'service' && A.biz()) return NSStore.put('doc', { type: 'stk', kind: 'open', date: fyStart(), no: '', seller: X.sellerCopy(), lines: [{ desc: nm, unit: r.unit, qty: oq, rate: orate || r.prate || '' }] });
      }).then(function () { return old && key(old) !== key(nm) ? renameItem(old, nm) : 0; }).then(done, fail);
    }, function (form) { if (it) { var n = usesItem(it.desc); if (n) $('[data-msnote]', form).textContent = M('usedin', { n: n }); } });
  }
  function delItem(it) {
    var n = usesItem(it.desc); if (n) { NS.toast(M('inuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: it.desc }), { danger: true, ok: NS.t('desk.del') }).then(function (y) { if (y) NSStore.del('item', it.id).then(function () { NS.toast(M('deleted')); A.show(); }, fail); });
  }


  /* ---------- GST of items and parties (ERP round 1, r1-gst: S-1 rate history and taxability, S-2 registration and PAN) ---------- */
  /* rules and sources: engine/gstcore.js (NSGst). An item keeps tax: { hist: [{ from, rate }], kind, itc, rcm }; item.gst = the rate today. */
  var GC = window.NSGst;
  function gstCell(it) { var r = GC ? GC.itemRate(it, today()) : { rate: it.gst, tk: 'taxable' }; if (r.tk && r.tk !== 'taxable') return esc(M('tk_' + r.tk)); return r.rate != null && r.rate !== '' ? esc(String(r.rate)) + '%' : ''; }
  function histTxt(it) {
    if (!GC || !it) return '';
    var h = GC.hist(it); if (h.length < 2 && !(h[0] && h[0].from)) return '';
    return M('ghist') + ': ' + h.map(function (x) { return x.rate + '%' + (x.from ? ' ' + M('gfromd', { d: NS.fmtDate(x.from) }) : ''); }).join(', ');
  }
  function gstFields(it) {
    if (!GC) return '';
    var tx = it && it.tax || {};
    return fld('ms-gfrom', M('gfrom'), inp('ms-gfrom', '', { type: 'date' }), { hint: M('gfromh') }) +
      fld('ms-tk', M('tk'), sel('ms-tk', GC.kindOf(it), [['taxable', M('tk_taxable')], ['nil', M('tk_nil')], ['exempt', M('tk_exempt')], ['nongst', M('tk_nongst')]])) +
      fld('ms-itc', M('itc'), sel('ms-itc', GC.itcOf(it), [['ok', M('itc_ok')], ['blocked', M('itc_blocked')], ['ineligible', M('itc_inel')]]), { hint: M('itch') }) +
      '<div class="f wide"><label class="chk"><input type="checkbox" id="ms-rcm"' + (tx.rcm ? ' checked' : '') + '> <span>' + esc(M('rcm')) + '</span></label>' + (histTxt(it) ? '<small class="soft">' + esc(histTxt(it)) + '</small>' : '') + '</div>';
  }
  /* the rate typed with a 'from' date adds a row to the history; a changed rate without a date applies from today; an item that never
     had a dated rate and keeps its rate stays as it was (only gst) */
  function taxSave(r, it) {
    var rate = num(val('ms-gst')), from = val('ms-gfrom');
    if (!GC) { r.gst = rate; return; }
    var now = it ? GC.itemRate(it, today()).rate : null, x = r;
    if (from) x = GC.addRate(r, from, rate, today());
    else if (!it) x.gst = rate;
    else if (now !== rate) {
      if (GC.hist(it).some(function (h) { return h.from; })) x = GC.addRate(r, today(), rate, today());
      else { x.gst = rate; if (x.tax) delete x.tax.hist; }
    }
    Object.assign(r, x);
    var tx = Object.assign({}, r.tax || {}), tk = val('ms-tk'), ic = val('ms-itc');
    if (tk && tk !== 'taxable') tx.kind = tk; else delete tx.kind;
    if (ic && ic !== 'ok') tx.itc = ic; else delete tx.itc;
    if (val('ms-rcm')) tx.rcm = true; else delete tx.rcm;
    if (Object.keys(tx).length) r.tax = tx; else delete r.tax;
  }
  /* "Apply GST 2.0 rates": items still at 12% or 28% on 22 Sep 2025. The new rate is typed for each (it depends on the HSN; never guessed). */
  function gst2Bar() {
    if (!GC) return '';
    var L = GC.gst2List(NS.forBiz(C().item, A.biz()));
    return L.length ? '<p class="callout noprint">' + esc(M('g2_bar', { n: L.length })) + ' <button type="button" class="btn sm" data-msg2>' + esc(M('g2_btn')) + '</button></p>' : '';
  }
  function gst2Form() {
    var L = GC.gst2List(NS.forBiz(C().item, A.biz())), opts = [['', M('g2_keep')]].concat(['0', '0.25', '1.5', '3', '5', '18', '40'].map(function (r) { return [r, r + '%']; }));
    X.open(M('g2_title'), '<p class="soft">' + esc(M('g2_h')) + '</p><div class="fg">' + fld('ms-g2from', M('gfrom'), inp('ms-g2from', GC.GST2.from, { type: 'date' })) + '</div>' +
      '<div class="tbl"><table><thead><tr><th class="l">' + esc(M('name')) + '</th><th class="l">' + esc(NS.t('l.hsn')) + '</th><th class="n">' + esc(M('g2_old')) + '</th><th class="l">' + esc(M('g2_new')) + '</th></tr></thead><tbody>' +
      L.map(function (x, i) { return '<tr><td class="l">' + esc(x.item.desc) + '</td><td class="l mono">' + esc(x.hsn || '—') + '</td><td class="n">' + esc(String(x.rate)) + '%</td><td class="l">' + sel('ms-g2-' + i, '', opts) + '</td></tr>'; }).join('') + '</tbody></table></div>',
    function () {
      var from = val('ms-g2from') || GC.GST2.from, jobs = [];
      L.forEach(function (x, i) { var v = val('ms-g2-' + i); if (v !== '') jobs.push(GC.addRate(x.item, from, num(v), today())); });
      if (!jobs.length) { NS.toast(M('g2_none'), 'bad'); return; }
      jobs.reduce(function (pr, r) { return pr.then(function () { return NSStore.put('item', r); }); }, Promise.resolve()).then(function () { done(0); NS.toast(M('g2_ok', { n: jobs.length })); }, fail);
    });
  }
  /* S-2: party registration type (regular, composition, unregistered, SEZ, UIN, overseas, e-commerce operator), PAN, TDS deductee type and section */
  function partyTaxFields(p) {
    var reg = GC ? GC.partyReg(p || {}) : p && p.reg || '';
    return fld('ms-reg', M('reg'), sel('ms-reg', p && p.reg || (p && p.gstin ? reg : ''), [['', M('reg_auto')], ['regular', M('reg_regular')], ['comp', M('reg_comp')], ['unreg', M('reg_unreg')], ['sez', M('reg_sez')], ['uin', M('reg_uin')], ['overseas', M('reg_overseas')], ['eco', M('reg_eco')]])) +
      fld('ms-pan', M('pan'), inp('ms-pan', p && p.pan || '', { ltr: 1 })) +
      fld('ms-ded', M('ded'), sel('ms-ded', p && p.deductee || '', [['', M('ded_auto')], ['ind', M('ded_ind')], ['huf', M('ded_huf')], ['co', M('ded_co')], ['firm', M('ded_firm')], ['other', M('ded_other')]])) +
      fld('ms-tdssec', M('tdssec'), inp('ms-tdssec', p && p.tdsSec || '', { ltr: 1 }), { hint: M('tdssech') }) +
      /* ERP round 2 (T-B12, S-21): PAN status, non-resident, lower-deduction certificate (Form 128 application, certificate from the department) */
      fld('ms-panop', M('panop'), sel('ms-panop', p && p.panOp || '', [['', M('panop_ok')], ['inoperative', M('panop_in')]]), { hint: M('panoph') }) +
      fld('ms-nr', M('nr'), sel('ms-nr', p && p.nr ? '1' : '', [['', M('nr_no')], ['1', M('nr_yes')]])) +
      (function () { var c = p && p.ldc && p.ldc[0] || {}; return fld('ms-ldcno', M('ldcno'), inp('ms-ldcno', c.no || '', { ltr: 1 }), { hint: M('ldch') }) + fld('ms-ldcrate', M('ldcrate'), inp('ms-ldcrate', c.rate || '', { ltr: 1 })) +
        fld('ms-ldclim', M('ldclim'), inp('ms-ldclim', c.limit || '', { ltr: 1 })) + fld('ms-ldcfrom', M('ldcfrom'), inp('ms-ldcfrom', c.from || '', { type: 'date' })) + fld('ms-ldcto', M('ldcto'), inp('ms-ldcto', c.to || '', { type: 'date' })); })();
  }
  function partyTaxSave(r) {
    var pan = val('ms-pan').toUpperCase().replace(/\s/g, '');
    if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) { NS.toast(M('panbad'), 'bad'); return false; }
    if (pan) r.pan = pan; else delete r.pan;
    var reg = val('ms-reg'); if (reg) r.reg = reg; else delete r.reg;
    var ded = val('ms-ded') || (GC && pan ? GC.deducteeOf(pan) : ''); if (ded) r.deductee = ded; else delete r.deductee;
    var sec = val('ms-tdssec'); if (sec) r.tdsSec = sec; else delete r.tdsSec;
    if ($('#ms-panop')) { if (val('ms-panop')) r.panOp = val('ms-panop'); else delete r.panOp; if (val('ms-nr')) r.nr = true; else delete r.nr; }
    var lno = $('#ms-ldcno') ? val('ms-ldcno') : null;
    if (lno) r.ldc = [{ no: lno, rate: num(val('ms-ldcrate')), limit: num(val('ms-ldclim')), from: val('ms-ldcfrom'), to: val('ms-ldcto'), sec: sec || '' }]; else if (lno === '') delete r.ldc;
  }

  /* ---------- transporters and vehicles (core.js NS.dispatch; meta 'dispatch') ---------- */
  var DSPM = { tr: [], veh: [] }, dspAsked = false;
  function loadDsp() { if (dspAsked) return; dspAsked = true; NS.dispatch(true).then(function (d) { DSPM = d; if (/^#masters\/(trn|veh)/.test(location.hash)) A.show(); }); }
  function usesVeh(no) { var n = NS.vehNo(no); return C().doc.filter(function (d) { return [d.tr && d.tr.veh, d.disp && d.disp.veh, d.einv && d.einv.veh, d.veh].some(function (x) { return x && NS.vehNo(x) === n; }); }).length; }
  function usesTr(nm) { var k = key(nm); return C().doc.filter(function (d) { return [d.tr && d.tr.tname, d.disp && d.disp.tname, d.einv && d.einv.tname, d.tname, d.transporter].some(function (x) { return x && key(x) === k; }); }).length; }
  function trForm(t) {
    X.open(M(t ? 'tr_alter' : 'tr_new'), '<div class="fg">' + fld('ms-tn', M('name'), inp('ms-tn', t && t.name || '', { req: 1 })) + fld('ms-tid', M('tid'), inp('ms-tid', t && t.tid || '', { ltr: 1 })) +
      fld('ms-tph', NS.t('l.phone'), inp('ms-tph', t && t.phone || '', { ltr: 1, mode: 'tel' })) + fld('ms-tad', NS.t('l.addr'), inp('ms-tad', t && t.addr || ''), { wide: 1 }) + '</div><p class="soft">' + esc(M('tidh')) + '</p>', function () {
      var nm = val('ms-tn').replace(/\s+/g, ' '), tid = val('ms-tid').toUpperCase().replace(/\s/g, '');
      if (!nm) { NS.toast(A.T('need', { f: M('name') }), 'bad'); return; }
      if (tid && !(tid.length === 15 && (NS.gstinCheck(tid).ok || /^\d{2}[A-Z0-9]{13}$/.test(tid)))) { NS.toast(M('tidbad'), 'bad'); return; }
      if (DSPM.tr.some(function (x) { return key(x.name) === key(nm) && (!t || x.id !== t.id); })) { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      NS.dispatchSave(function (Dd) { var r = t ? Dd.tr.filter(function (x) { return x.id === t.id; })[0] : null; if (!r) { r = { id: 't' + Date.now().toString(36) }; Dd.tr.push(r); } r.name = nm; r.tid = tid; r.phone = val('ms-tph'); r.addr = val('ms-tad'); })
        .then(function (d) { DSPM = d; done(0); }, fail);
    });
  }
  function vehForm(v) {
    X.open(M(v ? 'veh_alter' : 'veh_new'), '<div class="fg">' + fld('ms-vno', M('vno'), inp('ms-vno', v && v.no || '', { req: 1, ltr: 1 })) +
      fld('ms-vty', M('vkind'), sel('ms-vty', v && v.type || '', [['', ''], ['Truck', 'Truck'], ['Tempo', 'Tempo / pick-up'], ['Trailer', 'Trailer'], ['Tanker', 'Tanker'], ['Van', 'Van'], ['Car', 'Car'], ['Two-wheeler', 'Two-wheeler'], ['Other', 'Other']])) +
      fld('ms-vown', M('vowner'), sel('ms-vown', v && v.owner || 'hired', [['own', M('own_v')], ['hired', M('hired_v')]])) +
      fld('ms-vtr', M('vtr'), sel('ms-vtr', v && v.tr || '', [['', '']].concat(DSPM.tr.map(function (t) { return [t.id, t.name]; })))) +
      fld('ms-vdr', M('driver'), inp('ms-vdr', v && v.driver || '')) + fld('ms-vdp', M('dphone'), inp('ms-vdp', v && v.dphone || '', { ltr: 1, mode: 'tel' })) +
      fld('ms-vcap', M('vcap'), inp('ms-vcap', v && v.cap || '', { mode: 'decimal', ltr: 1 })) + '</div>', function () {
      var no = NS.vehNo(val('ms-vno'));
      if (!no) { NS.toast(A.T('need', { f: M('vno') }), 'bad'); return; }
      if (DSPM.veh.some(function (x) { return NS.vehNo(x.no) === no && (!v || x.id !== v.id); })) { NS.toast(M('dup', { n: no }), 'bad'); return; }
      NS.dispatchSave(function (Dd) { var r = v ? Dd.veh.filter(function (x) { return x.id === v.id; })[0] : null; if (!r) { r = { id: 'v' + Date.now().toString(36) }; Dd.veh.push(r); }
        r.no = no; r.type = val('ms-vty'); r.owner = val('ms-vown'); r.tr = val('ms-vtr'); r.driver = val('ms-vdr'); r.dphone = val('ms-vdp'); r.cap = val('ms-vcap'); })
        .then(function (d) { DSPM = d; done(0); }, fail);
    });
  }
  function delDsp(kind, r) {
    var n = kind === 'veh' ? usesVeh(r.no) : usesTr(r.name), nm = kind === 'veh' ? r.no : r.name;
    if (n) { NS.toast(M('inuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: nm }), { danger: true, ok: NS.t('desk.del') }).then(function (y) { if (y) NS.dispatchSave(function (Dd) { Dd[kind] = Dd[kind].filter(function (x) { return x.id !== r.id; }); }).then(function (d) { DSPM = d; NS.toast(M('deleted')); A.show(); }, fail); });
  }
  function trnHtml() {
    return srch() + tbl([[M('name')], [M('tid')], [NS.t('l.phone')], [M('vcount'), 'n'], ['', 'noprint']], DSPM.tr.filter(function (t) { return hit(t.name + ' ' + (t.tid || '')); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).map(function (t) {
      return '<tr><td class="l">' + esc(t.name) + '</td><td class="l mono">' + esc(t.tid || '') + '</td><td class="l mono">' + esc(t.phone || '') + '</td><td class="n">' + DSPM.veh.filter(function (v) { return v.tr === t.id; }).length + '</td>' +
        acts(ib('data-mstralt="' + esc(t.id) + '"', 'edit', M('alter')) + ib('data-mstrdel="' + esc(t.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    })) + '<p class="soft">' + esc(M('dsph')) + '</p>';
  }
  function vehHtml() {
    return srch() + tbl([[M('vno')], [M('vkind')], [M('vtr')], [M('driver')], [M('dphone')], ['', 'noprint']], DSPM.veh.filter(function (v) { return hit(v.no + ' ' + (v.driver || '')); }).sort(function (a, b) { return String(a.no).localeCompare(String(b.no)); }).map(function (v) {
      var t = DSPM.tr.filter(function (x) { return x.id === v.tr; })[0];
      return '<tr><td class="l mono">' + esc(v.no) + '</td><td class="l">' + esc(v.type || '') + (v.owner === 'own' ? ' <span class="pill">' + esc(M('own_v')) + '</span>' : '') + '</td><td class="l">' + esc(t ? t.name : '') + '</td><td class="l">' + esc(v.driver || '') + '</td><td class="l mono">' + esc(v.dphone || '') + '</td>' +
        acts(ib('data-msvalt="' + esc(v.id) + '"', 'edit', M('alter')) + ib('data-msvdel="' + esc(v.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    })) + '<p class="soft">' + esc(M('dsph')) + '</p>';
  }

  /* ---------- screens ---------- */
  /* ---------- bank accounts (ERP masters step 3) ---------- */
  function bankOb(k) { var b = key(A.bizName()); return C().doc.filter(function (d) { return d.type === 'ob' && d.side === 'bank' && !d.cf && B.bankOf(d) === k && key(d.seller && d.seller.name) === b; }).sort(function (x, y) { return String(x.date).localeCompare(String(y.date)); })[0]; }   /* the first opening balance typed (a year-end carry forward is not it) */
  /* saved vouchers of this business that use a bank account (its own opening balance left out) */
  function bankUses(k) {
    var b = key(A.bizName()), own = bankOb(k);   /* its own opening balance (the master's form) does not count; another year's does */
    return C().doc.filter(function (d) {
      if (key(d.seller && d.seller.name) !== b || own && d.id === own.id) return false;
      if (d.type === 'ob') return d.side === 'bank' && B.bankOf(d) === k;
      return d.bacct === k || d.payBacct === k || d.pay && d.pay.bacct === k || d.from === k || d.to === k || (d.lines || []).some(function (l) { return l && l.a === k; });
    });
  }
  function bankBtns(b) { return ib('data-msbalt="' + esc(b.k) + '"', 'edit', M('alter')) + (b.def ? '' : ib('data-msbdel="' + esc(b.k) + '"', 'trash', NS.t('desk.del'), 'danger')); }
  function bankForm(b) {
    var ob = b ? bankOb(b.k) : null;
    X.open(M(b ? 'bank_alter' : 'bank_new'), '<div class="fg">' +
      fld('ms-bname', M('bank_name'), inp('ms-bname', b ? b.name : '', { req: 1 }), { hint: M('bank_nameh') }) +
      fld('ms-bacc', NS.t('l.acc'), inp('ms-bacc', b ? b.acc : '', { ltr: 1, mode: 'numeric' })) + fld('ms-bifsc', NS.t('l.ifsc'), inp('ms-bifsc', b ? b.ifsc : '', { ltr: 1 })) +
      fld('ms-bbr', M('bank_branch'), inp('ms-bbr', b ? b.branch : '')) +
      fld('ms-ob', M('obal', { d: NS.fmtDate(ob ? ob.date : fyStart()) }), inp('ms-ob', ob ? Math.abs(num(ob.amount)) : '', { mode: 'decimal', ltr: 1 })) + fld('ms-obs', M('drcr'), sel('ms-obs', ob && num(ob.amount) < 0 ? 'cr' : 'dr', [['dr', M('bank_dr')], ['cr', M('bank_od')]])) +
      '</div><p class="soft">' + esc(M(b && b.def ? 'bank_defh' : 'bank_h')) + '</p><p class="soft" data-msnote></p>',
    function () {
      var nm = val('ms-bname').replace(/\s+/g, ' '), k = B.bankKey(nm), L = A.banks(), ifsc = val('ms-bifsc').toUpperCase().replace(/\s/g, '');
      if (!nm) { NS.toast(A.T('need', { f: M('bank_name') }), 'bad'); return; }
      if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { NS.toast(M('bank_ifsc'), 'bad'); return; }
      if (L.some(function (x) { return x !== b && (b ? x.k !== b.k : true) && (key(x.name) === key(nm) || !b && x.k === k); }) || !(b && b.def) && k === 'bank') { NS.toast(M('dup', { n: nm }), 'bad'); return; }
      var biz = A.biz(); if (!biz || !biz.id) { NS.toast(M('bank_nobiz'), 'bad'); return; }
      var info = { name: nm, acc: val('ms-bacc'), ifsc: ifsc, branch: val('ms-bbr') }, oldK = b ? b.k : '', newK = b && b.def ? 'bank' : k;
      var job = b && b.def
        ? NSStore.put('biz', Object.assign(JSON.parse(JSON.stringify(biz)), { bankName: info.name, bankAcc: info.acc, bankIfsc: info.ifsc, bankBranch: info.branch }))
        : metaEdit('banks', function (m) {
            var arr = m[biz.id] = m[biz.id] || [], i = b ? arr.findIndex(function (x) { return B.bankKey(x.name) === oldK; }) : -1;
            var r = Object.assign(i >= 0 ? arr[i] : { id: 'bk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }, info);
            if (i >= 0) arr[i] = r; else arr.push(r);
          });
      var obAmt = r2(num(val('ms-ob'))), sgn = val('ms-obs') === 'cr' ? -1 : 1, ob0 = oldK ? bankOb(oldK) : null;
      job.then(function () {
        if (obAmt > 0) return NSStore.put('doc', A.setBacct(Object.assign(ob0 ? JSON.parse(JSON.stringify(ob0)) : { type: 'ob', app: 1, no: '', date: fyStart(), seller: X.sellerCopy(), buyer: { name: '' } }, { side: 'bank', amount: r2(sgn * obAmt), total: r2(sgn * obAmt) }), newK === 'bank' ? '' : newK));
        if (ob0) return NSStore.del('doc', ob0.id);
      }).then(function () { return oldK && oldK !== newK ? renameBank(oldK, newK) : 0; }).then(done, fail);
    }, function (form) { if (b) { var n = bankUses(b.k).length; if (n) $('[data-msnote]', form).textContent = M('usedin', { n: n }); } });
  }
  /* a renamed bank: every voucher that names it moves to the new account */
  function renameBank(a, b) {
    var biz = key(A.bizName());
    return renameIn(function (d) { return key(d.seller && d.seller.name) === biz && (d.bacct === a || d.payBacct === a || d.pay && d.pay.bacct === a || d.from === a || d.to === a || (d.lines || []).some(function (l) { return l && l.a === a; })); }, function (d) {
      if (d.bacct === a) d.bacct = b; if (d.payBacct === a) d.payBacct = b; if (d.pay && d.pay.bacct === a) d.pay.bacct = b; if (d.from === a) d.from = b; if (d.to === a) d.to = b;
      (d.lines || []).forEach(function (l) { if (l && l.a === a) l.a = b; });
    });
  }
  function delBank(b) {
    if (!b || b.def) return;
    var n = bankUses(b.k).length; if (n) { NS.toast(M('inuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: b.name }), { danger: true, ok: NS.t('desk.del') }).then(function (y) {
      if (!y) return;
      var biz = A.biz(), ob = bankOb(b.k);
      metaEdit('banks', function (m) { m[biz.id] = (m[biz.id] || []).filter(function (x) { return B.bankKey(x.name) !== b.k; }); })
        .then(function () { return ob ? NSStore.del('doc', ob.id) : 0; }).then(function () { NS.toast(M('deleted')); A.show(); }, fail);
    });
  }
  function bankHtml() {
    var acc = B.accounts(C().doc, A.bizName(), today()), L = A.banks();
    return tbl([[M('bank_name')], [NS.t('l.acc')], [NS.t('l.ifsc')], [M('bank_branch')], [M('bal'), 'n'], ['', 'noprint']], L.map(function (b) {
      return '<tr><td class="l"><a href="#cash/' + encodeURIComponent(b.k) + '">' + esc(b.name) + '</a>' + (b.def ? ' <span class="pill">' + esc(M('default')) + '</span>' : '') + '</td><td class="l mono">' + esc(b.acc || '') + '</td><td class="l mono">' + esc(b.ifsc || '') + '</td><td class="l">' + esc(b.branch || '') + '</td>' +
        '<td class="n">' + balTxt(acc[b.k] || 0) + '</td>' + acts(bankBtns(b)) + '</tr>';
    })) + '<p class="soft">' + esc(M('bankh')) + '</p>';
  }

  /* ---------- screens ---------- */
  var TABS = [['', 'gw'], ['led', 'led'], ['bank', 'bank'], ['grp', 'grp'], ['vt', 'vt'], ['item', 'item'], ['igrp', 'igrp'], ['unit', 'unit'], ['trn', 'trn'], ['veh', 'veh'], ['biz', 'biz']];
  /* other files add their own tabs: window.NSMsExt = [{ id, html(), wire(pane), newKey }] (cfields.js: custom fields, remembered entries) */
  function EXT(id) { return (window.NSMsExt || []).filter(function (x) { return x.id === id; })[0]; }
  function tabsAll() { return TABS.concat((window.NSMsExt || []).map(function (x) { return [x.id, x.id]; })); }
  /* the masters by kind, as on the gateway: one 'Go to master' box on a list page replaces the old row of chip tabs (19 Nov 2026) */
  var KINDS = [['g_acc', ['led', 'grp', 'bank', 'vt']], ['g_inv', ['item', 'igrp', 'unit']], ['g_dsp', ['trn', 'veh']], ['g_co', ['biz']]];
  function tabs(cur) {
    if (!cur) return '';
    var ext = (window.NSMsExt || []).map(function (x) { return x.id; }), all = KINDS.map(function (k) { return [k[0], k[1].concat(k[0] === 'g_co' ? ext : [])]; });
    return '<nav class="ms-crumb" aria-label="' + esc(M('title')) + '"><a href="#masters">' + esc(M('title')) + '</a><span aria-hidden="true">›</span><b>' + esc(M('t_' + cur)) + '</b>' +
      '<label class="ms-goto"><span class="vh">' + esc(M('goto')) + '</span><select id="ms-goto" aria-label="' + esc(M('goto')) + '">' + all.map(function (k) {
        return '<optgroup label="' + esc(M(k[0])) + '">' + k[1].map(function (id) { return '<option value="' + id + '"' + (id === cur ? ' selected' : '') + '>' + esc(M('t_' + id)) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select></label></nav>';
  }
  var MSQ = '';
  function q() { return MSQ.trim().toLowerCase(); }
  function srch() { return '<div class="f ms-find"><label for="ms-q" class="vh">' + esc(M('find')) + '</label><input id="ms-q" type="search" placeholder="' + esc(M('find')) + '" value="' + esc(MSQ) + '" autocomplete="off"></div>'; }
  function hit(s) { var w = q(); return !w || String(s || '').toLowerCase().indexOf(w) >= 0; }
  function tbl(head, rows) { return rows.length ? '<div class="tbl-wrap"><table class="tbl ms-tbl"><thead><tr>' + head.map(function (h) { return '<th' + (h[1] ? ' class="' + h[1] + '"' : '') + '>' + esc(h[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<p class="soft">' + esc(M('none')) + '</p>'; }
  function acts(x) { return '<td class="noprint ms-acts">' + x + '</td>'; }
  function ib(attr, ic, label, cls) { return '<button type="button" class="btn sm ib' + (cls ? ' ' + cls : '') + '" ' + attr + ' title="' + esc(label) + '" aria-label="' + esc(label) + '">' + NS.icSvg(ic) + '</button>'; }

  function gateway() {
    var D = C(), P = NS.forBiz(D.party, A.biz()).length, I = NS.forBiz(D.item, A.biz()).length, L = ledgers().length;
    var card = function (title, rows) {
      return '<section class="card ms-card"><h3>' + esc(M(title)) + '</h3><ul class="ms-list">' + rows.map(function (r) {
        return '<li><a href="' + r[1] + '"><b>' + esc(M(r[0])) + '</b>' + (r[2] != null ? ' <span class="pill">' + r[2] + '</span>' : '') + '</a>' + (r[3] ? '<button type="button" class="btn sm" data-msnew="' + r[3] + '">+ ' + esc(M('create')) + '</button>' : '') + '</li>';
      }).join('') + '</ul></section>';
    };
    /* five lists, as in Tally's Create / Alter: what you set up once, nothing else (settings and features are under Utilities) */
    return '<div class="ms-gw">' +
      card('g_acc', [['t_led', '#masters/led', L, 'led'], ['t_grp', '#masters/grp', NS.groupsOf(GRP(), 'party').length + PRIMARY.length, 'grp'], ['t_bank', '#masters/bank', A.banks ? A.banks().length : 1, 'bank'], ['t_vt', '#masters/vt', VT.length, 'vt'], ['t_ob', '#money', null, 'ob'], ['t_coa', '#coa']]) +
      card('g_inv', [['t_item', '#masters/item', I, 'item'], ['t_igrp', '#masters/igrp', NS.groupsOf(GRP(), 'item').length, 'igrp'], ['t_unit', '#masters/unit', null, 'unit'], ['t_gd', '#b2gd'], ['t_bom', '#b2make']]) +
      card('g_pay', [['t_emp', '#stf/emp'], ['t_sman', '#b2sman']]) +
      card('g_dsp', [['t_trn', '#masters/trn', DSPM.tr.length, 'trn'], ['t_veh', '#masters/veh', DSPM.veh.length, 'veh']]) +
      card('g_co', [['t_biz', '#masters/biz', D.biz.length, 'biz']].concat(window.NSMsExt ? [['t_cf', '#masters/cf', EXT('cf') ? EXT('cf').count() : null, 'cf'], ['t_rem', '#masters/rem']] : [])) +
      '</div><p class="soft">' + esc(M('gwh')) + '</p>';
  }
  /* the ledger rows the search leaves (name, group and the party's custom field values): the list and its buttons use the same rows */
  function ledRows() { return ledgers().filter(function (r) { var cf = r.kind === 'party' && r.rec.cf && window.NSCF ? Object.keys(r.rec.cf).map(function (id) { var f = NSCF.get(id); return f ? NSCF.fmt(f, r.rec.cf[id]) : ''; }).join(' ') : ''; return hit(r.name + ' ' + r.group + ' ' + cf); }); }
  function ledHtml() {
    var R = ledRows();
    var CC = window.NSCF ? NSCF.colsTargets(['party']) : [];   /* custom fields marked "show in registers" (ERP Round 2) */
    return srch() + tbl([[M('name')], [M('under')]].concat(CC.map(function (f) { return [f.label]; }), [[M('bal'), 'n'], ['', 'noprint']]), R.map(function (r, i) {
      var nm = r.kind === 'party' || r.kind === 'party0' ? '<a href="#st/' + encodeURIComponent(key(r.name)) + '">' + esc(r.name) + '</a>' + offPill(r.rec) : r.k ? '<a href="#acl/' + encodeURIComponent(r.k) + '">' + esc(r.name) + '</a>' : esc(r.name);
      var a = r.kind === 'party' || r.kind === 'head' ? ib('data-msalt="' + i + '"', 'edit', M('alter')) + ib('data-msdel="' + i + '"', 'trash', NS.t('desk.del'), 'danger') : r.kind === 'bank' ? bankBtns(r.rec) : r.kind === 'sys' ? '<small class="soft">' + esc(M('auto')) + '</small>' : '';
      return '<tr data-msi="' + i + '" tabindex="0"><td class="l">' + nm + '</td><td class="l">' + esc(r.group) + '</td>' + (CC.length ? NSCF.colCells(CC, r.kind === 'party' ? r.rec : null) : '') + '<td class="n">' + balTxt(r.bal) + '</td>' + acts(a) + '</tr>';
    })) + '<div class="ms-strip" data-msstrip aria-live="polite"><span class="soft">Point at an account, or move with ↑ ↓, to see its details here.</span></div><p class="soft">' + esc(M('ledh')) + '</p>';
  }
  /* the details strip of one ledger line (Evershine's account list) */
  function stripHtml(r) {
    var p = r.rec || {}, st = p.state && NS.stateName ? NS.stateName(p.state) : p.state, bits = [];
    var add = function (l, v, cls) { if (v) bits.push('<span><small>' + esc(l) + '</small> <b' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(v) + '</b></span>'); };
    add('Address', [p.addr, p.city, p.pin, st].filter(Boolean).join(', ')); add('GSTIN', p.gstin, 'mono'); add('PAN', p.pan, 'mono'); add('Phone', p.phone, 'mono'); add('Email', p.email);
    add('Route', p.route); add('Agent', p.agent); add('Distance', p.km ? p.km + ' km' : ''); add('Credit limit', p.climit ? NS.money(p.climit) : ''); add('Credit days', p.cdays ? p.cdays + ' days' : '');
    add('Balance', r.bal ? NS.money(Math.abs(r.bal)) + (r.bal > 0 ? ' Dr' : ' Cr') : 'Nil');
    return '<b class="ms-sn">' + esc(r.name) + '</b> <small class="soft">' + esc(r.group) + '</small><div class="ms-sb">' + bits.join('') + '</div>';
  }
  function grpHtml() {
    var own = NS.groupsOf(GRP(), 'party').filter(function (g) { return !g.builtin && hit(g.name); }), L = NS.groupsOf(GRP(), 'party');
    var nat = { liab: M('liab'), asset: M('asset'), inc: M('inc'), exp: M('exp') };
    return srch() + '<h3>' + esc(M('own')) + '</h3>' + tbl([[M('name')], [M('under')], [M('count'), 'n'], ['', 'noprint']], own.map(function (g) {
      var up = L.filter(function (x) { return x.id === g.under; })[0];
      return '<tr><td class="l">' + esc(g.name) + '</td><td class="l">' + esc(up ? up.name : '') + '</td><td class="n">' + C().party.filter(function (p) { return p.group === g.id; }).length + '</td>' + acts(ib('data-msgalt="' + esc(g.id) + '"', 'edit', M('alter')) + ib('data-msgdel="' + esc(g.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    })) + '<h3>' + esc(M('std')) + '</h3>' + tbl([[M('name')], [M('under')], [M('nature')]], PRIMARY.filter(function (p) { return hit(p[1]); }).map(function (p) {
      return '<tr><td class="l">' + esc(p[1]) + '</td><td class="l">' + esc(p[3] ? pName(p[3]) : M('primary')) + '</td><td class="l">' + esc(nat[p[2]]) + '</td></tr>';
    })) + '<p class="soft">' + esc(M('grph')) + '</p>';
  }
  function vtHtml() {
    var subs = vtS().vsub || [], rows = [];
    VT.forEach(function (v, i) {
      if (!hit(NS.t(v[3]))) return;
      var ser = vtSer(v);
      rows.push('<tr><td class="l">' + esc(NS.t(v[3])) + '</td><td class="l mono">' + esc(ser.prefix) + '</td><td class="l">' + esc(M('vt_m_' + ser.method)) + '</td><td class="l mono">' + esc(vtNext(v)) + '</td>' + acts(ib('data-msvt="' + i + '"', 'edit', M('alter'))) + '</tr>');
      subs.filter(function (x) { return x.base === v[0] && (x.kind || '') === (v[1] || ''); }).forEach(function (x) {
        rows.push('<tr class="ms-sub"><td class="l">\u2514 ' + esc(x.name) + (x.off ? ' <span class="pill">' + esc(M('inactp')) + '</span>' : '') + '</td><td class="l mono">' + esc(vtPrefix(v, x.id)) + '</td><td class="l">' + esc(M('vt_m_' + vtSer(v, x.id).method)) + '</td><td class="l mono">' + esc(vtNext(v, x.id)) + '</td>' +
          acts(ib('data-msvsalt="' + esc(x.id) + '"', 'edit', M('alter')) + ib('data-msvsdel="' + esc(x.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>');
      });
    });
    return srch() + tbl([[M('vtype')], [NS.t('hub.pfx')], [M('vt_meth')], [M('nextno')], ['', 'noprint']], rows) + '<p class="soft">' + esc(M('vth')) + ' ' + esc(M('vt_h3')) + '</p>';
  }
  function itemHtml() {
    var CC = window.NSCF ? NSCF.colsTargets(['item']) : [], cft = function (it) { return CC.map(function (f) { return NSCF.fmt(f, it.cf && it.cf[f.id]); }).join(' '); };
    var S = stockMap(), L = NS.forBiz(C().item, A.biz()).filter(function (it) { return hit(it.desc + ' ' + (it.hsn || '') + ' ' + (it.cat || '') + ' ' + cft(it)); }).sort(function (a, b) { return String(a.desc).localeCompare(String(b.desc)); });
    return srch() + tbl([[M('name')], [M('under')]].concat(CC.map(function (f) { return [f.label]; }), [[NS.t('l.unit')], [NS.t('l.hsn')], [NS.t('l.gst'), 'n'], [NS.t('b1.retail'), 'n'], [M('stock'), 'n'], ['', 'noprint']]), L.map(function (it) {
      var s = S[key(it.desc)], g = NS.itemGroup(it, GRP());
      return '<tr><td class="l">' + esc(it.desc) + offPill(it) + '</td><td class="l">' + esc(g.name || '') + '</td>' + (CC.length ? NSCF.colCells(CC, it) : '') + '<td class="l">' + esc(it.unit || '') + '</td><td class="l mono">' + esc(it.hsn || '') + '</td><td class="n">' + gstCell(it) + '</td><td class="n">' + (it.rate ? money(it.rate, false) : '') + '</td><td class="n">' + (it.kind === 'service' ? '' : s ? esc(String(s.close)) : '0') + '</td>' +
        acts(ib('data-msialt="' + esc(it.id) + '"', 'edit', M('alter')) + ib('data-msidel="' + esc(it.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    })) + gst2Bar();
  }
  function igrpHtml() {
    var L = NS.groupsOf(GRP(), 'item');
    return srch() + tbl([[M('name')], [M('under')], [M('count'), 'n'], ['', 'noprint']], L.filter(function (g) { return hit(g.name); }).map(function (g) {
      var up = L.filter(function (x) { return x.id === g.under; })[0];
      return '<tr><td class="l">' + esc(g.name) + '</td><td class="l">' + esc(up ? up.name : M('primary')) + '</td><td class="n">' + C().item.filter(function (it) { return NS.itemGroup(it, GRP()).id === g.id; }).length + '</td>' + acts(ib('data-msigalt="' + esc(g.id) + '"', 'edit', M('alter')) + ib('data-msigdel="' + esc(g.id) + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    }));
  }
  /* ---------- unit master (ERP round 1, I-3) ---------- */
  var UM = [], umAsked = false;
  var UQCS = ['BAG', 'BAL', 'BDL', 'BKL', 'BOU', 'BOX', 'BTL', 'BUN', 'CAN', 'CBM', 'CCM', 'CMS', 'CTN', 'DOZ', 'DRM', 'GGK', 'GMS', 'GRS', 'GYD', 'KGS', 'KLR', 'KME', 'LTR', 'MLT', 'MTR', 'MTS', 'NOS', 'OTH', 'PAC', 'PCS', 'PRS', 'QTL', 'ROL', 'SET', 'SQF', 'SQM', 'SQY', 'STR', 'TBS', 'TGM', 'THD', 'TON', 'TUB', 'UGS', 'UNT', 'YDS'];
  function loadUnits(force) { if (umAsked && !force) return; umAsked = true; NSStore.meta('units').then(function (m) { UM = Array.isArray(m) ? m : []; if (window.NSMfg && NSMfg.setUnits) NSMfg.setUnits(UM); if (/^#masters\/unit/.test(location.hash)) A.show(); }).catch(function () {}); }
  function ukey(u) { return window.NSMfg && NSMfg.ukey ? NSMfg.ukey(u) : key(u); }
  function altsText(it) { return (window.NSMfg && NSMfg.altsOf ? NSMfg.altsOf(it) : (it && it.alt ? [it.alt] : [])).map(function (a) { return a.unit + ' = ' + a.per; }).join(', '); }
  /* "Box = 12, Carton = 144" -> [{ unit, per }] (per = base units in one); null when a part cannot be read */
  function parseAlts(txt, base) {
    var out = [], bad = false;
    String(txt || '').split(/[,;]+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (part) {
      var m = /^(.+?)\s*(?:=|:|\s)\s*([0-9]*\.?[0-9]+)\s*(?:[A-Za-z. ]*)$/.exec(part);
      if (!m || !(parseFloat(m[2]) > 0) || ukey(m[1]) === ukey(base)) { bad = true; return; }
      out.push({ unit: m[1].trim(), per: parseFloat(m[2]) });
    });
    return bad ? null : out;
  }
  function unitUses(sym) { var k = ukey(sym); return C().item.filter(function (it) { return ukey(it.unit) === k || (it.alts || []).concat(it.alt ? [it.alt] : []).some(function (a) { return a && ukey(a.unit) === k; }); }).length; }
  function unitHtml() {
    loadUnits();
    var n = {}; NS.forBiz(C().item, A.biz()).forEach(function (it) { var u = String(it.unit || '').trim(); if (u) n[ukey(u)] = { sym: u, c: ((n[ukey(u)] || {}).c || 0) + 1 }; });
    var own = UM.filter(function (u) { return hit(u.sym + ' ' + (u.name || '')); });
    var loose = Object.keys(n).filter(function (k) { return !UM.some(function (u) { return ukey(u.sym) === k; }) && hit(n[k].sym); }).sort();
    var conv = function (u) { var c = u.compound; return c && c.second && num(c.per) > 0 ? '1 ' + u.sym + ' = ' + NS.qty(num(c.per)) + ' ' + c.second : ''; };
    return srch() + '<h3>' + esc(M('um_own')) + '</h3>' + tbl([[NS.t('l.unit')], [M('name')], [M('uqc')], [M('um_dec'), 'n'], [M('um_conv')], [M('count'), 'n'], ['', 'noprint']], own.map(function (u, i) {
      return '<tr><td class="l mono">' + esc(u.sym) + '</td><td class="l">' + esc(u.name || '') + '</td><td class="l mono">' + esc(u.uqc || 'OTH') + '</td><td class="n">' + (u.dec != null ? u.dec : '') + '</td><td class="l">' + esc(conv(u)) + '</td><td class="n">' + unitUses(u.sym) + '</td>' +
        acts(ib('data-msualt="' + i + '"', 'edit', M('alter')) + ib('data-msudel="' + i + '"', 'trash', NS.t('desk.del'), 'danger')) + '</tr>';
    })) + (loose.length ? '<h3>' + esc(M('um_loose')) + '</h3>' + tbl([[NS.t('l.unit')], [M('uqc')], [M('count'), 'n'], ['', 'noprint']], loose.map(function (k) {
      return '<tr><td class="l mono">' + esc(n[k].sym) + '</td><td class="l mono">' + esc(UQC[n[k].sym.toLowerCase()] || (window.NSMfg ? NSMfg.uqc(n[k].sym) : 'OTH')) + '</td><td class="n">' + n[k].c + '</td>' + acts('<button type="button" class="btn sm" data-msuadd="' + esc(n[k].sym) + '">+ ' + esc(M('um_add')) + '</button>') + '</tr>';
    })) : '') + '<h3>' + esc(M('um_fixed')) + '</h3><p class="soft">' + esc((window.NSMfg && NSMfg.FIXED || []).map(function (p) { var c = function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }; return '1 ' + c(p[0]) + ' = ' + p[1] + ' ' + c(p[2]); }).join(' · ')) + '</p><p class="soft">' + esc(M('unith2')) + '</p>';
  }
  function unitForm(u, sym0) {
    var others = UM.filter(function (x) { return x !== u; }).map(function (x) { return x.sym; }).concat(UNITS).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var c = u && u.compound || {};
    X.open(M(u ? 'um_alter' : 'unit_new'), '<div class="fg">' + fld('ms-usym', M('um_sym'), inp('ms-usym', u ? u.sym : sym0 || '', { req: 1, ltr: 1 })) + fld('ms-uname', M('name'), inp('ms-uname', u && u.name || '')) +
      fld('ms-uqc', M('uqc'), sel('ms-uqc', u && u.uqc || (window.NSMfg ? NSMfg.uqc(u ? u.sym : sym0 || '') : 'OTH'), UQCS.map(function (x) { return [x, x]; }))) +
      fld('ms-udec', M('um_dec'), sel('ms-udec', String(u && u.dec != null ? u.dec : 2), [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']])) +
      fld('ms-uper', M('um_per'), inp('ms-uper', c.per || '', { mode: 'decimal', ltr: 1 })) + fld('ms-usec', M('um_second'), inp('ms-usec', c.second || '', { list: 'ms-ulist', ltr: 1 }) + '<datalist id="ms-ulist">' + others.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>') +
      '</div><p class="soft">' + esc(M('um_h')) + '</p>', function () {
      var sym = val('ms-usym').replace(/\s+/g, ' '), per = num(val('ms-uper')), sec = val('ms-usec');
      if (!sym) { NS.toast(A.T('need', { f: M('um_sym') }), 'bad'); return; }
      if (UM.some(function (x) { return x !== u && ukey(x.sym) === ukey(sym); })) { NS.toast(M('dup', { n: sym }), 'bad'); return; }
      if (u && ukey(u.sym) !== ukey(sym) && unitUses(u.sym)) { NS.toast(M('um_inuse', { n: unitUses(u.sym) }), 'bad'); return; }
      if ((per > 0) !== !!sec || sec && ukey(sec) === ukey(sym)) { NS.toast(M('um_convbad'), 'bad'); return; }
      var r = { sym: sym, name: val('ms-uname'), uqc: val('ms-uqc') || 'OTH', dec: +val('ms-udec') }; if (per > 0) r.compound = { per: per, second: sec };
      NSStore.meta('units').then(function (m) {
        var L = Array.isArray(m) ? m : [], i = u ? L.findIndex(function (x) { return ukey(x.sym) === ukey(u.sym); }) : -1;
        if (i >= 0) L[i] = r; else L.push(r);
        return NSStore.meta('units', L).then(function () { UM = L; if (window.NSMfg && NSMfg.setUnits) NSMfg.setUnits(L); });
      }).then(function () { done(0); }, fail);
    });
  }
  function delUnit(u) {
    var n = unitUses(u.sym); if (n) { NS.toast(M('um_inuse', { n: n }), 'bad'); return; }
    ask(M('delq', { x: u.sym }), { danger: true, ok: NS.t('desk.del') }).then(function (y) {
      if (!y) return;
      NSStore.meta('units').then(function (m) { var L = (Array.isArray(m) ? m : []).filter(function (x) { return ukey(x.sym) !== ukey(u.sym); }); return NSStore.meta('units', L).then(function () { UM = L; if (window.NSMfg && NSMfg.setUnits) NSMfg.setUnits(L); }); })
        .then(function () { NS.toast(M('deleted')); A.show(); }, fail);
    });
  }
  function bizHtml() {
    var def = (A.cfg() || {}).defBiz;
    return tbl([[M('name')], [NS.t('l.gstin')], [NS.t('l.state')], ['', 'noprint']], C().biz.map(function (b) {
      return '<tr><td class="l">' + esc(b.name) + (b.id === def ? ' <span class="pill">' + esc(M('default')) + '</span>' : '') + '</td><td class="l mono">' + esc(b.gstin || '') + '</td><td class="l">' + esc(b.state ? NS.stateLoc(b.state) : '') + '</td>' +
        acts('<a class="btn sm ib" href="#do/my/#biz" title="' + esc(M('alter')) + '" aria-label="' + esc(M('alter')) + '">' + NS.icSvg('edit') + '</a>') + '</tr>';
    })) + '<p class="soft">' + esc(M('bizh')) + '</p>' + unlinkedHtml();
  }
  /* vouchers that no business claims (C-1): typed seller name matches no business, or matches two; link them to one */
  function unlinkedHtml() {
    var U = NSStore.unlinked ? NSStore.unlinked(C().doc) : [], L = C().biz;
    if (!U.length) return '<p class="soft ms-ul-ok">' + esc(M('ul_none')) + '</p>';
    var opts = L.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>'; }).join('');
    return '<h3>' + esc(M('ul_title', { n: U.reduce(function (s, u) { return s + u.n; }, 0) })) + '</h3><p class="soft">' + esc(M('ul_h')) + '</p>' +
      tbl([[M('ul_seller')], [M('ul_count'), 'n'], [M('ul_to'), 'noprint']], U.map(function (u, i) {
        return '<tr><td class="l">' + (u.name ? esc(u.name) : '<i class="soft">' + esc(M('ul_blank')) + '</i>') + '</td><td class="n">' + u.n + '</td>' +
          '<td class="noprint ms-acts">' + (L.length ? '<label class="vh" for="ms-ul-' + i + '">' + esc(M('ul_to')) + '</label><select id="ms-ul-' + i + '" data-msul-biz="' + i + '">' + opts + '</select> <button type="button" class="btn sm" data-msul="' + i + '">' + esc(M('ul_link')) + '</button>' : '') + '</td></tr>';
      }));
  }
  function linkUnlinked(i) {
    var u = (NSStore.unlinked(C().doc))[i], s = $('[data-msul-biz="' + i + '"]'); if (!u || !s || !s.value) return;
    var b = C().biz.filter(function (x) { return x.id === s.value; })[0]; if (!b) return;
    ask(M('ul_q', { n: u.n, s: u.name || M('ul_blank'), b: b.name }), { ok: M('ul_link') }).then(function (y) {
      if (!y) return;
      return NSStore.linkTo(u.name, b.id).then(function (n) {
        var k = key(u.name); C().doc.forEach(function (d) { if (d && !d.bizId && d.seller && key(d.seller.name) === k) { d.bizId = b.id; d.seller.name = b.name; } });   /* the screen's copy, as the next read gives it */
        NS.toast(M('ul_done', { n: n, b: b.name }), 'ok'); A.show();
      });
    }).catch(function (e) { NS.toast(e && e.message || String(e), 'bad'); });
  }
  var NEW = { vt: 'vt_subnew', led: 'led_new', bank: 'bank_new', grp: 'grp_new', item: 'item_new', igrp: 'grp_new', biz: 'biz_new', trn: 'tr_new', veh: 'veh_new', unit: 'unit_new' };
  A.addSection('masters', function (arg) {
    loadHeads(); loadDsp(); loadUnits();
    var cur = tabsAll().some(function (t) { return t[0] === String(arg || '').split('/')[0]; }) ? String(arg || '').split('/')[0] : '';
    var body = { led: ledHtml, bank: bankHtml, grp: grpHtml, vt: vtHtml, item: itemHtml, igrp: igrpHtml, unit: unitHtml, trn: trnHtml, veh: vehHtml, biz: bizHtml }[cur] || EXT(cur) && EXT(cur).html;
    var nk = NEW[cur] ? M(NEW[cur]) : EXT(cur) && EXT(cur).newKey ? NS.t(EXT(cur).newKey) : '';
    return '<div class="pane-hd"><h2>' + esc(cur ? M('t_' + cur) : M('title')) + '</h2>' + (nk ? '<div class="quick"><button type="button" class="btn primary" data-msnew="' + cur + '">+ ' + esc(nk) + '</button></div>' : '') + '</div>' +
      tabs(cur) + (body ? body() : gateway());
  }, function (pane) {
    (window.NSMsExt || []).forEach(function (x) { if (x.wire) x.wire(pane); });
    var gt = $('#ms-goto', pane); if (gt) gt.addEventListener('change', function () { location.hash = '#masters/' + gt.value; });
    if (!pane._msStrip) {   /* Masters > Ledgers: the line in focus fills the details strip; Up / Down move between lines (one set of listeners: the pane stays) */
      pane._msStrip = 1;
      var fill = function (tr) { var strip = $('[data-msstrip]', pane), r = tr && strip && ledRows()[+tr.getAttribute('data-msi')]; if (!r) return; $$('tr.ms-cur', pane).forEach(function (x) { x.classList.remove('ms-cur'); }); tr.classList.add('ms-cur'); strip.innerHTML = stripHtml(r); };
      pane.addEventListener('mouseover', function (e) { var tr = e.target.closest && e.target.closest('tr[data-msi]'); if (tr) fill(tr); });
      pane.addEventListener('focusin', function (e) { var tr = e.target.closest && e.target.closest('tr[data-msi]'); if (tr) fill(tr); });
      pane.addEventListener('keydown', function (e) { var tr = e.target.closest && e.target.closest('tr[data-msi]'); if (!tr || !/^Arrow(Up|Down)$/.test(e.key)) return; e.preventDefault(); var n = e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling; if (n && n.matches('tr[data-msi]')) { n.focus(); fill(n); } });
    }
    var qi = $('#ms-q', pane); if (qi) { qi.addEventListener('input', function () { MSQ = qi.value; var p = qi.selectionStart; A.show(); var n = $('#ms-q'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (e) {} } }); }
    if (pane._msWired) return; pane._msWired = 1;   /* the pane stays from screen to screen: one listener */
    pane.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !/^#masters/.test(location.hash)) return;
      var R = /^#masters\/led/.test(location.hash) ? ledRows() : [];
      var g = function (a) { return b.getAttribute(a); };
      /* unit master (ERP round 1, I-3) */
      if (g('data-msnew') === 'unit') return unitForm();
      if (g('data-msnew') === 'vt') return subNew();   /* A-7: a voucher sub-type */
      if (g('data-msuadd') != null) return unitForm(null, g('data-msuadd'));
      if (g('data-msualt') != null) return unitForm(UM.filter(function (u) { return hit(u.sym + ' ' + (u.name || '')); })[+g('data-msualt')]);
      if (g('data-msudel') != null) return delUnit(UM.filter(function (u) { return hit(u.sym + ' ' + (u.name || '')); })[+g('data-msudel')]);
      if (g('data-msnew') != null) { var k = g('data-msnew'); if (k === 'led') ledgerForm(); else if (k === 'grp') groupForm('party'); else if (k === 'item') itemForm(); else if (k === 'igrp') groupForm('item'); else if (k === 'ob') A.openForm('ob'); else if (k === 'biz') location.hash = 'do/my/#biz/new'; else if (k === 'trn') trForm(); else if (k === 'veh') vehForm(); else if (k === 'bank') bankForm(); return; }
      var bk = function (k) { return (A.banks ? A.banks() : []).filter(function (x) { return x.k === k; })[0]; };
      if (g('data-msbalt') != null) return bankForm(bk(g('data-msbalt')));
      if (g('data-msbdel') != null) return delBank(bk(g('data-msbdel')));
      if (g('data-msalt') != null) return ledgerForm(R[+g('data-msalt')]);
      if (g('data-msdel') != null) return delLedger(R[+g('data-msdel')]);
      var gr = function (kind, id) { return NS.groupsOf(GRP(), kind).filter(function (x) { return x.id === id; })[0]; };
      if (g('data-msgalt') != null) return groupForm('party', gr('party', g('data-msgalt')));
      if (g('data-msgdel') != null) return delGroup('party', gr('party', g('data-msgdel')));
      if (g('data-msigalt') != null) return groupForm('item', gr('item', g('data-msigalt')));
      if (g('data-msigdel') != null) return delGroup('item', gr('item', g('data-msigdel')));
      var it = function (id) { return C().item.filter(function (x) { return x.id === id; })[0]; };
      if (g('data-msialt') != null) return itemForm(it(g('data-msialt')));
      if (g('data-msidel') != null) return delItem(it(g('data-msidel')));
      if (g('data-msg2') != null) return gst2Form();
      if (g('data-msvt') != null) return vtForm(VT[+g('data-msvt')]);
      if (g('data-msvsalt') != null) { var sv = vtSub(g('data-msvsalt')); return sv && vtForm(vtBase(sv), sv); }
      if (g('data-msvsdel') != null) { var sd = vtSub(g('data-msvsdel')); return sd && subDel(sd); }
      if (g('data-msul') != null) return linkUnlinked(+g('data-msul'));
      var tr = function (id) { return DSPM.tr.filter(function (x) { return x.id === id; })[0]; }, vh = function (id) { return DSPM.veh.filter(function (x) { return x.id === id; })[0]; };
      if (g('data-mstralt') != null) return trForm(tr(g('data-mstralt')));
      if (g('data-mstrdel') != null) return delDsp('tr', tr(g('data-mstrdel')));
      if (g('data-msvalt') != null) return vehForm(vh(g('data-msvalt')));
      if (g('data-msvdel') != null) return delDsp('veh', vh(g('data-msvdel')));
    });
  });
  A.mastersLedger = ledgerForm; A.mastersItem = itemForm; A.mastersBank = bankForm;
})();
