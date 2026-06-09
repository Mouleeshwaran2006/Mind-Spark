'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await authAPI.forgotPassword({ email });
            setSuccess(res.data.message || 'OTP sent to your email! Please check your inbox.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.resetPassword({ email, otp, newPassword });
            setSuccess('Password successfully reset! Redirecting to login...');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP or failed to reset password.');
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
                    <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 800, marginBottom: 'clamp(6px, 2vw, 8px)' }}>Password Recovery</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                        {step === 1 ? "Enter your email to receive a secure OTP" : "Enter the OTP sent to your email to reset your password"}
                    </p>
                </div>

                <div className="card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                                {loading ? 'Sending Request...' : 'Send OTP Request →'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{ opacity: 0.7 }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">6-Digit OTP</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password (min 6 chars)"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                                {loading ? 'Resetting Password...' : 'Verify & Reset Password'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: 'clamp(12px, 3vw, 20px)', color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.88rem)' }}>
                    Wait, I remember my password!{' '}
                    <Link href="/auth/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Back to login</Link>
                </p>
            </div>
        </div>
    );
                            </div>
                            <div className="form-group">
                                <label className="form-label">6-Digit OTP</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password (min 6 chars)"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
                                {loading ? 'Resetting Password...' : 'Verify & Reset Password'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Wait, I remember my password!{' '}
                    <Link href="/auth/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Back to login</Link>
                </p>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return <Suspense><ForgotPasswordForm /></Suspense>;
}
