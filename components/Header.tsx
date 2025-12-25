'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData } from '@/services/api'
import { MdLogout, MdMenu, MdClose, MdPerson } from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      setUser(getStoredUser())
      checkAdminStatus()
    }
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await getData('/api/admin/stats')
      if (response.success) {
        setIsAdmin(true)
      }
    } catch (err) {
      setIsAdmin(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('user')
    await logout()
    window.location.href = '/login'
  }

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    console.log(`[Header] NAVIGATION START -> ${href}`);
    
    setShowMobileMenu(false);
    setShowUserDropdown(false);

    try {
      console.log(`[Header] Router.push calling for ${href}...`);
      router.push(href);
      
      // Fallback: If after 500ms the pathname hasn't changed, try window.location
      setTimeout(() => {
        if (window.location.pathname !== href && href !== '/') {
          console.warn(`[Header] Router.push seems stuck for ${href}, trying window.location...`);
          // Only use location.href if it's really stuck to avoid double loads
          if (window.location.pathname !== href) {
            window.location.href = href;
          }
        }
      }, 500);
    } catch (error) {
      console.error(`[Header] Router.push FAILED for ${href}:`, error);
      window.location.href = href;
    }
  }

  // Hydration safety
  if (!mounted) {
    return (
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>Stay Close</div>
        </nav>
      </header>
    )
  }

  if (!isAuthenticated()) return null

  const navLinks = [
    { href: '/messages', label: t('navigation.messages') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/contact', label: t('navigation.contact') },
    { href: '/about', label: t('navigation.about') },
    ...(isAdmin ? [{ href: '/admin', label: `🛠️ ${t('navigation.admin')}` }] : []),
  ]

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <a 
            href="/" 
            className={styles.logo} 
            onClick={(e) => handleNavigation(e, '/')}
          >
            {t('app.name')}
          </a>

          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={(e) => handleNavigation(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
            </div>

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
                    <button onClick={handleLogout} className={styles.logoutButton}>
                      <MdLogout /> {t('settings.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className={styles.mobileMenuButton}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <MdClose size={28} /> : <MdMenu size={28} />}
            </button>
          </div>
        </nav>
      </header>

      <div 
        className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`}
        onClick={() => setShowMobileMenu(false)}
      />

      <div className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={(e) => handleNavigation(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          <button onClick={handleLogout} className={styles.mobileLogoutButton}>
            <MdLogout /> {t('settings.logout')}
          </button>
        </div>
      </div>
    </>
  )
}
