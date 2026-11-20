/* One Export button on every report (owner 20 Nov 2026): the PDF, Excel and CSV buttons a report screen already has are moved
   into an "Export ▾" menu, each with a line saying what you get, and a Picture (PNG) of the report page is added beside them.
   Works on every screen without changing it: the screen draws its buttons as before; this file gathers them when the screen
   appears (before it is painted). The buttons keep their own click handlers. */
(function () {
  'use strict';
  var A = window.NSApp; if (!A || !window.NS) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  var KIND = [
    ['pdf', 'PDF', 'The page, to save or share (.pdf)', function (b) { return /pdf$/i.test(attrs(b)) || /\bpdf\b/i.test(b.textContent); }],
    ['xl', 'Excel', 'A spreadsheet to work with (.xlsx)', function (b) { return /(xl|xlsx|excel)$/i.test(attrs(b)) || /^\s*(download\s+)?excel\b/i.test(b.textContent); }],
    ['csv', 'CSV', 'Plain rows for any program (.csv)', function (b) { return /csv$/i.test(attrs(b)) || /\bcsv\b/i.test(b.textContent); }]];
  function attrs(b) { return [].map.call(b.attributes, function (a) { return /^data-/.test(a.name) ? a.name : ''; }).filter(Boolean).join(' '); }
  function kindOf(b) { if (b.hasAttribute('data-expng')) return null; for (var i = 0; i < KIND.length; i++) if (KIND[i][3](b)) return KIND[i]; return null; }
  function sheets(pane) { return $$('.stsheet, [data-sheet]', pane).filter(function (n) { return !n.parentNode.closest('.stsheet, [data-sheet]'); }); }
  function item(b, k) { b.classList.add('btn'); b.setAttribute('role', 'menuitem'); b.setAttribute('data-noic', ''); b.setAttribute('data-exk', k[0]); b.innerHTML = '<b>' + esc(k[1]) + '</b><small>' + esc(k[2]) + '</small>'; return b; }
  function pngBtn() { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-expng', ''); return item(b, ['png', 'Picture (PNG)', 'The page as an image, easy to send on WhatsApp (.png)']); }
  function fileBase(pane) { var h = $('h2', pane), t = (h ? [].map.call(h.childNodes, function (n) { return n.nodeType === 3 ? n.textContent : ''; }).join(' ') : 'report').trim() || 'report'; return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + NS.today(); }
  /* the report page as one picture: each printed sheet drawn white, one under the other */
  function makePng(pane) {
    var list = sheets(pane); if (!list.length) { NS.toast('Nothing to draw on this screen', 'warn'); return; }
    NS.toast('Making the picture…');
    NS.loadJs('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H').then(function () {
      var box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-12000px;top:0;background:#fff;width:1000px';
      document.body.appendChild(box);
      var cv = [], p = Promise.resolve();
      list.forEach(function (n) { p = p.then(function () { var c = n.cloneNode(true); c.classList.add('lg-paper'); c.removeAttribute('hidden'); c.style.cssText += ';position:static;display:block;visibility:visible;width:1000px;max-width:none'; if (NS.dropHints) NS.dropHints(c); box.appendChild(c); return window.html2canvas(c, { scale: 2, backgroundColor: '#ffffff', logging: false }).then(function (x) { cv.push(x); }); }); });
      return p.then(function () {
        document.body.removeChild(box);
        var w = Math.max.apply(null, cv.map(function (x) { return x.width; })), h = cv.reduce(function (s, x) { return s + x.height; }, 0) + (cv.length - 1) * 24;
        var out = document.createElement('canvas'); out.width = w; out.height = h; var cx = out.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
        var y = 0; cv.forEach(function (x) { cx.drawImage(x, 0, y); y += x.height + 24; });
        return new Promise(function (res) { out.toBlob(res, 'image/png'); });
      });
    }).then(function (blob) {
      if (!blob) return;
      var name = fileBase(pane) + '.png', file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ files: [file], title: name }).catch(function () {}); return; }
      var lnk = document.createElement('a'); lnk.href = URL.createObjectURL(blob); lnk.download = name; document.body.appendChild(lnk); lnk.click();
      setTimeout(function () { URL.revokeObjectURL(lnk.href); document.body.removeChild(lnk); }, 1500); NS.toast('Saved ' + name);
    }, function () { NS.toast('The picture could not be made. Check the internet connection once and try again.', 'bad'); });
  }
  function exportify(pane) {
    if (!pane) return;
    var hasSheet = sheets(pane).length > 0;
    /* a menu the screen already has (the party ledger): only the picture is added */
    $$('details.ex-menu', pane).forEach(function (d) { var pop = $('.wa-pop', d); if (pop && hasSheet && !$('[data-expng]', pop)) pop.appendChild(pngBtn()); });
    $$('.quick, .lg-acts, .tools-row, .pane-hd', pane).forEach(function (row) {
      if (row.closest('details.ex-menu')) return;
      var bs = [].filter.call(row.children, function (b) { return (b.tagName === 'BUTTON' || b.tagName === 'A') && !b.hidden && kindOf(b); });
      if (!bs.length || (bs.length === 1 && !hasSheet)) return;   /* one lone Excel button with nothing to draw stays as it is */
      var d = document.createElement('details'); d.className = 'wa-menu ex-menu';
      d.innerHTML = '<summary class="btn" data-ic="save">Export ▾</summary><div class="wa-pop" role="menu"></div>';
      row.insertBefore(d, bs[0]); var pop = $('.wa-pop', d);
      KIND.forEach(function (k) { bs.forEach(function (b) { if (kindOf(b) === k) pop.appendChild(item(b, k)); }); });
      if (hasSheet) pop.appendChild(pngBtn());
    });
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('[data-expng]'); if (g) { var d = g.closest('details'); if (d) d.open = false; makePng(g.closest('[data-pane]') || document); return; }
    var it = e.target.closest && e.target.closest('details.ex-menu .wa-pop button'); if (it) { var d2 = it.closest('details'); setTimeout(function () { d2.open = false; }, 0); return; }
    $$('details.ex-menu[open]').forEach(function (x) { if (!x.contains(e.target)) x.open = false; });
  });
  var queued = false, pane0 = null;
  function soon() { if (queued) return; queued = true; Promise.resolve().then(function () { queued = false; exportify($('[data-pane]')); }); }
  (function watch() {
    var p = $('[data-pane]'); if (!p) { setTimeout(watch, 200); return; }
    if (p === pane0) return; pane0 = p;
    new MutationObserver(soon).observe(p, { childList: true, subtree: true });
    soon();
  })();
  A.exportify = exportify;
})();
