const authService = require('./auth.service');

class AuthController {
  async signupAdmin(req, res, next) {
    try {
      const { name, country, base_currency, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const result = await authService.signupAdmin(
        { name, country, base_currency },
        { email, password }
      );

      return res.status(201).json({
        success: true,
        message: 'Admin and Company created successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }

      const result = await authService.login(email, password);
      
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async setPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and password required' });
      }

      const result = await authService.setPassword(token, password);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both passwords required' });
      }

      await authService.changePassword(req.user.user_id, currentPassword, newPassword);

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getMe(req.user.user_id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
