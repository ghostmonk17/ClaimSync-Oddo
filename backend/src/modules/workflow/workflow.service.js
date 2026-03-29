const userRepository = require('../user/user.repository');
const mongoose = require('mongoose');

class WorkflowService {
  async buildWorkflowSteps(expense, employee) {
    const steps = [];
    const WorkflowConfig = require('./workflowConfig.model');
    const config = await WorkflowConfig.findOne({ company_id: employee.company_id, is_active: true }).lean();

    const getSlaDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d;
    };

    if (config && config.steps && config.steps.length > 0) {
      // Configuration-driven logic
      let currentStepNum = 1;
      
      for (const configStep of config.steps) {
        const { type, roles, rule, required_approvals } = configStep;
        const isFinal = currentStepNum === config.steps.length;

        if (type === 'SEQUENTIAL') {
          let approverId = null;
          let roleStr = roles[0]; // Take first role specified
          
          if (roles.includes('MANAGER') && employee.manager_id) {
            approverId = employee.manager_id;
            roleStr = 'MANAGER';
          } else {
            // Pick first available user in any of the allowed roles
            const users = await userRepository.findAllActiveByRoleAndCompany(roles, employee.company_id);
            if (users && users.length > 0) {
               approverId = users[0]._id;
               roleStr = users[0].role;
            }
          }

          if (approverId) {
            steps.push({
              step: currentStepNum++,
              role: roleStr,
              approver_id: approverId,
              due_date: getSlaDate(),
              is_final_step: isFinal
            });
          }
        } else if (type === 'PARALLEL') {
          const groupId = new mongoose.Types.ObjectId();
          let assignedUsers = [];

          if (roles.includes('MANAGER') && employee.manager_id) {
            assignedUsers.push({ _id: employee.manager_id, role: 'MANAGER' });
          }
          
          const otherRoles = roles.filter(r => r !== 'MANAGER');
          if (otherRoles.length > 0) {
            const staticRoleUsers = await userRepository.findAllActiveByRoleAndCompany(otherRoles, employee.company_id);
            assignedUsers.push(...staticRoleUsers);
          }

          if (assignedUsers.length > 0) {
            assignedUsers.forEach(u => {
              steps.push({
                step: currentStepNum,
                role: u.role,
                approver_id: u._id,
                group_id: groupId,
                due_date: getSlaDate(),
                rule: rule,
                required_approvals: required_approvals,
                is_final_step: isFinal
              });
            });
            currentStepNum++;
          }
        }
      }
      return steps;
    }

    // --- FALLBACK TO EXISTING DYNAMIC LOGIC ---
    const amountVal = expense.converted_amount || expense.amount; // Use consistent base currency
    const hasViolations = expense.violations && expense.violations.length > 0;
    const isHighRisk = expense.risk_score > 0.7;

    let currentStep = 1;

    // 1. MANAGER Step
    if (employee.manager_id && employee._id.toString() !== employee.manager_id.toString()) {
      steps.push({
        step: currentStep++,
        role: 'MANAGER',
        approver_id: employee.manager_id,
        due_date: getSlaDate()
      });
    } else {
      // Fallback natively to ANY generic manager to ensure it does not bypass Level 1
      const genericManager = await userRepository.findActiveByRoleAndCompany('MANAGER', employee.company_id);
      if (genericManager) {
        steps.push({
          step: currentStep++,
          role: 'MANAGER',
          approver_id: genericManager._id,
          due_date: getSlaDate()
        });
      }
    }

    // 2. FINANCE Step
    const financeUser = await userRepository.findActiveByRoleAndCompany('FINANCE', employee.company_id);
    if ((amountVal > 10000 || hasViolations || steps.length === 0) && financeUser) {
      steps.push({
        step: currentStep++,
        role: 'FINANCE',
        approver_id: financeUser._id,
        due_date: getSlaDate()
      });
    }

    // 3. SENIOR Step / CFO Step
    let seniorUser = await userRepository.findActiveByRoleAndCompany('CFO', employee.company_id);
    if (!seniorUser) seniorUser = await userRepository.findActiveByRoleAndCompany('SENIOR', employee.company_id);
    if ((amountVal > 50000 || isHighRisk || steps.length === 0) && seniorUser) {
      steps.push({
        step: currentStep++,
        role: seniorUser.role,
        approver_id: seniorUser._id,
        due_date: getSlaDate()
      });
    }

    // Edge-case Fallback: If still absolutely completely barren, map to Admin structurally
    if (steps.length === 0) {
      const adminUser = await userRepository.findActiveByRoleAndCompany('ADMIN', employee.company_id);
      steps.push({
        step: currentStep++,
        role: 'ADMIN',
        approver_id: adminUser ? adminUser._id : null,
        due_date: getSlaDate()
      });
    }

    // Mark final step for fallback sequence
    if (steps.length > 0) {
       steps[steps.length - 1].is_final_step = true;
    }

    return steps;
  }
}

module.exports = new WorkflowService();
