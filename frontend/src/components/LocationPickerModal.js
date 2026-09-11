'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Navigation, Check, X, Crosshair } from 'lucide-react';
import { spotsAPI } from '../lib/api';

const InteractiveLocationPickerMap = dynamic(
    () => import('./InteractiveLocationPickerMap'),
    {
        ssr: false,
        loading: () => (
            <div style={{
                width: '100%', height: '340px',
                background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818CF8', flexDirection: 'column', gap: 12
            }}>
                <div style={{
                    width: 32, height: 32, border: '3px solid rgba(129,140,248,0.2)',
                    borderTopColor: '#818CF8', borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Loading Pinpoint Map...</span>
            </div>
        )
    }
);

export default function LocationPickerModal({
    isOpen,
    onClose,
    onLocationSelected,
    onSelectLocation,
    initialCoords = { lat: 12.9863, lng: 80.2432 },
    initialAddress = ''
}) {
    const [coords, setCoords] = useState(initialCoords || { lat: 12.9863, lng: 80.2432 });
    const [address, setAddress] = useState(initialAddress || '');
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('Chennai');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        if (initialCoords && initialCoords.lat && initialCoords.lng) {
            setCoords(initialCoords);
        }
        if (initialAddress) {
            setAddress(initialAddress);
        }
    }, [initialCoords, initialAddress, isOpen]);

    // Reverse geocode coords to address using backend API or Nominatim
    const updateAddressFromCoords = useCallback(async (lat, lng) => {
        setIsGeocoding(true);
        try {
            // Try backend reverse geocode first
            const res = await spotsAPI.reverseGeocode(lat, lng);
            if (res.data && res.data.success) {
                setAddress(res.data.address || `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
                if (res.data.locality) setLocality(res.data.locality);
                if (res.data.city) setCity(res.data.city);
            } else {
                // Direct fallback geocode
                const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                    headers: { 'User-Agent': 'MindSparkSmartMarketplace/2.0' }
                });
                const data = await nomRes.json();
                const displayName = data.display_name || `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
                setAddress(displayName);
                const addr = data.address || {};
                setLocality(addr.neighbourhood || addr.suburb || addr.residential || 'Chennai');
                setCity(addr.city || addr.town || 'Chennai');
            }
        } catch (e) {
            setAddress(`Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    // Handle pin moved / dropped / clicked on map
    const handlePositionChange = (newLatLng) => {
        setCoords(newLatLng);
        updateAddressFromCoords(newLatLng.lat, newLatLng.lng);
    };

    // Forward search address
    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const query = searchQuery.toLowerCase().includes('chennai') ? searchQuery : (searchQuery + ', Chennai');
            const encoded = encodeURIComponent(query);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
                headers: { 'User-Agent': 'MindSparkSmartMarketplace/2.0' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const newLat = parseFloat(data[0].lat);
                const newLng = parseFloat(data[0].lon);
                setCoords({ lat: newLat, lng: newLng });
                setAddress(data[0].display_name);
                updateAddressFromCoords(newLat, newLng);
            } else {
                alert('Location not found. Try searching a major landmark or area (e.g. Tidel Park, Guindy, Velachery).');
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

    // Quick preset location picker
    const handlePreset = (lat, lng, name) => {
        const newCoords = { lat, lng };
        setCoords(newCoords);
        setAddress(name + ', Chennai');
        updateAddressFromCoords(lat, lng);
    };

    // Handle Confirm Click
    const handleConfirm = () => {
        const payload = {
            lat: coords.lat,
            lng: coords.lng,
            coords: coords,
            address: address || `Pinned Location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`,
            locality: locality || 'Chennai',
            city: city || 'Chennai'
        };

        if (onLocationSelected) onLocationSelected(payload);
        if (onSelectLocation) onSelectLocation(payload);
        if (onClose) onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#131627', color: '#fff', borderRadius: '24px',
                width: '100%', maxWidth: '720px', overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.15)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#131627'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            padding: '8px', background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                            borderRadius: '12px', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                        }}>
                            <MapPin size={20} color="#fff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Pinpoint Exact Location</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                                Drag the red pin or click anywhere on the map to set exact spot (Uber / Ola style)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', padding: 8, borderRadius: 10, cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search & GPS Bar */}
                <div style={{ padding: '12px 20px', background: '#0B0D17', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#1E293B', padding: '8px 14px', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                            <Search size={16} color="#818CF8" />
                            <input
                                type="text"
                                placeholder="Search landmark, street or area (e.g. Tidel Park, OMR, Guindy)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#fff',
                                    outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 500
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            style={{
                                padding: '8px 18px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700',
                                fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
                            }}
                        >
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>

                    <button
                        onClick={handleUseGPS}
                        title="Center map on my current GPS location"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', background: 'rgba(56,189,248,0.12)', color: '#38BDF8',
                            border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px',
                            fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        <Crosshair size={16} /> GPS
                    </button>
                </div>

                {/* Interactive Leaflet Map Canvas with Draggable Pin */}
                <div style={{ position: 'relative', width: '100%', height: '360px', background: '#0F172A' }}>
                    <InteractiveLocationPickerMap
                        position={coords}
                        onPositionChange={handlePositionChange}
                    />

                    {/* Quick Landmark Presets Floating Bar */}
                    <div style={{
                        position: 'absolute', bottom: 10, left: 10, right: 10,
                        display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px', zIndex: 1000
                    }}>
                        {[
                            { name: 'Tidel Park (OMR)', lat: 12.9892, lng: 80.2425 },
                            { name: 'Velachery Metro', lat: 12.9790, lng: 80.2185 },
                            { name: 'Guindy Metro', lat: 13.0067, lng: 80.2128 },
                            { name: 'Royapettah / EA', lat: 13.0587, lng: 80.2608 },
                            { name: 'Sholinganallur', lat: 12.9010, lng: 80.2280 },
                            { name: 'Anna Nagar', lat: 13.0850, lng: 80.2100 },
                        ].map((preset) => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => handlePreset(preset.lat, preset.lng, preset.name)}
                                style={{
                                    padding: '6px 12px', background: 'rgba(15,23,42,0.92)',
                                    color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '16px', fontSize: '11px', fontWeight: '700',
                                    whiteSpace: 'nowrap', cursor: 'pointer', backdropFilter: 'blur(6px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}
                            >
                                🎯 {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Address Banner & Confirm Bar */}
                <div style={{ padding: '16px 22px', background: '#1E293B', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Selected Pinpoint Location
                            </div>
                            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>
                                Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
                            </div>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#F8FAFC', lineHeight: '1.4', marginTop: 4 }}>
                            {isGeocoding ? '⏳ Locating exact address from pin...' : (address || 'Drag pin or click on map to set location')}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '11px', background: '#334155',
                                color: '#CBD5E1', border: 'none', borderRadius: '12px',
                                fontWeight: '700', fontSize: '13.5px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            style={{
                                flex: 2, padding: '11px', background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 16px rgba(16,185,129,0.35)'
                            }}
                        >
                            <Check size={18} /> Confirm Pinned Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
