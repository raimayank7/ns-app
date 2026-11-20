const CACHE = 'ns-app-8e852e10ee';
const SHELL = ["/", "/assets/b-acx.9223fe424a.css", "/assets/b-core.c6904b4278.js", "/assets/b-store.4392ce53e4.js", "/assets/books.js?v=1d9ccc14cd", "/assets/xlsx.js?v=9c9abd01b6", "/assets/tally.js?v=8dc4a331c0", "/assets/acct.js?v=9fb0bd38a9", "/assets/cashare.js?v=c7cf4d6b68", "/assets/caui.js?v=b89018e749"];
const WARM = ["/do/billing/", "/assets/b-base-t.cde511b168.css", "/assets/b-store-do.0dcd14f5de.js", "/do/quotation/", "/assets/b-store-do.426c37a8e2.js", "/do/proforma/", "/do/sales-order/", "/do/challan/", "/do/purchase-order/", "/do/self-invoice/", "/do/credit-note/", "/do/debit-note/", "/do/receipt/", "/assets/b-store-do.f6bab7e1be.js", "/do/voucher/", "/do/cash-memo/", "/assets/b-store-do.f409216958.js", "/do/rent-receipt/", "/do/salary-slip/", "/do/petty-cash/", "/do/my/", "/assets/b-acx.4a7e5d9d44.css", "/assets/b-store-do.76772d34ae.js"], LGROUPS = ["store-do.124eb4609e", "store-do.a4585906f1", "store-do.aca4b1fbb3", "store-do.ae175e216f", "store-do.d50fbbbb21"];
const slow = () => { const c = self.navigator && navigator.connection; return !!c && (c.saveData || /2g/.test(c.effectiveType || '')); };
const keep = (c, list) => Promise.allSettled(list.map(u => c.match(u).then(m => m || c.add(u))));
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => slow() ? 0 : keep(c, WARM))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith('ns-') && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
const langDone = {};
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|assets\.niveshsahayak\.in/.test(u.host))
      e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })));
    return;
  }
  if (r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/')) {
    const key = u.origin + u.pathname, net = fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(key, c)); } return res; });
    e.respondWith(caches.match(key).then(saved => {
      if (!saved) return net.catch(() => u.pathname.startsWith('/do/') ? Response.error() : caches.match('/'));
      return Promise.race([net.catch(() => saved), new Promise(ok => setTimeout(() => ok(saved), 2500))]);
    }));
    e.waitUntil(net.then(() => 0, () => 0));
    return;
  }
  const lm = LGROUPS.length && /^\/assets\/lang\/([a-z]+)\.[^/]+\.js$/.exec(u.pathname);
  if (lm && !langDone[lm[1]] && !slow()) { langDone[lm[1]] = 1; e.waitUntil(caches.open(CACHE).then(c => keep(c, LGROUPS.map(g => '/assets/lang/' + lm[1] + '.' + g + '.js')))); }
  e.respondWith(caches.match(r, { ignoreSearch: false }).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});
