const express = require('express');
const { protect } = require('../middlewares/auth');
const controller = require('../controllers/noShow.controller');

const router = express.Router();

router.get('/:bookingId/status', protect, controller.getNoShowStatus);
router.post('/:bookingId/execute', protect, controller.executeNoShow);

module.exports = router;
