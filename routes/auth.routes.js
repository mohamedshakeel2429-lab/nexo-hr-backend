const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../validations/auth.validation');

const router = Router();

router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.patch('/reset-password/:token', resetPasswordValidation, validate, authController.resetPassword);
router.patch('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
