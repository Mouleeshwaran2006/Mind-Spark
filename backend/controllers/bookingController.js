const crypto = require('crypto');
const Booking = require('../models/Booking');
const Spot = require('../models/Spot');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

const PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION) || 0.20;

// @desc    Create a booking with Atomic Concurrency Lock
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const {
            spotId,
            category = 'parking',
            quantity = 1,
            checkInDate,
            checkOutDate,
            bookingMonths = 1,
            durationHours = 1,
            vehicleNumber = '',
            guestCount = 1,
            specialRequests = ''
        } = req.body;

        if (!spotId) {
            return res.status(400).json({ success: false, message: 'spotId is required.' });
        }

        const numUnits = Math.max(1, parseInt(quantity) || 1);

        // ATOMIC CONCURRENCY LOCK:
        // Atomically decrement availableCount only if availableCount >= numUnits
        const spot = await Spot.findOneAndUpdate(
            {
                _id: spotId,
                isActive: true,
                availableCount: { $gte: numUnits }
            },
            {
                $inc: { availableCount: -numUnits }
            },
            { new: true }
        );

        if (!spot) {
            return res.status(409).json({
                success: false,
                message: 'No vacancy left! Another user just booked the remaining slot(s).',
            });
        }

        // If no units left, mark status as occupied/full
        if (spot.availableCount <= 0) {
            await Spot.findByIdAndUpdate(spotId, { status: 'occupied' });
        }

        // Calculate pricing based on category
        const cat = spot.category || category.toLowerCase();
        let totalCost = 0;
        let unitPrice = 0;
        let deposit = 0;
        let calculatedDuration = durationHours;

        if (cat === 'hotel') {
            unitPrice = spot.pricePerNight || (spot.pricePerHour * 24) || 1200;
            let nights = 1;
            if (checkInDate && checkOutDate) {
                const diffTime = Math.abs(new Date(checkOutDate) - new Date(checkInDate));
                nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
            calculatedDuration = nights * 24;
            totalCost = Math.ceil(nights * unitPrice * numUnits);
        } else if (cat === 'pg') {
            unitPrice = spot.pricePerMonth || 6000;
            deposit = spot.depositAmount || 2000;
            const months = Math.max(1, parseInt(bookingMonths) || 1);
            totalCost = (months * unitPrice * numUnits) + deposit;
        } else {
            // Parking
            unitPrice = spot.pricePerHour || 40;
            calculatedDuration = Math.max(1, parseFloat(durationHours) || 2);
            totalCost = Math.ceil(calculatedDuration * unitPrice * numUnits);
        }

        const platformCommission = Math.ceil(totalCost * PLATFORM_COMMISSION);
        const hostEarning = totalCost - platformCommission;

        // Create Razorpay order (amount in paise)
        let razorpayOrder = null;
        try {
            if (razorpay && process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('YOUR_KEY_ID')) {
                razorpayOrder = await razorpay.orders.create({
                    amount: totalCost * 100,
                    currency: 'INR',
                    receipt: `bk_${Date.now()}`,
                    notes: {
                        spotId: spot._id.toString(),
                        userId: req.user._id.toString(),
                        category: cat
                    },
                });
            }
        } catch (rzpErr) {
            console.warn('Razorpay order creation skipped/failed:', rzpErr.message);
        }

        const booking = await Booking.create({
            driver: req.user._id,
            spot: spot._id,
            host: spot.host,
            category: cat,
            quantity: numUnits,
            startTime: new Date(),
            checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
            checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
            bookingMonths: parseInt(bookingMonths) || 1,
            durationHours: calculatedDuration,
            unitPrice,
            pricePerHour: spot.pricePerHour || 0,
            depositAmount: deposit,
            totalCost,
            hostEarning,
            platformCommission,
            vehicleNumber,
            guestCount: parseInt(guestCount) || 1,
            specialRequests,
            status: 'active',
            razorpayOrderId: razorpayOrder ? razorpayOrder.id : `order_mock_${Date.now()}`
        });

        await booking.populate([
            { path: 'spot', select: 'title address pricePerHour pricePerNight pricePerMonth category images location' },
            { path: 'host', select: 'name email phone' },
        ]);

        res.status(201).json({
            success: true,
            message: `Booking confirmed for ${cat.toUpperCase()}! Proceed to payment or check-in.`,
            booking,
            payment: {
                amount: totalCost,
                currency: 'INR',
                razorpayOrderId: booking.razorpayOrderId,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key',
            }
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Server error creating booking.' });
    }
};

// @desc    Get all bookings for current user
// @route   GET /api/bookings/driver
// @access  Private
const getDriverBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ driver: req.user._id })
            .populate('spot', 'title address pricePerHour pricePerNight pricePerMonth category images')
            .populate('host', 'name phone')
            .sort('-createdAt');
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get active booking for current user
// @route   GET /api/bookings/active
// @access  Private
const getActiveBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ driver: req.user._id, status: 'active' })
            .populate('spot', 'title address pricePerHour pricePerNight pricePerMonth category images location')
            .populate('host', 'name phone');
        res.json({ success: true, booking: booking || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all bookings for host's properties
// @route   GET /api/bookings/host
// @access  Private (host)
const getHostBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ host: req.user._id })
            .populate('spot', 'title address pricePerHour pricePerNight pricePerMonth category')
            .populate('driver', 'name email phone')
            .sort('-createdAt');
        res.json({ success: true, count: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    End parking/stay session & calculate final checkout billing
// @route   PUT /api/bookings/:id/complete
// @access  Private
const completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('spot');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        const endTime = new Date();
        booking.endTime = endTime;
        booking.status = 'payment_pending';
        await booking.save();

        res.json({
            success: true,
            message: 'Session completed. Ready for payment.',
            booking,
            payment: {
                amount: booking.totalCost,
                currency: 'INR',
                razorpayOrderId: booking.razorpayOrderId,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
                hostEarning: booking.hostEarning,
                platformCommission: booking.platformCommission,
            },
        });
    } catch (error) {
        console.error('Complete booking error:', error);
        res.status(500).json({ success: false, message: 'Server error ending session.' });
    }
};

