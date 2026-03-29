const mongoose = require('mongoose');
require('dotenv').config();

async function testUserCreation() {
  await mongoose.connect('mongodb://localhost:27017/claimsync');
  const User = require('./src/modules/user/user.model');
  const Company = require('./src/modules/company/company.model');

  const company = await Company.findOne().lean();
  const manager = await User.findOne({ role: 'MANAGER' }).lean();

  const newUser = await User.create({
     company_id: company._id,
     name: 'New Test Employee',
     email: 'test@example.com',
     role: 'EMPLOYEE',
     manager_id: manager._id
  });

  console.log(`Created User: ${newUser.name}, Manager ID (Ref): ${newUser.manager_id}`);

  const populated = await User.findById(newUser._id).populate('manager_id').lean();
  console.log(`Populated Manager Email: ${populated.manager_id?.email}`);

  // Cleanup
  await User.deleteOne({ _id: newUser._id });
  process.exit();
}
testUserCreation();
