const mongoose = require('mongoose');
require('dotenv').config();

async function listRealExpenses() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  const Expense = require('./src/modules/expense/expense.model');
  const User = require('./src/modules/user/user.model');

  const exps = await Expense.find({ status: 'SUBMITTED' }).populate('user_id').lean();
  console.log(`Found ${exps.length} submitted expenses in DB.`);
  for (const exp of exps) {
     console.log(`- Amount: ${exp.amount}, By: ${exp.user_id?.email}, Company ID: ${exp.company_id}`);
  }

  process.exit();
}
listRealExpenses();
