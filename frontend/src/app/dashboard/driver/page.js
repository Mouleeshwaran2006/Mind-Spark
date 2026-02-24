'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { spotsAPI, bookingsAPI } from '@/lib/api';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false, loading: () => (
        <div style={{ height: 500, background: 'var(--dark-3)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p>Loading Map...</p>
            </div>
        </div>
    )
});

function BookingTimer({ booking, onEnd }) {
    const [elapsed, setElapsed] = useState(0);
    const [ending, setEnding] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!booking) return;
        const startTime = new Date(booking.startTime).getTime();
        const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        update();
        intervalRef.current = setInterval(update, 1000);
        return () => clearInterval(intervalRef.current);
    }, [booking]);

    const seconds = elapsed % 60;
    const minutes = Math.floor(elapsed / 60) % 60;
    const hours = Math.floor(elapsed / 3600);
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const estimatedCost = ((elapsed / 3600) * (booking?.pricePerHour || 0));

    const handleEndSession = async () => {
        setEnding(true);
        try {
            await bookingsAPI.complete(booking._id);
            clearInterval(intervalRef.current);
            setShowQR(true); // Show GPay QR code overlay
        } catch (err) {
            console.error('End session error:', err);
            alert(err.response?.data?.message || 'Error ending session.');
        } finally {
            setEnding(false);
        }
    };

    const handleConfirmPayment = async () => {
        setEnding(true);
        try {
            await bookingsAPI.demoComplete(booking._id);
            alert('Payment verified! Thanks for using Mind Spark.');
            setShowQR(false);
            onEnd();
        } catch (err) {
            alert('Payment verification failed.');
            console.error(err);
        } finally {
            setEnding(false);
        }
    };

    if (!booking) return null;

    // Use a placeholder UPI ID for the host/platform. Since the user asked for "my bank account", we put a generic UPI.
    // They can replace 'merchant@upi' with their actual Google Pay handle.
    const upiString = `upi://pay?pa=merchant@upi&pn=MindSpark%20Parking&am=${estimatedCost.toFixed(2)}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

    return (
        <div className="card" style={{ borderColor: 'rgba(78,205,196,0.4)', background: 'linear-gradient(135deg, rgba(78,205,196,0.06), var(--dark-3))', position: 'relative' }}>

            {showQR && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(26,29,53,0.95)', zIndex: 10, borderRadius: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', padding: 16
                }}>
                    <h3 style={{ marginBottom: 12, color: 'var(--success)', fontSize: '1.2rem' }}>Scan to Pay via GPay/UPI</h3>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                        <img src={qrImageUrl} alt="GPay QR Code" width={180} height={180} style={{ display: 'block' }} />
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>Amount: ₹{estimatedCost.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => {
                            setShowQR(false);
                            // Resume timer visually if cancelled, though actually Backend marks it payment_pending
                            // The user can click Pay again to restore QR
                        }} disabled={ending}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirmPayment} disabled={ending}>
                            {ending ? '⏳ Verifying...' : '✅ I have paid'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="pulse-dot green" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Parking Session</span>
                    </div>
                    <div className="timer-display">{timeStr}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                        📍 {booking.spot?.address || booking.spot?.title}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Estimated Cost</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)' }}>₹{estimatedCost.toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>@ ₹{booking.pricePerHour}/hr</div>
                    <button className="btn btn-danger" onClick={handleEndSession} disabled={ending || showQR}>
                        {ending && !showQR ? '⏳ Processing...' : '🛑 End Session & Pay'}
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
    const [activeBooking, setActiveBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [booking, setBooking] = useState(false);
    const [radius, setRadius] = useState('All');

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'driver') { router.push(`/dashboard/${user?.activeRole}`); return; }
        checkActiveBooking();
        getLocation();

        // Load Razorpay script
        const scriptId = 'razorpay-checkout-js';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, [isAuthenticated, user, router]);

    const checkActiveBooking = async () => {
        try {
            const res = await bookingsAPI.getActive();
            setActiveBooking(res.data.booking);
        } catch { }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported by your browser.');
            setUserLocation({ lat: 12.9716, lng: 77.5946 }); // Bangalore fallback
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoading(false);
            },
            () => {
                setLocationError('Location access denied. Using default location (Bangalore).');
                setUserLocation({ lat: 12.9716, lng: 77.5946 });
                setLoading(false);
            },
            { timeout: 8000 }
        );
    };

    const fetchNearbySpots = useCallback(async () => {
        if (!userLocation) return;
        try {
            let res;
            if (radius === 'All') {
                res = await spotsAPI.getAllSpots();
            } else {
                res = await spotsAPI.getNearby(userLocation.lat, userLocation.lng, radius);
            }
            setSpots(res.data.spots || []);
        } catch (err) {
            console.error('Fetch spots error:', err);
        }
    }, [userLocation, radius]);

    useEffect(() => {
        if (userLocation) fetchNearbySpots();
    }, [userLocation, radius, fetchNearbySpots]);

    const handleParkNow = async (spotId) => {
        setBooking(true);
        try {
            const res = await bookingsAPI.create(spotId);
            setActiveBooking(res.data.booking);
            fetchNearbySpots();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to book spot.');
        } finally {
            setBooking(false);
        }
    };

    const handleReserve = async (spotId) => {
        setBooking(true);
        try {
            const res = await spotsAPI.reserve(spotId);
            alert(res.data.message || 'Spot reserved for 10 minutes.');
            fetchNearbySpots();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reserve spot.');
        } finally {
            setBooking(false);
        }
    };

    const handleSessionEnd = () => {
        setActiveBooking(null);
        fetchNearbySpots();
    };

    if (loading) return (
        <DashboardLayout>
            <div className="loader"><div className="spinner" /></div>
        </DashboardLayout>
    );

    const availableCount = spots.filter(s => s.status === 'available').length;

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">🗺️ Live Parking Map</h1>
                <p className="page-subtitle">Find and book available parking spots near you in real time</p>
            </div>

            {locationError && <div className="alert alert-info">📍 {locationError}</div>}

            {/* Active Booking Timer */}
            {activeBooking && (
                <div style={{ marginBottom: 24 }}>
                    <BookingTimer booking={activeBooking} onEnd={handleSessionEnd} />
                </div>
            )}

            {/* Stats row */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)' }}>📍</div>
                    <div><div className="stat-label">Spots Found</div><div className="stat-value">{spots.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)' }}>✅</div>
                    <div><div className="stat-label">Available</div><div className="stat-value" style={{ color: 'var(--success)' }}>{availableCount}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)' }}>🚫</div>
                    <div><div className="stat-label">Occupied</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{spots.length - availableCount}</div></div>
                </div>
            </div>

            {/* Radius control */}
            <div className="card" style={{ marginBottom: 20, padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>Filter by distance:</span>
                    {['All', 1, 2, 5, 10].map(r => (
                        <button key={r} onClick={() => setRadius(r)} className="btn btn-sm" style={{ background: radius === r ? 'var(--primary)' : 'var(--dark-4)', color: radius === r ? '#fff' : 'var(--text-secondary)', border: `1px solid ${radius === r ? 'var(--primary)' : 'rgba(108,99,255,0.2)'}` }}>
                            {r === 'All' ? 'All Spots' : `${r} km radius`}
                        </button>
                    ))}
                    <button className="btn btn-sm btn-secondary" onClick={fetchNearbySpots}>🔄 Refresh</button>
                </div>
            </div>

            {/* Map */}
            <div className="map-container" style={{ marginBottom: 24 }}>
                {userLocation && (
                    <MapComponent
                        userLocation={userLocation}
                        spots={spots}
                        searchRadius={radius}
                        onParkNow={handleParkNow}
                        onReserve={handleReserve}
                        hasActiveBooking={!!activeBooking}
                        bookingInProgress={booking}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
