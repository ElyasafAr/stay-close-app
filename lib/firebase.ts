'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth as firebaseGetAuth, Auth } from 'firebase/auth'
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// בדיקה אם יש קונפיגורציה תקינה
function isFirebaseConfigValid(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.projectId !== 'undefined'
  )
}

// Initialize Firebase - רק ב-Client Side ורק אם עדיין לא אותחל
let app: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseApp(): FirebaseApp | null {
  // אל תאתחל Firebase בזמן SSG/Build
  if (typeof window === 'undefined') {
    return null
  }
  
  // בדיקה אם יש קונפיגורציה תקינה
  if (!isFirebaseConfigValid()) {
    console.warn('⚠️ [Firebase] Config not valid, skipping initialization')
    return null
  }
  
  if (app) {
    return app
  }
  
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  } catch (error) {
    console.error('❌ [Firebase] Error initializing app:', error)
    return null
  }
  
  return app
}

function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) {
    return null
  }
  
  if (!auth) {
    auth = firebaseGetAuth(firebaseApp)
  }
  
  return auth
}

// Export auth instance (lazy initialization)
export { getFirebaseAuth as getAuth }
export default getFirebaseApp

// Firebase Messaging - רק בדפדפן
let messaging: Messaging | null = null
let swRegistration: ServiceWorkerRegistration | null = null

/**
 * רושם את ה-Service Worker עם הקונפיגורציה של Firebase
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    // קודם נזריק את הקונפיגורציה ל-window כדי שה-SW יוכל לקרוא אותה
    // זה עובד כי Firebase SDK מעביר את הקונפיגורציה ל-SW
    
    // רישום ה-Firebase messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    })
    
    console.log('✅ [Firebase] Service Worker registered:', registration.scope)
    swRegistration = registration
    
    // חכה שה-SW יהיה מוכן
    await navigator.serviceWorker.ready
    console.log('✅ [Firebase] Service Worker ready')
    
    return registration
  } catch (error) {
    console.error('❌ [Firebase] Service Worker registration failed:', error)
    return null
  }
}

/**
 * מקבל את Firebase Messaging instance
 * בודק תמיכה לפני יצירה
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (messaging) {
    return messaging
  }
  
  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('⚠️ [Firebase] Messaging not supported in this browser')
      return null
    }
    
    // רישום Service Worker קודם
    const registration = await registerServiceWorker()
    
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      console.warn('⚠️ [Firebase] App not initialized')
      return null
    }
    
    messaging = getMessaging(firebaseApp)
    console.log('✅ [Firebase] Messaging initialized')
    
    return messaging
  } catch (error) {
    console.error('❌ [Firebase] Error initializing messaging:', error)
    return null
  }
}

/**
 * מקבל FCM token לשליחת Push Notifications
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const messagingInstance = await getFirebaseMessaging()
    if (!messagingInstance) {
      console.warn('⚠️ [Firebase] Messaging not available')
      return null
    }
    
    // בדיקת הרשאות
    const permission = await Notification.requestPermission()
    console.log('🔍 [Firebase] Notification permission:', permission)
    
    if (permission !== 'granted') {
      console.warn('⚠️ [Firebase] Notification permission denied')
      return null
    }
    
    // קבלת SW registration
    const registration = swRegistration || await navigator.serviceWorker.ready
    
    // קבלת ה-token
    // Firebase Messaging משתמש ב-VAPID key פנימי אוטומטית
    const token = await getToken(messagingInstance, {
      serviceWorkerRegistration: registration
    })
    
    if (token) {
      console.log('✅ [Firebase] FCM token received:', token.substring(0, 30) + '...')
      console.log('   Token length:', token.length)
      return token
    } else {
      console.warn('⚠️ [Firebase] No FCM token available')
      return null
    }
  } catch (error) {
    console.error('❌ [Firebase] Error getting FCM token:', error)
    // הדפסת פרטי השגיאה
    if (error instanceof Error) {
      console.error('   Error message:', error.message)
      console.error('   Error stack:', error.stack)
    }
    return null
  }
}

/**
 * מאזין להודעות נכנסות (כשהאפליקציה פתוחה)
 */
export function onFCMMessage(callback: (payload: any) => void): () => void {
  let unsubscribe: () => void = () => {}
  
  getFirebaseMessaging().then((messagingInstance) => {
    if (messagingInstance) {
      unsubscribe = onMessage(messagingInstance, (payload) => {
        console.log('📩 [Firebase] Message received:', payload)
        callback(payload)
      })
    }
  })
  
  return () => unsubscribe()
}

// Export Firebase config for service worker
export { firebaseConfig }
