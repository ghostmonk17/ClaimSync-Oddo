const mongoose = require('mongoose');
const expenseRepository = require('./expense.repository');
const versionService = require('../version/version.service');
const auditService = require('../audit/audit.service');
const { convertToBaseCurrency } = require('../../utils/currency.util');

const analysisService = require('../../services/analysis.service');
const riskService = require('../../services/risk.service');
const workflowService = require('../workflow/workflow.service');
const approvalRepository = require('../approval/approval.repository');
const userRepository = require('../user/user.repository');

class ExpenseService {
  async createExpense(data, userId, companyId) {
    try {
      // 1. Validating Date strictly: Ensure it is not mathematically in the future
      const expenseDate = new Date(data.date);
      const today = new Date();
      if (expenseDate > today) {
         throw new Error('Expense date cannot be in the future.');
      }

      // 2. Apply currency conversion
      const { converted_amount, conversion_rate } = await convertToBaseCurrency(data.amount, data.currency);

      const expenseData = {
        user_id: userId,
        company_id: companyId,
        amount: data.amount,
        currency: data.currency,
        converted_amount,
        conversion_rate,
        conversion_rate_snapshot: conversion_rate,
        conversion_timestamp: new Date(),
        category: data.category,
        date: data.date,
        description: data.description,
        status: 'DRAFT',
        version: 1,
      };

      // 2. Create the Expense doc
      const expense = await expenseRepository.create(expenseData);

      // 3. Create Version Snapshot
      await versionService.createSnapshot(expense._id, expense.version, expense.toObject());

      // 4. Audit Log
      await auditService.log(
        'Expense',
        expense._id,
        'EXPENSE_CREATED',
        userId,
        null,
        { amount: data.amount, status: 'DRAFT' }
      );

      return expense;
    } catch (err) {
      throw err;
    }
  }

  async declareMissingReceipt(expenseId, declarationReason, userId) {
    try {
      const expense = await expenseRepository.findById(expenseId);
      if (!expense) throw new Error('Expense not found');
      if (expense.status !== 'DRAFT') {
         throw new Error('Expense is locked and cannot be modified');
      }

      if (expense.flags && expense.flags.some(f => f.type === 'MISSING_RECEIPT')) {
         throw new Error('Receipt missing already declared');
      }

      const flags = [...(expense.flags || []), {
        type: 'MISSING_RECEIPT',
        field: 'receipt_id',
        message: `User declared receipt missing. Reason: ${declarationReason}`
      }];

      // Important: Ensure proper optimistic update/versioning happens via the findByIdAndUpdate logic
      const updateData = { flags };
      const updatedExpense = await expenseRepository.findByIdAndUpdate(expenseId, updateData);

      // Versioning
      await versionService.createSnapshot(updatedExpense._id, updatedExpense.version, updatedExpense);

      // Audit
      await auditService.log(
        'Expense',
        updatedExpense._id,
        'DECLARE_MISSING_RECEIPT',
        userId,
        { reason: null },
        { reason: declarationReason }
      );

      return updatedExpense;

    } catch (err) {
      throw err;
    }
  }

