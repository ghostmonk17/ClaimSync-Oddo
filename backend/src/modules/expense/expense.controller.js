const expenseService = require('./expense.service');

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      const { amount, currency, category, date, description } = req.body;
      const userId = req.user.user_id;
      const companyId = req.user.company_id;
      
      const expense = await expenseService.createExpense(
        { amount, currency, category, date, description },
        userId, 
        companyId
      );

      return res.status(201).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
  }

  async declareMissingReceipt(req, res, next) {
    try {
      const { expenseId } = req.params;
      const { declaration_reason } = req.body;
      const userId = req.user.user_id;

      const updatedExpense = await expenseService.declareMissingReceipt(
        expenseId, 
        declaration_reason, 
        userId 
      );

      return res.status(200).json({
        success: true,
        data: updatedExpense
      });
    } catch (error) {
      next(error);
    }
  }

  async submitExpense(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.user_id : req.body.user_id;

      const expense = await expenseService.submitExpense(id, userId);

      return res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
       next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const userId = req.user.user_id;
      const expenseRepository = require('./expense.repository');
      const expenses = await expenseRepository.findByUserId(userId);
      return res.status(200).json({ success: true, data: expenses || [] });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
