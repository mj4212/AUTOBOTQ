import { Client } from '@notionhq/client';
import { Logger } from '../utils/logger.js';
import CONFIG from '../config/config.js';

export class NotionPusher {
  constructor() {
    this.logger = new Logger('NotionPusher');
    this.notion = new Client({ auth: CONFIG.NOTION_API_KEY });
    this.databaseId = CONFIG.NOTION_DATABASE_ID;
    this.batchSize = CONFIG.BATCH_SIZE;
    this.batchTimeout = CONFIG.BATCH_TIMEOUT;
  }

  /**
   * Push economic indicator data to Notion
   */
  async pushIndicatorData(indicator, analysis) {
    try {
      this.logger.info('Pushing indicator data to Notion', { indicator: indicator.name });

      const properties = this.formatIndicatorProperties(indicator, analysis);
      const page = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      this.logger.info('Indicator data pushed successfully', { pageId: page.id });
      return page;
    } catch (error) {
      this.logger.error('Failed to push indicator data', { error: error.message });
      throw error;
    }
  }

  /**
   * Push bond yield data to Notion
   */
  async pushBondData(bond, analysis) {
    try {
      this.logger.info('Pushing bond data to Notion', { economy: bond.economy, maturity: bond.maturity });

      const properties = this.formatBondProperties(bond, analysis);
      const page = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      this.logger.info('Bond data pushed successfully', { pageId: page.id });
      return page;
    } catch (error) {
      this.logger.error('Failed to push bond data', { error: error.message });
      throw error;
    }
  }

  /**
   * Push batch of data to Notion
   */
  async pushBatch(dataArray, type = 'indicator') {
    try {
      this.logger.info('Pushing batch to Notion', { count: dataArray.length, type });

      const results = [];
      for (let i = 0; i < dataArray.length; i += this.batchSize) {
        const batch = dataArray.slice(i, i + this.batchSize);
        const batchResults = await Promise.all(
          batch.map((data) =>
            type === 'indicator'
              ? this.pushIndicatorData(data.indicator, data.analysis)
              : this.pushBondData(data.bond, data.analysis)
          )
        );
        results.push(...batchResults);

        // Wait between batches
        if (i + this.batchSize < dataArray.length) {
          await this.sleep(this.batchTimeout);
        }
      }

      this.logger.info('Batch push completed', { totalCount: results.length });
      return results;
    } catch (error) {
      this.logger.error('Failed to push batch', { error: error.message });
      throw error;
    }
  }

  /**
   * Format indicator properties for Notion
   */
  formatIndicatorProperties(indicator, analysis) {
    return {
      Title: {
        title: [
          {
            text: {
              content: `${indicator.name} - ${indicator.economy}`,
            },
          },
        ],
      },
      Economy: {
        select: {
          name: indicator.economy,
        },
      },
      Type: {
        select: {
          name: 'Indicator',
        },
      },
      'Current Value': {
        number: parseFloat(indicator.value) || 0,
      },
      'Previous Value': {
        number: parseFloat(indicator.previous_value) || 0,
      },
      'Forecast Value': {
        number: parseFloat(indicator.forecast_value) || 0,
      },
      Sentiment: {
        select: {
          name: this.extractSentiment(analysis.sentiment),
        },
      },
      'Economic Meaning': {
        rich_text: [
          {
            text: {
              content: analysis.economic_meaning || '',
            },
          },
        ],
      },
      'Investor Focus': {
        rich_text: [
          {
            text: {
              content: analysis.investor_focus || '',
            },
          },
        ],
      },
      'Policy Implication': {
        rich_text: [
          {
            text: {
              content: analysis.policy_implication || '',
            },
          },
        ],
      },
      'Rate Direction': {
        rich_text: [
          {
            text: {
              content: analysis.rate_direction || '',
            },
          },
        ],
      },
      'Bond Impact': {
        rich_text: [
          {
            text: {
              content: analysis.yield_direction || '',
            },
          },
        ],
      },
      'Released At': {
        date: {
          start: new Date(indicator.release_date_time).toISOString(),
        },
      },
      Importance: {
        select: {
          name: this.formatImportance(indicator.importance_level),
        },
      },
    };
  }

