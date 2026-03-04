/**
 * Admin Dashboard Statistics Service
 * Aggregates key metrics for the admin dashboard
 * Uses Prisma API instead of raw SQL for reliability across environments
 */
const prisma = require('../utils/prisma');

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Core counts (all in parallel) ──
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
    avgRating,
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
    prisma.rideReview.aggregate({ _avg: { rating: true } }),
  ]);

  // ── Charts: 7-day trends (Prisma-safe, no raw SQL) ──
  const recentBookings = await buildDailyChart(
    prisma.booking, weekAgo
  );

  const recentUsers = await buildDailyChart(
    prisma.user, weekAgo
  );

  // ── Revenue (Prisma-safe) ──
  const revenue = await calculateRevenue();

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
      recentBookings,
      recentUsers,
    },
    revenue: {
      total: revenue,
    },
    ratings: {
      average: avgRating._avg?.rating
        ? Number(Number(avgRating._avg.rating).toFixed(1))
        : 0,
      totalReviews,
    },
  };
}

/**
 * Build a 7-day chart using Prisma groupBy instead of raw SQL DATE()
 * Falls back to empty array on error
 */
async function buildDailyChart(model, since) {
  try {
    // Fetch records from the last 7 days
    const records = await model.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    // Group by date in JS (avoids raw SQL DATE() compatibility issues)
    const buckets = {};
    for (const r of records) {
      const key = r.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      buckets[key] = (buckets[key] || 0) + 1;
    }

    // Fill missing days with 0
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: buckets[key] || 0 });
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Calculate revenue using Prisma instead of raw SQL JOIN
 * Falls back to 0 on error
 */
async function calculateRevenue() {
  try {
    const completedBookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: {
        numberOfSeats: true,
        route: { select: { pricePerSeat: true } },
      },
    });

    return completedBookings.reduce(
      (sum, b) => sum + b.numberOfSeats * (b.route?.pricePerSeat || 0),
      0
    );
  } catch {
    return 0;
  }
}

module.exports = { getDashboardStats };
