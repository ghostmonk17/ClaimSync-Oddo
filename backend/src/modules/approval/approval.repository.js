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
    const approvals = await Approval.find({ approver_id: approverId, status: 'PENDING' })
      .populate({ 
        path: 'expense_id', 
        populate: [
          { path: 'user_id', select: 'name email' },
          { path: 'receipt_ids' }
        ] 
      })
      .lean();

    // FILTER Sequential Visibility: only show if approval.step matches expense.current_step
    return approvals.filter(a => a.expense_id && a.step === a.expense_id.current_step);
  }

  async findPendingByRole(roles) {
      const approvals = await Approval.find({ role: { $in: roles }, status: 'PENDING', approver_id: null })
        .populate({ 
          path: 'expense_id', 
          populate: [
            { path: 'user_id', select: 'name email' },
            { path: 'receipt_ids' }
          ] 
        })
        .lean();

      // FILTER Sequential Visibility: only show if approval.step matches expense.current_step
      return approvals.filter(a => a.expense_id && a.step === a.expense_id.current_step);
  }

  async findById(id) {
    return Approval.findById(id).lean();
  }

  async findPendingStepForExpense(expenseId, step) {
    return Approval.findOne({ expense_id: expenseId, step, status: 'PENDING' }).lean();
  }

  async findByGroupId(groupId) {
    return Approval.find({ group_id: groupId }).lean();
  }

  async findPendingByGroupId(groupId) {
    return Approval.find({ group_id: groupId, status: 'PENDING' }).lean();
  }

  async updateStatus(id, status, comment, actionedAt, session = null) {
    return Approval.findByIdAndUpdate(
      id,
      { status, comment, actioned_at: actionedAt },
      { new: true, session }
    ).lean();
  }

  async cancelAllPendingForExpense(expenseId, session = null) {
    return Approval.updateMany(
      { expense_id: expenseId, status: 'PENDING' },
      { status: 'SENT_BACK' }, // or CANCELLED if you add that status
      { session }
    );
  }
}

module.exports = new ApprovalRepository();
