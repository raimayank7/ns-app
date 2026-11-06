const CACHE = 'ns-app-21d8eb2957';
const SHELL = ["/", "/assets/base.css?v=b5fb54a4c3", "/assets/doc.css?v=385ab57a21", "/assets/i18n.js?v=bec1343f51", "/assets/store.js?v=822e5db118", "/assets/core.js?v=d916a908a9", "/assets/safe.js?v=69ce2e3766", "/assets/help.js?v=ddaed68b26", "/assets/gstfetch.js?v=77942f1a8e", "/assets/books.js?v=b80078c8e4", "/assets/extras.js?v=6479f34b4b", "/assets/mfgcore.js?v=a119f38a2a", "/assets/stockcore.js?v=7972a281d3", "/assets/app.js?v=b14041d468", "/assets/ledger.js?v=9c298cce7a", "/assets/money.js?v=88b091d33c", "/assets/sample.js?v=58a090e4bc", "/assets/quick.js?v=1912bc8f3a", "/assets/appx.js?v=7412eab119", "/assets/plcore.js?v=73b5274ac4", "/assets/facore.js?v=a446bcaa0f", "/assets/acctcore.js?v=cebec7487d", "/assets/more.js?v=7131685fc6", "/assets/mfg.js?v=71a4316d88", "/assets/finrep.js?v=31391187f8", "/assets/tfcore.js?v=ec83f4f4c6", "/assets/tfview.js?v=bb4f16db10", "/assets/tformat.js?v=6fe1836ac8", "/assets/tf.css?v=e341f62cb7", "/assets/famore.js?v=fce4d61989", "/assets/firstrun.js?v=094619e248", "/assets/app.css?v=6bdfda674f", "/assets/mfg.css?v=6bd8c14511", "/assets/firstrun.css?v=0982ea2db8", "/assets/safe.css?v=f3b3edd6eb", "/assets/desk.js?v=71ecdfa62c", "/assets/desk.css?v=2253af2872", "/assets/contact.js?v=b289faf522", "/assets/xlsx.js?v=9c9abd01b6", "/assets/tally.js?v=bb798e5007", "/assets/acct.js?v=5ab3ff2906", "/assets/inapp.js?v=77af278b54", "/assets/docs.js?v=a0c332265d", "/assets/docmore.js?v=9de01ddeb6", "/assets/einv.js?v=e7e8f96589", "/assets/stockwarn.js?v=b4a88f0bc8", "/assets/kit.js?v=e5cf8845b5", "/assets/bilty.js?v=e66d84544c", "/assets/kit.css?v=22e2f97260", "/assets/rabill.js?v=3720af1bbe", "/assets/bulk.js?v=b31a72bb21", "/assets/export.js?v=93f6432d81", "/assets/fee.js?v=ead418c323", "/assets/jobcard.js?v=135a2fd7d5", "/assets/my.js?v=04eb8d7431", "/assets/hubmore.js?v=70cda597b3", "/assets/hubtf.js?v=45887cdaf2", "/assets/mfghub.js?v=0bf4fbda59", "/assets/fahub.js?v=6ed32d242a", "/assets/xlimport.js?v=360a3fef4a", "/assets/slip.js?v=32606e25d7", "/assets/pharmacy.js?v=6ecd4bf019", "/assets/pos.js?v=fc32ddd41d", "/assets/resto.js?v=c2cedc720a"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith('ns-') && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|assets\.niveshsahayak\.in/.test(u.host))
      e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })));
    return;
  }
  if (r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/')) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('/'))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: false }).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});
