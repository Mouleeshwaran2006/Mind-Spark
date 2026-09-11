'use client';
import React, { useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create custom Uber / Ola style draggable pin icon
const createPinIcon = () => {
    return new L.DivIcon({
        className: 'interactive-draggable-pin',
        html: `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translate(-50%, -100%);
                cursor: grab;
                user-select: none;
            ">
                <div style="
                    background: #EF4444;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 12px;
                    margin-bottom: 2px;
                    border: 1.5px solid #ffffff;
                    white-space: nowrap;
                    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.5);
                    font-family: Inter, system-ui, sans-serif;
                ">
                    📍 Drag Pin Here
                </div>
                <div style="
                    width: 38px;
                    height: 38px;
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                ">
                    <div style="
                        width: 14px;
                        height: 14px;
                        background: #ffffff;
                        border-radius: 50%;
                        transform: rotate(45deg);
                    "></div>
                </div>
                <div style="
                    width: 12px;
                    height: 5px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 50%;
                    margin-top: 2px;
                "></div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -48],
    });
};

function DraggableMarker({ position, onPositionChange }) {
    const markerRef = useRef(null);
    const pinIcon = useMemo(() => createPinIcon(), []);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const latlng = marker.getLatLng();
                    onPositionChange({ lat: latlng.lat, lng: latlng.lng });
                }
            },
        }),
        [onPositionChange]
    );

    // Map click handler to place pin on clicked location
    useMapEvents({
        click(e) {
            onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
            icon={pinIcon}
        />
    );
}

function MapViewController({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position && position.lat && position.lng) {
            map.flyTo([position.lat, position.lng], map.getZoom() || 15, { animate: true, duration: 0.8 });
        }
    }, [position, map]);
    return null;
}

export default function InteractiveLocationPickerMap({ position, onPositionChange }) {
    const safePos = (position && typeof position.lat === 'number' && typeof position.lng === 'number')
        ? position
        : { lat: 12.9863, lng: 80.2432 };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '340px' }}>
            <MapContainer
                center={[safePos.lat, safePos.lng]}
                zoom={15}
                style={{ width: '100%', height: '100%', minHeight: '340px', background: '#0F172A' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <DraggableMarker position={safePos} onPositionChange={onPositionChange} />
                <MapViewController position={safePos} />
            </MapContainer>
        </div>
    );
}
