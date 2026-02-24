import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('ms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle auth errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('ms_token');
            localStorage.removeItem('ms_user');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    switchRole: (role) => api.put('/auth/switch-role', { role }),
    addRole: (role) => api.put('/auth/add-role', { role }),
};

// Spots
export const spotsAPI = {
    getNearby: (lat, lng, radius = 5) => api.get(`/spots/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
    getHostSpots: () => api.get('/spots/host'),
    getSpot: (id) => api.get(`/spots/${id}`),
    createSpot: (data) => api.post('/spots', data),
    updateSpot: (id, data) => api.put(`/spots/${id}`, data),
    deleteSpot: (id) => api.delete(`/spots/${id}`),
    getAllSpots: () => api.get('/spots'),
    reserve: (id) => api.post(`/spots/${id}/reserve`),
};

// Bookings
export const bookingsAPI = {
    create: (spotId) => api.post('/bookings', { spotId }),
    getDriverBookings: () => api.get('/bookings/driver'),
    getActive: () => api.get('/bookings/active'),
    getHostBookings: () => api.get('/bookings/host'),
    complete: (id) => api.put(`/bookings/${id}/complete`),
    verifyPayment: (id, data) => api.post(`/bookings/${id}/verify-payment`, data),
    demoComplete: (id) => api.put(`/bookings/${id}/demo-complete`),
};

// Admin
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    getBookings: () => api.get('/admin/bookings'),
    getSpots: () => api.get('/admin/spots'),
};

export default api;
