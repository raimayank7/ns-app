/* A party's own prices in My data (my.niveshsahayak.in), through NS.hubExt (my.js): plat-capture.
     party form   "Special prices": one line per item ("Cement OPC 53 = 380"). Saved as party.prices = [{ item, rate }].
                  The document makers and the App's purchase bill form use a party's rate first when the item is picked for that party
                  (customer: the rate on the sale; supplier: the rate on the purchase bill), before the item's own rates.
                  "Fill from the last bills" adds the rate each item had on that party's newest bills; lines already there are kept.
   Nothing is changed on bills already made. */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t, R = window.NSReuse;
  function form(s, r) {
    if (s !== 'party' || !R) return '';
    return '<fieldset class="card b2-sec"><legend>' + esc(t('cap.prices_t')) + '</legend><div class="fg">' +
      '<div class="f wide"><label for="pr-text">' + esc(t('cap.prices_l')) + '</label><textarea id="pr-text" name="pricestext" rows="5" dir="auto" autocomplete="off" placeholder="' + esc(t('cap.prices_ph')) + '">' + esc(R.pricesText(r.prices)) + '</textarea>' +
      '<small class="hint">' + esc(t('cap.prices_h')) + '</small></div>' +
      '<div class="f wide"><button type="button" class="btn sm" data-fillprices>' + esc(t('cap.prices_fill')) + '</button></div></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'party' || !f.elements.pricestext) return;
    var list = R.parsePrices(f.elements.pricestext.value);
    if (list.length) r.prices = list; else delete r.prices;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fillprices]'); if (!b || !R) return;
    var f = b.closest('form'), ta = f && f.elements.pricestext, nm = f && f.elements.name && f.elements.name.value.trim();
    if (!ta) return;
    if (!nm) { NS.toast(t('cap.prices_name'), 'bad'); return; }
    var side = f.elements.role && f.elements.role.value === 'supplier' ? 'buy' : 'sale';
    NSStore.list('doc').then(function (docs) {
      var have = R.parsePrices(ta.value), seen = {};
      have.forEach(function (x) { seen[R.key(x.item)] = 1; });
      var add = R.lastRates(docs, '', nm, side).filter(function (x) { return !seen[R.key(x.item)]; });
      if (!add.length && !have.length) { NS.toast(t('cap.prices_none'), 'bad'); return; }
      ta.value = R.pricesText(have.concat(add.map(function (x) { return { item: x.item, rate: x.rate }; })));
      NS.toast(t('cap.prices_filled', { n: add.length }));
    }).catch(function () { NS.toast(t('cap.prices_none'), 'bad'); });
  });
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();
