const Approval = require('./approval.model');

class ApprovalRepository {
  async create(data, session = null) {
    const approval = new Approval(data);
    return approval.save({ session });
  }

  async findByExpenseId(expenseId) {
    return Approval.find({ expense_id: expenseId }).sort({ step: 1 }).lean();
  }

  async findPendingByApprover(approverId, role) {
    // If assigned explicitly by ID OR falls under a role matching queue (if decoupled) 
    // Here we strictly follow the ID matching initially mapped in workflow
    return Approval.find({ approver_id: approverId, status: 'PENDING' }).populate('expense_id').lean();
  }

  async findPendingByRole(roles) {
      return Approval.find({ role: { $in: roles }, status: 'PENDING', approver_id: null }).populate('expense_id').lean();
  }

  async findById(id) {
    return Approval.findById(id).lean();
  }

  async findPendingStepForExpense(expenseId, step) {
    return Approval.findOne({ expense_id: expenseId, step, status: 'PENDING' }).lean();
  }

  async updateStatus(id, status, comment, actionedAt, session = null) {
    return Approval.findByIdAndUpdate(
      id,
      { status, comment, actioned_at: actionedAt },
      { new: true, session }
    ).lean();
  }
}

module.exports = new ApprovalRepository();
