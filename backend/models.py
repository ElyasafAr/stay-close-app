# -*- coding: utf-8 -*-
"""
SQLAlchemy models for PostgreSQL database
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base

class User(Base):
    """User model - stores user authentication and profile data"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # user_id from auth
    
    # Encrypted fields - username
    username_hash = Column(String, unique=True, index=True, nullable=False)  # SHA256 for lookup
    username_encrypted = Column(String, nullable=False)  # AES encrypted for display
    
    # Encrypted fields - email
    email_hash = Column(String, unique=True, index=True, nullable=False)  # SHA256 for lookup
    email_encrypted = Column(String, nullable=False)  # AES encrypted for display
    
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Notification settings - where to receive push notifications
    # 'both' = phone + browser, 'phone' = only phone app, 'browser' = only web browser
    notification_platform = Column(String, nullable=False, default='both')
    
    # Subscription fields
    trial_started_at = Column(DateTime(timezone=True), nullable=True)  # When trial started
    subscription_status = Column(String, nullable=False, default='trial')  # 'trial', 'free', 'premium'
    
    # Relationships
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    usage_stats = relationship("UsageStats", back_populates="user", cascade="all, delete-orphan")

class Contact(Base):
    """Contact model - stores contact information"""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name_encrypted = Column(String, nullable=False)  # AES encrypted contact name
    default_tone = Column(String, nullable=True, default='friendly')  # Default tone for messages: 'friendly', 'warm', 'casual', 'formal'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="contacts")
    reminders = relationship("Reminder", back_populates="contact", cascade="all, delete-orphan")

class Reminder(Base):
    """Reminder model - stores reminder settings"""
    __tablename__ = "reminders"
    
    # שדות קיימים
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    interval_type = Column(String, nullable=True)  # 'hours' or 'days' - רק ל-recurring
    interval_value = Column(Integer, nullable=True)  # רק ל-recurring
    last_triggered = Column(DateTime(timezone=True), nullable=True)
    next_trigger = Column(DateTime(timezone=True), nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # שדות חדשים - מערכת התראות משופרת
    reminder_type = Column(String, nullable=False, default='recurring')  # 'one_time', 'recurring', 'weekly', 'daily'
    scheduled_datetime = Column(DateTime(timezone=True), nullable=True)  # להתראה חד-פעמית
    weekdays = Column(Text, nullable=True)  # JSON array: "[0,2,4]" - ימים בשבוע
    specific_time = Column(String, nullable=True)  # "14:30" - שעה ספציפית
    timezone = Column(String, nullable=True)  # "Asia/Jerusalem" - timezone של המשתמש
    one_time_triggered = Column(Boolean, default=False, nullable=False)  # האם התראה חד-פעמית הופעלה
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    contact = relationship("Contact", back_populates="reminders")

class PushToken(Base):
    """Push Token model - stores FCM push tokens for users"""
    __tablename__ = "push_tokens"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(Text, nullable=False, unique=True, index=True)  # FCM push token
    device_info = Column(Text, nullable=True)  # JSON: {"platform": "web", "userAgent": "..."}
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")


class Subscription(Base):
    """Subscription model - stores user subscription data"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Subscription details
    plan_type = Column(String, nullable=False)  # 'monthly', 'yearly'
    status = Column(String, nullable=False, default='active')  # 'active', 'cancelled', 'expired'
    
    # Google Play Billing data
    google_order_id = Column(String, nullable=True, unique=True)
    google_product_id = Column(String, nullable=True)  # e.g., 'monthly_subscription'
    google_purchase_token = Column(Text, nullable=True)
    
    # Allpay payment data
    allpay_order_id = Column(String, nullable=True, unique=True)
    allpay_payment_id = Column(String, nullable=True)
    allpay_recurring_id = Column(String, nullable=True)
    
    # Dates
    started_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Price info (for analytics)
    price_paid = Column(Float, nullable=True)  # In ILS
    is_launch_price = Column(Boolean, default=False)  # Was this purchased at launch price?
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")


class AppSettings(Base):
    """App Settings model - stores configurable app settings"""
    __tablename__ = "app_settings"
    
    key = Column(String, primary_key=True, index=True)  # Setting key
    value = Column(Text, nullable=False)  # Setting value (JSON or string)
    description = Column(String, nullable=True)  # Human-readable description
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UsageStats(Base):
    """Usage Stats model - tracks daily usage per user"""
    __tablename__ = "usage_stats"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)  # The date of usage
    messages_generated = Column(Integer, nullable=False, default=0)  # Messages generated that day
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="usage_stats")


class Coupon(Base):
    """Coupon model - stores coupon codes and their settings"""
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False, index=True)  # e.g., "WELCOME50"
    
    # Coupon type and value
    # Types: 'trial_extension', 'discount_percent', 'discount_fixed', 'free_period'
    coupon_type = Column(String, nullable=False)
    value = Column(Integer, nullable=False)  # Days for trial/free_period, % for discount_percent, ILS for discount_fixed
    
    # Restrictions
    valid_for_plans = Column(String, nullable=True)  # 'monthly', 'yearly', 'both' (null = all)
    max_uses = Column(Integer, nullable=True)  # null = unlimited
    max_uses_per_user = Column(Integer, nullable=False, default=1)
    
    # Validity period
    starts_at = Column(DateTime(timezone=True), nullable=True)  # null = immediately valid
    expires_at = Column(DateTime(timezone=True), nullable=True)  # null = never expires
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    description = Column(String, nullable=True)  # Internal description
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    usages = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")


class CouponUsage(Base):
    """Coupon Usage model - tracks which users used which coupons"""
    __tablename__ = "coupon_usages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # What was applied
    applied_to = Column(String, nullable=True)  # 'trial', 'subscription_monthly', 'subscription_yearly'
    discount_amount = Column(Float, nullable=True)  # Actual discount applied (for analytics)
    
    used_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")

