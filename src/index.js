import CONFIG, { validateConfig } from './config/config.js';
import EventManager from './services/eventManager.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('AUTOBOTQ');

/**
 * Main application entry point
 */
class AUTOBOTQ {
  constructor() {
    this.eventManager = null;
    this.isRunning = false;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      logger.info('\n' + '='.repeat(60));
      logger.info('🤖 AUTOBOTQ - Automated Economic Data Bot');
      logger.info('='.repeat(60) + '\n');

      // Validate configuration
      logger.info('📋 Validating configuration...');
      validateConfig();
      logger.info('✅ Configuration valid\n');

      // Initialize event manager
      logger.info('🔌 Initializing EventManager...');
      this.eventManager = new EventManager();
      await this.eventManager.initialize();
      logger.info('✅ EventManager initialized\n');

      // Start polling
      logger.info(`⏱️  Starting data polling every ${CONFIG.POLL_INTERVAL / 1000} seconds...`);
      logger.info('📊 Tracking:');
      logger.info(`   - Economies: ${CONFIG.NOTION_DATABASE_ID ? '✅' : '❌'} Notion connected`);
      logger.info(`   - Indicators: ${CONFIG.FXMACRODATA_API_KEY ? '✅' : '❌'} FXMacroData connected`);
      logger.info('\n');

      await this.eventManager.start(CONFIG.POLL_INTERVAL);

      this.isRunning = true;
      logger.info('🚀 AUTOBOTQ is running!\n');
      logger.info('📊 Bot Status:');
      logger.info('   • Polling for data...');
      logger.info('   • Processing indicators...');
      logger.info('   • Analyzing economic impact...');
      logger.info('   • Pushing to Notion...');
      logger.info('\n' + '='.repeat(60));
      logger.info('Press Ctrl+C to stop the bot');
      logger.info('='.repeat(60) + '\n');
    } catch (error) {
      logger.error('❌ Failed to start AUTOBOTQ', { error: error.message });
      logger.error('Stack trace:', { stack: error.stack });
      process.exit(1);
    }
  }

  /**
   * Gracefully stop the bot
   */
  async stop() {
    try {
      logger.info('\n🛑 Shutting down AUTOBOTQ...');

      if (this.eventManager) {
        await this.eventManager.stop();
      }

      this.isRunning = false;
      logger.info('✅ AUTOBOTQ stopped gracefully\n');
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get bot status
   */
  getStatus() {
    if (!this.eventManager) {
      return { isRunning: false, message: 'Bot not initialized' };
    }

    const status = this.eventManager.getStatus();
    return {
      isRunning: this.isRunning,
      ...status,
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const bot = new AUTOBOTQ();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await bot.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  // Start the bot
  await bot.start();
}

// Run main function
main().catch((error) => {
  logger.error('Fatal error in main', { error: error.message });
  process.exit(1);
});

export default AUTOBOTQ;
