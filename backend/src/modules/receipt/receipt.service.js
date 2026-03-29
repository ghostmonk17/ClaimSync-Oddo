const fs = require('fs');
const receiptRepository = require('./receipt.repository');
const expenseRepository = require('../expense/expense.repository');
const auditService = require('../audit/audit.service');
const validationService = require('../../services/validation.service');
const queueService = require('../../queues/ocr.queue');
const { generateFileHashFromFile } = require('../../utils/hash.util');
const mongoose = require('mongoose');

class ReceiptService {
  async uploadReceipt(file, expenseId, userId) {
    try {
      // 1. Validate file exists
      if (!file) throw new Error('File not provided');

      // 2. Fetch expense to ensure it's in DRAFT status
      const expense = await expenseRepository.findById(expenseId);
      if (!expense || expense.status !== 'DRAFT') {
        throw new Error('Expense not found or not in DRAFT status');
      }

      // 3. Generate hash to detect duplicates
      const fileHash = await generateFileHashFromFile(file.path);
      let receipt = await receiptRepository.findByHash(fileHash);
      let isDuplicate = false;

      if (receipt) {
         // Duplicate detected -> Flag violation as per architecture rules securely instead of throwing error natively
         isDuplicate = true;
         const duplicateViolation = {
             type: 'DUPLICATE_RECEIPT',
             field: 'hash',
             message: 'A mathematically identical receipt has already been organically uploaded into the system.'
         };
         await expenseRepository.findByIdAndUpdate(expenseId, {
             $push: { violations: duplicateViolation, receipt_ids: receipt._id },
             receipt_processing_status: 'DONE'
         });

         await auditService.log('Expense', expenseId, 'EXPENSE_UPDATED', userId, null, { violations_added: 1 });
      } else {
         // 4. Create NEW receipt record seamlessly
         const receiptData = {
           expense_id: expenseId,
           file_url: file.path, 
           file_type: file.mimetype,
           hash: fileHash,
           ocr_status: 'PENDING',
           validation_status: 'PENDING'
         };

         receipt = await receiptRepository.create(receiptData);

         // 5. Link structurally to expense
         await expenseRepository.findByIdAndUpdate(
           expenseId, 
           { 
             $push: { receipt_ids: receipt._id },
             receipt_processing_status: 'PENDING'
           }
         );
      }

      // 6. Audit Logging
      await auditService.log(
        'Receipt',
        receipt._id,
        'RECEIPT_UPLOADED',
        userId,
        null,
        { file_url: receipt.file_url, expense_id: expenseId }
      );

      // 7. Enqueue OCR Job after successful transaction IF mathematically original
      if (!isDuplicate) {
        try {
            await queueService.addJob(receipt._id, receipt.file_url);
        } catch (qErr) {
            console.error("Failed to enqueue OCR job but receipt was uploaded:", qErr);
        }
      }

      return receipt;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReceiptService();
