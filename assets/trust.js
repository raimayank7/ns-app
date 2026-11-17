/* NS trust (India plan D, 2026-11-17): "Donations and members" for trusts, NGOs, gurdwaras, temples, mosques, churches, societies and clubs.
   An App section (#trust): donation receipts (with the trust's PAN and, when it has one, its 80G number and dates as typed from its own approval order),
   member subscriptions (yearly, monthly or one-time plans, dues per member, receipts for what was paid), the donor register, a donor-wise yearly
   statement, fund-wise totals, Excel (CSV) files and print. The sums are trustcore.js (pure, tested by scripts/test_trust.js).
   Data stays in the shared data home: the receipt is a 'doc' record of type 'don' (books.js posts it as income received: Dr cash / bank, Cr the income head,
   so Income and Expenditure and Receipts and Payments count it); members are 'party' records (member: 1); the set-up is meta 'trust:<business>'.
   Screen text comes from NS.t('tr.<key>'); the printed receipt, statements and files are in English. Nothing is sent anywhere by the App. */
(function () {
  'use strict';
  var NS = window.NS, T = window.NSTrust, A = window.NSApp; if (!T || !A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, r2 = NS.r2, num = NS.num, money = NS.money;
  function t(k, v) { return NS.t('tr.' + k, v); }
  var tab = 'rcpt', S = null, loaded = false, fy = '', q = '', pane = null, BK = '';

  function bizKey() { return T.key(A.bizName()); }
  function setupKey() { return 'trust:' + bizKey(); }
  function defaultsFromBiz() {
    var b = A.biz() || {}, s = T.defaults();
    s.name = b.name || ''; s.addr = [b.addr, b.city, b.pin].filter(Boolean).join(', '); s.pan = b.pan || (b.gstin ? String(b.gstin).slice(2, 12) : '');
    return s;
  }
  function load() {
    if (BK === bizKey() && loaded) return;
    BK = bizKey(); loaded = false;
    NSStore.meta(setupKey()).then(function (m) {
      S = Object.assign(defaultsFromBiz(), m || {}); S.plans = (S.plans || []).slice(); S.funds = S.funds && S.funds.length ? S.funds : T.defaults().funds;
    }).catch(function () { S = defaultsFromBiz(); }).then(function () { loaded = true; if (/^#trust/.test(location.hash)) A.show(); });
  }
  function today() { return NS.today(); }
  function docs() { return A.data().doc; }
  function members() { return A.data().party.filter(function (p) { return p.member && (!p.bizKey || p.bizKey === BK); }); }
  function sellerCopy() { var s = JSON.parse(JSON.stringify(A.biz() || {})); delete s.id; delete s.created; delete s.updated; return s; }
  function ymd(d) { return A.ldate(d); }
  function fyList() { var c = T.fyOf(today()), y = +c.slice(0, 4), o = []; for (var i = 0; i < 4; i++) { var a = y - i; o.push(a + '-' + String((a + 1) % 100).padStart(2, '0')); } return o; }
  function range() { var r = T.fyRange(fy || T.fyOf(today())); return r; }
  function dlg(id, title, html) {
    var d = $('#' + id);
    if (!d) { d = NS.el('dialog', { id: id, 'class': 'tr-dlg', 'aria-labelledby': id + '-h' }); document.body.appendChild(d); }
    d.innerHTML = '<div class="dlg-h"><h2 id="' + id + '-h">' + esc(title) + '</h2><form method="dialog"><button class="btn sm">' + esc(NS.t('close')) + '</button></form></div><div class="dlg-b">' + html + '</div>';
    d.showModal ? d.showModal() : d.setAttribute('open', ''); return d;
  }
  function field(id, label, val, o) {
    o = o || {};
    var inner = o.area ? '<textarea id="' + id + '" rows="2" dir="auto">' + esc(val || '') + '</textarea>'
      : o.sel ? '<select id="' + id + '">' + o.sel.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(val) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>'
      : '<input id="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(val == null ? '' : val) + '"' + (o.mode ? ' inputmode="' + o.mode + '" dir="ltr"' : ' dir="auto"') + (o.list ? ' list="' + o.list + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' autocomplete="off">';
    return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + inner + (o.hint ? '<small class="soft">' + esc(o.hint) + '</small>' : '') + '</div>';
  }
  function modes() { return ['cash', 'upi', 'cheque', 'bank', 'card', 'dd', 'other'].map(function (m) { return [m, NS.t('pm.' + m)]; }); }
  var ENMODE = { cash: 'Cash', upi: 'UPI', cheque: 'Cheque', bank: 'Bank transfer', card: 'Card', dd: 'Demand draft', other: 'Other' };
  function csvOut(name, rows) {
    var f = new File(['﻿' + T.toCsv(rows)], name, { type: 'text/csv' });
    NS.saveFile(f, name); NS.toast(t('filesaved', { file: name }));
  }
  function wa(phone, text) {
    var ph = String(phone || '').replace(/\D/g, '').slice(-10);
    window.open('https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  function closedBad(date) { var m = A.closedMsg ? A.closedMsg(date) : ''; if (m) NS.toast(m, 'bad'); return !!m; }

  /* ---------- printing (the same hidden host the expense voucher uses) ---------- */
  function printHtml(html) {
    var host = $('#vch-print');
    if (!host) { host = document.createElement('div'); host.id = 'vch-print'; host.className = 'vch-print'; document.body.appendChild(host); }
    host.innerHTML = html; document.documentElement.classList.add('vch-on');
    var off = function () { window.removeEventListener('afterprint', off); document.documentElement.classList.remove('vch-on'); host.innerHTML = ''; };
    window.addEventListener('afterprint', off); setTimeout(function () { window.print(); }, 60);
  }
  function head() {
    var s = S || defaultsFromBiz(), b = A.biz() || {};
    return '<div class="st-hd"><div><b class="vch-biz">' + esc(s.name || b.name || '') + '</b>' + (s.addr ? '<br>' + esc(s.addr).replace(/\n/g, '<br>') : '') + (s.pan ? '<br>PAN ' + esc(s.pan) : '') +
      (s.reg12a ? '<br>Registration (12A / 12AB): ' + esc(s.reg12a) : '') + (b.phone ? '<br>Phone ' + esc(b.phone) : '') + '</div>';
  }
  function g80Line() {
    var s = S || {}; if (!s.reg80g) return '';
    return 'Approved under section 80G of the Income-tax Act. 80G registration / approval no.: ' + esc(s.reg80g) + (s.from || s.to ? ' (as per the approval order' + (s.from ? ', from ' + esc(ymd(s.from)) : '') + (s.to ? ' to ' + esc(ymd(s.to)) : '') + ')' : '') + '.';
  }
  function receiptSheet(d) {
    var by = d.buyer || {}, amt = T.r2(num(d.amount)), sub = d.kind === 'sub', row = function (k, v) { return v ? '<tr><th scope="row">' + esc(k) + '</th><td>' + v + '</td></tr>' : ''; };
    var periods = (d.periods || []).map(T.periodName).join(', ');
    return '<div class="stsheet sh vch tr-rc" dir="ltr" lang="en" data-sheet>' + head() +
      '<div class="r"><b class="vch-ttl">' + (sub ? 'SUBSCRIPTION RECEIPT' : 'DONATION RECEIPT') + '</b><br>No. ' + esc(d.no || '') + '<br>Date ' + esc(ymd(d.date)) + '</div></div>' +
      '<table class="tbl st vch-t"><tbody>' +
      row('Received with thanks from', '<b>' + esc(by.name || '') + '</b>' + (by.addr ? '<br>' + esc(by.addr).replace(/\n/g, '<br>') : '')) +
      row('Donor PAN', by.pan ? esc(String(by.pan).toUpperCase()) : '') + row('Phone', esc(by.phone || '')) +
      row(sub ? 'Towards' : 'Towards (purpose)', esc([sub ? d.fund : d.purpose, !sub ? d.fund : ''].filter(Boolean).join(' · ')) + (sub && periods ? '<br>' + esc(periods) : '')) +
      row('Paid by', esc(ENMODE[d.mode] || d.mode || '') + (d.ref ? ' · ' + esc(d.ref) : '')) +
      row('Amount', '<b class="vch-amt">' + money(amt) + '</b><br>' + esc(NS.inWords(amt))) + '</tbody></table>' +
      (!sub && g80Line() ? '<p class="small">' + g80Line() + '</p>' : '') +
      (T.cashOver(d) ? '<p class="small">Note: under section 80G(5D), no deduction is allowed for a donation above Rs ' + T.CASH_LIMIT.toLocaleString('en-IN') + ' paid in cash.</p>' : '') +
      (d.notes ? '<p class="small">' + esc(d.notes) + '</p>' : '') +
      '<div class="vch-sign"><div></div><div></div><div>For ' + esc((S && S.name) || (A.biz() || {}).name || '') + '<small>Authorised signatory</small></div></div>' +
      '<p class="st-ft">' + (!sub && S && S.reg80g ? 'This is a receipt. A Form 10BE certificate of donation, where it applies, is issued separately. ' : '') + 'Made with Nivesh Sahayak on ' + esc(ymd(today())) + '.</p></div>';
  }

  /* ---------- frame ---------- */
  function tabs() {
    return '<div class="seg" role="group" aria-label="' + esc(t('t')) + '">' + [['rcpt', 'tab_rcpt'], ['members', 'tab_members'], ['donors', 'tab_donors'], ['setup', 'tab_setup']].map(function (x) {
      return '<button type="button" class="btn sm" data-trtab="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
  }
  function fySel() { return '<label class="tr-fy">' + esc(t('fy')) + ' <select data-trfy>' + fyList().map(function (f) { return '<option value="' + f + '"' + (f === (fy || T.fyOf(today())) ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></label>'; }
  function html() {
    if (!loaded) { load(); return '<div class="pane-hd"><h2>' + esc(t('t')) + '</h2></div><p class="soft">…</p>'; }
    if (!fy) fy = T.fyOf(today());
    var body = tab === 'members' ? membersHtml() : tab === 'donors' ? donorsHtml() : tab === 'setup' ? setupHtml() : rcptHtml();
    return '<div class="pane-hd" data-nosp><h2>' + esc(t('t')) + '</h2>' + tabs() + '</div>' + body;
  }

  /* ---------- receipts ---------- */
  function rcptHtml() {
    var r = range(), Sm = T.summary(docs(), A.bizName(), r[0], r[1]), L = Sm.list.slice().reverse(), ql = q.toLowerCase();
    if (ql) L = L.filter(function (d) { return [d.no, d.buyer && d.buyer.name, d.fund, d.purpose, d.ref].join(' ').toLowerCase().indexOf(ql) >= 0; });
    var cashN = Sm.list.filter(T.cashOver).length;
    return '<p class="soft">' + esc(t('intro')) + '</p>' +
      '<div class="tools-row no-print"><button type="button" class="btn primary" data-trnew="don">+ ' + esc(t('new_don')) + '</button> <button type="button" class="btn" data-trnew="sub">+ ' + esc(t('new_sub')) + '</button> ' + fySel() +
      ' <input type="search" data-trq placeholder="' + esc(t('search')) + '" value="' + esc(q) + '" aria-label="' + esc(t('search')) + '"> <button type="button" class="btn" data-trcsv="rcpt">' + esc(t('csv')) + '</button></div>' +
      '<div class="tiles"><div class="tile"><span>' + esc(t('s_don')) + '</span><b>' + money(Sm.don) + '</b></div><div class="tile"><span>' + esc(t('s_sub')) + '</span><b>' + money(Sm.sub) + '</b></div><div class="tile"><span>' + esc(t('s_n')) + '</span><b>' + Sm.n + '</b></div></div>' +
      (cashN ? '<p class="note">' + esc(t('cashn', { n: cashN, l: T.CASH_LIMIT.toLocaleString('en-IN') })) + '</p>' : '') +
      (S && !S.reg80g ? '<p class="soft">' + esc(t('no80g')) + ' <a href="#trust" data-trgo="setup">' + esc(t('tab_setup')) + ' ›</a></p>' : '') +
      '<div class="tbl-wrap"><table class="tbl tr-t"><thead><tr><th>' + esc(t('c_no')) + '</th><th>' + esc(t('c_date')) + '</th><th>' + esc(t('c_from')) + '</th><th>' + esc(t('c_for')) + '</th><th>' + esc(t('c_mode')) + '</th><th class="n">' + esc(t('c_amt')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      (L.length ? L.map(function (d) {
        var b = d.buyer || {};
        return '<tr><th scope="row" data-l="' + esc(t('c_no')) + '">' + esc(d.no || '') + '</th><td data-l="' + esc(t('c_date')) + '">' + esc(ymd(d.date)) + '</td><td data-l="' + esc(t('c_from')) + '">' + esc(b.name || '') + (b.pan ? '<br><span class="soft">' + esc(String(b.pan).toUpperCase()) + '</span>' : '') + '</td>' +
          '<td data-l="' + esc(t('c_for')) + '">' + esc([d.kind === 'sub' ? t('sub_word') : d.purpose, d.fund].filter(Boolean).join(' · ')) + '</td><td data-l="' + esc(t('c_mode')) + '">' + esc(NS.t('pm.' + (d.mode || 'cash'))) + (T.cashOver(d) ? ' <span class="pill warn">' + esc(t('cashflag')) + '</span>' : '') + '</td>' +
          '<td class="n" data-l="' + esc(t('c_amt')) + '"><b>' + money(d.amount, false) + '</b></td><td class="no-print"><button type="button" class="btn sm" data-trprint="' + esc(d.id) + '">' + esc(t('print')) + '</button> <button type="button" class="btn sm" data-trthx="' + esc(d.id) + '">WhatsApp</button> <button type="button" class="btn sm" data-tredit="' + esc(d.id) + '">' + esc(t('edit')) + '</button> <button type="button" class="btn sm" data-trdel="' + esc(d.id) + '">' + esc(NS.t('desk.del')) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="7">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div>' +
      (Sm.funds.length ? '<h3>' + esc(t('funds_h')) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('c_fund')) + '</th><th class="n">' + esc(t('c_n')) + '</th><th class="n">' + esc(t('s_don')) + '</th><th class="n">' + esc(t('s_sub')) + '</th><th class="n">' + esc(t('c_total')) + '</th></tr></thead><tbody>' +
        Sm.funds.map(function (f) { return '<tr><th scope="row">' + esc(f.fund) + '</th><td class="n">' + f.n + '</td><td class="n">' + money(f.don, false) + '</td><td class="n">' + money(f.sub, false) + '</td><td class="n"><b>' + money(f.total, false) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' : '');
  }
  function donorNames() { var o = {}; T.donors(docs(), A.bizName(), '', '', true).forEach(function (d) { o[d.k] = d; }); return Object.keys(o).map(function (k) { return o[k]; }); }
  function rcptForm(kind, rec, member) {
    var sub = kind === 'sub', by = rec && rec.buyer || {}, fundOpts = (S.funds || []).map(function (f) { return [f, f]; });
    var mem = member || (rec && rec.memberId && members().filter(function (m) { return m.id === rec.memberId; })[0]) || null;
    var dn = donorNames();
    var body = '<form id="tr-f" novalidate><div class="fg">' + field('tr-date', t('f_date'), rec && rec.date || today(), { type: 'date' }) +
      (sub ? field('tr-mem', t('f_member'), mem ? mem.id : '', { sel: [['', t('f_pickmem')]].concat(members().map(function (m) { return [m.id, m.name]; })) }) : '') +
      field('tr-name', t(sub ? 'f_name' : 'f_donor'), by.name || (mem ? mem.name : ''), { list: 'tr-dl', wide: !sub }) + '<datalist id="tr-dl">' + dn.map(function (d) { return '<option value="' + esc(d.name) + '">'; }).join('') + '</datalist>' +
      field('tr-pan', t('f_pan'), by.pan || (mem && mem.pan) || '', { hint: t('f_panh') }) + field('tr-phone', t('f_phone'), by.phone || (mem ? mem.phone : ''), { type: 'tel', mode: 'tel' }) +
      field('tr-addr', t('f_addr'), by.addr || (mem ? mem.addr : ''), { area: true, wide: true }) +
      (sub ? '<div class="f wide" id="tr-per"></div>' : field('tr-purpose', t('f_purpose'), rec && rec.purpose || '', { wide: true, ph: t('f_purposeh') }) + field('tr-fund', t('f_fund'), rec && rec.fund || (S.funds || [])[0] || '', { list: 'tr-fl' }) + '<datalist id="tr-fl">' + fundOpts.map(function (f) { return '<option value="' + esc(f[0]) + '">'; }).join('') + '</datalist>') +
      field('tr-amt', t('f_amt'), rec ? rec.amount : '', { mode: 'decimal' }) + field('tr-mode', t('f_mode'), rec && rec.mode || 'cash', { sel: modes() }) + field('tr-ref', t('f_ref'), rec && rec.ref || '', { hint: t('f_refh') }) +
      field('tr-note', t('f_note'), rec && rec.notes || '', { wide: true }) + '</div><p class="note" data-trmsg aria-live="polite"></p>' +
      '<div class="btns"><button type="submit" class="btn primary" data-act="save">' + esc(A.T('save')) + '</button> <button type="submit" class="btn" data-act="print">' + esc(t('saveprint')) + '</button></div></form>';
    var d = dlg('tr-dlg', t(sub ? 'new_sub' : 'new_don'), body), f = $('#tr-f', d), act = 'save';
    $$('[data-act]', f).forEach(function (b) { b.addEventListener('click', function () { act = b.getAttribute('data-act'); }); });
    function perBoxes() {
      var box = $('#tr-per', f); if (!box) return;
      var m = members().filter(function (x) { return x.id === $('#tr-mem', f).value; })[0];
      if (!m) { box.innerHTML = '<p class="soft">' + esc(t('pickmem')) + '</p>'; return; }
      var L = T.memberLedger(S, m, docs().filter(function (x) { return !rec || x.id !== rec.id; }), A.bizName(), today()), pend = L.rows.filter(function (r) { return r.left > 0.004; }).slice(0, 36);
      var keep = rec && rec.memberId === m.id ? rec.periods || [] : [];
      var rows = pend.map(function (r) { return { p: r.p, left: r.left }; });
      keep.forEach(function (p) { if (!rows.some(function (r) { return r.p === p; })) rows.push({ p: p, left: num(L.plan && L.plan.amt) }); });
      box.innerHTML = '<span class="lbl">' + esc(t('f_periods')) + '</span>' + (rows.length ? '<div class="tr-per">' + rows.map(function (r, i) { return '<label class="tr-p"><input type="checkbox" data-trp="' + esc(r.p) + '" data-left="' + r.left + '"' + (keep.length ? (keep.indexOf(r.p) >= 0 ? ' checked' : '') : (i === 0 ? ' checked' : '')) + '> ' + esc(T.periodName(r.p)) + ' <span class="soft">' + money(r.left, false) + '</span></label>'; }).join('') + '</div>' : '<p class="soft">' + esc(t('nopend')) + '</p>');
      $$('[data-trp]', box).forEach(function (c) { c.addEventListener('change', sumPer); }); if (!rec) sumPer();
    }
    function sumPer() { var s = 0; $$('[data-trp]', f).forEach(function (c) { if (c.checked) s += num(c.getAttribute('data-left')); }); $('#tr-amt', f).value = s ? String(r2(s)) : ''; }
    if (sub) {
      $('#tr-mem', f).addEventListener('change', function () {
        var m = members().filter(function (x) { return x.id === this.value; }.bind(this))[0];
        if (m) { $('#tr-name', f).value = m.name || ''; $('#tr-phone', f).value = m.phone || ''; $('#tr-addr', f).value = m.addr || ''; $('#tr-pan', f).value = m.pan || ''; }
        perBoxes();
      }); perBoxes();
    } else {
      $('#tr-name', f).addEventListener('change', function () {
        var k = T.key(this.value), h = dn.filter(function (x) { return T.key(x.name) === k; })[0];
        if (h) { if (!$('#tr-pan', f).value) $('#tr-pan', f).value = h.pan || ''; if (!$('#tr-phone', f).value) $('#tr-phone', f).value = h.phone || ''; if (!$('#tr-addr', f).value) $('#tr-addr', f).value = h.addr || ''; }
      });
    }
    function msg() {
      var m = $('[data-trmsg]', f), a = r2(num($('#tr-amt', f).value)), md = $('#tr-mode', f).value, p = $('#tr-pan', f).value.trim(), out = [];
      if (!sub && md === 'cash' && a > T.CASH_LIMIT) out.push(t('cashw', { l: T.CASH_LIMIT.toLocaleString('en-IN') }));
      if (p && !T.panOk(p)) out.push(t('panw'));
      m.textContent = out.join(' ');
    }
    f.addEventListener('input', msg); f.addEventListener('change', msg); msg();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var date = $('#tr-date', f).value, name = $('#tr-name', f).value.trim(), amt = r2(num($('#tr-amt', f).value)), pan = $('#tr-pan', f).value.trim().toUpperCase();
      if (!date) { NS.toast(A.T('need', { f: t('f_date') }), 'bad'); return; }
      if (!name) { NS.toast(A.T('need', { f: t(sub ? 'f_name' : 'f_donor') }), 'bad'); return; }
      if (!(amt > 0)) { NS.toast(A.T('need', { f: t('f_amt') }), 'bad'); return; }
      if (closedBad(date) || rec && closedBad(rec.date)) return;
      var per = sub ? $$('[data-trp]', f).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-trp'); }) : [];
      if (sub && !$('#tr-mem', f).value) { NS.toast(t('pickmem'), 'bad'); return; }
      var fund = sub ? (((T.planOf(S, (members().filter(function (x) { return x.id === $('#tr-mem', f).value; })[0] || {}).mplan) || {}).name) || t('sub_word')) : $('#tr-fund', f).value.trim();
      var d0 = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'don', no: T.nextNo(docs(), A.bizName(), S.prefix || 'DON', date) }, {
        date: date, seller: sellerCopy(), kind: sub ? 'sub' : 'don', head: sub ? T.HEAD.sub : T.HEAD.don, amount: amt, tds: 0, total: amt, mode: $('#tr-mode', f).value, ref: $('#tr-ref', f).value.trim(),
        fund: fund, purpose: sub ? '' : $('#tr-purpose', f).value.trim(), notes: $('#tr-note', f).value.trim(), memberId: sub ? $('#tr-mem', f).value : '', periods: per,
        buyer: { name: name, pan: pan, phone: $('#tr-phone', f).value.trim(), addr: $('#tr-addr', f).value.trim() } });
      if (rec && T.fyOf(date) !== T.fyOf(rec.date)) d0.no = T.nextNo(docs().filter(function (x) { return x.id !== rec.id; }), A.bizName(), S.prefix || 'DON', date);
      d0.narr = [d0.head, name, d0.fund, d0.ref].filter(Boolean).join(' · ');
      NSStore.put('doc', d0).then(function (saved) { d.close(); NS.toast(A.T('saved')); A.show(); if (act === 'print') printHtml(receiptSheet(saved || d0)); }, function (er) { NS.toast(NS.t('nosave', { e: er.message }), 'bad'); });
    });
  }
  function delRec(id) {
    var d = docs().filter(function (x) { return x.id === id; })[0]; if (!d || closedBad(d.date)) return;
    var m = t('del_q', { n: d.no });
    (NS.ask ? NS.ask(m, { danger: true, ok: NS.t('desk.del') }) : Promise.resolve(confirm(m))).then(function (yes) {
      if (yes) NSStore.del('doc', id).then(function () { NS.toast(t('deleted')); A.show(); }, function (er) { NS.toast(er.message, 'bad'); });
    });
  }

  /* ---------- members ---------- */
  function membersHtml() {
    var rows = T.members(S, members(), docs(), A.bizName(), today()), tot = T.memberTotals(rows), ql = q.toLowerCase();
    if (ql) rows = rows.filter(function (r) { return [r.m.name, r.m.phone, r.plan && r.plan.name].join(' ').toLowerCase().indexOf(ql) >= 0; });
    if (!S.plans.length) return '<p class="note">' + esc(t('noplan')) + ' <a href="#trust" data-trgo="setup">' + esc(t('tab_setup')) + ' ›</a></p>';
    return '<p class="soft">' + esc(t('m_intro')) + '</p><div class="tools-row no-print"><button type="button" class="btn primary" data-trmem="">+ ' + esc(t('add_mem')) + '</button> <button type="button" class="btn" data-trnew="sub">+ ' + esc(t('new_sub')) + '</button> ' +
      '<input type="search" data-trq placeholder="' + esc(t('search')) + '" value="' + esc(q) + '" aria-label="' + esc(t('search')) + '"> <button type="button" class="btn" data-trcsv="mem">' + esc(t('csv')) + '</button></div>' +
      '<div class="tiles"><div class="tile"><span>' + esc(t('m_n')) + '</span><b>' + tot.n + '</b></div><div class="tile' + (tot.owing ? ' warn' : '') + '"><span>' + esc(t('m_owing', { n: tot.owing })) + '</span><b>' + money(tot.due) + '</b></div><div class="tile"><span>' + esc(t('m_recv')) + '</span><b>' + money(tot.received) + '</b></div></div>' +
      '<div class="tbl-wrap"><table class="tbl tr-t"><thead><tr><th>' + esc(t('c_member')) + '</th><th>' + esc(t('c_plan')) + '</th><th>' + esc(t('c_since')) + '</th><th class="n">' + esc(t('c_pend')) + '</th><th class="n">' + esc(t('c_due')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) {
        var m = r.m; return '<tr><th scope="row" data-l="' + esc(t('c_member')) + '">' + esc(m.name) + (m.phone ? '<br><span class="soft">' + esc(m.phone) + '</span>' : '') + (m.left ? ' <span class="pill">' + esc(t('left')) + '</span>' : '') + '</th><td data-l="' + esc(t('c_plan')) + '">' + esc(r.plan ? r.plan.name : '—') + '</td><td data-l="' + esc(t('c_since')) + '">' + esc(ymd(m.since)) + '</td>' +
          '<td class="n" data-l="' + esc(t('c_pend')) + '">' + r.unpaid + '</td><td class="n" data-l="' + esc(t('c_due')) + '"><b>' + (r.due > 0.004 ? money(r.due, false) : '—') + '</b></td>' +
          '<td class="no-print"><button type="button" class="btn sm" data-trrecv="' + esc(m.id) + '">' + esc(t('receive')) + '</button> <button type="button" class="btn sm" data-trled="' + esc(m.id) + '">' + esc(t('ledger')) + '</button>' +
          (r.due > 0.004 ? ' <button type="button" class="btn sm" data-trrem="' + esc(m.id) + '">WhatsApp</button>' : '') + ' <button type="button" class="btn sm" data-trmem="' + esc(m.id) + '">' + esc(t('edit')) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="6">' + esc(t('m_none')) + '</td></tr>') + '</tbody></table></div>';
  }
  function memForm(id) {
    var m = id ? members().filter(function (x) { return x.id === id; })[0] : null; if (id && !m) return;
    var d = dlg('tr-mdlg', t(m ? 'edit_mem' : 'add_mem'), '<form id="tr-mf" novalidate><div class="fg">' + field('tm-name', t('f_name'), m && m.name || '', { wide: true }) + field('tm-phone', t('f_phone'), m && m.phone || '', { type: 'tel', mode: 'tel' }) + field('tm-pan', t('f_pan'), m && m.pan || '') +
      field('tm-addr', t('f_addr'), m && m.addr || '', { area: true, wide: true }) + field('tm-plan', t('c_plan'), m && m.mplan || (S.plans[0] || {}).id, { sel: S.plans.map(function (p) { return [p.id, p.name + ' · ' + money(p.amt, false) + ' / ' + t('fq_' + p.freq)]; }) }) +
      field('tm-since', t('c_since'), m && m.since || today(), { type: 'date', hint: t('f_sinceh') }) + field('tm-left', t('f_left'), m && m.left || '', { type: 'date', hint: t('f_lefth') }) + '</div>' +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(A.T('save')) + '</button>' + (m ? ' <button type="button" class="btn" data-tmdel>' + esc(NS.t('desk.del')) + '</button>' : '') + '</div></form>');
    var f = $('#tr-mf', d);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var name = $('#tm-name', f).value.trim(); if (!name) { NS.toast(A.T('need', { f: t('f_name') }), 'bad'); return; }
      if (members().some(function (x) { return T.key(x.name) === T.key(name) && (!m || x.id !== m.id); })) { NS.toast(t('dup'), 'bad'); return; }
      var rec = Object.assign({}, m || { role: 'customer' }, { name: name, member: 1, bizKey: BK, phone: $('#tm-phone', f).value.trim(), pan: $('#tm-pan', f).value.trim().toUpperCase(), addr: $('#tm-addr', f).value.trim(), mplan: $('#tm-plan', f).value, since: $('#tm-since', f).value, left: $('#tm-left', f).value });
      NSStore.put('party', rec).then(function () { d.close(); NS.toast(A.T('saved')); A.show(); }, function (er) { NS.toast(NS.t('nosave', { e: er.message }), 'bad'); });
    });
    var del = $('[data-tmdel]', f);
    if (del) del.addEventListener('click', function () {
      var used = docs().some(function (x) { return x.type === 'don' && x.memberId === m.id; });
      if (used) { NS.toast(t('mem_used'), 'bad'); return; }
      NSStore.del('party', m.id).then(function () { d.close(); A.show(); }, function (er) { NS.toast(er.message, 'bad'); });
    });
  }
  function ledgerHtml(m) {
    var L = T.memberLedger(S, m, docs(), A.bizName(), today());
    return '<div class="stsheet wide sh" dir="ltr" lang="en" data-sheet>' + head() + '<div class="r"><b class="vch-ttl">MEMBER LEDGER</b><br>As on ' + esc(ymd(today())) + '</div></div>' +
      '<p><b>' + esc(m.name) + '</b>' + (m.phone ? ' · ' + esc(m.phone) : '') + '<br>Plan: ' + esc(L.plan ? L.plan.name + ' · ' + money(L.plan.amt, false) + ' per ' + ({ month: 'month', year: 'year', once: 'one time' })[L.plan.freq] : '—') + ' · Member since ' + esc(ymd(m.since)) + '</p>' +
      '<table class="tbl st"><thead><tr><th>Period</th><th class="n">Due</th><th class="n">Paid</th><th class="n">Balance</th><th>Receipt</th></tr></thead><tbody>' +
      (L.rows.length ? L.rows.map(function (r) { return '<tr><td>' + esc(T.periodName(r.p)) + '</td><td class="n">' + money(r.amt, false) + '</td><td class="n">' + money(r.paid, false) + '</td><td class="n">' + (r.left > 0.004 ? '<b>' + money(r.left, false) + '</b>' : '—') + '</td><td>' + esc(r.rcpt.join(', ')) + '</td></tr>'; }).join('') : '<tr><td colspan="5">No dues yet.</td></tr>') +
      '</tbody><tfoot><tr><th>Total</th><td class="n">' + money(r2(L.rows.reduce(function (s, r) { return s + r.amt; }, 0)), false) + '</td><td class="n">' + money(r2(L.rows.reduce(function (s, r) { return s + r.paid; }, 0)), false) + '</td><td class="n"><b>' + money(L.due, false) + '</b></td><td></td></tr></tfoot></table>' +
      (L.advance ? '<p class="small">Paid in advance for later periods: ' + money(L.advance) + '</p>' : '') + '<p class="st-ft">Made with Nivesh Sahayak on ' + esc(ymd(today())) + '.</p></div>';
  }

  /* ---------- donors ---------- */
  function donorsHtml() {
    var r = range(), D = T.donors(docs(), A.bizName(), r[0], r[1], false), ql = q.toLowerCase();
    if (ql) D = D.filter(function (x) { return [x.name, x.pan, x.phone].join(' ').toLowerCase().indexOf(ql) >= 0; });
    var noPan = D.filter(function (x) { return !x.pan; }).length;
    return '<p class="soft">' + esc(t('d_intro')) + '</p><div class="tools-row no-print">' + fySel() + ' <input type="search" data-trq placeholder="' + esc(t('search')) + '" value="' + esc(q) + '" aria-label="' + esc(t('search')) + '"> <button type="button" class="btn" data-trcsv="donors">' + esc(t('csv')) + '</button> <button type="button" class="btn" data-trcsv="b10bd">' + esc(t('csv_10bd')) + '</button></div>' +
      '<p class="soft">' + esc(t('d_10bd')) + '</p>' + (noPan ? '<p class="note">' + esc(t('d_nopan', { n: noPan })) + '</p>' : '') +
      '<div class="tbl-wrap"><table class="tbl tr-t"><thead><tr><th>' + esc(t('c_donor')) + '</th><th>PAN</th><th class="n">' + esc(t('c_gifts')) + '</th><th>' + esc(t('c_last')) + '</th><th class="n">' + esc(t('c_total')) + '</th><th class="no-print"></th></tr></thead><tbody>' +
      (D.length ? D.map(function (x) { return '<tr><th scope="row" data-l="' + esc(t('c_donor')) + '">' + esc(x.name) + (x.phone ? '<br><span class="soft">' + esc(x.phone) + '</span>' : '') + '</th><td data-l="PAN">' + esc(x.pan || '—') + '</td><td class="n" data-l="' + esc(t('c_gifts')) + '">' + x.n + '</td><td data-l="' + esc(t('c_last')) + '">' + esc(ymd(x.last)) + '</td><td class="n" data-l="' + esc(t('c_total')) + '"><b>' + money(x.total, false) + '</b></td><td class="no-print"><button type="button" class="btn sm" data-trst="' + esc(x.k) + '">' + esc(t('statement')) + '</button></td></tr>'; }).join('') : '<tr><td colspan="6">' + esc(t('none')) + '</td></tr>') + '</tbody></table></div>';
  }
  function statementHtml(dk) {
    var r = range(), D = T.donors(docs(), A.bizName(), r[0], r[1], false).filter(function (x) { return x.k === dk; })[0]; if (!D) return '';
    var St = T.statement(docs(), A.bizName(), dk, r[0], r[1], false);
    return '<div class="stsheet wide sh" dir="ltr" lang="en" data-sheet>' + head() + '<div class="r"><b class="vch-ttl">DONATION STATEMENT</b><br>Financial year ' + esc(fy) + '<br>' + esc(ymd(r[0])) + ' to ' + esc(ymd(r[1])) + '</div></div>' +
      '<p><b>' + esc(D.name) + '</b>' + (D.pan ? ' · PAN ' + esc(D.pan) : '') + (D.addr ? '<br>' + esc(D.addr).replace(/\n/g, '<br>') : '') + '</p>' +
      '<table class="tbl st"><thead><tr><th>Date</th><th>Receipt no.</th><th>Purpose / fund</th><th>Paid by</th><th class="n">Amount</th></tr></thead><tbody>' +
      St.list.map(function (d) { return '<tr><td>' + esc(ymd(d.date)) + '</td><td>' + esc(d.no) + '</td><td>' + esc([d.purpose, d.fund].filter(Boolean).join(' · ')) + '</td><td>' + esc(ENMODE[d.mode] || d.mode || '') + (d.ref ? ' · ' + esc(d.ref) : '') + '</td><td class="n">' + money(d.amount, false) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th colspan="4">Total</th><td class="n"><b>' + money(St.total, false) + '</b></td></tr></tfoot></table>' + (S && S.reg80g && St.list.length ? '<p class="small">' + g80Line() + '</p>' : '') +
      '<p class="small">This statement lists the receipts issued. It is not a Form 10BE certificate.</p><p class="st-ft">Made with Nivesh Sahayak on ' + esc(ymd(today())) + '.</p></div>';
  }

  /* ---------- set-up ---------- */
  function setupHtml() {
    var s = S;
    return '<p class="soft">' + esc(t('set_intro')) + '</p><div class="card"><div class="fg">' + field('ts-name', t('s_name'), s.name, { wide: true }) + field('ts-pan', t('s_pan'), s.pan) + field('ts-addr', t('f_addr'), s.addr, { area: true, wide: true }) +
      field('ts-12a', t('s_12a'), s.reg12a, { hint: t('s_12ah') }) + field('ts-80g', t('s_80g'), s.reg80g, { hint: t('s_80gh') }) + field('ts-from', t('s_from'), s.from, { type: 'date' }) + field('ts-to', t('s_to'), s.to, { type: 'date', hint: t('s_toh') }) +
      field('ts-pre', t('s_pre'), s.prefix, { hint: t('s_preh') }) + field('ts-funds', t('s_funds'), (s.funds || []).join(', '), { wide: true, hint: t('s_fundsh') }) + '</div>' +
      '<h3>' + esc(t('plans_h')) + '</h3><p class="soft">' + esc(t('plans_p')) + '</p><div id="ts-plans">' + planRows(s.plans) + '</div><p class="no-print"><button type="button" class="btn sm" data-tsaddplan>+ ' + esc(t('add_plan')) + '</button></p>' +
      '<p class="soft">' + esc(t('s_law')) + '</p><div class="btns no-print"><button type="button" class="btn primary" data-tssave>' + esc(A.T('save')) + '</button></div></div>';
  }
  function planRows(list) {
    return (list.length ? list : []).map(function (p, i) {
      return '<div class="tr-plan fg" data-pl="' + esc(p.id) + '">' + field('tp-n' + i, t('plan_name'), p.name) + field('tp-a' + i, t('plan_amt'), p.amt, { mode: 'decimal' }) + field('tp-f' + i, t('plan_freq'), p.freq, { sel: T.FREQ.map(function (x) { return [x, t('fq_' + x)]; }) }) + '<div class="f"><label>&nbsp;</label><button type="button" class="btn sm" data-tsdelplan="' + i + '">' + esc(NS.t('desk.del')) + '</button></div></div>';
    }).join('');
  }
  function readSetup() {
    var s = Object.assign({}, S, { name: $('#ts-name', pane).value.trim(), pan: $('#ts-pan', pane).value.trim().toUpperCase(), addr: $('#ts-addr', pane).value.trim(), reg12a: $('#ts-12a', pane).value.trim(), reg80g: $('#ts-80g', pane).value.trim(),
      from: $('#ts-from', pane).value, to: $('#ts-to', pane).value, prefix: $('#ts-pre', pane).value.trim().replace(/[^A-Za-z0-9\/\-]/g, '') || 'DON', funds: $('#ts-funds', pane).value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) });
    s.plans = $$('.tr-plan', pane).map(function (r, i) {
      return { id: r.getAttribute('data-pl') || 'p' + Date.now().toString(36) + i, name: $('#tp-n' + i, r).value.trim() || t('plan_def'), amt: r2(num($('#tp-a' + i, r).value)), freq: $('#tp-f' + i, r).value };
    });
    return s;
  }

  /* ---------- wiring ---------- */
  function wire(p) {
    pane = p;
    $$('[data-trtab]', p).forEach(function (b) { b.addEventListener('click', function () { tab = b.getAttribute('data-trtab'); q = ''; A.show(); }); });
    $$('[data-trgo]', p).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); tab = a.getAttribute('data-trgo'); A.show(); }); });
    $$('[data-trfy]', p).forEach(function (s) { s.addEventListener('change', function () { fy = s.value; A.show(); }); });
    $$('[data-trq]', p).forEach(function (i) { i.addEventListener('input', function () { q = i.value; var pos = i.selectionStart; A.show(); var n = $('[data-trq]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }); });
    p.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button,[data-trgo]'); if (!b) return; var g = function (k) { return b.getAttribute(k); }, id;
      if ((id = g('data-trnew')) != null && b.hasAttribute('data-trnew')) rcptForm(id);
      else if (b.hasAttribute('data-trprint')) { var d = docs().filter(function (x) { return x.id === g('data-trprint'); })[0]; if (d) printHtml(receiptSheet(d)); }
      else if (b.hasAttribute('data-trthx')) { var d2 = docs().filter(function (x) { return x.id === g('data-trthx'); })[0]; if (d2) wa(d2.buyer && d2.buyer.phone, T.thanksText(S, d2)); }
      else if (b.hasAttribute('data-tredit')) { var d3 = docs().filter(function (x) { return x.id === g('data-tredit'); })[0]; if (d3) rcptForm(d3.kind === 'sub' ? 'sub' : 'don', d3); }
      else if (b.hasAttribute('data-trdel')) delRec(g('data-trdel'));
      else if (b.hasAttribute('data-trmem')) memForm(g('data-trmem'));
      else if (b.hasAttribute('data-trrecv')) rcptForm('sub', null, members().filter(function (m) { return m.id === g('data-trrecv'); })[0]);
      else if (b.hasAttribute('data-trled')) { var m = members().filter(function (x) { return x.id === g('data-trled'); })[0]; if (m) { var dd = dlg('tr-led', t('ledger') + ': ' + m.name, ledgerHtml(m) + '<div class="btns no-print"><button type="button" class="btn primary" data-trprintled>' + esc(t('print')) + '</button></div>'); $('[data-trprintled]', dd).addEventListener('click', function () { printHtml(ledgerHtml(m)); }); } }
      else if (b.hasAttribute('data-trrem')) { var rows = T.members(S, members(), docs(), A.bizName(), today()).filter(function (r) { return r.m.id === g('data-trrem'); })[0]; if (rows) wa(rows.m.phone, T.reminderText(S, rows, today())); }
      else if (b.hasAttribute('data-trst')) { var dk = g('data-trst'), dd2 = dlg('tr-st', t('statement'), statementHtml(dk) + '<div class="btns no-print"><button type="button" class="btn primary" data-trprintst>' + esc(t('print')) + '</button></div>'); $('[data-trprintst]', dd2).addEventListener('click', function () { printHtml(statementHtml(dk)); }); }
      else if (b.hasAttribute('data-trcsv')) csv(g('data-trcsv'));
      else if (b.hasAttribute('data-tsaddplan')) { S = readSetup(); S.plans.push({ id: 'p' + Date.now().toString(36), name: '', amt: '', freq: 'month' }); $('#ts-plans', pane).innerHTML = planRows(S.plans); }
      else if (b.hasAttribute('data-tsdelplan')) { S = readSetup(); S.plans.splice(+g('data-tsdelplan'), 1); $('#ts-plans', pane).innerHTML = planRows(S.plans); }
      else if (b.hasAttribute('data-tssave')) {
        var s2 = readSetup();
        if (s2.pan && !T.panOk(s2.pan)) { NS.toast(t('panw'), 'bad'); return; }
        NSStore.meta(setupKey(), s2).then(function () { S = s2; NS.toast(A.T('saved')); A.show(); }, function (er) { NS.toast(NS.t('nosave', { e: er.message }), 'bad'); });
      }
    });
  }
  function csv(what) {
    var r = range(), nm = A.bizName().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'trust';
    if (what === 'rcpt') {
      var Sm = T.summary(docs(), A.bizName(), r[0], r[1]);
      csvOut('receipts-' + nm + '-' + fy + '.csv', [['Receipt no.', 'Date', 'Type', 'Name', 'PAN', 'Phone', 'Address', 'Purpose', 'Fund', 'Mode', 'Reference', 'Amount']].concat(Sm.list.map(function (d) { var b = d.buyer || {}; return [d.no, d.date, d.kind === 'sub' ? 'Subscription' : 'Donation', b.name, b.pan, b.phone, b.addr, d.purpose, d.fund, ENMODE[d.mode] || d.mode, d.ref, d.amount]; })));
    } else if (what === 'mem') {
      var rows = T.members(S, members(), docs(), A.bizName(), today());
      csvOut('members-' + nm + '-' + today() + '.csv', [['Member', 'Phone', 'Plan', 'Member since', 'Left', 'Periods pending', 'Dues', 'Received']].concat(rows.map(function (x) { return [x.m.name, x.m.phone, x.plan ? x.plan.name : '', x.m.since, x.m.left || '', x.unpaid, x.due, x.received]; })));
    } else if (what === 'donors') {
      csvOut('donors-' + nm + '-' + fy + '.csv', [['Donor', 'PAN', 'Phone', 'Address', 'Gifts', 'First', 'Last', 'Total']].concat(T.donors(docs(), A.bizName(), r[0], r[1], false).map(function (x) { return [x.name, x.pan, x.phone, x.addr, x.n, x.first, x.last, x.total]; })));
    } else if (what === 'b10bd') {
      csvOut('donor-list-for-10BD-' + nm + '-' + fy + '.csv', [['PAN', 'Name of donor', 'Address', 'Amount donated', 'Mode of receipt', 'Receipt numbers', 'Dates']].concat(T.between(docs(), A.bizName(), r[0], r[1]).filter(function (d) { return d.kind !== 'sub'; }).map(function (d) { var b = d.buyer || {}; return [b.pan, b.name, b.addr, d.amount, ENMODE[d.mode] || d.mode, d.no, d.date]; })));
    }
  }

  function mount() {
    A.addSection('trust', function () { return html(); }, function (p) { wire(p); });
    var nav = $('.hub-nav'); if (nav && !$('[data-sec="trust"]', nav) && !(A.door && A.door())) nav.insertAdjacentHTML('beforeend', '<a href="#trust" data-sec="trust"><span data-i18n="tr.t">' + esc(t('t')) + '</span></a>');
    document.addEventListener('ns-lang', function () { var s = $('[data-sec="trust"] span'); if (s) s.textContent = t('t'); });
  }
  window.NSTrustUI = { load: load, receiptSheet: receiptSheet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
