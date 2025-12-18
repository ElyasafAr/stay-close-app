# 🚀 תוכנית מימוש Allpay - Stay Close

## 📋 סקירה כללית

מעבר ממערכת Google Play Billing למערכת Allpay לתשלומים חודשיים ושנתיים.

### 💰 מודל תמחור:
- **תשלום חודשי:** 5₪/חודש (30 ימים)
- **תשלום שנתי:** 50₪/שנה (שווה ל-10 חודשים, אבל מקבל 12 חודשים - 2 חודשים במתנה!)

---

## 🎯 מה צריך לעשות?

### 1. **Backend Changes**

#### א. עדכון Database Schema
- [ ] להוסיף שדות ל-`Subscription` model:
  - `allpay_order_id` (String) - מזהה הזמנה מ-Allpay
  - `allpay_payment_id` (String) - מזהה תשלום מ-Allpay
  - `allpay_recurring_id` (String) - מזהה תשלום חוזר (אם יש)
- [ ] לשמור את השדות הקיימים של Google Play (למקרה של משתמשים קיימים)

#### ב. יצירת Allpay Service
- [ ] ליצור `backend/allpay_service.py` עם:
  - `create_payment_link()` - יצירת קישור תשלום
  - `verify_webhook_signature()` - אימות חתימת Webhook
  - `process_allpay_payment()` - עיבוד תשלום מ-Webhook
  - `create_recurring_payment()` - יצירת תשלום חודשי

#### ג. Webhook Endpoint
- [ ] להוסיף `/api/allpay/webhook` ב-`backend/main.py`
- [ ] לטפל ב-Webhook events:
  - `payment.success` - תשלום הושלם
  - `recurring.payment.success` - תשלום חודשי הושלם

#### ד. עדכון Subscription Service
- [ ] לעדכן `create_subscription()` לתמוך ב-Allpay
- [ ] להוסיף `create_allpay_subscription()` - יצירת מנוי דרך Allpay

#### ה. עדכון Usage Limiter
- [ ] `get_user_subscription_status()` כבר עובד - רק צריך לוודא שהוא מזהה Allpay subscriptions

#### ו. תמחור
- [ ] תשלום חודשי: **5₪/חודש** (30 ימים)
- [ ] תשלום שנתי: **50₪/שנה** (משלם על 10 חודשים, מקבל 12 חודשים - 2 חודשים במתנה!)

---

### 2. **Frontend Changes**

#### א. עדכון Paywall Page
- [ ] לעדכן `app/paywall/page.tsx`:
  - להחליף "מנוי" ל"תרומה"
  - להוסיף כפתור "תרום" שמפנה ל-Allpay
  - להסיר את Google Play Billing logic

#### ב. יצירת Payment Flow
- [ ] להוסיף endpoint `/api/allpay/create-payment` ב-Backend
- [ ] Frontend קורא ל-endpoint → מקבל `payment_url`
- [ ] Frontend מעביר את המשתמש ל-`payment_url` של Allpay
- [ ] אחרי תשלום → Allpay מעביר חזרה ל-`success_url`
- [ ] Frontend בודק סטטוס → מעדכן UI

#### ג. עדכון UI
- [ ] לעדכן טקסטים מ"מנוי" ל"תרומה"
- [ ] לעדכן `UsageBanner.tsx` - "תרום" במקום "שדרג"

---

### 3. **Environment Variables**

#### ב-Railway (Backend):
- [ ] `ALLPAY_LOGIN` - שם משתמש ב-Allpay
- [ ] `ALLPAY_API_KEY` - מפתח API של Allpay
- [ ] `ALLPAY_WEBHOOK_SECRET` - סוד לאימות Webhooks
- [ ] `ALLPAY_SUCCESS_URL` - URL להחזרה אחרי תשלום מוצלח
- [ ] `ALLPAY_CANCEL_URL` - URL להחזרה אחרי ביטול

#### ב-Frontend (אופציונלי):
- [ ] `NEXT_PUBLIC_ALLPAY_SUCCESS_URL` - URL להחזרה

---

### 4. **Allpay Dashboard Setup**

#### ב-Allpay Dashboard:
- [ ] ליצור API Integration
- [ ] להגדיר Webhook URL: `https://your-backend.railway.app/api/allpay/webhook`
- [ ] להגדיר Recurring Payments
- [ ] להגדיר מוצרים:
  - Monthly: **5₪/חודש** (30 ימים)
  - Yearly: **50₪/שנה** (משלם על 10 חודשים, מקבל 12 חודשים - 2 חודשים במתנה!)

