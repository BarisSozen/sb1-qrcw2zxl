/*
  # Create Admin User

  1. Changes
    - Create admin user in auth schema
    - Create client record for admin
    - Set up proper permissions
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  'f0e3b2a1-c9d8-4e7f-6b5a-4c3b2a1d0e9f',
  'admin@dowdigital.com',
  crypt('Admin123!@#', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "System Administrator"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create admin client record
INSERT INTO clients (
  id,
  name,
  email,
  commission_rate,
  active,
  client_type
)
VALUES (
  'f0e3b2a1-c9d8-4e7f-6b5a-4c3b2a1d0e9f',
  'System Administrator',
  'admin@dowdigital.com',
  0,
  true,
  'standard'
)
ON CONFLICT (id) DO NOTHING;

-- Grant admin role in auth schema
UPDATE auth.users
SET role = 'admin'
WHERE id = 'f0e3b2a1-c9d8-4e7f-6b5a-4c3b2a1d0e9f';