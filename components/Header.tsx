'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData } from '@/services/api'
import { MdLogout, MdMenu, MdClose, MdAdminPanelSettings, MdPerson, MdSettings, MdInfo } from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Detect dark mode using MutationObserver (much more efficient than setInterval)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    // Initial check
    checkDarkMode()

    // Observe class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = getStoredUser()
      console.log('🔵 [HEADER] pathname changed:', pathname)
      console.log('🔵 [HEADER] storedUser:', storedUser)
      console.log('🔵 [HEADER] isAuthenticated:', isAuthenticated())
      setUser(storedUser)
      
      // Check if user is admin
      if (isAuthenticated()) {
        checkAdminStatus()
      }
    }
  }, [pathname])

  const checkAdminStatus = async () => {
    try {
      const response = await getData('/api/admin/stats')
      // If we get here without error, user is admin
      if (response.success) {
        setIsAdmin(true)
      }
    } catch (err) {
      // 403 means not admin - that's expected
      setIsAdmin(false)
      }
    }

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

    // Force full page reload to login
    console.log('🔴 [HEADER] Forcing full reload to /login...')
    // Use /login.html for Capacitor, /login for web
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.()
    window.location.replace(isCapacitor ? '/login.html' : '/login')
  }

  // Close mobile menu and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement
      
      // Close mobile menu
      if (showMobileMenu && !target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuButton}`)) {
        setShowMobileMenu(false)
      }
      
      // Close user dropdown
      if (showUserDropdown && !target.closest(`.${styles.userMenu}`)) {
        setShowUserDropdown(false)
      }
    }

    if (showMobileMenu || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMobileMenu, showUserDropdown])

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false)
    setShowUserDropdown(false)
  }, [pathname])

  // אם המשתמש לא מחובר, לא להציג את ה-Header
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    return null
  }

  const navLinks = [
    { href: '/messages', label: t('navigation.messages') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/contact', label: t('navigation.contact') },
    { href: '/about', label: t('navigation.about') },
    // Admin link - only shown if isAdmin is true
    ...(isAdmin ? [{ href: '/admin', label: `🛠️ ${t('navigation.admin')}`, isAdminLink: true }] : []),
  ]

  const menuLinks = [
    { href: '/messages', label: `💬 ${t('navigation.messages')}` },
    { href: '/contacts', label: `👥 ${t('navigation.contacts')}` },
    { href: '/settings', label: `⚙️ ${t('navigation.settings')}` },
    { href: '/contact', label: `✉️ ${t('navigation.contact')}` },
    { href: '/about', label: `ℹ️ ${t('navigation.about')}` },
    ...(isAdmin ? [{ href: '/admin', label: `🛠️ ${t('navigation.admin')}`, isAdminLink: true }] : []),
  ]

  const handleLinkClick = (href: string) => {
    console.log('🔗 [Header] Navigating to:', href)
    setShowMobileMenu(false)
  }

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo} onClick={() => handleLinkClick('/')}>
            {t('app.name')}
          </Link>
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={() => handleLinkClick(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop User Menu */}
            <div className={styles.desktopUserMenu}>
              <div className={styles.userMenu}>
                <button 
                  className={styles.userButton}
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <MdPerson className={styles.userIcon} />
                  <span className={styles.userName}>{user?.username || t('messages.greetings.guest')}</span>
                </button>

                {showUserDropdown && (
                  <div className={styles.dropdown}>
                    <div className={styles.userInfo}>
                      <p className={styles.userNameFull}>{user?.username}</p>
                      <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                    <div className={styles.versionInfo}>
                      <small>{t('settings.version')} {APP_VERSION}</small>
                    </div>
                    <div style={{ margin: '8px 0', borderTop: '1px solid var(--border-color)' }}></div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                      <MdLogout /> {t('settings.logout')}
                    </button>
                  </div>
                )}
              </div>
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
          {menuLinks.map((link) => (
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
              <span>{t('settings.logout')}</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

