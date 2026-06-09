'use client';
import { useState, useEffect } from 'react';
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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 769);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (!user) return null;

    const navItems = user.activeRole === 'driver' ? driverNav : user.activeRole === 'host' ? hostNav : adminNav;

    const roleColors = { driver: '#4ECDC4', host: '#FFD93D', admin: '#FF6B6B' };
    const roleColor = roleColors[user.activeRole] || '#6C63FF';

    const switchRoleAndNavigate = async (targetRole) => {
        setSwitchingRole(true);
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
            position: 'fixed', 
            top: 0, 
            left: sidebarOpen ? 0 : (isMobile ? '-100%' : 0),
            width: isMobile ? '80vw' : 'var(--sidebar-width)', 
            maxWidth: 260,
            height: '100vh', 
            zIndex: 200,
            background: 'var(--dark-2)', 
            borderRight: '1px solid var(--card-border)',
            display: 'flex', 
            flexDirection: 'column', 
            transition: 'left 0.3s ease',
            overflowY: 'auto'
        }}>
            {/* Logo */}
            <div style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)', borderBottom: '1px solid var(--card-border)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)' }}>
                    <span style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)' }}>🚗</span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: 'var(--text-primary)' }}>Mind Spark</div>
                        <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: 'var(--text-muted)' }}>Smart Parking</div>
                    </div>
                </Link>
            </div>

            {/* User info */}
            <div style={{ padding: 'clamp(10px, 2vw, 16px) clamp(16px, 4vw, 24px)', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }}>
                    <div style={{ width: 'clamp(32px, 8vw, 38px)', height: 'clamp(32px, 8vw, 38px)', borderRadius: '50%', background: `${roleColor}22`, border: `2px solid ${roleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColor, fontSize: 'clamp(0.7rem, 2vw, 0.9rem)', flexShrink: 0 }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 'clamp(0.75rem, 2vw, 0.88rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <span className={`badge badge-${user.activeRole}`} style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', marginTop: 2 }}>
                            {user.activeRole === 'driver' ? '🚘' : user.activeRole === 'host' ? '🏠' : '⚙️'} {user.activeRole}
                        </span>
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: 'clamp(10px, 2vw, 16px) clamp(8px, 2vw, 12px)', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)',
                            padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2vw, 14px)', borderRadius: 'var(--radius)',
                            background: isActive ? `${roleColor}18` : 'transparent',
                            color: isActive ? roleColor : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 500, fontSize: 'clamp(0.8rem, 2vw, 0.88rem)',
                            transition: 'var(--transition)', borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent'
                        }}>
                            <span style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Role switch & logout */}
            <div style={{ padding: 'clamp(8px, 2vw, 12px)', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {user.roles.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {user.roles.filter(r => r !== user.activeRole).map(role => (
                            <button key={role} onClick={() => switchRoleAndNavigate(role)} disabled={switchingRole} style={{
                                display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)', padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2vw, 14px)',
                                borderRadius: 'var(--radius)', background: 'var(--dark-3)',
                                border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: 600, transition: 'var(--transition)', width: '100%'
                            }}>
                                <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>{role === 'driver' ? '🚘' : role === 'host' ? '🏠' : '⚙️'}</span>
                                {switchingRole ? 'Switching...' : `Switch to ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)', padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2vw, 14px)',
                    borderRadius: 'var(--radius)', background: 'rgba(255,107,107,0.08)',
                    border: '1px solid rgba(255,107,107,0.2)', color: '#FF6B6B',
                    cursor: 'pointer', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: 600, transition: 'var(--transition)', width: '100%'
                }}>
                    <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>🚪</span> Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="dashboard-layout">
            {sidebarOpen && isMobile && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 150,
                        animation: 'fadeIn 0.2s ease'
                    }}
                />
            )}
            <Sidebar />
            <div className="main-content">
                {/* Top Header */}
                <header style={{
                    position: 'fixed', 
                    top: 0, 
                    left: isMobile ? 0 : 'var(--sidebar-width)', 
                    right: 0, 
                    zIndex: 100,
                    height: 'var(--header-height)', 
                    background: 'rgba(13,14,26,0.9)', 
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--card-border)', 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '0 clamp(12px, 3vw, 28px)', 
                    justifyContent: 'space-between',
                    gap: 'clamp(8px, 2vw, 16px)'
                }}>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 'clamp(32px, 8vw, 40px)',
                                height: 'clamp(32px, 8vw, 40px)',
                                borderRadius: 'var(--radius)',
                                background: 'rgba(108,99,255,0.1)',
                                border: '1px solid rgba(108,99,255,0.2)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                transition: 'var(--transition)',
                                flexShrink: 0
                            }}
                        >
                            ☰
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)', flex: isMobile ? 1 : 'initial' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor, boxShadow: `0 0 8px ${roleColor}` }} />
                        <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.88rem)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ color: roleColor, fontWeight: 700 }}>{user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1)}</span> <span style={{ display: isMobile ? 'none' : 'inline' }}>Dashboard</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 12px)', fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        <span style={{ display: isMobile ? 'none' : 'inline', whiteSpace: 'nowrap' }}>Hi, <strong style={{ color: 'var(--text-primary)' }}>{user.name?.split(' ')[0]}</strong></span>
                        <div style={{ width: 'clamp(24px, 6vw, 30px)', height: 'clamp(24px, 6vw, 30px)', borderRadius: '50%', background: `${roleColor}22`, border: `2px solid ${roleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColor, fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', flexShrink: 0 }}>
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
