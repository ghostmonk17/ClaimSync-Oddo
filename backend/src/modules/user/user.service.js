const mongoose = require('mongoose');
const crypto = require('crypto');
const userRepository = require('./user.repository');
const inviteRepository = require('../invite/invite.repository');
const auditService = require('../audit/audit.service');

class UserService {
  async createUser(adminId, companyId, payload) {
    try {
      const { name, email, role, manager_id } = payload;

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('Duplicate email: user already exists.');
      }

      // Optional: Admin bounds enforcing roles
      const userPayload = {
        company_id: companyId,
        name: name,
        email: email,
        password_hash: null, // Null temporarily until configured locally
        role: role,
        is_active: false,
        is_verified: false,
        manager_id: manager_id || null,
        created_by: adminId
      };

      const newUser = await userRepository.create(userPayload);

      // Generating unique cryptographic JWT UUID implicitly equivalent securely
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24-hours TTL rule

      const invitePayload = {
        email: email,
        user_id: newUser._id,
        token: inviteToken,
        expires_at: expiresAt
      };

      await inviteRepository.create(invitePayload);

      await auditService.log(
        'User', 
        newUser._id, 
        'USER_CREATED', 
        adminId, 
        null, 
        { role: role, manager_id }
      );
      
      await auditService.log(
        'Invite', 
        newUser._id, 
        'INVITE_SENT', 
        adminId, 
        null, 
        { email: email }
      );

      // Mail sending code placeholder securely decoupled
      // await mailService.sendInviteEmail(email, inviteToken);

      return {
        success: true,
        message: 'User created identically and invite generated securely.',
        // Returning token globally to console log during testing since mail logic isn't explicitly executed
        __test_invite_token: inviteToken 
      };

    } catch (err) {
      throw err;
    }
  }

  async getUserSummary(userId) {
     const user = await userRepository.findById(userId);
     if (!user) throw new Error('User not found');
     return {
        user_id: user._id,
        role: user.role,
        company_id: user.company_id
     };
  }

  async getUsersByCompany(companyId) {
    return userRepository.findByCompany(companyId);
  }
}

module.exports = new UserService();
