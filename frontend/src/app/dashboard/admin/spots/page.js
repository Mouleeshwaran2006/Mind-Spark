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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this spot? All associated bookings will also be deleted.')) return;
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
        if (user?.activeRole !== 'admin') { router.push(`/dashboard/${user?.activeRole}`); return; }
        adminAPI.getSpots().then(r => setSpots(r.data.spots || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    const available = spots.filter(s => s.status === 'available').length;

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">📍 All Spots</h1>
                <p className="page-subtitle">{spots.length} spots listed · {available} available</p>
            </div>
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Title</th><th>Host</th><th>Address</th><th>Price/hr</th><th>Status</th><th>Bookings</th><th>Listed On</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {spots.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.host?.name || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</td>
                                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>₹{s.pricePerHour}</td>
                                    <td>
                                        <select
                                            value={s.status}
                                            onChange={(e) => handleStatusChange(s._id, e.target.value)}
                                            className={`badge badge-${s.status}`}
                                            style={{ backgroundColor: s.status === 'available' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)', color: s.status === 'available' ? '#2ed573' : '#ff4757', border: '1px solid currentColor', borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                                        >
                                            <option value="available" style={{ color: '#000' }}>● Available</option>
                                            <option value="occupied" style={{ color: '#000' }}>● Occupied</option>
                                        </select>
                                    </td>
                                    <td>{s.totalBookings || 0}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => handleDelete(s._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
