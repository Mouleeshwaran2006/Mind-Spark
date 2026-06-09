const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        resetPasswordOTP: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        roles: {
            type: [String],
            enum: ['driver', 'host', 'admin'],
            default: ['driver'],
        },
        activeRole: {
            type: String,
            enum: ['driver', 'host', 'admin'],
            default: 'driver',
        },
        avatar: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        earnings: {
            totalRevenue: { type: Number, default: 0 },
            pendingPayout: { type: Number, default: 0 },
            completedPayouts: { type: Number, default: 0 },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
UserSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email, activeRole: this.activeRole, roles: this.roles },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = mongoose.model('User', UserSchema);
