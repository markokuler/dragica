-- =============================================
-- Reference/config data that the app needs to function
-- These must be in a migration, not just seed.sql
-- =============================================

-- Salon tags (global tag pool for classifying salons)
INSERT INTO salon_tags (name, color) VALUES
  ('VIP klijent', '#B8860B'),
  ('Novi salon', '#4CAF50'),
  ('Problem', '#F44336'),
  ('Redovan', '#2196F3'),
  ('Preporuka', '#9C27B0'),
  ('Probni', '#E67700')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

-- Admin message templates (for WA/Viber messaging system)
INSERT INTO admin_message_templates (trigger_type, channel, name, message_body)
SELECT * FROM (VALUES
  ('subscription_expiring', 'whatsapp', 'Istek pretplate - WhatsApp', 'Poštovani {salon_name}, vaša pretplata ističe za {days_left} dana ({expiry_date}). Produžite na vreme da ne izgubite pristup.'),
  ('subscription_expiring', 'viber', 'Istek pretplate - Viber', 'Poštovani {salon_name}, vaša pretplata ističe za {days_left} dana ({expiry_date}). Produžite na vreme da ne izgubite pristup.'),
  ('inactivity', 'whatsapp', 'Neaktivnost - WhatsApp', 'Poštovani {salon_name}, primetili smo da niste koristili Dragica aplikaciju duže od 2 nedelje. Da li vam je potrebna pomoć?'),
  ('inactivity', 'viber', 'Neaktivnost - Viber', 'Poštovani {salon_name}, primetili smo da niste koristili Dragica aplikaciju duže od 2 nedelje. Da li vam je potrebna pomoć?'),
  ('welcome', 'whatsapp', 'Dobrodošlica - WhatsApp', 'Dobrodošli u Dragica! {salon_name}, vaš nalog je aktivan. Kontaktirajte nas za pomoć pri podešavanju.'),
  ('welcome', 'viber', 'Dobrodošlica - Viber', 'Dobrodošli u Dragica! {salon_name}, vaš nalog je aktivan. Kontaktirajte nas za pomoć pri podešavanju.')
) AS v(trigger_type, channel, name, message_body)
WHERE NOT EXISTS (
  SELECT 1 FROM admin_message_templates t
  WHERE t.trigger_type = v.trigger_type AND t.channel = v.channel
);
