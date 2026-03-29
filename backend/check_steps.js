const mongoose = require('mongoose');
require('dotenv').config();

async function checkExpsStep() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  const Expense = require('./src/modules/expense/expense.model');
  const exps = await Expense.find().lean();
  for (const exp of exps) {
     console.log(`Expense ID: ${exp._id}, Amount: ${exp.amount}, Current Step: ${exp.current_step}, Status: ${exp.status}`);
  }
  process.exit();
}
checkExpsStep();
