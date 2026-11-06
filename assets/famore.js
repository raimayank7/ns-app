/* More final accounts in the Nivesh Sahayak App (after finrep.js; the full App only). The sums are in facore.js (NSFA).
     fam/mfg   manufacturing account and cost of goods sold, for a business with production entries; work in progress
               (typed, saved on the business: biz.fa.wip) also goes into the statements' opening and closing stock;
               which expenses are factory costs (biz.fa.direct) is ticked here
     fam/firm  partnership firm / LLP: profit and loss appropriation account and the partners' capital accounts
     fam/rp    trust / society / school: receipts and payments account (cash and bank only)
   Through A.finHook (finrep.js) the final accounts screens also change: a firm's balance sheet lists each partner's capital,
   a company says shareholders' funds, a trust or society gets the income and expenditure account and a capital fund.
   Type of business and partners are set in My data › My businesses (fahub.js).
   Screens use the 'fm.' keys; the printed sheets, PDF and Excel are in English like every printed document.
   Hook for the T-format work (Trading account): NSApp.famMfg() returns the manufacturing figures of the period on screen
   (cogm = cost of goods manufactured, to carry into the Trading account in place of raw material purchases). */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NSPL || !window.NSFA || !A.fin) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, B = NSBooks, P = NSPL, F = NSFA, key = B.key, X = A.fin;
  function M(k, v) { return NS.t('fm.' + k, v); }
  var view = 'mfg';
  function bz() { return A.biz() || {}; }
  function bt() { return F.btype(A.biz()); }
  function faSet() { return bz().fa || {}; }
  function wipAt(d) { var w = faSet().wip || {}; return d && w[d] != null ? num(w[d]) : 0; }
  function ln(loc, en, v, c) { return { loc: loc, en: en, v: v, c: c || '' }; }

  /* work in progress typed for this business joins the opening and closing stock of the statements */
  var fromBooks = P.fromBooks;
  P.fromBooks = function (docs, items, biz, from, to, opt) {
    opt = opt || {};
    if (to && key(biz) === key(A.bizName()) && opt.wipOpen == null && opt.wipClose == null && faSet().wip) opt = Object.assign({}, opt, { wipOpen: from ? wipAt(P.prevDay(from)) : 0, wipClose: wipAt(to) });
    /* finished goods at full cost (AS 2): factory overheads spread over the goods made, on the made goods still in stock */
    if (to && key(biz) === key(A.bizName()) && opt.as2Close == null) {
      var fc = F.fullCost(docs, items, biz, to, faSet().direct || null), fo = from ? F.fullCost(docs, items, biz, P.prevDay(from), faSet().direct || null) : null;
      if (fc.uplift || fo && fo.uplift) opt = Object.assign({}, opt, { as2Close: fc.uplift, as2Open: fo ? fo.uplift : 0 });
    }
    return fromBooks.call(P, docs, items, biz, from, to, opt);
  };

  /* ---------- the figures ---------- */
  function amt(x) { return r2(x.dr - x.cr); }
  function mfgCalc(C) {
    var r = C.r, exps = C.rows.filter(function (x) { return x.k.indexOf('exp:') === 0; }).map(function (x) { return { k: x.k, name: x.en, loc: x.loc, v: amt(x) }; });
    var dir = faSet().direct || null, fc = F.fullCost(A.data().doc, A.data().item, A.bizName(), r[1], dir), fo = F.fullCost(A.data().doc, A.data().item, A.bizName(), P.prevDay(r[0]), dir);
    var x = F.mfg(A.data().doc, A.data().item, A.bizName(), r[0], r[1], { exps: exps, direct: dir, wipOpen: wipAt(P.prevDay(r[0])), wipClose: wipAt(r[1]), purTotal: C.F.pl.pur, rev: C.F.pl.rev, as2Open: fo.uplift, as2Close: fc.uplift });
    x.as2 = fc;
    var L = {}; exps.forEach(function (e) { L[e.k] = e.loc; });
    x.direct.forEach(function (e) { e.loc = L[e.k] || e.name; });
    x.exps = exps;
    return x;
  }
  function firmCalc(C) { return F.firm(A.data().doc, A.bizName(), C.r[0], C.r[1], bz().partners, { profit: C.F.pl.profit, pbt: C.F.pl.pbt, mode: bz().apprMode }); }
  /* tformat.js: the same appropriation for the T format balance sheet (null when the business is not a firm with partners) */
  A.famFirm = function (C) { return F.hasPartners(A.biz()) && (bz().partners || []).length && C && C.F ? firmCalc(C) : null; };
  A.famMfg = function () { var C = X.calc(); return mfgCalc(C); };

  var WAGES = /wage|labou?r|salar|majdoor|mazdoor|karigar/i;
  /* ---------- lines: { loc, en, v, c } like finrep.js ---------- */
  function mfgLines(x) {
    var o = [ln(M('rawopen'), 'Opening stock of raw material', x.rawOpen, 'sub'), ln(M('rawpur'), 'Add: purchases of raw material', x.rawPur, 'sub'),
      ln(M('rawclose'), 'Less: closing stock of raw material', x.rawClose, 'sub'), ln(M('consumed'), 'Raw material consumed', x.consumed, 'b')];
    /* prime cost = material + direct wages; power, fuel, repairs and other factory costs are factory overheads after it (user test 2026-11-06) */
    var wages = x.direct.filter(function (e) { return WAGES.test(e.name || '') || WAGES.test(e.loc || ''); }), ovh = x.direct.filter(function (e) { return wages.indexOf(e) < 0; });
    var wt = r2(wages.reduce(function (s, e) { return s + e.v; }, 0)), ot = r2(ovh.reduce(function (s, e) { return s + e.v; }, 0));
    if (wages.length) { o.push(ln(NS.t('fx.fm_dwages'), 'Add: direct wages', wt, 'b')); wages.forEach(function (e) { o.push(ln(e.loc, e.name, e.v, 'sub')); }); }
    o.push(ln(M('prime'), 'Prime cost', r2(x.consumed + wt), 'tot'));
    if (ovh.length) { o.push(ln(NS.t('fx.fm_ovh'), 'Add: factory overheads', ot, 'b')); ovh.forEach(function (e) { o.push(ln(e.loc, e.name, e.v, 'sub')); }); }
    if (x.wipOpen) o.push(ln(M('wipo'), 'Add: opening work in progress', x.wipOpen, 'sub'));
    if (x.wipClose) o.push(ln(M('wipc'), 'Less: closing work in progress', x.wipClose, 'sub'));
    if (x.byp) o.push(ln(M('byp'), 'Less: by-products and scrap made', x.byp, 'sub'));
    o.push(ln(M('cogm'), 'Cost of goods manufactured', x.cogm, 'tot big'));
    return o;
  }
  function tradeLines(x) {
    var o = [ln(M('sales'), 'Sales (revenue from operations)', x.rev, 'b'), ln(M('cogs'), 'Cost of goods sold', null, 'sec'),
      ln(M('fgopen'), 'Opening stock of finished goods', x.fgOpen, 'sub'), ln(M('addcogm'), 'Add: cost of goods manufactured', x.cogm, 'sub')];
    if (x.byp) o.push(ln(M('addbyp'), 'Add: by-products and scrap made (into stock)', x.byp, 'sub'));
    if (x.purOther) o.push(ln(M('purother'), 'Add: other purchases (goods for resale, services)', x.purOther, 'sub'));
    o.push(ln(M('fgclose'), 'Less: closing stock of finished goods', x.fgClose, 'sub'), ln(M('cogs'), 'Cost of goods sold', x.cogs, 'tot'),
      ln(M(x.gross < 0 ? 'grossl' : 'gross'), x.gross < 0 ? 'Gross loss' : 'Gross profit', Math.abs(x.gross), 'tot big'));
    return o;
  }
  function apprLines(f) {
    var a = f.appr, o = [ln(M(a.profit < 0 ? 'nl' : 'np'), a.profit < 0 ? 'Net loss for the period' : 'Net profit for the period', a.profit, 'b')];
    o.push(ln(M('intcap'), 'Less: interest on capital', a.int, 'b'));
    a.rows.forEach(function (r) { if (r.int) o.push(ln(r.name, r.name, r.int, 'sub')); });
    o.push(ln(M('salary'), 'Less: partners\' salary (remuneration)', a.sal, 'b'));
    a.rows.forEach(function (r) { if (r.sal) o.push(ln(r.name, r.name, r.sal, 'sub')); });
    o.push(ln(M(a.divisible < 0 ? 'divl' : 'div'), a.divisible < 0 ? 'Loss shared in the profit-sharing ratio' : 'Profit shared in the profit-sharing ratio', a.divisible, 'b'));
    a.rows.forEach(function (r) { var s = a.equal ? '' : ' (' + r.ratio + '%)'; o.push(ln(r.name + s, r.name + s, r.share, 'sub')); });
    o.push(ln(M('apptot'), 'Total appropriated', r2(a.int + a.sal + a.divisible), 'tot'));
    return o;
  }
  /* names of accounts for receipts and payments (screen words + English) */
  var EXEN = { rent: 'Rent', power: 'Electricity', salary: 'Salary and wages', transport: 'Transport and freight', phone: 'Phone and internet', repair: 'Repairs and maintenance',
    office: 'Office expenses', fuel: 'Fuel', bank: 'Bank charges', prof: 'Professional fees', ads: 'Advertising', misc: 'Miscellaneous' };
  function headName(h, C) {
    var row = C.rows.filter(function (x) { return x.k === h.k; })[0];
    if (!h.px) return { loc: M('h_' + h.k), en: h.name };
    if (h.px === 'exp' || h.px === 'inc') {
      if (row) return { loc: row.loc, en: row.en };
      if (h.px === 'exp' && EXEN[h.rest]) return { loc: NS.t('app.ex_' + h.rest), en: EXEN[h.rest] };
      return { loc: h.name, en: h.name };
    }
    var nm = row ? row.en : h.name.split(': ').slice(1).join(': ');
    return { loc: M(h.px === 'cap' && /^Capital introduced/.test(h.name) ? 'h_capi' : 'h_' + h.px) + ': ' + nm, en: h.name.split(': ')[0] + ': ' + nm };
  }
  function rpLines(R, C) {
    var o = [ln(M('ob'), 'Opening balance', r2(R.open.cash + R.open.bank), 'b'), ln(M('cash'), 'Cash in hand', R.open.cash, 'sub'), ln(M('bank'), 'Bank', R.open.bank, 'sub')];
    o.push(ln(M('rec'), 'Receipts', R.recTotal, 'b'));
    R.rec.forEach(function (h) { var n = headName(h, C); o.push(ln(n.loc, n.en, h.v, 'sub')); });
    o.push(ln(M('totrec'), 'Total (opening balance and receipts)', r2(R.open.cash + R.open.bank + R.recTotal), 'tot'));
    o.push(ln(M('pay'), 'Payments', R.payTotal, 'b'));
    R.pay.forEach(function (h) { var n = headName(h, C); o.push(ln(n.loc, n.en, h.v, 'sub')); });
    o.push(ln(M('cb'), 'Closing balance', r2(R.close.cash + R.close.bank), 'b'), ln(M('cash'), 'Cash in hand', R.close.cash, 'sub'), ln(M('bank'), 'Bank', R.close.bank, 'sub'));
    if (Math.abs(R.gap) >= 0.005) o.push(ln(M('gap'), 'Cheques cleared on another date', R.gap, 'sub'));
    o.push(ln(M('totpay'), 'Total (payments and closing balance)', r2(R.payTotal + R.close.cash + R.close.bank + R.gap), 'tot'));
    return o;
  }
  function capTable(caps, en) {
    var H = en ? ['Partner', 'Opening', 'Capital brought in', 'Interest on capital', 'Salary', 'Share of profit', 'Drawings', 'Closing']
      : [M('partner'), M('c_open'), M('c_intro'), M('c_int'), M('c_sal'), M('c_share'), M('c_drw'), M('c_close')];
    var F2 = ['open', 'intro', 'int', 'sal', 'share', 'drw', 'close'], tot = {};
    caps.forEach(function (c) { F2.forEach(function (f) { tot[f] = r2((tot[f] || 0) + c[f]); }); });
    return '<table class="tbl fr-cap"><thead><tr>' + H.map(function (h, i) { return '<th class="' + (i ? 'n' : 'l') + '">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      caps.map(function (c) { return '<tr><th scope="row" class="l">' + esc(c.name) + '</th>' + F2.map(function (f) { return '<td class="n">' + (c[f] || f === 'close' ? money(c[f], false) : '') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody><tfoot><tr><th class="l">' + esc(en ? 'Total' : NS.t('pl.total')) + '</th>' + F2.map(function (f) { return '<th class="n">' + money(tot[f] || 0, false) + '</th>'; }).join('') + '</tr></tfoot></table>';
  }

  /* ---------- hooks into the final accounts screens (finrep.js) ---------- */
  function relabel(o, map) {
    return o.map(function (x) { var m = map[x.en]; return m ? Object.assign({}, x, { loc: M(m[0]), en: m[1] }) : x; });
  }
  var NPO_PL = { 'Revenue from operations': ['inc_act', 'Income from activities (fees, donations, sales)'], 'Expenses': ['expd', 'Expenditure'], 'Total expenses': ['totexpd', 'Total expenditure'],
    'Profit before tax': ['sbt', 'Surplus before tax'], 'Profit for the period': ['exi', 'Excess of income over expenditure'], 'Loss for the period': ['exe', 'Excess of expenditure over income'] };
  function feeTotal(C) {
    var b = key(A.bizName()), v = 0;
    A.data().doc.forEach(function (d) { if (d.type === 'fee' && B.role(d) && key(d.seller && d.seller.name) === b && d.date >= C.r[0] && d.date <= C.r[1]) v += B.itemTotals(d).taxable; });
    return r2(v);
  }
  A.finHook = function (kind, x, C) {
    var t = bt();
    if (kind === 'tab') return t === 'npo' && C === 'pl' ? M('t_ie') : x;
    if (kind === 'title') return t === 'npo' && C === 'pl' ? 'INCOME AND EXPENDITURE ACCOUNT' : x;
    if (kind === 'links') return links(x, C) + as2Note(C);
    if (kind === 'pl' && t === 'npo') {
      var o = relabel(x, NPO_PL), fee = feeTotal(C), i = -1;
      o.forEach(function (y, j) { if (i < 0 && y.en === NPO_PL['Revenue from operations'][1]) i = j; });
      if (fee && i >= 0) o.splice(i + 1, 0, ln(M('fees'), 'Fees received', fee, 'sub'), ln(M('othact'), 'Other income from activities', r2(C.F.pl.rev - fee), 'sub'));
      return o;
    }
    if (kind === 'pl' && F.hasProduction(A.data().doc, A.data().item, A.bizName(), C.r[0], C.r[1])) return mfgPl(x, C);
    if (kind === 'bs') {
      if (t === 'npo') return relabel(x, { 'Owner\'s funds': ['fund', 'Capital fund (general fund)'], 'Profit for the period': [C.F.pl.profit < 0 ? 'lessexe' : 'addexi', C.F.pl.profit < 0 ? 'Less: excess of expenditure over income' : 'Add: excess of income over expenditure'],
        'Loss for the period': ['lessexe', 'Less: excess of expenditure over income'] });
      if (t === 'co') return relabel(x, { 'Owner\'s funds': ['shf', 'Shareholders\' funds'] });
      if (F.hasPartners(A.biz()) && (bz().partners || []).length) return partnersBs(x, C);
    }
    return x;
  };
  /* a manufacturer's statement of profit and loss (Schedule III): raw material is "Cost of materials consumed" (opening + purchases
     − closing raw material), "Purchases of stock-in-trade" only for goods bought to resell, and the change in inventories only for
     finished goods, work in progress and stock-in-trade. Same total expenses and profit (user test 2026-11-06). */
  function mfgPl(o, C) {
    var i = -1, j = -1;
    o.forEach(function (y, k) { if (i < 0 && y.c === 'b' && y.en === 'Purchases of stock-in-trade') i = k; if (j < 0 && /^Changes in inventories/.test(y.en)) j = k; });
    if (i < 0 || j < i || o.some(function (y) { return y.c === 'b' && y.en === 'Cost of materials consumed'; })) return o;
    var m = mfgCalc(C), iE = i + 1, jE = j + 1;
    while (iE < o.length && o[iE].c === 'sub') iE++;
    while (jE < o.length && o[jE].c === 'sub') jE++;
    var fo = r2(C.os - m.rawOpen), fc = r2(C.cs - m.rawClose);
    var mat = [ln(NS.t('fx.cmc'), 'Cost of materials consumed', m.consumed, 'b'), ln(M('rawopen'), 'Opening stock of raw material', m.rawOpen, 'sub'),
      ln(M('rawpur'), 'Add: purchases of raw material', m.rawPur, 'sub'), ln(M('rawclose'), 'Less: closing stock of raw material', m.rawClose, 'sub')];
    if (m.purOther) mat.push(ln(o[i].loc, 'Purchases of stock-in-trade', m.purOther, 'b'));
    var chg = [ln(NS.t('fx.chgfg'), 'Changes in inventories of finished goods, work in progress and stock-in-trade', r2(fo - fc), 'b'),
      ln(NS.t('fx.osfg'), 'Opening stock (finished goods, work in progress, stock-in-trade)', fo, 'sub'), ln(NS.t('fx.csfg'), 'Less: closing stock (finished goods, work in progress, stock-in-trade)', fc, 'sub')];
    return o.slice(0, i).concat(mat, o.slice(iE, j), chg, o.slice(jE));
  }
  /* a firm's balance sheet: each partner's closing capital in place of capital, drawings and profit */
  function partnersBs(o, C) {
    var s = -1, e = -1;
    o.forEach(function (x, j) { if (s < 0 && x.en === 'Owner\'s funds') s = j; else if (s >= 0 && e < 0 && /^(Profit|Loss) for the period$/.test(x.en)) e = j; });
    if (s < 0 || e < 0) return o;
    var f = firmCalc(C), llp = bt() === 'llp', own = C.F.bs.own, sum = 0;
    var blk = [ln(M(llp ? 'pfund' : 'pcap'), llp ? 'Partners\' funds (contribution and current accounts)' : 'Partners\' capital accounts', own, 'b')];
    f.caps.forEach(function (c) { sum = r2(sum + c.close); blk.push(ln(c.name, c.name, c.close, 'sub')); });
    if (Math.abs(r2(own - sum)) >= 0.005) blk.push(ln(M('other'), 'Other capital and profit of earlier periods (not in a partner\'s account)', r2(own - sum), 'sub'));
    return o.slice(0, s).concat(blk, o.slice(e + 1));
  }
  function avail(C) {
    var t = bt(), out = [];
    if (F.hasProduction(A.data().doc, A.data().item, A.bizName(), C.r[0], C.r[1]) || wipAt(C.r[1])) out.push('mfg');
    if (F.hasPartners(A.biz())) out.push('firm');
    if (t === 'npo') out.push('rp');
    return out;
  }
  /* the method of valuing finished goods, under the statements when some were made */
  function as2Note(C) {
    var a = F.fullCost(A.data().doc, A.data().item, A.bizName(), C.r[1], faSet().direct || null);
    if (!a.made) return '';
    return '<p class="soft fm-as2">' + esc(NS.t('fx.as2', { oh: money(a.overheads), m: money(a.made), p: r2(a.factor * 100), u: money(a.uplift) })) +
      (a.capped ? ' ' + esc(NS.t('fx.as2cap', { c: money(a.capped) })) : '') + '</p>' + (a.high ? '<p class="note">' + esc(NS.t('fx.as2high')) + '</p>' : '');
  }
  function links(v, C) {
    var L = avail(C); if (!L.length) return '';
    return '<p class="quick fm-links"><span class="soft">' + esc(M('more')) + '</span> ' + L.map(function (k) { return '<a class="btn sm" href="#fam/' + k + '">' + esc(M('t_' + k)) + ' ›</a>'; }).join('') + '</p>';
  }

  /* ---------- the screen ---------- */
  function sheet(C, title, sub, body, note) {
    return '<div class="stsheet sh" dir="ltr" lang="en-IN" data-sheet>' + X.bizHead(title, sub) + body + (note ? '<p>' + esc(note) + '</p>' : '') +
      '<p class="st-ft">Made with the Nivesh Sahayak App on ' + A.ldate(NS.today()) + ' from the saved records.</p></div>';
  }
  var TITLES = { mfg: 'MANUFACTURING ACCOUNT', firm: 'PROFIT AND LOSS APPROPRIATION ACCOUNT', rp: 'RECEIPTS AND PAYMENTS ACCOUNT' };
  function forEn(r) { return (view === 'rp' || view === 'firm' || view === 'mfg' ? 'For ' : '') + A.ldate(r[0]) + ' to ' + A.ldate(r[1]); }
  function seg(C) {
    var L = avail(C); if (L.indexOf(view) < 0) L.push(view);
    return '<div class="seg" role="group"><a class="btn sm" href="#fin/pl">‹ ' + esc(NS.t('app.fin')) + '</a>' + L.map(function (k) {
      return '<a class="btn sm" href="#fam/' + k + '" aria-pressed="' + (k === view) + '"' + (k === view ? ' aria-current="page"' : '') + '>' + esc(M('t_' + k)) + '</a>'; }).join('') + '</div>';
  }
  function mfgHtml(C) {
    var x = mfgCalc(C), r = C.r, id = bz().id, D = faSet().direct;
    var form = '<details class="card fm-set"' + (x.on || x.wipOpen || x.wipClose ? '' : ' open') + '><summary><b>' + esc(M('sett')) + '</b></summary>' +
      '<div class="fg"><div class="f"><label for="fm-wo">' + esc(M('wipat', { d: A.ldate(P.prevDay(r[0])) })) + '</label><input id="fm-wo" inputmode="decimal" dir="ltr" autocomplete="off" value="' + (x.wipOpen || '') + '"></div>' +
      '<div class="f"><label for="fm-wc">' + esc(M('wipat', { d: A.ldate(r[1]) })) + '</label><input id="fm-wc" inputmode="decimal" dir="ltr" autocomplete="off" value="' + (x.wipClose || '') + '"></div>' +
      '<div class="f wide"><small class="hint">' + esc(M('wiph')) + '</small></div></div>' +
      (x.exps.length ? '<fieldset class="fm-dir"><legend>' + esc(M('dirt')) + '</legend>' + x.exps.map(function (e) {
        return '<label class="chk"><input type="checkbox" data-fmdir="' + esc(e.k) + '"' + (F.isDirect(e, D) ? ' checked' : '') + '> ' + esc(e.loc) + ' <span class="soft">' + money(e.v) + '</span></label>'; }).join('') +
        '<small class="hint">' + esc(M('dirh')) + '</small></fieldset>' : '') +
      (id ? '<div class="btns"><button type="button" class="btn primary" data-fmsave>' + esc(A.T('save')) + '</button></div>' : '<p class="note">' + esc(M('nobiz')) + '</p>') + '</details>';
    var made = x.made.length ? '<h3>' + esc(M('made')) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(M('item')) + '</th><th class="n">' + esc(M('qty')) + '</th><th class="n">' + esc(M('val')) + '</th></tr></thead><tbody>' +
      x.made.map(function (m) { return '<tr><th scope="row">' + esc(m.name) + '</th><td class="n">' + m.qty + ' ' + esc(m.unit || '') + '</td><td class="n">' + money(m.v, false) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
    var en = X.stTable(mfgLines(x), true) + '<h3 class="lg-h">TRADING (COST OF GOODS SOLD)</h3>' + X.stTable(tradeLines(x), true);
    return {
      tiles: [['cogm', money(x.cogm)], ['consumed', money(x.consumed)], [x.gross < 0 ? 'grossl' : 'gross', money(Math.abs(x.gross))]],
      body: (x.on ? '' : '<p class="note">' + esc(M('noprod')) + '</p>') + '<p class="soft">' + esc(M('mfgh')) + '</p>' + form +
        '<h3>' + esc(M('t_mfg')) + '</h3><div class="tbl-wrap">' + X.stTable(mfgLines(x)) + '</div>' +
        '<div class="tbl-wrap">' + X.stTable(tradeLines(x)) + '</div><p class="soft">' + esc(M('grossh')) + '</p>' + made,
      sheet: sheet(C, TITLES.mfg, forEn(r), en, 'Raw material: items used in production or a bill of materials and never made; valued at ' + X.valEn() + '. Factory expenses moved into the manufacturing account; net profit is the same as in the statement of profit and loss.'),
      xl: [{ name: 'Manufacturing account', rows: xrows(mfgLines(x)) }, { name: 'Cost of goods sold', rows: xrows(tradeLines(x)) }]
    };
  }
  function firmHtml(C) {
    var t = bt(), Pn = (bz().partners || []).filter(function (p) { return p && String(p.name || '').trim(); });
    if (!Pn.length) return { tiles: [], body: '<p class="note">' + esc(M('nopart')) + ' <a href="' + esc(A.myUrl('#biz')) + '">' + esc(M('addp')) + ' ›</a></p>', sheet: '', xl: null };
    var f = firmCalc(C), w = '';
    if (f.appr.equal) w += '<p class="note">' + esc(M('equal')) + '</p>';
    else if (Math.abs(f.shares - 100) >= 0.005) w += '<p class="note">' + esc(M('sh100', { x: r2(f.shares) })) + '</p>';
    if (f.overSal) w += '<p class="note bad">' + esc(M('overs', { s: money(f.appr.sal), x: money(f.limit) })) + '</p>';
    if (f.overInt) w += '<p class="note bad">' + esc(M('overi')) + '</p>';
    if (f.appr.mode === 'profit' && f.appr.cut < 1) w += '<p class="note">' + esc(f.appr.profit > 0 ? NS.t('fx.fm_cut', { x: money(f.appr.full), y: money(r2(f.appr.int + f.appr.sal)) }) : NS.t('fx.fm_loss', { x: money(f.appr.full) })) + '</p>';
    if (f.appr.mode === 'deed' && f.appr.profit < 0) w += '<p class="note">' + esc(NS.t('fx.fm_deed')) + '</p>';
    var en = X.stTable(apprLines(f), true) + '<h3 class="lg-h">PARTNERS\' CAPITAL ACCOUNTS</h3>' + capTable(f.caps, true);
    return {
      tiles: [[f.appr.profit < 0 ? 'nl' : 'np', money(Math.abs(f.appr.profit))], ['intcap', money(f.appr.int)], ['salary', money(f.appr.sal)]],
      body: w + '<h3>' + esc(M('apprt')) + '</h3><div class="tbl-wrap">' + X.stTable(apprLines(f)) + '</div>' +
        '<h3>' + esc(M(t === 'llp' ? 'pfund' : 'capt')) + '</h3><div class="tbl-wrap">' + capTable(f.caps) + '</div>' +
        '<p class="soft">' + esc(M('caph')) + '</p><p class="soft">' + esc(M('h40')) + ' ' + esc(M('lim', { x: money(f.limit) })) + '</p>' +
        '<p class="soft"><a href="' + esc(A.myUrl('#biz')) + '">' + esc(M('addp')) + ' ›</a> · <a href="#capl">' + esc(NS.t('app.capl')) + ' ›</a></p>',
      sheet: sheet(C, TITLES.firm, forEn(C.r), en, 'Interest on capital and salary as set for each partner in the business details; the rest shared in the profit-sharing ratio. ' +
        (f.appr.mode === 'deed' ? 'As per the partnership deed, interest and salary are allowed even when there is a loss.' : 'Interest and salary are allowed only out of profit' + (f.appr.cut < 1 ? ' (cut in proportion to the profit available).' : '.'))),
      xl: [{ name: 'Appropriation', rows: xrows(apprLines(f)) }, { name: 'Partners capital', rows: [['Partner', 'Opening', 'Capital brought in', 'Interest on capital', 'Salary', 'Share of profit', 'Drawings', 'Closing']].concat(f.caps.map(function (c) { return [c.name, c.open, c.intro, c.int, c.sal, c.share, c.drw, c.close]; })) }]
    };
  }
  function rpHtml(C) {
    var R = F.recPay(A.data().doc, A.bizName(), C.r[0], C.r[1], bt() === 'firm' || bt() === 'llp'), L = rpLines(R, C);
    return {
      tiles: [['rec', money(R.recTotal)], ['pay', money(R.payTotal)], ['cb', money(r2(R.close.cash + R.close.bank))]],
      body: '<p class="soft">' + esc(M('rph')) + '</p><div class="tbl-wrap">' + X.stTable(L) + '</div>',
      sheet: sheet(C, TITLES.rp, forEn(C.r), X.stTable(L, true), 'Money received and paid in cash and bank only; bills not yet paid are in the income and expenditure account.'),
      xl: [{ name: 'Receipts and payments', rows: xrows(L) }]
    };
  }
  function xrows(lines) { return [['Particulars', 'Amount']].concat(lines.map(function (x) { return [(x.c === 'sub' ? '    ' : '') + x.en, x.v == null ? '' : x.v]; })); }
  var last = null;
  A.addSection('fam', function (arg) {
    view = ['mfg', 'firm', 'rp'].indexOf(arg) >= 0 ? arg : view;
    var C = X.calc(), V = ({ mfg: mfgHtml, firm: firmHtml, rp: rpHtml })[view](C);
    last = V;
    return '<div class="pane-hd"><h2>' + esc(M('t_' + view)) + '</h2>' + (V.sheet ? '<div class="quick no-print"><button type="button" class="btn" data-print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-fmpdf>' + esc(A.T('pdf')) + '</button><button type="button" class="btn" data-fmxl>' + esc(A.T('lg_xl')) + '</button></div>' : '') + '</div>' +
      seg(C) + X.period() +
      (V.tiles.length ? '<div class="tiles">' + V.tiles.map(function (x) { return '<div class="tile"><span>' + esc(M(x[0])) + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>' : '') +
      V.body + (V.sheet ? '<div class="fr-print">' + V.sheet + '</div>' : '');
  }, function (pane) {
    var s = $('[data-frpre]', pane);
    if (s) s.addEventListener('change', function () { var p = X.presets(NS.today())[s.value]; if (p) { A.range(p[0], p[1]); A.show(); } });
    var pb = $('[data-fmpdf]', pane); if (pb) pb.addEventListener('click', function () {
      var n = $('.fr-print > .stsheet', pane).cloneNode(true); n.classList.add('lg-paper');
      NS.sharePdf([n], X.fileName(A.bizName()) + '-' + { mfg: 'manufacturing-account', firm: 'appropriation-and-partners-capital', rp: 'receipts-and-payments' }[view] + '-' + A.range()[1], 'a4', M('t_' + view), '');
    });
    var xb = $('[data-fmxl]', pane); if (xb) xb.addEventListener('click', function () {
      var r = A.range(); if (last && last.xl) NS.xlsx(X.fileName(A.bizName()) + '-' + view + '-' + r[0] + '-to-' + r[1] + '.xlsx', last.xl);
    });
    var sv = $('[data-fmsave]', pane); if (sv) sv.addEventListener('click', function () {
      var b = A.biz(); if (!b || !b.id) return;
      var r = A.range(), rec = JSON.parse(JSON.stringify(b)), fa = rec.fa = rec.fa || {}, w = fa.wip = fa.wip || {};
      [[P.prevDay(r[0]), '#fm-wo'], [r[1], '#fm-wc']].forEach(function (p) { var v = r2(num($(p[1], pane).value)); if (v) w[p[0]] = v; else delete w[p[0]]; });
      var boxes = $$('[data-fmdir]', pane); if (boxes.length) {
        var keep = (fa.direct || []).filter(function (k) { return !boxes.some(function (c) { return c.getAttribute('data-fmdir') === k; }); });
        if (!fa.direct) keep = [];
        fa.direct = keep.concat(boxes.filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-fmdir'); }));
      }
      NSStore.put('biz', rec).then(function () { NS.toast(A.T('saved')); A.show(); }).catch(function (e) { NS.toast(String(e && e.message || e), 'bad'); });
    });
  });
})();
