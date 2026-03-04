#!/usr/bin/env node
/**
 * simulate-driving.js
 *
 * จำลองคนขับค่อยๆ ขับจาก ~10 กม. เข้ามารับผู้โดยสารที่ มหาวิทยาลัยขอนแก่น (KKU)
 * เส้นทาง: เซ็นทรัล ขอนแก่น → ถ.มิตรภาพ → ถ.มะลิวัลย์ → หน้า มข. (ประตู 1)
 *
 * ปรับ waypoints ตามถนนจริง + จบที่พิกัดเดียวกับ pickupLocation ใน seed
 *
 * Mode 1: node simulate-driving.js <BASE_URL> <DRIVER_TOKEN> <BOOKING_ID>
 *         → ยิง API arrival-notifications/check ทุก 1.5s
 *
 * Mode 2: node simulate-driving.js <BASE_URL> <DRIVER_TOKEN> <BOOKING_ID> --socket <ROUTE_ID>
 *         → ยิง Socket.IO location-update (Real-Time Map) + API notification พร้อมกัน
 */

const BASE_URL = process.argv[2] || 'https://sparkling-benetta-kraeeeeeew-9ef9bd6d.koyeb.app';
const DRIVER_TOKEN = process.argv[3];
const BOOKING_ID = process.argv[4];
const SOCKET_MODE = process.argv.includes('--socket');
const ROUTE_ID = SOCKET_MODE ? process.argv[process.argv.indexOf('--socket') + 1] : null;

if (!DRIVER_TOKEN || !BOOKING_ID) {
    console.error('❌ Usage: node simulate-driving.js <BASE_URL> <DRIVER_TOKEN> <BOOKING_ID> [--socket <ROUTE_ID>]');
    process.exit(1);
}

// ──────────────────────────────────────────────────────────────
//  จุดรับผู้โดยสาร = มหาวิทยาลัยขอนแก่น (ประตู 1 / หอพักหน้ามอ)
//  ⚠️ ต้องตรงกับ pickupLocation ใน seed-epic2-test.js
// ──────────────────────────────────────────────────────────────
const PICKUP = { lat: 16.4735, lon: 102.8226 };

// ──────────────────────────────────────────────────────────────
//  25 จุด GPS ตามถนนจริง: เซ็นทรัลขอนแก่น → ถ.มิตรภาพ → มข.
//  ผ่านจุดสำคัญ: เซ็นทรัล → แยกประตูเมือง → ถ.มิตรภาพ →
//  แยกสามเหลี่ยม → ถ.มะลิวัลย์ → ประตู มข.
// ──────────────────────────────────────────────────────────────
const WAYPOINTS = [
    // Phase 1: เซ็นทรัลขอนแก่น → ถ.ศรีจันทร์ (~10-8 กม.)
    { lat: 16.4322, lon: 102.8236 },  // 1. จุดเริ่ม: เซ็นทรัล ขอนแก่น
    { lat: 16.4340, lon: 102.8260 },  // 2. ออกจากเซ็นทรัล
    { lat: 16.4355, lon: 102.8280 },  // 3. ถ.ศรีจันทร์
    { lat: 16.4370, lon: 102.8295 },  // 4. เลี้ยวเข้า ถ.มิตรภาพ
    { lat: 16.4395, lon: 102.8305 },  // 5. ถ.มิตรภาพ ขึ้นเหนือ

    // Phase 2: ถ.มิตรภาพ ช่วง 7-5 กม.
    { lat: 16.4420, lon: 102.8310 },  // 6. ผ่านแยกประตูเมือง
    { lat: 16.4445, lon: 102.8305 },  // 7. ถ.มิตรภาพ ตรงขึ้น
    { lat: 16.4470, lon: 102.8295 },  // 8. ผ่านบิ๊กซี
    { lat: 16.4495, lon: 102.8290 },  // 9. ใกล้แยกสามเหลี่ยม
    { lat: 16.4520, lon: 102.8285 },  // 10. 🔔 ข้ามเส้น ~5 กม. → FIVE_KM

    // Phase 3: ถ.มิตรภาพ → ถ.มะลิวัลย์ ช่วง 4-2 กม.
    { lat: 16.4540, lon: 102.8280 },  // 11. ผ่านแยกสามเหลี่ยม
    { lat: 16.4560, lon: 102.8275 },  // 12. เข้า ถ.มะลิวัลย์
    { lat: 16.4580, lon: 102.8270 },  // 13. ตรงต่อ
    { lat: 16.4600, lon: 102.8265 },  // 14. ผ่านห้าง Tesco
    { lat: 16.4620, lon: 102.8260 },  // 15. ใกล้ มข.

    // Phase 4: เข้า มข. ช่วง 1.5-0.5 กม.
    { lat: 16.4640, lon: 102.8258 },  // 16. เริ่มเห็น มข.
    { lat: 16.4655, lon: 102.8255 },  // 17. ถนนหน้า มข.
    { lat: 16.4670, lon: 102.8252 },  // 18. ใกล้ประตู มข.
    { lat: 16.4680, lon: 102.8250 },  // 19. 🔔 ข้ามเส้น ~1 กม. → ONE_KM

    // Phase 5: เข้าประตู มข. → จุดรับ - จุดถี่มากเพื่อให้เห็นรถมาถึงจริงบนแผนที่
    { lat: 16.4690, lon: 102.8248 },  // 20. ผ่านประตู มข.
    { lat: 16.4695, lon: 102.8247 },  // 21. ในมข.
    { lat: 16.4700, lon: 102.8246 },  // 22. ถนนหลักใน มข.
    { lat: 16.4705, lon: 102.8245 },  // 23. เลี้ยวเข้าหอพัก
    { lat: 16.4710, lon: 102.8244 },  // 24. ใกล้หอพัก  
    { lat: 16.4714, lon: 102.8240 },
    { lat: 16.4717, lon: 102.8236 },
    { lat: 16.4719, lon: 102.8234 },
    { lat: 16.4721, lon: 102.8232 },
    { lat: 16.4723, lon: 102.8229 },
    { lat: 16.4735, lon: 102.8226 },
];


