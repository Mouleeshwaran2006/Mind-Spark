const mongoose = require('mongoose');

const seedDefaultAdmin = async () => {
    try {
        const User = require('../models/User');
        const adminEmail = 'admin@mindspark.com';
        const exists = await User.findOne({ email: adminEmail });
        if (!exists) {
            console.log('🌱 No admin user found in database. Auto-seeding default admin...');
            await User.create({
                name: 'Administrator',
                email: adminEmail,
                password: 'password123',
                roles: ['admin', 'driver', 'host'],
                activeRole: 'admin',
            });
            console.log('✅ Default admin auto-created: admin@mindspark.com / password123');
        }
    } catch (err) {
        console.warn('⚠️ Admin auto-seed note:', err.message);
    }
};

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
            await seedDefaultAdmin();
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
