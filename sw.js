const CACHE = 'ns-app-cea55327b6';
const SHELL = ["/", "/assets/b-slip.9b2b7f6389.css", "/assets/b-core.cd7dc1343c.js", "/assets/b-store.2f35fc74e0.js", "/assets/books.js?v=0aa00b40bd", "/assets/xlsx.js?v=8918149ae7", "/assets/tally.js?v=7e43a1c1d2", "/assets/acct.js?v=9fb0bd38a9", "/assets/cashare.js?v=c7cf4d6b68", "/assets/caui.js?v=b89018e749", "/assets/rpcore.js?v=67de17cdfc"];
const WARM = ["/do/billing/", "/assets/b-base-t.0e8b57f809.css", "/assets/b-store-do.b4f0881111.js", "/do/quotation/", "/assets/b-store-do.4e58e45446.js", "/do/proforma/", "/do/sales-order/", "/do/challan/", "/assets/b-store-do.bbd3af66a0.js", "/do/purchase-order/", "/do/self-invoice/", "/do/credit-note/", "/do/debit-note/", "/do/receipt/", "/assets/b-store-do.a43c53c4ef.js", "/do/voucher/", "/do/cash-memo/", "/do/rent-receipt/", "/do/salary-slip/", "/do/petty-cash/", "/do/my/", "/assets/b-acx.b869e7d399.css", "/assets/b-store-do.9dee2af344.js"], LGROUPS = ["store-do.1ff7c8435c", "store-do.5fe1a19359", "store-do.6399ad0e53", "store-do.78da139a09", "store-do.856291a6a5"];
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
