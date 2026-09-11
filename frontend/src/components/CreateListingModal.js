'use client';
import React, { useState } from 'react';
import { X, MapPin, Plus, Car, Building2, Home, Check, Image as ImageIcon } from 'lucide-react';
import LocationPickerModal from './LocationPickerModal';
import { spotsAPI } from '../lib/api';

export default function CreateListingModal({ isOpen = true, initialCategory = 'parking', onClose, onListingCreated, onCreated }) {
    const [category, setCategory] = useState(initialCategory || 'parking');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('Chennai');
    const [coords, setCoords] = useState({ lat: 12.9716, lng: 80.2425 });
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    // Vacancies & Inventory
    const [totalCapacity, setTotalCapacity] = useState(category === 'pg' ? 4 : category === 'hotel' ? 5 : 2);
    const [availableCount, setAvailableCount] = useState(category === 'pg' ? 4 : category === 'hotel' ? 5 : 2);

    // Pricing
    const [pricePerHour, setPricePerHour] = useState(50);
    const [pricePerDay, setPricePerDay] = useState(400);
    const [pricePerNight, setPricePerNight] = useState(2500);
    const [pricePerMonth, setPricePerMonth] = useState(8500);
    const [depositAmount, setDepositAmount] = useState(category === 'pg' ? 15000 : 1000);

    // Hotel & PG Attributes
    const [roomType, setRoomType] = useState('deluxe');
    const [sharingType, setSharingType] = useState('double');
    const [foodType, setFoodType] = useState('both');
    const [gender, setGender] = useState('unisex');
    const [noticePeriodDays, setNoticePeriodDays] = useState(30);
    const [rules, setRules] = useState('Gate closes at 11:00 PM. Cleanliness and quiet hours maintained.');
    const [checkInTime, setCheckInTime] = useState('12:00 PM');
    const [checkOutTime, setCheckOutTime] = useState('11:00 AM');

    // Parking Attributes
    const [vehicleType, setVehicleType] = useState('all');
    const [isCovered, setIsCovered] = useState(true);
    const [hasEVCharging, setHasEVCharging] = useState(false);

    // Photos & Amenities
    const [imageUrl, setImageUrl] = useState('');
    const [images, setImages] = useState([]);
    const [amenities, setAmenities] = useState(['High Speed WiFi', 'Air Conditioner', '24/7 Security']);
    const [newAmenity, setNewAmenity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddImage = () => {
        if (imageUrl.trim()) {
            setImages([...images, imageUrl.trim()]);
            setImageUrl('');
        }
    };

    const handleRemoveImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAddAmenity = () => {
        if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
            setAmenities([...amenities, newAmenity.trim()]);
            setNewAmenity('');
        }
    };

    const handleRemoveAmenity = (amenity) => {
        setAmenities(amenities.filter(a => a !== amenity));
    };

    const handleLocationSelected = (locData) => {
        if (!locData) return;
        const lat = locData.lat !== undefined ? locData.lat : locData.coords?.lat;
        const lng = locData.lng !== undefined ? locData.lng : locData.coords?.lng;
        if (lat !== undefined && lng !== undefined) {
            setCoords({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        if (locData.address) setAddress(locData.address);
        if (locData.locality) setLocality(locData.locality);
        if (locData.city) setCity(locData.city);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !address.trim()) {
            alert('Please provide a title and address for your listing.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Pick default high quality stock photos if none provided
            const defaultImages = category === 'hotel' ? [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
            ] : category === 'pg' ? [
                'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
            ] : [
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
            ];

            const payload = {
                title,
                category,
                description,
                address,
                locality,
                city,
                lat: coords.lat,
                lng: coords.lng,
                totalCapacity: parseInt(totalCapacity) || 1,
                availableCount: parseInt(availableCount) || parseInt(totalCapacity) || 1,
                pricePerHour: parseFloat(pricePerHour) || 0,
                pricePerDay: parseFloat(pricePerDay) || 0,
                pricePerNight: parseFloat(pricePerNight) || 0,
                pricePerMonth: parseFloat(pricePerMonth) || 0,
                depositAmount: parseFloat(depositAmount) || 0,
                roomType,
                sharingType,
                foodType,
                gender,
                noticePeriodDays: parseInt(noticePeriodDays) || 30,
                rules,
                checkInTime,
                checkOutTime,
                vehicleType,
                isCovered,
                hasEVCharging,
                amenities,
                images: images.length > 0 ? images : defaultImages
            };

            const res = await spotsAPI.createSpot(payload);
            if (res.data && res.data.success) {
                alert('🎉 ' + category.toUpperCase() + ' listing published successfully!');
                if (onListingCreated) onListingCreated(res.data.spot);
                if (onCreated) onCreated(res.data.spot);
                onClose();
            }
        } catch (err) {
            console.error('Create listing error:', err);
            alert('Error creating listing: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isOpen === false) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#131627', color: '#fff', borderRadius: '24px',
                width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.15)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, background: '#131627', zIndex: 10
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>✨</span> List Property / Space
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                            Post your Parking Space, Hotel Room, or PG Vacancy to earn money
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', padding: 8, borderRadius: 10, cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Category Selection Tabs */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#A5B4FC', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            STEP 1: SELECT CATEGORY
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            {[
                                { id: 'parking', label: 'Smart Parking', icon: Car, color: '#3B82F6', desc: 'Hourly / Daily Slots' },
                                { id: 'hotel', label: 'Hotel Room', icon: Building2, color: '#8B5CF6', desc: 'Per Night Stay' },
                                { id: 'pg', label: 'PG / Co-Living', icon: Home, color: '#10B981', desc: 'Monthly Bed / Room' }
                            ].map((cat) => {
                                const Icon = cat.icon;
                                const active = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setCategory(cat.id);
                                            if (cat.id === 'pg') {
                                                setDepositAmount(15000);
                                                setAmenities(['High Speed WiFi', '3 Times Food', 'Air Conditioner', 'Washing Machine', 'Daily Cleaning']);
                                            } else if (cat.id === 'hotel') {
                                                setDepositAmount(1000);
                                                setAmenities(['Free Breakfast', 'High Speed WiFi', 'Swimming Pool', 'Air Conditioner', 'Smart TV']);
                                            } else {
                                                setDepositAmount(0);
                                                setAmenities(['CCTV Security', '24/7 Access', 'Covered Roof', 'Security Guard']);
                                            }
                                        }}
                                        style={{
                                            padding: '14px 12px', borderRadius: '16px',
                                            border: active ? ('2px solid ' + cat.color) : '1px solid rgba(255,255,255,0.1)',
                                            background: active ? (cat.color + '22') : 'rgba(255,255,255,0.03)',
                                            color: '#fff', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            boxShadow: active ? ('0 4px 16px ' + cat.color + '33') : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Icon size={22} color={active ? cat.color : '#94A3B8'} />
                                            {active && <Check size={16} color={cat.color} />}
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '14px', marginTop: 4 }}>{cat.label}</div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cat.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#A5B4FC', letterSpacing: '0.05em' }}>
                            STEP 2: BASIC DETAILS
                        </label>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#CBD5E1', marginBottom: 4 }}>Listing Title *</label>
                            <input
                                type="text"
                                required
                                placeholder={
                                    category === 'hotel' ? 'e.g. Grand Marina Deluxe Executive Suite' :
                                    category === 'pg' ? 'e.g. Stanza Elite Gents Luxury PG - OMR' :
                                    'e.g. Prime Tidel Park Covered Parking Bay'
                                }
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#CBD5E1', marginBottom: 4 }}>Description</label>
                            <textarea
                                rows={2}
                                placeholder="Describe amenities, surroundings, key landmarks..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Draggable Location Pin Section */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#A5B4FC', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            STEP 3: EXACT LOCATION (UBER/OLA PINPOINT MAP)
                        </label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                                type="text"
                                required
                                placeholder="Enter address or landmark (e.g. OMR, Tidel Park, Guindy, Chennai)..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPinModalOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'linear-gradient(135deg, #6C63FF, #4F46E5)',
                                    color: '#fff', border: 'none', padding: '10px 16px',
                                    borderRadius: '10px', fontWeight: '700', fontSize: '13px',
                                    cursor: 'pointer', whiteSpace: 'nowrap'
                                }}
                            >
                                <MapPin size={16} />
                                <span>Move Pin on Map</span>
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#10B981', marginTop: 4 }}>
                            📍 Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)} {locality ? ('• ' + locality + ', ' + city) : ''}
                        </div>
                    </div>

                    {/* Category-Specific Fields */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#A5B4FC', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            STEP 4: {category.toUpperCase()} SPECIFIC ATTRIBUTES & PRICING
                        </label>

                        {/* HOTEL FIELDS */}
                        {category === 'hotel' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Room Type</label>
                                    <select
                                        value={roomType}
                                        onChange={(e) => setRoomType(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    >
                                        <option value="deluxe">Deluxe Room</option>
                                        <option value="executive">Executive Suite</option>
                                        <option value="standard">Standard Room</option>
                                        <option value="suite">Presidential Suite</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Price per Night (₹) *</label>
                                    <input
                                        type="number"
                                        min="100"
                                        value={pricePerNight}
                                        onChange={(e) => setPricePerNight(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Total Rooms Available (Capacity)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalCapacity}
                                        onChange={(e) => { setTotalCapacity(e.target.value); setAvailableCount(e.target.value); }}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Refundable Deposit (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Check-in Time</label>
                                    <input
                                        type="text"
                                        value={checkInTime}
                                        onChange={(e) => setCheckInTime(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Check-out Time</label>
                                    <input
                                        type="text"
                                        value={checkOutTime}
                                        onChange={(e) => setCheckOutTime(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* PG / CO-LIVING FIELDS */}
                        {category === 'pg' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Target Gender</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    >
                                        <option value="gents">👦 Gents PG</option>
                                        <option value="ladies">👧 Ladies PG</option>
                                        <option value="unisex">👫 Unisex Co-Living</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Sharing Type</label>
                                    <select
                                        value={sharingType}
                                        onChange={(e) => setSharingType(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    >
                                        <option value="single">Single Room (Private)</option>
                                        <option value="double">2-Sharing Bed</option>
                                        <option value="triple">3-Sharing Bed</option>
                                        <option value="four">4-Sharing Bed</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Food Facility</label>
                                    <select
                                        value={foodType}
                                        onChange={(e) => setFoodType(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    >
                                        <option value="both">🍛 Veg & Non-Veg Food Included</option>
                                        <option value="veg">🥗 Pure Veg Food Included</option>
                                        <option value="without_food">🍳 Self Cooking / Without Food</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Monthly Rent (₹/month) *</label>
                                    <input
                                        type="number"
                                        min="1000"
                                        value={pricePerMonth}
                                        onChange={(e) => setPricePerMonth(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Security Deposit (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Total Bed Vacancies Available</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalCapacity}
                                        onChange={(e) => { setTotalCapacity(e.target.value); setAvailableCount(e.target.value); }}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>House Rules & Curfew Info</label>
                                    <input
                                        type="text"
                                        value={rules}
                                        onChange={(e) => setRules(e.target.value)}
                                        placeholder="e.g. Gate closes at 11:00 PM. No alcohol."
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* PARKING FIELDS */}
                        {category === 'parking' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Vehicle Type</label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    >
                                        <option value="four-wheeler">🚗 4-Wheeler Car</option>
                                        <option value="two-wheeler">🏍️ 2-Wheeler Bike</option>
                                        <option value="all">🚗+🏍️ Car & Bike</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Price per Hour (₹/hr) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pricePerHour}
                                        onChange={(e) => setPricePerHour(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Price per Full Day (₹/day)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        value={pricePerDay}
                                        onChange={(e) => setPricePerDay(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#CBD5E1', marginBottom: 4 }}>Total Parking Slots (Capacity)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={totalCapacity}
                                        onChange={(e) => { setTotalCapacity(e.target.value); setAvailableCount(e.target.value); }}
                                        style={{ width: '100%', padding: '9px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 16, gridColumn: 'span 2', marginTop: 4 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isCovered} onChange={(e) => setIsCovered(e.target.checked)} />
                                        <span>🛡️ Covered Parking</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={hasEVCharging} onChange={(e) => setHasEVCharging(e.target.checked)} />
                                        <span>⚡ Fast EV Charging</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photos Upload / URL */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#A5B4FC', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            STEP 5: PROPERTY PHOTOS
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Paste image URL (e.g. from Unsplash or direct photo link)..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                style={{ flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                            >
                                + Add Photo
                            </button>
                        </div>
                        {images.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                                {images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: 70, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Amenities Tags */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#A5B4FC', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            STEP 6: AMENITIES & FEATURES
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {amenities.map(a => (
                                <span key={a} style={{ background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', color: '#E0E7FF', padding: '4px 10px', borderRadius: 20, fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {a}
                                    <button type="button" onClick={() => handleRemoveAmenity(a)} style={{ background: 'none', border: 'none', color: '#FDA4AF', cursor: 'pointer', fontSize: 11 }}>✕</button>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Add custom amenity (e.g. Swimming Pool, Washing Machine, CCTV)..."
                                value={newAmenity}
                                onChange={(e) => setNewAmenity(e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                            <button
                                type="button"
                                onClick={handleAddAmenity}
                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#fff', border: 'none', padding: '14px',
                            borderRadius: '12px', fontWeight: '800', fontSize: '15px',
                            cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                            marginTop: 8
                        }}
                    >
                        {isSubmitting ? '⏳ Publishing Listing...' : ('🚀 Publish ' + category.toUpperCase() + ' Listing')}
                    </button>
                </form>
            </div>

            {/* Draggable Location Pin Modal */}
            <LocationPickerModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onLocationSelected={handleLocationSelected}
                onSelectLocation={handleLocationSelected}
                initialCoords={coords}
                initialAddress={address}
            />
        </div>
    );
}
