# -*- coding: utf-8 -*-
"""
Subscription Service - Manages subscriptions and Google Play Billing
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import os
import json

from models import User, Subscription, AppSettings


def utc_now():
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


def get_setting(db: Session, key: str, default: str = None) -> str:
    """Get a setting value from app_settings table"""
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    return setting.value if setting else default


def is_launch_pricing_active(db: Session) -> bool:
    """Check if launch pricing is active"""
    value = get_setting(db, 'launch_pricing_active', 'true')
    return value.lower() in ('true', '1', 'yes')


def get_prices(db: Session) -> Dict[str, float]:
    """Get current prices (launch or regular)"""
    if is_launch_pricing_active(db):
        return {
            'monthly': float(get_setting(db, 'monthly_price_launch', '9.90')),
            'yearly': float(get_setting(db, 'yearly_price_launch', '69.90'))
        }
    else:
        return {
            'monthly': float(get_setting(db, 'monthly_price_regular', '14.90')),
            'yearly': float(get_setting(db, 'yearly_price_regular', '99.90'))
        }


def get_active_subscription(db: Session, user_id: str) -> Optional[Subscription]:
    """Get the active subscription for a user"""
    return db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == 'active',
        Subscription.expires_at > utc_now()
    ).first()


def create_subscription(
    db: Session,
    user_id: str,
    plan_type: str,  # 'monthly' or 'yearly'
    google_order_id: str,
    google_product_id: str,
    google_purchase_token: str,
    price_paid: float
) -> Subscription:
    """Create a new subscription"""
    
    # Calculate expiry date
    if plan_type == 'monthly':
        expires_at = utc_now() + timedelta(days=30)
    else:  # yearly
        expires_at = utc_now() + timedelta(days=365)
    
    subscription = Subscription(
        user_id=user_id,
        plan_type=plan_type,
        status='active',
        google_order_id=google_order_id,
        google_product_id=google_product_id,
        google_purchase_token=google_purchase_token,
        started_at=utc_now(),
        expires_at=expires_at,
        price_paid=price_paid,
        is_launch_price=is_launch_pricing_active(db)
    )
    
    db.add(subscription)
    
    # Update user status
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.subscription_status = 'premium'
    
    db.commit()
    db.refresh(subscription)
    
    print(f"✅ [SUBSCRIPTION] Created {plan_type} subscription for user {user_id}")
    return subscription


def cancel_subscription(db: Session, user_id: str) -> bool:
    """Cancel a user's subscription"""
    subscription = get_active_subscription(db, user_id)
    
    if not subscription:
        return False
    
    subscription.status = 'cancelled'
    subscription.cancelled_at = utc_now()
    
    # User keeps premium until expiry
    # (Don't change user.subscription_status here - it will change when subscription expires)
    
    db.commit()
    
    print(f"✅ [SUBSCRIPTION] Cancelled subscription for user {user_id}")
    return True


def verify_google_purchase(purchase_token: str, product_id: str) -> Dict[str, Any]:
    """
    Verify a Google Play purchase.
    
    In production, this should call Google Play Developer API.
    For now, we'll trust the client and do basic validation.
    
    TODO: Implement proper server-side verification with Google Play Developer API
    https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get
    """
    
    # For MVP, we'll trust the client
    # In production, you should:
    # 1. Use Google Play Developer API to verify the purchase
    # 2. Store the purchase token and verify it hasn't been used before
    # 3. Set up Real-time Developer Notifications for subscription events
    
    if not purchase_token or not product_id:
        return {
            'valid': False,
            'error': 'Missing purchase_token or product_id'
        }
    
    # Basic validation - in production this would call Google's API
    return {
        'valid': True,
        'product_id': product_id,
        'purchase_token': purchase_token,
        'expiry_time': (utc_now() + timedelta(days=30 if 'monthly' in product_id else 365)).isoformat()
    }


def process_google_purchase(
    db: Session,
    user_id: str,
    purchase_token: str,
    product_id: str,
    order_id: str
) -> Dict[str, Any]:
    """
    Process a Google Play purchase.
    Called after user completes purchase in the app.
    """
    
    # Verify the purchase
    verification = verify_google_purchase(purchase_token, product_id)
    
    if not verification.get('valid'):
        return {
            'success': False,
            'error': verification.get('error', 'Purchase verification failed')
        }
    
    # Determine plan type from product_id
    plan_type = 'monthly' if 'monthly' in product_id.lower() else 'yearly'
    
    # Get price
    prices = get_prices(db)
    price_paid = prices.get(plan_type, 9.90)
    
    # Check if this order was already processed
    existing = db.query(Subscription).filter(
        Subscription.google_order_id == order_id
    ).first()
    
    if existing:
        return {
            'success': True,
            'message': 'Purchase already processed',
            'subscription_id': existing.id
        }
    
    # Create the subscription
    try:
        subscription = create_subscription(
            db=db,
            user_id=user_id,
            plan_type=plan_type,
            google_order_id=order_id,
            google_product_id=product_id,
            google_purchase_token=purchase_token,
            price_paid=price_paid
        )
        
        return {
            'success': True,
            'message': 'Subscription activated',
            'subscription_id': subscription.id,
            'plan_type': plan_type,
            'expires_at': subscription.expires_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        print(f"❌ [SUBSCRIPTION] Error processing purchase: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def check_expired_subscriptions(db: Session) -> int:
    """
    Check for expired subscriptions and update user status.
    Should be called periodically (e.g., in background job).
    Returns the number of subscriptions marked as expired.
    """
    
    # Find expired subscriptions
    expired = db.query(Subscription).filter(
        Subscription.status == 'active',
        Subscription.expires_at < utc_now()
    ).all()
    
    count = 0
    for subscription in expired:
        subscription.status = 'expired'
        
        # Update user status
        user = db.query(User).filter(User.id == subscription.user_id).first()
        if user:
            # Check if user has another active subscription
            other_active = db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status == 'active',
                Subscription.expires_at > utc_now(),
                Subscription.id != subscription.id
            ).first()
            
            if not other_active:
                user.subscription_status = 'free'
        
        count += 1
    
    if count > 0:
        db.commit()
        print(f"✅ [SUBSCRIPTION] Marked {count} subscriptions as expired")
    
    return count
