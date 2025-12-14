'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { MdLogout, MdMenu, MdClose } from 'react-icons/md'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    checkDarkMode()
    // Check periodically for theme changes
    const interval = setInterval(checkDarkMode, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = getStoredUser()
      console.log('🔵 [HEADER] pathname changed:', pathname)
      console.log('🔵 [HEADER] storedUser:', storedUser)
      console.log('🔵 [HEADER] isAuthenticated:', isAuthenticated())
      setUser(storedUser)
    }
  }, [pathname])

  const handleLogout = async () => {
    console.log('🔴 [HEADER] handleLogout called - starting logout directly')
    try {
      // Clear localStorage first
      console.log('🔴 [HEADER] Clearing localStorage...')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('firebase_token')
      localStorage.removeItem('user')
      
      // Call logout function
      console.log('🔴 [HEADER] Calling logout()...')
      await logout()
      console.log('🔴 [HEADER] logout() completed')
    } catch (err) {
      console.error('🔴 [HEADER] Logout error (continuing anyway):', err)
    }
    
    // Force full page reload to login with cache busting
    console.log('🔴 [HEADER] Forcing full reload to /login...')
    window.location.replace('/login.html')
  }

  // Close mobile menu when clicking outside and prevent body scroll
  useEffect(() => {
    if (showMobileMenu) {
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      // Restore body scroll when menu is closed
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuButton}`)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      // Cleanup body styles
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [showMobileMenu])

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  // אם המשתמש לא מחובר, לא להציג את ה-Header
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    return null
  }

  const navLinks = [
    { href: '/', label: t('navigation.home') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/messages', label: t('navigation.messages') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/about', label: t('navigation.about') },
  ]

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            {t('app.name')} <span style={{fontSize: '14px', color: 'red', fontWeight: 'bold'}}>[v2.5]</span>
          </Link>
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Mobile Hamburger Button - מצד ימין */}
            <button
              className={styles.mobileMenuButton}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="תפריט"
              type="button"
              style={{
                color: isDarkMode ? '#ffffff' : 'inherit',
                background: isDarkMode ? 'rgba(79, 195, 247, 0.2)' : 'transparent',
                border: isDarkMode ? '1px solid rgba(79, 195, 247, 0.4)' : 'none',
                borderRadius: '8px',
                padding: '8px'
              }}
            >
              {showMobileMenu 
                ? <MdClose size={28} color={isDarkMode ? '#ffffff' : '#333333'} /> 
                : <MdMenu size={28} color={isDarkMode ? '#ffffff' : '#333333'} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setShowMobileMenu(false)
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          setShowMobileMenu(false)
        }}
      />

      {/* Mobile Menu */}
      <div 
        className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.mobileMenuHeader}>
          <h2>{t('app.name')}</h2>
          <button
            className={styles.mobileMenuClose}
            onClick={(e) => {
              e.stopPropagation()
              setShowMobileMenu(false)
            }}
            aria-label="סגור תפריט"
            type="button"
          >
            <MdClose />
          </button>
        </div>
        
        <nav className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setShowMobileMenu(false)
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px solid var(--color-primary-light)' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {user.username}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={async () => {
                console.log('🔴 [HEADER] Logout button clicked')
                setShowMobileMenu(false)
                // Wait a bit for menu to close, then logout
                setTimeout(async () => {
                  await handleLogout()
                }, 100)
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(255, 154, 158, 0.3)',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <MdLogout />
              <span>התנתק</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

