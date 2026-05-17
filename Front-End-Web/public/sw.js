const CACHE_NAME = 'smartpos-v1';
const STATIC_ASSETS = ['/', '/index.html', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  // Prevent caching of any backend API calls or Vite dev server internals
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/auth/') || 
    url.pathname.startsWith('/pos/') ||
    url.pathname.startsWith('/settings') ||
    url.hostname === 'localhost' && url.port === '3000' || // Backend
    url.hostname.includes('railway.app') || 
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('.tsx') ||
    url.pathname.includes('.ts')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
