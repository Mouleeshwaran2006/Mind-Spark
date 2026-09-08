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
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.put('/auth/reset-password', data),
};

// Listings (Parking / Hotels / PG)
export const spotsAPI = {
    getNearby: (lat, lng, radius = 10, category = '') => {
        let url = `/spots/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
        if (category) url += `&category=${category}`;
        return api.get(url);
    },
    getHostSpots: (category = '') => api.get(`/spots/host${category ? `?category=${category}` : ''}`),
    getSpot: (id) => api.get(`/spots/${id}`),
    createSpot: (data) => api.post('/spots', data),
    updateSpot: (id, data) => api.put(`/spots/${id}`, data),
    deleteSpot: (id) => api.delete(`/spots/${id}`),
    getAllSpots: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/spots${query ? `?${query}` : ''}`);
    },
    reserve: (id) => api.post(`/spots/${id}/reserve`),
    reverseGeocode: (lat, lng) => api.get(`/spots/reverse-geocode?lat=${lat}&lng=${lng}`),
};

// Bookings
export const bookingsAPI = {
    create: (bookingData) => api.post('/bookings', typeof bookingData === 'string' ? { spotId: bookingData } : bookingData),
    getDriverBookings: () => api.get('/bookings/driver'),
    getActive: () => api.get('/bookings/active'),
    getHostBookings: () => api.get('/bookings/host'),
    complete: (id) => api.put(`/bookings/${id}/complete`),
    verifyPayment: (id, data) => api.post(`/bookings/${id}/verify-payment`, data),
    demoComplete: (id, data = {}) => api.put(`/bookings/${id}/demo-complete`, data),
    cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Admin
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    getBookings: () => api.get('/admin/bookings'),
    getSpots: () => api.get('/admin/spots'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    deleteSpot: (id) => api.delete(`/admin/spots/${id}`),
    deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
    updateSpotStatus: (id, status) => api.put(`/admin/spots/${id}/status`, { status }),
};

export default api;