// @desc    Verify Razorpay payment and finalise booking
// @route   POST /api/bookings/:id/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod = 'card' } = req.body;

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // Verify signature
        let isValid = false;
        try {
            if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('YOUR_KEY_SECRET')) {
                const body = `${razorpay_order_id}|${razorpay_payment_id}`;
                const expectedSignature = crypto
                    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                    .update(body)
                    .digest('hex');
                isValid = expectedSignature === razorpay_signature;
            } else {
                isValid = true; // Demo mode allow
            }
        } catch {
            isValid = true;
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Finalise booking
        booking.razorpayPaymentId = razorpay_payment_id || `pay_${Date.now()}`;
        booking.razorpaySignature = razorpay_signature || 'sig_verified';
        booking.paymentMethod = paymentMethod;
        booking.status = 'completed';
        await booking.save();

        // Increment total completed bookings for the spot
        await Spot.findByIdAndUpdate(booking.spot, { $inc: { totalBookings: 1 } });

        // Update host earnings
        await User.findByIdAndUpdate(booking.host, {
            $inc: {
                'earnings.totalRevenue': booking.hostEarning,
                'earnings.pendingPayout': booking.hostEarning,
            },
        });

        res.json({
            success: true,
            message: 'Payment verified! Booking confirmed. Digital receipt generated.',
            booking,
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying payment.' });
    }
};

// @desc    Demo complete (instant payment simulation for UPI/Cards/GPay)
// @route   PUT /api/bookings/:id/demo-complete
// @access  Private
const demoComplete = async (req, res) => {
    try {
        const { paymentMethod = 'gpay' } = req.body || {};
        const booking = await Booking.findById(req.params.id);
        if (!booking || booking.driver.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        booking.status = 'completed';
        booking.paymentMethod = paymentMethod;
        booking.razorpayPaymentId = `${paymentMethod}_tx_${Date.now()}`;
        await booking.save();

        await Spot.findByIdAndUpdate(booking.spot, { $inc: { totalBookings: 1 } });
        await User.findByIdAndUpdate(booking.host, {
            $inc: { 'earnings.totalRevenue': booking.hostEarning, 'earnings.pendingPayout': booking.hostEarning },
        });

        res.json({ success: true, message: `Payment completed via ${paymentMethod.toUpperCase()}!`, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Cancel a booking & atomically restore vacancy
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.driver.toString() !== req.user._id.toString() && booking.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Atomically restore availableCount
        const quantity = booking.quantity || 1;
        await Spot.findByIdAndUpdate(booking.spot, {
            $inc: { availableCount: quantity },
            $set: { status: 'available' }
        });

        res.json({ success: true, message: 'Booking cancelled. Vacancy restored.', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error cancelling booking.' });
    }
};

module.exports = {
    createBooking,
    getDriverBookings,
    getActiveBooking,
    getHostBookings,
    completeBooking,
    verifyPayment,
    demoComplete,
    cancelBooking
};
