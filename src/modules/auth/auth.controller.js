const authService = require('./auth.service');

// Register user endpoint
async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// User login endpoint (Email or Phone)
async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// Refresh access token
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// Logout & blacklist tokens
async function logout(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const { refreshToken } = req.body || {};
    await authService.logoutUser(token, refreshToken);
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
}

// Current user profile
async function getProfile(req, res, next) {
  try {
    const profile = await authService.getUserProfile(req.user?.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

// Update password (authenticated)
async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.updatePassword(req.user?.id, currentPassword, newPassword);
    res.status(200).json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    next(error);
  }
}

// Forgot password - Send reset link to email
async function forgotPassword(req, res, next) {
  try {
    const { email, identifier } = req.body;
    const result = await authService.forgotPassword(email || identifier);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// Reset password with token
async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// Verify email address
async function verifyEmail(req, res, next) {
  try {
    const token = req.body.token || req.query.token;
    const result = await authService.verifyEmail(token);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
