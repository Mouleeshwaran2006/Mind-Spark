'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function RegisterForm() {
    const searchParams = useSearchParams();
    const defaultRole = searchParams.get('role') || 'driver';
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [selectedRoles, setSelectedRoles] = useState([defaultRole]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const toggleRole = (role) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? (prev.length > 1 ? prev.filter(r => r !== role) : prev) : [...prev, role]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            const res = await authAPI.register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password, roles: selectedRoles });
            const { user, token } = res.data;
            login(user, token);
            router.push(`/dashboard/${user.activeRole}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 460 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--primary-light)', fontWeight: 700, fontSize: '1.1rem' }}>
                        <span>🚗</span> Mind Spark
                    </Link>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Join the platform</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create your free account in seconds</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Role selection */}
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>I want to</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {[
                                { role: 'driver', icon: '🚘', label: 'Find Parking', color: '#6C63FF' },
                                { role: 'host', icon: '🏠', label: 'Host My Space', color: '#FFD93D' },
                            ].map(r => (
                                <button key={r.role} type="button" onClick={() => toggleRole(r.role)} style={{
                                    flex: 1, padding: '12px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                                    border: `1.5px solid ${selectedRoles.includes(r.role) ? r.color : 'rgba(108,99,255,0.2)'}`,
                                    background: selectedRoles.includes(r.role) ? `${r.color}18` : 'var(--dark-4)',
                                    color: selectedRoles.includes(r.role) ? r.color : 'var(--text-secondary)',
                                    transition: 'all 0.2s', textAlign: 'center', fontWeight: 600, fontSize: '0.88rem'
                                }}>
                                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{r.icon}</div>
                                    {r.label}
                                    {selectedRoles.includes(r.role) && <div style={{ fontSize: '0.7rem', marginTop: 2 }}>✓ Selected</div>}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>You can select both — switch roles anytime from dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" placeholder="John Doe" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input className="form-input" type="tel" placeholder="Your phone number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="Minimum 6 characters" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input className="form-input" type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Already have an account?{' '}
                    <Link href="/auth/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign In →</Link>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return <Suspense><RegisterForm /></Suspense>;
}
