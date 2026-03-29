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
         const { PDFParse } = require('pdf-parse');
         const dataBuffer = fs.readFileSync(fullPath);
         
         const parser = new PDFParse({ data: dataBuffer });
         const textTarget = await parser.getText();
         const info = await parser.getInfo();
         
         let extractedText = textTarget.text.trim();
         
         // If text layer is extremely sparse or missing (likely a scanned image inside a PDF),
         // we perform Visual OCR on every page natively.
         if (extractedText.length < 50) {
            const screenshotResult = await parser.getScreenshot({ scale: 2 });
            const pageTexts = [];
            
            const worker = await Tesseract.createWorker('eng');
            try {
               for (const page of screenshotResult.pages) {
                  const { data: { text } } = await worker.recognize(page.data);
                  pageTexts.push(text);
               }
               extractedText = pageTexts.join('\n');
            } finally {
               await worker.terminate();
            }
         }
         
         await parser.destroy();
         
         return {
            text: extractedText,
            rawResponse: { confidence: 100, pdf_pages: info.total }
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
