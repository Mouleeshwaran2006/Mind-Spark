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
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
            default: null,
        },
        durationHours: {
            type: Number,
            default: 0,
        },
        pricePerHour: {
            type: Number,
            required: true,
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
        status: {
            type: String,
            enum: ['active', 'payment_pending', 'completed', 'cancelled'],
            default: 'active',
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
