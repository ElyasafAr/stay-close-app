'use client'

/**
 * Service Worker Registration and FCM setup - REMOVED
 *
 * FCM push notifications have been completely removed from the application.
 * The app now uses Android local notifications only, scheduled locally on the device.
 *
 * This file is kept as a stub for backward compatibility with existing imports.
 */

/**
 * Stub component - no longer registers service workers or FCM
 */
export function ServiceWorkerRegistration() {
  console.log('[NOTIF] 🔵 ServiceWorkerRegistration stub loaded (FCM disabled)')
  return null
}

/**
 * Stub hook - always returns null for FCM token
 */
export function useFCMToken() {
  return {
    token: null,
    loading: false,
    error: null
  }
}
