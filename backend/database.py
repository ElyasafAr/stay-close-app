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
        else:
            print("✅ [DATABASE] Schema is up to date")
    except Exception as e:
        db.rollback()
        print(f"⚠️  [DATABASE] Migration warning: {e}")
        # Don't raise - allow app to continue even if migration fails
    finally:
        db.close()

