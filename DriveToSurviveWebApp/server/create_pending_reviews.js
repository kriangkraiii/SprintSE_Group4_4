const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPendingReviews() {
  try {
    console.log('🔄 Creating more trips that need reviews...');
    
    // Get drivers
    const drivers = await prisma.user.findMany({ 
      where: { role: 'DRIVER', isActive: true },
      take: 3
    });

    // Get existing routes to reuse
    const routes = await prisma.route.findMany({
      where: { status: 'AVAILABLE' },
      include: { driver: true, vehicle: true }
    });

    // Create new passengers for more variety
    const newPassengers = [
      { username: 'passenger6', firstName: 'กฤษณ์', lastName: 'เดินทางไกล', email: 'passenger6@test.com' },
      { username: 'passenger7', firstName: 'สุดา', lastName: 'รถปลอดภัย', email: 'passenger7@test.com' },
      { username: 'passenger8', firstName: 'บุญรอด', lastName: 'มาตรงเวลา', email: 'passenger8@test.com' }
    ];

    const passengers = [];
    for (const passengerData of newPassengers) {
      const existing = await prisma.user.findFirst({ where: { username: passengerData.username } });
      if (!existing) {
        const bcrypt = require('bcrypt');
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
      } else {
        passengers.push(existing);
      }
    }

    // Create completed trips without reviews
    const tripData = [
      {
        routeIndex: 0, // Use first available route
        passengerIndex: 0,
        completedDaysAgo: 1,
        pickupAddr: 'สถานีรถไฟกรุงเทพ',
        dropoffAddr: 'ตลาดนนทบุรี'
      },
      {
        routeIndex: 1, // Use second available route
        passengerIndex: 1,
        completedDaysAgo: 2,
        pickupAddr: 'เซ็นทรัลเวิลด์',
        dropoffAddr: 'มหาวิทยาลัยบูรพา'
      },
      {
        routeIndex: 2, // Use third available route
        passengerIndex: 2,
        completedDaysAgo: 3,
        pickupAddr: 'อนุสาวรีย์ชัยสมรภูมิ',
        dropoffAddr: 'เขาใหญ่'
      }
    ];

    const createdBookings = [];

    for (const trip of tripData) {
      if (trip.routeIndex >= routes.length || trip.passengerIndex >= passengers.length) {
        continue;
      }

      const route = routes[trip.routeIndex];
      const passenger = passengers[trip.passengerIndex];
      
      // Create completed booking without review
      const booking = await prisma.booking.create({
        data: {
          routeId: route.id,
          passengerId: passenger.id,
          numberOfSeats: 1,
          status: 'COMPLETED',
          pickupLocation: { 
            lat: route.startLocation?.lat || 13.7563, 
            lng: route.startLocation?.lng || 100.5018, 
            address: trip.pickupAddr 
          },
          dropoffLocation: { 
            lat: route.endLocation?.lat || 13.8610, 
            lng: route.endLocation?.lng || 100.5115, 
            address: trip.dropoffAddr 
          },
          completedAt: new Date(Date.now() - trip.completedDaysAgo * 24 * 60 * 60 * 1000),
          noShowDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      createdBookings.push({
        booking,
        route,
        passenger,
        driver: route.driver
      });

      console.log(`✅ Created completed trip ready for review:`);
      console.log(`   Route: ${trip.pickupAddr} → ${trip.dropoffAddr}`);
      console.log(`   Passenger: ${passenger.firstName} ${passenger.lastName}`);
      console.log(`   Driver: ${route.driver.firstName} ${route.driver.lastName}`);
      console.log(`   Completed: ${trip.completedDaysAgo} days ago`);
    }

    // Show final status
    const totalCompleted = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const totalReviews = await prisma.rideReview.count();
    const pendingReviews = totalCompleted - totalReviews;

    console.log(`\n🎉 Successfully created ${createdBookings.length} more trips ready for review!`);
    console.log('📊 Final Summary:');
    console.log(`   Total Completed Trips: ${totalCompleted}`);
    console.log(`   Total Reviews: ${totalReviews}`);
    console.log(`   Pending Reviews: ${pendingReviews}`);
    
    console.log(`\n🎯 Passengers can now review these trips:`);
    createdBookings.forEach((trip, index) => {
      console.log(`   ${index + 1}. ${trip.passenger.username} can review trip with ${trip.driver.username}`);
    });

    console.log(`\n📝 Test Instructions:`);
    console.log(`   1. Login as any passenger account`);
    console.log(`   2. Go to the review/reviews section`);
    console.log(`   3. Look for completed trips within 7 days`);
    console.log(`   4. Leave a review (1-5 stars + comment)`);

  } catch (error) {
    console.error('❌ Error creating pending reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPendingReviews();
