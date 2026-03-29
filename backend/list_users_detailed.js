const mongoose = require('mongoose');
require('dotenv').config();

async function listUsersDetailed() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  const User = require('./src/modules/user/user.model');

  const users = await User.find().populate('manager_id').lean();
  console.log('--- USERS ---');
  for (const u of users) {
     console.log(`ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, Manager: ${u.manager_id?.email || 'None'}`);
  }

  const Approval = require('./src/modules/approval/approval.model');
  const apps = await Approval.find({ status: 'PENDING' }).populate('approver_id').lean();
  console.log('\n--- PENDING APPROVALS ---');
  for (const a of apps) {
     console.log(`ID: ${a._id}, Role: ${a.role}, Approver: ${a.approver_id?.email || 'UNASSIGNED'}, Expense ID: ${a.expense_id}`);
  }

  process.exit();
}
listUsersDetailed();
