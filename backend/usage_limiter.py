# -*- coding: utf-8 -*-
"""
Usage Limiter - Manages usage limits for free users
"""

from datetime import datetime, date, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from models import User, UsageStats, AppSettings, Subscription


def utc_now():
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


def get_setting(db: Session, key: str, default: str = None) -> str:
    """Get a setting value from app_settings table"""
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    return setting.value if setting else default


def get_setting_int(db: Session, key: str, default: int = 0) -> int:
    """Get a setting value as integer"""
    value = get_setting(db, key, str(default))
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def get_setting_bool(db: Session, key: str, default: bool = False) -> bool:
    """Get a setting value as boolean"""
    value = get_setting(db, key, str(default).lower())
    return value.lower() in ('true', '1', 'yes')


def get_user_subscription_status(db: Session, user_id: str) -> str:
    """
    Get the current subscription status of a user.
    Returns: 'premium', 'trial', or 'free'
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return 'free'
    
    # Check for active subscription
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == 'active',
        Subscription.expires_at > utc_now()
    ).first()
    
    if active_subscription:
        # Update user status if needed
        if user.subscription_status != 'premium':
            user.subscription_status = 'premium'
            db.commit()
        return 'premium'
    
    # Check trial status
    if user.trial_started_at:
        trial_days = get_setting_int(db, 'trial_days', 14)
        
        # Add coupon trial extensions
        try:
            from coupon_service import get_user_trial_extension
            extra_days = get_user_trial_extension(db, user_id)
            trial_days += extra_days
        except Exception:
            pass  # Ignore if coupon service not available
        
        trial_end = user.trial_started_at + timedelta(days=trial_days)
        
        if utc_now() < trial_end:
            if user.subscription_status != 'trial':
                user.subscription_status = 'trial'
                db.commit()
            return 'trial'
    
    # No active subscription and trial expired (or never started)
    if user.subscription_status != 'free':
        user.subscription_status = 'free'
        db.commit()
    
    return 'free'


def start_trial(db: Session, user_id: str) -> bool:
    """
    Start the trial period for a user.
    Returns True if trial was started, False if already started.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    if user.trial_started_at:
        return False  # Trial already started
    
    user.trial_started_at = utc_now()
    user.subscription_status = 'trial'
    db.commit()
    return True


def get_trial_days_remaining(db: Session, user_id: str) -> int:
    """Get the number of trial days remaining for a user (including coupon extensions)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.trial_started_at:
        return 0
    
    trial_days = get_setting_int(db, 'trial_days', 14)
    
    # Add coupon trial extensions
    try:
        from coupon_service import get_user_trial_extension
        extra_days = get_user_trial_extension(db, user_id)
        trial_days += extra_days
    except Exception:
        pass  # Ignore if coupon service not available
    
    trial_end = user.trial_started_at + timedelta(days=trial_days)
    remaining = (trial_end - utc_now()).days
    return max(0, remaining)


def get_daily_usage(db: Session, user_id: str) -> int:
    """Get the number of messages generated today by a user"""
    today = date.today()
    usage = db.query(UsageStats).filter(
        UsageStats.user_id == user_id,
        UsageStats.date == today
    ).first()
    
    return usage.messages_generated if usage else 0


def get_monthly_usage(db: Session, user_id: str) -> int:
    """Get the number of messages generated this month by a user"""
    today = date.today()
    first_day_of_month = today.replace(day=1)
    
    total = db.query(func.sum(UsageStats.messages_generated)).filter(
        UsageStats.user_id == user_id,
        UsageStats.date >= first_day_of_month
    ).scalar()
    
    return total or 0


def check_can_generate_message(db: Session, user_id: str) -> Tuple[bool, dict]:
    """
    Check if a user can generate a message.
    
    Returns:
        Tuple[bool, dict]: (can_generate, info)
        info contains: status, daily_used, daily_limit, monthly_used, monthly_limit, trial_days_remaining
    """
    status = get_user_subscription_status(db, user_id)
    
    info = {
        'status': status,
        'daily_used': 0,
        'daily_limit': None,
        'monthly_used': 0,
        'monthly_limit': None,
        'trial_days_remaining': 0,
        'can_generate': True,
        'reason': None
    }
    
    # Premium users have no limits
    if status == 'premium':
        return True, info
    
    # Trial users have no limits (but show remaining days)
    if status == 'trial':
        info['trial_days_remaining'] = get_trial_days_remaining(db, user_id)
        return True, info
    
    # Free users have limits
    freemium_enabled = get_setting_bool(db, 'freemium_enabled', True)
    if not freemium_enabled:
        info['can_generate'] = False
        info['reason'] = 'freemium_disabled'
        return False, info
    
    daily_limit = get_setting_int(db, 'free_messages_per_day', 3)
    monthly_limit = get_setting_int(db, 'free_messages_per_month', 30)
    
    daily_used = get_daily_usage(db, user_id)
    monthly_used = get_monthly_usage(db, user_id)
    
    info['daily_used'] = daily_used
    info['daily_limit'] = daily_limit
    info['monthly_used'] = monthly_used
    info['monthly_limit'] = monthly_limit
    
    if daily_used >= daily_limit:
        info['can_generate'] = False
        info['reason'] = 'daily_limit_reached'
        return False, info
    
    if monthly_used >= monthly_limit:
        info['can_generate'] = False
        info['reason'] = 'monthly_limit_reached'
        return False, info
    
    return True, info


def record_message_usage(db: Session, user_id: str) -> bool:
    """
    Record that a user generated a message.
    Returns True if successful.
    """
    today = date.today()
    
    # Try to find existing record for today
    usage = db.query(UsageStats).filter(
        UsageStats.user_id == user_id,
        UsageStats.date == today
    ).first()
    
    if usage:
        usage.messages_generated += 1
        usage.updated_at = utc_now()
    else:
        usage = UsageStats(
            user_id=user_id,
            date=today,
            messages_generated=1
        )
        db.add(usage)
    
    try:
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ [USAGE] Error recording usage: {e}")
        return False


def get_user_contact_count(db: Session, user_id: str) -> int:
    """Get the number of contacts for a user"""
    from models import Contact
    return db.query(Contact).filter(Contact.user_id == user_id).count()


def check_can_add_contact(db: Session, user_id: str) -> Tuple[bool, dict]:
    """
    Check if a user can add a new contact.
    
    Returns:
        Tuple[bool, dict]: (can_add, info)
    """
    status = get_user_subscription_status(db, user_id)
    current_contacts = get_user_contact_count(db, user_id)
    
    info = {
        'status': status,
        'current_contacts': current_contacts,
        'max_contacts': None,
        'can_add': True,
        'reason': None
    }
    
    # Premium and trial users have no limits
    if status in ('premium', 'trial'):
        return True, info
    
    # Free users have contact limits
    max_contacts = get_setting_int(db, 'max_free_contacts', 2)
    info['max_contacts'] = max_contacts
    
    if current_contacts >= max_contacts:
        info['can_add'] = False
        info['reason'] = 'contact_limit_reached'
        return False, info
    
    return True, info
