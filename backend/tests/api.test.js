process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
jest.mock('../db/pool', () => ({ query: jest.fn(), on: jest.fn(), end: jest.fn() }));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const app = require('../app');

const tokenFor = (role) => jwt.sign({ id: 1, username: 'u', role }, process.env.JWT_SECRET);
const employeeRow = { id: 1, full_name: 'A', email: 'a@x.com', salary: '85000' };

beforeEach(() => pool.query.mockReset());

describe('health', () => {
  test('/health is always 200', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
  });
  test('/ready is 200 when the DB answers', async () => {
    pool.query.mockResolvedValue({ rows: [{}] });
    expect((await request(app).get('/ready')).status).toBe(200);
  });
  test('/ready is 503 when the DB is down', async () => {
    pool.query.mockRejectedValue(new Error('down'));
    expect((await request(app).get('/ready')).status).toBe(503);
  });
});

describe('auth', () => {
  test('login without body is 400', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400);
  });
  test('login with unknown user is 401', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    expect((await request(app).post('/api/auth/login').send({ username: 'x', password: 'y' })).status).toBe(401);
  });
  test('login success returns a token', async () => {
    const hash = await bcrypt.hash('correct-horse-battery', 4);
    pool.query.mockResolvedValue({ rows: [{ id: 1, username: 'admin', password_hash: hash, role: 'admin' }] });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'correct-horse-battery' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
  test('change-password requires authentication', async () => {
    expect((await request(app).post('/api/auth/change-password').send({})).status).toBe(401);
  });
  test('change-password rejects a short new password', async () => {
    const res = await request(app).post('/api/auth/change-password')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ current_password: 'old', new_password: 'short' });
    expect(res.status).toBe(400);
  });
  test('change-password with wrong current password is 400, not 401', async () => {
    const hash = await bcrypt.hash('real-password-123', 4);
    pool.query.mockResolvedValue({ rows: [{ password_hash: hash }] });
    const res = await request(app).post('/api/auth/change-password')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ current_password: 'wrong-password-123', new_password: 'a-brand-new-password' });
    expect(res.status).toBe(400);
  });
  test('change-password success is 204', async () => {
    const hash = await bcrypt.hash('real-password-123', 4);
    pool.query.mockResolvedValueOnce({ rows: [{ password_hash: hash }] }).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/change-password')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ current_password: 'real-password-123', new_password: 'a-brand-new-password' });
    expect(res.status).toBe(204);
  });
});

describe('authorization', () => {
  test('no token is 401', async () => {
    expect((await request(app).get('/api/employees')).status).toBe(401);
  });
  test('employee role does NOT see salaries', async () => {
    pool.query.mockResolvedValue({ rows: [employeeRow] });
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${tokenFor('employee')}`);
    expect(res.status).toBe(200);
    expect(res.body[0]).not.toHaveProperty('salary');
  });
  test('admin role sees salaries', async () => {
    pool.query.mockResolvedValue({ rows: [employeeRow] });
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${tokenFor('admin')}`);
    expect(res.body[0].salary).toBe('85000');
  });
  test('employee role cannot create employees', async () => {
    const res = await request(app).post('/api/employees').set('Authorization', `Bearer ${tokenFor('employee')}`)
      .send({ full_name: 'B', email: 'b@x.com' });
    expect(res.status).toBe(403);
  });
  test('employee role cannot delete inventory', async () => {
    const res = await request(app).delete('/api/inventory/1').set('Authorization', `Bearer ${tokenFor('employee')}`);
    expect(res.status).toBe(403);
  });
});
