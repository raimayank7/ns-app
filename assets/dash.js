/* Customize the Dashboard (owner 2026-11-18): which Quick add buttons, money tiles and cards show, and in what order.
   Works on the finished Dashboard (other files add buttons and cards to it after app.js draws it), so new cards and buttons
   fit in by themselves: what the person never moved keeps its place after the ones they arranged.
   Kept in localStorage 'ns-dash' (core.js copies it into the data home with the other tool settings):
     { quick: { order: [key], off: [key] }, tiles: { order, off }, cards: { order, off } }
   Keys: Quick add = data-form / 'quick' / 'newinv' / data-acx; tiles = data-tile; cards = data-dash.
   Designed & Developed by: Nivesh Sahayak */
(function () {
  'use strict';
  var A = window.NSApp; if (!A) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function t(k, v) { return NS.t('ds.' + k, v); }
  var OFF0 = { quick: ['sale', 'contra', 'pret'], tiles: [], cards: [] };   /* extra Quick add buttons that start switched off */
  function load() { try { var p = JSON.parse(localStorage.getItem('ns-dash') || 'null'); if (p && typeof p === 'object') return p; } catch (e) {} return {}; }
  function save(p) { try { localStorage.setItem('ns-dash', JSON.stringify(p)); } catch (e) {} }
  function part(p, k) { var x = p[k] || {}; return { order: x.order || [], off: x.off || OFF0[k].slice() }; }

  /* ---------- what is on the Dashboard right now ---------- */
  function qKey(el) {
    return el.getAttribute('data-q') || el.getAttribute('data-form') || (el.hasAttribute('data-quick') ? 'quick' : '') || el.getAttribute('data-acx') ||
      (el.tagName === 'A' && /billing/.test(el.getAttribute('href') || '') ? 'newinv' : '') || (el.textContent || '').trim();
  }
  function label(el) { return (el.textContent || '').replace(/^\s*\+\s*/, '').replace(/Alt\s*Q$/, '').trim(); }
  function items(root) {
    var q = $('[data-dash="quick"] .quick', root), tl = $('[data-dash="tiles"]', root);
    return {
      quick: q ? $$(':scope > .btn', q).map(function (el) { return { k: qKey(el), el: el, name: label(el) }; }) : [],
      tiles: tl ? $$(':scope > [data-tile]', tl).map(function (el) { return { k: el.getAttribute('data-tile'), el: el, name: ($('span', el) || el).textContent.trim() }; }) : [],
      cards: $$(':scope > [data-dash]', root).filter(function (el) { return el.getAttribute('data-dash') !== 'tiles' || true; }).map(function (el) {
        var h = $('h3', el) || $('summary b', el), k = el.getAttribute('data-dash');
        return { k: k, el: el, name: h ? h.textContent.replace(/\s+/g, ' ').trim() : k === 'tiles' ? t('tiles') : k };
      }).filter(function (x) { return x.el.innerHTML.trim(); })
    };
  }
  /* the person's order first, then everything else in the order the Dashboard draws it */
  function arrange(list, pr) {
    var by = {}; list.forEach(function (x) { by[x.k] = x; });
    var out = pr.order.filter(function (k) { return by[k]; }).map(function (k) { return by[k]; });
    list.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out;
  }

  /* ---------- put the Dashboard in the chosen order ---------- */
  var busy = false;
  function apply() {
    var root = $('[data-pane] .dash-root'); if (!root || busy) return;
    busy = true;
    try {
      var p = load(), it = items(root);
      [['quick', $('[data-dash="quick"] .quick', root)], ['tiles', $('[data-dash="tiles"]', root)], ['cards', root]].forEach(function (z) {
        var k = z[0], box = z[1]; if (!box) return;
        var pr = part(p, k);
        arrange(it[k], pr).forEach(function (x) { if (x.el.parentNode === box) box.appendChild(x.el); x.el.hidden = pr.off.indexOf(x.k) >= 0; });
      });
      if (!$('[data-dash-edit]', root.parentNode)) {
        var h2 = root.previousElementSibling && root.previousElementSibling.tagName === 'H2' ? root.previousElementSibling : null;
        if (h2) h2.insertAdjacentHTML('beforeend', ' <button type="button" class="btn sm dash-edit" data-dash-edit>' + esc(t('custom')) + '</button>');
      }
    } finally { setTimeout(function () { busy = false; }, 0); }
  }
  var mo = new MutationObserver(function () { if (!busy) requestAnimationFrame(apply); });
  function watch() { var p = $('[data-pane]'); if (p) mo.observe(p, { childList: true, subtree: true }); else setTimeout(watch, 300); }
  watch();
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-dash-edit]')) editor(); });

  /* ---------- the Customize screen ---------- */
  var dlg = null, draft = null;
  function editor() {
    var root = $('[data-pane] .dash-root'); if (!root) return;
    var p = load(), it = items(root);
    draft = {}; ['quick', 'tiles', 'cards'].forEach(function (k) { var pr = part(p, k); draft[k] = { list: arrange(it[k], pr).map(function (x) { return { k: x.k, name: x.name }; }), off: pr.off.slice() }; });
    if (!dlg) {
      dlg = NS.el('dialog', { 'class': 'hub-dlg dash-dlg', 'aria-labelledby': 'dash-h' });
      dlg.innerHTML = '<div class="dlg-hd"><h2 id="dash-h"></h2><button type="button" class="icon-btn" data-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><form novalidate></form>';
      document.body.appendChild(dlg);
      $('[data-x]', dlg).addEventListener('click', function () { dlg.close(); });
      var f = $('form', dlg);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var out = load();
        ['quick', 'tiles', 'cards'].forEach(function (k) { out[k] = { order: draft[k].list.map(function (x) { return x.k; }), off: draft[k].off.slice() }; });
        save(out); dlg.removeAttribute('data-dirty'); dlg.close(); NS.toast(t('saved')); A.show();
      });
      f.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-mv]'); if (b) {
          var k = b.getAttribute('data-k'), i = +b.getAttribute('data-i'), j = i + (+b.getAttribute('data-mv')), L = draft[k].list;
          if (j < 0 || j >= L.length) return; var x = L[i]; L[i] = L[j]; L[j] = x; draw(); dlg.setAttribute('data-dirty', '1');
          var nb = $('button[data-k="' + k + '"][data-i="' + j + '"][data-mv="' + b.getAttribute('data-mv') + '"]', dlg) || $('button[data-k="' + k + '"][data-i="' + j + '"]', dlg); if (nb) nb.focus();
          return;
        }
        if (e.target.closest('[data-dash-reset]')) { ['quick', 'tiles', 'cards'].forEach(function (k) { draft[k].off = OFF0[k].slice(); }); var keep = items(root); ['quick', 'tiles', 'cards'].forEach(function (k) { draft[k].list = keep[k].map(function (x) { return { k: x.k, name: x.name }; }); }); draw(); dlg.setAttribute('data-dirty', '1'); }
      });
      f.addEventListener('change', function (e) {
        var c = e.target.closest('input[data-show]'); if (!c) return;
        var k = c.getAttribute('data-k'), key = c.getAttribute('data-show'), off = draft[k].off, at = off.indexOf(key);
        if (c.checked && at >= 0) off.splice(at, 1); if (!c.checked && at < 0) off.push(key);
      });
    }
    $('#dash-h', dlg).textContent = t('title');
    draw();
    dlg.showModal();
  }
  function draw() {
    var f = $('form', dlg);
    f.innerHTML = '<p class="soft">' + esc(t('hint')) + '</p>' + [['quick', 'quick'], ['tiles', 'tiles'], ['cards', 'cards']].map(function (z) {
      var k = z[0], L = draft[k].list;
      if (!L.length) return '';
      return '<fieldset class="dash-set"><legend>' + esc(t(z[1])) + '</legend><ol class="dash-list">' + L.map(function (x, i) {
        var on = draft[k].off.indexOf(x.k) < 0;
        return '<li><label class="chk"><input type="checkbox" data-show="' + esc(x.k) + '" data-k="' + k + '"' + (on ? ' checked' : '') + '> ' + esc(x.name) + '</label>' +
          '<span class="dash-mv"><button type="button" class="btn sm" data-k="' + k + '" data-i="' + i + '" data-mv="-1" aria-label="' + esc(t('up') + ': ' + x.name) + '"' + (i ? '' : ' disabled') + '>↑</button>' +
          '<button type="button" class="btn sm" data-k="' + k + '" data-i="' + i + '" data-mv="1" aria-label="' + esc(t('down') + ': ' + x.name) + '"' + (i < L.length - 1 ? '' : ' disabled') + '>↓</button></span></li>';
      }).join('') + '</ol></fieldset>';
    }).join('') +
      '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(NS.t('app.save')) + '</button><button type="button" class="btn" data-dash-reset>' + esc(t('reset')) + '</button></div>';
    if (NS.dragSort) [].forEach.call(f.querySelectorAll('.dash-list'), function (ol) { var k = (ol.querySelector('[data-k]') || {}).getAttribute ? ol.querySelector('[data-k]').getAttribute('data-k') : ''; if (k) NS.dragSort(ol, function (a, b) { var L = draft[k].list; L.splice(b, 0, L.splice(a, 1)[0]); draw(); }); });
  }
})();
