import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface MarketPrice {
  token: string;
  spotPrice: number;
  futuresPrice: number;
  fundingRate: number;
  futuresExpiry: number;
  timestamp: number;
  source: string;
  target: string;
  category: 'dex' | 'cex' | 'hybrid';
}

export interface BasisOpportunity {
  token: string;
  spotPrice: number;
  futuresPrice: number;
  basisSpread: number;
  annualizedReturn: number;
  daysToExpiry: number;
  requiredCapital: number;
  estimatedProfit: number;
  fundingRate: number;
  timestamp: number;
  source: string;
  target: string;
  category: 'dex' | 'cex' | 'hybrid';
  riskScore: number;
}

export interface TradeExecution {
  opportunity: BasisOpportunity;
  result: {
    success: boolean;
    profit: number;
    commission: number;
    timestamp: number;
    error?: string;
  };
}

export function useArbitrage(
  minAnnualizedReturn: number = 5,
  maxPositionSize: number = 100000,
  leverageMultiple: number = 3
) {
  const [opportunities, setOpportunities] = useState<BasisOpportunity[]>([]);
  const [executions, setExecutions] = useState<TradeExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBots, setActiveBots] = useState<any[]>([]);

  // Fetch active bots to determine available trading pairs and exchanges
  useEffect(() => {
    const fetchActiveBots = async () => {
      try {
        const { data, error } = await supabase
          .from('bot_configs')
          .select('*')
          .eq('active', true)
          .eq('status', 'running');
        
        if (error) throw error;
        setActiveBots(data || []);
      } catch (err) {
        console.error('Error fetching active bots:', err);
      }
    };
    
    fetchActiveBots();
  }, []);

  const scanForOpportunities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get real market data from database
      const { data: marketData, error: marketError } = await supabase
        .from('market_prices')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (marketError) throw marketError;

      // If no market data in database, generate synthetic data based on active bots
      const prices: MarketPrice[] = marketData?.length > 0 ? marketData : generateSyntheticMarketData(activeBots);
      
      // Calculate opportunities
      const calculatedOpportunities = findBasisOpportunities(
        prices,
        minAnnualizedReturn,
        maxPositionSize,
        leverageMultiple
      );
      
      setOpportunities(calculatedOpportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for opportunities');
      console.error('Error scanning for opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTrade = async (opportunity: BasisOpportunity) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Insert trade into database
      const { data, error } = await supabase
        .from('bot_trades')
        .insert([{
          bot_id: activeBots[0]?.id, // Use first active bot
          client_id: activeBots[0]?.client_id,
          trade_type: opportunity.category === 'dex' ? 'spot' : 
                      opportunity.category === 'cex' ? 'basis' : 'perpetual',
          entry_price: opportunity.spotPrice,
          quantity: opportunity.requiredCapital / opportunity.spotPrice,
          fees: (opportunity.requiredCapital * 0.001), // 0.1% fee
          slippage: 0.0005, // 0.05% slippage
          execution_time: Math.floor(Math.random() * 200) + 50, // 50-250ms
          status: 'open',
          strategy: opportunity.category === 'dex' ? 'DEX Arbitrage' : 
                   opportunity.category === 'cex' ? 'Basis Trading' : 'Funding Rate Arbitrage',
          exchange: opportunity.source,
          pair: `${opportunity.token}/USD`
        }]);
      
      if (error) throw error;
      
      const execution: TradeExecution = {
        opportunity,
        result: {
          success: true,
          profit: opportunity.estimatedProfit,
          commission: opportunity.estimatedProfit * 0.2, // 20% commission
          timestamp: Date.now()
        }
      };
      
      setExecutions(prev => [...prev, execution]);
      setOpportunities(prev => prev.filter(op => op.token !== opportunity.token));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trade');
      console.error('Error executing trade:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scanForOpportunities();
    const interval = setInterval(scanForOpportunities, 30000);
    return () => clearInterval(interval);
  }, [minAnnualizedReturn, maxPositionSize, leverageMultiple, activeBots]);

  return {
    opportunities,
    executions,
    isLoading,
    error,
    scanForOpportunities,
    executeTrade
  };
}

