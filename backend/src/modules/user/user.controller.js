const userService = require('./user.service');

class UserController {
  async createUser(req, res, next) {
    try {
      const { name, email, role, manager_id } = req.body;

      if (!name || !email || !role) {
         return res.status(400).json({ success: false, message: 'Name, Email and Role required' });
      }

      const validRoles = ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE', 'CFO'];
      if (!validRoles.includes(role)) {
         return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }

      // Grab executing user_id / company_id via authenticated Token mapping
      const result = await userService.createUser(
        req.user.user_id, 
        req.user.company_id, 
        { name, email, role, manager_id: manager_id === 'none' ? null : manager_id }
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsersByCompany(req.user.company_id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
