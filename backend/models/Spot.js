const mongoose = require('mongoose');

const SpotSchema = new mongoose.Schema(
    {
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Spot title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        pricePerHour: {
            type: Number,
            required: [true, 'Price per hour is required'],
            min: [1, 'Price must be at least ₹1'],
        },
        status: {
            type: String,
            enum: ['available', 'reserved', 'occupied'],
            default: 'available',
        },
        reservedUntil: {
            type: Date,
            default: null,
        },
        reservedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        amenities: {
            type: [String],
            default: [],
        },
        totalBookings: {
            type: Number,
            default: 0,
        },
        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        images: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// 2dsphere index for geospatial queries
SpotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Spot', SpotSchema);
