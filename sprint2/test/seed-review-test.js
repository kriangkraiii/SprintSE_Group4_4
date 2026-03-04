/**
 * Seed script for Robot Framework — Epic 3: Ride Review & Rating System
 * Creates clean test data: drivers, passengers, vehicles, routes, bookings
 *
 * Usage: node seed-review-test.js
 * Run from: sprint2/test/  (will resolve prisma from server/)
 */

const path = require('path');

// Resolve prisma from server directory
const SERVER_DIR = path.resolve(__dirname, '../../DriveToSurviveWebApp/server');
require(path.join(SERVER_DIR, 'node_modules/dotenv')).config({ path: path.resolve(SERVER_DIR, '../.env') });

const { PrismaClient } = require(path.join(SERVER_DIR, 'node_modules/@prisma/client'));
const bcrypt = require(path.join(SERVER_DIR, 'node_modules/bcrypt'));

const prisma = new PrismaClient();

const TEST_PASSWORD = 'password123';

async function seed() {
  console.log('🌱 Seeding test data for Epic 3: Review & Rating ...');

  const hashed = await bcrypt.hash(TEST_PASSWORD, 10);

  // ── 1. Create test users ─────────────────────────────────

  const driverData = {
    email: 'rf_driver@test.com',
    username: 'rf_driver',
    password: hashed,
    firstName: 'RobotDriver',
    lastName: 'Test',
    phoneNumber: '0899999901',
    role: 'DRIVER',
    isVerified: true,
    isActive: true,
  };

  const passengerData = {
    email: 'rf_passenger@test.com',
    username: 'rf_passenger',
    password: hashed,
    firstName: 'RobotPassenger',
    lastName: 'Test',
    phoneNumber: '0899999902',
    role: 'PASSENGER',
    isVerified: true,
    isActive: true,
  };

  const passenger2Data = {
    email: 'rf_passenger2@test.com',
    username: 'rf_passenger2',
    password: hashed,
    firstName: 'RobotPassenger2',
    lastName: 'Test',
    phoneNumber: '0899999903',
    role: 'PASSENGER',
    isVerified: true,
    isActive: true,
  };

  // Upsert users
  const driver = await prisma.user.upsert({
    where: { email: driverData.email },
    update: driverData,
    create: driverData,
  });
  console.log('  ✅ Driver:', driver.id);

  const passenger = await prisma.user.upsert({
    where: { email: passengerData.email },
    update: passengerData,
    create: passengerData,
  });
  console.log('  ✅ Passenger:', passenger.id);

  const passenger2 = await prisma.user.upsert({
    where: { email: passenger2Data.email },
    update: passenger2Data,
    create: passenger2Data,
  });
  console.log('  ✅ Passenger2:', passenger2.id);

  // ── 2. Create vehicle ────────────────────────────────────

  let vehicle = await prisma.vehicle.findFirst({ where: { userId: driver.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        userId: driver.id,
        vehicleModel: 'Toyota Yaris',
        licensePlate: 'RF-TEST-01',
        vehicleType: 'Sedan',
        color: 'White',
        seatCapacity: 4,
        isDefault: true,
      },
    });
  }
  console.log('  ✅ Vehicle:', vehicle.id);

  // ── 3. Create route ──────────────────────────────────────

  let route = await prisma.route.findFirst({
    where: { driverId: driver.id, status: 'COMPLETED' },
  });
  if (!route) {
    route = await prisma.route.create({
      data: {
        driverId: driver.id,
        vehicleId: vehicle.id,
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        endLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
        departureTime: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        availableSeats: 3,
        pricePerSeat: 50,
        status: 'COMPLETED',
      },
    });
  }
  console.log('  ✅ Route:', route.id);

  // ── 4. Create bookings ───────────────────────────────────

  // Booking A — passenger (will be used for happy-path review)
  // Clean up old reviews/disputes for this passenger+driver so tests are idempotent
  await prisma.reviewDispute.deleteMany({ where: { driverId: driver.id } });
  await prisma.rideReview.deleteMany({ where: { driverId: driver.id } });
  await prisma.booking.deleteMany({
    where: { passengerId: passenger.id, routeId: route.id },
  });

  const bookingA = await prisma.booking.create({
    data: {
      routeId: route.id,
      passengerId: passenger.id,
      numberOfSeats: 1,
      status: 'COMPLETED',
      pickupLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพ' },
      dropoffLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
      completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000), // 1 day ago
    },
  });
  console.log('  ✅ Booking A (for review):', bookingA.id);

  // Booking B — passenger2 (for dispute flow)
  await prisma.booking.deleteMany({
    where: { passengerId: passenger2.id, routeId: route.id },
  });

  const bookingB = await prisma.booking.create({
    data: {
      routeId: route.id,
      passengerId: passenger2.id,
      numberOfSeats: 1,
      status: 'COMPLETED',
      pickupLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพ' },
      dropoffLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
      completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
    },
  });
  console.log('  ✅ Booking B (for dispute):', bookingB.id);

  // Booking C — expired (completedAt > 8 days ago, for TC-3.7)
  const bookingC = await prisma.booking.create({
    data: {
      routeId: route.id,
      passengerId: passenger.id,
      numberOfSeats: 1,
      status: 'COMPLETED',
      pickupLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพ' },
      dropoffLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
      completedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000), // 8 days ago
    },
  });
  console.log('  ✅ Booking C (expired):', bookingC.id);

  // ── 4b. Ensure admin user exists ──────────────────
  const adminData = {
    email: 'rf_admin@test.com',
    username: 'rf_admin',
    password: hashed,
    firstName: 'RobotAdmin',
    lastName: 'Test',
    phoneNumber: '0899999900',
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
  };
  const admin = await prisma.user.upsert({
    where: { email: adminData.email },
    update: adminData,
    create: adminData,
  });
  console.log('  ✅ Admin:', admin.id);

  // Ensure DriverStats exists
  await prisma.driverStats.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      totalReviews: 0,
      avgRating: 0,
      tagCounts: {},
    },
  });

  // ── 5. Pre-create review + dispute for admin tests ─────
  // Create a review by passenger2 on bookingB so we can dispute it
  const preReview = await prisma.rideReview.create({
    data: {
      bookingId: bookingB.id,
      passengerId: passenger2.id,
      driverId: driver.id,
      rating: 2,
      tags: ['late_arrival'],
      comment: '\u0e04\u0e19\u0e02\u0e31\u0e1a\u0e21\u0e32\u0e2a\u0e32\u0e22\u0e21\u0e32\u0e01 \u0e23\u0e2d\u0e19\u0e32\u0e19\u0e40\u0e25\u0e22\u0e04\u0e23\u0e31\u0e1a',
      displayName: 'RobotPassenger2',
      status: 'ACTIVE',
    },
  });
  console.log('  \u2705 Pre-review for dispute:', preReview.id);

  // Create a dispute for this review (for admin resolve/reject tests)
  const preDispute = await prisma.reviewDispute.create({
    data: {
      reviewId: preReview.id,
      driverId: driver.id,
      reason: 'INACCURATE',
      detail: '\u0e1c\u0e39\u0e49\u0e42\u0e14\u0e22\u0e2a\u0e32\u0e23\u0e43\u0e2b\u0e49\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e1c\u0e21\u0e21\u0e32\u0e15\u0e23\u0e07\u0e40\u0e27\u0e25\u0e32\u0e15\u0e32\u0e21\u0e19\u0e31\u0e14\u0e17\u0e38\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07\u0e04\u0e23\u0e31\u0e1a',
      status: 'PENDING',
    },
  });
  console.log('  \u2705 Pre-dispute for admin:', preDispute.id);

  // ── 6. Output JSON for Robot Framework ─────────────────
  const output = {
    driverId: driver.id,
    driverEmail: driverData.email,
    passengerId: passenger.id,
    passengerEmail: passengerData.email,
    passenger2Id: passenger2.id,
    passenger2Email: passenger2Data.email,
    vehicleId: vehicle.id,
    routeId: route.id,
    bookingAId: bookingA.id,
    bookingBId: bookingB.id,
    bookingCId: bookingC.id,
    preReviewId: preReview.id,
    preDisputeId: preDispute.id,
    adminId: admin.id,
    adminEmail: adminData.email,
    password: TEST_PASSWORD,
  };

  const outPath = path.join(__dirname, 'seed-output.json');
  require('fs').writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('\n📄 Seed output written to', outPath);
  console.log(JSON.stringify(output, null, 2));
  console.log('\n🎉 Seed complete!');

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
