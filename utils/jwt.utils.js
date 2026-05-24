const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired');
    throw ApiError.unauthorized('Invalid access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Refresh token expired');
    throw ApiError.unauthorized('Invalid refresh token');
  }
};

const generateTokenPair = (payload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
