# -*- coding: utf-8 -*-
"""
Migration script to migrate data from JSON files to PostgreSQL
Run this once to migrate existing data
"""

import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Contact, Reminder

# File paths
CONTACTS_FILE = "contacts.json"
REMINDERS_FILE = "reminders.json"
USERS_FILE = "users.json"

def migrate_users(db: Session):
    """Migrate users from JSON to PostgreSQL"""
    if not os.path.exists(USERS_FILE):
        print("ℹ️  No users.json file found, skipping users migration")
        return
    
    print("🔵 [MIGRATION] Migrating users...")
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        migrated_count = 0
        for user_id, user_data in users_data.items():
            # Check if user already exists
            existing_user = db.query(User).filter(User.id == user_id).first()
            if existing_user:
                print(f"⚠️  User {user_id} already exists, skipping")
                continue
            
            # Create new user
            # Note: JSON uses 'hashed_password', but model uses 'password_hash'
            password_hash = user_data.get('hashed_password') or user_data.get('password_hash')
            user = User(
                id=user_id,
                username=user_data.get('username', user_id),
                email=user_data.get('email', ''),
                password_hash=password_hash,
                created_at=datetime.now()
            )
            db.add(user)
            migrated_count += 1
        
        db.commit()
        print(f"✅ [MIGRATION] Migrated {migrated_count} users")
    except Exception as e:
        db.rollback()
        print(f"❌ [MIGRATION] Error migrating users: {e}")
        raise

def migrate_contacts(db: Session):
    """Migrate contacts from JSON to PostgreSQL"""
    if not os.path.exists(CONTACTS_FILE):
        print("ℹ️  No contacts.json file found, skipping contacts migration")
        return
    
    print("🔵 [MIGRATION] Migrating contacts...")
    try:
        with open(CONTACTS_FILE, 'r', encoding='utf-8') as f:
            contacts_data = json.load(f)
        
        migrated_count = 0
        for contact_data in contacts_data:
            # Check if contact already exists
            if contact_data.get('id'):
                existing_contact = db.query(Contact).filter(Contact.id == contact_data['id']).first()
                if existing_contact:
                    print(f"⚠️  Contact {contact_data['id']} already exists, skipping")
                    continue
            
            # Parse created_at
            created_at = None
            if contact_data.get('created_at'):
                try:
                    if isinstance(contact_data['created_at'], str):
                        created_at = datetime.fromisoformat(contact_data['created_at'])
                    else:
                        created_at = contact_data['created_at']
                except:
                    created_at = datetime.now()
            else:
                created_at = datetime.now()
            
            # Create new contact
            contact = Contact(
                id=contact_data.get('id'),
                user_id=contact_data.get('user_id', ''),
                name=contact_data.get('name', ''),
                email=contact_data.get('email'),
                phone=contact_data.get('phone'),
                notes=contact_data.get('notes'),
                created_at=created_at
            )
            db.add(contact)
            migrated_count += 1
        
        db.commit()
        print(f"✅ [MIGRATION] Migrated {migrated_count} contacts")
    except Exception as e:
        db.rollback()
        print(f"❌ [MIGRATION] Error migrating contacts: {e}")
        raise

def migrate_reminders(db: Session):
    """Migrate reminders from JSON to PostgreSQL"""
    if not os.path.exists(REMINDERS_FILE):
        print("ℹ️  No reminders.json file found, skipping reminders migration")
        return
    
    print("🔵 [MIGRATION] Migrating reminders...")
    try:
        with open(REMINDERS_FILE, 'r', encoding='utf-8') as f:
            reminders_data = json.load(f)
        
        migrated_count = 0
        for reminder_data in reminders_data:
            # Check if reminder already exists
            if reminder_data.get('id'):
                existing_reminder = db.query(Reminder).filter(Reminder.id == reminder_data['id']).first()
                if existing_reminder:
                    print(f"⚠️  Reminder {reminder_data['id']} already exists, skipping")
                    continue
            
            # Parse datetime fields
            def parse_datetime(dt_str):
                if not dt_str:
                    return None
                try:
                    if isinstance(dt_str, str):
                        return datetime.fromisoformat(dt_str)
                    return dt_str
                except:
                    return None
            
            # Create new reminder
            reminder = Reminder(
                id=reminder_data.get('id'),
                user_id=reminder_data.get('user_id', ''),
                contact_id=reminder_data.get('contact_id', 0),
                interval_type=reminder_data.get('interval_type', 'days'),
                interval_value=reminder_data.get('interval_value', 1),
                last_triggered=parse_datetime(reminder_data.get('last_triggered')),
                next_trigger=parse_datetime(reminder_data.get('next_trigger')),
                enabled=reminder_data.get('enabled', True),
                created_at=parse_datetime(reminder_data.get('created_at')) or datetime.now()
            )
            db.add(reminder)
            migrated_count += 1
        
        db.commit()
        print(f"✅ [MIGRATION] Migrated {migrated_count} reminders")
    except Exception as e:
        db.rollback()
        print(f"❌ [MIGRATION] Error migrating reminders: {e}")
        raise

def main():
    """Main migration function"""
    print("=" * 60)
    print("🚀 Starting migration from JSON to PostgreSQL")
    print("=" * 60)
    
    # Initialize database (create tables)
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Migrate in order: users -> contacts -> reminders
        migrate_users(db)
        migrate_contacts(db)
        migrate_reminders(db)
        
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print("")
        print("Next steps:")
        print("1. Verify data in PostgreSQL database")
        print("2. Update main.py and auth.py to use PostgreSQL")
        print("3. Test the application")
        print("4. Backup JSON files (optional)")
        
    except Exception as e:
        print("=" * 60)
        print(f"❌ Migration failed: {e}")
        print("=" * 60)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()

