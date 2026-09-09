'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { spotsAPI, bookingsAPI } from '@/lib/api';
import CreateListingModal from '@/components/CreateListingModal';

export default function HostDashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [spots, setSpots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createCategory, setCreateCategory] = useState('parking');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        // Gating removed for unified citizen role
        fetchData();
    }, [isAuthenticated, user]);

    const openCreateModal = (cat) => {
        setCreateCategory(cat);
        setShowCreateModal(true);
    };

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
        if (!confirm('Delete this listing? This cannot be undone.')) return;
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
    const completedBookings = bookings.filter(b => b.status === 'completed' || b.paymentStatus === 'paid');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.hostEarning || 0), 0);
    const totalCommission = completedBookings.reduce((sum, b) => sum + (b.platformCommission || 0), 0);
    const activeBookingsCount = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            {showCreateModal && (
                <CreateListingModal
                    initialCategory={createCategory}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={fetchData}
                />
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">🏠 Host & Property Manager Dashboard</h1>
                    <p className="page-subtitle">Manage and post your Parking Spaces, Hotel Rooms, and PG Vacancies</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-sm"
                        onClick={() => openCreateModal('parking')}
                        style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>🚗</span> + List Parking
                    </button>
                    <button
                        className="btn btn-sm"
                        onClick={() => openCreateModal('hotel')}
                        style={{ background: '#8B5CF6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>🏨</span> + List Hotel Room
                    </button>
                    <button
                        className="btn btn-sm"
                        onClick={() => openCreateModal('pg')}
                        style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span>🏠</span> + List PG Stay
                    </button>
                </div>
            </div>

            {/* Earnings Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,217,61,0.15)', fontSize: '1.4rem' }}>💰</div>
                    <div><div className="stat-label">Total Earnings</div><div className="stat-value" style={{ color: 'var(--gold)' }}>₹{totalRevenue.toFixed(0)}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)', fontSize: '1.4rem' }}>✅</div>
                    <div><div className="stat-label">Paid Bookings</div><div className="stat-value">{completedBookings.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(78,205,196,0.15)', fontSize: '1.4rem' }}>🔴</div>
                    <div><div className="stat-label">Active Stays/Spots</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{activeBookingsCount}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)', fontSize: '1.4rem' }}>📊</div>
                    <div><div className="stat-label">Commission Paid</div><div className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>₹{totalCommission.toFixed(0)}</div></div>
                </div>
            </div>

            {/* Listings Table */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>My Listed Properties & Spots ({spots.length})</h2>
                </div>
                {spots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
                        <p>You haven&apos;t listed any parking spots, hotel rooms, or PG accommodations yet.</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>+ List Your First Space</button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Title</th>
                                    <th>Address</th>
                                    <th>Pricing</th>
                                    <th>Vacancy / Capacity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {spots.map(spot => {
                                    const catIcon = spot.category === 'hotel' ? '🏨' : spot.category === 'pg' ? '🏠' : '🚗';
                                    const priceStr = spot.category === 'pg'
                                        ? ('₹' + spot.pricePerMonth + '/mo')
                                        : spot.category === 'hotel'
                                            ? ('₹' + spot.pricePerNight + '/night')
                                            : ('₹' + spot.pricePerHour + '/hr');

                                    const available = spot.availableCount ?? 1;
                                    const capacity = spot.totalCapacity ?? 1;

                                    return (
                                        <tr key={spot._id}>
                                            <td style={{ fontWeight: 700 }}>
                                                <span style={{ marginRight: 6 }}>{catIcon}</span>
                                                {spot.category?.toUpperCase()}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{spot.title}</td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.address}</td>
                                            <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{priceStr}</td>
                                            <td>
                                                <span style={{
                                                    color: available > 0 ? '#10B981' : '#EF4444',
                                                    fontWeight: 700,
                                                    background: available > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    padding: '3px 8px', borderRadius: 6
                                                }}>
                                                    {available} / {capacity} Vacant
                                                </span>
                                            </td>
                                            <td>
                                                <span className={'badge badge-' + (available > 0 ? 'available' : 'occupied')}>
                                                    {available > 0 ? '● Active' : '● Full'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(spot._id)}
                                                    disabled={deletingId === spot._id}
                                                    title="Delete Listing"
                                                >
                                                    {deletingId === spot._id ? '...' : '🗑️'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Bookings */}
            <div className="card">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Recent Bookings & Guest Stays</h2>
                {bookings.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>No bookings received yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Category</th><th>Property / Spot</th><th>Customer / Guest</th><th>Units/Rooms</th><th>Earnings</th><th>Status</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {bookings.slice(0, 15).map(b => (
                                    <tr key={b._id}>
                                        <td style={{ fontWeight: 700 }}>{b.category === 'hotel' ? '🏨 Hotel' : b.category === 'pg' ? '🏠 PG' : '🚗 Parking'}</td>
                                        <td style={{ fontWeight: 600 }}>{b.spot?.title || '—'}</td>
                                        <td>{b.driver?.name || '—'}</td>
                                        <td>{(b.quantity || 1) + ' ' + (b.category === 'pg' ? 'Bed(s)' : b.category === 'hotel' ? 'Room(s)' : 'Slot(s)')}</td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.hostEarning ? ('₹' + b.hostEarning) : '—'}</td>
                                        <td><span className={'badge badge-' + b.status}>{b.status}</span></td>
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
