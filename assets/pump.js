/* petrol.niveshsahayak.in: the shift report of a petrol pump. Record type 'pump' (one shift or one day). Meter readings per nozzle, sales per fuel,
   credit sales to named customers, card / UPI / cash, cash counted against cash expected, dip stock. The sums are in pumpcore.js (NSPump); the books
   side is saved with the record as d.books (cash memos without GST, credit bills, expense for cash short, income for cash excess).
   Petrol, diesel, ATF, natural gas and crude oil are outside GST: no fuel line carries GST. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, P = NSPump;
  var FUELS = ['Petrol', 'Diesel', 'Power petrol', 'Premium diesel'];
  var K;
  function nozRow() { return { noz: '', fuel: '', open: '', close: '', test: '', price: '' }; }
  function credRow() { return { cust: '', veh: '', fuel: '', litres: '', amt: '', slip: '' }; }
  function tankRow() { return { tank: '', fuel: '', open: '', recv: '', close: '' }; }
  function L(n) { return NS.qty(n); }
  function xl(sheets, name) { return NS.xlsx(name, sheets.map(function (s) { return { name: s[0], rows: s[1] }; })); }
  function sums(d) { return P.calc(d); }

  /* credit customers: what each owes, with a reminder; Excel of all shift reports */
  function credit() {
    var who = String(K.doc().seller.name || '').trim().toLowerCase(), dlg = $('#pm-cr');
    NSStore.list('doc').then(function (all) {
      var mine = all.filter(function (x) { return String(x.seller && x.seller.name || '').trim().toLowerCase() === who; });
      var ps = NSBooks.parties(mine, K.doc().seller.name), names = {};
      mine.filter(function (x) { return x.type === 'pump'; }).forEach(function (x) { (x.credit || []).forEach(function (r) { var k = String(r.cust || '').trim().toLowerCase(); if (k) names[k] = r.cust.trim(); }); });
      NSStore.list('party').then(function (pl) {
        var rows = Object.keys(names).map(function (k) { var p = ps[k] || { bal: 0 }, pp = pl.filter(function (x) { return String(x.name || '').trim().toLowerCase() === k; })[0] || {}; return { name: names[k], bal: r2(p.bal || 0), phone: pp.phone || '' }; })
          .sort(function (a, b) { return b.bal - a.bal; });
        var tot = r2(rows.reduce(function (a, x) { return a + Math.max(0, x.bal); }, 0));
        var today = NS.today(), s = P.summary(mine, today.slice(0, 7) + '-01', today), s0 = P.summary(mine, today, today);
        var box = $('[data-cr]', dlg);
        box.innerHTML = '<div class="tiles"><div class="tile"><span>' + esc(t('pu.today')) + '</span><b>' + NS.money(s0.sales) + '</b><small>' + esc(t('pu.reports', { n: s0.n })) + '</small></div>' +
          '<div class="tile"><span>' + esc(t('pu.month')) + '</span><b>' + NS.money(s.sales) + '</b><small>' + esc(t('pu.reports', { n: s.n })) + '</small></div>' +
          '<div class="tile' + (tot ? ' warn' : '') + '"><span>' + esc(t('pu.owed')) + '</span><b>' + NS.money(tot) + '</b></div></div>' +
          '<h3>' + esc(t('pu.fuelsm')) + '</h3>' + (Object.keys(s.fuels).length ? '<div class="tbl-wrap"><table class="day"><thead><tr><th>' + esc(t('pu.fuel')) + '</th><th class="n">' + esc(t('pu.litres')) + '</th><th class="n">' + esc(t('pu.amount')) + '</th></tr></thead><tbody>' +
            Object.keys(s.fuels).map(function (k) { var f = s.fuels[k]; return '<tr><td>' + esc(f.name) + '</td><td class="n">' + L(f.litres) + '</td><td class="n">' + NS.money(f.amt) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>' + esc(t('pu.nosales')) + '</p>') +
          '<h3>' + esc(t('pu.credits')) + '</h3>' + (rows.length ? '<div class="tbl-wrap"><table class="day"><thead><tr><th>' + esc(t('pu.cust')) + '</th><th class="n">' + esc(t('pu.bal')) + '</th><th></th></tr></thead><tbody>' + rows.map(function (x) {
            var ph = String(x.phone || '').replace(/\D/g, '').slice(-10), msg = 'Namaste ' + x.name + ', fuel credit due at ' + K.doc().seller.name + ': ' + NS.money(x.bal) + '. Please pay at your earliest. Thank you.';
            return '<tr' + (x.bal > 0.005 ? ' class="warn"' : '') + '><td>' + esc(x.name) + '</td><td class="n">' + NS.money(x.bal) + '</td><td>' + (x.bal > 0.005 ? '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(msg) + '">' + esc(t('pu.wa')) + '</a>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div><p class="hint">' + esc(t('pu.crh')) + '</p>' : '<p>' + esc(t('pu.nocr')) + '</p>') +
          '<p><button type="button" class="btn" data-xl>' + esc(t('pu.xl')) + '</button></p>';
        $('[data-xl]', box).addEventListener('click', function () {
          var rep = mine.filter(function (x) { return x.type === 'pump'; }).sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).map(function (x) {
            var c = P.calc(x); return [x.no, NS.fmtDate(x.date), x.shift || '', c.litres, c.sales, c.credit, c.card, c.upi, c.other, c.cashSales, c.exp, c.expected, c.counted == null ? '' : c.counted, c.diff == null ? '' : c.diff];
          });
          var fu = []; mine.filter(function (x) { return x.type === 'pump'; }).forEach(function (x) { var c = P.calc(x); c.order.forEach(function (k) { fu.push([x.no, NS.fmtDate(x.date), x.shift || '', c.fuels[k].name, c.fuels[k].litres, c.fuels[k].price, c.fuels[k].amt]); }); });
          xl([['Shift reports', [['Report no.', 'Date', 'Shift', 'Litres sold', 'Total sales', 'Credit sales', 'Card', 'UPI', 'Other', 'Cash sales', 'Paid from till', 'Cash expected', 'Cash counted', 'Short (-) / excess (+)']].concat(rep)],
            ['Sales by fuel', [['Report no.', 'Date', 'Shift', 'Fuel', 'Litres', 'Price', 'Amount']].concat(fu)], ['Credit customers', [['Name', 'Balance due']].concat(rows.map(function (x) { return [x.name, x.bal]; }))]], 'petrol-shifts-' + today + '.xlsx');
        });
        dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
      });
    });
  }

  NS.kit({
    type: 'pump', prefix: 'SR', digits: 4, paper: 'a4', papers: NS.PAPER_ALL, copies: 2, copyLabels: ['Pump copy', 'Owner copy'],
    name: function () { return 'Shift Report'; },
    blank: function () { return { shift: '', staff: '', roll: '', noz: [nozRow(), nozRow()], credit: [], card: '', upi: '', other: '', exp: '', counted: '', tanks: [] }; },
    newRow: function (n) { return n === 'credit' ? credRow() : n === 'tanks' ? tankRow() : nozRow(); },
    emptyRows: true,
    party: false,
    keepOnNew: function (d) { var nx = P.nextOpening(d); return { noz: nx.noz.length ? nx.noz : [nozRow(), nozRow()], tanks: nx.tanks, roll: d.roll, paper: d.paper, copies: d.copies }; },
    form: function (K) {
      return K.numCard(K.f('shift', t('pu.shift'), { list: 'dl-shift', hint: t('pu.shifth') }) + K.f('staff', t('pu.staff')) + K.f('roll', t('pu.roll'), { mode: 'numeric', ltr: 1, hint: t('pu.rollh') }) +
          '<datalist id="dl-shift"><option value="Morning"><option value="Evening"><option value="Night"><option value="Full day"></datalist>', t('pu.lg')) +
        K.card(t('pu.nozzles'), '<p class="hint">' + esc(t('pu.nozh')) + '</p>' + K.list('noz', t('pu.addnoz')) + '<datalist id="dl-fuel">' + FUELS.map(function (f) { return '<option value="' + f + '">'; }).join('') + '</datalist>') +
        K.card(t('pu.creditlg'), '<p class="hint">' + esc(t('pu.credith')) + '</p>' + K.list('credit', t('pu.addcred'))) +
        K.card(t('pu.money'), '<div class="fg">' + K.f('card', t('pu.card'), { mode: 'decimal', ltr: 1 }) + K.f('upi', t('pu.upi'), { mode: 'decimal', ltr: 1 }) + K.f('other', t('pu.other'), { mode: 'decimal', ltr: 1, hint: t('pu.otherh') }) +
          K.f('exp', t('pu.exp'), { mode: 'decimal', ltr: 1, hint: t('pu.exph') }) + K.f('counted', t('pu.counted'), { mode: 'decimal', ltr: 1, hint: t('pu.countedh') }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div></div>') +
        K.card(t('pu.dip'), '<p class="hint">' + esc(t('pu.diph')) + '</p>' + K.list('tanks', t('pu.addtank')) + '<div class="f wide"><button type="button" class="btn" data-pm="credit">' + esc(t('pu.dash')) + '</button></div>') +
        K.bizCard({ lg: t('pu.lgbiz') }) + K.lookCard();
    },
    rows: {
      noz: function (n, i, K) {
        return K.rf('noz', i, 'noz', t('pu.nozno'), { ltr: 1 }) + K.rf('noz', i, 'fuel', t('pu.fuel'), { list: 'dl-fuel' }) + K.rf('noz', i, 'open', t('pu.open'), { mode: 'decimal', ltr: 1 }) + K.rf('noz', i, 'close', t('pu.close'), { mode: 'decimal', ltr: 1 }) +
          K.rf('noz', i, 'test', t('pu.test'), { mode: 'decimal', ltr: 1 }) + K.rf('noz', i, 'price', t('pu.price'), { mode: 'decimal', ltr: 1 }) + '<p class="hint wide" data-noznet="' + i + '"></p>';
      },
      credit: function (x, i, K) {
        return K.rf('credit', i, 'cust', t('pu.cust'), { cls: 'it-d', sug: 'party' }) + K.rf('credit', i, 'veh', t('pu.veh'), { ltr: 1 }) + K.rf('credit', i, 'fuel', t('pu.fuel'), { list: 'dl-fuel' }) +
          K.rf('credit', i, 'litres', t('pu.litres'), { mode: 'decimal', ltr: 1 }) + K.rf('credit', i, 'amt', t('pu.amount'), { mode: 'decimal', ltr: 1 }) + K.rf('credit', i, 'slip', t('pu.slip'), { ltr: 1 });
      },
      tanks: function (x, i, K) {
        return K.rf('tanks', i, 'tank', t('pu.tank'), { ltr: 1 }) + K.rf('tanks', i, 'fuel', t('pu.fuel'), { list: 'dl-fuel' }) + K.rf('tanks', i, 'open', t('pu.dopen'), { mode: 'decimal', ltr: 1 }) +
          K.rf('tanks', i, 'recv', t('pu.recv'), { mode: 'decimal', ltr: 1 }) + K.rf('tanks', i, 'close', t('pu.dclose'), { mode: 'decimal', ltr: 1 });
      }
    },
    wire: function (ed, k) { K = k; var b = $('[data-pm="credit"]', ed); if (b) b.addEventListener('click', credit); },
    rowInput: function (n, i, k, d, el) {
      /* a price typed for a fuel once is copied to the other nozzles of that fuel that have none */
      if (n === 'noz' && k === 'price' && el.value) { var f = String(d.noz[i].fuel || '').trim().toLowerCase(); if (f) d.noz.forEach(function (x, j) { if (j !== i && String(x.fuel || '').trim().toLowerCase() === f && !String(x.price || '').trim()) { x.price = el.value; var e = $('[data-r="noz"][data-i="' + j + '"][data-k="price"]'); if (e) e.value = el.value; } }); }
      if (n === 'noz' && k === 'fuel' && el.value && !String(d.noz[i].price || '').trim()) {
        var f2 = el.value.trim().toLowerCase(), hit = d.noz.filter(function (x, j) { return j !== i && String(x.fuel || '').trim().toLowerCase() === f2 && String(x.price || '').trim(); })[0];
        if (hit) { d.noz[i].price = hit.price; var e2 = $('[data-r="noz"][data-i="' + i + '"][data-k="price"]'); if (e2) e2.value = hit.price; }
      }
    },
    drawn: function (d, o) {
      o.noz.forEach(function (c, i) {
        var e = $('[data-noznet="' + i + '"]'); if (!e) return;
        e.textContent = !c.any ? '' : c.bad ? t('pu.bad.' + c.bad) : t('pu.nozsold', { l: L(c.litres), v: NS.money(c.amt) });
        e.classList.toggle('warn', !!c.bad);
      });
    },
    rowsDrawn: function (n, box) {
      if (n !== 'credit') return;
      NS.$$('[data-k="cust"]', box).forEach(function (inp) {
        NS.suggest(inp, function () { return NSStore.list('party'); }, function (x) { return x.name; }, function (p) { var i = +inp.getAttribute('data-i'); K.doc().credit[i].cust = p.name; inp.value = p.name; K.changed(); });
      });
    },
    saved: function (rec) {
      /* credit customers are saved as parties, so their dues show in the App */
      var names = {}; (rec.credit || []).forEach(function (x) { var k = String(x.cust || '').trim().toLowerCase(); if (k && num(x.amt || x.litres) > 0) names[k] = x.cust.trim(); });
      if (!Object.keys(names).length) return;
      NSStore.list('party').then(function (all) {
        Object.keys(names).forEach(function (k) { if (!all.filter(function (x) { return String(x.name || '').trim().toLowerCase() === k; })[0]) NSStore.put('party', { name: names[k], role: 'customer', addr: '', state: '', gstin: '', phone: '' }); });
      });
    },
    sums: sums,
    edSums: function (d, o) {
      return '<span>' + esc(t('pu.s.lit', { v: L(o.litres) })) + '</span><b>' + esc(t('pu.s.sales', { v: NS.money(o.sales) })) + '</b>' + (o.credit ? '<span>' + esc(t('pu.s.credit', { v: NS.money(o.credit) })) + '</span>' : '') +
        '<span>' + esc(t('pu.s.cash', { v: NS.money(o.expected) })) + '</span>' + (o.diff != null ? '<span class="' + (Math.abs(o.diff) > 0.004 ? 'warn' : '') + '">' + esc(t(o.diff < -0.004 ? 'pu.s.short' : o.diff > 0.004 ? 'pu.s.excess' : 'pu.s.ok', { v: NS.money(Math.abs(o.diff)) })) + '</span>' : '') +
        o.tanks.filter(function (x) { return x.var != null && Math.abs(x.var) > 0.004; }).map(function (x) { return '<span class="warn">' + esc(t('pu.s.dip', { f: x.fuel, v: (x.var > 0 ? '+' : '') + L(x.var) })) + '</span>'; }).join('');
    },
    validate: function (d, o) {
      var p = [];
      if (!o.noz.some(function (c) { return c.any && !c.bad; })) p.push(['r-noz-open-0', t('pu.v.noz')]);
      o.noz.forEach(function (c, i) { if (c.bad) p.push(['r-noz-' + (c.bad === 'test' ? 'test' : c.bad === 'incomplete' ? 'close' : 'close') + '-' + i, t('pu.bad.' + c.bad)]); });
      o.noz.forEach(function (c, i) { if (c.any && !c.bad && c.litres > 0 && !(c.price > 0)) p.push(['r-noz-price-' + i, t('pu.v.price')]); if (c.any && !c.bad && !c.fuel) p.push(['r-noz-fuel-' + i, t('pu.v.fuel')]); });
      o.creditRows.forEach(function (x, i) { if (x.amt > 0 && !x.cust) p.push(['r-credit-cust-' + i, t('pu.v.cust')]); });
      if (o.cashSales < -0.005) p.push(['k-card', t('pu.v.more')]);
      if (o.expected < -0.005) p.push(['k-exp', t('pu.v.exp')]);
      return p;
    },
    record: function (rec, o) { rec.books = P.books(rec, o); rec.total = o.sales; },
    copyOf: function (d) {
      var nx = P.nextOpening(d); d.noz = nx.noz; d.tanks = nx.tanks; d.credit = []; d.card = d.upi = d.other = d.exp = d.counted = ''; d.shift = '';
    },
    copyLbl: 'pu.next',
    histName: function (d) { return (d.shift || '') + (d.staff ? ' · ' + d.staff : ''); },
    histText: function (d) { return [d.shift, d.staff, (d.credit || []).map(function (x) { return x.cust + ' ' + x.veh; }).join(' ')].join(' '); },
    histPill: function (d) { var c = P.calc(d); return c.diff != null && Math.abs(c.diff) > 0.004 ? ' <span class="pill">' + esc(t(c.diff < 0 ? 'pu.s.short' : 'pu.s.excess', { v: NS.money(Math.abs(c.diff)) })) + '</span>' : ''; },
    upiShare: false,
    shareText: function (d, o) {
      return '\n' + (d.shift ? 'Shift: ' + d.shift + '\n' : '') + o.order.map(function (k) { return o.fuels[k].name + ': ' + L(o.fuels[k].litres) + ' L = ' + NS.money(o.fuels[k].amt); }).join('\n') + '\nTotal sales: ' + NS.money(o.sales) +
        (o.credit ? '\nCredit: ' + NS.money(o.credit) : '') + '\nCash expected: ' + NS.money(o.expected) + (o.diff != null && Math.abs(o.diff) > 0.004 ? '\nCash ' + (o.diff < 0 ? 'short ' : 'excess ') + NS.money(Math.abs(o.diff)) : '');
    },
    sheet: function (d, o, K, label) {
      var meta = [['Report No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], d.shift ? ['Shift', esc(d.shift)] : null, d.staff ? ['Manager / staff', esc(d.staff)] : null];
      var nz = '<table class="lines"><thead><tr><th>Nozzle</th><th class="l">Fuel</th><th class="n">Opening</th><th class="n">Closing</th><th class="n">Test (L)</th><th class="n">Sold (L)</th><th class="n">Price</th><th class="n">Amount</th></tr></thead><tbody>' +
        d.noz.map(function (n, i) { var c = o.noz[i]; if (!c.any) return ''; return '<tr><td>' + esc(n.noz) + '</td><td class="l">' + esc(n.fuel) + '</td><td class="n">' + L(num(n.open)) + '</td><td class="n">' + L(num(n.close)) + '</td><td class="n">' + (num(n.test) ? L(num(n.test)) : '') + '</td><td class="n">' + L(c.litres) + '</td><td class="n">' + NS.money(c.price, false) + '</td><td class="n">' + NS.money(c.amt, false) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th></th><th class="l">Total</th><th></th><th></th><th></th><th class="n">' + L(o.litres) + '</th><th></th><th class="n">' + NS.money(o.sales, false) + '</th></tr></tfoot></table>';
      var fu = o.order.length > 1 ? '<table class="lines"><thead><tr><th class="l">Fuel</th><th class="n">Litres</th><th class="n">Amount</th></tr></thead><tbody>' + o.order.map(function (k) { return '<tr><td class="l">' + esc(o.fuels[k].name) + '</td><td class="n">' + L(o.fuels[k].litres) + '</td><td class="n">' + NS.money(o.fuels[k].amt, false) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
      var cr = o.creditRows.filter(function (x) { return x.amt > 0 || x.cust; }).length ? '<h4>Credit sales</h4><table class="lines"><thead><tr><th class="l">Customer</th><th class="l">Vehicle</th><th class="l">Fuel</th><th class="n">Litres</th><th class="n">Amount</th></tr></thead><tbody>' + o.creditRows.filter(function (x) { return x.amt > 0 || x.cust; }).map(function (x) { return '<tr><td class="l">' + esc(x.cust) + '</td><td class="l">' + esc(x.veh) + '</td><td class="l">' + esc(x.fuel) + '</td><td class="n">' + (x.litres ? L(x.litres) : '') + '</td><td class="n">' + NS.money(x.amt, false) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
      var dp = o.tanks.length ? '<h4>Dip stock (litres)</h4><table class="lines"><thead><tr><th class="l">Fuel</th><th class="n">Opening</th><th class="n">Received</th><th class="n">Sold (meters)</th><th class="n">Should be</th><th class="n">Dip closing</th><th class="n">Difference</th></tr></thead><tbody>' + o.tanks.map(function (x) { return '<tr><td class="l">' + esc(x.fuel) + '</td><td class="n">' + L(x.open) + '</td><td class="n">' + (x.recv ? L(x.recv) : '') + '</td><td class="n">' + L(x.sold) + '</td><td class="n">' + L(x.book) + '</td><td class="n">' + (x.closed ? L(x.close) : '') + '</td><td class="n">' + (x.var == null ? '' : (x.var > 0 ? '+' : '') + L(x.var) + (x.pct == null ? '' : ' (' + x.pct + '%)')) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
      var tot = K.tot([['Total sales (meters)', NS.money(o.sales)], o.credit ? ['Less: credit sales', '−' + NS.money(o.credit)] : null, o.card ? ['Less: card', '−' + NS.money(o.card)] : null, o.upi ? ['Less: UPI', '−' + NS.money(o.upi)] : null, o.other ? ['Less: other', '−' + NS.money(o.other)] : null,
        ['Cash sales', NS.money(o.cashSales)], o.exp ? ['Less: paid from the till', '−' + NS.money(o.exp)] : null, ['Cash expected', NS.money(o.expected), 'grand'], o.counted != null ? ['Cash counted', NS.money(o.counted)] : null,
        o.diff != null ? [o.diff < -0.004 ? 'Cash short' : o.diff > 0.004 ? 'Cash excess' : 'Cash difference', NS.money(Math.abs(o.diff))] : null]);
      return K.open(d, 'pump') + K.head(d, 'SHIFT REPORT', label || '') + K.meta(meta) + nz + fu + cr + dp +
        '<div class="foot"><div class="foot-l"><p class="small">Petrol and diesel are outside GST; state VAT is included in the pump price. Litres sold are after the testing litres put back into the tank.</p>' + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + tot + '</div></div>' +
        '<div class="signs">' + K.blankSign('', 'Cashier') + K.blankSign('', 'Manager') + K.sign(d, '', 'Owner') + '</div>' + K.made() + '</div>';
    },
    ready: function () {
      if ($('#pm-cr')) return;
      var x = NS.el('dialog', { id: 'pm-cr', 'aria-labelledby': 'pm-cr-h' }, '<div class="dlg-h"><h2 id="pm-cr-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-cr></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      function names() { $('h2', x).textContent = t('pu.dash'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', names);
    }
  });
})();
