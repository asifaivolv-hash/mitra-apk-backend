import assert from 'node:assert';
import test from 'node:test';
import app from '../src/app';
import http from 'node:http';
import { connectDB } from '../src/config/db';
import { seedInitialData } from '../src/utils/seed';

let server: http.Server;
let baseUrl: string;
let residentToken: string = '';
let adminToken: string = '';

test.before(async () => {
  await connectDB();
  await seedInitialData(true);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    server.close();
  }
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
});

test('Health endpoint returns ok and status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'ok');
  assert.ok(data.service.includes('Mitra'));
});

test('User registration with validation', async () => {
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  const regPayload = {
    name: 'Test Resident',
    email: `resident.${randomSuffix}@greenwood.org`,
    phone: `+91 91000 ${randomSuffix}`,
    password: 'Password@123',
    unit: { block: 'Block B', flat: '504' },
  };

  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  });

  const data = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.accessToken);
  assert.strictEqual(data.data.user.email, regPayload.email);
  residentToken = data.data.accessToken;
});

test('User login with valid credentials', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'sunil.mehta@example.com',
      password: 'Resident@123',
    }),
  });

  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginData.success, true);
  assert.ok(loginData.data.accessToken);
});

test('User login with invalid credentials fails with 401', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'sunil.mehta@example.com',
      password: 'WrongPassword999',
    }),
  });

  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 401);
  assert.strictEqual(loginData.success, false);
});

test('Dedicated Admin login with role verification', async () => {
  const adminRes = await fetch(`${baseUrl}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@mitra.org',
      password: 'Admin@123456',
    }),
  });

  const adminData = await adminRes.json();
  assert.strictEqual(adminRes.status, 200);
  assert.strictEqual(adminData.success, true);
  assert.ok(adminData.data.accessToken);
  assert.strictEqual(adminData.data.user.role, 'admin');
  adminToken = adminData.data.accessToken;
});

test('Regular resident cannot login via admin portal', async () => {
  const res = await fetch(`${baseUrl}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sunil.mehta@example.com',
      password: 'Resident@123',
    }),
  });

  const data = await res.json();
  assert.strictEqual(res.status, 403);
  assert.strictEqual(data.success, false);
});

