const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showReviews() {
  try {
    const reviews = await prisma.rideReview.findMany({
      include: {
        booking: {
          include: {
            passenger: { select: { username: true, firstName: true } },
            route: { 
              include: { 
                driver: { select: { username: true, firstName: true } }
              }
            }
          }
        }
      }
    });
    
    console.log('📝 All Reviews:');
    reviews.forEach((review, index) => {
      console.log(`\n${index + 1}. Review ID: ${review.id}`);
      console.log(`   Rating: ${review.rating} ⭐`);
      console.log(`   Comment: ${review.comment || 'No comment'}`);
      console.log(`   Display Name: ${review.displayName}`);
      console.log(`   Passenger: ${review.booking.passenger.username} (${review.booking.passenger.firstName})`);
      console.log(`   Driver: ${review.booking.route.driver.username} (${review.booking.route.driver.firstName})`);
      console.log(`   Created: ${review.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showReviews();
