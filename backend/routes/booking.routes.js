const express = require('express');
const {
    createBooking,
    getDriverBookings,
    getActiveBooking,
    getHostBookings,
    completeBooking,
    verifyPayment,
    demoComplete,
    cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/driver', protect, getDriverBookings);
router.get('/active', protect, getActiveBooking);
router.get('/host', protect, requireRole('host'), getHostBookings);
router.put('/:id/complete', protect, completeBooking);
router.post('/:id/verify-payment', protect, verifyPayment);
router.put('/:id/demo-complete', protect, demoComplete);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
