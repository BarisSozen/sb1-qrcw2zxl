/*
  # Add Sales Commission Management

  1. Changes to sales_reps table
    - Add commission_rate (default commission percentage)
    - Add total_commission_earned
    - Add payment_details for commission payouts

  2. New Tables
    - `sales_commission_rates`
      - Custom commission rates per client
      - Overrides default rate from sales_reps
    
    - `sales_commission_payments`
      - Track commission payments to sales reps
      - Include payment status and details

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Add columns to sales_reps table
ALTER TABLE sales_reps
ADD COLUMN default_commission_rate numeric NOT NULL DEFAULT 20.0,
ADD COLUMN total_commission_earned numeric NOT NULL DEFAULT 0.0,
ADD COLUMN payment_details jsonb;

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
  SUM(commission_amount) as total_commission,
  SUM(CASE WHEN commission_paid THEN commission_amount ELSE 0 END) as paid_commission,
  SUM(CASE WHEN NOT commission_paid THEN commission_amount ELSE 0 END) as unpaid_commission,
  AVG(commission_rate) as avg_commission_rate
FROM client_commissions
GROUP BY sales_rep_id, sales_rep_name, sales_rep_email;

-- Enable RLS
ALTER TABLE sales_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commission_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users"
  ON sales_commission_rates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users"
  ON sales_commission_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_commission_rates_sales_rep ON sales_commission_rates(sales_rep_id);
CREATE INDEX idx_commission_rates_client ON sales_commission_rates(client_id);
CREATE INDEX idx_commission_payments_sales_rep ON sales_commission_payments(sales_rep_id);
CREATE INDEX idx_commission_payments_status ON sales_commission_payments(status);

-- Create updated_at triggers
CREATE TRIGGER update_sales_commission_rates_updated_at
  BEFORE UPDATE ON sales_commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_commission_payments_updated_at
  BEFORE UPDATE ON sales_commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();