const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const prisma = require('../utils/prisma');

/**
 * Middleware: ผู้ใช้ต้องยืนยันบัตรประชาชน (isVerified) + ใบขับขี่ (driverVerification.status = APPROVED)
 * ใช้สำหรับการสร้าง/แก้ไข/ยกเลิกเส้นทาง (Driver actions)
 */
const requireDriverVerified = asyncHandler(async (req, res, next) => {
    const userId = req.user.sub;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true }
    });

    if (!user || !user.isVerified) {
        throw new ApiError(403, 'คุณต้องยืนยันบัตรประชาชนก่อนจึงจะดำเนินการนี้ได้');
    }

    const dv = await prisma.driverVerification.findUnique({
        where: { userId }
    });
    if (!dv || dv.status !== 'APPROVED') {
        throw new ApiError(403, 'คุณต้องยืนยันตัวตนผู้ขับก่อนจึงจะดำเนินการนี้ได้ (ใบอนุญาตขับขี่ต้องได้รับการอนุมัติ)');
    }
    next();
});

module.exports = requireDriverVerified;