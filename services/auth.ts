'use client'

import { postData, getData } from './api'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  Auth
} from 'firebase/auth'
import { getAuth } from '@/lib/firebase'

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
  console.log('🔵 [AUTH] Starting registration...', { username: data.username, email: data.email })
  
  try {
    const response = await postData<AuthResponse>('/api/auth/register', data)
    console.log('🔵 [AUTH] Registration response:', { 
      success: response.success, 
      hasData: !!response.data,
      error: response.error 
    })
    
    if (!response.success || !response.data) {
      console.error('❌ [AUTH] Registration failed:', response.error)
      throw new Error(response.error || 'שגיאה ברישום')
    }
    
    console.log('✅ [AUTH] Registration successful:', { 
      user_id: response.data.user.user_id,
      username: response.data.user.username,
      email: response.data.user.email,
      hasToken: !!response.data.access_token
    })
    
    // שמירה ב-localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      console.log('💾 [AUTH] Saved to localStorage')
    }
    
    return response.data
  } catch (error) {
    console.error('❌ [AUTH] Registration error:', error)
    throw error
  }
}

/**
 * התחברות עם שם משתמש וסיסמה
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  console.log('🔵 [AUTH] Starting login...', { username: data.username })
  
  try {
    const response = await postData<AuthResponse>('/api/auth/login', data)
    console.log('🔵 [AUTH] Login response:', { 
      success: response.success, 
      hasData: !!response.data,
      error: response.error 
    })
    
    if (!response.success || !response.data) {
      console.error('❌ [AUTH] Login failed:', response.error)
      throw new Error(response.error || 'שגיאה בהתחברות')
    }
    
    console.log('✅ [AUTH] Login successful:', { 
      user_id: response.data.user.user_id,
      username: response.data.user.username,
      email: response.data.user.email,
      hasToken: !!response.data.access_token
    })
    
    // שמירה ב-localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      console.log('💾 [AUTH] Saved to localStorage')
    }
    
    return response.data
  } catch (error) {
    console.error('❌ [AUTH] Login error:', error)
    throw error
  }
}

/**
 * בדיקה אם רצים על פלטפורמה Native (Android/iOS)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor מוסיף את האובייקט הזה כשרצים על Native
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/**
 * התחברות עם Google דרך Firebase
 */
export async function loginWithGoogle(): Promise<AuthResponse> {
  console.log('🔵 [AUTH] Starting Google login...')
  
  // בדיקה אם רצים על Native - Google Sign-In דורש הגדרה נפרדת
  if (isNativePlatform()) {
    console.warn('⚠️ [AUTH] Google login not available on native platform yet')
    throw new Error('התחברות עם Google לא זמינה באפליקציה. אנא השתמש בשם משתמש וסיסמה.')
  }
  
  try {
    console.log('🔵 [AUTH] Creating Google provider...')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    console.log('🔵 [AUTH] Calling signInWithPopup...')
    const firebaseAuth = getAuth()
    if (!firebaseAuth) {
      throw new Error('שגיאה בהתחברות. נא לנסות שוב.')
    }
    const result = await signInWithPopup(firebaseAuth, provider)
    console.log('✅ [AUTH] Firebase sign-in successful:', {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    })
    
    console.log('🔵 [AUTH] Getting Firebase token...')
    const firebaseToken = await result.user.getIdToken()
    console.log('✅ [AUTH] Firebase token received:', { 
      tokenLength: firebaseToken.length,
      tokenPreview: firebaseToken.substring(0, 20) + '...'
    })
    
    // שליחה לשרת לאימות ויצירת משתמש/קבלת JWT
    console.log('🔵 [AUTH] Sending token to backend...')
    const response = await postData<AuthResponse>('/api/auth/firebase', {
      token: firebaseToken
    })
    
    console.log('🔵 [AUTH] Backend response:', { 
      success: response.success, 
      hasData: !!response.data,
      error: response.error 
    })
    
    if (!response.success || !response.data) {
      console.error('❌ [AUTH] Firebase login failed:', response.error)
      throw new Error(response.error || 'שגיאה בהתחברות עם Firebase')
    }
    
    console.log('✅ [AUTH] Firebase login successful:', { 
      user_id: response.data.user.user_id,
      username: response.data.user.username,
      email: response.data.user.email,
      hasToken: !!response.data.access_token
    })
    
    // שמירה ב-localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('firebase_token', firebaseToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      console.log('💾 [AUTH] Saved to localStorage')
    }
    
    return response.data
  } catch (error: any) {
    console.error('❌ [AUTH] Google login error:', {
      code: error.code,
      message: error.message,
      error: error
    })
    
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
    const firebaseAuth = getAuth()
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth)
    }
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
  const firebaseAuth = getAuth()
  
  // אם Firebase לא זמין, נחזיר unsubscribe ריק ונבדוק localStorage
  if (!firebaseAuth) {
    // במצב SSR או כשאין Firebase, נבדוק localStorage
    if (typeof window !== 'undefined') {
      const storedUser = getStoredUser()
      if (storedUser && localStorage.getItem('auth_token')) {
        callback(storedUser)
      } else {
        callback(null)
      }
    }
    return () => {} // unsubscribe ריק
  }
  
  return onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
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
              } else {
                // If backend is not available, use stored user if available
                console.warn('⚠️ [AUTH] Backend unavailable, using stored user if available')
                const storedUser = getStoredUser()
                if (storedUser) {
                  callback(storedUser)
                  return
                }
              }
            } catch (error) {
              // Silently handle errors - backend might not be ready yet
              console.warn('⚠️ [AUTH] Could not get JWT token from backend (this is OK if backend is not ready):', error instanceof Error ? error.message : 'Unknown error')
              // Use stored user if available
              const storedUser = getStoredUser()
              if (storedUser) {
                callback(storedUser)
                return
              }
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
      // אין Firebase user - זה יכול להיות התנתקות מ-Firebase או התחברות רגילה
      // נבדוק אם יש JWT token ב-localStorage (התחברות רגילה)
      if (typeof window !== 'undefined') {
        const jwtToken = localStorage.getItem('auth_token')
        if (jwtToken) {
          // יש JWT token - זה התחברות רגילה, לא התנתקות
          // נשאיר את ה-localStorage ונחזיר את המשתמש השמור
          const storedUser = getStoredUser()
          if (storedUser) {
            callback(storedUser)
            return
          }
        } else {
          // אין JWT token - באמת התנתק
          localStorage.removeItem('firebase_token')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
        }
      }
      callback(null)
    }
  })
}
