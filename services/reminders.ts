'use client'

import { getData, postData, putData, deleteData } from './api'

export type ReminderType = 'one_time' | 'recurring' | 'weekly' | 'daily'

export interface Reminder {
  id: number
  user_id?: string
  contact_id: number
  reminder_type: ReminderType
  // שדות קיימים (עבור recurring)
  interval_type?: 'hours' | 'days'
  interval_value?: number
  // שדות חדשים
  scheduled_datetime?: string  // ISO datetime string
  weekdays?: number[]  // [0,2,4] = ראשון, שלישי, חמישי
  specific_time?: string  // "14:30"
  one_time_triggered?: boolean
  // שדות קיימים
  last_triggered?: string
  next_trigger?: string
  enabled: boolean
  created_at?: string
}

export interface ReminderCreate {
  contact_id: number
  reminder_type: ReminderType
  interval_type?: 'hours' | 'days'
  interval_value?: number
  scheduled_datetime?: string
  weekdays?: number[]
  specific_time?: string
  enabled?: boolean
}

/**
 * קבלת כל ההתראות של המשתמש
 */
export async function getReminders(): Promise<Reminder[]> {
  const response = await getData<Reminder[]>('/api/reminders')
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בטעינת התראות')
  }
  return response.data
}

/**
 * קבלת התראה ספציפית לפי ID
 */
export async function getReminder(id: number): Promise<Reminder> {
  const response = await getData<Reminder>(`/api/reminders/${id}`)
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בטעינת התראה')
  }
  return response.data
}

/**
 * יצירת התראה חדשה
 */
export async function createReminder(reminder: ReminderCreate): Promise<Reminder> {
  const response = await postData<Reminder>('/api/reminders', reminder)
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה ביצירת התראה')
  }
  return response.data
}

/**
 * עדכון התראה קיימת
 */
export async function updateReminder(id: number, reminder: ReminderCreate): Promise<Reminder> {
  const response = await putData<Reminder>(`/api/reminders/${id}`, reminder)
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בעדכון התראה')
  }
  return response.data
}

/**
 * מחיקת התראה
 */
export async function deleteReminder(id: number): Promise<void> {
  const response = await deleteData(`/api/reminders/${id}`)
  if (!response.success) {
    throw new Error(response.error || 'שגיאה במחיקת התראה')
  }
}

/**
 * בדיקת התראות שצריכות להתפעל
 */
export async function checkReminders(): Promise<Reminder[]> {
  const response = await getData<Reminder[]>('/api/reminders/check')
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בבדיקת התראות')
  }
  return response.data
}

