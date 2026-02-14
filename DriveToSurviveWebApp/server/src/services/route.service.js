const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const { RouteStatus, BookingStatus } = require('@prisma/client');
const { checkAndApplyDriverSuspension } = require('./penalty.service');

const baseInclude = {
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      profilePicture: true,
      isVerified: true
    }
  },
  vehicle: {
    select: {
      vehicleModel: true,
      vehicleType: true,
      photos: true,
      amenities: true
    }
  }
};

const getAllRoutes = async () => {
  return prisma.route.findMany({
    include: baseInclude,
    orderBy: { createdAt: 'desc' }
  });
};

const searchRoutes = async (opts) => {
  const { startNearLat, startNearLng, endNearLat, endNearLng } = opts || {};
  const hasStart = typeof startNearLat === 'number' && typeof startNearLng === 'number';
  const hasEnd = typeof endNearLat === 'number' && typeof endNearLng === 'number';

  if (hasStart || hasEnd) {
    return searchRoutesByEndpointProximity(opts);
  }

  const {
    page = 1,
    limit = 20,
    q,
    status,
    driverId,
    vehicleId,
    startName,
    endName,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',

    seatsRequired,
  } = opts || {};

  // รวม startName / endName เข้ากับ q เพื่อค้นหาใน routeSummary (ซึ่งมีชื่อสถานที่ต้นทาง-ปลายทาง)
  const searchText = [q, startName, endName].filter(Boolean).join(' ') || undefined;

  const where = {
    ...(status && { status }),
    ...(driverId && { driverId }),
    ...(vehicleId && { vehicleId }),
    ...(dateFrom || dateTo ? {
      departureTime: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    } : {}),
    ...(typeof seatsRequired === 'number' ? { availableSeats: seatsRequired } : {}),
    ...(searchText ? {
      OR: [
        { routeSummary: { contains: searchText } },
        { conditions: { contains: searchText } },
        {
          driver: {
            is: {
              OR: [
                { firstName: { contains: searchText } },
                { lastName: { contains: searchText } },
              ]
            }
          }
        },
        {
          vehicle: {
            is: {
              OR: [
                { vehicleModel: { contains: searchText } },
                { vehicleType: { contains: searchText } },
                { licensePlate: { contains: searchText } },
              ]
            }
          }
        },
      ]
    } : {}),
  };

  const _page = Number(page) || 1;
  const _limit = Number(limit) || 20;
  const skip = (_page - 1) * _limit;
  const take = _limit;

  const [total, data] = await prisma.$transaction([
    prisma.route.count({ where }),
    prisma.route.findMany({
      where,
      include: baseInclude,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
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

const searchRoutesByEndpointProximity = async (opts = {}) => {

  const {
    page = 1, limit = 20,
    startNearLat, startNearLng,
    endNearLat, endNearLng,
    radiusMeters = 500,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = opts;

  const offset = (page - 1) * limit;

  // ป้องกัน SQLi: อนุญาตเฉพาะฟิลด์ที่กำหนด
  const allowedSortFields = ['createdAt', 'departureTime', 'pricePerSeat', 'availableSeats'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = (sortOrder || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

  // แปลง undefined -> null เพื่อให้ bind เป็น NULL (ใช้ใน CTE params)
  const sLat = startNearLat ?? null;
  const sLng = startNearLng ?? null;
  const eLat = endNearLat ?? null;
  const eLng = endNearLng ?? null;

  // เลือกเฉพาะ id ก่อน เพื่อทำ include รอบสอง
  // ใช้ Haversine (เป็นเมตร) กับ lat/lng ที่ดึงจาก JSON
  // MySQL: ใช้ JSON_UNQUOTE + JSON_EXTRACT แทน ->> และ CAST แทน ::float
  const idsRows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT r.id
      FROM Route r
      WHERE
        (
          ${sLat} IS NULL OR ${sLng} IS NULL OR
          6371000 * ACOS(LEAST(1,
            COS(RADIANS(${sLat})) * COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lat')) AS DOUBLE))) *
            COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lng')) AS DOUBLE)) - RADIANS(${sLng})) +
            SIN(RADIANS(${sLat})) * SIN(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lat')) AS DOUBLE)))
          )) <= ${radiusMeters}
        )
        AND
        (
          ${eLat} IS NULL OR ${eLng} IS NULL OR
          6371000 * ACOS(LEAST(1,
            COS(RADIANS(${eLat})) * COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lat')) AS DOUBLE))) *
            COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lng')) AS DOUBLE)) - RADIANS(${eLng})) +
            SIN(RADIANS(${eLat})) * SIN(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lat')) AS DOUBLE)))
          )) <= ${radiusMeters}
        )
      ORDER BY ${Prisma.raw(`r.\`${sortField}\``)} ${Prisma.raw(sortDir)}
      LIMIT ${limit} OFFSET ${offset}
    `
  );

  const idList = idsRows.map(r => r.id);

  const totalRows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT CAST(COUNT(*) AS UNSIGNED) AS cnt
      FROM Route r
      WHERE
        (
          ${sLat} IS NULL OR ${sLng} IS NULL OR
          6371000 * ACOS(LEAST(1,
            COS(RADIANS(${sLat})) * COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lat')) AS DOUBLE))) *
            COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lng')) AS DOUBLE)) - RADIANS(${sLng})) +
            SIN(RADIANS(${sLat})) * SIN(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.startLocation, '$.lat')) AS DOUBLE)))
          )) <= ${radiusMeters}
        )
        AND
        (
          ${eLat} IS NULL OR ${eLng} IS NULL OR
          6371000 * ACOS(LEAST(1,
            COS(RADIANS(${eLat})) * COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lat')) AS DOUBLE))) *
            COS(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lng')) AS DOUBLE)) - RADIANS(${eLng})) +
            SIN(RADIANS(${eLat})) * SIN(RADIANS(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.endLocation, '$.lat')) AS DOUBLE)))
          )) <= ${radiusMeters}
        )
    `
  );
  const total = Number(totalRows?.[0]?.cnt) || 0;

  // ดึงรายละเอียดพร้อม include ตาม id ที่คัดแล้ว
  const data = idList.length
    ? await prisma.route.findMany({
      where: { id: { in: idList } },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, gender: true, profilePicture: true, isVerified: true } },
        vehicle: { select: { vehicleModel: true, vehicleType: true, photos: true, amenities: true } },
      },
    })
    : [];

  // รักษา order ให้ตรงกับ idList
  const orderMap = new Map(idList.map((id, i) => [id, i]));
  data.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getRouteById = async (id) => {
  return prisma.route.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          }
        }
      },
      ...baseInclude
    },
  });
};

const getMyRoutes = async (driverId) => {
  return prisma.route.findMany({
    where: {
      driverId
    },
    include: {

      bookings: {
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              isVerified: true,
              email: true
            }
          }
        }
      },
      ...baseInclude
    },

    orderBy: { createdAt: 'desc' },
  })
}

