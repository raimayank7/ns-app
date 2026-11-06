/* The App's own copy of a document maker or of My data (app.niveshsahayak.in/do/<site>/, built by build.py inapp_pages).
   The page runs the same engine as the site, on the same data home, inside a frame of the App (same origin), so:
   - a link to another Nivesh Sahayak site (My data, another maker, a guide) opens on an App screen, not in a new tab;
   - a conversion (quotation -> invoice) asks the App to open the next maker, so the App's Back and history stay right;
   - the App's keys (Ctrl K search, Ctrl B menu, Alt + letter) work while the cursor is in the document. */
(function () {
  'use strict';
  var site = (window.NS_CFG || {}).inApp; if (!site) return;
  function app() { try { return window.parent !== window && window.parent.NSApp; } catch (e) { return null; } }
  NS.inApp = site;
  /* the App opens url on one of its screens; false when the App cannot (the caller then goes there itself) */
  NS.appGo = function (url) { var A = app(); try { return !!(A && A.openUrl && A.openUrl(new URL(url, location.href).href)); } catch (e) { return false; } };
  /* the address of another maker inside the App (used when the App is not there to ask) */
  NS.siteHref = function (s) { return '/do/' + s + '/'; };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.hasAttribute('download')) return;
    if (!/^https?:/.test(a.href) || new URL(a.href).origin === location.origin && a.getAttribute('href').charAt(0) === '#') return;
    if (NS.appGo(a.href)) e.preventDefault();
  });
  /* keys that belong to the App window, not to the document */
  window.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), P = window.parent;
    var mine = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && k === 'k' || (e.ctrlKey || e.metaKey) && !e.altKey && k === 'b' ||
      e.altKey && !e.ctrlKey && !e.metaKey && /^(Digit[1-9]|Key[NRPBX])$/.test(e.code || '');
    if (!mine || !app()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { P.focus(); P.document.dispatchEvent(new P.KeyboardEvent('keydown', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); } catch (er) {}
  }, true);
  /* the App's language changes while a document is open: follow THIS tab's App only (its ns-lang event). The storage event
     also fires for a choice made in another tab or window, which must not switch this one (it takes it on the next load). */
  try { if (app()) window.parent.document.addEventListener('ns-lang', function (e) { if (e.detail && NS.setLang && e.detail !== document.documentElement.getAttribute('lang')) NS.setLang(e.detail, true); }); } catch (e) {}
  window.addEventListener('storage', function (e) {
    if (e.key === 'ns-theme') { if (e.newValue === 'light' || e.newValue === 'dark') document.documentElement.setAttribute('data-theme', e.newValue); else document.documentElement.removeAttribute('data-theme'); }
  });
  /* once the document is saved, the App's address names it (?open=<id>), so a reload shows that document, not a new one
     and never converts a quotation a second time; the App's title row names it too */
  function saved() {
    var t = document.getElementById('tool'), A = app(), j = null;
    if (!t || !A || !A.frameAt) return;
    if (!t.classList.contains('live') || /[?&](open|from)=/.test(location.search)) return;   /* still loading what the App asked for */
    try { j = JSON.parse(localStorage.getItem('ns-draft-' + t.getAttribute('data-doc')) || 'null'); } catch (e) {}
    var no = document.querySelector('#d-no, #s-no, [data-b="no"]');   /* only the draft of the document on screen (not one left from before) */
    A.frameAt(site, j && j.id && j.doc && (!no || no.value === j.doc.no) ? j : null);
  }
  function watch() { var st = document.getElementById('tool-status'); if (st) new MutationObserver(saved).observe(st, { childList: true, characterData: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
