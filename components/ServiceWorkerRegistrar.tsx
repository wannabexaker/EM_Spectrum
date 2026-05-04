'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    // Force-remove stale service workers/caches.
    // This project currently prioritizes reliability over offline caching.
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations =>
        Promise.all(registrations.map(registration => registration.unregister()))
      )
      .catch(console.error)

    if ('caches' in window) {
      caches
        .keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
        .catch(console.error)
    }
  }, [])

  return null
}
