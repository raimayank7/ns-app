/* NSPdfSign: a PDF signed with the person's DSC (USB token), NSBiz Helper phase 9. App only, English only.
   The standard PDF signature (adbe.pkcs7.detached, the kind Adobe Reader checks): pdf-lib adds a signature field with an empty
   space for the signature; the exact bytes around that space go to the NSBiz Helper program, which has Windows sign them with
   the chosen certificate (the token's own window asks for the PIN: NSBiz never sees it); the signature is put into the space.
     prepare(bytes, o)    -> { pdf, range: [0, a, b, c], from, to }   o: { name, reason, place, stamp (true: a visible line on the last page) }
     toSign(p)            -> the bytes to sign (everything except the space)
     finish(p, cms)       -> the signed PDF (Uint8Array)
   A PDF that is already signed is refused (writing it again would break the earlier signature).
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function (G) {
  'use strict';
  var SPACE = 24576;   /* bytes kept for the signature (a token's certificate chain fits well inside) */
  var MARK = '**********';
  function latin1(u8, from, to) { var s = ''; for (var i = from; i < to; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(to, i + 0x8000))); return s; }
  function find(u8, text, from) {   /* the first place of an ASCII text in the bytes */
    var t = []; for (var i = 0; i < text.length; i++) t.push(text.charCodeAt(i));
    outer: for (var j = from || 0; j <= u8.length - t.length; j++) { for (var k = 0; k < t.length; k++) if (u8[j + k] !== t[k]) continue outer; return j; }
    return -1;
  }
  function signedAlready(u8) { return find(u8, '/ByteRange') >= 0 && find(u8, '/adbe.pkcs7') >= 0; }
  function prepare(bytes, o) {
    o = o || {};
    var L = G.PDFLib, u0 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (signedAlready(u0)) return Promise.reject(new Error('This PDF is already signed. Signing it again here would break the earlier signature.'));
    return L.PDFDocument.load(u0).then(function (doc) {
      var ctx = doc.context, pages = doc.getPages(), page = pages[pages.length - 1], when = new Date();
      var rect = [0, 0, 0, 0];
      if (o.stamp) {   /* a small visible line at the bottom right of the last page: who signed and when */
        var font = null;
        return doc.embedFont(L.StandardFonts.Helvetica).then(function (f) {
          font = f;
          var sz = page.getSize(), w = 220, h = 34, x = sz.width - w - 24, y = 22;
          page.drawRectangle({ x: x, y: y, width: w, height: h, borderColor: L.rgb(0.05, 0.45, 0.4), borderWidth: 0.8 });
          page.drawText('Digitally signed by ' + String(o.name || '').slice(0, 40), { x: x + 6, y: y + h - 13, size: 8, font: font, color: L.rgb(0.1, 0.1, 0.1) });
          page.drawText('Date: ' + when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) + (o.reason ? '  Reason: ' + String(o.reason).slice(0, 24) : ''), { x: x + 6, y: y + 8, size: 7, font: font, color: L.rgb(0.25, 0.25, 0.25) });
          rect = [x, y, x + w, y + h];
          return build();
        });
      }
      return build();
      function build() {
        var br = L.PDFArray.withContext(ctx);
        br.push(L.PDFNumber.of(0)); br.push(L.PDFName.of(MARK)); br.push(L.PDFName.of(MARK)); br.push(L.PDFName.of(MARK));
        var sig = ctx.obj({ Type: 'Sig', Filter: 'Adobe.PPKLite', SubFilter: 'adbe.pkcs7.detached', ByteRange: br,
          Contents: L.PDFHexString.of('0'.repeat(SPACE * 2)), Reason: L.PDFString.of(o.reason || 'Approved'), M: L.PDFString.fromDate(when),
          Name: L.PDFString.of(o.name || ''), Location: L.PDFString.of(o.place || '') });
        var sigRef = ctx.register(sig);
        var n = 1, acro = doc.catalog.lookup(L.PDFName.of('AcroForm'));
        if (acro && acro.lookup(L.PDFName.of('Fields'))) n = acro.lookup(L.PDFName.of('Fields')).size() + 1;
        var widget = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Sig', Rect: rect, V: sigRef, T: L.PDFString.of('NSBiz signature ' + n), F: 132, P: page.ref });
        var wRef = ctx.register(widget);
        var annots = page.node.lookup(L.PDFName.of('Annots'));
        if (annots) annots.push(wRef); else page.node.set(L.PDFName.of('Annots'), ctx.obj([wRef]));
        if (!acro) { acro = ctx.obj({ Fields: [], SigFlags: 3 }); doc.catalog.set(L.PDFName.of('AcroForm'), ctx.register(acro)); acro = doc.catalog.lookup(L.PDFName.of('AcroForm')); }
        var fields = acro.lookup(L.PDFName.of('Fields')); if (!fields) { fields = ctx.obj([]); acro.set(L.PDFName.of('Fields'), fields); }
        fields.push(wRef); acro.set(L.PDFName.of('SigFlags'), L.PDFNumber.of(3));
        return doc.save({ useObjectStreams: false, addDefaultPage: false }).then(locate);
      }
    });
  }
  /* where the space and the byte-range placeholder are in the saved file; the real byte range is written in */
  function locate(pdf) {
    var pr = find(pdf, '/ByteRange'), a0 = find(pdf, '[', pr), a1 = find(pdf, ']', a0);
    var cs = find(pdf, '/Contents', pr), from = find(pdf, '<', cs), to = find(pdf, '>', from) + 1;   /* written right after /ByteRange */
    if (pr < 0 || from < 0 || to - from !== SPACE * 2 + 2) throw new Error('The signature space could not be found in the PDF');
    var range = [0, from, to, pdf.length - to], txt = '[0 ' + range[1] + ' ' + range[2] + ' ' + range[3] + ']', room = a1 - a0 + 1;
    if (txt.length > room) throw new Error('The byte range does not fit');
    while (txt.length < room) txt += ' ';
    for (var i = 0; i < room; i++) pdf[a0 + i] = txt.charCodeAt(i);
    return { pdf: pdf, range: range, from: from, to: to };
  }
  function toSign(p) { var u = new Uint8Array(p.range[1] + p.range[3]); u.set(p.pdf.subarray(0, p.range[1]), 0); u.set(p.pdf.subarray(p.range[2]), p.range[1]); return u; }
  function finish(p, cms) {
    var c = cms instanceof Uint8Array ? cms : new Uint8Array(cms), hex = '';
    for (var i = 0; i < c.length; i++) hex += (c[i] < 16 ? '0' : '') + c[i].toString(16).toUpperCase();
    if (hex.length > SPACE * 2) throw new Error('The signature is bigger than the space kept for it');
    var out = new Uint8Array(p.pdf); for (var j = 0; j < hex.length; j++) out[p.from + 1 + j] = hex.charCodeAt(j);
    return out;
  }
  G.NSPdfSign = { prepare: prepare, toSign: toSign, finish: finish, signedAlready: signedAlready, SPACE: SPACE, _locate: locate, _latin1: latin1 };
})(typeof window !== 'undefined' ? window : globalThis);