const TOTAL_POINTS = WAYPOINTS.length;
const INTERVAL_MS = 1500; // 1.5 วินาทีต่อจุด

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── API: ยิง arrival-notifications/check ─────────────────────
async function sendArrivalCheck(lat, lon, index) {
    const dist = haversineKm(lat, lon, PICKUP.lat, PICKUP.lon).toFixed(2);
    const url = `${BASE_URL}/api/arrival-notifications/check`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': DRIVER_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookingId: BOOKING_ID, lat, lon }),
        });
        const data = await res.json();
        const newNotifs = data.data?.newNotifications?.length || 0;
        const bell = newNotifs > 0 ? '🔔' : '📍';
        if (newNotifs > 0) {
            const notifTypes = data.data.newNotifications.map(n => n.radiusType).join(', ');
            console.log(`${bell} [${index + 1}/25] ${dist} กม. → 🚨 แจ้งเตือน: ${notifTypes}`);
        } else {
            console.log(`${bell} [${index + 1}/25] lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)} → ${dist} กม.`);
        }
        return newNotifs > 0;
    } catch (err) {
        console.error(`❌ [${index + 1}] API Error: ${err.message}`);
        return false;
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Socket Mode: ส่ง real-time GPS ผ่าน Socket.IO ────────────
async function runWithSocket() {
    let io;
    try {
        io = require('socket.io-client');
    } catch {
        console.log('📦 Installing socket.io-client...');
        require('child_process').execSync('npm install socket.io-client --save-dev', { cwd: __dirname });
        io = require('socket.io-client');
    }

    let tokenStr = DRIVER_TOKEN;
    if (tokenStr.startsWith('Bearer ')) tokenStr = tokenStr.replace('Bearer ', '');

    const serverUrl = BASE_URL.replace('/api', '');
    const socket = io(serverUrl, {
        auth: { token: tokenStr },
        transports: ['websocket', 'polling'],
    });

    await new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log(`🔌 Socket connected: ${socket.id}`);
            if (ROUTE_ID) socket.emit('join-route', ROUTE_ID);
            resolve();
        });
        socket.on('connect_error', (err) => {
            console.warn(`⚠️  Socket connect failed: ${err.message} — จะใช้ API-only แทน`);
            resolve(); // ไม่ fail — ยังส่ง API ได้
        });
        setTimeout(resolve, 3000); // timeout 3s
    });

    return socket;
}

async function main() {
    console.log('🚗 คนขับเริ่มขับจาก เซ็นทรัล ขอนแก่น → มหาวิทยาลัยขอนแก่น');
    console.log(`📌 จุดรับ: lat=${PICKUP.lat}, lon=${PICKUP.lon}  (SC09 อาคารวิทยวิภาส)`);
    console.log(`📊 ${TOTAL_POINTS} จุด × ${INTERVAL_MS / 1000}s = ~${Math.round(TOTAL_POINTS * INTERVAL_MS / 1000)}s`);
    if (SOCKET_MODE && ROUTE_ID) {
        console.log(`🔌 Socket mode: route=${ROUTE_ID} (Real-Time Map)`);
    }
    console.log('─────────────────────────────────────────────────');

    let socket = null;
    if (SOCKET_MODE && ROUTE_ID) {
        socket = await runWithSocket();
    }

    for (let i = 0; i < WAYPOINTS.length; i++) {
        const { lat, lon } = WAYPOINTS[i];

        // 1. ส่ง Socket GPS (real-time map update)
        if (socket && socket.connected && ROUTE_ID) {
            socket.emit('location-update', {
                routeId: ROUTE_ID,
                lat,
                lng: lon,
                name: 'คนขับ (Test)',
            });
        }

        // 2. ยิง API เพื่อ Trigger Notification
        await sendArrivalCheck(lat, lon, i);

        if (i < WAYPOINTS.length - 1) await sleep(INTERVAL_MS);
    }

    console.log('─────────────────────────────────────────────────');
    console.log('✅ คนขับถึงจุดรับแล้ว — SC09 อาคารวิทยวิภาส 🎓');

    if (socket) socket.disconnect();
    process.exit(0);
}

main();
