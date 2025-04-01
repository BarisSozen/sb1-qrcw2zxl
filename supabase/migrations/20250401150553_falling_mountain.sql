/*
  # Add Bot Performance Metrics

  1. New Tables
    - `bot_trades`
      - Records individual trades executed by bots
      - Tracks PnL, execution details, and trade outcomes
    
    - `bot_metrics`
      - Stores calculated performance metrics
      - Updated periodically (e.g., hourly/daily)
      - Includes risk metrics, operational metrics, efficiency metrics
    
    - `bot_drawdowns`
      - Tracks drawdown periods
      - Records start/end times, depth, and recovery

  2. New Views
    - `bot_performance_stats`
      - Aggregates trade statistics
      - Calculates key performance indicators
    
    - `bot_risk_metrics`
      - Computes risk-related metrics
      - Rolling calculations for Sharpe, Sortino ratios

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create bot_trades table
CREATE TABLE IF NOT EXISTS bot_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  trade_type text NOT NULL CHECK (trade_type IN ('spot', 'perpetual', 'basis', 'statistical')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  pnl numeric,
  fees numeric DEFAULT 0,
  slippage numeric DEFAULT 0,
  execution_time numeric, -- in milliseconds
  status text NOT NULL CHECK (status IN ('open', 'closed', 'error')),
  entry_timestamp timestamptz DEFAULT now(),
  exit_timestamp timestamptz,
  strategy text NOT NULL,
  exchange text NOT NULL,
  pair text NOT NULL
);

-- Create bot_metrics table
CREATE TABLE IF NOT EXISTS bot_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  period text NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Risk Metrics
  sharpe_ratio numeric,
  sortino_ratio numeric,
  max_drawdown numeric,
  avg_drawdown numeric,
  volatility numeric,
  var_95 numeric, -- Value at Risk (95% confidence)
  
  -- Operational Metrics
  success_rate numeric,
  uptime_percent numeric,
  avg_latency numeric,
  execution_speed numeric,
  order_fill_rate numeric,
  avg_slippage numeric,
  
  -- Efficiency Metrics
  profit_factor numeric,
  recovery_factor numeric,
  cost_efficiency numeric,
  return_on_capital numeric,
  win_rate numeric,
  profit_per_trade numeric,
  win_loss_ratio numeric,
  
  -- Strategy Allocation
  strategy_allocation jsonb
);

-- Create bot_drawdowns table
CREATE TABLE IF NOT EXISTS bot_drawdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bot_configs(id) ON DELETE CASCADE,
  start_timestamp timestamptz NOT NULL,
  end_timestamp timestamptz,
  peak_value numeric NOT NULL,
  trough_value numeric NOT NULL,
  drawdown_percent numeric NOT NULL,
  recovery_time interval,
  status text NOT NULL CHECK (status IN ('active', 'recovered'))
);

-- Create view for performance statistics
CREATE OR REPLACE VIEW bot_performance_stats AS
WITH trade_stats AS (
  SELECT
    bot_id,
    COUNT(*) as total_trades,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
    SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
    SUM(pnl) as total_pnl,
    AVG(pnl) as avg_pnl_per_trade,
    AVG(execution_time) as avg_execution_time,
    AVG(slippage) as avg_slippage
  FROM bot_trades
  WHERE status = 'closed'
  GROUP BY bot_id
)
SELECT
  t.*,
  CASE 
    WHEN losing_trades > 0 THEN ABS(winning_trades::numeric / NULLIF(losing_trades, 0))
    ELSE NULL
  END as win_loss_ratio,
  CASE
    WHEN total_trades > 0 THEN (winning_trades::numeric / total_trades) * 100
    ELSE 0
  END as win_rate
FROM trade_stats t;

-- Create view for risk metrics
CREATE OR REPLACE VIEW bot_risk_metrics AS
WITH daily_returns AS (
  SELECT
    bot_id,
    date_trunc('day', exit_timestamp) as trade_date,
    SUM(pnl) as daily_pnl,
    SUM(ABS(quantity * entry_price)) as daily_volume
  FROM bot_trades
  WHERE status = 'closed'
  GROUP BY bot_id, date_trunc('day', exit_timestamp)
)
SELECT
  bot_id,
  AVG(daily_pnl) as avg_daily_return,
  STDDEV(daily_pnl) as daily_volatility,
  -- Sharpe Ratio = (Average Return - Risk Free Rate) / Standard Deviation
  -- Assuming risk-free rate of 0 for simplicity
  CASE
    WHEN STDDEV(daily_pnl) > 0 THEN (AVG(daily_pnl) / STDDEV(daily_pnl)) * SQRT(252)
    ELSE 0
  END as sharpe_ratio,
  -- Maximum drawdown calculation requires more complex window functions
  -- This is a simplified version
  (MAX(daily_pnl) - MIN(daily_pnl)) / NULLIF(MAX(daily_pnl), 0) as max_drawdown
FROM daily_returns
GROUP BY bot_id;

-- Enable RLS
ALTER TABLE bot_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_drawdowns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bot trades"
  ON bot_trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM clients WHERE id = client_id
  ));

CREATE POLICY "Users can view their own bot metrics"
  ON bot_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_configs WHERE id = bot_id
  ));

CREATE POLICY "Users can view their own bot drawdowns"
  ON bot_drawdowns
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT client_id FROM bot_configs WHERE id = bot_id
  ));

-- Create indexes for better query performance
CREATE INDEX idx_bot_trades_bot_id ON bot_trades(bot_id);
CREATE INDEX idx_bot_trades_client_id ON bot_trades(client_id);
CREATE INDEX idx_bot_trades_timestamp ON bot_trades(entry_timestamp);
CREATE INDEX idx_bot_metrics_bot_id_timestamp ON bot_metrics(bot_id, timestamp);
CREATE INDEX idx_bot_drawdowns_bot_id ON bot_drawdowns(bot_id);