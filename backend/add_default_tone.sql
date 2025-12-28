-- Migration script to add default_tone column to contacts table
-- Run this in Railway PostgreSQL Query tab or via psql

-- Check if column exists (optional - will fail gracefully if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'default_tone'
    ) THEN
        ALTER TABLE contacts 
        ADD COLUMN default_tone VARCHAR DEFAULT 'friendly';
        
        -- Update existing rows to have 'friendly' as default
        UPDATE contacts 
        SET default_tone = 'friendly' 
        WHERE default_tone IS NULL;
        
        RAISE NOTICE 'Column default_tone added successfully';
    ELSE
        RAISE NOTICE 'Column default_tone already exists';
    END IF;
END $$;









