const CACHE = 'ns-app-d8e4d93d96';
const SHELL = ["/", "/assets/b-acx.c475c20cfc.css", "/assets/b-core.1ce2aac80c.js", "/assets/b-store.1dcbbf2004.js", "/assets/books.js?v=17ed0cb363", "/assets/xlsx.js?v=9c9abd01b6", "/assets/tally.js?v=b534e97993", "/assets/acct.js?v=96acc5fdcf", "/assets/cashare.js?v=bb7d6750a9", "/assets/caui.js?v=b89018e749"];
const WARM = ["/do/billing/", "/assets/b-base-t.0874a450f7.css", "/assets/b-store-do.0fb064b86e.js", "/do/quotation/", "/assets/b-store-do.bde72a1c3e.js", "/do/proforma/", "/do/sales-order/", "/do/challan/", "/do/purchase-order/", "/do/self-invoice/", "/do/credit-note/", "/do/debit-note/", "/do/receipt/", "/assets/b-store-do.f1186ecdac.js", "/do/voucher/", "/do/cash-memo/", "/assets/b-store-do.80df726949.js", "/do/rent-receipt/", "/do/salary-slip/", "/do/petty-cash/", "/do/my/", "/assets/b-acx.facc3fcb44.css", "/assets/b-store-do.14801e901f.js"], LGROUPS = ["store-do.38c5174e48", "store-do.4b175a992e", "store-do.6930b8c612", "store-do.a66d154327", "store-do.a7704923fc"];
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
