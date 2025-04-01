/*
  # Add clients and commissions tracking

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `wallet_address` (text)
      - `created_at` (timestamp)
      - `active` (boolean)
      - `commission_rate` (decimal)
      - `total_invested` (decimal)
      - `current_balance` (decimal)
      
    - `api_keys`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `exchange` (text)
      - `api_key` (text)
      - `api_secret` (text, encrypted)
      - `passphrase` (text, encrypted, optional)
      - `created_at` (timestamp)
      - `active` (boolean)
      
    - `commissions`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `amount` (decimal)
      - `trade_id` (uuid)
      - `created_at` (timestamp)
      - `paid` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  commission_rate decimal NOT NULL DEFAULT 20.0,
  total_invested decimal DEFAULT 0,
  current_balance decimal DEFAULT 0
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  exchange text NOT NULL,
  api_key text NOT NULL,
  api_secret text NOT NULL,
  passphrase text,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  trade_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON clients
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow full access to authenticated users" ON api_keys
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow full access to authenticated users" ON commissions
  FOR ALL TO authenticated
  USING (true);