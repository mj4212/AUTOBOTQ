import { Logger } from '../utils/logger.js';

export class BondImpactAnalyzer {
  constructor() {
    this.logger = new Logger('BondImpactAnalyzer');
  }

  /**
   * Analyze impact on government bond market (yields)
   */
  analyzeBondImpact(indicator, bondYields) {
    const analysis = {
      indicator: indicator.name,
      current_value: indicator.value,
      yield_direction: this.predictYieldDirection(indicator),
      rate_repricing: this.analyzeRateRepricing(indicator),
      bond_market_reaction: this.predictBondMarketReaction(indicator),
      duration_impact: this.analyzeDurationImpact(indicator),
      curve_impact: this.analyzeCurveImpact(indicator, bondYields),
      real_yield_impact: this.analyzeRealYieldImpact(indicator),
      investor_implications: this.getInvestorImplications(indicator),
    };

    return analysis;
  }

  /**
   * Predict direction of yields
   */
  predictYieldDirection(indicator) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);

    // Inflation data - major driver of yields
    if (name.includes('inflation') || name.includes('cpi')) {
      if (value > 4) {
        return '📈 YIELDS UP: Higher inflation means higher real yields needed. 10Y likely to rise 10-25bps.';
      } else if (value > 2.5) {
        return '➡️ YIELDS STABLE: Moderate inflation keeps yields anchored near target.';
      } else {
        return '📉 YIELDS DOWN: Below-target inflation supports lower yields. 10Y may fall 10-20bps.';
      }
    }

    // GDP/Growth - affects real rates
    if (name.includes('gdp')) {
      if (value > 2.5) {
        return '📈 YIELDS UP: Strong growth supports higher real rates and yields.';
      } else if (value < 1) {
        return '📉 YIELDS DOWN: Weak growth reduces real rate requirements, yields lower.';
      }
    }

    // Employment data
    if (name.includes('unemployment') || name.includes('nfp')) {
      if (name.includes('nfp') && value > 200) {
        return '📈 YIELDS UP: Strong employment suggests higher rate path, yields rise.';
      } else if (name.includes('unemployment') && value < 3.5) {
        return '📈 YIELDS UP: Tight labor market implies longer hikes or higher plateau.';
      } else if ((name.includes('nfp') && value < 0) || (name.includes('unemployment') && value > 5)) {
        return '📉 YIELDS DOWN: Weak employment favors lower rates, yields decline.';
      }
    }

    return '➡️ YIELDS NEUTRAL: Mixed signals, await next data.';
  }

  /**
   * Analyze rate repricing in market
   */
  analyzeRateRepricing(indicator) {
    const implication = this.predictYieldDirection(indicator);

    if (implication.includes('UP')) {
      return {
        direction: 'Upward repricing of rates',
        likely_move: '10-30 basis points',
        duration: 'Immediately upon data release',
        magnitude: 'Significant move likely',
      };
    } else if (implication.includes('DOWN')) {
      return {
        direction: 'Downward repricing of rates',
        likely_move: '-10 to -30 basis points',
        duration: 'Immediately upon data release',
        magnitude: 'Significant move likely',
      };
    }

    return {
      direction: 'Minimal repricing',
      likely_move: '±5 basis points',
      duration: 'Consolidated trading',
      magnitude: 'Minor/contained',
    };
  }

  /**
   * Predict bond market reaction
   */
  predictBondMarketReaction(indicator) {
    const name = indicator.name.toLowerCase();
    const surprise = parseFloat(indicator.surprise_index) || 0;

    let reaction = {};

    if (surprise > 75) {
      reaction.bond_price = '🔴 Significant decline expected (yields rise sharply)' || '📈 Significant rise expected (yields fall)';
      reaction.vol = 'High volatility expected';
      reaction.spreads = 'Potential spread widening in credit';
      reaction.timing = 'Immediate reaction within minutes';
    } else if (surprise > 25) {
      reaction.bond_price = 'Moderate decline expected' || 'Moderate rise expected';
      reaction.vol = 'Elevated volatility';
      reaction.spreads = 'Possible minor spread moves';
      reaction.timing = 'Quick reaction within first hour';
    } else {
      reaction.bond_price = 'Minimal price impact';
      reaction.vol = 'Low volatility';
      reaction.spreads = 'Likely stable';
      reaction.timing = 'No significant trading flow expected';
    }

    return reaction;
  }

  /**
   * Analyze impact on bond duration
   */
  analyzeDurationImpact(indicator) {
    const name = indicator.name.toLowerCase();

    let impact = {
      duration_concept: 'How much bond prices move for 1% yield change',
      short_duration_exposure: 'Impact on 2Y bonds',
      long_duration_exposure: 'Impact on 10Y bonds',
      portfolio_implication: 'How fixed income portfolios may react',
    };

    if (name.includes('inflation') || name.includes('cpi')) {
      impact.short_duration_exposure = '2Y yields likely to rise 15-25bps → 2Y bond prices decline';
      impact.long_duration_exposure = '10Y yields likely to rise 20-35bps → Longer duration bonds hit harder';
      impact.portfolio_implication =
        'Negative for long-duration portfolios. Short duration strategies better positioned.';
    } else if (name.includes('gdp') || name.includes('growth')) {
      impact.short_duration_exposure = 'Minimal impact on 2Y (Fed policy not immediately affected)';
      impact.long_duration_exposure = '10Y may rise 5-15bps (affects long-term growth expectations)';
      impact.portfolio_implication = 'Modest negative for long-duration. 5-7Y sweet spot may outperform.';
    }

    return impact;
  }

  /**
   * Analyze impact on yield curve
   */
  analyzeCurveImpact(indicator, bondYields) {
    const name = indicator.name.toLowerCase();
    const value = parseFloat(indicator.value);

    let analysis = {
      curve_section: 'Which part of curve affected',
      steepening_or_flattening: 'Curve shape change',
      rationale: 'Why the curve moves this way',
    };

    if (name.includes('inflation') || name.includes('cpi')) {
      if (value > 4) {
        analysis.curve_section = 'Entire curve shifts up (parallel shift)';
        analysis.steepening_or_flattening =
          'Likely modest flattening: long-end concerns about Fed overdoing rate hikes';
        analysis.rationale = 'High inflation forces entire rate structure higher, but long rates may lag';
      } else if (value > 2.5) {
        analysis.curve_section = 'Short-end outpaces long-end';
        analysis.steepening_or_flattening = 'Slight steepening as 2Y-10Y spread widens';
        analysis.rationale = 'Moderate inflation keeps Fed on hold, long-end anchored by growth concerns';
      } else {
        analysis.curve_section = 'Long-end leads, short-end lags';
        analysis.steepening_or_flattening = 'Steep curve: short rates higher than long';
        analysis.rationale = 'Low inflation supports lower long rates, Fed still in restrictive mode';
      }
    } else if (name.includes('unemployment') || name.includes('nfp')) {
      if ((name.includes('nfp') && value > 200) || (name.includes('unemployment') && value < 4)) {
        analysis.steepening_or_flattening = 'Flattening: market reprices hikes or pause';
        analysis.rationale = 'Strong labor market may keep rates higher for longer';
      } else {
        analysis.steepening_or_flattening = 'Steepening: market cuts rate expectations';
        analysis.rationale = 'Weak labor market makes cuts more likely';
      }
    }

    return analysis;
  }

  /**
   * Analyze real yield impact
   */
  analyzeRealYieldImpact(indicator) {
    const name = indicator.name.toLowerCase();

    let analysis = {
      real_yield_concept: 'Nominal yield minus inflation = real return',
      impact_on_real_yields: '',
      implications: '',
    };

    if (name.includes('inflation')) {
      analysis.impact_on_real_yields = 'Higher inflation → Real yields may fall (nominal yields rise less than inflation)';
      analysis.implications = 'Bad for bond investors (lower real returns). Good for inflation hedges (TIPS, commodities)';
    } else if (name.includes('gdp') || name.includes('growth')) {
      analysis.impact_on_real_yields = 'Strong growth → Real yields may rise (higher equilibrium rates)';
      analysis.implications = 'Potential headwind for bonds. Equity valuations may expand though';
    } else {
      analysis.impact_on_real_yields = 'Monitor for real yield trends';
      analysis.implications = 'Real yields drive long-term allocation decisions';
    }

    return analysis;
  }

  /**
   * Get investor implications for bonds
   */
  getInvestorImplications(indicator) {
    const direction = this.predictYieldDirection(indicator);

    let implications = {
      for_bond_holders: '',
      for_traders: '',
      for_portfolio_managers: '',
      hedge_strategies: '',
    };

    if (direction.includes('UP')) {
      implications.for_bond_holders = '❌ Price decline expected. Consider raising duration or moving down curve.';
      implications.for_traders = '⚙️ Short bonds, sell 10Y, buy 2Y (if curve flattens).';
      implications.for_portfolio_managers = '⚠️ Reduce duration exposure, increase cash allocation.';
      implications.hedge_strategies = 'Buy put options on TLT. Short 10Y futures.';
    } else if (direction.includes('DOWN')) {
      implications.for_bond_holders = '✅ Price appreciation likely. Strong buy signal for long-term investors.';
      implications.for_traders = '⚙️ Long bonds, buy 10Y, sell 2Y (if curve steepens).';
      implications.for_portfolio_managers = '✨ Increase duration, add long bonds to portfolio.';
      implications.hedge_strategies = 'Buy call options on TLT. Long 10Y futures.';
    } else {
      implications.for_bond_holders = '➡️ Stay the course. No urgent action needed.';
      implications.for_traders = '⚙️ Range-bound trading. Look for technical levels.';
      implications.for_portfolio_managers = '📊 Maintain current positioning. Monitor for next catalyst.';
      implications.hedge_strategies = 'Consider straddle positions. Low conviction.';
    }

    return implications;
  }
}

export default BondImpactAnalyzer;