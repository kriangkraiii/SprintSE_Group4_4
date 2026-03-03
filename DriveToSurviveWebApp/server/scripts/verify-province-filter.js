require('dotenv').config();
const prisma = require('../src/utils/prisma');
const routeService = require('../src/services/route.service');

async function main() {
    console.log('Verifying province filter...');

    // 1. Find a driver
    const driver = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
    if (!driver) {
        console.error('No driver found. Cannot create route.');
        return;
    }
    console.log('Using driver:', driver.id);

    // 1.1 Find/Create a vehicle
    let vehicle = await prisma.vehicle.findFirst({ where: { userId: driver.id } });
    if (!vehicle) {
        console.log('No vehicle found. Creating dummy vehicle...');
        vehicle = await prisma.vehicle.create({
            data: {
                userId: driver.id,
                vehicleModel: 'Test Car',
                vehicleType: 'Sedan',
                licensePlate: 'TEST-' + Math.floor(Math.random() * 10000),
                color: 'White',
                seatCapacity: 4,
                photos: []
            }
        });
    }
    console.log('Using vehicle:', vehicle.id);

    // 2. Create a route with province info
    const startLocation = {
        lat: 16.4322, lng: 102.8236,
        name: 'Khon Kaen City',
        province: 'Khon Kaen'
    };
    const endLocation = {
        lat: 13.7563, lng: 100.5018,
        name: 'Bangkok',
        province: 'Bangkok'
    };

    const route = await prisma.route.create({
        data: {
            driver: { connect: { id: driver.id } },
            vehicle: { connect: { id: vehicle.id } },
            startLocation,
            endLocation,
            departureTime: new Date(Date.now() + 86400000), // Tomorrow
            pricePerSeat: 500,
            availableSeats: 3,
            status: 'AVAILABLE'
        }
    });
    console.log('Created route:', route.id);

    try {
        // 3. Search with matching province
        console.log('Test 1: Searching with matching province (Khon Kaen -> Bangkok)...');
        const resultMatch = await routeService.searchRoutes({
            startProvince: 'Khon Kaen',
            endProvince: 'Bangkok'
        });
        const foundMatch = resultMatch.data.find(r => r.id === route.id);
        console.log('Result:', foundMatch ? 'PASS' : 'FAIL');

        // 4. Search with non-matching province
        console.log('Test 2: Searching with non-matching province (Udon Thani -> Bangkok)...');
        const resultMismatch = await routeService.searchRoutes({
            startProvince: 'Udon Thani',
            endProvince: 'Bangkok'
        });
        const foundMismatch = resultMismatch.data.find(r => r.id === route.id);
        console.log('Result:', !foundMismatch ? 'PASS' : 'FAIL');

        // 4.1 Search with matching province AND coordinates far away (should PASS now because province overrides radius)
        console.log('Test 2.1: Searching with matching province but far coordinates (Should PASS due to province priority)...');
        const resultFar = await routeService.searchRoutes({
            startProvince: 'Khon Kaen',
            startNearLat: 16.0000, // Far from 16.4322
            startNearLng: 102.0000 // Far from 102.8236
        });
        const foundFar = resultFar.data.find(r => r.id === route.id);
        console.log('Result:', foundFar ? 'PASS' : 'FAIL');

        // 5. Search with only start province
        console.log('Test 3: Searching with only start province (Khon Kaen)...');
        const resultStart = await routeService.searchRoutes({
            startProvince: 'Khon Kaen'
        });
        const foundStart = resultStart.data.find(r => r.id === route.id);
        console.log('Result:', foundStart ? 'PASS' : 'FAIL');

    } finally {
        // 6. Cleanup
        await prisma.route.delete({ where: { id: route.id } });
        console.log('Route deleted.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
