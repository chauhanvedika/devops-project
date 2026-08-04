require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const inventoryRoutes = require('./routes/inventory');
const lookupRoutes = require('./routes/lookups');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security middleware ---
app.use(helmet());

const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

app.use(express.json({ limit: '10kb' }));

// --- Health check (used by Docker/K8s probes and load balancer) ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'eims-backend' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', lookupRoutes); // /api/departments, /api/categories
app.use('/api/dashboard', dashboardRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Generic error handler (never leak stack traces) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EIMS API running on port ${PORT}`);
});
