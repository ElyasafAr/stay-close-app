// Service Worker - מקבל Push Notifications ומציג התראות
// רץ גם כשהדפדפן פתוח אבל הדף סגור

const CACHE_NAME = 'stay-close-v1'

// התקנה
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...')
  self.skipWaiting() // הפעל מיד
})

// הפעלה
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim() // קח שליטה על כל ה-clients
})

// קבלת Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)
  
  let data = {
    title: 'זמן לשלוח הודעה! 💌',
    body: 'הגיע הזמן לשלוח הודעה',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'reminder',
    data: {}
  }
  
  // אם יש נתונים ב-Push
  if (event.data) {
    try {
      const pushData = event.data.json()
      data = {
        title: pushData.title || data.title,
        body: pushData.body || data.body,
        icon: pushData.icon || data.icon,
        badge: pushData.badge || data.badge,
        tag: pushData.tag || data.tag,
        data: pushData.data || data.data
      }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // רטט בטלפון
    actions: [
      {
        action: 'open',
        title: 'פתח'
      },
      {
        action: 'close',
        title: 'סגור'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// לחיצה על התראה
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  // פתח את האפליקציה
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // אם יש חלון פתוח, פתח אותו
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      // אם אין חלון פתוח, פתח חדש
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Background Sync (אם צריך)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  if (event.tag === 'sync-reminders') {
    event.waitUntil(
      // סנכרן התראות
      fetch('/api/reminders/check')
        .then(response => response.json())
        .then(data => {
          console.log('[SW] Synced reminders:', data)
        })
        .catch(error => {
          console.error('[SW] Sync error:', error)
        })
    )
  }
})

// Message handler (לקבלת הודעות מה-App)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

