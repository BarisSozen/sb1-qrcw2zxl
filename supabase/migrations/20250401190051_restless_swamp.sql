/*
  # Fix Sales Commission Schema and Sample Data

  1. Changes
    - Fix type casting for UUID columns
    - Update client assignments with proper UUID handling
    - Ensure proper data types for all operations
*/

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_commission_rates_sales_rep;
DROP INDEX IF EXISTS idx_commission_rates_client;
DROP INDEX IF EXISTS idx_commission_payments_sales_rep;
DROP INDEX IF EXISTS idx_commission_payments_status;
DROP INDEX IF EXISTS idx_commission_rates_sales_rep_new;
DROP INDEX IF EXISTS idx_commission_rates_client_new;
DROP INDEX IF EXISTS idx_commission_payments_sales_rep_new;
DROP INDEX IF EXISTS idx_commission_payments_status_new;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON sales_commission_rates;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON sales_commission_payments;
DROP POLICY IF EXISTS "commission_rates_full_access" ON sales_commission_rates;
DROP POLICY IF EXISTS "commission_payments_full_access" ON sales_commission_payments;
DROP POLICY IF EXISTS "commission_rates_full_access_policy" ON sales_commission_rates;
DROP POLICY IF EXISTS "commission_payments_full_access_policy" ON sales_commission_payments;

-- Recreate indexes with unique names
CREATE INDEX IF NOT EXISTS idx_scr_sales_rep_id ON sales_commission_rates(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scr_client_id ON sales_commission_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_scp_sales_rep_id ON sales_commission_payments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scp_status ON sales_commission_payments(status);

-- Create new policies with unique names
CREATE POLICY "enable_all_access_for_auth_users_rates" ON sales_commission_rates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_all_access_for_auth_users_payments" ON sales_commission_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert or update sample data
INSERT INTO sales_reps (id, name, email, active, default_commission_rate, total_commission_earned, payment_details)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 'John Smith', 'john.smith@example.com', true, 20.0, 15000.00, '{"bank_account": "1234567890", "payment_method": "bank_transfer"}'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 'Sarah Johnson', 'sarah.j@example.com', true, 25.0, 22000.00, '{"bank_account": "0987654321", "payment_method": "wire_transfer"}'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 'Michael Brown', 'michael.b@example.com', true, 22.0, 18500.00, '{"bank_account": "5432109876", "payment_method": "bank_transfer"}')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  default_commission_rate = EXCLUDED.default_commission_rate,
  total_commission_earned = EXCLUDED.total_commission_earned,
  payment_details = EXCLUDED.payment_details;

-- Update clients with sales rep assignments using proper UUID casting
UPDATE clients 
SET sales_rep_id = 
  CASE 
    WHEN id IN ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::uuid)
    THEN 'd1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid
    WHEN id IN ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::uuid, 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'::uuid)
    THEN '8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid
    ELSE 'c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid
  END
WHERE id IN (
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'::uuid,
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'::uuid,
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'::uuid,
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'::uuid
);

-- Insert sample commission rates with UUID casting
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

-- Insert sample commission payments with UUID casting
INSERT INTO sales_commission_payments (sales_rep_id, amount, status, payment_method, transaction_id, notes)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 5000.00, 'paid', 'bank_transfer', 'TRX123456', 'Q1 2025 commission payment'),
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46'::uuid, 3500.00, 'pending', 'wire_transfer', 'TRX123457', 'Q2 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 7500.00, 'paid', 'bank_transfer', 'TRX123458', 'Q1 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'::uuid, 4500.00, 'pending', 'wire_transfer', 'TRX123459', 'Q2 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 6000.00, 'paid', 'bank_transfer', 'TRX123460', 'Q1 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid, 2500.00, 'failed', 'wire_transfer', 'TRX123461', 'Payment failed - retry needed')
ON CONFLICT DO NOTHING;