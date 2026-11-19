require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const pool = require('./db/pool');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const inventoryRoutes = require('./routes/inventory');
const lookupRoutes = require('./routes/lookups');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Number of reverse proxies in front of the API (nginx = 1, ingress + nginx = 2).
// Needed so rate limiting sees the real client IP instead of the proxy's.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

app.use(helmet());
// FRONTEND_ORIGIN=none -> same-origin deployment (nginx proxies /api): CORS stays off entirely.
if (process.env.FRONTEND_ORIGIN !== 'none') {
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }));
}

// Structured one-line JSON access log (no query strings, no bodies, no tokens).
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/ready' || process.env.NODE_ENV === 'test') return next();
  const logPath = req.originalUrl.split('?')[0]; // req.path is rewritten inside routers
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    console.log(JSON.stringify({
      ts: new Date().toISOString(), method: req.method, path: logPath,
      status: res.statusCode, ms: Number((process.hrtime.bigint() - start) / 1000000n),
      user: req.user?.username,
    }));
  });
  next();
});

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));
app.use(express.json({ limit: '10kb' }));

// Liveness: the process is up. Readiness: the process can actually serve (DB reachable).
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'eims-backend' }));
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', lookupRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
