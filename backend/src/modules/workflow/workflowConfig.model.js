const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['SEQUENTIAL', 'PARALLEL'], 
    default: 'SEQUENTIAL' 
  },
  roles: [{ 
    type: String, 
    enum: ['MANAGER', 'FINANCE', 'SENIOR', 'ADMIN', 'CFO', 'HR', 'LEGAL'] 
  }],
  required_approvals: { type: Number, default: 1 },
  rule: {
    type: { type: String, enum: ['ALL', 'PERCENTAGE', 'ANY'], default: 'ALL' },
    percentage: { type: Number, min: 0, max: 1, default: null }
  }
});

const approvalWorkflowConfigSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  steps: [workflowStepSchema],
  override_rules: {
    cfo_override: { type: Boolean, default: true }
  },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Only one active workflow per company
approvalWorkflowConfigSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model('ApprovalWorkflowConfig', approvalWorkflowConfigSchema);
