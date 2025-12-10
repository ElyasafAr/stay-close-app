'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, register, loginWithGoogle } from '@/services/auth'
import { MdEmail, MdLock, MdPerson } from 'react-icons/md'
import { FaGoogle } from 'react-icons/fa'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

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
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      await loginWithGoogle()
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות עם Google')
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
              {isLogin ? 'התחברות' : 'הרשמה'}
            </h1>
            <p className={styles.subtitle}>
              {isLogin 
                ? 'ברוכים חזרה! התחברו לחשבון שלכם' 
                : 'צרו חשבון חדש כדי להתחיל'}
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
                  placeholder="אימייל"
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
                placeholder={isLogin ? 'שם משתמש או אימייל' : 'שם משתמש'}
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
                placeholder="סיסמה"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={styles.input}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'מתחבר...' : isLogin ? 'התחבר' : 'הירשם'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>או</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={styles.googleButton}
          >
            <FaGoogle className={styles.googleIcon} />
            התחבר עם Google
          </button>

          <div className={styles.switch}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setFormData({ username: '', email: '', password: '' })
              }}
              className={styles.switchButton}
            >
              {isLogin 
                ? 'אין לך חשבון? הירשם' 
                : 'יש לך כבר חשבון? התחבר'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
