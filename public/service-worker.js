/**
 * LiveX Professional PWA Service Worker
 * @license Apache-2.0
 */

const CACHE_NAME = 'livex-static-v2';
const IMAGE_CACHE_NAME = 'livex-images-v1';

// Static landing and interface shell files to cache instantly
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-any.svg',
  '/icon-maskable.svg'
];

// Install Event: pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline SPA app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches and claim control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache storage:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception: cache-first for static assets, network-first with offline fallbacks for remainder
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Firebase, Firestore, WebRTC, WebSocket, and Live streams entirely
  if (
    url.hostname.includes('firebase') || 
    url.hostname.includes('firestore') || 
    url.pathname.includes('/api/') || 
    url.pathname.includes('socket.io') ||
    event.request.method !== 'GET'
  ) {
    return; // Let browser process natively
  }

  // 2. Specialized Cache-First logic for Images (Avatars, presents, static photos)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i) || 
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('lh3.googleusercontent.com')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached and refresh in the background for eventual consistency
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Fetch and cache matching image assets
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return static SVG icon fallback if offline and graphic request misses
            return caches.match('/icon-any.svg');
          });
        });
      })
    );
    return;
  }

  // 3. General SPA routing & build scripts strategy (Network-First, with cache fallback for absolute resilience)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache success responses
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Fetch failed, falling back to cache if available:', err);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If everything fails and requesting document navigation, return root app shell html
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Real-Time Notification triggers from system push events (optional background handling)
self.addEventListener('push', (event) => {
  let data = { title: 'LiveX', body: 'Nova transmissão ao vivo iniciada!', icon: '/icon-any.svg' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: 'LiveX', body: event.data ? event.data.text() : 'Notificação importante!', icon: '/icon-any.svg' };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-any.svg',
    badge: '/icon-any.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Open application on Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find matches already focused active tabs
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If none, open a fresh window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
