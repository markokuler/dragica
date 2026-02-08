-- =============================================
-- Seed demo coupons (needed on staging/production)
-- =============================================

INSERT INTO coupons (id, code, discount_type, discount_value, max_uses, valid_from, valid_until, description, is_active, is_demo)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'POPUST20', 'percentage', 20.00, 10, '2025-01-01', '2027-12-31', 'Popust 20% za nove salone', true, true),
  ('c0000000-0000-0000-0000-000000000002', 'POPUST500', 'fixed', 500.00, 5, '2025-01-01', '2027-12-31', 'Fiksni popust 500 RSD', true, true),
  ('c0000000-0000-0000-0000-000000000003', 'PROMO50', 'percentage', 50.00, 3, '2025-01-01', '2026-06-30', 'Promotivni 50% popust (limitiran)', true, true)
ON CONFLICT (code) DO NOTHING;
