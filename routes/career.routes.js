const express = require('express');
const { formLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadAnyResume, handleMulterError } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const careerController = require('../controllers/career.controller');
const { submitProfileValidation, updateStatusValidation, addNotesValidation } = require('../validations/career.validation');

const router = express.Router();

// Public route - Submit talent profile
router.post(
  '/submit-profile',
  formLimiter,
  uploadAnyResume.single('resume'),
  handleMulterError,
  submitProfileValidation,
  validate,
  careerController.submitProfile
);

// Protected routes - Admin only
router.use(protect, restrictTo('admin', 'superadmin'));

router.get(
  '/profiles',
  careerController.listProfiles
);

// Secure resume download endpoint with JWT authentication (must be before :id route)
router.get(
  '/profiles/:id/resume',
  careerController.downloadResume
);

router.get(
  '/profiles/:id',
  careerController.getProfile
);

router.patch(
  '/profiles/:id/status',
  updateStatusValidation,
  validate,
  careerController.updateProfileStatus
);

router.patch(
  '/profiles/:id/notes',
  addNotesValidation,
  validate,
  careerController.addAdminNotes
);

router.delete(
  '/profiles/:id',
  careerController.deleteProfile
);

module.exports = router;
