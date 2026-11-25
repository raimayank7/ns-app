/* Free tools batch 2: PDF (owner 25 Nov 2026). Six tools on the App's Free tools screen (#ftools/<key>), registered with
   NSFreeTools.add(key, label, group, make):
   1. pdflock  Unlock or lock a PDF: a password PDF (bank statement, Form 26AS, AIS, e-PAN, salary slip, e-Aadhaar) opened with its
               password and saved again without it, text kept as text; or an open password and limits put on a PDF (AES-256).
   2. pdfxl    PDF to Excel: the words of a text PDF put back into rows and columns (bank statements, ledgers) and saved as .xlsx.
   3. pdfpic   PDF to pictures: pages as JPG or PNG at a chosen DPI, all pages or some, one file or a zip.
   4. pdfhide  Hide text in a PDF: black boxes drawn on the pages (or put on every place a word is found); the pages with boxes
               are saved as pictures so the hidden words are really gone from the file.
   5. pdfocr   Make a scanned PDF searchable: each picture page is read (English) and an invisible text layer is added, so the
               words can be searched and copied. The page itself is not changed.
   6. doccompare Compare two documents: two PDFs, Word files (.docx), text files or pasted texts; words added and removed, side by
               side or in one marked view, with counts; printable.
   Libraries: pdf-lib (@cantoo/pdf-lib 2.11.1, MIT, /assets/vendor/; this fork also opens and writes password PDFs: RC4 40/128,
   AES-128, AES-256), pdf.js (pdfjs-dist 3.11.174, Apache-2.0, the App's /vendor/), the App's own xlsx writer (engine/xlsx.js) and
   the zip writer of freetools.js. The reading of scanned pages uses Tesseract.js 5.1.1 (Apache-2.0) from the same pinned copies,
   checked with integrity hashes, as the bill photo reader (engine/billscan.js), so a reader fetched once serves both.
   Nothing is uploaded. The App is English only.
   The pure parts (lines, columns, numbers, page ranges, the word comparison, Word text) are in window.NSFtPdf for the node test
   scripts/test_ft-pdf.js. */
