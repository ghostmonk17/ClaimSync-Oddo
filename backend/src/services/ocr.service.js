const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

class OCRService {
  /**
   * Real implementation of OCR API using local open-source Tesseract
   */
  async extractText(physicalPath, mimetype = null) {
    try {
      const fullPath = path.resolve(physicalPath);
      
      if (!fs.existsSync(fullPath)) {
         throw new Error(`Physically missing file at ${fullPath}`);
      }
      
      const fileExtension = path.extname(fullPath).toLowerCase();
      
      // Native PDF Parsing Handler leveraging precise document text layer extraction
      // Use strictly provided mimetype if available, otherwise fallback to explicit string extensions organically
      if ((mimetype && mimetype === 'application/pdf') || fileExtension === '.pdf') {
         const pdfParse = require('pdf-parse');
         const dataBuffer = fs.readFileSync(fullPath);
         
         const data = await pdfParse(dataBuffer);
         
         return {
            text: data.text,
            rawResponse: { confidence: 100, pdf_pages: data.numpages }
         };
      }
      
      // Execute organic extraction via Tesseract Workers natively for Images
      const worker = await Tesseract.createWorker('eng');
      try {
         const { data: { text, confidence } } = await worker.recognize(fullPath);
         return {
            text: text,
            rawResponse: { confidence }
         };
      } finally {
         await worker.terminate();
      }
    } catch (error) {
       console.error("OCR Engine critical failure:", error);
       throw new Error(`OCR Algorithm precisely crashed: ${error.message || 'Unknown Native Execution Error'}`);
    }
  }
}

module.exports = new OCRService();
