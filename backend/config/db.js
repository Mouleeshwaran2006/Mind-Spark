const mongoose = require('mongoose');

const autoInitDB = async () => {
    try {
        const User = require('../models/User');
        const Spot = require('../models/Spot');

        // Ensure 2dsphere index is built
        await Spot.init();

        // Ensure admin user exists
        const adminEmail = 'admin@mindspark.com';
        const admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            await User.create({
                name: 'Admin',
                email: adminEmail,
                password: 'password123',
                roles: ['admin', 'driver', 'host'],
                activeRole: 'admin',
            });
            console.log('✅ Auto-created admin user: admin@mindspark.com / password123');
        }

        // Ensure host user exists
        const hostEmail = 'host@mindspark.com';
        let host = await User.findOne({ email: hostEmail });
        if (!host) {
            host = await User.create({
                name: 'Demo Host',
                email: hostEmail,
                password: 'password123',
                roles: ['host', 'driver'],
                activeRole: 'host',
                phone: '+91 98765 43210',
            });
            console.log('✅ Auto-created host user: host@mindspark.com / password123');
        }

        // Ensure sample listings for Parking, Hotels, and PG exist
        const parkingCount = await Spot.countDocuments({ category: 'parking' });
        if (parkingCount === 0) {
            await Spot.insertMany([
                {
                    host: host._id,
                    title: 'Prime Tech Park Parking',
                    category: 'parking',
                    description: 'Covered parking with 24/7 CCTV, security guards, and fast EV charging facility.',
                    address: 'Tidel Park, Rajiv Gandhi Salai, Taramani, Chennai',
                    location: { type: 'Point', coordinates: [80.2425, 12.9892] },
                    pricePerHour: 40,
                    pricePerDay: 300,
                    totalCapacity: 10,
                    availableCount: 7,
                    vehicleType: 'four-wheeler',
                    isCovered: true,
                    hasEVCharging: true,
                    status: 'available',
                    amenities: ['CCTV', 'Covered', 'EV Charging', 'Security Guard', '24/7 Access'],
                    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80']
                },
                {
                    host: host._id,
                    title: 'City Center Mall Driveway',
                    category: 'parking',
                    description: 'Spacious paved parking right outside Express Avenue Mall entrance with valet service.',
                    address: 'Express Avenue, Royapettah, Chennai',
                    location: { type: 'Point', coordinates: [80.2608, 13.0587] },
                    pricePerHour: 50,
                    pricePerDay: 400,
                    totalCapacity: 5,
                    availableCount: 3,
                    vehicleType: 'all',
                    isCovered: false,
                    hasEVCharging: false,
                    status: 'available',
                    amenities: ['CCTV', 'Valet Available', 'Paved Surface', 'Well Lit'],
                    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80']
                },
                {
                    host: host._id,
                    title: 'Metro Station Secure Bay',
                    category: 'parking',
                    description: 'Fast commute parking right next to Guindy Metro station entry gate.',
                    address: 'Guindy Metro Station, Chennai',
                    location: { type: 'Point', coordinates: [80.2128, 13.0067] },
                    pricePerHour: 30,
                    pricePerDay: 200,
                    totalCapacity: 8,
                    availableCount: 6,
                    vehicleType: 'all',
                    isCovered: true,
                    hasEVCharging: true,
                    status: 'available',
                    amenities: ['CCTV', 'Well Lit', '24/7 Access', 'Security Guard'],
                    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80']
                }
            ]);
            console.log('✅ Seeded Parking spaces.');
        }

        const hotelCount = await Spot.countDocuments({ category: 'hotel' });
        if (hotelCount === 0) {
            await Spot.insertMany([
                {
                    host: host._id,
                    title: 'Grand Luxury Executive Suite Hotel',
                    category: 'hotel',
                    description: 'Premium 4-star hotel stay with luxury king-size bed, high-speed WiFi, swimming pool, and complimentary buffet breakfast.',
                    address: 'OMR IT Expressway, Perungudi, Chennai',
                    location: { type: 'Point', coordinates: [80.2396, 12.9654] },
                    pricePerNight: 2400,
                    pricePerHour: 150,
                    totalCapacity: 12,
                    availableCount: 5,
                    roomType: 'deluxe',
                    acAvailable: true,
                    checkInTime: '12:00 PM',
                    checkOutTime: '11:00 AM',
                    status: 'available',
                    amenities: ['AC', 'Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Room Service', 'Gym'],
                    images: [
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
                    ]
                },
                {
                    host: host._id,
                    title: 'Coastal Breeze Boutique Stay',
                    category: 'hotel',
                    description: 'Serene beachside boutique hotel close to Thiruvanmiyur beach with modern amenities and attached balcony.',
                    address: 'East Coast Road, Thiruvanmiyur, Chennai',
                    location: { type: 'Point', coordinates: [80.2589, 12.9830] },
                    pricePerNight: 1850,
                    pricePerHour: 120,
                    totalCapacity: 8,
                    availableCount: 4,
                    roomType: 'standard',
                    acAvailable: true,
                    checkInTime: '01:00 PM',
                    checkOutTime: '11:00 AM',
                    status: 'available',
                    amenities: ['AC', 'Beach View', 'Free WiFi', 'Balcony', 'Smart TV', '24/7 Power Backup'],
                    images: [
                        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'
                    ]
                },
                {
                    host: host._id,
                    title: 'Business Bay Transit Hotel',
                    category: 'hotel',
                    description: 'Modern corporate transit hotel located in the heart of Anna Salai commercial district with fast airport connectivity.',
                    address: 'Anna Salai, Teynampet, Chennai',
                    location: { type: 'Point', coordinates: [80.2450, 13.0400] },
                    pricePerNight: 1400,
                    pricePerHour: 90,
                    totalCapacity: 15,
                    availableCount: 8,
                    roomType: 'single',
                    acAvailable: true,
                    checkInTime: '12:00 PM',
                    checkOutTime: '11:00 AM',
                    status: 'available',
                    amenities: ['AC', 'Work Desk', 'Free WiFi', 'Coffee Maker', 'Express Check-In', 'Elevator'],
                    images: [
                        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
                    ]
                }
            ]);
            console.log('✅ Seeded Hotel rooms.');
        }

        const pgCount = await Spot.countDocuments({ category: 'pg' });
        if (pgCount === 0) {
            await Spot.insertMany([
                {
                    host: host._id,
                    title: 'Green Oasis Luxury Gents PG & Co-Living',
                    category: 'pg',
                    description: 'Fully furnished premium co-living for working professionals & students. 3 times delicious home food included (North & South Indian), 300 Mbps WiFi, daily housekeeping.',
                    address: 'Vijaya Nagar, Velachery, Chennai',
                    location: { type: 'Point', coordinates: [80.2185, 12.9790] },
                    pricePerMonth: 6500,
                    depositAmount: 2000,
                    totalCapacity: 8,
                    availableCount: 4,
                    sharingType: 'double',
                    foodType: 'included',
                    gender: 'male',
                    noticePeriodDays: 30,
                    rules: ['No Smoking inside rooms', 'Visitors allowed in common area', 'Quiet hours after 11 PM'],
                    status: 'available',
                    amenities: ['AC', '3 Times Food', '300 Mbps WiFi', 'Washing Machine', 'Daily Housekeeping', 'RO Purifier', 'Geyser', 'CCTV'],
                    images: [
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
                    ]
                },
                {
                    host: host._id,
                    title: 'Saffron Elite Premium Women\'s PG',
                    category: 'pg',
                    description: 'Safe & secure air-conditioned women\'s PG with 24/7 security guard, biometric access, hygienic food, study tables, and power backup.',
                    address: 'ELCOT SEZ Road, Sholinganallur, Chennai',
                    location: { type: 'Point', coordinates: [80.2280, 12.9010] },
                    pricePerMonth: 7200,
                    depositAmount: 3000,
                    totalCapacity: 6,
                    availableCount: 3,
                    sharingType: 'double',
                    foodType: 'included',
                    gender: 'female',
                    noticePeriodDays: 30,
                    rules: ['Main gate closes at 10:00 PM', 'Female guests allowed', 'Eco-friendly disposal'],
                    status: 'available',
                    amenities: ['AC', 'Biometric Security', '3 Times Food', 'High Speed WiFi', 'Washing Machine', 'Attached Bathroom', 'Lift', 'Power Backup'],
                    images: [
                        'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
                    ]
                },
                {
                    host: host._id,
                    title: 'Urban Hive Modern Unisex Co-Living',
                    category: 'pg',
                    description: 'Spacious independent studio and sharing beds in prime Adyar location with dedicated workspace, self-cooking modular kitchen, lounge area, and zero brokerage.',
                    address: 'Gandhi Nagar, Adyar, Chennai',
                    location: { type: 'Point', coordinates: [80.2520, 13.0070] },
                    pricePerMonth: 8900,
                    depositAmount: 4000,
                    totalCapacity: 10,
                    availableCount: 5,
                    sharingType: 'single',
                    foodType: 'optional',
                    gender: 'unisex',
                    noticePeriodDays: 15,
                    rules: ['Respect roommates privacy', 'Self-cook area cleanup after use'],
                    status: 'available',
                    amenities: ['AC', 'Self-Cooking Kitchen', 'High Speed WiFi', 'Gym', 'Gaming Lounge', 'Smart TV', 'Washing Machine', 'Housekeeping'],
                    images: [
                        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
                    ]
                }
            ]);
            console.log('✅ Seeded PG & Co-Living rooms.');
        }
    } catch (err) {
        console.warn('DB auto-initialization warning:', err.message);
    }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await autoInitDB();
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
