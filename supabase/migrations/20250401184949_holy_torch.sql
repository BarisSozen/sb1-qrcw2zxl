/*
  # Add Sample Data for Sales Commission Management

  1. Sample Data
    - Sales Representatives
    - Client Assignments
    - Commission Rates
    - Commission Payments
    - Commission History
*/

-- Insert sample sales representatives
INSERT INTO sales_reps (id, name, email, active, default_commission_rate, total_commission_earned, payment_details)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 'John Smith', 'john.smith@example.com', true, 20.0, 15000.00, '{"bank_account": "1234567890", "payment_method": "bank_transfer"}'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 'Sarah Johnson', 'sarah.j@example.com', true, 25.0, 22000.00, '{"bank_account": "0987654321", "payment_method": "wire_transfer"}'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Michael Brown', 'michael.b@example.com', true, 22.0, 18500.00, '{"bank_account": "5432109876", "payment_method": "bank_transfer"}')
ON CONFLICT (email) DO NOTHING;

-- Insert sample clients (if they don't exist)
INSERT INTO clients (id, name, email, commission_rate, active, sales_rep_id)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Tech Innovations Ltd', 'contact@techinnovations.com', 20.0, true, 'd1c61c3f-4d37-4be3-ac98-8b6c594b8d46'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Global Trading Co', 'info@globaltrading.com', 25.0, true, 'd1c61c3f-4d37-4be3-ac98-8b6c594b8d46'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Crypto Ventures', 'admin@cryptoventures.com', 22.0, true, '8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Digital Assets Fund', 'info@digitalassets.com', 20.0, true, '8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a'),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Blockchain Solutions', 'contact@blockchainsol.com', 23.0, true, 'c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
ON CONFLICT DO NOTHING;

-- Insert sample commission rates
INSERT INTO sales_commission_rates (sales_rep_id, client_id, commission_rate, notes)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 22.5, 'Premium client rate'),
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 20.0, 'Standard rate'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 25.0, 'High volume trader'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 23.5, 'Long-term client'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 24.0, 'Strategic partnership')
ON CONFLICT DO NOTHING;

-- Insert sample commission payments
INSERT INTO sales_commission_payments (sales_rep_id, amount, status, payment_method, transaction_id, notes)
VALUES
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 5000.00, 'paid', 'bank_transfer', 'TRX123456', 'Q1 2025 commission payment'),
  ('d1c61c3f-4d37-4be3-ac98-8b6c594b8d46', 3500.00, 'pending', 'wire_transfer', 'TRX123457', 'Q2 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 7500.00, 'paid', 'bank_transfer', 'TRX123458', 'Q1 2025 commission payment'),
  ('8f3d8f45-a5d9-4c9c-8c72-b5e55e9d6c2a', 4500.00, 'pending', 'wire_transfer', 'TRX123459', 'Q2 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 6000.00, 'paid', 'bank_transfer', 'TRX123460', 'Q1 2025 commission payment'),
  ('c4b2a1d0-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 2500.00, 'failed', 'wire_transfer', 'TRX123461', 'Payment failed - retry needed')
ON CONFLICT DO NOTHING;

-- Insert sample commissions
INSERT INTO commissions (client_id, amount, trade_id, paid)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 2500.00, gen_random_uuid(), true),
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 1500.00, gen_random_uuid(), false),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 3000.00, gen_random_uuid(), true),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 4500.00, gen_random_uuid(), true),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 2000.00, gen_random_uuid(), false),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 3500.00, gen_random_uuid(), true)
ON CONFLICT DO NOTHING;