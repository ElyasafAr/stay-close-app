'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loading } from '@/components/Loading'

/**
 * Root Page - Fast redirect based on auth status
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Safeguard: Only redirect if we are actually at the root
    // In some static export cases, this component might mount unexpectedly
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/index.html' && currentPath !== '') {
      return;
    }

    const token = localStorage.getItem('auth_token')
    
    // In Capacitor, we want to move away from root as fast as possible
    if (token) {
      console.log('[Root] Auth found, moving to /messages');
      router.replace('/messages');
    } else {
      console.log('[Root] No auth, moving to /login');
      router.replace('/login');
    }
  }, [router])

  return <Loading />
}
