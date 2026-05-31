import { Logger } from '../utils/logger.js';

export class EconomyHealthAnalyzer {
  constructor() {
    this.logger = new Logger('EconomyHealthAnalyzer');
  }

  /**
   * Calculate overall economic health score for an economy
   * Score: 0-100 (0=weak, 100=strong)
   */
  calculateHealthScore(indicators) {
    if (!indicators || indicators.length === 0) return null;

    const scores = {};
    const weights = this.getIndicatorWeights();

    indicators.forEach((indicator) => {
      const category = this.categorizeIndicator(indicator.name);
      if (!category) return;

      const score = this.scoreIndicator(indicator, category);
      if (score !== null) {
        if (!scores[category]) scores[category] = [];
        scores[category].push(score);
      }
    });

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, categoryScores] of Object.entries(scores)) {
      const categoryAvg = categoryScores.reduce((a, b) => a + b) / categoryScores.length;
      const weight = weights[category] || 1;
      totalScore += categoryAvg * weight;
      totalWeight += weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Get indicator weights for health score calculation
   */
  getIndicatorWeights() {
    return {
      growth: 0.25,
      inflation: 0.25,
      employment: 0.25,
      sentiment: 0.15,
      earnings: 0.1,
    };
  }

  /**
   * Categorize indicator by type
   */
  categorizeIndicator(name) {
    const categories = {
      growth: ['GDP', 'Retail Sales', 'Manufacturing', 'PMI'],
      inflation: ['Inflation', 'CPI', 'PPI'],
      employment: ['Unemployment', 'Employment', 'NFP', 'Payroll'],
      sentiment: ['Confidence', 'PMI'],
      earnings: ['Earnings', 'Wage'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => name.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return null;
  }

  /**
   * Score an individual indicator (0-100)
   */
  scoreIndicator(indicator, category) {
    const current = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);

    if (isNaN(current)) return null;

    let score = 50; // Neutral baseline

    if (!isNaN(forecast)) {
      const diff = current - forecast;
      const percentDiff = (diff / Math.abs(forecast)) * 100;
      score += Math.min(percentDiff * 2, 50); // Beat forecast = higher score
    }

    // Category-specific scoring
    if (category === 'growth') {
      if (current > 2) score += 10; // Growth is good
      if (current < 0) score -= 20; // Contraction is bad
    } else if (category === 'inflation') {
      if (current < 3) score += 10; // Moderate inflation is good
      if (current > 5) score -= 15; // High inflation is bad
    } else if (category === 'employment') {
      if (current < 5) score += 10; // Low unemployment is good
      if (current > 6) score -= 10;
    } else if (category === 'sentiment') {
      if (current > 50) score += 10; // Above 50 is positive
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify key strengths for an economy
   */
  identifyStrengths(indicators) {
    const strengths = [];

    const byCategory = {};
    indicators.forEach((ind) => {
      const cat = this.categorizeIndicator(ind.name);
      if (cat) {
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(ind);
      }
    });

    // Growth strength
    const growthInd = byCategory.growth?.[0];
    if (growthInd && parseFloat(growthInd.value) > 2) {
      strengths.push('Solid GDP/growth momentum');
    }

    // Employment strength
    const empInd = byCategory.employment?.[0];
    if (empInd && parseFloat(empInd.value) < 4) {
      strengths.push('Strong labor market (low unemployment)');
    }

    // Wage growth
    const earningsInd = byCategory.earnings?.[0];
    if (earningsInd && parseFloat(earningsInd.value) > 3) {
      strengths.push('Solid wage growth');
    }

    // Consumer confidence
    const sentimentInd = byCategory.sentiment?.[0];
    if (sentimentInd && parseFloat(sentimentInd.value) > 60) {
      strengths.push('Positive consumer/business sentiment');
    }

    return strengths;
  }

  /**
   * Identify key weaknesses for an economy
   */
  identifyWeaknesses(indicators) {
    const weaknesses = [];

    const byCategory = {};
    indicators.forEach((ind) => {
      const cat = this.categorizeIndicator(ind.name);
      if (cat) {
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(ind);
      }
    });

    // Weak growth
    const growthInd = byCategory.growth?.[0];
    if (growthInd && parseFloat(growthInd.value) < 0.5) {
      weaknesses.push('Weak economic growth');
    }

    // High unemployment
    const empInd = byCategory.employment?.[0];
    if (empInd && parseFloat(empInd.value) > 6) {
      weaknesses.push('Elevated unemployment');
    }

    // High inflation
    const inflInd = byCategory.inflation?.[0];
    if (inflInd && parseFloat(inflInd.value) > 5) {
      weaknesses.push('Elevated inflation pressures');
    }

    // Weak sentiment
    const sentimentInd = byCategory.sentiment?.[0];
    if (sentimentInd && parseFloat(sentimentInd.value) < 40) {
      weaknesses.push('Negative consumer/business sentiment');
    }

    // Wage pressure
    const earningsInd = byCategory.earnings?.[0];
    if (earningsInd && parseFloat(earningsInd.value) > 5) {
      weaknesses.push('Elevated wage growth (inflationary)');
    }

    return weaknesses;
  }

  /**
   * Generate key events to watch
   */
  generateKeyEventsToWatch(economy, upcomingIndicators) {
    const events = [];

    const indicatorNames = upcomingIndicators
      .map((ind) => ind.name.toLowerCase())
      .join(' ');

    if (
      indicatorNames.includes('fed') ||
      indicatorNames.includes('fomc') ||
      indicatorNames.includes('interest rate')
    ) {
      events.push('🔴 CRITICAL: Central bank meeting/rate decision');
    }

    if (indicatorNames.includes('nfp') || indicatorNames.includes('employment')) {
      events.push('⚠️ HIGH: Employment report release');
    }

    if (indicatorNames.includes('inflation') || indicatorNames.includes('cpi')) {
      events.push('⚠️ HIGH: Inflation data release');
    }

    if (indicatorNames.includes('gdp')) {
      events.push('⚠️ HIGH: GDP report release');
    }

    if (indicatorNames.includes('pmi')) {
      events.push('📊 MEDIUM: PMI manufacturing/services data');
    }

    if (indicatorNames.includes('earnings')) {
      events.push('💼 MEDIUM: Earnings/wage data release');
    }

    if (indicatorNames.includes('retail')) {
      events.push('📈 MEDIUM: Retail sales report');
    }

    if (indicatorNames.includes('confidence')) {
      events.push('😊 LOW: Consumer/business confidence');
    }

    return events;
  }
}

export default EconomyHealthAnalyzer;