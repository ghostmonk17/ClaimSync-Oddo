const Company = require('./company.model');

class CompanyController {
  async getCompany(req, res, next) {
    try {
      const { company_id } = req.user;
      const company = await Company.findById(company_id).lean();
      if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
      return res.status(200).json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const { company_id } = req.user;
      const { name, country, base_currency } = req.body;
      
      const updated = await Company.findByIdAndUpdate(
        company_id, 
        { name, country, base_currency },
        { new: true }
      ).lean();

      if (!updated) return res.status(404).json({ success: false, message: 'Company not found' });

      return res.status(200).json({ success: true, message: 'Company updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CompanyController();
