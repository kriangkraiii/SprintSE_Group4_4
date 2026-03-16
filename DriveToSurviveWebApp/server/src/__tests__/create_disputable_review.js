const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDisputableReview() {
  try {
    console.log('🔄 Creating a disputable review for driver testing...');
    
    // Get existing users
    const driver = await prisma.user.findFirst({ where: { username: 'rf_driver' } });
    const passenger = await prisma.user.findFirst({ where: { username: 'rf_passenger' } });
    
    if (!driver || !passenger) {
      console.log('❌ Users not found, please run seed script first');
      return;
    }
    
    // Find existing completed booking without review
    const booking = await prisma.booking.findFirst({
      where: {
        status: 'COMPLETED',
        passengerId: passenger.id,
        reviews: {
          none: {}
        }
      },
      include: {
        route: true
      }
    });
    
    if (!booking) {
      console.log('❌ No completed bookings without review found');
      return;
    }
    
    console.log(`✅ Found booking: ${booking.id.slice(-8)} - ${booking.route.startLocation.address} → ${booking.route.endLocation.address}`);
    
    // Create a low rating review that driver would want to dispute
    const review = await prisma.rideReview.create({
      data: {
        bookingId: booking.id,
        passengerId: passenger.id,
        driverId: driver.id,
        rating: 2, // Low rating to trigger dispute
        tags: ['late_arrival'], // Negative tag
        comment: 'คนขับมาสาย 20 นาที ไม่ตรงเวลาเลย ไม่แนะนำ',
        privateFeedback: 'ควรปรับปรุงความตรงต่อเวลา',
        isAnonymous: false,
        displayName: 'RobotPassenger'
      }
    });
    
    console.log(`✅ Created disputable review (${review.rating}⭐): ${review.id}`);
    console.log(`   Comment: "${review.comment}"`);
    console.log(`   Tags: ${review.tags.join(', ')}`);
    console.log(`   Driver can now dispute this review!`);
    
    // Show summary
    const totalReviews = await prisma.rideReview.count();
    const lowRatingReviews = await prisma.rideReview.count({
      where: {
        rating: {
          lt: 4
        }
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Reviews: ${totalReviews}`);
    console.log(`   Low Rating Reviews (<4⭐): ${lowRatingReviews}`);
    console.log(`   Ready for driver dispute testing!`);

  } catch (error) {
    console.error('❌ Error creating disputable review:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDisputableReview();
