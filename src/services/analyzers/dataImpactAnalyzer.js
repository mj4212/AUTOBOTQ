import { Logger } from '../utils/logger.js';

export class DataImpactAnalyzer {
  constructor() {
    this.logger = new Logger('DataImpactAnalyzer');
  }

  /**
   * Analyze what the data means for the economy
   */
  analyzeImpact(indicator) {
    const analysis = {
      indicator_name: indicator.name,
      current_value: indicator.value,
      forecast_value: indicator.forecast_value,
      previous_value: indicator.previous_value,
      beat_forecast: this.beatForecast(indicator),
      beat_previous: this.beatPrevious(indicator),
      economic_meaning: this.getEconomicMeaning(indicator),
      investor_focus: this.getInvestorFocus(indicator),
      sentiment: this.determineSentiment(indicator),
    };

    return analysis;
  }

  /**
   * Check if current beat forecast
   */
  beatForecast(indicator) {
    const current = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);

    if (isNaN(current) || isNaN(forecast)) return null;

    // Determine if beat is positive based on indicator type
    const isPositiveTooBeat = this.isPositiveToBeat(indicator.name);

    if (isPositiveTooBeat) {
      return current > forecast ? 'Beat (Positive)' : current < forecast ? 'Miss (Negative)' : 'In-line';
    } else {
      return current < forecast ? 'Beat (Positive)' : current > forecast ? 'Miss (Negative)' : 'In-line';
    }
  }

  /**
   * Check if current beat previous
   */
  beatPrevious(indicator) {
    const current = parseFloat(indicator.value);
    const previous = parseFloat(indicator.previous_value);

    if (isNaN(current) || isNaN(previous)) return null;

    const isPositiveTooBeat = this.isPositiveToBeat(indicator.name);

    if (isPositiveTooBeat) {
      return current > previous ? 'Improvement' : current < previous ? 'Deterioration' : 'Unchanged';
    } else {
      return current < previous ? 'Improvement' : current > previous ? 'Deterioration' : 'Unchanged';
    }
  }

  /**
   * Determine if higher value is positive for indicator
   */
  isPositiveToBeat(indicatorName) {
    const name = indicatorName.toLowerCase();

    // Lower is better
    if (name.includes('unemployment') || name.includes('inflation')) {
      return false;
    }

    // Higher is better
    if (
      name.includes('gdp') ||
      name.includes('growth') ||
      name.includes('sales') ||
      name.includes('earnings') ||
      name.includes('wage') ||
      name.includes('employment') ||
      name.includes('confidence') ||
      name.includes('pmi') ||
      name.includes('nfp')
    ) {
      return true;
    }

    return true; // Default to higher is better
  }

  /**
   * Get economic interpretation of the data
   */
  getEconomicMeaning(indicator) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);

    let meaning = '';

    // GDP Analysis
    if (name.includes('gdp')) {
      if (value > 2.5) {
        meaning = 'Strong economic expansion, suggesting robust demand and productivity.';
      } else if (value > 1.5) {
        meaning = 'Moderate economic growth, consistent with stable expansion.';
      } else if (value > 0) {
        meaning = 'Weak growth, indicating economic slowdown ahead.';
      } else {
        meaning = 'Economic contraction - recession likely or underway.';
      }
    }
    // Inflation Analysis
    else if (name.includes('inflation')) {
      if (value < 2) {
        meaning = 'Below-target inflation, providing room for policy stimulus.';
      } else if (value < 3) {
        meaning = 'Target inflation, consistent with central bank goals.';
      } else if (value < 5) {
        meaning = 'Elevated inflation, pressuring central bank to tighten policy.';
      } else {
        meaning = 'High inflation, requiring aggressive policy tightening.';
      }
    }
    // Employment Analysis
    else if (name.includes('unemployment')) {
      if (value < 3.5) {
        meaning = 'Very tight labor market, supporting wage growth and consumer spending.';
      } else if (value < 4.5) {
        meaning = 'Healthy labor market supporting economic growth.';
      } else if (value < 5.5) {
        meaning = 'Moderate labor market softening, may limit wage growth.';
      } else {
        meaning = 'Significant labor market deterioration, recession risk increasing.';
      }
    }
    // PMI Analysis
    else if (name.includes('pmi')) {
      if (value > 55) {
        meaning = 'Strong manufacturing/services expansion, economic momentum is solid.';
      } else if (value > 50) {
        meaning = 'Moderate expansion continuing, but growth may be slowing.';
      } else if (value > 45) {
        meaning = 'Contraction beginning, economic slowdown likely ahead.';
      } else {
        meaning = 'Significant contraction, recession risk is rising.';
      }
    }
    // Retail Sales Analysis
    else if (name.includes('retail sales')) {
      if (value > 1) {
        meaning = 'Strong consumer spending, supporting economic growth.';
      } else if (value > 0) {
        meaning = 'Modest consumer spending growth.';
      } else {
        meaning = 'Consumer spending weakening, growth concerns emerging.';
      }
    }
    // Employment Change (NFP)
    else if (name.includes('nfp') || name.includes('payroll')) {
      if (value > 200) {
        meaning = 'Strong job creation, labor market remains robust.';
      } else if (value > 100) {
        meaning = 'Moderate job creation, labor market remains stable.';
      } else if (value > 0) {
        meaning = 'Weak job creation, labor market softening.';
      } else {
        meaning = 'Job losses, significant labor market deterioration.';
      }
    }
    // Confidence Analysis
    else if (name.includes('confidence')) {
      if (value > 100) {
        meaning = 'High confidence, suggesting positive economic outlook.';
      } else if (value > 80) {
        meaning = 'Decent confidence levels supporting spending.';
      } else if (value > 60) {
        meaning = 'Moderate confidence, caution emerging.';
      } else {
        meaning = 'Low confidence, economic pessimism rising.';
      }
    }

    return meaning || 'Data point relevant to economic health and growth trajectory.';
  }

  /**
   * What investors should focus on
   */
  getInvestorFocus(indicator) {
    const name = indicator.name.toLowerCase();
    const current = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);

    let focus = '';

    if (name.includes('inflation')) {
      focus = 'Watch for central bank reaction. Higher inflation = stronger bias for rate hikes. Lower inflation = potential for cuts.';
    } else if (name.includes('unemployment') || name.includes('nfp')) {
      focus = 'Track Fed dual mandate. Weak employment may trigger rate cuts. Strong employment supports higher rates.';
    } else if (name.includes('gdp')) {
      focus = 'Key to economic outlook. Strong growth supports higher equity valuations. Weak growth raises recession concerns.';
    } else if (name.includes('pmi')) {
      focus = 'Leading indicator of economic activity. Below 50 suggests contraction. >55 shows strong momentum.';
    } else if (name.includes('confidence')) {
      focus = 'Predicts future spending and economic activity. Rising confidence supports equity markets. Falling confidence = caution.';
    } else if (name.includes('earnings') || name.includes('wage')) {
      focus = 'Wage growth pressures inflation. Watch for spiral risk. Strong earnings support equity valuations.';
    } else if (name.includes('retail')) {
      focus = 'Consumer spending is 70% of economy. Weak retail sales signal recession risk. Strong data supports growth.';
    }

    return focus || 'Monitor for policy implications and economic cycle positioning.';
  }

  /**
   * Determine overall sentiment
   */
  determineSentiment(indicator) {
    const beatForecast = this.beatForecast(indicator);
    const beatPrevious = this.beatPrevious(indicator);

    let positiveScore = 0;

    if (beatForecast?.includes('Beat')) positiveScore += 2;
    if (beatForecast?.includes('Miss')) positiveScore -= 2;
    if (beatPrevious?.includes('Improvement')) positiveScore += 1;
    if (beatPrevious?.includes('Deterioration')) positiveScore -= 1;

    if (positiveScore > 1) return '🟢 Bullish';
    if (positiveScore < -1) return '🔴 Bearish';
    return '🟡 Neutral';
  }
}

export default DataImpactAnalyzer;