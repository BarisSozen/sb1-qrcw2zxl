/*
  # Add Sales Commission Management

  1. Changes
    - Add columns to sales_reps table
    - Create commission rates and payments tables
    - Set up views and policies
    - Fix policy naming conflicts
*/

-- Add columns to sales_reps table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_reps' AND column_name = 'default_commission_rate'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN default_commission_rate numeric NOT NULL DEFAULT 20.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_reps' AND column_name = 'total_commission_earned'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN total_commission_earned numeric NOT NULL DEFAULT 0.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_reps' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN payment_details jsonb;
  END IF;
END $$;

-- Create sales_commission_rates table if it doesn't exist
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

-- Create sales_commission_payments table if it doesn't exist
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

-- Create view for commission statistics
CREATE OR REPLACE VIEW sales_commission_stats AS
WITH client_commissions AS (
  SELECT 
    sr.id as sales_rep_id,
    sr.name as sales_rep_name,
    sr.email as sales_rep_email,
    COALESCE(scr.commission_rate, sr.default_commission_rate) as commission_rate,
    c.id as client_id,
    c.name as client_name,
    com.amount as commission_amount,
    com.paid as commission_paid
  FROM sales_reps sr
  LEFT JOIN clients c ON c.sales_rep_id = sr.id
  LEFT JOIN sales_commission_rates scr ON scr.sales_rep_id = sr.id AND scr.client_id = c.id
  LEFT JOIN commissions com ON com.client_id = c.id
)
SELECT 
  sales_rep_id,
  sales_rep_name,
  sales_rep_email,
  COUNT(DISTINCT client_id) as total_clients,
  COALESCE(SUM(commission_amount), 0) as total_commission,
  COALESCE(SUM(CASE WHEN commission_paid THEN commission_amount ELSE 0 END), 0) as paid_commission,
  COALESCE(SUM(CASE WHEN NOT commission_paid THEN commission_amount ELSE 0 END), 0) as unpaid_commission,
  COALESCE(AVG(commission_rate), 0) as avg_commission_rate
FROM client_commissions
GROUP BY sales_rep_id, sales_rep_name, sales_rep_email;

-- Enable RLS
ALTER TABLE sales_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commission_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "commission_rates_full_access" ON sales_commission_rates;
  DROP POLICY IF EXISTS "commission_payments_full_access" ON sales_commission_payments;
EXCEPTION
  WHEN undefined_object THEN 
    NULL;
END $$;

-- Create policies with unique names
CREATE POLICY "commission_rates_full_access_policy" ON sales_commission_rates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "commission_payments_full_access_policy" ON sales_commission_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing indexes if they exist
DO $$
BEGIN
  DROP INDEX IF EXISTS idx_commission_rates_sales_rep;
  DROP INDEX IF EXISTS idx_commission_rates_client;
  DROP INDEX IF EXISTS idx_commission_payments_sales_rep;
  DROP INDEX IF EXISTS idx_commission_payments_status;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create indexes with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_commission_rates_sales_rep_new ON sales_commission_rates(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_commission_rates_client_new ON sales_commission_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_sales_rep_new ON sales_commission_payments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status_new ON sales_commission_payments(status);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_sales_commission_rates_updated_at ON sales_commission_rates;
DROP TRIGGER IF EXISTS update_sales_commission_payments_updated_at ON sales_commission_payments;

-- Create triggers
CREATE TRIGGER update_sales_commission_rates_updated_at
  BEFORE UPDATE ON sales_commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_commission_payments_updated_at
  BEFORE UPDATE ON sales_commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();