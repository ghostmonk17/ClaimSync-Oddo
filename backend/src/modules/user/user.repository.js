const User = require('./user.model');

class UserRepository {
  async create(userData, session = null) {
    const user = new User(userData);
    return user.save({ session });
  }

  async findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async findById(id) {
    return User.findById(id).lean();
  }

  async findByIdPopulated(id) {
    return User.findById(id)
      .populate('company_id', 'name country base_currency')
      .populate('manager_id', 'name email role')
      .lean();
  }

  async updateById(id, updateData, session = null) {
    return User.findByIdAndUpdate(id, updateData, { new: true, session }).lean();
  }

  async findWithPasswordByEmail(email) {
    return User.findOne({ email }).select('+password_hash').lean();
  }

  async findByCompany(companyId) {
    return User.find({ company_id: companyId })
      .populate('manager_id', 'name email')
      .lean();
  }

  async findActiveByRoleAndCompany(role, companyId) {
    // Simple load balancer: pulls an active user. You could expand this 
    // to aggregate and count active approvals for true load balancing later.
    return User.findOne({ role, company_id: companyId, is_active: true }).lean();
  }
}

module.exports = new UserRepository();
