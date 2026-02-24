'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
    className: '',
    html: `<div style="width:20px;height:20px;background:#6C63FF;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(108,99,255,0.3),0 2px 8px rgba(0,0,0,0.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const createSpotIcon = (status) => {
    const color = status === 'available' ? '#6BCB77' : '#FF6B6B';
    return new L.DivIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.4)"><div style="transform:rotate(45deg);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px">P</div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
    });
};

function RecenterButton({ userLocation }) {
    const map = useMap();
    return (
        <button
            onClick={() => map.setView([userLocation.lat, userLocation.lng], 15)}
            style={{
                position: 'absolute', bottom: 20, right: 10, zIndex: 1000,
                background: 'var(--primary)', color: '#fff', border: 'none',
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
        >
            📍 My Location
        </button>
    );
}

export default function MapComponent({ userLocation, spots, searchRadius = 5, onParkNow, onReserve, hasActiveBooking, bookingInProgress }) {
    if (!userLocation) return null;

    return (
        <div style={{ position: 'relative' }}>
            <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                style={{ height: 520, width: '100%', background: '#1a1d35' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                        <div style={{ textAlign: 'center', padding: 8 }}>
                            <strong style={{ color: '#6C63FF' }}>📍 You are here</strong>
                        </div>
                    </Popup>
                </Marker>

                {/* Search radius circle */}
                {searchRadius !== 'All' && (
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={searchRadius * 1000}
                        pathOptions={{ color: '#6C63FF', fillColor: '#6C63FF', fillOpacity: 0.04, weight: 1, dashArray: '6 4' }}
                    />
                )}

                {/* Spot markers */}
                {spots.map(spot => (
                    <Marker
                        key={spot._id}
                        position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                        icon={createSpotIcon(spot.status)}
                    >
                        <Popup maxWidth={280}>
                            <div style={{ padding: '8px', minWidth: 220 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: '#1a1d35' }}>
                                    {spot.title}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 8 }}>
                                    📍 {spot.address}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontWeight: 800, color: '#6C63FF', fontSize: '1.1rem' }}>
                                        ₹{spot.pricePerHour}<span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#666' }}>/hr</span>
                                    </span>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                                        background: spot.status === 'available' ? '#6BCB7722' : '#FF6B6B22',
                                        color: spot.status === 'available' ? '#6BCB77' : '#FF6B6B'
                                    }}>
                                        {spot.status === 'available' ? '✓ Available' : spot.status === 'reserved' ? '⏳ Reserved' : '✗ Occupied'}
                                    </span>
                                </div>
                                {spot.host && <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>Host: {spot.host.name} {spot.host.phone ? `| 📞 ${spot.host.phone}` : ''}</div>}
                                {spot.amenities?.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                        {spot.amenities.map(a => <span key={a} style={{ fontSize: '0.65rem', background: '#f0f0ff', color: '#6C63FF', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{a}</span>)}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    {spot.status === 'available' && !hasActiveBooking && (
                                        <button
                                            onClick={() => {
                                                if (onReserve) onReserve(spot._id);
                                                else console.error("onReserve not passed to MapComponent");
                                            }}
                                            disabled={bookingInProgress}
                                            style={{
                                                flex: 1, padding: '9px', background: '#FF9F43',
                                                color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700,
                                                cursor: 'pointer', fontSize: '0.88rem'
                                            }}
                                        >
                                            ⏳ Reserve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onParkNow(spot._id)}
                                        disabled={(spot.status !== 'available' && spot.status !== 'reserved') || hasActiveBooking || bookingInProgress}
                                        style={{
                                            flex: 1, padding: '9px', background: (spot.status === 'available' || spot.status === 'reserved') && !hasActiveBooking ? '#6C63FF' : '#ccc',
                                            color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700,
                                            cursor: (spot.status === 'available' || spot.status === 'reserved') && !hasActiveBooking ? 'pointer' : 'not-allowed',
                                            fontSize: '0.88rem'
                                        }}
                                    >
                                        {bookingInProgress ? '⏳ Booking...' : hasActiveBooking ? '⚠️ Already Parked' : (spot.status === 'available' || spot.status === 'reserved') ? '🚗 Park Now' : '🚫 Unavailable'}
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <RecenterButton userLocation={userLocation} />
            </MapContainer>
        </div>
    );
}
