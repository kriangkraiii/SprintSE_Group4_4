const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createRoutesMock() {
  try {
    console.log('🔄 Creating mock routes for Epic 3 Review & Rating tests...');
    
    // Create users that match Epic 3 test cases
    const TEST_PASSWORD = 'password123';
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);

    // Create driver (rf_driver)
    let driver = await prisma.user.findFirst({ where: { username: 'rf_driver' } });
    if (!driver) {
      driver = await prisma.user.create({
        data: {
          email: 'rf_driver@test.com',
          username: 'rf_driver',
          password: hashed,
          firstName: 'RobotDriver',
          lastName: 'Test',
          phoneNumber: '0899999901',
          role: 'DRIVER',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_driver');
    }

    // Create passenger (rf_passenger)
    let passenger = await prisma.user.findFirst({ where: { username: 'rf_passenger' } });
    if (!passenger) {
      passenger = await prisma.user.create({
        data: {
          email: 'rf_passenger@test.com',
          username: 'rf_passenger',
          password: hashed,
          firstName: 'RobotPassenger',
          lastName: 'Test',
          phoneNumber: '0899999902',
          role: 'PASSENGER',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_passenger');
    }

    // Create admin (rf_admin)
    let admin = await prisma.user.findFirst({ where: { username: 'rf_admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'rf_admin@test.com',
          username: 'rf_admin',
          password: hashed,
          firstName: 'RobotAdmin',
          lastName: 'Test',
          phoneNumber: '0899999903',
          role: 'ADMIN',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Created rf_admin');
    }

    // Create vehicle for driver
    let vehicle = await prisma.vehicle.findFirst({ where: { userId: driver.id } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          userId: driver.id,
          vehicleModel: 'Toyota Camry',
          licensePlate: 'กข-1234',
          vehicleType: 'Sedan',
          color: 'ขาว',
          seatCapacity: 4,
          isDefault: true
        }
      });
      console.log(`✅ Created vehicle for rf_driver: ${vehicle.licensePlate}`);
    }

    // Create routes suitable for Epic 3 review testing
    const routesData = [
      {
        driver: driver,
        origin: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        destination: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
        departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago (completed trip)
        price: 50,
        seats: 3
      },
      {
        driver: driver,
        origin: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        destination: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ' },
        departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (completed trip)
        price: 60,
        seats: 2
      },
      {
        driver: driver,
        origin: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        destination: { lat: 14.0205, lng: 99.8481, address: 'กาญจนบุรี' },
        departureTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago (completed trip)
        price: 150,
        seats: 4
      },
      {
        driver: driver,
        origin: { lat: 13.8610, lng: 100.5115, address: 'นนทบุรี' },
        destination: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        departureTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago (completed trip)
        price: 50,
        seats: 3
      },
      {
        driver: driver,
        origin: { lat: 13.6534, lng: 100.4976, address: 'สมุทรปราการ' },
        destination: { lat: 13.7563, lng: 100.5018, address: 'กรุงเทพมหานคร' },
        departureTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago (completed trip)
        price: 60,
        seats: 2
      }
    ];

    // Create routes and bookings for Epic 3 testing
    for (let i = 0; i < routesData.length; i++) {
      const routeData = routesData[i];
      const vehicle = await prisma.vehicle.findFirst({ where: { userId: routeData.driver.id } });
      
      const existingRoute = await prisma.route.findFirst({
        where: {
          driverId: routeData.driver.id,
          departureTime: routeData.departureTime
        }
      });

      if (!existingRoute) {
        // Create completed route (for review testing)
        const route = await prisma.route.create({
          data: {
            driverId: routeData.driver.id,
            vehicleId: vehicle.id,
            startLocation: routeData.origin,
            endLocation: routeData.destination,
            departureTime: routeData.departureTime,
            availableSeats: routeData.seats,
            pricePerSeat: routeData.price,
            status: 'COMPLETED' // Routes are completed for review testing
          }
        });
        console.log(`✅ Created completed route: ${routeData.origin.address} → ${routeData.destination.address} by ${routeData.driver.username}`);

        // Create booking for each completed route (passenger books and completes trip)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            routeId: route.id,
            passengerId: passenger.id
          }
        });

        if (!existingBooking) {
          const booking = await prisma.booking.create({
            data: {
              routeId: route.id,
              passengerId: passenger.id,
              numberOfSeats: 1,
              status: 'COMPLETED', // Booking is completed for review testing
              pickupLocation: routeData.origin, // Use route origin as pickup location
              dropoffLocation: routeData.destination // Use route destination as dropoff location
            }
          });
          console.log(`✅ Created completed booking for passenger: Booking #${booking.id}`);
        }
      }
    }

    // Show summary
    const totalRoutes = await prisma.route.count({ where: { status: 'COMPLETED' } });
    const totalBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const totalDrivers = await prisma.user.count({ where: { role: 'DRIVER', isActive: true } });
    const totalVehicles = await prisma.vehicle.count();

    console.log('\n🎉 Epic 3 mock data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Users: 3 (driver, passenger, admin)`);
    console.log(`   Drivers: ${totalDrivers}`);
    console.log(`   Vehicles: ${totalVehicles}`);
    console.log(`   Completed Routes: ${totalRoutes}`);
    console.log(`   Completed Bookings: ${totalBookings}`);
    console.log(`\n� Ready for Epic 3 Review & Rating testing!`);
    console.log(`   - rf_driver@test.com (driver)`);
    console.log(`   - rf_passenger@test.com (passenger)`);
    console.log(`   - rf_admin@test.com (admin)`);

  } catch (error) {
    console.error('❌ Error creating mock routes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRoutesMock();
