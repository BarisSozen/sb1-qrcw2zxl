import { DeribitClient } from 'deribit-v2-ws';

export class DeribitService {
  private client: DeribitClient;

  constructor(apiKey: string, apiSecret: string) {
    this.client = new DeribitClient({
      apiKey,
      apiSecret,
      testnet: false
    });
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Error connecting to Deribit:', error);
      throw error;
    }
  }

  async getAccountBalance() {
    try {
      const response = await this.client.private.get_account_summary({
        currency: 'BTC',
        extended: true
      });
      return response;
    } catch (error) {
      console.error('Error fetching Deribit balance:', error);
      throw error;
    }
  }

  async getMarketPrice(instrumentName: string) {
    try {
      const response = await this.client.public.get_order_book({
        instrument_name: instrumentName,
        depth: 1
      });
      return response;
    } catch (error) {
      console.error('Error fetching Deribit market price:', error);
      throw error;
    }
  }

  async placeLimitOrder(instrumentName: string, side: 'buy' | 'sell', amount: number, price: number) {
    try {
      const response = await this.client.private.buy({
        instrument_name: instrumentName,
        amount,
        type: 'limit',
        price,
        post_only: true
      });
      return response;
    } catch (error) {
      console.error('Error placing Deribit order:', error);
      throw error;
    }
  }

  disconnect() {
    this.client.disconnect();
  }
}