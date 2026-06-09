'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function LoginForm() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.login(formData);
            const { user, token } = res.data;
            login(user, token);
            router.push(`/dashboard/${user.activeRole}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 5vw, 24px)', background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 'clamp(280px, 90vw, 420px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 'clamp(12px, 3vw, 24px)', color: 'var(--primary-light)', fontWeight: 700, fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
                        <span style={{ fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' }}>🚗</span> Mind Spark
                    </Link>
                    <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 800, marginBottom: 'clamp(6px, 2vw, 8px)' }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Sign in to your parking account</p>
                </div>

                <div className="card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <Link href="/auth/forgot-password" style={{ color: 'var(--primary-light)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: 500, textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
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
                        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    <div style={{ marginTop: 'clamp(12px, 3vw, 20px)', borderTop: '1px solid var(--card-border)', paddingTop: 'clamp(12px, 3vw, 20px)' }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 2vw, 0.88rem)', wordBreak: 'break-all' }}>
                            Demo accounts — Admin: <code style={{ color: 'var(--primary-light)' }}>admin@mindspark.com</code>
                        </p>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 'clamp(12px, 3vw, 20px)', color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.88rem)' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Register free →</Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return <Suspense><LoginForm /></Suspense>;
}
