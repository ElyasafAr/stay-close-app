'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChange } from '@/services/auth'
import { Loading } from './Loading'

/**
 * AuthGuard - Protects routes and handles initial authentication check.
 * Simplified to prevent hydration errors and navigation loops.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  // public paths that don't require auth
  const publicPaths = ['/login', '/register']

  useEffect(() => {
    setMounted(true)
    
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token')
      const user = localStorage.getItem('user')
      const isAuth = !!(token && user)
      
      setAuthenticated(isAuth)

      // Redirect logic based on current path
      // We use window.location.pathname here to get the real current path during this execution
      const currentPath = window.location.pathname
      
      if (!isAuth && !publicPaths.includes(currentPath)) {
        router.replace('/login')
      } else if (isAuth && currentPath === '/login') {
        router.replace('/')
      }
      
      setLoading(false)
    }

    // Run initial check
    checkAuth()

    // Listen for auth changes
    const unsubscribe = onAuthStateChange(() => {
      checkAuth()
    })

    return () => unsubscribe()
  }, [router]) // pathname dependency removed to prevent re-runs during navigation

  // Prevent hydration mismatch by returning null or Loading until mounted
  if (!mounted || loading) {
    return <Loading />
  }

  // Allow access if authenticated OR on a public path
  const isPublicPath = publicPaths.includes(pathname)
  if (authenticated || isPublicPath) {
    return <>{children}</>
  }

  // Fallback to loading while redirecting
  return <Loading />
}
