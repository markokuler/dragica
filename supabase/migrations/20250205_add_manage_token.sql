-- Add manage_token column to bookings table
-- This token allows clients to modify/cancel their bookings via a unique link

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS manage_token UUID DEFAULT NULL;

-- Create index for faster lookups by manage_token
CREATE INDEX IF NOT EXISTS idx_bookings_manage_token
ON bookings(tenant_id, manage_token)
WHERE manage_token IS NOT NULL;

-- Generate manage_token for existing bookings that don't have one
UPDATE bookings
SET manage_token = gen_random_uuid()
WHERE manage_token IS NULL
  AND status IN ('pending', 'confirmed');

COMMENT ON COLUMN bookings.manage_token IS 'Unique token for client to manage (cancel/reschedule) their booking via link';
