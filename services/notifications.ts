'use client'

/**
 * Browser Notifications Service - SIMPLIFIED
 *
 * Browser notifications have been disabled in favor of Android local notifications.
 * This file is kept as a stub for backward compatibility.
 *
 * Future: Can be re-enabled for web notification support if needed.
 */

/**
 * Stub function - browser notifications disabled
 */
export async function requestNotificationPermission(): Promise<boolean> {
  console.log('[NOTIF] 🔵 requestNotificationPermission called (browser notifications disabled)')
  return false
}

/**
 * Stub function - no longer used
 */
export function startReminderChecker(): () => void {
  console.log('[NOTIF] 🔵 startReminderChecker called (browser notifications disabled)')
  return () => {}
}
