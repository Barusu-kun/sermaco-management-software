// src/modules/auth/auth.controller.js
const authService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { code_id, codeId, password } = req.body;
      const result = await authService.login(code_id || codeId, password);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async driverLogin(req, res, next) {
    try {
      const { code_id, codeId, pin_code, pinCode } = req.body;
      const result = await authService.driverLogin(code_id || codeId, pin_code ?? pinCode);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res) {
    res.json({ success: true, user: req.user });
  }
}

module.exports = new AuthController();
