const CACHE = 'ns-app-34b920c7ea';
const SHELL = ["/", "/assets/b-acx.7f8c7fc5d3.css", "/assets/b-core.0710f85622.js", "/assets/b-heads.b8e89f6bd7.js", "/assets/books.js?v=c516f9b03f", "/assets/xlsx.js?v=9c9abd01b6", "/assets/tally.js?v=6e069ff2cf", "/assets/acct.js?v=d16cff575f"];
const WARM = ["/do/billing/", "/assets/b-base-t.282412f184.css", "/assets/b-heads-do.5dcbce008c.js", "/do/quotation/", "/assets/b-heads-do.cdff3de53e.js", "/do/proforma/", "/do/sales-order/", "/do/challan/", "/do/purchase-order/", "/do/self-invoice/", "/do/credit-note/", "/do/debit-note/", "/do/receipt/", "/assets/b-heads-do.1e14c044fb.js", "/do/voucher/", "/do/cash-memo/", "/assets/b-heads-do.37cac3e90f.js", "/do/rent-receipt/", "/do/salary-slip/", "/do/petty-cash/", "/do/my/", "/assets/b-acx.381cd1158a.css", "/assets/b-heads-do.8734bec150.js"], LGROUPS = ["heads-do.0fe94f26c4", "heads-do.1098e07755", "heads-do.386eca22eb", "heads-do.7dc9cecd56", "heads-do.a3b1c46d5e"];
const slow = () => { const c = self.navigator && navigator.connection; return !!c && (c.saveData || /2g/.test(c.effectiveType || '')); };
const keep = (c, list) => Promise.allSettled(list.map(u => c.match(u).then(m => m || c.add(u))));
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => slow() ? 0 : keep(c, WARM))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith('ns-') && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
const langDone = {};
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|assets\.niveshsahayak\.in/.test(u.host))
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
