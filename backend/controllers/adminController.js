const User = require('../models/User');
const Spot = require('../models/Spot');
const Booking = require('../models/Booking');

// @desc    Get system-wide analytics
// @route   GET /api/admin/stats
// @access  Private (admin)
const getStats = async (req, res) => {
    try {
        const [totalUsers, totalSpots, totalBookings] = await Promise.all([
            User.countDocuments(),
            Spot.countDocuments({ isActive: true }),
            Booking.countDocuments(),
        ]);

        const totalHosts = await User.countDocuments({ roles: 'host' });
        const totalDrivers = await User.countDocuments({ roles: 'driver' });
        const activeBookings = await Booking.countDocuments({ status: 'active' });
        const availableSpots = await Spot.countDocuments({ status: 'available', isActive: true });
        const occupiedSpots = await Spot.countDocuments({ status: 'occupied' });

        // Revenue aggregation
        const revenueAgg = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalCost' },
                    totalCommission: { $sum: '$platformCommission' },
                    totalHostEarnings: { $sum: '$hostEarning' },
                    completedBookings: { $count: {} },
                },
            },
        ]);

        const revenue = revenueAgg[0] || {
            totalRevenue: 0,
            totalCommission: 0,
            totalHostEarnings: 0,
            completedBookings: 0,
        };

        // Bookings over the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const bookingsByDay = await Booking.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalCost' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalHosts,
                totalDrivers,
                totalSpots,
                activeBookings,
                availableSpots,
                occupiedSpots,
                totalBookings,
                completedBookings: revenue.completedBookings,
                totalRevenue: revenue.totalRevenue,
                platformCommission: revenue.totalCommission,
                totalHostEarnings: revenue.totalHostEarnings,
            },
            bookingsByDay,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching stats.' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt').select('-password');
        res.json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
// @access  Private (admin)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('driver', 'name email')
            .populate('spot', 'title address')
            .populate('host', 'name email')
            .sort('-createdAt')
            .limit(100);
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all spots (admin)
// @route   GET /api/admin/spots
// @access  Private (admin)
const getAllSpots = async (req, res) => {
    try {
        const spots = await Spot.find().populate('host', 'name email').sort('-createdAt');
        res.json({ success: true, count: spots.length, spots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getStats, getAllUsers, getAllBookings, getAllSpots };
