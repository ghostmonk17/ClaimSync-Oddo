const userRepository = require('../user/user.repository');

class WorkflowService {
  async buildWorkflowSteps(expense, employee) {
    const steps = [];

    // Base validations against exact metrics natively scaling
    const amountVal = expense.converted_amount || expense.amount; // Use consistent base currency
    const hasViolations = expense.violations && expense.violations.length > 0;
    const isHighRisk = expense.risk_score > 0.7;

    let currentStep = 1;

    // Helper: SLA Due Date calculator (+2 days)
    const getSlaDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d;
    };

    // 1. MANAGER Step: Always required initially if user has a manager
    if (employee.manager_id && employee._id.toString() !== employee.manager_id.toString()) {
      steps.push({
        step: currentStep++,
        role: 'MANAGER',
        approver_id: employee.manager_id, // Direct Manager assigned natively
        due_date: getSlaDate()
      });
    }

    // 2. FINANCE Step: High amount or has any policy violations
    if (amountVal > 10000 || hasViolations) {
      const financeUser = await userRepository.findActiveByRoleAndCompany('FINANCE', employee.company_id);
      steps.push({
        step: currentStep++,
        role: 'FINANCE',
        approver_id: financeUser ? financeUser._id : null, // Explicit assignment vs Group fallback
        due_date: getSlaDate()
      });
    }

    // 3. SENIOR Step: Critical enterprise exposure
    if (amountVal > 50000 || isHighRisk) {
      const seniorUser = await userRepository.findActiveByRoleAndCompany('SENIOR', employee.company_id);
      steps.push({
        step: currentStep++,
        role: 'SENIOR',
        approver_id: seniorUser ? seniorUser._id : null,
        due_date: getSlaDate()
      });
    }

    // Edge-case Fallback: Force ADMIN step at minimum
    if (steps.length === 0) {
      const adminUser = await userRepository.findActiveByRoleAndCompany('ADMIN', employee.company_id);
      steps.push({
        step: currentStep++,
        role: 'ADMIN',
        approver_id: adminUser ? adminUser._id : null,
        due_date: getSlaDate()
      });
    }

    return steps;
  }
}

module.exports = new WorkflowService();
