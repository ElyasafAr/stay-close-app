'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { login, register, loginWithGoogle, clearLogoutFlag } from '@/services/auth'
import { MdEmail, MdLock, MdPerson } from 'react-icons/md'
import { FaGoogle } from 'react-icons/fa'
import styles from './page.module.css'

function LoginFields() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    setMounted(true)
    console.log('🚪 [LoginPage] mounted, clearing logout flag');
    clearLogoutFlag();
  }, [searchParams])

  const handleGoogleLogin = async () => {
    console.log('🔵 [LoginPage] Google login button clicked');
    try {
      setLoading(true)
      setError(null)
      console.log('🔵 [LoginPage] Calling loginWithGoogle...');
      await loginWithGoogle()
      console.log('✅ [LoginPage] Google login successful, redirecting to /messages');
      router.replace('/messages')
    } catch (err: any) {
      console.error('❌ [LoginPage] Google login error:', err);
      setError(err.message || t('auth.googleLoginError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        })
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
      }
      router.replace('/messages')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // אל תרנדר את הטופס עד שהרכיב מותקן (מונע שגיאות hydration)
  if (!mounted) return <div className={styles.container} />

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{isLogin ? t('auth.login') : t('auth.register')}</h1>
          <p className={styles.subtitle}>{isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.inputIcon}>
              <MdPerson />
            </div>
            <input
              type="text"
              className={styles.input}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder={t('auth.username')}
            />
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <div className={styles.inputIcon}>
                <MdEmail />
              </div>
              <input
                type="email"
                className={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder={t('auth.email')}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.inputIcon}>
              <MdLock />
            </div>
            <input
              type="password"
              className={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder={t('auth.password')}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? (isLogin ? t('auth.loggingIn') : t('auth.registering')) : (isLogin ? t('auth.loginButton') : t('auth.registerButton'))}
          </button>
        </form>

        <div className={styles.divider}>
          <span>{t('auth.or')}</span>
        </div>

        <button onClick={handleGoogleLogin} className={styles.googleButton} disabled={loading}>
          <FaGoogle className={styles.googleIcon} />
          {t('auth.googleLogin')}
        </button>

        <div className={styles.switch}>
          <p className={styles.subtitle}>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className={styles.switchButton}>
              {isLogin ? t('auth.register') : t('auth.login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <LoginFields />
      </Suspense>
    </main>
  )
}
