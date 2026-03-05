const asyncHandler = require('express-async-handler');
const arrivalService = require('../services/arrivalNotification.service');

const checkPosition = asyncHandler(async (req, res) => {
    const driverId = req.user.sub;
    const { bookingId, lat, lon } = req.body;
    const result = await arrivalService.checkAndNotify(bookingId, lat, lon);
    res.status(200).json({ success: true, data: result });
});

const manualTrigger = asyncHandler(async (req, res) => {
    const driverId = req.user.sub;
    const { bookingId } = req.body;
    const result = await arrivalService.manualTrigger(bookingId, driverId);
    res.status(200).json({ success: true, data: result });
});

const getNotifications = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const result = await arrivalService.getNotificationsByBooking(bookingId);
    res.status(200).json({ success: true, data: result });
});

module.exports = {
    checkPosition,
    manualTrigger,
    getNotifications,
};
