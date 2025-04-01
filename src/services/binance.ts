export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

export class BinanceService {
  private baseUrl = 'https://api.binance.com';
  private wsUrl = 'wss://stream.binance.com:9443/ws';
  private apiKey: string;
  private apiSecret: string;

  constructor(credentials: BinanceCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }

  private async signRequest(params: Record<string, string>): Promise<string> {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // In a real implementation, we would sign the request here
    // For now, we'll just return the query string
    return queryString;
  }

  async getAccountInfo() {
    try {
      const timestamp = Date.now().toString();
      const params = {
        timestamp,
        recvWindow: '5000'
      };

      const signature = await this.signRequest(params);
      const response = await fetch(`${this.baseUrl}/api/v3/account?${signature}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  async getFuturesAccountInfo() {
    try {
      const timestamp = Date.now().toString();
      const params = {
        timestamp,
        recvWindow: '5000'
      };

      const signature = await this.signRequest(params);
      const response = await fetch(`${this.baseUrl}/fapi/v2/account?${signature}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching futures account info:', error);
      throw error;
    }
  }

  subscribeToTickerStream(symbol: string, callback: (data: any) => void) {
    const ws = new WebSocket(`${this.wsUrl}/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }
}