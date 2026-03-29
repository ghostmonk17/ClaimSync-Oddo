const Expense = require('./expense.model');

class ExpenseRepository {
  async create(data, session = null) {
    const expense = new Expense(data);
    return expense.save({ session });
  }

  async findById(id) {
    return Expense.findById(id).lean();
  }

  async findByIdAndUpdate(id, updateData, session = null) {
    return Expense.findByIdAndUpdate(
      id,
      { ...updateData, $inc: { version: 1 } },
      { new: true, session }
    ).lean();
  }

  async findActiveById(id) {
    return Expense.findOne({ _id: id, is_deleted: false }).lean();
  }
  async findByUserIdAndDateRange(userId, start, end) {
    return Expense.find({
      user_id: userId,
      date: { $gte: start, $lte: end }
    }).lean();
  }

  async findByUserId(userId) {
    return Expense.find({ user_id: userId }).sort({ created_at: -1 }).lean();
  }
}

module.exports = new ExpenseRepository();
