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
      const approvalRepository = require('../approval/approval.repository');
      const Approval = require('../approval/approval.model');

      const expenses = await expenseRepository.findByUserId(userId);
      
      const processedExpenses = await Promise.all(expenses.map(async (exp) => {
         if (['SUBMITTED', 'PENDING', 'PROCESSING'].includes(exp.status)) {
            // Check for parallel progress on current step
            const pendingCurrentSteps = await Approval.find({ expense_id: exp._id, step: exp.current_step, status: 'PENDING' }).lean();
            if (pendingCurrentSteps.length > 0) {
               // Expose exactly who is holding up the expense for employee visibility
               exp.pending_roles = [...new Set(pendingCurrentSteps.map(t => t.role))];

               if (pendingCurrentSteps[0].group_id) {
                 const groupId = pendingCurrentSteps[0].group_id;
                 const groupTasks = await approvalRepository.findByGroupId(groupId);
                 const total_count = groupTasks.length;
                 const approved_count = groupTasks.filter(t => t.status === 'APPROVED').length;
                 exp.parallel_progress = {
                    approved_count,
                    total_count,
                    percentage_complete: total_count > 0 ? (approved_count / total_count) : 0,
                    ruleType: pendingCurrentSteps[0].rule?.type || 'ALL'
                 };
               }
            }
         }
         return exp;
      }));
      
      return res.status(200).json({ success: true, data: processedExpenses });
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, currency, category, date, description } = req.body;
      const userId = req.user.user_id;

      const expense = await expenseService.updateExpense(
        id,
        { amount, currency, category, date, description },
        userId
      );

      return res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
