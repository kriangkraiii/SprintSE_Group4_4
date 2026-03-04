const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPendingReviews() {
  try {
    console.log('🔍 Checking for pending reviews...');
    
    // Check completed bookings without reviews
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        route: {
          include: {
            driver: true
          }
        },
        passenger: true,
        reviews: true
      }
    });
    
    console.log(`\n📊 Found ${completedBookings.length} completed bookings:`);
    
    let pendingCount = 0;
    let reviewedCount = 0;
    
    for (const booking of completedBookings) {
      const hasReview = booking.reviews.length > 0;
      
      if (hasReview) {
        reviewedCount++;
        console.log(`✅ Booking #${booking.id.slice(-8)} - Has review (${booking.reviews[0].rating}⭐)`);
      } else {
        pendingCount++;
        console.log(`⏳ Booking #${booking.id.slice(-8)} - NO REVIEW (Pending)`);
        console.log(`   Route: ${booking.route.startLocation.address} → ${booking.route.endLocation.address}`);
        console.log(`   Passenger: ${booking.passenger.email}`);
        console.log(`   Driver: ${booking.route.driver.email}`);
        console.log(`   Departure: ${booking.route.departureTime}`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Completed Bookings: ${completedBookings.length}`);
    console.log(`   With Reviews: ${reviewedCount}`);
    console.log(`   Pending Reviews: ${pendingCount}`);
    
    if (pendingCount > 0) {
      console.log(`\n🎯 Ready for Robot Framework review testing!`);
      console.log(`   ${pendingCount} bookings are ready for review creation`);
    } else {
      console.log(`\n⚠️  No pending reviews found!`);
      console.log(`   All completed bookings already have reviews`);
      console.log(`   Robot Framework will not be able to create new reviews`);
    }
    
  } catch (error) {
    console.error('❌ Error checking pending reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingReviews();
