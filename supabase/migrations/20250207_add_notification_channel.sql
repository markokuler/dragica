-- Add notification_channel column to customers table
-- Run this in Supabase SQL Editor

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS notification_channel TEXT CHECK (notification_channel IN ('whatsapp', 'viber'));

-- Add comment for documentation
COMMENT ON COLUMN customers.notification_channel IS 'Preferred notification channel: whatsapp or viber';
