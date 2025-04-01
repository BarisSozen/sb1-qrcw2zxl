/*
  # Add Sample Sales Representatives Data

  1. Sample Data
    - Insert initial sales representatives
    - Add commission rates and payments
*/

-- Insert sample sales representatives
INSERT INTO sales_reps (id, name, email, active, default_commission_rate, total_commission_earned, payment_details)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 'John Smith', 'john.smith@example.com', true, 20.0, 15000.00, '{"bank_account": "1234567890", "payment_method": "bank_transfer"}'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 'Sarah Johnson', 'sarah.j@example.com', true, 25.0, 22000.00, '{"bank_account": "0987654321", "payment_method": "wire_transfer"}'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Michael Brown', 'michael.b@example.com', true, 22.0, 18500.00, '{"bank_account": "5432109876", "payment_method": "bank_transfer"}')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  default_commission_rate = EXCLUDED.default_commission_rate,
  total_commission_earned = EXCLUDED.total_commission_earned,
  payment_details = EXCLUDED.payment_details;