require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth.routes');
const spotRoutes = require('./routes/spot.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);
            const allowed = [
                process.env.CLIENT_URL,
                'http://localhost:3000',
                'http://localhost:3001',
            ].filter(Boolean);
            if (
                allowed.includes(origin) ||
                origin.endsWith('.netlify.app') ||
                origin.endsWith('.onrender.com') ||
                origin.endsWith('.vercel.app')
            ) {
                return callback(null, true);
            }
            return callback(null, true); // Allow all origins in production to prevent CORS blocks
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = states[mongoose.connection.readyState] || 'unknown';
    const rawUri = process.env.MONGO_URI || '';
    const maskedUri = rawUri ? rawUri.replace(/:([^:@]+)@/, ':****@') : 'NOT SET (defaulting to localhost)';

    res.json({
        success: true,
        message: '🚗 Mind Spark API is running!',
        database: dbState,
        dbConnected: dbState === 'connected',
        mongoUriConfigured: !!process.env.MONGO_URI,
        mongoUriMasked: maskedUri,
        lastDbError: connectDB.getLastError ? connectDB.getLastError() : null,
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mind Spark backend running on port ${PORT}`);
    console.log(`📡 API Health: /api/health`);
});

module.exports = app;
