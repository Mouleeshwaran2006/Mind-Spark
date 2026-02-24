'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(`/dashboard/${user.activeRole}`);
        }
    }, [isAuthenticated]);

    return (
        <div style={{ background: 'var(--dark)', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(13,14,26,0.85)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(108,99,255,0.1)',
                padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem' }}>🚗</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Mind Spark
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>Parking</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link href="/auth/login" className="btn btn-secondary btn-sm">Login</Link>
                    <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', textAlign: 'center', padding: '120px 24px 80px',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(108,99,255,0.12) 0%, transparent 70%)',
                position: 'relative'
            }}>
                {/* Background blobs */}
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'rgba(108,99,255,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: 300, height: 300, background: 'rgba(78,205,196,0.06)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
                    color: 'var(--primary-light)', padding: '6px 16px', borderRadius: 100,
                    fontSize: '0.8rem', fontWeight: 600, marginBottom: 28
                }}>
                    <span style={{ width: 6, height: 6, background: '#6BCB77', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #6BCB77' }} />
                    Live Parking Marketplace — Powered by Real-time Data
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.08,
                    maxWidth: 800, marginBottom: 24,
                    background: 'linear-gradient(135deg, #F0F0FF 0%, #8B83FF 50%, #4ECDC4 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                    Find Parking in <br />Seconds. <span style={{ color: '#FFD93D', WebkitTextFillColor: '#FFD93D' }}>Earn</span> While You Park.
                </h1>

                <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 560, marginBottom: 40, lineHeight: 1.75 }}>
                    The urban parking crisis costs drivers <strong style={{ color: 'var(--text-primary)' }}>30+ minutes</strong> per trip on average.
                    Mind Spark connects you to real-time, nearby parking spots — or lets you monetise your unused driveway.
                </p>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
                    <Link href="/auth/register?role=driver" className="btn btn-primary btn-lg">🚘 Find Parking</Link>
                    <Link href="/auth/register?role=host" className="btn btn-secondary btn-lg">🏠 Host Your Space</Link>
                </div>

                {/* Stats bar */}
                <div style={{
                    display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center',
                    padding: '20px 40px', background: 'var(--dark-2)',
                    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)'
                }}>
                    {[
                        { value: '10,000+', label: 'Spots Listed' },
                        { value: '50,000+', label: 'Drivers Served' },
                        { value: '200+', label: 'Cities Active' },
                        { value: '₹2Cr+', label: 'Host Earnings' },
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
                        Three simple steps. Fully automated. Completely hassle-free.
                    </p>
                </div>
                <div className="grid-3">
                    {[
                        { icon: '📍', title: 'Find Nearby Spots', desc: 'Allow location access. Our geospatial engine instantly fetches all available spots within 5km — with live pricing and availability status.', color: '#6C63FF' },
                        { icon: '⚡', title: 'Book Instantly', desc: 'Click "Park Now". Our atomic booking engine locks the spot in real time — no double bookings, guaranteed. Timer starts automatically.', color: '#4ECDC4' },
                        { icon: '💰', title: 'Pay & Earn', desc: 'End your session. Pay seamlessly via Razorpay. 80% goes directly to the host, 20% is platform commission. Transparent revenue splits.', color: '#FFD93D' },
                    ].map(f => (
                        <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ width: 60, height: 60, borderRadius: 16, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', margin: '0 auto 16px', border: `1px solid ${f.color}44` }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section style={{ padding: '40px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
                <div className="grid-2" style={{ gap: 28 }}>
                    {/* Driver card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), var(--dark-3))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 20, padding: 36 }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚘</div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 12 }}>For Drivers</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                            {['Interactive map with live spot markers', 'Auto-detect your location', 'Real-time parking timer & cost estimator', 'Secure Razorpay payment', 'Complete booking history'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=driver" className="btn btn-primary">Start as Driver →</Link>
                    </div>
                    {/* Host card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,217,61,0.08), var(--dark-3))', border: '1px solid rgba(255,217,61,0.2)', borderRadius: 20, padding: 36 }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏠</div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 12 }}>For Hosts</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                            {['List spots with address geocoding', 'Set your own price per hour', 'Live booking status dashboard', 'Track earnings & commission', 'Dual role — park & host simultaneously'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=host" className="btn btn-gold">Start Earning →</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--card-border)', padding: '28px 40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <span>🚗</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Mind Spark</span>
                </div>
                <p>© 2024 Mind Spark Parking. Building the future of urban mobility.</p>
            </footer>
        </div>
    );
}
