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

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Optionally delete all spots and bookings related to this user
        await Spot.deleteMany({ host: req.params.id });
        await Booking.deleteMany({ $or: [{ driver: req.params.id }, { host: req.params.id }] });

        await User.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'User and all related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting user' });
    }
};

// @desc    Delete a spot
// @route   DELETE /api/admin/spots/:id
// @access  Private (admin)
const deleteSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id);
        if (!spot) return res.status(404).json({ success: false, message: 'Spot not found' });

        await Booking.deleteMany({ spot: req.params.id });
        await Spot.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Spot and related bookings deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting spot' });
    }
};

// @desc    Delete a booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private (admin)
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting booking' });
    }
};

// @desc    Update spot status
// @route   PUT /api/admin/spots/:id/status
// @access  Private (admin)
const updateSpotStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['available', 'occupied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const spot = await Spot.findById(req.params.id);
        if (!spot) return res.status(404).json({ success: false, message: 'Spot not found' });

        spot.status = status;
        await spot.save();

        res.json({ success: true, message: `Spot marked as ${status}`, spot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating spot status' });
    }
};

module.exports = { getStats, getAllUsers, getAllBookings, getAllSpots, deleteUser, deleteSpot, deleteBooking, updateSpotStatus };
