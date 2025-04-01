/*
  # Add Sales Representatives and Bot Preferences

  1. New Tables
    - `sales_reps`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `active` (boolean)
      - `created_at` (timestamp)

  2. Changes
    - Add `sales_rep_id` to clients table
    - Add `preferred_bot_types` array to clients table

  3. Security
    - Enable RLS on sales_reps table
    - Add policies for authenticated users
*/

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add sales_rep_id and preferred_bot_types to clients
ALTER TABLE clients 
ADD COLUMN sales_rep_id uuid REFERENCES sales_reps(id),
ADD COLUMN preferred_bot_types text[] NOT NULL DEFAULT ARRAY[]::text[] 
CHECK (
  preferred_bot_types <@ ARRAY['basis', 'perpetual', 'dex', 'statistical']::text[]
);

-- Enable RLS
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users"
  ON sales_reps
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_clients_sales_rep ON clients(sales_rep_id);