'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData, putData } from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { MdDashboard, MdPeople, MdMessage, MdAttachMoney, MdSettings, MdWarning, MdRefresh } from 'react-icons/md'
import styles from './page.module.css'

interface AdminStats {
  users: {
    total: number
    new_this_month: number
    new_this_week: number
    premium: number
    trial: number
    free: number
  }
  messages: {
    today: number
    this_month: number
    estimated_cost: number
  }
  subscriptions: {
    active: number
    monthly: number
    yearly: number
  }
  revenue: {
    monthly_estimate: number
  }
  charts: {
    daily_messages: Array<{ date: string; messages: number }>
  }
}

interface AppSettings {
  [key: string]: {
    value: string
    description: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statsRes, settingsRes] = await Promise.all([
        getData<AdminStats>('/api/admin/stats'),
        getData<AppSettings>('/api/admin/settings')
      ])
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data)
        // Initialize edited settings
        const initial: Record<string, string> = {}
        Object.entries(settingsRes.data).forEach(([key, val]) => {
          initial[key] = val.value
        })
        setEditedSettings(initial)
      }
    } catch (err: any) {
      if (err.message?.includes('403')) {
        setError('אין לך הרשאות מנהל')
      } else {
        setError('שגיאה בטעינת נתונים')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSetting = async (key: string) => {
    setSaving(true)
    try {
      await putData('/api/admin/settings', { key, value: editedSettings[key] })
      // Refresh settings
      const settingsRes = await getData<AppSettings>('/api/admin/settings')
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data)
      }
    } catch (err) {
      alert('שגיאה בשמירת הגדרה')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>טוען...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.error}>
          <MdWarning size={48} />
          <h2>{error}</h2>
          <button onClick={() => router.push('/')}>חזור לדף הבית</button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <MdDashboard size={32} />
            Admin Dashboard
          </h1>
          <button className={styles.refreshButton} onClick={loadData}>
            <MdRefresh size={20} />
            רענן
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <MdPeople size={28} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.users.total || 0}</div>
              <div className={styles.statLabel}>משתמשים</div>
              <div className={styles.statDetails}>
                +{stats?.users.new_this_week || 0} השבוע
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#10b981' }}>
              <MdAttachMoney size={28} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.users.premium || 0}</div>
              <div className={styles.statLabel}>מנויי פרימיום</div>
              <div className={styles.statDetails}>
                {stats?.users.trial || 0} ב-Trial
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#8b5cf6' }}>
              <MdMessage size={28} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.messages.today || 0}</div>
              <div className={styles.statLabel}>הודעות היום</div>
              <div className={styles.statDetails}>
                {stats?.messages.this_month || 0} החודש
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#f59e0b' }}>
              <MdAttachMoney size={28} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.revenue.monthly_estimate?.toFixed(0) || 0}₪</div>
              <div className={styles.statLabel}>הכנסה חודשית</div>
              <div className={styles.statDetails}>
                עלות: ${stats?.messages.estimated_cost?.toFixed(2) || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Chart */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>הודעות - 30 יום אחרונים</h2>
          <div className={styles.chart}>
            {stats?.charts.daily_messages.map((day, index) => {
              const maxMessages = Math.max(...stats.charts.daily_messages.map(d => d.messages), 1)
              const height = (day.messages / maxMessages) * 100
              return (
                <div key={index} className={styles.chartBar}>
                  <div 
                    className={styles.chartBarFill}
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.messages} הודעות`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Settings Section */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>
            <MdSettings size={24} />
            הגדרות
          </h2>
          
          <div className={styles.settingsGrid}>
            {settings && Object.entries(settings).map(([key, setting]) => (
              <div key={key} className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  {setting.description || key}
                </label>
                <div className={styles.settingInput}>
                  <input
                    type="text"
                    value={editedSettings[key] || ''}
                    onChange={(e) => setEditedSettings({
                      ...editedSettings,
                      [key]: e.target.value
                    })}
                  />
                  {editedSettings[key] !== setting.value && (
                    <button 
                      onClick={() => handleSaveSetting(key)}
                      disabled={saving}
                    >
                      שמור
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Button */}
        <div className={styles.emergencySection}>
          <h2 className={styles.sectionTitle} style={{ color: '#ef4444' }}>
            <MdWarning size={24} />
            כפתורי חירום
          </h2>
          <div className={styles.emergencyButtons}>
            <button 
              className={styles.emergencyButton}
              onClick={() => {
                if (confirm('האם להשבית Freemium? משתמשים חינמיים לא יוכלו ליצור הודעות.')) {
                  setEditedSettings({...editedSettings, freemium_enabled: 'false'})
                  handleSaveSetting('freemium_enabled')
                }
              }}
            >
              השבת Freemium
            </button>
            <button 
              className={styles.emergencyButton}
              onClick={() => {
                if (confirm('האם להפעיל Freemium מחדש?')) {
                  setEditedSettings({...editedSettings, freemium_enabled: 'true'})
                  handleSaveSetting('freemium_enabled')
                }
              }}
              style={{ background: '#10b981' }}
            >
              הפעל Freemium
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
