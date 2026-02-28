const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const {
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
} = require('../validations/auth.validation');
const { protect } = require('../middlewares/auth');
const { authLimiter, strictLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// POST /api/auth/login
router.post(
    '/login',
    authLimiter,
    validate({ body: loginSchema }),
    authController.login
);

// PUT /api/auth/change-password
router.put(
    '/change-password',
    protect,
    validate({ body: changePasswordSchema }),
    authController.changePassword
);

// POST /api/auth/forgot-password
router.post(
    '/forgot-password',
    authLimiter,
    validate({ body: forgotPasswordSchema }),
    authController.forgotPassword
);

// POST /api/auth/verify-otp
router.post(
    '/verify-otp',
    strictLimiter,
    validate({ body: verifyOtpSchema }),
    authController.verifyOtp
);

// POST /api/auth/reset-password
router.post(
    '/reset-password',
    strictLimiter,
    validate({ body: resetPasswordSchema }),
    authController.resetPassword
);

module.exports = router;