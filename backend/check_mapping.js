const mongoose = require('mongoose');
require('dotenv').config();

async function checkMapping() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  const User = require('./src/modules/user/user.model');
  const Approval = require('./src/modules/approval/approval.model');

  const employee = await User.findOne({ email: 'employee@globaltech.com' }).lean();
  console.log(`Employee ID: ${employee?._id}, Manager ID: ${employee?.manager_id}`);

  const manager = await User.findOne({ email: 'manager@globaltech.com' }).lean();
  console.log(`Manager ID: ${manager?._id}, Manager Email: ${manager?.email}`);

  const pending = await Approval.find({ approver_id: manager?._id, status: 'PENDING' }).lean();
  console.log(`Manager Pending Approvals: ${pending.length}`);

  process.exit();
}
checkMapping();
