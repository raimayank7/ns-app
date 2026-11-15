/* NSCafe: the pure logic of the tap-to-add menu grid of restaurant.niveshsahayak.in ("cafe mode").
   A menu dish is an ordinary item master of the shared data home (store 'item') with menu:1 and an optional cat (category):
     { desc, price, rate, cat, menu:1, hsn:'9963', unit:'Plate', kind:'service', biz? }
   so My data, the App and other sites see the same items; nothing else is stored. The order is the bill's own items list
   (rows { desc, qty, price, rate, kot, ... }); tapping a tile adds to it and the existing bill code does the rest.
   Tests: node scripts/test_cafe.js */
(function (G) {
  'use strict';
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : 0; }
  function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function priceOf(m) { var p = m.price != null && m.price !== '' ? m.price : m.rate; return n(p); }

  /* the dishes of the menu: items marked menu:1 with a name, visible to this business (biz filter is done by the caller) */
  function menuOf(items) {
    return (items || []).filter(function (x) { return x && x.menu && String(x.desc || '').trim(); })
      .sort(function (a, b) { return (!String(a.cat || '').trim() - !String(b.cat || '').trim()) || key(a.cat).localeCompare(key(b.cat)) || key(a.desc).localeCompare(key(b.desc), 'en', { numeric: true }); });
  }
  /* category names in alphabetical order, dishes without a category (empty name) last */
  function cats(menu) {
    var seen = {}, out = [];
    (menu || []).forEach(function (m) { var c = String(m.cat || '').trim(), k = key(c); if (!seen[k]) { seen[k] = 1; out.push(c); } });
    return out.sort(function (a, b) { return (a === '') - (b === '') || key(a).localeCompare(key(b)); });
  }
  /* cat: undefined/null = every category, '' = dishes without a category; q: every typed word must be in the name or category */
  function filter(menu, cat, q) {
    var words = key(q).split(' ').filter(Boolean), ck = cat == null ? null : key(cat);
    return (menu || []).filter(function (m) {
      if (ck !== null && key(m.cat) !== ck) return false;
      var hay = key(m.desc) + ' ' + key(m.cat);
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
  }
  /* a menu record from what was typed; null when the name or price is missing / not a positive number */
  function clean(x) {
    var desc = String((x && x.desc) || '').trim().replace(/\s+/g, ' '), p = n(x && x.price);
    if (!desc || !(p > 0) || desc.length > 60) return null;
    return { desc: desc, price: String(r2(p)), cat: String((x && x.cat) || '').trim().slice(0, 30) };
  }
  function isBlank(row) { return !String(row.desc || '').trim() && !n(row.price) && !n(row.rate); }
  /* quantity of a dish on the bill (every line of that name) */
  function qtyOf(rows, desc) {
    var k = key(desc);
    return (rows || []).reduce(function (a, r) { return key(r.desc) === k ? a + n(r.qty) : a; }, 0);
  }
  /* tap: one more of the dish. Joins the last line of the same name and price that is not yet on a KOT (so the kitchen ticket
     carries only the new quantity); otherwise a new line. A lone empty line is replaced. mk() makes an empty bill line. */
  function tap(rows, m, mk) {
    var k = key(m.desc), p = String(priceOf(m)), i;
    for (i = rows.length - 1; i >= 0; i--) { if (key(rows[i].desc) === k && !rows[i].kot && String(n(rows[i].price)) === p) { rows[i].qty = String(r2(n(rows[i].qty) + 1)); return rows; } }
    var row = mk(); row.desc = String(m.desc).trim(); row.price = p; row.qty = '1'; row.note = '';
    var blank = rows.filter(isBlank);
    if (blank.length && rows.length === blank.length) { rows.length = 0; }
    else { for (i = rows.length - 1; i >= 0; i--) if (isBlank(rows[i])) rows.splice(i, 1); }
    rows.push(row); return rows;
  }
  /* minus: one less of the dish, from the newest line not yet sent to the kitchen. Returns false when everything of it is already
     on a KOT (the kitchen has cooked it: it cannot be taken back here) or it is not on the bill. Keeps one empty line. */
  function minus(rows, desc, mk) {
    var k = key(desc), i;
    for (i = rows.length - 1; i >= 0; i--) {
      if (key(rows[i].desc) === k && !rows[i].kot && n(rows[i].qty) > 0) {
        var q = r2(n(rows[i].qty) - 1);
        if (q > 0) rows[i].qty = String(q); else rows.splice(i, 1);
        if (!rows.length) rows.push(mk());
        return true;
      }
    }
    return false;
  }
  /* saved items that could join the menu: not on it yet, with a name and a price */
  function importable(items) {
    var seen = {};
    return (items || []).filter(function (x) {
      if (!x || x.menu || !String(x.desc || '').trim() || !(priceOf(x) > 0)) return false;
      var k = key(x.desc); if (seen[k]) return false; seen[k] = 1; return true;
    });
  }
  /* the menu record to save for a typed dish: an existing item of that name is reused (so it never doubles) */
  function toRecord(c, items, editId) {
    var k = key(c.desc), hit = (items || []).filter(function (x) { return editId ? x.id === editId : key(x.desc) === k; })[0] || {};
    return Object.assign({}, hit, { desc: c.desc, price: c.price, rate: c.price, cat: c.cat, menu: 1, hsn: hit.hsn || '9963', unit: hit.unit || 'Plate', kind: hit.kind || 'service', gst: hit.gst != null ? hit.gst : '' });
  }
  /* another menu dish already has this name (not the one being edited) */
  function clash(menu, c, editId) {
    var k = key(c.desc); return (menu || []).some(function (m) { return key(m.desc) === k && m.id !== editId; });
  }

  var API = { key: key, menuOf: menuOf, cats: cats, filter: filter, clean: clean, qtyOf: qtyOf, tap: tap, minus: minus, importable: importable, toRecord: toRecord, clash: clash, priceOf: priceOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSCafe = API;
})(this);