const createRoute = async (data) => {
  return prisma.route.create({ data });
};

const updateRoute = async (id, data) => {
  return prisma.route.update({
    where: { id },
    data
  });
};

const deleteRoute = async (id) => {
  await prisma.route.delete({
    where: { id }
  });
  return { id }
};

const cancelRoute = async (routeId, driverId, opts = {}) => {
  const { reason } = opts;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      driver: { select: { id: true } },
      bookings: {
        where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
        include: { passenger: { select: { id: true } } }
      }
    }
  });
  if (!route) throw new ApiError(404, 'Route not found');
  if (route.driverId !== driverId) throw new ApiError(403, 'Forbidden');
  if (![RouteStatus.AVAILABLE, RouteStatus.FULL].includes(route.status)) {
    throw new ApiError(400, 'Route cannot be cancelled at this stage');
  }

  const now = new Date();
  const affected = route.bookings || [];
  const hasConfirmed = affected.some(b => b.status === BookingStatus.CONFIRMED);

  await prisma.$transaction(async (tx) => {
    //ยกเลิก Route
    await tx.route.update({
      where: { id: routeId },
      data: {
        status: RouteStatus.CANCELLED,
        cancelledBy: 'DRIVER',
        cancelledAt: now
      }
    });

    if (affected.length) {
      //ยกเลิก Booking ที่ค้างทั้งหมด
      await tx.booking.updateMany({
        where: { routeId, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledBy: 'DRIVER',
          cancelledAt: now,
          cancelReason: reason
        }
      });

      const notiData = affected.map(b => ({
        userId: b.passengerId,
        type: 'BOOKING',
        title: 'การจองถูกยกเลิกเนื่องจากคนขับยกเลิกเส้นทาง',
        body: 'ขออภัย เส้นทางที่คุณจองถูกยกเลิกโดยคนขับ',
        metadata: { routeId, bookingId: b.id, by: 'DRIVER', reason }
      }));
      // ทำ bulk insert ทีละก้อน
      for (const n of notiData) {
        await tx.notification.create({ data: n });
      }
    }
  });

  //บทลงโทษฝั่งไดรเวอร์
  await checkAndApplyDriverSuspension(driverId, { confirmedOnly: hasConfirmed });

  return { id: routeId, status: RouteStatus.CANCELLED, cancelledBy: 'DRIVER', cancelledAt: now };
};

module.exports = {
  getAllRoutes,
  searchRoutes,
  getRouteById,
  getMyRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  cancelRoute
};
