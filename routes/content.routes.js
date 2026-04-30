const { Router } = require('express');
const contentController = require('../controllers/content.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const router = Router();

// ── Public – read-only content ────────────────────────────────────
router.get('/', contentController.getAllContent);
router.get('/:key', contentController.getContent);

// ── Admin ─────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

router.put(
  '/:key',
  [
    body('data').notEmpty().withMessage('Content data is required'),
    body('label').optional().isString(),
  ],
  validate,
  contentController.upsertContent
);

router.delete('/:key', restrictTo('superadmin'), contentController.deleteContent);

module.exports = router;
