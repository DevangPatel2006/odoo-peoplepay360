  import app from './app.js';
import env from './config/env.js';

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`[PeoplePay360] Server running in ${env.nodeEnv} mode on port ${PORT}`);
  console.log(`[PeoplePay360] Health check available at http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED_REJECTION]', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
  process.exit(1);
});

export default server;
