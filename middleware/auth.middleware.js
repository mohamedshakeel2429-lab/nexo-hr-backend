const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User.model');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) throw ApiError.unauthorized('Authentication required');

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select('-password -refreshTokens');
  if (!user) throw ApiError.unauthorized('User belonging to this token no longer exists');
  if (!user.isActive) throw ApiError.unauthorized('Your account has been deactivated');

  req.user = user;
  next();
});

const restrictTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  });

module.exports = { protect, restrictTo };
