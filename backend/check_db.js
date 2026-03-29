const mongoose = require('mongoose');
require('dotenv').config();

async function checkApprovals() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  
  const Approval = require('./src/modules/approval/approval.model');
  const Expense = require('./src/modules/expense/expense.model');

  const apps = await Approval.find().lean();
  console.log('Approvals length:', apps.length);
  if (apps.length > 0) {
     console.log('Sample approval:', apps[0]);
  }

  const exps = await Expense.find({ status: 'SUBMITTED' }).lean();
  console.log('Submitted expenses length:', exps.length);
  if (exps.length > 0) {
     console.log('Sample expense:', exps[0]);
  }

  process.exit();
}

checkApprovals();
