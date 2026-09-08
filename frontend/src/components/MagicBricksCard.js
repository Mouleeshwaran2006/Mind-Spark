'use client';
import React, { useState } from 'react';
import { Star, MapPin, Users, Shield, Utensils, Zap, Car, Building2, Home, CheckCircle2 } from 'lucide-react';

const CATEGORY_BADGES = {
    parking: { label: 'Parking Space', bg: '#EFF6FF', text: '#1D4ED8', icon: Car },
    hotel: { label: 'Hotel Room', bg: '#F5F3FF', text: '#6D28D9', icon: Building2 },
    pg: { label: 'PG / Co-Living', bg: '#ECFDF5', text: '#047857', icon: Home },
};

export default function MagicBricksCard({
    spot,
    onBook,
    onReserve,
    onViewOnMap,
    isReserved
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const cat = spot.category || 'parking';
    const badge = CATEGORY_BADGES[cat] || CATEGORY_BADGES.parking;

    const images = spot.images && spot.images.length > 0 ? spot.images : [
        cat === 'hotel'
            ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
            : cat === 'pg'
            ? 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
            : 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ];

    const getPriceDisplay = () => {
        if (cat === 'hotel') {
            return (
                <div>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>₹{spot.pricePerNight || 1500}</span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}> / night</span>
                </div>
            );
        }
        if (cat === 'pg') {
            return (
                <div>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>₹{spot.pricePerMonth || 6500}</span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}> / month</span>
                    {spot.depositAmount > 0 && (
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Deposit: ₹{spot.depositAmount}</div>
                    )}
                </div>
            );
        }
        return (
            <div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>₹{spot.pricePerHour || 40}</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}> / hour</span>
                {spot.pricePerDay > 0 && (
                    <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: '600' }}>₹{spot.pricePerDay} / day</div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            background: '#ffffff', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease',
            position: 'relative'
        }}>
            {/* Image Gallery Header with Badge Overlay */}
            <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#F1F5F9' }}>
                <img
                    src={images[currentImageIndex]}
                    alt={spot.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)'
                }} />

                {/* Category Badge Top Left */}
                <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: badge.bg, color: badge.text,
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                    <badge.icon size={13} /> {badge.label}
                </div>

                {/* Vacancy Indicator Badge Top Right */}
                <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: spot.availableCount > 0 ? '#10B981' : '#EF4444',
                    color: '#ffffff', padding: '4px 10px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                    {spot.availableCount > 0 ? `🔥 ${spot.availableCount} Available` : '❌ Full'}
                </div>

                {/* Image count pill */}
                {images.length > 1 && (
                    <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600'
                    }}>
                        1 / {images.length}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Title & Rating */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h3 style={{
                        margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A',
                        lineHeight: '1.3', flex: 1, marginRight: '8px'
                    }}>
                        {spot.title}
                    </h3>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: '700'
                    }}>
                        <Star size={12} fill="#D97706" /> {spot.rating?.average ? spot.rating.average.toFixed(1) : '4.8'}
                    </div>
                </div>

                {/* Address */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                    <MapPin size={14} color="#94A3B8" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.address}</span>
                </div>

                {/* Category-Specific Specs Pill Grid (MagicBricks Style) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {cat === 'pg' && (
                        <>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                👥 {spot.sharingType?.toUpperCase()} Sharing
                            </span>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                🍲 Food: {spot.foodType?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                🚻 {spot.gender?.toUpperCase()}
                            </span>
                        </>
                    )}

                    {cat === 'hotel' && (
                        <>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                🛏️ {spot.roomType?.toUpperCase()} Room
                            </span>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                ❄️ {spot.acAvailable ? 'AC Included' : 'Non-AC'}
                            </span>
                        </>
                    )}

                    {cat === 'parking' && (
                        <>
                            <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                🚗 {spot.vehicleType?.toUpperCase()}
                            </span>
                            {spot.isCovered && (
                                <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                    🛡️ Covered Bay
                                </span>
                            )}
                            {spot.hasEVCharging && (
                                <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                    ⚡ EV Fast Charge
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Amenities chips snippet */}
                {spot.amenities?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {spot.amenities.slice(0, 3).map((a) => (
                            <span key={a} style={{ fontSize: '10px', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                                ✓ {a}
                            </span>
                        ))}
                        {spot.amenities.length > 3 && (
                            <span style={{ fontSize: '10px', color: '#94A3B8' }}>+{spot.amenities.length - 3} more</span>
                        )}
                    </div>
                )}

                {/* Footer: Price + Actions */}
                <div style={{
                    marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F1F5F9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    {getPriceDisplay()}

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {onViewOnMap && (
                            <button
                                onClick={() => onViewOnMap(spot)}
                                style={{
                                    padding: '8px 10px', background: '#F1F5F9', color: '#475569',
                                    border: '1px solid #E2E8F0', borderRadius: '8px',
                                    fontWeight: '600', fontSize: '12px', cursor: 'pointer'
                                }}
                            >
                                🗺️ Map
                            </button>
                        )}
                        <button
                            onClick={() => onBook(spot)}
                            disabled={spot.availableCount <= 0 && spot.status !== 'available'}
                            style={{
                                padding: '8px 14px',
                                background: spot.availableCount > 0 ? '#2563EB' : '#94A3B8',
                                color: '#ffffff', border: 'none', borderRadius: '8px',
                                fontWeight: '700', fontSize: '13px', cursor: spot.availableCount > 0 ? 'pointer' : 'not-allowed',
                                boxShadow: spot.availableCount > 0 ? '0 2px 8px rgba(37,99,235,0.3)' : 'none'
                            }}
                        >
                            {spot.availableCount > 0 ? '⚡ Book' : 'Occupied'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
