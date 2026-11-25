/* Free tools, batch 1 (owner 24 Nov 2026): Utilities › Free tools. One App screen with five tabs:
   1. Resize pictures: one or many pictures to a size limit (KB), a width/height in px or cm at a DPI, crop, JPG/PNG/WebP.
   2. Clean signature: a photo of a signature on paper becomes a see-through PNG (paper removed, cut to the ink).
   3. PDF extras: compress a PDF, pictures to one PDF, pages (turn, delete, move), page numbers, a watermark.
   4. Scan documents: camera or photos, four corners straightened (perspective), filters, pages to one PDF or pictures.
   5. Steel weight: theoretical weight of bars, flats, sheets, pipes, tubes and angles; pieces <-> weight; amount.
   Everything runs in this browser: no file is uploaded anywhere, nothing is kept after the screen closes (only "Use on my
   bills" saves the signature into the business record, like My data does). Libraries are copies kept inside NSBiz so the
   tools work offline: pdf-lib (@cantoo/pdf-lib 2.11.1, MIT, /assets/vendor/, the copy the PDF tools use) and pdf.js
   (Mozilla pdfjs-dist 3.11.174, Apache-2.0, /vendor/ of the App site, the copy the bank statement import uses). The rest
   (crop box, size search, perspective warp, thresholds, the zip file) is plain canvas code here. The App is English only. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NS) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var PDFLIB = '/assets/vendor/pdf-lib-cantoo-2.11.1.min.js', PDFJS = '/vendor/pdf.min.js', PDFW = '/vendor/pdf.worker.min.js';
  /* tools in groups (owner 25 Nov: 17 more tools). Other files add theirs with NSFreeTools.add(key, label, group, make): make() returns the tool's node once. */
  var GROUPS = [['pdf', 'PDF'], ['pic', 'Pictures and scanning'], ['money', 'Money and tax'], ['legal', 'Legal and dates'], ['data', 'Office data'], ['share', 'Sharing and files'], ['trade', 'Trade']];
  var TABS = [['img', 'Resize pictures', 'pic'], ['sign', 'Clean signature', 'pic'], ['pdf', 'PDF extras', 'pdf'], ['scan', 'Scan documents', 'pic'], ['steel', 'Steel weight', 'trade']];
  var cur = 'img', NODES = {};

  /* ---------- small helpers ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function kb(n) { return n < 1024 ? n + ' bytes' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(2) + ' MB'; }
  function base(n) { return String(n || 'file').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '-'); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function fmt(n, d) { return (+n || 0).toLocaleString('en-IN', { maximumFractionDigits: d == null ? 2 : d }); }
  function canvasOf(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function blobOf(c, type, q) { return new Promise(function (r) { c.toBlob(function (b) { r(b); }, type, q); }); }
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var u = typeof src === 'string' ? src : URL.createObjectURL(src), im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('img')); }; im.src = u;
    });
  }
  function dims(s) { return [s.naturalWidth || s.videoWidth || s.width, s.naturalHeight || s.videoHeight || s.height]; }
  function fitCanvas(src, max) { var d = dims(src), k = Math.min(1, max / Math.max(d[0], d[1])), c = canvasOf(d[0] * k, d[1] * k); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; }
  function rotated(src) { var d = dims(src), c = canvasOf(d[1], d[0]), x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(src, 0, 0); return c; }
  function pdfLib() { return NS.loadJs(PDFLIB).then(function () { if (!window.PDFLib) throw new Error('load'); return window.PDFLib; }); }
  function pdfJs() { return NS.loadJs(PDFJS).then(function () { var l = window.pdfjsLib; if (!l) throw new Error('load'); l.GlobalWorkerOptions.workerSrc = PDFW; return l; }); }
  function libFail() { NS.toast('The PDF part did not load. Open NSBiz once with the internet on, then it works offline too.', 'bad'); }
  function fileBtn(id, label, accept, multi, primary) {
    return '<label class="btn' + (primary ? ' primary' : '') + '" for="' + id + '">' + label + '</label><input type="file" id="' + id + '" class="sr" accept="' + accept + '"' + (multi ? ' multiple' : '') + '>';
  }
  function onFiles(node, sel, fn) {   /* a file box and dropping files on the tool */
    var inp = $(sel, node); if (inp) inp.addEventListener('change', function () { var l = [].slice.call(inp.files); inp.value = ''; if (l.length) fn(l); });
    node.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); node.classList.add('fz-drop'); } });
    node.addEventListener('dragleave', function (e) { if (e.target === node) node.classList.remove('fz-drop'); });
    node.addEventListener('drop', function (e) { if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); node.classList.remove('fz-drop'); fn([].slice.call(e.dataTransfer.files)); });
  }
  function isImg(f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name); }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name); }
  function later(fn) { return new Promise(function (r) { setTimeout(function () { r(fn && fn()); }, 0); }); }

  /* a zip file without packing (pictures and PDFs are packed already): local headers, data, central list. No library. */
  var CRCT = null;
  function crc32(u) {
    if (!CRCT) { CRCT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c >>> 0; } }
    var x = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) x = CRCT[(x ^ u[i]) & 255] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(files) {
    var seen = {};
    files = files.map(function (f) { var n = f.name, i = 2; while (seen[n.toLowerCase()]) n = f.name.replace(/(\.[^.]+)?$/, ' (' + (i++) + ')$1'); seen[n.toLowerCase()] = 1; return { name: n, blob: f.blob }; });
    return Promise.all(files.map(function (f) { return f.blob.arrayBuffer(); })).then(function (bufs) {
      var parts = [], cen = [], off = 0, enc = new TextEncoder(), d = new Date();
      var tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      files.forEach(function (f, i) {
        var data = new Uint8Array(bufs[i]), nm = enc.encode(f.name), crc = crc32(data), lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, tm, true); lh.setUint16(12, dt, true);
        lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true);
        parts.push(lh.buffer, nm, data);
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, tm, true); ch.setUint16(14, dt, true);
        ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
        cen.push(ch.buffer, nm); off += 30 + nm.length + data.length;
      });
      var size = cen.reduce(function (s, p) { return s + p.byteLength; }, 0), e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
      return new Blob(parts.concat(cen, [e.buffer]), { type: 'application/zip' });
    });
  }
  /* the DPI written into a JPEG's JFIF header (portals that check "200 DPI" read it from there) */
  function setDpi(blob, dpi) {
    return blob.arrayBuffer().then(function (b) {
      var u = new Uint8Array(b);
      if (u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF && u[3] === 0xE0 && u[6] === 0x4A && u[7] === 0x46 && u[8] === 0x49 && u[9] === 0x46) { u[13] = 1; u[14] = u[16] = (dpi >> 8) & 255; u[15] = u[17] = dpi & 255; }
      return new Blob([u], { type: blob.type });
    });
  }

  /* ---------- crop box (a dialog): drag the box or its corners; arrow keys move it, Shift + arrows change its size ---------- */
  var RATIOS = [[0, 'Free shape'], [1, 'Square 1:1'], [4 / 3, 'Wide 4:3'], [3 / 4, 'Tall 3:4'], [16 / 9, 'Wide 16:9'], [35 / 45, 'Passport photo 35 x 45 mm'], [4 / 5, 'Tall 4:5']];
  function cropDialog(src, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var WH = dims(src), W = WH[0], H = WH[1], ratio = o.ratio || 0, r, done = false;
      var d = el('dialog', 'fz-dlg'); d.setAttribute('aria-label', 'Crop the picture');
      var RL = RATIOS.slice(), ri = -1; RL.forEach(function (x, i) { if (Math.abs(x[0] - ratio) < 0.002) ri = i; });
      if (ri < 0) { if (ratio) { RL.splice(1, 0, [ratio, 'The shape of the size you chose']); ri = 1; } else ri = 0; }
      d.innerHTML = '<h3>Crop</h3><p class="soft">Drag the box or its corners. With the box selected, arrow keys move it and Shift + arrow keys change its size.</p>' +
        '<div class="fz-row"><label>Shape <select data-r>' + RL.map(function (x, i) { return '<option value="' + i + '"' + (i === ri ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label><span class="soft" data-info></span></div>' +
        '<div class="fz-cropw"><div class="fz-crop"><img alt="The picture to crop"><div class="fz-box" tabindex="0" role="group" aria-label="Crop box"><i data-c="nw"></i><i data-c="ne"></i><i data-c="sw"></i><i data-c="se"></i></div></div></div>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-ok>Use this crop</button><button type="button" class="btn" data-full>Whole picture</button><button type="button" class="btn" data-x>Cancel</button></div>';
      document.body.appendChild(d);
      var img = $('img', d), box = $('.fz-box', d), info = $('[data-info]', d);
      img.src = src instanceof HTMLImageElement ? src.src : src.toDataURL('image/jpeg', 0.85);
      function full() { r = { x: 0, y: 0, w: W, h: H }; if (ratio) { var w = Math.min(W, H * ratio), h = w / ratio; r = { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h }; } }
      function clampR() { r.w = Math.max(10, Math.min(r.w, W)); r.h = Math.max(10, Math.min(r.h, H)); r.x = Math.max(0, Math.min(r.x, W - r.w)); r.y = Math.max(0, Math.min(r.y, H - r.h)); }
      function draw() { box.style.left = r.x / W * 100 + '%'; box.style.top = r.y / H * 100 + '%'; box.style.width = r.w / W * 100 + '%'; box.style.height = r.h / H * 100 + '%'; info.textContent = Math.round(r.w) + ' x ' + Math.round(r.h) + ' px'; }
      function setRatio(k) {
        ratio = k; if (!ratio) { draw(); return; }
        var cx = r.x + r.w / 2, cy = r.y + r.h / 2, w = Math.min(r.w, r.h * ratio), h = w / ratio;
        r = { x: cx - w / 2, y: cy - h / 2, w: w, h: h }; clampR(); draw();
      }
      if (o.rect) { r = { x: o.rect.x, y: o.rect.y, w: o.rect.w, h: o.rect.h }; clampR(); } else full();
      draw();
      $('[data-r]', d).addEventListener('change', function (e) { setRatio(RL[+e.target.value][0]); });
      var drag = null;
      box.addEventListener('pointerdown', function (e) {
        e.preventDefault(); box.focus(); box.setPointerCapture(e.pointerId);
        var c = e.target.getAttribute && e.target.getAttribute('data-c');
        drag = { c: c, x: e.clientX, y: e.clientY, r: { x: r.x, y: r.y, w: r.w, h: r.h } };
      });
      box.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var k = W / (img.clientWidth || 1), dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k, s = drag.r;
        if (!drag.c) { r = { x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }; clampR(); draw(); return; }
        var right = /e/.test(drag.c), down = /s/.test(drag.c);
        var fx = right ? s.x : s.x + s.w, fy = down ? s.y : s.y + s.h;     /* the fixed (opposite) corner */
        var px = (right ? s.x + s.w : s.x) + dx, py = (down ? s.y + s.h : s.y) + dy;
        var w = Math.max(10, right ? px - fx : fx - px), h = Math.max(10, down ? py - fy : fy - py);
        var mw = right ? W - fx : fx, mh = down ? H - fy : fy;
        if (ratio) { h = w / ratio; if (w > mw) { w = mw; h = w / ratio; } if (h > mh) { h = mh; w = h * ratio; } } else { w = Math.min(w, mw); h = Math.min(h, mh); }
        r = { x: right ? fx : fx - w, y: down ? fy : fy - h, w: w, h: h }; draw();
      });
      box.addEventListener('pointerup', function () { drag = null; });
      box.addEventListener('pointercancel', function () { drag = null; });
      box.addEventListener('keydown', function (e) {
        var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!m) return;
        e.preventDefault(); var st = Math.max(1, Math.round(W / 100));
        if (e.shiftKey) { r.w += m[0] * st + (ratio ? m[1] * st * ratio : 0); r.h = ratio ? r.w / ratio : r.h + m[1] * st; if (ratio && r.h > H - r.y) { r.h = H - r.y; r.w = r.h * ratio; } }
        else { r.x += m[0] * st; r.y += m[1] * st; }
        clampR(); draw();
      });
      function end(v) { if (done) return; done = true; if (d.open) d.close(); d.remove(); resolve(v); }
      $('[data-ok]', d).addEventListener('click', function () { end({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h), ratio: ratio }); });
      $('[data-full]', d).addEventListener('click', function () { ratio = 0; $('[data-r]', d).value = '0'; full(); draw(); });
      $('[data-x]', d).addEventListener('click', function () { end(null); });
      d.addEventListener('close', function () { end(null); });
      d.showModal(); box.focus();
    });
  }

  /* =====================================================================================================================
     1. RESIZE PICTURES to a size limit (KB) and/or a width and height. Size search: JPEG/WebP quality by halving the gap
        (7 steps), and if even the lowest quality is too big the picture is made smaller and tried again. PNG has no
        quality, so only its size in pixels goes down.
     ===================================================================================================================== */
  var IM = { list: [], kb: '100', kbc: '', mode: 'keep', w: '', h: '', wcm: '', hcm: '', dpi: '200', fmt: 'image/jpeg', busy: false };
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  function imLimit() { var k = IM.kb === 'c' ? num(IM.kbc) : num(IM.kb); return k > 0 ? Math.floor(k * 1024) : 0; }
  function imTarget(it) {   /* [width, height] wanted, and whether both were fixed */
    var c = it.crop || { w: it.w, h: it.h }, sw = c.w, sh = c.h, w = 0, h = 0;
    if (IM.mode === 'px') { w = num(IM.w); h = num(IM.h); }
    if (IM.mode === 'cm') { var dpi = num(IM.dpi) || 200; w = num(IM.wcm) / 2.54 * dpi; h = num(IM.hcm) / 2.54 * dpi; }
    if (w > 0 && h > 0) return { w: w, h: h, both: true };
    if (w > 0) return { w: w, h: w * sh / sw };
    if (h > 0) return { w: h * sw / sh, h: h };
    return { w: sw, h: sh };
  }
  function imDraw(it, t, scale) {
    var c0 = it.crop || { x: 0, y: 0, w: it.w, h: it.h }, s = { x: c0.x, y: c0.y, w: c0.w, h: c0.h };
    if (t.both) {   /* both sizes given: cut the middle of the picture to that shape (Crop chooses another part) */
      var want = t.w / t.h; if (s.w / s.h > want) { var nw = s.h * want; s.x += (s.w - nw) / 2; s.w = nw; } else { var nh = s.w / want; s.y += (s.h - nh) / 2; s.h = nh; }
    }
    var c = canvasOf(t.w * scale, t.h * scale), x = c.getContext('2d');
    if (IM.fmt === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
    x.imageSmoothingQuality = 'high'; x.drawImage(it.img, s.x, s.y, s.w, s.h, 0, 0, c.width, c.height);
    return c;
  }
  function imMake(it) {
    var lim = imLimit(), t = imTarget(it), mime = IM.fmt, lossy = mime !== 'image/png', lo = t.both ? 0.12 : 0.3;
    function step(scale, tries) {
      var c = imDraw(it, t, scale);
      function fin(b) { return { b: b, c: c, miss: lim && b.size > lim }; }
      function smaller(sz) { return tries > 12 || c.width < 24 ? null : step(scale * Math.min(0.92, Math.max(0.45, Math.sqrt(lim / sz) * 0.93)), tries + 1); }
      if (!lim) return blobOf(c, mime, lossy ? 0.92 : undefined).then(fin);
      if (!lossy) return blobOf(c, mime).then(function (b) { return b.size <= lim ? fin(b) : (smaller(b.size) || fin(b)); });
      function search(a, z, n, best) {
        if (n >= 7) return Promise.resolve(best);
        var q = (a + z) / 2;
        return blobOf(c, mime, q).then(function (b) { return b.size <= lim ? search(q, z, n + 1, b) : search(a, q, n + 1, best); });
      }
      return blobOf(c, mime, 0.95).then(function (b) {
        if (b.size <= lim) return fin(b);
        return blobOf(c, mime, lo).then(function (b2) {
          if (b2.size > lim) return smaller(b2.size) || fin(b2);
          return search(lo, 0.95, 0, b2).then(fin);
        });
      });
    }
    return step(1, 0).then(function (r) {
      var type = r.b.type || mime;
      return (IM.mode === 'cm' && type === 'image/jpeg' ? setDpi(r.b, Math.round(num(IM.dpi) || 200)) : Promise.resolve(r.b)).then(function (b) {
        it.out = b; it.ow = r.c.width; it.oh = r.c.height; it.miss = r.miss; it.ext = EXT[type] || 'png';
        it.small = Math.round(r.c.width) < Math.round(t.w) - 1;
      });
    });
  }
  function imName(it) { return base(it.name) + '-' + it.ow + 'x' + it.oh + '.' + it.ext; }
  function imNode() {
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Resize and compress pictures</h3><p class="soft">For forms and portals that want a photo, a signature or a scanned paper under a size such as 50 KB or 200 KB, or in a fixed width and height. Add one picture or many. Pictures never leave this computer.</p>' +
      '<div class="pr-bar">' + fileBtn('fz-im-file', 'Add pictures', 'image/*', true, true) + '<span class="soft">or drop pictures here</span></div>' +
      '<div class="fz-card"><div class="fz-row">' +
        '<label>Size limit <select data-o="kb"><option value="">No limit</option><option>20</option><option>50</option><option selected>100</option><option>200</option><option>500</option><option value="c">Other</option></select></label>' +
        '<label data-kbc hidden>Limit in KB <input type="number" min="5" step="1" data-o="kbc" inputmode="numeric"></label>' +
        '<label>Width and height <select data-o="mode"><option value="keep">Keep as it is</option><option value="px">In pixels</option><option value="cm">In cm (for printing)</option></select></label>' +
        '<label data-m="px" hidden>Width px <input type="number" min="1" data-o="w" inputmode="numeric"></label><label data-m="px" hidden>Height px <input type="number" min="1" data-o="h" inputmode="numeric"></label>' +
        '<label data-m="cm" hidden>Width cm <input type="number" min="0.1" step="0.1" data-o="wcm" inputmode="decimal"></label><label data-m="cm" hidden>Height cm <input type="number" min="0.1" step="0.1" data-o="hcm" inputmode="decimal"></label>' +
        '<label data-m="cm" hidden>DPI <input type="number" min="50" max="1200" data-o="dpi" value="200" inputmode="numeric"></label>' +
        '<label>Save as <select data-o="fmt"><option value="image/jpeg">JPG (smallest for photos)</option><option value="image/png">PNG (sharp text, bigger)</option><option value="image/webp">WebP</option></select></label>' +
      '</div><p class="fz-note">Leave width or height empty to keep the shape. When both are given, the middle of the picture is cut to that shape: use Crop to choose the part. Quick size: <button type="button" class="btn sm" data-pp>Passport photo 3.5 x 4.5 cm</button></p>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-go>Make the pictures</button><span class="soft" data-st aria-live="polite"></span></div></div>' +
      '<div class="fz-list" data-list></div>' +
      '<div class="pr-bar" data-all hidden><button type="button" class="btn" data-dlall data-ic="download">Download all</button><button type="button" class="btn" data-zip data-ic="download">Download all in one zip file</button><button type="button" class="btn" data-clear>Start again</button></div>';
    var list = $('[data-list]', n), st = $('[data-st]', n);
    function opts() {
      $('[data-kbc]', n).hidden = IM.kb !== 'c';
      $$('[data-m]', n).forEach(function (l) { l.hidden = l.getAttribute('data-m') !== IM.mode; });
    }
    $$('[data-o]', n).forEach(function (x) {
      var k = x.getAttribute('data-o'); x.value = IM[k];
      x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', function () { IM[k] = x.value; opts(); IM.list.forEach(function (it) { it.out = null; }); paint(); });
    });
    opts();
    $('[data-pp]', n).addEventListener('click', function () {
      IM.mode = 'cm'; IM.wcm = '3.5'; IM.hcm = '4.5'; if (!num(IM.dpi)) IM.dpi = '200';
      $$('[data-o]', n).forEach(function (x) { x.value = IM[x.getAttribute('data-o')]; }); opts();
      IM.list.forEach(function (it) { it.out = null; }); paint();
      NS.toast('Width 3.5 cm and height 4.5 cm set. Use Crop on each photo to keep the face in the middle.');
    });
    function paint() {
      var lim = imLimit();
      list.innerHTML = IM.list.map(function (it, i) {
        var res = it.out ? '<p class="' + (it.miss ? 'fz-bad' : 'fz-ok') + '"><b>After:</b> ' + kb(it.out.size) + ', ' + it.ow + ' x ' + it.oh + ' px' + (it.miss ? ' (could not reach the limit)' : '') + (it.small && !it.miss ? '. Made smaller in pixels to fit the limit.' : '') + '</p>' : '<p class="soft">Not made yet</p>';
        return '<div class="fz-item"><img class="fz-th" alt="" src="' + it.url + '"><p class="fz-nm" title="' + esc(it.name) + '"><b>' + esc(it.name) + '</b></p>' +
          '<p class="soft">Before: ' + kb(it.file.size) + ', ' + it.w + ' x ' + it.h + ' px' + (it.crop ? '; cropped to ' + it.crop.w + ' x ' + it.crop.h : '') + '</p>' + res +
          '<div class="pr-bar"><button type="button" class="btn sm" data-a="crop" data-i="' + i + '">Crop</button>' + (it.out ? '<button type="button" class="btn sm" data-a="dl" data-i="' + i + '" data-ic="download">Download</button>' : '') +
          '<button type="button" class="btn sm" data-a="rm" data-i="' + i + '" aria-label="Remove ' + esc(it.name) + '">Remove</button></div></div>';
      }).join('');
      $('[data-all]', n).hidden = !IM.list.some(function (it) { return it.out; });
      st.textContent = IM.list.length ? IM.list.length + ' picture' + (IM.list.length > 1 ? 's' : '') + (lim ? ', limit ' + Math.round(lim / 1024) + ' KB' : '') : '';
    }
    function add(files) {
      var pics = files.filter(isImg); if (!pics.length) { NS.toast('Choose JPG, PNG or WebP pictures.', 'bad'); return; }
      pics.reduce(function (p, f) {
        return p.then(function () { return loadImg(f).then(function (im) { IM.list.push({ file: f, name: f.name, img: im, url: im.src, w: im.naturalWidth, h: im.naturalHeight, crop: null, out: null }); }, function () { NS.toast('Could not open ' + f.name + '.', 'bad'); }); });
      }, Promise.resolve()).then(paint);
    }
    function makeAll() {
      if (!IM.list.length) { NS.toast('Add a picture first.', 'bad'); return; }
      if (IM.busy) return; IM.busy = true;
      var i = 0;
      IM.list.reduce(function (p, it) { return p.then(function () { st.textContent = 'Making ' + (++i) + ' of ' + IM.list.length + '…'; return later().then(function () { return imMake(it); }); }); }, Promise.resolve())
        .then(function () { IM.busy = false; paint(); var miss = IM.list.filter(function (x) { return x.miss; }).length; NS.toast(miss ? miss + ' picture(s) could not reach the size limit.' : 'Done. Download the pictures below.', miss ? 'bad' : ''); },
          function () { IM.busy = false; paint(); NS.toast('Could not make the pictures.', 'bad'); });
    }
    onFiles(n, '#fz-im-file', add);
    $('[data-go]', n).addEventListener('click', makeAll);
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var it = IM.list[+b.getAttribute('data-i')], a = b.getAttribute('data-a'); if (!it) return;
      if (a === 'rm') { IM.list.splice(IM.list.indexOf(it), 1); paint(); }
      else if (a === 'dl') NS.saveFile(it.out, imName(it));
      else if (a === 'crop') {
        var t = imTarget(it), rt = IM.mode !== 'keep' && num(IM.mode === 'px' ? IM.w : IM.wcm) && num(IM.mode === 'px' ? IM.h : IM.hcm) ? t.w / t.h : (it.crop && it.crop.ratio) || 0;
        cropDialog(it.img, { rect: it.crop, ratio: rt }).then(function (r) { if (!r) return; it.crop = r.w >= it.w - 1 && r.h >= it.h - 1 ? null : r; it.out = null; paint(); });
      }
    });
    $('[data-dlall]', n).addEventListener('click', function () {
      var l = IM.list.filter(function (x) { return x.out; });
      l.reduce(function (p, it) { return p.then(function () { NS.saveFile(it.out, imName(it)); return new Promise(function (r) { setTimeout(r, 350); }); }); }, Promise.resolve());
    });
    $('[data-zip]', n).addEventListener('click', function () {
      zip(IM.list.filter(function (x) { return x.out; }).map(function (it) { return { name: imName(it), blob: it.out }; })).then(function (z) { NS.saveFile(z, 'pictures-' + NS.today() + '.zip'); });
    });
    $('[data-clear]', n).addEventListener('click', function () { IM.list = []; paint(); });
    paint();
    return n;
  }

  /* =====================================================================================================================
     2. CLEAN SIGNATURE: the paper's brightness is measured in blocks (so a shadow across the photo does not turn grey),
        each dot is compared with the paper around it, darker than the line = ink. The edge is kept soft, small specks
        are removed, the picture is cut to the ink and saved as a PNG with a see-through background.
     ===================================================================================================================== */
  var SG = { src: null, name: '', thr: 0, auto: 0, ink: 'photo', dots: true, out: null };
  function background(L, w, h) {   /* paper brightness around every dot: block maximum, widened, smoothed, read back by interpolation */
    var B = Math.max(8, Math.round(Math.max(w, h) / 40)), gw = Math.ceil(w / B), gh = Math.ceil(h / B), g = new Float32Array(gw * gh), x, y, i;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = (y / B | 0) * gw + (x / B | 0); var v = L[y * w + x]; if (v > g[i]) g[i] = v; }
    function pass(fn) { var o = new Float32Array(g.length); for (var yy = 0; yy < gh; yy++) for (var xx = 0; xx < gw; xx++) { var acc = fn === 'max' ? 0 : 0, n = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = xx + dx, Y = yy + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; var q = g[Y * gw + X]; if (fn === 'max') { if (q > acc) acc = q; } else { acc += q; n++; } } o[yy * gw + xx] = fn === 'max' ? acc : acc / n; } g = o; }
    pass('max'); pass('mean'); pass('mean');
    var bg = new Float32Array(w * h);
    for (y = 0; y < h; y++) {
      var fy = Math.min(gh - 1, Math.max(0, (y + 0.5) / B - 0.5)), y0 = Math.floor(fy), y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
      for (x = 0; x < w; x++) {
        var fx = Math.min(gw - 1, Math.max(0, (x + 0.5) / B - 0.5)), x0 = Math.floor(fx), x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0;
        bg[y * w + x] = (g[y0 * gw + x0] * (1 - tx) + g[y0 * gw + x1] * tx) * (1 - ty) + (g[y1 * gw + x0] * (1 - tx) + g[y1 * gw + x1] * tx) * ty;
      }
    }
    return bg;
  }
  function lumOf(p, n) { var L = new Float32Array(n); for (var i = 0; i < n; i++) L[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2]; return L; }
  function otsu(hist, total) {
    var sum = 0, i; for (i = 0; i < 256; i++) sum += i * hist[i];
    var sB = 0, wB = 0, best = 0, t = 200;
    for (i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; var wF = total - wB; if (!wF) break; sB += i * hist[i]; var mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > best) { best = v; t = i; } }
    return t;
  }
  function signRatio(src) {   /* dot brightness compared with its paper: 1 = paper, lower = ink */
    var w = src.width, h = src.height, n = w * h, p = src.getContext('2d').getImageData(0, 0, w, h).data, L = lumOf(p, n), bg = background(L, w, h), V = new Float32Array(n), hist = new Uint32Array(256);
    for (var i = 0; i < n; i++) { var v = L[i] / Math.max(bg[i], 40); V[i] = v; hist[Math.max(0, Math.min(255, Math.round(v * 255)))]++; }
    return { V: V, p: p, w: w, h: h, t: otsu(hist, n) / 255 };
  }
  function signClean(R, thr, ink, dots) {
    var w = R.w, h = R.h, n = w * h, V = R.V, p = R.p, a = new Float32Array(n), i;
    for (i = 0; i < n; i++) a[i] = Math.max(0, Math.min(1, (thr - V[i]) / 0.1));
    if (dots) {   /* small specks (paper grain, dust) out: joined groups of ink dots smaller than a few dots */
      var seen = new Uint8Array(n), st = new Int32Array(n), minA = Math.max(6, Math.round(n * 0.00002));
      for (i = 0; i < n; i++) {
        if (seen[i] || a[i] < 0.25) continue;
        var top = 0, comp = [i]; st[top++] = i; seen[i] = 1;
        while (top) { var k = st[--top], x = k % w, y = (k - x) / w; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = x + d[0], Y = y + d[1]; if (X < 0 || Y < 0 || X >= w || Y >= h) return; var j = Y * w + X; if (!seen[j] && a[j] >= 0.25) { seen[j] = 1; st[top++] = j; if (comp.length <= minA) comp.push(j); } }); }
        if (comp.length < minA) comp.forEach(function (j) { a[j] = 0; });
      }
    }
    var x0 = w, y0 = h, x1 = -1, y1 = -1, xx, yy;
    for (yy = 0; yy < h; yy++) for (xx = 0; xx < w; xx++) if (a[yy * w + xx] > 0.15) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    if (x1 < 0) return null;
    var pad = Math.round(Math.max(6, Math.max(x1 - x0, y1 - y0) * 0.03)); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    var cw = x1 - x0 + 1, chh = y1 - y0 + 1, c = canvasOf(cw, chh), x = c.getContext('2d'), out = x.createImageData(cw, chh), o = out.data;
    var col = ink === 'black' ? [20, 20, 24] : ink === 'blue' ? [16, 44, 150] : null;
    for (yy = 0; yy < chh; yy++) for (xx = 0; xx < cw; xx++) {
      var s = (yy + y0) * w + xx + x0, d = (yy * cw + xx) * 4, al = a[s];
      if (!al) continue;
      if (col) { o[d] = col[0]; o[d + 1] = col[1]; o[d + 2] = col[2]; } else { var dk = 0.75; o[d] = p[s * 4] * dk; o[d + 1] = p[s * 4 + 1] * dk; o[d + 2] = p[s * 4 + 2] * dk; }
      o[d + 3] = Math.round(al * 255);
    }
    x.putImageData(out, 0, 0);
    return c;
  }
  function sgNode() {
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Clean a signature photo</h3><p class="soft">Sign on white paper with a dark pen, take a photo in good light (no shadow of the phone), and open it here. The paper is removed and you get a PNG with a see-through background for bills, letters and forms. The photo never leaves this computer.</p>' +
      '<div class="pr-bar">' + fileBtn('fz-sg-file', 'Open the signature photo', 'image/*', false, true) + '<button type="button" class="btn" data-a="crop" hidden>Crop the photo</button><button type="button" class="btn" data-a="rot" hidden>Turn 90°</button></div>' +
      '<div data-body hidden><div class="fz-card"><div class="fz-row">' +
        '<label class="fz-wide">Clean less  ↔  more <input type="range" min="30" max="98" step="1" data-thr aria-label="How much to keep: lower removes more grey"></label>' +
        '<label>Ink colour <select data-ink><option value="photo">As in the photo</option><option value="black">Black</option><option value="blue">Blue</option></select></label>' +
        '<label class="fz-chk"><input type="checkbox" data-dots checked> Remove small dots</label><button type="button" class="btn sm" data-auto>Auto again</button>' +
      '</div></div>' +
      '<div class="fz-sgprev fz-checker"><canvas data-out aria-label="The cleaned signature"></canvas></div><p class="soft" data-info></p>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-dl data-ic="download">Download PNG</button><button type="button" class="btn" data-use>Use on my bills</button></div></div>';
    var body = $('[data-body]', n), cv = $('[data-out]', n), info = $('[data-info]', n), thr = $('[data-thr]', n), R = null, timer;
    function run() {
      if (!SG.src) return;
      if (!R) R = signRatio(SG.src);
      if (!SG.thr) { SG.auto = Math.max(0.45, Math.min(0.95, R.t + 0.02)); SG.thr = SG.auto; }
      thr.value = Math.round(SG.thr * 100);
      var c = signClean(R, SG.thr, SG.ink, SG.dots);
      SG.out = c;
      if (!c) { cv.width = 1; cv.height = 1; info.textContent = 'No ink found. Move the slider to the right, or use a clearer photo.'; return; }
      cv.width = c.width; cv.height = c.height; var x = cv.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0);
      info.textContent = c.width + ' x ' + c.height + ' px, see-through background. If grey patches stay, move the slider left; if parts of the signature go missing, move it right.';
    }
    function setSrc(c) { SG.src = c; R = null; SG.thr = 0; body.hidden = false; $$('[data-a]', n).forEach(function (b) { b.hidden = false; }); run(); }
    function open(files) {
      var f = files.filter(isImg)[0]; if (!f) { NS.toast('Choose a photo (JPG or PNG).', 'bad'); return; }
      loadImg(f).then(function (im) { SG.name = f.name; SG.img = fitCanvas(im, 1600); setSrc(SG.img); }, function () { NS.toast('Could not open this photo.', 'bad'); });
    }
    onFiles(n, '#fz-sg-file', open);
    thr.addEventListener('input', function () { SG.thr = +thr.value / 100; clearTimeout(timer); timer = setTimeout(run, 60); });
    $('[data-ink]', n).addEventListener('change', function (e) { SG.ink = e.target.value; run(); });
    $('[data-dots]', n).addEventListener('change', function (e) { SG.dots = e.target.checked; run(); });
    $('[data-auto]', n).addEventListener('click', function () { SG.thr = 0; run(); });
    n.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !SG.img) return;
      if (b.getAttribute('data-a') === 'rot') { SG.img = rotated(SG.img); setSrc(SG.img); return; }
      cropDialog(SG.img, {}).then(function (r) { if (!r) return; var c = canvasOf(r.w, r.h); c.getContext('2d').drawImage(SG.img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); SG.img = c; setSrc(c); });
    });
    $('[data-dl]', n).addEventListener('click', function () { if (!SG.out) return; blobOf(SG.out, 'image/png').then(function (b) { NS.saveFile(b, 'signature-' + base(SG.name) + '.png'); }); });
    $('[data-use]', n).addEventListener('click', function () {
      if (!SG.out) return;
      var biz = A.biz && A.biz(); if (!biz || !biz.id) { NS.toast('Add your business first, then the signature can be saved on it. Download the PNG meanwhile.', 'bad'); return; }
      var url = fitCanvas(SG.out, 420).toDataURL('image/png');   /* the same size and kind My data keeps (business form: signature) */
      (biz.sign ? NS.ask('Replace the signature saved for ' + (biz.name || 'this business') + ' with this one?', { ok: 'Replace' }) : Promise.resolve(true)).then(function (ok) {
        if (!ok) return;
        var rec = JSON.parse(JSON.stringify(biz)); rec.sign = url;
        NSStore.put('biz', rec).then(function () { NS.toast('Saved as the signature of ' + (biz.name || 'your business') + '. New bills print it.'); }, function (e) { NS.toast('Could not save: ' + (e && e.message || e), 'bad'); });
      });
    });
    return n;
  }

  /* =====================================================================================================================
     3. PDF EXTRAS. Pages (turn, delete, move, page numbers, watermark) and pictures to PDF use pdf-lib; compress draws each
        page with pdf.js and keeps it as a JPEG picture (the text can then no longer be selected: the screen says so).
     ===================================================================================================================== */
  var PD = { mode: 'pages', pg: null, pics: [], picPage: 'a4', picMargin: '10', cmp: null, cq: 'm', num: { on: false, fmt: 'Page {n} of {t}', pos: 'bc', start: 1 }, wm: { on: false, text: '', op: 0.18, size: 60 } };
  var A4 = [595.28, 841.89];
  function pdfThumbs(bytes, box, onEach) {   /* thumbnails of the pages with pdf.js; returns the page count */
    return pdfJs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false }).promise; }).then(function (doc) {
      var n = doc.numPages, i = 0;
      function next() {
        if (i >= n || i >= 400) return Promise.resolve(n);
        var k = ++i;
        return doc.getPage(k).then(function (p) {
          var v0 = p.getViewport({ scale: 1 }), sc = 150 / Math.max(v0.width, v0.height), v = p.getViewport({ scale: sc }), c = canvasOf(v.width, v.height);
          return p.render({ canvasContext: c.getContext('2d'), viewport: v }).promise.then(function () { onEach(k - 1, c.toDataURL('image/jpeg', 0.7), p.rotate || 0); });
        }).then(next, next);
      }
      return next();
    });
  }
  /* a point on the page as you see it (u from the left, v from the bottom) -> PDF page space, for a page turned R degrees */
  function toPage(u, v, R, box) {
    var w = box.width, h = box.height, x, y;
    if (R === 90) { x = w - v; y = u; } else if (R === 180) { x = w - u; y = h - v; } else if (R === 270) { x = v; y = h - u; } else { x = u; y = v; }
    return { x: x + box.x, y: y + box.y };
  }
  function wmImage(text, size) {   /* the watermark drawn as a picture: any language and script works */
    var c = canvasOf(10, 10), x = c.getContext('2d'), f = 'bold ' + size * 3 + 'px system-ui, "Noto Sans", "Nirmala UI", sans-serif';
    x.font = f; var w = Math.ceil(x.measureText(text).width) + 20, hh = Math.ceil(size * 3 * 1.35);
    c.width = w; c.height = hh; x = c.getContext('2d'); x.font = f; x.fillStyle = '#6b7280'; x.textBaseline = 'middle'; x.fillText(text, 10, hh / 2);
    return c;
  }
  function savePages() {
    var P = PD.pg; if (!P) return;
    var keep = P.pages.filter(function (p) { return !p.del; });
    if (!keep.length) { NS.toast('Every page is marked to delete. Keep at least one.', 'bad'); return; }
    if (PD.wm.on && !String(PD.wm.text).trim()) { NS.toast('Type the watermark text, or untick Watermark.', 'bad'); return; }
    NS.toast('Making the PDF…');
    pdfLib().then(function (L) {
      return L.PDFDocument.load(P.bytes, { ignoreEncryption: true }).then(function (src) {
        return L.PDFDocument.create().then(function (out) {
          return out.copyPages(src, keep.map(function (p) { return p.i; })).then(function (pages) {
            return out.embedFont(L.StandardFonts.Helvetica).then(function (font) {
              var wmP = PD.wm.on ? blobOf(wmImage(String(PD.wm.text).trim(), PD.wm.size), 'image/png').then(function (b) { return b.arrayBuffer(); }).then(function (b) { return out.embedPng(b); }) : Promise.resolve(null);
              return wmP.then(function (wm) {
                var total = pages.length;
                pages.forEach(function (pg, k) {
                  out.addPage(pg);
                  var R = (((pg.getRotation().angle || 0) + keep[k].rot) % 360 + 360) % 360; pg.setRotation(L.degrees(R));
                  var box = pg.getCropBox(), vw = R % 180 ? box.height : box.width, vh = R % 180 ? box.width : box.height;
                  function put(cx, cy, wd, ht, ang, draw) {   /* centre (cx, cy) as seen, turned ang degrees as seen */
                    var t = ang * Math.PI / 180, ux = cx - (Math.cos(t) * wd / 2 - Math.sin(t) * ht / 2), vy = cy - (Math.sin(t) * wd / 2 + Math.cos(t) * ht / 2), p0 = toPage(ux, vy, R, box);
                    draw(p0.x, p0.y, L.degrees(R + ang));
                  }
                  if (PD.num.on) {
                    var s = PD.num.fmt.replace('{n}', k + (+PD.num.start || 1)).replace('{t}', total + (+PD.num.start || 1) - 1), fs = 10, tw = font.widthOfTextAtSize(s, fs);
                    var cx = PD.num.pos === 'br' ? vw - 36 - tw / 2 : PD.num.pos === 'tr' ? vw - 36 - tw / 2 : vw / 2, cy = /^t/.test(PD.num.pos) ? vh - 24 : 22;
                    put(cx, cy, tw, fs * 0.7, 0, function (x, y, rot) { pg.drawText(s, { x: x, y: y, size: fs, font: font, color: L.rgb(0.2, 0.2, 0.2), rotate: rot }); });
                  }
                  if (wm) {
                    var diag = Math.sqrt(vw * vw + vh * vh), k2 = Math.min(1, diag * 0.75 / wm.width, vh * 0.5 / wm.height), iw = wm.width * k2, ih = wm.height * k2;
                    put(vw / 2, vh / 2, iw, ih, Math.atan2(vh, vw) * 180 / Math.PI, function (x, y, rot) { pg.drawImage(wm, { x: x, y: y, width: iw, height: ih, rotate: rot, opacity: +PD.wm.op || 0.18 }); });
                  }
                });
                return out.save();
              });
            });
          });
        });
      });
    }).then(function (b) {
      var nm = base(P.name) + ' (edited).pdf'; NS.saveFile(new Blob([b], { type: 'application/pdf' }), nm);
      NS.toast('Saved "' + nm + '": ' + keep.length + ' page' + (keep.length > 1 ? 's' : '') + '.');
    }, function (e) { if (e && e.message === 'load') libFail(); else NS.toast('Could not make the PDF. It may be protected against changes.', 'bad'); });
  }
  var CQ = { s: [100, 0.5, 'Smallest (100 DPI)'], m: [150, 0.68, 'Medium (150 DPI)'], g: [200, 0.8, 'Good for printing (200 DPI)'] };
  function compress(rep) {
    var C = PD.cmp; if (!C) return;
    var q = CQ[PD.cq] || CQ.m;
    Promise.all([pdfJs(), pdfLib()]).then(function (libs) {
      return libs[0].getDocument({ data: new Uint8Array(C.bytes.slice(0)), isEvalSupported: false }).promise.then(function (doc) {
        return libs[1].PDFDocument.create().then(function (out) {
          var i = 0;
          function next() {
            if (i >= doc.numPages) return out.save();
            var k = ++i; rep('Page ' + k + ' of ' + doc.numPages + '…');
            return doc.getPage(k).then(function (p) {
              var v1 = p.getViewport({ scale: 1 }), v = p.getViewport({ scale: q[0] / 72 }), c = canvasOf(v.width, v.height), x = c.getContext('2d');
              x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
              return p.render({ canvasContext: x, viewport: v }).promise.then(function () { return blobOf(c, 'image/jpeg', q[1]); }).then(function (b) { return b.arrayBuffer(); }).then(function (b) { return out.embedJpg(b); }).then(function (im) {
                var pg = out.addPage([v1.width, v1.height]); pg.drawImage(im, { x: 0, y: 0, width: v1.width, height: v1.height }); p.cleanup();
              });
            }).then(next);
          }
          return next();
        });
      });
    }).then(function (b) {
      C.out = new Blob([b], { type: 'application/pdf' }); rep('');
    }, function (e) { rep(''); if (e && e.message === 'load') libFail(); else NS.toast('Could not compress this PDF. It may be damaged or protected with a password.', 'bad'); });
  }
  function picsPdf() {
    if (!PD.pics.length) return;
    NS.toast('Making the PDF…');
    pdfLib().then(function (L) {
      return L.PDFDocument.create().then(function (out) {
        var m = num(PD.picMargin) * 72 / 25.4;
        return PD.pics.reduce(function (pr, it) {
          return pr.then(function () {
            var c = fitCanvas(it.img, 2480);
            var w = canvasOf(c.width, c.height), wx = w.getContext('2d'); wx.fillStyle = '#fff'; wx.fillRect(0, 0, w.width, w.height); wx.drawImage(c, 0, 0);   /* see-through parts white */
            return blobOf(w, 'image/jpeg', 0.86).then(function (b) { return b.arrayBuffer(); }).then(function (b) { return out.embedJpg(b); }).then(function (im) {
              var iw = im.width, ih = im.height, pw, ph;
              if (PD.picPage === 'fit') { pw = A4[0]; ph = (pw - 2 * m) * ih / iw + 2 * m; }
              else { var land = PD.picPage === 'land' || (PD.picPage === 'auto' && iw > ih); pw = land ? A4[1] : A4[0]; ph = land ? A4[0] : A4[1]; }
              var aw = pw - 2 * m, ah = ph - 2 * m, k = Math.min(aw / iw, ah / ih), dw = iw * k, dh = ih * k;
              out.addPage([pw, ph]).drawImage(im, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
            });
          });
        }, Promise.resolve()).then(function () { return out.save(); });
      });
    }).then(function (b) { var nm = base(PD.pics[0].name) + (PD.pics.length > 1 ? ' and ' + (PD.pics.length - 1) + ' more' : '') + '.pdf'; NS.saveFile(new Blob([b], { type: 'application/pdf' }), nm); NS.toast('Saved "' + nm + '".'); },
      function (e) { if (e && e.message === 'load') libFail(); else NS.toast('Could not make the PDF.', 'bad'); });
  }
  function reorderList(cont, list, attr, paint) {   /* drag to reorder (mouse), plus the arrow buttons for touch and keyboard */
    var from = -1;
    cont.addEventListener('dragstart', function (e) { var c = e.target.closest('[' + attr + ']'); if (!c) return; from = +c.getAttribute(attr); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(from)); } catch (x) {} });
    cont.addEventListener('dragover', function (e) { if (from >= 0 && e.target.closest('[' + attr + ']')) e.preventDefault(); });
    cont.addEventListener('drop', function (e) {
      var c = e.target.closest('[' + attr + ']'); if (from < 0 || !c) return; e.preventDefault(); e.stopPropagation();
      var to = +c.getAttribute(attr), l = list(); if (to !== from) { var x = l.splice(from, 1)[0]; l.splice(to, 0, x); paint(); } from = -1;
    });
    cont.addEventListener('dragend', function () { from = -1; });
  }
  function pdNode() {
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>PDF extras</h3><div class="pr-bar fz-sub" role="group" aria-label="PDF tools"><button type="button" class="btn" data-m="pages">Pages, numbers, watermark</button><button type="button" class="btn" data-m="pics">Pictures to PDF</button><button type="button" class="btn" data-m="cmp">Compress a PDF</button></div>' +
      /* pages */
      '<div data-p="pages"><p class="soft">Turn pages, delete them or change their order, add page numbers or a watermark (for example "COPY" or "PAID"). The file you open is not changed: a new PDF is saved. Nothing leaves this computer.</p>' +
        '<div class="pr-bar">' + fileBtn('fz-pg-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '</div><div data-pgbody></div></div>' +
      /* pictures */
      '<div data-p="pics" hidden><p class="soft">Put photos or scans into one PDF, one picture on each page. Change the order by dragging or with the arrows.</p>' +
        '<div class="pr-bar">' + fileBtn('fz-pi-file', 'Add pictures', 'image/*', true, true) + '</div>' +
        '<div class="fz-card"><div class="fz-row"><label>Page <select data-pp><option value="a4">A4 standing</option><option value="land">A4 lying</option><option value="auto">A4, turned to suit each picture</option><option value="fit">A4 width, height of the picture</option></select></label>' +
        '<label>Margin <select data-pm><option value="0">None</option><option value="5">5 mm</option><option value="10" selected>10 mm</option><option value="15">15 mm</option></select></label></div></div>' +
        '<div class="fz-pages" data-pilist></div><div class="pr-bar" data-pisave hidden><button type="button" class="btn primary" data-pigo data-ic="download">Make the PDF</button><button type="button" class="btn" data-piclr>Start again</button></div></div>' +
      /* compress */
      '<div data-p="cmp" hidden><p class="soft">Makes a big PDF (scans, photos) smaller for e-mail and portals. Each page is kept as a picture, so its text can no longer be selected or searched: keep the original too. Nothing leaves this computer.</p>' +
        '<div class="pr-bar">' + fileBtn('fz-cm-file', 'Open a PDF', '.pdf,application/pdf', false, true) + '<label>Quality <select data-cq>' + Object.keys(CQ).map(function (k) { return '<option value="' + k + '"' + (k === 'm' ? ' selected' : '') + '>' + CQ[k][2] + '</option>'; }).join('') + '</select></label></div><div data-cmbody></div></div>';
    function sub() {
      $$('[data-m]', n).forEach(function (b) { var on = b.getAttribute('data-m') === PD.mode; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', on); });
      $$('[data-p]', n).forEach(function (p) { p.hidden = p.getAttribute('data-p') !== PD.mode; });
    }
    $$('[data-m]', n).forEach(function (b) { b.addEventListener('click', function () { PD.mode = b.getAttribute('data-m'); sub(); }); });
    sub();
    /* --- pages --- */
    var pgBody = $('[data-pgbody]', n);
    function pgPaint() {
      var P = PD.pg; if (!P) { pgBody.innerHTML = ''; return; }
      var kept = P.pages.filter(function (p) { return !p.del; }).length;
      pgBody.innerHTML = '<p><b>' + esc(P.name) + '</b>: ' + P.pages.length + ' pages, ' + kept + ' kept. Drag a page to move it, or use the arrows.</p>' +
        '<div class="fz-pages" data-pglist>' + P.pages.map(function (p, k) {
          return '<div class="fz-pg' + (p.del ? ' fz-del' : '') + '" draggable="true" data-pgi="' + k + '"><div class="fz-pth">' + (p.thumb ? '<img alt="Page ' + (p.i + 1) + '" src="' + p.thumb + '" style="transform:rotate(' + p.rot + 'deg)">' : '<span class="soft">Page ' + (p.i + 1) + '</span>') + '</div>' +
            '<p>Page ' + (p.i + 1) + (p.del ? ' <b class="fz-bad">will be deleted</b>' : '') + '</p><div class="fz-pgb">' +
            '<button type="button" class="btn sm" data-g="l" data-k="' + k + '" aria-label="Turn page ' + (p.i + 1) + ' left" title="Turn left">⟲</button><button type="button" class="btn sm" data-g="r" data-k="' + k + '" aria-label="Turn page ' + (p.i + 1) + ' right" title="Turn right">⟳</button>' +
            '<button type="button" class="btn sm" data-g="up" data-k="' + k + '" aria-label="Move page ' + (p.i + 1) + ' earlier" title="Move earlier"' + (k ? '' : ' disabled') + '>←</button><button type="button" class="btn sm" data-g="dn" data-k="' + k + '" aria-label="Move page ' + (p.i + 1) + ' later" title="Move later"' + (k < P.pages.length - 1 ? '' : ' disabled') + '>→</button>' +
            '<button type="button" class="btn sm" data-g="x" data-k="' + k + '">' + (p.del ? 'Keep' : 'Delete') + '</button></div></div>';
        }).join('') + '</div>' +
        '<div class="fz-card"><div class="fz-row"><label class="fz-chk"><input type="checkbox" data-nu' + (PD.num.on ? ' checked' : '') + '> Page numbers</label>' +
          '<label>Style <select data-nf>' + ['{n}', 'Page {n}', 'Page {n} of {t}', '{n} / {t}', '- {n} -'].map(function (f) { return '<option value="' + f + '"' + (f === PD.num.fmt ? ' selected' : '') + '>' + f.replace('{n}', '1').replace('{t}', '9') + '</option>'; }).join('') + '</select></label>' +
          '<label>Where <select data-np><option value="bc"' + (PD.num.pos === 'bc' ? ' selected' : '') + '>Bottom middle</option><option value="br"' + (PD.num.pos === 'br' ? ' selected' : '') + '>Bottom right</option><option value="tr"' + (PD.num.pos === 'tr' ? ' selected' : '') + '>Top right</option></select></label>' +
          '<label>First number <input type="number" min="1" data-ns value="' + PD.num.start + '" inputmode="numeric"></label></div>' +
          '<div class="fz-row"><label class="fz-chk"><input type="checkbox" data-wo' + (PD.wm.on ? ' checked' : '') + '> Watermark</label><label class="fz-wide">Text <input data-wt value="' + esc(PD.wm.text) + '" placeholder="for example COPY, PAID, DRAFT"></label>' +
          '<label>Strength <select data-wp><option value="0.1">Light</option><option value="0.18" selected>Normal</option><option value="0.3">Dark</option></select></label></div>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-pgsave data-ic="download">Save the new PDF</button><button type="button" class="btn" data-pgclr>Close this PDF</button></div></div>';
      var wp = $('[data-wp]', pgBody); if (wp) wp.value = String(PD.wm.op);
    }
    onFiles($('[data-p="pages"]', n), '#fz-pg-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      f.arrayBuffer().then(function (b) {
        NS.toast('Reading ' + f.name + '…');
        return pdfLib().then(function (L) { return L.PDFDocument.load(b, { ignoreEncryption: true }); }).then(function (doc) {
          PD.pg = { name: f.name, bytes: b, pages: doc.getPages().map(function (p, i) { return { i: i, rot: 0, del: false, thumb: '' }; }) }; pgPaint();
          var P = PD.pg;
          return pdfThumbs(b, null, function (i, url) {
            if (PD.pg !== P) return; var k = -1; P.pages.forEach(function (x, j) { if (x.i === i) k = j; }); if (k < 0) return;
            var p = P.pages[k], box = $('[data-pgi="' + k + '"] .fz-pth', pgBody); p.thumb = url;
            if (box) box.innerHTML = '<img alt="Page ' + (i + 1) + '" src="' + url + '" style="transform:rotate(' + p.rot + 'deg)">';
          }).then(null, function () { /* no thumbnails (pdf.js not loaded): turning, moving and numbering still work */ });
        });
      }).catch(function (e) { if (e && e.message === 'load') libFail(); else NS.toast('Could not read this PDF. It may be damaged or protected with a password.', 'bad'); });
    });
    pgBody.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (b) {
        var P = PD.pg, k = +b.getAttribute('data-k'), p = P.pages[k], g = b.getAttribute('data-g');
        if (g === 'l') p.rot = (p.rot + 270) % 360; else if (g === 'r') p.rot = (p.rot + 90) % 360; else if (g === 'x') p.del = !p.del;
        else { var j = g === 'up' ? k - 1 : k + 1; P.pages[k] = P.pages[j]; P.pages[j] = p; }
        pgPaint(); var f = $('[data-g="' + g + '"][data-k="' + (g === 'up' ? k - 1 : g === 'dn' ? k + 1 : k) + '"]', pgBody); if (f && !f.disabled) f.focus();
        return;
      }
      if (e.target.closest('[data-pgsave]')) savePages();
      if (e.target.closest('[data-pgclr]')) { PD.pg = null; pgPaint(); }
    });
    pgBody.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-nu]')) PD.num.on = t.checked; else if (t.matches('[data-nf]')) PD.num.fmt = t.value; else if (t.matches('[data-np]')) PD.num.pos = t.value;
      else if (t.matches('[data-ns]')) PD.num.start = Math.max(1, Math.round(num(t.value)) || 1); else if (t.matches('[data-wo]')) PD.wm.on = t.checked; else if (t.matches('[data-wp]')) PD.wm.op = +t.value;
    });
    pgBody.addEventListener('input', function (e) { if (e.target.matches('[data-wt]')) { PD.wm.text = e.target.value; if (e.target.value && !PD.wm.on) { PD.wm.on = true; var c = $('[data-wo]', pgBody); if (c) c.checked = true; } } });
    reorderList(pgBody, function () { return PD.pg.pages; }, 'data-pgi', pgPaint);
    /* --- pictures --- */
    var piList = $('[data-pilist]', n);
    function piPaint() {
      piList.innerHTML = PD.pics.map(function (it, k) {
        return '<div class="fz-pg" draggable="true" data-pii="' + k + '"><div class="fz-pth"><img alt="" src="' + it.url + '"></div><p class="fz-nm" title="' + esc(it.name) + '">' + (k + 1) + '. ' + esc(it.name) + '</p><div class="fz-pgb">' +
          '<button type="button" class="btn sm" data-q="up" data-k="' + k + '" aria-label="Move ' + esc(it.name) + ' earlier"' + (k ? '' : ' disabled') + '>←</button><button type="button" class="btn sm" data-q="dn" data-k="' + k + '" aria-label="Move ' + esc(it.name) + ' later"' + (k < PD.pics.length - 1 ? '' : ' disabled') + '>→</button>' +
          '<button type="button" class="btn sm" data-q="rot" data-k="' + k + '" aria-label="Turn ' + esc(it.name) + '">⟳</button><button type="button" class="btn sm" data-q="x" data-k="' + k + '">Remove</button></div></div>';
      }).join('');
      $('[data-pisave]', n).hidden = !PD.pics.length;
    }
    onFiles($('[data-p="pics"]', n), '#fz-pi-file', function (files) {
      files.filter(isImg).reduce(function (p, f) { return p.then(function () { return loadImg(f).then(function (im) { PD.pics.push({ name: f.name, img: im, url: im.src }); }, function () { NS.toast('Could not open ' + f.name + '.', 'bad'); }); }); }, Promise.resolve()).then(piPaint);
    });
    piList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return; var k = +b.getAttribute('data-k'), q = b.getAttribute('data-q'), l = PD.pics;
      if (q === 'x') l.splice(k, 1); else if (q === 'rot') { var c = rotated(l[k].img); l[k].img = c; l[k].url = c.toDataURL('image/jpeg', 0.6); }
      else { var j = q === 'up' ? k - 1 : k + 1, t = l[k]; l[k] = l[j]; l[j] = t; }
      piPaint();
    });
    reorderList(piList, function () { return PD.pics; }, 'data-pii', piPaint);
    $('[data-pp]', n).addEventListener('change', function (e) { PD.picPage = e.target.value; });
    $('[data-pm]', n).addEventListener('change', function (e) { PD.picMargin = e.target.value; });
    $('[data-pigo]', n).addEventListener('click', picsPdf);
    $('[data-piclr]', n).addEventListener('click', function () { PD.pics = []; piPaint(); });
    /* --- compress --- */
    var cmBody = $('[data-cmbody]', n);
    function cmPaint(msg) {
      var C = PD.cmp; if (!C) { cmBody.innerHTML = ''; return; }
      var res = '';
      if (C.out) {
        var smaller = C.out.size < C.size;
        res = '<p class="' + (smaller ? 'fz-ok' : 'fz-bad') + '"><b>New size: ' + kb(C.out.size) + '</b> (was ' + kb(C.size) + (smaller ? ', ' + Math.round(100 - C.out.size / C.size * 100) + '% smaller' : '') + ').' + (smaller ? '' : ' This PDF is already small: the new file is not smaller, so keep the original.') + '</p>' +
          (smaller ? '<div class="pr-bar"><button type="button" class="btn primary" data-cmdl data-ic="download">Download the smaller PDF</button></div>' : '');
      }
      cmBody.innerHTML = '<p><b>' + esc(C.name) + '</b>: ' + kb(C.size) + '</p><div class="pr-bar"><button type="button" class="btn primary" data-cmgo>Compress</button><span class="soft" aria-live="polite" data-cmst>' + esc(msg || '') + '</span></div>' + res;
    }
    onFiles($('[data-p="cmp"]', n), '#fz-cm-file', function (files) {
      var f = files.filter(isPdf)[0]; if (!f) { NS.toast('Choose a PDF file.', 'bad'); return; }
      f.arrayBuffer().then(function (b) { PD.cmp = { name: f.name, bytes: b, size: f.size, out: null }; cmPaint(); });
    });
    $('[data-cq]', n).addEventListener('change', function (e) { PD.cq = e.target.value; if (PD.cmp) { PD.cmp.out = null; cmPaint(); } });
    cmBody.addEventListener('click', function (e) {
      if (e.target.closest('[data-cmgo]')) { PD.cmp.out = null; cmPaint('Starting…'); compress(function (m) { var s = $('[data-cmst]', cmBody); if (m) { if (s) s.textContent = m; } else cmPaint(); }); }
      if (e.target.closest('[data-cmdl]')) NS.saveFile(PD.cmp.out, base(PD.cmp.name) + ' (smaller).pdf');
    });
    return n;
  }

  /* =====================================================================================================================
     4. SCAN DOCUMENTS: a page photo (camera or file), four corners put on the paper's corners, the paper straightened by a
        perspective warp (a homography solved from the four corners), then a filter. Pages -> one PDF or pictures.
     ===================================================================================================================== */
  var SC = { pages: [], cur: null, filter: 'clean', shape: 'auto', stream: null, page: 'a4' };
  function solve8(M, b) {   /* Gaussian elimination, 8 x 8 */
    var n = 8, i, j, k;
    for (i = 0; i < n; i++) M[i] = M[i].concat([b[i]]);
    for (i = 0; i < n; i++) {
      var mx = i; for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[mx][i])) mx = k;
      var t = M[i]; M[i] = M[mx]; M[mx] = t;
      if (Math.abs(M[i][i]) < 1e-12) return null;
      for (k = i + 1; k < n; k++) { var f = M[k][i] / M[i][i]; for (j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { var s = M[i][n]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  function homography(q, W, H) {   /* maps the straight page (0,0),(W,0),(W,H),(0,H) onto the four corners q in the photo */
    var d = [[0, 0], [W, 0], [W, H], [0, H]], M = [], b = [];
    for (var i = 0; i < 4; i++) { var x = d[i][0], y = d[i][1], u = q[i][0], v = q[i][1]; M.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); M.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
    return solve8(M, b);
  }
  function warp(src, q, shape) {
    var dd = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    var W = Math.max(dd(q[0], q[1]), dd(q[3], q[2])), H = Math.max(dd(q[0], q[3]), dd(q[1], q[2])), k;
    /* a photo taken at a slant cannot tell the paper's true shape; "A4" sets it (standing or lying, whichever is nearer) */
    if (shape === 'a4') { if (H >= W) H = W * Math.SQRT2; else W = H * Math.SQRT2; }
    k = Math.min(1, 2400 / Math.max(W, H));
    W = Math.max(8, Math.round(W * k)); H = Math.max(8, Math.round(H * k));
    var h = homography(q, W, H); if (!h) return null;
    var sw = src.width, sh = src.height, sp = src.getContext('2d').getImageData(0, 0, sw, sh).data, c = canvasOf(W, H), x = c.getContext('2d'), out = x.createImageData(W, H), o = out.data;
    for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) {
      var den = h[6] * xx + h[7] * y + 1, sx = (h[0] * xx + h[1] * y + h[2]) / den, sy = (h[3] * xx + h[4] * y + h[5]) / den, di = (y * W + xx) * 4;
      if (sx < 0) sx = 0; if (sy < 0) sy = 0; if (sx > sw - 1.001) sx = sw - 1.001; if (sy > sh - 1.001) sy = sh - 1.001;
      var x0 = sx | 0, y0 = sy | 0, tx = sx - x0, ty = sy - y0, a = (y0 * sw + x0) * 4, b2 = a + 4, c2 = a + sw * 4, e = c2 + 4;
      for (var ch = 0; ch < 3; ch++) o[di + ch] = (sp[a + ch] * (1 - tx) + sp[b2 + ch] * tx) * (1 - ty) + (sp[c2 + ch] * (1 - tx) + sp[e + ch] * tx) * ty;
      o[di + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return c;
  }
  function filterOf(c0, f) {
    if (f === 'colour') return c0;
    var w = c0.width, h = c0.height, n = w * h, c = canvasOf(w, h), x = c.getContext('2d'); x.drawImage(c0, 0, 0);
    var im = x.getImageData(0, 0, w, h), p = im.data, L = lumOf(p, n), i;
    if (f === 'grey') {   /* grey, stretched from the darkest 1% to the lightest 1% */
      var hist = new Uint32Array(256); for (i = 0; i < n; i++) hist[L[i] | 0]++;
      var lo = 0, hi = 255, acc = 0; for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > n * 0.01) { lo = i; break; } } acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > n * 0.01) { hi = i; break; } }
      var sc = 255 / Math.max(1, hi - lo); for (i = 0; i < n; i++) { var g = Math.max(0, Math.min(255, (L[i] - lo) * sc)); p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = g; }
    } else if (f === 'bw') {   /* black and white: each dot against the average of the dots around it (Bradley's method, integral image) */
      var S = new Float64Array((w + 1) * (h + 1)), r = Math.max(4, Math.round(Math.max(w, h) / 32)), xx, y;
      for (y = 0; y < h; y++) { var row = 0; for (xx = 0; xx < w; xx++) { row += L[y * w + xx]; S[(y + 1) * (w + 1) + xx + 1] = S[y * (w + 1) + xx + 1] + row; } }
      for (y = 0; y < h; y++) for (xx = 0; xx < w; xx++) {
        var x1 = Math.max(0, xx - r), x2 = Math.min(w - 1, xx + r), y1 = Math.max(0, y - r), y2 = Math.min(h - 1, y + r), cnt = (x2 - x1 + 1) * (y2 - y1 + 1);
        var sum = S[(y2 + 1) * (w + 1) + x2 + 1] - S[y1 * (w + 1) + x2 + 1] - S[(y2 + 1) * (w + 1) + x1] + S[y1 * (w + 1) + x1];
        i = y * w + xx; var v = L[i] * cnt <= sum * 0.85 ? 0 : 255; p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v;
      }
    } else {   /* clean: the paper made white, colours kept (each dot divided by the paper brightness around it) */
      var bg = background(L, w, h);
      for (i = 0; i < n; i++) { var k = 255 / Math.max(bg[i], 60); for (var ch = 0; ch < 3; ch++) { var vv = p[i * 4 + ch] * k; vv = vv > 235 ? 255 : vv; p[i * 4 + ch] = Math.min(255, vv); } }
    }
    x.putImageData(im, 0, 0);
    return c;
  }
  function stopCam() { if (SC.stream) { SC.stream.getTracks().forEach(function (t) { t.stop(); }); SC.stream = null; } var v = NODES.scan && $('video', NODES.scan); if (v) { v.srcObject = null; v.closest('[data-cam]').hidden = true; } }
  function scNode() {
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Scan documents</h3><p class="soft">Take a photo of a bill, letter or form (or open photos you already have). Put the four round markers on the paper’s corners: the page is straightened and cleaned. Make one PDF of all pages, or pictures. Nothing leaves this device.</p>' +
      '<div class="pr-bar"><button type="button" class="btn primary" data-cam-on>Use the camera</button>' + fileBtn('fz-sc-file', 'Open photos', 'image/*', true, false) + '</div>' +
      '<div class="fz-card" data-cam hidden><video class="fz-video" playsinline muted aria-label="Camera"></video><div class="pr-bar"><button type="button" class="btn primary" data-snap>Take the picture</button><button type="button" class="btn" data-cam-off>Close the camera</button></div></div>' +
      '<div class="fz-card" data-ed hidden><p><b data-edt></b> Drag the four markers to the paper’s corners (or select a marker and use the arrow keys).</p>' +
        '<div class="fz-cornw"><div class="fz-corners"><canvas aria-label="The photo"></canvas><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon fill="rgba(245,165,36,.18)" stroke="#F5A524" stroke-width="0.6" vector-effect="non-scaling-stroke"></polygon></svg>' +
        ['Top left', 'Top right', 'Bottom right', 'Bottom left'].map(function (t, i) { return '<button type="button" class="fz-h" data-h="' + i + '" aria-label="' + t + ' corner"></button>'; }).join('') + '</div></div>' +
        '<div class="fz-row"><label>Look <select data-flt><option value="clean">Clean (white paper, colours kept)</option><option value="colour">As in the photo</option><option value="grey">Grey</option><option value="bw">Black and white</option></select></label>' +
        '<label>Page shape <select data-shp><option value="auto">As in the photo</option><option value="a4">A4 paper</option></select></label>' +
        '<button type="button" class="btn sm" data-whole>Whole photo</button><button type="button" class="btn sm" data-rot>Turn 90°</button></div>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-done>Done: keep this page</button><button type="button" class="btn" data-skip>Leave this photo out</button></div></div>' +
      '<div class="fz-pages" data-scl></div>' +
      '<div class="fz-card" data-out hidden><div class="fz-row"><label>PDF page <select data-scp><option value="a4">A4 (the page fitted on it)</option><option value="fit">Same shape as the scan</option></select></label></div>' +
        '<div class="pr-bar"><button type="button" class="btn primary" data-pdf data-ic="download">Save as one PDF</button><button type="button" class="btn" data-jpg data-ic="download">Save as pictures (zip)</button><button type="button" class="btn" data-clr>Start again</button></div></div>';
    var ed = $('[data-ed]', n), cv = $('.fz-corners canvas', n), poly = $('polygon', n), hs = $$('.fz-h', n), list = $('[data-scl]', n), queue = [];
    function editPaint() {
      var P = SC.cur; if (!P) { ed.hidden = true; return; }
      ed.hidden = false;
      $('[data-edt]', n).textContent = P.edit != null ? 'Page ' + (P.edit + 1) + '.' : 'New page' + (queue.length ? ' (' + queue.length + ' more waiting).' : '.');
      var d = fitCanvas(P.src, 1000); cv.width = d.width; cv.height = d.height; cv.getContext('2d').drawImage(d, 0, 0);
      $('[data-flt]', n).value = P.filter; $('[data-shp]', n).value = P.shape || 'auto';
      cornerPaint();
    }
    function cornerPaint() {
      var P = SC.cur; if (!P) return;
      poly.setAttribute('points', P.q.map(function (p) { return p[0] * 100 + ',' + p[1] * 100; }).join(' '));
      hs.forEach(function (b, i) { b.style.left = P.q[i][0] * 100 + '%'; b.style.top = P.q[i][1] * 100 + '%'; });
    }
    var drag = -1;
    hs.forEach(function (b, i) {
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); drag = i; b.setPointerCapture(e.pointerId); b.focus(); });
      b.addEventListener('pointermove', function (e) {
        if (drag !== i || !SC.cur) return; var r = cv.getBoundingClientRect();
        SC.cur.q[i] = [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; cornerPaint();
      });
      b.addEventListener('pointerup', function () { drag = -1; }); b.addEventListener('pointercancel', function () { drag = -1; });
      b.addEventListener('keydown', function (e) {
        var m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!m || !SC.cur) return; e.preventDefault();
        var s = e.shiftKey ? 0.05 : 0.01, q = SC.cur.q[i]; q[0] = Math.max(0, Math.min(1, q[0] + m[0] * s)); q[1] = Math.max(0, Math.min(1, q[1] + m[1] * s)); cornerPaint();
      });
    });
    function inset() { return [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]]; }
    function next() { SC.cur = queue.shift() || null; editPaint(); if (SC.cur) ed.scrollIntoView({ block: 'nearest' }); }
    function addSrc(c) { queue.push({ src: fitCanvas(c, 3000), q: inset(), filter: SC.filter, shape: SC.shape }); if (!SC.cur) next(); else editPaint(); }
    function paintList() {
      list.innerHTML = SC.pages.map(function (p, k) {
        return '<div class="fz-pg"><div class="fz-pth"><img alt="Page ' + (k + 1) + '" src="' + p.thumb + '"></div><p>Page ' + (k + 1) + '</p><div class="fz-pgb">' +
          '<button type="button" class="btn sm" data-s="up" data-k="' + k + '" aria-label="Move page ' + (k + 1) + ' earlier"' + (k ? '' : ' disabled') + '>←</button><button type="button" class="btn sm" data-s="dn" data-k="' + k + '" aria-label="Move page ' + (k + 1) + ' later"' + (k < SC.pages.length - 1 ? '' : ' disabled') + '>→</button>' +
          '<button type="button" class="btn sm" data-s="ed" data-k="' + k + '">Change</button><button type="button" class="btn sm" data-s="x" data-k="' + k + '">Delete</button></div></div>';
      }).join('');
      $('[data-out]', n).hidden = !SC.pages.length;
    }
    function finish() {
      var P = SC.cur; if (!P) return;
      var W = P.src.width, H = P.src.height, w = warp(P.src, P.q.map(function (p) { return [p[0] * (W - 1), p[1] * (H - 1)]; }), P.shape);
      if (!w) { NS.toast('Those corners do not make a page. Put each marker on its own corner.', 'bad'); return; }
      var out = filterOf(w, P.filter), rec = { src: P.src, q: P.q, filter: P.filter, shape: P.shape, out: out, thumb: fitCanvas(out, 300).toDataURL('image/jpeg', 0.7) };
      if (P.edit != null) SC.pages[P.edit] = rec; else SC.pages.push(rec);
      SC.filter = P.filter; SC.shape = P.shape; paintList(); next();
    }
    onFiles(n, '#fz-sc-file', function (files) {
      files.filter(isImg).reduce(function (p, f) { return p.then(function () { return loadImg(f).then(addSrc, function () { NS.toast('Could not open ' + f.name + '.', 'bad'); }); }); }, Promise.resolve());
    });
    $('[data-cam-on]', n).addEventListener('click', function () {
      var md = navigator.mediaDevices; if (!md || !md.getUserMedia) { NS.toast('This browser cannot use the camera here. Use Open photos instead (on a phone it can take a photo).', 'bad'); return; }
      md.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }).then(function (s) {
        stopCam(); SC.stream = s; var v = $('video', n); v.srcObject = s; $('[data-cam]', n).hidden = false; v.play().catch(function () {});
      }, function (e) { NS.toast(e && e.name === 'NotAllowedError' ? 'The camera was not allowed. Allow it for this site in the browser, or use Open photos.' : 'The camera could not start. Use Open photos instead.', 'bad'); });
    });
    $('[data-snap]', n).addEventListener('click', function () {
      var v = $('video', n); if (!v.videoWidth) { NS.toast('The camera is still starting. Try again in a moment.', 'bad'); return; }
      var c = canvasOf(v.videoWidth, v.videoHeight); c.getContext('2d').drawImage(v, 0, 0); addSrc(c); NS.toast('Picture taken. Set the corners below.');
    });
    $('[data-cam-off]', n).addEventListener('click', stopCam);
    $('[data-flt]', n).addEventListener('change', function (e) { if (SC.cur) SC.cur.filter = e.target.value; });
    $('[data-shp]', n).addEventListener('change', function (e) { if (SC.cur) SC.cur.shape = e.target.value; });
    $('[data-whole]', n).addEventListener('click', function () { if (SC.cur) { SC.cur.q = [[0, 0], [1, 0], [1, 1], [0, 1]]; cornerPaint(); } });
    $('[data-rot]', n).addEventListener('click', function () { if (!SC.cur) return; SC.cur.src = rotated(SC.cur.src); SC.cur.q = inset(); editPaint(); });
    $('[data-done]', n).addEventListener('click', finish);
    $('[data-skip]', n).addEventListener('click', next);
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-s]'); if (!b) return; var k = +b.getAttribute('data-k'), s = b.getAttribute('data-s'), l = SC.pages;
      if (s === 'x') l.splice(k, 1); else if (s === 'ed') { var p = l[k]; if (SC.cur && SC.cur.edit == null) queue.unshift(SC.cur); SC.cur = { src: p.src, q: p.q.map(function (x) { return x.slice(); }), filter: p.filter, shape: p.shape, edit: k }; editPaint(); ed.scrollIntoView({ block: 'nearest' }); return; }
      else { var j = s === 'up' ? k - 1 : k + 1, t = l[k]; l[k] = l[j]; l[j] = t; }
      paintList();
    });
    $('[data-scp]', n).addEventListener('change', function (e) { SC.page = e.target.value; });
    function jpg(p) { return blobOf(p.out, 'image/jpeg', p.filter === 'bw' ? 0.7 : 0.82); }
    $('[data-pdf]', n).addEventListener('click', function () {
      if (!SC.pages.length) return; NS.toast('Making the PDF…');
      pdfLib().then(function (L) {
        return L.PDFDocument.create().then(function (out) {
          return SC.pages.reduce(function (pr, p) {
            return pr.then(function () { return jpg(p).then(function (b) { return b.arrayBuffer(); }).then(function (b) { return out.embedJpg(b); }).then(function (im) {
              var pw = A4[0], ph = SC.page === 'fit' ? A4[0] * im.height / im.width : A4[1], k = Math.min(pw / im.width, ph / im.height), dw = im.width * k, dh = im.height * k;
              out.addPage([pw, ph]).drawImage(im, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
            }); });
          }, Promise.resolve()).then(function () { return out.save(); });
        });
      }).then(function (b) { var nm = 'scan-' + NS.today() + '.pdf'; NS.saveFile(new Blob([b], { type: 'application/pdf' }), nm); NS.toast('Saved "' + nm + '": ' + SC.pages.length + ' page' + (SC.pages.length > 1 ? 's' : '') + '.'); },
        function (e) { if (e && e.message === 'load') libFail(); else NS.toast('Could not make the PDF.', 'bad'); });
    });
    $('[data-jpg]', n).addEventListener('click', function () {
      Promise.all(SC.pages.map(jpg)).then(function (bl) {
        if (bl.length === 1) { NS.saveFile(bl[0], 'scan-' + NS.today() + '.jpg'); return; }
        return zip(bl.map(function (b, i) { return { name: 'scan-' + NS.today() + '-page-' + (i + 1) + '.jpg', blob: b }; })).then(function (z) { NS.saveFile(z, 'scan-' + NS.today() + '.zip'); });
      });
    });
    $('[data-clr]', n).addEventListener('click', function () { SC.pages = []; queue.length = 0; SC.cur = null; editPaint(); paintList(); });
    return n;
  }

  /* =====================================================================================================================
     5. STEEL WEIGHT: weight per metre = cross-section area (mm²) x density (g/cm³) ÷ 1000. Theoretical weights.
     ===================================================================================================================== */
  var MAT = [['7.85', 'Mild steel / carbon steel (7.85)'], ['7.93', 'Stainless steel 304 (7.93)'], ['7.2', 'Cast iron (7.20)'], ['2.7', 'Aluminium (2.70)'], ['8.5', 'Brass (8.50)'], ['8.96', 'Copper (8.96)']];
  var SH = {
    round: ['Round bar (rod, TMT, sariya)', [['d', 'Diameter mm']], function (v, r) { return [Math.PI / 4 * v.d * v.d * r / 1000, 'π ÷ 4 × d² × density ÷ 1000 = 0.7854 × ' + v.d + ' × ' + v.d + ' × ' + r + ' ÷ 1000' + (r === 7.85 ? ' (the same as d² ÷ 162.2)' : '')]; }],
    square: ['Square bar', [['a', 'Side mm']], function (v, r) { return [v.a * v.a * r / 1000, 'a² × density ÷ 1000 = ' + v.a + ' × ' + v.a + ' × ' + r + ' ÷ 1000']; }],
    hex: ['Hexagon bar', [['a', 'Across flats mm']], function (v, r) { return [0.866 * v.a * v.a * r / 1000, '0.866 × a² × density ÷ 1000 = 0.866 × ' + v.a + ' × ' + v.a + ' × ' + r + ' ÷ 1000']; }],
    flat: ['Flat (patti)', [['w', 'Width mm'], ['t', 'Thickness mm']], function (v, r) { return [v.w * v.t * r / 1000, 'width × thickness × density ÷ 1000 = ' + v.w + ' × ' + v.t + ' × ' + r + ' ÷ 1000']; }],
    pipe: ['Round pipe', [['d', 'Outside diameter mm'], ['t', 'Wall thickness mm']], function (v, r) { if (v.t * 2 >= v.d) return [0, '', 'The wall must be less than half the outside diameter.']; return [Math.PI * (v.d - v.t) * v.t * r / 1000, 'π × (OD − t) × t × density ÷ 1000 = 3.1416 × (' + v.d + ' − ' + v.t + ') × ' + v.t + ' × ' + r + ' ÷ 1000' + (r === 7.85 ? ' (the same as (OD − t) × t × 0.02466)' : '')]; }],
    sqtube: ['Square tube (box)', [['a', 'Side mm'], ['t', 'Wall thickness mm']], function (v, r) { if (v.t * 2 >= v.a) return [0, '', 'The wall must be less than half the side.']; return [4 * v.t * (v.a - v.t) * r / 1000, '4 × t × (a − t) × density ÷ 1000 = 4 × ' + v.t + ' × (' + v.a + ' − ' + v.t + ') × ' + r + ' ÷ 1000 (sharp corners)']; }],
    rectube: ['Rectangular tube', [['a', 'Width mm'], ['b', 'Height mm'], ['t', 'Wall thickness mm']], function (v, r) { if (v.t * 2 >= Math.min(v.a, v.b)) return [0, '', 'The wall must be less than half the smaller side.']; return [2 * v.t * (v.a + v.b - 2 * v.t) * r / 1000, '2 × t × (a + b − 2t) × density ÷ 1000 = 2 × ' + v.t + ' × (' + v.a + ' + ' + v.b + ' − ' + 2 * v.t + ') × ' + r + ' ÷ 1000 (sharp corners)']; }],
    angle: ['Equal angle', [['a', 'Side mm'], ['t', 'Thickness mm']], function (v, r) { if (v.t >= v.a) return [0, '', 'The thickness must be less than the side.']; return [(2 * v.a - v.t) * v.t * r / 1000, '(a + a − t) × t × density ÷ 1000 = (' + v.a + ' + ' + v.a + ' − ' + v.t + ') × ' + v.t + ' × ' + r + ' ÷ 1000 (approximate: no root radius)']; }],
    uangle: ['Unequal angle', [['a', 'Side A mm'], ['b', 'Side B mm'], ['t', 'Thickness mm']], function (v, r) { if (v.t >= Math.min(v.a, v.b)) return [0, '', 'The thickness must be less than the smaller side.']; return [(v.a + v.b - v.t) * v.t * r / 1000, '(a + b − t) × t × density ÷ 1000 = (' + v.a + ' + ' + v.b + ' − ' + v.t + ') × ' + v.t + ' × ' + r + ' ÷ 1000 (approximate: no root radius)']; }],
    sheet: ['Sheet / plate', [['l', 'Length'], ['w', 'Width'], ['t', 'Thickness mm']], null]
  };
  var LEN = { m: [1, 'metre'], ft: [0.3048, 'feet'], mm: [0.001, 'mm'], in: [0.0254, 'inch'] };
  var ST = { shape: 'round', v: { d: '12' }, rho: '7.85', len: '12', lu: 'm', su: 'mm', by: 'pcs', pcs: '1', kg: '', rate: '' };
  function steelCalc() {
    var s = SH[ST.shape], r = num(ST.rho), v = {}, miss = false;
    (s[1]).forEach(function (f) { v[f[0]] = num(ST.v[f[0]]); if (!(v[f[0]] > 0)) miss = true; });
    if (!(r > 0)) return { err: 'Type the density (g/cm³). Mild steel is 7.85.' };
    if (miss) return { err: 'Type every size above.' };
    var o = { r: r };
    if (ST.shape === 'sheet') {
      var k = LEN[ST.su] ? LEN[ST.su][0] * 1000 : 1, L = v.l * k, Wd = v.w * k;   /* to mm */
      o.piece = L * Wd * v.t * r / 1e6;
      o.formula = 'length × width × thickness (mm) × density ÷ 1,000,000 = ' + fmt(L, 1) + ' × ' + fmt(Wd, 1) + ' × ' + v.t + ' × ' + r + ' ÷ 1,000,000';
      o.area = L * Wd / 1e6;
    } else {
      var res = s[2](v, r); if (res[2]) return { err: res[2] };
      o.perM = res[0]; o.formula = 'kg per metre = ' + res[1];
      var lm = num(ST.len) * (LEN[ST.lu] || LEN.m)[0]; if (!(lm > 0)) return { err: 'Type the length of one piece.', perM: o.perM, formula: o.formula };
      o.lenM = lm; o.piece = o.perM * lm;
    }
    if (ST.by === 'pcs') { o.pcs = num(ST.pcs) || 0; o.total = o.piece * o.pcs; }
    else { o.total = num(ST.kg); o.pcs = o.piece > 0 ? o.total / o.piece : 0; }
    o.amount = num(ST.rate) ? o.total * num(ST.rate) : 0;
    return o;
  }
  function stNode() {
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Steel weight calculator</h3><p class="soft">Weight of bars, flats, sheets, pipes, tubes and angles from their size. Works both ways: pieces to weight, or a weight to the number of pieces.</p>' +
      '<div class="fz-card"><div class="fz-row"><label>Shape <select data-sh>' + Object.keys(SH).map(function (k) { return '<option value="' + k + '">' + SH[k][0] + '</option>'; }).join('') + '</select></label>' +
        '<label>Material <select data-mat>' + MAT.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '<option value="">Other</option></select></label>' +
        '<label>Density g/cm³ <input type="number" step="0.01" min="0.1" data-rho inputmode="decimal"></label></div>' +
      '<div class="fz-row" data-dims></div>' +
      '<div class="fz-row"><label data-lenl>Length of one piece <input type="number" step="any" min="0" data-len inputmode="decimal"></label><label data-lul>Unit <select data-lu>' + Object.keys(LEN).map(function (k) { return '<option value="' + k + '">' + LEN[k][1] + '</option>'; }).join('') + '</select></label>' +
        '<label>I know <select data-by><option value="pcs">The number of pieces</option><option value="kg">The total weight</option></select></label>' +
        '<label data-pcsl>Pieces <input type="number" step="1" min="0" data-pcs inputmode="numeric"></label><label data-kgl hidden>Total weight kg <input type="number" step="any" min="0" data-kg inputmode="decimal"></label>' +
        '<label>Rate ₹ per kg <input type="number" step="any" min="0" data-rate inputmode="decimal" placeholder="optional"></label></div></div>' +
      '<div class="fz-res" data-res aria-live="polite"></div><p class="fz-note" data-fx></p>' +
      '<p class="fz-note">These are theoretical weights worked out from the size and density. Real bars, pipes and sections vary with rolling tolerance (often a few percent) and the rounded corners of tubes and angles: use the weighbridge or the mill’s weight for billing.</p>';
    var dimsBox = $('[data-dims]', n);
    function dimsPaint() {
      var s = SH[ST.shape];
      dimsBox.innerHTML = s[1].map(function (f) { return '<label>' + f[1] + ' <input type="number" step="any" min="0" data-v="' + f[0] + '" value="' + esc(ST.v[f[0]] || '') + '" inputmode="decimal"></label>'; }).join('') +
        (ST.shape === 'sheet' ? '<label>Length and width in <select data-su>' + Object.keys(LEN).map(function (k) { return '<option value="' + k + '"' + (k === ST.su ? ' selected' : '') + '>' + LEN[k][1] + '</option>'; }).join('') + '</select></label>' : '');
      var sheet = ST.shape === 'sheet'; $('[data-lenl]', n).hidden = $('[data-lul]', n).hidden = sheet;
    }
    function show() {
      var o = steelCalc(), res = $('[data-res]', n), fx = $('[data-fx]', n);
      $('[data-pcsl]', n).hidden = ST.by !== 'pcs'; $('[data-kgl]', n).hidden = ST.by !== 'kg';
      if (o.err) { res.innerHTML = (o.perM ? '<div><span>Weight per metre</span><b>' + fmt(o.perM, 3) + ' kg/m</b></div>' : '') + '<p class="fz-bad">' + esc(o.err) + '</p>'; fx.textContent = o.formula || ''; return; }
      var c = [];
      if (o.perM != null) { c.push(['Weight per metre', fmt(o.perM, 3) + ' kg/m']); c.push(['Weight per foot', fmt(o.perM * 0.3048, 3) + ' kg/ft']); }
      if (o.area != null) c.push(['Area of one sheet', fmt(o.area, 3) + ' m²']);
      c.push(['Weight of one piece', fmt(o.piece, 3) + ' kg']);
      if (ST.by === 'pcs') c.push(['Pieces', fmt(o.pcs, 0)]); else c.push(['Pieces in ' + fmt(o.total, 2) + ' kg', 'about ' + fmt(Math.floor(o.pcs + 1e-9), 0) + ' (' + fmt(o.pcs, 2) + ')']);
      c.push(['Total weight', fmt(o.total, 2) + ' kg']); c.push(['In tonnes', fmt(o.total / 1000, 3) + ' t']);
      if (o.lenM && o.pcs) c.push(['Total length', fmt(o.lenM * o.pcs, 2) + ' m (' + fmt(o.lenM * o.pcs / 0.3048, 1) + ' ft)']);
      if (o.amount) c.push(['Amount at ₹' + fmt(num(ST.rate), 2) + '/kg', NS.money ? NS.money(o.amount) : '₹' + fmt(o.amount, 2)]);
      res.innerHTML = c.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('');
      fx.textContent = 'Formula: ' + o.formula + '. Density in g/cm³ (the same as kg/dm³).';
    }
    function sync() { $('[data-sh]', n).value = ST.shape; $('[data-rho]', n).value = ST.rho; $('[data-mat]', n).value = MAT.some(function (m) { return m[0] === ST.rho; }) ? ST.rho : ''; $('[data-len]', n).value = ST.len; $('[data-lu]', n).value = ST.lu; $('[data-by]', n).value = ST.by; $('[data-pcs]', n).value = ST.pcs; $('[data-kg]', n).value = ST.kg; $('[data-rate]', n).value = ST.rate; }
    n.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('[data-v]')) ST.v[t.getAttribute('data-v')] = t.value;
      else if (t.matches('[data-rho]')) { ST.rho = t.value; $('[data-mat]', n).value = MAT.some(function (m) { return num(m[0]) === num(t.value); }) ? MAT.filter(function (m) { return num(m[0]) === num(t.value); })[0][0] : ''; }
      else if (t.matches('[data-len]')) ST.len = t.value; else if (t.matches('[data-pcs]')) ST.pcs = t.value; else if (t.matches('[data-kg]')) ST.kg = t.value; else if (t.matches('[data-rate]')) ST.rate = t.value;
      else return;
      show();
    });
    n.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-sh]')) { ST.shape = t.value; dimsPaint(); }
      else if (t.matches('[data-mat]')) { if (t.value) { ST.rho = t.value; $('[data-rho]', n).value = t.value; } else $('[data-rho]', n).focus(); }
      else if (t.matches('[data-lu]')) ST.lu = t.value; else if (t.matches('[data-su]')) ST.su = t.value; else if (t.matches('[data-by]')) ST.by = t.value;
      else return;
      show();
    });
    sync(); dimsPaint(); show();
    return n;
  }

  /* ---------- the screen: tabs; each tool is built once and kept, so a redraw of the App never loses pictures or work ---------- */
  var MAKE = { img: imNode, sign: sgNode, pdf: pdNode, scan: scNode, steel: stNode }, lastArg = null;
  function tabBar() {
    return '<div class="fz-groups" role="group" aria-label="Tools">' + GROUPS.map(function (g) {
      var L = TABS.filter(function (t) { return t[2] === g[0]; }); if (!L.length) return '';
      return '<div class="fz-grp"><span class="fz-gl">' + g[1] + '</span><div class="pr-bar fz-tabs">' + L.map(function (t) { return '<button type="button" class="btn' + (t[0] === cur ? ' primary' : '') + '" data-fzt="' + t[0] + '" aria-pressed="' + (t[0] === cur) + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  function nodeOf(k) { return NODES[k] || (NODES[k] = MAKE[k]()); }
  A.addSection('ftools', function (arg) {
    var a = String(arg || '').split('/')[0]; if (a !== lastArg) { lastArg = a; if (MAKE[a]) cur = a; }   /* a link such as #ftools/steel picks the tab; a redraw keeps the one in use */
    return '<div class="pane-hd"><h2>Free tools</h2></div><p class="soft">Everyday tools that work in this browser, also without the internet. Your files are not uploaded anywhere.</p>' +
      tabBar() +
      '<div class="fz-root" data-fz-root data-nosp></div>';
  }, function (pane) {
    var root = $('[data-fz-root]', pane); if (!root) return;
    root.appendChild(nodeOf(cur));
    if (cur !== 'scan') stopCam();
    $$('[data-fzt]', pane).forEach(function (b) { b.addEventListener('click', function () {
      var k = b.getAttribute('data-fzt'); if (k === cur) return;
      cur = k; if (k !== 'scan') stopCam();
      $$('[data-fzt]', pane).forEach(function (x) { var on = x === b; x.classList.toggle('primary', on); x.setAttribute('aria-pressed', on); });
      root.textContent = ''; root.appendChild(nodeOf(k));
      try { history.replaceState(history.state, '', '#ftools/' + k); } catch (e) {}   /* a reload opens the same tool; no new Recently opened line per tab */
    }); });
  });
  window.addEventListener('hashchange', function () { if (!/^#ftools\/scan/.test(location.hash) && !(cur === 'scan' && /^#ftools\/?$/.test(location.hash))) stopCam(); });
  window.NSFreeTools = { add: function (key, label, group, make) { if (MAKE[key]) return; MAKE[key] = make; TABS.push([key, label, group]); }, warp: warp, homography: homography, zip: zip, steel: function (o) { var keep = JSON.parse(JSON.stringify(ST)); Object.assign(ST, o); var r = steelCalc(); ST = keep; return r; }, toPage: toPage };   /* for the tests */
  function menu() {
    var nav = $('.hub-nav'), app = $('#app'); if (!nav || !app || app.getAttribute('data-secs') || $('[data-sec="ftools"]', nav)) return;
    nav.appendChild(NS.el('a', { href: '#ftools', 'data-sec': 'ftools' }, '<span>' + esc(NS.t('app.ftools')) + '</span>'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', menu); else menu();
  setTimeout(menu, 400);
})();
