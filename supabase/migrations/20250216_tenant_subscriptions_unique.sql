-- Add UNIQUE constraint on tenant_id in tenant_subscriptions
-- This enables upsert (ON CONFLICT tenant_id) when recording payments

-- Remove duplicates first (keep newest per tenant)
DELETE FROM tenant_subscriptions a
USING tenant_subscriptions b
WHERE a.tenant_id = b.tenant_id
  AND a.created_at < b.created_at;

ALTER TABLE tenant_subscriptions
  ADD CONSTRAINT tenant_subscriptions_tenant_id_unique UNIQUE (tenant_id);
