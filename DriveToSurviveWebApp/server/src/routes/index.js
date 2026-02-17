const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const routeRoutes = require('./route.routes');
const driverVerifRoutes = require('./driverVerification.routes');
const bookingRoutes = require('./booking.routes');
const notificationRoutes = require('./notification.routes')
const mapRoutes = require('./maps.routes')
const systemLogRoutes = require('./systemLog.routes');
const blacklistRoutes = require('./blacklist.routes');
const iappRoutes = require('./iapp.routes');
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/routes', routeRoutes);
router.use('/driver-verifications', driverVerifRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/api/maps', mapRoutes);
router.use('/system-logs', systemLogRoutes);
router.use('/blacklist', blacklistRoutes);
router.use('/ocr', iappRoutes);


module.exports = router;