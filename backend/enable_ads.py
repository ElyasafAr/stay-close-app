#!/usr/bin/env python3
"""
Quick script to enable ads in the database
Run this from the backend directory:
    python3 enable_ads.py
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in environment variables")
    print("Make sure you have a .env file in the backend directory with DATABASE_URL set")
    exit(1)

print(f"🔵 Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check current value
    print("🔵 Checking current ads_enabled value...")
    check_query = text("SELECT key, value FROM app_settings WHERE key = 'ads_enabled'")
    result = conn.execute(check_query).fetchone()

    if result:
        print(f"📊 Current value: ads_enabled = {result[1]}")
    else:
        print("⚠️  ads_enabled setting not found in database")

    # Update to true
    print("🔵 Updating ads_enabled to true...")
    update_query = text("""
        UPDATE app_settings
        SET value = 'true'
        WHERE key = 'ads_enabled'
    """)
    conn.execute(update_query)
    conn.commit()

    # Verify update
    print("🔵 Verifying update...")
    verify_query = text("SELECT key, value FROM app_settings WHERE key = 'ads_enabled'")
    new_result = conn.execute(verify_query).fetchone()

    if new_result and new_result[1] == 'true':
        print("✅ SUCCESS! Ads are now enabled")
        print(f"   ads_enabled = {new_result[1]}")
    else:
        print("❌ FAILED! Something went wrong")
        if new_result:
            print(f"   Current value: {new_result[1]}")

print("\n🎉 Done! Restart the backend server for changes to take effect.")
