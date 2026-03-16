const prisma = require('../utils/prisma');

const searchVerifications = async (opts = {}) => {
  const {
    page = 1,
    limit = 20,
    q,
    status,
    typeOnLicense,
    createdFrom, createdTo,
    issueFrom, issueTo,
    expiryFrom, expiryTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = opts;

  const where = {
    ...(status && { status }),
    ...(typeOnLicense && { typeOnLicense }),
    ...((createdFrom || createdTo) ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      }
    } : {}),
    ...((issueFrom || issueTo) ? {
      licenseIssueDate: {
        ...(issueFrom ? { gte: new Date(issueFrom) } : {}),
        ...(issueTo ? { lte: new Date(issueTo) } : {}),
      }
    } : {}),
    ...((expiryFrom || expiryTo) ? {
      licenseExpiryDate: {
        ...(expiryFrom ? { gte: new Date(expiryFrom) } : {}),
        ...(expiryTo ? { lte: new Date(expiryTo) } : {}),
      }
    } : {}),
    ...(q ? {
      OR: [
        { licenseNumber: { contains: q } },
        {
          user: {
            is: {
              OR: [
                { email: { contains: q } },
                { username: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { phoneNumber: { contains: q } },
              ]
            }
          }
        }
      ]
    } : {}),
  };

  const _page = Number(page) || 1;
  const _limit = Number(limit) || 20;
  const skip = (_page - 1) * _limit;
  const take = _limit;

  const [total, data] = await prisma.$transaction([
    prisma.driverVerification.count({ where }),
    prisma.driverVerification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      include: {
        user: {
          select: {
            id: true, email: true, username: true,
            firstName: true, lastName: true, phoneNumber: true,
            role: true, isVerified: true, isActive: true,
          }
        }
      }
    })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};

const getVerificationByUser = async (userId) => {
  return prisma.driverVerification.findUnique({
    where: { userId },
    include: { user: true },
  });
};

const getAllVerifications = async () => {
  return prisma.driverVerification.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getVerificationById = async (id) => {
  return prisma.driverVerification.findUnique({
    where: { id },
    include: { user: true },
  });
};

const createVerification = async (data) => {
  const existing = await getVerificationByUser(data.userId)
  if (existing) {
    return updateVerification(existing.id, data)
  }

  // ระบบอัตโนมัติ — อนุมัติทันทีโดยไม่ต้องรอแอดมิน
  // ไม่เปลี่ยน role — ผู้ใช้สามารถเป็นทั้ง passenger และ driver ได้
  return prisma.$transaction(async (tx) => {
    const record = await tx.driverVerification.create({
      data: { ...data, status: 'APPROVED' },
      include: { user: true },
    });

    // อนุมัติอัตโนมัติ → ยืนยันตัวตน (isVerified = true)
    await tx.user.update({
      where: { id: data.userId },
      data: { isVerified: true },
    });

    return record;
  });
};

const updateVerification = async (id, data) => {
  // ระบบอัตโนมัติ — อนุมัติทันทีโดยไม่ต้องรอแอดมิน
  const updatePayload = {
    ...data,
    status: 'APPROVED'
  };
  return prisma.$transaction(async (tx) => {
    const record = await tx.driverVerification.update({
      where: { id },
      data: updatePayload,
      include: { user: true },
    });

    // อนุมัติอัตโนมัติ → ยืนยันตัวตน (isVerified = true)
    await tx.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    });

    return record;
  });
};

const updateVerificationByAdmin = async (id, data) => {
  return prisma.driverVerification.update({
    where: { id },
    data,
    include: { user: true },
  });
};

const deleteVerificationByAdmin = async (id) => {
  return prisma.$transaction(async (tx) => {
    // หา record ก่อน ถ้าไม่เจอ ให้รีเทิร์น null ไปให้ controller ตัดสินใจ 404
    const existing = await tx.driverVerification.findUnique({ where: { id } });
    if (!existing) return null;

    // ยกเลิก route ที่ยัง AVAILABLE ของ user นี้ (ถ้ามี)
    await tx.route.updateMany({
      where: { driverId: existing.userId, status: 'AVAILABLE' },
      data: { status: 'CANCELLED' },
    });

    // ลบ verification record (ไม่เปลี่ยน role/isVerified — ผู้ใช้ยังคงใช้งานเป็น passenger ได้)
    await tx.driverVerification.delete({ where: { id } });

    return true;
  });
};

const updateVerificationStatus = async (id, status) => {
  return prisma.$transaction(async (tx) => {
    const verification = await tx.driverVerification.update({
      where: { id },
      data: { status },
    });

    if (status === 'APPROVED') {
      // อนุมัติใบขับขี่แล้ว → ยืนยันตัวตนอัตโนมัติ (isVerified = true)
      await tx.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });
    } else if (status === 'REJECTED') {
      // ยกเลิก route ที่ยัง AVAILABLE ของ user นี้
      await tx.route.updateMany({
        where: {
          driverId: verification.userId,
          status: 'AVAILABLE',
        },
        data: {
          status: 'CANCELLED',
        },
      });
    }
    return verification;
  });
};

const canCreateRoutes = async (userId) => {
  // ตรวจสอบว่า user ยืนยันบัตรประชาชนแล้ว (isVerified = true)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVerified: true },
  });
  if (!user || !user.isVerified) return false;

  // ตรวจสอบว่ามี driverVerification ที่ APPROVED
  const rec = await prisma.driverVerification.findUnique({
    where: { userId },
    select: { status: true },
  });
  return rec?.status === 'APPROVED';
};

const createVerificationByAdmin = async (data) => {
  const existing = await getVerificationByUser(data.userId);
  if (existing) {
    return updateVerificationByAdmin(existing.id, data);
  }

  // ไม่เปลี่ยน role — ผู้ใช้สามารถเป็นทั้ง passenger และ driver ได้
  return prisma.driverVerification.create({ data });
};

const createVerificationAutoApproved = async (data) => {
  return prisma.$transaction(async (tx) => {
    let record;
    const existing = await getVerificationByUser(data.userId);
    if (existing) {
      record = await tx.driverVerification.update({
        where: { id: existing.id },
        data: { ...data, status: 'APPROVED' },
        include: { user: true },
      });
    } else {
      record = await tx.driverVerification.create({
        data: { ...data, status: 'APPROVED' },
        include: { user: true },
      });
    }

    // OCR อนุมัติอัตโนมัติ → ยืนยันตัวตนอัตโนมัติ (isVerified = true)
    await tx.user.update({
      where: { id: data.userId },
      data: { isVerified: true },
    });

    return record;
  });
};

module.exports = {
  searchVerifications,
  getVerificationByUser,
  getAllVerifications,
  getVerificationById,
  createVerification,
  updateVerification,
  updateVerificationStatus,
  canCreateRoutes,
  updateVerificationByAdmin,
  createVerificationByAdmin,
  createVerificationAutoApproved,
  deleteVerificationByAdmin,
};