test('Fetch Notices and circulars with authorization', async () => {
  const res = await fetch(`${baseUrl}/notices`, {
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('Unauthorized request without Bearer token returns 401', async () => {
  const res = await fetch(`${baseUrl}/notices`);
  assert.strictEqual(res.status, 401);
});

test('Admin can fetch dashboard metrics', async () => {
  const res = await fetch(`${baseUrl}/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.stats);
  assert.ok(Array.isArray(data.data.registrationTrend));
});

test('Regular resident cannot access admin metrics (RBAC check)', async () => {
  const res = await fetch(`${baseUrl}/admin/metrics`, {
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  assert.strictEqual(res.status, 403);
});

test('Central Admin can login and fetch central multi-community metrics (Module 1)', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'centraladmin@mitra.org',
      password: 'Central@123456',
    }),
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginData.data.user.role, 'superadmin');

  const centralToken = loginData.data.accessToken;

  const metricsRes = await fetch(`${baseUrl}/admin/central-metrics`, {
    headers: { Authorization: `Bearer ${centralToken}` },
  });
  const metricsData = await metricsRes.json();
  assert.strictEqual(metricsRes.status, 200);
  assert.strictEqual(metricsData.success, true);
  assert.ok(metricsData.data.summary.totalCommunities >= 3);
  assert.ok(Array.isArray(metricsData.data.monthlyTrends));
});

test('Resident can raise a complaint and track its status (Module 3)', async () => {
  const complaintRes = await fetch(`${baseUrl}/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${residentToken}`,
    },
    body: JSON.stringify({
      title: 'Water filter pressure low in Flat 402',
      description: 'The kitchen inlet valve has reduced pressure since morning.',
      category: 'Plumbing',
      priority: 'high',
    }),
  });
  const complaintData = await complaintRes.json();
  assert.strictEqual(complaintRes.status, 201);
  assert.strictEqual(complaintData.success, true);
  assert.strictEqual(complaintData.data.status, 'pending');
  assert.ok(complaintData.data.referenceNo.startsWith('CMP-'));

  const myComplaintsRes = await fetch(`${baseUrl}/complaints/my`, {
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  const myComplaintsData = await myComplaintsRes.json();
  assert.strictEqual(myComplaintsRes.status, 200);
  assert.ok(myComplaintsData.count >= 1);
});

test('Public ads & community posters endpoint returns active items (Module 1)', async () => {
  const adsRes = await fetch(`${baseUrl}/ads/public`, {
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  const adsData = await adsRes.json();
  assert.strictEqual(adsRes.status, 200);
  assert.strictEqual(adsData.success, true);
  assert.ok(adsData.data.length >= 1);
});

test('Admin can create a new Community Manager (Module 2)', async () => {
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  const managerRes = await fetch(`${baseUrl}/admin/managers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Test Operations Manager',
      email: `manager.${randomSuffix}@greenwoodheights.org`,
      phone: `+91 97000 ${randomSuffix}`,
      password: 'Manager@123456',
      designation: 'Facility Lead',
      block: 'Block B',
    }),
  });
  const managerData = await managerRes.json();
  assert.strictEqual(managerRes.status, 201);
  assert.strictEqual(managerData.success, true);
  assert.strictEqual(managerData.data.role, 'community_manager');
});


test('Campaign workflow: create draft, submit, approve, and analytics', async () => {
  // 1. Create campaign as draft
  const createRes = await fetch(`${baseUrl}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Automated Test Community Campaign',
      description: 'Promotional announcement for test society event.',
      badgeText: 'FEATURED',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      category: 'Community Poster',
      submitImmediately: false,
    }),
  });
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createData.data.status, 'draft');
  const campaignId = createData.data._id;

  // 2. Submit campaign for approval
  const submitRes = await fetch(`${baseUrl}/campaigns/${campaignId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ note: 'Ready for admin review.' }),
  });
  const submitData = await submitRes.json();
  assert.strictEqual(submitRes.status, 200);
  assert.strictEqual(submitData.data.status, 'pending_approval');

  // 3. Approve campaign as Admin
  const approveRes = await fetch(`${baseUrl}/campaigns/${campaignId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ note: 'Approved for society feed.', publishNow: true }),
  });
  const approveData = await approveRes.json();
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveData.data.status, 'active');

  // 4. Record impression and click
  const clickRes = await fetch(`${baseUrl}/campaigns/${campaignId}/click`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  assert.strictEqual(clickRes.status, 200);

  // 5. Check campaign analytics
  const analyticsRes = await fetch(`${baseUrl}/campaigns/${campaignId}/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const analyticsData = await analyticsRes.json();
  assert.strictEqual(analyticsRes.status, 200);
  assert.strictEqual(analyticsData.data.clicks, 1);
});

test('CSV Report Export returns text/csv for authorized admin', async () => {
  const exportRes = await fetch(`${baseUrl}/admin/reports/export?type=communities`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(exportRes.status, 200);
  assert.ok(exportRes.headers.get('content-type')?.includes('text/csv'));
  const text = await exportRes.text();
  assert.ok(text.includes('Greenwood Heights Society'));
});

test('Notification creation, unread count and mark as read', async () => {
  // Check notifications for resident
  const notifRes = await fetch(`${baseUrl}/notifications`, {
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  const notifData = await notifRes.json();
  assert.strictEqual(notifRes.status, 200);
  assert.ok(Array.isArray(notifData.data));

  // Mark all as read
  const markRes = await fetch(`${baseUrl}/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${residentToken}` },
  });
  const markData = await markRes.json();
  assert.strictEqual(markRes.status, 200);
  assert.strictEqual(markData.success, true);
});
