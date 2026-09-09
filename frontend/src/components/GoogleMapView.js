'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Car, Building2, Home } from 'lucide-react';

const LeafletMapView = dynamic(() => import('./LeafletMapView'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%', height: '100%', minHeight: '520px',
            background: '#0B0D17', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#818CF8', flexDirection: 'column', gap: 12
        }}>
            <div style={{
                width: 38, height: 38, border: '3px solid rgba(129,140,248,0.2)',
                borderTopColor: '#818CF8', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading Interactive Map Canvas...</span>
        </div>
    )
});

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const CATEGORY_COLORS = {
    parking: { bg: '#3B82F6', border: '#1D4ED8', text: '#FFFFFF', icon: Car, label: 'Parking' },
    hotel: { bg: '#8B5CF6', border: '#6D28D9', text: '#FFFFFF', icon: Building2, label: 'Hotel' },
    pg: { bg: '#10B981', border: '#047857', text: '#FFFFFF', icon: Home, label: 'PG Room' },
};

const DEFAULT_CHENNAI = { lat: 12.9863, lng: 80.2432 };

export default function GoogleMapView(props) {
    const {
        userLocation,
        spots = [],
        activeCategory = 'parking',
        searchRadius = 10,
        selectedSpot: propSelectedSpot,
        selectedSpotId,
        onSpotSelect,
        onSelectSpot,
        onBook,
        onBookNow,
        onReserve
    } = props;

    const safeUserLocation = (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number')
        ? userLocation
        : DEFAULT_CHENNAI;

    const [selectedSpot, setSelectedSpot] = useState(null);
    const [mapCenter, setMapCenter] = useState(safeUserLocation);

    // Sync external selectedSpot prop
    useEffect(() => {
        if (propSelectedSpot) {
            setSelectedSpot(propSelectedSpot);
            if (propSelectedSpot.location?.coordinates) {
                setMapCenter({
                    lat: propSelectedSpot.location.coordinates[1],
                    lng: propSelectedSpot.location.coordinates[0]
                });
            }
        }
    }, [propSelectedSpot]);

    // Sync userLocation changes
    useEffect(() => {
        if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
            setMapCenter(userLocation);
        }
    }, [userLocation]);

    // Sync selectedSpotId changes
    useEffect(() => {
        if (selectedSpotId && spots.length > 0) {
            const found = spots.find(s => s._id === selectedSpotId);
            if (found) {
                setSelectedSpot(found);
                if (found.location?.coordinates) {
                    setMapCenter({
                        lat: found.location.coordinates[1],
                        lng: found.location.coordinates[0]
                    });
                }
            }
        }
    }, [selectedSpotId, spots]);

    const handleSelect = (spot) => {
        setSelectedSpot(spot);
        if (onSpotSelect) onSpotSelect(spot);
        if (onSelectSpot) onSelectSpot(spot);
    };

    const handleBook = (spot) => {
        if (onBook) onBook(spot);
        if (onBookNow) onBookNow(spot);
        if (onReserve) onReserve(spot);
    };

    const getPriceLabel = (spot) => {
        if (spot.category === 'hotel') return `₹${spot.pricePerNight || 1200}/night`;
        if (spot.category === 'pg') return `₹${spot.pricePerMonth || 6000}/mo`;
        return `₹${spot.pricePerHour || 40}/hr`;
    };

    // If Google Maps API key is configured, use official Google Maps JS API SDK
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.trim() !== '') {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: '16px', overflow: 'hidden' }}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <Map
                        defaultCenter={safeUserLocation}
                        center={mapCenter || safeUserLocation}
                        onCenterChanged={(e) => setMapCenter(e.detail.center)}
                        defaultZoom={13}
                        mapId="DEMO_MAP_ID"
                        internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        style={{ width: '100%', height: '100%', minHeight: '520px' }}
                    >
                        {/* User GPS Location Marker */}
                        <AdvancedMarker position={safeUserLocation}>
                            <div style={{
                                width: '22px', height: '22px', background: '#2563EB',
                                borderRadius: '50%', border: '3px solid #ffffff',
                                boxShadow: '0 0 0 6px rgba(37,99,235,0.3), 0 4px 12px rgba(0,0,0,0.3)'
                            }} title="You are here" />
                        </AdvancedMarker>

                        {/* Property & Parking Spot Markers */}
                        {spots.map((spot) => {
                            if (!spot.location?.coordinates) return null;
                            const [lng, lat] = spot.location.coordinates;
                            const cat = spot.category || 'parking';
                            const theme = CATEGORY_COLORS[cat] || CATEGORY_COLORS.parking;
                            const isAvailable = spot.status === 'available' || (spot.availableCount ?? 1) > 0;
                            const isCurrentlySelected = (selectedSpot?._id === spot._id) || (propSelectedSpot?._id === spot._id);

                            return (
                                <AdvancedMarker
                                    key={spot._id}
                                    position={{ lat, lng }}
                                    onClick={() => handleSelect(spot)}
                                >
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: isAvailable ? theme.bg : '#64748B',
                                        color: '#fff', padding: '6px 10px', borderRadius: '24px',
                                        fontWeight: '700', fontSize: '12px',
                                        border: '2px solid #ffffff',
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                                        cursor: 'pointer',
                                        transform: isCurrentlySelected ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'transform 0.15s ease'
                                    }}>
                                        <span>{cat === 'hotel' ? '🏨' : cat === 'pg' ? '🏠' : '🚗'}</span>
                                        <span>{getPriceLabel(spot)}</span>
                                    </div>
                                </AdvancedMarker>
                            );
                        })}

                        {/* Interactive InfoWindow on Marker Click */}
                        {selectedSpot && selectedSpot.location?.coordinates && (
                            <InfoWindow
                                position={{
                                    lat: selectedSpot.location.coordinates[1],
                                    lng: selectedSpot.location.coordinates[0]
                                }}
                                onCloseClick={() => setSelectedSpot(null)}
                            >
                                <div style={{ minWidth: '220px', maxWidth: '280px', padding: '6px', color: '#0F172A', fontFamily: 'inherit' }}>
                                    {selectedSpot.images?.[0] && (
                                        <img
                                            src={selectedSpot.images[0]}
                                            alt={selectedSpot.title}
                                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                                        />
                                    )}
                                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: CATEGORY_COLORS[selectedSpot.category]?.bg || '#2563EB', marginBottom: '2px' }}>
                                        {selectedSpot.category === 'hotel' ? '🏨 Hotel Stay' : selectedSpot.category === 'pg' ? '🏠 PG Accommodation' : '🚗 Smart Parking'}
                                    </div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{selectedSpot.title}</h4>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748B' }}>📍 {selectedSpot.address}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>{getPriceLabel(selectedSpot)}</span>
                                        <span style={{
                                             fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                                             background: (selectedSpot.availableCount ?? 1) > 0 ? '#DCFCE7' : '#FEE2E2',
                                             color: (selectedSpot.availableCount ?? 1) > 0 ? '#15803D' : '#B91C1C'
                                         }}>
                                             {(selectedSpot.availableCount ?? 1) > 0 ? `${selectedSpot.availableCount ?? 1} Available` : 'Fully Occupied'}
                                         </span>
                                     </div>

                                    <button
                                        onClick={() => handleBook(selectedSpot)}
                                        disabled={(selectedSpot.availableCount ?? 1) <= 0 && selectedSpot.status !== 'available'}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: '8px',
                                            background: '#2563EB', color: '#fff', border: 'none',
                                            fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                                        }}
                                    >
                                        ⚡ Book Now
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>
                </APIProvider>
            </div>
        );
    }

    // High-performance interactive multi-spot tile map engine
    return (
        <LeafletMapView
            userLocation={safeUserLocation}
            spots={spots}
            selectedSpot={propSelectedSpot || selectedSpot}
            onSpotSelect={handleSelect}
            onSelectSpot={handleSelect}
            onBook={handleBook}
            onBookNow={handleBook}
        />
    );
}
