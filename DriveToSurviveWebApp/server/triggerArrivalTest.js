// ทดสอบ arrival notification: สร้าง route+booking แล้วยิง GPS 3 ระยะ
// node triggerArrivalTest.js
// node triggerArrivalTest.js --url https://...

const urlIdx = process.argv.indexOf('--url');
const BASE_URL = urlIdx !== -1
  ? process.argv[urlIdx + 1]
  : 'https://sparkling-benetta-kraeeeeeew-9ef9bd6d.koyeb.app';

const driverAccount = { email: 'kiangnz25464@gmail.com', password: 'Cp12345678' };
const adminAccount = { email: 'kriangkrai.p@kkumail.com', password: '12345678' };

const pickupPoint = {
  lat: 16.4321527, lng: 102.8235558,
  name: 'ขอนแก่น', address: 'Khon Kaen center',
};

// offset lat จาก pickup: 0.044 ≈ 4.9km, 0.008 ≈ 0.89km, 0.0003 ≈ 33m
const gpsCheckpoints = [
  { name: '5km',  lat: pickupPoint.lat + 0.044,  lon: pickupPoint.lng },
  { name: '1km',  lat: pickupPoint.lat + 0.008,  lon: pickupPoint.lng },
  { name: '50m',  lat: pickupPoint.lat + 0.0003, lon: pickupPoint.lng },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function callApi(path, token, opts = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(opts.body && { body: JSON.stringify(opts.body) }),
  });
  return res.json();
}

async function main() {
  console.log(`\n[arrival-test] server: ${BASE_URL}\n`);


  const dLogin = await callApi('/auth/login', null, { method: 'POST', body: driverAccount });
  if (!dLogin?.data?.token) return console.error('[error] driver login failed', dLogin);
  const dToken = dLogin.data.token;
  console.log('[login] driver:', driverAccount.email);

  const aLogin = await callApi('/auth/login', null, { method: 'POST', body: adminAccount });
  if (!aLogin?.data?.token) return console.error('[error] admin login failed', aLogin);
  const aToken = aLogin.data.token;
  const passengerId = aLogin.data.user.id;
  console.log('[login] admin/passenger:', adminAccount.email);


  const vehicles = await callApi('/vehicles', dToken);
  if (!vehicles?.data?.length) return console.error('[error] no vehicles found');
  const vehicleId = vehicles.data[0].id;
  console.log('[vehicle]', vehicles.data[0].vehicleModel);


  const departAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const route = await callApi('/routes', dToken, {
    method: 'POST',
    body: {
      vehicleId,
      startLocation: { lat: 16.55, lng: 102.82, name: 'จุดเริ่ม', address: 'Start' },
      endLocation: pickupPoint,
      departureTime: departAt,
      availableSeats: 4,
      pricePerSeat: 25,
      conditions: 'arrival test',
    },
  });
  if (!route?.data?.id) return console.error('[error] create route failed', route);
  const routeId = route.data.id;
  console.log('[route] created', routeId);


  const booking = await callApi('/bookings/admin', aToken, {
    method: 'POST',
    body: {
      routeId,
      passengerId,
      numberOfSeats: 1,
      pickupLocation: pickupPoint,
      dropoffLocation: { lat: 16.55, lng: 102.82, name: 'จุดเริ่ม', address: 'Start' },
    },
  });
  if (!booking?.data?.id) return console.error('[error] booking failed', booking);
  const bookingId = booking.data.id;
  console.log('[booking] created', bookingId);


  await callApi(`/bookings/admin/${bookingId}`, aToken, {
    method: 'PUT',
    body: { status: 'CONFIRMED' },
  });
  console.log('[status] CONFIRMED');


  await callApi(`/routes/${routeId}/start`, dToken, { method: 'PATCH' });
  console.log('[start-trip] OK');

  console.log('\n[wait] 5s before GPS...\n');
  await delay(5000);

  console.log('--- GPS checks ---');

  for (let i = 0; i < gpsCheckpoints.length; i++) {
    const cp = gpsCheckpoints[i];
    const res = await callApi('/arrival-notifications/check', dToken, {
      method: 'POST',
      body: { bookingId, lat: cp.lat, lon: cp.lon },
    });

    if (res.success) {
      const d = res.data;
      const newCount = d.newNotifications?.length || 0;
      console.log(
        `[gps ${cp.name}] distance=${d.distanceKm} km | new=${newCount}`,
        newCount ? d.newNotifications.map((n) => n.radiusType).join(', ') : '',
      );
    } else {
      console.log(`[gps ${cp.name}] error:`, res.message);
    }

    if (i < gpsCheckpoints.length - 1) {
      console.log('[wait] 8s...');
      await delay(8000);
    }
  }


  const history = await callApi(`/arrival-notifications/${bookingId}`, dToken);
  if (history.success && history.data?.length) {
    console.log(`\n--- notification history (${history.data.length}) ---`);
    for (const n of history.data) {
      console.log(`  ${n.radiusType}  app=${n.appStatus}  email=${n.emailStatus}  ${n.triggeredAt}`);
    }
  }

  console.log('\n[done] booking:', bookingId);
}

main().catch((err) => console.error('[fatal]', err));
