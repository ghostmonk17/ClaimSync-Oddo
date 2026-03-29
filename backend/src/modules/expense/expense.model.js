const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'MISMATCH', 'LOW_CONFIDENCE', 'MISSING_RECEIPT'
  field: { type: String },
  message: { type: String, required: true },
}, { _id: false });

const violationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  field: { type: String },
  message: { type: String, required: true },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  converted_amount: { type: Number },
  conversion_rate: { type: Number },
  conversion_rate_snapshot: { type: Number },
  conversion_timestamp: { type: Date },
  category: { type: String },
  merchant: { type: String }, // Top-level merchant/restaurant name
  items: [{
    description: { type: String },
    amount: { type: Number }
  }], // Line items extracted
  date: { type: Date, required: true },
  description: { type: String },
  receipt_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' }],
  receipt_processing_status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'DONE'],
    default: 'PENDING'
  },
  finalized_data: {
    amount: { type: Number },
    date: { type: Date },
    merchant: { type: String },
    currency: { type: String },
    items: [{
        description: { type: String },
        amount: { type: Number }
    }]
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED', 'SENT_BACK'], 
    default: 'DRAFT',
    required: true
  },
  approval_status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SENT_BACK'] 
  },
  current_step: { type: Number },
  flags: [flagSchema],
  violations: [violationSchema],
  confidence_score: { type: Number, min: 0, max: 1 },
  risk_score: { type: Number, min: 0, max: 1 },
  risk_breakdown: {
    amount_factor: { type: Number, default: 0 },
    frequency_factor: { type: Number, default: 0 },
    flags_factor: { type: Number, default: 0 },
    violations_factor: { type: Number, default: 0 }
  },
  approval_snapshot: { type: mongoose.Schema.Types.Mixed },
  approval_history: [{
    role: { type: String },
    status: { type: String },
    comment: { type: String },
    timestamp: { type: Date }
  }],
  version: { type: Number, default: 1 },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes mapping
expenseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
