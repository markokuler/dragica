-- Add 'noshow' to booking_status enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'noshow';
