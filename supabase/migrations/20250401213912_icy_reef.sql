/*
  # Add Audit Type to Clients

  1. Changes
    - Add client_type column to clients table
    - Add check constraint for valid client types
    - Update existing clients to 'standard' type
    - Add policies for audit type clients

  2. Security
    - Maintain existing RLS policies
    - Add specific policies for audit type access
*/

-- Add client_type column with check constraint
ALTER TABLE clients 
ADD COLUMN client_type text NOT NULL DEFAULT 'standard'
CHECK (client_type IN ('standard', 'audit'));

-- Create index for client_type
CREATE INDEX idx_clients_type ON clients(client_type);

-- Update existing clients to 'standard' type
UPDATE clients SET client_type = 'standard' WHERE client_type IS NULL;

-- Add audit-specific policies
CREATE POLICY "Audit users can view all client data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() IN (
      SELECT id FROM clients WHERE client_type = 'audit'
    )) OR (
      auth.uid() = id
    )
  );

-- Add audit access policies for related tables
CREATE POLICY "Audit users can view all bot trades"
  ON bot_trades
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE client_type = 'audit'
    )
  );

CREATE POLICY "Audit users can view all bot positions"
  ON bot_positions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE client_type = 'audit'
    )
  );

CREATE POLICY "Audit users can view all bot metrics"
  ON bot_metrics
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE client_type = 'audit'
    )
  );

CREATE POLICY "Audit users can view all risk metrics"
  ON risk_metrics
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE client_type = 'audit'
    )
  );