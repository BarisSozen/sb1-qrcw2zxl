import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Trade {
  id: string;
  bot_id: string;
  client_id: string;
  trade_type: 'spot' | 'perpetual' | 'basis' | 'statistical';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  fees: number;
  slippage: number;
  execution_time: number | null;
  status: 'open' | 'closed' | 'error';
  entry_timestamp: string;
  exit_timestamp: string | null;
  strategy: string;
  exchange: string;
  pair: string;
  bot?: {
    name: string;
    type: string;
  };
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  avgPnlPerTrade: number;
  winRate: number;
  avgExecutionTime: number;
  avgSlippage: number;
}

export function useTrades(botId?: string, clientId?: string, timeframe: string = '24h') {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('bot_trades')
          .select(`
            *,
            bot:bot_configs(
              name,
              type
            )
          `)
          .order('entry_timestamp', { ascending: false });

        if (botId) {
          query = query.eq('bot_id', botId);
        }

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        // Add timeframe filter
        const startDate = new Date();
        switch (timeframe) {
          case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }

        query = query.gte('entry_timestamp', startDate.toISOString());

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        // Transform the data to include strategy from bot
        const transformedTrades = data?.map(trade => ({
          ...trade,
          strategy: trade.bot?.type || trade.strategy || trade.trade_type
        })) || [];

        setTrades(transformedTrades);

        // Calculate stats
        if (transformedTrades.length > 0) {
          const closedTrades = transformedTrades.filter(t => t.status === 'closed');
          const winningTrades = closedTrades.filter(t => t.pnl && t.pnl > 0);
          const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

          setStats({
            totalTrades: closedTrades.length,
            winningTrades: winningTrades.length,
            losingTrades: closedTrades.length - winningTrades.length,
            totalPnl,
            avgPnlPerTrade: totalPnl / closedTrades.length,
            winRate: (winningTrades.length / closedTrades.length) * 100,
            avgExecutionTime: closedTrades.reduce((sum, t) => sum + (t.execution_time || 0), 0) / closedTrades.length,
            avgSlippage: closedTrades.reduce((sum, t) => sum + t.slippage, 0) / closedTrades.length
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
        console.error('Error fetching trades:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();

    // Set up real-time subscription
    const subscription = supabase
      .channel('bot-trades')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bot_trades',
        filter: botId ? `bot_id=eq.${botId}` : undefined
      }, fetchTrades)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [botId, clientId, timeframe]);

  return {
    trades,
    stats,
    isLoading,
    error
  };
}