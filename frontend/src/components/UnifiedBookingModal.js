'use client';
import React, { useState } from 'react';
import { X, Calendar, Clock, CreditCard, CheckCircle2, Shield, Zap, QrCode } from 'lucide-react';
import { bookingsAPI } from '../lib/api';

export default function UnifiedBookingModal({
    isOpen,
    onClose,
    spot,
    onBookingSuccess
}) {
    const [quantity, setQuantity] = useState(1);
    const [durationHours, setDurationHours] = useState(2);
    const [bookingMonths, setBookingMonths] = useState(1);
    const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkOutDate, setCheckOutDate] = useState(
        new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [guestCount, setGuestCount] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('gpay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedBooking, setCompletedBooking] = useState(null);

    if (!isOpen || !spot) return null;

    const cat = spot.category || 'parking';

    // Calculate dynamic cost
    let unitPrice = 0;
    let baseCost = 0;
    let deposit = 0;

    if (cat === 'hotel') {
        unitPrice = spot.pricePerNight || 1500;
        const diffDays = Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)));
        baseCost = diffDays * unitPrice * quantity;
    } else if (cat === 'pg') {
        unitPrice = spot.pricePerMonth || 6500;
        deposit = spot.depositAmount || 2000;
        baseCost = (bookingMonths * unitPrice * quantity) + deposit;
    } else {
        unitPrice = spot.pricePerHour || 40;
        baseCost = durationHours * unitPrice * quantity;
    }

    const platformFee = Math.ceil(baseCost * 0.05); // 5% convenience fee
    const totalAmount = baseCost + platformFee;

    const handleConfirmAndPay = async () => {
        setIsProcessing(true);
        try {
            // 1. Create Atomic Booking on backend
            const bookingRes = await bookingsAPI.create({
                spotId: spot._id,
                category: cat,
                quantity,
                checkInDate,
                checkOutDate,
                bookingMonths,
                durationHours,
                vehicleNumber,
                guestCount,
            });

            if (!bookingRes.data?.success) {
                alert('Booking failed: ' + (bookingRes.data?.message || 'Conflict in booking.'));
                setIsProcessing(false);
                return;
            }

            const booking = bookingRes.data.booking;

            // 2. Process Razorpay / UPI Payment
            const payRes = await bookingsAPI.demoComplete(booking._id, { paymentMethod });
            if (payRes.data?.success) {
                setCompletedBooking(payRes.data.booking);
                if (onBookingSuccess) onBookingSuccess(payRes.data.booking);
            }
        } catch (err) {
            console.error('Booking payment error:', err);
            alert('Booking Error: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#1E293B', color: '#fff', borderRadius: '20px',
                width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#38BDF8', textTransform: 'uppercase' }}>
                            {cat === 'hotel' ? '🏨 Hotel Reservation' : cat === 'pg' ? '🏠 PG Room Booking' : '🚗 Parking Slot Booking'}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{spot.title}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                        <X size={22} />
                    </button>
                </div>

                {!completedBooking ? (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Vacancy Check Badge */}
                        <div style={{
                            padding: '10px 14px', background: '#0F172A', borderRadius: '12px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <span style={{ fontSize: '13px', color: '#94A3B8' }}>Current Live Vacancy:</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#10B981' }}>
                                ✓ {spot.availableCount || 1} available
                            </span>
                        </div>

                        {/* Category Specific Duration / Dates */}
                        {cat === 'parking' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>DURATION (HOURS)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>VEHICLE NUMBER</label>
                                    <input
                                        type="text"
                                        placeholder="TN 01 AB 1234"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                        )}

                        {cat === 'hotel' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>CHECK-IN DATE</label>
                                    <input
                                        type="date"
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>CHECK-OUT DATE</label>
                                    <input
                                        type="date"
                                        value={checkOutDate}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                        )}

                        {cat === 'pg' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>DURATION (MONTHS)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bookingMonths}
                                        onChange={(e) => setBookingMonths(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '4px' }}>MOVE-IN DATE</label>
                                    <input
                                        type="date"
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Payment Method Selector (GPay / PhonePe / Card / Netbanking) */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px' }}>
                                PAYMENT METHOD (RAZORPAY GATEWAY)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                {[
                                    { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                                    { id: 'phonepe', name: 'PhonePe UPI', icon: '🟣' },
                                    { id: 'card', name: 'Card / NetBank', icon: '💳' },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(m.id)}
                                        style={{
                                            padding: '10px 8px', borderRadius: '10px',
                                            background: paymentMethod === m.id ? '#2563EB' : '#0F172A',
                                            color: '#fff', border: paymentMethod === m.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                            fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        {m.icon} {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ padding: '14px', background: '#0F172A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                                <span>Base Rate:</span>
                                <span>₹{baseCost}</span>
                            </div>
                            {deposit > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                                    <span>Refundable Security Deposit:</span>
                                    <span>₹{deposit}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
                                <span>Platform Convenience Fee (5%):</span>
                                <span>₹{platformFee}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800',
                                color: '#F8FAFC', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <span>Total Payable:</span>
                                <span style={{ color: '#10B981' }}>₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <button
                            onClick={handleConfirmAndPay}
                            disabled={isProcessing}
                            style={{
                                width: '100%', padding: '14px', background: '#10B981', color: '#fff',
                                border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
                            }}
                        >
                            {isProcessing ? '⏳ Processing Payment...' : `💳 Pay ₹${totalAmount} via ${paymentMethod.toUpperCase()}`}
                        </button>
                    </div>
                ) : (
                    /* Booking Success Digital Voucher */
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#10B981', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                        }}>
                            <CheckCircle2 size={36} color="#fff" />
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#10B981' }}>
                            Booking Confirmed!
                        </h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94A3B8' }}>
                            Your digital pass has been generated and slot locked.
                        </p>

                        <div style={{
                            padding: '16px', background: '#0F172A', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Booking ID:</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#38BDF8' }}>{completedBooking._id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Property:</span>
                                <span style={{ fontSize: '12px', fontWeight: '700' }}>{spot.title}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Payment Status:</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981' }}>PAID (₹{completedBooking.totalCost})</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '12px', background: '#2563EB', color: '#fff',
                                border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                            }}
                        >
                            Done & View My Bookings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
