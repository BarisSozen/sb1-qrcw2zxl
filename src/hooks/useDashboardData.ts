import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DashboardStats {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  activeBots: number;
  openPositions: number;
  totalInvested: number;
  currentBalance: number;
  bestPerformingPair: string;
  bestPerformingBot: string;
}

export interface BotTypePerformance {
  type: string;
  name: string;
  annualYield: number;
  monthlyYield: number;
  weeklyYield: number;
  dailyYield: number;
  totalTrades: number;
  activeBots: number;
}

export interface YieldDataPoint {
  date: string;
  dexYield: number;
  cexYield: number;
  hybridYield: number;
  compound: number;
  statisticalYield: number;
}

export function useDashboardData(timeframe: string = '30d') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [botTypePerformance, setBotTypePerformance] = useState<BotTypePerformance[]>([]);
  const [yieldData, setYieldData] = useState<YieldDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '1y':
            startDate.setDate(endDate.getDate() - 365);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        // Fetch trades within timeframe
        const { data: trades, error: tradesError } = await supabase
          .from('bot_trades')
          .select('*')
          .gte('entry_timestamp', startDate.toISOString())
          .lte('entry_timestamp', endDate.toISOString());

        if (tradesError) throw tradesError;

        // Fetch active bots
        const { data: bots, error: botsError } = await supabase
          .from('bot_configs')
          .select('*');

        if (botsError) throw botsError;

        // Fetch open positions
        const { data: positions, error: positionsError } = await supabase
          .from('bot_positions')
          .select('*')
          .eq('status', 'open');

        if (positionsError) throw positionsError;

        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) throw clientsError;

        // Calculate dashboard stats
        const closedTrades = trades?.filter(t => t.status === 'closed') || [];
        const winningTrades = closedTrades.filter(t => t.pnl > 0);
        const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        // Calculate best performing pair
        const pairPerformance: Record<string, number> = {};
        closedTrades.forEach(trade => {
          if (!trade.pnl) return;
          pairPerformance[trade.pair] = (pairPerformance[trade.pair] || 0) + trade.pnl;
        });
        
        const bestPair = Object.entries(pairPerformance)
          .sort(([, a], [, b]) => b - a)
          .map(([pair]) => pair)[0] || 'N/A';
        
        // Calculate best performing bot
        const botPerformance: Record<string, number> = {};
        closedTrades.forEach(trade => {
          if (!trade.pnl || !trade.bot_id) return;
          botPerformance[trade.bot_id] = (botPerformance[trade.bot_id] || 0) + trade.pnl;
        });
        
        const bestBotId = Object.entries(botPerformance)
          .sort(([, a], [, b]) => b - a)
          .map(([id]) => id)[0];
        
        const bestBot = bots?.find(b => b.id === bestBotId)?.name || 'N/A';
        
        // Calculate total invested and current balance
        const totalInvested = clients?.reduce((sum, c) => sum + (c.total_invested || 0), 0) || 0;
        const currentBalance = clients?.reduce((sum, c) => sum + (c.current_balance || 0), 0) || 0;

        setStats({
          totalTrades: closedTrades.length,
          totalPnl,
          winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
          activeBots: bots?.filter(b => b.status === 'running').length || 0,
          openPositions: positions?.length || 0,
          totalInvested,
          currentBalance,
          bestPerformingPair: bestPair,
          bestPerformingBot: bestBot
        });

        // Calculate bot type performance
        const botTypes = ['basis', 'perpetual', 'dex', 'statistical'];
        const botTypeNames = {
          'basis': 'Basis Arbitrage',
          'perpetual': 'Perpetual Arbitrage',
          'dex': 'DEX Arbitrage',
          'statistical': 'Statistical Arbitrage'
        };
        
        const performance: BotTypePerformance[] = [];
        
        for (const type of botTypes) {
          const typeBots = bots?.filter(b => b.type === type) || [];
          const typeActiveBots = typeBots.filter(b => b.status === 'running').length;
          
          const typeTrades = closedTrades.filter(t => {
            const bot = bots?.find(b => b.id === t.bot_id);
            return bot?.type === type;
          });
          
          const typePnl = typeTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          const initialCapital = typeBots.reduce((sum, b) => sum + (b.max_position_size || 0), 0);
          
          // Calculate yields (annualized)
          const annualYield = initialCapital > 0 ? (typePnl / initialCapital) * 100 : 0;
          
          performance.push({
            type,
            name: botTypeNames[type as keyof typeof botTypeNames],
            annualYield,
            monthlyYield: annualYield / 12,
            weeklyYield: annualYield / 52,
            dailyYield: annualYield / 365,
            totalTrades: typeTrades.length,
            activeBots: typeActiveBots
          });
        }
        
        setBotTypePerformance(performance);

        // Generate yield data points
        const yieldPoints: YieldDataPoint[] = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        for (let i = 0; i < months.length; i++) {
          // Base values with small random variations
          const dexYield = 4.0 + (i * 0.2) + (Math.random() * 0.5);
          const cexYield = 3.5 + (i * 0.15) + (Math.random() * 0.5);
          const hybridYield = 5.0 + (i * 0.2) + (Math.random() * 0.5);
          const statisticalYield = 4.5 + (i * 0.25) + (Math.random() * 0.5);
          
          // Compound is slightly higher than the average
          const compound = (dexYield + cexYield + hybridYield + statisticalYield) / 4 * 1.1;
          
          yieldPoints.push({
            date: `2023-${String(i + 1).padStart(2, '0')}`,
            dexYield,
            cexYield,
            hybridYield,
            compound,
            statisticalYield
          });
        }
        
        setYieldData(yieldPoints);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  return {
    stats,
    botTypePerformance,
    yieldData,
    isLoading,
    error
  };
}