(function () {
  'use strict';
  var W = window;

  /* =====================================================================================================================
     PURE PARTS
     ===================================================================================================================== */
  var P = {};

  /* text items of one page ({ str, transform, width }) -> lines [{ y, h, items: [{ x, x2, s }] }], top of the page first.
     Items closer than 2.2 pt on one line join into one piece (a word split by the PDF maker). */
  P.linesOf = function (items) {
    var L = [];
    (items || []).forEach(function (it) {
      var s = String(it.str || '').replace(/\s+/g, ' '); if (!s.trim()) return;
      var x = it.transform[4], y = it.transform[5], w = it.width || s.length * 4, h = Math.abs(it.transform[3]) || 8;
      var line = null;
      for (var i = 0; i < L.length; i++) if (Math.abs(L[i].y - y) <= Math.max(2.5, h * 0.35)) { line = L[i]; break; }
      if (!line) { line = { y: y, h: h, items: [] }; L.push(line); }
      line.items.push({ x: x, x2: x + w, s: s.trim() });
    });
    L.forEach(function (l) {
      l.items.sort(function (a, b) { return a.x - b.x; });
      var m = []; l.items.forEach(function (it) { var p = m[m.length - 1]; if (p && it.x - p.x2 < 2.2) { p.s += (it.x - p.x2 > 0.6 ? ' ' : '') + it.s; p.x2 = Math.max(p.x2, it.x2); } else m.push({ x: it.x, x2: it.x2, s: it.s }); });
      l.items = m;
    });
    return L.sort(function (a, b) { return b.y - a.y; });
  };

  /* where the columns split: an empty strip down the page (no word of any table line in it) at least `gap` points wide.
     Only lines with two or more separate pieces count (a title or a page number on its own line would cover every gap). */
  P.columnsOf = function (lines, gap) {
    gap = gap || 6;
    var multi = lines.filter(function (l) { return l.items.length >= 2; });
    if (!multi.length) return [];
    var lo = Infinity, hi = -Infinity;
    multi.forEach(function (l) { l.items.forEach(function (it) { lo = Math.min(lo, it.x); hi = Math.max(hi, it.x2); }); });
    var n = Math.ceil(hi - lo) + 1, cov = new Uint16Array(n);
    multi.forEach(function (l) {
      var seen = new Uint8Array(n);
      l.items.forEach(function (it) { for (var k = Math.floor(it.x - lo); k <= Math.ceil(it.x2 - lo) && k < n; k++) if (k >= 0) seen[k] = 1; });
      for (var k = 0; k < n; k++) cov[k] += seen[k];
    });
    var thr = Math.floor(multi.length * 0.02), cuts = [], run = -1;
    for (var k = 0; k <= n; k++) {
      var empty = k < n && cov[k] <= thr;
      if (empty && run < 0) run = k;
      else if (!empty && run >= 0) { if (k - run >= gap && run > 0 && k < n) cuts.push(Math.round((lo + (run + k) / 2) * 10) / 10); run = -1; }
    }
    return cuts;
  };

  var DATEISH = /^\d{1,2}[\/\-. ]([A-Za-z]{3,9}|\d{1,2})[\/\-. ,]{1,2}\d{2,4}\b/;
  var AMOUNT = /^\(?-?\s*(₹|rs\.?|inr)?\s*\d{1,3}(,\d{2,3})*(\.\d{1,2})?\)?(\s*(cr|dr))?$|^\(?-?\d+(\.\d{1,2})?\)?(\s*(cr|dr))?$/i;
  P.isDate = function (s) { return DATEISH.test(String(s || '').trim()); };
  P.isAmount = function (s) { s = String(s || '').trim(); return !!s && /\d/.test(s) && AMOUNT.test(s); };
  /* a cell -> a number Excel can add up, or the text as it is. "1,23,456.50" -> 123456.5, "(500.00)" -> -500. Codes with a
     leading 0 (account numbers, PIN) and long numbers stay text; "1,200.00 Cr" stays text (the Cr/Dr would be lost). */
  P.toNumber = function (s) {
    var t = String(s == null ? '' : s).trim(); if (!t) return '';
    if (!/^\(?-?\s*(₹|rs\.?|inr)?\s*[\d,]*\d(\.\d+)?\)?$/i.test(t)) return t;
    var neg = /^\(.*\)$/.test(t) || /^\(?-/.test(t), core = t.replace(/^[(\-\s]+|\)$/g, '').replace(/^(₹|rs\.?|inr)\s*/i, ''), d = core.replace(/,/g, '');
    if (/^0\d/.test(d) || d.replace('.', '').length > 15) return t;
    if (/,/.test(core) && !/^\d{1,3}(,\d{2,3})*(\.\d+)?$/.test(core)) return t;   /* commas in odd places: not an amount */
    var n = parseFloat(d); if (!isFinite(n)) return t;
    return neg ? -n : n;
  };

  /* pages of lines -> rows of cells. o: { gap, join (a line without a date or amount joins the dated row above), skipOne (lines
     with only one cell left out), drop: [x of cuts taken away, so two columns become one] }. -> { rows, cuts, keep } */
  P.tableOf = function (pages, o) {
    o = o || {};
    var all = [], pg = [], drop = o.drop || [];
    pages.forEach(function (ls, i) { ls.forEach(function (l) { all.push(l); pg.push(i); }); });
    var cuts = P.columnsOf(all, o.gap).filter(function (c) { return !drop.some(function (d) { return Math.abs(d - c) < 0.5; }); });
    var rows = all.map(function (l) {
      var r = cuts.map(function () { return ''; }).concat(['']);
      l.items.forEach(function (it) { var c = 0; while (c < cuts.length && it.x + 1 > cuts[c]) c++; r[c] = r[c] ? r[c] + ' ' + it.s : it.s; });
      return r;
    });
    var filled = function (r) { return r.filter(function (c) { return String(c).trim(); }).length; };
    var out = [], last = -1;
    rows.forEach(function (r, i) {
      var prev = out[out.length - 1], l = all[i], pl = last >= 0 ? all[last] : null;
      /* only a line just under the row (same page, no wider gap than one and a half lines): a page footer further down stays apart */
      if (o.join && prev && prev.some(P.isDate) && !r.some(P.isDate) && !r.some(P.isAmount) && filled(r) <= 2 && pg[i] === pg[last] && pl.y - l.y <= Math.max(l.h, pl.h) * 1.8) {
        r.forEach(function (v, j) { if (v) prev[j] = prev[j] ? prev[j] + ' ' + v : v; });
        last = i; return;
      }
      out.push(r); last = i;
    });
    if (o.skipOne) out = out.filter(function (r) { return filled(r) >= 2; });
    /* columns left empty in every row are dropped (keep[j] says which of the cut columns stayed) */
    var keep = cuts.map(function () { return false; }).concat([false]).map(function (x, j) { return out.some(function (r) { return String(r[j] || '').trim(); }); });
    out = out.map(function (r) { return r.filter(function (x, j) { return keep[j]; }); });
    return { rows: out, cuts: cuts, keep: keep };
  };
  /* rows from the heading row on; a heading printed again on later pages is kept only once */
  P.fromHead = function (rows, from) {
    var r = rows.slice(Math.max(0, (from || 1) - 1)); if (!r.length) return r;
    var head = r[0].join('|');
    return [r[0]].concat(r.slice(1).filter(function (x) { return x.join('|') !== head; }));
  };

  /* "1-3, 5, 8-" of n pages -> [1, 2, 3, 5, 8, 9, ...]; empty = all; null when it makes no sense */
  P.parseRange = function (s, n) {
    s = String(s || '').trim(); if (!s) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a; }
    var out = [], ok = true;
    s.split(/[,;]+/).forEach(function (part) {
      part = part.trim(); if (!part) return;
      var m = /^(\d*)\s*(?:-|to|–)\s*(\d*)$/i.exec(part), a, b;
      if (m && (m[1] || m[2])) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; } else if (/^\d+$/.test(part)) a = b = +part; else { ok = false; return; }
      if (a < 1 || b > n || a > b) { ok = false; return; }
      for (var k = a; k <= b; k++) if (out.indexOf(k) < 0) out.push(k);
    });
    return ok && out.length ? out.sort(function (x, y) { return x - y; }) : null;
  };

  /* ---------- comparing two texts ---------- */
  /* Myers' difference (1986): the fewest words removed and added. A, B: arrays of keys. -> [['=', i, j] | ['-', i] | ['+', j]] in order,
     or null when the two differ in more than `limit` places (the caller then shows "all taken out, all added"). */
  P.myers = function (A, B, limit) {
    var N = A.length, M = B.length, MAX = N + M, off = MAX + 1, V = new Int32Array(2 * MAX + 3), trace = [], lim = limit || 4000;
    for (var d = 0; d <= MAX; d++) {
      if (d > lim) return null;
      trace.push(V.slice(off - d - 1, off + d + 2));
      for (var k = -d; k <= d; k += 2) {
        var x = (k === -d || (k !== d && V[off + k - 1] < V[off + k + 1])) ? V[off + k + 1] : V[off + k - 1] + 1, y = x - k;
        while (x < N && y < M && A[x] === B[y]) { x++; y++; }
        V[off + k] = x;
        if (x >= N && y >= M) return back(trace, N, M);
      }
    }
    return back(trace, N, M);
  };
  function back(trace, N, M) {
    var ops = [], x = N, y = M;
    for (var d = trace.length - 1; d >= 0; d--) {
      var v = trace[d], k = x - y, dd = d;
      var at = function (kk) { return v[kk + dd + 1]; };
      var pk = (k === -d || (k !== d && at(k - 1) < at(k + 1))) ? k + 1 : k - 1, px = at(pk), py = px - pk;
      while (x > px && y > py) { ops.push(['=', x - 1, y - 1]); x--; y--; }
      if (d > 0) { if (x === px) ops.push(['+', y - 1]); else ops.push(['-', x - 1]); }
      x = px; y = py;
    }
    return ops.reverse();
  }
  /* words and paragraph marks. o: { icase, ipunct } -> { w: [shown words], k: [keys compared] } */
  P.tokens = function (text, o) {
    o = o || {};
    var w = [], k = [];
    String(text || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      if (!line.trim()) return;
      if (w.length) { w.push('\n'); k.push('\n'); }
      line.split(/[ \t ]+/).forEach(function (t) {
        if (!t) return;
        var key = t; if (o.icase) key = key.toLowerCase(); if (o.ipunct) key = key.replace(/[^\p{L}\p{N}]+/gu, '') || t;
        w.push(t); k.push(key);
      });
    });
    return { w: w, k: k };
  };
  /* the two texts -> { ops: [{ t: '=' | '-' | '+', w: [words] }], same, added, removed } (words; paragraph marks '\n' are not counted).
     Paragraphs are matched first, then the words inside the paragraphs that changed: fast on long contracts, and a word far away
     is not matched by chance. */
  P.compare = function (a, b, o) {
    var A = P.tokens(a, o), B = P.tokens(b, o), out = [];
    function push(t, words) { if (!words.length) return; var l = out[out.length - 1]; if (l && l.t === t) l.w = l.w.concat(words); else out.push({ t: t, w: words.slice() }); }
    function paras(T) { var p = [], cur = { w: [], k: [] }; T.w.forEach(function (x, i) { if (x === '\n') { p.push(cur); cur = { w: [], k: [] }; } else { cur.w.push(x); cur.k.push(T.k[i]); } }); if (cur.w.length) p.push(cur); return p; }
    var PA = paras(A), PB = paras(B);
    var la = PA.map(function (p) { return p.k.join(' '); }), lb = PB.map(function (p) { return p.k.join(' '); });
    var lops = P.myers(la, lb, 3000) || la.map(function (x, i) { return ['-', i]; }).concat(lb.map(function (x, j) { return ['+', j]; }));
    var delA = [], insB = [], started = false;
    function words(list, Pp) { var w = [], k = []; list.forEach(function (i, n) { if (n) { w.push('\n'); k.push('\n'); } w = w.concat(Pp[i].w); k = k.concat(Pp[i].k); }); return { w: w, k: k }; }
    function flush() {
      if (!delA.length && !insB.length) return;
      var x = words(delA, PA), y = words(insB, PB), ops = P.myers(x.k, y.k, 4000);
      if (!ops) { push('-', x.w); push('+', y.w); }
      else ops.forEach(function (op) { if (op[0] === '=') push('=', [y.w[op[2]]]); else if (op[0] === '-') push('-', [x.w[op[1]]]); else push('+', [y.w[op[1]]]); });
      delA = []; insB = [];
    }
    lops.forEach(function (op) {
      if (op[0] === '=') { flush(); if (started) push('=', ['\n']); push('=', PB[op[2]].w); started = true; }
      else { if (started && !delA.length && !insB.length) push('=', ['\n']); started = true; if (op[0] === '-') delA.push(op[1]); else insB.push(op[1]); }
    });
    flush();
    var cnt = { '=': 0, '-': 0, '+': 0 };
    out.forEach(function (g) { g.w.forEach(function (x) { if (x !== '\n') cnt[g.t]++; }); });
    return { ops: out, same: cnt['='], removed: cnt['-'], added: cnt['+'] };
  };

  /* ---------- Word files (.docx): a zip; the text is in word/document.xml ---------- */
  P.unzip = function (buf) {
    var u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), e = -1;
    for (var i = u.length - 22; i >= Math.max(0, u.length - 65600); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) return Promise.reject(new Error('zip'));
    var cnt = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true), jobs = [], files = {}, dec = new TextDecoder();
    for (var n = 0; n < cnt; n++) {
      if (p + 46 > u.length || dv.getUint32(p, true) !== 0x02014b50) break;
      var meth = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(u.subarray(p + 46, p + 46 + nl));
      var start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      jobs.push(inflate(meth, u.subarray(start, start + csize)).then(setter(files, name)));
      p += 46 + nl + xl + cl;
    }
    return Promise.all(jobs).then(function () { return files; });
  };
  function setter(files, name) { return function (b) { files[name] = b; }; }
  function inflate(meth, data) {
    if (meth === 0) return Promise.resolve(data);
    if (meth !== 8 || typeof DecompressionStream === 'undefined') return Promise.resolve(null);
    var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(); w.write(data); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function unxml(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); }).replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); }).replace(/&amp;/g, '&'); }
  /* word/document.xml -> text, one paragraph a line (in tables each cell's paragraph is a line) */
  P.docxText = function (xml) {
    var out = [];
    String(xml || '').replace(/<w:p[\s>][\s\S]*?<\/w:p>|<w:p\/>/g, function (p) {
      var t = '';
      p.replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g, function (m, txt) { t += txt != null ? unxml(txt) : /tab/.test(m) ? '\t' : '\n'; return m; });
      out.push(t); return p;
    });
    return out.join('\n');
  };
  P.docxFile = function (buf) {
    return P.unzip(buf).then(function (f) { var d = f['word/document.xml']; if (!d) throw new Error('docx'); return P.docxText(new TextDecoder().decode(d)); });
  };

  /* ---------- the invisible text of a read word: where it sits on the PDF page ----------
     p0 = bottom-left, p1 = bottom-right, p2 = top-left of the word, already in PDF page points -> { x, y, angle (radians), w, h } */
  P.wordBox = function (p0, p1, p2) {
    return { x: p0[0], y: p0[1], angle: Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), w: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), h: Math.hypot(p2[0] - p0[0], p2[1] - p0[1]) };
  };
  /* the part of a word the PDF's standard font can hold (WinAnsi): other letters are left out of the hidden text */
  P.ansi = function (s) { return String(s || '').replace(/[^\x20-\x7e -ÿ]/g, '').trim(); };

  /* the lock tool's choices -> pdf-lib's encrypt() settings. Without limits the owner password is the open password. */
  P.encryptOpts = function (o) {
    var r = { userPassword: o.open || '' };
    if (o.limit) {
      r.ownerPassword = o.owner;
      r.permissions = { printing: o.print ? 'highResolution' : false, copying: !!o.copy, modifying: !!o.change, annotating: !!o.change, fillingForms: !!o.change, contentAccessibility: true, documentAssembly: !!o.change };
    } else r.ownerPassword = o.open;
    return r;
  };

  W.NSFtPdf = P;

  /* =====================================================================================================================
     SCREENS
     ===================================================================================================================== */
  var NS = W.NS; if (!W.NSApp || !NS || !W.NSFreeTools || typeof document === 'undefined') return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var PDFLIB = '/assets/vendor/pdf-lib-cantoo-2.11.1.min.js', PDFJS = '/vendor/pdf.min.js', PDFW = '/vendor/pdf.worker.min.js';
  /* Tesseract.js 5.1.1: the same pinned files and integrity hashes as engine/billscan.js */
  var TLIB = ['https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js', 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F'];
  var JD = 'https://cdn.jsdelivr.net/npm/';
  var TF = {
    worker: [JD + 'tesseract.js@5.1.1/dist/worker.min.js', 'sha384-zxn+VqofFzXpH99dUb3fa4ywoSBQJPy6/6oEaJHPlblZXr53a0g1Jl6720vgSzB7'],
    coreSimd: [JD + 'tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js', 'sha384-YM1G+zaWYy9VSRP2C101LCgzh7n3Hqb6OEm9qDoZYgCADsni3nnECskC3WialQB7'],
    core: [JD + 'tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js', 'sha384-EKWY5JDwphQoyxhvYU7eaCcyQ0EdV6fZK3L2vzfZcv2ichRdNd6pSnyWPNv6fMuR'],
    eng: [JD + '@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', 'sha384-JI+fraGAoc5GBGIliuqzHRnP1nJyrukg5ggNSBv/TO+YOVj+6Te6XXQOx7ia10xq']
  };
  var simd = false; try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) {}

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function base(n) { return String(n || 'file').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '-'); }
  function kb(n) { return n < 1024 ? n + ' bytes' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(2) + ' MB'; }
  function canvasOf(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function blobOf(c, type, q) { return new Promise(function (r) { c.toBlob(function (b) { r(b); }, type, q); }); }
  function pdfLib() { return NS.loadJs(PDFLIB).then(function () { if (!W.PDFLib) throw new Error('load'); return W.PDFLib; }); }
  function pdfJs() { return NS.loadJs(PDFJS).then(function () { var l = W.pdfjsLib; if (!l) throw new Error('load'); l.GlobalWorkerOptions.workerSrc = PDFW; return l; }); }
  function libFail() { NS.toast('The PDF part did not load. Open NSBiz once with the internet on, then it works offline too.', 'bad'); }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name); }
  function fileBtn(id, label, accept, multi, primary) {
    return '<label class="btn' + (primary ? ' primary' : '') + '" for="' + id + '">' + label + '</label><input type="file" id="' + id + '" class="sr" accept="' + accept + '"' + (multi ? ' multiple' : '') + '>';
  }
  function onFiles(node, sel, fn) {
    var inp = $(sel, node); if (inp) inp.addEventListener('change', function () { var l = [].slice.call(inp.files); inp.value = ''; if (l.length) fn(l); });
    node.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); node.classList.add('fz-drop'); } });
    node.addEventListener('dragleave', function (e) { if (e.target === node) node.classList.remove('fz-drop'); });
    node.addEventListener('drop', function (e) { if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); node.classList.remove('fz-drop'); fn([].slice.call(e.dataTransfer.files)); });
  }
  function later() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function setDpi(blob, dpi) {   /* the DPI written into a JPEG's JFIF header */
    return blob.arrayBuffer().then(function (b) {
      var u = new Uint8Array(b);
      if (u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF && u[3] === 0xE0 && u[6] === 0x4A && u[7] === 0x46 && u[8] === 0x49 && u[9] === 0x46) { u[13] = 1; u[14] = u[16] = (dpi >> 8) & 255; u[15] = u[17] = dpi & 255; }
      return new Blob([u], { type: blob.type });
    });
  }
  function style() {
    if ($('#fp-style')) return;
    var s = document.createElement('style'); s.id = 'fp-style';
    s.textContent = [
      '.fp-st{min-height:1.4em;margin:8px 0;font-weight:600;overflow-wrap:anywhere}',
      '.fp-pw{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;margin:6px 0}',
      '.fp-pw label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:.9rem;min-width:0;max-width:100%}',
      '.fp-pw input[type=password],.fp-pw input[type=text],.fp-pw input:not([type]){min-height:40px;width:min(300px,100%);box-sizing:border-box}',
      '.fp-pw label.fz-chk{flex-direction:row;align-items:center;gap:8px;min-height:40px}',
      '.fp-tw{overflow:auto;max-height:60vh;border:1px solid var(--line);border-radius:var(--r);margin:10px 0;max-width:100%}',
      '.fp-tbl{border-collapse:collapse;font-size:.85rem;min-width:100%}',
      '.fp-tbl td,.fp-tbl th{border:1px solid var(--line);padding:4px 6px;vertical-align:top;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis;text-align:left}',
      '.fp-tbl thead th{background:var(--surface2);position:sticky;top:0;z-index:1;font-weight:600}',
      '.fp-tbl td.n{text-align:right;font-variant-numeric:tabular-nums}',
      '.fp-tbl tr.fp-head td{font-weight:700;background:var(--surface2)}',
      '.fp-tbl tr.fp-off td{opacity:.45}',
      '.fp-tbl .btn.sm{min-height:32px;padding:2px 8px;font-size:.78rem;margin-left:4px}',
      '.fp-pages{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:14px;margin:12px 0}',
      '.fp-page{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:8px;min-width:0}',
      '.fp-page>p{margin:4px 0 8px;font-weight:600;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:space-between}',
      '.fp-draw{position:relative;line-height:0;user-select:none;-webkit-user-select:none;border:1px solid var(--line)}',
      '.fp-draw img{width:100%;height:auto;display:block;pointer-events:none;background:#fff}',
      '.fp-draw.on{touch-action:none;cursor:crosshair}',
      '.fp-box{position:absolute;background:rgba(0,0,0,.85);outline:2px solid #F5A524;box-sizing:border-box;cursor:move;touch-action:none}',
      '.fp-box:focus-visible{outline:3px solid #F5A524;outline-offset:2px}',
      '.fp-box button{position:absolute;right:-13px;top:-13px;width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:#B42318;color:#fff;font:700 15px/22px system-ui,sans-serif;padding:0;cursor:pointer;text-align:center}',
      '.fp-cmp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}',
      '@media (max-width:760px){.fp-cmp{grid-template-columns:minmax(0,1fr)}}',
      '.fp-side{min-width:0}.fp-side h4{margin:0 0 6px;overflow-wrap:anywhere}',
      '.fp-side textarea{width:100%;min-height:160px;box-sizing:border-box;font:inherit;font-size:.9rem;margin-top:4px}',
      '.fp-out{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;line-height:1.75;overflow-wrap:anywhere;max-height:70vh;overflow:auto}',
      '.fp-out del,.fp-del{background:rgba(180,35,24,.14);color:var(--bad);text-decoration:line-through}',
      '.fp-out ins,.fp-ins{background:rgba(15,122,67,.16);color:var(--ok);text-decoration:underline;text-decoration-thickness:2px}',
      '.fp-sum{display:flex;flex-wrap:wrap;gap:8px 16px;margin:8px 0;align-items:baseline}.fp-sum b{font-size:1.1rem}',
      '.fp-bar{height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin:6px 0}.fp-bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .2s}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function status(n, msg, kind) { var s = $('[data-st]', n); if (!s) return; s.textContent = msg || ''; s.className = 'fp-st' + (kind === 'bad' ? ' fz-bad' : kind === 'ok' ? ' fz-ok' : ''); }
  function bar(n, f) { var b = $('[data-bar]', n); if (!b) return; b.hidden = f == null; if (f != null) $('i', b).style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; }
  var PWHINT = 'Banks and the tax department usually build it from your date of birth, PAN or name: their e-mail or website says how. The password is used only here and is not saved.';

  /* a PDF password box (pdf.js asks through it) */
  function askPassword(again, what) {
    return new Promise(function (res) {
      var d = el('dialog', 'fz-dlg');
      d.style.maxWidth = '460px';
      d.innerHTML = '<form method="dialog"><h3>' + (again ? 'Wrong password. Try again' : 'This PDF has a password') + '</h3>' +
        '<p class="soft">' + esc(what || 'Type the password to open it.') + ' ' + PWHINT + '</p>' +
        '<input type="password" data-pwin autocomplete="off" aria-label="PDF password" style="width:100%;min-height:40px;box-sizing:border-box">' +
        '<div class="pr-bar" style="margin-top:12px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancel</button><button class="btn primary">Open</button></div></form>';
      document.body.appendChild(d);
      var inp = $('[data-pwin]', d), done = function (v) { try { d.close(); } catch (e) {} d.remove(); res(v); };
      $('[data-x]', d).addEventListener('click', function () { done(null); });
      $('form', d).addEventListener('submit', function (e) { e.preventDefault(); done(inp.value); });
      d.addEventListener('cancel', function (e) { e.preventDefault(); done(null); });
      d.showModal(); inp.focus();
    });
  }
  /* open a PDF with pdf.js; asks for the password when it has one. -> { doc, pw } */
  function openPdf(bytes, name) {
    return pdfJs().then(function (lib) {
      function go(pw, tries) {
        var o = { data: new Uint8Array(bytes.slice(0)), isEvalSupported: false };   /* CVE-2024-4367: a PDF's fonts never run code */
        if (pw != null) o.password = pw;
        return lib.getDocument(o).promise.then(function (doc) { return { doc: doc, pw: pw }; }, function (err) {
          if (err && err.name === 'PasswordException' && tries < 6) return askPassword(err.code === 2, name ? name + ' is locked.' : '').then(function (p) { if (p == null) throw new Error('cancel'); return go(p, tries + 1); });
          throw err;
        });
      }
      return go(null, 0);
    });
  }
  function openFail(n, e) {
    if (e && e.message === 'cancel') { status(n, 'Not opened: no password given.'); return; }
    if (e && e.message === 'load') { libFail(); status(n, ''); return; }
    status(n, 'Could not open this file' + (e && e.name === 'InvalidPDFException' ? ': it is not a valid PDF.' : '. It may be damaged.'), 'bad');
  }
  function pageLines(doc, k) { return doc.getPage(k).then(function (p) { return p.getTextContent(); }).then(function (tc) { return P.linesOf(tc.items); }); }
  /* pdf-lib copy of the file (a locked file needs its password again; one with only an owner password opens with '') */
  function libDoc(L, bytes, pw) { return L.PDFDocument.load(bytes.slice(0), { password: pw == null ? '' : pw }); }
  function render(doc, k, scale) {
    return doc.getPage(k).then(function (p) {
      var v = p.getViewport({ scale: scale }), c = canvasOf(v.width, v.height), x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      return p.render({ canvasContext: x, viewport: v }).promise.then(function () { return { c: c, v: v, page: p }; });
    });
  }
  function maxScale(p, dpi) {   /* a page picture stays under 40 million pixels and 10,000 px a side (browser limits) */
    var v = p.getViewport({ scale: 1 }), s = dpi / 72;
    if (Math.max(v.width, v.height) * s > 10000) s = 10000 / Math.max(v.width, v.height);
    if (v.width * v.height * s * s > 4e7) s = Math.sqrt(4e7 / (v.width * v.height));
    return s;
  }
  function pages(n) { return n + ' page' + (n === 1 ? '' : 's'); }

  /* =====================================================================================================================
     1. UNLOCK OR LOCK A PDF
     ===================================================================================================================== */
  function lockNode() {
    style();
    var n = el('div', 'fz-tool'), U = null, K = null, LK = { limit: false, print: true, copy: false, change: false };
    n.innerHTML = '<h3>Unlock or lock a PDF</h3>' +
      '<div class="pr-bar" role="group" aria-label="Unlock or lock"><button type="button" class="btn primary" data-lm="un" aria-pressed="true">Unlock a PDF</button><button type="button" class="btn" data-lm="lk" aria-pressed="false">Lock a PDF</button></div>' +
      '<div data-lp="un"><p class="soft">Bank statements, Form 26AS, AIS, e-PAN, salary slips and e-Aadhaar often come as PDFs with a password. Type the password once and save a copy that opens without it. The text stays as text: it can still be searched and copied. Nothing leaves this computer, and the file you open is not changed.</p>' +
        '<div class="pr-bar">' + fileBtn('fp-un-file', 'Open a locked PDF', '.pdf,application/pdf', false, true) + '</div><div data-unbody></div></div>' +
      '<div data-lp="lk" hidden><p class="soft">Put a password on a PDF before you send it, for example a salary slip or a statement. Whoever opens the file must type the password. You can also stop printing, copying or changes. Nothing leaves this computer; a new PDF is saved.</p>' +
        '<div class="pr-bar">' + fileBtn('fp-lk-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '</div><div data-lkbody></div></div>' +
      '<p class="fp-st" data-st role="status" aria-live="polite"></p>';
    function mode(m) {
      $$('[data-lm]', n).forEach(function (b) { var on = b.getAttribute('data-lm') === m; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', on); });
      $$('[data-lp]', n).forEach(function (p) { p.hidden = p.getAttribute('data-lp') !== m; }); status(n, '');
    }
    $$('[data-lm]', n).forEach(function (b) { b.addEventListener('click', function () { mode(b.getAttribute('data-lm')); }); });

    /* ---- unlock ---- */
    var unBody = $('[data-unbody]', n);
    function unPaint() {
      if (!U) { unBody.innerHTML = ''; return; }
      if (!U.enc) { unBody.innerHTML = '<div class="fz-card"><p><b>' + esc(U.name) + '</b> has no password. It opens as it is: there is nothing to unlock.</p></div>'; return; }
      unBody.innerHTML = '<div class="fz-card"><p><b>' + esc(U.name) + '</b> (' + kb(U.bytes.byteLength) + ') is locked.</p>' +
        '<form class="fp-pw" data-unform><label>Password <input type="password" data-unpw autocomplete="off"></label>' +
        '<label class="fz-chk"><input type="checkbox" data-unshow> Show</label>' +
        '<button class="btn primary" data-ic="download">Unlock and save</button></form>' +
        '<p class="fz-note">' + PWHINT + '</p></div>';
      var pw = $('[data-unpw]', unBody); pw.focus();
      $('[data-unshow]', unBody).addEventListener('change', function (e) { pw.type = e.target.checked ? 'text' : 'password'; });
      $('[data-unform]', unBody).addEventListener('submit', function (e) { e.preventDefault(); unlock(pw.value); });
    }
    function saveUnlocked(doc, name, msg) {
      return doc.save({ useObjectStreams: false }).then(function (out) {
        var nm = base(name) + ' (unlocked).pdf';
        NS.saveFile(new Blob([out], { type: 'application/pdf' }), nm);
        status(n, 'Saved "' + nm + '" (' + kb(out.length) + '). ' + msg, 'ok');
      });
    }
    function unlock(pw) {
      if (!U) return;
      if (!pw) { status(n, 'Type the password.', 'bad'); return; }
      status(n, 'Unlocking…');
      pdfLib().then(function (L) {
        return L.PDFDocument.load(U.bytes.slice(0), { password: pw }).then(null, function (e) { if (/password/i.test(e && e.message)) throw new Error('pw'); throw e; });
      }).then(function (doc) { return saveUnlocked(doc, U.name, 'It opens without a password. Keep it safe: anyone with this copy can now read it.'); })
        .catch(function (e) {
          if (e && e.message === 'pw') { status(n, 'Wrong password. Check capital and small letters and try again.', 'bad'); var f = $('[data-unpw]', unBody); if (f) { f.select(); f.focus(); } return; }
          if (e && e.message === 'load') { libFail(); return; }
          status(n, 'Could not unlock this PDF. It may use a kind of lock this tool cannot open.', 'bad');
        });
    }
    onFiles($('[data-lp="un"]', n), '#fp-un-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) {
        return pdfLib().then(function (L) {
          return L.PDFDocument.load(b.slice(0), { ignoreEncryption: true }).then(function (d) {
            U = { name: f.name, bytes: b, enc: d.isEncrypted };
            if (!U.enc) { unPaint(); status(n, ''); return; }
            /* only an owner password (limits on printing or copying, no open password): it opens with an empty password */
            return L.PDFDocument.load(b.slice(0), { password: '' }).then(function (doc) {
              unBody.innerHTML = '<div class="fz-card"><p><b>' + esc(f.name) + '</b> opens without a password, but it had limits on printing, copying or changes. The copy has no limits.</p></div>';
              return saveUnlocked(doc, f.name, 'Printing and copying now work.');
            }, function () { unPaint(); status(n, ''); });
          });
        });
      }).catch(function (e) { U = null; unPaint(); if (e && e.message === 'load') libFail(); else status(n, 'Could not read this file. Is it a PDF?', 'bad'); });
    });

    /* ---- lock ---- */
    var lkBody = $('[data-lkbody]', n);
    function lkPaint() {
      if (!K) { lkBody.innerHTML = ''; return; }
      lkBody.innerHTML = '<div class="fz-card"><p><b>' + esc(K.name) + '</b> (' + kb(K.bytes.byteLength) + ', ' + pages(K.pages) + ')</p>' +
        '<form data-lkform>' +
        '<div class="fz-row"><label>Password to open <input type="password" data-p1 autocomplete="new-password"></label><label>Type it again <input type="password" data-p2 autocomplete="new-password"></label>' +
        '<label class="fz-chk"><input type="checkbox" data-show> Show</label></div>' +
        '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-lim' + (LK.limit ? ' checked' : '') + '> Also limit what can be done with the file</label></div>' +
        '<div data-limbox' + (LK.limit ? '' : ' hidden') + '><div class="fz-row"><label class="fz-chk"><input type="checkbox" data-pr' + (LK.print ? ' checked' : '') + '> Allow printing</label>' +
        '<label class="fz-chk"><input type="checkbox" data-cp' + (LK.copy ? ' checked' : '') + '> Allow copying text</label><label class="fz-chk"><input type="checkbox" data-ch' + (LK.change ? ' checked' : '') + '> Allow changes and comments</label></div>' +
        '<div class="fz-row"><label>Password to change these limits <input type="password" data-op autocomplete="new-password"></label></div>' +
        '<p class="fz-note">Keep this second password with you. It must be different from the open password. Most PDF readers respect the limits, but some programs ignore them: they are not strong protection.</p></div>' +
        '<div class="pr-bar"><button class="btn primary" data-ic="download">Lock and save</button></div></form>' +
        '<p class="fz-note">The new PDF is locked with AES-256, the strongest lock PDF readers know. Keep the password safe: without it nobody, not even NSBiz, can open the file.</p></div>';
      var f = $('[data-lkform]', lkBody);
      $('[data-show]', f).addEventListener('change', function (e) { $$('[data-p1],[data-p2],[data-op]', f).forEach(function (i) { i.type = e.target.checked ? 'text' : 'password'; }); });
      $('[data-lim]', f).addEventListener('change', function (e) { LK.limit = e.target.checked; $('[data-limbox]', f).hidden = !LK.limit; });
      f.addEventListener('change', function (e) { var t = e.target; if (t.matches('[data-pr]')) LK.print = t.checked; else if (t.matches('[data-cp]')) LK.copy = t.checked; else if (t.matches('[data-ch]')) LK.change = t.checked; });
      f.addEventListener('submit', function (e) { e.preventDefault(); lock($('[data-p1]', f).value, $('[data-p2]', f).value, $('[data-op]', f).value); });
      $('[data-p1]', f).focus();
    }
    function lock(p1, p2, op) {
      if (!p1) { status(n, 'Type a password to open the file.', 'bad'); return; }
      if (p1 !== p2) { status(n, 'The two passwords are not the same. Type them again.', 'bad'); return; }
      if (p1.length < 4) { status(n, 'Use at least 4 letters or numbers for the password.', 'bad'); return; }
      if (LK.limit && !op) { status(n, 'Type the password to change the limits.', 'bad'); return; }
      if (LK.limit && op === p1) { status(n, 'The password to change the limits must be different from the open password.', 'bad'); return; }
      status(n, 'Locking…');
      pdfLib().then(function (L) {
        return libDoc(L, K.bytes, K.pw).then(function (doc) {
          doc.encrypt(P.encryptOpts({ open: p1, owner: op, limit: LK.limit, print: LK.print, copy: LK.copy, change: LK.change }));
          return doc.save({ useObjectStreams: false });
        });
      }).then(function (out) {
        var nm = base(K.name) + ' (locked).pdf';
        NS.saveFile(new Blob([out], { type: 'application/pdf' }), nm);
        status(n, 'Saved "' + nm + '". It asks for the password when it is opened.', 'ok');
      }).catch(function (e) { if (e && e.message === 'load') libFail(); else status(n, 'Could not lock this PDF. It may be damaged.', 'bad'); });
    }
    onFiles($('[data-lp="lk"]', n), '#fp-lk-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) {
        return openPdf(b, f.name).then(function (o) { K = { name: f.name, bytes: b, pw: o.pw, pages: o.doc.numPages }; o.doc.destroy(); lkPaint(); status(n, o.pw != null ? 'This file had a password; the new lock replaces it.' : ''); });
      }).catch(function (e) { K = null; lkPaint(); openFail(n, e); });
    });
    return n;
  }

  /* =====================================================================================================================
     2. PDF TO EXCEL
     ===================================================================================================================== */
  var GAPS = [[3, 'More columns (small gaps count)'], [6, 'Normal'], [12, 'Fewer columns (only wide gaps count)']];
  function xlNode() {
    style();
    var n = el('div', 'fz-tool'), X = null, O = { gap: 6, join: true, skipOne: true, nums: true, drop: [], from: 1 };
    n.innerHTML = '<h3>PDF to Excel</h3><p class="soft">Takes the table out of a PDF, such as a bank statement or a ledger, and saves it as an Excel file. It works on PDFs made by a computer, where the text can be selected. A scanned PDF has no text: first use "Make a scanned PDF searchable". Nothing leaves this computer.</p>' +
      '<div class="pr-bar">' + fileBtn('fp-xl-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '</div>' +
      '<p class="fp-st" data-st role="status" aria-live="polite"></p><div data-xlbody></div>';
    var body = $('[data-xlbody]', n);
    function paint() {
      if (!X) { body.innerHTML = ''; return; }
      var t = P.tableOf(X.pages, O), rows = t.rows; X.t = t;
      var cols = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0), head = Math.min(Math.max(1, O.from), Math.max(1, rows.length)); O.from = head;
      var keepIdx = []; t.keep.forEach(function (k, j) { if (k) keepIdx.push(j); });
      body.innerHTML = '<div class="fz-card"><p><b>' + esc(X.name) + '</b>: ' + pages(X.pages.length) + ', ' + rows.length + ' rows, ' + cols + ' columns.</p>' +
        '<div class="fz-row"><label>Column gaps <select data-gap>' + GAPS.map(function (g) { return '<option value="' + g[0] + '"' + (g[0] === O.gap ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>Heading is row <input type="number" min="1" max="' + Math.max(1, rows.length) + '" data-from value="' + head + '" inputmode="numeric"></label></div>' +
        '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-join' + (O.join ? ' checked' : '') + '> Join a narration that runs onto the next line</label>' +
        '<label class="fz-chk"><input type="checkbox" data-one' + (O.skipOne ? ' checked' : '') + '> Leave out lines with only one cell (titles, page numbers)</label>' +
        '<label class="fz-chk"><input type="checkbox" data-nums' + (O.nums ? ' checked' : '') + '> Amounts as numbers</label></div>' +
        '<p class="fz-note">Rows above the heading row are left out; the heading printed again on later pages is kept once. Two columns that should be one? Press "Join" in the first of them. Too many or too few columns? Change "Column gaps".' + (O.drop.length ? ' <button type="button" class="btn sm" data-unjoin>Undo the joins</button>' : '') + '</p>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-xlgo data-ic="download">Save as Excel</button><button type="button" class="btn" data-xlclr>Close this PDF</button></div></div>' +
        '<div class="fp-tw" tabindex="0" role="region" aria-label="The rows found"><table class="fp-tbl"><thead><tr><th scope="col">Row</th>' +
        keepIdx.map(function (j, c) {
          var nx = keepIdx[c + 1], cutsBetween = nx == null ? [] : t.cuts.slice(j, nx);   /* cut j is the right edge of column j */
          return '<th scope="col">Column ' + (c + 1) + (cutsBetween.length ? ' <button type="button" class="btn sm" data-joinc="' + cutsBetween.join(',') + '" aria-label="Join column ' + (c + 1) + ' with column ' + (c + 2) + '">Join →</button>' : '') + '</th>';
        }).join('') + '</tr></thead><tbody>' +
        rows.slice(0, 300).map(function (r, i) {
          return '<tr' + (i + 1 === head ? ' class="fp-head"' : i + 1 < head ? ' class="fp-off"' : '') + '><th scope="row">' + (i + 1) + '</th>' + r.map(function (c) { var v = O.nums && i + 1 > head ? P.toNumber(c) : c; return '<td' + (typeof v === 'number' ? ' class="n"' : '') + ' title="' + esc(c) + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' + (rows.length > 300 ? '<p class="fz-note">Showing the first 300 rows. All ' + rows.length + ' go into the Excel file.</p>' : '');
    }
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-gap]')) { O.gap = +t.value; O.drop = []; }
      else if (t.matches('[data-join]')) O.join = t.checked; else if (t.matches('[data-one]')) O.skipOne = t.checked; else if (t.matches('[data-nums]')) O.nums = t.checked;
      else if (t.matches('[data-from]')) O.from = Math.max(1, Math.round(+t.value || 1));
      else return;
      paint();
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-joinc]');
      if (b) { O.drop = O.drop.concat(b.getAttribute('data-joinc').split(',').map(Number)); paint(); var nb = $('[data-joinc]', body) || $('[data-unjoin]', body); if (nb) nb.focus(); return; }
      if (e.target.closest('[data-unjoin]')) { O.drop = []; paint(); return; }
      if (e.target.closest('[data-xlclr]')) { X = null; paint(); status(n, ''); return; }
      if (e.target.closest('[data-xlgo]')) save();
    });
    function save() {
      var rows = P.fromHead(X.t.rows, O.from);
      if (rows.length < 2) { status(n, 'No rows under the heading row. Check "Heading is row".', 'bad'); return; }
      var width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
      var data = rows.map(function (r, i) { var o = []; for (var j = 0; j < width; j++) { var c = r[j] == null ? '' : r[j]; o.push(i && O.nums ? P.toNumber(c) : String(c)); } return o; });
      data[0] = data[0].map(function (c, j) { return String(c).trim() ? c : 'Column ' + (j + 1); });
      NS.loadLazy(['xlsx.js']).then(function () {
        var nm = base(X.name) + '.xlsx', widths = data[0].map(function (h, j) { return Math.min(50, Math.max(10, data.slice(0, 200).reduce(function (m, r) { return Math.max(m, String(r[j]).length); }, 0) + 2)); });
        NS.saveFile(NS.xlsx.write([['From PDF', data, widths]]), nm);
        status(n, 'Saved "' + nm + '": a heading and ' + (data.length - 1) + ' rows. Check the totals against the PDF before you use it.', 'ok');
      }, function () { status(n, 'The Excel part did not load. Try again with the internet on.', 'bad'); });
    }
    onFiles(n, '#fp-xl-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) { return openPdf(b, f.name); }).then(function (o) {
        var ks = []; for (var k = 1; k <= Math.min(o.doc.numPages, 500); k++) ks.push(k);
        return Promise.all(ks.map(function (k) { return pageLines(o.doc, k); })).then(function (pgs) {
          var big = o.doc.numPages > 500; o.doc.destroy();
          if (!pgs.some(function (p) { return p.length; })) { X = null; paint(); status(n, 'This PDF has no text, only pictures of pages (a scan). Use "Make a scanned PDF searchable" first, then open the new file here.', 'bad'); return; }
          X = { name: f.name, pages: pgs }; O.drop = [];
          var t = P.tableOf(pgs, O), hi = 0;
          /* the heading row: the first that names a date and an amount word, else row 1 */
          for (var i = 0; i < t.rows.length; i++) { var s = t.rows[i].join(' ').toLowerCase(); if (/date/.test(s) && /(balance|amount|debit|credit|withdrawal|deposit|particulars|narration)/.test(s)) { hi = i; break; } }
          O.from = hi + 1;
          paint(); status(n, big ? 'Only the first 500 pages were read.' : '');
        });
      }).catch(function (e) { openFail(n, e); });
    });
    return n;
  }

  /* =====================================================================================================================
     3. PDF TO PICTURES
     ===================================================================================================================== */
  function picNode() {
    style();
    var n = el('div', 'fz-tool'), D = null, O = { dpi: 150, fmt: 'jpg', q: 0.9, range: '', out: 'zip' }, busy = false;
    n.innerHTML = '<h3>PDF to pictures</h3><p class="soft">Saves the pages of a PDF as JPG or PNG pictures, for WhatsApp, a portal or a website. Nothing leaves this computer.</p>' +
      '<div class="pr-bar">' + fileBtn('fp-pi-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '</div>' +
      '<div data-pibody></div><div class="fp-bar" data-bar hidden><i></i></div><p class="fp-st" data-st role="status" aria-live="polite"></p>';
    var body = $('[data-pibody]', n);
    function paint() {
      if (!D) { body.innerHTML = ''; return; }
      body.innerHTML = '<div class="fz-card"><p><b>' + esc(D.name) + '</b>: ' + pages(D.doc.numPages) + '.</p>' +
        '<div class="fz-row"><label>Sharpness <select data-dpi>' + [[72, '72 DPI (small, for screens)'], [100, '100 DPI'], [150, '150 DPI (good for most uses)'], [200, '200 DPI (portals)'], [300, '300 DPI (print, big files)']].map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === O.dpi ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>Picture type <select data-fmt><option value="jpg"' + (O.fmt === 'jpg' ? ' selected' : '') + '>JPG (smaller)</option><option value="png"' + (O.fmt === 'png' ? ' selected' : '') + '>PNG (sharp text, bigger)</option></select></label>' +
        '<label data-ql' + (O.fmt === 'jpg' ? '' : ' hidden') + '>JPG quality <select data-q><option value="0.95">Best</option><option value="0.9">High</option><option value="0.8">Medium</option><option value="0.65">Small file</option></select></label></div>' +
        '<div class="fz-row"><label class="fz-wide">Pages <input data-range value="' + esc(O.range) + '" placeholder="all pages, or for example 1-3, 5" aria-describedby="fp-pi-rn"></label>' +
        '<label>Save as <select data-out><option value="zip"' + (O.out === 'zip' ? ' selected' : '') + '>One zip file</option><option value="each"' + (O.out === 'each' ? ' selected' : '') + '>Separate pictures</option></select></label></div>' +
        '<p class="fz-note" id="fp-pi-rn">Leave Pages empty for every page. A single page is saved as one picture.</p>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-pigo data-ic="download">Save the pictures</button><button type="button" class="btn" data-piclr>Close this PDF</button></div></div>';
      $('[data-q]', body).value = String(O.q);
    }
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-dpi]')) O.dpi = +t.value; else if (t.matches('[data-fmt]')) { O.fmt = t.value; $('[data-ql]', body).hidden = O.fmt !== 'jpg'; }
      else if (t.matches('[data-q]')) O.q = +t.value; else if (t.matches('[data-out]')) O.out = t.value;
    });
    body.addEventListener('input', function (e) { if (e.target.matches('[data-range]')) O.range = e.target.value; });
    body.addEventListener('click', function (e) {
      if (e.target.closest('[data-piclr]')) { if (D) D.doc.destroy(); D = null; paint(); status(n, ''); return; }
      if (!e.target.closest('[data-pigo]') || busy) return;
      var list = P.parseRange(O.range, D.doc.numPages);
      if (!list) { status(n, 'Pages: type numbers from 1 to ' + D.doc.numPages + ', for example 1-3, 5.', 'bad'); return; }
      busy = true; var files = [], low = false, type = O.fmt === 'png' ? 'image/png' : 'image/jpeg', ext = O.fmt === 'png' ? '.png' : '.jpg';
      list.reduce(function (pr, k, i) {
        return pr.then(function () {
          status(n, 'Page ' + k + ' (' + (i + 1) + ' of ' + list.length + ')…'); bar(n, i / list.length);
          return D.doc.getPage(k).then(function (p) {
            var s = maxScale(p, O.dpi); if (s < O.dpi / 72 - 1e-6) low = true;
            return render(D.doc, k, s).then(function (r) { return blobOf(r.c, type, O.q); }).then(function (b) { return type === 'image/jpeg' ? setDpi(b, Math.round(s * 72)) : b; })
              .then(function (b) { files.push({ name: base(D.name) + '-page-' + k + ext, blob: b }); });
          });
        }).then(later);
      }, Promise.resolve()).then(function () {
        bar(n, null);
        var lowNote = low ? ' Some pages were very big, so they were saved a little less sharp.' : '';
        if (files.length === 1 || O.out === 'each') {
          files.forEach(function (f, i) { setTimeout(function () { NS.saveFile(f.blob, f.name); }, i * 350); });
          status(n, 'Saved ' + files.length + ' picture' + (files.length === 1 ? '' : 's') + '.' + (files.length > 1 ? ' If the browser asks, allow it to download several files.' : '') + lowNote, 'ok');
          return;
        }
        return W.NSFreeTools.zip(files).then(function (z) {
          var nm = base(D.name) + '-pictures.zip'; NS.saveFile(z, nm);
          status(n, 'Saved "' + nm + '" with ' + files.length + ' pictures (' + kb(z.size) + ').' + lowNote, 'ok');
        });
      }).catch(function () { bar(n, null); status(n, 'Could not make the pictures. The PDF may be damaged, or this device ran out of memory: try a lower DPI or fewer pages.', 'bad'); })
        .then(function () { busy = false; });
    });
    onFiles(n, '#fp-pi-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) { return openPdf(b, f.name); }).then(function (o) { if (D) D.doc.destroy(); D = { name: f.name, doc: o.doc }; O.range = ''; paint(); status(n, ''); })
        .catch(function (e) { openFail(n, e); });
    });
    return n;
  }

  /* =====================================================================================================================
     4. HIDE TEXT IN A PDF (redact)
     ===================================================================================================================== */
  function redactNode() {
    style();
    var n = el('div', 'fz-tool'), R = null, O = { whole: false, dpi: 200, draw: !(W.matchMedia && W.matchMedia('(pointer:coarse)').matches) }, busy = false;
    n.innerHTML = '<h3>Hide text in a PDF</h3><p class="soft">Cover account numbers, PAN, Aadhaar, phone numbers or names with black boxes before you share a PDF. Draw boxes on the pages, or type a word to cover it everywhere. A black box drawn in most PDF programs only hides the words from the eye; here every page with a box is saved as a picture, so the hidden words are really gone from the file. Nothing leaves this computer.</p>' +
      '<div class="pr-bar">' + fileBtn('fp-rd-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '</div>' +
      '<div data-rdbody></div><div class="fp-bar" data-bar hidden><i></i></div><p class="fp-st" data-st role="status" aria-live="polite"></p>';
    var body = $('[data-rdbody]', n);
    function count() { return R ? R.pages.reduce(function (s, p) { return s + p.boxes.length; }, 0) : 0; }
    function paint() {
      if (!R) { body.innerHTML = ''; return; }
      body.innerHTML = '<div class="fz-card"><p><b>' + esc(R.name) + '</b>: ' + pages(R.pages.length) + '. <span data-cnt></span></p>' +
        '<form class="fp-pw" data-find><label>Cover a word or number everywhere <input data-word placeholder="for example ABCDE1234F"></label><button class="btn">Find and cover</button></form>' +
        '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-draw' + (O.draw ? ' checked' : '') + '> Draw boxes with the mouse or finger</label>' +
        '<label>Saved as <select data-whole><option value="0"' + (O.whole ? '' : ' selected') + '>Only pages with boxes become pictures</option><option value="1"' + (O.whole ? ' selected' : '') + '>Every page becomes a picture</option></select></label>' +
        '<label>Sharpness <select data-rdpi><option value="150">150 DPI (smaller file)</option><option value="200">200 DPI</option><option value="300">300 DPI (print)</option></select></label></div>' +
        '<p class="fz-note">To draw: drag across the page. To change a box: select it with Tab, then arrow keys move it, Shift + arrow keys change its size and Delete removes it. On a phone, switch drawing off to scroll the pages. Pages saved as pictures can no longer be searched or copied; the other pages stay as they are.</p>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-rdgo data-ic="download">Save the PDF with hidden text</button><button type="button" class="btn" data-rdclear>Remove all boxes</button><button type="button" class="btn" data-rdclr>Close this PDF</button></div></div>' +
        '<div class="fp-pages">' + R.pages.map(function (p, i) {
          return '<div class="fp-page"><p><span>Page ' + (i + 1) + '</span><button type="button" class="btn sm" data-addbox="' + i + '">Add a box</button></p><div class="fp-draw' + (O.draw ? ' on' : '') + '" data-pg="' + i + '">' + (p.thumb ? '<img alt="Page ' + (i + 1) + '" src="' + p.thumb + '">' : '<div style="aspect-ratio:' + p.w + '/' + p.h + ';background:#fff"></div>') + '</div></div>';
        }).join('') + '</div>';
      $('[data-rdpi]', body).value = String(O.dpi);
      R.pages.forEach(function (p, i) { boxes(i); });
    }
    function cnt() { var c = $('[data-cnt]', body); if (c) { var k = count(); c.textContent = k ? k + ' box' + (k === 1 ? '' : 'es') + ' on ' + pages(R.pages.filter(function (p) { return p.boxes.length; }).length) + '.' : 'No boxes yet.'; } }
    function place(d, b) { d.style.left = b.x * 100 + '%'; d.style.top = b.y * 100 + '%'; d.style.width = b.w * 100 + '%'; d.style.height = b.h * 100 + '%'; }
    function boxes(i) {
      var host = $('[data-pg="' + i + '"]', body); if (!host) return;
      $$('.fp-box', host).forEach(function (b) { b.remove(); });
      R.pages[i].boxes.forEach(function (b, j) {
        var d = el('div', 'fp-box'); d.tabIndex = 0; d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Black box ' + (j + 1) + ' on page ' + (i + 1));
        d.setAttribute('data-bi', j); place(d, b);
        d.innerHTML = '<button type="button" aria-label="Remove black box ' + (j + 1) + ' on page ' + (i + 1) + '" data-rm>×</button>';
        host.appendChild(d);
      });
      cnt();
    }
    function focusBox(i, j) { var d = $('[data-pg="' + i + '"] [data-bi="' + j + '"]', body); if (d) d.focus(); }
    function clamp(b) { b.w = Math.max(0.005, Math.min(1, b.w)); b.h = Math.max(0.005, Math.min(1, b.h)); b.x = Math.max(0, Math.min(1 - b.w, b.x)); b.y = Math.max(0, Math.min(1 - b.h, b.y)); return b; }
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-draw]')) { O.draw = t.checked; $$('.fp-draw', body).forEach(function (d) { d.classList.toggle('on', O.draw); }); }
      else if (t.matches('[data-whole]')) O.whole = t.value === '1'; else if (t.matches('[data-rdpi]')) O.dpi = +t.value;
    });
    /* drawing and moving with the pointer */
    var drag = null;
    body.addEventListener('pointerdown', function (e) {
      var host = e.target.closest('.fp-draw'); if (!host || e.target.closest('[data-rm]') || e.button > 0) return;
      var i = +host.getAttribute('data-pg'), rc = host.getBoundingClientRect(), fx = (e.clientX - rc.left) / rc.width, fy = (e.clientY - rc.top) / rc.height;
      var bx = e.target.closest('.fp-box');
      if (bx) { bx.focus(); var j = +bx.getAttribute('data-bi'), b = R.pages[i].boxes[j]; drag = { i: i, j: j, move: true, fx: fx, fy: fy, b0: { x: b.x, y: b.y, w: b.w, h: b.h }, rc: rc }; host.setPointerCapture(e.pointerId); e.preventDefault(); return; }
      if (!O.draw) return;
      R.pages[i].boxes.push({ x: fx, y: fy, w: 0.005, h: 0.005 }); boxes(i);
      drag = { i: i, j: R.pages[i].boxes.length - 1, fx: fx, fy: fy, rc: rc }; host.setPointerCapture(e.pointerId); e.preventDefault();
    });
    body.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var fx = (e.clientX - drag.rc.left) / drag.rc.width, fy = (e.clientY - drag.rc.top) / drag.rc.height, b = R.pages[drag.i].boxes[drag.j];
      if (drag.move) { b.x = drag.b0.x + fx - drag.fx; b.y = drag.b0.y + fy - drag.fy; b.w = drag.b0.w; b.h = drag.b0.h; }
      else { fx = Math.max(0, Math.min(1, fx)); fy = Math.max(0, Math.min(1, fy)); b.x = Math.min(fx, drag.fx); b.y = Math.min(fy, drag.fy); b.w = Math.abs(fx - drag.fx); b.h = Math.abs(fy - drag.fy); }
      clamp(b);
      var d = $('[data-pg="' + drag.i + '"] [data-bi="' + drag.j + '"]', body); if (d) place(d, b);
    });
    function endDrag() {
      if (!drag) return;
      var p = R.pages[drag.i], b = p.boxes[drag.j], i = drag.i, j = drag.j, moved = drag.move;
      drag = null;
      if (!moved && (b.w < 0.008 || b.h < 0.004)) { p.boxes.splice(j, 1); boxes(i); return; }   /* a tap, not a box */
      boxes(i); focusBox(i, j);
    }
    body.addEventListener('pointerup', endDrag); body.addEventListener('pointercancel', endDrag);
    body.addEventListener('keydown', function (e) {
      var d = e.target; if (!d.classList || !d.classList.contains('fp-box')) return;
      var i = +d.parentNode.getAttribute('data-pg'), j = +d.getAttribute('data-bi'), b = R.pages[i].boxes[j];
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); R.pages[i].boxes.splice(j, 1); boxes(i); var nx = $('[data-addbox="' + i + '"]', body); if (nx) nx.focus(); return; }
      var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!m) return;
      e.preventDefault(); var st = 0.01;
      if (e.shiftKey) { b.w += m[0] * st; b.h += m[1] * st; } else { b.x += m[0] * st; b.y += m[1] * st; }
      clamp(b); place(d, b);
    });
    body.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm) { var d = rm.closest('.fp-box'), i = +d.parentNode.getAttribute('data-pg'); R.pages[i].boxes.splice(+d.getAttribute('data-bi'), 1); boxes(i); var ab0 = $('[data-addbox="' + i + '"]', body); if (ab0) ab0.focus(); return; }
      var ab = e.target.closest('[data-addbox]');
      if (ab) { var k = +ab.getAttribute('data-addbox'); R.pages[k].boxes.push({ x: 0.35, y: 0.45, w: 0.3, h: 0.04 }); boxes(k); focusBox(k, R.pages[k].boxes.length - 1); return; }
      if (e.target.closest('[data-rdclear]')) { R.pages.forEach(function (p, i) { p.boxes = []; boxes(i); }); status(n, ''); return; }
      if (e.target.closest('[data-rdclr]')) { if (R && R.doc) R.doc.destroy(); R = null; paint(); status(n, ''); return; }
      if (e.target.closest('[data-rdgo]') && !busy) save();
    });
    body.addEventListener('submit', function (e) {
      if (!e.target.matches('[data-find]')) return; e.preventDefault();
      var w = $('[data-word]', body).value.trim(); if (!w) { status(n, 'Type the word or number to cover.', 'bad'); return; }
      find(w).then(function (k) {
        if (!k) status(n, '"' + w + '" was not found in the text of this PDF. A scanned page has no text: draw the box by hand there.', 'bad');
        else status(n, 'Covered "' + w + '" in ' + k + ' place' + (k === 1 ? '' : 's') + '. Look at every page before you save: a word split over two lines is not found.', 'ok');
      });
    });
    /* every place a word appears: its box worked out from the text pieces' positions (each letter's share of the width measured in a
       usual sans-serif font, with some room around it).
       Spaces are ignored in the match, so "1234 5678" also finds "12345678". */
    var mctx = null;
    function mw(t) { if (!mctx) { mctx = canvasOf(10, 10).getContext('2d'); mctx.font = '100px Helvetica, Arial, sans-serif'; } return mctx.measureText(t).width; }   /* a letter's share of the piece's width, as in a usual sans-serif font */
    function find(word) {
      var low = word.toLowerCase().replace(/\s+/g, ''), hits = 0;
      return R.pages.reduce(function (pr, pg, i) {
        return pr.then(function () {
          return R.doc.getPage(i + 1).then(function (p) {
            var v = p.getViewport({ scale: 1 });
            return p.getTextContent().then(function (tc) {
              tc.items.forEach(function (it) {
                var s = String(it.str || ''); if (!s.trim()) return;
                /* map positions in the text without spaces back to the text */
                var map = [], sq = ''; for (var c = 0; c < s.length; c++) if (!/\s/.test(s[c])) { map.push(c); sq += s[c].toLowerCase(); }
                var t = W.pdfjsLib.Util.transform(v.transform, it.transform), fh = Math.hypot(t[2], t[3]) || 10, wd = (it.width || s.length * fh * 0.5) * v.scale;
                for (var at = sq.indexOf(low); at >= 0; at = sq.indexOf(low, at + low.length)) {
                  var a = map[at], z = map[at + low.length - 1] + 1, all = mw(s) || s.length;
                  var x0 = t[4] + wd * mw(s.slice(0, a)) / all, x1 = t[4] + wd * mw(s.slice(0, z)) / all, pad = fh * 0.2;
                  pg.boxes.push(clamp({ x: (x0 - pad) / v.width, y: (t[5] - fh * 1.0) / v.height, w: (x1 - x0 + 2 * pad) / v.width, h: fh * 1.35 / v.height })); hits++;
                }
              });
              boxes(i);
            });
          });
        });
      }, Promise.resolve()).then(function () { return hits; });
    }
    function save() {
      if (!count() && !O.whole) { status(n, 'No boxes yet. Draw a box over the text to hide, or find a word.', 'bad'); return; }
      busy = true;
      var out, src, total = R.pages.length, done = 0;
      status(n, 'Making the new PDF…'); bar(n, 0);
      pdfLib().then(function (L) {
        return Promise.all([L.PDFDocument.create(), libDoc(L, R.bytes, R.pw)]).then(function (ds) {
          out = ds[0]; src = ds[1];
          return R.pages.reduce(function (pr, pg, i) {
            return pr.then(function () {
              if (!pg.boxes.length && !O.whole) return out.copyPages(src, [i]).then(function (cp) { out.addPage(cp[0]); });
              return R.doc.getPage(i + 1).then(function (p) {
                return render(R.doc, i + 1, maxScale(p, O.dpi)).then(function (r) {
                  var x = r.c.getContext('2d'); x.fillStyle = '#000';
                  pg.boxes.forEach(function (b) { x.fillRect(Math.floor(b.x * r.c.width), Math.floor(b.y * r.c.height), Math.ceil(b.w * r.c.width) + 1, Math.ceil(b.h * r.c.height) + 1); });
                  var v1 = p.getViewport({ scale: 1 });
                  return blobOf(r.c, 'image/jpeg', 0.9).then(function (b) { return b.arrayBuffer(); }).then(function (jb) { return out.embedJpg(jb); }).then(function (img) {
                    out.addPage([v1.width, v1.height]).drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height });
                  });
                });
              });
            }).then(function () { done++; bar(n, done / total); status(n, 'Page ' + done + ' of ' + total + '…'); return later(); });
          }, Promise.resolve());
        }).then(function () {
          /* none of the old file's details (title, author, subject) go with it */
          out.setTitle(''); out.setAuthor(''); out.setSubject(''); out.setKeywords([]); out.setCreator('NSBiz'); out.setProducer('NSBiz');
          return out.save({ useObjectStreams: false });
        });
      }).then(function (bytes) {
        bar(n, null);
        var nm = base(R.name) + ' (hidden text).pdf', pics = O.whole ? total : R.pages.filter(function (p) { return p.boxes.length; }).length;
        NS.saveFile(new Blob([bytes], { type: 'application/pdf' }), nm);
        status(n, 'Saved "' + nm + '". ' + pics + ' page' + (pics === 1 ? ' was' : 's were') + ' saved as pictures with the black boxes' + (total - pics ? ', ' + (total - pics) + ' kept as they were' : '') + '. Open it and look at every page before you share it.' + (R.pw != null ? ' The new PDF has no password.' : ''), 'ok');
      }).catch(function (e) { bar(n, null); if (e && e.message === 'load') libFail(); else status(n, 'Could not make the new PDF. The file may be damaged, or this device ran out of memory: try 150 DPI.', 'bad'); })
        .then(function () { busy = false; });
    }
    onFiles(n, '#fp-rd-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) { return openPdf(b, f.name).then(function (o) { return { b: b, o: o }; }); }).then(function (x) {
        if (R && R.doc) R.doc.destroy();
        var doc = x.o.doc, num = Math.min(doc.numPages, 300), ks = []; for (var k = 1; k <= num; k++) ks.push(k);
        return Promise.all(ks.map(function (k) { return doc.getPage(k).then(function (p) { var v = p.getViewport({ scale: 1 }); return { w: v.width, h: v.height, boxes: [], thumb: '' }; }); })).then(function (pgs) {
          var mine = R = { name: f.name, bytes: x.b, pw: x.o.pw, doc: doc, pages: pgs }; paint();
          status(n, doc.numPages > 300 ? 'This PDF has ' + doc.numPages + ' pages: only the first 300 are shown and saved.' : '');
          return ks.reduce(function (pr, k) {
            return pr.then(function () {
              if (R !== mine) return;
              return doc.getPage(k).then(function (p) { var v = p.getViewport({ scale: 1 }); return render(doc, k, Math.min(2, 900 / v.width)); }).then(function (r) {
                if (R !== mine) return;
                var url = r.c.toDataURL('image/jpeg', 0.8); mine.pages[k - 1].thumb = url;
                var host = $('[data-pg="' + (k - 1) + '"]', body); if (!host) return;
                var im = el('img'); im.alt = 'Page ' + k; im.src = url; host.replaceChild(im, host.firstElementChild);
              });
            });
          }, Promise.resolve());
        });
      }).catch(function (e) { openFail(n, e); });
    });
    return n;
  }

  /* =====================================================================================================================
     5. MAKE A SCANNED PDF SEARCHABLE (OCR)
     ===================================================================================================================== */
  function verified(f) { return fetch(f[0], { integrity: f[1], mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); }); }
  function tesseract() {
    return NS.loadJs(TLIB[0], TLIB[1]).then(function () { return verified(TF.worker); }).then(function () { return verified(simd ? TF.coreSimd : TF.core); }).then(function () { return verified(TF.eng); })
      .then(function () { if (!W.Tesseract) throw new Error('ocrload'); return W.Tesseract; }, function (e) { if (e && e.message === 'load') throw new Error('ocrload'); throw e; });
  }
  function wordsOf(data) {
    if (data.words && data.words.length) return data.words;
    var w = []; (data.blocks || []).forEach(function (b) { (b.paragraphs || []).forEach(function (p) { (p.lines || []).forEach(function (l) { (l.words || []).forEach(function (x) { w.push(x); }); }); }); });
    return w;
  }
  function ocrNode() {
    style();
    var n = el('div', 'fz-tool'), S = null, O = { all: false }, busy = false;
    n.innerHTML = '<h3>Make a scanned PDF searchable</h3><p class="soft">A scanned PDF is only pictures of pages: you cannot search it or copy its words. This tool reads each page (English) and puts the words as hidden text behind the picture. The pages look exactly the same, but now you can search, select and copy the words, and "PDF to Excel" can read them. Nothing leaves this computer.</p>' +
      '<p class="fz-note">The reading program (about 7 MB) is downloaded once, the first time, and the browser keeps it; the bill photo reader uses the same copy. Reading takes a few seconds a page. Hindi and other scripts are not read yet. Check important numbers against the page itself.</p>' +
      '<div class="pr-bar">' + fileBtn('fp-oc-file', 'Open a scanned PDF', '.pdf,application/pdf', false, true) + '</div>' +
      '<div data-ocbody></div><div class="fp-bar" data-bar hidden><i></i></div><p class="fp-st" data-st role="status" aria-live="polite"></p>';
    var body = $('[data-ocbody]', n);
    function paint() {
      if (!S) { body.innerHTML = ''; return; }
      body.innerHTML = '<div class="fz-card"><p><b>' + esc(S.name) + '</b>: ' + pages(S.doc.numPages) + (S.texted ? ', ' + S.texted + ' of them already with text' : '') + '.</p>' +
        '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-ocall' + (O.all ? ' checked' : '') + '> Also read pages that already have text</label></div>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-ocgo data-ic="download">Read the pages and save</button><button type="button" class="btn" data-occlr>Close this PDF</button></div></div>';
    }
    body.addEventListener('change', function (e) { if (e.target.matches('[data-ocall]')) O.all = e.target.checked; });
    body.addEventListener('click', function (e) {
      if (e.target.closest('[data-occlr]') && !busy) { if (S) S.doc.destroy(); S = null; paint(); status(n, ''); return; }
      if (e.target.closest('[data-ocgo]') && !busy) run();
    });
    function run() {
      busy = true;
      var worker = null, L, out, font, total = S.doc.numPages, nWords = 0, read = 0, skipped = 0, cur = 0;
      status(n, 'Getting the reading program ready (slow only the first time)…'); bar(n, 0.01);
      Promise.all([pdfLib(), tesseract()]).then(function (libs) {
        L = libs[0];
        return libs[1].createWorker('eng', 1, {
          workerPath: TF.worker[0], corePath: JD + 'tesseract.js-core@5.1.1', langPath: JD + '@tesseract.js-data/eng@1.0.0/4.0.0_best_int',
          logger: function (m) { if (m && m.status === 'recognizing text' && cur) bar(n, (cur - 1 + m.progress) / total); }
        });
      }).then(function (w) {
        worker = w;
        return worker.setParameters({ preserve_interword_spaces: '1', user_defined_dpi: '300' });
      }).then(function () { return libDoc(L, S.bytes, S.pw); }).then(function (d) {
        out = d; return out.embedFont(L.StandardFonts.Helvetica);
      }).then(function (f) {
        font = f;
        var ks = []; for (var k = 1; k <= total; k++) ks.push(k);
        return ks.reduce(function (pr, k) {
          return pr.then(function () {
            cur = k;
            if (!O.all && S.hasText[k - 1]) { skipped++; return; }
            status(n, 'Reading page ' + k + ' of ' + total + '…');
            return S.doc.getPage(k).then(function (p) {
              return render(S.doc, k, maxScale(p, 300)).then(function (r) {
                return worker.recognize(r.c, {}, { blocks: true, text: true }).then(function (res) {
                  var words = wordsOf(res.data), page = out.getPage(k - 1), ops = [], key = null;
                  words.forEach(function (wd) {
                    var t = P.ansi(wd.text); if (!t || !wd.bbox || (wd.confidence != null && wd.confidence < 15)) return;
                    var bb = wd.bbox, bl = bb.y1 - (bb.y1 - bb.y0) * 0.2;   /* the base line, a little above the bottom of the letters */
                    var a0 = r.v.convertToPdfPoint(bb.x0, bl), a1 = r.v.convertToPdfPoint(bb.x1, bl), a2 = r.v.convertToPdfPoint(bb.x0, bb.y0);
                    var g = P.wordBox(a0, a1, a2), size = Math.max(1, g.h * 1.15), w1 = font.widthOfTextAtSize(t, size);
                    if (!(w1 > 0) || !(g.w > 0)) return;
                    if (!key) key = page.node.newFontDictionary('FOcr', font.ref);
                    ops.push(L.beginText(), L.setFontAndSize(key, size), L.setTextRenderingMode(L.TextRenderingMode.Invisible), L.setCharacterSqueeze(Math.max(1, Math.min(1000, 100 * g.w / w1))),
                      L.rotateAndSkewTextRadiansAndTranslate(g.angle, 0, 0, g.x, g.y), L.showText(font.encodeText(t)), L.endText());
                    nWords++;
                  });
                  if (ops.length) page.pushOperators.apply(page, [L.pushGraphicsState()].concat(ops, [L.popGraphicsState()]));
                  read++;
                });
              });
            }).then(later);
          });
        }, Promise.resolve());
      }).then(function () {
        return worker.terminate().then(function () { worker = null; return read ? out.save({ useObjectStreams: false }) : null; });
      }).then(function (bytes) {
        bar(n, null);
        if (!bytes) { status(n, 'Every page already has text, so nothing was read. Tick "Also read pages that already have text" to read them anyway.', 'bad'); return; }
        var nm = base(S.name) + ' (searchable).pdf';
        NS.saveFile(new Blob([bytes], { type: 'application/pdf' }), nm);
        status(n, 'Saved "' + nm + '": ' + pages(read) + ' read, ' + nWords + ' words added' + (skipped ? ', ' + pages(skipped) + ' already had text' : '') + '.' + (S.pw != null ? ' The new PDF has no password.' : '') + (nWords ? '' : ' No words were found: is the scan very faint or turned sideways?'), nWords ? 'ok' : 'bad');
      }).catch(function (e) {
        bar(n, null); if (worker) worker.terminate().catch(function () {});
        if (e && e.message === 'load') libFail();
        else if (e && (e.message === 'ocrload' || e.message === 'http' || e.name === 'TypeError')) status(n, 'The reading program could not be downloaded. Connect to the internet once and try again; after that the browser keeps it.', 'bad');
        else status(n, 'Could not finish reading this PDF. Try again, or try a smaller file.', 'bad');
      }).then(function () { busy = false; });
    }
    onFiles(n, '#fp-oc-file', function (files) {
      if (busy) return;
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      status(n, 'Reading ' + f.name + '…');
      f.arrayBuffer().then(function (b) { return openPdf(b, f.name).then(function (o) { return { b: b, o: o }; }); }).then(function (x) {
        var doc = x.o.doc, ks = []; for (var k = 1; k <= doc.numPages; k++) ks.push(k);
        return Promise.all(ks.map(function (k) { return pageLines(doc, k).then(function (l) { return l.reduce(function (s, ln) { return s + ln.items.length; }, 0) >= 3; }); })).then(function (has) {
          if (S) S.doc.destroy();
          S = { name: f.name, bytes: x.b, pw: x.o.pw, doc: doc, hasText: has, texted: has.filter(Boolean).length };
          paint(); status(n, S.texted === doc.numPages ? 'This PDF already has text on every page: it can be searched as it is.' : '');
        });
      }).catch(function (e) { openFail(n, e); });
    });
    return n;
  }

  /* =====================================================================================================================
     6. COMPARE TWO DOCUMENTS
     ===================================================================================================================== */
  function cmpNode() {
    style();
    var n = el('div', 'fz-tool'), C = { a: '', b: '', view: 'one', icase: false, ipunct: false, res: null };
    function side(k, title) {
      return '<div class="fp-side fz-card"><h4>' + title + '</h4><div class="pr-bar">' + fileBtn('fp-cm-' + k, 'Open a file', '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain', false, false) + '<span class="fz-note" data-nm="' + k + '"></span></div>' +
        '<label class="fz-note" for="fp-ta-' + k + '">or paste the text here</label><textarea id="fp-ta-' + k + '" data-ta="' + k + '" spellcheck="false"></textarea></div>';
    }
    n.innerHTML = '<h3>Compare two documents</h3><p class="soft">See what changed between two drafts of a contract, a letter or an agreement: words taken out and words added. Open PDFs (with text), Word files (.docx) or text files, or paste the text. Nothing leaves this computer.</p>' +
      '<div class="fp-cmp">' + side('a', 'First (older) version') + side('b', 'Second (newer) version') + '</div>' +
      '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-icase> Ignore capital and small letters</label><label class="fz-chk"><input type="checkbox" data-ipunct> Ignore commas, full stops and other marks</label>' +
      '<label>Show <select data-view><option value="one">One text with the changes marked</option><option value="two">Side by side</option></select></label></div>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-cmgo>Compare</button><button type="button" class="btn" data-cmpr hidden>Print</button><button type="button" class="btn" data-cmclr>Start again</button></div>' +
      '<p class="fp-st" data-st role="status" aria-live="polite"></p><div data-cmout></div>';
    function load(k, f) {
      var get;
      status(n, 'Reading ' + f.name + '…');
      if (/\.docx$/i.test(f.name)) get = f.arrayBuffer().then(P.docxFile);
      else if (isPdf(f)) get = f.arrayBuffer().then(function (b) { return openPdf(b, f.name); }).then(function (o) {
        var ks = []; for (var p = 1; p <= o.doc.numPages; p++) ks.push(p);
        return Promise.all(ks.map(function (p) { return pageLines(o.doc, p); })).then(function (pgs) { o.doc.destroy(); return pgs.map(function (ls) { return ls.map(function (l) { return l.items.map(function (i) { return i.s; }).join(' '); }).join('\n'); }).join('\n'); });
      });
      else if (/\.(txt|text|csv|md)$/i.test(f.name) || /^text\//.test(f.type)) get = f.text();
      else { status(n, 'Open a PDF, a Word file (.docx) or a text file. An old Word file (.doc) must first be saved as .docx in Word.', 'bad'); return; }
      get.then(function (t) {
        if (!String(t).trim()) { status(n, f.name + ' has no text that can be read' + (isPdf(f) ? ': it is a scan. Use "Make a scanned PDF searchable" first.' : '.'), 'bad'); return; }
        C[k] = f.name; $('[data-ta="' + k + '"]', n).value = t; $('[data-nm="' + k + '"]', n).textContent = f.name; status(n, '');
      }).catch(function (e) { if (e && (e.message === 'zip' || e.message === 'docx')) status(n, 'Could not read ' + f.name + ' as a Word file.', 'bad'); else openFail(n, e); });
    }
    ['a', 'b'].forEach(function (k) {
      var inp = $('#fp-cm-' + k, n); inp.addEventListener('change', function () { var f = inp.files[0]; inp.value = ''; if (f) load(k, f); });
      var ta = $('[data-ta="' + k + '"]', n), box = ta.closest('.fp-side');
      ta.addEventListener('input', function () { if (C[k]) { C[k] = ''; $('[data-nm="' + k + '"]', n).textContent = '(changed by hand)'; } });
      box.addEventListener('dragover', function (e) { e.preventDefault(); }); box.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files[0]) { e.preventDefault(); load(k, e.dataTransfer.files[0]); } });
    });
    n.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-icase]')) C.icase = t.checked; else if (t.matches('[data-ipunct]')) C.ipunct = t.checked; else if (t.matches('[data-view]')) { C.view = t.value; if (C.res) show(); return; } else return;
      if (C.res) run();
    });
    function words(ws) { return ws.map(function (w) { return w === '\n' ? '<br><br>' : esc(w); }).join(' ').replace(/ ?<br><br> ?/g, '<br><br>'); }
    function show() {
      var r = C.res, out = $('[data-cmout]', n);
      var sum = '<div class="fp-sum"><span><b>' + r.removed + '</b> word' + (r.removed === 1 ? '' : 's') + ' taken out</span><span><b>' + r.added + '</b> word' + (r.added === 1 ? '' : 's') + ' added</span><span><b>' + r.same + '</b> the same</span>' +
        '<span class="fz-note"><del class="fp-del">taken out</del> <ins class="fp-ins">added</ins></span></div>';
      if (!r.removed && !r.added) { out.innerHTML = sum + '<p class="fz-ok"><b>The two texts are the same' + (C.icase || C.ipunct ? ' (apart from the differences you chose to ignore)' : '') + '.</b></p>'; return; }
      var mark = function (g) { return g.t === '-' ? '<del>' + words(g.w) + '</del>' : g.t === '+' ? '<ins>' + words(g.w) + '</ins>' : words(g.w); };
      var body;
      if (C.view === 'two') {
        body = '<div class="fp-cmp"><div class="fp-side"><h4>' + esc(C.a || 'First version') + '</h4><div class="fp-out">' + r.ops.filter(function (g) { return g.t !== '+'; }).map(mark).join(' ') + '</div></div>' +
          '<div class="fp-side"><h4>' + esc(C.b || 'Second version') + '</h4><div class="fp-out">' + r.ops.filter(function (g) { return g.t !== '-'; }).map(mark).join(' ') + '</div></div></div>';
      } else body = '<div class="fp-out">' + r.ops.map(mark).join(' ') + '</div>';
      out.innerHTML = sum + body;
    }
    function run() {
      var a = $('[data-ta="a"]', n).value, b = $('[data-ta="b"]', n).value;
      if (!a.trim() || !b.trim()) { status(n, 'Put a text in both boxes: open a file or paste.', 'bad'); return; }
      status(n, 'Comparing…');
      setTimeout(function () { C.res = P.compare(a, b, { icase: C.icase, ipunct: C.ipunct }); show(); $('[data-cmpr]', n).hidden = false; status(n, ''); }, 20);
    }
    n.addEventListener('click', function (e) {
      if (e.target.closest('[data-cmgo]')) run();
      else if (e.target.closest('[data-cmclr]')) { C.a = C.b = ''; C.res = null; $$('[data-ta]', n).forEach(function (t) { t.value = ''; }); $$('[data-nm]', n).forEach(function (t) { t.textContent = ''; }); $('[data-cmout]', n).innerHTML = ''; $('[data-cmpr]', n).hidden = true; status(n, ''); }
      else if (e.target.closest('[data-cmpr]')) print();
    });
    /* print only the result, from a frame of its own (the App around it is not printed) */
    function print() {
      if (!C.res) return;
      var f = el('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'; f.setAttribute('aria-hidden', 'true'); f.setAttribute('tabindex', '-1'); document.body.appendChild(f);
      var r = C.res, d = f.contentDocument, html = $('[data-cmout]', n).innerHTML.replace(/<div class="fp-sum">[\s\S]*?<\/span><\/div>/, '');
      d.open(); d.write('<!doctype html><html><head><meta charset="utf-8"><title>Comparison</title><style>body{font:11pt/1.6 system-ui,"Segoe UI",Arial,sans-serif;color:#000;margin:15mm}h1{font-size:15pt;margin:0 0 4px}h4{margin:0 0 6px}del{background:#fde2e0;color:#8a1c12;text-decoration:line-through}ins{background:#d9f2e3;color:#0b5a31;text-decoration:underline}.m{color:#333;font-size:9.5pt;margin:0 0 12px}.fp-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.fp-out{overflow-wrap:anywhere}</style></head><body>' +
        '<h1>Comparison of two documents</h1><p class="m">First: ' + esc(C.a || 'pasted text') + ' &middot; Second: ' + esc(C.b || 'pasted text') + '<br>' + r.removed + ' words taken out, ' + r.added + ' added, ' + r.same + ' the same &middot; ' + esc(new Date().toLocaleString('en-IN')) + '</p>' +
        html + '<p class="m" style="margin-top:14px">Made with NSBiz Free tools.</p></body></html>');
      d.close();
      setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 1500); }, 250);
    }
    return n;
  }

  /* ---------- register ---------- */
  var T = W.NSFreeTools;
  T.add('pdflock', 'Unlock or lock a PDF', 'pdf', lockNode);
  T.add('pdfxl', 'PDF to Excel', 'pdf', xlNode);
  T.add('pdfpic', 'PDF to pictures', 'pdf', picNode);
  T.add('pdfhide', 'Hide text in a PDF', 'pdf', redactNode);
  T.add('pdfocr', 'Make a scanned PDF searchable', 'pdf', ocrNode);
  T.add('doccompare', 'Compare two documents', 'legal', cmpNode);
})();
