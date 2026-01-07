# -*- coding: utf-8 -*-
"""
Database connection and session management for PostgreSQL
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
# Railway provides DATABASE_URL automatically
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not set, try to construct it from individual parts
if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "stayclose")
    
    if db_password:
        DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    else:
        DATABASE_URL = f"postgresql://{db_user}@{db_host}:{db_port}/{db_name}"

# If still no DATABASE_URL, use default local PostgreSQL
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/stayclose"
    print("⚠️  No DATABASE_URL found, using default local PostgreSQL")

# Create SQLAlchemy engine
# For Railway, we might need to convert postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """
    Dependency function to get database session
    Use this in FastAPI route dependencies
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database - create all tables and run migrations
    Call this once when starting the application
    """
    print("🔵 [DATABASE] Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ [DATABASE] Database tables created successfully")
        
        # Run migrations for schema changes
        _run_migrations()
    except Exception as e:
        print(f"❌ [DATABASE] Error creating tables: {e}")
        raise

def _run_migrations():
    """
    Run database migrations for schema changes
    """
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        # Migration 1: Add default_tone column to contacts if it doesn't exist
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='contacts' AND column_name='default_tone';
        """)
        
        result = db.execute(check_query).fetchone()
        
        if not result:
            print("🔵 [DATABASE] Running migration: Adding default_tone column...")
            alter_query = text("""
                ALTER TABLE contacts 
                ADD COLUMN default_tone VARCHAR DEFAULT 'friendly';
            """)
            db.execute(alter_query)
            db.commit()
            print("✅ [DATABASE] Migration completed: default_tone column added")
        
        # Migration 2: Add advanced reminder fields if they don't exist
        check_reminder_type = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='reminders' AND column_name='reminder_type';
        """)
        
        result_reminder_type = db.execute(check_reminder_type).fetchone()
        
        if not result_reminder_type:
            print("🔵 [DATABASE] Running migration: Adding advanced reminder fields...")
            
            # Add reminder_type column
            alter_reminder_type = text("""
                ALTER TABLE reminders 
                ADD COLUMN reminder_type VARCHAR DEFAULT 'recurring' NOT NULL;
            """)
            db.execute(alter_reminder_type)
            
            # Add scheduled_datetime column
            alter_scheduled = text("""
                ALTER TABLE reminders 
                ADD COLUMN scheduled_datetime TIMESTAMP WITH TIME ZONE;
            """)
            db.execute(alter_scheduled)
            
            # Add weekdays column
            alter_weekdays = text("""
                ALTER TABLE reminders 
                ADD COLUMN weekdays TEXT;
            """)
            db.execute(alter_weekdays)
            
            # Add specific_time column
            alter_time = text("""
                ALTER TABLE reminders 
                ADD COLUMN specific_time VARCHAR;
            """)
            db.execute(alter_time)
            
            # Add one_time_triggered column
            alter_triggered = text("""
                ALTER TABLE reminders 
                ADD COLUMN one_time_triggered BOOLEAN DEFAULT FALSE NOT NULL;
            """)
            db.execute(alter_triggered)
            
            # Update existing reminders to have reminder_type='recurring'
            update_existing = text("""
                UPDATE reminders 
                SET reminder_type = 'recurring' 
                WHERE reminder_type IS NULL;
            """)
            db.execute(update_existing)
            
            db.commit()
            print("✅ [DATABASE] Migration completed: Advanced reminder fields added")
        
        # Migration 3: Add timezone column if it doesn't exist
        check_timezone = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='reminders' AND column_name='timezone';
        """)
        
        result_timezone = db.execute(check_timezone).fetchone()
        
        if not result_timezone:
            print("🔵 [DATABASE] Running migration: Adding timezone column...")
            
            alter_timezone = text("""
                ALTER TABLE reminders 
                ADD COLUMN timezone VARCHAR;
            """)
            db.execute(alter_timezone)
            db.commit()
            print("✅ [DATABASE] Migration completed: timezone column added")
            db.execute(update_existing)
            
            # Make interval_type and interval_value nullable (for one_time reminders)
            alter_interval_type = text("""
                ALTER TABLE reminders 
                ALTER COLUMN interval_type DROP NOT NULL;
            """)
            db.execute(alter_interval_type)
            
            alter_interval_value = text("""
                ALTER TABLE reminders 
                ALTER COLUMN interval_value DROP NOT NULL;
            """)
            db.execute(alter_interval_value)
            
            db.commit()
            print("✅ [DATABASE] Migration completed: Advanced reminder fields added")
        
        # Migration 3: Add push_tokens table if it doesn't exist
        check_push_tokens = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='push_tokens';
        """)
        
        result_push_tokens = db.execute(check_push_tokens).fetchone()
        
        if not result_push_tokens:
            print("🔵 [DATABASE] Running migration: Creating push_tokens table...")
            create_table = text("""
                CREATE TABLE push_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR NOT NULL,
                    token TEXT NOT NULL UNIQUE,
                    device_info TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
                CREATE INDEX idx_push_tokens_token ON push_tokens(token);
            """)
            db.execute(create_table)
            db.commit()
            print("✅ [DATABASE] Migration completed: push_tokens table created")
        
        # Migration 4: Add notification_platform column to users if it doesn't exist
        check_notification_platform = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='notification_platform';
        """)
        
        result_notification_platform = db.execute(check_notification_platform).fetchone()
        
        if not result_notification_platform:
            print("🔵 [DATABASE] Running migration: Adding notification_platform column...")
            alter_notification_platform = text("""
                ALTER TABLE users 
                ADD COLUMN notification_platform VARCHAR(20) NOT NULL DEFAULT 'both';
            """)
            db.execute(alter_notification_platform)
            db.commit()
            print("✅ [DATABASE] Migration completed: notification_platform column added")
        
        # Migration 5: Add subscription fields to users
        check_subscription_status = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='subscription_status';
        """)
        
        result_subscription_status = db.execute(check_subscription_status).fetchone()
        
        if not result_subscription_status:
            print("🔵 [DATABASE] Running migration: Adding subscription fields to users...")
            alter_users = text("""
                ALTER TABLE users 
                ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial';
            """)
            db.execute(alter_users)
            db.commit()
            print("✅ [DATABASE] Migration completed: subscription fields added to users")
        
        # Migration 6: Create subscriptions table
        check_subscriptions = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='subscriptions';
        """)
        
        result_subscriptions = db.execute(check_subscriptions).fetchone()
        
        if not result_subscriptions:
            print("🔵 [DATABASE] Running migration: Creating subscriptions table...")
            create_subscriptions = text("""
                CREATE TABLE subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR NOT NULL,
                    plan_type VARCHAR NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'active',
                    google_order_id VARCHAR UNIQUE,
                    google_product_id VARCHAR,
                    google_purchase_token TEXT,
                    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    cancelled_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    price_paid FLOAT,
                    is_launch_price BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
                CREATE INDEX idx_subscriptions_status ON subscriptions(status);
            """)
            db.execute(create_subscriptions)
            db.commit()
            print("✅ [DATABASE] Migration completed: subscriptions table created")
        
        # Migration 7: Create app_settings table
        check_app_settings = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='app_settings';
        """)
        
        result_app_settings = db.execute(check_app_settings).fetchone()
        
        if not result_app_settings:
            print("🔵 [DATABASE] Running migration: Creating app_settings table...")
            create_app_settings = text("""
                CREATE TABLE app_settings (
                    key VARCHAR PRIMARY KEY,
                    value TEXT NOT NULL,
                    description VARCHAR,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            """)
            db.execute(create_app_settings)
            
            # Insert default settings
            insert_defaults = text("""
                INSERT INTO app_settings (key, value, description) VALUES
                ('free_messages_per_day', '3', 'Max messages per day for free users'),
                ('free_messages_per_month', '30', 'Max messages per month for free users'),
                ('max_free_contacts', '2', 'Max contacts for free users'),
                ('trial_days', '14', 'Trial period in days'),
                ('freemium_enabled', 'true', 'Is freemium mode enabled'),
                ('launch_pricing_active', 'true', 'Is launch pricing active'),
                ('monthly_price_launch', '9.90', 'Monthly price during launch (ILS)'),
                ('yearly_price_launch', '69.90', 'Yearly price during launch (ILS)'),
                ('monthly_price_regular', '14.90', 'Regular monthly price (ILS)'),
                ('yearly_price_regular', '99.90', 'Regular yearly price (ILS)'),
                ('admin_emails', '[]', 'JSON array of admin email addresses');
            """)
            db.execute(insert_defaults)
            db.commit()
            print("✅ [DATABASE] Migration completed: app_settings table created with defaults")
        
        # Migration 8: Create usage_stats table
        check_usage_stats = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='usage_stats';
        """)
        
        result_usage_stats = db.execute(check_usage_stats).fetchone()
        
        if not result_usage_stats:
            print("🔵 [DATABASE] Running migration: Creating usage_stats table...")
            create_usage_stats = text("""
                CREATE TABLE usage_stats (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR NOT NULL,
                    date DATE NOT NULL,
                    messages_generated INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(user_id, date)
                );
                CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
                CREATE INDEX idx_usage_stats_date ON usage_stats(date);
            """)
            db.execute(create_usage_stats)
            db.commit()
            print("✅ [DATABASE] Migration completed: usage_stats table created")
        
        # Migration 9: Create coupons table
        check_coupons = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='coupons';
        """)
        
        result_coupons = db.execute(check_coupons).fetchone()
        
        if not result_coupons:
            print("🔵 [DATABASE] Running migration: Creating coupons table...")
            create_coupons = text("""
                CREATE TABLE coupons (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR NOT NULL UNIQUE,
                    coupon_type VARCHAR NOT NULL,
                    value INTEGER NOT NULL,
                    valid_for_plans VARCHAR,
                    max_uses INTEGER,
                    max_uses_per_user INTEGER NOT NULL DEFAULT 1,
                    starts_at TIMESTAMP WITH TIME ZONE,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    description VARCHAR,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                CREATE INDEX idx_coupons_code ON coupons(code);
                CREATE INDEX idx_coupons_is_active ON coupons(is_active);
            """)
            db.execute(create_coupons)
            db.commit()
            print("✅ [DATABASE] Migration completed: coupons table created")
        
        # Migration 10: Create coupon_usages table
        check_coupon_usages = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='coupon_usages';
        """)
        
        result_coupon_usages = db.execute(check_coupon_usages).fetchone()
        
        if not result_coupon_usages:
            print("🔵 [DATABASE] Running migration: Creating coupon_usages table...")
            create_coupon_usages = text("""
                CREATE TABLE coupon_usages (
                    id SERIAL PRIMARY KEY,
                    coupon_id INTEGER NOT NULL,
                    user_id VARCHAR NOT NULL,
                    applied_to VARCHAR,
                    discount_amount FLOAT,
                    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
                CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
            """)
            db.execute(create_coupon_usages)
            db.commit()
            print("✅ [DATABASE] Migration completed: coupon_usages table created")
        
        # Migration 11: Add Allpay fields to subscriptions table
        check_allpay_fields = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='subscriptions' AND column_name='allpay_order_id';
        """)
        
        result_allpay = db.execute(check_allpay_fields).fetchone()
        
        if not result_allpay:
            print("🔵 [DATABASE] Running migration: Adding Allpay fields to subscriptions...")
            alter_subscriptions = text("""
                ALTER TABLE subscriptions
                ADD COLUMN allpay_order_id VARCHAR(255) UNIQUE,
                ADD COLUMN allpay_payment_id VARCHAR(255),
                ADD COLUMN allpay_recurring_id VARCHAR(255);
                
                CREATE INDEX IF NOT EXISTS idx_subscriptions_allpay_order_id ON subscriptions(allpay_order_id);
            """)
            db.execute(alter_subscriptions)
            db.commit()
            print("✅ [DATABASE] Migration completed: Allpay fields added to subscriptions")
        
        # Migration 12: Add Allpay pricing settings
        check_allpay_prices = text("""
            SELECT key 
            FROM app_settings 
            WHERE key='allpay_monthly_price';
        """)
        
        result_allpay_prices = db.execute(check_allpay_prices).fetchone()
        
        if not result_allpay_prices:
            print("🔵 [DATABASE] Running migration: Adding Allpay pricing settings...")
            insert_allpay_prices = text("""
                INSERT INTO app_settings (key, value, description) VALUES
                ('allpay_monthly_price', '5.00', 'מחיר תשלום חודשי ב-Allpay (ILS)'),
                ('allpay_yearly_price', '50.00', 'מחיר תשלום שנתי ב-Allpay (ILS) - משלם על 10 חודשים, מקבל 12')
                ON CONFLICT (key) DO NOTHING;
            """)
            db.execute(insert_allpay_prices)
            db.commit()
            print("✅ [DATABASE] Migration completed: Allpay pricing settings added")
        
        # Migration 13: Create support_tickets table
        check_support_tickets = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='support_tickets';
        """)
        
        result_support_tickets = db.execute(check_support_tickets).fetchone()
        
        if not result_support_tickets:
            print("🔵 [DATABASE] Running migration: Creating support_tickets table...")
            create_support_tickets = text("""
                CREATE TABLE support_tickets (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR,
                    subject VARCHAR NOT NULL,
                    message TEXT NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'open',
                    priority VARCHAR NOT NULL DEFAULT 'medium',
                    email VARCHAR,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
                CREATE INDEX idx_support_tickets_status ON support_tickets(status);
            """)
            db.execute(create_support_tickets)
            db.commit()
            print("✅ [DATABASE] Migration completed: support_tickets table created")

        # Migration 14: Add ads_enabled setting
        check_ads_setting = text("""
            SELECT key 
            FROM app_settings 
            WHERE key='ads_enabled';
        """)
        
        result_ads = db.execute(check_ads_setting).fetchone()
        
        if not result_ads:
            print("🔵 [DATABASE] Running migration: Adding ads_enabled setting...")
            insert_ads = text("""
                INSERT INTO app_settings (key, value, description) VALUES
                ('ads_enabled', 'false', 'האם להציג פרסומות למשתמשים בגרסה החינמית')
                ON CONFLICT (key) DO NOTHING;
            """)
            db.execute(insert_ads)
            db.commit()
            print("✅ [DATABASE] Migration completed: ads_enabled setting added")
        
        # Migration 15: Add donation_enabled setting
        check_donation_setting = text("""
            SELECT key
            FROM app_settings
            WHERE key='donation_enabled';
        """)

        result_donation = db.execute(check_donation_setting).fetchone()

        if not result_donation:
            print("🔵 [DATABASE] Running migration: Adding donation_enabled setting...")
            insert_donation = text("""
                INSERT INTO app_settings (key, value, description) VALUES
                ('donation_enabled', 'false', 'האם לאפשר תרומות ושדרוג לפרימיום באפליקציה')
                ON CONFLICT (key) DO NOTHING;
            """)
            db.execute(insert_donation)
            db.commit()
            print("✅ [DATABASE] Migration completed: donation_enabled setting added")

        # Migration 16: Add rewarded_video_bonus column to usage_stats
        check_rewarded_column = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='usage_stats' AND column_name='rewarded_video_bonus';
        """)

        result_rewarded = db.execute(check_rewarded_column).fetchone()

        if not result_rewarded:
            print("🔵 [DATABASE] Running migration: Adding rewarded_video_bonus column to usage_stats...")
            add_rewarded_column = text("""
                ALTER TABLE usage_stats
                ADD COLUMN IF NOT EXISTS rewarded_video_bonus INTEGER NOT NULL DEFAULT 0;
            """)
            db.execute(add_rewarded_column)
            db.commit()
            print("✅ [DATABASE] Migration completed: rewarded_video_bonus column added")

        print("✅ [DATABASE] All migrations completed successfully")
    except Exception as e:
        db.rollback()
        print(f"⚠️  [DATABASE] Migration warning: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - allow app to continue even if migration fails
    finally:
        db.close()

