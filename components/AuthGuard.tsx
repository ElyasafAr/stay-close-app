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
    // בדיקה ראשונית
    const checkAuth = () => {
      const isAuth = isAuthenticated()
      setAuthenticated(isAuth)

      // אם המשתמש לא מחובר ולא בדף ציבורי - העבר ל-login
      if (!isAuth && !publicPaths.includes(pathname)) {
        router.replace('/login')
        setLoading(false)
        return
      }
      // אם המשתמש מחובר ובדף login - העבר לבית
      if (isAuth && pathname === '/login') {
        router.replace('/')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    checkAuth()

    // Listener למצב ההתחברות של Firebase
    const unsubscribe = onAuthStateChange((user) => {
      // תמיד לבדוק את localStorage ישירות (גם עבור התחברות רגילה)
      const isAuth = isAuthenticated()
      console.log(`🔍 [AUTHGUARD] onAuthStateChange: Firebase user=${!!user}, localStorage auth=${isAuth}`)
      setAuthenticated(isAuth)

      if (!isAuth && !publicPaths.includes(pathname)) {
        router.replace('/login')
      } else if (isAuth && pathname === '/login') {
        router.replace('/')
      }
    })

    // בדיקה תקופתית (למקרה שהשינוי קרה באותו חלון - התחברות רגילה)
    // זה חשוב כי storage events לא עובדים באותו חלון
    // וגם כי onAuthStateChange לא עובד עם התחברות רגילה
    const intervalId = setInterval(() => {
      const isAuth = isAuthenticated()
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
    }, 200) // בדיקה כל 200ms - לא יותר מדי תכוף כדי לא לגרום ל-loops

    return () => {
      unsubscribe()
      clearInterval(intervalId)
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
