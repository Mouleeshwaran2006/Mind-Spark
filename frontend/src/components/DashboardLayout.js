'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const driverNav = [
    { href: '/dashboard/driver', icon: '🗺️', label: 'Live Map' },
    { href: '/dashboard/driver/bookings', icon: '📋', label: 'My Bookings' },
];
const hostNav = [
    { href: '/dashboard/host', icon: '🏠', label: 'My Spots' },
];
const adminNav = [
    { href: '/dashboard/admin', icon: '📊', label: 'Analytics' },
    { href: '/dashboard/admin/users', icon: '👥', label: 'Users' },
    { href: '/dashboard/admin/bookings', icon: '📋', label: 'Bookings' },
    { href: '/dashboard/admin/spots', icon: '📍', label: 'Spots' },
];

export default function DashboardLayout({ children }) {
    const { user, logout, switchRole } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [switchingRole, setSwitchingRole] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) return null;

    const navItems = user.activeRole === 'driver' ? driverNav : user.activeRole === 'host' ? hostNav : adminNav;

    const roleColors = { driver: '#4ECDC4', host: '#FFD93D', admin: '#FF6B6B' };
    const roleColor = roleColors[user.activeRole] || '#6C63FF';

    const handleSwitchRole = async () => {
        setSwitchingRole(true);
        const targetRole = user.activeRole === 'driver'
            ? (user.roles.includes('host') ? 'host' : user.roles.find(r => r !== 'driver') || 'driver')
            : (user.roles.includes('driver') ? 'driver' : user.roles.find(r => r !== user.activeRole) || 'host');

        if (targetRole === user.activeRole) {
            setSwitchingRole(false);
            return;
        }
        const result = await switchRole(targetRole);
        setSwitchingRole(false);
        if (result.success) {
            router.push(`/dashboard/${targetRole}`);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const Sidebar = () => (
        <aside style={{
            position: 'fixed', top: 0, left: sidebarOpen || window?.innerWidth > 768 ? 0 : '-260px',
            width: 'var(--sidebar-width)', height: '100vh', zIndex: 200,
            background: 'var(--dark-2)', borderRight: '1px solid var(--card-border)',
            display: 'flex', flexDirection: 'column', transition: 'left 0.3s ease'
        }}>
            {/* Logo */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>🚗</span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Mind Spark</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Smart Parking</div>
                    </div>
                </Link>
            </div>

            {/* User info */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${roleColor}22`, border: `2px solid ${roleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColor, fontSize: '0.9rem' }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <span className={`badge badge-${user.activeRole}`} style={{ fontSize: '0.7rem', marginTop: 2 }}>
                            {user.activeRole === 'driver' ? '🚘' : user.activeRole === 'host' ? '🏠' : '⚙️'} {user.activeRole}
                        </span>
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 'var(--radius)',
                            background: isActive ? `${roleColor}18` : 'transparent',
                            color: isActive ? roleColor : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 500, fontSize: '0.88rem',
                            transition: 'var(--transition)', borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent'
                        }}>
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Role switch & logout */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {user.roles.length > 1 && (
                    <button onClick={handleSwitchRole} disabled={switchingRole} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderRadius: 'var(--radius)', background: 'var(--dark-3)',
                        border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)', width: '100%'
                    }}>
                        <span>🔄</span>
                        {switchingRole ? 'Switching...' : `Switch to ${user.activeRole === 'driver' ? 'Host' : 'Driver'}`}
                    </button>
                )}
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 'var(--radius)', background: 'rgba(255,107,107,0.08)',
                    border: '1px solid rgba(255,107,107,0.2)', color: '#FF6B6B',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)', width: '100%'
                }}>
                    <span>🚪</span> Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                {/* Top Header */}
                <header style={{
                    position: 'fixed', top: 0, left: 'var(--sidebar-width)', right: 0, zIndex: 100,
                    height: 'var(--header-height)', background: 'rgba(13,14,26,0.9)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center',
                    padding: '0 28px', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleColor, boxShadow: `0 0 8px ${roleColor}` }} />
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: roleColor, fontWeight: 700 }}>{user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1)}</span> Dashboard
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Hi, <strong style={{ color: 'var(--text-primary)' }}>{user.name?.split(' ')[0]}</strong></span>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${roleColor}22`, border: `2px solid ${roleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColor, fontSize: '0.75rem' }}>
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
