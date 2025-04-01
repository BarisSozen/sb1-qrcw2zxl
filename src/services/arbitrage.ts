import { BigNumber } from 'ethers';
import { AccountManager, AccountBalance, TradeResult } from './accounts';
import { SecurityService } from './security';

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
  account: AccountBalance;
  result: TradeResult;
}

export class BasisArbitrageStrategy {
  private minAnnualizedReturn: number;
  private maxPositionSize: number;
  private leverageMultiple: number;
  private accountManager: AccountManager;
  private securityService: SecurityService;
  private maxRiskScore = 0.8; // Maximum allowed risk score (0-1)

  constructor(
    accountManager: AccountManager,
    minAnnualizedReturn: number = 5,
    maxPositionSize: number = 100000,
    leverageMultiple: number = 3
  ) {
    this.accountManager = accountManager;
    this.minAnnualizedReturn = minAnnualizedReturn;
    this.maxPositionSize = maxPositionSize;
    this.leverageMultiple = leverageMultiple;
    this.securityService = new SecurityService();
  }

  private calculateRiskScore(opportunity: Partial<BasisOpportunity>): number {
    let riskScore = 0;

    // Market risk factors
    riskScore += opportunity.basisSpread! > 5 ? 0.2 : 0.1;
    riskScore += opportunity.fundingRate! > 0.01 ? 0.2 : 0.1;
    
    // Liquidity risk
    if (opportunity.category === 'dex') riskScore += 0.2;
    if (opportunity.category === 'hybrid') riskScore += 0.15;
    if (opportunity.category === 'cex') riskScore += 0.1;

    // Time risk
    riskScore += opportunity.daysToExpiry! > 30 ? 0.2 : 0.1;

    // Capital exposure risk
    riskScore += opportunity.requiredCapital! > 50000 ? 0.2 : 0.1;

    return Math.min(riskScore, 1);
  }

  public async findBasisOpportunities(
    prices: MarketPrice[]
  ): Promise<BasisOpportunity[]> {
    const opportunities: BasisOpportunity[] = [];

    for (const price of prices) {
      const basisSpread = ((price.futuresPrice - price.spotPrice) / price.spotPrice) * 100;
      const daysToExpiry = (price.futuresExpiry - Date.now()) / (1000 * 60 * 60 * 24);
      
      const annualizedReturn = (basisSpread / daysToExpiry) * 365;
      const fundingReturn = price.fundingRate * 365 * 100;
      const totalAnnualizedReturn = annualizedReturn + fundingReturn;

      if (totalAnnualizedReturn > this.minAnnualizedReturn) {
        const optimalPosition = this.calculateOptimalPosition(
          price.spotPrice,
          this.maxPositionSize,
          this.leverageMultiple
        );

        const estimatedProfit = this.calculateEstimatedProfit(
          optimalPosition,
          price.spotPrice,
          price.futuresPrice,
          price.fundingRate,
          daysToExpiry
        );

        const opportunity: BasisOpportunity = {
          token: price.token,
          spotPrice: price.spotPrice,
          futuresPrice: price.futuresPrice,
          basisSpread,
          annualizedReturn: totalAnnualizedReturn,
          daysToExpiry,
          requiredCapital: optimalPosition,
          estimatedProfit,
          fundingRate: price.fundingRate,
          timestamp: price.timestamp,
          source: price.source,
          target: price.target,
          category: price.category,
          riskScore: 0
        };

        opportunity.riskScore = this.calculateRiskScore(opportunity);

        // Only add opportunities below the maximum risk score
        if (opportunity.riskScore <= this.maxRiskScore) {
          opportunities.push(opportunity);
        }
      }
    }

    return this.rankOpportunities(opportunities);
  }

  private calculateOptimalPosition(
    spotPrice: number,
    maxPosition: number,
    leverage: number
  ): number {
    const effectiveMax = maxPosition * leverage;
    const positionSize = effectiveMax / spotPrice;
    return Math.floor(positionSize * 1000) / 1000;
  }

  private calculateEstimatedProfit(
    positionSize: number,
    spotPrice: number,
    futuresPrice: number,
    fundingRate: number,
    daysToExpiry: number
  ): number {
    const spotValue = positionSize * spotPrice;
    const futuresValue = positionSize * futuresPrice;
    
    const basisProfit = futuresValue - spotValue;
    const fundingProfit = spotValue * fundingRate * (daysToExpiry / 365);
    
    const spotFee = spotValue * 0.001;
    const futuresFee = futuresValue * 0.0004;
    const totalFees = spotFee + futuresFee;
    
    return basisProfit + fundingProfit - totalFees;
  }

  private rankOpportunities(
    opportunities: BasisOpportunity[]
  ): BasisOpportunity[] {
    return opportunities.sort((a, b) => {
      // First sort by risk score (lower is better)
      if (Math.abs(a.riskScore - b.riskScore) > 0.1) {
        return a.riskScore - b.riskScore;
      }

      // Then by annualized return
      if (Math.abs(b.annualizedReturn - a.annualizedReturn) > 0.1) {
        return b.annualizedReturn - a.annualizedReturn;
      }
      
      // Then by days to expiry
      if (Math.abs(a.daysToExpiry - b.daysToExpiry) > 1) {
        return a.daysToExpiry - b.daysToExpiry;
      }
      
      return a.requiredCapital - b.requiredCapital;
    });
  }

  public async executeTrade(
    opportunity: BasisOpportunity,
    account: AccountBalance
  ): Promise<TradeExecution> {
    try {
      let result: TradeResult;

      // Execute trade based on account type
      if (account.subaccountId) {
        result = await this.accountManager.executeBinanceSubaccountTrade(account, {
          token: opportunity.token,
          amount: opportunity.requiredCapital,
          spotPrice: opportunity.spotPrice,
          futuresPrice: opportunity.futuresPrice,
          source: opportunity.source,
          target: opportunity.target,
          category: opportunity.category
        });
      } else {
        result = await this.accountManager.executeTradeWithAA(account, {
          token: opportunity.token,
          amount: opportunity.requiredCapital,
          spotPrice: opportunity.spotPrice,
          futuresPrice: opportunity.futuresPrice,
          source: opportunity.source,
          target: opportunity.target,
          category: opportunity.category
        });
      }

      return {
        opportunity,
        account,
        result
      };
    } catch (error) {
      return {
        opportunity,
        account,
        result: {
          success: false,
          profit: 0,
          commission: 0,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Trade execution failed'
        }
      };
    }
  }
}