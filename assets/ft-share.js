/* Free tools batch 2: Pictures, sharing and files (owner 25 Nov 2026). Four tools added to Utilities › Free tools:
   1. Passport photo sheet (group pic): one photo in a 35 x 45 mm, 2 x 2 inch (51 x 51 mm) or own-size frame with a face
      guide, optional whiter background, then a print sheet of copies on 4 x 6 inch photo paper or A4 with cut lines at
      300 DPI; JPG or PDF.
   2. iPhone photos to JPG (group pic): HEIC/HEIF pictures to JPG, many at once, zip download. Safari opens HEIC itself;
      in Chrome and Edge this file reads the HEIF box structure itself (own code) and hands the HEVC picture tiles to the
      browser's own video decoder (WebCodecs VideoDecoder). No outside decoder library: libheif and the packages built on it
      (heic2any, libheif-js, heic-to) are LGPL, which the NSBiz rules do not allow.
   3. Zip and unzip (group share): make a zip (packed with the browser's own CompressionStream when that makes the file
      smaller) and open a zip (DecompressionStream; stored and deflate entries, UTF-8 and old DOS names, ZIP64).
   4. NSBiz Send (group share): files straight from one device to another (WebRTC data channel, DTLS-encrypted) after the
      two meet through NSBiz's own small meeting-point Worker (workers/ns-send). Nothing is stored on a server.
   Everything else runs in this browser; no file is uploaded. Libraries kept inside NSBiz: pdf-lib (@cantoo/pdf-lib 2.11.1,
   MIT, /assets/vendor/) for the PDF sheet, qrcode-generator 1.4.4 (MIT, Kazuhiko Arase, /assets/vendor/) for the Send QR.
   The App is English only. CSS is injected once below (prefix fs-). */
