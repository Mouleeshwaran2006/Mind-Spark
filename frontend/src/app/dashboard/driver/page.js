'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { spotsAPI, bookingsAPI } from '@/lib/api';
import GoogleMapView from '@/components/GoogleMapView';
import MagicBricksCard from '@/components/MagicBricksCard';
import UnifiedBookingModal from '@/components/UnifiedBookingModal';

function BookingTimer({ booking, onEnd }) {
    const [elapsed, setElapsed] = useState(0);
    const [ending, setEnding] = useState(false);

    useEffect(() => {
        if (!booking) return;
        const startTime = new Date(booking.startTime).getTime();
        const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [booking]);

    const seconds = elapsed % 60;
    const minutes = Math.floor(elapsed / 60) % 60;
    const hours = Math.floor(elapsed / 3600);
    const timeStr = [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
    const estimatedCost = ((elapsed / 3600) * (booking?.pricePerHour || booking?.unitPrice || 50));

    const handleEndSession = async () => {
        setEnding(true);
        try {
            await bookingsAPI.complete(booking._id);
            alert('Session ended! Thank you for parking with Mind Spark.');
            onEnd();
        } catch (err) {
            console.error('End session error:', err);
            alert(err.response?.data?.message || 'Error ending session.');
        } finally {
            setEnding(false);
        }
    };

    if (!booking) return null;

    return (
        <div className="card" style={{ borderColor: 'rgba(78,205,196,0.4)', background: 'linear-gradient(135deg, rgba(78,205,196,0.08), var(--dark-3))', position: 'relative', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="pulse-dot green" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Session</span>
                    </div>
                    <div className="timer-display" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4ECDC4' }}>{timeStr}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                        📍 {booking.spot?.title || 'Spot'} — {booking.spot?.address}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Estimated Cost</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)' }}>₹{estimatedCost.toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>@ ₹{booking.pricePerHour || booking.unitPrice || 50}/hr</div>
                    <button className="btn btn-danger" onClick={handleEndSession} disabled={ending}>
                        {ending ? '⏳ Ending Session...' : '🛑 End Session & Pay'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DriverDashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [userLocation, setUserLocation] = useState(null);
    const [spots, setSpots] = useState([]);
    const [category, setCategory] = useState('parking');
    const [activeBooking, setActiveBooking] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [bookingSpot, setBookingSpot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState('All');
    const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'cards'

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'driver') { router.push('/dashboard/' + user?.activeRole); return; }
        checkActiveBooking();
        getLocation();
    }, [isAuthenticated, user, router]);

    const checkActiveBooking = async () => {
        try {
            const res = await bookingsAPI.getActive();
            setActiveBooking(res.data.booking);
        } catch { }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setUserLocation({ lat: 12.9863, lng: 80.2432 });
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoading(false);
            },
            () => {
                setUserLocation({ lat: 12.9863, lng: 80.2432 });
                setLoading(false);
            },
            { timeout: 8000 }
        );
    };

    const fetchSpots = useCallback(async () => {
        try {
            let res;
            const catParam = category === 'all' ? undefined : category;
            if (radius === 'All' || !userLocation) {
                res = await spotsAPI.getAllSpots({ category: catParam });
            } else {
                res = await spotsAPI.getNearby(userLocation.lat, userLocation.lng, radius, catParam);
            }
            setSpots(res.data.spots || []);
        } catch (err) {
            console.error('Fetch spots error:', err);
        }
    }, [userLocation, radius, category]);

    useEffect(() => {
        fetchSpots();
    }, [fetchSpots]);

    const handleSessionEnd = () => {
        setActiveBooking(null);
        fetchSpots();
    };

    if (loading) return (
        <DashboardLayout>
            <div className="loader"><div className="spinner" /></div>
        </DashboardLayout>
    );

    const availableCount = spots.filter(s => (s.availableCount ?? 1) > 0).length;

    return (
        <DashboardLayout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">🗺️ Live Map & Marketplace</h1>
                    <p className="page-subtitle">Search and book nearby Parking Slots, Hotel Rooms, and PG Vacancies in real time</p>
                </div>

                {/* Category Switcher in Header */}
                <div style={{ display: 'flex', gap: 6, background: 'var(--dark-3)', padding: '4px 6px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
                    {[
                        { id: 'parking', icon: '🚗', name: 'Parking' },
                        { id: 'hotel', icon: '🏨', name: 'Hotels' },
                        { id: 'pg', icon: '🏠', name: 'PG Rooms' },
                        { id: 'all', icon: '✨', name: 'All' },
                    ].map(c => (
                        <button
                            key={c.id}
                            onClick={() => setCategory(c.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 8,
                                background: category === c.id ? 'var(--primary)' : 'transparent',
                                color: category === c.id ? '#FFF' : 'var(--text-secondary)',
                                border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                            }}
                        >
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Booking Timer */}
            {activeBooking && (
                <BookingTimer booking={activeBooking} onEnd={handleSessionEnd} />
            )}

            {/* Stats row */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)' }}>📍</div>
                    <div><div className="stat-label">Total Listings Found</div><div className="stat-value">{spots.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)' }}>✅</div>
                    <div><div className="stat-label">Vacancies Available</div><div className="stat-value" style={{ color: 'var(--success)' }}>{availableCount}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)' }}>🚫</div>
                    <div><div className="stat-label">Full / Occupied</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{spots.length - availableCount}</div></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Distance Radius:</span>
                    {['All', 1, 2, 5, 10, 25].map(r => (
                        <button
                            key={r}
                            onClick={() => setRadius(r)}
                            className="btn btn-sm"
                            style={{
                                background: radius === r ? 'var(--primary)' : 'var(--dark-4)',
                                color: radius === r ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid ' + (radius === r ? 'var(--primary)' : 'rgba(108,99,255,0.2)')
                            }}
                        >
                            {r === 'All' ? 'All Spots' : (r + ' km')}
                        </button>
                    ))}
                    <button className="btn btn-sm btn-secondary" onClick={fetchSpots}>🔄 Refresh</button>
                </div>

                {/* View Switch */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--dark-4)', padding: 3, borderRadius: 8 }}>
                    <button onClick={() => setViewMode('split')} className="btn btn-sm" style={{ background: viewMode === 'split' ? 'var(--primary)' : 'transparent', color: viewMode === 'split' ? '#fff' : 'var(--text-muted)' }}>Split View</button>
                    <button onClick={() => setViewMode('map')} className="btn btn-sm" style={{ background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? '#fff' : 'var(--text-muted)' }}>Map Only</button>
                    <button onClick={() => setViewMode('cards')} className="btn btn-sm" style={{ background: viewMode === 'cards' ? 'var(--primary)' : 'transparent', color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)' }}>Cards Only</button>
                </div>
            </div>

            {/* Split View */}
            {viewMode === 'split' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                        {spots.map(spot => (
                            <div
                                key={spot._id}
                                onMouseEnter={() => setSelectedSpot(spot)}
                                style={{
                                    border: selectedSpot?._id === spot._id ? '2px solid var(--primary)' : '2px solid transparent',
                                    borderRadius: 16
                                }}
                            >
                                <MagicBricksCard
                                    spot={spot}
                                    onBook={(s) => setBookingSpot(s)}
                                    onSelect={(s) => setSelectedSpot(s)}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ position: 'sticky', top: 90, height: 'calc(100vh - 280px)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <GoogleMapView
                            spots={spots}
                            userLocation={userLocation}
                            selectedSpot={selectedSpot}
                            onSpotSelect={(spot) => setSelectedSpot(spot)}
                            onBook={(s) => setBookingSpot(s)}
                        />
                    </div>
                </div>
            )}

            {/* Map Only */}
            {viewMode === 'map' && (
                <div style={{ height: 'calc(100vh - 300px)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <GoogleMapView
                        spots={spots}
                        userLocation={userLocation}
                        selectedSpot={selectedSpot}
                        onSpotSelect={(spot) => setSelectedSpot(spot)}
                        onBook={(s) => setBookingSpot(s)}
                    />
                </div>
            )}

            {/* Cards Only */}
            {viewMode === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {spots.map(spot => (
                        <MagicBricksCard
                            key={spot._id}
                            spot={spot}
                            onBook={(s) => setBookingSpot(s)}
                            onSelect={(s) => setSelectedSpot(s)}
                        />
                    ))}
                </div>
            )}

            {/* Unified Booking Modal */}
            {bookingSpot && (
                <UnifiedBookingModal
                    spot={bookingSpot}
                    onClose={() => setBookingSpot(null)}
                    onSuccess={() => {
                        fetchSpots();
                        checkActiveBooking();
                        setBookingSpot(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
}
