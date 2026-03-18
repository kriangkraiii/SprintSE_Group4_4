const prisma = require("../utils/prisma");
const ApiError = require("../utils/ApiError");

const baseOrder = { createdAt: "desc" };

const buildVehicleWhere = (opts = {}) => {
  const {
    q,
    vehicleType,
    color,
    isDefault,
    seatMin,
    seatMax,
    amenitiesAny,
    amenitiesAll,
    userId,
  } = opts;

  return {
    ...(userId && { userId }),
    ...(vehicleType && {
      vehicleType: { contains: vehicleType },
    }),
    ...(color && { color: { contains: color } }),
    ...(typeof isDefault === "boolean" ? { isDefault } : {}),
    ...(typeof seatMin === "number" || typeof seatMax === "number"
      ? {
        seatCapacity: {
          ...(typeof seatMin === "number" ? { gte: seatMin } : {}),
          ...(typeof seatMax === "number" ? { lte: seatMax } : {}),
        },
      }
      : {}),
    // MySQL: ใช้ relation query แทน hasSome/hasEvery
    ...(amenitiesAny && amenitiesAny.length
      ? { amenities: { some: { name: { in: amenitiesAny } } } }
      : {}),
    ...(amenitiesAll && amenitiesAll.length
      ? { AND: amenitiesAll.map(a => ({ amenities: { some: { name: a } } })) }
      : {}),
    ...(q
      ? {
        OR: [
          { vehicleModel: { contains: q } },
          { vehicleType: { contains: q } },
          { color: { contains: q } },
          { licensePlate: { contains: q } },
        ],
      }
      : {}),
  };
};

const searchMyVehicles = async (ownerId, opts) => {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = opts || {};
  const where = buildVehicleWhere({ ...filters, userId: ownerId });

  const _page = Number(page) || 1;
  const _limit = Number(limit) || 20;
  const skip = (_page - 1) * _limit,
    take = _limit;

  const [total, data] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      include: { amenities: true },
    }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const searchVehiclesAdmin = async (opts) => {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = opts || {};
  const where = buildVehicleWhere(filters);
  const _page = Number(page) || 1;
  const _limit = Number(limit) || 20;
  const skip = (_page - 1) * _limit,
    take = _limit;

  const [total, data] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      include: {
        amenities: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getAllVehicles = async (userId) => {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { amenities: true },
  });
};

const getVehicleById = async (vehicleId, userId) => {
  const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!v || v.userId !== userId) {
    throw new ApiError(404, "Vehicle not found or access denied");
  }
  return v;
};

const createVehicle = async (data, userId) => {
  if (data.isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
  const { amenities, ...vehicleData } = data;
  return prisma.vehicle.create({
    data: {
      ...vehicleData,
      userId,
      amenities: amenities?.length
        ? { create: amenities.map(name => ({ name })) }
        : undefined,
    },
    include: { amenities: true },
  });
};

const updateVehicle = async (vehicleId, userId, updateData) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing || existing.userId !== userId) {
      throw new ApiError(404, "Vehicle not found or access denied");
    }

    if (updateData.isDefault === true && !existing.isDefault) {
      await tx.vehicle.updateMany({
        where: { userId, isDefault: true, NOT: { id: vehicleId } },
        data: { isDefault: false },
      });
    }

    const { amenities, ...scalarData } = updateData;

    if (amenities !== undefined) {
      await tx.vehicleAmenity.deleteMany({ where: { vehicleId } });
      if (Array.isArray(amenities) && amenities.length > 0) {
        await tx.vehicleAmenity.createMany({
          data: amenities.map(name => ({ vehicleId, name })),
        });
      }
    }

    const updated = await tx.vehicle.update({
      where: { id: vehicleId },
      data: { ...scalarData, userId },
      include: { amenities: true },
    });

    return updated;
  });
};

const deleteVehicle = async (vehicleId, userId) => {
  const existingVehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!existingVehicle) {
    throw new ApiError(404, "Vehicle not found or access denied");
  }

  return prisma.$transaction(async (tx) => {
    await tx.vehicleAmenity.deleteMany({ where: { vehicleId } });
    await tx.vehicle.delete({ where: { id: vehicleId } });
    return { id: vehicleId };
  });
};

const setDefaultVehicle = async (vehicleId, userId) => {
  const vehicleToSetDefault = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!vehicleToSetDefault) {
    throw new Error("Vehicle not found or access denied");
  }

  if (vehicleToSetDefault.isDefault) {
    return vehicleToSetDefault;
  }

  return prisma.$transaction(async (tx) => {
    await tx.vehicle.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    const updatedVehicle = await tx.vehicle.update({
      where: { id: vehicleId },
      data: { isDefault: true },
    });
    return updatedVehicle;
  });
};

const getVehicleByIdAdmin = async (vehicleId) => {
  const v = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
        },
      },
    },
  });
  if (!v) throw new ApiError(404, "Vehicle not found");
  return v;
};

const updateVehicleByAdmin = async (vehicleId, updateData) => {
  const existing = await getVehicleByIdAdmin(vehicleId);

  const targetUserId = updateData.userId ?? existing.userId;

  return prisma.$transaction(async (tx) => {
    // ถ้าจะตั้ง default ให้คันนี้ → reset คันอื่นของเจ้าของเป้าหมาย
    if (updateData.isDefault === true) {
      await tx.vehicle.updateMany({
        where: {
          userId: targetUserId,
          isDefault: true,
          NOT: { id: vehicleId },
        },
        data: { isDefault: false },
      });
    }

    const updated = await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...updateData,
        userId: targetUserId,
      },
    });

    return updated;
  });
};

const deleteVehicleByAdmin = async (vehicleId) => {
  await getVehicleByIdAdmin(vehicleId);
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return { id: vehicleId };
};

module.exports = {
  searchMyVehicles,
  searchVehiclesAdmin,
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
  getVehicleByIdAdmin,
  updateVehicleByAdmin,
  deleteVehicleByAdmin,
};
