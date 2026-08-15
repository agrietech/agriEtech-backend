const authService = require('./auth.service');

// Register user endpoint
async function register(req, res, next) {
  try {
    const { name, phone, email, password, role, woredaId } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }
    const user = await authService.registerUser({ name, phone, email, password, role, woredaId });
    const token = authService.generateToken({ id: user.id, role: user.role, phone: user.phone });
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
}

// User login endpoint
async function login(req, res, _next) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }
    const result = await authService.loginUser({ phone, password });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
}

// Current user profile
async function getProfile(req, res, next) {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
