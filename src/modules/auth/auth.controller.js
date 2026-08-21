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

function renderVerificationHtml({ success, title, message }) {
  const icon = success
    ? `<div style="width: 72px; height: 72px; border-radius: 50%; background-color: #e8f5e9; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>`
    : `<div style="width: 72px; height: 72px; border-radius: 50%; background-color: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AgriEtech</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: linear-gradient(135deg, #f0fdf4 0%, #f4f6f8 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1f2937;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 460px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      background-color: #e8f5e9;
      color: #1b5e20;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #111827;
    }
    p {
      font-size: 15px;
      line-height: 1.5;
      color: #4b5563;
      margin: 0 0 28px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      background-color: #2e7d32;
      color: #ffffff;
      font-weight: 600;
      font-size: 15px;
      padding: 13px 24px;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #1b5e20;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">AgriEtech Early Warning</div>
    ${icon}
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${process.env.FRONTEND_URL || process.env.APP_URL || '/'}" class="btn">${success ? 'Open AgriEtech App' : 'Return to App'}</a>
    <div class="footer">
      AgriEtech Multi-Hazard Platform for Ethiopia &bull; Addis Ababa
    </div>
  </div>
</body>
</html>`;
}

// Verify email address (supports both Browser Link clicks and API JSON calls)
async function verifyEmail(req, res, next) {
  const isBrowserGet = req.method === 'GET' && req.accepts(['html', 'json']) === 'html';
  try {
    const token = req.body?.token || req.query?.token;
    const result = await authService.verifyEmail(token);

    if (isBrowserGet) {
      return res.status(200).send(renderVerificationHtml({
        success: true,
        title: 'Email Verified Successfully!',
        message: result.message || 'Your email address has been verified. You can now access all AgriEtech features.',
      }));
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (isBrowserGet) {
      return res.status(error.statusCode || 400).send(renderVerificationHtml({
        success: false,
        title: 'Verification Link Expired or Invalid',
        message: error.message || 'This verification link is invalid or has expired. Please request a new one.',
      }));
    }
    next(error);
  }
}

// Resend email verification link
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationEmail(email);
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
  resendVerification,
};
