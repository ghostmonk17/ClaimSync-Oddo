class RiskService {
  computeRiskScore(expense, flags = [], violations = []) {
    let score = 0;
    
    // 1. Flag weights
    const flags_factor = (flags.length * 0.2);
    score += flags_factor;

    // 2. Violation weights (Violations are severe)
    const violations_factor = (violations.length * 0.4);
    score += violations_factor;

    // 3. Amount factor (e.g. scale base normalized to $10,000 max = 0.3 weight at $10k+)
    // Assume base_currency is USD equivalent roughly. Normalize to max $10k.
    const amountVal = expense.converted_amount || expense.amount; // Use converted_amount if available
    let amountFactorComputed = amountVal / 10000;
    if (amountFactorComputed > 1) amountFactorComputed = 1;
    
    const amount_factor = (amountFactorComputed * 0.3);
    score += amount_factor;

    // 4. Frequency/Split factor extracted via flags organically
    const hasFrequency = flags.some(f => f.type === 'FREQUENCY_VIOLATION');
    const hasSplitRisk = flags.some(f => f.type === 'SPLIT_EXPENSE_RISK');
    
    let frequency_factor = 0;
    if (hasFrequency) frequency_factor += 0.2;
    if (hasSplitRisk) frequency_factor += 0.2;
    score += frequency_factor;

    // Normalize max to 1.0 organically
    if (score > 1.0) score = 1.0;
    
    return {
      risk_score: Number(score.toFixed(2)),
      risk_breakdown: {
        amount_factor: Number(amount_factor.toFixed(2)),
        frequency_factor: Number(frequency_factor.toFixed(2)),
        flags_factor: Number(flags_factor.toFixed(2)),
        violations_factor: Number(violations_factor.toFixed(2))
      }
    };
  }
}

module.exports = new RiskService();
