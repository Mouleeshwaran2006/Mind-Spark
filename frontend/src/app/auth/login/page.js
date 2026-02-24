'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

function LoginForm() {
    const [formData, setFormData] = useState({ email: '', password: '' });
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--primary-light)', fontWeight: 700, fontSize: '1.1rem' }}>
                        <span>🚗</span> Mind Spark
                    </Link>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to your parking account</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    <div style={{ marginTop: 20, borderTop: '1px solid var(--card-border)', paddingTop: 20 }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            Demo accounts — Admin: <code style={{ color: 'var(--primary-light)' }}>admin@mindspark.com</code>
                        </p>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
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
