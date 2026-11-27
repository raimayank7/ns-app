/* My data › Settings: "Look and feel" (colour pack, light / dark, spacing, text size) and "Print designs" (opens the App's screen).
   The picker itself is NSTheme.panel (engine/themes.js); the choice is kept with the other screen choices and follows the person
   to their other devices through the data home (meta prefs). English only (App screens). */
(function () {
  'use strict';
  var NS = window.NS; if (!NS) return;
  var $ = NS.$;
  function appHref() {
    var h = location.hostname, framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
    return (framed || /^app\./.test(h)) ? '/#pd' : 'https://app.niveshsahayak.in/#pd';
  }
  function settings() {
    return '<form class="set th-set" data-thset onsubmit="return false"><fieldset class="card"><legend>Look and feel</legend>' +
      '<p class="hint">Pick the colours, spacing and text size that suit you. It changes at once on every NSBiz screen on this device and follows you to your other devices.</p>' +
      '<div data-thpanel></div></fieldset></form>' +
      '<form class="set th-set" data-pdset onsubmit="return false"><fieldset class="card"><legend>Print designs</legend>' +
      '<p class="hint">Choose how your bills and documents look on paper: the design, the paper size and the colour, for each kind of document, with a preview made from your own business details.</p>' +
      '<p><a class="btn primary" href="' + appHref() + '" target="_top">Choose print designs</a></p></fieldset></form>';
  }
  function wireSettings(pane) {
    var box = $('[data-thpanel]', pane); if (box && NS.theme) NS.theme.panel(box);
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();