(function (root) {
  'use strict';

  /* =====================================================================================================================
     PURE PARTS (no screen): also loaded by scripts/test_ft-share.js in node
     ===================================================================================================================== */
  var P = {};
  var CRCT = null;
  P.crc32 = function (u, start) {
    if (!CRCT) { CRCT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c >>> 0; } }
    var x = start == null ? 0xFFFFFFFF : (start ^ 0xFFFFFFFF) >>> 0;
    for (var i = 0; i < u.length; i++) x = CRCT[(x ^ u[i]) & 255] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
  };
  function u16(u, o) { return u[o] | (u[o + 1] << 8); }
  function u32(u, o) { return (u[o] | (u[o + 1] << 8) | (u[o + 2] << 16)) + u[o + 3] * 16777216; }
  function u64(u, o) { return u32(u, o) + u32(u, o + 4) * 4294967296; }
  function b16(u, o) { return (u[o] << 8) | u[o + 1]; }
  function b32(u, o) { return u[o] * 16777216 + ((u[o + 1] << 16) | (u[o + 2] << 8) | u[o + 3]); }
  function bN(u, o, n) { var v = 0; for (var i = 0; i < n; i++) v = v * 256 + u[o + i]; return v; }
  function str4(u, o) { return String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]); }

  /* ---------- zip: reading the list ---------- */
  /* old DOS names (no UTF-8 mark): code page 437, the zip standard's default (APPNOTE 4.4.17) */
  var CP437 = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒ' +
    'áíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐' +
    '└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
    'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
  P.cp437 = function (u) { var s = ''; for (var i = 0; i < u.length; i++) s += u[i] < 128 ? String.fromCharCode(u[i]) : CP437[u[i] - 128]; return s; };
  function nameOf(u, utf) {
    if (utf) return new TextDecoder('utf-8').decode(u);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u); } catch (e) { return P.cp437(u); }   /* plain ASCII is the same either way */
  }
  /* the end record, found in the last bytes: { count, cdSize, cdOff, z64Off (file offset of the ZIP64 end record, or -1), at } */
  P.zipEnd = function (tail, size) {
    for (var i = tail.length - 22; i >= 0 && i >= tail.length - 22 - 65535; i--) {
      if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 5 && tail[i + 3] === 6) {
        var r = { count: u16(tail, i + 10), cdSize: u32(tail, i + 12), cdOff: u32(tail, i + 16), z64Off: -1, at: size - tail.length + i };
        var L = i - 20;
        if (L >= 0 && tail[L] === 0x50 && tail[L + 1] === 0x4b && tail[L + 2] === 6 && tail[L + 3] === 7) r.z64Off = u64(tail, L + 8);
        return r;
      }
    }
    return null;
  };
  P.zip64End = function (u) {   /* the 56-byte ZIP64 end record */
    if (!(u[0] === 0x50 && u[1] === 0x4b && u[2] === 6 && u[3] === 6)) return null;
    return { count: u64(u, 32), cdSize: u64(u, 40), cdOff: u64(u, 48) };
  };
  /* the central list: one record per file */
  P.zipList = function (u, count) {
    var out = [], o = 0;
    for (var k = 0; k < count && o + 46 <= u.length; k++) {
      if (u32(u, o) !== 0x02014b50) throw new Error('list');
      var fl = u16(u, o + 8), meth = u16(u, o + 10), tm = u16(u, o + 12), dt = u16(u, o + 14), crc = u32(u, o + 16), cs = u32(u, o + 20), us = u32(u, o + 24);
      var nl = u16(u, o + 28), xl = u16(u, o + 30), cl = u16(u, o + 32), lho = u32(u, o + 42);
      var nb = u.subarray(o + 46, o + 46 + nl), x = o + 46 + nl, xe = x + xl, name = null;
      while (x + 4 <= xe) {
        var id = u16(u, x), ln = u16(u, x + 2), p = x + 4;
        if (id === 1) {   /* ZIP64: only the fields that were full (0xFFFFFFFF) are here, in this order */
          if (us === 0xFFFFFFFF) { us = u64(u, p); p += 8; }
          if (cs === 0xFFFFFFFF) { cs = u64(u, p); p += 8; }
          if (lho === 0xFFFFFFFF) { lho = u64(u, p); p += 8; }
        } else if (id === 0x7075 && ln > 5) name = new TextDecoder('utf-8').decode(u.subarray(p + 5, x + 4 + ln));   /* Info-ZIP Unicode name */
        x += 4 + ln;
      }
      if (!name) name = nameOf(nb, fl & 0x800);
      name = name.replace(/\\/g, '/');
      out.push({ name: name, dir: /\/$/.test(name), method: meth, enc: !!(fl & 1) || meth === 99, crc: crc, csize: cs, size: us, lho: lho,
        date: new Date(1980 + (dt >> 9), ((dt >> 5) & 15) - 1, dt & 31, tm >> 11, (tm >> 5) & 63, (tm & 31) * 2) });
      o = xe + cl;
    }
    return out;
  };
  /* a safe path inside a chosen folder: no "..", no drive letters, no odd characters */
  P.safeParts = function (name) {
    return String(name).split('/').map(function (s) { return s.replace(/[<>:"|?*\u0000-\u001f]/g, '_').replace(/^\.+$/, '').trim(); }).filter(Boolean);
  };
  P.dosTime = function (d) {
    d = d || new Date(); if (d.getFullYear() < 1980) d = new Date(1980, 0, 1);
    return { tm: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dt: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
  };
  /* the zip from finished parts [{ name, crc, size, data (Uint8Array, packed or not), method 0|8, date }] -> list of Uint8Arrays */
  P.zipBuild = function (parts) {
    var enc = new TextEncoder(), out = [], cen = [], off = 0;
    parts.forEach(function (f) {
      var nm = enc.encode(f.name), T = P.dosTime(f.date), lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, f.method, true); lh.setUint16(10, T.tm, true); lh.setUint16(12, T.dt, true);
      lh.setUint32(14, f.crc, true); lh.setUint32(18, f.data.length, true); lh.setUint32(22, f.size, true); lh.setUint16(26, nm.length, true);
      out.push(new Uint8Array(lh.buffer), nm, f.data);
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, f.method, true); ch.setUint16(12, T.tm, true); ch.setUint16(14, T.dt, true);
      ch.setUint32(16, f.crc, true); ch.setUint32(20, f.data.length, true); ch.setUint32(24, f.size, true); ch.setUint16(28, nm.length, true);
      if (/\/$/.test(f.name)) ch.setUint32(38, 0x10, true);
      ch.setUint32(42, off, true);
      cen.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + f.data.length;
    });
    var size = cen.reduce(function (s, p) { return s + p.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, parts.length, true); e.setUint16(10, parts.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return out.concat(cen, [new Uint8Array(e.buffer)]);
  };

  /* ---------- HEIF (HEIC) container: ISO/IEC 23008-12 boxes ---------- */
  function boxesIn(u, s, e) {
    var out = [];
    while (s + 8 <= e) {
      var sz = b32(u, s), t = str4(u, s + 4), h = 8;
      if (sz === 1) { sz = b32(u, s + 8) * 4294967296 + b32(u, s + 12); h = 16; }
      if (sz === 0) sz = e - s;
      if (sz < h || s + sz > e) break;
      out.push({ t: t, s: s + h, e: s + sz }); s += sz;
    }
    return out;
  }
  function find(L, t) { for (var i = 0; i < L.length; i++) if (L[i].t === t) return L[i]; return null; }
  /* -> { W, H, rows, cols, tiles: [{ hvcC, data, w, h }], ops: [['irot', n] | ['imir', axis] | ['clap', {...}]], colr } or { err } */
  P.heif = function (u) {
    var top = boxesIn(u, 0, u.length);
    if (!find(top, 'ftyp')) return { err: 'notheif' };
    var meta = find(top, 'meta'); if (!meta) return { err: 'notheif' };
    var M = boxesIn(u, meta.s + 4, meta.e), pitm = find(M, 'pitm'), iloc = find(M, 'iloc'), iinf = find(M, 'iinf'), iprp = find(M, 'iprp'), iref = find(M, 'iref'), idat = find(M, 'idat');
    if (!pitm || !iloc || !iinf || !iprp) return { err: 'notheif' };
    var primary = u[pitm.s] === 0 ? b16(u, pitm.s + 4) : b32(u, pitm.s + 4);
    /* item types */
    var types = {}, iv = u[iinf.s], ip = iinf.s + 4 + (iv === 0 ? 2 : 4);
    boxesIn(u, ip, iinf.e).forEach(function (b) {
      if (b.t !== 'infe') return; var v = u[b.s], p = b.s + 4;
      if (v < 2) return;
      var id = v === 2 ? b16(u, p) : b32(u, p); p += v === 2 ? 2 : 4; p += 2;
      types[id] = str4(u, p);
    });
    /* where each item's bytes are */
    var loc = {}, s = iloc.s, lv = u[s]; s += 4;
    var os = u[s] >> 4, ls = u[s] & 15, bs = u[s + 1] >> 4, is = lv === 1 || lv === 2 ? u[s + 1] & 15 : 0; s += 2;
    var cnt = lv < 2 ? b16(u, s) : b32(u, s); s += lv < 2 ? 2 : 4;
    for (var k = 0; k < cnt; k++) {
      var id = lv < 2 ? b16(u, s) : b32(u, s); s += lv < 2 ? 2 : 4;
      var cm = 0; if (lv === 1 || lv === 2) { cm = b16(u, s) & 15; s += 2; }
      s += 2; var base = bN(u, s, bs); s += bs; var ec = b16(u, s); s += 2; var ex = [];
      for (var j = 0; j < ec; j++) { if (is) s += is; var off = bN(u, s, os); s += os; var len = bN(u, s, ls); s += ls; ex.push([base + off, len]); }
      loc[id] = { cm: cm, ex: ex };
    }
    function data(id) {
      var L = loc[id]; if (!L) return null;
      var start = L.cm === 1 ? (idat ? idat.s : -1) : 0; if (start < 0 || L.cm > 1) return null;
      if (L.ex.length === 1) { var x = L.ex[0], a = start + x[0], z = x[1] ? a + x[1] : u.length; return z <= u.length ? u.subarray(a, z) : null; }
      var tot = 0; L.ex.forEach(function (x) { tot += x[1]; }); var o = new Uint8Array(tot), p = 0;
      for (var i = 0; i < L.ex.length; i++) { var y = L.ex[i], b = start + y[0]; if (b + y[1] > u.length) return null; o.set(u.subarray(b, b + y[1]), p); p += y[1]; }
      return o;
    }
    /* derived-image links (a grid names its tiles) */
    var dimg = {};
    if (iref) {
      var rv = u[iref.s];
      boxesIn(u, iref.s + 4, iref.e).forEach(function (b) {
        if (b.t !== 'dimg') return; var p = b.s, w = rv === 0 ? 2 : 4, from = bN(u, p, w); p += w; var n = b16(u, p); p += 2; var L = [];
        for (var i = 0; i < n; i++) { L.push(bN(u, p, w)); p += w; }
        dimg[from] = L;
      });
    }
    /* properties */
    var PB = boxesIn(u, iprp.s, iprp.e), ipco = find(PB, 'ipco'), props = ipco ? boxesIn(u, ipco.s, ipco.e) : [], assoc = {};
    PB.forEach(function (b) {
      if (b.t !== 'ipma') return; var v = u[b.s], fl = u[b.s + 3], p = b.s + 4, n = b32(u, p); p += 4;
      for (var i = 0; i < n; i++) {
        var id = v < 1 ? b16(u, p) : b32(u, p); p += v < 1 ? 2 : 4; var c = u[p++], L = [];
        for (var j = 0; j < c; j++) { var x; if (fl & 1) { x = b16(u, p) & 0x7fff; p += 2; } else { x = u[p++] & 0x7f; } if (x) L.push(x); }
        assoc[id] = (assoc[id] || []).concat(L);
      }
    });
    function propsOf(id) { return (assoc[id] || []).map(function (i) { return props[i - 1]; }).filter(Boolean); }
    function prop(id, t) { var L = propsOf(id); for (var i = 0; i < L.length; i++) if (L[i].t === t) return L[i]; return null; }
    function ispe(id) { var b = prop(id, 'ispe'); return b ? [b32(u, b.s + 4), b32(u, b.s + 8)] : null; }
    function tile(id) {
      if (types[id] !== 'hvc1') return null;
      var hv = prop(id, 'hvcC'), d = data(id), sz = ispe(id);
      if (!hv || !d) return null;
      return { hvcC: u.subarray(hv.s, hv.e), data: d, w: sz ? sz[0] : 0, h: sz ? sz[1] : 0 };
    }
    function opsOf(i) {
      return propsOf(i).map(function (b) {
        if (b.t === 'irot') return ['irot', u[b.s] & 3];
        if (b.t === 'imir') return ['imir', u[b.s] & 1];
        if (b.t === 'clap') {
          var f = function (o) { return b32(u, b.s + o) / (b32(u, b.s + o + 4) || 1); };
          var g = function (o) { var n = b32(u, b.s + o); if (n > 2147483647) n -= 4294967296; return n / (b32(u, b.s + o + 4) || 1); };
          return ['clap', { w: f(0), h: f(8), x: g(16), y: g(24) }];
        }
        return null;
      }).filter(Boolean);
    }
    var id0 = primary, r = { ops: [], colr: null };
    if (types[id0] === 'iden' && dimg[id0] && dimg[id0].length === 1) { r.ops = opsOf(id0); id0 = dimg[id0][0]; }
    var ty = types[id0];
    if (ty === 'av01') return { err: 'avif' };
    if (ty === 'jpeg') return { err: 'jpeg' };
    if (ty === 'grid') {
      var gd = data(id0); if (!gd || gd.length < 8 || !dimg[id0]) return { err: 'damaged' };
      var big = gd[1] & 1; r.rows = gd[2] + 1; r.cols = gd[3] + 1;
      r.W = big ? b32(gd, 4) : b16(gd, 4); r.H = big ? b32(gd, 8) : b16(gd, 6);
      r.tiles = dimg[id0].map(tile);
      if (r.tiles.length !== r.rows * r.cols || r.tiles.some(function (t) { return !t; })) return { err: 'damaged' };
    } else if (ty === 'hvc1') {
      var t1 = tile(id0); if (!t1) return { err: 'damaged' };
      r.rows = r.cols = 1; r.tiles = [t1]; r.W = t1.w; r.H = t1.h;
    } else return { err: 'kind', kind: ty || '?' };
    r.ops = r.ops.concat(opsOf(id0));
    /* colour description: on the shown item, else on the first tile */
    var cb = prop(primary, 'colr') || prop(id0, 'colr') || (dimg[id0] ? prop(dimg[id0][0], 'colr') : null);
    if (cb && str4(u, cb.s) === 'nclx') r.colr = { p: b16(u, cb.s + 4), t: b16(u, cb.s + 6), m: b16(u, cb.s + 8), full: !!(u[cb.s + 10] & 0x80) };
    if (!r.W || !r.H) { r.W = r.cols * r.tiles[0].w; r.H = r.rows * r.tiles[0].h; }
    return r;
  };
  /* the codec name the browser needs, from the HEVCDecoderConfigurationRecord (ISO/IEC 14496-15 Annex E codecs string) */
  P.hevcCodec = function (h) {
    var ps = h[1] >> 6, tier = (h[1] >> 5) & 1, pid = h[1] & 31, comp = b32(h, 2), rev = 0;
    for (var i = 0; i < 32; i++) { rev = rev * 2 + (comp & 1); comp = Math.floor(comp / 2); }
    var cons = [h[6], h[7], h[8], h[9], h[10], h[11]];
    while (cons.length && cons[cons.length - 1] === 0) cons.pop();
    return 'hvc1.' + ['', 'A', 'B', 'C'][ps] + pid + '.' + rev.toString(16).toUpperCase() + '.' + (tier ? 'H' : 'L') + h[12] + cons.map(function (c) { return '.' + c.toString(16).toUpperCase(); }).join('');
  };
  /* nclx colour numbers (ITU-T H.273) to the names browsers use */
  P.colorSpace = function (c) {
    if (!c) return null;
    var pr = { 1: 'bt709', 5: 'bt470bg', 6: 'smpte170m', 9: 'bt2020', 12: 'smpte432' }[c.p], tr = { 1: 'bt709', 6: 'smpte170m', 8: 'linear', 13: 'iec61966-2-1', 16: 'pq', 18: 'hlg' }[c.t], mx = { 0: 'rgb', 1: 'bt709', 5: 'bt470bg', 6: 'smpte170m', 9: 'bt2020-ncl' }[c.m];
    var o = { fullRange: c.full }; if (pr) o.primaries = pr; if (tr) o.transfer = tr; if (mx) o.matrix = mx;
    return o;
  };

  /* ---------- passport sheet: how many photos fit, and where (all in mm) ---------- */
  var GAPS = [[8, 3], [4, 2], [2, 1], [0, 0]];   /* [margin, gap] tried from roomy to tight */
  /* office printers cannot print to the edge of A4 (about 4 mm stays blank), photo-paper printers often can */
  function gapsFor(paper) { return Math.max(paper[0], paper[1]) >= 200 ? GAPS.filter(function (g) { return g[0] >= 4; }) : GAPS; }
  P.sheetFit = function (paper, photo, m, g) {
    var c = Math.floor((paper[0] - 2 * m + g + 1e-6) / (photo[0] + g)), r = Math.floor((paper[1] - 2 * m + g + 1e-6) / (photo[1] + g));
    c = Math.max(0, c); r = Math.max(0, r);
    return { cols: c, rows: r, cap: c * r };
  };
  P.sheetMax = function (paper, photo) {
    var best = 0;
    [paper, [paper[1], paper[0]]].forEach(function (pp) { gapsFor(paper).forEach(function (x) { best = Math.max(best, P.sheetFit(pp, photo, x[0], x[1]).cap); }); });
    return best;
  };
  /* the roomiest layout that holds `want` photos (or as many as fit); the paper may lie sideways (land = true).
     Small photo paper: the block of photos sits in the middle. Big paper (A4): from the top, so the rest can be used again. */
  P.sheetLayout = function (paper, photo, want) {
    var pick = null;
    var G = gapsFor(paper);
    for (var i = 0; i < G.length && !pick; i++) {
      for (var l = 0; l < 2 && !pick; l++) {
        var land = l === 1, pp = land ? [paper[1], paper[0]] : paper, f = P.sheetFit(pp, photo, G[i][0], G[i][1]);
        if (f.cap >= want) pick = { land: land, pp: pp, m: G[i][0], g: G[i][1], f: f };
      }
    }
    if (!pick) {
      var n = P.sheetMax(paper, photo); if (!n || n >= want) return { count: 0, cells: [], paper: paper, land: false };
      return P.sheetLayout(paper, photo, n);
    }
    var F = pick.f, bw = F.cols * photo[0] + (F.cols - 1) * pick.g, bh = F.rows * photo[1] + (F.rows - 1) * pick.g;
    var x0 = (pick.pp[0] - bw) / 2, y0 = Math.max(pick.pp[0], pick.pp[1]) >= 200 ? pick.m : (pick.pp[1] - bh) / 2, cells = [];
    for (var k = 0; k < Math.min(want, F.cap); k++) { var c = k % F.cols, r = Math.floor(k / F.cols); cells.push({ x: x0 + c * (photo[0] + pick.g), y: y0 + r * (photo[1] + pick.g) }); }
    return { count: cells.length, cells: cells, paper: pick.pp, land: pick.land, margin: pick.m, gap: pick.g, cols: F.cols, rows: F.rows };
  };
  P.mmPx = function (mm, dpi) { return Math.round(mm / 25.4 * (dpi || 300)); };

  /* ---------- NSBiz Send: safety words and codes ---------- */
  var WORDS = ['apple', 'river', 'tiger', 'mango', 'cloud', 'pencil', 'garden', 'lamp', 'rocket', 'candle', 'button', 'violin', 'turtle', 'pepper', 'window', 'basket',
    'coconut', 'kettle', 'ladder', 'lemon', 'mirror', 'needle', 'orange', 'parrot', 'pillow', 'rabbit', 'saddle', 'spoon', 'tomato', 'umbrella', 'wallet', 'yellow',
    'anchor', 'bridge', 'camel', 'diamond', 'engine', 'feather', 'guitar', 'hammer', 'island', 'jacket', 'kitten', 'lotus', 'magnet', 'nest', 'ocean', 'peacock',
    'quilt', 'rose', 'silver', 'tractor', 'unicorn', 'valley', 'whistle', 'zebra', 'blue', 'green', 'honey', 'monkey', 'planet', 'sugar', 'train', 'water'];
  P.words = function (bytes) { return [0, 1, 2, 3].map(function (i) { return WORDS[bytes[i] & 63]; }); };
  /* both devices list the two DTLS certificate fingerprints, sorted: someone in between would change one of them */
  P.fingerprints = function (sdp) { return (String(sdp).match(/a=fingerprint:\S+ [0-9A-Fa-f:]+/g) || []).map(function (s) { return s.split(' ')[1].toUpperCase(); }); };
  P.CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
  P.cleanCode = function (s) { return String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6); };   /* codes never use 0, 1, I, L or O, so a mix-up shows as a wrong code */

  /* ---------- NSBiz Send: trusted devices (the Worker's workers/ns-send/src/trust.js builds the same texts) ---------- */
  P.ID_RE = /^[A-Za-z0-9_-]{32}$/;
  P.b64u = function (bytes) { var s = '', u = new Uint8Array(bytes); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  P.b64uDec = function (s) { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  /* a device id = first 32 characters of base64url(SHA-256(its raw public key)): it cannot be claimed without the key */
  P.idOf = function (raw) { return crypto.subtle.digest('SHA-256', raw).then(function (h) { return P.b64u(h).slice(0, 32); }); };
  P.helloText = function (nonce, id, trust) { return 'ns-send-presence-v1|' + nonce + '|' + id + '|' + (trust || []).join(','); };
  /* what each trusted device signs once connected: both DTLS fingerprints, sorted. A device in between changes one of them */
  P.dtlsText = function (fps) { return 'ns-send-dtls-v1|' + fps.slice().sort().join('|'); };
  P.verify = function (pubB64, text, sigB64) {
    try {
      var raw = P.b64uDec(pubB64), sig = P.b64uDec(sigB64);
      if (raw.length !== 65 || raw[0] !== 4 || sig.length !== 64) return Promise.resolve(false);
      return crypto.subtle.importKey('raw', raw, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (k) { return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, sig, new TextEncoder().encode(text)); })
        .catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  };
  P.deviceKind = function (ua, touch) {
    ua = String(ua || '');
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1)) return 'iPad';
    if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
    if (/CrOS/.test(ua)) return 'Chromebook';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
    if (/Linux/.test(ua)) return 'Linux PC';
    return 'Device';
  };
  P.cleanName = function (s) { return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40); };
  P.defaultName = function (ua, touch, biz) { return P.cleanName(P.deviceKind(ua, touch) + (biz ? ' · ' + biz : '')); };
  /* "bill.pdf" -> "bill (2).pdf", used when a file of that name is already in the folder */
  P.numbered = function (name, n) { var m = /^(.*?)(\.[^.]{1,10})?$/.exec(String(name)); return m[1] + ' (' + n + ')' + (m[2] || ''); };

  if (typeof module !== 'undefined' && module.exports && !root.document) { module.exports = P; return; }

  /* =====================================================================================================================
     SCREENS
     ===================================================================================================================== */
  var A = root.NSApp, NS = root.NS, FT = root.NSFreeTools;
  if (!A || !NS || !FT) return;
  FT.share = P;   /* for the browser tests */
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var PDFLIB = '/assets/vendor/pdf-lib-cantoo-2.11.1.min.js', QRLIB = '/assets/vendor/qrcode-generator-1.4.4.min.js';
  /* Address of NSBiz's own meeting point (workers/ns-send). EMPTY until the owner has put the Worker online with
     `wrangler deploy`; then paste its https address here, for example 'https://ns-send.<account>.workers.dev'. */
  var SEND_API = 'https://ns-send.send-meet.workers.dev';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function kb(n) { return n < 1024 ? n + ' bytes' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB'; }
  function base(n) { return String(n || 'file').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '-'); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function canvasOf(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function blobOf(c, type, q) { return new Promise(function (r) { c.toBlob(function (b) { r(b); }, type, q); }); }
  function fileBtn(id, label, accept, multi, primary, extra) {
    return '<label class="btn' + (primary ? ' primary' : '') + '" for="' + id + '">' + label + '</label><input type="file" id="' + id + '" class="sr" accept="' + accept + '"' + (multi ? ' multiple' : '') + (extra || '') + '>';
  }
  function onFiles(node, sel, fn, dropOn) {
    $$(sel, node).forEach(function (inp) { inp.addEventListener('change', function () { var l = [].slice.call(inp.files); inp.value = ''; if (l.length) fn(l); }); });
    var z = dropOn || node;
    z.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); z.classList.add('fz-drop'); } });
    z.addEventListener('dragleave', function (e) { if (e.target === z) z.classList.remove('fz-drop'); });
    z.addEventListener('drop', function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); z.classList.remove('fz-drop');
      var items = [].slice.call(e.dataTransfer.items || []).map(function (it) { return it.webkitGetAsEntry ? it.webkitGetAsEntry() : null; });
      if (items.some(function (x) { return x && x.isDirectory; })) readEntries(items).then(fn); else fn([].slice.call(e.dataTransfer.files));
    });
  }
  /* folders dropped on the page: every file inside, with its folder path in .relPath */
  function readEntries(entries) {
    var out = [];
    function walk(en, path) {
      if (!en) return Promise.resolve();
      if (en.isFile) return new Promise(function (r) { en.file(function (f) { f.relPath = path + f.name; out.push(f); r(); }, function () { r(); }); });
      var rd = en.createReader();
      return new Promise(function (r) {
        var all = [];
        (function more() { rd.readEntries(function (L) { if (!L.length) { r(Promise.all(all.map(function (x) { return walk(x, path + en.name + '/'); }))); return; } all = all.concat([].slice.call(L)); more(); }, function () { r(); }); })();
      });
    }
    return Promise.all(entries.map(function (x) { return walk(x, ''); })).then(function () { return out; });
  }
  function isHeic(f) { return /hei[cf]/i.test(f.type) || /\.(heic|heif|hif)$/i.test(f.name); }
  function setDpi(blob, dpi) {   /* the DPI in a JPEG's JFIF header (print shops and portals read it from there) */
    return blob.arrayBuffer().then(function (b) {
      var u = new Uint8Array(b);
      if (u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF && u[3] === 0xE0 && u[6] === 0x4A && u[7] === 0x46 && u[8] === 0x49 && u[9] === 0x46) { u[13] = 1; u[14] = u[16] = (dpi >> 8) & 255; u[15] = u[17] = dpi & 255; }
      return new Blob([u], { type: blob.type });
    });
  }
  function busy(btn, on, text) { if (!btn) return; if (on) { btn.disabled = true; btn.setAttribute('data-was', btn.textContent); if (text) btn.textContent = text; } else { btn.disabled = false; if (btn.getAttribute('data-was')) btn.textContent = btn.getAttribute('data-was'); } }
  function ask(msg) { return NS.ask ? NS.ask(msg) : Promise.resolve(confirm(msg)); }

  /* ---------- styles, once ---------- */
  function css() {
    if (document.getElementById('fs-css')) return;
    var s = document.createElement('style'); s.id = 'fs-css';
    s.textContent =
      '.fs-pp{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:16px;align-items:start;margin:12px 0}' +
      '@media (max-width:760px){.fs-pp{grid-template-columns:minmax(0,1fr)}}' +
      '.fs-frame{position:relative;width:100%;max-width:320px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}' +
      '.fs-frame:focus-visible{outline:3px solid var(--focus,#F5A524);outline-offset:3px}' +
      '.fs-frame canvas{display:block;width:100%;height:auto}' +
      '.fs-frame svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
      '.fs-zoom{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:8px 0}' +
      '.fs-zoom input[type=range]{flex:1 1 120px;min-width:0;max-width:200px}' +
      '.fs-zoom .btn{min-width:40px;min-height:40px}' +
      '.fs-sheet{max-width:100%;max-height:60vh;border:1px solid var(--line);background:#fff;display:block;margin:8px 0;height:auto}' +
      '.fs-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.fs-tabs .btn{min-height:40px}' +
      '.fs-tbl{width:100%;border-collapse:collapse;font-size:.9rem;table-layout:auto}' +
      '.fs-tbl td,.fs-tbl th{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}' +
      '.fs-tbl td.n,.fs-tbl th.n{text-align:right;white-space:nowrap}' +
      '.fs-tbl .fs-nm{overflow-wrap:anywhere;word-break:break-word}' +
      '.fs-tblw{max-height:60vh;overflow:auto;border:1px solid var(--line);border-radius:var(--r);margin:8px 0}' +
      '@media (max-width:520px){.fs-tbl .fs-dt{display:none}}' +
      '.fs-code{font:700 2rem/1.1 ui-monospace,Consolas,monospace;letter-spacing:.18em;padding:8px 14px;border-radius:10px;background:var(--surface2);display:inline-block;overflow-wrap:anywhere}' +
      '.fs-qr{background:#fff;padding:8px;border-radius:10px;width:200px;max-width:100%;line-height:0;box-sizing:border-box}' +
      '.fs-qr svg{width:100%;height:auto}' +
      '.fs-send{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}.fs-send>div{min-width:0;flex:1 1 220px}.fs-send>.fs-qr{flex:0 0 auto}' +
      '.fs-words{font-weight:700;font-size:1.15rem;padding:6px 12px;border-radius:10px;background:var(--surface2);display:inline-block}' +
      '.fs-bar{height:10px;border-radius:5px;background:var(--surface2);overflow:hidden;margin:4px 0}' +
      '.fs-bar i{display:block;height:100%;width:0;background:var(--accent,#0E746A);transition:width .2s}' +
      '.fs-files{list-style:none;padding:0;margin:8px 0}' +
      '.fs-files li{padding:8px 0;border-bottom:1px solid var(--line);min-width:0}' +
      '.fs-files .fs-nm{overflow-wrap:anywhere;min-width:0}' +
      '.fs-row2{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between}' +
      '.fs-codein{font:700 1.4rem ui-monospace,Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;width:11ch;max-width:100%}' +
      '.fs-off{border-color:var(--warn,#B7791F)}';
    document.head.appendChild(s);
  }

  /* ---------- pictures: any picture file (iPhone HEIC too) to a canvas ---------- */
  function loadImg(blob) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('img')); }; im.src = u;
    });
  }
  function toCanvas(src) { var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, c = canvasOf(w, h); c.getContext('2d').drawImage(src, 0, 0, w, h); return c; }
  var HEIC_WHY = {
    notheif: 'This file is not an iPhone photo (HEIC). Its name may end in .heic by mistake.',
    damaged: 'This photo file looks damaged or cut short.',
    avif: 'This is an AVIF picture, not HEIC. Open it in the Resize pictures tool: the browser reads AVIF itself.',
    jpeg: 'This HEIF file holds a JPEG picture inside, which this tool does not read yet.',
    kind: 'This HEIF file holds a kind of picture this tool cannot read.',
    nocodec: 'This browser cannot open iPhone photos. Open this tool in Safari (iPhone, iPad or Mac), or in Chrome or Edge on a computer or phone that plays HEVC video. On an iPhone you can also choose Settings › Camera › Formats › Most Compatible: new photos are then JPG.',
    decode: 'The browser could not read this photo.'
  };
  function heicErr(k) { var e = new Error(HEIC_WHY[k] || HEIC_WHY.decode); e.heic = k; return e; }
  var NATIVE_HEIC = null;   /* does this browser open HEIC itself (Safari)? learnt from the first file */
  function decodeHeic(file) {
    var tryNative = NATIVE_HEIC === false ? Promise.reject() : loadImg(file).then(function (im) { NATIVE_HEIC = true; var c = toCanvas(im); URL.revokeObjectURL(im.src); return c; });
    return tryNative.catch(function () {
      NATIVE_HEIC = false;
      return file.arrayBuffer().then(function (buf) {
        var H = P.heif(new Uint8Array(buf));
        if (H.err) throw heicErr(H.err);
        return heifDraw(H);
      });
    });
  }
  function decodeTiles(tiles, colr) {   /* each tile is one key picture: one decoder per different set-up */
    if (!root.VideoDecoder || !root.EncodedVideoChunk) return Promise.reject(heicErr('nocodec'));
    var cs = P.colorSpace(colr), groups = {}, order = [];
    tiles.forEach(function (t, i) { var k = Array.prototype.join.call(t.hvcC, ','); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(i); });
    var frames = new Array(tiles.length);
    return order.reduce(function (p, k) {
      return p.then(function () {
        var t0 = tiles[groups[k][0]], cfg = { codec: P.hevcCodec(t0.hvcC), description: t0.hvcC };
        if (cs) cfg.colorSpace = cs;
        return VideoDecoder.isConfigSupported(cfg).catch(function () { return { supported: false }; }).then(function (r) {
          if (r.supported) return;
          delete cfg.colorSpace;
          return VideoDecoder.isConfigSupported(cfg).then(function (r2) { if (!r2.supported) throw heicErr('nocodec'); }, function () { throw heicErr('nocodec'); });
        }).then(function () {
          return new Promise(function (res, rej) {
            var failed = null, dec = new VideoDecoder({ output: function (f) { var i = f.timestamp; if (frames[i]) f.close(); else frames[i] = f; }, error: function (e) { failed = e; } });
            try {
              dec.configure(cfg);
              groups[k].forEach(function (i) { dec.decode(new EncodedVideoChunk({ type: 'key', timestamp: i, data: tiles[i].data })); });
            } catch (e) { try { dec.close(); } catch (x) {} rej(heicErr('decode')); return; }
            dec.flush().then(function () { try { dec.close(); } catch (x) {} if (failed) rej(heicErr('decode')); else res(); }, function () { try { dec.close(); } catch (x) {} rej(heicErr('decode')); });
          });
        });
      });
    }, Promise.resolve()).then(function () {
      if (frames.some(function (f) { return !f; })) { frames.forEach(function (f) { if (f) f.close(); }); throw heicErr('decode'); }
      return frames;
    }, function (e) { frames.forEach(function (f) { if (f) f.close(); }); throw e; });
  }
  function heifDraw(H) {
    return decodeTiles(H.tiles, H.colr).then(function (frames) {
      var tw = H.tiles[0].w || frames[0].displayWidth, th = H.tiles[0].h || frames[0].displayHeight, c = canvasOf(H.W, H.H), x = c.getContext('2d');
      frames.forEach(function (f, i) { x.drawImage(f, (i % H.cols) * tw, Math.floor(i / H.cols) * th, tw, th); f.close(); });
      H.ops.forEach(function (op) { c = applyOp(c, op); });
      return c;
    });
  }
  function applyOp(c, op) {
    var n, x;
    if (op[0] === 'clap') {   /* crop, centred, moved by the offsets */
      var w = Math.round(op[1].w), h = Math.round(op[1].h); if (!(w > 0 && h > 0) || w > c.width || h > c.height) return c;
      var x0 = Math.round((c.width - w) / 2 + op[1].x), y0 = Math.round((c.height - h) / 2 + op[1].y);
      n = canvasOf(w, h); n.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h); return n;
    }
    if (op[0] === 'irot') {   /* turned anticlockwise by 90 degrees x n */
      var k = op[1]; if (!k) return c;
      n = k % 2 ? canvasOf(c.height, c.width) : canvasOf(c.width, c.height); x = n.getContext('2d');
      x.translate(n.width / 2, n.height / 2); x.rotate(-k * Math.PI / 2); x.drawImage(c, -c.width / 2, -c.height / 2); return n;
    }
    if (op[0] === 'imir') {   /* axis 0: mirror left-right; 1: upside down */
      n = canvasOf(c.width, c.height); x = n.getContext('2d');
      if (op[1] === 0) { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); }
      x.drawImage(c, 0, 0); return n;
    }
    return c;
  }
  function anyPicture(file) { return isHeic(file) ? decodeHeic(file) : loadImg(file).then(function (im) { var c = toCanvas(im); URL.revokeObjectURL(im.src); return c; }); }
  FT.heicToCanvas = decodeHeic;   /* for other tools (and the tests) */

  /* =====================================================================================================================
     1. PASSPORT PHOTO SHEET
     ===================================================================================================================== */
  /* Sizes are choices, not rules of law; offices differ. Checked 25 Nov 2026:
     - 2 x 2 inch (51 x 51 mm), colour: "Requirement of Photograph for Indian Passport", Embassy of India, Paris
       (https://www.eoiparis.gov.in/content/Photo-Specification-of-passport.pdf, read 25 Nov 2026). 2 inch = 50.8 mm, used below.
     - 35 x 45 mm: the box many Indian forms print. passportindia.gov.in did not answer on 25 Nov 2026 (503), so this is
       offered as a size choice only, and the screen asks people to check the size their office wants. */
  var PSIZE = { in35: [35, 45, '35 x 45 mm (many forms in India)'], sq2: [50.8, 50.8, '2 x 2 inch (51 x 51 mm)'], own: [0, 0, 'My own size'] };
  var PAPER = { p4x6: [101.6, 152.4, '4 x 6 inch photo paper'], a4: [210, 297, 'A4 paper'] };
  var PP = { src: null, name: '', size: 'in35', ow: '35', oh: '45', cx: 0, cy: 0, ch: 0, white: false, wstr: 50, paper: 'p4x6', copies: '' };
  function ppMM() { var s = PSIZE[PP.size]; return s[0] ? [s[0], s[1]] : [Math.min(200, Math.max(10, num(PP.ow) || 35)), Math.min(250, Math.max(10, num(PP.oh) || 45))]; }
  function ppRatio() { var m = ppMM(); return m[0] / m[1]; }
  function ppFit() { var W = PP.src.width, H = PP.src.height, r = ppRatio(); PP.ch = Math.min(H, W / r); PP.cx = W / 2; PP.cy = H / 2; }
  function ppZoomRange() { var max = Math.min(PP.src.height, PP.src.width / ppRatio()) * 1.6; return [Math.max(40, max / 10), max]; }
  /* the photo at its print size, 300 DPI (scale < 1 for the screen) */
  function ppRender(scale) {
    var mm = ppMM(), c = canvasOf(P.mmPx(mm[0]) * (scale || 1), P.mmPx(mm[1]) * (scale || 1)), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    var cw = PP.ch * ppRatio(), sx = PP.cx - cw / 2, sy = PP.cy - PP.ch / 2, k = c.width / cw;
    var ax = Math.max(0, sx), ay = Math.max(0, sy), bx = Math.min(PP.src.width, sx + cw), by = Math.min(PP.src.height, sy + PP.ch);   /* only the part of the photo inside the frame; the rest stays white */
    if (bx > ax && by > ay) { x.imageSmoothingQuality = 'high'; x.drawImage(PP.src, ax, ay, bx - ax, by - ay, (ax - sx) * k, (ay - sy) * k, (bx - ax) * k, (by - ay) * k); }
    if (PP.white) whiten(c, PP.wstr);
    return c;
  }
  /* lighter, whiter background: the wall colour is read from the top edge and the upper sides, then every pixel joined to
     those edges and close to that colour turns white (a flood fill, so a white shirt or the face inside is never touched) */
  function whiten(c, strength) {
    var w = c.width, h = c.height, x = c.getContext('2d'), im = x.getImageData(0, 0, w, h), d = im.data, S = [], i, y, p;
    function px(i) { return [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]; }
    for (i = 0; i < w; i += 2) S.push(px(i), px(w + i));
    for (y = 0; y < h * 0.55; y += 2) S.push(px(y * w), px(y * w + w - 1));
    var bg = [0, 1, 2].map(function (k) { var v = S.map(function (s) { return s[k]; }).sort(function (a, b) { return a - b; }); return v[v.length >> 1]; });
    var tol = 16 + strength * 0.9, tol2 = tol * tol, mark = new Uint8Array(w * h), st = [];
    function dist2(i) { var r = d[i * 4] - bg[0], g = d[i * 4 + 1] - bg[1], b = d[i * 4 + 2] - bg[2]; return r * r + g * g + b * b; }
    function seed(i) { if (!mark[i] && dist2(i) <= tol2) { mark[i] = 1; st.push(i); } }
    for (i = 0; i < w; i++) seed(i);
    for (y = 0; y < Math.floor(h * 0.7); y++) { seed(y * w); seed(y * w + w - 1); }
    while (st.length) {
      p = st.pop(); var qx = p % w, qy = (p - qx) / w;
      if (qx > 0) seed(p - 1); if (qx < w - 1) seed(p + 1); if (qy > 0) seed(p - w); if (qy < h - 1) seed(p + w);
    }
    var lift = 0.35 + strength / 160;   /* pixels at the edge of the wall are blended part-way, so the hair edge stays soft */
    for (p = 0; p < w * h; p++) {
      if (mark[p]) { d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = 255; continue; }
      var rx = p % w, near = (rx > 0 && mark[p - 1]) || (rx < w - 1 && mark[p + 1]) || (p >= w && mark[p - w]) || (p + w < w * h && mark[p + w]);
      if (near && dist2(p) <= tol2 * 2.6) for (var k = 0; k < 3; k++) d[p * 4 + k] = Math.round(d[p * 4 + k] + (255 - d[p * 4 + k]) * lift);
    }
    x.putImageData(im, 0, 0);
  }
  function ppWant() { var mm = ppMM(), paper = PAPER[PP.paper], max = P.sheetMax([paper[0], paper[1]], mm); return PP.copies === 'max' || !PP.copies ? max : Math.min(max, +PP.copies); }
  function ppSheet(scale) {
    var mm = ppMM(), paper = PAPER[PP.paper], L = P.sheetLayout([paper[0], paper[1]], mm, ppWant()), dpi = 300 * (scale || 1);
    var c = canvasOf(P.mmPx(L.paper[0], dpi), P.mmPx(L.paper[1], dpi)), x = c.getContext('2d'), ph = ppRender(scale);
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    var pw = P.mmPx(mm[0], dpi), phh = P.mmPx(mm[1], dpi);
    x.strokeStyle = '#9aa0a6'; x.lineWidth = 1;
    L.cells.forEach(function (cell) {
      var X = Math.round(cell.x / 25.4 * dpi), Y = Math.round(cell.y / 25.4 * dpi);
      x.drawImage(ph, X, Y, pw, phh);
      x.strokeRect(X - 0.5, Y - 0.5, pw + 1, phh + 1);   /* thin cut line just outside each photo */
    });
    return { c: c, L: L };
  }
  function ppNode() {
    css();
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Passport photo sheet</h3><p class="soft">Make passport-size photos from one photo, then print many copies on one sheet of photo paper or A4. Everything stays in this browser.</p>' +
      '<div class="fz-card"><div class="fz-row">' + fileBtn('fs-pp-file', 'Choose a photo', 'image/*,.heic,.heif', false, true) +
        '<label>Photo size <select data-o="size">' + Object.keys(PSIZE).map(function (k) { return '<option value="' + k + '">' + PSIZE[k][2] + '</option>'; }).join('') + '</select></label>' +
        '<label data-own hidden>Width mm <input type="number" min="10" max="200" step="0.5" data-o="ow" value="35" inputmode="decimal"></label>' +
        '<label data-own hidden>Height mm <input type="number" min="10" max="250" step="0.5" data-o="oh" value="45" inputmode="decimal"></label></div>' +
        '<p class="fz-note">Sizes differ between offices, so check what your form or office asks for. Checked on 25 Nov 2026: the Embassy of India in Paris asks for 2 x 2 inch (51 x 51 mm) colour photos for an Indian passport; many forms in India print a 35 x 45 mm box.</p></div>' +
      '<div data-empty class="fz-note">Choose a clear photo taken from the front against a plain, light wall. A phone photo is fine.</div>' +
      '<div class="fs-pp" data-work hidden>' +
        '<div><div class="fs-frame" data-frame tabindex="0" role="group" aria-label="Photo in the frame. Drag to move it. Arrow keys move it, plus and minus zoom."><canvas data-view></canvas><svg data-guide aria-hidden="true"></svg></div>' +
          '<div class="fs-zoom"><button type="button" class="btn" data-z="-1" aria-label="Smaller">−</button><input type="range" min="0" max="100" value="0" data-zr aria-label="Zoom"><button type="button" class="btn" data-z="1" aria-label="Bigger">+</button><button type="button" class="btn" data-turn>Turn</button><button type="button" class="btn" data-fit>Reset</button></div>' +
          '<p class="fz-note">Drag the photo so the face sits inside the oval: the top of the hair near the upper dotted line, the chin near the lower one. The guide is only a help.</p></div>' +
        '<div><div class="fz-card"><div class="fz-row"><label class="fz-chk"><input type="checkbox" data-o="white"> Make the background whiter</label>' +
          '<label data-wl hidden>How much <input type="range" min="0" max="100" value="50" data-o="wstr"></label></div>' +
          '<div class="fz-row"><label>Print on <select data-o="paper">' + Object.keys(PAPER).map(function (k) { return '<option value="' + k + '">' + PAPER[k][2] + '</option>'; }).join('') + '</select></label>' +
          '<label>Copies <select data-o="copies"></select></label></div></div>' +
          '<canvas class="fs-sheet" data-sheet role="img" aria-label="Preview of the print sheet"></canvas><p class="fz-note" data-sinfo></p>' +
          '<div class="pr-bar"><button type="button" class="btn primary" data-dl="jpg" data-ic="download">Download sheet (JPG)</button><button type="button" class="btn" data-dl="pdf" data-ic="download">Download sheet (PDF)</button><button type="button" class="btn" data-dl="one" data-ic="download">Download one photo (JPG)</button></div>' +
          '<p class="fz-note">Print at 100% or “Actual size”, not “Fit to page”, so each photo comes out at its true size. Cut along the thin grey lines. The files are 300 dots per inch.</p></div>' +
      '</div>';
    var view = $('[data-view]', n), frame = $('[data-frame]', n), guide = $('[data-guide]', n), sheetC = $('[data-sheet]', n), tmr = 0;
    function paintCopies() {
      var mm = ppMM(), paper = PAPER[PP.paper], max = P.sheetMax([paper[0], paper[1]], mm), sel = $('[data-o="copies"]', n);
      var opts = [6, 8, 12].filter(function (k) { return k <= max; });
      if (PP.copies && PP.copies !== 'max' && opts.indexOf(+PP.copies) < 0) PP.copies = '';
      sel.innerHTML = opts.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') + '<option value="max">As many as fit (' + max + ')</option>';
      if (!PP.copies) PP.copies = opts.length ? String(opts[0]) : 'max';
      sel.value = PP.copies;
    }
    function paintGuide() {
      var r = ppRatio(), H = 100 / r, top = H * 0.1, chin = H * (r > 0.95 ? 0.72 : 0.8), cy = (top + chin) / 2 + H * 0.02, ry = (chin - top) / 2, rx = ry * 0.74;
      guide.setAttribute('viewBox', '0 0 100 ' + H.toFixed(2));
      guide.innerHTML = '<ellipse cx="50" cy="' + cy.toFixed(2) + '" rx="' + rx.toFixed(2) + '" ry="' + ry.toFixed(2) + '" fill="none" stroke="#F5A524" stroke-width="0.8" stroke-dasharray="2 1.5"/>' +
        '<line x1="20" x2="80" y1="' + top.toFixed(2) + '" y2="' + top.toFixed(2) + '" stroke="#0E746A" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>' +
        '<line x1="20" x2="80" y1="' + chin.toFixed(2) + '" y2="' + chin.toFixed(2) + '" stroke="#0E746A" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>';
    }
    function paintView() {
      if (!PP.src) return;
      var c = ppRender(0.6); view.width = c.width; view.height = c.height; view.getContext('2d').drawImage(c, 0, 0);
      var R = ppZoomRange(); $('[data-zr]', n).value = Math.round(100 * (R[1] - PP.ch) / (R[1] - R[0]));
      clearTimeout(tmr); tmr = setTimeout(paintSheet, 150);
    }
    function paintSheet() {
      if (!PP.src) return;
      var S = ppSheet(0.25); sheetC.width = S.c.width; sheetC.height = S.c.height; sheetC.getContext('2d').drawImage(S.c, 0, 0);
      var mm = ppMM();
      $('[data-sinfo]', n).textContent = S.L.count + ' photos of ' + (Math.round(mm[0] * 10) / 10) + ' x ' + (Math.round(mm[1] * 10) / 10) + ' mm on ' + PAPER[PP.paper][2] + (S.L.land ? ' (paper turned sideways)' : '') + '.';
      sheetC.setAttribute('data-count', S.L.count);
    }
    function zoomTo(ch) { var R = ppZoomRange(); PP.ch = Math.max(R[0], Math.min(R[1], ch)); paintView(); }
    function load(f) {
      anyPicture(f).then(function (c) {
        var k = Math.min(1, 3000 / Math.max(c.width, c.height)); if (k < 1) { var s = canvasOf(c.width * k, c.height * k); s.getContext('2d').drawImage(c, 0, 0, s.width, s.height); c = s; }
        PP.src = c; PP.name = f.name; ppFit(); $('[data-work]', n).hidden = false; $('[data-empty]', n).hidden = true; paintGuide(); paintCopies(); paintView();
      }, function (e) { NS.toast(e && e.heic ? e.message : 'This file could not be opened as a picture.', 'bad'); });
    }
    onFiles(n, '#fs-pp-file', function (l) { load(l[0]); });
    n.addEventListener('change', function (e) {
      var t = e.target, k = t.getAttribute('data-o'); if (!k) return;
      if (k === 'size') { PP.size = t.value; $$('[data-own]', n).forEach(function (x) { x.hidden = t.value !== 'own'; }); }
      else if (k === 'white') { PP.white = t.checked; $('[data-wl]', n).hidden = !t.checked; }
      else if (k === 'paper') { PP.paper = t.value; PP.copies = ''; }
      else if (k === 'copies') PP.copies = t.value;
      else if (k === 'ow' || k === 'oh') PP[k] = t.value;
      else if (k === 'wstr') PP.wstr = +t.value;
      if (!PP.src) return;
      if (k === 'size' || k === 'ow' || k === 'oh') { PP.copies = ''; ppFit(); paintGuide(); }
      if (k !== 'copies') paintCopies();
      paintView();
    });
    n.addEventListener('input', function (e) {
      var t = e.target; if (!PP.src) return;
      if (t.matches('[data-zr]')) { var R = ppZoomRange(); PP.ch = R[1] - (R[1] - R[0]) * (+t.value / 100); paintView(); }
      else if (t.matches('[data-o="wstr"]')) { PP.wstr = +t.value; paintView(); }
    });
    n.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !PP.src) return;
      if (b.hasAttribute('data-z')) zoomTo(PP.ch * (+b.getAttribute('data-z') > 0 ? 0.9 : 1.1));
      else if (b.hasAttribute('data-turn')) { var s = PP.src, c = canvasOf(s.height, s.width), x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(s, 0, 0); PP.src = c; ppFit(); paintView(); }
      else if (b.hasAttribute('data-fit')) { ppFit(); paintView(); }
      else if (b.hasAttribute('data-dl')) save(b.getAttribute('data-dl'), b);
    });
    /* dragging and pinching the photo inside the frame */
    var ptrs = {};
    frame.addEventListener('pointerdown', function (e) { if (!PP.src) return; frame.setPointerCapture(e.pointerId); ptrs[e.pointerId] = [e.clientX, e.clientY]; frame.focus(); });
    frame.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); ptrs[e.pointerId] = [e.clientX, e.clientY];
        a = ptrs[ids[0]]; b = ptrs[ids[1]]; var d1 = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d0 > 0 && d1 > 0) zoomTo(PP.ch * d0 / d1); return;
      }
      var k = PP.ch / (frame.clientHeight || 1); PP.cx -= (e.clientX - p[0]) * k; PP.cy -= (e.clientY - p[1]) * k; ptrs[e.pointerId] = [e.clientX, e.clientY]; paintView();
    });
    function up(e) { delete ptrs[e.pointerId]; }
    frame.addEventListener('pointerup', up); frame.addEventListener('pointercancel', up);
    frame.addEventListener('wheel', function (e) { if (!PP.src) return; e.preventDefault(); zoomTo(PP.ch * (e.deltaY > 0 ? 1.08 : 0.92)); }, { passive: false });
    frame.addEventListener('keydown', function (e) {
      if (!PP.src) return; var st = PP.ch * 0.02, m = { ArrowLeft: [st, 0], ArrowRight: [-st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
      if (m) { e.preventDefault(); PP.cx += m[0]; PP.cy += m[1]; paintView(); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(PP.ch * 0.92); } else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomTo(PP.ch * 1.08); }
    });
    function save(kind, btn) {
      busy(btn, true, 'Making…');
      setTimeout(function () {
        var mm = ppMM(), tag = Math.round(mm[0]) + 'x' + Math.round(mm[1]) + 'mm', p;
        if (kind === 'one') p = blobOf(ppRender(), 'image/jpeg', 0.95).then(function (b) { return setDpi(b, 300); }).then(function (b) { NS.saveFile(b, 'passport-photo-' + tag + '.jpg'); });
        else {
          var S = ppSheet(), name = 'passport-photos-' + tag + '-' + (PP.paper === 'a4' ? 'A4' : '4x6');
          p = blobOf(S.c, 'image/jpeg', 0.95).then(function (b) { return setDpi(b, 300); }).then(function (b) {
            if (kind === 'jpg') { NS.saveFile(b, name + '.jpg'); return; }
            return NS.loadJs(PDFLIB).then(function () {
              var PL = root.PDFLib;
              return Promise.all([PL.PDFDocument.create(), b.arrayBuffer()]).then(function (r) {
                var doc = r[0]; doc.setTitle('Passport photos'); doc.setCreator('NSBiz Free tools'); doc.setProducer('NSBiz');
                return doc.embedJpg(r[1]).then(function (img) {
                  var w = S.L.paper[0] / 25.4 * 72, h = S.L.paper[1] / 25.4 * 72, pg = doc.addPage([w, h]); pg.drawImage(img, { x: 0, y: 0, width: w, height: h });
                  return doc.save();
                });
              }).then(function (bytes) { NS.saveFile(new Blob([bytes], { type: 'application/pdf' }), name + '.pdf'); });
            }, function () { NS.toast('The PDF part did not load. Open NSBiz once with the internet on, then it works offline too.', 'bad'); });
          });
        }
        p.catch(function () { NS.toast('The file could not be made.', 'bad'); }).then(function () { busy(btn, false); });
      }, 30);
    }
    return n;
  }

  /* =====================================================================================================================
     2. iPHONE PHOTOS (HEIC) TO JPG
     ===================================================================================================================== */
  var HC = { list: [], q: '0.9', max: '0', busy: false };
  function hcNode() {
    css();
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>iPhone photos to JPG</h3><p class="soft">iPhones save photos as HEIC files, which many websites and computers do not accept. Turn them into JPG pictures here, many at once. The photos are not uploaded anywhere.</p>' +
      '<div class="fz-card"><div class="fz-row">' + fileBtn('fs-hc-file', 'Choose iPhone photos', 'image/heic,image/heif,.heic,.heif,.hif', true, true) +
        '<label>Quality <select data-o="q"><option value="0.95">Best (bigger files)</option><option value="0.9" selected>High</option><option value="0.8">Medium</option><option value="0.7">Small files</option></select></label>' +
        '<label>Size <select data-o="max"><option value="0">Keep the size</option><option value="3000">Up to 3000 px</option><option value="2000">Up to 2000 px</option><option value="1280">Up to 1280 px</option></select></label></div>' +
        '<p class="fz-note">You can also drop the files here. The JPG files leave out the place (GPS) and camera details stored in the photo.</p></div>' +
      '<div class="pr-bar" data-acts hidden><button type="button" class="btn primary" data-go>Make JPG files</button><button type="button" class="btn" data-zip data-ic="download" hidden>Download all in one zip file</button><button type="button" class="btn" data-clr>Start again</button></div>' +
      '<p class="fz-note" data-st aria-live="polite"></p><div class="fz-list" data-list></div>';
    var list = $('[data-list]', n), st = $('[data-st]', n);
    function paint() {
      $('[data-acts]', n).hidden = !HC.list.length;
      $('[data-zip]', n).hidden = HC.list.filter(function (x) { return x.out; }).length < 2;
      list.innerHTML = HC.list.map(function (it, i) {
        return '<div class="fz-item">' + (it.url ? '<img class="fz-th" alt="" src="' + it.url + '">' : '<div class="fz-th"></div>') +
          '<p class="fz-nm" title="' + esc(it.f.name) + '">' + esc(it.f.name) + '</p><p>' + kb(it.f.size) + (it.out ? ' → <b>' + kb(it.out.size) + '</b>, ' + it.w + ' x ' + it.h + ' px' : '') + '</p>' +
          (it.err ? '<p class="fz-bad">' + esc(it.err) + '</p>' : '') +
          (it.out ? '<div class="pr-bar"><button type="button" class="btn sm" data-dl="' + i + '" data-ic="download">Download</button></div>' : '') + '</div>';
      }).join('');
    }
    function add(l) {
      l.forEach(function (f) { if (isHeic(f)) HC.list.push({ f: f }); else HC.list.push({ f: f, err: 'Not an iPhone photo (HEIC). JPG and PNG pictures can go straight to the Resize pictures tool.' }); });
      paint(); st.textContent = HC.list.length + ' file' + (HC.list.length === 1 ? '' : 's') + ' chosen. Press “Make JPG files”.';
    }
    onFiles(n, '#fs-hc-file', add);
    n.addEventListener('change', function (e) { var k = e.target.getAttribute('data-o'); if (k) HC[k] = e.target.value; });
    n.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-go')) go(b);
      else if (b.hasAttribute('data-clr')) { HC.list.forEach(function (it) { if (it.url) URL.revokeObjectURL(it.url); }); HC.list = []; st.textContent = ''; paint(); }
      else if (b.hasAttribute('data-dl')) { var it = HC.list[+b.getAttribute('data-dl')]; if (it && it.out) NS.saveFile(it.out, base(it.f.name) + '.jpg'); }
      else if (b.hasAttribute('data-zip')) {
        var L = HC.list.filter(function (x) { return x.out; });
        FT.zip(L.map(function (it) { return { name: base(it.f.name) + '.jpg', blob: it.out }; })).then(function (z) { NS.saveFile(z, 'iphone-photos-' + NS.today() + '.zip'); });
      }
    });
    function go(btn) {
      if (HC.busy) return; HC.busy = true; busy(btn, true, 'Working…');
      var todo = HC.list.filter(function (it) { return !it.out && !it.err; }), done = 0, q = +HC.q, max = +HC.max;
      todo.reduce(function (p, it) {
        return p.then(function () {
          st.textContent = 'Working on ' + (done + 1) + ' of ' + todo.length + '…';
          return decodeHeic(it.f).then(function (c) {
            if (max && Math.max(c.width, c.height) > max) { var k = max / Math.max(c.width, c.height), s = canvasOf(c.width * k, c.height * k), x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, s.width, s.height); c = s; }
            var t = canvasOf(c.width, c.height), tx = t.getContext('2d'); tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height); tx.drawImage(c, 0, 0);
            it.w = t.width; it.h = t.height;
            var tw = Math.min(400, t.width), th = canvasOf(tw, tw * t.height / t.width); th.getContext('2d').drawImage(t, 0, 0, th.width, th.height);
            return Promise.all([blobOf(t, 'image/jpeg', q), blobOf(th, 'image/jpeg', 0.7)]);
          }).then(function (r) { it.out = r[0]; it.url = URL.createObjectURL(r[1]); }, function (e) { it.err = e && e.heic ? e.message : 'This photo could not be read.'; })
            .then(function () { done++; paint(); });
        });
      }, Promise.resolve()).then(function () {
        HC.busy = false; busy(btn, false);
        var ok = HC.list.filter(function (x) { return x.out; }).length, bad = HC.list.filter(function (x) { return x.err; }).length;
        st.textContent = ok + ' JPG file' + (ok === 1 ? '' : 's') + ' ready' + (bad ? ', ' + bad + ' could not be made' : '') + '.';
      });
    }
    return n;
  }

  /* =====================================================================================================================
     3. ZIP AND UNZIP
     ===================================================================================================================== */
  var PACKED = /\.(jpe?g|png|gif|webp|heic|heif|avif|zip|rar|7z|gz|bz2|xz|mp3|mp4|m4a|mov|avi|mkv|webm|pdf|docx|xlsx|pptx|odt|ods|apk|jar)$/i;
  var LIMIT = 4000 * 1048576;   /* no ZIP64 writing: a zip made here stays under 4 GB */
  function deflate(u) {
    if (!root.CompressionStream) return Promise.resolve(null);
    try { return new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); }, function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  function makeZip(items, onStep) {
    var parts = [], i = 0;
    return items.reduce(function (p, it) {
      return p.then(function () {
        if (onStep) onStep(++i, items.length);
        return it.file.arrayBuffer().then(function (b) {
          var u = new Uint8Array(b), crc = P.crc32(u);
          return (u.length > 64 && !PACKED.test(it.path) ? deflate(u) : Promise.resolve(null)).then(function (z) {
            var use = z && z.length < u.length * 0.97;
            parts.push({ name: it.path, crc: crc, size: u.length, data: use ? z : u, method: use ? 8 : 0, date: it.file.lastModified ? new Date(it.file.lastModified) : new Date() });
          });
        });
      });
    }, Promise.resolve()).then(function () { return new Blob(P.zipBuild(parts), { type: 'application/zip' }); });
  }
  /* reading a zip from a File without loading all of it */
  function readAt(file, a, z) { return file.slice(a, z).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function openZip(file) {
    var n = Math.min(file.size, 65557 + 20);
    return readAt(file, file.size - n, file.size).then(function (tail) {
      var E = P.zipEnd(tail, file.size); if (!E) throw new Error('notzip');
      var next = E.z64Off >= 0 && (E.count === 0xFFFF || E.cdOff === 0xFFFFFFFF || E.cdSize === 0xFFFFFFFF)
        ? readAt(file, E.z64Off, E.z64Off + 56).then(function (u) { var Z = P.zip64End(u); if (!Z) throw new Error('notzip'); return Z; }) : Promise.resolve(E);
      return next.then(function (Z) {
        var shift = 0;   /* a zip stuck after other data (a self-opening .exe): the list sits later than it says */
        if (E.z64Off < 0 && Z.cdOff + Z.cdSize < E.at) shift = E.at - (Z.cdOff + Z.cdSize);
        if (Z.cdOff + shift + Z.cdSize > file.size) throw new Error('notzip');
        return readAt(file, Z.cdOff + shift, Z.cdOff + shift + Z.cdSize).then(function (cd) {
          var L = P.zipList(cd, Z.count); L.forEach(function (e) { e.lho += shift; }); return L;
        });
      });
    });
  }
  function crcStream(state) {
    return new TransformStream({ transform: function (ch, ctl) { state.crc = P.crc32(ch, state.crc); state.n += ch.length; ctl.enqueue(ch); } });
  }
  /* the file's bytes as a stream (unpacked); state gets the check number and size as it runs */
  function entryStream(file, e, state) {
    return readAt(file, e.lho, e.lho + 30).then(function (h) {
      if (u32(h, 0) !== 0x04034b50) throw new Error('damaged');
      var start = e.lho + 30 + u16(h, 26) + u16(h, 28), s = file.slice(start, start + e.csize).stream();
      if (e.method === 8) { if (!root.DecompressionStream) throw new Error('nodeflate'); s = s.pipeThrough(new DecompressionStream('deflate-raw')); }
      else if (e.method !== 0) throw new Error('method');
      state.crc = 0; state.n = 0;
      return s.pipeThrough(crcStream(state));
    });
  }
  function checkEntry(e, state) { if (state.n !== e.size || state.crc !== e.crc) throw new Error('damaged'); }
  function entryBlob(file, e) {
    var state = {};
    return entryStream(file, e, state).then(function (s) { return new Response(s).blob(); }).then(function (b) { checkEntry(e, state); return b; });
  }
  var ZWHY = { notzip: 'This is not a zip file, or its end is missing (the download may have stopped half-way).', damaged: 'This file inside the zip is damaged: its check number does not match.', method: 'This file is packed in a way this tool cannot open. Try 7-Zip or Windows Explorer.', nodeflate: 'This browser is too old to unpack zip files. Use a newer Chrome, Edge, Firefox or Safari.', list: 'The list of files inside this zip is damaged.' };
  function zwhy(e) { return ZWHY[e && e.message] || ZWHY.damaged; }   /* unpacking errors (bad packed data) mean a damaged file */
  var ZP = { add: [], open: null, list: [], filter: '' };
  function zpNode() {
    css();
    var n = el('div', 'fz-tool');
    n.innerHTML = '<h3>Zip and unzip</h3><p class="soft">Put many files into one zip file to send them, or open a zip file you received and take files out. Nothing is uploaded.</p>' +
      '<div class="fs-tabs" role="group" aria-label="What to do"><button type="button" class="btn primary" data-mode="make" aria-pressed="true">Make a zip file</button><button type="button" class="btn" data-mode="open" aria-pressed="false">Open a zip file</button></div>' +
      '<div data-pane="make"><div class="fz-card" data-dropm><div class="fz-row">' + fileBtn('fs-zm-file', 'Add files', '', true, true) +
        fileBtn('fs-zm-dir', 'Add a folder', '', true, false, ' webkitdirectory') + '</div><p class="fz-note">Or drop files and folders here. Text, Excel (.xls), Word (.doc) and similar files are packed smaller; pictures, PDFs and videos are packed already, so they stay about the same size.</p></div>' +
        '<div data-mlist></div>' +
        '<div class="fz-row" data-mbar hidden><label class="fz-wide">Name of the zip file <input type="text" data-zname maxlength="120"></label></div>' +
        '<div class="pr-bar" data-mbar2 hidden><button type="button" class="btn primary" data-mk data-ic="download">Make and download the zip</button><button type="button" class="btn" data-mclr>Start again</button></div><p class="fz-note" data-mst aria-live="polite"></p></div>' +
      '<div data-pane="open" hidden><div class="fz-card" data-dropo><div class="fz-row">' + fileBtn('fs-zo-file', 'Choose a zip file', '.zip,application/zip,application/x-zip-compressed', false, true) + '</div>' +
        '<p class="fz-note">Or drop it here. Zip files locked with a password cannot be opened here.</p></div><p class="fz-note" data-ost aria-live="polite"></p><div data-olist></div></div>';
    var mlist = $('[data-mlist]', n), olist = $('[data-olist]', n);
    function paintMake() {
      var on = ZP.add.length > 0, tot = ZP.add.reduce(function (s, x) { return s + x.file.size; }, 0);
      $('[data-mbar]', n).hidden = $('[data-mbar2]', n).hidden = !on;
      if (on && !$('[data-zname]', n).value) $('[data-zname]', n).value = ZP.add.length === 1 ? base(ZP.add[0].path.split('/').pop()) : (ZP.add[0].path.indexOf('/') > 0 ? ZP.add[0].path.split('/')[0] : 'files-' + NS.today());
      mlist.innerHTML = on ? '<p class="fz-note">' + ZP.add.length + ' file' + (ZP.add.length === 1 ? '' : 's') + ', ' + kb(tot) + ' in all.</p><div class="fs-tblw"><table class="fs-tbl"><thead><tr><th>File</th><th class="n">Size</th><th><span class="sr">Remove</span></th></tr></thead><tbody>' +
        ZP.add.slice(0, 500).map(function (x, i) { return '<tr><td class="fs-nm">' + esc(x.path) + '</td><td class="n">' + kb(x.file.size) + '</td><td><button type="button" class="btn sm" data-rm="' + i + '" aria-label="Remove ' + esc(x.path) + '">✕</button></td></tr>'; }).join('') +
        (ZP.add.length > 500 ? '<tr><td colspan="3">… and ' + (ZP.add.length - 500) + ' more</td></tr>' : '') + '</tbody></table></div>' : '';
    }
    function addFiles(l) {
      var seen = {}; ZP.add.forEach(function (x) { seen[x.path.toLowerCase()] = 1; });
      l.forEach(function (f) {
        var p = (f.relPath || f.webkitRelativePath || f.name).replace(/\\/g, '/').replace(/^\/+/, ''), q = p, i = 2;
        while (seen[q.toLowerCase()]) q = p.replace(/(\.[^./]+)?$/, ' (' + (i++) + ')$1');
        seen[q.toLowerCase()] = 1; ZP.add.push({ path: q, file: f });
      });
      paintMake();
    }
    onFiles(n, '#fs-zm-file, #fs-zm-dir', addFiles, $('[data-dropm]', n));
    function paintOpen() {
      if (!ZP.open) { olist.innerHTML = ''; return; }
      var files = ZP.list.filter(function (e) { return !e.dir; }), q = ZP.filter.toLowerCase(), shown = files.filter(function (e) { return !q || e.name.toLowerCase().indexOf(q) >= 0; });
      var locked = files.filter(function (e) { return e.enc; }).length, tot = files.reduce(function (s, e) { return s + e.size; }, 0), canDir = !!root.showDirectoryPicker;
      olist.innerHTML = '<p><b>' + esc(ZP.open.name) + '</b>: ' + files.length + ' file' + (files.length === 1 ? '' : 's') + ', ' + kb(tot) + ' when unpacked.' + (locked ? ' <span class="fz-bad">' + locked + ' locked with a password: they cannot be opened here.</span>' : '') + '</p>' +
        (files.length > 15 ? '<div class="fz-row"><label class="fz-wide">Find a file <input type="search" data-zf value="' + esc(ZP.filter) + '"></label></div>' : '') +
        '<div class="pr-bar">' + (canDir ? '<button type="button" class="btn primary" data-xdir>Save all into a folder</button>' : '') + '<button type="button" class="btn' + (canDir ? '' : ' primary') + '" data-xall data-ic="download">Download all</button></div>' +
        '<div class="fs-tblw"><table class="fs-tbl"><thead><tr><th>File</th><th class="n">Size</th><th class="fs-dt">Date</th><th><span class="sr">Download</span></th></tr></thead><tbody data-rows>' + rows(shown) + '</tbody></table></div>';
    }
    function rows(shown) {
      return shown.slice(0, 1000).map(function (e) {
        var i = ZP.list.indexOf(e);
        return '<tr><td class="fs-nm">' + esc(e.name) + '</td><td class="n">' + kb(e.size) + '</td><td class="fs-dt">' + esc(e.date.toLocaleDateString('en-IN')) + '</td><td>' +
          (e.enc ? '<span class="fz-bad">Locked</span>' : '<button type="button" class="btn sm" data-x="' + i + '" data-ic="download">Download</button>') + '</td></tr>';
      }).join('') + (shown.length > 1000 ? '<tr><td colspan="4">… ' + (shown.length - 1000) + ' more: use Find a file</td></tr>' : '');
    }
    function openFile(f) {
      ZP.open = null; ZP.list = []; ZP.filter = ''; $('[data-ost]', n).textContent = 'Reading the zip file…';
      openZip(f).then(function (L) {
        ZP.open = f; ZP.list = L; $('[data-ost]', n).textContent = '';
        if (L.length && L.every(function (e) { return e.enc || e.dir; }) && L.some(function (e) { return e.enc; })) $('[data-ost]', n).innerHTML = '<span class="fz-bad">Every file in this zip is locked with a password. Open it with 7-Zip or Windows Explorer and type the password there.</span>';
        paintOpen();
      }, function (e) { $('[data-ost]', n).innerHTML = '<span class="fz-bad">' + esc(ZWHY[e && e.message] || ZWHY.notzip) + '</span>'; paintOpen(); });
    }
    onFiles(n, '#fs-zo-file', function (l) { openFile(l[0]); }, $('[data-dropo]', n));
    n.addEventListener('input', function (e) {
      if (!e.target.matches('[data-zf]')) return;
      ZP.filter = e.target.value; var q = ZP.filter.toLowerCase();
      var R = $('[data-rows]', n); if (R) R.innerHTML = rows(ZP.list.filter(function (x) { return !x.dir && (!q || x.name.toLowerCase().indexOf(q) >= 0); }));
    });
    n.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-mode')) {
        var m = b.getAttribute('data-mode');
        $$('[data-mode]', n).forEach(function (x) { var on = x === b; x.classList.toggle('primary', on); x.setAttribute('aria-pressed', on); });
        $$('[data-pane]', n).forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== m; });
      } else if (b.hasAttribute('data-rm')) { ZP.add.splice(+b.getAttribute('data-rm'), 1); paintMake(); }
      else if (b.hasAttribute('data-mclr')) { ZP.add = []; $('[data-zname]', n).value = ''; $('[data-mst]', n).textContent = ''; paintMake(); }
      else if (b.hasAttribute('data-mk')) {
        var tot = ZP.add.reduce(function (s, x) { return s + x.file.size; }, 0);
        if (tot > LIMIT || ZP.add.length > 65000) { NS.toast('That is too much for one zip made in the browser (the limit is about 4 GB and 65,000 files). Make two smaller zip files.', 'bad'); return; }
        busy(b, true, 'Packing…');
        var nm = base($('[data-zname]', n).value.trim() || 'files') + '.zip';
        makeZip(ZP.add, function (i, k) { $('[data-mst]', n).textContent = 'Packing ' + i + ' of ' + k + '…'; }).then(function (z) {
          NS.saveFile(z, nm); $('[data-mst]', n).textContent = 'Saved “' + nm + '”: ' + kb(z.size) + ' (the files were ' + kb(tot) + ').';
        }, function () { $('[data-mst]', n).innerHTML = '<span class="fz-bad">The zip could not be made. A file may have been moved, or the device ran out of memory.</span>'; }).then(function () { busy(b, false); });
      } else if (b.hasAttribute('data-x')) {
        var en = ZP.list[+b.getAttribute('data-x')]; busy(b, true, '…');
        entryBlob(ZP.open, en).then(function (bl) { NS.saveFile(bl, en.name.split('/').pop()); }, function (err) { NS.toast(zwhy(err), 'bad'); }).then(function () { busy(b, false); });
      } else if (b.hasAttribute('data-xall')) xAll(b);
      else if (b.hasAttribute('data-xdir')) xDir(b);
    });
    function good() { return ZP.list.filter(function (e) { return !e.dir && !e.enc; }); }
    function xAll(b) {
      var L = good(); if (!L.length) return;
      (L.length > 20 ? ask('This saves ' + L.length + ' files one by one into your Downloads folder, and the browser may ask once to allow many downloads. Go on?') : Promise.resolve(true)).then(function (yes) {
        if (!yes) return;
        busy(b, true, 'Saving…'); var bad = 0;
        L.reduce(function (p, en) { return p.then(function () { return entryBlob(ZP.open, en).then(function (bl) { NS.saveFile(bl, en.name.split('/').pop()); return new Promise(function (r) { setTimeout(r, 300); }); }, function () { bad++; }); }); }, Promise.resolve())
          .then(function () { busy(b, false); NS.toast(bad ? (L.length - bad) + ' saved, ' + bad + ' damaged.' : L.length + ' files saved to Downloads.', bad ? 'bad' : undefined); });
      });
    }
    function xDir(b) {
      var L = good(); if (!L.length) return;
      root.showDirectoryPicker({ mode: 'readwrite' }).then(function (dir) {
        busy(b, true, 'Saving…'); var bad = 0, done = 0;
        return L.reduce(function (p, en) {
          return p.then(function () {
            var parts = P.safeParts(en.name); if (!parts.length) return;
            var fname = parts.pop();
            return parts.reduce(function (d, s) { return d.then(function (h) { return h.getDirectoryHandle(s, { create: true }); }); }, Promise.resolve(dir))
              .then(function (h) { return h.getFileHandle(fname, { create: true }); })
              .then(function (fh) { return fh.createWritable(); })
              .then(function (w) { var state = {}; return entryStream(ZP.open, en, state).then(function (s) { return s.pipeTo(w); }).then(function () { checkEntry(en, state); }); })
              .then(function () { done++; $('[data-ost]', n).textContent = 'Saved ' + done + ' of ' + L.length + '…'; }, function () { bad++; });
          });
        }, Promise.resolve()).then(function () {
          busy(b, false); $('[data-ost]', n).innerHTML = done + ' file' + (done === 1 ? '' : 's') + ' saved into the folder you chose.' + (bad ? ' <span class="fz-bad">' + bad + ' could not be saved or were damaged.</span>' : '');
        });
      }, function () {});
    }
    return n;
  }

  /* =====================================================================================================================
     4. NSBiz SEND: device to device
     ===================================================================================================================== */
  var ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }];   /* public STUN only, no relay (TURN) */
  var CHUNK = 64 * 1024, HIGH = 8 * 1048576, LOW = 1048576, BIG = 300 * 1048576;
  function sendApi() {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { var d = localStorage.getItem('ns-send-dev'); if (d) return d.replace(/\/+$/, ''); } catch (e) {} }   /* tests only */
    return SEND_API.replace(/\/+$/, '');
  }
  var SD = { role: '', ws: null, pc: null, dc: null, code: '', exp: 0, files: [], batch: [], tick: 0, state: 'idle', words: '', recv: null, sending: false, stop: false, connected: false };
  function sdNode() {
    css();
    var n = el('div', 'fz-tool'), on = !!sendApi();
    n.innerHTML = '<h3>NSBiz Send</h3><p class="soft">Send files straight from one device to another, for example from your phone to your computer. Both devices need the internet and this screen open. The files go directly between the two devices, locked (encrypted) on the way; no server keeps them.</p>' +
      (on ? '' : '<div class="fz-card fs-off" data-off><p><b>NSBiz Send is not switched on yet.</b> It needs NSBiz’s small meeting-point service, which is not online yet. Until then you can share files with the Zip tool, by e-mail or by WhatsApp.</p></div>') +
      '<div class="fs-tabs" role="group" aria-label="Send or receive"><button type="button" class="btn primary" data-sm="send" aria-pressed="true">Send</button><button type="button" class="btn" data-sm="recv" aria-pressed="false">Receive</button></div>' +
      '<div data-sp="send"><div class="fz-card" data-sdrop><div class="fz-row">' + fileBtn('fs-sd-file', 'Choose files to send', '', true, true) +
        '<button type="button" class="btn" data-code' + (on ? '' : ' disabled') + '>Get a code</button></div><ul class="fs-files" data-sfiles></ul></div>' +
        '<div class="fz-card" data-tdev></div>' +
        '<div data-sbox hidden></div></div>' +
      '<div data-sp="recv" hidden><div class="fz-card"><div class="fz-row"><label>Code from the other device <input type="text" class="fs-codein" data-rcode maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC234"></label>' +
        '<button type="button" class="btn primary" data-join' + (on ? '' : ' disabled') + '>Connect</button></div>' +
        '<p class="fz-note">Or scan the QR code on the sending device with this phone’s camera.</p></div><div data-rbox hidden></div></div>' +
      '<p class="fz-note">How it works: the two devices find each other with a 6-letter code that ends after 10 minutes and works for one pair only. Both screens then show four safety words; when the words are the same, nobody is in between. If the devices cannot reach each other (some office networks block this), put both on the same Wi-Fi.</p>' +
      '<div class="fz-card fs-man" data-tman></div>';
    var sbox = $('[data-sbox]', n), rbox = $('[data-rbox]', n);
    function mode(m) {
      $$('[data-sm]', n).forEach(function (x) { var o2 = x.getAttribute('data-sm') === m; x.classList.toggle('primary', o2); x.setAttribute('aria-pressed', o2); });
      $$('[data-sp]', n).forEach(function (p) { p.hidden = p.getAttribute('data-sp') !== m; });
    }
    function paintFiles() {
      $('[data-sfiles]', n).innerHTML = SD.files.map(function (f, i) { return '<li class="fs-row2"><span class="fs-nm">' + esc(f.name) + ' <span class="soft">(' + kb(f.size) + ')</span></span><button type="button" class="btn sm" data-srm="' + i + '" aria-label="Remove ' + esc(f.name) + '">✕</button></li>'; }).join('');
    }
    onFiles(n, '#fs-sd-file', function (l) { SD.files = SD.files.concat(l); paintFiles(); if (SD.connected && SD.role === 'host' && !SD.sending) offer(); }, $('[data-sdrop]', n));
    function box() { return SD.role === 'host' ? sbox : rbox; }
    function say(html) { var b = box(); b.hidden = false; var s = $('[data-say]', b); if (!s) { s = el('div', 'fz-card'); s.setAttribute('data-say', ''); s.setAttribute('aria-live', 'polite'); b.appendChild(s); } s.innerHTML = html; }
    function fail(msg) { end(); say('<p class="fz-bad" data-fail>' + esc(msg) + '</p><div class="pr-bar"><button type="button" class="btn" data-again>Start again</button></div>'); }
    function end() {
      clearInterval(SD.tick); SD.connected = false; SD.sending = false; SD.stop = true;
      var ws = SD.ws, dc = SD.dc, pc = SD.pc; SD.ws = SD.pc = SD.dc = null; SD.state = 'idle';
      try { if (ws) ws.close(); } catch (e) {} try { if (dc) dc.close(); } catch (e) {} try { if (pc) pc.close(); } catch (e) {}
    }
    function wsSend(o) { if (SD.ws && SD.ws.readyState === 1) SD.ws.send(JSON.stringify(o)); }
    function signal(code, role) {
      return new Promise(function (res, rej) {
        var ws = new WebSocket(sendApi().replace(/^http/, 'ws') + '/ws/' + code + '?role=' + role), opened = false, chain = Promise.resolve();
        SD.ws = ws;
        ws.onopen = function () { opened = true; res(); };
        ws.onerror = function () { if (!opened) rej(new Error('net')); };
        ws.onclose = function () { if (!opened) rej(new Error('net')); else if (SD.ws === ws && !SD.connected && SD.state !== 'idle') fail('The meeting point closed the connection. Make a new code and try again.'); };
        ws.onmessage = function (ev) {
          var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
          chain = chain.then(function () { if (SD.ws === ws) return onSignal(m); }).catch(function () { fail('The two devices could not agree how to connect. Make a new code and try again.'); });
        };
      });
    }
    function onSignal(m) {
      if (m.t === 'end') { if (!SD.connected) fail(m.why === 'used' ? 'This code has been used already. Ask for a new code.' : m.why === 'expired' ? 'This code has ended or does not exist (codes last 10 minutes). Ask for a new code.' : 'The code ended. Ask for a new code.'); return; }
      if (m.t === 'gone') { if (!SD.connected) fail('The other device left before connecting. Make a new code and try again.'); return; }
      if (m.t === 'peer') { if (SD.role === 'host') { say('<p>Found the other device. Connecting…</p>'); return startPeer(true); } say('<p>Found the other device. Connecting…</p>'); return; }
      if (m.t === 'sdp' && m.d) {
        if (!SD.pc) startPeer(false);
        return SD.pc.setRemoteDescription(m.d).then(function () {
          if (m.d.type === 'offer') return SD.pc.createAnswer().then(function (a) { return SD.pc.setLocalDescription(a); }).then(function () { wsSend({ t: 'sdp', d: SD.pc.localDescription }); });
        });
      }
      if (m.t === 'ice' && m.d && SD.pc) return SD.pc.addIceCandidate(m.d).catch(function () {});
    }
    function startPeer(maker) {
      var pc = SD.pc = new RTCPeerConnection({ iceServers: ICE }); SD.state = 'link';
      pc.onicecandidate = function (e) { if (e.candidate) wsSend({ t: 'ice', d: e.candidate.toJSON() }); };
      pc.onconnectionstatechange = function () {
        if (SD.pc !== pc) return;
        if (pc.connectionState === 'failed') fail('The two devices could not reach each other. This often happens when one is on mobile data and the other on a strict office network. Put both on the same Wi-Fi and try again.');
        else if (pc.connectionState === 'disconnected' && SD.sending) fail('The connection dropped. Start again.');
      };
      var t = setTimeout(function () { if (!SD.connected && SD.pc === pc) fail('The two devices could not reach each other in time. Put both on the same Wi-Fi and try again.'); }, 40000);
      function wire(dc) {
        SD.dc = dc; dc.binaryType = 'arraybuffer'; dc.bufferedAmountLowThreshold = LOW;
        dc.onopen = function () {
          clearTimeout(t); clearInterval(SD.tick); SD.connected = true; SD.stop = false;
          var ws = SD.ws; SD.ws = null; try { if (ws) ws.close(); } catch (e) {}   /* the meeting point is not needed any more */
          SD.fps = P.fingerprints(SD.pc.localDescription.sdp).concat(P.fingerprints(SD.pc.remoteDescription.sdp));
          TR.pairStart(dc, SD.fps, box());   /* before any message can arrive: the other side may offer "Trust this device" */
          safety().then(function () { if (SD.role === 'host') { if (SD.files.length) offer(); else say(connectedLine() + '<p>Connected. Choose the files to send.</p>'); } else say(connectedLine() + '<p>Connected. Waiting for the other device to send files…</p>'); });
        };
        dc.onclose = function () { if (SD.dc !== dc || !SD.connected) return; var was = SD.sending || (SD.recv && SD.recv.on); end(); if (was) say('<p class="fz-bad">The connection closed before everything arrived.</p><div class="pr-bar"><button type="button" class="btn" data-again>Start again</button></div>'); else disconnected(); };
        dc.onmessage = function (e) { onData(e.data); };
      }
      if (maker) { wire(pc.createDataChannel('files', { ordered: true })); return pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { wsSend({ t: 'sdp', d: pc.localDescription }); }); }
      pc.ondatachannel = function (e) { wire(e.channel); };
    }
    function connectedLine() { return '<p>Check that both screens show the same safety words: <span class="fs-words" data-words>' + esc(SD.words) + '</span></p>'; }
    function safety() {
      var f = P.fingerprints(SD.pc.localDescription.sdp).concat(P.fingerprints(SD.pc.remoteDescription.sdp)).sort().join('|');
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(f)).then(function (h) { SD.words = P.words(new Uint8Array(h)).join(' '); });
    }
    function disconnected() { say('<p>Disconnected.</p><div class="pr-bar"><button type="button" class="btn" data-again>Start again</button></div>'); }
    /* ---- sender ---- */
    function getCode(btn) {
      if (!SD.files.length) { NS.toast('Choose the files to send first.', 'bad'); return; }
      end(); SD.role = 'host'; SD.state = 'wait'; busy(btn, true, 'Getting a code…');
      fetch(sendApi() + '/new', { cache: 'no-store' }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.why || 'net'); return j; }); }).then(function (j) {
        SD.code = j.code; SD.exp = j.exp;
        var link = location.origin + location.pathname + '#ftools/send/' + j.code;
        sbox.hidden = false;
        sbox.innerHTML = '<div class="fz-card"><div class="fs-send"><div><p>On the other device open NSBiz › Free tools › NSBiz Send › Receive and type this code:</p><p><span class="fs-code" data-thecode>' + esc(j.code) + '</span></p>' +
          '<p class="fz-note">Or scan the QR code with a phone camera. The code ends in <b data-left></b>.</p><div class="pr-bar"><button type="button" class="btn" data-copylink>Copy the link</button><button type="button" class="btn" data-cancel>Cancel</button></div></div><div class="fs-qr" data-qr role="img" aria-label="QR code of the link"></div></div></div>';
        sbox.setAttribute('data-link', link);
        NS.loadJs(QRLIB).then(function () { var q = root.qrcode(0, 'M'); q.addData(link); q.make(); var Q = $('[data-qr]', sbox); if (Q) Q.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }, function () { var Q = $('[data-qr]', sbox); if (Q) Q.hidden = true; });
        function left() { var s = Math.max(0, Math.round((SD.exp - Date.now()) / 1000)), L = $('[data-left]', sbox); if (L) L.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); if (!s && !SD.connected) fail('The code ended before the other device connected. Make a new code.'); }
        left(); SD.tick = setInterval(left, 1000);
        return signal(j.code, 'host').then(function () { if (!SD.pc) say('<p>Waiting for the other device…</p>'); });
      }).catch(function (e) {
        fail(e && e.message === 'busy' ? 'Too many codes were made from this network just now. Wait a few minutes.' : 'Could not reach the NSBiz meeting point. Check the internet and try again.');
      }).then(function () { busy(btn, false); });
    }
    function offer() {
      SD.sending = true; SD.batch = SD.files.slice(); SD.files = []; paintFiles();
      SD.dc.send(JSON.stringify({ t: 'offer', files: SD.batch.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }) }));
      say(connectedLine() + '<p>Waiting for the other device to accept ' + SD.batch.length + ' file' + (SD.batch.length === 1 ? '' : 's') + '…</p><div class="pr-bar"><button type="button" class="btn" data-cancel>Cancel</button></div>');
    }
    function progressHtml(list, verb) {
      return connectedLine() + '<ul class="fs-files">' + list.map(function (f, i) { return '<li><div class="fs-row2"><span class="fs-nm">' + esc(f.name) + '</span><span class="soft">' + kb(f.size) + '</span></div><div class="fs-bar"><i data-pb="' + i + '"></i></div><div data-pa="' + i + '"></div></li>'; }).join('') + '</ul>' +
        '<p data-ptot>' + verb + '…</p><div class="pr-bar" data-pbtns><button type="button" class="btn" data-cancel>Cancel</button></div>';
    }
    function bar(i, done, size) { var b = $('[data-pb="' + i + '"]', box()); if (b) b.style.width = (size ? Math.min(100, done / size * 100) : 100) + '%'; }
    function waitLow(dc) { return dc.bufferedAmount < HIGH ? Promise.resolve() : new Promise(function (r) { var f = function () { dc.removeEventListener('bufferedamountlow', f); r(); }; dc.addEventListener('bufferedamountlow', f); }); }
    function speed(b, t0) { var s = (Date.now() - t0) / 1000; return s > 1 ? ' (' + kb(b / s) + '/s)' : ''; }
    function pushFiles() {
      var dc = SD.dc, L = SD.batch, t0 = Date.now(), sent = 0, total = L.reduce(function (s, f) { return s + f.size; }, 0);
      SD.stop = false; say(progressHtml(L, 'Sending'));
      return L.reduce(function (p, f, i) {
        return p.then(function () {
          if (SD.stop) throw new Error('stop');
          dc.send(JSON.stringify({ t: 'file', i: i }));
          var off = 0;
          function more() {
            if (SD.stop || SD.dc !== dc) return Promise.reject(new Error('stop'));
            if (off >= f.size) return Promise.resolve();
            return f.slice(off, Math.min(f.size, off + 16 * CHUNK)).arrayBuffer().then(function (buf) {
              var p2 = Promise.resolve();
              for (var o = 0; o < buf.byteLength; o += CHUNK) (function (piece) { p2 = p2.then(function () { return waitLow(dc).then(function () { if (SD.stop) throw new Error('stop'); dc.send(piece); }); }); })(buf.slice(o, o + CHUNK));
              return p2.then(function () { off += buf.byteLength; sent += buf.byteLength; bar(i, off, f.size); var T = $('[data-ptot]', box()); if (T) T.textContent = 'Sending… ' + kb(sent) + ' of ' + kb(total) + speed(sent, t0); return more(); });
            });
          }
          return more().then(function () { dc.send(JSON.stringify({ t: 'end', i: i })); });
        });
      }, Promise.resolve()).then(function () { dc.send(JSON.stringify({ t: 'done' })); var T = $('[data-ptot]', box()); if (T) T.textContent = 'Sent ' + kb(total) + '. Waiting for the other device to confirm…'; }, function () { /* stopped */ });
    }
    /* ---- both sides: messages on the data channel ---- */
    function onData(d) {
      if (typeof d !== 'string') { if (SD.recv && SD.recv.on) recvChunk(d); return; }
      var m; try { m = JSON.parse(d); } catch (e) { return; }
      if (m.t === 'dev' || m.t === 'trusted') { TR.pairMsg(m); return; }   /* trusting each other (older NSBiz never sends these) */
      if (SD.role === 'host') {
        if (m.t === 'accept') pushFiles();
        else if (m.t === 'decline') { SD.sending = false; SD.files = SD.batch.concat(SD.files); SD.batch = []; paintFiles(); say(connectedLine() + '<p class="fz-bad">The other device said no to these files.</p>' + afterBtns()); }
        else if (m.t === 'got' || m.t === 'bad') { var a = $('[data-pa="' + m.i + '"]', box()); if (a) a.innerHTML = m.t === 'got' ? '<span class="fz-ok">Arrived</span>' : '<span class="fz-bad">Arrived damaged</span>'; }
        else if (m.t === 'all') { SD.sending = false; var T = $('[data-ptot]', box()); if (T) T.innerHTML = '<span class="fz-ok" data-alldone>All files arrived on the other device.</span>'; var B = $('[data-pbtns]', box()); if (B) B.innerHTML = afterBtns(); }
        else if (m.t === 'stop') { SD.stop = true; SD.sending = false; say(connectedLine() + '<p class="fz-bad">The other device stopped the transfer.</p>' + afterBtns()); }
      } else {
        if (m.t === 'offer') recvOffer(m.files);
        else if (m.t === 'file') recvStart(m.i);
        else if (m.t === 'end') recvEnd(m.i);
        else if (m.t === 'done') recvDone();
        else if (m.t === 'stop') { if (SD.recv) SD.recv.on = false; say(connectedLine() + '<p class="fz-bad">The sending device stopped the transfer.</p>' + afterBtns()); }
      }
    }
    function afterBtns() { return '<div class="pr-bar">' + (SD.role === 'host' ? '<label class="btn" for="fs-sd-file">Send more files</label>' : '') + '<button type="button" class="btn" data-bye>Disconnect</button></div>'; }
    /* ---- receiver ---- */
    function join(code) {
      code = P.cleanCode(code);
      if (!P.CODE_RE.test(code)) { NS.toast('Type the 6-letter code shown on the sending device.', 'bad'); return; }
      end(); SD.role = 'guest'; SD.state = 'wait'; SD.code = code; SD.recv = null; rbox.hidden = false; rbox.innerHTML = '';
      say('<p>Connecting with code <b>' + esc(code) + '</b>…</p><div class="pr-bar"><button type="button" class="btn" data-cancel>Cancel</button></div>');
      signal(code, 'guest').then(function () { if (!SD.pc && SD.state === 'wait') say('<p>Connected to the meeting point. Waiting for the sending device…</p><div class="pr-bar"><button type="button" class="btn" data-cancel>Cancel</button></div>'); },
        function () { fail('Could not reach the NSBiz meeting point. Check the internet and try again.'); });
    }
    function recvOffer(files) {
      if (!Array.isArray(files) || !files.length || (SD.recv && SD.recv.on)) return;
      var F = files.slice(0, 5000).map(function (f) { return { name: String(f && f.name || 'file').slice(0, 200), size: Math.max(0, +(f && f.size) || 0), type: String(f && f.type || '').slice(0, 100) }; });
      var tot = F.reduce(function (s, f) { return s + f.size; }, 0), big = tot > BIG && !!root.showDirectoryPicker;
      SD.recv = { files: F, on: false, cur: -1, parts: [], got: 0, dir: null, w: null, wq: Promise.resolve(), t0: 0, tot: tot, all: 0 };
      say(connectedLine() + '<p>The other device wants to send you ' + F.length + ' file' + (F.length === 1 ? '' : 's') + ' (' + kb(tot) + '):</p><ul class="fs-files">' +
        F.map(function (f) { return '<li><span class="fs-nm">' + esc(f.name) + '</span> <span class="soft">(' + kb(f.size) + ')</span></li>'; }).join('') + '</ul>' +
        (tot > BIG && !big ? '<p class="fz-note">These files are big. On a phone they may not fit in memory; a computer is better for big files.</p>' : '') +
        '<div class="pr-bar"><button type="button" class="btn primary" data-accept>' + (big ? 'Accept and choose a folder' : 'Accept') + '</button><button type="button" class="btn" data-decline>Say no</button></div>');
    }
    function accept() {
      var R = SD.recv; if (!R || R.on) return;
      var go = function () { R.on = true; R.t0 = Date.now(); say(progressHtml(R.files, 'Receiving')); SD.dc.send(JSON.stringify({ t: 'accept' })); };
      if (R.tot > BIG && root.showDirectoryPicker) root.showDirectoryPicker({ mode: 'readwrite' }).then(function (d) { R.dir = d; go(); }, function () {});
      else go();
    }
    function recvStart(i) {
      var R = SD.recv; if (!R || !R.on || !R.files[i]) return; R.cur = i; R.parts = []; R.got = 0;
      if (R.dir) { var name = P.safeParts(R.files[i].name).pop() || 'file'; R.wq = R.wq.then(function () { return R.dir.getFileHandle(name, { create: true }); }).then(function (h) { return h.createWritable(); }).then(function (w) { R.w = w; }); }
    }
    function recvChunk(buf) {
      var R = SD.recv; if (R.cur < 0) return;
      R.got += buf.byteLength; R.all += buf.byteLength;
      if (R.dir) R.wq = R.wq.then(function () { return R.w.write(buf); }); else R.parts.push(buf);
      bar(R.cur, R.got, R.files[R.cur].size);
      var T = $('[data-ptot]', box()); if (T) T.textContent = 'Receiving… ' + kb(R.all) + ' of ' + kb(R.tot) + speed(R.all, R.t0);
    }
    function recvEnd(i) {
      var R = SD.recv; if (!R || i !== R.cur) return; var f = R.files[i], ok = R.got === f.size, a = $('[data-pa="' + i + '"]', box());
      if (R.dir) R.wq = R.wq.then(function () { return R.w.close(); }).then(function () { if (a) a.innerHTML = ok ? '<span class="fz-ok">Saved in the folder</span>' : '<span class="fz-bad">Arrived incomplete</span>'; });
      else { f.blob = new Blob(R.parts, { type: f.type || 'application/octet-stream' }); f.ok = ok; R.parts = []; if (a) a.innerHTML = ok ? '<button type="button" class="btn sm" data-save="' + i + '" data-ic="download">Save</button>' : '<span class="fz-bad">Arrived incomplete</span>'; }
      SD.dc.send(JSON.stringify({ t: ok ? 'got' : 'bad', i: i })); R.cur = -1;
    }
    function recvDone() {
      var R = SD.recv; if (!R) return;
      R.wq.then(function () {
        R.on = false; if (SD.dc) SD.dc.send(JSON.stringify({ t: 'all' }));
        var T = $('[data-ptot]', box()); if (T) T.innerHTML = '<span class="fz-ok" data-alldone>Everything arrived.</span>' + (R.dir ? ' The files are in the folder you chose.' : ' Press Save on each file, or Save all.');
        var B = $('[data-pbtns]', box()); if (B) B.innerHTML = '<div class="pr-bar">' + (R.dir ? '' : '<button type="button" class="btn primary" data-saveall data-ic="download">Save all</button>') + '<button type="button" class="btn" data-bye>Disconnect</button></div>';
      }, function () { say('<p class="fz-bad">The files could not be written into the folder.</p>' + afterBtns()); });
    }
    n.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-sm')) mode(b.getAttribute('data-sm'));
      else if (b.hasAttribute('data-srm')) { SD.files.splice(+b.getAttribute('data-srm'), 1); paintFiles(); }
      else if (b.hasAttribute('data-code')) getCode(b);
      else if (b.hasAttribute('data-join')) join($('[data-rcode]', n).value);
      else if (b.hasAttribute('data-copylink')) { var l = sbox.getAttribute('data-link'); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(function () { NS.toast('Link copied.'); }, function () { NS.toast(l); }); }
      else if (b.hasAttribute('data-cancel')) {
        if (SD.connected && SD.dc) { SD.stop = true; try { SD.dc.send(JSON.stringify({ t: 'stop' })); } catch (x) {} if (SD.recv) SD.recv.on = false; SD.sending = false; say(connectedLine() + '<p>Stopped.</p>' + afterBtns()); }
        else { var bx = box(); end(); bx.innerHTML = ''; bx.hidden = true; }
      }
      else if (b.hasAttribute('data-again')) { var b2 = box(); end(); b2.innerHTML = ''; b2.hidden = true; SD.batch = []; }
      else if (b.hasAttribute('data-bye')) { end(); disconnected(); }
      else if (b.hasAttribute('data-accept')) accept();
      else if (b.hasAttribute('data-decline')) { if (SD.dc) SD.dc.send(JSON.stringify({ t: 'decline' })); SD.recv = null; say(connectedLine() + '<p>You said no. The files were not sent.</p>' + afterBtns()); }
      else if (b.hasAttribute('data-save')) { var f = SD.recv && SD.recv.files[+b.getAttribute('data-save')]; if (f && f.blob) NS.saveFile(f.blob, f.name); }
      else if (b.hasAttribute('data-saveall')) { var L = (SD.recv ? SD.recv.files : []).filter(function (x) { return x.blob && x.ok; }); L.reduce(function (p, f2) { return p.then(function () { NS.saveFile(f2.blob, f2.name); return new Promise(function (r) { setTimeout(r, 350); }); }); }, Promise.resolve()); }
    });
    var rc = $('[data-rcode]', n);
    rc.addEventListener('input', function () { var v = P.cleanCode(rc.value); if (v !== rc.value) rc.value = v; });
    rc.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('[data-join]', n).click(); } });
    /* a link such as #ftools/send/ABC234 (from the QR code) opens Receive with that code and connects */
    function fromHash() {
      var m = /^#ftools\/send\/([0-9A-Za-z]{6})\b/.exec(location.hash || ''); if (!m || !sendApi()) return;
      var code = m[1].toUpperCase(); if (SD.state !== 'idle' && SD.code === code) return;
      mode('recv'); rc.value = code;
      try { history.replaceState(history.state, '', '#ftools/send'); } catch (e) {}
      join(code);
    }
    window.addEventListener('hashchange', fromHash);
    setTimeout(fromHash, 0);
    paintFiles();
    TR.view(n, { take: function () { var L = SD.files; SD.files = []; paintFiles(); return L; }, giveBack: function (L) { SD.files = L.concat(SD.files); paintFiles(); } });
    return n;
  }

  /* =====================================================================================================================
     4b. NSBiz SEND: TRUSTED DEVICES (office devices that send to each other without a code)
     Each device makes its own key pair once (ECDSA P-256; the private key cannot be copied out of the browser) and keeps it
     in IndexedDB 'ns-send'. Its id is made from the public key. After one normal code pairing, each side may tick "Trust
     this device"; the two exchange id, public key and a signature over the connection's DTLS fingerprints.
     While NSBiz is open (setting), the device joins the Worker's Lobby and proves its key; the Lobby introduces two devices
     only when EACH lists the other. Every transfer then signs the DTLS fingerprints again, so nobody in between (not even
     the meeting point) can pose as a trusted device. Files still go straight from device to device.
     ===================================================================================================================== */
  var TR = (function () {
    var T = { me: null, peers: [], forget: [], dir: null, online: {}, ws: null, st: 'off', holding: false, waiting: false, release: null, retry: 0, ping: 0, sess: {}, views: [], loaded: null, pair: null };
    var LS_VIS = 'ns-send-vis', LS_AUTO = 'ns-send-auto', LS_NAME = 'ns-send-name';
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
    function vis() { return lsGet(LS_VIS) !== '0'; }
    function auto() { return lsGet(LS_AUTO) !== '0'; }
    function bizName() { try { var b = A.biz && A.biz(); return b && b.name || ''; } catch (e) { return ''; } }
    function myName() { return P.cleanName(lsGet(LS_NAME)) || P.defaultName(navigator.userAgent, navigator.maxTouchPoints || 0, bizName()); }
    /* ---- storage on this device ---- */
    var dbp = null;
    function idb() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        if (!root.indexedDB) { rej(new Error('no idb')); return; }
        var r = indexedDB.open('ns-send', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { var d = r.result; d.onversionchange = function () { d.close(); dbp = null; }; res(d); };
        r.onerror = function () { dbp = null; rej(r.error); };
      });
      return dbp;
    }
    function kv(mode, fn) { return idb().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = function () { res(q && q.result); }; t.onerror = function () { rej(t.error); }; }); }); }
    function get(k) { return kv('readonly', function (s) { return s.get(k); }); }
    function set(k, v) { return kv('readwrite', function (s) { return v === undefined ? s.delete(k) : s.put(v, k); }); }
    function me() {
      if (T.me) return T.me;
      T.me = get('me').then(function (m) {
        if (m && m.id && m.priv) return m;
        return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']).then(function (k) {
          return crypto.subtle.exportKey('raw', k.publicKey).then(function (raw) {
            return P.idOf(raw).then(function (id) { var m2 = { id: id, pub: P.b64u(raw), priv: k.privateKey, made: Date.now() }; return set('me', m2).then(function () { return m2; }); });
          });
        });
      });
      T.me.catch(function () { T.me = null; });
      return T.me;
    }
    function sign(text) { return me().then(function (m) { return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, m.priv, new TextEncoder().encode(text)); }).then(function (s) { return P.b64u(s); }); }
    function peer(id) { for (var i = 0; i < T.peers.length; i++) if (T.peers[i].id === id) return T.peers[i]; return null; }
    function savePeers() { paint(); listChanged(); return set('peers', T.peers).catch(function () {}); }
    function load() {
      if (T.loaded) return T.loaded;
      T.loaded = Promise.all([get('peers'), get('forget'), get('dir')]).then(function (r) { T.peers = Array.isArray(r[0]) ? r[0] : []; T.forget = Array.isArray(r[1]) ? r[1] : []; T.dir = r[2] || null; }, function () {});
      return T.loaded;
    }
    /* ---- presence: one NSBiz tab per device holds it (Web Locks); a tab with NSBiz Send open takes it over ---- */
    function toolOpen() { return T.views.some(function (v) { return v.node.isConnected; }); }
    function want() { return (T.peers.length > 0 || T.forget.length > 0) && !!sendApi() && (vis() || toolOpen()); }
    function kick(steal) {
      if (!want()) { stop(); return; }
      if (T.holding) { if (!T.ws) connect(); return; }
      if (T.waiting && !steal) return;
      grab(steal);
    }
    function grab(steal) {
      if (!navigator.locks) { T.holding = true; connect(); return; }
      var g = T.gen = (T.gen || 0) + 1;
      T.waiting = true;
      navigator.locks.request('ns-send-presence', steal ? { steal: true } : {}, function () {
        if (g !== T.gen) return;   /* an older request, replaced by a newer one */
        T.waiting = false;
        if (!want()) return;
        T.holding = true; connect();
        return new Promise(function (r) { T.release = r; });
      }).catch(function () {}).then(function () {
        if (g !== T.gen) return;
        var was = T.holding; T.holding = false; T.waiting = false; T.release = null; closeWs();
        if (was && want()) setTimeout(function () { kick(false); }, 1500);
      });
    }
    function stop() { if (T.release) T.release(); else closeWs(); }
    function closeWs() { var ws = T.ws; T.ws = null; clearInterval(T.ping); T.online = {}; T.st = 'off'; if (ws) try { ws.close(1000); } catch (e) {} paint(); }
    function devTip() { if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return ''; var t = lsGet('ns-send-tip'); return t ? '&tip=' + encodeURIComponent(t) : ''; }   /* tests only */
    function connect() {
      if (T.ws || !T.holding) return;
      me().then(function (m) {
        if (T.ws || !T.holding || !want()) return;
        var ws; try { ws = new WebSocket(sendApi().replace(/^http/, 'ws') + '/presence?id=' + m.id + devTip()); } catch (e) { return; }
        T.ws = ws; T.st = 'wait'; paint();
        ws.onmessage = function (e) { var x; try { x = JSON.parse(e.data); } catch (er) { return; } if (T.ws === ws) onPres(ws, m, x); };
        ws.onclose = function () {
          if (T.ws !== ws) return;
          T.ws = null; clearInterval(T.ping); T.online = {}; T.st = 'off'; paint();
          Object.keys(T.sess).forEach(function (k) { var s = T.sess[k]; if (!s.open) sessFail(s, 'The connection to the NSBiz meeting point dropped. Try again.'); });
          if (T.holding && want()) { T.retry = Math.min(60000, Math.max(3000, T.retry * 2)); setTimeout(connect, T.retry); }
        };
      }, function () {});
    }
    function trustIds() { return T.peers.map(function (p) { return p.id; }); }
    function onPres(ws, m, x) {
      if (x.t === 'challenge') sign(P.helloText(x.n, m.id, trustIds())).then(function (sig) { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'hello', pub: m.pub, trust: trustIds(), forget: T.forget.slice(0, 50), sig: sig })); });
      else if (x.t === 'ready') { T.st = 'on'; T.retry = 0; clearInterval(T.ping); T.ping = setInterval(function () { if (ws.readyState === 1) ws.send('{"t":"ping"}'); }, 45000); paint(); }
      else if (x.t === 'online') { var p = peer(x.id); if (p) { T.online[x.id] = { near: !!x.near }; if (!p.them) { p.them = true; savePeers(); } else paint(); } }
      else if (x.t === 'offline') { delete T.online[x.id]; paint(); }
      else if (x.t === 'told') { T.forget = T.forget.filter(function (i) { return i !== x.id; }); set('forget', T.forget).catch(function () {}); kick(false); }
      else if (x.t === 'removed') { var p2 = peer(x.id); if (p2) { T.peers = T.peers.filter(function (q) { return q.id !== x.id; }); delete T.online[x.id]; savePeers(); NS.toast(p2.name + ' removed this device from its trusted devices. Connect with a code to trust each other again.'); } }
      else if (x.t === 'from') onSig(x.id, x.d);
      else if (x.t === 'nope') Object.keys(T.sess).forEach(function (k) { var s = T.sess[k]; if (s.peer === x.id && !s.open) sessFail(s, nameOf(x.id) + ' is not online any more.'); });
      else if (x.t === 'err' && x.why === 'proof') NS.toast('NSBiz Send could not prove this device to the meeting point.', 'bad');
    }
    function listChanged() {
      if (T.ws && T.st === 'on') { T.ws.send(JSON.stringify({ t: 'list', trust: trustIds() })); if (T.forget.length) T.ws.send(JSON.stringify({ t: 'forget', ids: T.forget.slice(0, 50) })); }
      Object.keys(T.online).forEach(function (id) { if (!peer(id)) delete T.online[id]; });
      kick(false);
    }
    function nameOf(id) { var p = peer(id); return p ? p.name : 'The other device'; }
    function where(id) { var o = T.online[id]; return o ? (o.near ? 'On this network' : 'Online, on another network') : 'Not online'; }
    /* ---- one transfer between two trusted devices = one WebRTC connection ---- */
    function sigTo(id, d) { if (T.ws && T.ws.readyState === 1) T.ws.send(JSON.stringify({ t: 'to', id: id, d: d })); }
    function rid() { var r = new Uint8Array(9); crypto.getRandomValues(r); return P.b64u(r); }
    function newSess(peerId, out, sid) {
      var s = { sid: sid || rid(), peer: peerId, out: out, pc: null, dc: null, open: false, done: false, words: '', chain: Promise.resolve(), files: [], recv: null, box: el('div', 'fs-tsess'), t: 0 };
      s.themP = new Promise(function (r) { s.themR = r; });
      T.sess[s.sid] = s;
      return s;
    }
    function startPc(s) {
      var pc = s.pc = new RTCPeerConnection({ iceServers: ICE });
      pc.onicecandidate = function (e) { if (e.candidate) sigTo(s.peer, { s: s.sid, k: 'ice', d: e.candidate.toJSON() }); };
      pc.onconnectionstatechange = function () { if (pc.connectionState === 'failed' && !s.done) sessFail(s, 'The two devices could not reach each other. Put both on the same Wi-Fi and try again.'); };
      s.t = setTimeout(function () { if (!s.open && !s.done) sessFail(s, 'The two devices could not reach each other in time.'); }, 40000);
      function wire(dc) {
        s.dc = dc; dc.binaryType = 'arraybuffer'; dc.bufferedAmountLowThreshold = LOW;
        dc.onopen = function () {
          clearTimeout(s.t); s.open = true;
          var fps = P.fingerprints(pc.localDescription.sdp).concat(P.fingerprints(pc.remoteDescription.sdp));
          s.fpText = P.dtlsText(fps);
          crypto.subtle.digest('SHA-256', new TextEncoder().encode(fps.slice().sort().join('|'))).then(function (h) { s.words = P.words(new Uint8Array(h)).join(' '); draw(s); });
          me().then(function (m) { return sign(s.fpText).then(function (sig) { dc.send(JSON.stringify({ t: 'who', id: m.id, sig: sig })); }); });
        };
        dc.onmessage = function (e) { onDc(s, e.data); };
        dc.onclose = function () { if (!s.done) sessFail(s, s.recv && s.recv.on || s.sending ? 'The connection closed before everything arrived.' : 'The connection closed.'); };
      }
      if (s.out) {
        wire(pc.createDataChannel('files', { ordered: true }));
        s.chain = s.chain.then(function () { return pc.createOffer(); }).then(function (o) { return pc.setLocalDescription(o); }).then(function () { sigTo(s.peer, { s: s.sid, k: 'sdp', d: pc.localDescription }); });
      } else pc.ondatachannel = function (e) { wire(e.channel); };
      return s;
    }
    function onSig(from, d) {
      if (!d || typeof d.s !== 'string' || d.s.length > 40) return;
      var p = peer(from); if (!p) return;   /* only trusted devices; the Lobby already checked both lists */
      var s = T.sess[d.s];
      if (!s) {
        if (d.k !== 'sdp' || !d.d || d.d.type !== 'offer') return;
        if (Object.keys(T.sess).filter(function (k) { return !T.sess[k].out; }).length >= 3) return;
        s = startPc(newSess(from, false, d.s)); inboxAdd(s);
      }
      if (s.peer !== from) return;
      if (d.k === 'sdp' && d.d) s.chain = s.chain.then(function () { return s.pc.setRemoteDescription(d.d); }).then(function () {
        if (d.d.type === 'offer') return s.pc.createAnswer().then(function (a) { return s.pc.setLocalDescription(a); }).then(function () { sigTo(from, { s: s.sid, k: 'sdp', d: s.pc.localDescription }); });
      }).catch(function () { sessFail(s, 'The two devices could not agree how to connect.'); });
      else if (d.k === 'ice' && d.d) s.chain = s.chain.then(function () { return s.pc.addIceCandidate(d.d); }).catch(function () {});
      else if (d.k === 'bye') { if (!s.open) sessFail(s, nameOf(from) + ' stopped.'); }
    }
    function dcSend(s, o) { try { if (s.dc && s.dc.readyState === 'open') s.dc.send(JSON.stringify(o)); } catch (e) {} }
    function onDc(s, d) {
      if (typeof d !== 'string') { if (s.recv && s.recv.on && s.them === true) chunk(s, d); return; }
      var m; try { m = JSON.parse(d); } catch (e) { return; }
      if (m.t === 'who') {
        var p = peer(s.peer);
        (p && m.id === s.peer && s.fpText ? P.verify(p.pub, s.fpText, m.sig) : Promise.resolve(false)).then(function (ok) {
          s.them = ok; s.themR(ok);
          if (!ok) { sessFail(s, 'This device could not prove it is ' + nameOf(s.peer) + '. Nothing was sent. Someone may be in between: connect with a code again.'); return; }
          if (s.out) { s.sending = true; dcSend(s, { t: 'offer', files: s.files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }) }); s.stage = 'asked'; draw(s); }
        });
        return;
      }
      if (s.out) {
        if (m.t === 'accept') push(s);
        else if (m.t === 'decline') { s.stage = 'declined'; finish(s); }
        else if (m.t === 'got' || m.t === 'bad') { s.res = s.res || {}; s.res[m.i] = m.t; draw(s); }
        else if (m.t === 'all') { s.stage = 'all'; finish(s); }
        else if (m.t === 'stop') { s.stage = 'stopped'; finish(s); }
      } else {
        if (m.t === 'offer') s.themP.then(function (ok) { if (ok) offered(s, m.files); });
        else if (s.them !== true) return;
        else if (m.t === 'file') rStart(s, m.i);
        else if (m.t === 'end') rEnd(s, m.i);
        else if (m.t === 'done') rDone(s);
        else if (m.t === 'stop') { if (s.recv) s.recv.on = false; s.stage = 'stopped'; finish(s); }
      }
    }
    function finish(s) { s.done = true; s.sending = false; clearTimeout(s.t); draw(s); setTimeout(function () { try { if (s.dc) s.dc.close(); } catch (e) {} try { if (s.pc) s.pc.close(); } catch (e) {} }, 800); }
    function sessFail(s, msg) { if (s.done) return; s.done = true; s.sending = false; s.err = msg; clearTimeout(s.t); sigTo(s.peer, { s: s.sid, k: 'bye' }); try { if (s.dc) s.dc.close(); } catch (e) {} try { if (s.pc) s.pc.close(); } catch (e) {} draw(s); }
    /* ---- sender ---- */
    function sendTo(id, files) {
      if (!files.length) { NS.toast('Choose the files to send first.', 'bad'); return null; }
      if (!T.online[id]) { NS.toast(nameOf(id) + ' is not online. Open NSBiz on it.', 'bad'); return null; }
      var s = newSess(id, true); s.files = files.slice(); s.stage = 'link'; draw(s); startPc(s); return s;
    }
    function push(s) {
      var dc = s.dc, L = s.files, t0 = Date.now(), sent = 0, total = L.reduce(function (a, f) { return a + f.size; }, 0);
      s.stage = 'send'; s.prog = []; s.tot = total; s.t0 = t0; draw(s);
      return L.reduce(function (p, f, i) {
        return p.then(function () {
          if (s.done) throw new Error('stop');
          dcSend(s, { t: 'file', i: i });
          var off = 0;
          function more() {
            if (s.done || s.dc !== dc) return Promise.reject(new Error('stop'));
            if (off >= f.size) return Promise.resolve();
            return f.slice(off, Math.min(f.size, off + 16 * CHUNK)).arrayBuffer().then(function (buf) {
              var p2 = Promise.resolve();
              for (var o = 0; o < buf.byteLength; o += CHUNK) (function (piece) { p2 = p2.then(function () { return waitLowDc(dc).then(function () { if (s.done) throw new Error('stop'); dc.send(piece); }); }); })(buf.slice(o, o + CHUNK));
              return p2.then(function () { off += buf.byteLength; sent += buf.byteLength; s.prog[i] = off; s.sent = sent; drawProg(s); return more(); });
            });
          }
          return more().then(function () { dcSend(s, { t: 'end', i: i }); });
        });
      }, Promise.resolve()).then(function () { dcSend(s, { t: 'done' }); s.stage = 'wait'; draw(s); }, function () {});
    }
    function waitLowDc(dc) { return dc.bufferedAmount < HIGH ? Promise.resolve() : new Promise(function (r) { var f = function () { dc.removeEventListener('bufferedamountlow', f); r(); }; dc.addEventListener('bufferedamountlow', f); }); }
    /* ---- receiver ---- */
    function dirOk() { return T.dir && T.dir.queryPermission ? T.dir.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted'; }, function () { return false; }) : Promise.resolve(false); }
    function offered(s, files) {
      if (!Array.isArray(files) || !files.length || s.recv) return;
      var F = files.slice(0, 5000).map(function (f) { return { name: String(f && f.name || 'file').slice(0, 200), size: Math.max(0, +(f && f.size) || 0), type: String(f && f.type || '').slice(0, 100) }; });
      s.recv = { files: F, on: false, cur: -1, parts: [], got: 0, all: 0, tot: F.reduce(function (a, f) { return a + f.size; }, 0), dir: null, w: null, wq: Promise.resolve(), t0: 0 };
      NS.toast(F.length + ' file' + (F.length === 1 ? '' : 's') + ' coming from ' + nameOf(s.peer) + '.');
      if (auto()) accept(s); else { s.stage = 'ask'; draw(s); }
    }
    function accept(s) {
      var R = s.recv; if (!R || R.on) return;
      dirOk().then(function (ok) { R.dir = ok ? T.dir : null; R.on = true; R.t0 = Date.now(); s.stage = 'recv'; s.prog = []; draw(s); dcSend(s, { t: 'accept' }); });
    }
    function freeName(dir, name) {
      var base = P.safeParts(name).pop() || 'file';
      function tryN(n) { var nm = n ? P.numbered(base, n) : base; return dir.getFileHandle(nm).then(function () { return n > 200 ? nm : tryN(n ? n + 1 : 2); }, function () { return nm; }); }
      return tryN(0);
    }
    function rStart(s, i) {
      var R = s.recv; if (!R || !R.on || !R.files[i]) return; R.cur = i; R.parts = []; R.got = 0;
      if (R.dir) R.wq = R.wq.then(function () { return freeName(R.dir, R.files[i].name); }).then(function (nm) { R.files[i].saved = nm; return R.dir.getFileHandle(nm, { create: true }); }).then(function (h) { return h.createWritable(); }).then(function (w) { R.w = w; });
    }
    function chunk(s, buf) {
      var R = s.recv; if (R.cur < 0) return;
      R.got += buf.byteLength; R.all += buf.byteLength; s.prog[R.cur] = R.got; s.sent = R.all;
      if (R.dir) R.wq = R.wq.then(function () { return R.w.write(buf); }); else R.parts.push(buf);
      drawProg(s);
    }
    function rEnd(s, i) {
      var R = s.recv; if (!R || i !== R.cur) return; var f = R.files[i], ok = R.got === f.size;
      f.ok = ok;
      if (R.dir) R.wq = R.wq.then(function () { return R.w.close(); });
      else { f.blob = new Blob(R.parts, { type: f.type || 'application/octet-stream' }); R.parts = []; }
      dcSend(s, { t: ok ? 'got' : 'bad', i: i }); R.cur = -1; s.res = s.res || {}; s.res[i] = ok ? 'got' : 'bad'; draw(s);
    }
    function rDone(s) {
      var R = s.recv; if (!R) return;
      R.wq.then(function () { R.on = false; dcSend(s, { t: 'all' }); s.stage = 'all'; finish(s); NS.toast('Files from ' + nameOf(s.peer) + ' arrived.'); },
        function () { R.on = false; s.stage = 'folderbad'; finish(s); });
    }
    function saveIntoFolder(s, btn) {
      if (!T.dir) return;
      T.dir.requestPermission({ mode: 'readwrite' }).then(function (p) {
        if (p !== 'granted') return;
        var L = s.recv.files.filter(function (f) { return f.blob && f.ok && !f.saved; });
        busy(btn, true, 'Saving…');
        return L.reduce(function (pr, f) { return pr.then(function () { return freeName(T.dir, f.name).then(function (nm) { return T.dir.getFileHandle(nm, { create: true }).then(function (h) { return h.createWritable(); }).then(function (w) { return w.write(f.blob).then(function () { return w.close(); }); }).then(function () { f.saved = nm; }); }); }); }, Promise.resolve())
          .then(function () { busy(btn, false); draw(s); NS.toast('Saved into the folder ' + T.dir.name + '.'); });
      }, function () {});
    }
    /* ---- drawing a transfer (in the tool for sending, in the small inbox for receiving) ---- */
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
    function draw(s) {
      var who = esc(nameOf(s.peer)), L = s.out ? s.files : (s.recv ? s.recv.files : []), h = '';
      var words = s.words ? '<p class="fz-note">Safety words: <span class="fs-words" data-twords>' + esc(s.words) + '</span> (the same on both screens; checked by the devices themselves too)</p>' : '';
      if (s.out) {
        if (s.err) h = '<p class="fz-bad" data-tfail>' + esc(s.err) + '</p>';
        else if (s.stage === 'link') h = '<p>Connecting to ' + who + '…</p>';
        else if (s.stage === 'asked') h = '<p>Connected and checked. Waiting for ' + who + ' to take ' + plural(L.length, 'file') + '…</p>';
        else if (s.stage === 'declined') h = '<p class="fz-bad">' + who + ' said no to these files.</p>';
        else if (s.stage === 'stopped') h = '<p class="fz-bad">The transfer was stopped.</p>';
        else if (s.stage === 'all') h = '<p class="fz-ok" data-tdone>All ' + plural(L.length, 'file') + ' arrived on ' + who + '.</p>';
        else h = '<p data-tprog>Sending to ' + who + '…</p>';
      } else {
        var n2 = T.online[s.peer] ? ' <span class="soft">(' + esc(where(s.peer).toLowerCase()) + ')</span>' : '';
        h = '<p><b>From ' + who + '</b>' + n2 + '</p>';
        if (s.err) h += '<p class="fz-bad" data-tfail>' + esc(s.err) + '</p>';
        else if (!s.recv) h += '<p>Connecting and checking the device…</p>';
        else if (s.stage === 'ask') h += '<p>' + who + ' wants to send you ' + plural(L.length, 'file') + ' (' + kb(s.recv.tot) + ').</p><div class="pr-bar"><button type="button" class="btn primary" data-tacc>Accept</button><button type="button" class="btn" data-tdec>Say no</button></div>';
        else if (s.stage === 'declined') h += '<p>You said no. Nothing was sent.</p>';
        else if (s.stage === 'stopped') h += '<p class="fz-bad">The transfer was stopped.</p>';
        else if (s.stage === 'folderbad') h += '<p class="fz-bad">The files could not be written into the folder.</p>';
        else if (s.stage === 'all') h += '<p class="fz-ok" data-tdone>' + plural(L.length, 'file') + ' arrived' + (s.recv.dir ? ' and were saved into the folder ' + esc(s.recv.dir.name) + '.' : '.') + '</p>';
        else h += '<p data-tprog>Receiving…</p>';
      }
      if (L.length && (s.stage !== 'ask' || s.out)) {
        h += '<ul class="fs-files">' + L.slice(0, 200).map(function (f, i) {
          var r = s.res && s.res[i], act = '';
          if (!s.out && r === 'got' && f.saved) act = '<span class="fz-ok">Saved as ' + esc(f.saved) + '</span>';
          else if (!s.out && r === 'got' && f.blob) act = '<button type="button" class="btn sm" data-tsave="' + i + '" data-ic="download">Save</button>';
          else if (r === 'got') act = '<span class="fz-ok">Arrived</span>';
          else if (r === 'bad') act = '<span class="fz-bad">Arrived damaged</span>';
          return '<li><div class="fs-row2"><span class="fs-nm">' + esc(f.name) + '</span><span class="soft">' + kb(f.size) + '</span></div>' + (s.stage === 'send' || s.stage === 'recv' ? '<div class="fs-bar"><i data-tpb="' + i + '"></i></div>' : '') + (act ? '<div>' + act + '</div>' : '') + '</li>';
        }).join('') + '</ul>';
      }
      var btns = [];
      if (!s.out && s.stage === 'all' && s.recv && !s.recv.dir) {
        btns.push('<button type="button" class="btn primary" data-tsaveall data-ic="download">Save all</button>');
        if (T.dir && root.showDirectoryPicker && s.recv.files.some(function (f) { return f.blob && !f.saved; })) btns.push('<button type="button" class="btn" data-tfolder>Save into the folder ' + esc(T.dir.name) + '</button>');
      }
      if (!s.done && (s.stage === 'send' || s.stage === 'recv' || s.stage === 'asked' || s.stage === 'link')) btns.push('<button type="button" class="btn" data-tstop>Stop</button>');
      if (s.done) btns.push('<button type="button" class="btn" data-tclose>Close</button>');
      s.box.innerHTML = h + words + (btns.length ? '<div class="pr-bar">' + btns.join('') + '</div>' : '');
      s.box.setAttribute('data-tsess', s.sid);
      drawProg(s);
    }
    function drawProg(s) {
      (s.prog || []).forEach(function (v, i) { var b = s.box.querySelector('[data-tpb="' + i + '"]'), f = (s.out ? s.files : s.recv.files)[i]; if (b && f) b.style.width = (f.size ? Math.min(100, v / f.size * 100) : 100) + '%'; });
      var P2 = s.box.querySelector('[data-tprog]'), t = (Date.now() - (s.t0 || s.recv && s.recv.t0 || Date.now())) / 1000;
      if (P2 && s.sent != null) P2.textContent = (s.out ? 'Sending to ' : 'Receiving from ') + nameOf(s.peer) + '… ' + kb(s.sent) + ' of ' + kb(s.out ? s.tot : s.recv.tot) + (t > 1 ? ' (' + kb(s.sent / t) + '/s)' : '');
    }
    function sessClick(e) {
      var b = e.target.closest('button'), box = e.target.closest('[data-tsess]'); if (!b || !box) return;
      var s = T.sess[box.getAttribute('data-tsess')]; if (!s) return;
      if (b.hasAttribute('data-tacc')) accept(s);
      else if (b.hasAttribute('data-tdec')) { dcSend(s, { t: 'decline' }); s.stage = 'declined'; finish(s); }
      else if (b.hasAttribute('data-tstop')) { dcSend(s, { t: 'stop' }); if (s.recv) s.recv.on = false; s.stage = 'stopped'; finish(s); }
      else if (b.hasAttribute('data-tsave')) { var f = s.recv.files[+b.getAttribute('data-tsave')]; if (f && f.blob) NS.saveFile(f.blob, f.name); }
      else if (b.hasAttribute('data-tsaveall')) s.recv.files.filter(function (x) { return x.blob && x.ok; }).reduce(function (p, f2) { return p.then(function () { NS.saveFile(f2.blob, f2.name); return new Promise(function (r) { setTimeout(r, 350); }); }); }, Promise.resolve());
      else if (b.hasAttribute('data-tfolder')) saveIntoFolder(s, b);
      else if (b.hasAttribute('data-tclose')) { delete T.sess[s.sid]; if (s.box.parentNode) s.box.parentNode.removeChild(s.box); inboxTidy(); paint(); }
    }
    /* the small inbox in the corner of the App: files arriving from trusted devices, wherever you are in NSBiz */
    function inbox() {
      var b = document.getElementById('fs-inbox');
      if (!b) {
        css(); tcss();
        b = el('section', ''); b.id = 'fs-inbox'; b.setAttribute('aria-label', 'Files from trusted devices'); b.setAttribute('aria-live', 'polite');
        b.innerHTML = '<div class="fs-ibh"><b>NSBiz Send</b><button type="button" class="btn sm" data-ihide aria-label="Hide">✕</button></div><div data-ilist></div>';
        b.addEventListener('click', function (e) { if (e.target.closest('[data-ihide]')) b.hidden = true; else sessClick(e); });
        document.body.appendChild(b);
      }
      return b;
    }
    function inboxAdd(s) { var b = inbox(); b.hidden = false; $('[data-ilist]', b).appendChild(s.box); draw(s); }
    function inboxTidy() { var b = document.getElementById('fs-inbox'); if (b && !$('[data-ilist]', b).children.length) b.hidden = true; }
    /* ---- pairing inside a normal code connection (the code flow calls these) ---- */
    function pairStart(dc, fps, holder) {
      var c = T.pair = { dc: dc, text: P.dtlsText(fps), holder: holder, other: null, mine: false, theirs: false };
      load().then(me).then(function (m) { return sign(c.text).then(function (sig) { if (dc.readyState === 'open') dc.send(JSON.stringify({ t: 'dev', id: m.id, pub: m.pub, name: myName(), sig: sig })); }); }).catch(function () {});
    }
    function pairMsg(m) {
      var c = T.pair; if (!c) return;
      if (m.t === 'dev' && typeof m.pub === 'string' && typeof m.sig === 'string') {
        var raw; try { raw = P.b64uDec(m.pub); } catch (e) { return; }
        Promise.all([P.idOf(raw), P.verify(m.pub, c.text, m.sig), load()]).then(function (r) {
          if (T.pair !== c || r[0] !== m.id || !r[1]) return;   /* not proven: no trust box */
          c.other = { id: m.id, pub: m.pub, name: P.cleanName(m.name) || 'Other device' };
          var p = peer(m.id); if (p && p.pub === m.pub) { c.mine = true; dcSendRaw(c.dc, { t: 'trusted', yes: true }); }
          pairPaint();
        });
      } else if (m.t === 'trusted') {
        c.theirs = !!m.yes;
        var p2 = c.other && peer(c.other.id); if (p2 && p2.them !== c.theirs) { p2.them = c.theirs; savePeers(); }
        pairPaint();
      }
    }
    function dcSendRaw(dc, o) { try { if (dc.readyState === 'open') dc.send(JSON.stringify(o)); } catch (e) {} }
    function pairPaint() {
      var c = T.pair; if (!c || !c.other || !c.holder) return;
      var p = peer(c.other.id), tb = c.holder.querySelector('[data-trustbox]');
      if (!tb) { tb = el('div', 'fz-card'); tb.setAttribute('data-trustbox', ''); c.holder.appendChild(tb); tb.addEventListener('click', pairClick); }
      tb.innerHTML = '<h4 class="fs-h4">Trust this device?</h4>' +
        '<p class="soft">Then next time the two can send files to each other without a code. Only trust your own devices or your office’s.</p>' +
        '<label class="fs-chk"><input type="checkbox" data-tchk' + (c.mine ? ' checked' : '') + '> <span>Trust this device</span></label>' +
        '<div class="fz-row"><label>Name it <input type="text" data-tname maxlength="40" value="' + esc(p ? p.name : c.other.name) + '"></label>' +
        '<button type="button" class="btn primary" data-tok>Save</button></div>' +
        '<p class="fz-note" data-tstate>' + (c.mine && c.theirs ? '<span class="fz-ok">Both devices trust each other now. Next time choose it under “Your trusted devices”.</span>' :
          c.mine ? 'Saved on this device. The other device must tick “Trust this device” too.' : c.theirs ? 'The other device has trusted this one. Tick “Trust this device” here too.' : 'Both devices must tick it.') + '</p>';
    }
    function pairClick(e) {
      var c = T.pair; if (!c || !c.other || !e.target.closest('[data-tok]')) return;
      var tb = c.holder.querySelector('[data-trustbox]'), yes = $('[data-tchk]', tb).checked, nm = P.cleanName($('[data-tname]', tb).value) || c.other.name;
      var p = peer(c.other.id);
      if (yes) {
        if (p) { p.name = nm; p.pub = c.other.pub; } else { T.peers.push({ id: c.other.id, name: nm, pub: c.other.pub, added: Date.now(), them: c.theirs }); T.forget = T.forget.filter(function (i) { return i !== c.other.id; }); set('forget', T.forget).catch(function () {}); }
        c.mine = true; savePeers(); NS.toast(nm + ' is now a trusted device.');
      } else if (p) { removePeer(c.other.id); c.mine = false; }
      dcSendRaw(c.dc, { t: 'trusted', yes: c.mine });
      pairPaint();
    }
    function pairEnd() { T.pair = null; }
    function removePeer(id) {
      T.peers = T.peers.filter(function (q) { return q.id !== id; }); delete T.online[id];
      if (T.forget.indexOf(id) < 0) T.forget.push(id);
      set('forget', T.forget).catch(function () {}); savePeers();
    }
    /* ---- the "Your trusted devices" part of the NSBiz Send screen ---- */
    function tcss() {
      if (document.getElementById('fs-tcss')) return;
      var s = document.createElement('style'); s.id = 'fs-tcss';
      s.textContent =
        '.fs-tlist{list-style:none;padding:0;margin:8px 0}.fs-tlist>li{padding:10px 0;border-bottom:1px solid var(--line);min-width:0}' +
        '.fs-dev{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fs-dev .fs-nm{flex:1 1 160px;min-width:0;overflow-wrap:anywhere}' +
        '.fs-dot{width:12px;height:12px;border-radius:50%;flex:0 0 12px;background:var(--line);border:1px solid var(--muted,#888)}.fs-dot.on{background:#16A34A;border-color:#16A34A}.fs-dot.far{background:#D97706;border-color:#D97706}' +
        '.fs-tsess{margin:8px 0 0;min-width:0}.fs-h4{margin:0 0 4px;font-size:1rem}' +
        '.fs-chk{display:flex;gap:8px;align-items:center;min-height:40px;cursor:pointer}.fs-chk input{width:20px;height:20px;flex:0 0 auto}' +
        '.fs-man input[type=text]{max-width:100%;min-width:0}.fs-man .fz-row{flex-wrap:wrap}.fs-man details>summary{cursor:pointer;min-height:40px;display:flex;align-items:center;font-weight:600}' +
        '#fs-inbox{position:fixed;right:12px;bottom:12px;z-index:9000;width:min(380px,calc(100vw - 24px));max-height:min(70vh,560px);overflow:auto;background:var(--surface,#fff);color:var(--ink,inherit);border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:10px 12px;box-sizing:border-box}' +
        '#fs-inbox .fs-ibh{display:flex;justify-content:space-between;align-items:center;gap:8px}#fs-inbox .fs-tsess{border-top:1px solid var(--line);padding-top:6px}' +
        '[data-tdev] .btn,[data-tman] .btn,[data-trustbox] .btn,#fs-inbox .btn{min-height:40px!important}#fs-inbox .btn.sm{min-width:40px}@media print{#fs-inbox{display:none!important}}';
      document.head.appendChild(s);
    }
    function view(node, hooks) {
      tcss();
      var v = { node: node, hooks: hooks, list: $('[data-tdev]', node), man: $('[data-tman]', node) };
      T.views.push(v);
      v.list.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tsend]');
        if (b) { var L = hooks.take(); if (!L.length) { NS.toast('Choose the files to send first (above).', 'bad'); return; } var s = sendTo(b.getAttribute('data-tsend'), L); if (!s) hooks.giveBack(L); else paint(); return; }
        sessClick(e);
      });
      v.man.addEventListener('change', function (e) {
        var t = e.target;
        if (t.hasAttribute('data-tvis')) { lsSet(LS_VIS, t.checked ? null : '0'); kick(false); }
        else if (t.hasAttribute('data-tauto')) lsSet(LS_AUTO, t.checked ? null : '0');
        else if (t.hasAttribute('data-tmyname')) { var n2 = P.cleanName(t.value); lsSet(LS_NAME, n2 || null); t.value = myName(); }
        else if (t.hasAttribute('data-trn')) { var p = peer(t.getAttribute('data-trn')), nm = P.cleanName(t.value); if (p && nm) { p.name = nm; savePeers(); } }
      });
      v.man.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-trm')) { var id = b.getAttribute('data-trm'); ask('Remove ' + nameOf(id) + ' from your trusted devices? It will be told the next time both are online.').then(function (y) { if (y) removePeer(id); }); }
        else if (b.hasAttribute('data-trmall')) ask('Remove all trusted devices? Each will be told the next time both are online.').then(function (y) { if (y) { T.peers.slice().forEach(function (p) { if (T.forget.indexOf(p.id) < 0) T.forget.push(p.id); }); T.peers = []; T.online = {}; set('forget', T.forget).catch(function () {}); savePeers(); } });
        else if (b.hasAttribute('data-tdir')) root.showDirectoryPicker({ mode: 'readwrite', id: 'ns-send' }).then(function (d) { T.dir = d; return set('dir', d); }).then(function () { paint(); }, function () {});
        else if (b.hasAttribute('data-tdirok')) T.dir.requestPermission({ mode: 'readwrite' }).then(function () { paint(); }, function () {});
        else if (b.hasAttribute('data-tdirx')) { T.dir = null; set('dir', undefined).catch(function () {}); paint(); }
      });
      load().then(function () { paint(); kick(true); });
      return v;
    }
    function paint() {
      T.views.forEach(function (v) {
        if (!v.node.isConnected && !v.painted) { /* first paint still wanted */ }
        v.painted = true;
        var on = !!sendApi(), st = T.st === 'on' ? 'Visible to your trusted devices.' : T.st === 'wait' ? 'Joining…' : (T.holding || T.waiting) && T.peers.length ? (T.holding ? 'Not connected. Trying again…' : 'Visible from another NSBiz tab on this device.') : T.peers.length ? 'Not visible.' : '';
        var h = '<h4 class="fs-h4">Send to a trusted device</h4>';
        if (!T.peers.length) h += '<p class="soft">No trusted devices yet. Connect two devices once with a code (below), then tick “Trust this device” on both. After that they send to each other without a code.</p>';
        else {
          h += '<p class="soft" data-tstat>' + esc(st) + '</p><ul class="fs-tlist">' + T.peers.map(function (p) {
            var o = T.online[p.id];
            return '<li data-tid="' + esc(p.id) + '"><div class="fs-dev"><span class="fs-dot' + (o ? (o.near ? ' on' : ' far') : '') + '" aria-hidden="true"></span><span class="fs-nm"><b>' + esc(p.name) + '</b><br><span class="soft" data-twhere>' + esc(where(p.id)) + (p.them ? '' : ' · waiting for it to trust this device too') + '</span></span>' +
              '<button type="button" class="btn' + (o ? ' primary' : '') + '" data-tsend="' + esc(p.id) + '"' + (o && on ? '' : ' disabled') + '>Send the chosen files</button></div><div data-tout="' + esc(p.id) + '"></div></li>';
          }).join('') + '</ul>';
        }
        v.list.innerHTML = h;
        Object.keys(T.sess).forEach(function (k) { var s = T.sess[k], c = s.out && v.list.querySelector('[data-tout="' + s.peer + '"]'); if (c) c.appendChild(s.box); });
        var fs = !!root.showDirectoryPicker, ae = document.activeElement;
        if (ae && v.man.contains(ae) && ae.type === 'text') return;   /* do not redraw under someone typing a name */
        v.man.innerHTML = '<details' + (v.open ? ' open' : '') + '><summary>Trusted devices and settings</summary>' +
          '<div class="fz-row"><label>This device’s name <input type="text" data-tmyname maxlength="40" value="' + esc(myName()) + '"></label></div>' +
          '<label class="fs-chk"><input type="checkbox" data-tvis' + (vis() ? ' checked' : '') + '> <span>Be visible to my trusted devices while NSBiz is open</span></label>' +
          '<label class="fs-chk"><input type="checkbox" data-tauto' + (auto() ? ' checked' : '') + '> <span>Receive from trusted devices without asking</span></label>' +
          (fs ? '<div class="fz-row"><span>' + (T.dir ? 'Received files go into the folder <b>' + esc(T.dir.name) + '</b>.' : 'Received files wait with a Save button.') + '</span>' +
            '<button type="button" class="btn" data-tdir>' + (T.dir ? 'Choose another folder' : 'Save received files into a folder automatically') + '</button>' + (T.dir ? '<button type="button" class="btn" data-tdirok hidden>Allow the folder again</button><button type="button" class="btn" data-tdirx>Stop using the folder</button>' : '') + '</div>' +
            '<p class="fz-note">After NSBiz is closed and opened again, the browser asks once more (one click on “Allow the folder again”, or on “Save into the folder” under arrived files) before NSBiz may write into the folder. Until then, files wait with a Save button.</p>'
            : '<p class="fz-note">On this browser received files wait with a Save button. Chrome or Edge on a computer can save them into a folder automatically.</p>') +
          (T.peers.length ? '<p><b>Trusted devices</b></p><ul class="fs-tlist">' + T.peers.map(function (p) {
            return '<li><div class="fz-row"><label>Name <input type="text" data-trn="' + esc(p.id) + '" maxlength="40" value="' + esc(p.name) + '"></label><button type="button" class="btn" data-trm="' + esc(p.id) + '">Remove</button></div><p class="fz-note">Trusted since ' + esc(new Date(p.added || Date.now()).toLocaleDateString('en-IN')) + '</p></li>';
          }).join('') + '</ul><div class="pr-bar"><button type="button" class="btn" data-trmall>Remove all trusted devices</button></div>' : '') +
          '<p class="fz-note">How it works: each device has its own secret key that never leaves it. The NSBiz meeting point lets two devices find each other only when each has trusted the other, and every transfer is checked with those keys, so nobody can pretend to be one of your devices. “On this network” is only a hint; files go straight between the devices either way, never through a server.</p></details>';
        $('details', v.man).addEventListener('toggle', function (e) { v.open = e.target.open; });
        if (T.dir) dirOk().then(function (ok) { var b = $('[data-tdirok]', v.man); if (b) b.hidden = ok; });
      });
    }
    function init() {
      load().then(function () { kick(false); });
      window.addEventListener('hashchange', function () { setTimeout(function () { kick(false); }, 300); });
      setInterval(function () { if (want() !== !!(T.holding || T.waiting)) kick(false); }, 20000);
    }
    return { view: view, pairStart: pairStart, pairMsg: pairMsg, pairEnd: pairEnd, init: init, kick: kick, T: T };
  })();
  FT.trust = TR;   /* for the browser tests */
  if (root.WebSocket && root.crypto && crypto.subtle && root.RTCPeerConnection) setTimeout(TR.init, 1500);

  FT.add('passport', 'Passport photo sheet', 'pic', ppNode);
  FT.add('heic', 'iPhone photos to JPG', 'pic', hcNode);
  FT.add('zip', 'Zip and unzip', 'share', zpNode);
  FT.add('send', 'NSBiz Send', 'share', sdNode);
})(typeof window !== 'undefined' ? window : this);
