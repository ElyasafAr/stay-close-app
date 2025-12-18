'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData, postData } from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { MdStar, MdCheck, MdClose, MdLocalOffer, MdConfirmationNumber } from 'react-icons/md'
import styles from './page.module.css'

interface SubscriptionStatus {
  status: 'trial' | 'free' | 'premium'
  trial_days_remaining: number
  subscription: {
    id: number
    plan_type: string
    expires_at: string
    is_launch_price: boolean
  } | null
  prices: {
    monthly: number
    yearly: number
    is_launch_price: boolean
  }
}

export default function PaywallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{success: boolean; message?: string; type?: string; value?: number} | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadSubscriptionStatus()
    
    // Check for success/cancel from Allpay
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const cancel = urlParams.get('cancel')
    
    if (success === 'true') {
      // Payment successful - reload status
      setTimeout(() => {
        loadSubscriptionStatus()
        // Remove query params
        window.history.replaceState({}, '', '/paywall')
      }, 1000)
    } else if (cancel === 'true') {
      // Payment cancelled
      alert('התשלום בוטל')
      // Remove query params
      window.history.replaceState({}, '', '/paywall')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const loadSubscriptionStatus = async () => {
    try {
      const response = await getData<SubscriptionStatus>('/api/subscription/status')
      if (response.success && response.data) {
        setSubscriptionData(response.data)
        
        // If already premium, redirect
        if (response.data.status === 'premium') {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error loading subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setApplyingCoupon(true)
    setCouponResult(null)
    
    try {
      const response = await postData<{success: boolean; message?: string; type?: string; value?: number}>('/api/coupon/apply', {
        code: couponCode.trim(),
        plan_type: selectedPlan
      })
      
      if (response.success && response.data) {
        setCouponResult({
          success: true,
          message: response.data.message,
          type: response.data.type,
          value: response.data.value
        })
        
        // If coupon gives free period or trial extension, refresh status
        if (response.data.type === 'free_period' || response.data.type === 'trial_extension') {
          await loadSubscriptionStatus()
        }
      }
    } catch (error: any) {
      setCouponResult({
        success: false,
        message: error.message || 'קופון לא תקף'
      })
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handlePurchase = async () => {
    setProcessing(true)
    
    try {
      // Create Allpay payment link
      const response = await postData<{
        success: boolean
        payment_url?: string
        order_id?: string
        error?: string
      }>('/api/allpay/create-payment', {
        plan_type: selectedPlan
      })
      
      if (response.success && response.data?.payment_url) {
        // Redirect to Allpay payment page
        window.location.href = response.data.payment_url
      } else {
        alert(response.data?.error || 'שגיאה ביצירת קישור תשלום')
        setProcessing(false)
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'שגיאה ביצירת קישור תשלום')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>טוען...</div>
      </main>
    )
  }

  const prices = subscriptionData?.prices
  const isLaunchPrice = prices?.is_launch_price
  const monthlyPrice = prices?.monthly || 5.00
  const yearlyPrice = prices?.yearly || 50.00
  // חיסכון: משלם על 10 חודשים (50₪), מקבל 12 חודשים
  // חיסכון = 2 חודשים (10₪) מתוך 12 חודשים חודשי (60₪)
  const yearlySavings = Math.round((10 / 60) * 100)  // ~17%

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <button 
          className={styles.closeButton}
          onClick={() => router.back()}
        >
          <MdClose size={24} />
        </button>

        <div className={styles.header}>
          <MdStar className={styles.crownIcon} size={48} />
          <h1 className={styles.title}>תרום ותקבל גישה מלאה</h1>
          <p className={styles.subtitle}>
            תמיכה בפרויקט = גישה בלתי מוגבלת לכל הפיצרים
          </p>
        </div>


        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>הודעות ללא הגבלה</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>אנשי קשר ללא הגבלה</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>כל הטונים והסגנונות</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>התראות מותאמות אישית</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>תמיכה בעדיפות</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={styles.pricingCards}>
          {/* Monthly */}
          <button
            className={`${styles.pricingCard} ${selectedPlan === 'monthly' ? styles.selected : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className={styles.planName}>חודשי</div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{monthlyPrice.toFixed(2)}</span>
              <span className={styles.priceCurrency}>₪</span>
              <span className={styles.priceInterval}>/חודש</span>
            </div>
          </button>

          {/* Yearly */}
          <button
            className={`${styles.pricingCard} ${selectedPlan === 'yearly' ? styles.selected : ''} ${styles.recommended}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className={styles.savingsBadge}>2 חודשים במתנה!</div>
            <div className={styles.planName}>שנתי</div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{yearlyPrice.toFixed(2)}</span>
              <span className={styles.priceCurrency}>₪</span>
              <span className={styles.priceInterval}>/שנה</span>
            </div>
            <div className={styles.monthlyEquivalent}>
              {(yearlyPrice / 12).toFixed(2)}₪ לחודש (12 חודשים)
              <br />
              <small style={{ fontSize: '0.85em', opacity: 0.8 }}>
                משלם על 10 חודשים, מקבל 12
              </small>
            </div>
          </button>
        </div>

        {/* Coupon Input */}
        <div className={styles.couponSection}>
          <div className={styles.couponInput}>
            <MdConfirmationNumber size={20} />
            <input
              type="text"
              placeholder="יש לך קוד קופון?"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={applyingCoupon}
            />
            <button 
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || applyingCoupon}
            >
              {applyingCoupon ? '...' : 'הפעל'}
            </button>
          </div>
          {couponResult && (
            <div className={`${styles.couponResult} ${couponResult.success ? styles.success : styles.error}`}>
              {couponResult.message}
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <button 
          className={styles.purchaseButton}
          onClick={handlePurchase}
          disabled={processing}
        >
          {processing ? 'מעבד...' : 'תרום עכשיו'}
        </button>

        {/* Terms */}
        <p className={styles.terms}>
          בלחיצה על ״המשך לתשלום״ אתה מסכים ל
          <a href="/terms">תנאי השימוש</a>
          {' '}ול
          <a href="/privacy">מדיניות הפרטיות</a>
        </p>

        {/* Trial info */}
        {subscriptionData?.status === 'trial' && subscriptionData.trial_days_remaining > 0 && (
          <div className={styles.trialInfo}>
            נותרו לך {subscriptionData.trial_days_remaining} ימי ניסיון
          </div>
        )}
      </div>
    </main>
  )
}
