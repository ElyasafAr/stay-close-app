'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, onAuthStateChange } from '@/services/auth'
import { Loading } from './Loading'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  // דפים שפתוחים לכולם
  const publicPaths = ['/login', '/register']

  useEffect(() => {
    // בדיקה ראשונית - רק אחרי שהדף נטען
    const checkAuth = () => {
      // בדיקה קפדנית יותר - לא רק token, אלא גם user
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuth = !!(token && user)
      
      console.log(`🔍 [AUTHGUARD] Initial check: token=${!!token}, user=${!!user}, isAuth=${isAuth}, pathname=${pathname}`)
      
      setAuthenticated(isAuth)

      // אם המשתמש לא מחובר ולא בדף ציבורי - העבר ל-login
      if (!isAuth && !publicPaths.includes(pathname)) {
        console.log('🔍 [AUTHGUARD] Not authenticated, redirecting to /login')
        router.replace('/login')
        setLoading(false)
        return
      }
      // אם המשתמש מחובר ובדף login - העבר לבית
      if (isAuth && pathname === '/login') {
        console.log('🔍 [AUTHGUARD] Authenticated, redirecting from /login to /')
        router.replace('/')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    // קצת delay כדי לוודא שהכל נטען
    const timeoutId = setTimeout(checkAuth, 100)

    // Listener למצב ההתחברות של Firebase
    // עבור התחברות רגילה (ללא Firebase), הבדיקה התקופתית תטפל בזה
    const unsubscribe = onAuthStateChange((user) => {
      // רק אם יש Firebase user, נעדכן
      // עבור התחברות רגילה, הבדיקה התקופתית תטפל בזה
      if (user) {
        const isAuth = isAuthenticated()
        console.log(`🔍 [AUTHGUARD] onAuthStateChange: Firebase user=true, localStorage auth=${isAuth}`)
        setAuthenticated(isAuth)
        
        if (isAuth && pathname === '/login') {
          router.push('/')
        } else if (!isAuth && !publicPaths.includes(pathname)) {
          router.push('/login')
        }
      }
      // אם אין Firebase user, לא נעשה כלום - הבדיקה התקופתית תטפל בזה
      // זה חשוב כי onAuthStateChange נקרא גם כשמתחברים רגיל, ואז user=null
      // אבל זה לא אומר שהמשתמש לא מחובר - רק שאין Firebase
    })

    // בדיקה תקופתית (למקרה שהשינוי קרה באותו חלון - התחברות רגילה)
    // זה חשוב כי storage events לא עובדים באותו חלון
    // וגם כי onAuthStateChange לא עובד עם התחברות רגילה
    const intervalId = setInterval(() => {
      // בדיקה קפדנית יותר
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuth = !!(token && user)
      
      if (isAuth !== authenticated) {
        console.log(`🔄 [AUTHGUARD] Auth status changed: ${authenticated} -> ${isAuth}, pathname=${pathname}`)
        setAuthenticated(isAuth)
        // רק אם המשתמש התחבר ובדף login - העבר לבית
        // אבל לא נזרוק אותו החוצה אם הוא בדף אחר (יכול להיות שהוא כבר בדף הבית)
        if (isAuth && pathname === '/login') {
          console.log('🔄 [AUTHGUARD] User authenticated, redirecting from /login to /')
          router.push('/')
        } else if (!isAuth && !publicPaths.includes(pathname)) {
          console.log('🔄 [AUTHGUARD] User not authenticated, redirecting to /login')
          router.push('/login')
        }
      }
    }, 500) // בדיקה כל 500ms - לא יותר מדי תכוף כדי לא לגרום ל-loops

    return () => {
      unsubscribe()
      clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router, authenticated])

  if (loading) {
    return <Loading />
  }

  // אם המשתמש לא מחובר ובדף ציבורי - תן לו להיכנס
  if (!authenticated && publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // אם המשתמש מחובר - תן לו גישה
  if (authenticated) {
    return <>{children}</>
  }

  // אחרת - טעינה
  return <Loading />
}
