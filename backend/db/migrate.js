// Idempotent migration runner. Runs as a Kubernetes initContainer / compose one-shot.
// - applies db/migrations/*.sql in order, each in a transaction, tracked in schema_migrations
// - a Postgres advisory lock makes concurrent runs (several replicas) safe
// - creates the first admin from ADMIN_PASSWORD (no default password exists anywhere)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const LOCK_ID = 727274;

async function ensureAdmin(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n > 0) return;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.length > 72) {
    throw new Error('No users exist: set ADMIN_PASSWORD (12-72 chars) to create the first admin');
  }
  const hash = await bcrypt.hash(password, 12);
  await client.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')", [username, hash]);
  console.log(`created first admin user "${username}"`);
}

// Databases created from the old init.sql still contain the publicly documented default admin.
async function warnOnDefaultPassword(client) {
  const { rows } = await client.query('SELECT username, password_hash FROM users');
  for (const u of rows) {
    if (await bcrypt.compare('Admin@12345', u.password_hash)) {
      console.warn(`WARNING: user "${u.username}" still has the publicly known default password. Change it now: POST /api/auth/change-password`);
    }
  }
}

async function seedDemo(client) {
  const { rows } = await client.query('SELECT (SELECT COUNT(*) FROM employees) + (SELECT COUNT(*) FROM inventory_items) AS n');
  if (Number(rows[0].n) > 0) return;
  await client.query(fs.readFileSync(path.join(__dirname, 'seed-demo.sql'), 'utf8'));
  console.log('demo data loaded');
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())');
    const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    const dir = path.join(__dirname, 'migrations');
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    await ensureAdmin(client);
    await warnOnDefaultPassword(client);
    if (process.env.SEED_DEMO === 'true') await seedDemo(client);
    console.log('migrations complete');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('migration failed:', err.message); process.exit(1); });
