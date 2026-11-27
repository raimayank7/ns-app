/* NSBiz App: "Marketplace and payment reports" (#mkimp), NSBiz Helper phase 7. App only, English only.
   - a marketplace's sales / tax report (Amazon MTR, Flipkart Sales Report, Meesho GST report, or any sales register)
     -> copies of the marketplace's invoices and credit notes in the books (for GSTR-1 and the party's balance), the TCS
     check (0.5 %) and the GSTR-1 Table 14 figures. The payout (fees, TCS, TDS, money received) stays in the Marketplace
     payout tool, which clears what the marketplace owes.
   - a payment gateway's report (Razorpay, Paytm, PhonePe) -> money received against open sale bills, and the gateway's
     fee (with GST input credit) per settlement.
   Nothing is saved until the person presses the Add / Record button; what is already in NSBiz is left out.
   #mkimp/<source>/<file name>: the add-on saw that report being downloaded and says which file to choose.
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var A = window.NSApp, NS = window.NS, M = window.NSMkt, B = window.NSBooks;
  if (!A || !NS || !M) return;
  var $ = NS.$, esc = NS.esc, XL = '/assets/vendor/xlsx-0.20.3.full.min.js';
  var NAMES = { amazon: ['Amazon.in', 'Amazon'], flipkart: ['Flipkart', 'Flipkart'], meesho: ['Meesho', 'Meesho'], other: ['', 'the marketplace'],
    razorpay: ['Razorpay', 'Razorpay'], paytm: ['Paytm', 'Paytm'], phonepe: ['PhonePe', 'PhonePe'] };
  var GW_STATE = { razorpay: '29', phonepe: '29', paytm: '09' };   /* where the gateway bills from (Karnataka, Uttar Pradesh): its tax invoice decides */
  var S = null;   /* the file read: { name, rows, k, lines?, pays? } */
  function money(n) { return NS.money(+n || 0); }
  function fy(d) { return NS.fy ? NS.fy(d) : ''; }

  function readRows(file) {
    if (/\.zip$/i.test(file.name)) return Promise.reject(new Error('zip'));
    if (/\.xlsx?$/i.test(file.name)) return NS.loadJs(XL, '').then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: 'array', cellDates: false });
      var name = wb.SheetNames.filter(function (n) { return /sales report|tcs_sales|^sheet1$/i.test(n); })[0] || wb.SheetNames[0];   /* Flipkart: the "Sales Report" sheet */
      return window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
    });
    return file.text().then(function (t) { return (window.NSBank ? window.NSBank.csvRows : csv)(t); });
  }
  function csv(t) { return String(t).split(/\r?\n/).map(function (l) { return l.split(','); }); }

  /* what is already saved for this business (read fresh: the screen's own copy can be a save behind) */
  function have() {
    var biz = String(A.bizName() || '').trim().toLowerCase();
    return NSStore.list('doc').then(function (L) { var o = {}; L.filter(function (d) { return String(d.seller && d.seller.name || '').trim().toLowerCase() === biz; }).forEach(function (d) { o[d.type + '|' + String(d.no || '').toUpperCase()] = 1; if (d.gw && d.gw.id) o['gw|' + d.gw.id] = 1; if (d.gw && d.gw.utr && d.type === 'exp') o['gwfee|' + d.gw.utr] = 1; }); o._docs = L; return o; });
  }
  function seller() { var b = A.biz() || {}; return JSON.parse(JSON.stringify(b)); }

  /* ---------- screens ---------- */
  function html(arg) {
    var p = String(arg || '').split('/'), src = p[0] || '', file = p.slice(1).join('/');
    if (arg) try { history.replaceState(null, '', '#mkimp'); } catch (e) {}
    var hint = file ? '<p class="note">Your browser just downloaded <b><bdi>' + esc(decodeURIComponent(file)) + '</bdi></b>' + (NAMES[src] ? ' from ' + esc(NAMES[src][1]) : '') + '. Choose it below: it is in your Downloads folder.</p>' : '';
    return '<div class="pane-hd"><h2>Marketplace and payment reports</h2></div>' +
      '<p class="soft">Bring in a report you downloaded: a marketplace’s sales (tax) report from Amazon, Flipkart or Meesho, or a payment report from Razorpay, Paytm or PhonePe. You see everything first; nothing is saved until you press Add or Record.</p>' + hint +
      '<div class="card"><label class="mk-pick">Report file (CSV or Excel) <input type="file" accept=".csv,.txt,.xlsx,.xls" data-mk-file></label>' +
      '<p class="soft">Meesho gives a ZIP: open it first and choose tcs_sales (and later tcs_sales_return). Amazon’s and Flipkart’s <b>payment</b> reports go into the <a href="https://marketplace.niveshsahayak.in/">Marketplace payout tool</a>.</p></div>' +
      '<div id="mk-out"></div>';
  }
  function wire(pane) {
    var inp = $('[data-mk-file]', pane), out = $('#mk-out', pane);
    if (!inp || !out) return;
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      out.innerHTML = '<p class="soft">Reading ' + esc(f.name) + '…</p>';
      readRows(f).then(function (rows) {
        var k = M.kind(rows);
        S = { name: f.name, rows: rows, k: k };
        if (!k) { out.innerHTML = '<div class="card"><p class="note bad">This file does not look like a marketplace sales report or a payment report NSBiz knows (no invoice no., date, state and taxable value headings found).</p></div>'; return; }
        if (k.type === 'none') { out.innerHTML = '<div class="card"><p class="note">' + esc(k.name) + '.</p></div>'; return; }
        return have().then(function (H) { if (k.type === 'sales') salesView(out, /return/i.test(f.name), H); else payView(out); });
      }, function (e) {
        out.innerHTML = '<div class="card"><p class="note bad">' + (e && e.message === 'zip' ? 'This is a ZIP file. Open it (double-click), then choose the report inside.' : 'The file could not be read. Choose the CSV or Excel file as downloaded.') + '</p></div>';
      });
    });
  }

  /* ---------- sales report ---------- */
  function salesView(out, isReturn, H) {
    var me = A.biz() || {}, r = M.sales(S.rows, S.k, { gstin: me.gstin || '', state: me.state || '', isReturn: isReturn });
    S.lines = r.lines;
    var nm = NAMES[S.k.src] || NAMES.other;
    var docs = M.salesDocs(r.lines, { party: nm[0] || 'Marketplace', srcName: nm[1] });
    var fresh = docs.filter(function (d) { return !H[d.type + '|' + String(d.no).toUpperCase()]; });
    var inv = fresh.filter(function (d) { return d.type === 'invoice'; }).length, cn = fresh.length - inv, b2b = fresh.filter(function (d) { return d.buyer.gstin; }).length;
    var tc = M.tcsCheck(r.lines), t14 = M.table14(r.lines), nopos = r.lines.filter(function (L) { return !L.pos; }).length;
    var sk = r.skipped, skip = [];
    if (sk.cancel) skip.push(sk.cancel + ' cancelled line' + (sk.cancel > 1 ? 's' : ''));
    if (sk.other) skip.push(sk.other + ' line' + (sk.other > 1 ? 's' : '') + ' of another GSTIN (another registration: bring them in under that business)');
    if (sk.empty) skip.push(sk.empty + ' line' + (sk.empty > 1 ? 's' : '') + ' without an invoice no., date or value');
    out.innerHTML = '<div class="card"><h3>' + esc(S.k.name) + '</h3>' +
      '<p>' + r.lines.length + ' lines: <b>' + inv + '</b> invoices and <b>' + cn + '</b> credit notes to add' + (b2b ? ' (' + b2b + ' to businesses with a GSTIN, they go to B2B in GSTR-1)' : '') + '. ' + (docs.length - fresh.length ? (docs.length - fresh.length) + ' are already in NSBiz and are left out.' : '') + '</p>' +
      (skip.length ? '<p class="soft">Left out: ' + esc(skip.join('; ')) + '.</p>' : '') +
      (nopos ? '<p class="note bad">' + nopos + ' lines have no state NSBiz knows: they would go without a place of supply. Check the state column.</p>' : '') +
      '<div class="ai-grid"><label class="ai-f"><span>The marketplace as a party (it collects the money)</span><input data-mk-party value="' + esc(nm[0] || '') + '" required></label>' +
      '<label class="ai-f"><span>Its GSTIN for your state (for GSTR-1 Table 14)</span><input data-mk-eco value="' + esc((r.lines.filter(function (L) { return L.eco; })[0] || {}).eco || '') + '" placeholder="From its TCS certificate or GSTR-2B"></label></div>' +
      '<p class="soft">Each document is a copy of the marketplace’s own invoice (same number and date), one line per GST rate at the taxable value, billed to the marketplace (the party that pays you); a business buyer’s GSTIN stays on the bill.</p>' +
      '<div class="row"><button type="button" class="btn primary" data-mk-add' + (fresh.length ? '' : ' disabled') + '>Add ' + inv + ' invoices and ' + cn + ' credit notes</button></div></div>' +
      '<div class="card"><h3>TCS kept by the marketplace</h3><p class="soft">GST TCS is 0.5 % of the net taxable sales (0.25 % CGST + 0.25 % SGST, or 0.5 % IGST, since 10 July 2024). It shows in your GST cash ledger once the marketplace files GSTR-8; the Marketplace payout tool books it as TCS receivable.</p>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Month</th><th class="n">Sales</th><th class="n">Returns</th><th class="n">Net taxable</th><th class="n">TCS in the report</th><th class="n">0.5 %</th><th class="n">Difference</th></tr></thead><tbody>' +
      tc.map(function (x) { return '<tr><td>' + esc(x.month) + '</td><td class="n">' + money(x.sales) + '</td><td class="n">' + money(x.returns) + '</td><td class="n">' + money(x.net) + '</td><td class="n">' + (x.missing ? 'not in this file' : money(x.tcs)) + '</td><td class="n">' + money(x.expected) + '</td><td class="n' + (x.diff && Math.abs(x.diff) > 1 ? ' bad' : '') + '">' + (x.diff == null ? '' : money(x.diff)) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="card"><h3>GSTR-1 Table 14(a): supplies through this marketplace</h3><p class="soft">Type these in Table 14(a) against the marketplace’s GSTIN. The same sales stay in the B2B / B2C tables too (the invoices added above).</p>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Month</th><th class="n">Net taxable</th><th class="n">IGST</th><th class="n">CGST</th><th class="n">SGST</th></tr></thead><tbody>' +
      t14.map(function (x) { return '<tr><td>' + esc(x.month) + '</td><td class="n">' + money(x.taxable) + '</td><td class="n">' + money(x.igst) + '</td><td class="n">' + money(x.cgst) + '</td><td class="n">' + money(x.sgst) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    $('[data-mk-add]', out).addEventListener('click', function (e) {
      var party = $('[data-mk-party]', out).value.trim(), eco = $('[data-mk-eco]', out).value.trim().toUpperCase();
      if (!party) { NS.toast('Type the marketplace’s name.', 'bad'); return; }
      if (eco && !M.gstinOk(eco)) { NS.toast('That GSTIN does not look right.', 'bad'); return; }
      e.target.disabled = true;
      var list = M.salesDocs(S.lines, { party: party, srcName: nm[1], seller: seller(), today: NS.today() });
      have().then(function (H2) {
        list = list.filter(function (d) { return !H2[d.type + '|' + String(d.no).toUpperCase()]; });
        list.forEach(function (d) { if (eco) d.mkt.eco = d.mkt.eco || eco; });
        return addParty(party, eco);
      }).then(function () {
        return NS.eachSeq(list, function (d) { return NSStore.put('doc', d); }, { label: 'Saving documents' }).then(function (r) { list.length = r.done; });
      }).then(function () {
        NS.toast(list.length + ' documents added for ' + party + '.');
        document.dispatchEvent(new CustomEvent('ns-data'));
        e.target.textContent = 'Added';
      }, function () { NS.toast('Could not save them all. Open the sales list to see what was added.', 'bad'); e.target.disabled = false; });
    });
  }
  function addParty(name, gstin) {
    return NSStore.list('party').then(function (L) {
      var k = name.trim().toLowerCase(), p = L.filter(function (x) { return String(x.name || '').trim().toLowerCase() === k; })[0];
      if (p) { if (gstin && !p.ecoGstin) { p.ecoGstin = gstin; return NSStore.put('party', p); } return; }
      /* the marketplace's own GSTIN is NOT its buyer GSTIN on these bills (that would put B2C sales in B2B): kept apart */
      return NSStore.put('party', { name: name.trim(), role: 'both', ecoGstin: gstin || '' });
    });
  }

  /* ---------- payment-gateway report ---------- */
  function payView(out) {
    var paise = M.looksPaise(S.rows, S.k);
    function draw() { return have().then(draw2); }
    function draw2(H) {
      var r = M.pays(S.rows, S.k, { paise: paise });
      var bills = B ? B.bills(H._docs, A.bizName()).bills : [];
      var mt = M.matchPays(r.lines, bills, (A.data().party || []));
      var open = bills.filter(function (b) { return b.side === 'recv' && b.left > 0.005; });
      S.pays = mt;
      var nm = NAMES[S.k.src][1], st = M.settlements(r.lines), me = A.biz() || {}, inter = (me.state || '') !== GW_STATE[S.k.src];
      var banks = A.banks ? A.banks() : [];
      var rows = mt.map(function (x, i) {
        var P = x.pay, done = H['gw|' + P.id];
        var sel = '<select data-mk-bill="' + i + '"' + (done || P.refund ? ' disabled' : '') + '><option value="">Not a bill: leave it</option>' +
          open.map(function (b) { return '<option value="' + esc(b.id) + '"' + (x.bill && x.bill.id === b.id ? ' selected' : '') + '>' + esc(b.no + ' · ' + b.party + ' · ' + money(b.left) + ' due') + '</option>'; }).join('') + '</select>';
        var why = done ? 'already in NSBiz' : P.refund ? 'refund (not recorded here)' : x.sure === 'no' ? 'bill no. in the payment' : x.sure === 'party' ? 'payer and amount' : x.sure === 'amount' ? 'only bill of that amount: check' : '';
        return '<tr><td>' + esc(P.date) + '</td><td><bdi>' + esc(P.id) + '</bdi>' + (P.ref ? '<br><span class="soft">' + esc(P.ref) + '</span>' : '') + '</td><td class="n">' + money(P.amount) + '</td><td class="n">' + money(P.fee) + '</td><td>' + sel + '</td><td class="soft">' + esc(why) + '</td></tr>';
      }).join('');
      out.innerHTML = '<div class="card"><h3>' + esc(S.k.name) + '</h3>' +
        (S.k.src === 'razorpay' ? '<label class="md-chk"><input type="checkbox" data-mk-paise' + (paise ? ' checked' : '') + '> Amounts are in paise (the file shows 118000 for ₹1,180)</label>' : '') +
        '<p>' + r.lines.length + ' payments. Pick the bill each one pays; the ones NSBiz is sure of are picked already. Payments left as "Not a bill" are not recorded.</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Payment</th><th class="n">Amount</th><th class="n">Fee + GST</th><th>Pays bill</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<h3>Settlements to your bank</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>UTR</th><th class="n">Payments</th><th class="n">Refunds</th><th class="n">Fee + GST</th><th class="n">Reached the bank</th></tr></thead><tbody>' +
        st.map(function (x) { return '<tr><td>' + esc(x.date) + '</td><td><bdi>' + esc(x.utr || '') + '</bdi></td><td class="n">' + money(x.amount) + '</td><td class="n">' + money(x.refunds) + '</td><td class="n">' + money(x.fee) + '</td><td class="n">' + money(x.net) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="ai-grid">' + (banks.length > 1 ? '<label class="ai-f"><span>Bank account the money reaches</span><select data-mk-bank>' + banks.map(function (b) { return '<option value="' + esc(b.k) + '">' + esc(A.bankLabel ? A.bankLabel(b) : b.k) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label class="md-chk"><input type="checkbox" data-mk-inter' + (inter ? ' checked' : '') + '> GST on ' + esc(nm) + '’s fee is IGST (its tax invoice comes from another state)</label></div>' +
        '<p class="soft">Recording makes one Money received entry per payment (into the bank, against the bill) and one expense per settlement for ' + esc(nm) + '’s fee, with its GST as input credit. Check the fee against ' + esc(nm) + '’s monthly tax invoice.</p>' +
        '<div class="row"><button type="button" class="btn primary" data-mk-rec>Record payments and fees</button></div></div>';
      var pz = $('[data-mk-paise]', out); if (pz) pz.addEventListener('change', function () { paise = pz.checked; draw(); });
      $('[data-mk-rec]', out).addEventListener('click', function (e) { e.target.disabled = true; record(out).then(function (n) { NS.toast(n.r + ' payments and ' + n.f + ' fee entries recorded.'); document.dispatchEvent(new CustomEvent('ns-data')); draw(); }, function () { NS.toast('Could not record them all.', 'bad'); e.target.disabled = false; }); });
    }
    draw();
  }
  function record(out) { return have().then(function (H) { return record2(out, H); }); }
  function record2(out, H) {
    var src = S.k.src, nm = NAMES[src][1], bank = ($('[data-mk-bank]', out) || {}).value || 'bank', inter = $('[data-mk-inter]', out).checked;
    var bills = B.bills(H._docs, A.bizName()).bills, byId = {}; bills.forEach(function (b) { byId[b.id] = b; });
    var me = seller(), jobs = [], n = { r: 0, f: 0 }, paid = {};
    S.pays.forEach(function (x, i) {
      var P = x.pay, sel = $('[data-mk-bill="' + i + '"]', out), b = sel && sel.value ? byId[sel.value] : null;
      if (!b || P.refund || H['gw|' + P.id]) return;
      paid[P.id] = 1;
      var amt = Math.min(P.amount, b.left);
      jobs.push({ type: 'receipt', app: 1, kind: 'pay', no: P.id, date: P.date, seller: me, buyer: { name: b.party, addr: '', phone: '', gstin: '', pan: '' },
        amount: P.amount, tds: '', mode: 'bank', bacct: bank, ref: nm + ' ' + P.id + (P.utr ? ', UTR ' + P.utr : ''), against: b.no, purpose: '', alloc: [{ id: b.id, no: b.no, amt: amt }],
        paper: 'a4', design: 'classic', copies: 1, total: P.amount, gw: { src: src, id: P.id, utr: P.utr || '' } });
      n.r++;
    });
    /* the fee of each settlement that has a recorded payment: an expense paid out of the bank (the gateway kept it) */
    M.settlements(S.pays.map(function (x) { return x.pay; }).filter(function (P) { return paid[P.id]; })).forEach(function (st) {
      if (!(st.fee > 0) || (st.utr && H['gwfee|' + st.utr])) return;
      jobs.push({ type: 'exp', app: 1, date: st.date, seller: me, cat: 'Payment gateway charges', amount: st.fee, mode: 'bank', bacct: bank, buyer: { name: nm }, no: st.utr || '', gst: 18, itc: true, inter: inter,
        notes: nm + ' fee on ' + st.n + ' payments' + (st.utr ? ', settlement UTR ' + st.utr : ''), total: st.fee, gw: { src: src, utr: st.utr || ('day ' + st.date) } });
      n.f++;
    });
    return NS.eachSeq(jobs, function (d) { return NSStore.put('doc', d).then(function (saved) { if (d.type === 'receipt' && A.markPaid) return A.markPaid(Object.assign({}, d, { id: saved && saved.id || d.id })); }); }, { label: 'Saving payments' }).then(function () { return n; });
  }

  A.addSection('mkimp', html, wire);
})();
