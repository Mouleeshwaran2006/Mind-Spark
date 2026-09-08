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
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        category: {
            type: String,
            enum: ['parking', 'hotel', 'pg'],
            default: 'parking',
            index: true,
        },
        description: {
            type: String,
            default: '',
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
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
        // Vacancy & Inventory Management
        totalCapacity: {
            type: Number,
            default: 1,
            min: [1, 'Total capacity must be at least 1'],
        },
        availableCount: {
            type: Number,
            default: 1,
            min: [0, 'Available count cannot be negative'],
        },
        // Pricing Models
        pricePerHour: {
            type: Number,
            default: 0,
        },
        pricePerDay: {
            type: Number,
            default: 0,
        },
        pricePerNight: {
            type: Number,
            default: 0,
        },
        pricePerMonth: {
            type: Number,
            default: 0,
        },
        depositAmount: {
            type: Number,
            default: 0,
        },
        // Hotel Attributes
        roomType: {
            type: String,
            enum: ['single', 'double', 'deluxe', 'suite', 'standard', 'dormitory'],
            default: 'standard',
        },
        acAvailable: {
            type: Boolean,
            default: true,
        },
        checkInTime: {
            type: String,
            default: '12:00 PM',
        },
        checkOutTime: {
            type: String,
            default: '11:00 AM',
        },
        // PG / Paying Guest Attributes
        sharingType: {
            type: String,
            enum: ['single', 'double', 'triple', '4-sharing', 'four', 'custom'],
            default: 'double',
        },
        foodType: {
            type: String,
            enum: ['included', 'veg', 'non-veg', 'both', 'none', 'optional', 'without_food'],
            default: 'included',
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'unisex', 'anyone', 'gents', 'ladies', 'boys', 'girls'],
            default: 'unisex',
        },
        noticePeriodDays: {
            type: Number,
            default: 30,
        },
        rules: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
        // Parking Specific Attributes
        vehicleType: {
            type: String,
            enum: ['four-wheeler', 'two-wheeler', 'ev', 'all'],
            default: 'four-wheeler',
        },
        isCovered: {
            type: Boolean,
            default: false,
        },
        hasEVCharging: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['available', 'reserved', 'occupied', 'full'],
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
SpotSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Spot', SpotSchema);
