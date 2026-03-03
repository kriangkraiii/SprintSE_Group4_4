const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🎭 Seeding Playwright Chat Test Data...');

    const hashedPassword = await bcrypt.hash('Thanchanok1234', 10);

    // Clean up old test users if they exist
    const oldUsers = await prisma.user.findMany({
        where: { username: { in: ['bow1234', 'kiangnz25464', 'pw_dummy_driver'] } },
        select: { id: true }
    });
    const oldUserIds = oldUsers.map(u => u.id);

    if (oldUserIds.length > 0) {
        await prisma.chatMessage.deleteMany({ where: { senderId: { in: oldUserIds } } });
        await prisma.chatSessionParticipant.deleteMany({ where: { userId: { in: oldUserIds } } });
        await prisma.chatSession.deleteMany({ where: { driverId: { in: oldUserIds } } });
        await prisma.booking.deleteMany({ where: { passengerId: { in: oldUserIds } } });
        await prisma.route.deleteMany({ where: { driverId: { in: oldUserIds } } });
        await prisma.vehicle.deleteMany({ where: { userId: { in: oldUserIds } } });
        await prisma.driverVerification.deleteMany({ where: { userId: { in: oldUserIds } } });
        await prisma.quickReplyShortcut.deleteMany({ where: { userId: { in: oldUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: oldUserIds } } });
        console.log('🧹 Cleaned up old test data');
    }

    // 1. Create dummy driver (owns route & chat session)
    const driver = await prisma.user.create({
        data: {
            username: 'pw_dummy_driver',
            email: 'pw_dummy_driver@test.com',
            password: hashedPassword,
            firstName: 'DummyDriver',
            lastName: 'Test',
            role: 'DRIVER',
            phoneNumber: '0899999900',
            isVerified: true,
            isActive: true
        }
    });

    await prisma.driverVerification.create({
        data: {
            userId: driver.id,
            licenseNumber: 'PW-DL-001',
            firstNameOnLicense: 'DummyDriver',
            lastNameOnLicense: 'Test',
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
            licensePlate: 'PW 1234',
            vehicleModel: 'Honda Civic',
            vehicleType: 'SEDAN',
            color: 'Black',
            seatCapacity: 4,
            isDefault: true
        }
    });
    console.log('✅ Dummy driver created');

    // 2. Create Passenger A (bow1234)
    const userA = await prisma.user.create({
        data: {
            username: 'bow1234',
            email: 'bow1234@test.com',
            password: hashedPassword,
            firstName: 'Bow',
            lastName: 'Test',
            role: 'PASSENGER',
            phoneNumber: '0899999901',
            isActive: true
        }
    });
    console.log('✅ Passenger A (bow1234) created');

    // 3. Create Passenger B (kiangnz25464)
    const userB = await prisma.user.create({
        data: {
            username: 'kiangnz25464',
            email: 'kiangnz25464@test.com',
            password: hashedPassword,
            firstName: 'Kiang',
            lastName: 'Test',
            role: 'PASSENGER',
            phoneNumber: '0899999902',
            isActive: true
        }
    });
    console.log('✅ Passenger B (kiangnz25464) created');

    // 3. Create Route
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: {
                address: 'มหาวิทยาลัยขอนแก่น',
                name: 'มข.',
                lat: 16.4735,
                lng: 102.8226
            },
            endLocation: {
                address: 'เซ็นทรัล ขอนแก่น',
                name: 'เซ็นทรัล ขอนแก่น',
                lat: 16.4322,
                lng: 102.8236
            },
            departureTime: new Date(new Date().getTime() + 86400000),
            availableSeats: 3,
            pricePerSeat: 50,
            status: 'AVAILABLE'
        }
    });

    // 5. Create Bookings for both passengers
    await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: userA.id,
            status: 'CONFIRMED',
            pickupLocation: { address: 'มหาวิทยาลัยขอนแก่น', lat: 16.4735, lng: 102.8226 },
            dropoffLocation: { address: 'เซ็นทรัล ขอนแก่น', lat: 16.4322, lng: 102.8236 },
            numberOfSeats: 1
        }
    });
    await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: userB.id,
            status: 'CONFIRMED',
            pickupLocation: { address: 'มหาวิทยาลัยขอนแก่น', lat: 16.4735, lng: 102.8226 },
            dropoffLocation: { address: 'เซ็นทรัล ขอนแก่น', lat: 16.4322, lng: 102.8236 },
            numberOfSeats: 1
        }
    });
    console.log('✅ Route & Bookings created');

    // 6. Create Chat Session with both passengers as participants
    const chatSession = await prisma.chatSession.create({
        data: {
            routeId: route.id,
            driverId: driver.id,
            status: 'ACTIVE',
            retentionExpiresAt: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000))
        }
    });

    await prisma.chatSessionParticipant.createMany({
        data: [
            { sessionId: chatSession.id, userId: userA.id },
            { sessionId: chatSession.id, userId: userB.id }
        ]
    });
    console.log('✅ Chat session created (both passengers joined)');

    console.log('');
    console.log('🎉 Playwright Chat Test Data Ready!');
    console.log('───────────────────────────────────');
    console.log(`Driver:    bow1234 / Thanchanok1234`);
    console.log(`Passenger: kiangnz25464 / Thanchanok1234`);
    console.log(`Chat Session: ${chatSession.id}`);
    console.log('───────────────────────────────────');
}

main().catch(console.error).finally(() => prisma.$disconnect());
