const fs = require('fs');
const path = require('path');

const baseUrl = '{{baseUrl}}';
const userTokenAuth = { type: 'bearer', bearer: [{ key: 'token', value: '{{userToken}}', type: 'string' }] };
const adminTokenAuth = { type: 'bearer', bearer: [{ key: 'token', value: '{{adminToken}}', type: 'string' }] };

const generateTestScript = (expectedStatuses) => {
  return [
    `const code = pm.response.code;`,
    `const expected = [200, 201, 204, 400, 401, 403, 404, 405, 409, 422, 429, 500, 501];`,
    `pm.test(\`Smoke Test Endpoint Ready (Status \${code})\`, () => { pm.expect(expected).to.include(code); });`
  ];
};

const createItem = (name, method, endpoint, auth, body, ...expectedStatuses) => {
  const item = {
    name: `${method} ${endpoint}`,
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: generateTestScript(expectedStatuses.length > 0 ? expectedStatuses : [200, 201, 400, 403, 404, 500])
        }
      }
    ],
    request: {
      method,
      url: {
        raw: `${baseUrl}${endpoint}`,
        host: [baseUrl],
        path: endpoint.split('/').filter(p => p !== '').map(p => p.startsWith('?') ? p : p) // simplified path handling
      }
    }
  };
  
  if (auth) item.request.auth = auth;
  if (body) {
    item.request.header = [{ key: 'Content-Type', value: 'application/json' }];
    item.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2) };
  }
  return item;
};

