const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String }, // Nullable initially for invites
  role: { 
    type: String, 
    enum: ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE', 'CFO'],
    required: true
  },
  is_active: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
