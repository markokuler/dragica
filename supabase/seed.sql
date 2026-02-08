-- =============================================
-- DRAGICA - Seed Data for Local Development
-- =============================================
-- Run with: supabase db reset (applies migrations + seed)

-- Clean existing data (in correct order due to FK constraints)
TRUNCATE admin_message_log, admin_message_templates, salon_tags, payments, coupons, financial_entries, bookings, blocked_slots, customers, working_hours, services, users, tenants CASCADE;

-- =============================================
-- TEST SALON: Milana Nails
-- =============================================
INSERT INTO tenants (id, slug, name, email, phone, subdomain, logo_url, accent_color, description, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'milana-nails',
  'Milana Nails Studio',
  'milana@test.local',
  '+381601234567',
  'milana-nails',
  NULL,
  '#C17F59',
  'Profesionalni salon za negu noktiju u centru Beograda. Specijalizovani za gel, akril i nail art.',
  true
);

-- =============================================
-- TEST SALON 2: Lepota Salon
-- =============================================
INSERT INTO tenants (id, slug, name, email, phone, subdomain, logo_url, accent_color, description, is_active)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'lepota-salon',
  'Lepota Frizerski Salon',
  'lepota@test.local',
  '+381607654321',
  'lepota-salon',
  NULL,
  '#6B9B7A',
  'Frizerski salon za žene i muškarce. Šišanje, farbanje, feniranje.',
  true
);

-- =============================================
-- ADMIN USER (super admin)
-- =============================================
-- Create admin in auth.users (local dev only)
-- GoTrue requires all varchar/text columns to be '' not NULL
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  created_at, updated_at
)
VALUES (
  'ad000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@dragica.local',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  '{"role": "admin"}'::jsonb,
  '', '',
  '', '', '',
  '', '',
  '',
  NOW(),
  NOW()
);

-- Also need identity record for email/password login to work
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'ad000000-0000-0000-0000-000000000001',
  'ad000000-0000-0000-0000-000000000001',
  'admin@dragica.local',
  jsonb_build_object('sub', 'ad000000-0000-0000-0000-000000000001', 'email', 'admin@dragica.local'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- The trigger (20250209) auto-creates public.users from raw_user_meta_data
-- But seed runs after migrations, so trigger should fire.
-- Safety net: explicit insert with ON CONFLICT
INSERT INTO users (id, email, role, tenant_id)
VALUES ('ad000000-0000-0000-0000-000000000001', 'admin@dragica.local', 'admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create test salon owner in auth
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  created_at, updated_at
)
VALUES (
  'ad000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'milana@test.local',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  jsonb_build_object('role', 'client', 'tenant_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  '', '',
  '', '', '',
  '', '',
  '',
  NOW(),
  NOW()
);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'ad000000-0000-0000-0000-000000000002',
  'ad000000-0000-0000-0000-000000000002',
  'milana@test.local',
  jsonb_build_object('sub', 'ad000000-0000-0000-0000-000000000002', 'email', 'milana@test.local'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO users (id, email, role, tenant_id)
VALUES ('ad000000-0000-0000-0000-000000000002', 'milana@test.local', 'client', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SERVICES - Milana Nails
-- =============================================
INSERT INTO services (id, tenant_id, name, duration_minutes, price, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - klasičan', 45, 1500.00, true),
  ('a0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - gel lak', 60, 2000.00, true),
  ('a0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - gel nadogradnja', 90, 3500.00, true),
  ('a0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pedikir - klasičan', 60, 2000.00, true),
  ('a0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pedikir - spa', 90, 3000.00, true),
  ('a0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nail art - po noktu', 15, 200.00, true),
  ('a0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Skidanje gela', 30, 800.00, true);

-- =============================================
-- SERVICES - Lepota Salon
-- =============================================
INSERT INTO services (id, tenant_id, name, duration_minutes, price, is_active) VALUES
  ('a0000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Žensko šišanje', 45, 1800.00, true),
  ('a0000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Muško šišanje', 30, 1200.00, true),
  ('a0000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farbanje - kratka kosa', 90, 4000.00, true),
  ('a0000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farbanje - duga kosa', 120, 5500.00, true),
  ('a0000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Feniranje', 30, 1000.00, true),
  ('a0000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Pramenovi', 150, 7000.00, true);

-- =============================================
-- WORKING HOURS - Milana Nails (Mon-Sat 09:00-20:00)
-- =============================================
INSERT INTO working_hours (tenant_id, day_of_week, start_time, end_time, is_active) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '09:00', '20:00', true),  -- Monday
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '09:00', '20:00', true),  -- Tuesday
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '09:00', '20:00', true),  -- Wednesday
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '09:00', '20:00', true),  -- Thursday
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '09:00', '20:00', true),  -- Friday
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '10:00', '16:00', true);  -- Saturday (shorter)

