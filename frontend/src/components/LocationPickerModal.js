'use client';
import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, Check, X, Crosshair } from 'lucide-react';
import { spotsAPI } from '../lib/api';

export default function LocationPickerModal({
    isOpen,
    onClose,
    onSelectLocation,
    initialCoords = { lat: 12.9716, lng: 80.2425 },
    initialAddress = ''
}) {
    const [coords, setCoords] = useState(initialCoords);
    const [address, setAddress] = useState(initialAddress);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        if (initialCoords && initialCoords.lat) {
            setCoords(initialCoords);
        }
        if (initialAddress) {
            setAddress(initialAddress);
        }
    }, [initialCoords, initialAddress, isOpen]);

    // Reverse geocode whenever coords change
    const updateAddressFromCoords = async (lat, lng) => {
        setIsGeocoding(true);
        try {
            const res = await spotsAPI.reverseGeocode(lat, lng);
            if (res.data && res.data.address) {
                setAddress(res.data.address);
            }
        } catch (e) {
            setAddress(`Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Forward search address
    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const encoded = encodeURIComponent(searchQuery);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
                headers: { 'User-Agent': 'MindSparkSmartMarketplace/2.0' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const newLat = parseFloat(data[0].lat);
                const newLng = parseFloat(data[0].lon);
                setCoords({ lat: newLat, lng: newLng });
                setAddress(data[0].display_name);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Use current GPS
    const handleUseGPS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(newCoords);
                    updateAddressFromCoords(newCoords.lat, newCoords.lng);
                },
                (err) => alert('Unable to fetch GPS location: ' + err.message)
            );
        }
    };

    // Quick preset location picker for testing
    const handlePreset = (lat, lng, name) => {
        setCoords({ lat, lng });
        setAddress(name);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#1E293B', color: '#fff', borderRadius: '20px',
                width: '100%', maxWidth: '680px', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', background: '#3B82F6', borderRadius: '10px' }}>
                            <MapPin size={20} color="#fff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Pinpoint Exact Location</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Move map or enter address to set exact spot (Uber / Ola style)</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '12px 20px', background: '#0F172A', display: 'flex', gap: '8px' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#1E293B', padding: '8px 14px', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Search size={16} color="#94A3B8" />
                            <input
                                type="text"
                                placeholder="Search area, landmark, or street in Chennai..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#fff',
                                    outline: 'none', width: '100%', fontSize: '14px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            style={{
                                padding: '8px 16px', background: '#3B82F6', color: '#fff',
                                border: 'none', borderRadius: '12px', fontWeight: '600',
                                fontSize: '13px', cursor: 'pointer'
                            }}
                        >
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>

                    <button
                        onClick={handleUseGPS}
                        title="Use Current GPS Location"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', background: '#334155', color: '#38BDF8',
                            border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px',
                            fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                        }}
                    >
                        <Crosshair size={16} /> GPS
                    </button>
                </div>

                {/* Interactive Map Canvas with Center Draggable Pin */}
                <div style={{ position: 'relative', width: '100%', height: '340px', background: '#0F172A' }}>
                    <iframe
                        title="Location Pinpoint"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                    />

                    {/* Fixed Center Floating Pin (Uber style) */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -100%)', pointerEvents: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
                    }}>
                        <div style={{
                            padding: '4px 10px', background: '#0F172A', color: '#38BDF8',
                            fontSize: '11px', fontWeight: '800', borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '1px solid #38BDF8',
                            marginBottom: '2px', whiteSpace: 'nowrap'
                        }}>
                            📍 Set Here
                        </div>
                        <div style={{
                            width: '36px', height: '36px', background: '#EF4444',
                            borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                            border: '3px solid #fff', boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%' }} />
                        </div>
                        <div style={{ width: '10px', height: '4px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', marginTop: '2px' }} />
                    </div>

                    {/* Quick Landmark Presets */}
                    <div style={{
                        position: 'absolute', bottom: 10, left: 10, right: 10,
                        display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px', zIndex: 10
                    }}>
                        {[
                            { name: 'Tidel Park, OMR', lat: 12.9892, lng: 80.2425 },
                            { name: 'Velachery Metro', lat: 12.9790, lng: 80.2185 },
                            { name: 'Express Avenue', lat: 13.0587, lng: 80.2608 },
                            { name: 'Guindy Metro', lat: 13.0067, lng: 80.2128 },
                            { name: 'Sholinganallur', lat: 12.9010, lng: 80.2280 }
                        ].map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => handlePreset(preset.lat, preset.lng, preset.name)}
                                style={{
                                    padding: '5px 10px', background: 'rgba(15,23,42,0.9)',
                                    color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '16px', fontSize: '11px', fontWeight: '600',
                                    whiteSpace: 'nowrap', cursor: 'pointer'
                                }}
                            >
                                🎯 {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Address Banner & Confirm */}
                <div style={{ padding: '16px 20px', background: '#1E293B' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Selected Location & Coordinates
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#F8FAFC', lineHeight: '1.4' }}>
                            {isGeocoding ? '⏳ Locating address...' : address || 'Click on map or search address'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '4px' }}>
                            Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '10px', background: '#334155',
                                color: '#CBD5E1', border: 'none', borderRadius: '12px',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onSelectLocation({ coords, address });
                                onClose();
                            }}
                            style={{
                                flex: 2, padding: '10px', background: '#10B981',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <Check size={18} /> Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
