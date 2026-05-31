import axios from 'axios';
import { Logger } from '../utils/logger.js';
import CONFIG from '../config/config.js';

export class DataFetcher {
  constructor() {
    this.logger = new Logger('DataFetcher');
    this.baseURL = CONFIG.FXMACRODATA_BASE_URL;
    this.apiKey = CONFIG.FXMACRODATA_API_KEY;
    this.timeout = CONFIG.FXMACRODATA_TIMEOUT;
    this.maxRetries = CONFIG.FXMACRODATA_RETRY_ATTEMPTS;
    this.retryDelay = CONFIG.FXMACRODATA_RETRY_DELAY;
  }

  /**
   * Fetch economic indicators with retry logic
   */
  async fetchEconomicIndicators(params = {}) {
    try {
      this.logger.info('Fetching economic indicators', params);

      const response = await this.makeRequest('/economic-indicators', params);
      return response;
    } catch (error) {
      this.logger.error('Failed to fetch economic indicators', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch bond yields for all tracked maturities and economies
   */
  async fetchBondYields(economies, maturities) {
    try {
      this.logger.info('Fetching bond yields', { economies, maturities });

      const yields = {};
      const requests = [];

      for (const economy of economies) {
        for (const maturity of maturities) {
          requests.push(
            this.makeRequest('/bond-yields', {
              economy,
              maturity,
            }).then((data) => {
              if (!yields[economy]) yields[economy] = {};
              yields[economy][maturity] = data;
            })
          );
        }
      }

      await Promise.all(requests);
      return yields;
    } catch (error) {
      this.logger.error('Failed to fetch bond yields', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch currency pairs data
   */
  async fetchCurrencies(pairs) {
    try {
      this.logger.info('Fetching currency data', { pairs: pairs.length });

      const currencies = {};
      const requests = [];

      for (const pair of pairs) {
        requests.push(
          this.makeRequest('/currencies', { pair }).then((data) => {
            currencies[pair] = data;
          })
        );
      }

      await Promise.all(requests);
      return currencies;
    } catch (error) {
      this.logger.error('Failed to fetch currency data', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch commodity prices
   */
  async fetchCommodities(commodities) {
    try {
      this.logger.info('Fetching commodity data', { commodities: commodities.length });

      const prices = {};
      const requests = [];

      for (const commodity of commodities) {
        requests.push(
          this.makeRequest('/commodities', { commodity }).then((data) => {
            prices[commodity] = data;
          })
        );
      }

      await Promise.all(requests);
      return prices;
    } catch (error) {
      this.logger.error('Failed to fetch commodity data', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch upcoming economic calendar events
   */
  async fetchEconomicCalendar(countries, daysAhead = 7) {
    try {
      this.logger.info('Fetching economic calendar', { countries, daysAhead });

      const response = await this.makeRequest('/economic-calendar', {
        countries,
        days_ahead: daysAhead,
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to fetch economic calendar', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch central bank guidance/forecasts
   */
  async fetchCentralBankGuidance(central_banks) {
    try {
      this.logger.info('Fetching central bank guidance', { central_banks: central_banks.length });

      const guidance = {};
      const requests = [];

      for (const cb of central_banks) {
        requests.push(
          this.makeRequest('/central-bank-guidance', { central_bank: cb }).then((data) => {
            guidance[cb] = data;
          })
        );
      }

      await Promise.all(requests);
      return guidance;
    } catch (error) {
      this.logger.error('Failed to fetch central bank guidance', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch consensus forecasts from major banks
   */
  async fetchBankForecasts(indicator, economy) {
    try {
      this.logger.info('Fetching bank forecasts', { indicator, economy });

      const response = await this.makeRequest('/bank-forecasts', {
        indicator,
        economy,
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to fetch bank forecasts', { error: error.message });
      throw error;
    }
  }

  /**
   * Generic request maker with retry logic
   */
  async makeRequest(endpoint, params = {}, retryCount = 0) {
    try {
      const config = {
        method: 'GET',
        url: `${this.baseURL}${endpoint}`,
        params: {
          ...params,
          api_key: this.apiKey,
        },
        timeout: this.timeout,
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`Retry attempt ${retryCount + 1}/${this.maxRetries}`, {
          endpoint,
          error: error.message,
        });

        await this.sleep(this.retryDelay);
        return this.makeRequest(endpoint, params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Helper: sleep function for delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check API connectivity
   */
  async testConnection() {
    try {
      await this.makeRequest('/health');
      this.logger.info('FXMacroData API connection successful');
      return true;
    } catch (error) {
      this.logger.error('FXMacroData API connection failed', { error: error.message });
      return false;
    }
  }
}

export default DataFetcher;