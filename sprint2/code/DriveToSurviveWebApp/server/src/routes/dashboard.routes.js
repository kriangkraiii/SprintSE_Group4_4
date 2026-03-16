const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

// GET /dashboard/stats — admin dashboard statistics
router.get('/stats', protect, requireAdmin, dashboardController.getStats);

module.exports = router;
