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
    reverseGeocode,
} = require('../controllers/spotController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

const spotValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
];

router.get('/', getAllSpots);
router.get('/nearby', getNearbySpots);
router.get('/reverse-geocode', reverseGeocode);
router.get('/host', protect, getHostSpots);
router.get('/:id', getSpot);
router.post('/', protect, spotValidation, createSpot);
router.put('/:id', protect, updateSpot);
router.delete('/:id', protect, deleteSpot);
router.post('/:id/reserve', protect, reserveSpot);

module.exports = router;
