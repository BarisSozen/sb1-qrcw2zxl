export interface ApiKey {
  id: string;
  exchange: 'binance' | 'bybit' | 'okx' | 'deribit';
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  active: boolean;
  commissionRate: number;
  totalInvested: number;
  currentBalance: number;
  createdAt: string;
  clientType: 'standard' | 'audit';
}

export interface Trade {
  id: string;
  clientId: string;
  exchange: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  profit: number;
  timestamp: string;
}

export interface Commission {
  id: string;
  clientId: string;
  amount: number;
  tradeId: string;
  paid: boolean;
  createdAt: string;
}