---

## 📝 פירוט טכני

### 1. Allpay Service (`backend/allpay_service.py`)

```python
# -*- coding: utf-8 -*-
"""
Allpay Service - Handles Allpay payment integration
"""

import os
import hashlib
import hmac
import json
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from models import User, Subscription


def utc_now():
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


def generate_allpay_signature(params: dict, api_key: str) -> str:
    """
    Generate SHA256 HMAC signature for Allpay API requests
    
    Steps:
    1. Remove 'sign' parameter if present
    2. Exclude empty values
    3. Sort parameters alphabetically
    4. Concatenate values with ':'
    5. Append API key
    6. Generate SHA256 HMAC
    """
    # Remove sign parameter
    params = {k: v for k, v in params.items() if k != 'sign' and v}
    
    # Sort alphabetically
    sorted_params = sorted(params.items())
    
    # Concatenate values
    concatenated = ':'.join(str(v) for _, v in sorted_params)
    
    # Append API key
    string_to_sign = f"{concatenated}:{api_key}"
    
    # Generate SHA256 HMAC
    signature = hmac.new(
        api_key.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature


def verify_webhook_signature(data: dict, signature: str, secret: str) -> bool:
    """Verify Allpay webhook signature"""
    expected_signature = generate_allpay_signature(data, secret)
    return hmac.compare_digest(expected_signature, signature)


def create_payment_link(
    db: Session,
    user_id: str,
    plan_type: str,  # 'monthly' or 'yearly'
    amount: float
) -> Dict[str, Any]:
    """
    Create a payment link in Allpay
    
    Returns:
        {
            'success': bool,
            'payment_url': str,
            'order_id': str,
            'error': str
        }
    """
    login = os.getenv('ALLPAY_LOGIN')
    api_key = os.getenv('ALLPAY_API_KEY')
    success_url = os.getenv('ALLPAY_SUCCESS_URL')
    cancel_url = os.getenv('ALLPAY_CANCEL_URL')
    
    if not all([login, api_key, success_url]):
        return {
            'success': False,
            'error': 'Allpay credentials not configured'
        }
    
    # Generate order ID
    order_id = f"stayclose_{user_id}_{int(utc_now().timestamp())}"
    
    # Prepare request
    description_map = {
        'monthly': 'תרומה חודשית - Stay Close (5₪/חודש)',
        'yearly': 'תרומה שנתית - Stay Close (50₪/שנה - שווה ל-10 חודשים)'
    }
    
    params = {
        'login': login,
        'order_id': order_id,
        'amount': str(amount),
        'currency': 'ILS',
        'description': description_map.get(plan_type, f'תרומה - Stay Close ({plan_type})'),
        'success_url': success_url,
        'cancel_url': cancel_url,
        'notifications_url': f"{os.getenv('API_URL')}/api/allpay/webhook",
        'recurring': '1' if plan_type == 'monthly' else '0',  # Enable recurring only for monthly
    }
    
    # Generate signature
    params['sign'] = generate_allpay_signature(params, api_key)
    
    # Send request to Allpay
    try:
        response = requests.post(
            'https://secure.allpay.co.il/api/v1/payments',
            json=params,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                return {
                    'success': True,
                    'payment_url': data.get('payment_url'),
                    'order_id': order_id
                }
        
        return {
            'success': False,
            'error': f"Allpay API error: {response.text}"
        }
    except Exception as e:
        return {
            'success': False,
            'error': f"Error creating payment link: {str(e)}"
        }


def process_allpay_payment(
    db: Session,
    webhook_data: dict
) -> Dict[str, Any]:
    """
    Process Allpay webhook payment
    
    Webhook data structure:
    {
        'order_id': str,
        'payment_id': str,
        'amount': str,
        'status': int,  # 1 = success
        'buyer_name': str,
        'sign': str
    }
    """
    # Verify signature
    secret = os.getenv('ALLPAY_WEBHOOK_SECRET')
    if not secret:
        return {'success': False, 'error': 'Webhook secret not configured'}
    
    received_signature = webhook_data.get('sign')
    if not received_signature:
        return {'success': False, 'error': 'No signature in webhook'}
    
    # Verify signature
    if not verify_webhook_signature(webhook_data, received_signature, secret):
        return {'success': False, 'error': 'Invalid webhook signature'}
    
    # Check payment status
    if webhook_data.get('status') != 1:
        return {'success': False, 'error': 'Payment not successful'}
    
    # Extract order_id (format: stayclose_{user_id}_{timestamp})
    order_id = webhook_data.get('order_id', '')
    if not order_id.startswith('stayclose_'):
        return {'success': False, 'error': 'Invalid order ID format'}
    
    # Extract user_id from order_id
    parts = order_id.split('_')
    if len(parts) < 2:
        return {'success': False, 'error': 'Cannot extract user_id from order_id'}
    
    user_id = parts[1]
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {'success': False, 'error': 'User not found'}
    
    # Check if subscription already exists for this order
    existing = db.query(Subscription).filter(
        Subscription.allpay_order_id == order_id
    ).first()
    
    if existing:
        # Update existing subscription
        existing.status = 'active'
        existing.allpay_payment_id = webhook_data.get('payment_id')
        db.commit()
        return {
            'success': True,
            'message': 'Subscription updated',
            'subscription_id': existing.id
        }
    
    # Determine plan type from order_id or amount
    amount = float(webhook_data.get('amount', 0))
    plan_type = 'monthly'  # Default to monthly
    
    # Create subscription
    from subscription_service import create_allpay_subscription
    
    subscription = create_allpay_subscription(
        db=db,
        user_id=user_id,
        plan_type=plan_type,
        allpay_order_id=order_id,
        allpay_payment_id=webhook_data.get('payment_id'),
        price_paid=amount
    )
    
    return {
        'success': True,
        'message': 'Subscription created',
        'subscription_id': subscription.id
    }
```

