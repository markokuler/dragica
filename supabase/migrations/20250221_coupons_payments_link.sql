-- =============================================
-- Link coupons with payments
-- =============================================
-- Adds coupon_id and original_amount to payments table
-- so admin can apply coupons when recording payments

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_payments_coupon ON payments(coupon_id);
