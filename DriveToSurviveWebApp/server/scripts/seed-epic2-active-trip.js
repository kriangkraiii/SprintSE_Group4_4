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
    console.log('🚀 Starting ACTIVE TRIP Test Data Seeding (trip in progress)...');

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

    // 3. Create Route (departed 30 minutes ago, ongoing trip)
    const now = new Date();
    const departed30MinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
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
            departureTime: departed30MinAgo, // departed 30 min ago
            availableSeats: 3,
            pricePerSeat: 50,
            status: 'AVAILABLE' // Trip is ongoing!
        }
    });
    console.log('✅ Test route created (IN_PROGRESS, departed 30 min ago)');

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

    // 5. Create Chat Session (ACTIVE - trip in progress)
    const chatSession = await prisma.chatSession.create({
        data: {
            routeId: route.id,
            driverId: driver.id,
            status: 'ACTIVE',
            retentionExpiresAt: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
        }
    });

    await prisma.chatSessionParticipant.create({
        data: {
            sessionId: chatSession.id,
            userId: passenger.id
        }
    });
    console.log('✅ Chat session created (ACTIVE - trip in progress)');

    // 6. Create Messages (conversation during the trip)
    const tripMessages = [
        { content: 'สวัสดีค่ะ คนขับถึงไหนแล้วคะ?', senderId: passenger.id, createdAt: new Date(now.getTime() - 25 * 60 * 1000) },
        { content: 'สวัสดีครับ ถึงหน้าตึก SC09 แล้วครับ', senderId: driver.id, createdAt: new Date(now.getTime() - 24 * 60 * 1000) },
        { content: 'เดี๋ยวลงไปค่ะ 2 นาที', senderId: passenger.id, createdAt: new Date(now.getTime() - 23 * 60 * 1000) },
        { content: 'ได้ครับ รออยู่หน้าตึกเลยครับ', senderId: driver.id, createdAt: new Date(now.getTime() - 22 * 60 * 1000) },
        { content: '👤 Passenger Epic2 เข้าร่วมห้องแชท', senderId: driver.id, type: 'SYSTEM', createdAt: new Date(now.getTime() - 20 * 60 * 1000) },
        { content: 'สวัสดีค่ะ ไปเซ็นทรัลนะคะ', senderId: passenger.id, createdAt: new Date(now.getTime() - 18 * 60 * 1000) },
        { content: 'ครับผม ใช่ครับ ไปเซ็นทรัล', senderId: driver.id, createdAt: new Date(now.getTime() - 17 * 60 * 1000) },
        { content: 'พร้อมแล้วค่ะ ขอบคุณค่ะ', senderId: passenger.id, createdAt: new Date(now.getTime() - 2 * 60 * 1000) },
    ];

    for (const msgData of tripMessages) {
        await prisma.chatMessage.create({
            data: {
                sessionId: chatSession.id,
                senderId: msgData.senderId,
                type: msgData.type || 'TEXT',
                content: msgData.content,
                createdAt: msgData.createdAt,
                unsendDeadline: new Date(msgData.createdAt.getTime() + 5 * 60 * 1000)
            }
        });
    }
    console.log(`✅ Created ${tripMessages.length} messages (trip conversation)`);

    // 7. Create an EDITED message (edited once)
    await prisma.chatMessage.create({
        data: {
            sessionId: chatSession.id,
            senderId: driver.id,
            type: 'TEXT',
            content: 'ครับผม ใช่ครับ ไปเซ็นทรัลขอนแก่นครับ!',
            createdAt: new Date(now.getTime() - 17 * 60 * 1000),
            unsendDeadline: new Date(now.getTime() - 12 * 60 * 1000),
            metadata: {
                isEdited: true,
                editedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
                editHistory: [
                    { content: 'ครับผม ใช่ครับ ไปเซ็นทรัล', editedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString() }
                ]
            }
        }
    });
    console.log('✅ Created edited message (edited 1 time)');

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
    console.log('🎉 ACTIVE TRIP Setup Complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Route: IN_PROGRESS (departed 30 min ago)`);
    console.log(`   - Chat Session: ACTIVE`);
    console.log(`   - Messages: ${tripMessages.length + 1} messages (trip conversation)`);
    console.log(`   - One edited message (1/3 edits used)`);
    console.log('');
    console.log('🔑 Test Accounts:');
    console.log(`   Driver:    epic2_driver@test.com / password123`);
    console.log(`   Passenger: thanatcha.k@kkumail.com / password123`);
    console.log('');
    console.log('💡 Use this to test:');
    console.log('   - Real-time chat during active trip');
    console.log('   - Edit message (shows remaining 2/3)');
    console.log('   - Unsend message (within 5 min window)');
    console.log('   - GPS location sharing');
    console.log('   - Proximity alerts (if tracking enabled)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
