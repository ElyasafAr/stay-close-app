-- Migration: Add notification_platform column to users table
-- Run this on Railway PostgreSQL

-- Add the new column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_platform VARCHAR(20) NOT NULL DEFAULT 'both';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'notification_platform';
