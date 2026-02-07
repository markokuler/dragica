-- =============================================
-- DRAGICA - Seed Data for Local Development
-- =============================================
-- Run with: supabase db reset (applies migrations + seed)

-- Clean existing data (in correct order due to FK constraints)
TRUNCATE financial_entries, bookings, blocked_slots, customers, working_hours, services, users, tenants CASCADE;

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
-- Note: This user needs to exist in auth.users first
-- For local dev, create via Supabase Studio or API

-- =============================================
-- SERVICES - Milana Nails
-- =============================================
INSERT INTO services (id, tenant_id, name, duration_minutes, price, is_active) VALUES
  ('s1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - klasičan', 45, 1500.00, true),
  ('s1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - gel lak', 60, 2000.00, true),
  ('s1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manikir - gel nadogradnja', 90, 3500.00, true),
  ('s1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pedikir - klasičan', 60, 2000.00, true),
  ('s1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pedikir - spa', 90, 3000.00, true),
  ('s1000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nail art - po noktu', 15, 200.00, true),
  ('s1000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Skidanje gela', 30, 800.00, true);

-- =============================================
-- SERVICES - Lepota Salon
-- =============================================
INSERT INTO services (id, tenant_id, name, duration_minutes, price, is_active) VALUES
  ('s2000001-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Žensko šišanje', 45, 1800.00, true),
  ('s2000001-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Muško šišanje', 30, 1200.00, true),
  ('s2000001-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farbanje - kratka kosa', 90, 4000.00, true),
  ('s2000001-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farbanje - duga kosa', 120, 5500.00, true),
  ('s2000001-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Feniranje', 30, 1000.00, true),
  ('s2000001-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Pramenovi', 150, 7000.00, true);

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
  ('b1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000001', 's1000001-0000-0000-0000-000000000002',
   DATE_TRUNC('day', NOW()) + INTERVAL '10 hours', DATE_TRUNC('day', NOW()) + INTERVAL '11 hours', 'confirmed', NOW()),
  ('b1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000002', 's1000001-0000-0000-0000-000000000003',
   DATE_TRUNC('day', NOW()) + INTERVAL '11 hours', DATE_TRUNC('day', NOW()) + INTERVAL '12 hours 30 minutes', 'pending', NOW()),
  ('b1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000003', 's1000001-0000-0000-0000-000000000001',
   DATE_TRUNC('day', NOW()) + INTERVAL '14 hours', DATE_TRUNC('day', NOW()) + INTERVAL '14 hours 45 minutes', 'confirmed', NOW());

-- Tomorrow's bookings
INSERT INTO bookings (id, tenant_id, customer_id, service_id, start_datetime, end_datetime, status, created_at) VALUES
  ('b1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000004', 's1000001-0000-0000-0000-000000000005',
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '9 hours', DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes', 'confirmed', NOW()),
  ('b1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000005', 's1000001-0000-0000-0000-000000000002',
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '13 hours', DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours', 'pending', NOW());

-- Past bookings (for statistics)
INSERT INTO bookings (id, tenant_id, customer_id, service_id, start_datetime, end_datetime, status, created_at) VALUES
  ('b1000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000001', 's1000001-0000-0000-0000-000000000002',
   NOW() - INTERVAL '7 days' + INTERVAL '10 hours', NOW() - INTERVAL '7 days' + INTERVAL '11 hours', 'completed', NOW() - INTERVAL '7 days'),
  ('b1000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000002', 's1000001-0000-0000-0000-000000000003',
   NOW() - INTERVAL '5 days' + INTERVAL '14 hours', NOW() - INTERVAL '5 days' + INTERVAL '15 hours 30 minutes', 'completed', NOW() - INTERVAL '5 days'),
  ('b1000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000003', 's1000001-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 days' + INTERVAL '11 hours', NOW() - INTERVAL '3 days' + INTERVAL '11 hours 45 minutes', 'cancelled', NOW() - INTERVAL '3 days'),
  ('b1000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1000001-0000-0000-0000-000000000004', 's1000001-0000-0000-0000-000000000004',
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
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'Usluge', 2000.00, 'Manikir - gel lak', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'Usluge', 3500.00, 'Manikir - gel nadogradnja', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'income', 'Usluge', 2000.00, 'Pedikir - klasičan', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'Materijal', 5000.00, 'Gel lakovi - nabavka', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'Kirija', 30000.00, 'Mesečna kirija - Februar', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'expense', 'Komunalije', 8000.00, 'Struja + voda', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- =============================================
-- Summary
-- =============================================
-- Test salons: 2 (milana-nails, lepota-salon)
-- Services: 7 + 6 = 13
-- Customers: 5
-- Bookings: 9 (mix of statuses)
-- Blocked slots: 2
-- Financial entries: 6
