const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createPassengerReviewMockData() {
  try {
    console.log('🔄 Creating mock data for passenger reviews...');
    
    // Get existing users
    const driver = await prisma.user.findFirst({ where: { username: 'rf_driver' } });
    const passenger = await prisma.user.findFirst({ where: { username: 'rf_passenger' } });
    
    if (!driver || !passenger) {
      console.log('❌ Users not found, please run seed script first');
      return;
    }
    
    // Get driver's vehicle
    const vehicle = await prisma.vehicle.findFirst({ where: { userId: driver.id } });
    if (!vehicle) {
      console.log('❌ No vehicle found for driver');
      return;
    }
    
    console.log(`✅ Found driver: ${driver.email}`);
    console.log(`✅ Found passenger: ${passenger.email}`);
    console.log(`✅ Found vehicle: ${vehicle.licensePlate}`);
    
    // Create multiple completed routes for passenger to review
    const routesData = [
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร - สถานีรถไฟ' },
        endLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี - เซ็นทรัลเวสเทิร์นวัล' },
        departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        price: 80,
        seats: 4
      },
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร - สยามพารากอน' },
        endLocation: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ - เมกาบางกอน' },
        departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        price: 120,
        seats: 3
      },
      {
        startLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร - อนุสาวรีย์ชัยสมรภูมิ' },
        endLocation: { lat: 14.0205, lng: 99.8481, address: 'กาญจนบุรี - สถานีรถไฟกาญจนบุรี' },
        departureTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        price: 200,
        seats: 4
      },
      {
        startLocation: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี - มหาวิทยาลัยเกษตรศาสตร์' },
        endLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร - อาคารเอไทม์ส' },
        departureTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        price: 80,
        seats: 4
      },
      {
        startLocation: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ - อิมพีเรียม' },
        endLocation: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร - ท่าอากาศยานสุวรรณภูมิ' },
        departureTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        price: 150,
        seats: 3
      }
    ];

    let createdBookings = [];
    
    for (const routeData of routesData) {
      // Create completed route
      const route = await prisma.route.create({
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

      // Create completed booking for passenger (without review)
      const booking = await prisma.booking.create({
        data: {
          routeId: route.id,
          passengerId: passenger.id,
          numberOfSeats: 1,
          status: 'COMPLETED',
          pickupLocation: routeData.startLocation,
          dropoffLocation: routeData.endLocation
        }
      });
      console.log(`✅ Created booking for passenger to review: ${booking.id.slice(-8)}`);
      createdBookings.push(booking);
    }

    // Show summary
    const totalRoutes = await prisma.route.count({ where: { status: 'COMPLETED' } });
    const totalBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    
    // Count bookings without reviews (available for passenger to review)
    const availableBookings = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        passengerId: passenger.id,
        reviews: {
          none: {}
        }
      }
    });

    console.log('\n🎉 Mock data for passenger reviews created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Total Completed Routes: ${totalRoutes}`);
    console.log(`   Total Completed Bookings: ${totalBookings}`);
    console.log(`   Available for Review: ${availableBookings} ⭐`);
    console.log(`\n📝 Test User:`);
    console.log(`   Passenger: ${passenger.email} / password123`);
    console.log(`\n🎯 Passenger can now:`);
    console.log(`   ✅ Login as passenger`);
    console.log(`   ✅ Go to /reviews page`);
    console.log(`   ✅ See ${availableBookings} pending reviews`);
    console.log(`   ✅ Create reviews with 1-5 stars`);
    console.log(`   ✅ Add tags, comments, and private feedback`);
    console.log(`\n🚀 Ready for passenger review testing!`);

  } catch (error) {
    console.error('❌ Error creating passenger review mock data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPassengerReviewMockData();
