class ParsingService {
  /**
   * Parse amounts, dates, and merchants from raw OCR text
   */
  async parseExtractedText(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let amount = null;
    let date = null;
    let merchant = null;
    let currency = 'USD'; // default fallback
    
    let fieldsFound = 0;
    const totalFields = 4;

    // Log the OCR Text physically into mapping console so backend developers can verify the authentic pixel data extraction
    console.log("--- OCR EXTRACTION START ---");
    console.log(rawText);
    console.log("--- OCR EXTRACTION END ---");

    // 1. Amount Extraction (Anchor precisely on keywords first, then largest float as fallback)
    let semanticAmount = null;
    const totalMatch = rawText.match(/\b(?:Total|Amount|Balance|Due)[^\d\n]*?(\d+[\.,]\d{2})/i);
    if (totalMatch) {
       semanticAmount = parseFloat(totalMatch[1].replace(',', '.'));
    }

    let maxAmount = 0;
    const allCurrencyFloats = rawText.match(/\b\d+[\.,]\d{2}\b/g);
    if (allCurrencyFloats) {
       const mappedFloats = allCurrencyFloats.map(n => parseFloat(n.replace(',', '.')));
       maxAmount = Math.max(...mappedFloats.filter(n => !isNaN(n)));
    }

    // Semantic total is usually the real answer on receipts with "Suggested Fares" or "Service Fees"
    amount = semanticAmount || maxAmount || null;
    if (amount) fieldsFound++;

    // 2. Date Extraction (Advanced semantic + ISO + European)
    const dateRegexes = [
       /(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/, // 2024/10/15
       /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?\,?\s+\d{4})/i, // Oct 15, 2024
       /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i, // 15 Oct 2024
       /(\d{2}(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\d{4})/i // 05Mar2026
    ];

    for (const reg of dateRegexes) {
       const m = rawText.match(reg);
       if (m) {
          const cleanDateStr = m[1].replace(/(?:st|nd|rd|th)/,'');
          const parsed = new Date(cleanDateStr);
          if (!isNaN(parsed.getTime())) {
             const y = parsed.getFullYear();
             const mn = String(parsed.getMonth() + 1).padStart(2, '0');
             const d = String(parsed.getDate()).padStart(2, '0');
             date = `${y}-${mn}-${d}`;
             fieldsFound++;
             break;
          }
       }
    }

    // 3. Currency Extraction
    const symbolMatches = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
    const isoMatch = rawText.match(/\b(USD|EUR|GBP|INR|JPY|CAD|AUD)\b/i);
    if (isoMatch) {
       currency = isoMatch[1].toUpperCase();
       fieldsFound++;
    } else {
       for (const [s, i] of Object.entries(symbolMatches)) {
           if (rawText.includes(s)) {
               currency = i;
               fieldsFound++;
               break;
           }
       }
    }

    // 4. Merchant & Category Engine (Map Brands to Categories organically)
    const categoryMap = {
       'uber': 'Travel',
       'lyft': 'Travel',
       'starbucks': 'Meals',
       'mcdonalds': 'Meals',
       'amazon': 'Supplies',
       'walmart': 'Supplies',
       'shell': 'Travel',
       'exxon': 'Travel'
    };

    const cleanLines = lines.filter(l => !l.match(/^(receipt|invoice|welcome|tax|tel|date|time|total|thanks|order)/i))
                            .filter(l => !l.match(/^[0-9\W]+$/));

    if (cleanLines.length > 0) {
       merchant = cleanLines[0].replace(/[^\w\s\.\,\-]/gi, '').trim();
       if (merchant.length > 2) {
          fieldsFound++;
       }
    }

    // Secondary Category Inference
    let category = 'Other';
    if (merchant) {
       const mKey = merchant.toLowerCase();
       for (const [brand, cat] of Object.entries(categoryMap)) {
          if (mKey.includes(brand)) {
             category = cat;
             break;
          }
       }
    }

    const confidenceScore = fieldsFound / totalFields;

    return {
      data: { 
        amount, 
        date, 
        merchant: merchant || "UNKNOWN", 
        currency,
        category,
        description: merchant ? `Receipt from ${merchant}` : "Expense submission"
      },
      confidenceScore 
    };
  }
}

module.exports = new ParsingService();
