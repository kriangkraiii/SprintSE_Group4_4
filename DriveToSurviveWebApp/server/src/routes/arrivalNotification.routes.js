const express = require('express');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const controller = require('../controllers/arrivalNotification.controller');
const {
    checkPositionSchema,
    manualTriggerSchema,
} = require('../validations/arrivalNotification.validation');

const router = express.Router();

// POST /arrival-notifications/check — driver sends GPS position
router.post(
    '/check',
    protect,
    validate({ body: checkPositionSchema }),
    controller.checkPosition
);

// POST /arrival-notifications/manual — driver manually triggers arrival
router.post(
    '/manual',
    protect,
    validate({ body: manualTriggerSchema }),
    controller.manualTrigger
);

// GET /arrival-notifications/:bookingId — notification history for booking
router.get(
    '/:bookingId',
    protect,
    controller.getNotifications
);

module.exports = router;
