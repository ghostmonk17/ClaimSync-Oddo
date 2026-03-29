const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/modules/user/user.model');
const { hashPassword } = require('./src/utils/password.util');

async function addSecondFinanceUser() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/claimsync';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const firstFinance = await User.findOne({ role: 'FINANCE' }).lean();
    
    if (!firstFinance) {
      console.log('No existing finance user found to copy company ID from.');
      process.exit(1);
    }

    const exists = await User.findOne({ email: 'finance2@globaltech.com' });
    if (exists) {
      console.log('finance2@globaltech.com already exists.');
      process.exit(0);
    }

    const hashedPass = await hashPassword('EnterprisePassword123!');
    
    await User.create({
      company_id: firstFinance.company_id,
      email: 'finance2@globaltech.com',
      password_hash: hashedPass,
      role: 'FINANCE',
      name: 'finance2', // Explicit name instead of missing Name
      is_active: true,
      is_verified: true
    });

    console.log('Successfully created finance2@globaltech.com with role FINANCE.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }
}

addSecondFinanceUser();