-- =============================================
-- WORKING HOURS - Lepota Salon (Tue-Sat 10:00-19:00)
-- =============================================
INSERT INTO working_hours (tenant_id, day_of_week, start_time, end_time, is_active) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 2, '10:00', '19:00', true),  -- Tuesday
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 3, '10:00', '19:00', true),  -- Wednesday
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 4, '10:00', '19:00', true),  -- Thursday
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 5, '10:00', '19:00', true),  -- Friday
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 6, '09:00', '15:00', true);  -- Saturday

-- =============================================
-- TEST CUSTOMERS - Milana Nails
-- =============================================
INSERT INTO customers (id, tenant_id, phone, name, created_at) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+381641111111', 'Marija Petrović', NOW() - INTERVAL '30 days'),
  ('c1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+381642222222', 'Ana Jovanović', NOW() - INTERVAL '25 days'),
  ('c1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+381643333333', 'Jelena Nikolić', NOW() - INTERVAL '20 days'),
  ('c1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+381644444444', 'Ivana Đorđević', NOW() - INTERVAL '15 days'),
  ('c1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+381645555555', 'Milica Stojanović', NOW() - INTERVAL '10 days');

-- =============================================
-- TEST BOOKINGS - Milana Nails (various statuses)
-- =============================================
-- Today's bookings
INSERT INTO bookings (id, tenant_id, customer_id, service_id, start_datetime, end_datetime, status, created_at) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002',
   DATE_TRUNC('day', NOW()) + INTERVAL '10 hours', DATE_TRUNC('day', NOW()) + INTERVAL '11 hours', 'confirmed', NOW()),
  ('b1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003',
   DATE_TRUNC('day', NOW()) + INTERVAL '11 hours', DATE_TRUNC('day', NOW()) + INTERVAL '12 hours 30 minutes', 'pending', NOW()),
  ('b1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001',
   DATE_TRUNC('day', NOW()) + INTERVAL '14 hours', DATE_TRUNC('day', NOW()) + INTERVAL '14 hours 45 minutes', 'confirmed', NOW());

