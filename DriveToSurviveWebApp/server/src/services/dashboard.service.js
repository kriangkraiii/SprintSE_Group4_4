/**
 * Admin Dashboard Statistics Service
 * Aggregates key metrics for the admin dashboard
 */
const prisma = require('../utils/prisma');

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    totalRoutes,
    activeRoutes,
    totalBookings,
    bookingsToday,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    completedBookings,
    totalReviews,
    totalVehicles,
    pendingDriverVerifications,
    approvedDrivers,
    totalChatSessions,
    activeChatSessions,
    totalNotifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.route.count(),
    prisma.route.count({ where: { status: { in: ['AVAILABLE', 'IN_TRANSIT'] } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.rideReview.count(),
    prisma.vehicle.count(),
    prisma.driverVerification.count({ where: { status: 'PENDING' } }),
    prisma.driverVerification.count({ where: { status: 'APPROVED' } }),
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { status: 'ACTIVE' } }),
    prisma.notification.count(),
  ]);

  // Recent bookings (last 7 days, grouped by day)
  const recentBookings = await prisma.$queryRaw`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM Booking
    WHERE createdAt >= ${weekAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;

  // Recent users (last 7 days, grouped by day)
  const recentUsers = await prisma.$queryRaw`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM User
    WHERE createdAt >= ${weekAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;

  // Revenue estimate (sum of pricePerSeat * numberOfSeats for completed/confirmed bookings)
  const revenueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(b.numberOfSeats * r.pricePerSeat), 0) as totalRevenue
    FROM Booking b
    JOIN Route r ON b.routeId = r.id
    WHERE b.status IN ('CONFIRMED', 'COMPLETED')
  `;

  // Average rating
  const avgRating = await prisma.rideReview.aggregate({
    _avg: { rating: true },
  });

  return {
    overview: {
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalRoutes,
      activeRoutes,
      totalBookings,
      bookingsToday,
      totalReviews,
      totalVehicles,
      totalChatSessions,
      activeChatSessions,
      totalNotifications,
    },
    bookings: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      cancelled: cancelledBookings,
      completed: completedBookings,
    },
    drivers: {
      pendingVerifications: pendingDriverVerifications,
      approved: approvedDrivers,
    },
    charts: {
      recentBookings: recentBookings.map(r => ({
        date: r.date,
        count: Number(r.count),
      })),
      recentUsers: recentUsers.map(r => ({
        date: r.date,
        count: Number(r.count),
      })),
    },
    revenue: {
      total: Number(revenueResult[0]?.totalRevenue || 0),
    },
    ratings: {
      average: avgRating._avg?.rating ? Number(Number(avgRating._avg.rating).toFixed(1)) : 0,
      totalReviews,
    },
  };
}

module.exports = { getDashboardStats };
