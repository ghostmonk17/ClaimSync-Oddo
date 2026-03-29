const Policy = require('./policy.model');

class PolicyController {
  async getPolicies(req, res, next) {
    try {
      const { company_id } = req.user;
      const policies = await Policy.find({ company_id }).lean();
      return res.status(200).json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  async addPolicy(req, res, next) {
    try {
      const { company_id } = req.user;
      const { category, maxAmount, receiptRequired, violationType } = req.body;
      
      const newPolicy = await Policy.create({
        company_id,
        category,
        maxAmount,
        receiptRequired,
        violationType
      });

      return res.status(201).json({ success: true, message: 'Rule added successfully', data: newPolicy });
    } catch (err) {
      next(err);
    }
  }

  async deletePolicy(req, res, next) {
    try {
      const { company_id } = req.user;
      const { id } = req.params;
      
      await Policy.findOneAndDelete({ _id: id, company_id });
      return res.status(200).json({ success: true, message: 'Rule deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PolicyController();
