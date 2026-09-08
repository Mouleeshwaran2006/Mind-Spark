'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { spotsAPI } from '@/lib/api';
import MagicBricksCard from '@/components/MagicBricksCard';
import GoogleMapView from '@/components/GoogleMapView';
import CreateListingModal from '@/components/CreateListingModal';
import UnifiedBookingModal from '@/components/UnifiedBookingModal';

export default function HomePage() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    // Active Category Switcher: 'parking' | 'hotel' | 'pg' | 'all'
    const [category, setCategory] = useState('parking');
    const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid' | 'map'
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [bookingSpot, setBookingSpot] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState('All'); // 'All' | 1 | 2 | 5 | 10 | 25
    const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_low' | 'price_high' | 'vacancies'
    
    // Category-specific filters
    const [genderFilter, setGenderFilter] = useState('all'); // for PG: 'all' | 'gents' | 'ladies' | 'unisex'
    const [sharingFilter, setSharingFilter] = useState('all'); // for PG: 'all' | 'single' | 'double' | 'triple' | 'four'
    const [foodFilter, setFoodFilter] = useState('all'); // for PG: 'all' | 'veg' | 'both' | 'without_food'
    const [roomTypeFilter, setRoomTypeFilter] = useState('all'); // for Hotel: 'all' | 'deluxe' | 'suite' | 'standard' | 'executive'
    const [isEVFilter, setIsEVFilter] = useState(false);
    const [isCoveredFilter, setIsCoveredFilter] = useState(false);

    // Get User Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    // Fallback to Chennai center (Tidel Park / Anna Salai)
                    setUserLocation({ lat: 12.9863, lng: 80.2432 });
                },
                { timeout: 6000 }
            );
        } else {
            setUserLocation({ lat: 12.9863, lng: 80.2432 });
        }
    }, []);

    // Fetch Listings
    const fetchSpots = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            const catParam = category === 'all' ? undefined : category;
            if (radius !== 'All' && userLocation) {
                res = await spotsAPI.getNearby(userLocation.lat, userLocation.lng, radius, catParam);
            } else {
                res = await spotsAPI.getAllSpots({ category: catParam });
            }
            setSpots(res.data.spots || []);
        } catch (err) {
            console.error('Fetch spots error:', err);
        } finally {
            setLoading(false);
        }
    }, [category, radius, userLocation]);

    useEffect(() => {
        fetchSpots();
    }, [fetchSpots]);

    // Client-side filtering & sorting
    const filteredSpots = useMemo(() => {
        return spots.filter(spot => {
            // Category match
            if (category !== 'all' && spot.category && spot.category !== category) return false;
            
            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = spot.title?.toLowerCase().includes(q);
                const matchAddr = spot.address?.toLowerCase().includes(q);
                const matchDesc = spot.description?.toLowerCase().includes(q);
                const matchCity = spot.city?.toLowerCase().includes(q);
                const matchLocality = spot.locality?.toLowerCase().includes(q);
                if (!matchTitle && !matchAddr && !matchDesc && !matchCity && !matchLocality) return false;
            }

            // PG specific filters
            if (category === 'pg') {
                if (genderFilter !== 'all' && spot.gender && spot.gender !== genderFilter) return false;
                if (sharingFilter !== 'all' && spot.sharingType && spot.sharingType !== sharingFilter) return false;
                if (foodFilter !== 'all' && spot.foodType && spot.foodType !== foodFilter) return false;
            }

            // Hotel specific filters
            if (category === 'hotel') {
                if (roomTypeFilter !== 'all' && spot.roomType && spot.roomType !== roomTypeFilter) return false;
            }

            // Parking specific filters
            if (category === 'parking') {
                if (isEVFilter && !spot.hasEVCharging) return false;
                if (isCoveredFilter && !spot.isCovered) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'price_low') {
                const priceA = a.category === 'pg' ? (a.pricePerMonth || 0) : a.category === 'hotel' ? (a.pricePerNight || 0) : (a.pricePerHour || 0);
                const priceB = b.category === 'pg' ? (b.pricePerMonth || 0) : b.category === 'hotel' ? (b.pricePerNight || 0) : (b.pricePerHour || 0);
                return priceA - priceB;
            }
            if (sortBy === 'price_high') {
                const priceA = a.category === 'pg' ? (a.pricePerMonth || 0) : a.category === 'hotel' ? (a.pricePerNight || 0) : (a.pricePerHour || 0);
                const priceB = b.category === 'pg' ? (b.pricePerMonth || 0) : b.category === 'hotel' ? (b.pricePerNight || 0) : (b.pricePerHour || 0);
                return priceB - priceA;
            }
            if (sortBy === 'vacancies') {
                return (b.availableCount || 0) - (a.availableCount || 0);
            }
            return 0; // featured default
        });
    }, [spots, category, searchQuery, genderFilter, sharingFilter, foodFilter, roomTypeFilter, isEVFilter, isCoveredFilter, sortBy]);

    const handleBookingClick = (spot) => {
        setBookingSpot(spot);
    };

    const handlePostListingClick = () => {
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=post');
            return;
        }
        setShowCreateModal(true);
    };

    // Category Metadata
    const categories = [
        { id: 'parking', icon: '🚗', name: 'Smart Parking', badge: 'Live Slots', subtitle: 'Hourly & Daily Car/Bike Parking' },
        { id: 'hotel', icon: '🏨', name: 'Hotels & Stays', badge: 'Verified Rooms', subtitle: 'Executive Suites & Deluxe Rooms' },
        { id: 'pg', icon: '🏠', name: 'PG & Co-Living', badge: 'Monthly Stays', subtitle: 'Gents, Ladies & Unisex PG Rooms' },
    ];

    return (
        <div style={{ background: '#0B0D17', minHeight: '100vh', color: '#F3F4F6', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Top Navigation Bar */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(11, 13, 23, 0.92)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.3rem', boxShadow: '0 4px 14px rgba(108,99,255,0.4)'
                        }}>
                            ✨
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(135deg, #FFF, #A5B4FC, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Mind Spark
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                                Living & Parking Hub
                            </div>
                        </div>
                    </Link>

                    {/* Quick Category Tabs in Header (Desktop) */}
                    <div style={{ display: 'flex', gap: 6, marginLeft: 20, background: 'rgba(255,255,255,0.04)', padding: '4px 6px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }} className="hide-mobile">
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 8,
                                    background: category === c.id ? 'linear-gradient(135deg, #6C63FF, #4F46E5)' : 'transparent',
                                    color: category === c.id ? '#FFF' : '#9CA3AF',
                                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                    transition: 'all 0.2s', boxShadow: category === c.id ? '0 2px 8px rgba(108,99,255,0.3)' : 'none'
                                }}
                            >
                                <span>{c.icon}</span>
                                <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={handlePostListingClick}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFF', border: 'none', padding: '8px 16px',
                            borderRadius: 10, fontWeight: 700, fontSize: '0.88rem',
                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                            transition: 'transform 0.15s'
                        }}
                    >
                        <span>➕</span>
                        <span>Post Vacancy / Spot</span>
                    </button>

                    {isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Link
                                href={'/dashboard/' + (user?.activeRole || 'driver')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.08)', color: '#FFF',
                                    padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem',
                                    fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <span>📊</span>
                                <span>Dashboard</span>
                            </Link>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'transparent', color: '#EF4444',
                                    border: '1px solid rgba(239,68,68,0.3)', padding: '7px 12px',
                                    borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                                href="/auth/login"
                                style={{
                                    background: 'rgba(255,255,255,0.08)', color: '#FFF',
                                    padding: '8px 16px', borderRadius: 10, fontSize: '0.88rem',
                                    fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)'
                                }}
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/register"
                                style={{
                                    background: 'linear-gradient(135deg, #6C63FF, #4F46E5)', color: '#FFF',
                                    padding: '8px 16px', borderRadius: 10, fontSize: '0.88rem',
                                    fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(108,99,255,0.3)'
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero / Filter Bar Section */}
            <section style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.18) 0%, rgba(11,13,23,0) 70%)',
                padding: '36px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ maxWidth: 1340, margin: '0 auto' }}>
                    {/* Category Selector Pill Bar */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        {categories.map(c => {
                            const active = category === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setCategory(c.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 24px', borderRadius: 16,
                                        background: active
                                            ? 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(78,205,196,0.15))'
                                            : 'rgba(255,255,255,0.03)',
                                        border: active ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                                        color: '#FFF', cursor: 'pointer',
                                        boxShadow: active ? '0 8px 24px rgba(108,99,255,0.3)' : 'none',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: active ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.8rem' }}>{c.icon}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {c.name}
                                            {active && <span style={{ fontSize: '0.65rem', background: '#6C63FF', color: '#FFF', padding: '2px 6px', borderRadius: 100 }}>ACTIVE</span>}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{c.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Distance Bar */}
                    <div style={{
                        background: 'rgba(26, 29, 53, 0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 18, padding: '12px 16px',
                        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.3)'
                    }}>
                        {/* Search Input */}
                        <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '1.1rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search by locality, area, city or landmark (e.g. OMR, Tidel Park, Guindy)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#FFF',
                                    outline: 'none', width: '100%', fontSize: '0.92rem'
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                            )}
                        </div>

                        {/* Distance Radius */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 600 }}>📍 Radius:</span>
                            {['All', 1, 2, 5, 10, 25].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRadius(r)}
                                    style={{
                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                                        background: radius === r ? '#6C63FF' : 'transparent',
                                        color: radius === r ? '#FFF' : '#9CA3AF',
                                        border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                                    }}
                                >
                                    {r === 'All' ? 'All' : (r + 'km')}
                                </button>
                            ))}
                        </div>

                        {/* View Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <button
                                onClick={() => setViewMode('split')}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                                    background: viewMode === 'split' ? '#4F46E5' : 'transparent',
                                    color: viewMode === 'split' ? '#FFF' : '#9CA3AF',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                <span>🗺️+📄</span> Split
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                                    background: viewMode === 'grid' ? '#4F46E5' : 'transparent',
                                    color: viewMode === 'grid' ? '#FFF' : '#9CA3AF',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                <span>📋</span> Cards
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                                    background: viewMode === 'map' ? '#4F46E5' : 'transparent',
                                    color: viewMode === 'map' ? '#FFF' : '#9CA3AF',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                            >
                                <span>🗺️</span> Map Only
                            </button>
                        </div>
                    </div>

                    {/* Secondary Category Filters */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: '#9CA3AF', fontWeight: 600 }}>Filter by:</span>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: '#1E2238', color: '#FFF', border: '1px solid rgba(255,255,255,0.12)',
                                padding: '6px 12px', borderRadius: 8, outline: 'none', fontSize: '0.82rem', cursor: 'pointer'
                            }}
                        >
                            <option value="featured">✨ Featured</option>
                            <option value="price_low">💰 Price: Low to High</option>
                            <option value="price_high">💎 Price: High to Low</option>
                            <option value="vacancies">🟢 Most Vacancies</option>
                        </select>

                        {/* PG Filters */}
                        {category === 'pg' && (
                            <>
                                <select
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                    style={{
                                        background: '#1E2238', color: '#FFF', border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '6px 12px', borderRadius: 8, outline: 'none', fontSize: '0.82rem', cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">👥 All Genders</option>
                                    <option value="gents">👦 Gents PG</option>
                                    <option value="ladies">👧 Ladies PG</option>
                                    <option value="unisex">👫 Unisex Co-Living</option>
                                </select>

                                <select
                                    value={sharingFilter}
                                    onChange={(e) => setSharingFilter(e.target.value)}
                                    style={{
                                        background: '#1E2238', color: '#FFF', border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '6px 12px', borderRadius: 8, outline: 'none', fontSize: '0.82rem', cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">🛏️ All Sharing Types</option>
                                    <option value="single">Single Room (Private)</option>
                                    <option value="double">2-Sharing Room</option>
                                    <option value="triple">3-Sharing Room</option>
                                    <option value="four">4-Sharing Room</option>
                                </select>

                                <select
                                    value={foodFilter}
                                    onChange={(e) => setFoodFilter(e.target.value)}
                                    style={{
                                        background: '#1E2238', color: '#FFF', border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '6px 12px', borderRadius: 8, outline: 'none', fontSize: '0.82rem', cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">🍽️ Food: All</option>
                                    <option value="veg">Pure Veg Food</option>
                                    <option value="both">Veg & Non-Veg</option>
                                    <option value="without_food">Without Food</option>
                                </select>
                            </>
                        )}

                        {/* Hotel Filters */}
                        {category === 'hotel' && (
                            <select
                                value={roomTypeFilter}
                                onChange={(e) => setRoomTypeFilter(e.target.value)}
                                style={{
                                    background: '#1E2238', color: '#FFF', border: '1px solid rgba(255,255,255,0.12)',
                                    padding: '6px 12px', borderRadius: 8, outline: 'none', fontSize: '0.82rem', cursor: 'pointer'
                                }}
                            >
                                <option value="all">🏨 All Room Types</option>
                                <option value="standard">Standard Room</option>
                                <option value="deluxe">Deluxe Room</option>
                                <option value="executive">Executive Suite</option>
                                <option value="suite">Presidential Suite</option>
                            </select>
                        )}

                        {/* Parking Filters */}
                        {category === 'parking' && (
                            <>
                                <button
                                    onClick={() => setIsEVFilter(!isEVFilter)}
                                    style={{
                                        background: isEVFilter ? '#10B981' : '#1E2238',
                                        color: isEVFilter ? '#FFF' : '#9CA3AF',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    ⚡ EV Charging Available
                                </button>
                                <button
                                    onClick={() => setIsCoveredFilter(!isCoveredFilter)}
                                    style={{
                                        background: isCoveredFilter ? '#3B82F6' : '#1E2238',
                                        color: isCoveredFilter ? '#FFF' : '#9CA3AF',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    🛡️ Covered Parking
                                </button>
                            </>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: '0.82rem' }}>
                            Found <strong style={{ color: '#F3F4F6' }}>{filteredSpots.length}</strong> {category === 'parking' ? 'parking spots' : category === 'hotel' ? 'hotel rooms' : 'PG properties'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                            width: 48, height: 48, border: '4px solid rgba(108,99,255,0.2)',
                            borderTopColor: '#6C63FF', borderRadius: '50%',
                            animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                        }} />
                        <p style={{ color: '#9CA3AF', fontSize: '0.95rem' }}>Loading verified listings & coordinates...</p>
                    </div>
                ) : filteredSpots.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '60px 20px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: 20,
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>No listings match your current filters</h3>
                        <p style={{ color: '#9CA3AF', maxWidth: 450, margin: '0 auto 20px', fontSize: '0.9rem' }}>
                            Try increasing the search distance, clearing search keywords, or list your own space to earn money!
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setRadius('All'); setGenderFilter('all'); setSharingFilter('all'); }}
                            style={{
                                background: '#6C63FF', color: '#FFF', border: 'none',
                                padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* VIEW 1: Split View (Map + Cards) */}
                        {viewMode === 'split' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                                {/* Left: MagicBricks Cards List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 8 }}>
                                    {filteredSpots.map(spot => (
                                        <div
                                            key={spot._id}
                                            onMouseEnter={() => setSelectedSpot(spot)}
                                            style={{
                                                transition: 'transform 0.2s',
                                                border: selectedSpot?._id === spot._id ? '2px solid #6C63FF' : '2px solid transparent',
                                                borderRadius: 18
                                            }}
                                        >
                                            <MagicBricksCard
                                                spot={spot}
                                                onBook={handleBookingClick}
                                                onSelect={(s) => setSelectedSpot(s)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Right: Sticky Google Map */}
                                <div style={{ position: 'sticky', top: 90, height: 'calc(100vh - 220px)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                                    <GoogleMapView
                                        spots={filteredSpots}
                                        userLocation={userLocation}
                                        selectedSpot={selectedSpot}
                                        onSpotSelect={(spot) => setSelectedSpot(spot)}
                                        onBook={handleBookingClick}
                                    />
                                </div>
                            </div>
                        )}

                        {/* VIEW 2: Grid View (Full MagicBricks Cards) */}
                        {viewMode === 'grid' && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                                gap: 24
                            }}>
                                {filteredSpots.map(spot => (
                                    <MagicBricksCard
                                        key={spot._id}
                                        spot={spot}
                                        onBook={handleBookingClick}
                                        onSelect={(s) => setSelectedSpot(s)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* VIEW 3: Map Only View */}
                        {viewMode === 'map' && (
                            <div style={{ height: 'calc(100vh - 240px)', width: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                                <GoogleMapView
                                    spots={filteredSpots}
                                    userLocation={userLocation}
                                    selectedSpot={selectedSpot}
                                    onSpotSelect={(spot) => setSelectedSpot(spot)}
                                    onBook={handleBookingClick}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal 1: Create Listing Modal (with Uber/Ola Draggable Pinpoint) */}
            {showCreateModal && (
                <CreateListingModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        fetchSpots();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Modal 2: Unified Booking Modal (with Razorpay / UPI / Card / Demo checkout) */}
            {bookingSpot && (
                <UnifiedBookingModal
                    spot={bookingSpot}
                    onClose={() => setBookingSpot(null)}
                    onSuccess={() => {
                        fetchSpots();
                        setBookingSpot(null);
                    }}
                />
            )}

            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 900px) {
                    .hide-mobile { display: none !important; }
                }
            `}</style>
        </div>
    );
}
