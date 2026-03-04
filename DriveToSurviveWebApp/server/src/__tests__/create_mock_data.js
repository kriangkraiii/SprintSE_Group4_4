const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createEpic3MockData() {
  try {
    console.log('🔄 Creating Epic 3 Review & Rating mock data...');
    
    // Create Epic 3 test users
    const TEST_PASSWORD = 'password123';
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);

    // Create driver (rf_driver)
    let driver = await prisma.user.findFirst({ where: { username: 'rf_driver' } });
    if (!driver) {
      driver = await prisma.user.create({
        data: {
          email: 'rf_driver@test.com',
          username: 'rf_driver',
          password: hashed,
          firstName: 'RobotDriver',
          lastName: 'Test',
          phoneNumber: '0899999901',
          role: 'DRIVER',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_driver');
    }

    // Create passenger (rf_passenger)
    let passenger = await prisma.user.findFirst({ where: { username: 'rf_passenger' } });
    if (!passenger) {
      passenger = await prisma.user.create({
        data: {
          email: 'rf_passenger@test.com',
          username: 'rf_passenger',
          password: hashed,
          firstName: 'RobotPassenger',
          lastName: 'Test',
          phoneNumber: '0899999902',
          role: 'PASSENGER',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_passenger');
    }

    // Create admin (rf_admin)
    let admin = await prisma.user.findFirst({ where: { username: 'rf_admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'rf_admin@test.com',
          username: 'rf_admin',
          password: hashed,
          firstName: 'RobotAdmin',
          lastName: 'Test',
          phoneNumber: '0899999903',
          role: 'ADMIN',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_admin');
    }

    // Create vehicle for driver
    let vehicle = await prisma.vehicle.findFirst({ where: { userId: driver.id } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          userId: driver.id,
          vehicleModel: 'Toyota Camry',
          licensePlate: 'กข-1234',
          vehicleType: 'Sedan',
          color: 'ขาว',
          seatCapacity: 4,
          isDefault: true
        }
      });
      console.log('✅ Created vehicle:', vehicle.licensePlate);
    }

    // Create multiple completed routes for Epic 3 testing
    const routesData = [
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        endLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
        departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        price: 50,
        seats: 3
      },
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        endLocation: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ' },
        departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        price: 60,
        seats: 2
      },
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        endLocation: { lat: 14.0205, lng: 99.8481, address: 'กาญจนบุรี' },
        departureTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        price: 150,
        seats: 4
      },
      {
        startLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
        endLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        departureTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        price: 50,
        seats: 3
      },
      {
        startLocation: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ' },
        endLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        departureTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        price: 60,
        seats: 2
      }
    ];

    let bookings = [];
    
    for (const routeData of routesData) {
      // Create completed route
      let route = await prisma.route.findFirst({
        where: {
          driverId: driver.id,
          departureTime: routeData.departureTime
        }
      });
      
      if (!route) {
        route = await prisma.route.create({
          data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: routeData.startLocation,
            endLocation: routeData.endLocation,
            departureTime: routeData.departureTime,
            availableSeats: routeData.seats,
            pricePerSeat: routeData.price,
            status: 'COMPLETED'
          }
        });
        console.log(`✅ Created route: ${routeData.startLocation.address} → ${routeData.endLocation.address}`);

        // Create completed booking for passenger
        let booking = await prisma.booking.findFirst({
          where: {
            routeId: route.id,
            passengerId: passenger.id
          }
        });
        
        if (!booking) {
          booking = await prisma.booking.create({
            data: {
              routeId: route.id,
              passengerId: passenger.id,
              numberOfSeats: 1,
              status: 'COMPLETED',
              pickupLocation: routeData.startLocation,
              dropoffLocation: routeData.endLocation
            }
          });
          console.log(`✅ Created booking for route: ${routeData.startLocation.address}`);
          bookings.push(booking);
        }
      }
    }

    // Create Epic 3 test reviews for all bookings
    const reviewScenarios = [
      {
        rating: 5,
        tags: ['polite', 'on_time', 'safe_driving'],
        comment: 'คนขับสุภาพมาก ขับรถปลอดภัย มาตรงเวลา แนะนำเลยครับ',
        privateFeedback: 'ไม่มีครับ บริการดีมาก',
        isAnonymous: false
      },
      {
        rating: 4,
        tags: ['polite', 'safe_driving'],
        comment: 'บริการดีครับ คนขับสุภาพ แต่รถสักหน่อย',
        privateFeedback: 'รถนิดหน่อยก็ดีครับ',
        isAnonymous: true
      },
      {
        rating: 3,
        tags: ['on_time'],
        comment: 'มาตรงเวลาดี แต่การบริการปกติ',
        privateFeedback: 'ควรปรับปรุงการบริการให้ดีขึ้น',
        isAnonymous: false
      },
      {
        rating: 2,
        tags: ['on_time'],
        comment: 'มาตรงเวลาแต่ขับรถเร็วไปหน่อย',
        privateFeedback: 'ควรขับรถช้าๆ ให้ปลอดภัยกว่านี้',
        isAnonymous: true
      },
      {
        rating: 1,
        tags: [],
        comment: 'บริการแย่มาก ไม่แนะนำเลย',
        privateFeedback: 'คนขับไม่สุภาพและขับรถอันตราย',
        isAnonymous: false
      }
    ];

    let totalReviewsCreated = 0;

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      const scenario = reviewScenarios[i % reviewScenarios.length];
      
      // Check if reviews already exist for this booking
      const existingReviews = await prisma.rideReview.findMany({ where: { bookingId: booking.id } });
      
      if (existingReviews.length === 0) {
        // Passenger reviews driver (main review for Epic 3 testing)
        await prisma.rideReview.create({
          data: {
            bookingId: booking.id,
            passengerId: passenger.id,
            driverId: driver.id,
            rating: scenario.rating,
            tags: scenario.tags,
            comment: scenario.comment,
            privateFeedback: scenario.privateFeedback,
            isAnonymous: scenario.isAnonymous,
            displayName: scenario.isAnonymous ? 'ผู้โดยสาร' : 'RobotPassenger'
          }
        });

        totalReviewsCreated += 1;
        console.log(`✅ Created review for booking ${i + 1} (${scenario.rating}⭐)`);
      }
    }

    // Create disputes for testing admin functionality
    const disputeScenarios = [
      { reason: 'FAKE_REVIEW', rating: 1 },
      { reason: 'INACCURATE', rating: 2 },
      { reason: 'OFFENSIVE', rating: 3 }
    ];

    for (let i = 0; i < Math.min(3, bookings.length); i++) {
      const booking = bookings[i];
      
      // Find the passenger's review for this booking
      const passengerReview = await prisma.rideReview.findFirst({
        where: {
          bookingId: booking.id,
          passengerId: passenger.id
        }
      });

      if (passengerReview) {
        const existingDispute = await prisma.reviewDispute.findFirst({
          where: { reviewId: passengerReview.id }
        });

        if (!existingDispute) {
          const disputeScenario = disputeScenarios[i];
          
          await prisma.reviewDispute.create({
            data: {
              reviewId: passengerReview.id,
              driverId: driver.id,
              reason: disputeScenario.reason,
              detail: `คนขับรู้สึกว่าการให้คะแนน ${disputeScenario.rating} ดาวไม่เป็นธรรม เพราะให้บริการดีเยี่ยม`,
              status: 'PENDING'
            }
          });
          console.log(`✅ Created dispute (${disputeScenario.reason}) for review ${disputeScenario.rating}⭐`);
        }
      }
    }

    // Show summary
    const totalRoutes = await prisma.route.count({ where: { status: 'COMPLETED' } });
    const totalBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const totalReviews = await prisma.rideReview.count();
    const totalDisputes = await prisma.reviewDispute.count();

    console.log('\n🎉 Epic 3 Review & Rating mock data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Users: 3 (driver, passenger, admin)`);
    console.log(`   Completed Routes: ${totalRoutes}`);
    console.log(`   Completed Bookings: ${totalBookings}`);
    console.log(`   Reviews: ${totalReviews}`);
    console.log(`   Disputes: ${totalDisputes}`);
    console.log(`\n📝 Test Users:`);
    console.log(`   Driver: rf_driver@test.com / password123`);
    console.log(`   Passenger: rf_passenger@test.com / password123`);
    console.log(`   Admin: rf_admin@test.com / password123`);
    console.log(`\n🎯 Review Scenarios:`);
    console.log(`   5⭐: Excellent service (polite, on_time, safe_driving)`);
    console.log(`   4⭐: Good service (polite, safe_driving)`);
    console.log(`   3⭐: Average service (on_time)`);
    console.log(`   2⭐: Poor service (on_time only)`);
    console.log(`   1⭐: Bad service (no tags)`);
    console.log(`\n🚀 Ready for Epic 3 Review & Rating testing!`);

  } catch (error) {
    console.error('❌ Error creating Epic 3 mock data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEpic3MockData();
