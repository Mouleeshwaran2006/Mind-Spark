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

// Reverse geocode lat/lng to human address (Nominatim free endpoint)
const reverseGeocodeCoords = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'MindSparkSmartMarketplace/2.0' },
        });
        const data = await response.json();
        if (data && data.display_name) {
            return data.display_name;
        }
        return null;
    } catch (err) {
        console.error('Reverse geocoding error:', err);
        return null;
    }
};

// @desc    Reverse geocode coordinates to address
// @route   GET /api/spots/reverse-geocode?lat=&lng=
// @access  Public
const reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng parameters are required.' });
        }
        const address = await reverseGeocodeCoords(parseFloat(lat), parseFloat(lng));
        res.json({
            success: true,
            address: address || `Location (${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)})`,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reverse geocode location.' });
    }
};

// @desc    Get nearby listings across all categories (geospatial)
// @route   GET /api/spots/nearby?lat=&lng=&radius=5&category=parking|hotel|pg
// @access  Public
const getNearbySpots = async (req, res) => {
    try {
        const { lat, lng, radius = 10, category, minPrice, maxPrice, sharingType, foodType, gender, roomType, vehicleType } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required.' });
        }

        const radiusInMeters = parseFloat(radius) * 1000;

        const query = {
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
        };

        // Category filter
        if (category && ['parking', 'hotel', 'pg'].includes(category.toLowerCase())) {
            query.category = category.toLowerCase();
        }

        // Sub-filters
        if (sharingType) query.sharingType = sharingType;
        if (foodType) query.foodType = foodType;
        if (gender && gender !== 'all') query.gender = gender;
        if (roomType) query.roomType = roomType;
        if (vehicleType) query.vehicleType = vehicleType;

        const spots = await Spot.find(query).populate('host', 'name rating phone');

        // Dynamically correct expired reservations
        const updatedSpots = spots.map(spot => {
            if (spot.status === 'reserved' && spot.reservedUntil && spot.reservedUntil < new Date()) {
                spot.status = 'available';
                spot.reservedBy = null;
                spot.reservedUntil = null;
            }
            return spot;
        });

        res.json({ success: true, count: updatedSpots.length, spots: updatedSpots });
    } catch (error) {
        console.error('Get nearby spots error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching nearby listings.' });
    }
};

// @desc    Get all spots for current host
// @route   GET /api/spots/host
// @access  Private (host)
const getHostSpots = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { host: req.user._id };
        if (category) query.category = category;

        const spots = await Spot.find(query).sort('-createdAt');
        res.json({ success: true, count: spots.length, spots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get single spot
// @route   GET /api/spots/:id
// @access  Public
const getSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id).populate('host', 'name email phone');
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Listing not found.' });
        }
        res.json({ success: true, spot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Create a new listing (parking, hotel, or PG)
// @route   POST /api/spots
// @access  Private (host)
const createSpot = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            title,
            category = 'parking',
            description,
            address,
            lat,
            lng,
            totalCapacity = 1,
            availableCount,
            // Pricing
            pricePerHour,
            pricePerDay,
            pricePerNight,
            pricePerMonth,
            depositAmount,
            // Hotel
            roomType,
            acAvailable,
            checkInTime,
            checkOutTime,
            // PG
            sharingType,
            foodType,
            gender,
            noticePeriodDays,
            rules,
            // Parking
            vehicleType,
            isCovered,
            hasEVCharging,
            amenities,
            images
        } = req.body;

        let coordinates;
        if (lat && lng) {
            coordinates = [parseFloat(lng), parseFloat(lat)];
        } else {
            const geo = await geocodeAddress(address);
            if (!geo) {
                return res.status(400).json({
                    success: false,
                    message: 'Could not locate address. Please pick location on the Google Map.',
                });
            }
            coordinates = [geo.lng, geo.lat];
        }

        const capacity = parseInt(totalCapacity) || 1;
        const available = availableCount !== undefined ? parseInt(availableCount) : capacity;

        const spotData = {
            host: req.user._id,
            title,
            category: category.toLowerCase(),
            description: description || '',
            address,
            location: { type: 'Point', coordinates },
            totalCapacity: capacity,
            availableCount: available,
            status: available > 0 ? 'available' : 'occupied',
            // Pricing
            pricePerHour: parseFloat(pricePerHour) || 0,
            pricePerDay: parseFloat(pricePerDay) || 0,
            pricePerNight: parseFloat(pricePerNight) || 0,
            pricePerMonth: parseFloat(pricePerMonth) || 0,
            depositAmount: parseFloat(depositAmount) || 0,
            // Hotel
            roomType: roomType || 'standard',
            acAvailable: acAvailable !== undefined ? acAvailable : true,
            checkInTime: checkInTime || '12:00 PM',
            checkOutTime: checkOutTime || '11:00 AM',
            // PG
            sharingType: sharingType || 'double',
            foodType: foodType || 'included',
            gender: gender || 'unisex',
            noticePeriodDays: parseInt(noticePeriodDays) || 30,
            rules: Array.isArray(rules) ? rules : [],
            // Parking
            vehicleType: vehicleType || 'four-wheeler',
            isCovered: !!isCovered,
            hasEVCharging: !!hasEVCharging,
            amenities: Array.isArray(amenities) ? amenities : [],
            images: Array.isArray(images) ? images : [],
        };

        const spot = await Spot.create(spotData);
        await spot.populate('host', 'name email phone');

        // Ensure user has host capability in their profile
        if (req.user && Array.isArray(req.user.roles) && !req.user.roles.includes('host')) {
            req.user.roles.push('host');
            await req.user.save().catch(() => {});
        }

        res.status(201).json({ success: true, message: `${category.toUpperCase()} listing created successfully!`, spot });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ success: false, message: 'Server error creating listing.' });
    }
};

