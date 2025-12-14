# -*- coding: utf-8 -*-
"""
Coupon Service - Manages coupon validation and application
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Coupon, CouponUsage, User, Subscription


def get_coupon_by_code(db: Session, code: str) -> Optional[Coupon]:
    """Get a coupon by its code (case-insensitive)"""
    return db.query(Coupon).filter(
        func.upper(Coupon.code) == code.upper().strip()
    ).first()


def validate_coupon(
    db: Session, 
    code: str, 
    user_id: str, 
    plan_type: Optional[str] = None
) -> Tuple[bool, Dict[str, Any]]:
    """
    Validate a coupon code for a user.
    
    Args:
        db: Database session
        code: Coupon code to validate
        user_id: User trying to use the coupon
        plan_type: Optional plan type ('monthly', 'yearly') for subscription coupons
    
    Returns:
        Tuple of (is_valid, info_dict)
    """
    coupon = get_coupon_by_code(db, code)
    
    if not coupon:
        return False, {"error": "קוד קופון לא קיים", "error_code": "NOT_FOUND"}
    
    if not coupon.is_active:
        return False, {"error": "קופון לא פעיל", "error_code": "INACTIVE"}
    
    # Check validity period
    now = datetime.utcnow()
    
    if coupon.starts_at and now < coupon.starts_at:
        return False, {"error": "הקופון עדיין לא בתוקף", "error_code": "NOT_STARTED"}
    
    if coupon.expires_at and now > coupon.expires_at:
        return False, {"error": "פג תוקף הקופון", "error_code": "EXPIRED"}
    
    # Check max uses (global)
    if coupon.max_uses is not None:
        total_uses = db.query(func.count(CouponUsage.id)).filter(
            CouponUsage.coupon_id == coupon.id
        ).scalar() or 0
        
        if total_uses >= coupon.max_uses:
            return False, {"error": "הקופון הגיע למגבלת השימושים", "error_code": "MAX_USES_REACHED"}
    
    # Check max uses per user
    user_uses = db.query(func.count(CouponUsage.id)).filter(
        CouponUsage.coupon_id == coupon.id,
        CouponUsage.user_id == user_id
    ).scalar() or 0
    
    if user_uses >= coupon.max_uses_per_user:
        return False, {"error": "כבר השתמשת בקופון זה", "error_code": "USER_LIMIT_REACHED"}
    
    # Check plan validity
    if plan_type and coupon.valid_for_plans:
        valid_plans = coupon.valid_for_plans.lower()
        if valid_plans != 'both' and plan_type.lower() not in valid_plans:
            return False, {"error": f"הקופון לא תקף לתוכנית {plan_type}", "error_code": "INVALID_PLAN"}
    
    # Coupon is valid!
    return True, {
        "coupon_id": coupon.id,
        "code": coupon.code,
        "type": coupon.coupon_type,
        "value": coupon.value,
        "description": coupon.description
    }


def apply_coupon(
    db: Session,
    code: str,
    user_id: str,
    plan_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Apply a coupon for a user.
    
    Returns dict with result info.
    """
    # Validate first
    is_valid, info = validate_coupon(db, code, user_id, plan_type)
    
    if not is_valid:
        return {"success": False, **info}
    
    coupon = get_coupon_by_code(db, code)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return {"success": False, "error": "משתמש לא נמצא", "error_code": "USER_NOT_FOUND"}
    
    result = {"success": True, "type": coupon.coupon_type, "value": coupon.value}
    applied_to = None
    discount_amount = None
    
    # Apply based on coupon type
    if coupon.coupon_type == 'trial_extension':
        # Extend trial by X days
        if user.trial_started_at:
            # Just record usage - the trial extension is calculated dynamically
            applied_to = 'trial'
            result["message"] = f"נוספו {coupon.value} ימי ניסיון!"
            result["extra_trial_days"] = coupon.value
        else:
            # Start trial if not started
            user.trial_started_at = datetime.utcnow()
            user.subscription_status = 'trial'
            applied_to = 'trial'
            result["message"] = f"תקופת ניסיון מורחבת: {coupon.value} ימים נוספים!"
            result["extra_trial_days"] = coupon.value
    
    elif coupon.coupon_type == 'free_period':
        # Give X days of premium for free
        expires_at = datetime.utcnow() + timedelta(days=coupon.value)
        
        subscription = Subscription(
            user_id=user_id,
            plan_type='coupon',
            status='active',
            started_at=datetime.utcnow(),
            expires_at=expires_at,
            price_paid=0,
            is_launch_price=False
        )
        db.add(subscription)
        
        user.subscription_status = 'premium'
        applied_to = 'free_period'
        result["message"] = f"קיבלת {coupon.value} ימי פרימיום בחינם!"
        result["expires_at"] = expires_at.isoformat()
    
    elif coupon.coupon_type == 'discount_percent':
        # Percentage discount on next purchase
        # Just record - discount applied at checkout
        applied_to = f'subscription_{plan_type}' if plan_type else 'subscription'
        discount_amount = coupon.value  # Store percentage
        result["message"] = f"תקבל {coupon.value}% הנחה!"
        result["discount_percent"] = coupon.value
    
    elif coupon.coupon_type == 'discount_fixed':
        # Fixed amount discount
        applied_to = f'subscription_{plan_type}' if plan_type else 'subscription'
        discount_amount = coupon.value  # Store amount
        result["message"] = f"תקבל {coupon.value}₪ הנחה!"
        result["discount_amount"] = coupon.value
    
    # Record usage
    usage = CouponUsage(
        coupon_id=coupon.id,
        user_id=user_id,
        applied_to=applied_to,
        discount_amount=discount_amount
    )
    db.add(usage)
    
    try:
        db.commit()
        print(f"✅ [COUPON] Applied coupon '{code}' for user {user_id}: {result}")
        return result
    except Exception as e:
        db.rollback()
        print(f"❌ [COUPON] Error applying coupon: {e}")
        return {"success": False, "error": "שגיאה בהפעלת הקופון", "error_code": "DB_ERROR"}


