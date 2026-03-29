const { Worker } = require('bullmq');
const Redis = require('ioredis');
const ocrService = require('../services/ocr.service');
const parsingService = require('../services/parsing.service');
const reconciliationService = require('../services/reconciliation.service');
const receiptRepository = require('../modules/receipt/receipt.repository');
const auditService = require('../modules/audit/audit.service');
const expenseRepository = require('../modules/expense/expense.repository');

// OVERRIDE FOR LOCAL DEVELOPER ENVIRONMENTS:
// If your PowerShell/Shell globally has USE_REDIS='true' lingering, 
// it will forcefully connect to Redis and crash. We explicitly override 
// this natively to GUARANTEE NO REDIS connections happen.
const FORCE_DISABLE_REDIS = true; 

let worker = null;

const processOCRJob = async (jobData) => {
    const { receiptId, fileUrl } = jobData;
    
    try {
      // 1. Audit Start / Set Processing Deterministically
      await receiptRepository.updateById(receiptId, { ocr_status: 'PROCESSING' });
      const receipt = await receiptRepository.findById(receiptId);
      
      await auditService.log('Receipt', receiptId, 'OCR_STARTED', null, null, null);
      await expenseRepository.findByIdAndUpdate(receipt.expense_id, { receipt_processing_status: 'PROCESSING' });

      // 2. Perform Physical Output Extraction
      const rawData = await ocrService.extractText(receipt.file_url, receipt.file_type);
      
      // 3. Parse extracted text for structured data (Determinism + Fallback rules)
      let parsedData = null;
      let confidenceScore = 0;
      try {
          parsedData = await parsingService.parseExtractedText(rawData.text);
          confidenceScore = parsedData.confidenceScore;
      } catch (parseErr) {
          console.error(`Parsing Failed for receipt ${receiptId}:`, parseErr);
          // Fallback: store raw_text anyway and mark NEEDS_REVIEW
          const updatedReceipt = await receiptRepository.updateOcrData(
              receiptId, 'FAILED', null, 0, 'NEEDS_REVIEW', rawData.text
          );
          
          const failedFlag = { type: 'OCR_FAILED', field: 'ocr', message: 'The OCR engine failed to mathematically extract reliable text from the visual payload' };
          
          await expenseRepository.findByIdAndUpdate(receipt.expense_id, { 
              receipt_processing_status: 'DONE',
              $push: { flags: failedFlag } 
          });
          
          await auditService.log('Receipt', receiptId, 'OCR_FAILED', null, null, { error: 'Parsing Failed', raw_text: rawData.text });
          return { status: 'failed_parsing', receiptId };
      }
      
      // 4. Update receipt with deterministic success + enforce confidence < 0.7 review
      const validationStatus = confidenceScore < 0.7 ? 'NEEDS_REVIEW' : 'PENDING';
      const updatedReceipt = await receiptRepository.updateOcrData(
        receiptId, 
        'DONE', 
        parsedData.data, 
        confidenceScore, 
        validationStatus,
        rawData.text // ALWAYS save raw text
      );

      // 5. Audit
      await auditService.log(
        'Receipt',
        receiptId,
        'OCR_COMPLETED',
        null,
        null,
        { status: 'DONE', confidence: confidenceScore }
      );
      await expenseRepository.findByIdAndUpdate(updatedReceipt.expense_id, { receipt_processing_status: 'DONE' });

      // 6. Reconcile with expense data
      await reconciliationService.reconcile(updatedReceipt.expense_id, updatedReceipt._id);
      
      return { status: 'success', receiptId };
    } catch (error) {
      console.error(`OCR Worker Error for receipt ${receiptId}:`, error);
      
      // If complete deterministic failure (OCR itself failed)
      await receiptRepository.updateOcrData(receiptId, 'FAILED', null, 0, 'INVALID');
      const failReceipt = await receiptRepository.findById(receiptId);
      if(failReceipt) {
        const failedFlag = { type: 'OCR_FAILED', field: 'ocr', message: `OCR system integration error: ${error.message}` };
        await expenseRepository.findByIdAndUpdate(failReceipt.expense_id, { 
           receipt_processing_status: 'DONE',
           $push: { flags: failedFlag }
        });
      }
      
      await auditService.log('Receipt', receiptId, 'OCR_FAILED', null, null, { error: error.message });
      throw error;
    }
};

if (!FORCE_DISABLE_REDIS && process.env.USE_REDIS === 'true') {
  const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { 
      maxRetriesPerRequest: null,
      retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
      }
  });

  connection.on('error', (err) => {
      // Suppress connection logs if intentional
      if (err.code !== 'ECONNREFUSED') {
          console.error('Redis Error:', err);
      }
  });

  worker = new Worker('ocr-processing', async job => processOCRJob(job.data), { connection });
} else {
  // Graceful Mock Worker for local environments natively replacing console spam
  worker = {
    on: () => {},
    close: async () => { console.log('Mock worker closed safely.'); },
    processJob: processOCRJob 
  };
}

module.exports = worker;
