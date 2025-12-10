'use client'

import { postData, getData } from './api'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface User {
  user_id: string
  username: string
  email: string
  auth_provider?: 'local' | 'google' | 'firebase'
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

/**
 * רישום משתמש חדש
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await postData<AuthResponse>('/api/auth/register', data)
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה ברישום')
  }
  
  // שמירה ב-localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  
  return response.data
}

/**
 * התחברות עם שם משתמש וסיסמה
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await postData<AuthResponse>('/api/auth/login', data)
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בהתחברות')
  }
  
  // שמירה ב-localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  
  return response.data
}

/**
 * התחברות עם Google דרך Firebase
 */
export async function loginWithGoogle(): Promise<AuthResponse> {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    const result = await signInWithPopup(auth, provider)
    const firebaseToken = await result.user.getIdToken()
    
    // שליחה לשרת לאימות ויצירת משתמש/קבלת JWT
    const response = await postData<AuthResponse>('/api/auth/firebase', {
      token: firebaseToken
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'שגיאה בהתחברות עם Firebase')
    }
    
    // שמירה ב-localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('firebase_token', firebaseToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data
  } catch (error: any) {
    // טיפול בשגיאות Firebase
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('החלון נסגר. אנא נסה שוב.')
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('החלון נחסם. אנא אפשר חלונות קופצים ונסה שוב.')
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('הבקשה בוטלה. אנא נסה שוב.')
    }
    throw new Error(error.message || 'שגיאה בהתחברות עם Google')
  }
}

/**
 * התנתקות
 */
export async function logout(): Promise<void> {
  try {
    // התנתקות מ-Firebase
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('שגיאה בהתנתקות מ-Firebase:', error)
  }
  
  // מחיקת נתונים מ-localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}

/**
 * בדיקה אם המשתמש מחובר
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!localStorage.getItem('auth_token')
}

/**
 * קבלת token נוכחי
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('auth_token')
}

/**
 * קבלת משתמש שמור
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null
  }
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return null
  }
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * קבלת פרטי משתמש נוכחי מהשרת
 */
export async function getCurrentUser(): Promise<User> {
  const response = await getData<User>('/api/auth/me')
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בטעינת פרטי משתמש')
  }
  return response.data
}

/**
 * Listener למצב ההתחברות של Firebase
 * מעדכן את ה-token ב-localStorage כשמתעדכן
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        // קבלת token מעודכן
        const firebaseToken = await firebaseUser.getIdToken()
        
        // עדכון ב-localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase_token', firebaseToken)
          
          // אם יש JWT token, נשאיר אותו. אם לא, ננסה לקבל אחד חדש
          const currentToken = localStorage.getItem('auth_token')
          if (!currentToken) {
            // קבלת JWT מהשרת
            try {
              const response = await postData<AuthResponse>('/api/auth/firebase', {
                token: firebaseToken
              })
              if (response.success && response.data) {
                localStorage.setItem('auth_token', response.data.access_token)
                localStorage.setItem('user', JSON.stringify(response.data.user))
                callback(response.data.user)
                return
              }
            } catch (error) {
              console.error('שגיאה בעדכון token:', error)
            }
          }
          
          // אם יש user שמור, נשתמש בו
          const storedUser = getStoredUser()
          if (storedUser) {
            callback(storedUser)
            return
          }
        }
      } catch (error) {
        console.error('שגיאה בעדכון Firebase token:', error)
      }
    } else {
      // המשתמש התנתק
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_token')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
      callback(null)
    }
  })
}
