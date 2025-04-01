/*
  # Add Risk Metrics Tables

  1. New Tables
    - `risk_metrics`
      - Stores real-time risk metrics
      - Includes position, leverage, execution risks
      - Tracks thresholds and current values
    
    - `risk_metrics_history`
      - Historical record of risk metrics
      - Enables trend analysis
      - Supports different timeframes

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create risk_metrics table
CREATE TABLE IF NOT EXISTS risk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  
  -- Position Risk Metrics
  position_concentration numeric,
  position_liquidity_ratio numeric,
  cross_exchange_exposure numeric,
  position_correlation numeric,
  
  -- Leverage Risk Metrics
  avg_leverage_ratio numeric,
  max_leverage_used numeric,
  margin_utilization numeric,
  liquidation_risk numeric,
  
  -- Execution Risk Metrics
  slippage_impact numeric,
  order_fill_rate numeric,
  execution_latency numeric,
  price_impact numeric,
  
  -- Counterparty Risk Metrics
  exchange_concentration numeric,
  counterparty_rating numeric,
  settlement_risk numeric,
  custody_risk numeric,
  
  -- Risk Thresholds
  position_risk_threshold numeric DEFAULT 0.8,
  leverage_risk_threshold numeric DEFAULT 0.75,
  execution_risk_threshold numeric DEFAULT 0.7,
  counterparty_risk_threshold numeric DEFAULT 0.6
);

-- Create risk_metrics_history table
CREATE TABLE IF NOT EXISTS risk_metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_metric_id uuid REFERENCES risk_metrics(id) ON DELETE CASCADE,
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  period text NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly')),
  metric_values jsonb NOT NULL,
  thresholds jsonb NOT NULL
);

-- Enable RLS
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view risk metrics"
  ON risk_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_configs WHERE id = bot_id
  ));

CREATE POLICY "Users can view risk metrics history"
  ON risk_metrics_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_configs WHERE id = bot_id
  ));

-- Create indexes
CREATE INDEX idx_risk_metrics_bot_timestamp ON risk_metrics(bot_id, timestamp);
CREATE INDEX idx_risk_metrics_history_bot_period ON risk_metrics_history(bot_id, period);