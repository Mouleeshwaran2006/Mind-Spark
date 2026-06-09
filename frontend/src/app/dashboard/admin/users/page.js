'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI } from '@/lib/api';

export default function AdminUsersPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? All their spots and bookings will also be deleted.')) return;
        try {
            await adminAPI.deleteUser(id);
            setUsers(users.filter(u => u._id !== id));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user.');
        }
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (user?.activeRole !== 'admin') { router.push(`/dashboard/${user?.activeRole}`); return; }
        adminAPI.getUsers().then(r => setUsers(r.data.users || [])).catch(console.error).finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    if (loading) return <DashboardLayout><div className="loader"><div className="spinner" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1 className="page-title">👥 All Users</h1>
                <p className="page-subtitle">{users.length} registered users on Mind Spark</p>
            </div>
            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Roles</th><th>Active Role</th><th>Joined</th><th>Earnings</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                    <td>{u.roles.map(r => <span key={r} className={`badge badge-${r}`} style={{ marginRight: 4 }}>{r}</span>)}</td>
                                    <td><span className={`badge badge-${u.activeRole}`}>{u.activeRole}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>₹{u.earnings?.totalRevenue?.toFixed(0) || 0}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => handleDelete(u._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
