-- Add is_demo flag to admin tables for demo data separation
-- Demo admin sees is_demo=true entries, real admin sees is_demo=false

ALTER TABLE admin_financial_entries ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
