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
      // 1. Apply currency conversion
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

      // 1. Validate receipt conditions
      const hasReceipt = expense.receipt_ids && expense.receipt_ids.length > 0;
      const declaredMissing = expense.flags && expense.flags.some(f => f.type === 'MISSING_RECEIPT');
      const hasBlockingViolations = expense.violations && expense.violations.length > 0;

      if (!hasReceipt && !declaredMissing) {
        throw new Error('Cannot submit expense without a receipt or a missing receipt declaration');
      }

      // We actively permit Violations natively here since they are passed immediately 
      // into the Decision Engine and organically scale the Risk Score, triggering automatic Manager + Finance escalations.

      // 2. Decision Support Engine (Analysis & Risk)
      const analysisFlags = await analysisService.analyzeExpense(expense, userId);
      
      // Merge unique flags
      const existingFlags = expense.flags || [];
      const mergedFlagsMap = new Map();
      existingFlags.forEach(f => mergedFlagsMap.set(`${f.type}-${f.field}`, f));
      analysisFlags.forEach(f => mergedFlagsMap.set(`${f.type}-${f.field}`, f));
      
      const finalFlags = Array.from(mergedFlagsMap.values());
      
      const { risk_score, risk_breakdown } = riskService.computeRiskScore(expense, finalFlags, expense.violations || []);

      // Mount into memory for local calculation
      expense.flags = finalFlags;
      expense.risk_score = risk_score;

      // 3. Workflow Builder dynamically structures steps natively 
      const employee = await userRepository.findById(userId);
      const workflowSteps = await workflowService.buildWorkflowSteps(expense, employee);

      // Save initial approval tasks strictly cleanly without duplicates
      for (const step of workflowSteps) {
         await approvalRepository.create({
            expense_id: expense._id,
            step: step.step,
            role: step.role,
            approver_id: step.approver_id,
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
}

module.exports = new ExpenseService();
