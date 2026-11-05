/* NSAcct (Batch 2): accounting depth underneath the Nivesh Sahayak App. Pure functions; the page passes in the saved
   records and gets reports back. Nothing here stores anything, and nothing here changes what NSBooks posts.
     depreciation   fixed assets register (records 'fa', see books.js): book depreciation by the Companies Act, 2013,
                    Schedule II (useful life, residual value up to 5% of cost, straight line SLM or written down value WDV,
                    pro rata by days in the year an asset is added or sold) and the Income-tax block of assets (WDV at the
                    block rate, half the rate for an asset put to use for less than 180 days in the year). Book depreciation
                    reaches the accounts only when the user posts it (a journal entry 'jv' with dep: '<FY>').
     year end       summary of a financial year, checks before closing, and the opening records of the next year for a
                    fresh data file (carry forward).
     profit         profit per bill, per item and per party (sale value without GST less cost at the running average
                    purchase cost on the bill date), and month-by-month trends.
     salesman       sales, returns, money collected and commission per salesman (d.sman on sales documents). */
(function (G) {
  'use strict';
  var B = G.NSBooks || (typeof NSBooks !== 'undefined' ? NSBooks : null), S = G.NSStock || (typeof NSStock !== 'undefined' ? NSStock : null),
    PL = G.NSPL || (typeof NSPL !== 'undefined' ? NSPL : null);
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function bizOk(d, biz) { return !biz || key(d.seller && d.seller.name) === key(biz); }
  function fyOf(iso) { var y = +String(iso).slice(0, 4), m = +String(iso).slice(5, 7); if (m < 4) y--; return y + '-' + String(y + 1).slice(2); }
  function fyStart(fy) { return fy.slice(0, 4) + '-04-01'; }
  function fyEnd(fy) { return (+fy.slice(0, 4) + 1) + '-03-31'; }
  function nextFy(fy) { var y = +fy.slice(0, 4) + 1; return y + '-' + String(y + 1).slice(2); }
  function days(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function yearDays(fy) { return days(fyStart(fy), fyEnd(fy)) + 1; }

  /* ---------- fixed assets ---------- */
  /* asset kinds: Schedule II useful life (years) and the usual Income-tax block rate (%). Both stay editable on every asset. */
  var KINDS = {
    bldg_off: [60, 10], bldg_fac: [30, 10], bldg_res: [60, 5], pm: [15, 15], furn: [10, 10], elec: [10, 10], office: [5, 15],
    comp: [3, 40], server: [6, 40], car: [8, 15], bike: [10, 15], truck: [8, 15], other: [10, 15]
  };
  /* the assets (fa buy records) with their sale (fa sale record linked by asset id) */
  function assets(docs, biz) {
    var A = [], sold = {};
    (docs || []).forEach(function (d) { if (d.type === 'fa' && d.kind === 'sale' && bizOk(d, biz)) sold[d.asset] = d; });
    (docs || []).forEach(function (d) {
      if (d.type !== 'fa' || d.kind === 'sale' || !bizOk(d, biz)) return;
      var k = KINDS[d.cat] || KINDS.other;
      A.push({ id: d.id, d: d, name: d.name || '', key: 'fa:' + key(d.name || 'Fixed asset'), cat: d.cat || 'other', date: d.date || '', cost: r2(num(d.amount) + (d.itc ? 0 : num(d.gstAmt))),
        method: d.method === 'slm' ? 'slm' : 'wdv', life: num(d.life) || k[0], resid: d.resid === '' || d.resid == null ? 5 : num(d.resid), itRate: d.itRate === '' || d.itRate == null ? k[1] : num(d.itRate), sale: sold[d.id] || null });
    });
    return A.sort(function (a, b) { return a.date.localeCompare(b.date) || a.name.localeCompare(b.name); });
  }
  /* WDV rate that brings cost down to the residual value at the end of the useful life */
  function wdvRate(life, resid) { var rv = Math.max(resid, 0.01) / 100; return life > 0 ? 1 - Math.pow(rv, 1 / life) : 0; }
  /* book depreciation (Companies Act Schedule II) of one asset, year by year up to fy: [{ fy, open, add, dep, sold, close }] */
  function bookSchedule(a, uptoFy) {
    var out = []; if (!a.date || !a.cost) return out;
    var fy = fyOf(a.date), resid = r2(a.cost * a.resid / 100), slm = a.life > 0 ? (a.cost - resid) / a.life : 0, rate = wdvRate(a.life, a.resid), wdv = 0;
    for (var n = 0; n < 120 && fy <= uptoFy; n++, fy = nextFy(fy)) {
      var st = fyStart(fy), en = fyEnd(fy), open = wdv, add = 0, from = st, to = en, sold = false;
      if (a.date >= st && a.date <= en) { add = a.cost; from = a.date; }
      if (a.sale && a.sale.date < st) break;
      if (a.sale && a.sale.date <= en) { to = a.sale.date; sold = true; }
      var part = Math.max(0, days(from, to) + 1) / yearDays(fy), base = open + add, dep;
      dep = a.method === 'slm' ? slm * part : base * rate * part;
      dep = r2(Math.max(0, Math.min(dep, base - resid)));
      wdv = r2(base - dep);
      out.push({ fy: fy, open: r2(open), add: r2(add), dep: dep, sold: sold, close: sold ? 0 : wdv, bv: sold ? wdv : null });
      if (sold) break;
    }
    return out;
  }
  /* book value on a date before the sale (for the sale record): cost less depreciation of earlier years and this year to that day */
  function bookValueOn(a, iso) {
    var x = Object.assign({}, a, { sale: { date: iso } }), sc = bookSchedule(x, fyOf(iso)), last = sc[sc.length - 1];
    return last ? last.bv : a.cost;
  }
  /* depreciation already posted for an asset key: { fy: amount } from journal entries marked dep */
  function posted(docs, biz) {
    var o = {};
    (docs || []).forEach(function (d) {
      if (d.type !== 'jv' || !d.dep || !bizOk(d, biz)) return;
      (d.lines || []).forEach(function (l) { if (String(l.a || '').indexOf('fa:') === 0 && num(l.cr)) { var k = l.a + '|' + d.dep; o[k] = r2((o[k] || 0) + num(l.cr)); } });
    });
    return o;
  }
  /* the register for one financial year: rows per asset and totals; post = lines of the depreciation entry still to post */
  function register(docs, biz, fy) {
    var P = posted(docs, biz), rows = [], tot = { open: 0, add: 0, dep: 0, sold: 0, close: 0, todo: 0 };
    assets(docs, biz).forEach(function (a) {
      var sc = bookSchedule(a, fy), y = sc.filter(function (x) { return x.fy === fy; })[0];
      if (!y) return;
      var done = P[a.key + '|' + fy] || 0, todo = r2(y.dep - done);
      rows.push({ a: a, open: y.open, add: y.add, dep: y.dep, sold: y.sold ? y.bv : 0, close: y.close, done: done, todo: todo });
      tot.open += y.open; tot.add += y.add; tot.dep += y.dep; tot.sold += y.sold ? y.bv : 0; tot.close += y.close; tot.todo += todo;
    });
    Object.keys(tot).forEach(function (k) { tot[k] = r2(tot[k]); });
    var net = r2(rows.reduce(function (s, r) { return s + r.todo; }, 0));
    /* the entry: one debit to depreciation, one credit per asset */
    var lines = rows.filter(function (r) { return Math.abs(r.todo) > 0.004; }).map(function (r) { return { a: 'fa:' + key(r.a.name), dr: r.todo < 0 ? -r.todo : 0, cr: r.todo > 0 ? r.todo : 0 }; });
    if (lines.length) lines.unshift(net >= 0 ? { a: 'exp:depreciation', dr: net, cr: 0 } : { a: 'exp:depreciation', dr: 0, cr: -net });
    return { rows: rows, tot: tot, post: lines };
  }
  /* Income-tax depreciation by block (WDV at the block rate) for one financial year: [{ rate, open, addFull, addHalf, sales, dep, close, gain }] */
  function taxBlocks(docs, biz, fy) {
    var A = assets(docs, biz), first = A.reduce(function (m, a) { var f = fyOf(a.date); return !m || f < m ? f : m; }, ''), close = {}, out = [];
    if (!first) return out;
    for (var y = first, n = 0; y <= fy && n < 120; y = nextFy(y), n++) {
      var st = fyStart(y), en = fyEnd(y), by = {};
      A.forEach(function (a) {
        var r = a.itRate, b = by[r] = by[r] || { rate: r, open: close[r] || 0, addFull: 0, addHalf: 0, sales: 0 };
        if (a.date >= st && a.date <= en) { if (days(a.date, en) + 1 < 180) b.addHalf += a.cost; else b.addFull += a.cost; }
        if (a.sale && a.sale.date >= st && a.sale.date <= en) b.sales += num(a.sale.amount);
      });
      Object.keys(close).forEach(function (r) { if (!by[r]) by[r] = { rate: +r, open: close[r], addFull: 0, addHalf: 0, sales: 0 }; });
      var rows = Object.keys(by).map(function (r) {
        var b = by[r], base = b.open + b.addFull + b.addHalf - b.sales, half = Math.max(0, Math.min(b.addHalf, base)), full = Math.max(0, base - half);
        b.dep = base > 0 ? r2(full * b.rate / 100 + half * b.rate / 200) : 0;
        b.gain = base < 0 ? r2(-base) : 0;
        b.close = base > 0 ? r2(base - b.dep) : 0;
        ['open', 'addFull', 'addHalf', 'sales'].forEach(function (k) { b[k] = r2(b[k]); });
        close[r] = b.close;
        return b;
      });
      if (y === fy) out = rows.filter(function (b) { return b.open || b.addFull || b.addHalf || b.sales; }).sort(function (a, b) { return a.rate - b.rate; });
    }
    return out;
  }

  /* ---------- year end ---------- */
  /* everything the year-end screen shows: profit, balances on the last day, stock, checks */
  function yearSummary(docs, items, biz, fy) {
    var from = fyStart(fy), to = fyEnd(fy), mine = (docs || []).filter(function (d) { return bizOk(d, biz); });
    var tb = PL.fromBooks(docs, items, biz, from, to), st = PL.statements(tb.rows, tb.cs), A = B.accounts(docs, biz, to), P = {}, recv = 0, pay = 0;
    Object.keys(A).forEach(function (a) { if (a.indexOf('p:') === 0) { if (A[a] > 0) recv += A[a]; else pay -= A[a]; } });
    var stock = S.summary(docs, items, biz, '', to), reg = register(docs, biz, fy);
    var n = mine.filter(function (d) { return d.date >= from && d.date <= to; }).length;
    var checks = [];
    if (stock.neg) checks.push(['neg', stock.neg]);
    if (reg.post.length) checks.push(['dep', reg.tot.todo]);
    if (Math.abs(st.bs.diff) > 0.5) checks.push(['diff', st.bs.diff]);
    var draft = mine.filter(function (d) { return d.date >= from && d.date <= to && (d.type === 'quote' || d.type === 'proforma' || d.type === 'so') && d.status !== 'inv' && d.status !== 'dec'; }).length;
    if (draft) checks.push(['open', draft]);
    return { fy: fy, from: from, to: to, docs: n, pl: st.pl, bs: st.bs, cash: r2(A.cash || 0), bank: r2(A.bank || 0), recv: r2(recv), pay: r2(pay), stock: stock, checks: checks };
  }
  /* opening records of the next year, for a fresh data file: one opening balance per party, cash, bank, opening stock at
     average cost, and one journal entry for every other balance-sheet account (fixed assets, loans, GST, TDS, capital...).
     Profit and loss accounts are not carried: the year's profit stays inside 'opening' (the owner's capital). */
  function carryForward(docs, items, biz, fy, seller) {
    var to = fyEnd(fy), start = fyStart(nextFy(fy)), A = B.accounts(docs, biz, to), P = B.parties(docs, biz), out = [], n = 0, jl = [];
    function id() { n++; return 'cf' + fy.replace('-', '') + '-' + n; }
    var base = { app: 1, cf: fy, date: start, seller: seller };
    Object.keys(P).forEach(function (k) {
      var b = r2(P[k].bal); if (Math.abs(b) < 0.005) return;
      out.push(Object.assign({ id: id(), type: 'ob', no: '', buyer: { name: P[k].name }, side: b > 0 ? 'recv' : 'pay', amount: Math.abs(b), total: Math.abs(b) }, base));
    });
    ['cash', 'bank'].forEach(function (a) { var v = r2(A[a] || 0); if (v > 0.004) out.push(Object.assign({ id: id(), type: 'ob', no: '', buyer: { name: '' }, side: a, amount: v, total: v }, base)); else if (v < -0.004) jl.push({ a: a, dr: 0, cr: -v }); });
    var stock = S.summary(docs, items, biz, '', to).items.filter(function (s) { return s.close > 0; });
    if (stock.length) out.push(Object.assign({ id: id(), type: 'stk', kind: 'open', no: 'OPEN/' + nextFy(fy), note: 'Carried forward from ' + fy, lines: stock.map(function (s) { return { desc: s.name, unit: s.unit, qty: s.close, rate: s.cost }; }) }, base));
    var isPL = function (a) { return a === 'sales' || a === 'sales-return' || a === 'purchases' || a === 'purchase-return' || a === 'round-off' || /^(exp|inc):/.test(a); };
    Object.keys(A).forEach(function (a) {
      var v = r2(A[a]); if (Math.abs(v) < 0.005 || a.indexOf('p:') === 0 || a === 'cash' || a === 'bank' || a === 'opening' || isPL(a)) return;
      jl.push({ a: a, dr: v > 0 ? v : 0, cr: v < 0 ? -v : 0 });
    });
    if (jl.length) {
      var net = r2(jl.reduce(function (s, l) { return s + l.dr - l.cr; }, 0));
      if (net) jl.push({ a: 'opening', dr: net < 0 ? -net : 0, cr: net > 0 ? net : 0 });
      out.push(Object.assign({ id: id(), type: 'jv', no: 'JV/OPEN', narr: 'Opening balances carried forward from ' + fy, lines: jl }, base));
    }
    return out;
  }
  /* is a date inside a financial year closed for this business? closed = settings.closed { '<biz key>': ['2025-26', ...] } */
  function isClosed(closed, biz, iso) { var l = closed && closed[key(biz)]; return !!(l && iso && l.indexOf(fyOf(iso)) >= 0); }

  /* ---------- profit per bill, item and party ---------- */
  function masterCost(m) { return m ? num(m.cost || m.prate || m.purchase || m.buy) : 0; }
  /* sales and returns with their cost: [{ d, sign, lines: [{ k, name, qty, value, cost, known }] }] */
  function saleLines(docs, items, biz, from, to) {
    var M = {}; (items || []).forEach(function (m) { if (m && m.desc) M[key(m.desc)] = m; });
    /* running average purchase cost per item, in date order */
    var mv = S.moves(docs, items, biz), avg = {}, pos = 0, out = [];
    function costAt(k, date) {
      while (pos < mv.length && mv[pos].date <= date) { var x = mv[pos++]; if (x.rate != null && x.qty > 0) { var a = avg[x.k] = avg[x.k] || { q: 0, v: 0 }; a.q += x.qty; a.v += x.qty * x.rate; } }
      var a2 = avg[k]; return a2 && a2.q > 0 ? a2.v / a2.q : null;
    }
    B.inBooks(docs, biz).filter(function (d) { var R = B.role(d); return (R === 'sale' || R === 'sret') && (d.items || []).length; })
      .sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).forEach(function (d) {
        var R = B.role(d), ret = R === 'sret' && d.reason === 'ret', cut = R === 'sret' && !ret;
        var L = (d.items || []).map(function (it) {
          var nm = String(it.desc || '').trim(), k = key(nm), q = it.qty === '' || it.qty == null ? 1 : num(it.qty), rate = num(it.rate);
          if (!nm && !rate) return null;
          var value = r2(q * rate - q * rate * num(it.disc) / 100), m = M[k], c = costAt(k, d.date || '');
          var svc = m && m.kind === 'service' || /^99/.test(String(it.hsn || m && m.hsn || '').replace(/\D/g, ''));
          if (c == null) c = masterCost(m) || (svc ? 0 : null);
          return { k: k, name: m ? m.desc : nm, qty: cut ? 0 : q, value: value, cost: cut || c == null ? 0 : r2(q * c), known: cut || c != null };
        }).filter(Boolean);
        if (d.date >= (from || '') && (!to || d.date <= to)) out.push({ d: d, sign: R === 'sret' ? -1 : 1, lines: L });
      });
    return out;
  }
  function profit(docs, items, biz, from, to) {
    var bills = [], it = {}, pt = {}, tot = { value: 0, cost: 0, profit: 0, unknown: 0 };
    saleLines(docs, items, biz, from, to).forEach(function (s) {
      var v = 0, c = 0, unk = 0;
      s.lines.forEach(function (l) {
        v += l.value; c += l.cost; if (!l.known) unk++;
        var x = it[l.k] = it[l.k] || { k: l.k, name: l.name, qty: 0, value: 0, cost: 0, unknown: 0 };
        x.qty += s.sign * l.qty; x.value += s.sign * l.value; x.cost += s.sign * l.cost; if (!l.known) x.unknown++;
      });
      v = r2(s.sign * v); c = r2(s.sign * c);
      var pn = B.partyName(s.d) || '', pk = key(pn) || '-', p = pt[pk] = pt[pk] || { k: pk, name: pn, n: 0, value: 0, cost: 0 };
      p.n++; p.value += v; p.cost += c;
      bills.push({ d: s.d, value: v, cost: c, profit: r2(v - c), pct: v ? r2((v - c) * 100 / v) : 0, unknown: unk });
      tot.value += v; tot.cost += c; tot.unknown += unk;
    });
    function fin(o) { return Object.keys(o).map(function (k) { var x = o[k]; x.value = r2(x.value); x.cost = r2(x.cost); x.profit = r2(x.value - x.cost); x.pct = x.value ? r2(x.profit * 100 / x.value) : 0; if (x.qty != null) x.qty = Math.round(x.qty * 1000) / 1000; return x; }).sort(function (a, b) { return b.profit - a.profit; }); }
    tot.value = r2(tot.value); tot.cost = r2(tot.cost); tot.profit = r2(tot.value - tot.cost); tot.pct = tot.value ? r2(tot.profit * 100 / tot.value) : 0;
    return { bills: bills.sort(function (a, b) { return (b.d.date || '').localeCompare(a.d.date || ''); }), items: fin(it), parties: fin(pt), tot: tot };
  }
  /* sales value (without GST) month by month: by 'item' or 'party'; top n rows plus everything else */
  function months(from, to) { var o = [], y = +from.slice(0, 4), m = +from.slice(5, 7); while (true) { var s = y + '-' + String(m).padStart(2, '0'); if (s > to.slice(0, 7) || o.length > 60) break; o.push(s); m++; if (m > 12) { m = 1; y++; } } return o; }
  function trend(docs, items, biz, from, to, by, top) {
    var M = months(from, to), idx = {}, rows = {};
    M.forEach(function (m, i) { idx[m] = i; });
    saleLines(docs, items, biz, from, to).forEach(function (s) {
      var i = idx[(s.d.date || '').slice(0, 7)]; if (i == null) return;
      s.lines.forEach(function (l) {
        var k = by === 'party' ? key(B.partyName(s.d)) || '-' : l.k, nm = by === 'party' ? B.partyName(s.d) : l.name;
        var r = rows[k] = rows[k] || { k: k, name: nm, m: M.map(function () { return 0; }), p: M.map(function () { return 0; }), total: 0, profit: 0 };
        r.m[i] = r2(r.m[i] + s.sign * l.value); r.p[i] = r2(r.p[i] + s.sign * (l.value - l.cost)); r.total = r2(r.total + s.sign * l.value); r.profit = r2(r.profit + s.sign * (l.value - l.cost));
      });
    });
    var list = Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return b.total - a.total; }), n = top || 10;
    if (list.length > n) {
      var rest = { k: '*', name: '', m: M.map(function () { return 0; }), p: M.map(function () { return 0; }), total: 0, profit: 0, rest: list.length - n };
      list.slice(n).forEach(function (r) { r.m.forEach(function (v, i) { rest.m[i] = r2(rest.m[i] + v); rest.p[i] = r2(rest.p[i] + r.p[i]); }); rest.total = r2(rest.total + r.total); rest.profit = r2(rest.profit + r.profit); });
      list = list.slice(0, n).concat([rest]);
    }
    var all = M.map(function (_, i) { return r2(list.reduce(function (s, r) { return s + r.m[i]; }, 0)); });
    return { months: M, rows: list, all: all };
  }

  /* ---------- salesman ---------- */
  /* per salesman: bills, sales and returns without GST, net, collected (the paid share of each bill) and commission.
     people = [{ name, rate (%), basis 'sales' | 'paid' }] from Settings; returns count against the salesman of the bill they name */
  function salesmen(docs, biz, from, to, people) {
    var R = B.bills(docs, biz), left = {}, byNo = {}, out = {};
    R.bills.forEach(function (b) { left[b.id] = b.left; });
    var D = B.inBooks(docs, biz);
    D.forEach(function (d) { if (B.role(d) === 'sale' && d.no) byNo[key(d.no)] = d; });
    function row(nm) { var k = key(nm) || '-'; return out[k] = out[k] || { k: k, name: nm || '', n: 0, sales: 0, ret: 0, paid: 0 }; }
    D.forEach(function (d) {
      if (!d.date || d.date < from || d.date > to) return;
      var r = B.role(d);
      if (r === 'sale') {
        var t = B.itemTotals(d), x = row(d.sman), share = t.total ? (t.total - (left[d.id] || 0)) / t.total : 1;
        x.n++; x.sales = r2(x.sales + t.taxable); x.paid = r2(x.paid + t.taxable * share);
      } else if (r === 'sret') {
        var o = d.orig && d.orig.no && byNo[key(d.orig.no)], sm = d.sman || (o && o.sman) || '', y = row(sm), tv = B.itemTotals(d).taxable;
        y.ret = r2(y.ret + tv); y.paid = r2(y.paid - tv);
      }
    });
    var P = {}; (people || []).forEach(function (p) { if (p && p.name) P[key(p.name)] = p; });
    Object.keys(P).forEach(function (k) { if (!out[k]) row(P[k].name); });
    return Object.keys(out).map(function (k) {
      var x = out[k], p = P[k] || {}, rate = num(p.rate), basis = p.basis === 'paid' ? 'paid' : 'sales';
      x.net = r2(x.sales - x.ret); x.paid = r2(Math.max(0, x.paid)); x.rate = rate; x.basis = basis;
      x.comm = r2((basis === 'paid' ? x.paid : x.net) * rate / 100);
      return x;
    }).sort(function (a, b) { return (a.k === '-') - (b.k === '-') || b.net - a.net; });
  }

  var API = { KINDS: KINDS, fyOf: fyOf, fyStart: fyStart, fyEnd: fyEnd, nextFy: nextFy, assets: assets, wdvRate: wdvRate, bookSchedule: bookSchedule, bookValueOn: bookValueOn,
    posted: posted, register: register, taxBlocks: taxBlocks, yearSummary: yearSummary, carryForward: carryForward, isClosed: isClosed,
    saleLines: saleLines, profit: profit, months: months, trend: trend, salesmen: salesmen, num: num, r2: r2, key: key };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSAcct = API;
})(typeof window !== 'undefined' ? window : this);
