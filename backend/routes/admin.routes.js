const express = require('express');
const { getStats, getAllUsers, getAllBookings, getAllSpots } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/stats', protect, requireRole('admin'), getStats);
router.get('/users', protect, requireRole('admin'), getAllUsers);
router.get('/bookings', protect, requireRole('admin'), getAllBookings);
router.get('/spots', protect, requireRole('admin'), getAllSpots);

module.exports = router;
