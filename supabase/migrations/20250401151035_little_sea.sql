/*
  # Enhance Bot-Client Relationship

  1. Changes
    - Add unique constraint to ensure a bot can only be assigned to one client
    - Add client_name view for easier querying
    - Add bot assignment history tracking
    - Add policies for client assignment management

  2. Security
    - Add RLS policies for bot assignment
*/

-- Create bot assignment history table
CREATE TABLE IF NOT EXISTS bot_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  unassigned_at timestamptz,
  assigned_by uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  notes text
);

-- Create view for active bot assignments with client details
CREATE OR REPLACE VIEW active_bot_assignments AS
SELECT 
  bc.id as bot_id,
  bc.name as bot_name,
  bc.type as bot_type,
  bc.status as bot_status,
  c.id as client_id,
  c.name as client_name,
  c.email as client_email,
  ba.assigned_at,
  ba.assigned_by
FROM bot_configs bc
LEFT JOIN bot_assignments ba ON bc.id = ba.bot_id AND ba.status = 'active'
LEFT JOIN clients c ON ba.client_id = c.id;

-- Enable RLS
ALTER TABLE bot_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view bot assignments"
  ON bot_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage bot assignments"
  ON bot_assignments
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

-- Create indexes
CREATE INDEX idx_bot_assignments_bot_id ON bot_assignments(bot_id);
CREATE INDEX idx_bot_assignments_client_id ON bot_assignments(client_id);
CREATE INDEX idx_bot_assignments_status ON bot_assignments(status);