const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding mock data for review testing...')

    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Create Driver
    const driver = await prisma.user.upsert({
        where: { email: 'driver_review_test@example.com' },
        update: {},
        create: {
            email: 'driver_review_test@example.com',
            username: 'driver_review_test',
            firstName: 'Driver',
            lastName: 'ReviewTest',
            password: passwordHash,
            role: 'DRIVER',
            isActive: true,
            isVerified: true
        }
    })

    // 2. Create Passenger
    const passenger = await prisma.user.upsert({
        where: { email: 'passenger_review_test@example.com' },
        update: {},
        create: {
            email: 'passenger_review_test@example.com',
            username: 'passenger_review_test',
            firstName: 'Passenger',
            lastName: 'ReviewTest',
            password: passwordHash,
            role: 'PASSENGER',
            isActive: true,
            isVerified: true
        }
    })

    // 3. Create Vehicle for Driver
    const vehicle = await prisma.vehicle.upsert({
        where: { licensePlate: 'REV-1234' },
        update: {},
        create: {
            userId: driver.id,
            vehicleModel: 'Honda Civic',
            licensePlate: 'REV-1234',
            vehicleType: 'Car',
            color: 'White',
            seatCapacity: 4,
            isDefault: true
        }
    })

    // 4. Create Route
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: { name: 'KMITL', lat: 13.7299, lng: 100.7782 },
            endLocation: { name: 'Siam Paragon', lat: 13.7468, lng: 100.5346 },
            departureTime: new Date(Date.now() - 3600 * 1000), // 1 hour ago
            availableSeats: 3,
            pricePerSeat: 100,
            status: 'COMPLETED'
        }
    })

    // 5. Create Booking -> Status 'COMPLETED'
    const booking = await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: passenger.id,
            numberOfSeats: 1,
            status: 'COMPLETED',
            completedAt: new Date(),
            pickupLocation: { name: 'KMITL', lat: 13.7299, lng: 100.7782 },
            dropoffLocation: { name: 'Siam Paragon', lat: 13.7468, lng: 100.5346 }
        }
    })

    console.log('✅ Mock data created successfully!')
    console.log('===================================================')
    console.log('--- FOR PASSENGER (To Write Review) ---')
    console.log('Email:', passenger.email)
    console.log('Password: password123')
    console.log('')
    console.log('--- FOR DRIVER (To check Received Reviews) ---')
    console.log('Email:', driver.email)
    console.log('Password: password123')
    console.log('===================================================')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
