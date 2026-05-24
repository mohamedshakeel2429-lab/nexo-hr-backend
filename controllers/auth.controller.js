const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt.utils');
const { sendPasswordResetEmail } = require('../services/email.service');
const User = require('../models/User.model');
const logger = require('../utils/logger');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

const setTokenCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTS);
  res.clearCookie('refreshToken', COOKIE_OPTS);
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');

  const payload = { id: user._id, role: user.role };
  const tokens = generateTokenPair(payload);

  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, tokens);

  logger.info(`Admin login: ${email}`);

  ApiResponse.ok(res, {
    user: user.toSafeObject(),
    accessToken: tokens.accessToken,
  }, 'Login successful');
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token && req.user) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== token);
      await user.save({ validateBeforeSave: false });
    }
  }

  clearTokenCookies(res);
  ApiResponse.ok(res, null, 'Logged out successfully');
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token required');

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) throw ApiError.unauthorized('User not found');
  if (!user.isActive) throw ApiError.unauthorized('Account deactivated');

  if (!user.refreshTokens?.includes(token)) {
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized('Refresh token reuse detected – all sessions invalidated');
  }

  const payload = { id: user._id, role: user.role };
  const tokens = generateTokenPair(payload);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token).concat(tokens.refreshToken);
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, tokens);
  ApiResponse.ok(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

exports.getMe = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, { user: req.user.toSafeObject() });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return ApiResponse.ok(res, null, 'If that email exists, a reset link has been sent');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl });
    ApiResponse.ok(res, null, 'Password reset email sent');
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal('Could not send reset email. Please try again.');
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+refreshTokens');

  if (!user) throw ApiError.badRequest('Token is invalid or has expired');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  clearTokenCookies(res);
  ApiResponse.ok(res, null, 'Password reset successfully. Please log in again.');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  user.refreshTokens = [];
  await user.save();

  clearTokenCookies(res);
  ApiResponse.ok(res, null, 'Password changed. Please log in again.');
});
