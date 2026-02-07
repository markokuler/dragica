-- =============================================
-- Admin Messaging System
-- =============================================
-- Adds notification_channel to tenants, message templates, and message log

-- 1. Add notification_channel to tenants (preferred channel for admin auto-messages)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS notification_channel TEXT
  CHECK (notification_channel IN ('whatsapp', 'viber'));

-- 2. Message templates for automatic admin messages
CREATE TABLE admin_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'subscription_expiring',
    'inactivity',
    'welcome'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'viber')),
  name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Message log for tracking sent messages (auto + manual)
CREATE TABLE admin_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES admin_message_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'viber')),
  trigger_type TEXT,
  phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_by UUID REFERENCES auth.users(id),
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_message_log_tenant ON admin_message_log(tenant_id);
CREATE INDEX idx_message_log_created ON admin_message_log(created_at DESC);
