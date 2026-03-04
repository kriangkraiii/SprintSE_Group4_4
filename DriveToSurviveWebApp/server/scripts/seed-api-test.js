/**
 * Seed script for Sprint 2 API Postman Collection tests
 * Creates admin, passenger, driver + related data matching collection variables
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TEST_EMAILS = [
    'admin@example.com',
    'testpassenger@test.com',
    'epic2_driver@test.com'
];

async function cleanup() {
    console.log('🧹 Cleaning up old API test data...');

    const testUsers = await prisma.user.findMany({
        where: { email: { in: TEST_EMAILS } },
        select: { id: true }
    });
    const userIds = testUsers.map(u => u.id);

    if (userIds.length > 0) {
        // Clean arrival notifications
        await prisma.arrivalNotification.deleteMany({
            where: { OR: [{ driverId: { in: userIds } }, { passengerId: { in: userIds } }] }
        }).catch(() => { });

        // Clean reviews & disputes
        const reviews = await prisma.rideReview.findMany({
            where: { OR: [{ passengerId: { in: userIds } }, { driverId: { in: userIds } }] },
            select: { id: true }
        }).catch(() => []);
        const reviewIds = reviews.map(r => r.id);
        if (reviewIds.length > 0) {
            await prisma.reviewDispute.deleteMany({ where: { reviewId: { in: reviewIds } } }).catch(() => { });
        }
        await prisma.rideReview.deleteMany({
            where: { OR: [{ passengerId: { in: userIds } }, { driverId: { in: userIds } }] }
        }).catch(() => { });

        // Clean driver stats
        await prisma.driverStats.deleteMany({ where: { driverId: { in: userIds } } }).catch(() => { });

        // Clean chat data
        const chatSessions = await prisma.chatSession.findMany({
            where: { driverId: { in: userIds } },
            select: { id: true }
        }).catch(() => []);
        const sessionIds = chatSessions.map(cs => cs.id);

        if (sessionIds.length > 0) {
            await prisma.chatReport.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => { });
            await prisma.voiceCallLog.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => { });
            await prisma.chatMessage.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => { });
            await prisma.chatSessionParticipant.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => { });
            await prisma.chatSession.deleteMany({ where: { id: { in: sessionIds } } }).catch(() => { });
        }

        // Clean chat shortcuts
        await prisma.quickReplyShortcut.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });

        // Clean places
        await prisma.savedPlace.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });
        await prisma.recentSearch.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });

        // Clean bookings, routes, vehicles, verifications
        await prisma.booking.deleteMany({ where: { passengerId: { in: userIds } } }).catch(() => { });
        await prisma.route.deleteMany({ where: { driverId: { in: userIds } } }).catch(() => { });
        await prisma.vehicle.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });
        await prisma.driverVerification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });

        // Clean notifications
        await prisma.notification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => { });

        // Finally, delete users
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    console.log('✅ Cleanup done');
}

async function main() {
    console.log('🚀 Seeding API test data...');
    await cleanup();

    const adminHash = await bcrypt.hash('adminpassword', 10);
    const userHash = await bcrypt.hash('Test1234', 10);
    const driverHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const admin = await prisma.user.create({
        data: {
            username: 'apitestadmin',
            email: 'admin@example.com',
            password: adminHash,
            firstName: 'Admin',
            lastName: 'Test',
            role: 'ADMIN',
            phoneNumber: '0800000001',
            isVerified: true,
            isActive: true
        }
    });
    console.log('✅ Admin created:', admin.id);

    // 2. Create Passenger
    const passenger = await prisma.user.create({
        data: {
            username: 'apitestpassenger',
            email: 'testpassenger@test.com',
            password: userHash,
            firstName: 'Passenger',
            lastName: 'Test',
            role: 'PASSENGER',
            phoneNumber: '0800000002',
            isActive: true
        }
    });
    console.log('✅ Passenger created:', passenger.id);

    // 3. Create Driver
    const driver = await prisma.user.create({
        data: {
            username: 'apitestdriver',
            email: 'epic2_driver@test.com',
            password: driverHash,
            firstName: 'Driver',
            lastName: 'Test',
            role: 'DRIVER',
            phoneNumber: '0800000003',
            isVerified: true,
            isActive: true
        }
    });
    console.log('✅ Driver created:', driver.id);

    // 4. Driver Verification
    await prisma.driverVerification.create({
        data: {
            userId: driver.id,
            licenseNumber: 'APITEST001',
            firstNameOnLicense: 'Driver',
            lastNameOnLicense: 'Test',
            licenseIssueDate: new Date(),
            licenseExpiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            licensePhotoUrl: 'http://example.com/license.jpg',
            selfiePhotoUrl: 'http://example.com/selfie.jpg',
            typeOnLicense: 'PRIVATE_CAR',
            status: 'APPROVED'
        }
    });

    // 5. Vehicle
    const vehicle = await prisma.vehicle.create({
        data: {
            userId: driver.id,
            licensePlate: 'API 9999',
            vehicleModel: 'Honda Civic',
            vehicleType: 'SEDAN',
            color: 'Black',
            seatCapacity: 4,
            isDefault: true
        }
    });

    // 6. Route
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: {
                address: 'KKU SC09',
                name: 'มหาวิทยาลัยขอนแก่น',
                lat: 16.4735,
                lng: 102.8226
            },
            endLocation: {
                address: 'Central Khon Kaen',
                name: 'เซ็นทรัล ขอนแก่น',
                lat: 16.4322,
                lng: 102.8236
            },
            departureTime: new Date(Date.now() + 86400000),
            availableSeats: 3,
            pricePerSeat: 50,
            status: 'AVAILABLE'
        }
    });
    console.log('✅ Route created:', route.id);

    // 7. Booking
    const booking = await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: passenger.id,
            status: 'CONFIRMED',
            pickupLocation: { address: 'KKU SC09', lat: 16.4735, lng: 102.8226 },
            dropoffLocation: { address: 'Central Khon Kaen', lat: 16.4322, lng: 102.8236 },
            numberOfSeats: 1
        }
    });
    console.log('✅ Booking created:', booking.id);

    // 8. Chat Session + Participant
    const chatSession = await prisma.chatSession.create({
        data: {
            routeId: route.id,
            driverId: driver.id,
            status: 'ACTIVE',
            retentionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });
    await prisma.chatSessionParticipant.create({
        data: { sessionId: chatSession.id, userId: passenger.id }
    });
    console.log('✅ Chat session created:', chatSession.id);

    // 9. Chat Message (for message-related tests)
    const chatMessage = await prisma.chatMessage.create({
        data: {
            sessionId: chatSession.id,
            senderId: passenger.id,
            type: 'TEXT',
            content: 'Hello from API test!',
            unsendDeadline: new Date(Date.now() + 60 * 60 * 1000)
        }
    });
    console.log('✅ Chat message created:', chatMessage.id);

    // 10. Quick Reply Shortcut
    const shortcut = await prisma.quickReplyShortcut.create({
        data: {
            userId: passenger.id,
            text: 'On my way!',
            sortOrder: 0
        }
    });

    // Output summary with IDs for Postman collection
    console.log('\n' + '═'.repeat(60));
    console.log('📋 COLLECTION VARIABLE VALUES:');
    console.log('═'.repeat(60));
    console.log(`sampleUserId       = ${passenger.id}`);
    console.log(`sampleDriverId     = ${driver.id}`);
    console.log(`sampleBookingId    = ${booking.id}`);
    console.log(`sampleRouteId      = ${route.id}`);
    console.log(`sampleSessionId    = ${chatSession.id}`);
    console.log(`sampleMessageId    = ${chatMessage.id}`);
    console.log(`sampleShortcutId   = ${shortcut.id}`);
    console.log('═'.repeat(60));

    // Write IDs to a JSON file for Newman to use
    const fs = require('fs');
    const path = require('path');
    const envData = {
        id: 'sprint2-api-test-env',
        name: 'Sprint 2 API Test Environment',
        values: [
            { key: 'sampleUserId', value: passenger.id, enabled: true },
            { key: 'sampleDriverId', value: driver.id, enabled: true },
            { key: 'sampleBookingId', value: booking.id, enabled: true },
            { key: 'sampleRouteId', value: route.id, enabled: true },
            { key: 'sampleSessionId', value: chatSession.id, enabled: true },
            { key: 'sampleMessageId', value: chatMessage.id, enabled: true },
            { key: 'sampleShortcutId', value: shortcut.id, enabled: true },
            { key: 'sampleReviewId', value: 'cm00000000000000000000000', enabled: true },
            { key: 'sampleDisputeId', value: 'cm00000000000000000000000', enabled: true },
            { key: 'sampleReportId', value: 'cm00000000000000000000000', enabled: true },
            { key: 'samplePlaceId', value: 'cm00000000000000000000000', enabled: true },
            { key: 'sampleNotificationId', value: 'cm00000000000000000000000', enabled: true },
        ]
    };

    const envPath = path.join(__dirname, '../../../sprint2/test/TestAPI/api-test-env.json');
    fs.writeFileSync(envPath, JSON.stringify(envData, null, 2));
    console.log(`\n✅ Environment file written to: ${envPath}`);
    console.log('🎉 Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
