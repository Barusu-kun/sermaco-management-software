// tests/health.test.js — Smoke test (ne nécessite pas de base de données)
const request = require('supertest');
const app = require('../src/app');

describe('Health & routing', () => {
  it('GET /health répond 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Route inconnue répond 404', async () => {
    const res = await request(app).get('/api/v1/inconnu');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Route protégée sans token répond 401', async () => {
    const res = await request(app).get('/api/v1/personnel');
    expect(res.status).toBe(401);
  });
});
