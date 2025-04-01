/*
  # Sales Commission System

  1. New Tables
    - `sales_reps`: Stores sales representative information
    - `sales_commission_rates`: Stores commission rates per client
    - `sales_commission_payments`: Tracks commission payments
  
  2. Views
    - `sales_commission_stats`: Aggregates commission statistics
  
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add indexes for performance
  
  4. Sample Data
    - Insert sample sales reps
    - Insert sample commission rates
    - Insert sample payments
*/

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  default_commission_rate numeric NOT NULL DEFAULT 20.0,
  total_commission_earned numeric NOT NULL DEFAULT 0.0,
  payment_details jsonb
);

-- Create sales_commission_rates table
CREATE TABLE IF NOT EXISTS sales_commission_rates (
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
CREATE TABLE IF NOT EXISTS sales_commission_payments (
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

-- Create sales_commission_stats view
CREATE OR REPLACE VIEW sales_commission_stats AS
WITH commission_totals AS (
  SELECT
    sr.id AS sales_rep_id,
    COUNT(DISTINCT scr.client_id) AS total_clients,
    COALESCE(SUM(scp.amount) FILTER (WHERE scp.status = 'paid'), 0) AS paid_commission,
    COALESCE(SUM(scp.amount) FILTER (WHERE scp.status = 'pending'), 0) AS unpaid_commission,
    COALESCE(AVG(scr.commission_rate), sr.default_commission_rate) AS avg_commission_rate
  FROM sales_reps sr
  LEFT JOIN sales_commission_rates scr ON sr.id = scr.sales_rep_id
  LEFT JOIN sales_commission_payments scp ON sr.id = scp.sales_rep_id
  GROUP BY sr.id, sr.default_commission_rate
)
SELECT
  sales_rep_id,
  total_clients,
  paid_commission,
  unpaid_commission,
  paid_commission + unpaid_commission AS total_commission,
  avg_commission_rate
FROM commission_totals;

-- Enable RLS
ALTER TABLE IF EXISTS sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_commission_payments ENABLE ROW LEVEL SECURITY;

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(table_name TEXT, policy_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = table_name AND policyname = policy_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies, checking if they exist first
DO $$
BEGIN
    IF NOT policy_exists('sales_reps', 'enable_all_access_for_auth_users_reps') THEN
        CREATE POLICY "enable_all_access_for_auth_users_reps" ON sales_reps FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT policy_exists('sales_commission_rates', 'enable_all_access_for_auth_users_rates') THEN
        CREATE POLICY "enable_all_access_for_auth_users_rates" ON sales_commission_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT policy_exists('sales_commission_payments', 'enable_all_access_for_auth_users_payments') THEN
        CREATE POLICY "enable_all_access_for_auth_users_payments" ON sales_commission_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scr_sales_rep_id ON sales_commission_rates(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scr_client_id ON sales_commission_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_scp_sales_rep_id ON sales_commission_payments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_scp_status ON sales_commission_payments(status);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_sales_commission_rates_updated_at'
    ) THEN
        CREATE TRIGGER update_sales_commission_rates_updated_at
        BEFORE UPDATE ON sales_commission_rates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_sales_commission_payments_updated_at'
    ) THEN
        CREATE TRIGGER update_sales_commission_payments_updated_at
        BEFORE UPDATE ON sales_commission_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Insert sample data
INSERT INTO sales_reps (name, email, default_commission_rate, payment_details)
VALUES
  ('John Smith', 'john.smith@example.com', 20.0, '{"bank_account": "1234567890", "bank_name": "Chase"}'),
  ('Sarah Johnson', 'sarah.johnson@example.com', 22.0, '{"bank_account": "0987654321", "bank_name": "Wells Fargo"}'),
  ('Michael Brown', 'michael.brown@example.com', 18.0, '{"bank_account": "5432167890", "bank_name": "Bank of America"}')
ON CONFLICT (email) DO NOTHING;

-- Get some client IDs
WITH client_ids AS (
  SELECT id FROM clients LIMIT 3
)
-- Insert sample commission rates
INSERT INTO sales_commission_rates (sales_rep_id, client_id, commission_rate, notes)
SELECT
  sr.id,
  c.id,
  20.0 + (random() * 5.0),
  'Standard commission rate'
FROM sales_reps sr
CROSS JOIN client_ids c
ON CONFLICT (sales_rep_id, client_id) DO NOTHING;

-- Insert sample payments
INSERT INTO sales_commission_payments (
  sales_rep_id,
  amount,
  payment_date,
  status,
  payment_method,
  transaction_id,
  notes
)
SELECT
  id AS sales_rep_id,
  (random() * 5000 + 1000)::numeric(10,2) AS amount,
  now() - (interval '1 day' * round(random() * 30)) AS payment_date,
  (ARRAY['pending', 'paid', 'paid', 'paid'])[1 + floor(random() * 4)] AS status,
  (ARRAY['bank_transfer', 'wire_transfer', 'crypto'])[1 + floor(random() * 3)] AS payment_method,
  encode(gen_random_bytes(8), 'hex') AS transaction_id,
  'Monthly commission payment'
FROM sales_reps, generate_series(1, 5);

-- Update total commission earned
UPDATE sales_reps sr
SET total_commission_earned = (
  SELECT COALESCE(SUM(amount), 0)
  FROM sales_commission_payments
  WHERE sales_rep_id = sr.id
  AND status = 'paid'
)
WHERE NOT EXISTS (SELECT 1 FROM sales_reps WHERE id = sr.id AND total_commission_earned = (
  SELECT COALESCE(SUM(amount), 0)
  FROM sales_commission_payments
  WHERE sales_rep_id = sr.id
  AND status = 'paid'
));