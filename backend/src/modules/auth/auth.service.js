const mongoose = require('mongoose');
const crypto = require('crypto');
const companyRepository = require('../company/company.repository');
const userRepository = require('../user/user.repository');
const inviteRepository = require('../invite/invite.repository');
const auditService = require('../audit/audit.service');
const { hashPassword, comparePassword } = require('../../utils/password.util');
const { generateToken } = require('../../utils/jwt.util');

class AuthService {
  async signupAdmin(companyData, adminData) {
    try {
      // 1. Validate if admin email strictly exists natively
      const existingUser = await userRepository.findByEmail(adminData.email);
      if (existingUser) {
        throw new Error('Email already exists. Cannot register duplicate users.');
      }

      // 2. Create Company securely
      const company = await companyRepository.create({
        name: companyData.name,
        country: companyData.country,
        base_currency: companyData.base_currency || 'USD'
      });

      // 3. Hash Passwords
      const hashedPass = await hashPassword(adminData.password);

      // 4. Create Admin User
      const adminParams = {
        company_id: company._id,
        name: companyData.name, // Save admin name exactly matching company creator
        email: adminData.email,
        password_hash: hashedPass,
        role: 'ADMIN',
        is_active: true,
        is_verified: true,
      };
      
      const adminUser = await userRepository.create(adminParams);

      // Update Company with created_by
      company.created_by = adminUser._id;
      await company.save();

      // 5. Audit logs mapping
      await auditService.log('User', adminUser._id, 'USER_CREATED', adminUser._id, null, { role: 'ADMIN' });

      // 6. Global JWT Creation
      const token = generateToken({
        user_id: adminUser._id,
        role: adminUser.role,
        company_id: adminUser.company_id
      });

      return {
        token,
        role: adminUser.role,
        company_id: adminUser.company_id
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    // Requires manually grabbing auth mapping containing hashed password
    const user = await userRepository.findWithPasswordByEmail(email);

    if (!user) {
      // Prevent timing attacks by generic failures realistically
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      await auditService.log('User', user._id, 'LOGIN_FAILED', user._id, null, { reason: 'User not active' });
      throw new Error('User is not active. Please complete the invite flow to set your password.');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      await auditService.log('User', user._id, 'LOGIN_FAILED', user._id, null, { reason: 'Invalid password' });
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      user_id: user._id,
      role: user.role,
      company_id: user.company_id
    });

    await auditService.log('User', user._id, 'LOGIN_SUCCESS', user._id, null, { role: user.role });

    return { token, role: user.role };
  }

  async setPassword(tokenParam, password) {
    try {
      const invite = await inviteRepository.findByToken(tokenParam);

      if (!invite) throw new Error('Invalid invite token');
      if (invite.is_used) throw new Error('Invite token has already been used');
      const now = new Date();
      if (now > invite.expires_at) throw new Error('Invite token has expired');

      const user = await userRepository.findById(invite.user_id);
      if (!user) throw new Error('User associated with this invite not found');
      if (user.is_active) throw new Error('User is already active');

      // Hash password
      const hashedPass = await hashPassword(password);

      // Update user exactly
      await userRepository.updateById(user._id, {
        password_hash: hashedPass,
        is_active: true,
        is_verified: true
      });

      // Mark token strictly used natively
      await inviteRepository.markAsUsed(invite._id);

      // Audit correctly mapping logic
      await auditService.log('User', user._id, 'PASSWORD_SET', user._id, null, null);

      return { success: true, message: 'Password set successfully. You can now login.' };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    // Requires strict matching natively manually bypassing abstraction for hash check
    const userWithHash = await userRepository.findWithPasswordByEmail(user.email);
    
    const isMatch = await comparePassword(currentPassword, userWithHash.password_hash);
    if (!isMatch) throw new Error('Invalid current password');

    const hashedNewPass = await hashPassword(newPassword);

    await userRepository.updateById(userId, { password_hash: hashedNewPass });
    await auditService.log('User', userId, 'PASSWORD_CHANGED', userId, null, null);
    return { success: true };
  }

  async getMe(userId) {
    const user = await userRepository.findByIdPopulated(userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}

module.exports = new AuthService();
