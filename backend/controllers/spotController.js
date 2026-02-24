const { validationResult } = require('express-validator');
const Spot = require('../models/Spot');

// Nominatim geocoding (free, no API key required)
const geocodeAddress = async (address) => {
    try {
        const encoded = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'MindSparkParkingApp/1.0' },
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name,
            };
        }
        return null;
    } catch (err) {
        console.error('Geocoding error:', err);
        return null;
    }
};

// @desc    Get nearby spots (geospatial)
// @route   GET /api/spots/nearby?lat=&lng=&radius=5
// @access  Private (driver)
const getNearbySpots = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required.' });
        }

        const radiusInMeters = parseFloat(radius) * 1000;

        const spots = await Spot.find({
            isActive: true,
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).populate('host', 'name rating phone');

        // Dynamically correct expired reservations before sending to client
        const updatedSpots = spots.map(spot => {
            if (spot.status === 'reserved' && spot.reservedUntil < new Date()) {
                spot.status = 'available';
                spot.reservedBy = null;
                spot.reservedUntil = null;
                // Note: we don't save to DB here to keep GET requests fast, but client sees it as available
            }
            return spot;
        });

        res.json({ success: true, count: updatedSpots.length, spots: updatedSpots });
    } catch (error) {
        console.error('Get nearby spots error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching nearby spots.' });
    }
};

// @desc    Get all spots for current host
// @route   GET /api/spots/host
// @access  Private (host)
const getHostSpots = async (req, res) => {
    try {
        const spots = await Spot.find({ host: req.user._id }).sort('-createdAt');
        res.json({ success: true, count: spots.length, spots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get single spot
// @route   GET /api/spots/:id
// @access  Private
const getSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id).populate('host', 'name email phone');
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Spot not found.' });
        }
        res.json({ success: true, spot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Create a new spot
// @route   POST /api/spots
// @access  Private (host)
const createSpot = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { title, description, address, pricePerHour, amenities, lat, lng } = req.body;

        let coordinates;
        if (lat && lng) {
            coordinates = [parseFloat(lng), parseFloat(lat)];
        } else {
            const geo = await geocodeAddress(address);
            if (!geo) {
                return res.status(400).json({
                    success: false,
                    message: 'Could not geocode the provided address. Please provide lat/lng manually.',
                });
            }
            coordinates = [geo.lng, geo.lat];
        }

        const spot = await Spot.create({
            host: req.user._id,
            title,
            description,
            address,
            location: { type: 'Point', coordinates },
            pricePerHour: parseFloat(pricePerHour),
            amenities: amenities || [],
        });

        await spot.populate('host', 'name email phone');

        res.status(201).json({ success: true, message: 'Parking spot created successfully.', spot });
    } catch (error) {
        console.error('Create spot error:', error);
        res.status(500).json({ success: false, message: 'Server error creating spot.' });
    }
};

// @desc    Update a spot
// @route   PUT /api/spots/:id
// @access  Private (host, owner only)
const updateSpot = async (req, res) => {
    try {
        let spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Spot not found.' });
        }

        if (spot.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this spot.' });
        }

        const { title, description, address, pricePerHour, amenities, lat, lng } = req.body;

        if (address && address !== spot.address) {
            let coordinates;
            if (lat && lng) {
                coordinates = [parseFloat(lng), parseFloat(lat)];
            } else {
                const geo = await geocodeAddress(address);
                if (geo) {
                    coordinates = [geo.lng, geo.lat];
                }
            }
            if (coordinates) {
                spot.location = { type: 'Point', coordinates };
                spot.address = address;
            }
        }

        if (title !== undefined) spot.title = title;
        if (description !== undefined) spot.description = description;
        if (pricePerHour !== undefined) spot.pricePerHour = parseFloat(pricePerHour);
        if (amenities !== undefined) spot.amenities = amenities;

        await spot.save();

        res.json({ success: true, message: 'Spot updated successfully.', spot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Delete a spot
// @route   DELETE /api/spots/:id
// @access  Private (host, owner only)
const deleteSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Spot not found.' });
        }

        if (spot.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this spot.' });
        }

        if (spot.status === 'occupied') {
            return res.status(400).json({ success: false, message: 'Cannot delete an occupied spot.' });
        }

        await spot.deleteOne();
        res.json({ success: true, message: 'Spot deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all spots (admin or public)
// @route   GET /api/spots
// @access  Public
const getAllSpots = async (req, res) => {
    try {
        const spots = await Spot.find({ isActive: true }).populate('host', 'name phone').sort('-createdAt');
        const updatedSpots = spots.map(spot => {
            if (spot.status === 'reserved' && spot.reservedUntil < new Date()) {
                spot.status = 'available';
                spot.reservedBy = null;
                spot.reservedUntil = null;
            }
            return spot;
        });
        res.json({ success: true, count: updatedSpots.length, spots: updatedSpots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Reserve a spot for 10 minutes
// @route   POST /api/spots/:id/reserve
// @access  Private (driver)
const reserveSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Spot not found.' });
        }

        // Check if available or if existing reservation expired
        if (spot.status === 'occupied') {
            return res.status(400).json({ success: false, message: 'Spot is currently occupied.' });
        }

        if (spot.status === 'reserved' && spot.reservedUntil > new Date() && spot.reservedBy.toString() !== req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Spot is already reserved by someone else.' });
        }

        // Reserve for 10 minutes
        spot.status = 'reserved';
        spot.reservedBy = req.user._id;
        spot.reservedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        await spot.save();

        res.json({ success: true, message: 'Spot reserved for 10 minutes.', spot });
    } catch (error) {
        console.error('Reserve spot error:', error);
        res.status(500).json({ success: false, message: 'Server error reserving spot.' });
    }
};

module.exports = { getNearbySpots, getHostSpots, getSpot, createSpot, updateSpot, deleteSpot, getAllSpots, reserveSpot };
