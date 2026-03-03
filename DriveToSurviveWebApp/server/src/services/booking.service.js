const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { RouteStatus, BookingStatus } = require('@prisma/client');
const { checkAndApplyPassengerSuspension } = require('./penalty.service');
const { emitNotification } = require('../socket/emitter');

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

const searchBookingsAdmin = async (opts = {}) => {
  const {
    page = 1,
    limit = 20,
    q,
    status,
    routeId,
    passengerId,
    driverId,
    createdFrom,
    createdTo,
    routeDepartureFrom,
    routeDepartureTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = opts;

  const where = {
    ...(status && { status }),
    ...(routeId && { routeId }),
    ...(passengerId && { passengerId }),
    ...(createdFrom || createdTo ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      }
    } : {}),
    ...(driverId || routeDepartureFrom || routeDepartureTo || q ? {
      route: {
        ...(driverId ? { driverId } : {}),
        ...(routeDepartureFrom || routeDepartureTo ? {
          departureTime: {
            ...(routeDepartureFrom ? { gte: new Date(routeDepartureFrom) } : {}),
            ...(routeDepartureTo ? { lte: new Date(routeDepartureTo) } : {}),
          }
        } : {}),
        ...(q ? {
          OR: [
            { routeSummary: { contains: q } },
            {
              vehicle: {
                is: {
                  OR: [
                    { licensePlate: { contains: q } },
                    { vehicleModel: { contains: q } },
                    { vehicleType: { contains: q } },
                  ]
                }
              }
            }
          ]
        } : {}),
      }
    } : {}),
    ...(q ? {
      OR: [
        {
          passenger: {
            is: {
              OR: [
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { email: { contains: q } },
                { username: { contains: q } },
              ]
            }
          }
        }
      ]
    } : {})
  };

  const _page = Number(page) || 1;
  const _limit = Number(limit) || 20;
  const skip = (_page - 1) * _limit;
  const take = _limit;

  const [total, data] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      include: {
        passenger: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true, profilePicture: true }
        },
        route: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
            vehicle: { select: { licensePlate: true, vehicleModel: true, vehicleType: true } },
          }
        }
      }
    })
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const adminCreateBooking = async (data) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: data.routeId } });
    if (!route) throw new ApiError(404, 'Route not found');

    // ป้องกันการจองให้คนขับเอง
    if (route.driverId === data.passengerId) {
      throw new ApiError(400, 'Driver cannot book their own route.');
    }
    if (route.status !== RouteStatus.AVAILABLE) {
      throw new ApiError(400, 'This route is no longer available.');
    }
    if (route.availableSeats < data.numberOfSeats) {
      throw new ApiError(400, 'Not enough seats available on this route.');
    }

    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId: data.passengerId,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        // status: (default -> PENDING)
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: { availableSeats: { decrement: data.numberOfSeats } },
    });
    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({ where: { id: data.routeId }, data: { status: RouteStatus.FULL } });
    }
    return booking;
  });
};

