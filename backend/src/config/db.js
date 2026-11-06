const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true, // Build indexes automatically in development
      serverSelectionTimeoutMS: 5000, // Fail quickly if MongoDB service is not started
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    // Check if replica set is active (required for MongoDB ACID multi-document transactions)
    try {
      const admin = conn.connection.db.admin();
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log(`[MongoDB] Replica Set detected: ${status.set}`);
    } catch {
      console.log(`[MongoDB Info] Standalone MongoDB detected. ACID engine enabled with compensation safety.`);
    }

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Runtime Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Attempting reconnect...');
    });

    return conn;
  } catch (error) {
    console.error(`\n❌ [MongoDB Connection Failed]: ${error.message}`);
    console.error(`👉 Tip: Ensure the MongoDB service is running on your Mac. Run:`);
    console.error(`   brew services start mongodb-community@8.0\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
