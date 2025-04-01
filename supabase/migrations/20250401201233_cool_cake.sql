/*
  # Security and Market Data Tables

  1. New Tables
    - `security_incidents` - Stores security-related incidents
    - `security_metrics` - Stores current security metrics
    - `security_metrics_history` - Stores historical security metrics
    - `security_settings` - Stores security configuration settings
    - `market_prices` - Stores market price data for different tokens

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to view data

  3. Sample Data
    - Insert sample security incidents, metrics, and market prices
    - Insert sample bot trades, positions, and performance metrics
*/

-- Create security_incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  type text NOT NULL,
  description text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('active', 'resolved')),
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz DEFAULT now()
);

-- Create security_metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  failed_validations integer NOT NULL DEFAULT 0,
  suspicious_activities integer NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 0,
  kill_switch_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Create security_metrics_history table
CREATE TABLE IF NOT EXISTS security_metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  failed_validations integer NOT NULL DEFAULT 0,
  suspicious_activities integer NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id text PRIMARY KEY,
  kill_switch_active boolean NOT NULL DEFAULT false,
  max_risk_threshold numeric NOT NULL DEFAULT 0.8,
  auto_kill_switch_threshold numeric NOT NULL DEFAULT 0.9,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  spot_price numeric NOT NULL,
  futures_price numeric NOT NULL,
  funding_rate numeric,
  futures_expiry timestamptz,
  timestamp timestamptz DEFAULT now(),
  source text NOT NULL,
  target text NOT NULL,
  category text NOT NULL CHECK (category IN ('dex', 'cex', 'hybrid'))
);

-- Enable RLS
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow select access to authenticated users for security_incidents"
  ON security_incidents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow select access to authenticated users for security_metrics"
  ON security_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow select access to authenticated users for security_metrics_history"
  ON security_metrics_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow select access to authenticated users for security_settings"
  ON security_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow select access to authenticated users for market_prices"
  ON market_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample security incidents
INSERT INTO security_incidents (type, description, risk_level, status)
VALUES
  ('Validation Failure', 'Multiple failed trade validations from address 0x1234', 'medium', 'resolved'),
  ('Suspicious Activity', 'Rapid successive trades detected', 'high', 'active'),
  ('API Key Misuse', 'Unusual API usage pattern detected', 'medium', 'active'),
  ('Rate Limit Exceeded', 'API rate limit exceeded for client', 'low', 'resolved'),
  ('Unusual Trade Size', 'Trade size significantly above normal pattern', 'medium', 'resolved');

-- Insert sample security metrics
INSERT INTO security_metrics (failed_validations, suspicious_activities, risk_score, kill_switch_active)
VALUES (12, 3, 0.45, false);

-- Insert sample security metrics history (last 7 days)
INSERT INTO security_metrics_history (timestamp, failed_validations, suspicious_activities, risk_score)
VALUES
  (now() - interval '6 days', 8, 1, 0.25),
  (now() - interval '5 days', 10, 2, 0.35),
  (now() - interval '4 days', 7, 1, 0.20),
  (now() - interval '3 days', 15, 4, 0.55),
  (now() - interval '2 days', 11, 2, 0.40),
  (now() - interval '1 day', 9, 2, 0.35),
  (now(), 12, 3, 0.45);

-- Insert sample security settings
INSERT INTO security_settings (id, kill_switch_active, max_risk_threshold, auto_kill_switch_threshold)
VALUES ('global', false, 0.8, 0.9);

-- Insert sample market prices
INSERT INTO market_prices (token, spot_price, futures_price, funding_rate, futures_expiry, source, target, category)
VALUES
  ('BTC', 35000.00, 35700.00, 0.0001, now() + interval '90 days', 'binance', 'binance', 'cex'),
  ('BTC', 35050.00, 35650.00, 0.0002, now() + interval '90 days', 'bybit', 'bybit', 'cex'),
  ('BTC', 34950.00, 35800.00, 0.00015, now() + interval '90 days', 'okx', 'okx', 'cex'),
  ('ETH', 2000.00, 2050.00, 0.0001, now() + interval '90 days', 'binance', 'binance', 'cex'),
  ('ETH', 2010.00, 2040.00, 0.00012, now() + interval '90 days', 'bybit', 'bybit', 'cex'),
  ('ETH', 1990.00, 2060.00, 0.00018, now() + interval '90 days', 'okx', 'okx', 'cex'),
  ('ETH', 1980.00, 2070.00, 0, now() + interval '30 days', 'uniswap', 'dydx', 'dex'),
  ('SOL', 100.00, 102.50, 0.0002, now() + interval '90 days', 'binance', 'binance', 'cex'),
  ('SOL', 100.50, 102.00, 0.00025, now() + interval '90 days', 'bybit', 'bybit', 'cex'),
  ('SOL', 99.50, 103.00, 0.0003, now() + interval '90 days', 'okx', 'okx', 'cex'),
  ('SOL', 99.00, 103.50, 0, now() + interval '30 days', 'uniswap', 'dydx', 'dex');

