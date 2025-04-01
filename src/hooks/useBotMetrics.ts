import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface BotMetrics {
  id: string;
  bot_id: string;
  timestamp: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  avg_drawdown: number;
  volatility: number;
  var_95: number;
  success_rate: number;
  uptime_percent: number;
  avg_latency: number;
  execution_speed: number;
  order_fill_rate: number;
  avg_slippage: number;
  profit_factor: number;
  recovery_factor: number;
  cost_efficiency: number;
  return_on_capital: number;
  win_rate: number;
  profit_per_trade: number;
  win_loss_ratio: number;
  strategy_allocation: Record<string, number>;
}

export function useBotMetrics(botId: string, period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily') {
  const [metrics, setMetrics] = useState<BotMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('bot_metrics')
          .select('*')
          .eq('bot_id', botId)
          .eq('period', period)
          .order('timestamp', { ascending: false })
          .limit(30); // Last 30 data points

        if (fetchError) throw fetchError;
        setMetrics(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bot metrics');
        console.error('Error fetching bot metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Set up real-time subscription
    const subscription = supabase
      .channel('bot-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bot_metrics',
        filter: `bot_id=eq.${botId} AND period=eq.${period}`
      }, fetchMetrics)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [botId, period]);

  return {
    metrics,
    isLoading,
    error
  };
}