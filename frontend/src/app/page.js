'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function LandingPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(`/dashboard/${user.activeRole}`);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div style={{ background: 'var(--dark)', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(13,14,26,0.85)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(108,99,255,0.1)',
                padding: '0 clamp(12px, 4vw, 40px)', height: 'clamp(52px, 10vh, 64px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 2vw, 10px)', minWidth: 0 }}>
                    <span style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', flexShrink: 0 }}>🚗</span>
                    <span style={{ fontSize: 'clamp(0.85rem, 3vw, 1.1rem)', fontWeight: 800, background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'nowrap' }}>
                        Mind Spark
                    </span>
                    {!isMobile && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Parking</span>}
                </div>
                <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 12px)', flexShrink: 0 }}>
                    <Link href="/auth/login" className="btn btn-secondary btn-sm">Login</Link>
                    <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', textAlign: 'center', padding: 'clamp(60px, 12vw, 120px) clamp(16px, 5vw, 24px) clamp(40px, 8vw, 80px)',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(108,99,255,0.12) 0%, transparent 70%)',
                position: 'relative'
            }}>
                {/* Background blobs */}
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: 'clamp(150px, 30vw, 400px)', height: 'clamp(150px, 30vw, 400px)', background: 'rgba(108,99,255,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: 'clamp(100px, 20vw, 300px)', height: 'clamp(100px, 20vw, 300px)', background: 'rgba(78,205,196,0.06)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
                    color: 'var(--primary-light)', padding: 'clamp(4px, 2vw, 6px) clamp(12px, 3vw, 16px)', borderRadius: 100,
                    fontSize: 'clamp(0.65rem, 2vw, 0.8rem)', fontWeight: 600, marginBottom: 'clamp(16px, 4vw, 28px)'
                }}>
                    <span style={{ width: 6, height: 6, background: '#6BCB77', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #6BCB77' }} />
                    Live Parking Marketplace — Powered by Real-time Data
                </div>

                <h1 style={{
                    fontSize: 'clamp(1.6rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.08,
                    maxWidth: '100%', marginBottom: 'clamp(16px, 4vw, 24px)',
                    background: 'linear-gradient(135deg, #F0F0FF 0%, #8B83FF 50%, #4ECDC4 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    paddingLeft: 'clamp(8px, 2vw, 0px)', paddingRight: 'clamp(8px, 2vw, 0px)'
                }}>
                    Find Parking in <br />Seconds. <span style={{ color: '#FFD93D', WebkitTextFillColor: '#FFD93D' }}>Earn</span> While You Park.
                </h1>

                <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1.15rem)', color: 'var(--text-secondary)', maxWidth: 560, marginBottom: 'clamp(24px, 6vw, 40px)', lineHeight: 1.75, paddingLeft: 'clamp(8px, 2vw, 0px)', paddingRight: 'clamp(8px, 2vw, 0px)' }}>
                    The urban parking crisis costs drivers <strong style={{ color: 'var(--text-primary)' }}>30+ minutes</strong> per trip on average.
                    Mind Spark connects you to real-time, nearby parking spots — or lets you monetise your unused driveway.
                </p>

                <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'clamp(32px, 8vw, 60px)', width: '100%', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                    <Link href="/auth/register?role=driver" className="btn btn-primary btn-lg" style={{ flex: '1 1 clamp(140px, 100%, 180px)' }}>🚘 Find Parking</Link>
                    <Link href="/auth/register?role=host" className="btn btn-secondary btn-lg" style={{ flex: '1 1 clamp(140px, 100%, 180px)' }}>🏠 Host Your Space</Link>
                </div>

                {/* Stats bar */}
                <div style={{
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
                    gap: 'clamp(12px, 3vw, 20px)',
                    padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 40px)', 
                    background: 'var(--dark-2)',
                    border: '1px solid var(--card-border)', 
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '95vw',
                    width: '100%'
                }}>
                    {[
                        { value: '10,000+', label: 'Spots Listed' },
                        { value: '50,000+', label: 'Drivers Served' },
                        { value: '200+', label: 'Cities Active' },
                        { value: '₹2Cr+', label: 'Host Earnings' },
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 800, color: 'var(--primary-light)' }}>{stat.value}</div>
                            <div style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.78rem)', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(16px, 5vw, 40px)', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 8vw, 56px)' }}>
                    <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', fontWeight: 800, marginBottom: 'clamp(8px, 2vw, 12px)' }}>How It Works</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
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
                            <div style={{ width: 'clamp(48px, 10vw, 60px)', height: 'clamp(48px, 10vw, 60px)', borderRadius: 16, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', margin: '0 auto clamp(12px, 2vw, 16px)', border: `1px solid ${f.color}44` }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontWeight: 700, marginBottom: 'clamp(6px, 2vw, 10px)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section style={{ padding: 'clamp(24px, 6vw, 40px) clamp(16px, 5vw, 40px) clamp(40px, 8vw, 80px)', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <div className="grid-2" style={{ gap: 'clamp(16px, 4vw, 28px)' }}>
                    {/* Driver card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), var(--dark-3))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'clamp(14px, 4vw, 20px)', padding: 'clamp(20px, 5vw, 36px)' }}>
                        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>🚘</div>
                        <h3 style={{ fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginBottom: 'clamp(10px, 2vw, 12px)' }}>For Drivers</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 10px)', marginBottom: 'clamp(16px, 4vw, 28px)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                            {['Interactive map with live spot markers', 'Auto-detect your location', 'Real-time parking timer & cost estimator', 'Secure Razorpay payment', 'Complete booking history'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 'clamp(6px, 2vw, 10px)', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=driver" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Start as Driver →</Link>
                    </div>
                    {/* Host card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,217,61,0.08), var(--dark-3))', border: '1px solid rgba(255,217,61,0.2)', borderRadius: 'clamp(14px, 4vw, 20px)', padding: 'clamp(20px, 5vw, 36px)' }}>
                        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>🏠</div>
                        <h3 style={{ fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginBottom: 'clamp(10px, 2vw, 12px)' }}>For Hosts</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 10px)', marginBottom: 'clamp(16px, 4vw, 28px)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                            {['List spots with address geocoding', 'Set your own price per hour', 'Live booking status dashboard', 'Track earnings & commission', 'Dual role — park & host simultaneously'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 'clamp(6px, 2vw, 10px)', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=host" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>Start Earning →</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--card-border)', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 40px)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <span>🚗</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Mind Spark</span>
                </div>
                <p>© 2024 Mind Spark Parking. Building the future of urban mobility.</p>
            </footer>
        </div>
    );
}
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(16px, 5vw, 40px)', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 8vw, 56px)' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 800, marginBottom: 'clamp(8px, 2vw, 12px)' }}>How It Works</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
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
                            <div style={{ width: 'clamp(48px, 10vw, 60px)', height: 'clamp(48px, 10vw, 60px)', borderRadius: 16, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', margin: '0 auto clamp(12px, 2vw, 16px)', border: `1px solid ${f.color}44` }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontWeight: 700, marginBottom: 'clamp(6px, 2vw, 10px)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section style={{ padding: 'clamp(24px, 6vw, 40px) clamp(16px, 5vw, 40px) clamp(40px, 8vw, 80px)', maxWidth: 1100, margin: '0 auto' }}>
                <div className="grid-2" style={{ gap: 'clamp(16px, 4vw, 28px)' }}>
                    {/* Driver card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), var(--dark-3))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'clamp(14px, 4vw, 20px)', padding: 'clamp(20px, 5vw, 36px)' }}>
                        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>🚘</div>
                        <h3 style={{ fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginBottom: 'clamp(10px, 2vw, 12px)' }}>For Drivers</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 10px)', marginBottom: 'clamp(16px, 4vw, 28px)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                            {['Interactive map with live spot markers', 'Auto-detect your location', 'Real-time parking timer & cost estimator', 'Secure Razorpay payment', 'Complete booking history'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 'clamp(6px, 2vw, 10px)', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=driver" className="btn btn-primary">Start as Driver →</Link>
                    </div>
                    {/* Host card */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,217,61,0.08), var(--dark-3))', border: '1px solid rgba(255,217,61,0.2)', borderRadius: 'clamp(14px, 4vw, 20px)', padding: 'clamp(20px, 5vw, 36px)' }}>
                        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>🏠</div>
                        <h3 style={{ fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginBottom: 'clamp(10px, 2vw, 12px)' }}>For Hosts</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 10px)', marginBottom: 'clamp(16px, 4vw, 28px)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                            {['List spots with address geocoding', 'Set your own price per hour', 'Live booking status dashboard', 'Track earnings & commission', 'Dual role — park & host simultaneously'].map(i => (
                                <li key={i} style={{ display: 'flex', gap: 'clamp(6px, 2vw, 10px)', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/register?role=host" className="btn btn-gold">Start Earning →</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--card-border)', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 40px)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <span>🚗</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Mind Spark</span>
                </div>
                <p>© 2024 Mind Spark Parking. Building the future of urban mobility.</p>
            </footer>
        </div>
    );
}
