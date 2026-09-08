'use client';
import React, { useState } from 'react';
import { X, MapPin, Upload, Plus, Car, Building2, Home, Check } from 'lucide-react';
import LocationPickerModal from './LocationPickerModal';
import { spotsAPI } from '../lib/api';

export default function CreateListingModal({ isOpen, onClose, onListingCreated }) {
    const [category, setCategory] = useState('parking');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState({ lat: 12.9716, lng: 80.2425 });
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    // Vacancies & Capacity
    const [totalCapacity, setTotalCapacity] = useState(1);
    const [availableCount, setAvailableCount] = useState(1);

    // Pricing
    const [pricePerHour, setPricePerHour] = useState(40);
    const [pricePerDay, setPricePerDay] = useState(300);
    const [pricePerNight, setPricePerNight] = useState(1500);
    const [pricePerMonth, setPricePerMonth] = useState(6500);
    const [depositAmount, setDepositAmount] = useState(2000);

    // Category-specific
    const [roomType, setRoomType] = useState('standard');
    const [sharingType, setSharingType] = useState('double');
    const [foodType, setFoodType] = useState('included');
    const [gender, setGender] = useState('unisex');
    const [vehicleType, setVehicleType] = useState('four-wheeler');
    const [isCovered, setIsCovered] = useState(true);
    const [hasEVCharging, setHasEVCharging] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [images, setImages] = useState([]);
    const [amenities, setAmenities] = useState(['CCTV', 'Security Guard']);
    const [newAmenity, setNewAmenity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddImage = () => {
        if (imageUrl.trim()) {
            setImages([...images, imageUrl.trim()]);
            setImageUrl('');
        }
    };

    const handleAddAmenity = () => {
        if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
            setAmenities([...amenities, newAmenity.trim()]);
            setNewAmenity('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !address.trim()) {
            alert('Please provide title and address.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                category,
                description,
                address,
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
                vehicleType,
                isCovered,
                hasEVCharging,
                amenities,
                images: images.length > 0 ? images : [
                    category === 'hotel'
                        ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                        : category === 'pg'
                        ? 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
                        : 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
                ]
            };

            const res = await spotsAPI.createSpot(payload);
            if (res.data && res.data.success) {
                alert(`🎉 ${category.toUpperCase()} listing published successfully!`);
                if (onListingCreated) onListingCreated(res.data.spot);
                onClose();
            }
        } catch (err) {
            console.error('Create listing error:', err);
            alert('Error creating listing: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#1E293B', color: '#fff', borderRadius: '20px',
                width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, background: '#1E293B', zIndex: 10
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Post New Property / Slot</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Category Selection Tabs */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px' }}>
                            SELECT CATEGORY
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            {[
                                { id: 'parking', label: 'Parking Space', icon: Car, color: '#3B82F6' },
                                { id: 'hotel', label: 'Hotel Room', icon: Building2, color: '#8B5CF6' },
                                { id: 'pg', label: 'PG / Co-Living', icon: Home, color: '#10B981' }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    style={{
                                        padding: '12px 8px', borderRadius: '12px',
                                        background: category === cat.id ? cat.color : '#0F172A',
                                        color: '#fff', border: category === cat.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <cat.icon size={20} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>TITLE</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Green Oasis Luxury PG or Prime Tech Park Bay"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px', background: '#0F172A',
                                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                                color: '#fff', fontSize: '14px', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Location Pinpoint Section with Uber/Ola trigger */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>
                            ADDRESS & MAP PINPOINT (UBER/OLA STYLE)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                required
                                placeholder="Street, landmark, Chennai..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{
                                    flex: 1, padding: '10px 14px', background: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                                    color: '#fff', fontSize: '14px', outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPinModalOpen(true)}
                                style={{
                                    padding: '10px 14px', background: '#3B82F6', color: '#fff',
                                    border: 'none', borderRadius: '10px', fontWeight: '700',
                                    fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <MapPin size={16} /> Pin on Map
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#38BDF8', marginTop: '4px' }}>
                            Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </div>
                    </div>

                    {/* Vacancy & Inventory Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>
                                TOTAL CAPACITY
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={totalCapacity}
                                onChange={(e) => setTotalCapacity(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px', background: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                                    color: '#fff', fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>
                                VACANCIES CURRENTLY AVAILABLE
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={availableCount}
                                onChange={(e) => setAvailableCount(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px', background: '#0F172A',
                                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                                    color: '#fff', fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Category Specific Pricing & Parameters */}
                    {category === 'parking' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>PRICE PER HOUR (₹)</label>
                                <input
                                    type="number"
                                    value={pricePerHour}
                                    onChange={(e) => setPricePerHour(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>PRICE PER DAY (₹)</label>
                                <input
                                    type="number"
                                    value={pricePerDay}
                                    onChange={(e) => setPricePerDay(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    )}

                    {category === 'hotel' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>PRICE PER NIGHT (₹)</label>
                                <input
                                    type="number"
                                    value={pricePerNight}
                                    onChange={(e) => setPricePerNight(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>ROOM TYPE</label>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="deluxe">Deluxe</option>
                                    <option value="suite">Executive Suite</option>
                                    <option value="single">Single Room</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {category === 'pg' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>RENT / MONTH (₹)</label>
                                    <input
                                        type="number"
                                        value={pricePerMonth}
                                        onChange={(e) => setPricePerMonth(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>SECURITY DEPOSIT (₹)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>SHARING</label>
                                    <select
                                        value={sharingType}
                                        onChange={(e) => setSharingType(e.target.value)}
                                        style={{ width: '100%', padding: '8px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    >
                                        <option value="single">Single (1 Bed)</option>
                                        <option value="double">2-Sharing</option>
                                        <option value="triple">3-Sharing</option>
                                        <option value="4-sharing">4-Sharing</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>FOOD</label>
                                    <select
                                        value={foodType}
                                        onChange={(e) => setFoodType(e.target.value)}
                                        style={{ width: '100%', padding: '8px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    >
                                        <option value="included">3 Times Included</option>
                                        <option value="veg">Veg Only</option>
                                        <option value="optional">Optional</option>
                                        <option value="none">Self-Cooking</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>GENDER</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        style={{ width: '100%', padding: '8px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    >
                                        <option value="male">Male (Gents)</option>
                                        <option value="female">Female (Ladies)</option>
                                        <option value="unisex">Unisex / Co-Living</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Photos Upload URL */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>PHOTOS (IMAGE URL)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="url"
                                placeholder="Paste image URL (Unsplash or direct link)..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                style={{ flex: 1, padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                style={{ padding: '10px 14px', background: '#334155', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                        {images.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto' }}>
                                {images.map((img, i) => (
                                    <img key={i} src={img} alt="preview" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                flex: 2, padding: '12px', background: '#10B981', color: '#fff',
                                border: 'none', borderRadius: '12px', fontWeight: '700',
                                fontSize: '15px', cursor: 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Publishing...' : '🚀 Publish Listing'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Uber / Ola Draggable Pin Location Picker Sub-Modal */}
            <LocationPickerModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                initialCoords={coords}
                initialAddress={address}
                onSelectLocation={({ coords: newCoords, address: newAddr }) => {
                    setCoords(newCoords);
                    setAddress(newAddr);
                }}
            />
        </div>
    );
}