-- Tomorrow's bookings
INSERT INTO bookings (id, tenant_id, customer_id, service_id, start_datetime, end_datetime, status, created_at) VALUES
  ('b1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005',
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '9 hours', DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes', 'confirmed', NOW()),
  ('b1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002',
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '13 hours', DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours', 'pending', NOW());

-- Past bookings (for statistics)
INSERT INTO bookings (id, tenant_id, customer_id, service_id, start_datetime, end_datetime, status, created_at) VALUES
  ('b1000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002',
   NOW() - INTERVAL '7 days' + INTERVAL '10 hours', NOW() - INTERVAL '7 days' + INTERVAL '11 hours', 'completed', NOW() - INTERVAL '7 days'),
  ('b1000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003',
   NOW() - INTERVAL '5 days' + INTERVAL '14 hours', NOW() - INTERVAL '5 days' + INTERVAL '15 hours 30 minutes', 'completed', NOW() - INTERVAL '5 days'),
  ('b1000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 days' + INTERVAL '11 hours', NOW() - INTERVAL '3 days' + INTERVAL '11 hours 45 minutes', 'cancelled', NOW() - INTERVAL '3 days'),
  ('b1000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004',
   NOW() - INTERVAL '2 days' + INTERVAL '15 hours', NOW() - INTERVAL '2 days' + INTERVAL '16 hours', 'completed', NOW() - INTERVAL '2 days');

-- =============================================
-- BLOCKED SLOTS - Milana Nails
-- =============================================
INSERT INTO blocked_slots (tenant_id, start_datetime, end_datetime, reason) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', DATE_TRUNC('day', NOW()) + INTERVAL '2 days' + INTERVAL '12 hours', DATE_TRUNC('day', NOW()) + INTERVAL '2 days' + INTERVAL '14 hours', 'Pauza za ručak'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', DATE_TRUNC('day', NOW()) + INTERVAL '5 days', DATE_TRUNC('day', NOW()) + INTERVAL '5 days' + INTERVAL '23 hours 59 minutes', 'Državni praznik');

-- =============================================
-- FINANCIAL ENTRIES - Milana Nails
-- =============================================
INSERT INTO financial_entries (tenant_id, type, category, amount, description, entry_date, created_at) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'booking', 2000.00, 'Manikir - gel lak', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'booking', 3500.00, 'Manikir - gel nadogradnja', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'booking', 2000.00, 'Pedikir - klasičan', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'supplies', 5000.00, 'Gel lakovi - nabavka', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'rent', 30000.00, 'Mesečna kirija - Februar', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'utilities', 8000.00, 'Struja + voda', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- =============================================
-- DEMO ACCOUNTS (for testing demo login locally)
-- =============================================
-- Demo tenant
INSERT INTO tenants (id, slug, name, email, phone, subdomain, accent_color, description, is_active, is_demo, subscription_status, subscription_expires_at)
VALUES (
  'de000000-0000-0000-0000-000000000001',
  'dragica-demo',
  'Dragica Demo Salon',
  'demo-salon@dragica.local',
  '+381600000000',
  'demo',
  '#C17F59',
  'Demo salon za isprobavanje Dragica platforme.',
  true,
  true,
  'active',
  (NOW() + INTERVAL '10 years')
);

-- Demo admin auth user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  created_at, updated_at
)
VALUES (
  'de000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'demo-admin@dragica.local',
  crypt('demo1234', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  '{"role": "admin"}'::jsonb,
  '', '',
  '', '', '',
  '', '',
  '',
  NOW(),
  NOW()
);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'de000000-0000-0000-0000-000000000010',
  'de000000-0000-0000-0000-000000000010',
  'demo-admin@dragica.local',
  jsonb_build_object('sub', 'de000000-0000-0000-0000-000000000010', 'email', 'demo-admin@dragica.local'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO users (id, email, role, tenant_id, is_demo)
VALUES ('de000000-0000-0000-0000-000000000010', 'demo-admin@dragica.local', 'admin', NULL, true)
ON CONFLICT (id) DO UPDATE SET is_demo = true;

-- Demo salon owner auth user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  created_at, updated_at
)
VALUES (
  'de000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'demo-salon@dragica.local',
  crypt('demo1234', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  jsonb_build_object('role', 'client', 'tenant_id', 'de000000-0000-0000-0000-000000000001'),
  '', '',
  '', '', '',
  '', '',
  '',
  NOW(),
  NOW()
);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'de000000-0000-0000-0000-000000000020',
  'de000000-0000-0000-0000-000000000020',
  'demo-salon@dragica.local',
  jsonb_build_object('sub', 'de000000-0000-0000-0000-000000000020', 'email', 'demo-salon@dragica.local'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO users (id, email, role, tenant_id, is_demo)
VALUES ('de000000-0000-0000-0000-000000000020', 'demo-salon@dragica.local', 'client', 'de000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO UPDATE SET is_demo = true, tenant_id = 'de000000-0000-0000-0000-000000000001';

-- Demo services
INSERT INTO services (tenant_id, name, duration_minutes, price, is_active) VALUES
  ('de000000-0000-0000-0000-000000000001', 'Manikir - klasičan', 45, 1500.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Manikir - gel lak', 60, 2000.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Manikir - gel nadogradnja', 90, 3500.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Pedikir - klasičan', 60, 2000.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Pedikir - spa', 90, 3000.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Nail art - po noktu', 15, 200.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Skidanje gela', 30, 800.00, true),
  ('de000000-0000-0000-0000-000000000001', 'Manikir + Pedikir combo', 105, 3200.00, true);

-- Demo working hours
INSERT INTO working_hours (tenant_id, day_of_week, start_time, end_time, is_active) VALUES
  ('de000000-0000-0000-0000-000000000001', 1, '09:00', '20:00', true),
  ('de000000-0000-0000-0000-000000000001', 2, '09:00', '20:00', true),
  ('de000000-0000-0000-0000-000000000001', 3, '09:00', '20:00', true),
  ('de000000-0000-0000-0000-000000000001', 4, '09:00', '20:00', true),
  ('de000000-0000-0000-0000-000000000001', 5, '09:00', '20:00', true),
  ('de000000-0000-0000-0000-000000000001', 6, '10:00', '16:00', true);

-- =============================================
-- COUPONS (demo + test)
-- =============================================
INSERT INTO coupons (id, code, discount_type, discount_value, max_uses, valid_from, valid_until, description, is_active, is_demo) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'POPUST20', 'percentage', 20.00, 10, '2025-01-01', '2027-12-31', 'Popust 20% za nove salone', true, true),
  ('c0000000-0000-0000-0000-000000000002', 'POPUST500', 'fixed', 500.00, 5, '2025-01-01', '2027-12-31', 'Fiksni popust 500 RSD', true, true),
  ('c0000000-0000-0000-0000-000000000003', 'PROMO50', 'percentage', 50.00, 3, '2025-01-01', '2026-06-30', 'Promotivni 50% popust (limitiran)', true, true);

-- =============================================
-- PAYMENTS with coupon references (demo)
-- =============================================
INSERT INTO payments (id, tenant_id, plan_id, amount, original_amount, payment_date, recorded_by, notes, coupon_id) VALUES
  ('aa000000-0000-0000-0000-000000000e01',
   'de000000-0000-0000-0000-000000000001',
   (SELECT id FROM subscription_plans WHERE name = 'Mesečni' LIMIT 1),
   2392, 2990,
   (CURRENT_DATE - INTERVAL '30 days')::date,
   'de000000-0000-0000-0000-000000000010',
   'Uplata sa kuponom POPUST20',
   'c0000000-0000-0000-0000-000000000001'),
  ('aa000000-0000-0000-0000-000000000e02',
   'de000000-0000-0000-0000-000000000001',
   (SELECT id FROM subscription_plans WHERE name = 'Mesečni' LIMIT 1),
   2490, 2990,
   CURRENT_DATE::date,
   'de000000-0000-0000-0000-000000000010',
   'Uplata sa kuponom POPUST500',
   'c0000000-0000-0000-0000-000000000002');

-- =============================================
-- SALON TAGS
-- =============================================
INSERT INTO salon_tags (name, color) VALUES
  ('VIP klijent', '#B8860B'),
  ('Novi salon', '#4CAF50'),
  ('Problem', '#F44336'),
  ('Redovan', '#2196F3'),
  ('Preporuka', '#9C27B0'),
  ('Probni', '#E67700');

-- =============================================
-- ADMIN MESSAGE TEMPLATES
-- =============================================
INSERT INTO admin_message_templates (trigger_type, channel, name, message_body) VALUES
  ('subscription_expiring', 'whatsapp', 'Istek pretplate - WhatsApp', 'Poštovani {salon_name}, vaša pretplata ističe za {days_left} dana ({expiry_date}). Produžite na vreme da ne izgubite pristup.'),
  ('subscription_expiring', 'viber', 'Istek pretplate - Viber', 'Poštovani {salon_name}, vaša pretplata ističe za {days_left} dana ({expiry_date}). Produžite na vreme da ne izgubite pristup.'),
  ('inactivity', 'whatsapp', 'Neaktivnost - WhatsApp', 'Poštovani {salon_name}, primetili smo da niste koristili Dragica aplikaciju duže od 2 nedelje. Da li vam je potrebna pomoć?'),
  ('inactivity', 'viber', 'Neaktivnost - Viber', 'Poštovani {salon_name}, primetili smo da niste koristili Dragica aplikaciju duže od 2 nedelje. Da li vam je potrebna pomoć?'),
  ('welcome', 'whatsapp', 'Dobrodošlica - WhatsApp', 'Dobrodošli u Dragica! {salon_name}, vaš nalog je aktivan. Kontaktirajte nas za pomoć pri podešavanju.'),
  ('welcome', 'viber', 'Dobrodošlica - Viber', 'Dobrodošli u Dragica! {salon_name}, vaš nalog je aktivan. Kontaktirajte nas za pomoć pri podešavanju.');

-- =============================================
-- APP SETTINGS (global defaults)
-- =============================================
INSERT INTO app_settings (key, value) VALUES
  ('global', '{"default_trial_days": 14, "default_working_hours_start": "09:00", "default_working_hours_end": "20:00", "default_slot_duration": 30, "max_booking_advance_days": 90, "reminder_hours_before": 24, "app_name": "Dragica", "support_email": "podrska@dragica.rs"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Summary
-- =============================================
-- Users: admin@dragica.local (admin/admin123), milana@test.local (client/test1234)
-- Demo: demo-admin@dragica.local (admin/demo1234), demo-salon@dragica.local (client/demo1234)
-- Test salons: 2 (milana-nails, lepota-salon) + 1 demo (dragica-demo)
-- Services: 7 + 6 + 8 = 21
-- Customers: 5
-- Bookings: 9 (mix of statuses)
-- Blocked slots: 2
-- Financial entries: 6
-- Coupons: 3 (demo, with usage tracking)
-- Payments: 2 (demo, linked to coupons)
-- Salon tags: 6
-- Message templates: 6 (3 triggers x 2 channels)
