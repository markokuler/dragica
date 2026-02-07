  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'ngr.marko@gmail.com',
    crypt('72624925qQ@', gen_salt('bf')),
    NOW(),
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  INSERT INTO users (id, email, role)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'ngr.marko@gmail.com'),
    'ngr.marko@gmail.com',
    'admin'
  );
  