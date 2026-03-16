const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const prisma = require('../utils/prisma');

/**
 * Middleware: ผู้ใช้ต้องยืนยันบัตรประชาชนแล้ว (isVerified = true)
 * ใช้สำหรับการจองเส้นทาง (Passenger actions)
 */
const requireIdVerified = asyncHandler(async (req, res, next) => {
    const userId = req.user.sub;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true }
    });
    if (!user || !user.isVerified) {
        throw new ApiError(403, 'คุณต้องยืนยันบัตรประชาชนก่อนจึงจะดำเนินการนี้ได้');
    }
    next();
});

module.exports = requireIdVerified;
