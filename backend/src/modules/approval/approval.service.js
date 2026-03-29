const approvalRepository = require('./approval.repository');
const expenseRepository = require('../expense/expense.repository');
const auditService = require('../audit/audit.service');
const userRepository = require('../user/user.repository');
const workflowService = require('../workflow/workflow.service');

class ApprovalService {
  async getPendingTasksForUser(user) {
    const tasks = [];
    
    // 1. Direct assignments (approver_id match mapping MANAGER roles)
    const directAssignments = await approvalRepository.findPendingByApprover(user._id, user.role);
    tasks.push(...directAssignments);

    // 2. Queue assignments (matching user role when exact ID unbound like FINANCE or SENIOR Queues)
    // We only want role matches if they have the specific role naturally, e.g FINANCE picks up FINANCE
    const roleBasedQueues = await approvalRepository.findPendingByRole([user.role]);
    tasks.push(...roleBasedQueues);

    // 3. Deduplicate visually
    return tasks.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
  }

  async executeApprovalAction(approvalId, action, comment, actionedBy) {
    const approval = await approvalRepository.findById(approvalId);
    if (!approval) throw new Error('Approval task not found');
    
    // Explicit concurrency protection explicitly stated structurally
    if (approval.status !== 'PENDING') {
       return { success: true, message: `Already processed. Task status is currently ${approval.status}`, already_processed: true };
    }
    
    // Extract Expense mapping universally
    const expense = await expenseRepository.findById(approval.expense_id);
    if (!expense) throw new Error('Associated Expense not found natively');

    const currentUser = await userRepository.findById(actionedBy);
    
    // Auth Check natively
    const isDirectlyAssigned = approval.approver_id && approval.approver_id.toString() === actionedBy.toString();
    const isRoleEligible = !approval.approver_id && currentUser.role === approval.role;
    const isCfoOverride = currentUser.role === 'CFO';

    if (!isDirectlyAssigned && !isRoleEligible && !isCfoOverride) {
      throw new Error('Unauthorized: You are not eligible to action this approval task');
    }

    // Historical Mapping wrapper to centralize history appended log
    const appendHistory = {
        role: currentUser.role,
        status: action === 'SEND_BACK' ? 'SENT_BACK' : action,
        comment: comment || '',
        timestamp: new Date()
    };

    // Execute logic natively
    if (action === 'APPROVE') {
      await this.handleApprove(approval, expense, comment, actionedBy, isCfoOverride, appendHistory);
    } else if (action === 'REJECT') {
      await this.handleReject(approval, expense, comment, actionedBy, appendHistory);
    } else if (action === 'SEND_BACK') {
      await this.handleSendBack(approval, expense, comment, actionedBy, appendHistory);
    } else {
      throw new Error('Invalid action code');
    }

    return true;
  }

  async handleApprove(approval, expense, comment, actionedBy, isCfoOverride, appendHistory) {
    // Audit current Approval step
    await approvalRepository.updateStatus(approval._id, 'APPROVED', comment, new Date());
    await auditService.log('Approval', approval._id, 'APPROVAL_APPROVED', actionedBy, null, { comment, cfoOverride: isCfoOverride });

    if (isCfoOverride) {
      // Immediate force approval globally natively bypassing further chains
      await expenseRepository.findByIdAndUpdate(expense._id, { 
        status: 'APPROVED', 
        approval_status: 'APPROVED',
        $push: { approval_history: appendHistory } 
      });
      await auditService.log('Expense', expense._id, 'EXPENSE_APPROVED', actionedBy, null, { cfoOverride: true });
      return;
    }

    // Assess next step safely checking step progression bounds exactly
    const nextStepNum = expense.current_step + 1;
    const nextStepApprovalExists = await approvalRepository.findPendingStepForExpense(expense._id, nextStepNum);

    if (nextStepApprovalExists) {
      // Progressively slide to Next Sequence natively updating Expense pointer
      await expenseRepository.findByIdAndUpdate(expense._id, { 
        current_step: nextStepNum,
        $push: { approval_history: appendHistory } 
      });
      // Notify next approver structurally mapping if needed here natively
    } else {
      // Absolutely Final Step globally reached cleanly!
      await expenseRepository.findByIdAndUpdate(expense._id, { 
        status: 'APPROVED', 
        approval_status: 'APPROVED',
        $push: { approval_history: appendHistory } 
      });
      await auditService.log('Expense', expense._id, 'EXPENSE_APPROVED', actionedBy, null, null);
    }
  }

  async handleReject(approval, expense, comment, actionedBy, appendHistory) {
    await approvalRepository.updateStatus(approval._id, 'REJECTED', comment, new Date());
    await expenseRepository.findByIdAndUpdate(expense._id, { 
        status: 'REJECTED', 
        approval_status: 'REJECTED',
        $push: { approval_history: appendHistory } 
    });
    
    await auditService.log('Approval', approval._id, 'APPROVAL_REJECTED', actionedBy, null, { comment });
    await auditService.log('Expense', expense._id, 'EXPENSE_REJECTED', actionedBy, null, { comment });
  }

  async handleSendBack(approval, expense, comment, actionedBy, appendHistory) {
    await approvalRepository.updateStatus(approval._id, 'SENT_BACK', comment, new Date());
    // Send back fully unlocks the DRAFT status inherently
    await expenseRepository.findByIdAndUpdate(expense._id, { 
        status: 'SENT_BACK', 
        approval_status: 'SENT_BACK',
        $push: { approval_history: appendHistory } 
    });
    
    await auditService.log('Approval', approval._id, 'APPROVAL_SENT_BACK', actionedBy, null, { comment });
    await auditService.log('Expense', expense._id, 'EXPENSE_SENT_BACK', actionedBy, null, { comment });
  }
}

module.exports = new ApprovalService();
