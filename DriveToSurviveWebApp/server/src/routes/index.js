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
// Sprint 2
const reviewRoutes = require('./review.routes');
const arrivalNotificationRoutes = require('./arrivalNotification.routes');
const chatRoutes = require('./chat.routes');
const noShowRoutes = require('./noShow.routes');
const adminSprint2Routes = require('./adminSprint2.routes');
const placeRoutes = require('./place.routes');
const geoRoutes = require('./geo.routes');
const dashboardRoutes = require('./dashboard.routes');
const securityConfigRoutes = require('./securityConfig.routes');
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
// Sprint 2
router.use('/reviews', reviewRoutes);
router.use('/arrival-notifications', arrivalNotificationRoutes);
router.use('/chat', chatRoutes);
router.use('/no-show', noShowRoutes);
router.use('/admin', adminSprint2Routes);
router.use('/places', placeRoutes);
router.use('/geo', geoRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/security-config', securityConfigRoutes);


module.exports = router;