const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mindspark';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error on ${uri}: ${error.message}`);
    // If external URI failed and it wasn't localhost, attempt localhost fallback
    if (!uri.includes('127.0.0.1') && !uri.includes('localhost')) {
      try {
        console.log('🔄 Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/mindspark)...');
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/mindspark');
        console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Local fallback also failed: ${fallbackError.message}`);
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;
