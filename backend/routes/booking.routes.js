const express = require('express');
const {
    createBooking,
    getDriverBookings,
    getActiveBooking,
    getHostBookings,
    completeBooking,
    verifyPayment,
    demoComplete,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/', protect, requireRole('driver'), createBooking);
router.get('/driver', protect, requireRole('driver'), getDriverBookings);
router.get('/active', protect, requireRole('driver'), getActiveBooking);
router.get('/host', protect, requireRole('host'), getHostBookings);
router.put('/:id/complete', protect, requireRole('driver'), completeBooking);
router.post('/:id/verify-payment', protect, requireRole('driver'), verifyPayment);
router.put('/:id/demo-complete', protect, requireRole('driver'), demoComplete);

module.exports = router;