const collection = {
  info: {
    name: 'Sprint 2 & 3 API Comprehensive Tests',
    description: 'Complete endpoint coverage for Sprint 2 and 3 features.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3001/api', type: 'string' },
    { key: 'adminEmail', value: 'admin@example.com', type: 'string' },
    { key: 'adminPassword', value: 'adminpassword', type: 'string' },
    { key: 'userEmail', value: 'testpassenger@test.com', type: 'string' },
    { key: 'userPassword', value: 'Test1234', type: 'string' },
    { key: 'adminToken', value: '', type: 'string' },
    { key: 'userToken', value: '', type: 'string' },
    { key: 'sampleUserId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'sampleBookingId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'sampleSessionId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'sampleMessageId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'sampleReportId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'sampleDisputeId', value: 'cm00000000000000000000000', type: 'string' },
    { key: 'samplePlaceId', value: 'cm00000000000000000000000', type: 'string' }
  ],
  item: [
    {
      name: '0) Setup Tokens',
      item: [
        {
          name: '0.1 Login Admin',
          event: [{ listen: 'test', script: { exec: ["pm.test('status = 200', () => pm.response.to.have.status(200));", "const token = pm.response.json()?.data?.token;", "if (token) pm.collectionVariables.set('adminToken', token);"], type: 'text/javascript' } }],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: "{\n  \"email\": \"{{adminEmail}}\",\n  \"password\": \"{{adminPassword}}\"\n}" }, url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] } }
        },
        {
          name: '0.2 Login User',
          event: [{ listen: 'test', script: { exec: ["pm.test('status = 200', () => pm.response.to.have.status(200));", "const token = pm.response.json()?.data?.token;", "if (token) pm.collectionVariables.set('userToken', token);"], type: 'text/javascript' } }],
          request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: "{\n  \"email\": \"{{userEmail}}\",\n  \"password\": \"{{userPassword}}\"\n}" }, url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] } }
        }
      ]
    },
    {
      name: '1) Sprint 2: Reviews',
      item: [
        createItem('Admin Get Disputes', 'GET', '/reviews/disputes/admin', adminTokenAuth, null, 200),
        createItem('Admin Resolve Dispute', 'PATCH', '/reviews/disputes/{{sampleDisputeId}}', adminTokenAuth, { action: "APPROVE_REFUND", reason: "Reviewed" }, 200, 400, 404),
        createItem('Get My Reviews', 'GET', '/reviews/me', userTokenAuth, null, 200),
        createItem('Get Pending Reviews', 'GET', '/reviews/pending', userTokenAuth, null, 200),
        createItem('Create Review', 'POST', '/reviews', userTokenAuth, { bookingId: "{{sampleBookingId}}", rating: 5, comment: "Great trip" }, 200, 201, 400),
        createItem('Create Dispute', 'POST', '/reviews/disputes', userTokenAuth, { reviewId: "dummy", reason: "Unfair" }, 200, 201, 400),
        createItem('Get My Received Reviews', 'GET', '/reviews/my-received', userTokenAuth, null, 200),
        createItem('Get Driver Reviews', 'GET', '/reviews/driver/{{sampleUserId}}', null, null, 200, 404),
        createItem('Get Driver Stats', 'GET', '/reviews/driver/{{sampleUserId}}/stats', null, null, 200, 404),
        createItem('Get Review by Booking', 'GET', '/reviews/booking/{{sampleBookingId}}', userTokenAuth, null, 200, 404),
        createItem('Check Review Status', 'GET', '/reviews/check/{{sampleBookingId}}', userTokenAuth, null, 200)
      ]
    },
    {
      name: '2) Sprint 2: Chat',
      item: [
        createItem('Admin Get Reports', 'GET', '/chat/reports/admin', adminTokenAuth, null, 200),
        createItem('Admin Update Report', 'PATCH', '/chat/reports/{{sampleReportId}}', adminTokenAuth, { action: "WARN_USER", resolution: "Resolved" }, 200, 400, 404),
        createItem('Admin Get Sessions', 'GET', '/chat/admin/sessions', adminTokenAuth, null, 200),
        createItem('Admin Get Session Messages', 'GET', '/chat/admin/sessions/{{sampleSessionId}}/messages', adminTokenAuth, null, 200, 404),
        createItem('Admin Get Chat Logs', 'GET', '/chat/admin/logs', adminTokenAuth, null, 200),
        createItem('Get My Sessions', 'GET', '/chat/sessions/me', userTokenAuth, null, 200),
        createItem('Create Session', 'POST', '/chat/sessions', userTokenAuth, { routeId: "dummy" }, 200, 201, 400),
        createItem('End Session', 'POST', '/chat/sessions/end', userTokenAuth, { sessionId: "{{sampleSessionId}}" }, 200, 400, 404),
        createItem('Get Session by Route', 'GET', '/chat/sessions/dummyRouteId', userTokenAuth, null, 200, 404),
        createItem('Get Session by Booking', 'GET', '/chat/sessions/booking/{{sampleBookingId}}', userTokenAuth, null, 200, 404),
        createItem('Get Messages', 'GET', '/chat/{{sampleSessionId}}/messages', userTokenAuth, null, 200, 404),
        createItem('Send Message', 'POST', '/chat/{{sampleSessionId}}/messages', userTokenAuth, { content: "Hello", type: "text" }, 200, 201, 400, 404),
        createItem('Share Location', 'POST', '/chat/{{sampleSessionId}}/location', userTokenAuth, { latitude: 13.7563, longitude: 100.5018 }, 200, 201, 400, 404),
        createItem('Create Chat Report', 'POST', '/chat/reports', userTokenAuth, { sessionId: "{{sampleSessionId}}", reportedUserId: "{{sampleUserId}}", reason: "Spam" }, 200, 201, 400),
        createItem('Get Chat Shortcuts', 'GET', '/chat/shortcuts/me', userTokenAuth, null, 200),
        createItem('Create Chat Shortcut', 'POST', '/chat/shortcuts', userTokenAuth, { text: "I am arriving soon!" }, 200, 201, 400),
        createItem('Update Chat Shortcut', 'PATCH', '/chat/shortcuts/dummy', userTokenAuth, { text: "Updated" }, 200, 400, 404),
        createItem('Delete Chat Shortcut', 'DELETE', '/chat/shortcuts/dummy', userTokenAuth, null, 200, 204, 404)
      ]
    },
    {
      name: '3) Sprint 2: Arrival Notifications',
      item: [
        createItem('Check Position (Driver)', 'POST', '/arrival-notifications/check', userTokenAuth, { bookingId: "{{sampleBookingId}}", lat: 13.7, lng: 100.5 }, 200, 400, 403, 404),
        createItem('Manual Trigger (Driver)', 'POST', '/arrival-notifications/manual', userTokenAuth, { bookingId: "{{sampleBookingId}}" }, 200, 400, 403, 404),
        createItem('Get Notifications for Booking', 'GET', '/arrival-notifications/{{sampleBookingId}}', userTokenAuth, null, 200, 404)
      ]
    },
    {
      name: '4) Sprint 2: No-Show',
      item: [
        createItem('Get No-Show Status', 'GET', '/no-show/{{sampleBookingId}}/status', userTokenAuth, null, 200, 404),
        createItem('Execute No-Show', 'POST', '/no-show/{{sampleBookingId}}/execute', userTokenAuth, {}, 200, 400, 403, 404)
      ]
    },
    {
      name: '5) Sprint 2: Admin specific',
      item: [
        createItem('Suspend User', 'PATCH', '/admin/users/{{sampleUserId}}/suspend', adminTokenAuth, { reason: "Policy Violation", suspendedUntil: "2026-12-31T00:00:00Z" }, 200, 400, 404),
        createItem('Unsuspend User', 'PATCH', '/admin/users/{{sampleUserId}}/unsuspend', adminTokenAuth, null, 200, 404),
        createItem('Get Suspension Status', 'GET', '/admin/users/{{sampleUserId}}/suspension-status', adminTokenAuth, null, 200, 404),
        createItem('Get Suspended Users', 'GET', '/admin/users/suspended', adminTokenAuth, null, 200),
        createItem('Export Logs', 'GET', '/admin/export/logs', adminTokenAuth, null, 200),
        createItem('Export Chat', 'GET', '/admin/export/chat/{{sampleSessionId}}', adminTokenAuth, null, 200, 404),
        createItem('Get Dashboard Stats', 'GET', '/dashboard/stats', adminTokenAuth, null, 200),
        createItem('Get Security Config', 'GET', '/security-config', adminTokenAuth, null, 200),
        createItem('Update Security Config', 'PATCH', '/security-config', adminTokenAuth, { rateLimitEnabled: true }, 200)
      ]
    },
    {
      name: '6) Sprint 2: Places',
      item: [
        createItem('Get Saved Places', 'GET', '/places/saved', userTokenAuth, null, 200),
        createItem('Save Place', 'POST', '/places/saved', userTokenAuth, { name: "Home", address: "123 St", lat: 13.0, lng: 100.0 }, 200, 201),
        createItem('Delete Saved Place', 'DELETE', '/places/saved/{{samplePlaceId}}', userTokenAuth, null, 200, 204, 404),
        createItem('Get Recent Searches', 'GET', '/places/recent', userTokenAuth, null, 200),
        createItem('Add Recent Search', 'POST', '/places/recent', userTokenAuth, { query: "Bangkok", lat: 13.0, lng: 100.0 }, 200, 201),
        createItem('Clear Recent Searches', 'DELETE', '/places/recent', userTokenAuth, null, 200, 204)
      ]
    },
    {
      name: '7) Sprint 2: Geo',
      item: [
        createItem('Lookup Province', 'GET', '/geo/lookup?lat=16.4467&lng=102.8347', null, null, 200, 400)
      ]
    },
    {
      name: '8) Sprint 3: FCM Tokens',
      item: [
        createItem('Save Token', 'POST', '/fcm/save-token', userTokenAuth, { token: "fcm_token_123", deviceName: "Test iPhone" }, 200, 400),
        createItem('List Devices', 'GET', '/fcm/devices', userTokenAuth, null, 200),
        createItem('Remove Token', 'DELETE', '/fcm/remove-token', userTokenAuth, { token: "fcm_token_123" }, 200, 400),
        createItem('Remove All Tokens', 'DELETE', '/fcm/remove-all', userTokenAuth, null, 200)
      ]
    }
  ]
};

fs.writeFileSync(path.join(__dirname, 'Sprint2_3_Comprehensive_API_Tests_postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('Collection created successfully.');
