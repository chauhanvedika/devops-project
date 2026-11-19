const app = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`EIMS API running on port ${PORT}`));

// Graceful shutdown: Kubernetes sends SIGTERM on rollouts/scale-down. Stop accepting
// new connections, let in-flight requests finish, close the DB pool, then exit.
function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
