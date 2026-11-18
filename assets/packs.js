/* Trade packs in NSBiz (after packscore.js and firstrun.js): Settings › Trade packs (#packs).
   One tap starts a trade: items with HSN/SAC and GST rate, document defaults and number series, the App features it needs, and boxes on the home screen.
   Always shows first what it will add; never deletes or overwrites; can be removed again (only what it added and is still unchanged).
   Saved in meta 'packs' = { <business id>: { <pack id>: { at, items: [{id, sig}], sets: [{path, value}], feats: [feature], by } } }.
   The item names, notes and rate sources of a pack are English (typed text); the screens around them follow the language. */
(function () {
  'use strict';
  var A = window.NSApp, P = window.NSPacks;
  if (!A || !P || !document.getElementById('app')) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc;
  function T(k, v) { return NS.t('pk.' + k, v); }

  var STATE = {};   /* meta 'packs' as last read */
  function featCtx(biz) {
    var map = NS.featMap, all = {}; if (map) map.CAT.forEach(function (g) { g[1].forEach(function (f) { all[f[0]] = 1; }); });
    return NSStore.meta('settings').then(function (S) {
      S = S || {};
      var e = biz && biz.id && S.features && S.features[biz.id] || null;
      return { S: S, entry: e, ctx: {
        known: function (f) { return !!all[f]; },
        managed: !!e,
        on: function (f) { if (!e) return true; if (e.sw && f in e.sw) return !!e.sw[f]; return !!(map && map.rec(e.kind, biz.reg, biz.btype)[f]); } } };
    });
  }
  function curBiz() {
    return NSStore.list('biz').then(function (L) {
      var id = NS.curBiz(), b = (L || []).filter(function (x) { return x.id === id; })[0] || (L || []).filter(function (x) { return !x.sample; })[0] || (L || [])[0] || null;
      return b;
    });
  }
  function load() { return NSStore.meta('packs').then(function (m) { STATE = m && typeof m === 'object' ? m : {}; return STATE; }, function () { return STATE; }); }
  function mineApplied(b) { return b && b.id && STATE[b.id] || {}; }

  /* ---------- the screen ---------- */
  function card(p, b, applied) {
    var done = applied[p.id];
    return '<div class="card pk-card"><h3>' + esc(p.name) + (done ? ' <span class="pill ok">' + esc(T('applied')) + '</span>' : '') + '</h3><p>' + esc(p.desc) + '</p>' +
      (p.items.length ? '<p class="soft">' + esc(T('n_items', { n: p.items.length })) + '</p>' : '') +
      '<div class="quick">' + (done ? '<button type="button" class="btn" data-pk-rm="' + p.id + '">' + esc(T('remove')) + '</button>'
        : '<button type="button" class="btn primary" data-pk-add="' + p.id + '">' + esc(T('show')) + '</button>') + '</div></div>';
  }
  function visible(p, haveFeat) { return !p.stub || haveFeat(p.stub); }
  A.addSection('packs', function () {
    return '<div class="pane-hd"><h2><small class="soft">' + esc(NS.t('fr.settings')) + ' ›</small> ' + esc(T('title')) + '</h2></div><p>' + esc(T('intro')) + '</p>' +
      '<p class="note">' + esc(T('limit')) + '</p><div data-pk-list class="pk-list"><p class="soft">…</p></div>';
  }, function (pane) {
    var list = $('[data-pk-list]', pane);
    Promise.all([curBiz(), load()]).then(function (r) {
      var b = r[0];
      if (!b || !b.id) { list.innerHTML = '<p>' + esc(T('nobiz')) + '</p>'; return; }
      return featCtx(b).then(function (f) {
        var applied = mineApplied(b), sug = P.suggest(f.entry && f.entry.kind || b.kind);
        var ps = P.PACKS.filter(function (p) { return visible(p, f.ctx.known); });
        ps.sort(function (x, y) { return (y.id === sug) - (x.id === sug); });
        list.innerHTML = '<p class="soft">' + esc(T('for_biz', { name: b.name })) + '</p><div class="pk-grid">' + ps.map(function (p) { return card(p, b, applied); }).join('') + '</div>';
        list.addEventListener('click', function (e) {
          var a = e.target.closest('[data-pk-add]'), x = e.target.closest('[data-pk-rm]');
          if (a) preview(P.get(a.getAttribute('data-pk-add')), b); else if (x) removeAsk(P.get(x.getAttribute('data-pk-rm')), b);
        });
      });
    });
  });

  function box(html) {
    var d = document.createElement('dialog'); d.className = 'hub-dlg pk-dlg'; d.innerHTML = html; document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) { if (e.target.closest('[data-pk-x]')) d.close(); });
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    return d;
  }
  function ul(a, f) { return a.length ? '<ul>' + a.map(function (x) { return '<li>' + f(x) + '</li>'; }).join('') + '</ul>' : ''; }
  function setLabel(s) { return esc(s.path.join(' › ')) + ': <b>' + esc(String(s.value)) + '</b>'; }
  function featName(f) { var m = NS.featMap, n = f; if (m) m.CAT.forEach(function (g) { g[1].forEach(function (x) { if (x[0] === f) n = NS.t(x[1]); }); }); return n; }
  function boxName(b) { return T('b_' + b); }

  function context(b) {
    return Promise.all([NSStore.list('item'), NS.loadCfg(), featCtx(b)]).then(function (r) {
      return { items: NS.forBiz(r[0], b.id), allItems: r[0], S: r[1], cfg: NS.cfgFor(r[1], b.id), feats: r[2].ctx, entry: r[2].entry };
    });
  }
  function preview(p, b) {
    context(b).then(function (c) {
      var pl = P.plan(p, { items: c.allItems.filter(function (r) { return !r.biz || r.biz === b.id; }), cfg: c.cfg, biz: b.id, feats: c.feats });
      var empty = !pl.add.length && !pl.sets.length && !pl.featOn.length;
      var h = '<div class="dlg-hd"><h2>' + esc(p.name) + '</h2><button type="button" class="icon-btn" data-pk-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><div class="pk-body" style="max-height:60vh;overflow:auto">' +
        '<p>' + esc(T('will', { name: b.name })) + '</p>' +
        (pl.add.length ? '<h3>' + esc(T('h_items', { n: pl.add.length })) + '</h3>' + ul(pl.add, function (i) { return esc(i.d) + ' <small class="soft">' + esc(i.h) + ' · ' + (i.g === '' ? esc(T('type_rate')) : 'GST ' + i.g + '%') + '</small>'; }) +
          '<p class="soft">' + esc(T('norate')) + ' ' + esc(T('asof', { date: p.asof })) + ' ' + esc(p.src) + '.</p>' : '') +
        (pl.skip.length ? '<p class="soft">' + esc(T('skip', { n: pl.skip.length })) + '</p>' : '') +
        (pl.sets.length ? '<h3>' + esc(T('h_sets')) + '</h3>' + ul(pl.sets, setLabel) : '') +
        (pl.kept.length ? '<p class="soft">' + esc(T('kept', { n: pl.kept.length })) + '</p>' : '') +
        (pl.featOn.length ? '<h3>' + esc(T('h_feats')) + '</h3>' + ul(pl.featOn, function (f) { return esc(featName(f)); }) : '') +
        (pl.unmanaged ? '<p class="soft">' + esc(T('allon')) + '</p>' : '') +
        (pl.featWait.length ? '<p class="soft">' + esc(T('wait')) + '</p>' : '') +
        (pl.boxes.length ? '<h3>' + esc(T('h_boxes')) + '</h3>' + ul(pl.boxes, function (x) { return esc(boxName(x)); }) : '') +
        (empty && !pl.boxes.length ? '<p>' + esc(T('nothing')) + '</p>' : '') +
        '<p class="soft">' + esc(T('safe')) + '</p></div><div class="dlg-foot"><button type="button" class="btn primary" data-pk-go>' + esc(T('apply')) + '</button><button type="button" class="btn" data-pk-x>' + esc(T('cancel')) + '</button></div>';
      var d = box(h);
      $('[data-pk-go]', d).addEventListener('click', function (e) { e.target.disabled = true; apply(p, b, c, pl).then(function () { d.close(); }, function (x) { e.target.disabled = false; NS.toast(NS.t('nosave', { e: x.message }), 'bad'); }); });
    });
  }

  function apply(p, b, c, pl) {
    var rec = { at: Date.now(), by: p.id, items: [], sets: pl.sets, feats: pl.featOn };
    return pl.add.reduce(function (pr, it) {
      return pr.then(function () { return NSStore.put('item', P.itemRec(p, it, b.id)).then(function (s) { rec.items.push({ id: s.id, sig: P.sig(s) }); }); });
    }, Promise.resolve()).then(function () {
      if (!pl.sets.length) return;
      return NS.cfgEdit(b.id, function (v) { P.applyCfg(v, pl.sets); });
    }).then(function () {
      if (!pl.featOn.length) return;
      return NSStore.meta('settings').then(function (S) {
        S = S || {}; var e = S.features && S.features[b.id]; if (!e) return;
        e.sw = e.sw || {};
        /* a feature missing from sw follows the recommendation: write the whole row so nothing else changes meaning */
        var map = NS.featMap, base = map ? map.rec(e.kind, b.reg, b.btype) : {};
        if (map) map.CAT.forEach(function (g) { g[1].forEach(function (f) { if (!(f[0] in e.sw)) e.sw[f[0]] = !!base[f[0]]; }); });
        pl.featOn.forEach(function (f) { e.sw[f] = true; });
        return NSStore.meta('settings', S);
      });
    }).then(function () {
      return NSStore.meta('packs').then(function (m) { m = m && typeof m === 'object' ? m : {}; (m[b.id] = m[b.id] || {})[p.id] = rec; STATE = m; return NSStore.meta('packs', m); });
    }).then(function () {
      document.dispatchEvent(new CustomEvent('ns-data'));
      NS.toast(T('done', { name: p.name })); A.show();
    });
  }

  function removeAsk(p, b) {
    var d = box('<div class="dlg-hd"><h2>' + esc(p.name) + '</h2><button type="button" class="icon-btn" data-pk-x aria-label="' + esc(NS.t('close')) + '">✕</button></div><div class="pk-body" style="max-height:60vh;overflow:auto"><p>' + esc(T('rm_p')) + '</p></div>' +
      '<div class="dlg-foot"><button type="button" class="btn danger" data-pk-go>' + esc(T('remove')) + '</button><button type="button" class="btn" data-pk-x>' + esc(T('cancel')) + '</button></div>');
    $('[data-pk-go]', d).addEventListener('click', function (e) { e.target.disabled = true; remove(p, b).then(function () { d.close(); }, function (x) { e.target.disabled = false; NS.toast(NS.t('nosave', { e: x.message }), 'bad'); }); });
  }
  function remove(p, b) {
    var rec = (STATE[b.id] || {})[p.id]; if (!rec) return Promise.resolve();
    var res = { gone: 0, kept: 0 };
    return NSStore.list('item').then(function (items) {
      var r = P.removable(rec, items); res.kept += r.keep.length;
      return r.del.reduce(function (pr, it) { return pr.then(function () { res.gone++; return NSStore.del('item', it.id); }); }, Promise.resolve());
    }).then(function () {
      if (!(rec.sets || []).length) return;
      return NS.cfgEdit(b.id, function (v) { res.kept += P.undoCfg(v, rec.sets).kept.length; });
    }).then(function () {
      if (!(rec.feats || []).length) return;
      return NSStore.meta('settings').then(function (S) {
        var e = S && S.features && S.features[b.id]; if (!e || !e.sw) return;
        /* a feature another applied pack also needs stays on */
        var other = {}; Object.keys(STATE[b.id] || {}).forEach(function (id) { if (id !== p.id) ((STATE[b.id][id] || {}).feats || []).forEach(function (f) { other[f] = 1; }); });
        rec.feats.forEach(function (f) { if (!other[f]) e.sw[f] = false; });
        return NSStore.meta('settings', S);
      });
    }).then(function () {
      return NSStore.meta('packs').then(function (m) { m = m || {}; if (m[b.id]) delete m[b.id][p.id]; STATE = m; return NSStore.meta('packs', m); });
    }).then(function () { document.dispatchEvent(new CustomEvent('ns-data')); NS.toast(T('removed', { n: res.gone, k: res.kept })); A.show(); });
  }

  /* ---------- the menu entry and the boxes on the home screen ---------- */
  function menuLink() {
    var nav = $('.hub-nav'); if (!nav || $('a[data-sec="packs"]', nav)) return;
    var a = NS.el('a', { href: '#packs', 'data-sec': 'packs', 'data-ic': 'pack' }, '<span data-i18n="pk.title">' + NS.esc(NS.t('pk.title')) + '</span>'); nav.appendChild(a);
    $('span', a).textContent = T('menu'); a.title = T('menu');
  }
  function overdueRows() {
    var B = A.B, D = A.mine(), today = NS.today();
    return B.bills(D, A.bizName()).bills.filter(function (x) { return x.side === 'recv' && x.left > 0.004; }).filter(function (x) { return (x.due || B.addDays(x.date, 15)) < today; });
  }
  A.addHome(function () {
    var b = A.biz && A.biz(); if (!b) return '';
    var applied = b.id && STATE[b.id] || {}, boxes = P.boxesFor(applied); if (!boxes.length) return '';
    return boxes.map(function (id) {
      try {
        if (id === 'shortcuts') {
          var ls = P.linksFor(applied); if (!ls.length) return '';
          return '<div class="card"><h3>' + esc(T('b_shortcuts')) + '</h3><div class="quick">' + ls.map(function (l) { return '<a class="btn" href="' + A.toolUrl(l[0]) + '">' + esc(NS.t(l[1])) + '</a>'; }).join('') + '</div></div>';
        }
        var od = overdueRows();
        if (id === 'overdue') {
          var sum = od.reduce(function (a, x) { return a + x.left; }, 0);
          return '<a class="tile' + (od.length ? ' warn' : '') + '" href="#dues"><span>' + esc(T('b_overdue')) + '</span><b>' + NS.money(NS.r2(sum)) + '</b><small>' + esc(T('n_bills', { n: od.length })) + '</small></a>';
        }
        if (id === 'topdue') {
          var by = {}; A.B.bills(A.mine(), A.bizName()).bills.filter(function (x) { return x.side === 'recv' && x.left > 0.004; }).forEach(function (x) { by[x.party] = (by[x.party] || 0) + x.left; });
          var top = Object.keys(by).sort(function (x, y) { return by[y] - by[x]; }).slice(0, 3);
          if (!top.length) return '';
          return '<div class="card"><h3>' + esc(T('b_topdue')) + '</h3><ul class="rows">' + top.map(function (n) { return '<li><a href="#st/' + encodeURIComponent(NSBooks.key(n)) + '"><b>' + esc(n) + '</b></a><b class="amt">' + NS.money(NS.r2(by[n])) + '</b></li>'; }).join('') + '</ul></div>';
        }
      } catch (e) {}
      return '';
    }).join('').replace(/(<a class="tile[^]*?<\/a>)+/g, function (m) { return '<div class="tiles">' + m + '</div>'; });
  });

  /* first-run (firstrun.js) calls this after the setup is saved: shows the preview of the pack that suits the new business; Cancel = not now */
  NS.packOffer = function (kind) {
    var id = P.suggest(kind); if (!id) return;
    curBiz().then(function (b) { if (!b || !b.id) return; return load().then(function () { if (!mineApplied(b)[id]) preview(P.get(id), b); }); });
  };

  function start() {
    menuLink();
    NSStore.ready().then(load).then(function () { if (!location.hash || location.hash === '#') A.show(); });
    document.addEventListener('ns-data', function () { load(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
