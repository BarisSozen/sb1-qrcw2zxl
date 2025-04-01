export type BotType = 'basis' | 'perpetual' | 'dex' | 'statistical';
export type BotStatus = 'running' | 'stopped' | 'error';

export interface BotConfig {
  id: string;
  type: BotType;
  name: string;
  description?: string;
  active: boolean;
  status: BotStatus;
  interval?: number;
  minProfitThreshold: number;
  maxPositionSize: number;
  leverageLimit: number;
  exchanges: string[];
  pairs: string[];
  created_at?: string;
  updated_at?: string;
  client_id?: string;
  subaccount_id?: string;
  wallet_address?: string;
}

export interface BotStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: number;
  winRate: number;
  averageProfit: number;
  lastTradeTime?: string;
  uptime: number;
  clientId?: string;
}