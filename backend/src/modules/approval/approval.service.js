const approvalRepository = require('./approval.repository');
const expenseRepository = require('../expense/expense.repository');
const auditService = require('../audit/audit.service');
const userRepository = require('../user/user.repository');
const workflowService = require('../workflow/workflow.service');

class ApprovalService {
  async getPendingTasksForUser(user) {
    const tasks = [];
    
    // 1. Direct assignments (approver_id match mapping MANAGER roles)
    const directAssignments = await approvalRepository.findPendingByApprover(user.user_id, user.role);
    tasks.push(...directAssignments);

    // 2. Queue assignments (matching user role when exact ID unbound like FINANCE or SENIOR Queues)
    // We only want role matches if they have the specific role naturally, e.g FINANCE picks up FINANCE
    const roleBasedQueues = await approvalRepository.findPendingByRole([user.role]);
    tasks.push(...roleBasedQueues);

    // 3. Deduplicate visually
    const uniqueTasks = tasks.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);

    // 4. Augment with group progress if part of a PARALLEL step
    for (const task of uniqueTasks) {
       if (task.group_id) {
          const groupTasks = await approvalRepository.findByGroupId(task.group_id);
          const total_count = groupTasks.length;
          const approved_count = groupTasks.filter(t => t.status === 'APPROVED').length;
          task.group_progress = {
             approved_count,
             total_count,
             percentage_complete: total_count > 0 ? (approved_count / total_count) : 0
          };
       }
    }

    return uniqueTasks;
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
      await approvalRepository.cancelAllPendingForExpense(expense._id);
      await expenseRepository.findByIdAndUpdate(expense._id, { 
        status: 'APPROVED', 
        approval_status: 'APPROVED',
        $push: { approval_history: appendHistory } 
      });
      await auditService.log('Expense', expense._id, 'EXPENSE_APPROVED', actionedBy, null, { cfoOverride: true });
      return;
    }

    // Parallel Group Evaluation
    if (approval.group_id) {
       const groupTasks = await approvalRepository.findByGroupId(approval.group_id);
       const totalCount = groupTasks.length;
       const approvedCount = groupTasks.filter(t => t.status === 'APPROVED').length;
       
       let requirementMet = false;
       const ruleType = approval.rule?.type || 'ALL';
       
       if (ruleType === 'ALL') {
          requirementMet = approvedCount === totalCount;
       } else if (ruleType === 'PERCENTAGE') {
          const percentage = approval.rule?.percentage || 1;
          requirementMet = (approvedCount / totalCount) >= percentage;
       } else if (ruleType === 'ANY') {
          requirementMet = approvedCount >= (approval.required_approvals || 1);
       }

       if (!requirementMet) {
          // Requirement not yet met; just log history and wait for others
          await expenseRepository.findByIdAndUpdate(expense._id, { 
            $push: { approval_history: appendHistory } 
          });
          await auditService.log('Expense', expense._id, 'PARALLEL_APPROVAL_PROGRESS', actionedBy, null, { approvedCount, totalCount });
          return;
       } else {
          // Group requirement met! Cancel any remaining pending tasks in the same group 
          const pendingInGroup = await approvalRepository.findPendingByGroupId(approval.group_id);
          for (const pt of pendingInGroup) {
             await approvalRepository.updateStatus(pt._id, 'SENT_BACK', 'Group requirement already met', new Date());
          }
          await auditService.log('Expense', expense._id, 'APPROVAL_GROUP_COMPLETED', actionedBy, null, { ruleType });
       }
    }

    // Assess next step
    const nextStepNum = expense.current_step + 1;
    const nextStepApprovalExists = await approvalRepository.findPendingStepForExpense(expense._id, nextStepNum);

    if (nextStepApprovalExists && !approval.is_final_step) {
      // Progress to Next Sequence
      await expenseRepository.findByIdAndUpdate(expense._id, { 
        current_step: nextStepNum,
        $push: { approval_history: appendHistory } 
      });
    } else {
      // Final Step reached cleanly!
      await approvalRepository.cancelAllPendingForExpense(expense._id);
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
    await approvalRepository.cancelAllPendingForExpense(expense._id);
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
    await approvalRepository.cancelAllPendingForExpense(expense._id);
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