const adminUpdateBooking = async (id, patch) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id }, include: { route: true }
    });
    if (!existing) throw new ApiError(404, 'Booking not found');

    // ค่าเป้าหมาย
    const targetStatus = patch.status ?? existing.status;
    const oldActive = ACTIVE_STATUSES.includes(existing.status);
    const newActive = ACTIVE_STATUSES.includes(targetStatus);
    const targetRouteId = patch.routeId ?? existing.routeId;
    const targetSeats = patch.numberOfSeats ?? existing.numberOfSeats;
    const targetPassengerId = patch.passengerId ?? existing.passengerId;

    // helper คืนที่นั่งให้ route
    const refundSeats = async (routeId, seats) => {
      const r = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { increment: seats } },
      });
      if (r.status === RouteStatus.FULL && r.availableSeats > 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.AVAILABLE } });
      }
    };
    // helper จองที่นั่งจาก route (ตรวจเงื่อนไข)
    const reserveSeats = async (routeId, seats, passengerId) => {
      const r = await tx.route.findUnique({ where: { id: routeId } });
      if (!r) throw new ApiError(404, 'Route not found');
      if (r.driverId === passengerId) throw new ApiError(400, 'Driver cannot book their own route.');
      if (r.status !== RouteStatus.AVAILABLE) throw new ApiError(400, 'This route is no longer available.');
      if (r.availableSeats < seats) throw new ApiError(400, 'Not enough seats available on this route.');
      const updated = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { decrement: seats } },
      });
      if (updated.availableSeats === 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.FULL } });
      }
    };

    // กรณีเปลี่ยน route/seats หรือเปลี่ยนสถานะระหว่าง active<->inactive
    // ขั้นตอน: ถ้าปัจจุบันถือครองที่นั่งอยู่ (active) → refund ก่อน
    if (oldActive) {
      await refundSeats(existing.routeId, existing.numberOfSeats);
    }
    // จากนั้น ถ้าปลายทางต้องถือครองที่นั่ง (newActive) → reserve ที่ route เป้าหมาย ด้วยจำนวนเป้าหมาย
    if (newActive) {
      await reserveSeats(targetRouteId, targetSeats, targetPassengerId);
    }

    // อัปเดตข้อมูล booking
    const updated = await tx.booking.update({
      where: { id },
      data: {
        routeId: targetRouteId,
        passengerId: targetPassengerId,
        numberOfSeats: targetSeats,
        pickupLocation: patch.pickupLocation ?? existing.pickupLocation,
        dropoffLocation: patch.dropoffLocation ?? existing.dropoffLocation,
        status: targetStatus,
      },
      include: { route: true, passenger: true }
    });
    return updated;
  });
};

const createBooking = async (data, passengerId) => {
  console.log('[createBooking] START — passengerId:', passengerId, 'data:', JSON.stringify(data));
  return prisma.$transaction(async (tx) => {

    // ตรวจสอบ role + ยืนยัน + suspension
    const user = await tx.user.findUnique({
      where: { id: passengerId },
      select: { isVerified: true, role: true, passengerSuspendedUntil: true }
    });
    console.log('[createBooking] user:', JSON.stringify(user));
    if (!user) throw new ApiError(404, 'User not found');
    if (!user.isVerified) {
      console.log('[createBooking] BLOCKED — isVerified is false');
      throw new ApiError(403, 'คุณต้องยืนยันบัตรประชาชนก่อนจึงจะจองเส้นทางได้');
    }

    // คนขับสามารถจองเส้นทางของคนอื่นได้ (ตรวจเฉพาะ driverId === passengerId ด้านล่าง)

    // ตรวจ passenger suspension (role-based ban)
    if (user.passengerSuspendedUntil && new Date(user.passengerSuspendedUntil) > new Date()) {
      throw new ApiError(403, 'บัญชีผู้โดยสารของคุณถูกระงับชั่วคราว');
    }

    const route = await tx.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    if (route.driverId === passengerId) {
      throw new ApiError(400, 'Driver cannot book their own route.');
    }

    // ห้ามจองซ้ำ — ถ้ามี PENDING หรือ CONFIRMED อยู่แล้วในเส้นทางเดียวกัน
    const existingBooking = await tx.booking.findFirst({
      where: {
        routeId: data.routeId,
        passengerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    if (existingBooking) {
      throw new ApiError(400, 'คุณมีการจองเส้นทางนี้แล้ว กรุณารอคนขับอนุมัติหรือปฏิเสธก่อน');
    }

    if (route.status !== RouteStatus.AVAILABLE) {
      throw new ApiError(400, 'This route is no longer available.');
    }
    if (route.availableSeats < data.numberOfSeats) {
      throw new ApiError(400, 'Not enough seats available on this route.');
    }

    // สร้างการจอง — สถานะ PENDING รอคนขับยืนยัน
    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        // status: default PENDING from schema
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: {
        availableSeats: {
          decrement: data.numberOfSeats,
        },
      },
    });

    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({
        where: { id: data.routeId },
        data: { status: RouteStatus.FULL },
      });
    }

    // แจ้งเตือนคนขับว่ามีคำขอจองใหม่ (รอยืนยัน)
    const driverNotif = await tx.notification.create({
      data: {
        userId: route.driverId,
        type: 'BOOKING',
        title: 'มีคำขอจองใหม่ในเส้นทางของคุณ',
        body: 'ผู้โดยสารได้ทำการจองที่นั่งในเส้นทางของคุณ กรุณายืนยันหรือปฏิเสธ',
        metadata: {
          kind: 'BOOKING_CREATED',
          bookingId: booking.id,
          routeId: data.routeId,
          passengerId,
          numberOfSeats: data.numberOfSeats,
        }
      }
    });
    // Push real-time notification to driver
    emitNotification(route.driverId, driverNotif);

    // แจ้งเตือนผู้โดยสารว่าจองสำเร็จ (รอยืนยัน)
    const passengerNotif = await tx.notification.create({
      data: {
        userId: passengerId,
        type: 'BOOKING',
        title: 'จองเส้นทางสำเร็จ',
        body: 'การจองของคุณอยู่ในสถานะรอดำเนินการ กรุณารอคนขับยืนยัน',
        metadata: {
          kind: 'BOOKING_STATUS',
          bookingId: booking.id,
          routeId: data.routeId,
          status: 'PENDING',
        }
      }
    });
    // Push real-time notification to passenger
    emitNotification(passengerId, passengerNotif);

    return booking;
  });
};

