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
                            <tr><th>Title</th><th>Host</th><th>Address</th><th>Price/hr</th><th>Status</th><th>Bookings</th><th>Listed On</th></tr>
                        </thead>
                        <tbody>
                            {spots.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.host?.name || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</td>
                                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>₹{s.pricePerHour}</td>
                                    <td><span className={`badge badge-${s.status}`}>{s.status === 'available' ? '● Available' : '● Occupied'}</span></td>
                                    <td>{s.totalBookings || 0}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
