import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { createApp } from '../server/index.js';
import { resetAuthCacheForTests } from './auth-test-utils.js';

describe('Kitchen auth middleware', () => {
  const origAuth = process.env.KITCHEN_AUTH_ENABLED;
  const origUser = process.env.KITCHEN_AUTH_USER;
  const origPassword = process.env.KITCHEN_AUTH_PASSWORD;

  beforeAll(() => {
    process.env.KITCHEN_AUTH_ENABLED = 'true';
    process.env.KITCHEN_AUTH_USER = 'admin';
    process.env.KITCHEN_AUTH_PASSWORD = 'secret123';
  });

  afterAll(() => {
    process.env.KITCHEN_AUTH_ENABLED = origAuth;
    process.env.KITCHEN_AUTH_USER = origUser;
    process.env.KITCHEN_AUTH_PASSWORD = origPassword;
  });

  test('auth disabled when KITCHEN_AUTH_ENABLED is not "true"', async () => {
    const orig = process.env.KITCHEN_AUTH_ENABLED;
    process.env.KITCHEN_AUTH_ENABLED = 'false';
    try {
      const app = createApp();
      const res = await request(app).get('/api/teams').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    } finally {
      process.env.KITCHEN_AUTH_ENABLED = orig;
    }
  });

  test('auth disabled when KITCHEN_AUTH_USER missing (auth enabled)', async () => {
    const origUser = process.env.KITCHEN_AUTH_USER;
    process.env.KITCHEN_AUTH_USER = '';
    try {
      const app = createApp();
      const res = await request(app).get('/api/teams').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    } finally {
      process.env.KITCHEN_AUTH_USER = origUser;
    }
  });

  test('GET /api/teams returns 401 when Authorization is not Basic', async () => {
    const app = createApp();
    await request(app)
      .get('/api/teams')
      .set('Authorization', 'Bearer token')
      .expect(401);
  });

  test('GET /api/teams returns 401 when Basic auth is invalid base64', async () => {
    const app = createApp();
    await request(app)
      .get('/api/teams')
      .set('Authorization', 'Basic !!!invalid-base64!!!')
      .expect(401);
  });

  test('GET /api/teams returns 401 when decoded credentials have no colon', async () => {
    const app = createApp();
    const auth = Buffer.from('adminonly').toString('base64');
    await request(app)
      .get('/api/teams')
      .set('Authorization', `Basic ${auth}`)
      .expect(401);
  });

  test('GET /api/health is exempt (no auth required)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('GET /api/auth/status is exempt (no auth required)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/status').expect(200);
    expect(res.body).toHaveProperty('authRequired', true);
  });

  test('GET /api/teams returns 401 without auth', async () => {
    const app = createApp();
    const res = await request(app).get('/api/teams').expect(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  test('GET /api/teams returns 200 with valid Basic auth', async () => {
    const app = createApp();
    const auth = Buffer.from('admin:secret123').toString('base64');
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Basic ${auth}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/teams returns 401 with invalid password', async () => {
    const app = createApp();
    const auth = Buffer.from('admin:wrong').toString('base64');
    await request(app)
      .get('/api/teams')
      .set('Authorization', `Basic ${auth}`)
      .expect(401);
  });

  test('GET /api/teams returns 401 with invalid username', async () => {
    const app = createApp();
    const auth = Buffer.from('wrong:secret123').toString('base64');
    await request(app)
      .get('/api/teams')
      .set('Authorization', `Basic ${auth}`)
      .expect(401);
  });

  test('GET /api/teams returns 200 when password is read from KITCHEN_AUTH_PASSWORD_FILE', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'kitchen-auth-test-'));
    const filePath = join(dir, 'password');
    try {
      writeFileSync(filePath, 'secret123', 'utf8');
      const origPassword = process.env.KITCHEN_AUTH_PASSWORD;
      const origPasswordFile = process.env.KITCHEN_AUTH_PASSWORD_FILE;
      delete process.env.KITCHEN_AUTH_PASSWORD;
      process.env.KITCHEN_AUTH_PASSWORD_FILE = filePath;
      resetAuthCacheForTests();
      try {
        const app = createApp();
        const auth = Buffer.from('admin:secret123').toString('base64');
        const res = await request(app)
          .get('/api/teams')
          .set('Authorization', `Basic ${auth}`)
          .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
      } finally {
        process.env.KITCHEN_AUTH_PASSWORD = origPassword;
        process.env.KITCHEN_AUTH_PASSWORD_FILE = origPasswordFile;
        resetAuthCacheForTests();
      }
    } finally {
      unlinkSync(filePath);
      rmdirSync(dir);
    }
  });
});
