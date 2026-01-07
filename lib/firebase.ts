'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

/**
 * Firebase Configuration
 *
 * NOTE: Firebase Messaging (FCM) has been removed.
 * This file now only provides Firebase Authentication for Google Sign-In.
 * Notifications are handled by Android local notifications (Capacitor).
 */

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
  console.log('[FIREBASE] ✅ Firebase App initialized (Auth only)')
} else {
  app = getApps()[0]
}

// Export auth instance
export const auth = getAuth(app)

// Export getAuth function for compatibility
export function getAuthInstance(): Auth {
  return auth
}

export default app
