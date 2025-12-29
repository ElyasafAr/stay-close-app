'use client'

import { postData } from './api'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Capacitor } from '@capacitor/core'

export interface User {
  id: number
  username: string
  email: string
  full_name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform()
}

export async function login(credentials: { username: string; password: string }): Promise<AuthResponse> {
  const response = await postData<AuthResponse>('/api/auth/login', credentials)
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בהתחברות')
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: response.data.user } }))
  }
  
  return response.data
}

export async function register(userData: { username: string; email: string; password: string }): Promise<AuthResponse> {
  const response = await postData<AuthResponse>('/api/auth/register', userData)
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'שגיאה בהרשמה')
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: response.data.user } }))
  }
  
  return response.data
}

async function loginWithGoogleNative(): Promise<AuthResponse> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle()
    const tokenResult = await FirebaseAuthentication.getIdToken()
    const firebaseToken = tokenResult.token
    
    if (!firebaseToken) {
      throw new Error('לא ניתן לקבל token מ-Firebase')
    }
    
    const response = await postData<AuthResponse>('/api/auth/firebase', {
      token: firebaseToken
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'שגיאה בהתחברות עם Firebase')
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('firebase_token', firebaseToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: response.data.user } }))
    }
    
    return response.data
  } catch (error: any) {
    console.error('❌ [AUTH] Native Google login error:', error)
    throw new Error(error.message || 'שגיאה בהתחברות עם Google')
  }
}

export async function loginWithGoogle(): Promise<AuthResponse> {
  if (isNativePlatform()) {
    return loginWithGoogleNative()
  }
  
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    
    const firebaseAuth = auth
    if (!firebaseAuth) {
      throw new Error('שגיאה בהתחברות. נא לנסות שוב.')
    }
    const result = await signInWithPopup(firebaseAuth, provider)
    const firebaseToken = await result.user.getIdToken()
    
    const response = await postData<AuthResponse>('/api/auth/firebase', {
      token: firebaseToken
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'שגיאה בהתחברות עם Firebase')
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('firebase_token', firebaseToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: response.data.user } }))
    }
    
    return response.data
  } catch (error: any) {
    console.error('❌ [AUTH] Web Google login error:', error)
    throw new Error(error.message || 'שגיאה בהתחברות עם Google')
  }
}

/**
 * בדיקה האם אנחנו בתהליך התנתקות
 * משתמש רק ב-sessionStorage כדי שהדגל יתאפס כשהאפליקציה נסגרת
 */
export function isLoggingOut(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('is_logging_out') === 'true';
}

/**
 * התנתקות - גרסה מפושטת וחזקה
 * הפונקציה מחזירה Promise שמסתיימת לאחר ביצוע הניקוי
 * ומשאירה את הניתוב לרכיב שקרא לה (Header)
 */
export async function logout(): Promise<void> {
  console.log('🔵 [AUTH] Starting robust logout flow');
  
  if (typeof window !== 'undefined') {
    // 1. הגדרת דגל התנתקות רק ב-sessionStorage (לא ב-localStorage!)
    sessionStorage.setItem('is_logging_out', 'true');
    
    // 2. ניקוי ה-Storage (למעט הגדרות בסיסיות)
    const lang = localStorage.getItem('app_language');
    const theme = localStorage.getItem('app_theme');
    const settings = localStorage.getItem('app_settings');
    
    localStorage.clear();
    
    if (lang) localStorage.setItem('app_language', lang);
    if (theme) localStorage.setItem('app_theme', theme);
    if (settings) localStorage.setItem('app_settings', settings);
    
    // 3. הודעה לרכיבים על התנתקות
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null, isLogout: true } }));

    try {
      // 4. ניקוי עוגיות Native של Capacitor
      const { CapacitorCookies } = await import('@capacitor/core');
      await CapacitorCookies.clearAllCookies();
      console.log('✅ [AUTH] Native cookies cleared');

      // 5. התנתקות מ-Firebase
      if (isNativePlatform()) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        await FirebaseAuthentication.signOut();
      }
      if (auth) {
        await firebaseSignOut(auth);
      }
      console.log('✅ [AUTH] Firebase sign-out complete');
    } catch (e) {
      console.warn('⚠️ [AUTH] Non-critical error during logout cleanup:', e);
    }

    // 6. הניתוב יתבצע ע"י הרכיב שקרא לפונקציה
    console.log('✅ [AUTH] Logout cleanup complete, ready for redirect');
  }
}

export function clearLogoutFlag() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('is_logging_out');
    console.log('🧹 [AUTH] Logout flag cleared');
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('auth_token');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const firebaseAuth = auth
  
  if (!firebaseAuth) {
    if (typeof window !== 'undefined') {
      const storedUser = getStoredUser()
      if (storedUser && localStorage.getItem('auth_token')) {
        callback(storedUser)
      } else {
        callback(null)
      }
    }
    return () => {}
  }
  
  return onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
    // אם אנחנו בתהליך התנתקות, נתעלם מהאירוע לחלוטין
    if (typeof window !== 'undefined' && sessionStorage.getItem('is_logging_out') === 'true') {
      console.log('🟡 [AUTH] Auth state change ignored because is_logging_out = true');
      return;
    }

    if (firebaseUser) {
      try {
        const firebaseToken = await firebaseUser.getIdToken()
        const response = await postData<AuthResponse>('/api/auth/firebase', {
          token: firebaseToken
        })
        
        if (response.success && response.data) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.data.access_token)
            localStorage.setItem('firebase_token', firebaseToken)
            localStorage.setItem('user', JSON.stringify(response.data.user))
          }
          callback(response.data.user)
        } else {
          callback(null)
        }
      } catch (error) {
        callback(null)
      }
    } else {
      if (typeof window !== 'undefined') {
        const hasJwt = !!localStorage.getItem('auth_token')
        if (!hasJwt) {
          callback(null)
        }
      } else {
        callback(null)
      }
    }
  })
}