/**
 * Post-booking: add passenger to group chat + send email to driver
 * Called OUTSIDE the transaction to avoid deadlocks
 */
const postBookingActions = async (booking, routeId, passengerId) => {
  try {
    // Auto-create/join group chat for route
    const { createSession: createChatSession } = require('./chat.service');
    await createChatSession(routeId, passengerId);
  } catch (e) {
    console.error('[PostBooking] Chat setup failed:', e.message);
  }

  try {
    // Send email notification to driver
    const { sendBookingEmail } = require('./email.service');
    if (sendBookingEmail) {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: { driver: { select: { email: true, firstName: true } } },
      });
      const passenger = await prisma.user.findUnique({
        where: { id: passengerId },
        select: { firstName: true, lastName: true },
      });
      if (route?.driver?.email) {
        await sendBookingEmail(route.driver.email, {
          driverName: route.driver.firstName,
          passengerName: `${passenger?.firstName || ''} ${passenger?.lastName || ''}`.trim(),
          bookingId: booking.id,
          routeId,
          seats: booking.numberOfSeats,
        });
      }
    }
  } catch (e) {
    console.error('[PostBooking] Email failed:', e.message);
  }
};

const getMyBookings = async (passengerId) => {
  return prisma.booking.findMany({
    where: { passengerId },
    include: {
      route: {
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
              profilePicture: true,
              isVerified: true,
              driverStats: {
                select: {
                  avgRating: true,
                  totalReviews: true,
                }
              }
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
        }
      },
      reviews: {
        where: { passengerId }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getBookingsByRouteId = async (routeId) => {
  return prisma.booking.findMany({
    where: { routeId, status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING'] } },
    select: {
      id: true,
      pickupLocation: true,
      dropoffLocation: true,
      status: true,
      passenger: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
};

const getBookingById = async (id) => {
  return prisma.booking.findUnique({
    where: { id },
    include: { route: true, passenger: true },
  });
};

const updateBookingStatus = async (id, status, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.route.driverId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: { status },
    });

    if (status === BookingStatus.REJECTED) {
      // คืนที่นั่งให้ route
      const refunded = booking.numberOfSeats;
      const newSeats = booking.route.availableSeats + refunded;
      const routeUpdates = { availableSeats: newSeats };
      if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
        routeUpdates.status = RouteStatus.AVAILABLE;
      }
      await tx.route.update({
        where: { id: booking.route.id },
        data: routeUpdates,
      });

      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองถูกปฏิเสธ',
          body: 'ขออภัย คนขับได้ปฏิเสธคำขอจองของคุณ',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'REJECTED' }
        }
      });

    }

    if (status === BookingStatus.CONFIRMED) {
      // 🔔 แจ้งเตือน Passenger เมื่อถูกยืนยัน
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองได้รับการยืนยัน',
          body: 'คนขับได้ยืนยันการจองของคุณแล้ว',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'CONFIRMED' }
        }
      });
    }

    // Fire-and-forget: create group chat + send email when confirmed
    if (status === BookingStatus.CONFIRMED) {
      postBookingActions(updated, booking.routeId, booking.passengerId).catch(console.error);
    }

    return updated;
  });
};

