/*
  # Add Bot Configurations

  1. New Tables
    - `bot_configs`
      - `id` (uuid, primary key)
      - `type` (text, enum: basis, perpetual, dex)
      - `name` (text)
      - `description` (text, nullable)
      - `active` (boolean)
      - `status` (text, enum: running, stopped, error)
      - `interval` (integer)
      - `min_profit_threshold` (numeric)
      - `max_position_size` (numeric)
      - `leverage_limit` (numeric)
      - `exchanges` (text[])
      - `pairs` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `bot_configs` table
    - Add policies for authenticated users
*/

-- Create bot_configs table
CREATE TABLE IF NOT EXISTS bot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('basis', 'perpetual', 'dex')),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  status text NOT NULL CHECK (status IN ('running', 'stopped', 'error')) DEFAULT 'stopped',
  interval integer DEFAULT 5000,
  min_profit_threshold numeric NOT NULL DEFAULT 0.1,
  max_position_size numeric NOT NULL DEFAULT 10000,
  leverage_limit numeric NOT NULL DEFAULT 3,
  exchanges text[] NOT NULL,
  pairs text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users"
  ON bot_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_bot_configs_updated_at
  BEFORE UPDATE
  ON bot_configs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();