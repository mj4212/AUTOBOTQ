import { Logger } from '../utils/logger.js';
import DataFetcher from './dataFetcher.js';
import DataValidator from '../utils/validators.js';
import DataFormatter from '../utils/formatters.js';
import EconomyHealthAnalyzer from './analyzers/economyHealthAnalyzer.js';
import DataImpactAnalyzer from './analyzers/dataImpactAnalyzer.js';
import RatePolicyAnalyzer from './analyzers/ratePolicyAnalyzer.js';
import BondImpactAnalyzer from './analyzers/bondImpactAnalyzer.js';
import NotionPusher from './notionPusher.js';
import PARAMETERS from '../config/parameters.js';

export class EventManager {
  constructor() {
    this.logger = new Logger('EventManager');
    this.fetcher = new DataFetcher();
    this.validator = new DataValidator();
    this.formatter = new DataFormatter();
    this.healthAnalyzer = new EconomyHealthAnalyzer();
    this.impactAnalyzer = new DataImpactAnalyzer();
    this.policyAnalyzer = new RatePolicyAnalyzer();
    this.bondAnalyzer = new BondImpactAnalyzer();
    this.notionPusher = new NotionPusher();
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize event manager and test connections
   */
  async initialize() {
    try {
      this.logger.info('Initializing EventManager...');

      // Test API connections
      const fxOk = await this.fetcher.testConnection();
      const notionOk = await this.notionPusher.testConnection();

      if (!fxOk || !notionOk) {
        throw new Error('Failed to connect to required APIs');
      }

      this.logger.info('EventManager initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize EventManager', { error: error.message });
      throw error;
    }
  }

  /**
   * Poll for new data and process events
   */
  async pollForData() {
    try {
      this.logger.info('Starting data poll cycle');

      // Fetch all data in parallel
      const [indicators, bonds, currencies, commodities] = await Promise.all([
        this.fetcher.fetchEconomicIndicators({
          economies: PARAMETERS.trackedEconomies,
        }),
        this.fetcher.fetchBondYields(PARAMETERS.trackedEconomies, PARAMETERS.trackedBonds),
        this.fetcher.fetchCurrencies(PARAMETERS.trackedCurrencies),
        this.fetcher.fetchCommodities(PARAMETERS.trackedCommodities),
      ]);

      this.logger.info('Data fetch completed', {
        indicators: indicators?.length || 0,
        bonds: Object.keys(bonds).length || 0,
      });

      // Queue events for processing
      if (indicators && indicators.length > 0) {
        this.queueEvents('indicator', indicators);
      }
      if (bonds && Object.keys(bonds).length > 0) {
        this.queueEvents('bond', bonds);
      }

      // Process queue
      await this.processEventQueue();
    } catch (error) {
      this.logger.error('Error during data poll', { error: error.message });
    }
  }

  /**
   * Queue events for processing
   */
  queueEvents(type, data) {
    if (type === 'indicator') {
      // Filter for relevant indicators
      const relevant = this.validator.filterRelevantIndicators(data, PARAMETERS);
      relevant.forEach((indicator) => {
        this.eventQueue.push({
          type: 'indicator',
          data: indicator,
          timestamp: new Date(),
        });
      });
    } else if (type === 'bond') {
      // Process bond data by economy
      for (const [economy, maturities] of Object.entries(data)) {
        for (const [maturity, bondData] of Object.entries(maturities)) {
          if (this.validator.isValidBond(bondData)) {
            this.eventQueue.push({
              type: 'bond',
              data: bondData,
              economy,
              timestamp: new Date(),
            });
          }
        }
      }
    }
  }

  /**
   * Process all events in queue
   */
  async processEventQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    try {
      this.logger.info('Processing event queue', { eventCount: this.eventQueue.length });

      const events = [...this.eventQueue];
      this.eventQueue = []; // Clear queue

      // Process indicators
      const indicatorEvents = events.filter((e) => e.type === 'indicator');
      const bondEvents = events.filter((e) => e.type === 'bond');

      if (indicatorEvents.length > 0) {
        await this.processIndicatorEvents(indicatorEvents);
      }

      if (bondEvents.length > 0) {
        await this.processBondEvents(bondEvents);
      }

      // Create economy summaries
      await this.createEconomySummaries(indicatorEvents);

      this.logger.info('Event queue processing completed');
    } catch (error) {
      this.logger.error('Error processing event queue', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process indicator events
   */
  async processIndicatorEvents(events) {
    try {
      const toNotch = [];

      for (const event of events) {
        const indicator = event.data;

        // Run all analyses
        const impactAnalysis = this.impactAnalyzer.analyzeImpact(indicator);
        const policyAnalysis = this.policyAnalyzer.analyzeRatePolicyImpact(indicator, indicator.economy);
        const bondAnalysis = this.bondAnalyzer.analyzeBondImpact(indicator, {});

        const analysis = {
          indicator,
          ...impactAnalysis,
          ...policyAnalysis,
          ...bondAnalysis,
        };

        toNotch.push({
          indicator: this.formatter.formatIndicator(indicator),
          analysis,
        });
      }

      // Push to Notion in batches
      if (toNotch.length > 0) {
        await this.notionPusher.pushBatch(toNotch, 'indicator');
        this.logger.info('Indicator events pushed to Notion', { count: toNotch.length });
      }
    } catch (error) {
      this.logger.error('Error processing indicator events', { error: error.message });
    }
  }

  /**
   * Process bond events
   */
  async processBondEvents(events) {
    try {
      const toNotch = [];

      for (const event of events) {
        const bond = event.data;

        // Create mock indicator for analysis
        const mockIndicator = {
          name: `${event.economy} ${bond.maturity} Bond Yield`,
          value: bond.yield,
          forecast_value: bond.previous_yield,
          surprise_index: 0,
        };

        const bondAnalysis = this.bondAnalyzer.analyzeBondImpact(mockIndicator, {});

        toNotch.push({
          bond: this.formatter.formatBond(bond),
          analysis: bondAnalysis,
        });
      }

      // Push to Notion in batches
      if (toNotch.length > 0) {
        await this.notionPusher.pushBatch(toNotch, 'bond');
        this.logger.info('Bond events pushed to Notion', { count: toNotch.length });
      }
    } catch (error) {
      this.logger.error('Error processing bond events', { error: error.message });
    }
  }

  /**
   * Create economy summary pages
   */
  async createEconomySummaries(indicatorEvents) {
    try {
      // Group indicators by economy
      const byEconomy = {};
      indicatorEvents.forEach((event) => {
        const economy = event.data.economy;
        if (!byEconomy[economy]) byEconomy[economy] = [];
        byEconomy[economy].push(event.data);
      });

      // Create summary for each economy
      for (const [economy, indicators] of Object.entries(byEconomy)) {
        const healthScore = this.healthAnalyzer.calculateHealthScore(indicators);
        const strengths = this.healthAnalyzer.identifyStrengths(indicators);
        const weaknesses = this.healthAnalyzer.identifyWeaknesses(indicators);
        const events = this.healthAnalyzer.generateKeyEventsToWatch(economy, indicators);

        const healthAnalysis = {
          healthScore,
          strengths,
          weaknesses,
        };

        await this.notionPusher.createEconomySummaryPage(economy, healthAnalysis, events);
        this.logger.info('Economy summary created', { economy, healthScore });
      }
    } catch (error) {
      this.logger.error('Error creating economy summaries', { error: error.message });
    }
  }

  /**
   * Start the event listener (polling)
   */
  async start(pollInterval = 300000) {
    try {
      this.logger.info('Starting EventManager listener', { pollInterval });

      // Initial poll
      await this.pollForData();

      // Set up recurring polls
      this.pollInterval = setInterval(() => {
        this.pollForData().catch((error) => {
          this.logger.error('Error in poll interval', { error: error.message });
        });
      }, pollInterval);

      this.logger.info('EventManager listener started successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to start EventManager', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the event listener
   */
  async stop() {
    try {
      this.logger.info('Stopping EventManager listener');

      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      this.logger.info('EventManager listener stopped');
      return true;
    } catch (error) {
      this.logger.error('Error stopping EventManager', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: !!this.pollInterval,
      isProcessing: this.isProcessing,
      queueSize: this.eventQueue.length,
      timestamp: new Date().toISOString(),
    };
  }
}

export default EventManager;