const cancelBooking = async (id, passengerId, opts = {}) => {
  const { reason } = opts;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.passengerId !== passengerId) throw new ApiError(403, 'Forbidden');
  if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
    throw new ApiError(400, 'Cannot cancel at this stage');
  }

  const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'PASSENGER',
        cancelReason: reason || null,
      },
    });

    // คืนที่นั่งให้เส้นทาง (เดิม)
    const refunded = booking.numberOfSeats;
    const newSeats = booking.route.availableSeats + refunded;
    const routeUpdates = { availableSeats: newSeats };
    if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
      routeUpdates.status = RouteStatus.AVAILABLE;
    }
    await tx.route.update({
      where: { id: booking.route.id },
      data: routeUpdates,
    });

    if (wasConfirmed) {
      await tx.notification.create({
        data: {
          userId: passengerId,
          type: 'SYSTEM',
          title: 'บันทึกการยกเลิกหลังยืนยัน',
          body: 'คุณได้ยกเลิกการจองที่เคยได้รับการยืนยันแล้ว',
          metadata: { kind: 'PASSENGER_CONFIRMED_CANCEL', bookingId: id },
        },
      });
    }

    return updatedBooking;
  });

  if (wasConfirmed) {
    await checkAndApplyPassengerSuspension(passengerId, { confirmedOnly: true });
  }

  return updated;
};

const deleteBooking = async (id, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  // if (booking.status !== BookingStatus.REJECTED) {
  //   throw new ApiError(400, 'Only cancelled/rejected bookings can be deleted');
  // }
  if (![BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(booking.status)) {
    throw new ApiError(400, 'Only cancelled or rejected bookings can be deleted');
  }
  if (
    booking.passengerId !== userId &&
    booking.route.driverId !== userId
  ) {
    throw new ApiError(403, 'Forbidden');
  }
  await prisma.booking.delete({ where: { id } });
  return { id };
};

const adminDeleteBooking = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { route: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');

  // แอดมินลบได้ทุกสถานะ แต่ถ้าเป็น PENDING/CONFIRMED ให้คืนที่นั่งให้เส้นทางด้วย
  return prisma.$transaction(async (tx) => {
    if (booking.route) {
      if (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) {
        const refunded = booking.numberOfSeats;
        const newSeats = booking.route.availableSeats + refunded;

        const routeUpdates = { availableSeats: newSeats };
        // ถ้า route เคย FULL แล้วคืนที่นั่ง ทำให้กลับเป็น AVAILABLE
        if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
          routeUpdates.status = RouteStatus.AVAILABLE;
        }
        await tx.route.update({
          where: { id: booking.route.id },
          data: routeUpdates,
        });
      }
    }

    await tx.booking.delete({ where: { id } });
    return { id };
  });
};

module.exports = {
  searchBookingsAdmin,
  adminCreateBooking,
  createBooking,
  postBookingActions,
  adminUpdateBooking,
  getMyBookings,
  getBookingById,
  getBookingsByRouteId,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  adminDeleteBooking
};
