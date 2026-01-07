'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
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
  const { t, language } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{success: boolean; message?: string; type?: string; value?: number} | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [donationEnabled, setDonationEnabled] = useState(false)

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
      alert(t('paywall.paymentCancelled'))
      // Remove query params
      window.history.replaceState({}, '', '/paywall')
    }

    // Reload data when page becomes visible (e.g., when navigating back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔵 [Paywall] Page became visible, reloading status...')
        loadSubscriptionStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', () => {
      console.log('🔵 [Paywall] Window focused, reloading status...')
      loadSubscriptionStatus()
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', loadSubscriptionStatus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const loadSubscriptionStatus = async () => {
    try {
      console.log('🔵 [Paywall] Loading subscription status...');
      const response = await getData<any>('/api/subscription/status')
      console.log('🔵 [Paywall] Subscription status response:', response);
      if (response.success && response.data) {
        setSubscriptionData(response.data)
        
        // If already premium, redirect
        if (response.data.status === 'premium') {
          console.log('🔵 [Paywall] User is already premium, redirecting home');
          router.push('/')
        }
      }

      // Also check if donation is enabled from usage status
      console.log('🔵 [Paywall] Checking usage status for donation toggle...');
      const usageRes = await getData<any>('/api/usage/status')
      console.log('🔵 [Paywall] Usage status response:', usageRes);
      if (usageRes.success && usageRes.data) {
        const isEnabled = usageRes.data.donation_enabled === true;
        console.log('🔵 [Paywall] Donation enabled from server:', isEnabled);
        setDonationEnabled(isEnabled)
      }
    } catch (error) {
      console.error('❌ [Paywall] Error loading subscription status:', error)
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
        message: error.message || t('paywall.coupon.invalid')
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
        alert(response.data?.error || t('common.error'))
        setProcessing(false)
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || t('common.error'))
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>{t('common.loading')}</div>
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
          onClick={() => router.push('/messages')}
        >
          <MdClose size={24} />
        </button>

        <div className={styles.header}>
          <MdStar className={styles.crownIcon} size={48} />
          <h1 className={styles.title}>{t('paywall.title')}</h1>
          <p className={styles.subtitle}>
            {t('paywall.subtitle')}
          </p>
        </div>


        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>{t('paywall.features.unlimitedMessages')}</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>{t('paywall.features.unlimitedContacts')}</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>{t('paywall.features.allTones')}</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>{t('paywall.features.customReminders')}</span>
          </div>
          <div className={styles.feature}>
            <MdCheck className={styles.featureIcon} />
            <span>{t('paywall.features.prioritySupport')}</span>
          </div>
        </div>

        {/* Pricing Cards - Always Visible */}
        <div className={styles.pricingCards}>
          {/* Monthly */}
          <button
            className={`${styles.pricingCard} ${selectedPlan === 'monthly' ? styles.selected : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className={styles.planName}>{t('paywall.plans.monthly')}</div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{monthlyPrice.toFixed(2)}</span>
              <span className={styles.priceCurrency}>₪</span>
              <span className={styles.priceInterval}>/{language === 'he' ? 'חודש' : 'month'}</span>
            </div>
          </button>

          {/* Yearly */}
          <button
            className={`${styles.pricingCard} ${selectedPlan === 'yearly' ? styles.selected : ''} ${styles.recommended}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className={styles.savingsBadge}>{t('paywall.plans.recommended')}</div>
            <div className={styles.planName}>{t('paywall.plans.yearly')}</div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{yearlyPrice.toFixed(2)}</span>
              <span className={styles.priceCurrency}>₪</span>
              <span className={styles.priceInterval}>/{language === 'he' ? 'שנה' : 'year'}</span>
            </div>
            <div className={styles.monthlyEquivalent}>
              {t('paywall.plans.monthlyEquivalent').replace('{{amount}}', (yearlyPrice / 12).toFixed(2))}
              <br />
              <small style={{ fontSize: '0.85em', opacity: 0.8 }}>
                {t('paywall.plans.savingsNote')}
              </small>
            </div>
          </button>
        </div>

        {/* Coupon Input - Always Visible */}
        <div className={styles.couponSection}>
          <div className={styles.couponInput}>
            <MdConfirmationNumber size={20} />
            <input
              type="text"
              placeholder={t('paywall.coupon.placeholder')}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={applyingCoupon}
            />
            <button 
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || applyingCoupon}
            >
              {applyingCoupon ? '...' : t('paywall.coupon.apply')}
            </button>
          </div>
          {couponResult && (
            <div className={`${styles.couponResult} ${couponResult.success ? styles.success : styles.error}`}>
              {couponResult.message}
            </div>
          )}
        </div>

        {/* Purchase Button - Only this is controlled by the switch */}
        {donationEnabled ? (
          <button 
            className={styles.purchaseButton}
            onClick={handlePurchase}
            disabled={processing}
          >
            {processing ? t('paywall.processing') : t('paywall.purchase')}
          </button>
        ) : (
          <div className={styles.comingSoonBox}>
            <h2 className={styles.comingSoonTitle}>{t('paywall.comingSoon.title')}</h2>
            <p className={styles.comingSoonText}>
              {t('paywall.comingSoon.description')}
            </p>
          </div>
        )}

        {/* Terms */}
        <p className={styles.terms}>
          {t('paywall.termsNote')}
          <a href="/terms">{t('auth.terms')}</a>
          {' '}{t('auth.or')}{' '}
          <a href="/privacy">{t('auth.privacy')}</a>
        </p>

        {/* Trial info */}
        {subscriptionData?.status === 'trial' && subscriptionData.trial_days_remaining > 0 && (
          <div className={styles.trialInfo}>
            {t('paywall.trialDaysRemaining').replace('{{count}}', subscriptionData.trial_days_remaining.toString())}
          </div>
        )}
      </div>
    </main>
  )
}
