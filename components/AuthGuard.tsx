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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log(`🛡️ [AuthGuard] Render: pathname=${pathname}, loading=${loading}, authenticated=${authenticated}, mounted=${mounted}`)

  // דפים שפתוחים לכולם
  const publicPaths = ['/login', '/register']

  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuth = !!(token && user)
      
      console.log(`🛡️ [AuthGuard] checkAuth: isAuth=${isAuth}, currentPath=${pathname}`)
      setAuthenticated(isAuth)

      if (!isAuth && !publicPaths.includes(pathname)) {
        console.log('🛡️ [AuthGuard] Redirecting to /login')
        router.replace('/login')
      } else if (isAuth && pathname === '/login') {
        console.log('🛡️ [AuthGuard] Redirecting to / (home)')
        router.replace('/')
      }
      setLoading(false)
    }

    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    const unsubscribe = onAuthStateChange(() => checkAuth())

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      unsubscribe()
    }
  }, [pathname, router])

  if (loading || !mounted) {
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
