const { Router } = require('express');
const jobController = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createJobValidation,
  updateJobValidation,
  listJobsValidation,
} = require('../validations/job.validation');

const router = Router();

// ── Public routes ──────────────────────────────────────────────────
router.get('/', listJobsValidation, validate, jobController.listPublicJobs);
router.get('/categories', jobController.getJobCategories);
router.get('/:id', jobController.getPublicJob);

// ── Admin routes (protected) ───────────────────────────────────────
router.use('/admin', protect, restrictTo('admin', 'superadmin'));

router.get('/admin/all', listJobsValidation, validate, jobController.listAdminJobs);
router.post('/admin', createJobValidation, validate, jobController.createJob);
router.get('/admin/:id', jobController.getAdminJob);
router.put('/admin/:id', updateJobValidation, validate, jobController.updateJob);
router.delete('/admin/:id', jobController.deleteJob);
router.patch('/admin/:id/status', jobController.toggleJobStatus);

module.exports = router;
