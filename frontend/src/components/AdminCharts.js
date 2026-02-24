'use client';
import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, ArcElement,
    PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
    plugins: {
        legend: { labels: { color: '#9094BE', font: { family: 'Inter', size: 12 } } },
        tooltip: {
            backgroundColor: '#1A1D35',
            borderColor: 'rgba(108,99,255,0.3)',
            borderWidth: 1,
            titleColor: '#F0F0FF',
            bodyColor: '#9094BE',
        },
    },
};

export default function AdminCharts({ stats, bookingsByDay }) {
    const barData = {
        labels: bookingsByDay.map(d => d._id),
        datasets: [{
            label: 'Bookings',
            data: bookingsByDay.map(d => d.count),
            backgroundColor: 'rgba(108,99,255,0.6)',
            borderColor: '#6C63FF',
            borderWidth: 2,
            borderRadius: 6,
        }],
    };

    const revenueData = {
        labels: bookingsByDay.map(d => d._id),
        datasets: [{
            label: 'Revenue (₹)',
            data: bookingsByDay.map(d => d.revenue || 0),
            backgroundColor: 'rgba(255,217,61,0.15)',
            borderColor: '#FFD93D',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
        }],
    };

    const doughnutData = {
        labels: ['Host Earnings (80%)', 'Platform Commission (20%)'],
        datasets: [{
            data: [stats.totalHostEarnings || 80, stats.platformCommission || 20],
            backgroundColor: ['rgba(255,217,61,0.8)', 'rgba(255,107,107,0.8)'],
            borderColor: ['#FFD93D', '#FF6B6B'],
            borderWidth: 2,
        }],
    };

    const roleData = {
        labels: ['Drivers Only', 'Hosts Only', 'Both Roles'],
        datasets: [{
            data: [
                Math.max(0, (stats.totalDrivers || 0) - (stats.totalHosts || 0)),
                Math.max(0, (stats.totalHosts || 0) - (stats.totalDrivers || 0)),
                Math.min(stats.totalDrivers || 0, stats.totalHosts || 0),
            ],
            backgroundColor: ['rgba(78,205,196,0.8)', 'rgba(255,217,61,0.8)', 'rgba(108,99,255,0.8)'],
            borderColor: ['#4ECDC4', '#FFD93D', '#6C63FF'],
            borderWidth: 2,
        }],
    };

    const barOptions = {
        ...chartDefaults,
        responsive: true,
        scales: {
            x: { ticks: { color: '#5C6080' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#5C6080' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
        plugins: { ...chartDefaults.plugins, title: { display: false } },
    };

    const doughnutOptions = {
        ...chartDefaults,
        cutout: '65%',
        plugins: { ...chartDefaults.plugins },
    };

    return (
        <div className="grid-2" style={{ gap: 20 }}>
            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📈 Bookings (Last 7 Days)</h3>
                {bookingsByDay.length > 0
                    ? <Bar data={barData} options={barOptions} />
                    : <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No booking data yet</div>}
            </div>
            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>💰 Revenue Split</h3>
                <div style={{ maxWidth: 280, margin: '0 auto' }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
            </div>
            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📍 Spot Status</h3>
                <div style={{ maxWidth: 280, margin: '0 auto' }}>
                    <Doughnut
                        data={{
                            labels: ['Available', 'Occupied'],
                            datasets: [{ data: [stats.availableSpots || 0, stats.occupiedSpots || 0], backgroundColor: ['rgba(107,203,119,0.8)', 'rgba(255,107,107,0.8)'], borderColor: ['#6BCB77', '#FF6B6B'], borderWidth: 2 }]
                        }}
                        options={doughnutOptions}
                    />
                </div>
            </div>
            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>👥 User Roles Distribution</h3>
                <div style={{ maxWidth: 280, margin: '0 auto' }}>
                    <Doughnut data={roleData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
