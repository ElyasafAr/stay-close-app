'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase - רק אם עדיין לא אותחל
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Export auth instance
export const auth = getAuth(app)

// Export getAuth function for compatibility
export function getAuthInstance(): Auth {
  return auth
}

// Initialize messaging (only in browser)
let messaging: Messaging | null = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error)
  }
}

/**
 * Get FCM token for push notifications
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !messaging) {
    return null
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('⚠️ [FCM] VAPID key not configured')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    return token || null
  } catch (error) {
    console.error('❌ [FCM] Error getting token:', error)
    return null
  }
}

/**
 * Listen for foreground FCM messages
 */
export function onFCMMessage(callback: (payload: any) => void): () => void {
  if (typeof window === 'undefined' || !messaging) {
    return () => {} // Return empty unsubscribe function
  }

  try {
    return onMessage(messaging, callback)
  } catch (error) {
    console.error('❌ [FCM] Error setting up message listener:', error)
    return () => {} // Return empty unsubscribe function
  }
}

export default app

