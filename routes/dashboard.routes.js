const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = Router();

router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
