'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData, putData, postData, deleteData } from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { MdDashboard, MdPeople, MdMessage, MdAttachMoney, MdSettings, MdWarning, MdRefresh, MdLocalOffer, MdAdd, MdEmail, MdCheckCircle, MdPending, MdHourglassEmpty, MdClose, MdDelete } from 'react-icons/md'
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

interface SupportTicket {
  id: number
  user_id: string | null
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: string
  email: string | null
  created_at: string
  updated_at: string
}

interface AppSettings {
  [key: string]: {
    value: string
    description: string
  }
}

interface CouponData {
  id: number
  code: string
  type: string
  value: number
  description: string | null
  max_uses: number | null
  max_uses_per_user: number
  valid_for_plans: string | null
  expires_at: string | null
  is_active: boolean
  usage_count: number
  created_at: string
}

const COUPON_TYPES = [
  { value: 'trial_extension', label: 'הארכת Trial (ימים)' },
  { value: 'discount_percent', label: 'הנחה באחוזים (%)' },
  { value: 'discount_fixed', label: 'הנחה קבועה (₪)' },
  { value: 'free_period', label: 'תקופה חינמית (ימים)' },
]

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [coupons, setCoupons] = useState<CouponData[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'tickets' | 'coupons'>('dashboard')
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    coupon_type: 'trial_extension',
    value: 7,
    description: '',
    max_uses: '',
    max_uses_per_user: 1,
    valid_for_plans: 'both',
    expires_at: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statsRes, settingsRes, couponsRes, ticketsRes] = await Promise.all([
        getData<AdminStats>('/api/admin/stats'),
        getData<AppSettings>('/api/admin/settings'),
        getData<CouponData[]>('/api/admin/coupons'),
        getData<SupportTicket[]>('/api/admin/support/tickets')
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
      
      if (couponsRes.success && couponsRes.data) {
        setCoupons(couponsRes.data)
      }

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data)
      }
    } catch (err: any) {
      if (err.message?.includes('403')) {
        // Redirect non-admins to home page
        router.push('/')
        return
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

  const handleSaveSettingDirect = async (key: string, value: string) => {
    setSaving(true)
    try {
      console.log(`🔵 [Admin] Saving setting: ${key} = ${value}`)
      const saveRes = await putData('/api/admin/settings', { key, value })
      console.log('🔵 [Admin] Save response:', saveRes)

      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Failed to save setting')
      }

      // Refresh settings
      console.log('🔵 [Admin] Refreshing settings...')
      const settingsRes = await getData<AppSettings>('/api/admin/settings')
      console.log('🔵 [Admin] Settings after refresh:', settingsRes)

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data)
        setEditedSettings(prev => ({ ...prev, [key]: value }))
        console.log(`✅ [Admin] Setting ${key} updated successfully to ${value}`)
        console.log('✅ [Admin] New settings state:', settingsRes.data[key])
      } else {
        throw new Error('Failed to refresh settings')
      }
    } catch (err: any) {
      console.error('❌ [Admin] Error saving setting:', err)
      alert(`שגיאה בשמירת הגדרה: ${err.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await putData(`/api/admin/support/tickets/${ticketId}/status?status=${status}`, {})
      loadData()
    } catch (err) {
      alert('שגיאה בעדכון סטטוס פנייה')
    }
  }

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פנייה זו?')) return
    
    try {
      await deleteData(`/api/admin/support/tickets/${ticketId}`)
      loadData()
    } catch (err) {
      alert('שגיאה במחיקת פנייה')
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

        {/* Tabs Navigation */}
        <div className={styles.tabsNav}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <MdDashboard /> דאשבורד
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <MdEmail /> פניות {tickets.length > 0 && <span className={styles.tabBadge}>{tickets.filter(t => t.status === 'open').length}</span>}
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <MdSettings /> הגדרות
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'coupons' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <MdLocalOffer /> קופונים
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className={styles.tabContent}>
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

            {/* Emergency Button */}
            <div className={styles.emergencySection}>
              <h2 className={styles.sectionTitle} style={{ color: '#ef4444' }}>
                <MdWarning size={24} />
                ניהול מערכת וחירום
              </h2>
              <div className={styles.emergencyButtons}>
                <button 
                  className={styles.emergencyButton}
                  onClick={() => {
                    if (confirm('האם להשבית Freemium? משתמשים חינמיים לא יוכלו ליצור הודעות.')) {
                      handleSaveSettingDirect('freemium_enabled', 'false')
                    }
                  }}
                >
                  השבת Freemium
                </button>
                <button 
                  className={styles.emergencyButton}
                  onClick={() => {
                    if (confirm('האם להפעיל Freemium מחדש?')) {
                      handleSaveSettingDirect('freemium_enabled', 'true')
                    }
                  }}
                  style={{ background: '#10b981' }}
                >
                  הפעל Freemium
                </button>
                <button 
                  className={styles.emergencyButton}
                  onClick={() => {
                    const isAdsEnabled = settings?.ads_enabled?.value === 'true'
                    const newValue = isAdsEnabled ? 'false' : 'true'
                    const action = isAdsEnabled ? 'להשבית' : 'להפעיל'
                    if (confirm(`האם ${action} פרסומות למשתמשים חינמיים?`)) {
                      handleSaveSettingDirect('ads_enabled', newValue)
                    }
                  }}
                  style={{ background: settings?.ads_enabled?.value === 'true' ? '#f59e0b' : '#6b7280' }}
                >
                  {settings?.ads_enabled?.value === 'true' ? 'השבת פרסומות' : 'הפעל פרסומות'}
                </button>
                <button
                  className={styles.emergencyButton}
                  onClick={async () => {
                    const isDonationEnabled = settings?.donation_enabled?.value === 'true'
                    const newValue = isDonationEnabled ? 'false' : 'true'
                    const action = isDonationEnabled ? 'להשבית' : 'להפעיל'
                    if (confirm(`האם ${action} אפשרות לתרומות/שדרוג? (משפיע על כל האפליקציה)`)) {
                      console.log(`🔵 [Admin] Toggling donation_enabled from ${isDonationEnabled} to ${newValue}`)
                      await handleSaveSettingDirect('donation_enabled', newValue)
                      console.log('✅ [Admin] Donation setting saved successfully')
                      alert(`✅ אפשרות תרומות ${isDonationEnabled ? 'הושבתה' : 'הופעלה'} בהצלחה!\n\nמשתמשים שפתוחה להם דף התרומות יצטרכו לרענן את העמוד לראות את השינוי.`)
                    }
                  }}
                  style={{ background: settings?.donation_enabled?.value === 'true' ? '#3b82f6' : '#6b7280' }}
                  disabled={saving}
                >
                  {saving ? 'שומר...' : (settings?.donation_enabled?.value === 'true' ? 'השבת תרומות (LIVE)' : 'הפעל תרומות (LIVE)')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            {/* Settings Section */}
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>
                <MdSettings size={24} />
                הגדרות מערכת
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
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className={styles.tabContent}>
            {/* Support Tickets Section */}
            <div className={styles.ticketsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <MdEmail size={24} />
                  פניות צור קשר
                </h2>
                <div className={styles.ticketStats}>
                  סך הכל: {tickets.length} | פתוחות: {tickets.filter(t => t.status === 'open').length}
                </div>
              </div>
              
              <div className={styles.ticketsList}>
                {tickets.length === 0 ? (
                  <p className={styles.noTickets}>אין פניות חדשות</p>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className={`${styles.ticketCard} ${styles[ticket.status]}`}>
                      <div className={styles.ticketHeader}>
                        <div className={styles.ticketMainInfo}>
                          <span className={styles.ticketId}>#{ticket.id}</span>
                          <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                        </div>
                        <div className={styles.ticketHeaderActions}>
                          <span className={`${styles.ticketStatus} ${styles[ticket.status]}`}>
                            {ticket.status === 'open' ? 'חדש' : 
                             ticket.status === 'in_progress' ? 'בטיפול' : 
                             ticket.status === 'resolved' ? 'טופל' : 'סגור'}
                          </span>
                          <button 
                            className={styles.deleteTicketButton}
                            onClick={() => handleDeleteTicket(ticket.id)}
                            title="מחיקת פנייה"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </div>
                      <div className={styles.ticketMeta}>
                        <span>מאת: {ticket.email || 'אורח'}</span>
                        <span>תאריך: {new Date(ticket.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className={styles.ticketMessage}>{ticket.message}</div>
                      <div className={styles.ticketActions}>
                        {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                          <button 
                            className={styles.statusButton} 
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                          >
                            <MdHourglassEmpty /> בטיפול
                          </button>
                        )}
                        {ticket.status !== 'resolved' && (
                          <button 
                            className={`${styles.statusButton} ${styles.resolve}`}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                          >
                            <MdCheckCircle /> לסמן כטופל
                          </button>
                        )}
                        {ticket.status !== 'closed' && (
                          <button 
                            className={`${styles.statusButton} ${styles.close}`}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'closed')}
                          >
                            <MdClose /> לסגור
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className={styles.tabContent}>
            {/* Coupons Section */}
            <div className={styles.couponsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <MdLocalOffer size={24} />
                  ניהול קופונים
                </h2>
                <button 
                  className={styles.addButton}
                  onClick={() => setShowCouponForm(!showCouponForm)}
                >
                  <MdAdd size={20} />
                  {showCouponForm ? 'סגור' : 'קופון חדש'}
                </button>
              </div>

              {/* Create Coupon Form */}
              {showCouponForm && (
                <div className={styles.couponForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>קוד קופון</label>
                      <input
                        type="text"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                        placeholder="WELCOME50"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>סוג</label>
                      <select
                        value={newCoupon.coupon_type}
                        onChange={(e) => setNewCoupon({...newCoupon, coupon_type: e.target.value})}
                      >
                        {COUPON_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>ערך</label>
                      <input
                        type="number"
                        value={newCoupon.value}
                        onChange={(e) => setNewCoupon({...newCoupon, value: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>תיאור (פנימי)</label>
                      <input
                        type="text"
                        value={newCoupon.description}
                        onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                        placeholder="קופון לדוגמא"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>מקס שימושים</label>
                      <input
                        type="number"
                        value={newCoupon.max_uses}
                        onChange={(e) => setNewCoupon({...newCoupon, max_uses: e.target.value})}
                        placeholder="ללא הגבלה"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>תוכניות</label>
                      <select
                        value={newCoupon.valid_for_plans}
                        onChange={(e) => setNewCoupon({...newCoupon, valid_for_plans: e.target.value})}
                      >
                        <option value="both">הכל</option>
                        <option value="monthly">חודשי בלבד</option>
                        <option value="yearly">שנתי בלבד</option>
                      </select>
                    </div>
                  </div>
                  <button
                    className={styles.createCouponButton}
                    onClick={async () => {
                      try {
                        const res = await postData('/api/admin/coupons', {
                          ...newCoupon,
                          max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
                          expires_at: newCoupon.expires_at || null
                        })
                        if (res.success) {
                          setShowCouponForm(false)
                          setNewCoupon({
                            code: '', coupon_type: 'trial_extension', value: 7,
                            description: '', max_uses: '', max_uses_per_user: 1,
                            valid_for_plans: 'both', expires_at: ''
                          })
                          loadData()
                        }
                      } catch (err: any) {
                        alert(err.message || 'שגיאה ביצירת קופון')
                      }
                    }}
                  >
                    צור קופון
                  </button>
                </div>
              )}

              {/* Coupons List */}
              <div className={styles.couponsList}>
                {coupons.length === 0 ? (
                  <p className={styles.noCoupons}>אין קופונים עדיין</p>
                ) : (
                  coupons.map(coupon => (
                    <div key={coupon.id} className={`${styles.couponCard} ${!coupon.is_active ? styles.inactive : ''}`}>
                      <div className={styles.couponHeader}>
                        <span className={styles.couponCode}>{coupon.code}</span>
                        <span className={`${styles.couponStatus} ${coupon.is_active ? styles.active : ''}`}>
                          {coupon.is_active ? 'פעיל' : 'מושבת'}
                        </span>
                      </div>
                      <div className={styles.couponDetails}>
                        <span>{COUPON_TYPES.find(t => t.value === coupon.type)?.label || coupon.type}</span>
                        <span>ערך: {coupon.value}</span>
                        <span>שימושים: {coupon.usage_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                      </div>
                      {coupon.description && (
                        <div className={styles.couponDescription}>{coupon.description}</div>
                      )}
                      <button
                        className={styles.toggleButton}
                        onClick={async () => {
                          await putData(`/api/admin/coupons/${coupon.id}/toggle`, {})
                          loadData()
                        }}
                      >
                        {coupon.is_active ? 'השבת' : 'הפעל'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
