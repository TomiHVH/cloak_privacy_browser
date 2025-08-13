import { FONT_STACK } from './config.js';

export class ServiceWorkerManager {
  constructor() {
    this.isRegistered = false;
    this.registration = null;
    this.cacheName = 'minimal-browser-v1';
    this.offlineCacheName = 'minimal-browser-offline-v1';
    this.backgroundSyncName = 'minimal-browser-sync';
    this.cacheStrategies = {
      networkFirst: 'network-first',
      cacheFirst: 'cache-first',
      staleWhileRevalidate: 'stale-while-revalidate',
      networkOnly: 'network-only',
      cacheOnly: 'cache-only'
    };
    this.defaultStrategy = this.cacheStrategies.networkFirst;
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.isRegistered = true;
      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.showUpdateNotification();
          }
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async createServiceWorkerScript() {
    const swScript = `
      // Service Worker for Minimal Browser
      const CACHE_NAME = '${this.cacheName}';
      const OFFLINE_CACHE = '${this.offlineCacheName}';
      const SYNC_NAME = '${this.backgroundSyncName}';
      
      // Install event - cache essential resources
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
              '/',
              '/index.html',
              '/offline.html',
              '/css/styles.css',
              '/js/main.js'
            ]);
          })
        );
        self.skipWaiting();
      });

      // Activate event - clean up old caches
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
        self.clients.claim();
      });

      // Fetch event - implement caching strategies
      self.addEventListener('fetch', (event) => {
        const url = new URL(event.request.url);
        
        // Skip non-GET requests
        if (event.request.method !== 'GET') {
          return;
        }

        // Handle different resource types with appropriate strategies
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          event.respondWith(this.networkFirstStrategy(event.request));
        } else if (url.pathname.match(/\\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
          event.respondWith(this.cacheFirstStrategy(event.request));
        } else if (url.pathname.match(/\\.(json|xml)$/)) {
          event.respondWith(this.staleWhileRevalidateStrategy(event.request));
        } else {
          event.respondWith(this.networkFirstStrategy(event.request));
        }
      });

      // Background sync for offline actions
      self.addEventListener('sync', (event) => {
        if (event.tag === SYNC_NAME) {
          event.waitUntil(this.handleBackgroundSync());
        }
      });

      // Push notifications
      self.addEventListener('push', (event) => {
        const options = {
          body: event.data ? event.data.text() : 'New notification',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          }
        };

        event.waitUntil(
          self.registration.showNotification('Minimal Browser', options)
        );
      });

      // Notification click
      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        event.waitUntil(
          clients.openWindow('/')
        );
      });

      // Caching strategies
      async function networkFirstStrategy(request) {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          throw error;
        }
      }

      async function cacheFirstStrategy(request) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          throw error;
        }
      }

      async function staleWhileRevalidateStrategy(request) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      }

      async function handleBackgroundSync() {
        // Handle offline actions like form submissions
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'background-sync-complete',
            timestamp: Date.now()
          });
        });
      }

      // Message handling
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'skipWaiting') {
          self.skipWaiting();
        }
      });
    `;

    return swScript;
  }

  async createOfflinePage() {
    const offlineHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Minimal Browser</title>
        <style>
          body {
            font-family: ${FONT_STACK};
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .offline-container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            font-weight: 300;
          }
          p {
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.9;
          }
          .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: ${FONT_STACK};
          }
          .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
          }
          .status {
            margin-top: 20px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <h1>🌐 You're Offline</h1>
          <p>It looks like you've lost your internet connection. Don't worry, some features are still available offline.</p>
          <button class="retry-btn" onclick="retryConnection()">Retry Connection</button>
          <div class="status" id="status">Checking connection...</div>
        </div>
        
        <script>
          function retryConnection() {
            const status = document.getElementById('status');
            status.textContent = 'Checking connection...';
            
            fetch('/')
              .then(() => {
                status.textContent = 'Connection restored! Redirecting...';
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              })
              .catch(() => {
                status.textContent = 'Still offline. Please check your connection.';
              });
          }
          
          // Check connection status periodically
          setInterval(() => {
            if (navigator.onLine) {
              window.location.reload();
            }
          }, 5000);
        </script>
      </body>
      </html>
    `;

    return offlineHTML;
  }

  async registerBackgroundSync(tag = 'minimal-browser-sync') {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background Sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }

  async sendNotification(title, options = {}) {
    if (!this.isRegistered || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });

      return true;
    } catch (error) {
      console.error('Notification failed:', error);
      return false;
    }
  }

  async getCacheInfo() {
    if (!this.isRegistered) {
      return null;
    }

    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      const cacheSize = await this.calculateCacheSize(keys);
      
      return {
        name: this.cacheName,
        size: cacheSize,
        entries: keys.length,
        urls: keys.map(request => request.url)
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return null;
    }
  }

  async clearCache() {
    if (!this.isRegistered) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  async calculateCacheSize(requests) {
    let totalSize = 0;
    
    for (const request of requests) {
      try {
        const response = await caches.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      } catch (error) {
        // Skip failed requests
      }
    }
    
    return this.formatBytes(totalSize);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'background-sync-complete':
        console.log('Background sync completed:', data);
        break;
      case 'cache-updated':
        console.log('Cache updated:', data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  showUpdateNotification() {
    // Show update notification to user
    if (this.sendNotification) {
      this.sendNotification('Update Available', {
        body: 'A new version of Minimal Browser is available. Refresh to update.',
        requireInteraction: true
      });
    }
  }

  async updateServiceWorker() {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Service worker update failed:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isRegistered: this.isRegistered,
      isSupported: 'serviceWorker' in navigator,
      hasBackgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
      hasNotifications: 'Notification' in window,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
    };
  }

  dispose() {
    if (this.registration) {
      this.registration.unregister();
    }
    this.isRegistered = false;
    this.registration = null;
  }
}
