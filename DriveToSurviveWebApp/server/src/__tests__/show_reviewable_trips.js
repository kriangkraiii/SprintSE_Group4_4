const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showReviewableTrips() {
  try {
    console.log('🔍 Checking trips that can be reviewed...');
    
    // Get completed bookings without reviews
    const completedBookings = await prisma.booking.findMany({
      where: { 
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within 7 days
        }
      },
      include: {
        passenger: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
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
      }
    });

    console.log(`\n📊 Found ${completedBookings.length} completed trips within review window:`);
    console.log('='.repeat(80));

    let reviewableCount = 0;
    let reviewedCount = 0;

    completedBookings.forEach((booking, index) => {
      const hasReview = booking.reviews.length > 0;
      const startAddr = booking.route.startLocation?.address || 'Unknown';
      const endAddr = booking.route.endLocation?.address || 'Unknown';
      const completedDate = new Date(booking.completedAt).toLocaleDateString('th-TH');
      const daysSinceCompletion = Math.floor((Date.now() - new Date(booking.completedAt).getTime()) / (24 * 60 * 60 * 1000));
      
      console.log(`\n${index + 1}. 🚗 Booking ID: ${booking.id}`);
      console.log(`   Route: ${startAddr} → ${endAddr}`);
      console.log(`   Completed: ${completedDate} (${daysSinceCompletion} days ago)`);
      console.log(`   Passenger: ${booking.passenger.firstName} ${booking.passenger.lastName} (${booking.passenger.username})`);
      console.log(`   Driver: ${booking.route.driver.firstName} ${booking.route.driver.lastName} (${booking.route.driver.username})`);
      console.log(`   Vehicle: ${booking.route.vehicle.vehicleModel} (${booking.route.vehicle.color}, ${booking.route.vehicle.licensePlate})`);
      
      if (hasReview) {
        const review = booking.reviews[0];
        console.log(`   Status: ✅ Already Reviewed`);
        console.log(`   Rating: ${review.rating} ⭐`);
        console.log(`   Comment: ${review.comment || 'No comment'}`);
        reviewedCount++;
      } else {
        console.log(`   Status: ⏳ Can Be Reviewed (within 7-day window)`);
        reviewableCount++;
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Total Completed Trips (7 days): ${completedBookings.length}`);
    console.log(`   Already Reviewed: ${reviewedCount}`);
    console.log(`   Pending Reviews: ${reviewableCount}`);
    
    if (reviewableCount > 0) {
      console.log(`\n🎯 ${reviewableCount} trips are ready for review!`);
      console.log(`   Passengers can go to the review section to leave feedback.`);
    } else {
      console.log(`\n✅ All trips have been reviewed!`);
    }

    // Show test accounts
    console.log(`\n👥 Test Accounts for Review Testing:`);
    const passengers = await prisma.user.findMany({ 
      where: { role: 'PASSENGER' },
      select: { username: true, email: true, firstName: true }
    });
    
    passengers.forEach(passenger => {
      console.log(`   Passenger: ${passenger.username} (${passenger.email}) - ${passenger.firstName}`);
    });

  } catch (error) {
    console.error('❌ Error checking reviewable trips:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showReviewableTrips();
