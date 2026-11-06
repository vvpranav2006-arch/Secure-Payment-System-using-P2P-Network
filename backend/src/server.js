const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const server = http.createServer(app);

const startServer = async () => {
  // Connect to Database
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 PayPulse P2P Wallet API Server running`);
    console.log(`📡 URL: http://localhost:${env.PORT}`);
    console.log(`🛡️  Environment: ${env.NODE_ENV}`);
    console.log(`====================================================`);
  });
};

// Graceful Shutdown Handlers
const handleGracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('[MongoDB] Database connection closed safely.');
      process.exit(0);
    } catch (err) {
      console.error('[MongoDB] Error during connection close:', err);
      process.exit(1);
    }
  });

  // Force exit if not terminated within 10s
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[Critical] Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Critical] Uncaught Exception:', err);
  process.exit(1);
});

startServer();

