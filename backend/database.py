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
    Initialize database - create all tables
    Call this once when starting the application
    """
    print("🔵 [DATABASE] Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ [DATABASE] Database tables created successfully")
    except Exception as e:
        print(f"❌ [DATABASE] Error creating tables: {e}")
        raise

