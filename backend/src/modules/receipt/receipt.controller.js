const receiptService = require('./receipt.service');
const ocrService = require('../../services/ocr.service');
const parsingService = require('../../services/parsing.service');

class ReceiptController {
  async uploadReceipt(req, res, next) {
    try {
      // Multer file object is in req.file
      const file = req.file;
      const { expense_id } = req.body;
      const user_id = req.user.user_id;

      if (!expense_id) {
         return res.status(400).json({ success: false, message: 'Expense ID is required' });
      }

      if (!file) {
         return res.status(400).json({ success: false, message: 'File is required' });
      }

      const receipt = await receiptService.uploadReceipt(file, expense_id, user_id);

      return res.status(201).json({
        success: true,
        message: 'Receipt uploaded and queued for processing',
        data: receipt
      });
    } catch (error) {
      next(error);
    }
  }

  async extractData(req, res, next) {
    try {
      const file = req.file;

      if (!file) {
         return res.status(400).json({ success: false, message: 'File is required for extraction' });
      }

      // Pass the fully structured local physical file path securely into OCR extractor natively
      const physicalPath = file.path;

      // Execute Extract natively asynchronously without tying into Mongoose DB
      const rawData = await ocrService.extractText(physicalPath, file.mimetype);
      const parsedData = await parsingService.parseExtractedText(rawData.text);

      return res.status(200).json({
        success: true,
        message: 'Receipt parsed successfully',
        data: parsedData.data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReceiptController();
