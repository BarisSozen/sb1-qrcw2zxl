import { RestClientV5 } from 'bybit-api';

export class BybitService {
  private client: RestClientV5;

  constructor(apiKey: string, apiSecret: string) {
    this.client = new RestClientV5({
      key: apiKey,
      secret: apiSecret,
      testnet: false
    });
  }

  async getAccountBalance() {
    try {
      const response = await this.client.getWalletBalance({
        accountType: "UNIFIED"
      });
      return response.result;
    } catch (error) {
      console.error('Error fetching Bybit balance:', error);
      throw error;
    }
  }

  async getMarketPrice(symbol: string) {
    try {
      const response = await this.client.getTickers({
        category: 'spot',
        symbol
      });
      return response.result;
    } catch (error) {
      console.error('Error fetching Bybit market price:', error);
      throw error;
    }
  }

  async placeLimitOrder(symbol: string, side: 'Buy' | 'Sell', quantity: number, price: number) {
    try {
      const response = await this.client.submitOrder({
        category: 'spot',
        symbol,
        side,
        orderType: 'Limit',
        qty: quantity.toString(),
        price: price.toString()
      });
      return response.result;
    } catch (error) {
      console.error('Error placing Bybit order:', error);
      throw error;
    }
  }
}