import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface RiskMetrics {
  id: string;
  bot_id: string;
  timestamp: string;
  position_concentration: number;
  position_liquidity_ratio: number;
  cross_exchange_exposure: number;
  position_correlation: number;
  avg_leverage_ratio: number;
  max_leverage_used: number;
  margin_utilization: number;
  liquidation_risk: number;
  slippage_impact: number;
  order_fill_rate: number;
  execution_latency: number;
  price_impact: number;
  exchange_concentration: number;
  counterparty_rating: number;
  settlement_risk: number;
  custody_risk: number;
  position_risk_threshold: number;
  leverage_risk_threshold: number;
  execution_risk_threshold: number;
  counterparty_risk_threshold: number;
}

export interface RiskMetricsHistory {
  id: string;
  risk_metric_id: string;
  bot_id: string;
  timestamp: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metric_values: Record<string, number>;
  thresholds: Record<string, number>;
}

export function useRiskMetrics(botId: string) {
  const [currentMetrics, setCurrentMetrics] = useState<RiskMetrics | null>(null);
  const [history, setHistory] = useState<RiskMetricsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current metrics
        const { data: currentData, error: currentError } = await supabase
          .from('risk_metrics')
          .select('*')
          .eq('bot_id', botId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (currentError) throw currentError;
        setCurrentMetrics(currentData);

        // Fetch historical metrics
        const { data: historyData, error: historyError } = await supabase
          .from('risk_metrics_history')
          .select('*')
          .eq('bot_id', botId)
          .order('timestamp', { ascending: false })
          .limit(30);

        if (historyError) throw historyError;
        setHistory(historyData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch risk metrics');
        console.error('Error fetching risk metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskMetrics();

    // Set up real-time subscription
    const subscription = supabase
      .channel('risk-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'risk_metrics',
        filter: `bot_id=eq.${botId}`
      }, fetchRiskMetrics)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [botId]);

  return {
    currentMetrics,
    history,
    isLoading,
    error
  };
}