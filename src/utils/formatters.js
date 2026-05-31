import { Logger } from './logger.js';

export class DataFormatter {
  constructor() {
    this.logger = new Logger('DataFormatter');
  }

  /**
   * Format indicator data for Notion
   */
  formatIndicator(indicator) {
    return {
      name: this.sanitizeString(indicator.name),
      economy: this.sanitizeString(indicator.economy),
      value: this.formatNumber(indicator.value),
      previous_value: this.formatNumber(indicator.previous_value),
      forecast_value: this.formatNumber(indicator.forecast_value),
      period: this.sanitizeString(indicator.period),
      period_type: this.sanitizeString(indicator.period_type),
      release_date_time: this.formatDate(indicator.release_date_time),
      importance_level: this.formatImportance(indicator.importance_level),
      surprise_index: this.formatNumber(indicator.surprise_index),
      units: this.sanitizeString(indicator.units),
      type: this.sanitizeString(indicator.type),
      raw_data: indicator,
    };
  }

  /**
   * Format bond data for Notion
   */
  formatBond(bond) {
    return {
      economy: this.sanitizeString(bond.economy),
      maturity: this.sanitizeString(bond.maturity),
      yield: this.formatNumber(bond.yield),
      previous_yield: this.formatNumber(bond.previous_yield),
      change: this.formatNumber(bond.yield - (bond.previous_yield || 0)),
      timestamp: this.formatDate(new Date().toISOString()),
      raw_data: bond,
    };
  }

  /**
   * Format currency data for Notion
   */
  formatCurrency(currency) {
    const pair = this.sanitizeString(currency.pair);
    const baseChange = currency.price - (currency.previous_close || currency.price);
    const changePercent = currency.previous_close 
      ? (baseChange / currency.previous_close) * 100 
      : 0;

    return {
      pair,
      price: this.formatNumber(currency.price),
      previous_close: this.formatNumber(currency.previous_close),
      change: this.formatNumber(baseChange),
      change_percent: this.formatNumber(changePercent),
      timestamp: this.formatDate(new Date().toISOString()),
      raw_data: currency,
    };
  }

  /**
   * Format commodity data for Notion
   */
  formatCommodity(commodity) {
    const priceChange = commodity.price - (commodity.previous_price || commodity.price);
    const changePercent = commodity.previous_price 
      ? (priceChange / commodity.previous_price) * 100 
      : 0;

    return {
      name: this.sanitizeString(commodity.name),
      type: this.sanitizeString(commodity.type),
      price: this.formatNumber(commodity.price),
      previous_price: this.formatNumber(commodity.previous_price),
      change: this.formatNumber(priceChange),
      change_percent: this.formatNumber(changePercent),
      unit: this.sanitizeString(commodity.unit),
      timestamp: this.formatDate(new Date().toISOString()),
      raw_data: commodity,
    };
  }

  /**
   * Format number with appropriate decimals
   */
  formatNumber(value) {
    if (value === null || value === undefined) return 0;
    
    const num = parseFloat(value);
    if (isNaN(num)) return 0;

    // Return with 4 decimal places for most data
    return Math.round(num * 10000) / 10000;
  }

  /**
   * Format date to ISO string
   */
  formatDate(dateValue) {
    if (!dateValue) return new Date().toISOString();

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      this.logger.warn('Failed to format date', { value: dateValue });
      return new Date().toISOString();
    }
  }

  /**
   * Sanitize string to prevent injection
   */
  sanitizeString(str) {
    if (!str) return '';
    return String(str)
      .trim()
      .substring(0, 500) // Limit length
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }

  /**
   * Format importance level to readable string
   */
  formatImportance(level) {
    const levels = {
      1: 'Low',
      2: 'Medium',
      3: 'High',
    };
    return levels[level] || 'Medium';
  }

  /**
   * Create summary text from multiple indicators
   */
  createSummary(indicators) {
    if (!indicators || indicators.length === 0) {
      return 'No data available';
    }

    const byType = {};
    indicators.forEach((indicator) => {
      const type = indicator.type || 'Unknown';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(indicator);
    });

    const summaryParts = [];
    for (const [type, data] of Object.entries(byType)) {
      summaryParts.push(`${type}: ${data.length} records`);
    }

    return summaryParts.join(', ');
  }

  /**
   * Format data for batch push to Notion
   */
  formatForBatch(dataArray) {
    return dataArray
      .filter((item) => item !== null && item !== undefined)
      .map((item) => this.sanitizeForNotion(item));
  }

  /**
   * Sanitize data for Notion API requirements
   */
  sanitizeForNotion(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = this.formatNumber(value);
      } else if (typeof value === 'object') {
        if (value instanceof Date) {
          sanitized[key] = this.formatDate(value.toISOString());
        } else {
          // Deep sanitize nested objects
          sanitized[key] = JSON.stringify(value).substring(0, 2000);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export default DataFormatter;
