/*
  # Add Exchange API Keys Management

  1. New Tables
    - `exchange_api_keys`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `exchange` (text, exchange name)
      - `api_key` (text, encrypted)
      - `api_secret` (text, encrypted)
      - `passphrase` (text, encrypted, optional for OKX)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `active` (boolean)

  2. Security
    - Enable RLS on `exchange_api_keys` table
    - Add policies for authenticated users to manage their own API keys
*/

-- Create exchange_api_keys table
CREATE TABLE IF NOT EXISTS exchange_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  exchange text NOT NULL CHECK (exchange IN ('binance', 'bybit', 'okx', 'deribit')),
  api_key text NOT NULL,
  api_secret text NOT NULL,
  passphrase text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(client_id, exchange)
);

-- Enable RLS
ALTER TABLE exchange_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own API keys"
  ON exchange_api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can insert their own API keys"
  ON exchange_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can update their own API keys"
  ON exchange_api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can delete their own API keys"
  ON exchange_api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exchange_api_keys_updated_at
  BEFORE UPDATE
  ON exchange_api_keys
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();