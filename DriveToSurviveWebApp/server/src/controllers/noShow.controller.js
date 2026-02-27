const asyncHandler = require('express-async-handler');
const noShowService = require('../services/noShow.service');

const getNoShowStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const result = await noShowService.getNoShowStatus(bookingId);
    res.json(result);
});

const executeNoShow = asyncHandler(async (req, res) => {
    const driverId = req.user.sub;
    const { bookingId } = req.params;
    const result = await noShowService.executeNoShow(bookingId, driverId);
    res.json({ message: 'No-Show executed', booking: result });
});

module.exports = { getNoShowStatus, executeNoShow };
