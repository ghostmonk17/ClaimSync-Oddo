const mongoose = require('mongoose');
require('dotenv').config();

async function fixApprovals() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  
  const Approval = require('./src/modules/approval/approval.model');
  const User = require('./src/modules/user/user.model');

  // Find generic manager
  const genericManager = await User.findOne({ role: 'MANAGER' }).lean();
  if (!genericManager) {
     console.log('No generic manager found. Cannot re-route.');
     process.exit();
  }

  const result = await Approval.updateMany(
     { role: 'ADMIN', step: 1, status: 'PENDING' },
     { role: 'MANAGER', approver_id: genericManager._id }
  );

  console.log(`Re-routed ${result.modifiedCount} skipped expenses back to Manager queue natively.`);
  process.exit();
}

fixApprovals();
