const { Router } = require('express');
const applicationController = require('../controllers/application.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { formLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createApplicationValidation,
  updateStatusValidation,
} = require('../validations/application.validation');

const router = Router({ mergeParams: true });

// ── Public – submit application for a job ─────────────────────────
router.post(
  '/jobs/:jobId/apply',
  formLimiter,
  upload.single('resume'),
  handleMulterError,
  createApplicationValidation,
  validate,
  applicationController.submitApplication
);

// ── Admin routes ──────────────────────────────────────────────────
router.use('/admin', protect, restrictTo('admin', 'superadmin'));

router.get('/admin/applications', applicationController.listApplications);
router.get('/admin/applications/stats', applicationController.getApplicationStats);
// Secure resume download endpoint with JWT authentication (must be before :id route)
router.get('/admin/applications/:id/resume', applicationController.downloadResume);
router.get('/admin/applications/:id', applicationController.getApplication);
router.patch(
  '/admin/applications/:id/status',
  updateStatusValidation,
  validate,
  applicationController.updateApplicationStatus
);
router.delete('/admin/applications/:id', applicationController.deleteApplication);

module.exports = router;
