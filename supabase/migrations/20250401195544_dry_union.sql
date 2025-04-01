/*
  # Add Bot Positions Table

  1. New Tables
    - `bot_positions`
      - `id` (uuid, primary key)
      - `bot_id` (uuid, foreign key to bot_configs)
      - `client_id` (uuid, foreign key to clients)
      - `exchange` (text)
      - `pair` (text)
      - `size` (numeric)
      - `leverage` (numeric)
      - `margin` (numeric)
      - `liquidation_price` (numeric)
      - `current_price` (numeric)
      - `entry_timestamp` (timestamptz)
      - `status` (text, enum: 'open', 'closed', 'liquidated')
      - `pnl` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `bot_positions` table
    - Add policies for authenticated users to view their own positions
    
  3. Indexes
    - Add indexes for better query performance
*/

-- Create bot_positions table
CREATE TABLE IF NOT EXISTS bot_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  exchange text NOT NULL,
  pair text NOT NULL,
  size numeric NOT NULL,
  leverage numeric NOT NULL DEFAULT 1,
  margin numeric NOT NULL,
  liquidation_price numeric,
  current_price numeric NOT NULL,
  entry_timestamp timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('open', 'closed', 'liquidated')),
  pnl numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bot_positions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own positions"
  ON bot_positions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_positions WHERE client_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own positions"
  ON bot_positions
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_positions WHERE client_id = auth.uid()
  ))
  WITH CHECK (auth.uid() IN (
    SELECT client_id FROM bot_positions WHERE client_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX idx_bot_positions_bot_id ON bot_positions(bot_id);
CREATE INDEX idx_bot_positions_client_id ON bot_positions(client_id);
CREATE INDEX idx_bot_positions_status ON bot_positions(status);
CREATE INDEX idx_bot_positions_entry_timestamp ON bot_positions(entry_timestamp);

-- Create updated_at trigger
CREATE TRIGGER update_bot_positions_updated_at
  BEFORE UPDATE ON bot_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();