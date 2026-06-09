'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI } from '@/lib/api';

export default function AdminBookingsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            await adminAPI.deleteBooking(id);
            setBookings(bookings.filter(b => b._id !== id));
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking.');
        }
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'admin') { router.push(`/dashboard/${user?.activeRole}`); return; }
        adminAPI.getBookings().then(r => setBookings(r.data.bookings || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.totalCost || 0), 0);

    return (
        <DashboardLayout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">📋 All Bookings</h1>
                    <p className="page-subtitle">{bookings.length} total bookings · ₹{totalRevenue} total revenue</p>
                </div>
            </div>
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Driver</th><th>Spot</th><th>Host</th><th>Duration</th><th>Cost</th><th>Commission</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b._id}>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{b.driver?.name || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{b.spot?.title || '—'}</td>
                                    <td>{b.host?.name || '—'}</td>
                                    <td>{b.durationHours ? `${b.durationHours.toFixed(2)}h` : '—'}</td>
                                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.totalCost ? `₹${b.totalCost}` : '—'}</td>
                                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{b.platformCommission ? `₹${b.platformCommission}` : '—'}</td>
                                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => handleDelete(b._id)}
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
