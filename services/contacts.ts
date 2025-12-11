/**
 * שירות לניהול אנשי קשר
 * מטפל בכל הפעולות הקשורות לאנשי קשר (CRUD)
 */

import { getData, postData, putData, deleteData } from './api'

export interface Contact {
  id?: number
  name: string
  default_tone?: string  // טון ברירת מחדל להודעות
  created_at?: string
}

/**
 * קבלת רשימת כל אנשי הקשר
 */
export async function getContacts(): Promise<Contact[]> {
  const response = await getData<Contact[]>('/api/contacts')
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.error || 'שגיאה בטעינת אנשי קשר')
}

/**
 * קבלת איש קשר ספציפי לפי ID
 */
export async function getContact(id: number): Promise<Contact> {
  const response = await getData<Contact>(`/api/contacts/${id}`)
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.error || 'שגיאה בטעינת איש קשר')
}

/**
 * יצירת איש קשר חדש
 */
export async function createContact(contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
  const response = await postData<Contact>('/api/contacts', contact)
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.error || 'שגיאה ביצירת איש קשר')
}

/**
 * עדכון איש קשר קיים
 */
export async function updateContact(id: number, contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
  const response = await putData<Contact>(`/api/contacts/${id}`, contact)
  if (response.success && response.data) {
    return response.data
  }
  throw new Error(response.error || 'שגיאה בעדכון איש קשר')
}

/**
 * מחיקת איש קשר
 */
export async function deleteContact(id: number): Promise<void> {
  const response = await deleteData(`/api/contacts/${id}`)
  if (!response.success) {
    throw new Error(response.error || 'שגיאה במחיקת איש קשר')
  }
}

