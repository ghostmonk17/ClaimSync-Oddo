const ocrService = require('./backend/src/services/ocr.service');
const path = require('path');

const testPdf = 'c:/Projects/ClaimSync/backend/uploads/receipt-1774771457538-731715284.pdf';

async function test() {
    try {
        console.log("Testing PDF extraction...");
        const result = await ocrService.extractText(testPdf, 'application/pdf');
        console.log("Extraction Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Extraction Failed:", error);
    }
}

test();
