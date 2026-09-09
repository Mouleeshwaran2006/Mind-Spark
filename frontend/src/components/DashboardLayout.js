'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateListingModal from '@/components/CreateListingModal';

const standardNav = [
    { href: '/', icon: '🗺️', label: 'Explore & Book' },
    { href: '/dashboard/driver/bookings', icon: '📋', label: 'My Bookings & Stays' },
    { href: '/dashboard/host', icon: '🏠', label: 'My Listed Spaces' },
];

const adminNav = [
    { href: '/dashboard/admin', icon: '📊', label: 'Admin Analytics' },
    { href: '/dashboard/admin/users', icon: '👥', label: 'Manage Users' },
    { href: '/dashboard/admin/bookings', icon: '📋', label: 'All Bookings' },
    { href: '/dashboard/admin/spots', icon: '📍', label: 'All Spots' },
];

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin' || user?.activeRole === 'admin';
    const roleColor = isAdmin ? '#FF6B6B' : '#6366F1';

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
            maxWidth: 270,
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
            <div style={{ padding: 'clamp(14px, 3vw, 22px) clamp(16px, 4vw, 24px)', borderBottom: '1px solid var(--card-border)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                    }}>
                        🅿️
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Mind Spark</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Parking • Hotels • PG Stays</div>
                    </div>
                </Link>
            </div>

            {/* User Profile Card */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: `${roleColor}22`, border: `2px solid ${roleColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: roleColor, fontSize: '1rem', flexShrink: 0
                    }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                        <span style={{
                            display: 'inline-block', marginTop: 4,
                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                            color: isAdmin ? '#EF4444' : '#818CF8'
                        }}>
                            {isAdmin ? '🛡️ Administrator' : '✨ Citizen Member'}
                        </span>
                    </div>
                </div>

                {/* Quick Add Space Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        marginTop: 14,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '9px 14px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    <span>➕</span> List a Space / Stay
                </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '4px 12px 6px' }}>
                    Main Menu
                </div>
                {standardNav.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 10,
                            background: isActive ? 'rgba(99,102,241,0.14)' : 'transparent',
                            color: isActive ? '#818CF8' : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 500, fontSize: '0.88rem',
                            transition: 'var(--transition)',
                            borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}

                {isAdmin && (
                    <>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '16px 12px 6px' }}>
                            Administration
                        </div>
                        {adminNav.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 10,
                                    background: isActive ? 'rgba(239,68,68,0.14)' : 'transparent',
                                    color: isActive ? '#F87171' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 700 : 500, fontSize: '0.88rem',
                                    transition: 'var(--transition)',
                                    borderLeft: isActive ? '3px solid #EF4444' : '3px solid transparent'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* Logout Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)' }}>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 10, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', color: '#F87171',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)', width: '100%'
                }}>
                    <span style={{ fontSize: '1.1rem' }}>🚪</span> Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="dashboard-layout">
            {showCreateModal && (
                <CreateListingModal
                    initialCategory="parking"
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        if (pathname === '/dashboard/host') {
                            window.location.reload();
                        } else {
                            router.push('/dashboard/host');
                        }
                    }}
                />
            )}

            {sidebarOpen && isMobile && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 150,
                        backdropFilter: 'blur(4px)',
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
                    background: 'rgba(13,14,26,0.92)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 clamp(12px, 3vw, 28px)',
                    justifyContent: 'space-between',
                    gap: 16
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ☰
                            </button>
                        )}
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <span style={{ fontSize: '0.85rem', color: '#818CF8', fontWeight: 700 }}>← Back to Live Map</span>
                        </Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-sm"
                            style={{
                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                color: '#FFF',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer'
                            }}
                        >
                            <span>➕</span> <span style={{ display: isMobile ? 'none' : 'inline' }}>List Space</span>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: `${roleColor}22`, border: `2px solid ${roleColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, color: roleColor, fontSize: '0.8rem'
                            }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ display: isMobile ? 'none' : 'inline', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user.name?.split(' ')[0]}
                            </span>
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
