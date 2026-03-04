const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'driver1' },
          { username: 'passenger1' }
        ]
      }
    });
    console.log('Existing users:', users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role })));
    
    const routes = await prisma.route.findMany({
      where: { driver: { username: 'driver1' } }
    });
    console.log('Routes for driver1:', routes.length);
    
    const bookings = await prisma.booking.findMany({
      where: { passenger: { username: 'passenger1' } }
    });
    console.log('Bookings for passenger1:', bookings.length);
    
    const reviews = await prisma.rideReview.findMany();
    console.log('Total reviews:', reviews.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();
