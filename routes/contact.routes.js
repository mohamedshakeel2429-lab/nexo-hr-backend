const { Router } = require('express');
const contactController = require('../controllers/contact.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { formLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createContactValidation,
  updateStatusValidation,
} = require('../validations/contact.validation');

const router = Router();

// ── Public ────────────────────────────────────────────────────────
router.post('/', formLimiter, createContactValidation, validate, contactController.submitContact);

// ── Admin ─────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/admin', contactController.listContacts);
router.get('/admin/stats', contactController.getContactStats);
router.get('/admin/:id', contactController.getContact);
router.patch('/admin/:id/status', updateStatusValidation, validate, contactController.updateContactStatus);

module.exports = router;
