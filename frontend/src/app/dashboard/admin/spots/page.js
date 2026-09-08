'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI } from '@/lib/api';

export default function AdminSpotsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing? All associated bookings will also be deleted.')) return;
        try {
            await adminAPI.deleteSpot(id);
            setSpots(spots.filter(s => s._id !== id));
        } catch (error) {
            console.error('Error deleting spot:', error);
            alert('Failed to delete spot.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await adminAPI.updateSpotStatus(id, newStatus);
            setSpots(spots.map(s => s._id === id ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error('Error updating spot status:', error);
            alert('Failed to update spot status.');
        }
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'admin') { router.push('/dashboard/' + user?.activeRole); return; }
        adminAPI.getSpots().then(r => setSpots(r.data.spots || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    const filteredSpots = spots.filter(s => categoryFilter === 'all' || s.category === categoryFilter);
    const availableCount = filteredSpots.filter(s => (s.availableCount ?? 1) > 0).length;

    return (
        <DashboardLayout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">📍 All Platform Listings</h1>
                    <p className="page-subtitle">{spots.length} total properties & slots listed across all categories</p>
                </div>

                {/* Category Filters */}
                <div style={{ display: 'flex', gap: 6, background: 'var(--dark-3)', padding: 4, borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    {[
                        { id: 'all', label: '✨ All' },
                        { id: 'parking', label: '🚗 Parking' },
                        { id: 'hotel', label: '🏨 Hotels' },
                        { id: 'pg', label: '🏠 PG Stays' }
                    ].map(c => (
                        <button
                            key={c.id}
                            onClick={() => setCategoryFilter(c.id)}
                            className="btn btn-sm"
                            style={{
                                background: categoryFilter === c.id ? 'var(--primary)' : 'transparent',
                                color: categoryFilter === c.id ? '#fff' : 'var(--text-secondary)'
                            }}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)' }}>📍</div>
                    <div><div className="stat-label">Shown Listings</div><div className="stat-value">{filteredSpots.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)' }}>🟢</div>
                    <div><div className="stat-label">Has Vacancies</div><div className="stat-value" style={{ color: 'var(--success)' }}>{availableCount}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)' }}>🔴</div>
                    <div><div className="stat-label">Full / Occupied</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{filteredSpots.length - availableCount}</div></div>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Title</th>
                                <th>Host</th>
                                <th>Locality / City</th>
                                <th>Pricing</th>
                                <th>Vacancy / Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSpots.map(s => {
                                const catIcon = s.category === 'hotel' ? '🏨' : s.category === 'pg' ? '🏠' : '🚗';
                                const priceStr = s.category === 'pg'
                                    ? ('₹' + s.pricePerMonth + '/mo')
                                    : s.category === 'hotel'
                                        ? ('₹' + s.pricePerNight + '/night')
                                        : ('₹' + s.pricePerHour + '/hr');

                                const available = s.availableCount ?? 1;
                                const capacity = s.totalCapacity ?? 1;

                                return (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 700 }}>
                                            <span style={{ marginRight: 4 }}>{catIcon}</span>
                                            {s.category?.toUpperCase()}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{s.title}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.host?.name || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.locality ? (s.locality + ', ' + s.city) : s.address}</td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{priceStr}</td>
                                        <td>
                                            <span style={{
                                                color: available > 0 ? '#10B981' : '#EF4444',
                                                fontWeight: 700,
                                                background: available > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem'
                                            }}>
                                                {available} / {capacity} Vacant
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={s.status}
                                                onChange={(e) => handleStatusChange(s._id, e.target.value)}
                                                className={'badge badge-' + s.status}
                                                style={{ backgroundColor: s.status === 'available' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)', color: s.status === 'available' ? '#2ed573' : '#ff4757', border: '1px solid currentColor', borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                                            >
                                                <option value="available" style={{ color: '#000' }}>● Available</option>
                                                <option value="occupied" style={{ color: '#000' }}>● Occupied</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(s._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
