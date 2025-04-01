import { supabase } from '../../lib/supabaseClient';
import { BasisArbitrageBot } from './BasisArbitrageBot';
import { PerpetualArbitrageBot } from './PerpetualArbitrageBot';
import { DexArbitrageBot } from './DexArbitrageBot';
import type { BotConfig, BotStatus, BotType } from '../../types/bots';

export class BotManager {
  private bots: Map<string, any> = new Map();
  private botConfigs: Map<string, BotConfig> = new Map();

  constructor() {
    this.initializeBots();
  }

  private async initializeBots() {
    try {
      const { data: configs, error } = await supabase
        .from('bot_configs')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      configs?.forEach(config => {
        this.botConfigs.set(config.id, config);
        this.createBot(config);
      });
    } catch (error) {
      console.error('Failed to initialize bots:', error);
    }
  }

  private createBot(config: BotConfig) {
    try {
      let bot;
      switch (config.type) {
        case 'basis':
          bot = new BasisArbitrageBot(config);
          break;
        case 'perpetual':
          bot = new PerpetualArbitrageBot(config);
          break;
        case 'dex':
          bot = new DexArbitrageBot(config);
          break;
        default:
          throw new Error(`Unknown bot type: ${config.type}`);
      }
      this.bots.set(config.id, bot);
    } catch (error) {
      console.error(`Failed to create bot ${config.id}:`, error);
    }
  }

  async startBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    await bot.start();
    await this.updateBotStatus(botId, 'running');
  }

  async stopBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    await bot.stop();
    await this.updateBotStatus(botId, 'stopped');
  }

  async updateBotConfig(botId: string, config: Partial<BotConfig>): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    await bot.updateConfig(config);
    
    const { error } = await supabase
      .from('bot_configs')
      .update(config)
      .eq('id', botId);

    if (error) throw error;
  }

  private async updateBotStatus(botId: string, status: BotStatus): Promise<void> {
    const { error } = await supabase
      .from('bot_configs')
      .update({ status })
      .eq('id', botId);

    if (error) throw error;
  }

  async getBotStatus(botId: string): Promise<BotStatus> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    return bot.getStatus();
  }

  async getBotStats(botId: string): Promise<any> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }
    return bot.getStats();
  }
}