const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.warn('⚠️ WARNING: MONGO_URI environment variable is not defined!');
        console.warn('⚠️ Please add your MongoDB Atlas connection string in your Render Environment Variables.');
    }

    const targetUri = uri || 'mongodb://127.0.0.1:27017/mindspark';

    const tryConnect = async (retries = 10, delay = 5000) => {
        try {
            const conn = await mongoose.connect(targetUri, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        } catch (error) {
            console.error(`❌ MongoDB connection error on ${targetUri}: ${error.message}`);
            if (retries > 0) {
                console.log(`🔄 Retrying database connection in ${delay / 1000}s... (${retries} retries left)`);
                setTimeout(() => tryConnect(retries - 1, delay), delay);
            } else {
                console.warn('⚠️ MongoDB could not be connected. The server will keep running to answer health checks and prevent container crash.');
            }
        }
    };

    tryConnect();
};

module.exports = connectDB;
