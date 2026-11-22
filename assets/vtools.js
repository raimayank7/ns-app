/* Voucher tools on the App's entry screens (owner 19 Nov 2026, from the Evershine and Busy videos):
   1. First / Back / Next / Last and Find by number: move through the saved vouchers of this kind without leaving the screen.
   2. The party's balance under the party box as soon as it is picked; cash in hand and bank balance on money vouchers.
   6. Purchase bill / return: the date it was entered in the books, kept apart from the supplier's bill date (d.idate).
   7. Copy: a new voucher made from the one on screen (new number, today's date); the day name next to every date.
   Hooks of app.js: NSApp.formTail / formWire / formSave (chained, like tdsbook.js). The App is English only. */
(function () {
  'use strict';
  var A = window.NSApp, B = window.NSBooks; if (!A || !B || !A.openForm) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, money = NS.money;
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  /* the saved vouchers each entry screen moves through */
  var KIND = {
    sale: function (d) { return d.type === 'invoice'; }, pbill: function (d) { return d.type === 'pbill' && d.kind !== 'return'; },
    pret: function (d) { return d.type === 'pbill' && d.kind === 'return'; }, min: function (d) { return d.type === 'receipt'; },
    mout: function (d) { return d.type === 'voucher'; }, exp: function (d) { return d.type === 'exp'; }, contra: function (d) { return d.type === 'contra'; }
  };
  var MONEY = { min: 1, mout: 1, contra: 1, exp: 1 }, COPY = { sale: 1, pbill: 1, pret: 1 };
  var VREG = { sale: 'sale', pbill: 'purchase', pret: 'pret', min: 'receipt', mout: 'payment', contra: 'contra', exp: 'expense' };   /* List: the register of each voucher */
  function listOf(kind) {
    var f = KIND[kind]; if (!f) return [];
    return (A.mine ? A.mine() : []).filter(function (d) { return d && d.id && f(d); })
      .sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')) || String(a.no || '').localeCompare(String(b.no || ''), undefined, { numeric: true }) || (a.created || 0) - (b.created || 0); });
  }
  function dlg() { return $('#app-form'); }
  /* Modify (the top menu, Busy style): the last saved voucher of this kind, with the Find box ready for another number */
  A.vtModify = function (kind) {
    var L = listOf(kind); if (!L.length) { NS.toast('Nothing saved yet: a new one opens'); A.openForm(kind); return; }
    A.openForm(kind, { rec: L[L.length - 1] }); setTimeout(function () { var f = $('#app-form .vt-find'); if (f) f.focus(); }, 300);
  };
  /* the next voucher replaces this one inside the same open screen: closing and opening again let the App show through
     for a moment (owner 19 Nov: the glitch before Next or Back) */
  function swap(fn, d) {
    var run = function () { if (d) d.removeAttribute('data-dirty'); if (window.NSStore && NSStore.sfRelease) NSStore.sfRelease(); fn(); if (d) d.scrollTop = 0; };
    if (!d || !d.open || !d.getAttribute('data-dirty')) { run(); return; }
    NS.ask(NS.t('app.vs_leave'), { ok: NS.t('app.vs_discard'), no: NS.t('app.vs_stay'), danger: 1 }).then(function (y) { if (y) run(); });
  }
  /* Preview: the bill as it prints (the maker's own paper in a frame), from what is typed now; nothing is saved */
  var pvDlg = null;
  function preview() {
    var d = A.formDoc && A.formDoc(), site = d && window.NSVDocs && NSVDocs.siteOf ? NSVDocs.siteOf(d) : '';
    if (!d || !site) { NS.toast('Preview is for bills and documents that print', 'warn'); return; }
    if (!pvDlg) {
      pvDlg = NS.el('dialog', { 'class': 'vt-pv', 'aria-labelledby': 'vt-pv-h' });
      pvDlg.innerHTML = '<div class="dlg-hd"><h2 id="vt-pv-h">Preview</h2><span class="soft">As it will print. Not saved yet.</span><button type="button" class="btn sm" data-pvx>Close</button></div><div class="vt-pvb"><p class="soft" data-pvw>Getting the preview ready…</p></div>';
      document.body.appendChild(pvDlg);
      pvDlg.addEventListener('click', function (e) { if (e.target.closest('[data-pvx]') || e.target === pvDlg) pvDlg.close(); });
      pvDlg.addEventListener('close', function () { var f = $('iframe', pvDlg); if (f) f.remove(); });
    }
    var box = $('.vt-pvb', pvDlg), wait = $('[data-pvw]', pvDlg); wait.hidden = false;
    var fr = document.createElement('iframe'); fr.title = 'Preview'; fr.className = 'vt-pvf'; fr.style.visibility = 'hidden';
    fr.src = '/do/' + site + '/?pv=1'; box.appendChild(fr); pvDlg.showModal();
    var tries = 0;
    (function on() {
      var w = null; try { w = fr.contentWindow; } catch (e) {}
      if (!(w && w.NSDocOut && w.NSDocOut.show)) { if (++tries < 150 && fr.isConnected) setTimeout(on, 100); else if (fr.isConnected) wait.textContent = 'The preview could not be made. Save and use Print instead.'; return; }
      var nodes = w.NSDocOut.show(d), doc = w.document, wrap = doc.createElement('div'); wrap.className = 'pv-only';
      nodes.forEach(function (n) { wrap.appendChild(n.cloneNode(true)); });
      var st = doc.createElement('style'); st.textContent = 'body>*:not(.pv-only){display:none!important}body{background:#e9edf2!important;margin:0;padding:16px}.pv-only{display:grid;gap:16px;justify-items:center}.pv-only .sh{box-shadow:0 2px 10px rgba(0,0,0,.18);background:#fff}';
      doc.head.appendChild(st); doc.body.appendChild(wrap); fr.style.visibility = ''; wait.hidden = true;
    })();
  }
  A.vtPreview = preview;
  function go(kind, rec) { swap(function () { A.openForm(kind, rec ? { rec: rec } : {}); }, dlg()); }
  function dayName(v) { if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return ''; var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-IN', { weekday: 'long' }); }
  function balText(b) { return !b ? 'Nil' : money(Math.abs(b)) + (b > 0 ? ' Dr (to receive)' : ' Cr (to pay)'); }

  var prevTail = A.formTail, prevWire = A.formWire, prevSave = A.formSave;
  A.formTail = function (kind, rec) {
    var h = prevTail ? prevTail(kind, rec) || '' : '';
    if (kind === 'pbill' || kind === 'pret')   /* 6: entry date (the bill's own date stays in Date) */
      h += '<div class="fg"><div class="f"><label for="f-idate">Entered in books on</label><input id="f-idate" type="date" value="' + esc(rec && rec.idate || NS.today()) + '"><small class="soft">The supplier\'s bill date stays in Date; this is the day it was entered.</small></div></div>';
    return h;
  };
  A.formSave = function (kind, d, form, F) {
    if (prevSave) prevSave(kind, d, form, F);
    var i = $('#f-idate', form); if (i && i.value) d.idate = i.value;
  };
  /* ---------- Print with copies on every voucher (owner 20 Nov: "some vouchers have no Print nor the voucher copy") ----------
     Sale: the tax invoice from the bill maker (its own copies: Original for recipient, Duplicate for transporter...).
     Every other voucher: an accounting voucher like Tally's (Particulars, Debit, Credit from the books' own entry, the items of a
     purchase, amount in words, narration, signatures), one page per copy: Original, Duplicate, Triplicate. Unsaved: saved first. */
  var CP = { o: ['ORIGINAL'], od: ['ORIGINAL', 'DUPLICATE'], odt: ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'], d: ['DUPLICATE'], t: ['TRIPLICATE'] };
  var CPL = [['o', 'Original'], ['od', 'Original + Duplicate'], ['odt', 'Original, Duplicate, Triplicate'], ['d', 'Duplicate only'], ['t', 'Triplicate only']];
  function cpGet(kind) { try { return localStorage.getItem('ns-vt-cp-' + kind) || 'o'; } catch (e) { return 'o'; } }
  function cpSet(kind, v) { try { localStorage.setItem('ns-vt-cp-' + kind, v); } catch (e) {} }
  function vtTitle(d) {
    var t = d.type || 'invoice';
    return t === 'receipt' ? 'RECEIPT VOUCHER' : t === 'voucher' ? 'PAYMENT VOUCHER' : t === 'contra' ? 'CONTRA VOUCHER' : t === 'jv' ? 'JOURNAL VOUCHER' :
      t === 'pbill' ? (d.kind === 'return' ? 'PURCHASE RETURN (DEBIT NOTE)' : 'PURCHASE VOUCHER') : t === 'exp' ? 'EXPENSE VOUCHER' : t === 'ob' ? 'OPENING BALANCE' : 'VOUCHER';
  }
  function vtSheet(d, tag) {
    var b = A.biz() || d.seller || {}, P = []; try { P = B.postings(d) || []; } catch (e) {}
    var pend = '';
    if (!P.length && /^(receipt|voucher)$/.test(d.type || '')) {   /* not in the books yet (a cheque not cleared): the money lines from the voucher itself */
      var am = +(A.amountOf ? A.amountOf(d) : d.amount) || 0, via = d.mode === 'cheque' ? 'Cheque in hand' : d.mode === 'cash' ? 'Cash' : 'Bank', who = B.partyName(d) || 'Party';
      P = d.type === 'receipt' ? [{ a: via, dr: am, cr: 0 }, { a: who, dr: 0, cr: am }] : [{ a: who, dr: am, cr: 0 }, { a: via, dr: 0, cr: am }];
      if (d.mode === 'cheque') pend = '<p class="vt-narr"><b>Cheque' + (d.chq && d.chq.no ? ' no. ' + esc(d.chq.no) : '') + ':</b> not yet cleared, so not yet in the books.</p>';
    }
    var an = function (a) { return /^(Cash|Bank|Cheque in hand|Party)$/.test(a) || a === B.partyName(d) ? a : A.accName ? A.accName(a, d) : a; }, td = 0, tc = 0, party = B.partyName(d) || d.emp || d.lender || '';
    var rows = P.map(function (l) { td += l.dr; tc += l.cr; return '<tr><td>' + (l.dr ? '<span class="vt-to">Dr</span> ' : '<span class="vt-to">Cr</span> ') + esc(an(l.a)) + '</td><td class="n">' + (l.dr ? money(l.dr, false) : '') + '</td><td class="n">' + (l.cr ? money(l.cr, false) : '') + '</td></tr>'; }).join('');
    var items = (d.items || []).filter(function (it) { return it && (it.desc || it.qty); });
    var itab = items.length ? '<table class="tbl st vt-items"><thead><tr><th>Item</th><th>HSN</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' +
      items.map(function (it) { var a = (+it.qty || 0) * (+it.rate || 0) * (1 - (+it.disc || 0) / 100); return '<tr><td>' + esc(it.desc || '') + '</td><td>' + esc(it.hsn || '') + '</td><td class="n">' + esc(String(it.qty || '')) + (it.unit ? ' ' + esc(it.unit) : '') + '</td><td class="n">' + money(+it.rate || 0, false) + '</td><td class="n">' + money(a, false) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
    var amt = Math.max(td, tc), note = d.notes || d.narr || d.note || '', money2 = /^(receipt|voucher|exp)$/.test(d.type || '');
    return '<div class="stsheet sh vch vt-vch" dir="ltr" lang="en" data-sheet>' + (d.cancelled ? '<div class="stamp cx-stamp">CANCELLED</div>' : '') +
      '<p class="vt-tag">' + esc(tag) + '</p>' +
      '<div class="st-hd"><div><b class="vch-biz">' + esc(b.name || '') + '</b>' + (b.addr ? '<br>' + esc(b.addr).replace(/\n/g, '<br>') : '') + ([b.city, b.pin].filter(Boolean).length ? '<br>' + esc([b.city, b.pin].filter(Boolean).join(' - ')) : '') + (b.gstin ? '<br>GSTIN ' + esc(b.gstin) : '') + '</div>' +
      '<div class="r"><b class="vch-ttl">' + vtTitle(d) + '</b>' + (d.type === 'pbill' ? (d.vno ? '<br>No. ' + esc(d.vno) : '') + '<br>Date ' + esc(A.ldate(d.date)) + (d.billNo || d.no ? '<br>Supplier bill ' + esc(d.billNo || d.no) : '') : '<br>No. ' + esc(d.no || d.vno || '') + '<br>Date ' + esc(A.ldate(d.date))) + '</div></div>' +
      (party ? '<p class="vt-party"><b>' + (d.type === 'receipt' ? 'Received from' : /^(voucher|exp)$/.test(d.type || '') ? 'Paid to' : d.type === 'pbill' ? 'Supplier' : 'Party') + ':</b> ' + esc(party) + '</p>' : '') +
      itab +
      '<table class="tbl st vt-post"><thead><tr><th>Particulars</th><th class="n">Debit</th><th class="n">Credit</th></tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr><th>Total</th><th class="n">' + money(td, false) + '</th><th class="n">' + money(tc, false) + '</th></tr></tfoot></table>' +
      '<p class="vt-words"><b>Amount in words:</b> ' + esc(NS.inWords(amt)) + '</p>' +
      (note ? '<p class="vt-narr"><b>Narration:</b> ' + esc(note) + '</p>' : '') + pend +
      '<div class="vch-sign"><div>Prepared by</div><div>Checked by</div><div>' + (money2 ? (d.type === 'receipt' ? 'Received by (for ' + esc(b.name || '') + ')' : 'Receiver\'s signature') : 'Authorised signatory') + '</div></div>' +
      NS.creditLine('st-ft') + '</div>';
  }
  function vtPrint(kind, d, cp) {
    if (!d) return;
    if ((d.type || 'invoice') === 'invoice' || d.type === 'cashmemo' || d.type === 'expinv') { var u = A.docUrl && A.docUrl(d); if (u) { var bx = dlg(); if (bx && bx.open) bx.close(); u += '&print=1' + (Array.isArray(cp) && cp.length ? '&cp=' + cp.join(',') : ''); if (!(A.openUrl && A.openUrl(u))) location.href = u; } return; }
    var host = $('#vch-print'); if (!host) { host = document.createElement('div'); host.id = 'vch-print'; host.className = 'vch-print'; document.body.appendChild(host); }
    host.innerHTML = (Array.isArray(cp) && cp.length ? cp : CP[cp] || CP.o).map(function (t) { return vtSheet(d, t); }).join('<div class="vt-pb"></div>');
    document.documentElement.classList.add('vch-on');
    var off = function () { window.removeEventListener('afterprint', off); document.documentElement.classList.remove('vch-on'); host.innerHTML = ''; };
    window.addEventListener('afterprint', off);
    setTimeout(function () { window.print(); }, 60);
  }
  A.vtPrint = vtPrint;
  /* ---------- Which copies to print (owner 22 Nov: "How will user select how many copies or which copies they want to print?") ----------
     A small box before every print: one tick per copy, any mix (only the Duplicate when the transporter's copy was lost). Bills, challans
     and notes use the copy names of the GST rules (Rule 48 and Rule 55); other vouchers Original, Duplicate, Triplicate. The first time
     a kind is printed, the number of copies set for that voucher type in Configure is ticked; after that, the ticks used last time. */
  function copySet(d, kind) {
    var t = d.type || 'invoice';
    if (t === 'invoice' || t === 'expinv') {
      var h = (d.items || []).map(function (it) { return String(it && it.hsn || '').replace(/\D/g, ''); }).filter(Boolean);
      return t === 'invoice' && h.length && h.every(function (x) { return /^99/.test(x); }) ? ['orig', 'dupsup'] : ['orig', 'dup', 'trip'];
    }
    if (t === 'challan') return ['dcorig', 'dcdup', 'dctrip'];
    if (t === 'note') return d.side === 'purchase' ? ['orig', 'ocopy'] : ['orig', 'dupsup'];
    if (t === 'cashmemo' || kind === 'vdoc') return null;   /* a cash memo, quotation, order...: one copy, no copy names */
    return ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'];
  }
  var CPN = { orig: 'Original for recipient', dup: 'Duplicate for transporter', trip: 'Triplicate for supplier', dupsup: 'Duplicate for supplier', ocopy: 'Office copy',
    dcorig: 'Original for consignee', dcdup: 'Duplicate for transporter', dctrip: 'Triplicate for consignor', ORIGINAL: 'Original', DUPLICATE: 'Duplicate', TRIPLICATE: 'Triplicate' };
  function cpName(k) { var v = NS.t('cp.' + k); return v && v !== 'cp.' + k ? v : CPN[k] || k; }
  function cpKey(kind, set) { return 'ns-vt-cpx-' + kind + '-' + set[0]; }
  function cpStart(kind, d, set) {
    var saved = null; try { saved = JSON.parse(localStorage.getItem(cpKey(kind, set)) || 'null'); } catch (e) {}
    if (Array.isArray(saved)) { saved = saved.filter(function (k) { return set.indexOf(k) >= 0; }); if (saved.length) return saved; }
    var old = set[0] === 'ORIGINAL' ? CP[cpGet(kind)] : null; if (old) return old.slice();   /* the copies list this voucher had before */
    var n = Math.min(set.length, Math.max(1, +d.copies || 1));
    try { var vc = NS.vtCfg && NS.cfgFor && A.cfg ? NS.vtCfg(NS.cfgFor(A.cfg(), d.seller), d.type || 'invoice', d.kind || '', d.vt) : null; if (vc && +vc.copies) n = Math.min(set.length, +vc.copies); } catch (e) {}
    return set.slice(0, n);
  }
  var cpDlg = null;
  function choose(kind, d) {
    var set = copySet(d, kind); if (!set) return Promise.resolve([]);
    var on = cpStart(kind, d, set);
    if (!cpDlg) {
      cpDlg = NS.el('dialog', { 'class': 'vt-cpd', 'aria-labelledby': 'vt-cpd-h' });
      document.body.appendChild(cpDlg);
    }
    cpDlg.innerHTML = '<form method="dialog"><div class="dlg-hd"><h2 id="vt-cpd-h">Print</h2></div>' +
      '<fieldset class="vt-cpf"><legend>Which copies?</legend>' + set.map(function (k, i) {
        return '<label class="vt-cpl"><input type="checkbox" value="' + k + '"' + (on.indexOf(k) >= 0 ? ' checked' : '') + '> <span><b>' + (i + 1) + '.</b> ' + esc(cpName(k)) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<p class="soft vt-cpn">Each ticked copy prints on its own page. Your ticks are kept for the next print of this kind.</p>' +
      '<p class="vt-cpw" role="alert" hidden>Tick at least one copy.</p>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary" value="ok" data-ic="print">Print</button><button type="submit" class="btn" value="cancel" formnovalidate>Cancel</button></div></form>';
    var f = $('form', cpDlg), boxes = [].slice.call(cpDlg.querySelectorAll('input[type=checkbox]'));
    return new Promise(function (res) {
      var done = false, fin = function (v) { if (done) return; done = true; res(v); };
      f.addEventListener('submit', function (e) {
        var ok = e.submitter ? e.submitter.value === 'ok' : true;
        if (!ok) return;
        var pick = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        if (!pick.length) { e.preventDefault(); $('.vt-cpw', cpDlg).hidden = false; boxes[0].focus(); return; }
        try { localStorage.setItem(cpKey(kind, set), JSON.stringify(pick)); } catch (er) {}
        fin(pick);
      });
      /* number keys 1-3 tick and untick, Enter prints */
      cpDlg.onkeydown = function (e) { var n = +e.key; if (n >= 1 && n <= boxes.length && !e.ctrlKey && !e.altKey) { e.preventDefault(); boxes[n - 1].checked = !boxes[n - 1].checked; boxes[n - 1].focus(); } };
      cpDlg.addEventListener('close', function () { fin(null); }, { once: true });
      cpDlg.showModal();
      var pb = $('button[value=ok]', cpDlg); if (pb) pb.focus();
    });
  }
  A.chooseCopies = choose;
  var KTYPE = { sale: 'invoice', pbill: 'pbill', pret: 'pbill', min: 'receipt', mout: 'voucher', contra: 'contra', exp: 'exp', jv: 'jv', ob: 'ob' };
  function addPrint(kind, form, F) {
    var ft = $('.dlg-foot', form), sv = ft && $('button[type=submit]', ft); if (!sv || $('[data-vtprint]', ft) || !KTYPE[kind]) return;
    var pr = function (d) { choose(kind, d).then(function (cp) { if (cp) vtPrint(kind, d, cp); }); };
    var pb = NS.el('button', { type: 'button', 'class': 'btn', 'data-vtprint': '', 'data-ic': 'print' }); pb.textContent = 'Print';
    pb.addEventListener('click', function () {
      var box = dlg(), dirty = box && box.getAttribute('data-dirty');
      if (F.rec && !dirty) { pr(F.rec); return; }
      /* not saved yet (or changed): save first, then print the voucher that was saved */
      var t0 = Date.now(), want = KTYPE[kind];
      sv.click();
      setTimeout(function () {
        var L = A.mine().filter(function (x) { return (x.type || 'invoice') === want && (x.updated || x.created || 0) >= t0 - 2000; }).sort(function (a, b) { return (b.updated || b.created || 0) - (a.updated || a.created || 0); });
        if (L[0]) pr(L[0]); else if (!box || !box.open) NS.toast('Saved. Open it again to print.');
      }, 1200);
    });
    var pv = $('[data-vtpv]', ft);
    if (pv) pv.insertAdjacentElement('afterend', pb); else sv.insertAdjacentElement('afterend', pb);
    var old = $('[data-andprint]', ft); if (old) old.hidden = true;   /* the expense's own Save + Print: the new Print saves too */
  }
  A.formWire = function (kind, form, F) {
    if (prevWire) prevWire(kind, form, F);
    var box = dlg(); if (!box) return;
    addPrint(kind, form, F);
    /* Preview next to Save on bills and documents that print */
    var ft = $('.dlg-foot', form), sv = ft && $('button[type=submit]', ft);
    if (sv && (kind === 'sale' || F.vd) && !$('[data-vtpv]', ft)) { var pb = NS.el('button', { type: 'button', 'class': 'btn', 'data-vtpv': '', 'data-ic': 'eye' }); pb.textContent = 'Preview'; pb.addEventListener('click', preview); sv.insertAdjacentElement('afterend', pb); }
    /* 7: the day name next to each date */
    $$('input[type=date]', form).forEach(function (inp) {
      var s = NS.el('small', { 'class': 'vt-day soft', 'aria-live': 'polite' }); inp.insertAdjacentElement('afterend', s);
      var put = function () { s.textContent = dayName(inp.value); }; put(); inp.addEventListener('input', put); inp.addEventListener('change', put);
    });
    /* 2: the party's balance as soon as it is picked */
    var pi = $('#f-party', form);
    if (pi) {
      var pb = NS.el('small', { 'class': 'vt-bal', 'aria-live': 'polite' }); (pi.closest('.f') || pi.parentNode).appendChild(pb);
      var show = function () {
        var k = key(pi.value); if (!k) { pb.textContent = ''; return; }
        var P = B.parties(A.data().doc || [], A.bizName()), p = P[k];
        pb.textContent = p ? 'Balance: ' + balText(p.bal) : (pi.value.trim() ? 'New party: no balance yet' : '');
        pb.classList.toggle('dr', !!(p && p.bal > 0)); pb.classList.toggle('cr', !!(p && p.bal < 0));
      };
      show(); pi.addEventListener('change', show); pi.addEventListener('input', function () { clearTimeout(pi._vtT); pi._vtT = setTimeout(show, 250); });
    }
    /* 2: cash in hand and bank on money vouchers */
    if (MONEY[kind]) {
      var acc = B.accounts(A.data().doc || [], A.bizName()), cash = acc.cash || 0, bank = 0;
      Object.keys(acc).forEach(function (a) { if (a === 'bank' || a.indexOf('bank:') === 0) bank += acc[a]; });
      form.insertAdjacentHTML('afterbegin', '<p class="vt-cash"><span>Cash in hand <b>' + esc(money(cash)) + '</b></span><span>Bank <b>' + esc(money(bank)) + '</b></span></p>');
    }
    /* 1 + 7: move through the saved vouchers, find one by number, copy the one on screen */
    if (!KIND[kind] || F.quick) return;
    var L = listOf(kind), at = F.rec ? L.map(function (d) { return d.id; }).indexOf(F.rec.id) : L.length;
    var hd = $('.dlg-h, .dlg-hd', box); if (!hd || $('.vt-nav', hd)) { var old = hd && $('.vt-nav', hd); if (old) old.remove(); }
    if (!hd) return;
    var btn = function (k, label, title, off) { return '<button type="button" class="btn sm" data-vtnav="' + k + '" title="' + esc(title) + '" aria-label="' + esc(title) + '"' + (off ? ' disabled' : '') + '>' + label + '</button>'; };
    var nav = NS.el('div', { 'class': 'vt-nav', role: 'group', 'aria-label': 'Saved vouchers' },
      btn('first', '|◀', 'First voucher', !L.length || at === 0) + btn('back', '◀', 'Back: the voucher before', !L.length || at <= 0) +
      '<span class="vt-pos soft">' + (F.rec && at >= 0 ? (at + 1) + ' of ' + L.length : 'New · ' + L.length + ' saved') + '</span>' +
      btn('next', '▶', 'Next voucher', at >= L.length - 1) + btn('last', '▶|', 'Last voucher', !L.length || at === L.length - 1) +
      '<input class="vt-find" type="search" placeholder="Find no." aria-label="Find a voucher by its number" autocomplete="off">' +
      btn('list', 'List', 'List: the register of these vouchers') +
      (COPY[kind] && F.rec ? btn('copy', 'Copy', 'Copy: a new voucher made from this one') : '') +
      (kind === 'sale' ? btn('einv', 'E-invoice / E-way bill', 'Make the e-invoice or e-way bill JSON of this bill', !F.rec) : ''));
    hd.appendChild(nav);
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vtnav]'); if (!b || b.disabled) return;
      var w = b.getAttribute('data-vtnav');
      if (w === 'list') { var reg = VREG[kind]; var bx = dlg(); if (bx && bx.open) bx.close(); if (A.vregOf) A.vregOf(reg); if (location.hash === '#vreg' && A.show) A.show(); else location.hash = '#vreg'; return; }
      if (w === 'einv') { var u = A.docUrl && F.rec ? A.docUrl(F.rec) : ''; if (!u) { NS.toast('Save the bill first', 'bad'); return; } var bx2 = dlg(); if (bx2 && bx2.open) bx2.close(); u += '&ei=1'; if (!(A.openUrl && A.openUrl(u))) location.href = u; return; }
      if (w === 'copy') {
        var c = JSON.parse(JSON.stringify(F.rec)); ['id', 'no', 'created', 'updated', 'status', 'paidBy', 'cancelled', 'irn', 'ewb', 'idate', 'vno'].forEach(function (x) { delete c[x]; }); c.date = NS.today();
        swap(function () { A.openForm(kind, { draft: c }); NS.toast('A copy: check it and press Save'); }, dlg()); return;
      }
      var i = w === 'first' ? 0 : w === 'last' ? L.length - 1 : w === 'back' ? (at > L.length - 1 ? L.length - 1 : at - 1) : at + 1;
      if (L[i]) go(kind, L[i]);
    });
    var fi = $('.vt-find', nav);
    fi.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation();
      var q = key(fi.value); if (!q) return;
      var hit = L.filter(function (d) { return key(d.no) === q; })[0] || L.filter(function (d) { return key(d.no).indexOf(q) >= 0 || key(d.no).slice(-q.length) === q; }).pop();
      if (hit) go(kind, hit); else NS.toast('No voucher with number ' + fi.value, 'bad');
    });
  };
})();
