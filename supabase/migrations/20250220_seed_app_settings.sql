-- App settings default values
-- Must be in migration so staging/production have defaults
INSERT INTO app_settings (key, value) VALUES
  ('global', '{"default_trial_days": 14, "default_working_hours_start": "09:00", "default_working_hours_end": "20:00", "default_slot_duration": 30, "max_booking_advance_days": 90, "reminder_hours_before": 24, "app_name": "Dragica", "support_email": "podrska@dragica.rs"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
