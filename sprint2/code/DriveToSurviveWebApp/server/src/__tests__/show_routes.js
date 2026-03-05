const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showRoutes() {
  try {
    const routes = await prisma.route.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        driver: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isVerified: true
          }
        },
        vehicle: {
          select: {
            vehicleModel: true,
            licensePlate: true,
            vehicleType: true,
            color: true,
            seatCapacity: true
          }
        }
      },
      orderBy: { departureTime: 'asc' }
    });
    
    console.log('🛣️  Available Routes:');
    console.log('='.repeat(80));
    
    routes.forEach((route, index) => {
      const startAddr = route.startLocation?.address || 'Unknown';
      const endAddr = route.endLocation?.address || 'Unknown';
      const departureTime = new Date(route.departureTime).toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log(`\n${index + 1}. 🚗 Route ID: ${route.id}`);
      console.log(`   From: ${startAddr}`);
      console.log(`   To: ${endAddr}`);
      console.log(`   Departure: ${departureTime}`);
      console.log(`   Price: ฿${route.pricePerSeat}/seat`);
      console.log(`   Available Seats: ${route.availableSeats}`);
      console.log(`   Driver: ${route.driver.firstName} ${route.driver.lastName} (${route.driver.username})`);
      console.log(`   Driver Verified: ${route.driver.isVerified ? '✅' : '❌'}`);
      console.log(`   Vehicle: ${route.vehicle.vehicleModel} (${route.vehicle.color}, ${route.vehicle.vehicleType})`);
      console.log(`   License Plate: ${route.vehicle.licensePlate}`);
      console.log(`   Vehicle Capacity: ${route.vehicle.seatCapacity} seats`);
      console.log(`   Status: ${route.status}`);
    });
    
    console.log(`\n📊 Total Available Routes: ${routes.length}`);
    console.log('🎉 Passengers can now book these routes!');
    
  } catch (error) {
    console.error('❌ Error fetching routes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showRoutes();
