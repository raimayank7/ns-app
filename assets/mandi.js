/* mandi.niveshsahayak.in: settlement slips for a commission agent (arhtiya) in a grain or vegetable market.
   Record type 'mandi'. The farmer is kept in `buyer` (the party of the slip, so he comes back as a suggestion and his account shows in the
   Nivesh Sahayak App), the buyer of the produce in `cust`. The sums are in mandicore.js (NSMandi); the books side is saved with the record
   as d.books (one journal entry: buyer owes, farmer is owed, commission is the agent's income, fee and charges are payable on). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t, M = NSMandi;
  var CROPS = ['Wheat', 'Paddy (dhaan)', 'Basmati', 'Rice', 'Maize', 'Bajra', 'Jowar', 'Barley', 'Gram (chana)', 'Mustard (sarson)', 'Soybean', 'Cotton (kapas)', 'Moong', 'Masoor', 'Arhar (tur)', 'Groundnut', 'Potato', 'Onion', 'Tomato'];
  var K;
  function lotRow() { return { crop: '', n: '', gross: '', tare: '', tpb: '', cut: '', rate: '', per: 'qtl' }; }
  function dedRow(name, basis, side, keep) { return { name: name || '', basis: basis || 'pct', v: '', side: side || 'farmer', keep: keep || 'inc' }; }
  function party() { return { name: '', addr: '', state: '', gstin: '', phone: '' }; }
  function sums(d) { return M.calc(d); }
  function xl(sheets, name) { return NS.xlsx(name, sheets.map(function (s) { return { name: s[0], rows: s[1] }; })); }
  function kg(n) { return NS.qty(n); }

  /* accounts and totals of this business, in a dialog, with an Excel file */
  function accounts() {
    var who = String(K.doc().seller.name || '').trim().toLowerCase(), dlg = $('#md-acc');
    NSStore.list('doc').then(function (all) {
      var mine = all.filter(function (x) { return String(x.seller && x.seller.name || '').trim().toLowerCase() === who; });
      var ps = NSBooks.parties(mine, K.doc().seller.name), ac = M.accounts(mine.filter(function (x) { return x.type === 'mandi'; }), ps);
      var today = NS.today(), s = M.summary(mine, today.slice(0, 7) + '-01', today), s0 = M.summary(mine, today, today);
      var rows = ac.map(function (a) {
        var owe = a.bal < 0, amt = Math.abs(a.bal), ph = String(a.phone || '').replace(/\D/g, '').slice(-10);
        var msg = 'Namaste ' + a.name + ', your account with ' + K.doc().seller.name + ': ' + (owe ? 'we owe you ' : 'amount due from you ') + NS.money(amt) + '. Thank you.';
        return '<tr><td>' + esc(a.name) + '</td><td>' + esc(t('md.r.' + a.role)) + '</td><td class="n">' + (amt < 0.005 ? '—' : NS.money(amt)) + '</td><td>' + (amt < 0.005 ? '' : esc(t(owe ? 'md.weowe' : 'md.oweus'))) + '</td><td>' +
          (amt >= 0.005 ? '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/' + (ph.length === 10 ? '91' + ph : '') + '?text=' + encodeURIComponent(msg) + '">' + esc(t('md.wa')) + '</a>' : '') + '</td></tr>';
      }).join('');
      var box = $('[data-acc]', dlg);
      box.innerHTML = '<div class="tiles"><div class="tile"><span>' + esc(t('md.today')) + '</span><b>' + s0.n + '</b><small>' + esc(t('md.qtl', { v: NS.qty(s0.qtl) })) + '</small></div>' +
        '<div class="tile"><span>' + esc(t('md.month')) + '</span><b>' + NS.money(s.value) + '</b><small>' + esc(t('md.qtl', { v: NS.qty(s.qtl) })) + '</small></div>' +
        '<div class="tile ok"><span>' + esc(t('md.earned')) + '</span><b>' + NS.money(s.income) + '</b></div><div class="tile"><span>' + esc(t('md.passed')) + '</span><b>' + NS.money(s.fee) + '</b></div></div>' +
        (rows ? '<div class="tbl-wrap"><table class="day"><thead><tr><th>' + esc(t('md.acc')) + '</th><th>' + esc(t('md.role')) + '</th><th class="n">' + esc(t('md.bal')) + '</th><th></th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">' + esc(t('md.acch')) + '</p>' : '<p>' + esc(t('md.noacc')) + '</p>') +
        '<p><button type="button" class="btn" data-xl>' + esc(t('md.xl')) + '</button></p>';
      $('[data-xl]', box).addEventListener('click', function () {
        var sl = mine.filter(function (x) { return x.type === 'mandi'; }).sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).map(function (x) {
          var c = M.calc(x); return [x.no, NS.fmtDate(x.date), x.buyer && x.buyer.name || '', x.buyer && x.buyer.addr || '', x.cust && x.cust.name || '', c.bags, c.gross, c.tare, c.net, c.value, c.dF, c.dB, c.income, c.fee, c.farmerNet, c.paid, c.buyerTotal, c.recv];
        });
        var accRows = ac.map(function (a) { return [a.name, t('md.r.' + a.role), r2(Math.abs(a.bal)), a.bal < 0 ? 'We owe' : a.bal > 0 ? 'Owes us' : '']; });
        xl([['Slips', [['Slip no.', 'Date', 'Farmer', 'Village', 'Buyer', 'Bags', 'Gross kg', 'Tare kg', 'Net kg', 'Produce value', 'Farmer deductions', 'Buyer charges', 'Commission and charges earned', 'Passed on (fee, labour)', 'Net to farmer', 'Paid to farmer', 'Buyer total', 'Received from buyer']].concat(sl)], ['Accounts', [['Name', 'Kind', 'Balance', 'Side']].concat(accRows)]], 'mandi-slips-' + today + '.xlsx');
      });
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    });
  }

  NS.kit({
    type: 'mandi', prefix: 'MN', digits: 3, paper: 'a5', papers: ['a5', 'a4'], copies: 3, copyLabels: ['Farmer copy', 'Buyer copy', 'Office copy'],
    name: function (d) { return d.print === 'weigh' ? 'Weighment Slip' : d.print === 'buyer' ? 'Sale Bill' : 'Settlement Slip'; },
    blank: function () {
      return { print: 'settle', yard: '', veh: '', lots: [lotRow()], ded: [], cust: party(), gstRate: '', adv: '', paid: '', pmode: 'cash', recv: '', rmode: 'cash' };
    },
    newRow: function (n) { return n === 'ded' ? dedRow() : lotRow(); },
    emptyRows: true,
    keepOnNew: function (d) { return { ded: JSON.parse(JSON.stringify(d.ded || [])), gstRate: d.gstRate, paper: d.paper, copies: d.copies, yard: d.yard }; },
    party: 'supplier',
    form: function (K) {
      var dl = '<datalist id="dl-crops">' + CROPS.map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>';
      return K.numCard(K.f('print', t('md.print'), { type: 'select', opts: [['settle', t('md.psettle')], ['weigh', t('md.pweigh')], ['buyer', t('md.pbuyer')]], hint: t('md.printh') }) + K.f('yard', t('md.yard')) + K.f('veh', t('md.veh'), { ltr: 1 }), t('md.lg')) +
        K.partyCard(t('md.farmer'), { nameLbl: t('md.fname'), ph: '', gstin: false, extra: '' }) +
        K.card(t('md.buyer'), '<div class="fg">' + K.f('cust.name', t('md.bname'), { wide: true, hint: t('md.bnameh') }) + K.f('cust.addr', t('l.addr'), { type: 'textarea', wide: true }) +
          K.f('cust.state', t('l.state'), { type: 'select', opts: K.states() }) + K.f('cust.gstin', t('l.gstin'), { max: 15, ltr: 1 }) + K.f('cust.phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) + '</div>') +
        K.card(t('md.lots'), K.list('lots', t('md.addlot')) + dl) +
        K.card(t('md.deds'), '<p class="hint">' + esc(t('md.dedsh')) + '</p>' + K.list('ded', t('md.adddeds')) + '<div class="f wide"><button type="button" class="btn sm" data-md="preset">' + esc(t('md.preset')) + '</button></div>' +
          '<datalist id="dl-ded"><option value="Commission (arhat)"><option value="Market fee"><option value="Rural development fee"><option value="Hamali / labour"><option value="Weighing (tulai)"><option value="Cleaning / sieving"><option value="Bardana / gunny bags"><option value="Interest on advance"></datalist>') +
        K.card(t('md.settle'), '<div class="fg">' + K.f('gstRate', t('md.gst'), { mode: 'decimal', ltr: 1, hint: t('md.gsth') }) + K.f('adv', t('md.adv'), { mode: 'decimal', ltr: 1, hint: t('md.advh') }) +
          K.f('paid', t('md.paid'), { mode: 'decimal', ltr: 1 }) + K.f('pmode', t('md.pmode'), { type: 'select', opts: K.modes(['cash', 'upi', 'cheque', 'bank']) }) +
          K.f('recv', t('md.recv'), { mode: 'decimal', ltr: 1, hint: t('md.recvh') }) + K.f('rmode', t('md.rmode'), { type: 'select', opts: K.modes(['cash', 'upi', 'cheque', 'bank']) }) +
          '<div class="sums wide" id="ed-sums" aria-live="polite"></div>' +
          '<div class="f wide"><button type="button" class="btn" data-md="acc">' + esc(t('md.accounts')) + '</button></div></div>') +
        K.bizCard({ lg: t('md.lgbiz') }) + K.lookCard();
    },
    rows: {
      lots: function (l, i, K) {
        return K.rf('lots', i, 'crop', t('md.crop'), { cls: 'it-d', list: 'dl-crops' }) + K.rf('lots', i, 'n', t('md.bags'), { mode: 'numeric', ltr: 1 }) + K.rf('lots', i, 'gross', t('md.gross'), { mode: 'decimal', ltr: 1 }) +
          K.rf('lots', i, 'tare', t('md.tare'), { mode: 'decimal', ltr: 1 }) + K.rf('lots', i, 'tpb', t('md.tpb'), { mode: 'decimal', ltr: 1 }) + K.rf('lots', i, 'cut', t('md.cut'), { mode: 'decimal', ltr: 1 }) +
          K.rf('lots', i, 'rate', t('md.rate'), { mode: 'decimal', ltr: 1 }) + K.rf('lots', i, 'per', t('md.per'), { type: 'select', opts: [['qtl', t('md.pqtl')], ['kg', t('md.pkg')], ['bag', t('md.pbag')]] }) +
          '<p class="hint wide" data-lotnet="' + i + '"></p>';
      },
      ded: function (x, i, K) {
        return K.rf('ded', i, 'name', t('md.dname'), { cls: 'it-d', list: 'dl-ded' }) + K.rf('ded', i, 'basis', t('md.basis'), { type: 'select', opts: [['pct', t('md.bpct')], ['bag', t('md.bbag')], ['qtl', t('md.bqtl')], ['fixed', t('md.bfix')]] }) +
          K.rf('ded', i, 'v', t('md.dv'), { mode: 'decimal', ltr: 1 }) + K.rf('ded', i, 'side', t('md.side'), { type: 'select', opts: [['farmer', t('md.sfarmer')], ['buyer', t('md.sbuyer')]] }) +
          K.rf('ded', i, 'keep', t('md.keep'), { type: 'select', opts: [['inc', t('md.kinc')], ['pay', t('md.kpay')]] });
      }
    },
    wire: function (ed, k) {
      K = k;
      var p = $('[data-md="preset"]', ed), a = $('[data-md="acc"]', ed);
      if (p) p.addEventListener('click', function () {
        var d = K.doc(); d.ded = [dedRow('Commission (arhat)', 'pct', 'farmer', 'inc'), dedRow('Market fee', 'pct', 'buyer', 'pay'), dedRow('Hamali / labour', 'bag', 'farmer', 'pay'), dedRow('Weighing (tulai)', 'bag', 'farmer', 'pay')];
        K.refill(); K.toast(t('md.presetdone'));
      });
      if (a) a.addEventListener('click', accounts);
      var n = $('[data-b="cust.name"]', ed);
      if (n) NS.suggest(n, function () { return NSStore.list('party'); }, function (x) { return x.name; }, function (q) { var d = K.doc(); d.cust = { name: q.name, addr: q.addr || '', state: q.state || '', gstin: q.gstin || '', phone: q.phone || '' }; K.refill(); });
    },
    rowsDrawn: function (n, box) {
      if (n !== 'lots') return;
      var d = K.doc(); M.calc(d).lots.forEach(function (c, i) { var e = $('[data-lotnet="' + i + '"]', box); if (e) e.textContent = c.any ? t('md.lotnet', { n: kg(c.net), q: NS.qty(c.qtl), v: NS.money(c.amt) }) : ''; });
    },
    drawn: function (d, o) {
      var box = $('[data-rows="lots"]'); if (!box) return;
      o.lots.forEach(function (c, i) { var e = $('[data-lotnet="' + i + '"]', box); if (e) e.textContent = c.any ? t('md.lotnet', { n: kg(c.net), q: NS.qty(c.qtl), v: NS.money(c.amt) }) : ''; });
    },
    input: function (p, el, d) {
      if (p === 'veh') d.veh = el.value.toUpperCase().replace(/\s+/g, '');
      if (p === 'cust.gstin' && NS.gstinCheck(el.value).ok && NS.gstinCheck(el.value).state && !d.cust.state) { d.cust.state = NS.gstinCheck(el.value).state; K.refill(); }
    },
    sums: sums,
    edSums: function (d, o) {
      return '<span>' + esc(t('md.s.net', { n: kg(o.net), q: NS.qty(o.qtl) })) + '</span><span>' + esc(t('md.s.val', { v: NS.money(o.value) })) + '</span>' +
        (o.dF ? '<span>' + esc(t('md.s.ded', { v: NS.money(o.dF + o.gstF) })) + '</span>' : '') + '<b>' + esc(t('md.s.fnet', { v: NS.money(o.farmerNet) })) + '</b>' +
        (o.toPay ? '<span>' + esc(t('md.s.topay', { v: NS.money(o.toPay) })) + '</span>' : '') + (d.cust && d.cust.name ? '<span>' + esc(t('md.s.bill', { v: NS.money(o.buyerTotal) })) + '</span>' : '') +
        (o.income ? '<span>' + esc(t('md.s.inc', { v: NS.money(o.income) })) + '</span>' : '');
    },
    validate: function (d, o) {
      var p = [];
      if (!String(d.buyer.name || '').trim()) p.push(['k-buyer-name', t('md.v.farmer')]);
      if (!(o.gross > 0)) p.push(['r-lots-gross-0', t('md.v.wt')]);
      if (!(o.value > 0)) p.push(['r-lots-rate-0', t('md.v.rate')]);
      if (o.lots.some(function (c) { return c.tare > c.gross && c.gross > 0; })) p.push(['r-lots-tare-0', t('md.v.tare')]);
      if (num(d.gstRate) < 0 || num(d.gstRate) > 40) p.push(['k-gstRate', t('md.v.gst')]);
      if (o.paid > o.farmerNet - o.adv + 0.005) p.push(['k-paid', t('md.v.paid')]);
      if (d.cust && d.cust.gstin && !NS.gstinCheck(d.cust.gstin).ok) p.push(['k-cust-gstin', t('v.bg')]);
      if (o.gstF + o.gstB > 0 && !d.seller.gstin) p.push(['k-seller-gstin', t('v.tax')]);
      return p;
    },
    confirm: function (d, o) { return (d.pmode === 'cash' && o.paid >= 200000) || (d.rmode === 'cash' && o.recv >= 200000) ? t('c.cash2l') : ''; },
    record: function (rec, o) {
      rec.books = M.books(rec, o);
      rec.balance = o.toPay;
    },
    saved: function (rec) {
      var c = rec.cust; if (!c || !String(c.name || '').trim()) return;
      NSStore.list('party').then(function (all) {
        var k = String(c.name).trim().toLowerCase(), hit = all.filter(function (x) { return String(x.name || '').trim().toLowerCase() === k; })[0];
        if (!hit) NSStore.put('party', { name: c.name.trim(), addr: c.addr || '', state: c.state || '', gstin: c.gstin || '', phone: c.phone || '', role: 'customer' });
        else if (hit.role === 'supplier') NSStore.put('party', Object.assign(hit, { role: 'both' }));
      });
    },
    copyOf: function (d) { d.veh = ''; d.paid = ''; d.recv = ''; d.adv = ''; d.lots = [lotRow()]; },
    histName: function (d) { return (d.buyer && d.buyer.name || '') + (d.cust && d.cust.name ? ' → ' + d.cust.name : ''); },
    histText: function (d) { return [d.veh, d.yard, d.lots && d.lots.map(function (l) { return l.crop; }).join(' '), d.cust && d.cust.name].join(' '); },
    histPill: function (d) { return num(d.balance) > 0.005 ? ' <span class="pill">' + esc(t('md.s.topay', { v: NS.money(num(d.balance)) })) + '</span>' : ''; },
    upiShare: false,
    shareText: function (d, o) {
      return '\nFarmer: ' + (d.buyer.name || '') + '\nNet weight: ' + kg(o.net) + ' kg (' + NS.qty(o.qtl) + ' qtl)\nProduce value: ' + NS.money(o.value) + '\nNet to farmer: ' + NS.money(o.farmerNet) + (o.toPay > 0 ? '\nBalance to pay: ' + NS.money(o.toPay) : '');
    },
    sheet: function (d, o, K, label) {
      var kind = d.print || 'settle', title = kind === 'weigh' ? 'WEIGHMENT SLIP (KANTA PARCHI)' : kind === 'buyer' ? 'SALE BILL' : 'SETTLEMENT SLIP';
      var f = d.buyer, c = d.cust || {};
      var meta = [['Slip No.', '<span class="mono">' + esc(d.no) + '</span>'], ['Date', NS.fmtDate(d.date)], ['Farmer', '<b>' + esc(f.name) + '</b>' + (f.addr ? '<br>' + esc(f.addr).replace(/\n/g, '<br>') : '') + (f.phone ? '<br>' + esc(f.phone) : '')],
        c.name && kind !== 'weigh' || c.name && kind === 'weigh' ? ['Buyer', '<b>' + esc(c.name) + '</b>' + (c.gstin ? '<br>GSTIN ' + esc(c.gstin) : '')] : null, d.yard ? ['Mandi / yard', esc(d.yard)] : null, d.veh ? ['Vehicle', '<span class="mono">' + esc(d.veh) + '</span>'] : null];
      var showMoney = kind !== 'weigh';   /* a kanta parchi shows weights only */
      var lots = '<table class="lines"><thead><tr><th class="l">Produce</th><th class="n">Bags</th><th class="n">Gross kg</th><th class="n">Tare kg</th>' + (o.cut ? '<th class="n">Cut kg</th>' : '') + '<th class="n">Net kg</th>' + (showMoney ? '<th class="n">Rate</th><th class="n">Amount</th>' : '') + '</tr></thead><tbody>' +
        d.lots.map(function (l, i) {
          var c2 = o.lots[i]; if (!c2.any) return '';
          return '<tr><td class="l">' + esc(l.crop) + '</td><td class="n">' + (c2.bags || '') + '</td><td class="n">' + kg(c2.gross) + '</td><td class="n">' + (c2.tare ? kg(c2.tare) : '') + '</td>' + (o.cut ? '<td class="n">' + (c2.cut ? kg(c2.cut) : '') + '</td>' : '') + '<td class="n">' + kg(c2.net) + '</td>' +
            (showMoney ? '<td class="n">' + NS.money(c2.rate, false) + ' / ' + { qtl: 'qtl', kg: 'kg', bag: 'bag' }[c2.per] + '</td><td class="n">' + NS.money(c2.amt, false) + '</td>' : '') + '</tr>';
        }).join('') + '</tbody><tfoot><tr><th class="l">Total</th><th class="n">' + (o.bags || '') + '</th><th class="n">' + kg(o.gross) + '</th><th class="n">' + (o.tare ? kg(o.tare) : '') + '</th>' + (o.cut ? '<th class="n">' + kg(o.cut) + '</th>' : '') + '<th class="n">' + kg(o.net) + '</th>' + (showMoney ? '<th></th><th class="n">' + NS.money(o.value, false) + '</th>' : '') + '</tr></tfoot></table>' +
        '<p class="small">Net weight ' + kg(o.net) + ' kg = ' + NS.qty(o.qtl) + ' quintal.</p>';
      if (kind === 'weigh') return K.open(d, 'mandi') + K.head(d, title, label || '') + K.meta(meta) + lots + (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        '<div class="signs">' + K.blankSign('', 'Weighman') + K.blankSign('', 'Farmer') + K.sign(d, '', 'Commission agent') + '</div>' + K.made() + '</div>';
      var rows, words;
      if (kind === 'buyer') {
        rows = [['Value of produce', NS.money(o.value)]].concat(o.b.map(function (x) { return [esc(x.name) + (x.basis === 'pct' ? ' (' + x.v + '%)' : ''), NS.money(x.amt)]; }))
          .concat([o.gstB ? ['GST on charges (' + o.g + '%)', NS.money(o.gstB)] : null, ['Total payable by buyer', NS.money(o.buyerTotal), 'grand'], o.recv ? ['Received', '−' + NS.money(o.recv)] : null, o.toGet > 0.004 ? ['Balance due', NS.money(o.toGet)] : null]);
        words = o.buyerTotal;
      } else {
        rows = [['Value of produce', NS.money(o.value)]].concat(o.f.map(function (x) { return ['Less: ' + esc(x.name) + (x.basis === 'pct' ? ' (' + x.v + '%)' : ''), '−' + NS.money(x.amt)]; }))
          .concat([o.gstF ? ['Less: GST on commission (' + o.g + '%)', '−' + NS.money(o.gstF)] : null, ['Net payable to farmer', NS.money(o.farmerNet), 'grand'], o.adv ? ['Less: advance already paid', '−' + NS.money(o.adv)] : null,
            o.paid ? ['Paid now (' + K.mode(d.pmode) + ')', '−' + NS.money(o.paid)] : null, o.adv || o.paid ? [o.toPay > 0.004 ? 'Balance to pay' : 'Balance', NS.money(Math.max(0, o.toPay))] : null]);
        words = o.farmerNet;
      }
      return K.open(d, 'mandi') + K.head(d, title, label || '') + K.meta(meta) + lots +
        '<div class="foot"><div class="foot-l">' + K.words(words) + (kind === 'settle' ? '<p class="small">Commission, fee and charges are as agreed or as fixed for this market. GST is shown only where a rate has been entered.</p>' : '') +
        (d.notes ? '<p class="small">' + esc(d.notes).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div class="foot-r">' + K.tot(rows) + '</div></div>' +
        '<div class="signs">' + (kind === 'settle' ? K.blankSign('', 'Farmer’s signature') : K.blankSign('', 'Buyer’s signature')) + K.sign(d, '', 'Commission agent') + '</div>' + K.made() + '</div>';
    },
    ready: function () {
      if ($('#md-acc')) return;
      var x = NS.el('dialog', { id: 'md-acc', 'aria-labelledby': 'md-acc-h' }, '<div class="dlg-h"><h2 id="md-acc-h"></h2><button type="button" class="btn sm" data-close></button></div><div class="dlg-b" data-acc></div>');
      document.body.appendChild(x);
      $('[data-close]', x).addEventListener('click', function () { x.close(); });
      function names() { $('h2', x).textContent = t('md.accounts'); $('[data-close]', x).textContent = t('close'); }
      names(); document.addEventListener('ns-lang', names);
    }
  });
})();
