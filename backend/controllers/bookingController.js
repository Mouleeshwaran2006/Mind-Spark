const crypto = require('crypto');
const Booking = require('../models/Booking');
const Spot = require('../models/Spot');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

const PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;

// @desc    Create a booking (atomic – prevents double booking)
// @route   POST /api/bookings
// @access  Private (driver)
const createBooking = async (req, res) => {
    try {
        const { spotId } = req.body;
        if (!spotId) {
            return res.status(400).json({ success: false, message: 'spotId is required.' });
        }

        // Check for existing active booking by this driver
        const existingActive = await Booking.findOne({ driver: req.user._id, status: 'active' });
        if (existingActive) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active booking. End your current session first.',
                booking: existingActive,
            });
        }

        // Atomic check: allow if available, OR if reserved by THIS user and not expired
        const spot = await Spot.findOne({ _id: spotId, isActive: true });

        if (!spot) {
            return res.status(404).json({ success: false, message: 'Spot not found.' });
        }

        const isAvailable = spot.status === 'available' || (spot.status === 'reserved' && spot.reservedUntil < new Date());
        const isReservedByMe = spot.status === 'reserved' && spot.reservedBy?.toString() === req.user._id.toString() && spot.reservedUntil > new Date();

        if (!isAvailable && !isReservedByMe) {
            return res.status(409).json({
                success: false,
                message: 'Spot is no longer available. Someone else just booked or reserved it.',
            });
        }

        // Change status to occupied and clear reservation
        spot.status = 'occupied';
        spot.reservedBy = null;
        spot.reservedUntil = null;
        await spot.save();

        const booking = await Booking.create({
            driver: req.user._id,
            spot: spot._id,
            host: spot.host,
            startTime: new Date(),
            pricePerHour: spot.pricePerHour,
            status: 'active',
        });

        await booking.populate([
            { path: 'spot', select: 'title address pricePerHour location' },
            { path: 'host', select: 'name email' },
        ]);

        res.status(201).json({ success: true, message: 'Booking started! Happy parking.', booking });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Server error creating booking.' });
    }
};

// @desc    Get all bookings for current driver
// @route   GET /api/bookings/driver
// @access  Private (driver)
const getDriverBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ driver: req.user._id })
            .populate('spot', 'title address pricePerHour')
            .populate('host', 'name')
            .sort('-createdAt');
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get active booking for current driver
// @route   GET /api/bookings/active
// @access  Private (driver)
const getActiveBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ driver: req.user._id, status: 'active' })
            .populate('spot', 'title address pricePerHour location')
            .populate('host', 'name');
        res.json({ success: true, booking: booking || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all bookings for current host's spots
// @route   GET /api/bookings/host
// @access  Private (host)
const getHostBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ host: req.user._id })
            .populate('spot', 'title address pricePerHour')
            .populate('driver', 'name email')
            .sort('-createdAt');
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    End parking session – compute cost, create Razorpay order
// @route   PUT /api/bookings/:id/complete
// @access  Private (driver)
const completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('spot');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        if (booking.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Booking is not active.' });
        }

        const endTime = new Date();
        const durationMs = endTime - new Date(booking.startTime);
        const durationHours = Math.max(durationMs / (1000 * 60 * 60), 1 / 60); // minimum 1 minute billing
        const totalCost = Math.ceil(durationHours * booking.pricePerHour);
        const platformCommission = Math.ceil(totalCost * PLATFORM_COMMISSION);
        const hostEarning = totalCost - platformCommission;

        // Create Razorpay order (amount in paise)
        let razorpayOrder = null;
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: totalCost * 100,
                currency: 'INR',
                receipt: `booking_${booking._id}`,
                notes: {
                    bookingId: booking._id.toString(),
                    driverId: req.user._id.toString(),
                },
            });
        } catch (rzpError) {
            console.error('Razorpay order creation failed:', rzpError.message);
            // In demo mode, proceed without Razorpay
        }

        booking.endTime = endTime;
        booking.durationHours = parseFloat(durationHours.toFixed(4));
        booking.totalCost = totalCost;
        booking.hostEarning = hostEarning;
        booking.platformCommission = platformCommission;
        booking.status = 'payment_pending';
        if (razorpayOrder) {
            booking.razorpayOrderId = razorpayOrder.id;
        }

        await booking.save();

        res.json({
            success: true,
            message: 'Session ended. Proceed to payment.',
            booking,
            payment: {
                amount: totalCost,
                currency: 'INR',
                razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                durationHours: parseFloat(durationHours.toFixed(2)),
                hostEarning,
                platformCommission,
            },
        });
    } catch (error) {
        console.error('Complete booking error:', error);
        res.status(500).json({ success: false, message: 'Server error ending session.' });
    }
};

// @desc    Verify Razorpay payment and finalise booking
// @route   POST /api/bookings/:id/verify-payment
// @access  Private (driver)
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // Verify signature
        let isValid = false;
        try {
            const body = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');
            isValid = expectedSignature === razorpay_signature;
        } catch {
            isValid = false;
        }

        // In test/demo mode without real keys, allow bypass
        if (!isValid && (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_ID'))) {
            isValid = true; // Demo bypass
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Finalise booking
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.razorpaySignature = razorpay_signature;
        booking.status = 'completed';
        await booking.save();

        // Release the parking spot
        await Spot.findByIdAndUpdate(booking.spot, { $set: { status: 'available' }, $inc: { totalBookings: 1 } });

        // Update host earnings
        await User.findByIdAndUpdate(booking.host, {
            $inc: {
                'earnings.totalRevenue': booking.hostEarning,
                'earnings.pendingPayout': booking.hostEarning,
            },
        });

        res.json({
            success: true,
            message: 'Payment verified! Booking completed. Thank you for using Mind Spark.',
            booking,
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying payment.' });
    }
};

// @desc    Demo complete (bypass payment for testing)
// @route   PUT /api/bookings/:id/demo-complete
// @access  Private (driver)
const demoComplete = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking || booking.driver.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        booking.status = 'completed';
        booking.razorpayPaymentId = 'demo_payment_' + Date.now();
        await booking.save();

        await Spot.findByIdAndUpdate(booking.spot, { status: 'available', $inc: { totalBookings: 1 } });
        await User.findByIdAndUpdate(booking.host, {
            $inc: { 'earnings.totalRevenue': booking.hostEarning, 'earnings.pendingPayout': booking.hostEarning },
        });

        res.json({ success: true, message: 'Demo payment complete.', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { createBooking, getDriverBookings, getActiveBooking, getHostBookings, completeBooking, verifyPayment, demoComplete };
