require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
    await connectDB();
    const adminEmail = 'admin@mindspark.com';
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
        admin.name = 'admin';
        admin.password = '26967770';
        admin.roles = ['admin', 'driver', 'host'];
        admin.activeRole = 'admin';
        await admin.save();
        console.log('Admin user updated.');
    } else {
        admin = new User({
            name: 'admin',
            email: adminEmail,
            password: '26967770',
            roles: ['admin', 'driver', 'host'],
            activeRole: 'admin'
        });
        await admin.save();
        console.log('Admin user created.');
    }
    process.exit(0);
};

seedAdmin();