---

### 2. עדכון Subscription Service

```python
# Add to backend/subscription_service.py

def create_allpay_subscription(
    db: Session,
    user_id: str,
    plan_type: str,  # 'monthly' or 'yearly'
    allpay_order_id: str,
    allpay_payment_id: str,
    price_paid: float,
    allpay_recurring_id: Optional[str] = None
) -> Subscription:
    """Create a new subscription from Allpay payment"""
    
    # Calculate expiry date
    if plan_type == 'monthly':
        expires_at = utc_now() + timedelta(days=30)
    else:  # yearly - משלם על 10 חודשים, מקבל 12 חודשים (2 חודשים במתנה)
        expires_at = utc_now() + timedelta(days=365)  # 12 months = 365 days
    
    subscription = Subscription(
        user_id=user_id,
        plan_type=plan_type,
        status='active',
        allpay_order_id=allpay_order_id,
        allpay_payment_id=allpay_payment_id,
        allpay_recurring_id=allpay_recurring_id,
        started_at=utc_now(),
        expires_at=expires_at,
        price_paid=price_paid,
        is_launch_price=False  # Allpay doesn't have launch pricing
    )
    
    db.add(subscription)
    
    # Update user status
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.subscription_status = 'premium'
    
    db.commit()
    db.refresh(subscription)
    
    print(f"✅ [ALLPAY] Created {plan_type} subscription for user {user_id}")
    return subscription
```

---

### 3. Webhook Endpoint (`backend/main.py`)

```python
@app.post("/api/allpay/webhook")
async def allpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Allpay webhook notifications
    
    This endpoint receives webhooks from Allpay when:
    - Payment is completed
    - Recurring payment is processed
    """
    try:
        data = await request.json()
        
        from allpay_service import process_allpay_payment
        
        result = process_allpay_payment(db, data)
        
        if result.get('success'):
            print(f"✅ [ALLPAY WEBHOOK] Payment processed: {result.get('message')}")
            return {"status": "success"}
        else:
            print(f"❌ [ALLPAY WEBHOOK] Error: {result.get('error')}")
            return {"status": "error", "error": result.get('error')}, 400
            
    except Exception as e:
        print(f"❌ [ALLPAY WEBHOOK] Exception: {e}")
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "error": str(e)}, 500


@app.post("/api/allpay/create-payment")
async def create_allpay_payment(
    request: AllpayPaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a payment link in Allpay
    
    Request body:
    {
        "plan_type": "monthly" | "yearly"
    }
    """
    user_id = current_user["user_id"]
    
    from allpay_service import create_payment_link
    from subscription_service import get_prices
    
    # Get price
    prices = get_prices(db)
    amount = prices[request.plan_type]
    
    # Create payment link
    result = create_payment_link(db, user_id, request.plan_type, amount)
    
    if result.get('success'):
        return {
            "success": True,
            "payment_url": result.get('payment_url'),
            "order_id": result.get('order_id')
        }
    else:
        return {
            "success": False,
            "error": result.get('error')
        }, 400
```

---

### 4. Frontend Changes (`app/paywall/page.tsx`)

