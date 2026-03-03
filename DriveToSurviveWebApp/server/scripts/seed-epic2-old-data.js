const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function generateToken(id, role) {
    return jwt.sign({ sub: id, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
}

// Helper to get date X days ago
function daysAgo(days) {
    return new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000));
}

async function main() {
    console.log('🚀 Starting OLD Test Data Seeding (>7 days)...');

    // Clear old test data
    await prisma.arrivalNotification.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatSession.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.route.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.driverVerification.deleteMany({});
    await prisma.user.deleteMany({
        where: { email: { in: ['epic2_driver@test.com', 'epic2_passenger@test.com', 'thanatcha.k@kkumail.com'] } }
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
            licenseIssueDate: daysAgo(30),
            licenseExpiryDate: daysAgo(-365 * 5), // 5 years from now
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
            email: 'thanatcha.k@kkumail.com',
            password: hashedPassword,
            firstName: 'Passenger',
            lastName: 'Epic2',
            role: 'PASSENGER',
            phoneNumber: '0822222222',
            isActive: true
        }
    });
    console.log('✅ Passenger account created');

    // 3. Create Route (departed 10 days ago)
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: {
                address: 'SC09 อาคารวิทยวิภาส คณะวิทยาศาสตร์',
                name: 'มหาวิทยาลัยขอนแก่น (SC09)',
                lat: 16.4735,
                lng: 102.8226
            },
            endLocation: {
                address: 'เซ็นทรัล ขอนแก่น',
                name: 'เซ็นทรัล ขอนแก่น',
                lat: 16.4322,
                lng: 102.8236
            },
            departureTime: daysAgo(10), // departed 10 days ago
            availableSeats: 3,
            pricePerSeat: 50,
            status: 'COMPLETED'
        }
    });
    console.log('✅ Test route created (COMPLETED, departed 10 days ago)');

    // 4. Create Booking (CONFIRMED)
    const booking = await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: passenger.id,
            status: 'CONFIRMED',
            pickupLocation: {
                address: 'SC09 อาคารวิทยวิภาส คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น',
                lat: 16.4735,
                lng: 102.8226
            },
            dropoffLocation: {
                address: 'เซ็นทรัล ขอนแก่น',
                lat: 16.4322,
                lng: 102.8236
            },
            numberOfSeats: 1
        }
    });
    console.log('✅ Test booking created');

    // 5. Create Chat Session (ENDED status, created 10 days ago)
    // Chat ended 8 days ago, read-only expires in 22 days
    const chatSession = await prisma.chatSession.create({
        data: {
            routeId: route.id,
            driverId: driver.id,
            status: 'READ_ONLY', // or 'ENDED' then becomes READ_ONLY
            createdAt: daysAgo(10),
            endedAt: daysAgo(8), // ended 8 days ago
            chatExpiresAt: daysAgo(6), // chat ended 6 days ago (2 days grace after trip)
            readOnlyExpiresAt: daysAgo(-22), // read-only for 30 days total, 22 days remaining
            retentionExpiresAt: daysAgo(-30) // auto-delete 30 days after trip
        }
    });

    // Add passenger as a participant
    await prisma.chatSessionParticipant.create({
        data: {
            sessionId: chatSession.id,
            userId: passenger.id,
            joinedAt: daysAgo(10)
        }
    });
    console.log('✅ Chat session created (READ_ONLY, ended 8 days ago)');

    // 6. Create OLD Messages (>7 days ago)
    const oldMessages = [
        { content: 'สวัสดีค่ะ วันนี้ไปทางไหนคะ?', senderId: passenger.id, createdAt: daysAgo(9.5) },
        { content: 'สวัสดีครับ ไปเซ็นทรัลเหมือนเดิมครับ', senderId: driver.id, createdAt: daysAgo(9.5) },
        { content: 'ได้เลยค่ะ รอที่ SC09 นะคะ', senderId: passenger.id, createdAt: daysAgo(9.4) },
        { content: 'ครับผม ถึงแล้วจะแจ้งนะครับ', senderId: driver.id, createdAt: daysAgo(9.4) },
        { content: 'ถึงแล้วครับ รอหน้าตึก SC09 นะครับ', senderId: driver.id, createdAt: daysAgo(9) },
        { content: 'เดี๋ยวลงไปค่ะ', senderId: passenger.id, createdAt: daysAgo(9) },
        { content: 'ขอบคุณที่ใช้บริการครับ', senderId: driver.id, createdAt: daysAgo(8.9) },
    ];

    for (const msgData of oldMessages) {
        await prisma.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                senderId: msgData.senderId,
                type: 'TEXT',
                content: msgData.content,
                createdAt: msgData.createdAt,
                unsendDeadline: new Date(msgData.createdAt.getTime() + 5 * 60 * 1000) // 5 min window from creation
            }
        });
    }
    console.log(`✅ Created ${oldMessages.length} old messages (9-10 days ago)`);

    // 7. Create an EDITED message (older than 7 days, edited within 5 min window)
    const editedMsg = await prisma.chatMessage.create({
        data: {
            sessionId: chatSession.id,
            senderId: driver.id,
            type: 'TEXT',
            content: 'ขอบคุณที่ใช้บริการครับ ขับรถดีมากเลยครับ!',
            createdAt: daysAgo(9),
            unsendDeadline: new Date(daysAgo(9).getTime() + 5 * 60 * 1000),
            metadata: {
                isEdited: true,
                editedAt: new Date(daysAgo(9).getTime() + 2 * 60 * 1000).toISOString(),
                editHistory: [
                    { content: 'ขอบคุณที่ใช้บริการครับ', editedAt: new Date(daysAgo(9).getTime() + 2 * 60 * 1000).toISOString() }
                ]
            }
        }
    });
    console.log('✅ Created edited message with history');

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

    console.log('');
    console.log('🎉 OLD Data Setup Complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Route: departed ${10} days ago (COMPLETED)`);
    console.log(`   - Chat Session: READ_ONLY (ended ${8} days ago)`);
    console.log(`   - Messages: ${oldMessages.length + 1} messages (9-10 days old)`);
    console.log(`   - One edited message with history`);
    console.log(`   - Chat lifecycle: 6 days since ended (read-only mode)`);
    console.log(`   - Read-only expires in: 22 days`);
    console.log('');
    console.log('🔑 Test Accounts:');
    console.log(`   Driver:    epic2_driver@test.com / password123`);
    console.log(`   Passenger: thanatcha.k@kkumail.com / password123`);
    console.log('');
    console.log('💡 Use this to test:');
    console.log('   - Chat read-only mode (>5 days after trip)');
    console.log('   - View old messages and edit history');
    console.log('   - Cannot send new messages (read-only)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
