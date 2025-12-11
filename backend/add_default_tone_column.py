#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migration script to add default_tone column to contacts table
Run this script to update the database schema
"""

import os
import sys
from sqlalchemy import text
from database import SessionLocal, engine
from dotenv import load_dotenv

load_dotenv()

def add_default_tone_column():
    """Add default_tone column to contacts table if it doesn't exist"""
    print("🚀 Starting migration: Adding default_tone column to contacts table...")
    
    db = SessionLocal()
    try:
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='contacts' AND column_name='default_tone';
        """)
        
        result = db.execute(check_query).fetchone()
        
        if result:
            print("✅ Column 'default_tone' already exists. Skipping migration.")
            return
        
        # Add the column
        print("📝 Adding 'default_tone' column to contacts table...")
        alter_query = text("""
            ALTER TABLE contacts 
            ADD COLUMN default_tone VARCHAR DEFAULT 'friendly';
        """)
        
        db.execute(alter_query)
        db.commit()
        
        print("✅ Successfully added 'default_tone' column to contacts table!")
        print("   Default value set to 'friendly' for existing rows")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        add_default_tone_column()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)


