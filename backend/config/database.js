const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

const connectDB = async () => {
  // Support multiple common environment variable names for deployed platforms
  const uriSource = process.env.MONGO_URI ? 'MONGO_URI'
    : process.env.MONGODB_URI ? 'MONGODB_URI'
    : process.env.DATABASE_URL ? 'DATABASE_URL'
    : 'FALLBACK_LOCALHOST';

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/purplle_ai';

  logger.info(`Connecting to MongoDB using source: ${uriSource}`);

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', err => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
   // process.exit(1);
  }
};

module.exports = connectDB;