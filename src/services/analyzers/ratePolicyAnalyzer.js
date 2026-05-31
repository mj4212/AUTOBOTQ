import { Logger } from '../utils/logger.js';

export class RatePolicyAnalyzer {
  constructor() {
    this.logger = new Logger('RatePolicyAnalyzer');
  }

  /**
   * Analyze impact on central bank rate policy
   */
  analyzeRatePolicyImpact(indicator, economy) {
    const analysis = {
      economy,
      indicator: indicator.name,
      current_value: indicator.value,
      policy_implication: this.getPolicyImplication(indicator),
      rate_direction: this.predictRateDirection(indicator, economy),
      rate_path: this.predictRatePath(indicator),
      confidence: this.getConfidenceLevel(indicator),
      timeline: this.estimateTimeline(indicator),
      bank_interpretation: this.getBankInterpretation(indicator, economy),
    };

    return analysis;
  }

  /**
   * Get direct policy implication
   */
  getPolicyImplication(indicator) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);

    // Inflation
    if (name.includes('inflation') || name.includes('cpi')) {
      if (value > 4) {
        return '🔴 HAWKISH: Inflation elevated. Central bank likely to maintain restrictive policy or hike further.';
      } else if (value > 2.5) {
        return '🟠 MODERATELY HAWKISH: Inflation above target. Central bank may pause hikes or hold rates steady.';
      } else if (value > 2) {
        return '🟡 NEUTRAL: Inflation near target. Policy likely to stabilize.';
      } else {
        return '🟢 DOVISH: Inflation below target. Central bank may look to ease policy or cut rates.';
      }
    }

    // Employment/Unemployment
    if (name.includes('unemployment')) {
      if (value < 3.5) {
        return '🔴 HAWKISH: Tight labor market. Fed likely to maintain higher rates to cool demand.';
      } else if (value < 4.5) {
        return '🟡 NEUTRAL: Balanced labor market. Fed can be patient with rate policy.';
      } else {
        return '🟢 DOVISH: Soft labor market. Fed may look to cut rates to support employment.';
      }
    }

    // NFP (Non-Farm Payroll)
    if (name.includes('nfp') || name.includes('payroll') || name.includes('employment')) {
      if (value > 200) {
        return '🔴 HAWKISH: Strong job creation. Supports Fed keeping rates higher for longer.';
      } else if (value > 0) {
        return '🟡 NEUTRAL: Modest job growth. Fed data-dependent.';
      } else {
        return '🟢 DOVISH: Job losses or weak creation. May trigger Fed rate cut expectations.';
      }
    }

    // GDP
    if (name.includes('gdp')) {
      if (value > 2.5) {
        return '🔴 HAWKISH: Strong growth. Central bank less likely to cut rates soon.';
      } else if (value > 1) {
        return '🟡 NEUTRAL: Moderate growth. Policy can remain steady.';
      } else {
        return '🟢 DOVISH: Weak growth. Central bank may need to provide stimulus/cut rates.';
      }
    }

    // PMI (Leading indicator)
    if (name.includes('pmi')) {
      if (value > 55) {
        return '🔴 HAWKISH: Strong expansion. Central bank may need to prevent overheating.';
      } else if (value > 50) {
        return '🟡 NEUTRAL: Moderate expansion continuing.';
      } else if (value > 45) {
        return '🟠 MODERATELY DOVISH: Contraction beginning. Rate cuts may be needed soon.';
      } else {
        return '🟢 DOVISH: Significant contraction. Urgent rate cuts likely needed.';
      }
    }

    // Retail Sales
    if (name.includes('retail sales')) {
      if (value > 1) {
        return '🟠 MODERATELY HAWKISH: Strong consumer spending. Fed may hold rates steady or hike.';
      } else if (value < -0.5) {
        return '🟢 DOVISH: Weak consumer spending. Rate cuts may be needed.';
      }
    }

    return '🟡 NEUTRAL: Continue monitoring broader economic data.';
  }

  /**
   * Predict rate direction
   */
  predictRateDirection(indicator, economy) {
    const implication = this.getPolicyImplication(indicator);

    if (implication.includes('HAWKISH')) {
      return '📈 Rate increases likely or rates held higher for longer';
    } else if (implication.includes('DOVISH')) {
      return '📉 Rate cuts may be warranted in coming months';
    }
    return '➡️ Rates likely to remain steady; data-dependent';
  }

  /**
   * Predict rate path (multiple periods)
   */
  predictRatePath(indicator) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);

    let path = '';

    if (name.includes('inflation')) {
      if (value > 4) {
        path = '→ Rates stay high for longer → Potential stabilization if inflation falls';
      } else if (value > 2.5) {
        path = '→ Likely pause or hold position → Possible cuts in late 2024/2025';
      } else {
        path = '→ Rate cuts becoming more likely → Watch for timing signals';
      }
    } else if (name.includes('unemployment')) {
      if (value < 3.5) {
        path = '→ Keep rates elevated → Monitor for softening before cutting';
      } else if (value < 5) {
        path = '→ Balanced path → Flexibility in rate decisions';
      } else {
        path = '→ Rate cuts likely needed → Timeline depends on other data';
      }
    }

    return path || '→ Wait for next data print → Policy adjusts to emerging trends';
  }

  /**
   * How confident is this signal
   */
  getConfidenceLevel(indicator) {
    const beatForecast = this.beatForecast(indicator);
    const surprise = Math.abs(parseFloat(indicator.surprise_index) || 0);

    if (surprise > 75) {
      return '🔴 HIGH CONFIDENCE: Major surprise, strong signal for policy response';
    } else if (surprise > 50) {
      return '🟠 MODERATE CONFIDENCE: Clear signal, but await next print for confirmation';
    } else if (surprise > 25) {
      return '🟡 LOW-MODERATE CONFIDENCE: Signal present, but not definitive';
    }
    return '🟢 LOW CONFIDENCE: Largely in line with expectations';
  }

  /**
   * Estimate timeline for policy change
   */
  estimateTimeline(indicator) {
    const implication = this.getPolicyImplication(indicator);

    if (implication.includes('HAWKISH')) {
      return '⏱️ Immediate impact: Next FOMC meeting on agenda; reinforces hold/hike bias';
    } else if (implication.includes('DOVISH')) {
      return '⏱️ Medium-term: Rate cuts likely within 1-3 meetings if trend continues';
    }
    return '⏱️ Dependent on next data: Policy response tied to broader trend confirmation';
  }

  /**
   * Get bank interpretation and guidance
   */
  getBankInterpretation(indicator, economy) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);

    let interpretation = {
      forecast_vs_actual: this.compareForecastVsActual(value, forecast),
      key_takeaway: this.getKeyTakeaway(indicator),
      central_bank_focus: this.getCentralBankFocus(indicator, economy),
      consensus_view: this.getConsensusView(indicator),
    };

    return interpretation;
  }

  /**
   * Compare forecast vs actual
   */
  compareForecastVsActual(actual, forecast) {
    if (isNaN(actual) || isNaN(forecast)) return 'Unable to compare';

    const diff = actual - forecast;
    const pctDiff = (diff / Math.abs(forecast)) * 100;

    if (pctDiff > 5) {
      return `Much stronger than expected (+${pctDiff.toFixed(1)}%)`;
    } else if (pctDiff > 0) {
      return `Slightly better than expected (+${pctDiff.toFixed(1)}%)`;
    } else if (pctDiff > -5) {
      return `Slightly weaker than expected (${pctDiff.toFixed(1)}%)`;
    }
    return `Much weaker than expected (${pctDiff.toFixed(1)}%)`;
  }

  /**
   * Get key takeaway for banks
   */
  getKeyTakeaway(indicator) {
    return `The ${indicator.name} data point is crucial for assessing central bank next moves. Banks monitoring for ${this.getPolicyImplication(indicator)}`;
  }

  /**
   * What central bank is focusing on
   */
  getCentralBankFocus(indicator, economy) {
    const name = indicator.name.toLowerCase();
    if (name.includes('inflation')) return 'Price stability mandate';
    if (name.includes('employment') || name.includes('unemployment')) return 'Full employment mandate';
    if (name.includes('gdp')) return 'Economic growth trajectory';
    if (name.includes('pmi')) return 'Real-time economic momentum';
    return 'Overall economic health';
  }

  /**
   * Consensus among major banks
   */
  getConsensusView(indicator) {
    const implication = this.getPolicyImplication(indicator);

    if (implication.includes('HAWKISH')) {
      return 'Most major banks see this as supporting higher rates for longer. Consensus: No rate cuts in near term.';
    } else if (implication.includes('DOVISH')) {
      return 'Banks increasingly pricing in rate cuts. Consensus: 2-3 cuts likely if trend continues.';
    }
    return 'Banks data-dependent. Consensus: Wait for next print to make conviction calls.';
  }

  /**
   * Helper: check if beat forecast
   */
  beatForecast(indicator) {
    const current = parseFloat(indicator.value);
    const forecast = parseFloat(indicator.forecast_value);
    return current > forecast ? 'Beat' : current < forecast ? 'Miss' : 'In-line';
  }
}

export default RatePolicyAnalyzer;