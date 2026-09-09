'use client';
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// leaflet css imported in globals.css

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
    className: '',
    html: `<div style="
        width: 22px; height: 22px; background: #3B82F6;
        border-radius: 50%; border: 3px solid #ffffff;
        box-shadow: 0 0 0 6px rgba(59,130,246,0.35), 0 4px 12px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const CATEGORY_STYLES = {
    parking: { color: '#3B82F6', icon: '🚗' },
    hotel: { color: '#8B5CF6', icon: '🏨' },
    pg: { color: '#10B981', icon: '🏠' },
};

function createPillIcon(spot, isSelected) {
    const cat = spot.category || 'parking';
    const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.parking;
    const isAvailable = spot.status === 'available' || (spot.availableCount ?? 1) > 0;
    const bg = isAvailable ? style.color : '#64748B';

    let priceStr = '₹50/hr';
    if (cat === 'hotel') priceStr = '₹' + (spot.pricePerNight || 2500) + '/n';
    else if (cat === 'pg') priceStr = '₹' + (spot.pricePerMonth || 8500) + '/mo';
    else priceStr = '₹' + (spot.pricePerHour || 50) + '/hr';

    const transform = isSelected ? 'scale(1.18)' : 'scale(1)';
    const shadow = isSelected ? `0 6px 20px ${style.color}88` : '0 4px 14px rgba(0,0,0,0.45)';
    const zIndex = isSelected ? 999 : 100;

    return new L.DivIcon({
        className: 'custom-spot-marker',
        html: `
            <div style="
                display: inline-flex; align-items: center; gap: 5px;
                background: ${bg}; color: #ffffff;
                padding: 5px 10px; border-radius: 20px;
                font-family: Inter, system-ui, sans-serif;
                font-weight: 800; font-size: 11.5px;
                border: 2px solid #ffffff;
                box-shadow: ${shadow};
                transform: ${transform};
                transition: transform 0.15s ease, box-shadow 0.15s ease;
                white-space: nowrap; cursor: pointer; z-index: ${zIndex};
            ">
                <span style="font-size: 13px;">${style.icon}</span>
                <span>${priceStr}</span>
            </div>
        `,
        iconSize: [85, 30],
        iconAnchor: [42, 15],
        popupAnchor: [0, -18],
    });
}

function MapController({ center, selectedSpot }) {
    const map = useMap();
    useEffect(() => {
        if (selectedSpot && selectedSpot.location?.coordinates) {
            const [lng, lat] = selectedSpot.location.coordinates;
            map.flyTo([lat, lng], 15, { animate: true, duration: 1 });
        } else if (center) {
            map.panTo([center.lat, center.lng]);
        }
    }, [center, selectedSpot, map]);
    return null;
}

export default function LeafletMapView({
    userLocation,
    spots = [],
    selectedSpot,
    onSpotSelect,
    onSelectSpot,
    onBook,
    onBookNow,
}) {
    const safeUserLocation = (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number')
        ? userLocation
        : { lat: 12.9863, lng: 80.2432 };

    const handleSelect = (spot) => {
        if (onSpotSelect) onSpotSelect(spot);
        if (onSelectSpot) onSelectSpot(spot);
    };

    const handleBook = (spot) => {
        if (onBook) onBook(spot);
        if (onBookNow) onBookNow(spot);
    };

    const getPriceLabel = (spot) => {
        if (spot.category === 'hotel') return `₹${spot.pricePerNight || 1200}/night`;
        if (spot.category === 'pg') return `₹${spot.pricePerMonth || 6000}/mo`;
        return `₹${spot.pricePerHour || 40}/hr`;
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px' }}>
            <MapContainer
                center={[safeUserLocation.lat, safeUserLocation.lng]}
                zoom={13}
                style={{ width: '100%', height: '100%', minHeight: '520px', background: '#0F172A' }}
                zoomControl={false}
            >
                {/* CartoDB Voyager / Dark Matter Style Map Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapController center={safeUserLocation} selectedSpot={selectedSpot} />

                {/* User GPS Location Marker */}
                <Marker position={[safeUserLocation.lat, safeUserLocation.lng]} icon={userIcon}>
                    <Popup>
                        <div style={{ padding: '4px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                            <strong style={{ color: '#3B82F6' }}>📍 You are here</strong>
                        </div>
                    </Popup>
                </Marker>

                {/* Spot Markers for ALL categories */}
                {spots.map((spot) => {
                    if (!spot.location?.coordinates) return null;
                    const [lng, lat] = spot.location.coordinates;
                    const isSelected = selectedSpot?._id === spot._id;
                    const cat = spot.category || 'parking';
                    const available = spot.availableCount ?? 1;
                    const capacity = spot.totalCapacity ?? 1;
                    const isAvailable = spot.status === 'available' || available > 0;

                    return (
                        <Marker
                            key={spot._id}
                            position={[lat, lng]}
                            icon={createPillIcon(spot, isSelected)}
                            eventHandlers={{
                                click: () => handleSelect(spot)
                            }}
                        >
                            <Popup maxWidth={300} minWidth={240}>
                                <div style={{ padding: '6px', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
                                    {spot.images?.[0] && (
                                        <img
                                            src={spot.images[0]}
                                            alt={spot.title}
                                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                                        />
                                    )}
                                    <div style={{
                                        fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                        color: cat === 'hotel' ? '#8B5CF6' : cat === 'pg' ? '#10B981' : '#3B82F6',
                                        marginBottom: '2px'
                                    }}>
                                        {cat === 'hotel' ? '🏨 Hotel Stay' : cat === 'pg' ? '🏠 PG Accommodation' : '🚗 Smart Parking'}
                                    </div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                                        {spot.title}
                                    </h4>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748B', lineHeight: '1.3' }}>
                                        📍 {spot.address}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                                            {getPriceLabel(spot)}
                                        </span>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                                            background: available > 0 ? '#DCFCE7' : '#FEE2E2',
                                            color: available > 0 ? '#15803D' : '#B91C1C'
                                        }}>
                                            {available > 0 ? `${available}/${capacity} Available` : 'Fully Occupied'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleBook(spot)}
                                        disabled={!isAvailable}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: '8px',
                                            background: isAvailable ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : '#94A3B8',
                                            color: '#ffffff', border: 'none',
                                            fontWeight: '700', fontSize: '13px', cursor: isAvailable ? 'pointer' : 'not-allowed',
                                            boxShadow: isAvailable ? '0 4px 12px rgba(99,102,241,0.4)' : 'none'
                                        }}
                                    >
                                        ⚡ Book Now
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
