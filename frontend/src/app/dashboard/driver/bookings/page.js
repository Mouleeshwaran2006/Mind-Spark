'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { bookingsAPI } from '@/lib/api';

export default function DriverBookingsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'driver') { router.push(`/dashboard/${user?.activeRole}`); return; }
        bookingsAPI.getDriverBookings().then(res => setBookings(res.data.bookings || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    const totalSpent = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.totalCost || 0), 0);
    const completed = bookings.filter(b => b.status === 'completed').length;

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">📋 My Bookings</h1>
                <p className="page-subtitle">Your complete parking history and spending summary</p>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)', fontSize: '1.3rem' }}>📋</div>
                    <div><div className="stat-label">Total Sessions</div><div className="stat-value">{bookings.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)', fontSize: '1.3rem' }}>✅</div>
                    <div><div className="stat-label">Completed</div><div className="stat-value">{completed}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,217,61,0.15)', fontSize: '1.3rem' }}>💸</div>
                    <div><div className="stat-label">Total Spent</div><div className="stat-value" style={{ color: 'var(--gold)' }}>₹{totalSpent}</div></div>
                </div>
            </div>

            <div className="card">
                {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚗</div>
                        <p>No bookings yet. Find a spot on the map!</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Spot</th><th>Host</th><th>Start</th><th>Duration</th><th>Cost</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b._id}>
                                        <td style={{ fontWeight: 600 }}>{b.spot?.title || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{b.host?.name || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleString()}</td>
                                        <td>{b.durationHours ? `${b.durationHours.toFixed(2)}h` : (b.status === 'active' ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Active</span> : '—')}</td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.totalCost ? `₹${b.totalCost}` : '—'}</td>
                                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
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
