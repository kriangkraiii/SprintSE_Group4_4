const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function generateToken(id, role) {
    return jwt.sign({ sub: id, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
}

async function main() {
    console.log('🚀 Starting Epic 2 Test Data Seeding...');

    // Clear old test data
    await prisma.arrivalNotification.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatSession.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.route.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.driverVerification.deleteMany({});
    await prisma.user.deleteMany({
        where: { email: { in: ['epic2_driver@test.com', 'epic2_passenger@test.com', 'conan17970@gmail.com'] } }
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Driver
    const driver = await prisma.user.create({
        data: {
            username: 'epic2driver',
            email: 'epic2_driver@test.com',
            password: hashedPassword,
            firstName: 'Driver',
            lastName: 'Epic2',
            role: 'DRIVER',
            phoneNumber: '0811111111',
            isVerified: true,
            isActive: true
        }
    });
    console.log('✅ Driver account created');

    await prisma.driverVerification.create({
        data: {
            userId: driver.id,
            licenseNumber: 'DL111111',
            firstNameOnLicense: 'Driver',
            lastNameOnLicense: 'Epic2',
            licenseIssueDate: new Date(),
            licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            licensePhotoUrl: 'http://example.com/license.jpg',
            selfiePhotoUrl: 'http://example.com/selfie.jpg',
            typeOnLicense: 'PRIVATE_CAR',
            status: 'APPROVED'
        }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            userId: driver.id,
            licensePlate: 'กข 1234',
            vehicleModel: 'Toyota Camry',
            vehicleType: 'SEDAN',
            color: 'White',
            seatCapacity: 4,
            isDefault: true
        }
    });

    // 2. Create Passenger
    const passenger = await prisma.user.create({
        data: {
            username: 'epic2passenger',
            email: 'conan17970@gmail.com',
            password: hashedPassword,
            firstName: 'Passenger',
            lastName: 'Epic2',
            role: 'PASSENGER',
            phoneNumber: '0822222222',
            isActive: true
        }
    });
    console.log('✅ Passenger account created');

    // 3. Create Route
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: {
                address: 'เซ็นทรัล ขอนแก่น',
                name: 'เซ็นทรัล ขอนแก่น',
                lat: 16.4322,
                lng: 102.8236
            },
            endLocation: {
                address: 'มหาวิทยาลัยขอนแก่น',
                name: 'มหาวิทยาลัยขอนแก่น',
                lat: 16.4725,
                lng: 102.8240
            },
            departureTime: new Date(new Date().getTime() + 86400000), // tomorrow
            availableSeats: 3,
            pricePerSeat: 50,
            status: 'AVAILABLE'
        }
    });
    console.log('✅ Test route created');

    // 4. Create Booking (CONFIRMED)
    const booking = await prisma.booking.create({
        data: {
            id: 'cmm673eqa0001vr9ax7xh0trd', // hardcoded for script
            routeId: route.id,
            passengerId: passenger.id,
            status: 'CONFIRMED',
            pickupLocation: {
                address: 'หอพักหน้ามอ',
                lat: 16.4725,
                lng: 102.8240
            },
            dropoffLocation: {
                address: 'ตึกคอม',
                lat: 16.4322,
                lng: 102.8236
            },
            numberOfSeats: 1
        }
    });
    console.log('✅ Test booking created');

    // 5. Create Chat Session
    const chatSession = await prisma.chatSession.create({
        data: {
            bookingId: booking.id,
            driverId: driver.id,
            passengerId: passenger.id,
            status: 'ACTIVE',
            retentionExpiresAt: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000))
        }
    });
    console.log('✅ Chat session created');

    const driverToken = generateToken(driver.id, 'DRIVER');
    const passengerToken = generateToken(passenger.id, 'PASSENGER');

    const robotPath = path.join(__dirname, '../../../sprint2/test/epic2_arrival_notification.robot');

    if (fs.existsSync(robotPath)) {
        let robotScript = fs.readFileSync(robotPath, 'utf8');
        robotScript = robotScript.replace(/\$\{DRIVER_TOKEN\}.*/, `\${DRIVER_TOKEN}       Bearer ${driverToken}`);
        robotScript = robotScript.replace(/\$\{PASSENGER_TOKEN\}.*/, `\${PASSENGER_TOKEN}    Bearer ${passengerToken}`);
        fs.writeFileSync(robotPath, robotScript);
        console.log('✅ Environment configuration auto-injected into Robot Framework Test Suite!');
    }

    console.log('🎉 Setup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
