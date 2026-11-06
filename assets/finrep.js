/* Final accounts and capital / loan entries of the Nivesh Sahayak App (after more.js; the full App only):
     fin/tb   trial balance for a period: every account with its Debit or Credit balance (profit and loss accounts = the
              movement in the period, balance sheet accounts = the balance on the last day), grouped by Schedule III head,
              optionally each customer and supplier instead of the two totals; must agree
     fin/pl   statement of profit and loss for the same period
     fin/bs   balance sheet as at the last day: owner's funds (capital less drawings plus profit), borrowings, current
              liabilities against fixed assets, stock, receivables, cash and bank, loans and advances
     capl     capital and loans: owner's money in / drawings, loans taken / repaid (interest part to finance costs),
              loans given / received back (interest to other income). Each is a journal entry (type 'jv', cl = kind), so
              books.js posts it and the journal list, trial balance and balance sheet all show it.
   The sums come from NSPL (plcore.js: fromBooks, statements) over NSBooks and NSStock; closing stock follows the
   valuation method of My data › Settings (NSStock.valuation: weighted average or FIFO).
   Screens use the 'fr.' / 'pl.' keys; the printed sheets, PDF and Excel are in English like every printed document. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NSPL) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, money = NS.money, B = NSBooks, P = NSPL, key = B.key;
  function T(k, v) { return NS.t('fr.' + k, v); }
  function L(k, v) { return NS.t('pl.' + k, v); }
  /* name of a screen (tab); famore.js gives a trust / society its own words */
  function tl(v) { return A.finHook ? A.finHook('tab', L('t_' + v), v) : L('t_' + v); }
  var view = 'tb', each = false;

  /* credit-nature heads: their amount is cr − dr */
  var CRH = { cap: 1, res: 1, ltb: 1, stb: 1, tpay: 1, ocl: 1, rev: 1, oinc: 1 };
  var EN_H = { cap: 'Capital', drw: 'Drawings', res: 'Reserves and surplus', ltb: 'Long-term borrowings', stb: 'Short-term borrowings', tpay: 'Trade payables', ocl: 'Other current liabilities',
    ppe: 'Property, plant and equipment', ninv: 'Investments', trec: 'Trade receivables', cash: 'Cash and cash equivalents', oca: 'Loans, advances and other current assets',
    rev: 'Revenue from operations', oinc: 'Other income', osk: 'Opening stock', mat: 'Cost of materials consumed', pur: 'Purchases of stock-in-trade', emp: 'Employee benefits expense',
    fin: 'Finance costs', dep: 'Depreciation', oth: 'Other expenses', tax: 'Tax expense' };
  var LBL = { sales: 'sales', 'sales-return': 'sret', purchases: 'pur', 'purchase-return': 'pret', 'round-off': 'round', cash: 'cash', bank: 'bank', 'chq-in': 'chqin', 'chq-out': 'chqout',
    'tds-receivable': 'tdsr', 'tds-payable': 'tdsp', opening: 'opening', osk: 'osk', 'cap-stock': 'capstock' };
  var PFX = /^(cap|drw|loan|od|given|fa|ocl|oca):/;
  /* expense heads the App's expense form saves as codes (app.js EXP) */
  var EXEN = { rent: 'Rent', power: 'Electricity', salary: 'Salary and wages', transport: 'Transport and freight', phone: 'Phone and internet', repair: 'Repairs and maintenance',
    office: 'Office expenses', fuel: 'Fuel', bank: 'Bank charges', prof: 'Professional fees', ads: 'Advertising', misc: 'Miscellaneous' };

  function fifo() { return NSStock.valuation && NSStock.valuation() === 'fifo'; }
  function valEn() { return fifo() ? 'FIFO cost (first in, first out)' : 'weighted average cost'; }
  /* names as typed on journal lines and fixed assets, for accounts stored by key (cap:ramesh -> Ramesh) */
  function typedNames() {
    var o = {};
    A.mine().forEach(function (d) {
      if (d.type === 'jv') (d.lines || []).forEach(function (l) { if (l.a && l.nm && l.a !== 'party' && !o[l.a]) o[l.a] = String(l.nm).trim(); });
      if (d.type === 'fa' && d.kind !== 'sale' && d.name) o['fa:' + key(d.name)] = o['fa:' + key(d.name)] || d.name;
    });
    return o;
  }
  /* expense heads typed in the screen language: their Schedule III head */
  function headMap() {
    var m = {}; m[key(NS.t('app.ex_salary'))] = 'emp'; m[key(NS.t('br.e_int'))] = 'fin'; m[key(NS.t('br.e_emi'))] = 'ltb'; m[key(NS.t('br.e_chg'))] = 'oth';
    return m;
  }
  /* the figures: trial balance lines (with names on screen and in English), statements, closing stock */
  function calc() {
    var r = A.range(), base = P.fromBooks(A.data().doc, A.data().item, A.bizName(), r[0], r[1], { map: headMap() }), N = typedNames();
    var rows = base.rows.map(function (x) {
      var o = Object.assign({}, x), nm = N[x.k] || x.name;
      if (x.k === 'trec' || x.k === 'tpay') { o.loc = L('l_' + x.k, { n: x.n }); o.en = (x.k === 'trec' ? 'Trade receivables (' : 'Trade payables (') + x.n + (x.k === 'trec' ? ' customer' : ' supplier') + (x.n === 1 ? ')' : 's)'); }
      else if (x.k === 'opening') { o.loc = NS.t('fx.l_opening'); o.en = x.name; }
      else if (x.k === 'gst') { o.loc = L(x.dr ? 'l_gstin' : 'l_gstout'); o.en = x.name; }
      else if (x.k === 'res-earlier') { o.loc = L(x.cr ? 'l_earlierp' : 'l_earlierl'); o.en = x.name; }
      else if (LBL[x.k]) { o.loc = L('l_' + LBL[x.k]); o.en = x.name; }
      else if (x.k === 'pdd') { o.loc = NS.t('wo.l_pdd'); o.en = x.name; }   /* provision for doubtful debts (WP-3) */
      else if (x.k.indexOf('given:') === 0) { o.loc = T('ty_given') + ': ' + nm; o.en = 'Loan given: ' + nm; }
      else if (PFX.test(x.k)) { o.loc = o.en = nm; }
      else if (EXEN[x.k.slice(4)] && x.k.indexOf('exp:') === 0) { o.loc = NS.t('app.ex_' + x.k.slice(4)); o.en = EXEN[x.k.slice(4)]; }
      else if (x.k.indexOf('exp:') === 0 && window.NSHeads && NSHeads.find(x.k) && !NSHeads.find(x.k).custom) { var hh = NSHeads.find(x.k); o.loc = NSHeads.label(hh); o.en = hh.en; }   /* a head saved in another language's words */
      else { o.loc = o.en = x.name; }
      return o;
    });
    return { r: r, rows: rows, os: base.os, cs: base.cs, F: P.statements(rows, base.cs) };
  }
  /* a partnership firm or LLP: "Partner puts money in / takes money out" (round C) */
  function kName(k) { var b = A.biz && A.biz() || {}; return (k === 'capin' || k === 'drw') && /^(firm|llp)$/.test(b.btype || '') ? T('k_' + k + 'p') : T('k_' + k); }
  function amt(x) { return CRH[x.g] ? r2(x.cr - x.dr) : r2(x.dr - x.cr); }
  /* trial balance headings (round C): an input GST ledger (debit) sits under current assets, an output one under current
     liabilities, whatever the net is; a manufacturer's purchases are raw materials and goods, not "stock-in-trade" */
  function hg(x) { return /^gst-/.test(x.k || '') ? (x.dr >= x.cr ? 'oca' : 'ocl') : x.g; }
  function gName(g, en) { if (g === 'pur' && A.tfMaker && A.tfMaker()) return en ? 'Purchases (raw materials and goods)' : L('g_purm'); return en ? EN_H[g] : L('g_' + g); }
  /* gross profit as the trading account works it out (direct expenses included), so Schedule III's note, its tile and the
     T format show one figure (round C: three different gross profits) */
  function grossOf(C) {
    if (!window.NSTF || !window.NSTFV || !NSTF.tradingPL) return C.F.pl.gross;
    try { var R = NSTF.tradingPL(C.rows, C.cs, NSTFV.dx(A.cfg(), A.tfMaker && A.tfMaker())); return R.gross != null ? R.gross : C.F.pl.gross; } catch (e) { return C.F.pl.gross; }
  }
  /* each customer and supplier in place of the two totals (balance on the last day) */
  function partyRows(to) {
    var acc = B.accounts(A.data().doc, A.bizName(), to), P2 = B.parties(A.mine(), A.bizName()), out = [];
    Object.keys(acc).forEach(function (a) {
      if (a.indexOf('p:') !== 0) return;
      var v = r2(acc[a]); if (!v) return;
      var k = a.slice(2), nm = P2[k] ? P2[k].name : k === 'cash-customer' ? NS.t('b2.cashcust') : k;
      out.push({ k: a, g: v > 0 ? 'trec' : 'tpay', dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0, loc: nm, en: k === 'cash-customer' ? 'Cash customer' : nm, src: 'books' });
    });
    return out.sort(function (x, y) { return x.loc.localeCompare(y.loc); });
  }
  function tbRows(C) {
    var rows = C.rows;
    if (each) rows = rows.filter(function (x) { return x.k !== 'trec' && x.k !== 'tpay'; }).concat(partyRows(C.r[1]));
    return rows.slice().sort(function (a, b) { return P.ORDER.indexOf(a.g) - P.ORDER.indexOf(b.g); });
  }

  /* ---------- Trial balance styles: closing balance or detailed (opening, debits, credits, closing); group-wise, by account
     (customers and suppliers as one total) or ledger-wise (each of them); with or without stock. Remembered in this browser. */
  var TBK = 'ns-tb-style', tbp = (function () { var o = null; try { o = JSON.parse(localStorage.getItem(TBK) || 'null'); } catch (e) {} return Object.assign({ st: 'close', lv: 'acct', sk: true }, o || {}); })();
  each = tbp.lv === 'ledger';
  function S(k, v) { return NS.t('tbs.' + k, v); }
  function tbName(x, C) {
    var o = Object.assign({}, x), hit = C.rows.filter(function (y) { return y.k === x.k; })[0];
    if (x.grp) { o.loc = S(x.grp); o.en = x.name; }
    else if (x.k === 'res-earlier') { o.loc = L(x.cr || !x.dr && x.oc ? 'l_earlierp' : 'l_earlierl'); o.en = x.name; }
    else if (x.loc) return o;
    else if (hit) { o.loc = hit.loc; o.en = hit.en; }
    else if (x.k.indexOf('p:') === 0) { var k = x.k.slice(2), P2 = B.parties(A.mine(), A.bizName()); o.loc = P2[k] ? P2[k].name : k === 'cash-customer' ? NS.t('b2.cashcust') : k; o.en = k === 'cash-customer' ? 'Cash customer' : P2[k] ? P2[k].name : k; }
    else if (x.k === 'trec' || x.k === 'tpay') { o.loc = L('g_' + x.k); o.en = EN_H[x.g]; }
    else o.loc = o.en = x.name;
    return o;
  }
  function tbView(C) {
    var det = tbp.st === 'detail', rows;
    if (det) rows = P.tbDetail(A.data().doc, A.data().item, A.bizName(), C.r[0], C.r[1], { map: headMap(), each: each }).rows;
    else rows = tbRows(C);
    if (!tbp.sk) rows = P.stockOff(rows);
    if (tbp.lv === 'group') rows = P.tbGroups(rows);
    rows = rows.map(function (x) { return tbName(x, C); });
    if (tbp.lv !== 'group') rows.sort(function (a, b) { return P.ORDER.indexOf(a.g) - P.ORDER.indexOf(b.g) || (a.k.indexOf('p:') === 0 && b.k.indexOf('p:') === 0 ? a.loc.localeCompare(b.loc) : 0); });
    return { rows: rows, T: P.tbTotals(rows), det: det, grp: tbp.lv === 'group', sk: tbp.sk, cs: C.cs };
  }
  function tbControls() {
    function sel(f, opts) { return '<label><span>' + esc(S('l_' + f)) + '</span> <select data-tbs="' + f + '">' + opts.map(function (v) { return '<option value="' + v + '"' + (tbp[f] === v ? ' selected' : '') + '>' + esc(S(f + '_' + v)) + '</option>'; }).join('') + '</select></label>'; }
    return '<div class="tools-row fr-tbs">' + sel('st', ['close', 'detail']) + sel('lv', ['group', 'acct', 'ledger']) +
      '<label class="chk"><input type="checkbox" data-tbs="sk"' + (tbp.sk ? ' checked' : '') + '> ' + esc(S('sk')) + '</label></div>';
  }
  function tbGrid(V, en) {
    var c = function (v) { return v ? money(v, false) : ''; }, n = V.det ? 7 : 3, Tt = V.T, g0 = '';
    var hd = V.det ? '<tr><th class="l" rowspan="2">' + esc(en ? 'Account' : L('acct')) + '</th><th class="c" colspan="2">' + esc(en ? 'Opening balance' : S('open')) + '</th><th class="c" colspan="2">' + esc(en ? 'Transactions' : S('trans')) + '</th><th class="c" colspan="2">' + esc(en ? 'Closing balance' : S('close')) + '</th></tr><tr>' +
        [0, 1, 2].map(function () { return '<th class="n">' + esc(en ? 'Debit (Rs)' : L('dr')) + '</th><th class="n">' + esc(en ? 'Credit (Rs)' : L('cr')) + '</th>'; }).join('') + '</tr>'
      : '<tr><th class="l">' + esc(en ? 'Account' : L('acct')) + '</th><th class="n">' + esc(en ? 'Debit (Rs)' : L('dr')) + '</th><th class="n">' + esc(en ? 'Credit (Rs)' : L('cr')) + '</th></tr>';
    function cells(x) { return (V.det ? '<td class="n">' + c(x.od) + '</td><td class="n">' + c(x.oc) + '</td><td class="n">' + c(x.td) + '</td><td class="n">' + c(x.tc) + '</td>' : '') + '<td class="n">' + c(x.dr) + '</td><td class="n">' + c(x.cr) + '</td>'; }
    var body = V.rows.map(function (x) {
      var h = !V.grp && hg(x) !== g0 ? '<tr class="sec"><th colspan="' + n + '" class="l">' + esc(gName(hg(x), en)) + '</th></tr>' : ''; g0 = hg(x);
      return h + '<tr><th scope="row" class="l' + (V.grp ? '' : ' sub') + '">' + esc(en ? x.en : x.loc) + '</th>' + cells(x) + '</tr>';
    }).join('');
    var tot = function (v) { return '<th class="n">' + money(v, false) + '</th>'; };
    var bad = [['dopen', 'od'], ['dtr', 'td'], ['diff', 'dr']].filter(function (d) { return (V.det || d[0] === 'diff') && Math.abs(Tt[d[0]]) >= 0.005; });
    var memo = V.sk ? '<tr class="memo"><th class="l">' + esc(en ? 'Closing stock (memo only, not added to the totals): ' + valEn() : S('csmemo')) + '</th>' + (V.det ? '<td colspan="4"></td>' : '') + '<td class="n">' + money(V.cs, false) + '</td><td></td></tr>' : '';
    return '<table class="tbl fr-tb' + (V.det ? ' fr-tbd' : '') + '"><thead>' + hd + '</thead><tbody>' +
      (body || '<tr><td colspan="' + n + '" class="soft">' + esc(en ? 'No entries in this period.' : T('none')) + '</td></tr>') + '</tbody><tfoot><tr><th class="l">' + esc(en ? 'Total' : L('total')) + '</th>' +
      (V.det ? tot(Tt.od) + tot(Tt.oc) + tot(Tt.td) + tot(Tt.tc) : '') + tot(Tt.dr) + tot(Tt.cr) + '</tr>' +
      bad.map(function (d) {
        var at = V.det ? { od: 0, td: 2, dr: 4 }[d[1]] : 0, gap = function (k) { return k ? '<td colspan="' + k + '"></td>' : ''; };
        return '<tr class="bad"><th class="l">' + esc(en ? 'Difference' : L('k_tb')) + '</th>' + gap(at) + '<th class="n" colspan="2">' + money(Tt[d[0]]) + '</th>' + gap(V.det ? 4 - at : 0) + '</tr>';
      }).join('') +
      memo + '</tfoot></table>';
  }
  /* English rows of the trial balance for Excel, in the chosen style */
  function tbXl(V) {
    var h = V.det ? ['Head', 'Account', 'Opening debit', 'Opening credit', 'Transactions debit', 'Transactions credit', 'Closing debit', 'Closing credit'] : ['Head', 'Account', 'Debit', 'Credit'];
    var v = function (x) { return x || ''; }, out = [h].concat(V.rows.map(function (x) {
      return [V.grp ? '' : gName(hg(x), true), x.en].concat(V.det ? [v(x.od), v(x.oc), v(x.td), v(x.tc)] : [], [v(x.dr), v(x.cr)]);
    }));
    out.push(['Total', ''].concat(V.det ? [V.T.od, V.T.oc, V.T.td, V.T.tc] : [], [V.T.dr, V.T.cr]), []);
    out.push(V.sk ? ['Closing stock (memo only, not added to the totals)', valEn()].concat(V.det ? ['', '', '', ''] : [], [V.cs, '']) : ['Ledger balances only: opening stock and stock brought in are left out (their value is in profit or loss of earlier periods).']);
    return out;
  }
  /* ---------- previous year column: the same dates one year earlier ---------- */
  /* the figures of another period: calc() reads the period from A.range(), so lend it the other dates for one call */
  function calcAt(r) { var own = A.range; A.range = function () { return r; }; try { return calc(); } finally { A.range = own; } }
  function prevC(C) {
    var r = P.prevYear(C.r[0], C.r[1], view === 'bs'), pl = view === 'pl', has = A.mine().some(function (d) { return d.date && d.date <= r[1] && (!pl || d.date >= r[0]) && (B.role(d) || d.type === 'stk'); });
    return { r: r, has: has, bs: view === 'bs', C: has ? calcAt(r) : null };
  }
  function lkey(x) { return x.c + '|' + (/^(Profit|Loss) for the period$/.test(x.en) ? 'PL' : x.en); }
  /* current lines with the previous year's figure (pv) beside each; lines only last year had are put in at their place */
  function withPrev(cur, prev) {
    var out = cur.map(function (x) { return Object.assign({}, x, { pv: x.c === 'sec' ? null : 0 }); }), last = null, used = [];
    if (!prev) return out.map(function (x) { x.pv = null; x.nopy = 1; return x; });
    prev.forEach(function (p) {
      var k = lkey(p), at = -1;
      for (var j = 0; j < out.length; j++) if (!used[j] && !out[j].py && lkey(out[j]) === k) { at = j; break; }
      if (at < 0) {
        var o = { loc: p.loc, en: p.en, v: null, nil: 1, c: p.c, pv: p.v, py: 1 }, i = last ? out.indexOf(last) + 1 : 0;
        out.splice(i, 0, o); used.splice(i, 0, 1); last = o; return;
      }
      used[at] = 1; last = out[at];
      out[at].pv = p.v == null ? null : /big/.test(p.c) && p.en !== out[at].en ? -p.v : p.v;
    });
    return out;
  }
  function stTablePY(lines, en, pr) {
    var dash = '—', w = function (v, nil) { return nil ? dash : v == null ? '' : money(v, false); };
    return '<table class="tbl fr-st fr-py"><thead><tr><th class="l">' + esc(en ? 'Particulars' : NS.t('sb.part')) + '</th><th class="n">' + esc(en ? 'Current year (Rs)' : S('cy')) + '</th><th class="n">' + esc(en ? 'Previous year (Rs)' : S('py')) + '</th></tr></thead><tbody>' +
      lines.map(function (x) {
        if (x.c === 'sec') return '<tr class="sec"><th colspan="3" class="l">' + esc(en ? x.en : x.loc) + '</th></tr>';
        return '<tr class="' + x.c + '"><th scope="row" class="l' + (x.c === 'sub' ? ' sub' : '') + '">' + esc(en ? x.en : x.loc) + '</th><td class="n">' + w(x.v, x.nil) + '</td><td class="n">' + (x.nopy ? dash : w(x.pv, x.pv === 0 && x.c === 'sub' && !x.py)) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="soft">' + esc(pr.bs ? (en ? (pr.has ? 'Previous year: as at ' + A.ldate(pr.r[1]) + ', the last year end.' : 'Previous year (as at ' + A.ldate(pr.r[1]) + '): no records, shown as —.')
          : NS.t(pr.has ? 'fx.pybs' : 'fx.pybsnone', { b: iso(A.ldate(pr.r[1])) }))
        : en ? (pr.has ? 'Previous year: ' + A.ldate(pr.r[0]) + ' to ' + A.ldate(pr.r[1]) + ', the same dates one year earlier.' : 'Previous year (' + A.ldate(pr.r[0]) + ' to ' + A.ldate(pr.r[1]) + '): no records, shown as —.')
        : S(pr.has ? 'pyh' : 'pynone', { a: iso(A.ldate(pr.r[0])), b: iso(A.ldate(pr.r[1])) })) + '</p>';
  }
  function stLinesPY(C, pr) { return withPrev(view === 'pl' ? plLines(C) : bsLines(C), pr.C ? (view === 'pl' ? plLines(pr.C) : bsLines(pr.C)) : null); }

  /* ---------- statements as lists of lines: { loc, en, v, c (class) } ---------- */
  function ln(loc, en, v, c) { return { loc: loc, en: en, v: v, c: c || '' }; }
  function head(g, v, C, always) {
    var R = C.rows.filter(function (x) { return x.g === g; }), out = [ln(L('g_' + g), EN_H[g], v, 'b')];
    if (R.length > 1 || always && R.length) R.forEach(function (x) { out.push(ln(x.loc, x.en, amt(x), 'sub')); });
    return out;
  }
  function plLines(C) {
    var p = C.F.pl, o = [];
    o = o.concat(head('rev', p.rev, C), p.oinc ? head('oinc', p.oinc, C) : []);
    o.push(ln(L('income'), 'Total income', p.income, 'tot'), ln(L('expenses'), 'Expenses', null, 'sec'));
    if (p.mat) o = o.concat(head('mat', p.mat, C));
    o = o.concat(head('pur', p.pur, C));
    o.push(ln(L('chg'), 'Changes in inventories (opening stock less closing stock)', p.chg, 'b'), ln(L('l_osk'), 'Opening stock', C.os, 'sub'), ln(L('lesscs'), 'Less: closing stock', C.cs, 'sub'));
    ['emp', 'fin', 'dep', 'oth'].forEach(function (g) { if (p[g] || g === 'oth') o = o.concat(head(g, p[g], C, g === 'oth' || g === 'emp')); });
    o.push(ln(L('totexp'), 'Total expenses', p.exp, 'tot'), ln(L('pbt'), 'Profit before tax', p.pbt, 'tot'));
    if (p.tax) o = o.concat(head('tax', p.tax, C));
    o.push(ln(L(p.profit < 0 ? 'loss' : 'profit'), p.profit < 0 ? 'Loss for the period' : 'Profit for the period', Math.abs(p.profit), 'tot big'));
    return A.finHook ? A.finHook('pl', o, C) : o;   /* famore.js: words of a trust / society */
  }
  function subs(C, g, neg) {
    return P.gstNet(C.rows).filter(function (x) { return x.g === g; }).map(function (x) { return x.k === 'gst' ? ln(L(x.dr ? 'l_gstin' : 'l_gstout'), x.name, neg ? -amt(x) : amt(x), 'sub') : ln(x.loc, x.en, neg ? -amt(x) : amt(x), 'sub'); });
  }
  function bsLines(C) {
    var S = C.F.bs, p = C.F.pl, o = [ln(L('el'), 'Equity and liabilities', null, 'sec')];
    o.push(ln(L('own'), 'Owner\'s funds', S.own, 'b'));
    o = o.concat(subs(C, 'cap'));
    if (S.drw) o = o.concat(C.rows.filter(function (x) { return x.g === 'drw'; }).map(function (x) { return ln(L('lessdrw') + (x.k.indexOf('drw:') === 0 && key(x.loc) !== 'drawings' ? ' (' + x.loc + ')' : ''), 'Less: drawings' + (x.k.indexOf('drw:') === 0 && key(x.en) !== 'drawings' ? ' (' + x.en + ')' : ''), -amt(x), 'sub'); }));
    o = o.concat(subs(C, 'res'));
    o.push(ln(L(p.profit < 0 ? 'loss' : 'profit'), p.profit < 0 ? 'Loss for the period' : 'Profit for the period', p.profit, 'sub'));
    if (S.ncl) o = o.concat([ln(L('ncl'), 'Non-current liabilities', S.ncl, 'b')], subs(C, 'ltb'));
    o.push(ln(L('cl'), 'Current liabilities', S.cl, 'b'));
    if (S.stb) o = o.concat(subs(C, 'stb'));
    o.push(ln(L('g_tpay'), 'Trade payables', S.tpay, 'sub'));
    o = o.concat(subs(C, 'ocl'));
    o.push(ln(L('total'), 'Total', S.el, 'tot'), ln(L('assets'), 'Assets', null, 'sec'));
    if (S.nca) o = o.concat([ln(L('nca'), 'Non-current assets', S.nca, 'b')], subs(C, 'ppe'), subs(C, 'ninv'));
    o.push(ln(L('ca'), 'Current assets', S.ca, 'b'), ln(L('inv'), 'Inventories (closing stock at ' + valEn() + ')', S.inv, 'sub'), ln(L('g_trec'), 'Trade receivables', S.trec, 'sub'));
    var pdr = C.rows.filter(function (x) { return x.k === 'pdd'; })[0];   /* WP-3: trade receivables shown less the provision for doubtful debts */
    if (pdr && amt(pdr)) o.push(ln(NS.t('wo.l_gross'), 'Trade receivables before provision', r2(S.trec - amt(pdr)), 'sub'), ln(NS.t('wo.l_pdd'), 'Less: provision for doubtful debts', amt(pdr), 'sub'));
    o = o.concat(subs(C, 'cash'), subs(C, 'oca'));
    o.push(ln(L('total'), 'Total', S.assets, 'tot'));
    if (Math.abs(S.diff) >= 0.005) o.push(ln(L('bsdiff'), 'Difference', S.diff, 'bad'));
    return A.finHook ? A.finHook('bs', o, C) : o;   /* famore.js: partners' capital accounts, capital fund */
  }

  /* ---------- screens ---------- */
  function presets(today) {
    var fs = A.fyStart(today), fy = +fs.slice(0, 4);
    return { fy: [fs, today], lfy: [(fy - 1) + '-04-01', fy + '-03-31'], month: [today.slice(0, 8) + '01', today] };
  }
  function period() {
    var r = A.range(), Pr = presets(NS.today()), on = Object.keys(Pr).filter(function (k) { return Pr[k][0] === r[0] && Pr[k][1] === r[1]; })[0] || 'custom';
    return '<div class="tools-row lg-period"><label><span>' + esc(A.T('lg_period')) + '</span> <select data-frpre>' + Object.keys(Pr).concat(['custom']).map(function (k) {
      return '<option value="' + k + '"' + (k === on ? ' selected' : '') + '>' + esc(A.T('lg_p_' + k)) + '</option>'; }).join('') + '</select></label>' +
      '<label>' + esc(A.T('from')) + ' <input type="date" data-stfrom value="' + r[0] + '"></label><label>' + esc(A.T('to')) + ' <input type="date" data-stto value="' + r[1] + '"></label></div>';
  }
  function tabs() {
    return '<div class="seg" role="group">' + ['tb', 'pl', 'bs'].map(function (v) { return '<a class="btn sm" href="#fin/' + v + '" aria-pressed="' + (v === view) + '"' + (v === view ? ' aria-current="page"' : '') + '>' + esc(tl(v)) + '</a>'; }).join('') + '</div>';
  }
  /* a date inside right-to-left text keeps its own order (Unicode isolate) */
  function iso(t) { return '⁦' + t + '⁩'; }
  function mv(v) { return v == null ? '' : money(v, false); }
  function stTable(lines, en) {
    return '<table class="tbl fr-st"><thead><tr><th class="l">' + esc(en ? 'Particulars' : NS.t('sb.part')) + '</th><th class="n">' + esc(en ? 'Amount (Rs)' : L('amt')) + '</th></tr></thead><tbody>' +
      lines.map(function (x) {
        if (x.c === 'sec') return '<tr class="sec"><th colspan="2" class="l">' + esc(en ? x.en : x.loc) + '</th></tr>';
        return '<tr class="' + x.c + '"><th scope="row" class="l' + (x.c === 'sub' ? ' sub' : '') + '">' + esc(en ? x.en : x.loc) + '</th><td class="n">' + mv(x.v) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function tbTable(rows, Tt, en) {
    var g0 = '', body = rows.map(function (x) {
      var h = hg(x) !== g0 ? '<tr class="sec"><th colspan="3" class="l">' + esc(gName(hg(x), en)) + '</th></tr>' : ''; g0 = hg(x);
      return h + '<tr><th scope="row" class="l sub">' + esc(en ? x.en : x.loc) + '</th><td class="n">' + (x.dr ? money(x.dr, false) : '') + '</td><td class="n">' + (x.cr ? money(x.cr, false) : '') + '</td></tr>';
    }).join('');
    return '<table class="tbl fr-tb"><thead><tr><th class="l">' + esc(en ? 'Account' : L('acct')) + '</th><th class="n">' + esc(en ? 'Debit (Rs)' : L('dr')) + '</th><th class="n">' + esc(en ? 'Credit (Rs)' : L('cr')) + '</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="3" class="soft">' + esc(en ? 'No entries in this period.' : T('none')) + '</td></tr>') + '</tbody><tfoot><tr><th class="l">' + esc(en ? 'Total' : L('total')) + '</th><th class="n">' + money(Tt.dr, false) + '</th><th class="n">' + money(Tt.cr, false) + '</th></tr>' +
      (Math.abs(Tt.diff) >= 0.005 ? '<tr class="bad"><th class="l">' + esc(en ? 'Difference' : L('k_tb')) + '</th><th class="n" colspan="2">' + money(Tt.diff) + '</th></tr>' : '') + '</tfoot></table>';
  }
  function bizHead(title, sub) {
    var Z = A.biz() || {};
    return '<div class="st-hd"><div><b>' + esc(A.bizName()) + '</b>' + (Z.gstin ? '<br>GSTIN ' + esc(Z.gstin) : '') + '</div><div class="r"><b>' + esc(title) + '</b><br>' + esc(sub) + '</div></div>';
  }
  function sheet(C, rows) {
    var TS = A.finT && A.finT(view, C, 'sheet'); if (TS) return TS;   /* T format (tformat.js) */
    var r = C.r, title = { tb: 'TRIAL BALANCE', pl: 'STATEMENT OF PROFIT AND LOSS', bs: 'BALANCE SHEET' }[view];
    if (A.finHook) title = A.finHook('title', title, view);
    var sub = view === 'bs' ? 'As at ' + A.ldate(r[1]) : view === 'tb' ? 'As at ' + A.ldate(r[1]) + ' (period ' + A.ldate(r[0]) + ' to ' + A.ldate(r[1]) + ')' : 'For ' + A.ldate(r[0]) + ' to ' + A.ldate(r[1]);
    var V = view === 'tb' && tbView(C), pr = view !== 'tb' && prevC(C);
    if (V && V.det) title = 'TRIAL BALANCE (DETAILED)';
    var body = view === 'tb' ? tbGrid(V, true) + '<p>' + (V.sk ? 'Closing stock Rs ' + money(C.cs, false) + ' (' + valEn() + ') is not part of the trial balance: it is shown under inventories.' : 'Ledger balances only: opening stock and stock brought in are left out; their value is in profit or loss of earlier periods.') + (V.grp ? ' One line per group of accounts.' : '') + '</p>'
      : stTablePY(stLinesPY(C, pr), true, pr) + (view === 'pl' ? '<p>Gross profit (sales less the cost of goods sold): Rs ' + money(grossOf(C), false) + '. Closing stock valued at ' + valEn() + '.</p>' : '');
    return '<div class="stsheet sh" dir="ltr" lang="en-IN" data-sheet>' + bizHead(title, sub) + body +
      '<p class="st-ft">Made with the Nivesh Sahayak App on ' + A.ldate(NS.today()) + ' from the saved records. Format based on Schedule III, Companies Act 2013.</p></div>';
  }

  A.addSection('fin', function (arg) {
    view = ['tb', 'pl', 'bs'].indexOf(arg) >= 0 ? arg : view;
    var C = calc(), F = C.F, rows = tbRows(C), Tt = P.totals(rows), ok = Math.abs(Tt.diff) < 0.005, bsOk = Math.abs(F.bs.diff) < 0.005;
    var V = view === 'tb' && tbView(C), pr = view !== 'tb' && prevC(C), pyT = pr && stTablePY(stLinesPY(C, pr), false, pr).split('</table>');
    var tiles = view === 'tb' ? [['k_dr', money(V.T.dr)], ['k_cr', money(V.T.cr)]] : view === 'pl' ? [['k_rev', money(F.pl.rev), 1], ['k_gross', money(grossOf(C)), 1], [F.pl.profit < 0 ? 'k_loss' : 'k_profit', money(Math.abs(F.pl.profit)), 1]]
      : [['k_assets', money(F.bs.assets)], ['k_own', money(F.bs.own)], ['k_borrow', money(r2(F.bs.ltb + F.bs.stb))]];
    var body = view === 'tb' ? tbControls() + '<div class="tbl-wrap">' + tbGrid(V) + '</div><p class="soft">' + esc(T('tbh') + (V.det ? ' ' + S('deth') : '')) + '</p><p class="soft">' + esc(V.sk ? L('csnote', { x: money(C.cs) }) : S('nostock')) + '</p>'
      : '<h3>' + esc(view === 'pl' ? L('plfor', { a: iso(A.ldate(C.r[0])), b: iso(A.ldate(C.r[1])) }) : L('bsat', { d: iso(A.ldate(C.r[1])) })) + '</h3><div class="tbl-wrap">' + pyT[0] + '</table></div>' + pyT[1] +
        (view === 'pl' ? '<p class="soft">' + esc(L('grossh', { g: money(grossOf(C)) })) + '</p>' : '<p class="soft">' + esc(T('bsh')) + '</p>');
    var TX = A.finT && A.finT(view, C); if (TX) { body = TX.body; if (TX.tiles) tiles = TX.tiles; }   /* T format (tformat.js) */
    var warn = '';
    if (!ok) warn += '<p class="note bad">' + esc(L('w_diff', { x: money(Math.abs(Tt.diff)), s: L(Tt.diff > 0 ? 'dr' : 'cr') })) + '</p>';
    else if (view === 'bs' && !bsOk) warn += '<p class="note bad">' + esc(T('bsdiff', { x: money(Math.abs(F.bs.diff)) })) + '</p>';
    C.rows.forEach(function (x) { if ((x.k === 'cash' || x.k === 'bank') && x.cr) warn += '<p class="note">' + esc(T('neg', { a: x.loc })) + '</p>'; });
    return '<div class="pane-hd"><h2>' + esc(tl(view)) + '</h2><div class="quick no-print"><button type="button" class="btn" data-print>' + esc(A.T('print')) + '</button><button type="button" class="btn" data-frpdf>' + esc(A.T('pdf')) + '</button><button type="button" class="btn" data-frxl>' + esc(A.T('lg_xl')) + '</button></div></div>' +
      '<p class="soft">' + esc(T('finh')) + '</p>' + tabs() + period() + (A.finHook ? A.finHook('links', view, C) : '') +
      '<div class="tiles">' + tiles.map(function (x) { return '<div class="tile' + (x[0] === 'k_loss' ? ' neg' : '') + '"><span>' + esc(x[2] ? L(x[0]) : T(x[0])) + '</span><b>' + x[1] + '</b></div>'; }).join('') +
        '<div class="tile' + (ok && (view !== 'bs' || bsOk) ? ' ok' : ' warn') + '"><span>' + esc(view === 'bs' ? T('k_bsok') : L('k_tb')) + '</span><b>' + esc(ok && (view !== 'bs' || bsOk) ? L('agrees') : money(view === 'bs' && ok ? F.bs.diff : Tt.diff)) + '</b></div></div>' +
      warn + body +
      '<p class="soft">' + esc(T('valon', { m: T(fifo() ? 'val_fifo' : 'val_avg') })) + ' <a href="' + esc(A.myUrl('#settings')) + '">' + esc(T('valchg')) + ' ›</a></p>' +
      '<p class="soft">' + esc(T('capnote')) + ' <a href="#capl">' + esc(NS.t('app.capl')) + ' ›</a></p>' +
      '<div class="fr-print">' + sheet(C, rows) + '</div>';
  }, function (pane) {
    var s = $('[data-frpre]', pane);
    if (s) s.addEventListener('change', function () { var p = presets(NS.today())[s.value]; if (p) { A.range(p[0], p[1]); A.show(); } });
    $$('[data-tbs]', pane).forEach(function (e) { e.addEventListener('change', function () {
      var f = e.getAttribute('data-tbs'); tbp[f] = f === 'sk' ? e.checked : e.value; each = tbp.lv === 'ledger';
      try { localStorage.setItem(TBK, JSON.stringify(tbp)); } catch (x) {}
      A.show();
    }); });
    var pb = $('[data-frpdf]', pane); if (pb) pb.addEventListener('click', function () {
      var n = $('.fr-print > .stsheet', pane).cloneNode(true); n.classList.add('lg-paper');
      NS.sharePdf([n], fileName(A.bizName()) + '-' + { tb: 'trial-balance', pl: 'profit-and-loss', bs: 'balance-sheet' }[view] + '-' + A.range()[1], 'a4', tl(view), '');
    });
    var xb = $('[data-frxl]', pane); if (xb) xb.addEventListener('click', excel);
    if (A.finWire) A.finWire(pane, view);   /* format switch (tformat.js) */
  });
  function fileName(s) { return String(s).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'business'; }
  /* one Excel file: trial balance, profit and loss, balance sheet (English) */
  function excel() {
    var C = calc(), rows = tbRows(C), Tt = P.totals(rows), r = C.r;
    var tb = tbXl(tbView(C)), v0 = view, pr = {};
    if (A.finXl && A.finXl(C, tb, fileName(A.bizName()) + '-final-accounts-' + r[0] + '-to-' + r[1] + '.xlsx')) return;   /* T format (tformat.js) */
    function st(lines) { return [['Particulars', 'Current year', 'Previous year']].concat(lines.map(function (x) { return [(x.c === 'sub' ? '    ' : '') + x.en, x.nil ? '' : x.v == null ? '' : x.v, x.nopy || x.pv == null ? '' : x.pv]; })); }
    ['pl', 'bs'].forEach(function (w) { view = w; pr[w] = prevC(C); pr[w].lines = stLinesPY(C, pr[w]); }); view = v0;
    function py(w) { var p = pr[w], d = w === 'bs' ? 'as at ' + p.r[1] : p.r[0] + ' to ' + p.r[1]; return [[], [p.has ? 'Previous year: ' + d + (w === 'bs' ? ' (the last year end)' : ' (the same dates one year earlier)') : 'Previous year ' + d + ': no records']]; }
    NS.xlsx(fileName(A.bizName()) + '-final-accounts-' + r[0] + '-to-' + r[1] + '.xlsx', [{ name: 'Trial balance', rows: tb }, { name: 'Profit and loss', rows: st(pr.pl.lines).concat(py('pl')) }, { name: 'Balance sheet', rows: st(pr.bs.lines).concat(py('bs')) }]);
  }

  /* ---------- capital and loans ---------- */
  /* partners saved on the business (My data › business › partners), for capital brought in and drawings */
  function partnerNames(kind) { return kind === 'capin' || kind === 'drw' ? ((A.biz() || {}).partners || []).map(function (p) { return String(p && p.name || '').trim(); }).filter(Boolean) : []; }
  var KINDS = ['capin', 'drw', 'loanin', 'loanout', 'givenout', 'givenin'];
  var TYPES = { cap: 1, drw: 1, loan: 1, od: 1, given: 1 };
  /* capital, drawings and loan accounts with their names and balances on a date */
  function clAccounts(to) {
    var acc = B.accounts(A.data().doc, A.bizName(), to), N = typedNames(), out = [];
    Object.keys(acc).forEach(function (a) {
      var t = a.split(':')[0]; if (a.indexOf(':') < 0 || !TYPES[t]) return;
      out.push({ a: a, t: t, name: N[a] || a.slice(t.length + 1).replace(/^./, function (c) { return c.toUpperCase(); }), bal: acc[a] });
    });
    return out;
  }
  function nextNo(date) {
    var fy = NS.fy(date), max = 0;
    A.mine().forEach(function (d) { if (d.type !== 'jv' || NS.fy(d.date) !== fy || d.cf) return; var x = String(d.no || '').match(/(\d+)\s*$/); if (x) max = Math.max(max, +x[1]); });
    return 'JV/' + fy.slice(2, 4) + '-' + fy.slice(5) + '/' + String(max + 1).padStart(3, '0');
  }
  A.addSection('capl', function () {
    var r = A.range(), before = r[0] ? P.prevDay(r[0]) : '', open = {}, rows = clAccounts(r[1]);
    clAccounts(before).forEach(function (x) { open[x.a] = x.bal; });
    var cr = function (t) { return t === 'cap' || t === 'loan' || t === 'od'; };
    var list = A.mine().filter(function (d) { return d.type === 'jv' && d.cl && d.date >= r[0] && d.date <= r[1]; }).sort(A.byDate);
    var tbl = rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(T('acc')) + '</th><th>' + esc(T('type')) + '</th><th class="n">' + esc(T('open')) + '</th><th class="n">' + esc(T('inc')) + '</th><th class="n">' + esc(T('dec')) + '</th><th class="n">' + esc(T('close')) + '</th></tr></thead><tbody>' +
      rows.map(function (x) {
        var s = cr(x.t) ? -1 : 1, o = r2(s * (open[x.a] || 0)), c = r2(s * x.bal), Bk = B.book(A.data().doc, A.bizName(), x.a, r[0], r[1]);
        var up = r2(Bk.rows.reduce(function (v, y) { return v + (s < 0 ? y.cr : y.dr); }, 0)), down = r2(Bk.rows.reduce(function (v, y) { return v + (s < 0 ? y.dr : y.cr); }, 0));
        if (x.t === 'drw') { var sw = up; up = down; down = sw; }   /* drawings reduce the owner's funds (user test 2026-11-06) */
        return '<tr><th scope="row">' + esc(x.name) + '</th><td>' + esc(T('ty_' + x.t)) + '</td><td class="n">' + money(o, false) + '</td><td class="n">' + (up ? money(up, false) : '') + '</td><td class="n">' + (down ? money(down, false) : '') + '</td><td class="n"><b>' + money(c, false) + '</b></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="soft">' + esc(T('noacc')) + '</p>';
    return '<div class="pane-hd"><h2>' + esc(NS.t('app.capl')) + '</h2></div><p class="soft">' + esc(T('clh')) + '</p>' +
      '<div class="quick fr-kinds">' + KINDS.map(function (k, i) { return '<button type="button" class="btn' + (i ? '' : ' primary') + '" data-frcl="' + k + '">+ ' + esc(kName(k)) + '</button>'; }).join('') + '</div>' +
      period() + tbl +
      '<h3>' + esc(T('entries')) + '</h3>' + (list.length ? '<ul class="rows">' + list.map(function (d) {
        return '<li><div class="ln"><b>' + esc(kName(d.cl)) + (d.nm ? ': ' + esc(d.nm) : '') + '</b> <span class="soft">' + A.ldate(d.date) + ' · ' + esc(d.no || '') + (d.narr ? ' · ' + esc(d.narr) : '') + '</span></div>' +
          '<b class="amt">' + money(num(d.total)) + '</b><div class="acts"><button type="button" class="btn sm" data-edit="' + esc(d.id) + '">' + esc(A.T('edit')) + '</button><button type="button" class="btn sm" data-del="' + esc(d.id) + '">' + esc(A.T('del')) + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="soft">' + esc(T('none')) + '</p>') +
      '<details class="card"><summary><b>' + esc(A.T('help')) + '</b></summary><p>' + esc(T('help1')) + '</p><p>' + esc(T('help2')) + '</p><p>' + esc(T('help3')) + '</p></details>';
  }, function (pane) {
    var s = $('[data-frpre]', pane);
    if (s) s.addEventListener('change', function () { var p = presets(NS.today())[s.value]; if (p) { A.range(p[0], p[1]); A.show(); } });
    $$('[data-frcl]', pane).forEach(function (b) { b.addEventListener('click', function () { clForm(b.getAttribute('data-frcl')); }); });
  });

  /* the form: one dialog for the six kinds */
  var dlg, form;
  function clForm(kind, rec) {
    if (!dlg) {
      dlg = NS.el('dialog', { 'class': 'hub-dlg b2-dlg', 'aria-labelledby': 'fr-dlg-t' });
      dlg.innerHTML = '<div class="dlg-hd"><h2 id="fr-dlg-t"></h2><button type="button" class="icon-btn" data-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><form novalidate></form>';
      document.body.appendChild(dlg); form = $('form', dlg);
      $('[data-x]', dlg).addEventListener('click', function () { dlg.close(); });
    }
    var r = rec || { date: NS.today(), mode: 'bank' }, nm = r.nm || '', pick = kind === 'loanout' || kind === 'givenin';
    var acc = clAccounts('').filter(function (x) { return kind === 'loanout' ? (x.t === 'loan' || x.t === 'od') && (x.bal < 0 || rec && x.a === r.lk) : kind === 'givenin' ? x.t === 'given' && (x.bal > 0 || rec && x.a === r.lk) : x.t === { capin: 'cap', drw: 'drw', loanin: 'loan', givenout: 'given' }[kind] || kind === 'loanin' && x.t === 'od'; });
    function f(id, label, html, hint) { return '<div class="f"><label for="' + id + '">' + esc(label) + '</label>' + html + (hint ? '<small class="hint">' + esc(hint) + '</small>' : '') + '</div>'; }
    function inp(id, v, o) { o = o || {}; return '<input id="' + id + '" value="' + esc(v == null ? '' : v) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.mode ? ' inputmode="decimal" dir="ltr"' : ' dir="auto"') + (o.list ? ' list="' + o.list + '"' : '') + ' autocomplete="off">'; }
    var nameF = pick ? (acc.length ? f('fr-acc', T(kind === 'loanout' ? 'f_loan' : 'f_borrower'), '<select id="fr-acc">' + acc.map(function (x) { return '<option value="' + esc(x.a) + '"' + (x.a === r.lk ? ' selected' : '') + '>' + esc(x.name) + ' (' + money(Math.abs(x.bal)) + ')</option>'; }).join('') + '</select>') : '<p class="note bad">' + esc(T('noloan')) + '</p>')
      : f('fr-nm', T(kind === 'capin' || kind === 'drw' ? 'f_owner' : kind === 'loanin' ? 'f_lender' : 'f_borrower'), inp('fr-nm', nm, { list: 'fr-names' }), kind === 'capin' || kind === 'drw' ? T('f_ownerh') : '') +
        '<datalist id="fr-names">' + partnerNames(kind).concat(acc.map(function (x) { return x.name; })).filter(function (n, i, a) { return a.map(key).indexOf(key(n)) === i; }).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>';
    var html = '<div class="fg">' + f('fr-date', A.T('date'), inp('fr-date', r.date, { type: 'date' })) + nameF +
      (kind === 'loanin' ? f('fr-term', T('f_term'), '<select id="fr-term"><option value="loan"' + (r.lt !== 'od' ? ' selected' : '') + '>' + esc(T('term_l')) + '</option><option value="od"' + (r.lt === 'od' ? ' selected' : '') + '>' + esc(T('term_s')) + '</option></select>') : '') +
      f('fr-amt', T(kind === 'loanout' ? 'f_prin' : kind === 'givenin' ? 'f_prinr' : 'f_amt'), inp('fr-amt', r.amt || '', { mode: 1 })) +
      (pick ? f('fr-int', T('f_int'), inp('fr-int', r.int || '', { mode: 1 }), T(kind === 'loanout' ? 'f_inth' : 'f_inth2')) : '') +
      f('fr-mode', T(kind === 'capin' || kind === 'loanin' || kind === 'givenin' ? 'f_modein' : 'f_modeout'), '<select id="fr-mode">' + ['cash', 'bank', 'upi', 'cheque'].map(function (m) { return '<option value="' + m + '"' + (m === r.mode ? ' selected' : '') + '>' + esc(A.T('m_' + m)) + '</option>'; }).join('') + '</select>') +
      '<div class="f wide"><label for="fr-narr">' + esc(T('f_narr')) + '</label>' + inp('fr-narr', r.narr || '') + '</div></div><p class="note" data-frwarn hidden aria-live="polite"></p>';
    $('#fr-dlg-t', dlg).textContent = kName(kind);
    form.innerHTML = html + '<div class="dlg-foot btns"><button type="submit" class="btn primary">' + esc(A.T('save')) + '</button><button type="button" class="btn" data-cancel>' + esc(A.T('cancel')) + '</button></div>';
    $('[data-cancel]', form).addEventListener('click', function () { dlg.close(); });
    function val(id) { var e = $('#' + id, form); return e ? e.value.trim() : ''; }
    function warn() {   /* loans of Rs 20,000 or more are taken and repaid by bank, never in cash */
      var w = $('[data-frwarn]', form), on = (kind === 'loanin' || kind === 'loanout') && val('fr-mode') === 'cash' && r2(num(val('fr-amt')) + num(val('fr-int'))) >= 20000;
      w.hidden = !on; w.textContent = on ? T('cashwarn') : '';
    }
    form.oninput = warn; form.onchange = warn; warn();
    form.onsubmit = function (e) {
      e.preventDefault();
      var date = val('fr-date'), amt = r2(num(val('fr-amt'))), int = pick ? r2(num(val('fr-int'))) : 0, mode = val('fr-mode'), money2 = B.moneyAcct(mode), name = pick ? '' : val('fr-nm');
      if (!date) { NS.toast(A.T('need', { f: A.T('date') }), 'bad'); return; }
      var lock = A.closedMsg && (A.closedMsg(date) || rec && A.closedMsg(rec.date)); if (lock) { NS.toast(lock, 'bad'); return; }
      if (!(amt > 0) && !(int > 0)) { NS.toast(A.T('need', { f: T('f_amt') }), 'bad'); return; }
      if ((kind === 'loanin' || kind === 'givenout') && !name) { NS.toast(A.T('need', { f: T(kind === 'loanin' ? 'f_lender' : 'f_borrower') }), 'bad'); return; }
      var lk = pick ? val('fr-acc') : '';
      if (pick && !lk) { NS.toast(T('noloan'), 'bad'); return; }
      if (pick) { var x = acc.filter(function (y) { return y.a === lk; })[0]; name = x ? x.name : ''; }
      /* capital and drawings of a firm: the partner as saved on the business (a typo would make a partner the accounts miss) */
      var pn = partnerNames(kind), hitP = pn.filter(function (n) { return key(n) === key(name); })[0];
      if (hitP) name = hitP;
      else if (pn.length && name && !rec && form.dataset.ok !== '1') {
        var q = NS.t('fx.cl_notp', { n: name, p: pn.join(', ') });
        (NS.ask ? NS.ask(q) : Promise.resolve(window.confirm(q))).then(function (yes) { if (yes) { form.dataset.ok = '1'; form.onsubmit({ preventDefault: function () {} }); } });
        return;
      }
      delete form.dataset.ok;
      var lines = P.capLoanLines(kind, { name: name, amt: amt, int: int, mode: money2, lk: lk, lt: val('fr-term') });
      var seller = JSON.parse(JSON.stringify(A.biz() || {})); delete seller.id; delete seller.created; delete seller.updated;
      var d = Object.assign(rec ? JSON.parse(JSON.stringify(rec)) : { type: 'jv', app: 1, cl: kind }, { date: date, no: rec && rec.no || nextNo(date), narr: val('fr-narr'), nm: name, amt: amt, int: int, mode: mode, lk: lk, lt: kind === 'loanin' ? val('fr-term') : '', seller: seller, lines: lines });
      d.total = r2(lines.reduce(function (s, l) { return s + l.dr; }, 0));
      NSStore.put('doc', d).then(function () { dlg.close(); NS.toast(A.T('saved')); A.show(); });
    };
    dlg.showModal();
    var f1 = $('input:not([type=hidden]),select', form); if (f1) f1.focus();
  }
  /* edit buttons (journal list, recent lists, the screen above) open this form for its own entries */
  var prevEdit = A.editX;
  A.editX = function (d) { if (d && d.type === 'jv' && d.cl && KINDS.indexOf(d.cl) >= 0) { clForm(d.cl, d); return true; } return prevEdit ? prevEdit(d) : false; };

  /* for famore.js (manufacturing account, partnership firm, trust / society): the same figures and drawing helpers */
  A.fin = { calc: calc, plLines: plLines, bsLines: bsLines, stTable: stTable, bizHead: bizHead, period: period, presets: presets, iso: iso, fileName: fileName, valEn: valEn, mv: mv };

  /* ---------- menu: two links of the full App (door sites keep their own short menu) ---------- */
  function menu() {
    var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs') || $('[data-sec="fin"]', nav)) return;
    var at = $('[data-sec="b2jv"]', nav);
    ['fin', 'capl'].forEach(function (s) {
      var a = NS.el('a', { href: '#' + s, 'data-sec': s }, '<span>' + esc(NS.t('app.' + s)) + '</span>');
      if (at) nav.insertBefore(a, at); else nav.appendChild(a);
      a.addEventListener('click', function () { A.filt('all'); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', menu); else menu();
  /* app.js routes as soon as the data home answers, which can be before the files after it (more.js, this one) have added
     their sections: a link straight to #fin/bs then opened the dashboard. Route again once, if the screen asked for did not open. */
  if (window.NSStore && NSStore.ready) NSStore.ready().then(function () {
    setTimeout(function () {
      var sec = decodeURIComponent(location.hash.slice(1)).split('/')[0], nav = $('.hub-nav'), a = sec && nav && $('[data-sec="' + sec + '"]', nav);
      if (a && a.getAttribute('aria-current') !== 'page') window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 0);
  });
})();