// @desc    Update a listing
// @route   PUT /api/spots/:id
// @access  Private (host, owner only)
const updateSpot = async (req, res) => {
    try {
        let spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Listing not found.' });
        }

        if (spot.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this listing.' });
        }

        const updates = req.body;

        if (updates.lat && updates.lng) {
            spot.location = { type: 'Point', coordinates: [parseFloat(updates.lng), parseFloat(updates.lat)] };
        }

        Object.keys(updates).forEach(key => {
            if (!['location', 'host', '_id'].includes(key)) {
                spot[key] = updates[key];
            }
        });

        if (spot.availableCount > 0 && spot.status === 'occupied') {
            spot.status = 'available';
        } else if (spot.availableCount <= 0) {
            spot.status = 'occupied';
        }

        await spot.save();
        res.json({ success: true, message: 'Listing updated successfully.', spot });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Delete a listing
// @route   DELETE /api/spots/:id
// @access  Private (host, owner only)
const deleteSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Listing not found.' });
        }

        if (spot.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
        }

        await spot.deleteOne();
        res.json({ success: true, message: 'Listing deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Get all listings (supports category and filters)
// @route   GET /api/spots
// @access  Public
const getAllSpots = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, sharingType, foodType, gender, search } = req.query;
        const query = { isActive: true };

        if (category && ['parking', 'hotel', 'pg'].includes(category.toLowerCase())) {
            query.category = category.toLowerCase();
        }
        if (sharingType) query.sharingType = sharingType;
        if (foodType) query.foodType = foodType;
        if (gender && gender !== 'all') query.gender = gender;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const spots = await Spot.find(query).populate('host', 'name phone').sort('-createdAt');
        const updatedSpots = spots.map(spot => {
            if (spot.status === 'reserved' && spot.reservedUntil && spot.reservedUntil < new Date()) {
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

// @desc    Reserve a spot/room for 10 minutes
// @route   POST /api/spots/:id/reserve
// @access  Private
const reserveSpot = async (req, res) => {
    try {
        const spot = await Spot.findById(req.params.id);
        if (!spot) {
            return res.status(404).json({ success: false, message: 'Listing not found.' });
        }

        if (spot.availableCount <= 0 || spot.status === 'occupied') {
            return res.status(400).json({ success: false, message: 'Listing is currently fully occupied.' });
        }

        if (spot.status === 'reserved' && spot.reservedUntil > new Date() && spot.reservedBy?.toString() !== req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Listing is temporarily reserved by another user.' });
        }

        spot.status = 'reserved';
        spot.reservedBy = req.user._id;
        spot.reservedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await spot.save();

        res.json({ success: true, message: 'Slot reserved for 10 minutes.', spot });
    } catch (error) {
        console.error('Reserve spot error:', error);
        res.status(500).json({ success: false, message: 'Server error reserving listing.' });
    }
};

module.exports = {
    getNearbySpots,
    getHostSpots,
    getSpot,
    createSpot,
    updateSpot,
    deleteSpot,
    getAllSpots,
    reserveSpot,
    reverseGeocode
};
