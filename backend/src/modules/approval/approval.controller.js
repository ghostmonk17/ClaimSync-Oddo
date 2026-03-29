const approvalService = require('./approval.service');

class ApprovalController {
  async getPendingApprovals(req, res, next) {
    try {
      // Must be authorized natively in router
      const user = req.user; 

      const pendingTasks = await approvalService.getPendingTasksForUser(user);

      return res.status(200).json({
        success: true,
        data: pendingTasks
      });
    } catch (err) {
      next(err);
    }
  }

  async approveExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const actionedBy = req.user.user_id;

      const result = await approvalService.executeApprovalAction(id, 'APPROVE', comment, actionedBy);

      if (result.already_processed) {
         return res.status(200).json(result);
      }

      return res.status(200).json({
        success: true,
        message: 'Task successfully APPROVED.'
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const actionedBy = req.user.user_id;

      const result = await approvalService.executeApprovalAction(id, 'REJECT', comment, actionedBy);

      if (result.already_processed) {
         return res.status(200).json(result);
      }

      return res.status(200).json({
        success: true,
        message: 'Task successfully REJECTED.'
      });
    } catch (err) {
      next(err);
    }
  }

  async sendBackExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const actionedBy = req.user.user_id;

      const result = await approvalService.executeApprovalAction(id, 'SEND_BACK', comment, actionedBy);

      if (result.already_processed) {
         return res.status(200).json(result);
      }

      return res.status(200).json({
        success: true,
        message: 'Task successfully SENT BACK. Expense unlocked to DRAFT.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ApprovalController();
