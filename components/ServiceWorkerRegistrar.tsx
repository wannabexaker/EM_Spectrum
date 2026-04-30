'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations =>
          Promise.all(registrations.map(registration => registration.unregister()))
        )
        .catch(console.error)

      if ('caches' in window) {
        caches
          .keys()
          .then(keys =>
            Promise.all(
              keys
                .filter(key => key.startsWith('em-spectrum-'))
                .map(key => caches.delete(key))
            )
          )
          .catch(console.error)
      }

      return
    }

    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }, [])

  return null
}
