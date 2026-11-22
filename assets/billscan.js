/* Scan a supplier bill (App, Purchases screen): a photo becomes a purchase bill DRAFT.
   - The photo is read on this device by Tesseract.js (OCR, WebAssembly). It is loaded only when this screen is opened, never at page start,
     from pinned versions on cdnjs (the library, with an integrity hash) and jsDelivr (worker, core and language data, each fetched once with
     an integrity hash before Tesseract uses it). The image is never uploaded: Tesseract gets a canvas, the only network traffic is the
     one-time download of the reader itself.
   - engine/billcore.js turns the text into fields and cross-checks the arithmetic. This file shows what was read and opens the App's
     normal purchase bill form with the draft, fields that were uncertain marked in yellow. NOTHING is saved until the user presses Save there.
   - The photo may be attached to the bill (the form's own attachment, removable) so the paper copy can be found later. */
(function () {
  'use strict';
  var A = window.NSApp, Bc = window.NSBill; if (!A || !Bc) return;
  var $ = NS.$, esc = NS.esc, t = function (k, v) { return NS.t('cap.' + k, v); };
  var LIB = ['https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js', 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F'];
  var JD = 'https://cdn.jsdelivr.net/npm/';
  var FILES = {
    worker: [JD + 'tesseract.js@5.1.1/dist/worker.min.js', 'sha384-zxn+VqofFzXpH99dUb3fa4ywoSBQJPy6/6oEaJHPlblZXr53a0g1Jl6720vgSzB7'],
    coreSimd: [JD + 'tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js', 'sha384-YM1G+zaWYy9VSRP2C101LCgzh7n3Hqb6OEm9qDoZYgCADsni3nnECskC3WialQB7'],
    core: [JD + 'tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js', 'sha384-EKWY5JDwphQoyxhvYU7eaCcyQ0EdV6fZK3L2vzfZcv2ichRdNd6pSnyWPNv6fMuR'],
    eng: [JD + '@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', 'sha384-JI+fraGAoc5GBGIliuqzHRnP1nJyrukg5ggNSBv/TO+YOVj+6Te6XXQOx7ia10xq'],
    hin: [JD + '@tesseract.js-data/hin@1.0.0/4.0.0_best_int/hin.traineddata.gz', 'sha384-F4qvNpxRMf0RkKxjV/kjU9e67o+1gxxbtSghe3RVwMxmklFon5/HSKDnNb7HwmDh']
  };
  var LANGPATH = { eng: JD + '@tesseract.js-data/eng@1.0.0/4.0.0_best_int', hin: JD + '@tesseract.js-data/hin@1.0.0/4.0.0_best_int' };
  var simd = false; try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) {}

  var dlg, photo = null, last = null, busy = false;
  function style() {
    if ($('#cap-style')) return;
    var s = document.createElement('style'); s.id = 'cap-style';
    s.textContent = '.cap-dlg{max-width:640px;width:calc(100% - 24px);border:1px solid var(--line,#ccc);border-radius:14px;padding:0;background:var(--bg,#fff);color:var(--ink,#111)}.cap-dlg::backdrop{background:rgba(0,0,0,.45)}' +
      '.cap-in{padding:14px 16px;display:grid;gap:10px}.cap-in h3{margin:0}.cap-bar{height:10px;border-radius:6px;background:var(--line,#ddd);overflow:hidden}.cap-bar i{display:block;height:100%;width:0;background:var(--brand,#0e746a);transition:width .2s}' +
      '.cap-chk{list-style:none;margin:0;padding:0;display:grid;gap:4px}.cap-chk li{padding:6px 8px;border-radius:8px;border:1px solid var(--line,#ddd);font-size:.92em}.cap-chk .ok{border-color:#2e9e5b}.cap-chk .warn{border-color:#d99a00;background:rgba(217,154,0,.12)}.cap-chk .bad{border-color:#d33;background:rgba(211,51,51,.1)}' +
      '.cap-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:0}.cap-kv dt{color:var(--soft,#666)}.cap-kv dd{margin:0;overflow-wrap:anywhere}.cap-pre{white-space:pre-wrap;max-height:180px;overflow:auto;font-size:.8em;background:var(--card,#f5f5f5);padding:8px;border-radius:8px}' +
      '.scan-check input,.scan-check select,.scan-check [data-sum]{outline:2px solid #d99a00;outline-offset:1px;background-image:linear-gradient(rgba(217,154,0,.12),rgba(217,154,0,.12))}.scan-miss input,.scan-miss select{outline:2px dashed #d33;outline-offset:1px}' +
      '.scan-note{border:1px solid #d99a00;border-radius:10px;padding:8px 10px;margin-bottom:10px;background:rgba(217,154,0,.1);font-size:.92em}.scan-note ul{margin:6px 0 0;padding-left:18px}';
    document.head.appendChild(s);
  }

  /* fetch a file with its integrity hash checked (the browser then keeps it, so Tesseract's own request is answered from the cache) */
  function verified(f) {
    return fetch(f[0], { integrity: f[1], mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); });
  }
  /* mode 'eng' reads English; mode 'hin' = Hindi bill: English reading for the numbers and codes (the Hindi model garbles digits and Latin letters),
     then a Hindi reading only for the Hindi words of the item rows */
  function langsOf(mode) { return mode === 'hin' ? ['eng', 'hin'] : ['eng']; }
  function ensureTesseract(mode, prog) {
    prog(t('stage_lib'), 0.02);
    return NS.loadJs(LIB[0], LIB[1]).then(function () {
      var core = simd ? FILES.coreSimd : FILES.core;
      return verified(FILES.worker).then(function () { prog(t('stage_lib'), 0.1); return verified(core); }).then(function () {
        prog(t('stage_lang'), 0.2);
        return langsOf(mode).reduce(function (p, l) { return p.then(function () { return verified(FILES[l]); }); }, Promise.resolve());
      });
    });
  }
  /* -> { text, hin } */
  function readAll(canvas, mode, prog) {
    return recognize(canvas, 'eng', prog).then(function (text) {
      if (mode !== 'hin') return { text: text, hin: '' };
      prog(t('stage_hin'), 0.9);
      return recognize(canvas, 'hin', function () {}).then(function (h) { return { text: text, hin: h }; }, function () { return { text: text, hin: '' }; });
    });
  }

  /* make the photo easier to read: upright (EXIF), at most 2400 px on the long side, grey, contrast stretched */
  function prepare(file) {
    return (window.createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }) : new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = URL.createObjectURL(file); })).then(function (img) {
      var w = img.width, h = img.height, k = Math.min(1, 2400 / Math.max(w, h)); if (Math.max(w, h) < 1400) k = Math.min(2, 1600 / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      /* uneven light (a shadow across the paper): the paper's own brightness is estimated from a heavily shrunk copy and divided out */
      var sm = document.createElement('canvas'); sm.width = Math.max(2, Math.ceil(c.width / 24)); sm.height = Math.max(2, Math.ceil(c.height / 24));
      var sx = sm.getContext('2d', { willReadFrequently: true }); sx.imageSmoothingQuality = 'high'; sx.drawImage(c, 0, 0, sm.width, sm.height);
      var bgc = document.createElement('canvas'); bgc.width = c.width; bgc.height = c.height;
      var bx = bgc.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, c.width, c.height);
      var bg = bx.getImageData(0, 0, c.width, c.height).data;
      var d = x.getImageData(0, 0, c.width, c.height), p = d.data, hist = new Uint32Array(256), i, g, b;
      for (i = 0; i < p.length; i += 4) {
        g = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114; b = Math.max(40, bg[i] * 0.299 + bg[i + 1] * 0.587 + bg[i + 2] * 0.114);
        g = Math.min(255, (g / b * 245) | 0); p[i] = g; hist[g]++;
      }
      var n = c.width * c.height, lo = 0, hi = 255, s = 0;
      for (i = 0; i < 256; i++) { s += hist[i]; if (s >= n * 0.01) { lo = i; break; } }
      s = 0; for (i = 255; i >= 0; i--) { s += hist[i]; if (s >= n * 0.2) { hi = i; break; } }   /* paper is the bright 20%: white point */
      var span = Math.max(40, hi - lo);
      for (i = 0; i < p.length; i += 4) { g = Math.max(0, Math.min(255, ((p[i] - lo) * 255 / span) | 0)); p[i] = p[i + 1] = p[i + 2] = g; }
      x.putImageData(d, 0, 0);
      return c;
    });
  }

  function recognize(canvas, lang, prog) {
    var worker = null;
    return window.Tesseract.createWorker(lang, 1, {
      workerPath: FILES.worker[0], corePath: JD + 'tesseract.js-core@5.1.1', langPath: LANGPATH[lang],
      logger: function (m) {
        if (!m || m.progress == null) return;
        if (m.status === 'recognizing text') prog(t('stage_read', { p: Math.round(m.progress * 100) }), 0.35 + 0.65 * m.progress);
        else if (/lang/.test(m.status)) prog(t('stage_lang'), 0.2 + 0.1 * m.progress);
        else prog(t('stage_lib'), 0.1 + 0.1 * m.progress);
      }
    }).then(function (w) {
      worker = w;
      return w.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1', user_defined_dpi: '300' });
    }).then(function () { return worker.recognize(canvas); }).then(function (r) { return worker.terminate().then(function () { return r.data.text; }); }, function (e) { if (worker) worker.terminate().catch(function () {}); throw e; });
  }

  function ctx() {
    var C = A.data(), b = A.biz() || {};
    return { ownGstin: b.gstin || '', ownState: b.state || (b.gstin ? b.gstin.slice(0, 2) : ''), parties: C.party, docs: A.mine(), today: NS.today() };
  }

  function checkLine(c) {
    var a = c.a, b = c.b, f = function (v) { return typeof v === 'number' && c.id !== 'rate' ? NS.money(v, false) : String(v); };
    return { cls: c.level, text: t('c_' + c.id + '_' + c.level, { a: a == null ? '' : f(a), b: b == null ? '' : f(b) }) };
  }
  function checksHtml(list) {
    var rows = list.filter(function (c) { return !(c.level === 'ok' && c.id === 'gstin'); }).map(checkLine);
    return '<ul class="cap-chk">' + rows.map(function (r) { return '<li class="' + r.cls + '">' + (r.cls === 'ok' ? '✓ ' : r.cls === 'warn' ? '⚠ ' : '✗ ') + esc(r.text) + '</li>'; }).join('') + '</ul>';
  }

  function build() {
    style();
    dlg = document.createElement('dialog'); dlg.className = 'cap-dlg'; dlg.setAttribute('aria-label', t('title'));
    document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { photo = null; });
  }
  function head() { return '<h3>' + esc(t('title')) + '</h3>'; }
  function pickScreen() {
    var lg = '';
    try { lg = localStorage.getItem('ns-cap-lang') || ''; } catch (e) {}
    dlg.innerHTML = '<div class="cap-in">' + head() + '<p class="soft">' + esc(t('intro')) + '</p><p class="soft">' + esc(t('first')) + '</p>' +
      '<div class="f"><label for="cap-file">' + esc(t('photo')) + '</label><input type="file" id="cap-file" accept="image/*"></div>' +
      '<div class="f"><label for="cap-lang">' + esc(t('lang')) + '</label><select id="cap-lang"><option value="eng"' + (lg !== 'hin' ? ' selected' : '') + '>' + esc(t('l_en')) + '</option><option value="hin"' + (lg === 'hin' ? ' selected' : '') + '>' + esc(t('l_hi')) + '</option></select></div>' +
      '<p class="soft">' + esc(t('tips')) + '</p><div class="dlg-foot"><button type="button" class="btn primary" id="cap-go" disabled>' + esc(t('read')) + '</button><button type="button" class="btn" data-capx>' + esc(t('cancel')) + '</button></div></div>';
    var f = $('#cap-file', dlg), go = $('#cap-go', dlg);
    f.addEventListener('change', function () { photo = f.files[0] || null; go.disabled = !photo; });
    $('[data-capx]', dlg).addEventListener('click', function () { dlg.close(); });
    go.addEventListener('click', function () { run($('#cap-lang', dlg).value); });
  }
  function progScreen() {
    dlg.innerHTML = '<div class="cap-in">' + head() + '<p id="cap-st" role="status" aria-live="polite"></p><div class="cap-bar"><i id="cap-pg"></i></div><p class="soft">' + esc(t('private')) + '</p></div>';
  }
  function prog(txt, frac) { var s = $('#cap-st', dlg), p = $('#cap-pg', dlg); if (s) s.textContent = txt; if (p) p.style.width = Math.round(frac * 100) + '%'; }

  function run(lang) {
    if (busy || !photo) return;
    busy = true; try { localStorage.setItem('ns-cap-lang', lang); } catch (e) {}
    progScreen(); prog(t('stage_prep'), 0.01);
    var file = photo, canvas;
    prepare(file).then(function (c) { canvas = c; return ensureTesseract(lang, prog); })
      .then(function () { prog(t('stage_read', { p: 0 }), 0.35); return readAll(canvas, lang, prog); })
      .then(function (r) {
        var parsed = Bc.parse(r.text, ctx()); if (r.hin) Bc.mergeHindi(parsed, r.hin);
        busy = false; last = { text: r.text + (r.hin ? ' --- ' + r.hin : ''), parsed: parsed, file: file, canvas: canvas };
        resultScreen();
      }).catch(function (e) {
        busy = false;
        dlg.innerHTML = '<div class="cap-in">' + head() + '<p>' + esc(navigator.onLine === false ? t('offline') : t('fail')) + '</p><div class="dlg-foot"><button type="button" class="btn primary" data-capagain>' + esc(t('again')) + '</button><button type="button" class="btn" data-capx>' + esc(t('cancel')) + '</button></div></div>';
        $('[data-capagain]', dlg).addEventListener('click', pickScreen); $('[data-capx]', dlg).addEventListener('click', function () { dlg.close(); });
      });
  }

  function shrunkPhoto(canvas) {
    var k = Math.min(1, 1400 / Math.max(canvas.width, canvas.height)), c = document.createElement('canvas');
    c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k); c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  function resultScreen() {
    var p = last.parsed, S = p.supplier, tax = NS.r2(p.cgst + p.sgst + p.igst);
    var match = S.match === 'gstin' ? t('m_gstin') : S.match === 'name' ? t('m_name', { n: S.name }) : t('m_new');
    function row(k, v) { return '<dt>' + esc(t(k)) + '</dt><dd>' + (v === '' || v == null ? '<i>—</i>' : esc(v)) + '</dd>'; }
    dlg.innerHTML = '<div class="cap-in">' + head() + '<h4 style="margin:0">' + esc(t('result')) + '</h4><dl class="cap-kv">' +
      row('f_supp', S.name + ' (' + match + ')') + row('f_gstin', S.gstin) + row('f_no', p.no) + row('f_date', p.date) + row('f_lines', p.items.length ? String(p.items.length) : '') +
      row('f_taxable', p.taxable ? NS.money(p.taxable) : '') + row('f_tax', tax ? NS.money(tax) + (p.gstRate != null ? ' (' + p.gstRate + '%)' : '') : '') + row('f_total', p.total ? NS.money(p.total) : '') + '</dl>' +
      '<h4 style="margin:0">' + esc(t('checks')) + '</h4>' + checksHtml(p.checks) +
      '<p class="soft">' + esc(t('confirm')) + '</p>' +
      '<details><summary>' + esc(t('text')) + '</summary><pre class="cap-pre" dir="auto">' + esc(last.text) + '</pre></details>' +
      '<div class="dlg-foot"><button type="button" class="btn primary" data-capopen>' + esc(t('open')) + '</button><button type="button" class="btn" data-capagain>' + esc(t('again')) + '</button><button type="button" class="btn" data-capx>' + esc(t('cancel')) + '</button></div></div>';
    $('[data-capopen]', dlg).addEventListener('click', openDraft);
    $('[data-capagain]', dlg).addEventListener('click', pickScreen);
    $('[data-capx]', dlg).addEventListener('click', function () { dlg.close(); });
  }

  function openDraft() {
    var p = last.parsed, draft = Bc.toDraft(p); draft.photo = shrunkPhoto(last.canvas);
    var st = p.status, bad = p.checks.filter(function (c) { return c.level !== 'ok'; });
    dlg.close();
    A.openForm('pbill', { draft: draft, after: function (form) {
      var map = { party: '#f-party', gstin: '#f-gstin', no: '#f-no', date: '#f-date', items: '[data-lines]', total: '[data-sum]' };
      Object.keys(map).forEach(function (k) {
        var el = $(map[k], form), box = el && (el.closest('.f') || el.closest('fieldset') || el);
        if (!box) return;
        if (st[k] === 'check' || (k === 'items' && bad.length) || (k === 'total' && bad.some(function (c) { return /total|inclusive|items_taxable/.test(c.id); }))) box.classList.add('scan-check');
        else if (st[k] === 'missing') box.classList.add('scan-miss');
      });
      var note = document.createElement('div'); note.className = 'scan-note'; note.setAttribute('role', 'note');
      note.innerHTML = '<b>' + esc(t('banner')) + '</b>' + (bad.length ? '<ul>' + bad.map(function (c) { return '<li>' + esc(checkLine(c).text) + '</li>'; }).join('') + '</ul>' : '');
      form.insertBefore(note, form.firstChild);
      form.addEventListener('input', function (e) { var b = e.target.closest && (e.target.closest('.scan-check') || e.target.closest('.scan-miss')); if (b && e.target.id) { b.classList.remove('scan-check', 'scan-miss'); } }, true);
    } });
  }

  A.scan = function () { if (!dlg) build(); photo = null; pickScreen(); dlg.showModal(); };
  /* a picture handed over (the NSBiz Helper add-on's screen snip): straight to the language choice, Read ready */
  A.scanFile = function (file) { if (!dlg) build(); photo = file; pickScreen(); var go = $('#cap-go', dlg); if (go) go.disabled = !file; dlg.showModal(); };
  window.NSBillScan = { prepare: prepare, recognize: recognize, ensure: ensureTesseract, ctx: ctx, run: function (file, mode) { return prepare(file).then(function (c) { return ensureTesseract(mode, function () {}).then(function () { return readAll(c, mode, function () {}); }); }); } };
})();
