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
                            <tr><th>Date</th><th>Driver</th><th>Spot</th><th>Host</th><th>Duration</th><th>Cost</th><th>Commission</th><th>Status</th></tr>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
