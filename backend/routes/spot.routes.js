const express = require('express');
const { body } = require('express-validator');
const {
    getNearbySpots,
    getHostSpots,
    getSpot,
    createSpot,
    updateSpot,
    deleteSpot,
    getAllSpots,
    reserveSpot,
} = require('../controllers/spotController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

const spotValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('pricePerHour').isNumeric().withMessage('Price per hour must be a number'),
];

router.get('/', getAllSpots);
router.get('/nearby', protect, getNearbySpots);
router.get('/host', protect, requireRole('host'), getHostSpots);
router.get('/:id', protect, getSpot);
router.post('/', protect, requireRole('host'), spotValidation, createSpot);
router.put('/:id', protect, requireRole('host'), updateSpot);
router.delete('/:id', protect, requireRole('host'), deleteSpot);
router.post('/:id/reserve', protect, reserveSpot);

module.exports = router;
