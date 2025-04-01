export interface TradeLog {
  accountAddress: string;
  amount: number;
  profit: number;
  timestamp: number;
}

export interface SecurityIncident {
  id: string;
  timestamp: number;
  type: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
  accountAddress?: string;
}

export class SecurityService {
  private rateLimits: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 10;
  private tradeLogs: TradeLog[] = [];
  private incidents: SecurityIncident[] = [];
  private isKillSwitchActive = false;
  private systemRiskLevel: 'low' | 'medium' | 'high' = 'low';
  private riskScoreThresholds = {
    medium: 0.5,
    high: 0.8
  };

  constructor() {
    // Start monitoring system risk
    setInterval(() => this.updateSystemRisk(), 60000);
  }

  private updateSystemRisk() {
    const recentIncidents = this.incidents.filter(
      i => i.timestamp > Date.now() - 24 * 60 * 60 * 1000
    );

    const highRiskIncidents = recentIncidents.filter(i => i.riskLevel === 'high').length;
    const mediumRiskIncidents = recentIncidents.filter(i => i.riskLevel === 'medium').length;

    const riskScore = (highRiskIncidents * 0.3 + mediumRiskIncidents * 0.1) / recentIncidents.length;

    if (riskScore >= this.riskScoreThresholds.high) {
      this.systemRiskLevel = 'high';
      this.activateKillSwitch('Automatic activation due to high risk score');
    } else if (riskScore >= this.riskScoreThresholds.medium) {
      this.systemRiskLevel = 'medium';
    } else {
      this.systemRiskLevel = 'low';
    }
  }

  activateKillSwitch(reason: string) {
    this.isKillSwitchActive = true;
    this.logIncident({
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'Kill Switch Activation',
      description: reason,
      riskLevel: 'high',
      status: 'active'
    });
  }

  deactivateKillSwitch(reason: string) {
    if (this.systemRiskLevel === 'high') {
      throw new Error('Cannot deactivate kill switch while system risk is high');
    }
    this.isKillSwitchActive = false;
    this.logIncident({
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'Kill Switch Deactivation',
      description: reason,
      riskLevel: 'low',
      status: 'resolved'
    });
  }

  isSystemHalted(): boolean {
    return this.isKillSwitchActive;
  }

  getSystemRiskLevel(): 'low' | 'medium' | 'high' {
    return this.systemRiskLevel;
  }

  async getDailyVolume(address: string): Promise<number> {
    if (this.isKillSwitchActive) {
      throw new Error('System is halted');
    }

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.tradeLogs
      .filter(log => log.accountAddress === address && log.timestamp > oneDayAgo)
      .reduce((sum, log) => sum + log.amount, 0);
  }

  async hasSuspiciousActivity(address: string): Promise<boolean> {
    const recentTrades = this.tradeLogs
      .filter(log => log.accountAddress === address)
      .slice(-10);

    // Check for unusual profit patterns
    const profitVariance = this.calculateVariance(recentTrades.map(t => t.profit));
    if (profitVariance > 1000) {
      this.logIncident({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'Suspicious Activity',
        description: `Unusual profit variance detected for address ${address}`,
        riskLevel: 'high',
        status: 'active',
        accountAddress: address
      });
      return true;
    }

    // Check for rapid successive trades
    const timeGaps = recentTrades
      .slice(1)
      .map((trade, i) => trade.timestamp - recentTrades[i].timestamp);
    const avgTimeGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    if (avgTimeGap < 1000) {
      this.logIncident({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'Suspicious Activity',
        description: `Rapid trading detected for address ${address}`,
        riskLevel: 'medium',
        status: 'active',
        accountAddress: address
      });
      return true;
    }

    return false;
  }

  checkRateLimit(address: string): boolean {
    if (this.isKillSwitchActive) {
      return false;
    }

    const now = Date.now();
    const requests = this.rateLimits.get(address) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > now - this.RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
      this.logIncident({
        id: Date.now().toString(),
        timestamp: now,
        type: 'Rate Limit Exceeded',
        description: `Rate limit exceeded for address ${address}`,
        riskLevel: 'medium',
        status: 'active',
        accountAddress: address
      });
      return false;
    }
    
    validRequests.push(now);
    this.rateLimits.set(address, validRequests);
    return true;
  }

  async logTrade(trade: TradeLog): Promise<void> {
    if (this.isKillSwitchActive) {
      throw new Error('System is halted');
    }

    this.tradeLogs.push(trade);
    
    // Keep only last 1000 trades in memory
    if (this.tradeLogs.length > 1000) {
      this.tradeLogs = this.tradeLogs.slice(-1000);
    }
  }

  private logIncident(incident: SecurityIncident) {
    this.incidents.push(incident);
    
    // Keep only last 1000 incidents in memory
    if (this.incidents.length > 1000) {
      this.incidents = this.incidents.slice(-1000);
    }
  }

  getRecentIncidents(): SecurityIncident[] {
    return [...this.incidents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}