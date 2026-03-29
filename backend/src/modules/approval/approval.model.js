const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  expense_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true, index: true },
  step: { type: Number, required: true },
  role: { 
    type: String, 
    enum: ['MANAGER', 'FINANCE', 'SENIOR', 'ADMIN', 'CFO'],
    required: true
  },
  approver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SENT_BACK'],
    default: 'PENDING',
    index: true
  },
  comment: { type: String },
  actioned_at: { type: Date },
  due_date: { type: Date },
  group_id: { type: mongoose.Schema.Types.ObjectId, index: true }, // For PARALLEL step grouping
  is_final_step: { type: Boolean, default: false },
  required_approvals: { type: Number },
  rule: {
    type: { type: String, enum: ['ALL', 'PERCENTAGE', 'ANY'] },
    percentage: { type: Number, min: 0, max: 1 }
  },
  escalated: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Approval', approvalSchema);
