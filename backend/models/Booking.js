const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        spot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Spot',
            required: true,
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            enum: ['parking', 'hotel', 'pg'],
            default: 'parking',
        },
        quantity: {
            type: Number,
            default: 1, // Number of slots / rooms / beds
            min: 1,
        },
        // Dates & Timing
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
            default: null,
        },
        checkInDate: {
            type: Date,
            default: null,
        },
        checkOutDate: {
            type: Date,
            default: null,
        },
        bookingMonths: {
            type: Number,
            default: 1,
        },
        durationHours: {
            type: Number,
            default: 0,
        },
        // Pricing breakdown
        unitPrice: {
            type: Number,
            default: 0,
        },
        pricePerHour: {
            type: Number,
            default: 0,
        },
        depositAmount: {
            type: Number,
            default: 0,
        },
        totalCost: {
            type: Number,
            default: 0,
        },
        hostEarning: {
            type: Number,
            default: 0, // 80% of totalCost
        },
        platformCommission: {
            type: Number,
            default: 0, // 20% of totalCost
        },
        // Customer metadata
        vehicleNumber: {
            type: String,
            default: '',
        },
        guestCount: {
            type: Number,
            default: 1,
        },
        specialRequests: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['active', 'confirmed', 'payment_pending', 'completed', 'cancelled'],
            default: 'active',
        },
        paymentMethod: {
            type: String,
            enum: ['upi', 'card', 'netbanking', 'demo', 'cash', 'pending'],
            default: 'pending',
        },
        razorpayOrderId: {
            type: String,
            default: null,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },
        razorpaySignature: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