// Helper function to generate synthetic market data based on active bots
function generateSyntheticMarketData(activeBots: any[]): MarketPrice[] {
  const prices: MarketPrice[] = [];
  const now = Date.now();
  
  // Extract unique pairs and exchanges from active bots
  const pairs = new Set<string>();
  const exchanges = new Set<string>();
  
  activeBots.forEach(bot => {
    bot.pairs?.forEach((pair: string) => pairs.add(pair));
    bot.exchanges?.forEach((exchange: string) => exchanges.add(exchange));
  });
  
  // If no bots, use default values
  const defaultPairs = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
  const defaultExchanges = ['binance', 'bybit', 'okx', 'deribit'];
  
  const pairsArray = pairs.size > 0 ? Array.from(pairs) : defaultPairs;
  const exchangesArray = exchanges.size > 0 ? Array.from(exchanges) : defaultExchanges;
  
  // Generate prices for each pair across exchanges
  pairsArray.forEach(pair => {
    const token = pair.split('/')[0];
    let baseSpotPrice = 0;
    
    // Set base price based on token
    if (token === 'BTC') baseSpotPrice = 35000 + (Math.random() * 5000);
    else if (token === 'ETH') baseSpotPrice = 2000 + (Math.random() * 300);
    else if (token === 'SOL') baseSpotPrice = 100 + (Math.random() * 20);
    else baseSpotPrice = 1 + (Math.random() * 10);
    
    // Generate prices for CEX exchanges
    exchangesArray.forEach(exchange => {
      // Add small variation for each exchange
      const spotPrice = baseSpotPrice * (1 + (Math.random() * 0.02 - 0.01)); // ±1%
      const futuresPrice = spotPrice * (1 + (Math.random() * 0.05)); // 0-5% premium
      const fundingRate = Math.random() * 0.0005; // 0-0.05% funding rate
      
      prices.push({
        token,
        spotPrice,
        futuresPrice,
        fundingRate,
        futuresExpiry: now + (90 * 24 * 60 * 60 * 1000), // 90 days
        timestamp: now,
        source: exchange,
        target: exchange,
        category: 'cex'
      });
    });
    
    // Add some DEX opportunities
    if (['ETH', 'SOL'].includes(token)) {
      const dexSpotPrice = baseSpotPrice * (1 + (Math.random() * 0.03 - 0.015)); // ±1.5%
      prices.push({
        token,
        spotPrice: dexSpotPrice,
        futuresPrice: dexSpotPrice * (1 + (Math.random() * 0.04)), // 0-4% premium
        fundingRate: 0,
        futuresExpiry: now + (30 * 24 * 60 * 60 * 1000), // 30 days
        timestamp: now,
        source: 'uniswap',
        target: 'dydx',
        category: 'dex'
      });
    }
  });
  
  return prices;
}

// Helper function to calculate basis arbitrage opportunities
function findBasisOpportunities(
  prices: MarketPrice[],
  minAnnualizedReturn: number,
  maxPositionSize: number,
  leverageMultiple: number
): BasisOpportunity[] {
  const opportunities: BasisOpportunity[] = [];
  const tokens = new Set(prices.map(p => p.token));
  
  tokens.forEach(token => {
    const tokenPrices = prices.filter(p => p.token === token);
    
    // Find min spot price and max futures price
    const minSpotPrice = Math.min(...tokenPrices.map(p => p.spotPrice));
    const maxFuturesPrice = Math.max(...tokenPrices.map(p => p.futuresPrice));
    
    const minSpotExchange = tokenPrices.find(p => p.spotPrice === minSpotPrice)?.source || '';
    const maxFuturesExchange = tokenPrices.find(p => p.futuresPrice === maxFuturesPrice)?.source || '';
    
    // Skip if same exchange (can't arbitrage on same exchange)
    if (minSpotExchange === maxFuturesExchange && minSpotExchange !== 'uniswap') return;
    
    const basisSpread = ((maxFuturesPrice - minSpotPrice) / minSpotPrice) * 100;
    const futuresExpiry = tokenPrices.find(p => p.futuresPrice === maxFuturesPrice)?.futuresExpiry || 0;
    const daysToExpiry = (futuresExpiry - Date.now()) / (1000 * 60 * 60 * 24);
    
    const annualizedReturn = (basisSpread / daysToExpiry) * 365;
    
    // Only include if meets minimum return
    if (annualizedReturn > minAnnualizedReturn) {
      // Calculate optimal position size
      const positionSize = Math.min(
        maxPositionSize,
        maxPositionSize * (annualizedReturn / (minAnnualizedReturn * 2)) // Scale by return
      );
      
      const estimatedProfit = (positionSize * basisSpread) / 100;
      
      // Calculate risk score (0-1)
      const riskScore = calculateRiskScore(
        basisSpread,
        daysToExpiry,
        minSpotExchange,
        maxFuturesExchange,
        token
      );
      
      opportunities.push({
        token,
        spotPrice: minSpotPrice,
        futuresPrice: maxFuturesPrice,
        basisSpread,
        annualizedReturn,
        daysToExpiry,
        requiredCapital: positionSize,
        estimatedProfit,
        fundingRate: tokenPrices.find(p => p.futuresPrice === maxFuturesPrice)?.fundingRate || 0,
        timestamp: Date.now(),
        source: minSpotExchange,
        target: maxFuturesExchange,
        category: minSpotExchange === 'uniswap' || maxFuturesExchange === 'uniswap' ? 'dex' : 'cex',
        riskScore
      });
    }
  });
  
  // Sort by risk-adjusted return (annualizedReturn / riskScore)
  return opportunities.sort((a, b) => 
    (b.annualizedReturn / b.riskScore) - (a.annualizedReturn / a.riskScore)
  );
}

// Helper function to calculate risk score
function calculateRiskScore(
  basisSpread: number,
  daysToExpiry: number,
  spotExchange: string,
  futuresExchange: string,
  token: string
): number {
  let riskScore = 0;
  
  // Higher spread = higher risk
  riskScore += Math.min(basisSpread / 20, 0.3); // Max 0.3 from spread
  
  // Longer expiry = higher risk
  riskScore += Math.min(daysToExpiry / 180, 0.3); // Max 0.3 from expiry
  
  // DEX risk premium
  if (spotExchange === 'uniswap' || futuresExchange === 'uniswap') {
    riskScore += 0.2;
  }
  
  // Token risk (BTC lowest, others higher)
  if (token === 'BTC') riskScore += 0.05;
  else if (token === 'ETH') riskScore += 0.1;
  else riskScore += 0.15;
  
  return Math.min(riskScore, 0.95); // Cap at 0.95
}