const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createCompletedTripsWithReviews() {
  try {
    console.log('🔄 Creating completed trips ready for reviews...');
    
    // Get existing drivers and passengers
    const drivers = await prisma.user.findMany({ 
      where: { role: 'DRIVER', isActive: true },
      take: 3
    });
    
    let passengers = await prisma.user.findMany({ 
      where: { role: 'PASSENGER', isActive: true },
      take: 3
    });

    // Create more passengers if needed
    if (passengers.length < 3) {
      const newPassengers = [
        { username: 'passenger3', firstName: 'มานพ', lastName: 'เดินทาง', email: 'passenger3@test.com' },
        { username: 'passenger4', firstName: 'สมหญิง', lastName: 'ใจดี', email: 'passenger4@test.com' },
        { username: 'passenger5', firstName: 'ประเสริฐ', lastName: 'รถปลอดภัย', email: 'passenger5@test.com' }
      ];

      for (const passengerData of newPassengers) {
        const existing = await prisma.user.findFirst({ where: { username: passengerData.username } });
        if (!existing) {
          const passenger = await prisma.user.create({
            data: {
              email: passengerData.email,
              username: passengerData.username,
              password: await bcrypt.hash('password123', 10),
              firstName: passengerData.firstName,
              lastName: passengerData.lastName,
              phoneNumber: `08${Math.floor(Math.random() * 900000000) + 100000000}`,
              role: 'PASSENGER',
              isVerified: true,
              isActive: true
            }
          });
          passengers.push(passenger);
          console.log(`✅ Created passenger: ${passenger.username}`);
        }
      }
    }

    // Get available routes
    const availableRoutes = await prisma.route.findMany({
      where: { status: 'AVAILABLE' },
      include: { driver: true, vehicle: true }
    });

    if (availableRoutes.length === 0) {
      console.log('❌ No available routes found. Please create routes first.');
      return;
    }

    // Create completed trips with bookings
    const completedTrips = [];
    
    for (let i = 0; i < Math.min(5, availableRoutes.length); i++) {
      const route = availableRoutes[i];
      const passenger = passengers[i % passengers.length];
      
      // Create booking
      const booking = await prisma.booking.create({
        data: {
          routeId: route.id,
          passengerId: passenger.id,
          numberOfSeats: 1,
          status: 'COMPLETED',
          pickupLocation: route.startLocation,
          dropoffLocation: route.endLocation,
          completedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // Completed 1-5 days ago
          noShowDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now for review window
        }
      });

      // Update route seats
      await prisma.route.update({
        where: { id: route.id },
        data: { 
          availableSeats: route.availableSeats - 1,
          status: route.availableSeats - 1 <= 0 ? 'COMPLETED' : 'AVAILABLE'
        }
      });

      completedTrips.push({
        booking,
        route,
        passenger,
        driver: route.driver
      });

      console.log(`✅ Created completed trip: ${route.startLocation?.address} → ${route.endLocation?.address}`);
      console.log(`   Passenger: ${passenger.firstName} ${passenger.lastName}`);
      console.log(`   Driver: ${route.driver.firstName} ${route.driver.lastName}`);
      console.log(`   Completed: ${new Date(booking.completedAt).toLocaleDateString('th-TH')}`);
    }

    // Create some reviews (not all trips have reviews yet - some are still pending)
    const reviewData = [
      { rating: 5, comment: 'การเดินทางสะดวกมากครับ คนขับสุภาพ ขับรถปลอดภัย มาตรงเวลาพอดี', displayName: 'ผู้โดยสารประจำ' },
      { rating: 4, comment: 'โดยรวมดีครับ รถสะอาด คนขับน่ารัก แต่มาสายไปนิดหน่อย', displayName: 'นักเดินทาง' },
      { rating: 5, comment: 'สุดยอดไปเลย! บริการดีเยี่ยม รถสวย คนขับใจดี แนะนำเลยครับ', displayName: 'ลูกค้าประจำ' }
    ];

    for (let i = 0; i < Math.min(3, completedTrips.length); i++) {
      const trip = completedTrips[i];
      const review = reviewData[i];
      
      await prisma.rideReview.create({
        data: {
          bookingId: trip.booking.id,
          passengerId: trip.passenger.id,
          driverId: trip.driver.id,
          rating: review.rating,
          comment: review.comment,
          displayName: review.displayName,
          status: 'ACTIVE'
        }
      });

      console.log(`✅ Created review: ${review.rating}⭐ - ${review.comment.substring(0, 30)}...`);
    }

    // Show summary
    const totalBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const totalReviews = await prisma.rideReview.count();
    const pendingReviews = totalBookings - totalReviews;

    console.log('\n🎉 Completed trips and reviews created successfully!');
    console.log('📊 Summary:');
    console.log(`   Completed Trips: ${totalBookings}`);
    console.log(`   Reviews Created: ${totalReviews}`);
    console.log(`   Pending Reviews: ${pendingReviews} (can still be reviewed)`);
    console.log('\n⏰ Review Window: 7 days from trip completion');
    console.log('🎯 Users can now go to the review section to leave reviews for completed trips!');

  } catch (error) {
    console.error('❌ Error creating completed trips:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompletedTripsWithReviews();
