const { Queue } = require('bullmq');
const Redis = require('ioredis');

const worker = require('../workers/ocr.worker');

// For local development without Redis, we mock the Queue locally
const ocrQueue = {
  add: async (name, data, opts) => {
    console.log(`[Mock Queue] Executing Job ${name} synchronously:`, data);
    if (worker.processJob) {
       await worker.processJob(data);
    }
    return { id: 'mock-job-1' };
  }
};

class OCRQueueService {
  async addJob(receiptId, fileUrl) {
    if (process.env.USE_REDIS !== 'true') {
        return ocrQueue.add('process-receipt', { receiptId, fileUrl });
    }
  }
}

module.exports = new OCRQueueService();
