# -*- coding: utf-8 -*-
"""
SQLAlchemy models for PostgreSQL database
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base

class User(Base):
    """User model - stores user authentication and profile data"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # user_id from auth
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")

class Contact(Base):
    """Contact model - stores contact information"""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    default_tone = Column(String, nullable=True, default='friendly')  # Default tone for messages: 'friendly', 'warm', 'casual', 'formal'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="contacts")
    reminders = relationship("Reminder", back_populates="contact", cascade="all, delete-orphan")

class Reminder(Base):
    """Reminder model - stores reminder settings"""
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    interval_type = Column(String, nullable=False)  # 'hours' or 'days'
    interval_value = Column(Integer, nullable=False)
    last_triggered = Column(DateTime(timezone=True), nullable=True)
    next_trigger = Column(DateTime(timezone=True), nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    contact = relationship("Contact", back_populates="reminders")

