'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChange } from '@/services/auth'
import { Loading } from './Loading'

/**
 * AuthGuard - Protects routes and handles initial authentication check.
 * Refined for maximum hydration safety and router stability.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  // public paths that don't require auth
  const publicPaths = ['/login', '/register']

  useEffect(() => {
    console.log(`[AuthGuard] Mounted. Pathname: ${pathname}`);
    setMounted(true)
    
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')
      const isAuth = !!(token && userStr)
      
      console.log(`[AuthGuard] checkAuth - isAuth: ${isAuth}, path: ${window.location.pathname}`);
      setAuthenticated(isAuth)

      const currentPath = window.location.pathname
      
      if (!isAuth && !publicPaths.includes(currentPath)) {
        console.log('[AuthGuard] Redirecting to /login');
        router.replace('/login')
      } else if (isAuth && currentPath === '/login') {
        console.log('[AuthGuard] Redirecting to /');
        router.replace('/')
      }
      
      setLoading(false)
    }

    checkAuth()

    const unsubscribe = onAuthStateChange((user) => {
      console.log('[AuthGuard] onAuthStateChange event', user ? 'User exists' : 'No user');
      checkAuth()
    })

    return () => unsubscribe()
  }, [router])

  console.log(`[AuthGuard] Render - mounted: ${mounted}, loading: ${loading}, auth: ${authenticated}, path: ${pathname}`);

  if (!mounted) {
    console.log('[AuthGuard] Rendering nothing (not mounted)');
    return null;
  }

  if (loading) {
    console.log('[AuthGuard] Rendering Loading screen');
    return <Loading />
  }

  const isPublicPath = publicPaths.includes(pathname)
  if (authenticated || isPublicPath) {
    console.log(`[AuthGuard] Rendering children for: ${pathname}`);
    return <>{children}</>
  }

  console.log('[AuthGuard] Not authorized and not public - rendering Loading');
  return <Loading />
}
