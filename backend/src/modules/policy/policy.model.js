const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  category: { type: String, required: true },
  maxAmount: { type: Number, required: true },
  receiptRequired: { type: Boolean, default: true },
  violationType: { type: String, enum: ['Hard', 'Soft'], default: 'Soft' }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
