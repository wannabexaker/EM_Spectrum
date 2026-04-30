const CACHE_NAME = 'em-spectrum-v2'
const IS_LOCALHOST = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname)

if (IS_LOCALHOST) {
  self.addEventListener('install', () => {
    self.skipWaiting()
  })

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    )
  })

  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request))
  })
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(['/', '/spectrum/'])
      })
    )
    self.skipWaiting()
  })

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      )
    )
    self.clients.claim()
  })

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
      return
    }

    const url = new URL(event.request.url)

    if (url.origin !== self.location.origin) {
      return
    }

    // Cache-first for static assets
    if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.json')) {
      event.respondWith(
        caches.match(event.request).then(cached => {
          if (cached) return cached
          return fetch(event.request).then(response => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
            }
            return response
          })
        })
      )
      return
    }

    // Network-first for HTML routes
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
  })
}
