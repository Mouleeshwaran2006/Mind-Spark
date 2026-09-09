'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { spotsAPI } from '@/lib/api';
import GoogleMapView from '@/components/GoogleMapView';
import MagicBricksCard from '@/components/MagicBricksCard';
import CreateListingModal from '@/components/CreateListingModal';
import UnifiedBookingModal from '@/components/UnifiedBookingModal';
import { 
    Search, MapPin, Navigation, Menu, X, Plus, User, 
    Car, Building2, Home, SlidersHorizontal, ChevronLeft, ChevronRight, LogOut, LayoutDashboard 
} from 'lucide-react';

export default function FullscreenMapsPage() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    // Active Category: 'parking' | 'hotel' | 'pg'
    const [category, setCategory] = useState('parking');
    const [spots, setSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [bookingSpot, setBookingSpot] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createInitialCategory, setCreateInitialCategory] = useState('parking');
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState('All'); // 'All' | 1 | 2 | 5 | 10 | 25
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Category-specific filters
    const [genderFilter, setGenderFilter] = useState('all'); // for PG: 'all' | 'gents' | 'ladies' | 'unisex'
    const [sharingFilter, setSharingFilter] = useState('all'); // for PG: 'all' | 'single' | 'double' | 'triple' | 'four'
    const [foodFilter, setFoodFilter] = useState('all'); // for PG: 'all' | 'veg' | 'both' | 'without_food'
    const [roomTypeFilter, setRoomTypeFilter] = useState('all'); // for Hotel: 'all' | 'deluxe' | 'suite' | 'standard' | 'executive'
    const [isEVFilter, setIsEVFilter] = useState(false);
    const [isCoveredFilter, setIsCoveredFilter] = useState(false);

    const drawerListRef = useRef(null);

    // Get User Geolocation
    const detectLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    // Fallback to Chennai center (Tidel Park / Anna Salai)
                    setUserLocation({ lat: 12.9863, lng: 80.2432 });
                },
                { timeout: 8000 }
            );
        } else {
            setUserLocation({ lat: 12.9863, lng: 80.2432 });
        }
    }, []);

    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

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
        });
    }, [spots, category, searchQuery, genderFilter, sharingFilter, foodFilter, roomTypeFilter, isEVFilter, isCoveredFilter]);

    // Handle spot selection & auto-scroll in drawer
    const handleSpotSelect = (spot) => {
        setSelectedSpot(spot);
        setIsDrawerOpen(true);
        const cardElem = document.getElementById('card-' + spot._id);
        if (cardElem) {
            cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleOpenCreateModal = (cat) => {
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=post');
            return;
        }
        setCreateInitialCategory(cat || category || 'parking');
        setShowCreateModal(true);
    };

    // Category options
    const categoryOptions = [
        { id: 'parking', name: 'Parking', icon: Car, color: '#3B82F6', desc: 'Hourly / Daily' },
        { id: 'hotel', name: 'Hotel', icon: Building2, color: '#8B5CF6', desc: 'Per Night Stay' },
        { id: 'pg', name: 'PG Rooms', icon: Home, color: '#10B981', desc: 'Monthly Stays' },
    ];

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#0B0D17', fontFamily: 'Inter, system-ui, sans-serif' }}>
            
            {/* FULLSCREEN GOOGLE MAP BACKGROUND */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <GoogleMapView
                    spots={filteredSpots}
                    userLocation={userLocation}
                    selectedSpot={selectedSpot}
                    onSpotSelect={handleSpotSelect}
                    onBook={(s) => setBookingSpot(s)}
                />
            </div>

            {/* TOP BAR OVERLAY: FLOATING SEARCH + CATEGORY PILLS (MATCHING USER MOCKUP) */}
            <div style={{
                position: 'absolute', top: 16, left: 16, right: 16, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                pointerEvents: 'none'
            }}>
                {/* Left: Floating Search Bar (Google Maps Style) */}
                <div style={{
                    pointerEvents: 'auto',
                    background: '#1E293B',
                    color: '#fff',
                    borderRadius: 24,
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    width: 'clamp(280px, 32vw, 420px)'
                }}>
                    <button
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        title={isDrawerOpen ? 'Hide Places Drawer' : 'Show Places Drawer'}
                        style={{
                            background: 'transparent', border: 'none', color: '#94A3B8',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Search size={18} color="#6C63FF" />
                        <input
                            type="text"
                            placeholder="Search Google Maps / Locality (e.g. OMR, Tidel Park)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', color: '#fff',
                                outline: 'none', width: '100%', fontSize: '13.5px', fontWeight: 500
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13 }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button
                        onClick={detectLocation}
                        title="Center on my live location"
                        style={{
                            background: 'rgba(108,99,255,0.15)', border: 'none', color: '#818CF8',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: '50%'
                        }}
                    >
                        <Navigation size={16} />
                    </button>
                </div>

                {/* Center: TOP CATEGORY PILLS (Parking | Hotel | PG Rooms) */}
                <div style={{
                    pointerEvents: 'auto',
                    display: 'flex',
                    gap: 8,
                    background: 'rgba(19, 22, 39, 0.92)',
                    padding: '6px 8px',
                    borderRadius: 30,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(12px)'
                }}>
                    {categoryOptions.map((cat) => {
                        const Icon = cat.icon;
                        const active = category === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 18px',
                                    borderRadius: 20,
                                    border: active ? ('2px solid ' + cat.color) : '1px solid transparent',
                                    background: active ? ('linear-gradient(135deg, ' + cat.color + 'dd, ' + cat.color + ')') : 'transparent',
                                    color: active ? '#ffffff' : '#CBD5E1',
                                    fontWeight: active ? 800 : 600,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    boxShadow: active ? ('0 4px 14px ' + cat.color + '66') : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <Icon size={18} />
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Quick "+ List Space" & Profile Widget */}
                <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                    <button
                        onClick={() => handleOpenCreateModal(category)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#fff', border: 'none', padding: '9px 16px',
                            borderRadius: 20, fontWeight: 700, fontSize: '13.5px',
                            cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Plus size={16} />
                        <span>+ List Space</span>
                    </button>

                    {isAuthenticated ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: '#1E293B', color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                                }}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '12px'
                                }}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: 46, width: 220,
                                    background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)',
                                    boxShadow: '0 16px 36px rgba(0,0,0,0.6)', padding: 8, zIndex: 100,
                                    display: 'flex', flexDirection: 'column', gap: 4
                                }}>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name}</div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user?.email}</div>
                                    </div>
                                    <Link
                                        href={'/dashboard/' + (user?.activeRole || 'driver')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 8, color: '#E2E8F0', textDecoration: 'none', fontSize: '13px', fontWeight: 600
                                        }}
                                    >
                                        <LayoutDashboard size={16} color="#818CF8" /> Dashboard
                                    </Link>
                                    <Link
                                        href="/dashboard/driver/bookings"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 8, color: '#E2E8F0', textDecoration: 'none', fontSize: '13px', fontWeight: 600
                                        }}
                                    >
                                        <span>📋</span> My Bookings & Stays
                                    </Link>
                                    <Link
                                        href="/dashboard/host"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 8, color: '#E2E8F0', textDecoration: 'none', fontSize: '13px', fontWeight: 600
                                        }}
                                    >
                                        <span>🏠</span> My Listed Spaces
                                    </Link>
                                    <button
                                        onClick={logout}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                            borderRadius: 8, color: '#EF4444', background: 'transparent',
                                            border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                                        }}
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                                href="/auth/login"
                                style={{
                                    background: '#1E293B', color: '#fff', padding: '8px 16px',
                                    borderRadius: 20, fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                                }}
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* FLOATING COLLAPSIBLE LEFT SIDEBAR (GOOGLE MAPS PLACES DRAWER) */}
            <div style={{
                position: 'absolute', top: 76, bottom: 20, left: 16, zIndex: 40,
                width: isDrawerOpen ? 'clamp(320px, 34vw, 440px)' : '0px',
                opacity: isDrawerOpen ? 1 : 0,
                pointerEvents: isDrawerOpen ? 'auto' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', flexDirection: 'column',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                overflow: 'hidden'
            }}>
                {/* Drawer Header */}
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                                {category === 'parking' ? '🚗 Nearby Parking Spaces' : category === 'hotel' ? '🏨 Hotels & Suites' : '🏠 PG & Co-Living Stays'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                                {filteredSpots.length} verified listings in this area
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                title="Filter options"
                                style={{
                                    background: isFiltersOpen ? '#6C63FF' : 'rgba(255,255,255,0.06)',
                                    color: '#fff', border: 'none', padding: '6px 10px',
                                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600
                                }}
                            >
                                <SlidersHorizontal size={14} /> Filters
                            </button>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', padding: '6px', borderRadius: 8, cursor: 'pointer' }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Radius selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Radius:</span>
                        {['All', 1, 2, 5, 10].map(r => (
                            <button
                                key={r}
                                onClick={() => setRadius(r)}
                                style={{
                                    padding: '3px 9px', borderRadius: 12, fontSize: '11px', fontWeight: 700,
                                    background: radius === r ? '#6C63FF' : 'rgba(255,255,255,0.05)',
                                    color: radius === r ? '#fff' : '#94A3B8',
                                    border: '1px solid ' + (radius === r ? '#6C63FF' : 'rgba(255,255,255,0.08)'),
                                    cursor: 'pointer'
                                }}
                            >
                                {r === 'All' ? 'All' : (r + 'km')}
                            </button>
                        ))}
                    </div>

                    {/* Expandable Advanced Filters */}
                    {isFiltersOpen && (
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                            {category === 'pg' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    <select
                                        value={genderFilter}
                                        onChange={(e) => setGenderFilter(e.target.value)}
                                        style={{ background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: '11px' }}
                                    >
                                        <option value="all">👥 All Genders</option>
                                        <option value="gents">👦 Gents PG</option>
                                        <option value="ladies">👧 Ladies PG</option>
                                        <option value="unisex">👫 Unisex</option>
                                    </select>
                                    <select
                                        value={sharingFilter}
                                        onChange={(e) => setSharingFilter(e.target.value)}
                                        style={{ background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: '11px' }}
                                    >
                                        <option value="all">🛏️ All Sharing</option>
                                        <option value="single">Single Room</option>
                                        <option value="double">2-Sharing</option>
                                        <option value="triple">3-Sharing</option>
                                    </select>
                                </div>
                            )}

                            {category === 'hotel' && (
                                <select
                                    value={roomTypeFilter}
                                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                                    style={{ background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: '11px' }}
                                >
                                    <option value="all">🏨 All Room Types</option>
                                    <option value="standard">Standard Room</option>
                                    <option value="deluxe">Deluxe Room</option>
                                    <option value="executive">Executive Suite</option>
                                </select>
                            )}

                            {category === 'parking' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setIsEVFilter(!isEVFilter)}
                                        style={{ background: isEVFilter ? '#10B981' : 'rgba(255,255,255,0.06)', color: isEVFilter ? '#fff' : '#94A3B8', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        ⚡ EV Charging
                                    </button>
                                    <button
                                        onClick={() => setIsCoveredFilter(!isCoveredFilter)}
                                        style={{ background: isCoveredFilter ? '#3B82F6' : 'rgba(255,255,255,0.06)', color: isCoveredFilter ? '#fff' : '#94A3B8', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        🛡️ Covered
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cards List */}
                <div
                    ref={drawerListRef}
                    style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                            <div style={{ width: 32, height: 32, border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                            <p style={{ fontSize: '13px' }}>Locating places on map...</p>
                        </div>
                    ) : filteredSpots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff', marginBottom: 4 }}>No places in this view</div>
                            <p style={{ fontSize: '12px', margin: '0 0 14px' }}>Try increasing radius or list your own space to start earning.</p>
                            <button
                                onClick={() => handleOpenCreateModal(category)}
                                style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                + List Your {category.toUpperCase()} Space
                            </button>
                        </div>
                    ) : (
                        filteredSpots.map(spot => (
                            <div
                                key={spot._id}
                                id={'card-' + spot._id}
                                onMouseEnter={() => setSelectedSpot(spot)}
                                style={{
                                    border: selectedSpot?._id === spot._id ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 16, transition: 'all 0.2s', overflow: 'hidden'
                                }}
                            >
                                <MagicBricksCard
                                    spot={spot}
                                    onBook={(s) => setBookingSpot(s)}
                                    onSelect={(s) => setSelectedSpot(s)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* FLOATING EXPAND DRAWER BUTTON (WHEN COLLAPSED) */}
            {!isDrawerOpen && (
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    style={{
                        position: 'absolute', top: 76, left: 16, zIndex: 40,
                        background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                        padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        fontSize: '13px', fontWeight: 700
                    }}
                >
                    <span>📋 View {filteredSpots.length} Places</span>
                    <ChevronRight size={16} />
                </button>
            )}

            {/* MODAL 1: CREATE LISTING MODAL */}
            {showCreateModal && (
                <CreateListingModal
                    isOpen={showCreateModal}
                    initialCategory={createInitialCategory}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        fetchSpots();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* MODAL 2: UNIFIED BOOKING MODAL */}
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
            `}</style>
        </div>
    );
}
