'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function RegisterForm() {
    const searchParams = useSearchParams();
    const defaultRole = searchParams.get('role') || 'driver';
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [selectedRoles, setSelectedRoles] = useState([defaultRole]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 5vw, 24px)', background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 'clamp(280px, 90vw, 460px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 'clamp(12px, 3vw, 24px)', color: 'var(--primary-light)', fontWeight: 700, fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
                        <span style={{ fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' }}>🚗</span> Mind Spark
                    </Link>
                    <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 800, marginBottom: 'clamp(6px, 2vw, 8px)' }}>Join the platform</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Create your free account in seconds</p>
                </div>

                <div className="card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Role selection */}
                    <div style={{ marginBottom: 'clamp(16px, 4vw, 24px)' }}>
                        <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'clamp(6px, 2vw, 10px)' }}>I want to</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 2vw, 10px)' }}>
                            {[
                                { role: 'driver', icon: '🚘', label: 'Find Parking', color: '#6C63FF' },
                                { role: 'host', icon: '🏠', label: 'Host My Space', color: '#FFD93D' },
                            ].map(r => (
                                <button key={r.role} type="button" onClick={() => toggleRole(r.role)} style={{
                                    padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 16px)', borderRadius: 'var(--radius)', cursor: 'pointer',
                                    border: `1.5px solid ${selectedRoles.includes(r.role) ? r.color : 'rgba(108,99,255,0.2)'}`,
                                    background: selectedRoles.includes(r.role) ? `${r.color}18` : 'var(--dark-4)',
                                    color: selectedRoles.includes(r.role) ? r.color : 'var(--text-secondary)',
                                    transition: 'all 0.2s', textAlign: 'center', fontWeight: 600, fontSize: 'clamp(0.75rem, 2vw, 0.88rem)'
                                }}>
                                    <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', marginBottom: 4 }}>{r.icon}</div>
                                    {r.label}
                                    {selectedRoles.includes(r.role) && <div style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', marginTop: 2 }}>✓ Selected</div>}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginTop: 'clamp(4px, 1vw, 6px)', textAlign: 'center' }}>You can select both — switch roles anytime from dashboard</p>
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
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                    required
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                                    required
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 'clamp(12px, 3vw, 20px)', color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.88rem)' }}>
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
