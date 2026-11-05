/* Nivesh Sahayak App: sample data, so a new visitor sees the app working before typing anything.
   A made-up hardware shop in Ludhiana with customers, a supplier, items, bills of different ages, payments,
   a quotation, a purchase bill, expenses and opening balances. Every record carries sample: 1 and every name ends
   in "(sample)", so NSSample.remove() takes away exactly these records and nothing the user typed.
   Batch 1 fields are filled too, so the new features have something to show: credit limit and credit days (Gill Builders is over its limit),
   wholesale price type, item categories with MRP / wholesale / purchase price, freight on bill S01, and bill S01 repeats every month.
   Party and item groups (meta 'groups', core.js NS.groupsOf) with one sub-group each; they carry sample: 1 and go with remove(). */
(function () {
  'use strict';
  var r2 = NS.r2;
  var TAG = ' (sample)';

  function day(n) { var d = new Date(); d.setDate(d.getDate() - n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  /* a GSTIN with a correct check character, so the sample passes the app's own checks */
  function gstin(base) {
    var C = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', sum = 0;
    for (var i = 0; i < 14; i++) { var v = C.indexOf(base[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 36) + (v % 36); }
    return base + C[(36 - (sum % 36)) % 36];
  }
  function total(items, noTax) {
    return r2(items.reduce(function (a, it) { var t = r2(it.qty * it.rate); return a + t + (noTax ? 0 : r2(t * it.gst / 100)); }, 0));
  }
  function fy(iso) { return NS.fy(iso).replace(/^20(\d\d)-(\d\d)$/, '$1-$2'); }

  var BIZ = { name: 'Sharma Hardware' + TAG, addr: 'Shop 12, Gill Road', city: 'Ludhiana', pin: '141003', state: '03', gstin: gstin('03ABCPS1234K1Z'), reg: 'regular',
    phone: '98140 00000', email: '', bankName: 'Sample Bank', bankAcc: '000111222333', bankIfsc: 'SBIN0000001', bankBranch: 'Ludhiana', upi: 'sharmahardware@upi' };
  /* groups: fixed ids, so adding the sample twice never makes two of them */
  var GROUPS = {
    party: [{ id: 'gsmp-ldh', name: 'Ludhiana customers' + TAG, under: 'debtors', sample: 1 }, { id: 'gsmp-bld', name: 'Builders' + TAG, under: 'gsmp-ldh', sample: 1 },
      { id: 'gsmp-steel', name: 'Steel suppliers' + TAG, under: 'creditors', sample: 1 }],
    item: [{ id: 'gsmp-hw', name: 'Hardware' + TAG, under: '', sample: 1 }, { id: 'gsmp-paint', name: 'Paints' + TAG, under: 'gsmp-hw', sample: 1 },
      { id: 'gsmp-plumb', name: 'Plumbing' + TAG, under: '', sample: 1 }]
  };
  var PARTIES = [
    { name: 'Gill Builders' + TAG, group: 'gsmp-bld', role: 'customer', addr: 'Model Town', city: 'Ludhiana', pin: '141002', state: '03', gstin: gstin('03AAFFG5678L1Z'), phone: '98150 00001', ptype: 'wholesale', climit: 5000, cdays: 30 },
    { name: 'Verma Paints' + TAG, group: 'gsmp-ldh', role: 'customer', addr: 'Chaura Bazar', city: 'Ludhiana', pin: '141008', state: '03', gstin: gstin('03AAGPV2468M1Z'), phone: '98720 00002', cdays: 15 },
    { name: 'Delhi Decor' + TAG, role: 'customer', addr: 'Kirti Nagar', city: 'New Delhi', pin: '110015', state: '07', gstin: gstin('07AAHCD1357N1Z'), phone: '99110 00003' },
    { name: 'Punjab Steel Mart' + TAG, group: 'gsmp-steel', role: 'supplier', addr: 'Focal Point', city: 'Ludhiana', pin: '141010', state: '03', gstin: gstin('03AAJFP9753P1Z'), phone: '98880 00004' }
  ];
  var ITEMS = [
    { desc: 'Door hinge 4 inch' + TAG, hsn: '8302', unit: 'Nos', rate: 45, gst: 18, kind: 'goods', cat: 'Hardware' + TAG, group: 'gsmp-hw', wrate: 40, mrp: 55, prate: 32 },
    { desc: 'Wall putty 20 kg' + TAG, hsn: '3214', unit: 'Bag', rate: 650, gst: 18, kind: 'goods', cat: 'Paints' + TAG, group: 'gsmp-paint', wrate: 610, mrp: 720, prate: 540 },
    { desc: 'PVC pipe 1 inch' + TAG, hsn: '3917', unit: 'Mtr', rate: 120, gst: 18, kind: 'goods', cat: 'Plumbing' + TAG, group: 'gsmp-plumb', wrate: 110, mrp: 140, prate: 90 },
    { desc: 'Paint brush 2 inch' + TAG, hsn: '9603', unit: 'Nos', rate: 60, gst: 18, kind: 'goods', cat: 'Paints' + TAG, group: 'gsmp-paint', wrate: 52, mrp: 75, prate: 40 }
  ];

  function seller() { var s = JSON.parse(JSON.stringify(BIZ)); return s; }
  function buyer(p) { return { name: p.name, addr: p.addr, city: p.city, pin: p.pin, state: p.state, gstin: p.gstin, phone: p.phone }; }
  function line(i, qty, rate) { var it = ITEMS[i]; return { desc: it.desc, hsn: it.hsn, qty: qty, unit: it.unit, rate: rate == null ? it.rate : rate, disc: '', gst: it.gst }; }
  function invoice(n, p, date, items) {
    return { sample: 1, type: 'invoice', kind: 'tax', no: 'INV/' + fy(date) + '/S0' + n, date: date, due: day(-15), deliv: '', pos: '', rc: false, ref: '', recv: '',
      seller: seller(), buyer: buyer(p), ship: null, einv: null, irn: null, items: items, round: false, comp: true, notes: '', terms: '', status: 'unpaid',
      copyLabel: '', withGst: true, valid: '', paper: 'a4', design: 'classic', copies: 1, total: total(items) };
  }
  function receipt(n, p, date, amt, mode, bill) {
    return { sample: 1, type: 'receipt', app: 1, kind: 'pay', no: 'RCT/' + fy(date) + '/S0' + n, date: date, seller: seller(), buyer: { name: p.name, addr: '', phone: p.phone, gstin: p.gstin, pan: '' },
      amount: amt, tds: '', mode: mode, ref: mode === 'upi' ? 'UPI 5521' + n : '', against: bill.no, purpose: '', alloc: [{ id: bill.id, no: bill.no, amt: amt }],
      paper: 'a4', design: 'classic', copies: 1, copyLabel: '', gstAdv: false, rate: '18', pos: '', sac: '', rv: '', rvDate: '', refDate: '', bank: '', balance: '', status: '', total: amt };
  }

  function add() {
    var A = window.NSApp, put = function (s, r) { r.sample = 1; return NSStore.put(s, r); };
    var C = PARTIES, bills = [];
    return NSStore.meta('groups').then(function (m) {
      m = m && typeof m === 'object' ? m : {};
      ['party', 'item'].forEach(function (k) {
        var list = Array.isArray(m[k]) ? m[k] : [];
        GROUPS[k].forEach(function (g) { if (!list.some(function (x) { return x.id === g.id; })) list.push(JSON.parse(JSON.stringify(g))); });
        m[k] = list;
      });
      return NSStore.meta('groups', m);
    }).then(function () { return put('biz', seller()); }).then(function (b) {
      try { localStorage.setItem('ns-app-biz', b.id); } catch (e) {}
      return Promise.all(C.map(function (p) { return put('party', JSON.parse(JSON.stringify(p))); }).concat(ITEMS.map(function (it) { return put('item', JSON.parse(JSON.stringify(it))); })));
    }).then(function () {
      var docs = [
        invoice(1, C[0], day(75), [line(1, 10)]),
        invoice(2, C[1], day(40), [line(0, 100), line(3, 20)]),
        invoice(3, C[2], day(12), [line(2, 200)]),
        invoice(4, C[0], day(2), [line(1, 4)])
      ];
      /* Batch 1: freight on the first bill (GST at the main item's rate) and a monthly repeat of it */
      docs[0].charges = [{ name: 'Freight', amt: 300, gst: 'main' }];
      docs[0].rec = { every: 'month', until: '' };
      /* due date = bill date + the party's credit days (15 when none), so old bills show as overdue */
      if (window.NSBooks) docs.forEach(function (d) { var p = C.filter(function (x) { return x.name === d.buyer.name; })[0] || {}; d.due = NSBooks.addDays(d.date, p.cdays || 15); });
      if (window.NSBooks) docs[0].total = NSBooks.itemTotals(Object.assign({}, docs[0], { total: null })).total;
      /* a counter sale today, paid in cash, so "Sales today" is not empty */
      var cm = [line(3, 4)], walk = { sample: 1, type: 'cashmemo', kind: 'cashmemo', no: 'CM/' + fy(day(0)) + '/S01', date: day(0), due: '', deliv: '', pos: '', rc: false, recv: '', ref: '',
        seller: seller(), buyer: { name: '', addr: '', city: '', pin: '', state: '03', gstin: '', phone: '' }, ship: null, einv: null, irn: null, items: cm, round: true, comp: true,
        notes: '', terms: '', status: 'paid', payMode: 'cash', copyLabel: '', withGst: true, valid: '', paper: 'th80', design: 'classic', copies: 1, total: Math.round(total(cm)) };
      return docs.reduce(function (pr, d) { return pr.then(function () { return put('doc', d).then(function (s) { bills.push(s); }); }); }, Promise.resolve())
        .then(function () { return put('doc', walk); });
    }).then(function () {
      /* part payment of bill 2, full payment of bill 4 (marked Paid by the app's own rule) */
      return put('doc', receipt(1, C[1], day(20), 3000, 'cash', bills[1])).then(function (r) { return A.markPaid(r); })
        .then(function () { return put('doc', receipt(2, C[0], day(1), bills[3].total, 'upi', bills[3])); }).then(function (r) { return A.markPaid(r); });
    }).then(function () {
      var q = [line(1, 20, 640)], s = C[3], pb = [line(0, 500, 30)];
      var jobs = [
        { type: 'quote', kind: 'quote', no: 'QT/' + fy(day(3)) + '/S01', date: day(3), valid: day(-12), ref: '', seller: seller(), buyer: buyer(C[1]), ship: null, items: q, round: false, comp: true,
          notes: '', terms: 'Prices valid for 15 days.', status: 'open', withGst: true, paper: 'a4', design: 'classic', copies: 1, total: total(q) },
        { type: 'pbill', kind: 'bill', app: 1, no: 'PSM/1189', date: day(30), seller: seller(), buyer: { name: s.name, addr: s.addr, city: s.city, pin: s.pin, state: s.state, gstin: s.gstin, phone: s.phone },
          items: pb, noGst: false, notes: '', total: total(pb) },
        { type: 'exp', app: 1, date: day(5), seller: seller(), cat: 'rent', amount: 8000, mode: 'cash', buyer: { name: '' }, no: '', gst: '', itc: false, inter: false, notes: 'Shop rent', total: 8000 },
        { type: 'exp', app: 1, date: day(8), seller: seller(), cat: 'power', amount: 1850, mode: 'upi', buyer: { name: '' }, no: '', gst: '', itc: false, inter: false, notes: 'Electricity bill', total: 1850 },
        { type: 'ob', app: 1, date: day(80), seller: seller(), buyer: { name: '' }, side: 'cash', amount: 15000, no: '', total: 15000 },
        { type: 'ob', app: 1, date: day(80), seller: seller(), buyer: { name: '' }, side: 'bank', amount: 50000, no: '', total: 50000 }
      ];
      return Promise.all(jobs.map(function (d) { return put('doc', d); }));
    }).then(function () {
      return NSStore.list('doc');
    }).then(function (all) {
      /* part payment to the supplier against the purchase bill */
      var pbill = all.filter(function (d) { return d.sample && d.type === 'pbill'; })[0], s = C[3];
      return put('doc', { type: 'voucher', app: 1, forBill: true, no: 'PV/' + fy(day(15)) + '/S01', date: day(15), seller: seller(), buyer: { name: s.name, addr: '', phone: '', gstin: s.gstin, pan: '' },
        mode: 'bank', ref: 'NEFT 88231', tdsSec: '', tdsRate: '', rcm: false, rcmRate: '18', prep: '', appr: '', status: '', paper: 'a4', design: 'classic', copies: 1, copyLabel: 'orig',
        alloc: [{ id: pbill.id, no: pbill.no, amt: 10000 }], lines: [{ desc: 'Payment against bill ' + pbill.no, head: 'Supplier payment', amt: 10000 }], total: 10000 });
    });
  }

  function remove() {
    var isS = function (r, k) { return r.sample || String(r[k] || '').slice(-TAG.length) === TAG; };
    return Promise.all(['biz', 'party', 'item', 'doc'].map(function (s) { return NSStore.list(s); }).concat([NSStore.meta('settings')])).then(function (L) {
      var sBiz = L[0].filter(function (b) { return isS(b, 'name'); }), names = sBiz.map(function (b) { return b.name; }), jobs = [];
      sBiz.forEach(function (b) { jobs.push(NSStore.del('biz', b.id)); });
      L[1].forEach(function (p) { if (isS(p, 'name')) jobs.push(NSStore.del('party', p.id)); });
      L[2].forEach(function (it) { if (isS(it, 'desc')) jobs.push(NSStore.del('item', it.id)); });
      L[3].forEach(function (d) { if (d.sample || names.indexOf(d.seller && d.seller.name) >= 0) jobs.push(NSStore.del('doc', d.id)); });
      /* sample groups go too, unless the user has put own parties, items or groups in them */
      var gl = function (s, k) { return L[s].filter(function (r) { return !isS(r, k); }).map(function (r) { return r.group; }); };
      var keep = { party: gl(1, 'name'), item: gl(2, 'desc') };
      jobs.push(NSStore.meta('groups').then(function (m) {
        if (!m || typeof m !== 'object') return;
        var cut = false;
        ['party', 'item'].forEach(function (k) {
          var list = Array.isArray(m[k]) ? m[k] : [];
          m[k] = list.filter(function (g) {
            var drop = g.sample && keep[k].indexOf(g.id) < 0 && !list.some(function (x) { return x.under === g.id && !x.sample; });
            if (drop) cut = true;
            return !drop;
          });
        });
        if (cut) return NSStore.meta('groups', m);
      }));
      var S = L[4];
      if (S && sBiz.some(function (b) { return b.id === S.defBiz; })) { S.defBiz = ''; jobs.push(NSStore.meta('settings', S)); }
      try { if (sBiz.some(function (b) { return b.id === localStorage.getItem('ns-app-biz'); })) localStorage.removeItem('ns-app-biz'); } catch (e) {}
      return Promise.all(jobs);
    });
  }

  function has(bizList) { return (bizList || []).some(function (b) { return b.sample || String(b.name || '').slice(-TAG.length) === TAG; }); }

  window.NSSample = { add: add, remove: remove, has: has };
})();
