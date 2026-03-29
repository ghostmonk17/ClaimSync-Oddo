const mongoose = require('mongoose');
require('dotenv').config();

async function checkEmp() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  
  const User = require('./src/modules/user/user.model');
  const employee = await User.findById('69c8dac98053693511342b6c').lean();
  console.log('Employee:', employee);

  const manager = await User.findOne({ role: 'MANAGER' }).lean();
  console.log('Manager DB ID:', manager?._id);

  process.exit();
}

checkEmp();