def get_user_active_coupon_discount(db: Session, user_id: str, plan_type: str) -> Optional[Dict[str, Any]]:
    """
    Check if user has an active (unused) discount coupon.
    
    Returns discount info if available.
    """
    # Find recent discount coupon usage that hasn't been used for a subscription yet
    recent_usage = db.query(CouponUsage).join(Coupon).filter(
        CouponUsage.user_id == user_id,
        Coupon.coupon_type.in_(['discount_percent', 'discount_fixed']),
        CouponUsage.applied_to.like(f'%{plan_type}%') | CouponUsage.applied_to == 'subscription'
    ).order_by(CouponUsage.used_at.desc()).first()
    
    if recent_usage and recent_usage.discount_amount:
        coupon = recent_usage.coupon
        
        # Check if this was used within the last hour (session-based discount)
        if datetime.utcnow() - recent_usage.used_at < timedelta(hours=1):
            return {
                "type": coupon.coupon_type,
                "value": int(recent_usage.discount_amount),
                "coupon_code": coupon.code
            }
    
    return None


def get_user_trial_extension(db: Session, user_id: str) -> int:
    """
    Get total trial extension days from coupons for a user.
    
    Returns number of extra trial days.
    """
    extra_days = db.query(func.sum(Coupon.value)).join(CouponUsage).filter(
        CouponUsage.user_id == user_id,
        Coupon.coupon_type == 'trial_extension'
    ).scalar()
    
    return extra_days or 0


def create_coupon(
    db: Session,
    code: str,
    coupon_type: str,
    value: int,
    description: Optional[str] = None,
    max_uses: Optional[int] = None,
    max_uses_per_user: int = 1,
    valid_for_plans: Optional[str] = None,
    starts_at: Optional[datetime] = None,
    expires_at: Optional[datetime] = None
) -> Coupon:
    """Create a new coupon"""
    
    coupon = Coupon(
        code=code.upper().strip(),
        coupon_type=coupon_type,
        value=value,
        description=description,
        max_uses=max_uses,
        max_uses_per_user=max_uses_per_user,
        valid_for_plans=valid_for_plans,
        starts_at=starts_at,
        expires_at=expires_at,
        is_active=True
    )
    
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    
    print(f"✅ [COUPON] Created coupon: {code} ({coupon_type}, value={value})")
    return coupon


def get_all_coupons(db: Session) -> list:
    """Get all coupons with usage statistics"""
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    
    result = []
    for coupon in coupons:
        usage_count = db.query(func.count(CouponUsage.id)).filter(
            CouponUsage.coupon_id == coupon.id
        ).scalar() or 0
        
        result.append({
            "id": coupon.id,
            "code": coupon.code,
            "type": coupon.coupon_type,
            "value": coupon.value,
            "description": coupon.description,
            "max_uses": coupon.max_uses,
            "max_uses_per_user": coupon.max_uses_per_user,
            "valid_for_plans": coupon.valid_for_plans,
            "starts_at": coupon.starts_at.isoformat() if coupon.starts_at else None,
            "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None,
            "is_active": coupon.is_active,
            "usage_count": usage_count,
            "created_at": coupon.created_at.isoformat()
        })
    
    return result


def toggle_coupon_status(db: Session, coupon_id: int) -> bool:
    """Toggle a coupon's active status"""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    
    if not coupon:
        return False
    
    coupon.is_active = not coupon.is_active
    db.commit()
    
    print(f"✅ [COUPON] Toggled coupon {coupon.code}: is_active={coupon.is_active}")
    return True
