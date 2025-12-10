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
      const isAuth = !!user
      setAuthenticated(isAuth)

      if (!isAuth && !publicPaths.includes(pathname)) {
        router.replace('/login')
      } else if (isAuth && pathname === '/login') {
        router.replace('/')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pathname, router])

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