  /**
   * Format bond properties for Notion
   */
  formatBondProperties(bond, analysis) {
    return {
      Title: {
        title: [
          {
            text: {
              content: `${bond.economy} ${bond.maturity} Yield - ${bond.yield}%`,
            },
          },
        ],
      },
      Economy: {
        select: {
          name: bond.economy,
        },
      },
      Type: {
        select: {
          name: 'Bond',
        },
      },
      Maturity: {
        select: {
          name: bond.maturity,
        },
      },
      'Current Yield': {
        number: parseFloat(bond.yield) || 0,
      },
      'Previous Yield': {
        number: parseFloat(bond.previous_yield) || 0,
      },
      'Yield Change (bps)': {
        number: Math.round((bond.yield - (bond.previous_yield || 0)) * 100),
      },
      'Yield Direction': {
        rich_text: [
          {
            text: {
              content: analysis.yield_direction || '',
            },
          },
        ],
      },
      'Curve Impact': {
        rich_text: [
          {
            text: {
              content: analysis.curve_impact?.steepening_or_flattening || '',
            },
          },
        ],
      },
      'Duration Impact': {
        rich_text: [
          {
            text: {
              content: analysis.duration_impact?.portfolio_implication || '',
            },
          },
        ],
      },
      'Investor Implications': {
        rich_text: [
          {
            text: {
              content: analysis.investor_implications?.for_bond_holders || '',
            },
          },
        ],
      },
      'Updated At': {
        date: {
          start: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Create a summary page for an economy
   */
  async createEconomySummaryPage(economy, healthAnalysis, events) {
    try {
      this.logger.info('Creating economy summary page', { economy });

      const properties = {
        Title: {
          title: [
            {
              text: {
                content: `${economy} Economy Summary`,
              },
            },
          ],
        },
        Type: {
          select: {
            name: 'Summary',
          },
        },
        Economy: {
          select: {
            name: economy,
          },
        },
        'Health Score': {
          number: healthAnalysis.healthScore || 0,
        },
        Strengths: {
          rich_text: [
            {
              text: {
                content: healthAnalysis.strengths.join('; ') || 'N/A',
              },
            },
          ],
        },
        Weaknesses: {
          rich_text: [
            {
              text: {
                content: healthAnalysis.weaknesses.join('; ') || 'N/A',
              },
            },
          ],
        },
        'Key Events': {
          rich_text: [
            {
              text: {
                content: events.join('; ') || 'N/A',
              },
            },
          ],
        },
        'Last Updated': {
          date: {
            start: new Date().toISOString(),
          },
        },
      };

      const page = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      this.logger.info('Economy summary page created', { pageId: page.id });
      return page;
    } catch (error) {
      this.logger.error('Failed to create economy summary', { error: error.message });
      throw error;
    }
  }

  /**
   * Update existing page with new data
   */
  async updatePage(pageId, properties) {
    try {
      this.logger.info('Updating Notion page', { pageId });

      const page = await this.notion.pages.update({
        page_id: pageId,
        properties,
      });

      return page;
    } catch (error) {
      this.logger.error('Failed to update page', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract sentiment from analysis string
   */
  extractSentiment(sentimentStr) {
    if (!sentimentStr) return 'Neutral';
    if (sentimentStr.includes('Bullish')) return 'Bullish';
    if (sentimentStr.includes('Bearish')) return 'Bearish';
    return 'Neutral';
  }

  /**
   * Format importance level
   */
  formatImportance(level) {
    const levels = { 1: 'Low', 2: 'Medium', 3: 'High' };
    return levels[level] || 'Medium';
  }

  /**
   * Helper: sleep function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test Notion connectivity
   */
  async testConnection() {
    try {
      await this.notion.databases.retrieve(this.databaseId);
      this.logger.info('Notion database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Notion database connection failed', { error: error.message });
      return false;
    }
  }
}

export default NotionPusher;