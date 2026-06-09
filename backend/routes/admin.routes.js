const express = require('express');
const { getStats, getAllUsers, getAllBookings, getAllSpots, deleteUser, deleteSpot, deleteBooking, updateSpotStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/stats', protect, requireRole('admin'), getStats);
router.get('/users', protect, requireRole('admin'), getAllUsers);
router.get('/bookings', protect, requireRole('admin'), getAllBookings);
router.get('/spots', protect, requireRole('admin'), getAllSpots);

router.delete('/users/:id', protect, requireRole('admin'), deleteUser);
router.delete('/spots/:id', protect, requireRole('admin'), deleteSpot);
router.put('/spots/:id/status', protect, requireRole('admin'), updateSpotStatus);
router.delete('/bookings/:id', protect, requireRole('admin'), deleteBooking);

module.exports = router;
