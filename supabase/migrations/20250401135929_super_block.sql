/*
  # Create wallets table

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `address` (text)
      - `type` (text, either 'dex' or 'cex')
      - `chain` (text)
      - `label` (text, optional)
      - `created_at` (timestamp)
      - `active` (boolean)

  2. Security
    - Enable RLS on wallets table
    - Add policies for authenticated users to manage their own wallets
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

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wallets"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can insert their own wallets"
  ON wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can update their own wallets"
  ON wallets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can delete their own wallets"
  ON wallets
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));