'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData } from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { MdStar, MdCheck, MdClose, MdLocalOffer } from 'react-icons/md'
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadSubscriptionStatus()
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

  const handlePurchase = async () => {
    setProcessing(true)
    
    // Check if running in Capacitor (native app)
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.()
    
    if (isNative) {
      // Use Google Play Billing
      // This will be implemented when we add the billing plugin
      // For now, show a message
      try {
        // TODO: Implement Google Play Billing
        // 1. Install @capgo/capacitor-purchases or similar
        // 2. Configure products in Google Play Console
        // 3. Call purchase API here
        
        alert('רכישה דרך Google Play תהיה זמינה בקרוב!')
        
        // Placeholder for future implementation:
        // const productId = selectedPlan === 'monthly' 
        //   ? 'stayclose_monthly_subscription' 
        //   : 'stayclose_yearly_subscription'
        // const result = await purchaseProduct(productId)
        // if (result.success) router.push('/')
        
      } catch (error) {
        console.error('Purchase error:', error)
        alert('שגיאה ברכישה. אנא נסה שוב.')
      }
    } else {
      // Web - show message that purchases are only available in app
      alert('רכישת מנוי זמינה רק דרך האפליקציה. הורד את האפליקציה מ-Google Play.')
    }
    
    setProcessing(false)
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
  const monthlyPrice = prices?.monthly || 14.90
  const yearlyPrice = prices?.yearly || 99.90
  const yearlySavings = Math.round((1 - (yearlyPrice / 12) / monthlyPrice) * 100)

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
          <h1 className={styles.title}>שדרג לפרימיום</h1>
          <p className={styles.subtitle}>
            קבל גישה בלתי מוגבלת לכל הפיצרים
          </p>
        </div>

        {/* Launch Price Banner */}
        {isLaunchPrice && (
          <div className={styles.launchBanner}>
            <MdLocalOffer size={20} />
            <span>מחיר השקה מיוחד!</span>
          </div>
        )}

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
            <div className={styles.savingsBadge}>חסכון {yearlySavings}%</div>
            <div className={styles.planName}>שנתי</div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{yearlyPrice.toFixed(2)}</span>
              <span className={styles.priceCurrency}>₪</span>
              <span className={styles.priceInterval}>/שנה</span>
            </div>
            <div className={styles.monthlyEquivalent}>
              {(yearlyPrice / 12).toFixed(2)}₪ לחודש
            </div>
          </button>
        </div>

        {/* Purchase Button */}
        <button 
          className={styles.purchaseButton}
          onClick={handlePurchase}
          disabled={processing}
        >
          {processing ? 'מעבד...' : 'המשך לתשלום'}
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
