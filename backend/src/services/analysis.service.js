const expenseRepository = require('../modules/expense/expense.repository');

class AnalysisService {
  async analyzeExpense(expense, userId) {
    const flags = [];

    // 1. Role mismatch detection (Mock/Simplistic: e.g. interns expensing luxury tech)
    // Normally requires querying the User for their specific role restrictions. 
    // Handled in workflow steps generally, but we can flag high-value general categories.
    if (expense.category === 'LUXURY' && expense.amount > 500) {
      flags.push({ type: 'ROLE_MISMATCH', field: 'category', message: 'High-value restricted category' });
    }

    // 2. Frequency Detection (e.g. 3+ meals in a single day)
    // To do this, query recent expenses from the same user in the exact same day
    const startOfDay = new Date(expense.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expense.date);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDayExpenses = await expenseRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay);
    if (sameDayExpenses && sameDayExpenses.length >= 3) {
      flags.push({ 
        type: 'FREQUENCY_VIOLATION', 
        field: 'date', 
        message: 'Multiple expenses on the exact same date detected' 
      });
    }

    // 3. Split expense detection
    // e.g., amounts exactly at the manager threshold (e.g., $9.99/$49.99 across two receipts to avoid $50 limit)
    if (expense.amount > 45 && expense.amount < 50) {
        flags.push({ type: 'SPLIT_EXPENSE_RISK', field: 'amount', message: 'Amount sits right below the $50 threshold limit' });
    }

    return flags;
  }
}

module.exports = new AnalysisService();
