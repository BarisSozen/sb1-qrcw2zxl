/*
  # Fix Sales Commission Schema and Sample Data

  1. Changes
    - Drop and recreate sales commission tables with proper constraints
    - Add missing indexes
    - Update policies
    - Insert sample data with proper UUID handling
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS sales_commission_payments CASCADE;
DROP TABLE IF EXISTS sales_commission_rates CASCADE;

-- Create sales_commission_rates table
CREATE TABLE sales_commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(sales_rep_id, client_id)
);

-- Create sales_commission_payments table
CREATE TABLE sales_commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_scr_sales_rep_id ON sales_commission_rates(sales_rep_id);
CREATE INDEX idx_scr_client_id ON sales_commission_rates(client_id);
CREATE INDEX idx_scp_sales_rep_id ON sales_commission_payments(sales_rep_id);
CREATE INDEX idx_scp_status ON sales_commission_payments(status);

-- Enable RLS
ALTER TABLE sales_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commission_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "enable_all_access_for_auth_users_rates" ON sales_commission_rates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_all_access_for_auth_users_payments" ON sales_commission_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_sales_commission_rates_updated_at
  BEFORE UPDATE ON sales_commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_commission_payments_updated_at
  BEFORE UPDATE ON sales_commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO sales_commission_rates (sales_rep_id, client_id, commission_rate, notes)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 22.5, 'Premium client rate'),
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::uuid, 20.0, 'Standard rate'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::uuid, 25.0, 'High volume trader'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'::uuid, 23.5, 'Long-term client'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'::uuid, 24.0, 'Strategic partnership')
ON CONFLICT (sales_rep_id, client_id) DO UPDATE SET
  commission_rate = EXCLUDED.commission_rate,
  notes = EXCLUDED.notes;

INSERT INTO sales_commission_payments (sales_rep_id, amount, status, payment_method, transaction_id, notes)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 5000.00, 'paid', 'bank_transfer', 'TRX123456', 'Q1 2025 commission payment'),
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 3500.00, 'pending', 'wire_transfer', 'TRX123457', 'Q2 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 7500.00, 'paid', 'bank_transfer', 'TRX123458', 'Q1 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 4500.00, 'pending', 'wire_transfer', 'TRX123459', 'Q2 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 6000.00, 'paid', 'bank_transfer', 'TRX123460', 'Q1 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 2500.00, 'failed', 'wire_transfer', 'TRX123461', 'Payment failed - retry needed')
ON CONFLICT DO NOTHING;