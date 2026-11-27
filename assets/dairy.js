/* dairy.niveshsahayak.in: a milk diary for a dairy, a milk collection centre or a milkman.
   Record type 'dairy' = one passbook (one person, one fortnight or month; logic in dairycore.js, NSDairy). Farmers / suppliers are 'collect'
   (litres each morning and evening, fat and SNF, a rate, the amount), customers are 'deliver' (litres a day, a rate, days skipped).
   The desk: today's entry for everyone on one screen, accounts with balances and WhatsApp reminders, and starting the next period for everyone.
   The passbook prints as the statement and carries its books side as d.books (purchases or sales and the party's account), so it reaches the
   NSBiz's party ledger like a mandi slip does. Rates are always typed by the user. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, D = NSDairy;
  var K, DOCS = [];
  function dayRow() { return { date: '', am: '', pm: '', fat: '', snf: '', rate: '', skip: '' }; }
  function adjRow() { return { name: '', amt: '', side: 'less' }; }
  function who() { return String(K.doc().seller.name || '').trim(); }
  function fd(x) { return x ? NS.fmtDate(x) : ''; }
  function sums(d) { return D.calc(d); }
  function load() { return NSStore.list('doc').then(function (all) { DOCS = D.mine(all, who()); return DOCS; }, function () { return DOCS; }); }
  function fixPeriod(d) { var p = D.periodOf(d.pdate || d.date || NS.today(), d.per || 'fn'); if (p.from) { d.from = p.from; d.to = p.to; } }
  function money(n) { return NS.money(n); }
  function lit(n) { return NS.qty(n); }
  function download(name, text) {
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 800);
  }
  /* the next number of the series, for passbooks made in bulk (same form as the kit's own: DY/26-27/001) */
  function numberer(date, all) {
    var fy = NS.fy(date), pre = String(((K.cfg() || {}).dairy || {}).prefix != null ? K.cfg().dairy.prefix : 'DY').replace(/[^A-Za-z0-9\/\-]/g, ''), prefix = (pre ? pre + '/' : '') + fy.slice(2, 4) + '-' + fy.slice(5) + '/', max = 0, k = D.key(who());
    all.forEach(function (d) { if (d.type !== 'dairy' || NS.fy(d.date) !== fy || D.key(d.seller && d.seller.name) !== k || String(d.no || '').indexOf(prefix) !== 0) return; var m = String(d.no).match(/(\d+)\s*$/); if (m) max = Math.max(max, +m[1]); });
    return function () { max++; return prefix + String(max).padStart(3, '0'); };
  }
  function finish(rec) { var o = D.calc(rec); rec.total = o.net; rec.balance = o.due; rec.books = D.books(rec, o); rec.kind = 'plain'; return rec; }
  function put(rec) { return NSStore.put('doc', finish(rec)); }

  /* ---------- the dialog shared by the desk screens ---------- */
  function dlg(title, html) {
    var x = $('#dy-dlg'); $('h2', x).textContent = title; $('[data-body]', x).innerHTML = html;
    if (!x.open) { x.showModal ? x.showModal() : x.setAttribute('open', ''); }
    return x;
  }
  function tabs(v) {
    return '<div class="row gr-tabs">' + [['today', 'dy.today'], ['acc', 'dy.acc'], ['next', 'dy.next']].map(function (x) { return '<button type="button" class="btn sm' + (v === x[0] ? ' primary' : '') + '" data-dv="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
  }
  var entryDate = '';
  function todayView() {
    var date = entryDate || NS.today();
    return load().then(function () {
      var list = D.onDate(DOCS, date, who()), rows = list.map(function (d, i) {
        var r = (d.days || []).filter(function (x) { return x.date === date; })[0] || {}, col = d.role !== 'deliver', f = function (k, extra) { return '<td><input class="dy-in" data-di="' + i + '" data-dk="' + k + '" inputmode="decimal" dir="ltr" value="' + esc(r[k] || '') + '" aria-label="' + esc(t('dy.d.' + k) + ' ' + d.buyer.name) + '"' + (extra || '') + '></td>'; };
        return '<tr><td><b>' + esc(d.buyer.name) + '</b><br><small>' + esc(t(col ? 'dy.r.collect' : 'dy.r.deliver')) + '</small></td>' + f('am') + f('pm') + (col ? f('fat') + f('snf') : '<td></td><td></td>') +
          '<td><label class="chk"><input type="checkbox" data-di="' + i + '" data-dk="skip"' + (r.skip === 'skip' ? ' checked' : '') + ' aria-label="' + esc(t('dy.skip') + ' ' + d.buyer.name) + '"> ' + esc(t('dy.skip')) + '</label></td></tr>';
      }).join('');
      var body = tabs('today') + '<div class="row"><div class="f"><label for="dy-date">' + esc(t('dy.date')) + '</label><input id="dy-date" type="date" value="' + esc(date) + '"></div></div><p class="hint">' + esc(t('dy.todayh')) + '</p>' +
        (list.length ? '<div class="ht-wrap"><table class="day dy-today"><thead><tr><th>' + esc(t('dy.name')) + '</th><th>' + esc(t('dy.d.am')) + '</th><th>' + esc(t('dy.d.pm')) + '</th><th>' + esc(t('dy.d.fat')) + '</th><th>' + esc(t('dy.d.snf')) + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="dy-tot" data-tot></p><div class="row"><button type="button" class="btn primary" data-dy="saveday">' + esc(t('dy.saveday')) + '</button></div>' : '<p>' + esc(t('dy.nonetoday')) + '</p>');
      var x = dlg(t('dy.deskt'), body); x._list = list; x._date = date; todayTotals(x);
    });
  }
  function todayTotals(x) {
    var tot = $('[data-tot]', x); if (!tot || !x._list) return;
    var c = 0, dl = 0;
    x._list.forEach(function (d, i) { var a = num(($('[data-di="' + i + '"][data-dk="am"]', x) || {}).value) + num(($('[data-di="' + i + '"][data-dk="pm"]', x) || {}).value), sk = ($('[data-di="' + i + '"][data-dk="skip"]', x) || {}).checked; if (sk) a = 0; if (d.role === 'deliver') dl += a; else c += a; });
    tot.textContent = t('dy.totline', { c: lit(Math.round(c * 1000) / 1000), d: lit(Math.round(dl * 1000) / 1000) });
  }
  function saveDay(x) {
    var list = x._list || [], date = x._date, jobs = [];
    list.forEach(function (d, i) {
      var v = { skip: ($('[data-di="' + i + '"][data-dk="skip"]', x) || {}).checked };
      ['am', 'pm', 'fat', 'snf'].forEach(function (k) { var e = $('[data-di="' + i + '"][data-dk="' + k + '"]', x); if (e) v[k] = e.value.trim(); });
      var had = (d.days || []).filter(function (r) { return r.date === date; })[0];
      if (!had && !v.skip && !v.am && !v.pm) return;   /* nothing typed for this person today */
      D.setDay(d, date, v); jobs.push(put(d));
    });
    return Promise.all(jobs).then(function () { NS.toast(t('dy.daysaved', { n: jobs.length })); NS.folderWrite(false); return todayView(); }, function (e) { NS.toast(e.message, 'bad'); });
  }
  function accView() {
    return load().then(function () {
      var today = NS.today(), ac = D.accounts(DOCS, who()), m0 = today.slice(0, 7) + '-01', s = D.summary(DOCS, m0, today, who()), s0 = D.summary(DOCS, today, today, who());
      var tiles = '<div class="tiles"><div class="tile"><span>' + esc(t('dy.t.coll')) + '</span><b>' + lit(s0.collLitres) + ' L</b><small>' + esc(t('dy.t.m', { v: lit(s.collLitres) })) + '</small></div>' +
        '<div class="tile"><span>' + esc(t('dy.t.del')) + '</span><b>' + lit(s0.delLitres) + ' L</b><small>' + esc(t('dy.t.m', { v: lit(s.delLitres) })) + '</small></div>' +
        '<div class="tile"><span>' + esc(t('dy.t.buy')) + '</span><b>' + money(s.collAmt) + '</b></div><div class="tile ok"><span>' + esc(t('dy.t.sell')) + '</span><b>' + money(s.delAmt) + '</b></div></div>';
      var rows = ac.map(function (a) {
        var coll = a.role === 'collect', due = a.due, d = DOCS.filter(function (x) { return x.id === a.id; })[0];
        var txt = d ? D.statementText(d, D.calc(d), fd) : '';
        return '<tr><td><b>' + esc(a.name) + '</b><br><small>' + esc(t('dy.r.' + a.role) + ' · ' + fd(a.from) + ' – ' + fd(a.to)) + '</small></td><td class="n">' + lit(a.litres) + '</td><td class="n">' + (Math.abs(due) < 0.005 ? '—' : money(Math.abs(due))) + '</td><td>' +
          (Math.abs(due) < 0.005 ? '' : esc(t(due > 0 ? (coll ? 'dy.weowe' : 'dy.oweus') : (coll ? 'dy.theyowe' : 'dy.advance2')))) + '</td><td class="rq-acts"><button type="button" class="btn sm" data-dy="open" data-id="' + esc(a.id) + '">' + esc(t('h.open')) + '</button> ' +
          (d ? '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(D.wa(a.phone, txt)) + '">' + esc(t('dy.wa')) + '</a>' : '') + '</td></tr>';
      }).join('');
      dlg(t('dy.deskt'), tabs('acc') + tiles + (ac.length ? '<div class="ht-wrap"><table class="day"><thead><tr><th>' + esc(t('dy.name')) + '</th><th class="n">' + esc(t('dy.litres')) + '</th><th class="n">' + esc(t('dy.bal')) + '</th><th></th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">' + esc(t('dy.acch')) + '</p>' +
        '<div class="row"><button type="button" class="btn" data-dy="xl">' + esc(t('dy.xl')) + '</button> <button type="button" class="btn" data-dy="csv">' + esc(t('dy.csv')) + '</button></div>' : '<p>' + esc(t('dy.noacc')) + '</p>'));
    });
  }
  function nextView() {
    return load().then(function () {
      var list = D.toStart(DOCS, NS.today(), who());
      var body = tabs('next') + '<p class="hint">' + esc(t('dy.nexth')) + '</p>' + (list.length ? '<ul class="gr-list">' + list.map(function (d, i) {
        var o = D.calc(d);
        return '<li><div class="gr-m"><label class="chk"><input type="checkbox" data-nx="' + i + '" checked> <b>' + esc(d.buyer.name) + '</b></label><small>' + esc(t('dy.r.' + d.role) + ' · ' + fd(d.from) + ' – ' + fd(d.to) + (Math.abs(o.due) > 0.004 ? ' · ' + t('dy.carry', { v: money(o.due) }) : '')) + '</small></div></li>';
      }).join('') + '</ul><div class="row"><button type="button" class="btn primary" data-dy="startnext">' + esc(t('dy.startnext')) + '</button></div>' : '<p>' + esc(t('dy.nonext')) + '</p>');
      var x = dlg(t('dy.deskt'), body); x._list = list;
    });
  }
  function startNext(x) {
    var list = x._list || [], pick = $$('[data-nx]', x).filter(function (c) { return c.checked; }).map(function (c) { return list[+c.getAttribute('data-nx')]; });
    if (!pick.length) return;
    var all = DOCS.slice(), nn = numberer(NS.today(), all), n = 0;
    return pick.reduce(function (p, d) {
      return p.then(function () {
        var r = D.next(d); r.no = nn(); r.created = undefined; delete r.created;
        return put(r).then(function (rec) { all.push(rec); n++; });
      });
    }, Promise.resolve()).then(function () { NS.toast(t('dy.started', { n: n })); NS.folderWrite(false); return nextView(); }, function (e) { NS.toast(e.message, 'bad'); });
  }
  function xlAll() {
    var sheetsDay = D.dayRows(DOCS, who()), ac = D.accounts(DOCS, who());
    NS.xlsx('dairy-' + NS.today() + '.xlsx', [{ name: 'Daily', rows: sheetsDay }, { name: 'Accounts', rows: [['Name', 'Kind', 'From', 'To', 'Litres', 'Worth of period', 'Balance', 'Side']].concat(ac.map(function (a) { return [a.name, a.role === 'collect' ? 'Farmer (collection)' : 'Customer (delivery)', a.from, a.to, a.litres, a.amt, r2(Math.abs(a.due)), a.due > 0 ? (a.role === 'collect' ? 'We owe' : 'Owes us') : a.due < 0 ? (a.role === 'collect' ? 'Paid in excess' : 'Paid in advance') : '']; })) }]);
  }

  K = NS.kit({
    type: 'dairy', prefix: 'DY', digits: 3, paper: 'a4', papers: NS.PAPER_ALL, copies: 2, copyLabels: ['Party copy', 'Office copy'], party: false,
    name: function (d) { return d.role === 'deliver' ? 'Milk Delivery Statement' : 'Milk Collection Statement'; },
    blank: function () {
      var p = D.periodOf(NS.today(), 'fn');
      return { role: 'collect', per: 'fn', pdate: NS.today(), from: p.from, to: p.to, method: 'flat', rate: '', base: '', fatRate: '', snfRate: '', chart: '', usualAm: '', usualPm: '', usualFat: '', usualSnf: '', days: [], adj: [], open: '', adv: '', paid: '', pmode: 'cash', status: '' };
    },
    newRow: function (n) { return n === 'adj' ? adjRow() : dayRow(); },
    emptyRows: true,
    keepOnNew: function (d) { return { role: d.role, per: d.per, method: d.method, rate: d.rate, base: d.base, fatRate: d.fatRate, snfRate: d.snfRate, chart: d.chart, pmode: d.pmode, paper: d.paper, copies: d.copies }; },
    form: function (K) {
      return '<div class="row wide pos-go gr-go"><button type="button" class="btn primary" data-dy="today">' + esc(t('dy.today')) + '</button><button type="button" class="btn" data-dy="acc">' + esc(t('dy.acc')) + '</button><button type="button" class="btn" data-dy="next">' + esc(t('dy.next')) + '</button></div>' +
        K.card(t('dy.who'), '<div class="fg">' + K.f('role', t('dy.kind'), { type: 'select', opts: [['collect', t('dy.k.collect')], ['deliver', t('dy.k.deliver')]], hint: t('dy.kindh') }) +
          K.f('buyer.name', t('dy.pname'), { wide: true, ph: t('dy.pnameph') }) + K.f('buyer.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) + K.f('buyer.addr', t('dy.village'), { wide: true }) + '</div>') +
        K.numCard(K.f('per', t('dy.per'), { type: 'select', opts: [['fn', t('dy.p.fn')], ['mo', t('dy.p.mo')]] }) + K.f('pdate', t('dy.pdate'), { type: 'date', hint: t('dy.pdateh') }) + '<p class="hint wide" data-dy-period></p>', t('dy.lgp')) +
        K.card(t('dy.rates'), '<p class="hint">' + esc(t('dy.ratesh')) + '</p><div class="fg">' + K.f('method', t('dy.method'), { type: 'select', opts: [['flat', t('dy.m.flat')], ['point', t('dy.m.point')], ['chart', t('dy.m.chart')]] }) +
          K.f('rate', t('dy.rate'), { mode: 'decimal', ltr: 1, show: 'method=flat' }) + K.f('base', t('dy.base'), { mode: 'decimal', ltr: 1, show: 'method=point', hint: t('dy.baseh') }) + K.f('fatRate', t('dy.fatrate'), { mode: 'decimal', ltr: 1, show: 'method=point', hint: t('dy.fatrateh') }) + K.f('snfRate', t('dy.snfrate'), { mode: 'decimal', ltr: 1, show: 'method=point' }) +
          K.f('chart', t('dy.chart'), { type: 'textarea', wide: true, rows: 5, show: 'method=chart', ph: '3.0:30\n3.5:34\n4.0:38', hint: t('dy.charth') }) + '</div>') +
        K.card(t('dy.days'), '<p class="hint">' + esc(t('dy.daysh')) + '</p><div class="fg">' + K.f('usualAm', t('dy.usualam'), { mode: 'decimal', ltr: 1 }) + K.f('usualPm', t('dy.usualpm'), { mode: 'decimal', ltr: 1 }) +
          K.f('usualFat', t('dy.usualfat'), { mode: 'decimal', ltr: 1, show: 'role=collect' }) + K.f('usualSnf', t('dy.usualsnf'), { mode: 'decimal', ltr: 1, show: 'role=collect' }) +
          '<div class="f wide"><button type="button" class="btn" data-dy="fill">' + esc(t('dy.fill')) + '</button></div></div>' + K.list('days', t('dy.addday'))) +
        K.card(t('dy.adjs'), '<p class="hint">' + esc(t('dy.adjsh')) + '</p>' + K.list('adj', t('dy.addadj')) + '<datalist id="dl-adj"><option value="Cattle feed"><option value="Medicine / vet"><option value="Loan instalment"><option value="Bonus"><option value="Container / can deposit"></datalist>') +
        K.card(t('dy.settle'), '<div class="fg">' + K.f('open', t('dy.open'), { mode: 'decimal', ltr: 1, hint: t('dy.openh') }) + K.f('adv', t('dy.adv'), { mode: 'decimal', ltr: 1, hint: t('dy.advh') }) +
          K.f('paid', t('dy.paid'), { mode: 'decimal', ltr: 1, hint: t('dy.paidh') }) + K.f('pmode', t('dy.pmode'), { type: 'select', opts: K.modes(['cash', 'upi', 'cheque', 'bank']) }) +
          K.f('status', t('dy.state'), { type: 'select', opts: [['', t('dy.s.open')], ['closed', t('dy.s.closed')]], hint: t('dy.stateh') }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div><div class="row wide pos-go"><button type="button" class="btn" data-dy="wa">' + esc(t('dy.wa')) + '</button></div></div>') +
        K.bizCard({ lg: t('dy.lgbiz') }) + K.lookCard();
    },
    rows: {
      days: function (r, i, K) {
        var c = D.day(K.doc(), r);
        return K.rf('days', i, 'date', t('dy.date'), { type: 'date' }) + K.rf('days', i, 'am', t('dy.d.am'), { mode: 'decimal', ltr: 1 }) + K.rf('days', i, 'pm', t('dy.d.pm'), { mode: 'decimal', ltr: 1 }) +
          (K.doc().role !== 'deliver' ? K.rf('days', i, 'fat', t('dy.d.fat'), { mode: 'decimal', ltr: 1 }) + K.rf('days', i, 'snf', t('dy.d.snf'), { mode: 'decimal', ltr: 1 }) : '') +
          K.rf('days', i, 'rate', t('dy.d.rate'), { mode: 'decimal', ltr: 1 }) + K.rf('days', i, 'skip', t('dy.d.skip'), { type: 'select', opts: [['', t('dy.d.none')], ['skip', t('dy.skip')]] }) +
          '<p class="hint wide" data-daynet="' + i + '">' + esc(dayText(c)) + '</p>';
      },
      adj: function (x, i, K) {
        return K.rf('adj', i, 'name', t('dy.aname'), { cls: 'it-d', list: 'dl-adj' }) + K.rf('adj', i, 'amt', t('dy.aamt'), { mode: 'decimal', ltr: 1 }) + K.rf('adj', i, 'side', t('dy.aside'), { type: 'select', opts: [['less', t('dy.a.less')], ['add', t('dy.a.add')]] });
      }
    },
    input: function (p, el, d, K) {
      if (p === 'role' || p === 'method' || p === 'per') { fixPeriod(d); K.refill(); }
      else if (p === 'pdate') { fixPeriod(d); d.date = d.pdate || d.date; periodNote(); K.changed(); }
      else if (/^days\./.test(p) || p === 'rate' || p === 'fatRate' || p === 'snfRate' || p === 'base' || p === 'chart') nets();
    },
    sums: sums,
    edSums: function (d, o) {
      var coll = d.role !== 'deliver';
      return '<span>' + esc(t('dy.s.l', { n: lit(o.litres), d: o.days })) + '</span>' + (o.avgFat ? '<span>' + esc(t('dy.s.fat', { v: o.avgFat })) + '</span>' : '') + '<span>' + esc(t('dy.s.amt', { v: money(o.amt) })) + '</span>' +
        (o.add || o.less ? '<span>' + esc(t('dy.s.adj', { v: money(o.add - o.less) })) + '</span>' : '') + '<b>' + esc(t(coll ? 'dy.s.duec' : 'dy.s.dued', { v: money(o.due) })) + '</b>' + (o.missing ? '<span class="warn">' + esc(t('dy.s.miss', { n: o.missing })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('dy.v.name')]);
      if (!d.from || !d.to) p.push(['k-pdate', t('dy.v.period')]);
      if (o.missing) p.push([d.method === 'flat' ? 'k-rate' : 'k-method', t('dy.v.rate', { n: o.missing })]);
      if ((d.days || []).some(function (r) { return r.date && (r.date < d.from || r.date > d.to); })) p.push(['k-pdate', t('dy.v.out')]);
      var seen = {}; (d.days || []).forEach(function (r) { if (r.date) { if (seen[r.date]) p.push(['k-pdate', t('dy.v.twice', { d: fd(r.date) })]); seen[r.date] = 1; } });
      if ((d.days || []).some(function (r) { return num(r.fat) > 15 || num(r.snf) > 15 || num(r.fat) < 0 || num(r.snf) < 0; })) p.push(['k-method', t('dy.v.fat')]);
      if (!(o.amt > 0) && !(o.add > 0)) p.push(['k-method', t('dy.v.none')]);
      return p;
    },
    confirm: function (d, o) { return d.pmode === 'cash' && o.paid >= 200000 ? t('c.cash2l') : ''; },
    record: function (rec, o) { var c = D.calc(rec); rec.books = D.books(rec, c); rec.balance = c.due; rec.kind = 'plain'; rec.days = (rec.days || []).filter(function (r) { return r.date; }); rec.adj = (rec.adj || []).filter(function (a) { return String(a.name || '').trim() || num(a.amt); }); },
    saved: function (rec) {
      var b = rec.buyer; if (!b || !String(b.name || '').trim()) return;
      var want = rec.role === 'deliver' ? 'customer' : 'supplier';
      NSStore.list('party').then(function (all) {
        var hit = all.filter(function (x) { return D.key(x.name) === D.key(b.name); })[0];
        var role = !hit || !hit.role ? want : hit.role === want || hit.role === 'both' ? hit.role : 'both';
        return NSStore.put('party', Object.assign(hit || {}, { name: b.name.trim(), addr: b.addr || (hit && hit.addr) || '', phone: b.phone || (hit && hit.phone) || '', role: role }));
      }); load();
    },
    load: function (d) { if (!d.days) d.days = []; if (!d.adj) d.adj = []; if (!d.pdate) d.pdate = d.from || d.date; },
    copyOf: function (d, rec) { var n = D.next(rec); ['from', 'to', 'pdate', 'date', 'days', 'adj', 'paid', 'adv', 'open', 'status'].forEach(function (k) { d[k] = n[k]; }); delete d.books; },
    copyLbl: 'dy.nextcopy',
    histName: function (d) { return (d.buyer && d.buyer.name || '') + ' · ' + fd(d.from) + ' – ' + fd(d.to); },
    histText: function (d) { return [d.buyer && d.buyer.phone, d.buyer && d.buyer.addr, d.role].join(' '); },
    histPill: function (d) { var due = num(d.balance); return ' <span class="pill' + (Math.abs(due) < 0.005 ? ' ok' : '') + '">' + esc(t(d.role === 'deliver' ? 'dy.r.deliver' : 'dy.r.collect')) + '</span>' + (Math.abs(due) >= 0.005 ? ' <small>' + esc(money(due)) + '</small>' : ''); },
    shareText: function (d, o) { return '\n' + D.statementText(d, o, fd); },
    upiShare: false,
    sheet: function (d, o, K, label) {
      var coll = d.role !== 'deliver', b = d.buyer || {}, fat = coll && D.chartParse ? true : false;
      var meta = [['Passbook No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Period', fd(d.from) + ' – ' + fd(d.to)], [coll ? 'Farmer / supplier' : 'Customer', '<b>' + esc(b.name) + '</b>' + (b.addr ? '<br>' + esc(b.addr).replace(/\n/g, '<br>') : '') + (b.phone ? '<br>' + esc(b.phone) : '')],
        ['Rate', esc(d.method === 'point' ? 'by fat' + (num(d.snfRate) ? ' and SNF' : '') + ' (Rs ' + (num(d.fatRate) || 0) + ' per 1% fat' + (num(d.snfRate) ? ', Rs ' + num(d.snfRate) + ' per 1% SNF' : '') + (num(d.base) ? ', plus Rs ' + num(d.base) + ' a litre' : '') + ')' : d.method === 'chart' ? 'by fat (rate chart)' : 'Rs ' + (num(d.rate) || 0) + ' a litre')]];
      var shown = o.rows.filter(function (x) { return x.any; }), hasFat = shown.some(function (x) { return x.fat > 0 || x.snf > 0; }), hasOwn = shown.some(function (x) { return x.own; });
      var lines = '<table class="lines"><thead><tr><th class="l">Date</th><th class="n">Morning L</th><th class="n">Evening L</th><th class="n">Total L</th>' + (hasFat ? '<th class="n">Fat</th><th class="n">SNF</th>' : '') + '<th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' +
        shown.map(function (x) {
          return '<tr><td class="l">' + fd(x.date) + '</td>' + (x.skip ? '<td class="n" colspan="' + (hasFat ? 5 : 3) + '"><i>' + (coll ? 'Not collected' : 'Skipped') + '</i></td>' : '<td class="n">' + (x.am ? lit(x.am) : '') + '</td><td class="n">' + (x.pm ? lit(x.pm) : '') + '</td><td class="n">' + lit(x.litres) + '</td>' + (hasFat ? '<td class="n">' + (x.fat || '') + '</td><td class="n">' + (x.snf || '') + '</td>' : '') + '<td class="n">' + (x.rate ? NS.money(x.rate, false) : '') + (x.own ? '*' : '') + '</td>') + '<td class="n">' + (x.skip ? '' : NS.money(x.amt, false)) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><th class="l">Total</th><th></th><th></th><th class="n">' + lit(o.litres) + '</th>' + (hasFat ? '<th class="n">' + (o.avgFat || '') + '</th><th class="n">' + (o.avgSnf || '') + '</th>' : '') + '<th></th><th class="n">' + NS.money(o.amt, false) + '</th></tr></tfoot></table>' +
        '<p class="small">' + o.days + ' days with milk' + (o.skipped ? ', ' + o.skipped + ' skipped' : '') + (o.avgFat ? '. Average fat ' + o.avgFat + (o.avgSnf ? ', SNF ' + o.avgSnf : '') + ' (by litres).' : '.') + (hasOwn ? ' * rate fixed for that day.' : '') + '</p>';
      var rows = [['Milk ' + (coll ? 'collected' : 'delivered') + ' (' + lit(o.litres) + ' L)', NS.money(o.amt)]].concat((d.adj || []).filter(function (a) { return num(a.amt) > 0; }).map(function (a) { return [(a.side === 'add' ? 'Add: ' : 'Less: ') + esc(a.name || 'Adjustment'), (a.side === 'add' ? '' : '−') + NS.money(num(a.amt))]; }))
        .concat([['Amount for the period', NS.money(o.net), 'grand'], o.open ? ['Brought forward', NS.money(o.open)] : null, o.adv ? ['Less: advance', '−' + NS.money(o.adv)] : null, o.paid ? [(coll ? 'Paid now' : 'Received now') + ' (' + K.mode(d.pmode) + ')', '−' + NS.money(o.paid)] : null,
          [o.due >= 0 ? (coll ? 'Balance payable to you' : 'Balance due from you') : (coll ? 'Paid in excess' : 'Paid in advance'), NS.money(Math.abs(o.due)), 'grand']]);
      return K.open(d, 'dairy') + K.head(d, coll ? 'MILK COLLECTION STATEMENT' : 'MILK DELIVERY STATEMENT', label || '') + K.meta(meta) + lines +
        '<div class="foot"><div class="foot-l">' + K.words(Math.abs(o.due)) + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot(rows) + '</div></div>' +
        '<div class="signs">' + K.blankSign('', coll ? 'Farmer’s signature' : 'Customer’s signature') + K.sign(d) + '</div>' + K.made() + '</div>';
    },
    wire: function (ed, k) {
      K = k; periodNote();
      $$('[data-dy]', ed).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = b.getAttribute('data-dy'), d = K.doc();
          if (a === 'today') { entryDate = ''; todayView(); } else if (a === 'acc') accView(); else if (a === 'next') nextView();
          else if (a === 'fill') { fixPeriod(d); D.fillDays(d, { am: d.usualAm, pm: d.usualPm, fat: d.role === 'deliver' ? '' : d.usualFat, snf: d.role === 'deliver' ? '' : d.usualSnf }); K.refill(); NS.toast(t('dy.filled', { n: d.days.length })); }
          else if (a === 'wa') { var o = D.calc(d); window.open(D.wa(d.buyer.phone, D.statementText(d, o, fd)), '_blank', 'noopener'); }
        });
      });
    },
    rowsDrawn: function () { nets(); },
    drawn: function () { nets(); },
    ready: function (K0) {
      K = K0; load();
      if ($('#dy-dlg')) return;
      document.head.appendChild(NS.el('style', {}, '.dy-today th,.dy-today td{padding:6px 4px}.dy-in{width:4.4em;min-width:0;padding:8px 6px}.dy-today .chk{white-space:nowrap}.dy-tot{font-weight:600;margin:8px 0}'));
      var x = NS.el('dialog', { id: 'dy-dlg', 'aria-labelledby': 'dy-dlg-h', 'class': 'ht-dlg' }, '<div class="dlg-h"><h2 id="dy-dlg-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-body></div>');
      document.body.appendChild(x);
      $('[data-close]', x).textContent = t('close');
      document.addEventListener('ns-lang', function () { $('[data-close]', x).textContent = t('close'); });
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      x.addEventListener('click', function (e) {
        var v = e.target.closest('[data-dv]'), a = e.target.closest('[data-dy]');
        if (v) { var w = v.getAttribute('data-dv'); if (w === 'today') todayView(); else if (w === 'acc') accView(); else nextView(); return; }
        if (!a) return;
        var act = a.getAttribute('data-dy');
        if (act === 'saveday') saveDay(x); else if (act === 'startnext') startNext(x);
        else if (act === 'open') NSStore.get('doc', a.getAttribute('data-id')).then(function (r) { if (r) { x.close(); K.openDoc(r, false); } });
        else if (act === 'xl') xlAll(); else if (act === 'csv') download('dairy-' + NS.today() + '.csv', D.csv(D.dayRows(DOCS, who())));
      });
      x.addEventListener('input', function (e) { if (e.target.closest('.dy-today')) todayTotals(x); });
      x.addEventListener('change', function (e) {
        if (e.target.id === 'dy-date') { entryDate = e.target.value || ''; todayView(); } else if (e.target.closest('.dy-today')) todayTotals(x);
      });
    }
  });
  function dayText(c) { return c.skip ? t('dy.skipped') : c.litres > 0 ? (c.missing ? t('dy.norate') : t('dy.daynet', { l: lit(c.litres), r: money(c.rate), v: money(c.amt) })) : ''; }
  function nets() {
    var d = K && K.doc(); if (!d) return;
    $$('[data-daynet]').forEach(function (e) { var i = +e.getAttribute('data-daynet'); e.textContent = dayText(D.day(d, (d.days || [])[i])); });
  }
  function periodNote() { var d = K && K.doc(), e = $('[data-dy-period]'); if (e && d) e.textContent = d.from ? t('dy.periodis', { a: fd(d.from), b: fd(d.to) }) : ''; }
})();
