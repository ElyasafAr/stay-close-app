// Firebase Messaging Service Worker
// נדרש לקבלת Push Notifications ב-background דרך FCM

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// =============================================================
// הגדרות Firebase - Stay Close App
// הערכים האלה צריכים להתאים ל-.env.local / Vercel Environment
// =============================================================
const firebaseConfig = {
  // ========== עדכן את הערכים האלה מ-Firebase Console ==========
  // Firebase Console -> Project Settings -> General -> Your apps -> Config
  apiKey: "YOUR_API_KEY_HERE",               // <-- יש לעדכן!
  authDomain: "stay-close-f8d89.firebaseapp.com",
  projectId: "stay-close-f8d89",
  storageBucket: "stay-close-f8d89.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID_HERE",   // <-- יש לעדכן!
  appId: "YOUR_APP_ID_HERE"                   // <-- יש לעדכן!
  // ===========================================================
}

// Log config status
console.log('[FCM-SW] Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YOUR_'),
  hasSenderId: !!firebaseConfig.messagingSenderId && !firebaseConfig.messagingSenderId.includes('YOUR_')
})

// בדיקה אם הקונפיגורציה תקינה
const isConfigValid = firebaseConfig.apiKey && 
                      !firebaseConfig.apiKey.includes('YOUR_') &&
                      firebaseConfig.messagingSenderId &&
                      !firebaseConfig.messagingSenderId.includes('YOUR_')

if (!isConfigValid) {
  console.error('[FCM-SW] ⚠️ Firebase config incomplete!')
  console.error('[FCM-SW] Please update firebase-messaging-sw.js with values from:')
  console.error('[FCM-SW] Firebase Console -> Project Settings -> General -> Your apps')
}

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
