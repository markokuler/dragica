-- Add notes column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
