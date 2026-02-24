'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('ms_token');
        const storedUser = localStorage.getItem('ms_user');
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('ms_token');
                localStorage.removeItem('ms_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
        localStorage.setItem('ms_token', tokenData);
        localStorage.setItem('ms_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('ms_token');
        localStorage.removeItem('ms_user');
    };

    const switchRole = async (role) => {
        try {
            const res = await authAPI.switchRole(role);
            const { user: updatedUser, token: newToken } = res.data;
            login(updatedUser, newToken);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Failed to switch role.' };
        }
    };

    const refreshUser = async () => {
        try {
            const res = await authAPI.getMe();
            setUser(res.data.user);
            localStorage.setItem('ms_user', JSON.stringify(res.data.user));
        } catch {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole, refreshUser, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
