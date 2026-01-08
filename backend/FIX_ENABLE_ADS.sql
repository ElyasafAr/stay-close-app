-- Fix: Enable ads in the database
-- Run this SQL script in your PostgreSQL database to enable ads

-- Update ads_enabled to true
UPDATE app_settings
SET value = 'true'
WHERE key = 'ads_enabled';

-- Verify the update
SELECT key, value, description
FROM app_settings
WHERE key IN ('ads_enabled', 'donation_enabled');

-- Expected result:
-- ads_enabled  | true  | האם להציג פרסומות למשתמשים בגרסה החינמית
-- donation_enabled | [current value] | [description]
