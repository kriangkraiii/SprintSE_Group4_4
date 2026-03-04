const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showPassengerPendingReviews() {
  try {
    console.log('🔍 Checking pending reviews for each passenger...');
    
    // Get all passengers
    const passengers = await prisma.user.findMany({ 
      where: { role: 'PASSENGER', isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true
      },
      orderBy: { username: 'asc' }
    });

    console.log(`\n👥 Found ${passengers.length} passengers:`);
    console.log('='.repeat(80));

    let totalPendingReviews = 0;

    for (const passenger of passengers) {
      // Get completed bookings for this passenger without reviews
      const completedBookings = await prisma.booking.findMany({
        where: { 
          passengerId: passenger.id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within 7 days
          }
        },
        include: {
          route: {
            include: {
              driver: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              },
              vehicle: {
                select: {
                  vehicleModel: true,
                  licensePlate: true,
                  color: true
                }
              }
            }
          },
          reviews: true
        },
        orderBy: { completedAt: 'desc' }
      });

      // Filter out bookings that already have reviews
      const pendingReviews = completedBookings.filter(booking => booking.reviews.length === 0);

      if (pendingReviews.length > 0) {
        console.log(`\n👤 ${passenger.firstName} ${passenger.lastName} (${passenger.username})`);
        console.log(`   Email: ${passenger.email}`);
        console.log(`   📝 Pending Reviews: ${pendingReviews.length}`);
        
        pendingReviews.forEach((booking, index) => {
          const startAddr = booking.route.startLocation?.address || 'Unknown';
          const endAddr = booking.route.endLocation?.address || 'Unknown';
          const completedDate = new Date(booking.completedAt).toLocaleDateString('th-TH');
          const daysSinceCompletion = Math.floor((Date.now() - new Date(booking.completedAt).getTime()) / (24 * 60 * 60 * 1000));
          const hoursUntilDeadline = Math.floor((new Date(booking.noShowDeadline).getTime() - Date.now()) / (60 * 60 * 1000));
          
          console.log(`\n   ${index + 1}. 🚗 Booking ID: ${booking.id}`);
          console.log(`      Route: ${startAddr} → ${endAddr}`);
          console.log(`      Completed: ${completedDate} (${daysSinceCompletion} days ago)`);
          console.log(`      Driver: ${booking.route.driver.firstName} ${booking.route.driver.lastName} (${booking.route.driver.username})`);
          console.log(`      Vehicle: ${booking.route.vehicle.vehicleModel} (${booking.route.vehicle.color}, ${booking.route.vehicle.licensePlate})`);
          console.log(`      ⏰ Review deadline: ${hoursUntilDeadline} hours remaining`);
        });
        
        totalPendingReviews += pendingReviews.length;
      } else {
        console.log(`\n👤 ${passenger.firstName} ${passenger.lastName} (${passenger.username})`);
        console.log(`   Email: ${passenger.email}`);
        console.log(`   ✅ No pending reviews - all trips reviewed!`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Passengers: ${passengers.length}`);
    console.log(`   Total Pending Reviews: ${totalPendingReviews}`);

    if (totalPendingReviews > 0) {
      console.log(`\n🎯 Test Instructions:`);
      console.log(`   1. Login with any passenger account that has pending reviews`);
      console.log(`   2. Navigate to the review/reviews section`);
      console.log(`   3. You should see the trips listed above that need reviews`);
      console.log(`   4. Click on a trip to leave a review (1-5 stars + comment)`);
      console.log(`   5. Submit the review and verify it appears in the system`);
      
      console.log(`\n🔑 Login Credentials:`);
      passengers.forEach(passenger => {
        console.log(`   ${passenger.username}: ${passenger.email} (password: password123)`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking passenger pending reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showPassengerPendingReviews();
