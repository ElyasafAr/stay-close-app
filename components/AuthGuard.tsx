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
    // This only runs on the client after the first render
    setMounted(true)
    
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('auth_token')
      const user = localStorage.getItem('user')
      const isAuth = !!(token && user)
      
      setAuthenticated(isAuth)

      // Get real current path from window to avoid pathname stale closure issues
      const currentPath = window.location.pathname
      
      if (!isAuth && !publicPaths.includes(currentPath)) {
        router.replace('/login')
      } else if (isAuth && currentPath === '/login') {
        router.replace('/')
      }
      
      setLoading(false)
    }

    // Run check on mount
    checkAuth()

    // Listen for auth changes from Firebase
    const unsubscribe = onAuthStateChange(() => {
      checkAuth()
    })

    return () => unsubscribe()
  }, [router]) // Dependencies minimized

  // HYDRATION SAFETY: 
  // Always render the same thing on server and first client pass.
  // We choose to render nothing or a generic skeleton until mounted.
  if (!mounted) {
    return <Loading />
  }

  // Once mounted, if we are still loading the auth state, show loading
  if (loading) {
    return <Loading />
  }

  // Allow access if authenticated OR on a public path
  const isPublicPath = publicPaths.includes(pathname)
  if (authenticated || isPublicPath) {
    return <>{children}</>
  }

  // Fallback while redirecting
  return <Loading />
}
