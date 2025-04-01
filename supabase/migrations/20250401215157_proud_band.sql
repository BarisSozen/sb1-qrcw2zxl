/*
  # Add Admin Client Record

  1. Changes
    - Create admin client record
    - Set up admin permissions
*/

-- Create admin client record if it doesn't exist
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

-- Create admin role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant necessary permissions to admin role
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO admin;