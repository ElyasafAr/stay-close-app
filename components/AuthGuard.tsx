'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, onAuthStateChange, isLoggingOut } from '@/services/auth'
import { Loading } from './Loading'

const publicPaths = ['/login', '/register', '/about', '/privacy', '/terms', '/contact', '/test', '/debug']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isInitialCheckDone = useRef(false)

  useEffect(() => {
    setMounted(true)
    console.log(`🛡️ [AuthGuard] Path changed: ${pathname}`);
    
    // אם אנחנו בתהליך התנתקות, לא בודקים auth
    if (isLoggingOut()) {
      console.log('🛡️ [AuthGuard] Logout in progress, skipping auth check');
      setLoading(false);
      return;
    }
    
    const checkAuth = () => {
      const isPublic = publicPaths.includes(pathname || '')
      const auth = isAuthenticated()
      
      console.log(`🛡️ [AuthGuard] checkAuth: path=${pathname}, isPublic=${isPublic}, authenticated=${auth}`);
      
      setAuthenticated(auth)
      isInitialCheckDone.current = true

      // Safety timeout to prevent stuck loading screen
      const safetyTimeout = setTimeout(() => {
        setLoading(currentLoading => {
          if (currentLoading) {
            console.warn('⚠️ [AuthGuard] Safety timeout triggered - forcing loading to false');
            return false;
          }
          return currentLoading;
        });
      }, 3000);

      if (!auth && !isPublic) {
        console.log(`🛡️ [AuthGuard] Protected path detected! Redirecting to /login`);
        clearTimeout(safetyTimeout);
        router.replace('/login');
      } else if (auth && (pathname === '/login' || pathname === '/')) {
        console.log(`🛡️ [AuthGuard] Authenticated user on ${pathname}! Redirecting to /messages`);
        clearTimeout(safetyTimeout);
        router.replace('/messages')
      } else {
        console.log(`🛡️ [AuthGuard] Stay on current path: ${pathname}`);
        clearTimeout(safetyTimeout);
        setLoading(false); // מוודא שכיבינו את הלודינג רק כשהחלטנו להישאר בדף
      }
    }

    // בדיקה ראשונית
    checkAuth()

    // האזנה לשינויי התחברות
    console.log('🛡️ [AuthGuard] Registering onAuthStateChange listener');
    const unsubscribe = onAuthStateChange((user) => {
      // לא מגיבים לשינויים אם אנחנו בתהליך התנתקות
      if (isLoggingOut()) {
        console.log('🛡️ [AuthGuard] onAuthStateChange ignored (logout in progress)');
        return;
      }
      
      console.log('🛡️ [AuthGuard] onAuthStateChange:', user ? `User ${user.username}` : 'No user');
      const auth = !!user
      setAuthenticated(auth)
      
      const isPublic = publicPaths.includes(pathname || '')
      if (!auth && !isPublic) {
        console.log(`🛡️ [AuthGuard] Auth lost on protected path! Redirecting to /login`);
        router.replace('/login');
      } else if (auth && pathname === '/login') {
        console.log(`🛡️ [AuthGuard] Auth gained on login page! Redirecting to /messages`);
        router.replace('/messages')
      }
    })

    return () => {
      console.log('🛡️ [AuthGuard] Unsubscribing from onAuthStateChange');
      unsubscribe();
    }
  }, [pathname, router])

  // בזמן הבדיקה הראשונית, נאפשר לדפים ציבוריים להופיע מיד כדי למנוע hydration errors
  const isPublic = publicPaths.includes(pathname || '')
  
  if (!mounted) {
    return <>{children}</>
  }

  if (loading && !isPublic) {
    return <Loading />
  }

  console.log(`🛡️ [AuthGuard] Rendering children for path: ${pathname}`);
  return <>{children}</>
}
