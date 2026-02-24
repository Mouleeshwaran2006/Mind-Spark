'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI } from '@/lib/api';
import dynamic from 'next/dynamic';

const AdminCharts = dynamic(() => import('@/components/AdminCharts'), { ssr: false });

export default function AdminDashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [bookingsByDay, setBookingsByDay] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'admin') { router.push(`/dashboard/${user?.activeRole}`); return; }
        fetchStats();
    }, [isAuthenticated, user]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getStats();
            setStats(res.data.stats);
            setBookingsByDay(res.data.bookingsByDay || []);
        } catch (err) {
            console.error('Admin stats error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#6C63FF' },
        { label: 'Total Hosts', value: stats.totalHosts, icon: '🏠', color: '#FFD93D' },
        { label: 'Total Drivers', value: stats.totalDrivers, icon: '🚘', color: '#4ECDC4' },
        { label: 'Listed Spots', value: stats.totalSpots, icon: '📍', color: '#8B83FF' },
        { label: 'Active Bookings', value: stats.activeBookings, icon: '🔴', color: '#FF6B6B' },
        { label: 'Available Spots', value: stats.availableSpots, icon: '✅', color: '#6BCB77' },
        { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#FFD93D' },
        { label: 'Platform Commission', value: `₹${(stats.platformCommission || 0).toLocaleString()}`, icon: '📊', color: '#FF6B6B' },
    ] : [];

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">📊 Admin Analytics</h1>
                <p className="page-subtitle">System-wide platform overview and performance metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {statCards.map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon" style={{ background: `${s.color}20`, fontSize: '1.3rem' }}>{s.icon}</div>
                        <div>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            {stats && <AdminCharts stats={stats} bookingsByDay={bookingsByDay} />}

            {/* Recent Summary */}
            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>💰 Revenue Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Total Collected', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, color: 'var(--text-primary)', bold: true },
                            { label: '→ Host Earnings (80%)', value: `₹${(stats?.totalHostEarnings || 0).toLocaleString()}`, color: 'var(--gold)' },
                            { label: '→ Platform Commission (20%)', value: `₹${(stats?.platformCommission || 0).toLocaleString()}`, color: 'var(--danger)' },
                            { label: 'Completed Bookings', value: stats?.completedBookings || 0, color: 'var(--success)' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: item.bold ? 800 : 700, fontSize: item.bold ? '1rem' : '0.92rem' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📍 Spots Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Total Active Spots', value: stats?.totalSpots || 0, color: 'var(--text-primary)', bold: true },
                            { label: '→ Available Right Now', value: stats?.availableSpots || 0, color: 'var(--success)' },
                            { label: '→ Currently Occupied', value: stats?.occupiedSpots || 0, color: 'var(--danger)' },
                            { label: 'Total Bookings (All Time)', value: stats?.totalBookings || 0, color: 'var(--primary-light)' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: item.bold ? 800 : 700, fontSize: item.bold ? '1rem' : '0.92rem' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
