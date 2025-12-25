'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData } from '@/services/api'
import { MdLogout, MdMenu, MdClose, MdPerson } from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const pathname = usePathname()
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

  const handleLinkClick = () => {
    setShowMobileMenu(false)
    setShowUserDropdown(false)
  }

  // Hydration safety: render a consistent empty skeleton on server
  if (!mounted) {
    return (
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>Stay Close</div>
        </nav>
      </header>
    )
  }

  // If user is not authenticated, don't show the header navigation
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
          <Link href="/" className={styles.logo} onClick={handleLinkClick}>
            {t('app.name')}
          </Link>

          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={handleLinkClick}
                >
                  {link.label}
                </Link>
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

      {/* Mobile Menu Overlay */}
      <div 
        className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`}
        onClick={() => setShowMobileMenu(false)}
      />

      {/* Mobile Menu - Controlled by CSS for stability */}
      <div className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={handleLinkClick}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className={styles.mobileLogoutButton}>
            <MdLogout /> {t('settings.logout')}
          </button>
        </div>
      </div>
    </>
  )
}
