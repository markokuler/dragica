-- Add is_demo flag to tenants and users tables
-- Used to isolate demo data from production data

ALTER TABLE tenants ADD COLUMN is_demo BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN is_demo BOOLEAN DEFAULT false;

-- Index for fast filtering
CREATE INDEX idx_tenants_is_demo ON tenants (is_demo) WHERE is_demo = true;
CREATE INDEX idx_users_is_demo ON users (is_demo) WHERE is_demo = true;
