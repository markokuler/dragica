-- Migration: Add phone_normalized column with trigger-based normalization
-- This ensures consistent phone lookup regardless of input format

-- 1. Add phone_normalized column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_normalized TEXT;

-- 2. Create normalization function: strips non-digits, removes leading "00"
CREATE OR REPLACE FUNCTION normalize_phone(raw TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  digits TEXT;
BEGIN
  IF raw IS NULL OR raw = '' THEN
    RETURN NULL;
  END IF;
  -- Strip everything except digits
  digits := regexp_replace(raw, '\D', '', 'g');
  -- Remove leading 00 (international prefix)
  IF digits LIKE '00%' THEN
    digits := substring(digits FROM 3);
  END IF;
  RETURN digits;
END;
$$;

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION trg_normalize_phone()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.phone_normalized := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$;

-- 4. Create trigger (fires on INSERT or UPDATE of phone column)
DROP TRIGGER IF EXISTS normalize_customer_phone ON customers;
CREATE TRIGGER normalize_customer_phone
  BEFORE INSERT OR UPDATE OF phone ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trg_normalize_phone();

-- 5. Backfill existing rows (UPDATE phone=phone fires the trigger)
UPDATE customers SET phone = phone;

-- 6. Replace old UNIQUE constraint with phone_normalized
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_phone_normalized_key UNIQUE (tenant_id, phone_normalized);

-- 7. Replace old index with phone_normalized index
DROP INDEX IF EXISTS idx_customers_phone;
CREATE INDEX idx_customers_phone_normalized ON customers(tenant_id, phone_normalized);
