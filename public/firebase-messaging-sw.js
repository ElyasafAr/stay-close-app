// Firebase Messaging Service Worker
// נוצר אוטומטית על ידי scripts/generate-firebase-sw.js
// אל תערוך קובץ זה ישירות!

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Firebase Configuration - נוצר אוטומטית מ-environment variables
const firebaseConfig = {
  apiKey: "AIzaSyAQHHAcNK6phJYBpS26WkX0y3gyvt5dVOc",
  authDomain: "stay-close-app.firebaseapp.com",
  projectId: "stay-close-app",
  storageBucket: "stay-close-app.firebasestorage.app",
  messagingSenderId: "86289869108",
  appId: "1:86289869108:android:9ed5ee1e60f646cdeedd61"
}

// Log config status
console.log('[FCM-SW] Firebase config loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('MISSING'),
  hasSenderId: !!firebaseConfig.messagingSenderId && !firebaseConfig.messagingSenderId.includes('MISSING')
})

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig)
  console.log('[FCM-SW] ✅ Firebase initialized')
} catch (error) {
  console.error('[FCM-SW] ❌ Error initializing Firebase:', error)
}

// Initialize Firebase Messaging
let messaging = null
try {
  messaging = firebase.messaging()
  console.log('[FCM-SW] ✅ Firebase Messaging initialized')
} catch (error) {
  console.error('[FCM-SW] ❌ Error initializing Messaging:', error)
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] 📩 Background message received:', payload)
    
    // Extract notification data
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Stay Close 💌'
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'יש לך הודעה חדשה',
      icon: payload.notification?.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: payload.data?.tag || 'fcm-notification',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'פתח' },
        { action: 'close', title: 'סגור' }
      ]
    }

    console.log('[FCM-SW] 📢 Showing notification:', notificationTitle)
    return self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] 🖱️ Notification clicked:', event.action || 'default')
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Service Worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[FCM-SW] 📦 Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] ✅ Activated')
  event.waitUntil(clients.claim())
})

console.log('[FCM-SW] 🚀 Service Worker ready')