  async submitExpense(expenseId, userId) {
    try {
      const expense = await expenseRepository.findById(expenseId);
      if (!expense) throw new Error('Expense not found');
      if (expense.status !== 'DRAFT') {
         throw new Error('Only DRAFT expenses can be submitted');
      }

      // 1. Evaluate receipt conditions for policy engine
      const hasReceipt = expense.receipt_ids && expense.receipt_ids.length > 0;

      // --- DYNAMIC ADMIN POLICY ENGINE EVALUATION ---
      const Policy = require('../policy/policy.model');
      // Look for a specific rule matching the expense category
      const activePolicy = await Policy.findOne({ 
         company_id: expense.company_id, 
         category: new RegExp(`^${expense.category}$`, 'i') 
      }).lean();

      let activeViolations = expense.violations || [];
      const activeFlags = expense.flags || [];

      if (activePolicy) {
         // Evaluate Max Amount Threshold
         const amountVal = expense.converted_amount || expense.amount;
         if (amountVal > activePolicy.maxAmount) {
            const ruleObj = {
               type: 'POLICY_LIMIT_EXCEEDED',
               field: 'amount',
               message: `Amount exceeds the company policy limit of ${activePolicy.maxAmount} for ${expense.category}`
            };
            if (activePolicy.violationType === 'Hard') activeViolations.push(ruleObj);
            else activeFlags.push(ruleObj);
         }

         // Evaluate Receipt Requirement Override
         if (activePolicy.receiptRequired && !hasReceipt) {
            const receiptRuleObj = {
               type: 'POLICY_RECEIPT_MANDATORY',
               field: 'receipt',
               message: `Company policy strictly mandates receipts for ${expense.category}`
            };
            if (activePolicy.violationType === 'Hard') {
               // Hard block entirely out of flow before submission
               throw new Error(receiptRuleObj.message);
            } else {
               activeViolations.push(receiptRuleObj);
            }
         }
      }

      // 2. Decision Support Engine (Analysis & Risk)
      const analysisFlags = await analysisService.analyzeExpense(expense, userId);
      
      // Merge unique flags securely
      const mergedFlagsMap = new Map();
      activeFlags.forEach(f => mergedFlagsMap.set(`${f.type}-${f.field}`, f));
      analysisFlags.forEach(f => mergedFlagsMap.set(`${f.type}-${f.field}`, f));
      
      const finalFlags = Array.from(mergedFlagsMap.values());
      const { risk_score, risk_breakdown } = riskService.computeRiskScore(expense, finalFlags, activeViolations);

      // Mount into memory for local calculation
      expense.flags = finalFlags;
      expense.violations = activeViolations; // Inject back updated violations
      expense.risk_score = risk_score;

      // 3. Workflow Builder dynamically structures steps natively 
      const employee = await userRepository.findById(userId);
      if (!employee) {
         throw new Error('Submitting user not found in the current structural hierarchy. Please refresh your session.');
      }
      const workflowSteps = await workflowService.buildWorkflowSteps(expense, employee);

      // Save initial approval tasks strictly cleanly without duplicates
      for (const step of workflowSteps) {
         await approvalRepository.create({
            expense_id: expense._id,
            step: step.step,
            role: step.role,
            approver_id: step.approver_id,
            group_id: step.group_id || null,
            is_final_step: step.is_final_step || false,
            required_approvals: step.required_approvals || null,
            rule: step.rule || null,
            due_date: step.due_date,
            status: 'PENDING'
         });
      }

      // Generate Immutable Snapshot globally preventing edits explicitly mutating future reviews
      const approval_snapshot = {
        amount: expense.amount,
        converted_amount: expense.converted_amount,
        currency: expense.currency,
        category: expense.category,
        receipt_ids: expense.receipt_ids,
        flags: finalFlags,
        risk_score: risk_score
      };

      // 4. State Machine Update globally
      const updatePayload = {
        status: 'SUBMITTED',
        approval_status: 'PENDING',
        current_step: 1,
        flags: finalFlags,
        risk_score: risk_score,
        risk_breakdown: risk_breakdown,
        approval_snapshot: approval_snapshot
      };

      const updatedExpense = await expenseRepository.findByIdAndUpdate(expenseId, updatePayload);

      // 5. Versioning
      await versionService.createSnapshot(updatedExpense._id, updatedExpense.version, updatedExpense);

      // 6. Audit Logging mapping natively 
      await auditService.log('Expense', updatedExpense._id, 'EXPENSE_SUBMITTED', userId, null, { risk_score: risk_score });
      await auditService.log('Approval', updatedExpense._id, 'APPROVAL_CREATED', userId, null, { steps: workflowSteps.length });

      return updatedExpense;

    } catch (err) {
      throw err;
    }
  }

  async updateExpense(expenseId, data, userId) {
    try {
      const expense = await expenseRepository.findById(expenseId);
      if (!expense) throw new Error('Expense not found');
      if (expense.status !== 'DRAFT') {
         throw new Error('Only DRAFT expenses can be modified');
      }

      if (data.date) {
         const expenseDate = new Date(data.date);
         const today = new Date();
         if (expenseDate > today) {
            throw new Error('Expense date cannot be in the future.');
         }
      }

      const updateData = { ...data };
      
      // Recalculate currency if needed
      if ((data.amount !== undefined && data.amount !== expense.amount) || (data.currency && data.currency !== expense.currency)) {
          const amt = data.amount !== undefined ? data.amount : expense.amount;
          const cur = data.currency || expense.currency;
          const { converted_amount, conversion_rate } = await convertToBaseCurrency(amt, cur);
          updateData.converted_amount = converted_amount;
          updateData.conversion_rate = conversion_rate;
          updateData.conversion_rate_snapshot = conversion_rate;
          updateData.conversion_timestamp = new Date();
      }

      const updatedExpense = await expenseRepository.findByIdAndUpdate(expenseId, updateData);

      // Snapshot & Audit
      await versionService.createSnapshot(updatedExpense._id, updatedExpense.version, updatedExpense);
      await auditService.log('Expense', updatedExpense._id, 'EXPENSE_UPDATED', userId, null, { updated_fields: Object.keys(data) });

      return updatedExpense;

    } catch (err) {
      throw err;
    }
  }
}

module.exports = new ExpenseService();
