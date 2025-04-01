import { supabase } from '../../lib/supabaseClient';
import { variance, mean, standardDeviation } from 'simple-statistics';
import { create, all } from 'mathjs';

const math = create(all);

interface Position {
  size: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  currentPrice: number;
  exchange: string;
}

interface Trade {
  entry_price: number;
  exit_price: number;
  quantity: number;
  execution_time: number;
  slippage: number;
  fees: number;
  exchange: string;
  status: 'open' | 'closed' | 'error';
}

export class RiskMetricsService {
  private static instance: RiskMetricsService;
  private updateInterval: NodeJS.Timer | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): RiskMetricsService {
    if (!RiskMetricsService.instance) {
      RiskMetricsService.instance = new RiskMetricsService();
    }
    return RiskMetricsService.instance;
  }

  public async startMetricsCollection(botId: string) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      await this.collectAndStoreMetrics(botId);
    }, 60000); // Update every minute

    // Initial collection
    await this.collectAndStoreMetrics(botId);
  }

  public stopMetricsCollection() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async collectAndStoreMetrics(botId: string) {
    try {
      // Collect current metrics
      const metrics = await this.calculateCurrentMetrics(botId);

      // Store in real-time metrics table
      const { error: metricsError } = await supabase
        .from('risk_metrics')
        .insert([{
          bot_id: botId,
          ...metrics
        }]);

      if (metricsError) throw metricsError;

      // Store in history table for different periods
      const periods = ['hourly', 'daily', 'weekly', 'monthly'];
      for (const period of periods) {
        const { error: historyError } = await supabase
          .from('risk_metrics_history')
          .insert([{
            bot_id: botId,
            period,
            metric_values: metrics,
            thresholds: {
              position_risk: 0.8,
              leverage_risk: 0.75,
              execution_risk: 0.7,
              counterparty_risk: 0.6
            }
          }]);

        if (historyError) throw historyError;
      }
    } catch (error) {
      console.error('Error collecting risk metrics:', error);
    }
  }

  private async calculateCurrentMetrics(botId: string) {
    // Fetch required data
    const { data: trades } = await supabase
      .from('bot_trades')
      .select('*')
      .eq('bot_id', botId)
      .order('entry_timestamp', { ascending: false })
      .limit(100);

    const { data: positions } = await supabase
      .from('bot_positions')
      .select('*')
      .eq('bot_id', botId);

    // Calculate metrics
    const positionMetrics = this.calculatePositionRiskMetrics(positions || []);
    const leverageMetrics = this.calculateLeverageRiskMetrics(positions || []);
    const executionMetrics = this.calculateExecutionRiskMetrics(trades || []);
    const counterpartyMetrics = this.calculateCounterpartyRiskMetrics(positions || []);

    return {
      ...positionMetrics,
      ...leverageMetrics,
      ...executionMetrics,
      ...counterpartyMetrics
    };
  }

  private calculatePositionRiskMetrics(positions: Position[]) {
    if (positions.length === 0) {
      return {
        position_concentration: 0,
        position_liquidity_ratio: 0,
        cross_exchange_exposure: 0,
        position_correlation: 0
      };
    }

    // Calculate position concentration (Herfindahl-Hirschman Index)
    const totalSize = positions.reduce((sum, pos) => sum + Math.abs(pos.size), 0);
    const concentration = positions.reduce((sum, pos) => {
      const share = Math.abs(pos.size) / totalSize;
      return sum + (share * share);
    }, 0);

    // Calculate cross-exchange exposure
    const exchangeExposures = positions.reduce((acc, pos) => {
      acc[pos.exchange] = (acc[pos.exchange] || 0) + Math.abs(pos.size);
      return acc;
    }, {} as Record<string, number>);
    const maxExchangeExposure = Math.max(...Object.values(exchangeExposures)) / totalSize;

    // Calculate position correlation
    const returns = positions.map(pos => (pos.currentPrice - pos.liquidationPrice) / pos.currentPrice);
    const correlation = returns.length > 1 ? 
      Math.abs(this.calculateCorrelation(returns.slice(0, -1), returns.slice(1))) : 
      0;

    return {
      position_concentration: concentration,
      position_liquidity_ratio: this.calculateLiquidityRatio(positions),
      cross_exchange_exposure: maxExchangeExposure,
      position_correlation: correlation
    };
  }

  private calculateLeverageRiskMetrics(positions: Position[]) {
    if (positions.length === 0) {
      return {
        avg_leverage_ratio: 0,
        max_leverage_used: 0,
        margin_utilization: 0,
        liquidation_risk: 0
      };
    }

    // Calculate average leverage
    const avgLeverage = mean(positions.map(pos => pos.leverage));

    // Calculate maximum leverage
    const maxLeverage = Math.max(...positions.map(pos => pos.leverage));

    // Calculate margin utilization
    const totalMargin = positions.reduce((sum, pos) => sum + pos.margin, 0);
    const totalRequired = positions.reduce((sum, pos) => sum + (pos.size * pos.currentPrice), 0);
    const marginUtilization = totalMargin / totalRequired;

    // Calculate liquidation risk
    const liquidationRisks = positions.map(pos => {
      const distanceToLiquidation = Math.abs(pos.currentPrice - pos.liquidationPrice) / pos.currentPrice;
      return 1 - Math.min(distanceToLiquidation, 1);
    });
    const avgLiquidationRisk = mean(liquidationRisks);

    return {
      avg_leverage_ratio: avgLeverage,
      max_leverage_used: maxLeverage,
      margin_utilization: marginUtilization,
      liquidation_risk: avgLiquidationRisk
    };
  }

  private calculateExecutionRiskMetrics(trades: Trade[]) {
    if (trades.length === 0) {
      return {
        slippage_impact: 0,
        order_fill_rate: 0,
        execution_latency: 0,
        price_impact: 0
      };
    }

    // Calculate average slippage
    const slippages = trades.map(t => t.slippage);
    const avgSlippage = mean(slippages);

    // Calculate order fill rate
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === 'closed').length;
    const fillRate = successfulTrades / totalTrades;

    // Calculate average execution latency
    const latencies = trades.map(t => t.execution_time);
    const avgLatency = mean(latencies);

    // Calculate price impact
    const priceImpacts = trades.map(t => 
      Math.abs((t.exit_price - t.entry_price) / t.entry_price)
    );
    const avgPriceImpact = mean(priceImpacts);

    return {
      slippage_impact: avgSlippage,
      order_fill_rate: fillRate,
      execution_latency: avgLatency,
      price_impact: avgPriceImpact
    };
  }

  private calculateCounterpartyRiskMetrics(positions: Position[]) {
    if (positions.length === 0) {
      return {
        exchange_concentration: 0,
        counterparty_rating: 0,
        settlement_risk: 0,
        custody_risk: 0
      };
    }

    // Calculate exchange concentration
    const exchangeVolumes = positions.reduce((acc, pos) => {
      acc[pos.exchange] = (acc[pos.exchange] || 0) + Math.abs(pos.size);
      return acc;
    }, {} as Record<string, number>);
    
    const totalVolume = Object.values(exchangeVolumes).reduce((a, b) => a + b, 0);
    const exchangeConcentration = Math.max(...Object.values(exchangeVolumes)) / totalVolume;

    // Calculate counterparty rating (mock implementation)
    const exchangeRatings: Record<string, number> = {
      'binance': 0.9,
      'bybit': 0.85,
      'okx': 0.8,
      'deribit': 0.85
    };
    
    const weightedRating = positions.reduce((acc, pos) => {
      const rating = exchangeRatings[pos.exchange] || 0.5;
      const weight = Math.abs(pos.size) / totalVolume;
      return acc + (rating * weight);
    }, 0);

    // Calculate settlement risk based on exchange volumes and ratings
    const settlementRisk = 1 - weightedRating;

    // Calculate custody risk based on exchange concentration and ratings
    const custodyRisk = exchangeConcentration * (1 - weightedRating);

    return {
      exchange_concentration: exchangeConcentration,
      counterparty_rating: weightedRating,
      settlement_risk: settlementRisk,
      custody_risk: custodyRisk
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const xMean = mean(x);
    const yMean = mean(y);
    
    const xDiff = x.map(val => val - xMean);
    const yDiff = y.map(val => val - yMean);
    
    const numerator = xDiff.reduce((acc, val, i) => acc + val * yDiff[i], 0);
    const denominator = Math.sqrt(
      xDiff.reduce((acc, val) => acc + val * val, 0) *
      yDiff.reduce((acc, val) => acc + val * val, 0)
    );
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateLiquidityRatio(positions: Position[]): number {
    // Mock implementation - in production, this would use actual market depth data
    const totalPositionValue = positions.reduce((sum, pos) => 
      sum + Math.abs(pos.size * pos.currentPrice), 0
    );
    
    // Assume average daily volume is 100x the position size for liquid markets
    const assumedMarketVolume = totalPositionValue * 100;
    
    return Math.min(totalPositionValue / assumedMarketVolume, 1);
  }
}