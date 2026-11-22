/* E-invoice QR check (NSBiz Helper add-on, phase 6): a picture of a supplier's e-invoice (snipped with the add-on, in
   "From the add-on") -> the QR is read (NS.codeReader: the browser's BarcodeDetector or zxing-wasm) -> the signed QR is a
   JWT (header.payload.signature, RS256) signed by the IRP -> its details (seller and buyer GSTIN, number, date, value,
   items, main HSN, IRN, IRN date) and whether the signature matches NIC's published public key.
   The key is the one printed in NIC's "Qrcode_procedure.pdf" (https://einvoice1.gst.gov.in/Documents/Qrcode_procedure.pdf,
   read 21 Nov 2026; it verifies that document's own sample, kid 4DE1544AE695BDC84EC7BC12F2F57F813F44E301). A QR signed
   with another key (NIC may change keys) is never called false here: "could not be confirmed", check on NIC's own site.
   Only a QR with that same key id whose signature fails is reported as changed. App only, English only.
   Designed & Developed by: Nivesh Sahayak (https://www.niveshsahayak.in/) */
(function () {
  'use strict';
  var NS = window.NS; if (!NS) return;
  var NIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6SyVxBs9q+Ikl+ecYgi7pLmqDtdG/o70eYC/yEIuHUnqipNabilOGpDVmd2vfpAYq+fQp1EK3MEFp43uv/nz' +
    'zQNN+nsp40XRQT155pAnjSglfdkLuIooLlP4ip9pPDnAMhHDGvsoDMDPpgY/XQyhNtuVxZ+P55+LsKE6vVCCggAT7lCwvMHoyuKlPLIKt3FZqo0JvnuMf6udXFDU/pOF' +
    'jLTkUvkMzmhUK5v3oTfFKi3ztfYaldroI6fbgpBvuMbAtaBMKidqsAxKVfDiisw2+Q+RvBjSb8DEDss85yLzjfshZlzAPCoVZ7kKPq3ad5Jd0c8Z/qK/A6B9qtW78urbYQIDAQAB';
  var NIC_KID = '4DE1544AE695BDC84EC7BC12F2F57F813F44E301';
  var VERIFY_PAGE = 'https://einvoice1.gst.gov.in/';
  function b64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); return s + '==='.slice((s.length + 3) % 4); }
  function bytes(b64) { var t = atob(b64), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function json(part) { try { return JSON.parse(new TextDecoder().decode(bytes(b64u(part)))); } catch (e) { return null; } }

  /* a JWT text -> { head, data, sig: 'ok' | 'changed' | 'unknown' } (or null when it is not a signed e-invoice QR) */
  function check(jwt) {
    var p = String(jwt || '').trim().split('.');
    if (p.length !== 3) return Promise.resolve(null);
    var head = json(p[0]), body = json(p[1]); if (!head || !body) return Promise.resolve(null);
    var data = body.data; if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
    if (!data || !data.Irn) return Promise.resolve(null);
    var out = { head: head, data: data, iss: body.iss || '' };
    if (!window.crypto || !crypto.subtle) { out.sig = 'unknown'; return Promise.resolve(out); }
    return crypto.subtle.importKey('spki', bytes(NIC_KEY), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
      .then(function (k) { return crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, bytes(b64u(p[2])), new TextEncoder().encode(p[0] + '.' + p[1])); })
      .then(function (ok) { out.sig = ok ? 'ok' : (String(head.kid || '').toUpperCase() === NIC_KID ? 'changed' : 'unknown'); return out; }, function () { out.sig = 'unknown'; return out; });
  }
  /* a picture (data: address or Blob) -> the QR's text ('' when none is found) */
  function readQR(img) {
    var load = typeof img === 'string' ? fetch(img).then(function (r) { return r.blob(); }) : Promise.resolve(img);
    return load.then(function (b) { return createImageBitmap(b); }).then(function (bm) {
      var c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0);
      c.videoWidth = c.width; c.videoHeight = c.height;   /* NS.codeReader reads video-like sources */
      return NS.codeReader().then(function (r) { return r.read(c); });
    });
  }
  function html(r, mine) {
    var E = NS.esc, d = r.data, row = function (k, v) { return v == null || v === '' ? '' : '<dt>' + E(k) + '</dt><dd>' + E(String(v)) + '</dd>'; };
    var sig = r.sig === 'ok' ? '<p class="note good">✓ The signature matches the e-invoice system\'s (NIC) published key.</p>'
      : r.sig === 'changed' ? '<p class="note bad">✗ The signature does not match: this QR may have been changed. Do not accept it without checking.</p>'
      : '<p class="note">The signature could not be confirmed with NIC\'s published key (it may use a newer key). Check it on <a href="' + VERIFY_PAGE + '" target="_blank" rel="noopener">NIC\'s e-invoice site</a> (Verify Signed QR code).</p>';
    var to = mine && d.BuyerGstin ? (d.BuyerGstin === mine ? '<p class="soft">Addressed to your GSTIN.</p>' : '<p class="note bad">The buyer GSTIN is not your business\'s (' + E(mine) + ').</p>') : '';
    return sig + to + '<dl class="ai-qr">' + row('Seller GSTIN', d.SellerGstin) + row('Buyer GSTIN', d.BuyerGstin) + row('Document', (d.DocTyp || '') + ' ' + (d.DocNo || '')) +
      row('Date', d.DocDt) + row('Invoice value', d.TotInvVal != null ? NS.money(+d.TotInvVal) : '') + row('Items', d.ItemCnt) + row('Main HSN', d.MainHsnCode) + row('IRN', d.Irn) + row('IRN date', d.IrnDt) + '</dl>';
  }
  NS.einvQR = { check: check, readQR: readQR, html: html, KEY: NIC_KEY, KID: NIC_KID };
})();
