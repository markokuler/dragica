-- =============================================
-- SUBSCRIPTION SYSTEM FOR DRAGICA SAAS
-- =============================================

-- 1. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, duration_days, price, is_trial, features) VALUES
  ('Free Trial', 30, 0, true, '["Sve funkcije", "30 dana besplatno"]'::jsonb),
  ('Mesečni', 30, 2990, false, '["Sve funkcije", "Email podrška"]'::jsonb),
  ('6 meseci', 180, 14990, false, '["Sve funkcije", "Email podrška", "10% popust"]'::jsonb),
  ('Godišnji', 365, 24990, false, '["Sve funkcije", "Prioritetna podrška", "30% popust"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 2. Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'payment_pending', 'cancelled')),
  trial_days INTEGER, -- Custom trial duration if different from default
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_expires ON tenant_subscriptions(expires_at);

-- 3. Payments (Manual Recording)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  recorded_by UUID, -- Admin who recorded the payment
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for payment history
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 4. Add subscription fields to tenants table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_status') THEN
    ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE tenants ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 5. Function to check and update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tenant's subscription status based on subscription
  UPDATE tenants
  SET
    subscription_status = NEW.status,
    subscription_expires_at = NEW.expires_at
  WHERE id = NEW.tenant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync subscription status to tenant
DROP TRIGGER IF EXISTS sync_subscription_status ON tenant_subscriptions;
CREATE TRIGGER sync_subscription_status
AFTER INSERT OR UPDATE ON tenant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_status();

-- 6. Function to auto-expire subscriptions (can be called by cron)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE tenant_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() AND status = 'active';

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- 7. View for subscription overview
CREATE OR REPLACE VIEW subscription_overview AS
SELECT
  t.id AS tenant_id,
  t.name AS salon_name,
  t.email,
  t.is_active,
  sp.name AS plan_name,
  sp.price AS plan_price,
  ts.started_at,
  ts.expires_at,
  ts.status,
  CASE
    WHEN ts.expires_at < NOW() THEN 'expired'
    WHEN ts.expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
    ELSE 'ok'
  END AS expiry_status,
  (ts.expires_at - NOW()) AS time_remaining
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
  AND ts.id = (SELECT id FROM tenant_subscriptions WHERE tenant_id = t.id ORDER BY created_at DESC LIMIT 1)
LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id;
