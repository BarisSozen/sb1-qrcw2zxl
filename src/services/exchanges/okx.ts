import { RestClient } from 'okx-api';

export class OKXService {
  private client: RestClient;

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.client = new RestClient({
      apiKey,
      apiSecret,
      passphrase,
      sandbox: false
    });
  }

  async getAccountBalance() {
    try {
      const response = await this.client.getBalance();
      return response.data;
    } catch (error) {
      console.error('Error fetching OKX balance:', error);
      throw error;
    }
  }

  async getMarketPrice(symbol: string) {
    try {
      const response = await this.client.getTicker({ instId: symbol });
      return response.data;
    } catch (error) {
      console.error('Error fetching OKX market price:', error);
      throw error;
    }
  }

  async placeLimitOrder(symbol: string, side: 'buy' | 'sell', size: string, price: string) {
    try {
      const response = await this.client.placeOrder({
        instId: symbol,
        tdMode: 'cash',
        side,
        ordType: 'limit',
        sz: size,
        px: price
      });
      return response.data;
    } catch (error) {
      console.error('Error placing OKX order:', error);
      throw error;
    }
  }
}