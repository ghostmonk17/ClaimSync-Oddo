const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../../.env' });
const authService = require('../modules/auth/auth.service');
const { hashPassword } = require('../utils/password.util');
const User = require('../modules/user/user.model');
const Company = require('../modules/company/company.model');

async function seedDatabase() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/claimsync';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing users and companies...');
    await User.deleteMany({});
    await Company.deleteMany({});

    console.log('Creating Enterprise Company (Global Tech Corp) via signupAdmin...');
    const result = await authService.signupAdmin(
      { name: 'Global Tech Corp', country: 'US', base_currency: 'USD' },
      { email: 'ceo@globaltech.com', password: 'EnterprisePassword123!' }
    );
    
    const companyId = result.company_id;
    console.log(`Company ID: ${companyId}, Admin established.`);

    const hashedPass = await hashPassword('EnterprisePassword123!');

    console.log('Seeding Structural Enterprise User Hierarchy...');
    
    // 1. Create CFO (Level 4 - Top Approver)
    const cfo = await User.create({
      company_id: companyId,
      name: 'Chief Financial Officer',
      email: 'cfo@globaltech.com',
      password_hash: hashedPass,
      role: 'CFO',
      is_active: true,
      is_verified: true
    });

    // 2. Create Finance Manager (Level 3 - Policy Auditor)
    const finance = await User.create({
      company_id: companyId,
      name: 'Finance Compliance',
      email: 'finance@globaltech.com',
      password_hash: hashedPass,
      role: 'FINANCE',
      is_active: true,
      is_verified: true
    });

    // 3. Create General Manager (Level 2 - Direct Approver)
    const manager = await User.create({
      company_id: companyId,
      name: 'Regional Manager',
      email: 'manager@globaltech.com',
      password_hash: hashedPass,
      role: 'MANAGER',
      is_active: true,
      is_verified: true,
      manager_id: finance._id // Escalates to Finance if needed
    });

    // 4. Create Employee (Level 1 - Individual Contributor)
    const employee = await User.create({
      company_id: companyId,
      name: 'John Employee',
      email: 'employee@globaltech.com',
      password_hash: hashedPass,
      role: 'EMPLOYEE',
      is_active: true,
      is_verified: true,
      manager_id: manager._id // Reports to Manager
    });

    console.log('Seeding completed! Hierarchy: Employee -> Manager -> Finance -> CFO');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