```typescript
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
    }
  } catch (error: any) {
    alert(error.message || 'שגיאה ביצירת קישור תשלום')
  } finally {
    setProcessing(false)
  }
}
```

---

## 🔐 אבטחה

### 1. Webhook Signature Verification
- ✅ **חובה!** - תמיד לבדוק את החתימה
- ✅ להשתמש ב-`hmac.compare_digest()` למניעת timing attacks

### 2. Order ID Format
- ✅ להשתמש בפורמט: `stayclose_{user_id}_{timestamp}`
- ✅ לבדוק שהמשתמש קיים לפני יצירת subscription

### 3. Idempotency
- ✅ לבדוק אם subscription כבר קיים לפי `allpay_order_id`
- ✅ למנוע יצירת subscriptions כפולים

---

## 📊 Database Migration

```sql
-- Add Allpay fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN allpay_order_id VARCHAR(255) UNIQUE,
ADD COLUMN allpay_payment_id VARCHAR(255),
ADD COLUMN allpay_recurring_id VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_allpay_order_id ON subscriptions(allpay_order_id);
```

---

## ✅ Checklist מימוש

### Backend:
- [ ] יצירת `backend/allpay_service.py`
- [ ] עדכון `backend/models.py` - הוספת שדות Allpay
- [ ] עדכון `backend/subscription_service.py` - הוספת `create_allpay_subscription()`
- [ ] הוספת Webhook endpoint ב-`backend/main.py`
- [ ] הוספת `/api/allpay/create-payment` endpoint
- [ ] Database migration - הוספת שדות Allpay
- [ ] הגדרת Environment Variables ב-Railway

### Frontend:
- [ ] עדכון `app/paywall/page.tsx` - Allpay integration
- [ ] עדכון טקסטים מ"מנוי" ל"תרומה"
- [ ] עדכון `components/UsageBanner.tsx`
- [ ] בדיקת Success/Cancel URLs

### Allpay Dashboard:
- [ ] יצירת API Integration
- [ ] הגדרת Webhook URL
- [ ] הגדרת Recurring Payments
- [ ] בדיקת Test Mode

### Testing:
- [ ] בדיקת יצירת payment link
- [ ] בדיקת Webhook processing
- [ ] בדיקת Subscription creation
- [ ] בדיקת Recurring payments
- [ ] בדיקת Signature verification

---

## 🚀 שלבי מימוש מומלצים

1. **Phase 1: Setup**
   - הגדרת Allpay Dashboard
   - הוספת Environment Variables
   - Database Migration

2. **Phase 2: Backend**
   - יצירת Allpay Service
   - Webhook Endpoint
   - Payment Link Creation

3. **Phase 3: Frontend**
   - עדכון Paywall Page
   - עדכון UI טקסטים

4. **Phase 4: Testing**
   - Test Mode ב-Allpay
   - בדיקת Webhooks
   - בדיקת Recurring Payments

5. **Phase 5: Production**
   - מעבר ל-Production Mode
   - ניטור Webhooks
   - בדיקת תשלומים אמיתיים

---

## 📚 משאבים

- [Allpay API Documentation](https://www.allpay.co.il/en/api-reference)
- [Allpay Webhooks Guide](https://www.allpay.co.il/en/help/webhooks)
- [Allpay Recurring Payments](https://www.allpay.co.il/en/help/recurring)

---

## ❓ שאלות נפוצות

**Q: מה קורה עם משתמשים קיימים שיש להם Google Play subscriptions?**
A: הם ימשיכו לעבוד - השדות של Google Play נשארים. רק משתמשים חדשים יעברו ל-Allpay.

**Q: איך מטפלים ב-Recurring Payments?**
A: Allpay שולח Webhook כל חודש כשהתשלום החודשי מתבצע. השרת מעדכן את ה-subscription אוטומטית.

**Q: מה ההבדל בין תשלום חודשי לשנתי?**
A: 
- **חודשי:** 5₪/חודש - תשלום חוזר כל חודש, גישה ל-30 ימים
- **שנתי:** 50₪/שנה - תשלום חד-פעמי, משלם על 10 חודשים (50₪) אבל מקבל 12 חודשים (2 חודשים במתנה!)

**Q: מה אם Webhook נכשל?**
A: Allpay מנסה 3 פעמים. אם זה נכשל, צריך לבדוק ידנית או ליצור מנגנון retry.

**Q: איך בודקים אם תשלום הושלם?**
A: דרך Webhook - Allpay שולח POST request עם כל הפרטים.

---

**מוכן להתחיל?** 🚀
