-- Add payment_id to admin_financial_entries for auto-linking subscription payments
ALTER TABLE admin_financial_entries
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_finances_payment ON admin_financial_entries(payment_id);
