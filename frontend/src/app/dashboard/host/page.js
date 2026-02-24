'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import { spotsAPI, bookingsAPI } from '@/lib/api';

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 250, background: 'var(--dark-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading Map...</p>
        </div>
    )
});

function AddSpotModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ title: '', address: '', description: '', pricePerHour: '', amenities: '' });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [geoStatus, setGeoStatus] = useState('');
    const [isManualPin, setIsManualPin] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (form.address && form.address.length > 5 && !isManualPin) {
                geocodeAddress(form.address);
            }
        }, 1200);
        return () => clearTimeout(timeoutId);
    }, [form.address, isManualPin]);

    const geocodeAddress = async (addr) => {
        setGeoStatus('🔍 Locating address on map...');
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.length > 0) {
                setLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                setGeoStatus('📍 Found address on map!');
                setTimeout(() => setGeoStatus(''), 3000);
            } else {
                setGeoStatus('⚠️ Address not found, please pin manually');
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            setGeoStatus('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (!location) {
            setGeoStatus('🔍 Geocoding address...');
        } else {
            setGeoStatus('📍 Saving pinned location...');
        }
        try {
            const amenitiesArr = form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [];
            await spotsAPI.createSpot({
                ...form,
                amenities: amenitiesArr,
                pricePerHour: parseFloat(form.pricePerHour),
                ...(location && { lat: location.lat, lng: location.lng })
            });
            setGeoStatus('✅ Spot listed successfully!');
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create spot.');
            setGeoStatus('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '600px', padding: '24px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">🏠 Add New Parking Spot</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                {geoStatus && <div className="alert alert-info">{geoStatus}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Spot Title</label>
                        <input className="form-input" placeholder="e.g., My Home Driveway" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Full Address</label>
                        <input className="form-input" placeholder="e.g., 42 MG Road, Bangalore, Karnataka" value={form.address} onChange={e => { setForm(p => ({ ...p, address: e.target.value })); setIsManualPin(false); }} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pin Location on Map (Optional, overrides address geocoding)</label>
                        <LocationPickerMap position={location} setPosition={(pos) => { setLocation(pos); setIsManualPin(true); }} />
                        {location && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 4 }}>
                                📍 Location pinned: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Price per Hour (₹)</label>
                        <input className="form-input" type="number" min="1" step="0.5" placeholder="e.g., 50" value={form.pricePerHour} onChange={e => setForm(p => ({ ...p, pricePerHour: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea className="form-textarea" placeholder="Any notes for drivers..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 70 }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amenities (comma-separated)</label>
                        <input className="form-input" placeholder="e.g., CCTV, Covered, 24/7 Access" value={form.amenities} onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? '📍 Geocoding + Saving...' : '✅ List My Spot'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function HostDashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [spots, setSpots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'host') { router.push(`/dashboard/${user?.activeRole}`); return; }
        fetchData();
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [spotsRes, bookingsRes] = await Promise.all([spotsAPI.getHostSpots(), bookingsAPI.getHostBookings()]);
            setSpots(spotsRes.data.spots || []);
            setBookings(bookingsRes.data.bookings || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this spot? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await spotsAPI.deleteSpot(id);
            setSpots(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        } finally {
            setDeletingId(null);
        }
    };

    // Earnings calculations
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.hostEarning || 0), 0);
    const totalCommission = completedBookings.reduce((sum, b) => sum + (b.platformCommission || 0), 0);
    const activeBookingsCount = bookings.filter(b => b.status === 'active').length;

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            {showAddModal && <AddSpotModal onClose={() => setShowAddModal(false)} onSaved={fetchData} />}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">🏠 Host Dashboard</h1>
                    <p className="page-subtitle">Manage your parking spots and track earnings</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Spot</button>
            </div>

            {/* Earnings Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,217,61,0.15)', fontSize: '1.4rem' }}>💰</div>
                    <div><div className="stat-label">Total Earnings</div><div className="stat-value" style={{ color: 'var(--gold)' }}>₹{totalRevenue.toFixed(0)}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)', fontSize: '1.4rem' }}>✅</div>
                    <div><div className="stat-label">Completed</div><div className="stat-value">{completedBookings.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(78,205,196,0.15)', fontSize: '1.4rem' }}>🔴</div>
                    <div><div className="stat-label">Active Now</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{activeBookingsCount}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)', fontSize: '1.4rem' }}>📊</div>
                    <div><div className="stat-label">Commission Paid</div><div className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>₹{totalCommission.toFixed(0)}</div></div>
                </div>
            </div>

            {/* Spots Table */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>My Parking Spots ({spots.length})</h2>
                </div>
                {spots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
                        <p>You haven&apos;t listed any spots yet.</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAddModal(true)}>+ List Your First Spot</button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Address</th>
                                    <th>Price/hr</th>
                                    <th>Status</th>
                                    <th>Bookings</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {spots.map(spot => (
                                    <tr key={spot._id}>
                                        <td style={{ fontWeight: 600 }}>{spot.title}</td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.address}</td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>₹{spot.pricePerHour}</td>
                                        <td><span className={`badge badge-${spot.status}`}>{spot.status === 'available' ? '● Available' : '● Occupied'}</span></td>
                                        <td>{spot.totalBookings || 0}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(spot._id)} disabled={deletingId === spot._id || spot.status === 'occupied'}>
                                                {deletingId === spot._id ? '...' : '🗑️'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Bookings */}
            <div className="card">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Recent Bookings</h2>
                {bookings.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>No bookings yet. Your spots haven&apos;t been booked.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Spot</th><th>Driver</th><th>Duration</th><th>Earnings</th><th>Status</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {bookings.slice(0, 15).map(b => (
                                    <tr key={b._id}>
                                        <td style={{ fontWeight: 600 }}>{b.spot?.title || '—'}</td>
                                        <td>{b.driver?.name || '—'}</td>
                                        <td>{b.durationHours ? `${b.durationHours.toFixed(2)}h` : 'Active'}</td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.hostEarning ? `₹${b.hostEarning}` : '—'}</td>
                                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
