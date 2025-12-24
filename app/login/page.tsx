'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { login, register, loginWithGoogle } from '@/services/auth'
import { MdEmail, MdLock, MdPerson } from 'react-icons/md'
import { FaGoogle } from 'react-icons/fa'
import styles from './page.module.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔵 [LOGIN] Form submitted:', {
      isLogin,
      username: formData.username,
      email: formData.email,
      hasPassword: !!formData.password
    })

    try {
      if (isLogin) {
        console.log('🔵 [LOGIN] Attempting login...')
        await login({
          username: formData.username,
          password: formData.password,
        })
        console.log('✅ [LOGIN] Login successful, redirecting...')
      } else {
        console.log('🔵 [LOGIN] Attempting registration...')
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
        console.log('✅ [LOGIN] Registration successful, redirecting...')
      }
      // Wait a bit to ensure localStorage is saved before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/')
    } catch (err) {
      console.error('❌ [LOGIN] Error:', err)
      const errorMessage = err instanceof Error ? err.message : t('common.error')
      console.error('❌ [LOGIN] Error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    console.log('🔵 [LOGIN] Google login button clicked')

    try {
      console.log('🔵 [LOGIN] Calling loginWithGoogle...')
      await loginWithGoogle()
      console.log('✅ [LOGIN] Google login successful, redirecting...')
      // Wait a bit to ensure localStorage is saved before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/')
    } catch (err) {
      console.error('❌ [LOGIN] Google login error:', err)
      const errorMessage = err instanceof Error ? err.message : t('auth.googleLoginError')
      console.error('❌ [LOGIN] Error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {isLogin ? t('auth.login') : t('auth.register')}
            </h1>
            <p className={styles.subtitle}>
              {isLogin 
                ? t('auth.loginSubtitle') 
                : t('auth.registerSubtitle')}
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <MdEmail className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!isLogin}
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <MdPerson className={styles.inputIcon} />
              <input
                type="text"
                placeholder={isLogin ? t('auth.usernameOrEmail') : t('auth.username')}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <MdLock className={styles.inputIcon} />
              <input
                type="password"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={styles.input}
                minLength={6}
              />
            </div>

            {!isLogin && (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>
                  {t('auth.agreedToTerms')}
                  <a href="/terms" target="_blank" className={styles.link}>{t('auth.terms')}</a>
                  {' '}{t('auth.or')}{' '}
                  <a href="/privacy" target="_blank" className={styles.link}>{t('auth.privacy')}</a>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !agreedToTerms)}
              className={styles.submitButton}
            >
              {loading 
                ? (isLogin ? t('auth.loggingIn') : t('auth.registering')) 
                : (isLogin ? t('auth.loginButton') : t('auth.registerButton'))}
            </button>
          </form>

          <div className={styles.divider}>
            <span>{t('auth.or')}</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={styles.googleButton}
          >
            <FaGoogle className={styles.googleIcon} />
            {t('auth.googleLogin')}
          </button>

          <div className={styles.switch}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setFormData({ username: '', email: '', password: '' })
                setAgreedToTerms(false)
              }}
              className={styles.switchButton}
            >
              {isLogin 
                ? t('auth.noAccount') 
                : t('auth.hasAccount')}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
