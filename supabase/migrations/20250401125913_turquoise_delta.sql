/*
  # Add wallets table for multiple wallet support

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `address` (text)
      - `type` (text) - 'dex' or 'cex'
      - `chain` (text) - e.g., 'ethereum', 'binance_smart_chain'
      - `label` (text) - user-defined label
      - `created_at` (timestamptz)
      - `active` (boolean)

  2. Changes
    - Make wallet_address nullable in clients table as it's moving to wallets table
    
  3. Security
    - Enable RLS on wallets table
    - Add policy for authenticated users
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  address text NOT NULL,
  type text NOT NULL CHECK (type IN ('dex', 'cex')),
  chain text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Make wallet_address nullable in clients table
ALTER TABLE clients ALTER COLUMN wallet_address DROP NOT NULL;

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON wallets
  FOR ALL TO authenticated
  USING (true);