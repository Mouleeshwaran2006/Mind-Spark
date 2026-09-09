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
        // Gating removed for unified citizen role
        bookingsAPI.getDriverBookings().then(res => setBookings(res.data.bookings || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    const totalSpent = bookings.filter(b => b.status === 'completed' || b.paymentStatus === 'paid').reduce((s, b) => s + (b.totalCost || 0), 0);
    const completed = bookings.filter(b => b.status === 'completed' || b.paymentStatus === 'paid').length;

    const handleCancel = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking? Vacancy will be returned immediately.')) return;
        try {
            await bookingsAPI.cancelBooking(bookingId);
            alert('Booking cancelled successfully!');
            const res = await bookingsAPI.getDriverBookings();
            setBookings(res.data.bookings || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel booking.');
        }
    };

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">📋 My Bookings & Stays</h1>
                <p className="page-subtitle">Your complete history for Parking Sessions, Hotel Stays, and PG Rentals</p>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)', fontSize: '1.3rem' }}>📋</div>
                    <div><div className="stat-label">Total Bookings</div><div className="stat-value">{bookings.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(107,203,119,0.15)', fontSize: '1.3rem' }}>✅</div>
                    <div><div className="stat-label">Completed / Active</div><div className="stat-value">{completed}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255,217,61,0.15)', fontSize: '1.3rem' }}>💸</div>
                    <div><div className="stat-label">Total Spent</div><div className="stat-value" style={{ color: 'var(--gold)' }}>₹{totalSpent.toFixed(2)}</div></div>
                </div>
            </div>

            <div className="card">
                {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚗🏨🏠</div>
                        <p>No bookings yet. Explore parking spots, hotels, or PG rooms on the home page!</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Property / Spot</th>
                                    <th>Host</th>
                                    <th>Units / Duration</th>
                                    <th>Total Cost</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b._id}>
                                        <td style={{ fontWeight: 700 }}>
                                            {b.category === 'hotel' ? '🏨 Hotel' : b.category === 'pg' ? '🏠 PG' : '🚗 Parking'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{b.spot?.title || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{b.host?.name || '—'}</td>
                                        <td>
                                            {(b.quantity || 1) + ' ' + (b.category === 'pg' ? 'Bed(s)' : b.category === 'hotel' ? 'Room(s)' : 'Slot(s)')}
                                            {b.bookingMonths ? (' (' + b.bookingMonths + ' mo)') : b.durationHours ? (' (' + b.durationHours.toFixed(1) + ' hrs)') : ''}
                                        </td>
                                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.totalCost ? ('₹' + b.totalCost) : '—'}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.78rem',
                                                padding: '2px 8px', borderRadius: 4,
                                                background: b.paymentStatus === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: b.paymentStatus === 'paid' ? '#10B981' : '#F59E0B',
                                                fontWeight: 600
                                            }}>
                                                {(b.paymentMethod ? b.paymentMethod.toUpperCase() : 'UPI/CARD') + ' (' + b.paymentStatus + ')'}
                                            </span>
                                        </td>
                                        <td><span className={'badge badge-' + b.status}>{b.status}</span></td>
                                        <td>
                                            {b.status !== 'cancelled' && b.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleCancel(b._id)}
                                                    className="btn btn-sm"
                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
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