-- Insert sample bot trades
DO $$
DECLARE
  v_bot_id uuid;
  v_client_id uuid;
  trade_id uuid;
  entry_price numeric;
  exit_price numeric;
  quantity numeric;
  pnl numeric;
  entry_timestamp timestamptz;
  exit_timestamp timestamptz;
  trade_pair text;
  trade_exchange text;
  trade_type text;
  trade_strategy text;
  bot_record record;
BEGIN
  -- Loop through available bots
  FOR bot_record IN SELECT id, client_id, exchanges, pairs, type FROM bot_configs WHERE active = true LIMIT 5 LOOP
    v_bot_id := bot_record.id;
    v_client_id := bot_record.client_id;
    
    -- If no bot/client exists, use default values
    IF v_bot_id IS NULL THEN
      v_bot_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    END IF;
    
    IF v_client_id IS NULL THEN
      v_client_id := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid;
    END IF;
    
    -- Insert 10 sample trades per bot
    FOR i IN 1..10 LOOP
      -- Generate random trade data
      trade_id := gen_random_uuid();
      
      -- Randomly select pair from bot's configured pairs
      IF bot_record.pairs IS NOT NULL AND array_length(bot_record.pairs, 1) > 0 THEN
        trade_pair := bot_record.pairs[1 + floor(random() * array_length(bot_record.pairs, 1))];
      ELSE
        -- Default pairs if none configured
        CASE floor(random() * 3)
          WHEN 0 THEN trade_pair := 'BTC/USD';
          WHEN 1 THEN trade_pair := 'ETH/USD';
          ELSE trade_pair := 'SOL/USD';
        END CASE;
      END IF;
      
      -- Set price based on pair
      CASE 
        WHEN trade_pair LIKE '%BTC%' THEN entry_price := 35000 + (random() * 2000);
        WHEN trade_pair LIKE '%ETH%' THEN entry_price := 2000 + (random() * 200);
        ELSE entry_price := 100 + (random() * 10);
      END CASE;
      
      -- Randomly select exchange from bot's configured exchanges
      IF bot_record.exchanges IS NOT NULL AND array_length(bot_record.exchanges, 1) > 0 THEN
        trade_exchange := bot_record.exchanges[1 + floor(random() * array_length(bot_record.exchanges, 1))];
      ELSE
        -- Default exchanges if none configured
        CASE floor(random() * 3)
          WHEN 0 THEN trade_exchange := 'binance';
          WHEN 1 THEN trade_exchange := 'bybit';
          ELSE trade_exchange := 'okx';
        END CASE;
      END IF;
      
      -- Set trade type based on bot type
      CASE bot_record.type
        WHEN 'basis' THEN trade_type := 'basis';
        WHEN 'perpetual' THEN trade_type := 'perpetual';
        WHEN 'dex' THEN trade_type := 'spot';
        ELSE trade_type := 'statistical';
      END CASE;
      
      -- Randomly select strategy
      CASE floor(random() * 4)
        WHEN 0 THEN trade_strategy := 'Market Neutral';
        WHEN 1 THEN trade_strategy := 'Funding Rate Arbitrage';
        WHEN 2 THEN trade_strategy := 'Basis Trading';
        ELSE trade_strategy := 'Statistical Arbitrage';
      END CASE;
      
      -- Random quantity
      quantity := 0.1 + (random() * 5);
      
      -- Random timestamps within last 30 days
      entry_timestamp := now() - (random() * interval '30 days');
      
      -- 70% of trades are closed
      IF random() < 0.7 THEN
        -- Exit price with some profit/loss
        exit_price := entry_price * (1 + (random() * 0.1 - 0.05)); -- +/- 5%
        exit_timestamp := entry_timestamp + (random() * interval '2 days');
        pnl := (exit_price - entry_price) * quantity;
        
        -- Insert closed trade
        INSERT INTO bot_trades (
          bot_id, client_id, trade_type, entry_price, exit_price, quantity, 
          pnl, fees, slippage, execution_time, status, entry_timestamp, 
          exit_timestamp, strategy, exchange, pair
        ) VALUES (
          v_bot_id, v_client_id, trade_type, entry_price, exit_price, quantity,
          pnl, quantity * entry_price * 0.001, 0.0001 + (random() * 0.0009),
          50 + (random() * 200), 'closed', entry_timestamp,
          exit_timestamp, trade_strategy, trade_exchange, trade_pair
        );
      ELSE
        -- Insert open trade
        INSERT INTO bot_trades (
          bot_id, client_id, trade_type, entry_price, quantity, 
          fees, slippage, execution_time, status, entry_timestamp, 
          strategy, exchange, pair
        ) VALUES (
          v_bot_id, v_client_id, trade_type, entry_price, quantity,
          quantity * entry_price * 0.001, 0.0001 + (random() * 0.0009),
          50 + (random() * 200), 'open', entry_timestamp,
          trade_strategy, trade_exchange, trade_pair
        );
      END IF;
    END LOOP;
    
    -- Insert some sample positions for this bot
    FOR i IN 1..2 LOOP
      -- Generate random position data
      IF bot_record.pairs IS NOT NULL AND array_length(bot_record.pairs, 1) > 0 THEN
        trade_pair := bot_record.pairs[1 + floor(random() * array_length(bot_record.pairs, 1))];
      ELSE
        -- Default pairs if none configured
        CASE floor(random() * 3)
          WHEN 0 THEN trade_pair := 'BTC/USD';
          WHEN 1 THEN trade_pair := 'ETH/USD';
          ELSE trade_pair := 'SOL/USD';
        END CASE;
      END IF;
      
      -- Set price based on pair
      CASE 
        WHEN trade_pair LIKE '%BTC%' THEN entry_price := 35000 + (random() * 2000);
        WHEN trade_pair LIKE '%ETH%' THEN entry_price := 2000 + (random() * 200);
        ELSE entry_price := 100 + (random() * 10);
      END CASE;
      
      -- Randomly select exchange
      IF bot_record.exchanges IS NOT NULL AND array_length(bot_record.exchanges, 1) > 0 THEN
        trade_exchange := bot_record.exchanges[1 + floor(random() * array_length(bot_record.exchanges, 1))];
      ELSE
        -- Default exchanges if none configured
        CASE floor(random() * 3)
          WHEN 0 THEN trade_exchange := 'binance';
          WHEN 1 THEN trade_exchange := 'bybit';
          ELSE trade_exchange := 'okx';
        END CASE;
      END IF;
      
      -- Random quantity and leverage
      quantity := 0.5 + (random() * 10);
      
      -- Insert position
      INSERT INTO bot_positions (
        bot_id, client_id, exchange, pair, size, leverage, margin,
        liquidation_price, current_price, entry_timestamp, status
      ) VALUES (
        v_bot_id, v_client_id, trade_exchange, trade_pair, quantity,
        1 + (random() * 5), -- leverage between 1-6x
        (entry_price * quantity) / (1 + (random() * 5)), -- margin
        entry_price * (1 - (0.1 + (random() * 0.4))), -- liquidation price 10-50% below entry
        entry_price * (1 + (random() * 0.1 - 0.05)), -- current price +/- 5%
        now() - (random() * interval '14 days'), -- entry within last 14 days
        CASE WHEN random() < 0.8 THEN 'open' ELSE 'closed' END -- 80% open positions
      );
    END LOOP;
    
    -- Insert bot metrics for this bot
    DECLARE
      period_val text;
      timestamp_val timestamptz;
    BEGIN
      -- Insert metrics for different periods
      FOREACH period_val IN ARRAY ARRAY['hourly', 'daily', 'weekly', 'monthly'] LOOP
        -- Insert 5 data points for each period
        FOR i IN 1..5 LOOP
          -- Calculate timestamp based on period
          CASE period_val
            WHEN 'hourly' THEN timestamp_val := now() - (i * interval '1 hour');
            WHEN 'daily' THEN timestamp_val := now() - (i * interval '1 day');
            WHEN 'weekly' THEN timestamp_val := now() - (i * interval '1 week');
            ELSE timestamp_val := now() - (i * interval '1 month');
          END CASE;
          
          -- Insert metric
          INSERT INTO bot_metrics (
            bot_id, timestamp, period, sharpe_ratio, sortino_ratio, max_drawdown,
            avg_drawdown, volatility, var_95, success_rate, uptime_percent,
            avg_latency, execution_speed, order_fill_rate, avg_slippage,
            profit_factor, recovery_factor, cost_efficiency, return_on_capital,
            win_rate, profit_per_trade, win_loss_ratio, strategy_allocation
          ) VALUES (
            v_bot_id, timestamp_val, period_val,
            1.5 + (random() * 2), -- sharpe_ratio
            2.0 + (random() * 2), -- sortino_ratio
            5.0 + (random() * 15), -- max_drawdown
            3.0 + (random() * 10), -- avg_drawdown
            10.0 + (random() * 10), -- volatility
            5.0 + (random() * 5), -- var_95
            75.0 + (random() * 20), -- success_rate
            98.0 + (random() * 2), -- uptime_percent
            30.0 + (random() * 50), -- avg_latency
            0.1 + (random() * 0.2), -- execution_speed
            95.0 + (random() * 5), -- order_fill_rate
            0.01 + (random() * 0.1), -- avg_slippage
            1.5 + (random() * 1.5), -- profit_factor
            2.0 + (random() * 2), -- recovery_factor
            80.0 + (random() * 15), -- cost_efficiency
            10.0 + (random() * 20), -- return_on_capital
            60.0 + (random() * 25), -- win_rate
            100.0 + (random() * 200), -- profit_per_trade
            1.5 + (random() * 1.5), -- win_loss_ratio
            '{"Market Neutral": 0.3, "Funding Rate Arbitrage": 0.3, "Basis Trading": 0.2, "Statistical Arbitrage": 0.2}'::jsonb -- strategy_allocation
          );
        END LOOP;
      END LOOP;
    END;
    
    -- Insert risk metrics for this bot
    FOR i IN 1..2 LOOP
      INSERT INTO risk_metrics (
        bot_id, position_concentration, position_liquidity_ratio,
        cross_exchange_exposure, position_correlation, avg_leverage_ratio,
        max_leverage_used, margin_utilization, liquidation_risk,
        slippage_impact, order_fill_rate, execution_latency, price_impact,
        exchange_concentration, counterparty_rating, settlement_risk, custody_risk
      ) VALUES (
        v_bot_id,
        0.3 + (random() * 0.5), -- position_concentration
        0.2 + (random() * 0.6), -- position_liquidity_ratio
        0.1 + (random() * 0.4), -- cross_exchange_exposure
        0.1 + (random() * 0.3), -- position_correlation
        1.5 + (random() * 3), -- avg_leverage_ratio
        2.0 + (random() * 4), -- max_leverage_used
        0.3 + (random() * 0.5), -- margin_utilization
        0.1 + (random() * 0.3), -- liquidation_risk
        0.05 + (random() * 0.15), -- slippage_impact
        0.9 + (random() * 0.1), -- order_fill_rate
        50 + (random() * 100), -- execution_latency
        0.01 + (random() * 0.05), -- price_impact
        0.2 + (random() * 0.6), -- exchange_concentration
        0.7 + (random() * 0.3), -- counterparty_rating
        0.1 + (random() * 0.2), -- settlement_risk
        0.1 + (random() * 0.3) -- custody_risk
      );
      
      -- Insert risk metrics history
      INSERT INTO risk_metrics_history (
        bot_id, period, metric_values, thresholds
      ) VALUES (
        v_bot_id,
        CASE floor(random() * 4)
          WHEN 0 THEN 'hourly'
          WHEN 1 THEN 'daily'
          WHEN 2 THEN 'weekly'
          ELSE 'monthly'
        END,
        jsonb_build_object(
          'position_concentration', 0.3 + (random() * 0.5),
          'position_liquidity_ratio', 0.2 + (random() * 0.6),
          'cross_exchange_exposure', 0.1 + (random() * 0.4),
          'position_correlation', 0.1 + (random() * 0.3),
          'avg_leverage_ratio', 1.5 + (random() * 3),
          'max_leverage_used', 2.0 + (random() * 4),
          'margin_utilization', 0.3 + (random() * 0.5),
          'liquidation_risk', 0.1 + (random() * 0.3)
        ),
        jsonb_build_object(
          'position_risk', 0.8,
          'leverage_risk', 0.75,
          'execution_risk', 0.7,
          'counterparty_risk', 0.6
        )
      );
    END LOOP;
  END LOOP;
END $$;