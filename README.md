# Mind Spark – Smart Parking Marketplace

> **Full-stack shared-economy parking platform** — React (Next.js 14) + Node.js/Express + MongoDB

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on port `27017` (or use MongoDB Atlas)
- npm

### 1. Start the Backend

```bash
cd backend
npm install
# Edit .env as needed (Razorpay keys, MongoDB URI)
npm run dev       # development (nodemon) — port 5000
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev       # Next.js dev server — port 3000
```

### 3. Open the App

Visit **http://localhost:3000**

---

## 🗂️ Folder Structure

```
parking/
├── backend/
│   ├── config/           # db.js, razorpay.js
│   ├── controllers/      # authController, spotController, bookingController, adminController
│   ├── middleware/        # auth.js (JWT), roleCheck.js (RBAC)
│   ├── models/            # User.js, Spot.js, Booking.js
│   ├── routes/            # auth.routes, spot.routes, booking.routes, admin.routes
│   ├── .env               # ← configure your keys here
│   └── server.js
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.js                      # Landing page
    │   │   ├── auth/login/page.js
    │   │   ├── auth/register/page.js
    │   │   └── dashboard/
    │   │       ├── driver/page.js           # Map + booking timer
    │   │       ├── driver/bookings/page.js
    │   │       ├── host/page.js             # Spot management + earnings
    │   │       └── admin/                   # Analytics + user/booking/spot tables
    │   ├── components/
    │   │   ├── DashboardLayout.js           # Sidebar + header
    │   │   ├── MapComponent.js              # Leaflet/OpenStreetMap
    │   │   └── AdminCharts.js               # Chart.js charts
    │   ├── context/AuthContext.js
    │   └── lib/api.js                       # Axios client
    ├── .env.local
    └── next.config.js
```

---

## ⚙️ Environment Variables

### `backend/.env`
| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `RAZORPAY_KEY_ID` | Your Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay test key secret |
| `PLATFORM_COMMISSION` | Commission rate (default 0.20 = 20%) |

### `frontend/.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:5000/api`) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key for frontend checkout |

---

## 👤 Accounts & Roles

### Creating Admin Account
Register with email `admin@mindspark.com` — the backend auto-assigns the admin role.

### Dual Role
Register with both Driver + Host roles selected. Switch between them instantly from the sidebar without logging out.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/switch-role` | Switch active role |
| GET | `/api/spots/nearby?lat=&lng=&radius=` | Geo query (2dsphere) |
| GET | `/api/spots/host` | Host's own spots |
| POST | `/api/spots` | Create spot (geocoded) |
| PUT | `/api/spots/:id` | Edit spot |
| DELETE | `/api/spots/:id` | Delete spot |
| POST | `/api/bookings` | Book a spot (atomic) |
| GET | `/api/bookings/active` | Driver's active booking |
| PUT | `/api/bookings/:id/complete` | End session + create Razorpay order |
| POST | `/api/bookings/:id/verify-payment` | Verify Razorpay signature |
| PUT | `/api/bookings/:id/demo-complete` | Skip payment (demo mode) |
| GET | `/api/admin/stats` | System analytics |

---

## 🗄️ MongoDB Indexes

Spot model includes a **2dsphere index** on the `location` field for geospatial queries:

```js
SpotSchema.index({ location: '2dsphere' });
```

Query used:
```js
Spot.find({
  location: {
    $nearSphere: {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
      $maxDistance: radiusInMeters
    }
  }
})
```

---

## 💳 Payment Flow (Razorpay)

1. Driver ends session → backend computes cost → creates Razorpay order
2. Frontend opens Razorpay checkout modal
3. On success → frontend sends `razorpay_payment_id` + `razorpay_signature` to backend
4. Backend verifies HMAC-SHA256 signature → marks booking `completed`
5. Spot status reverts to `available`
6. Revenue split: **80% host earnings, 20% platform commission**

> **Demo mode**: Without real Razorpay keys, the app auto-calls `demo-complete` to skip payment — perfect for local testing.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, react-leaflet, Chart.js |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB with 2dsphere geospatial index |
| Auth | JWT + bcryptjs |
| Maps | OpenStreetMap + Leaflet (free, no API key) |
| Geocoding | Nominatim (free, no API key needed) |
| Payments | Razorpay (test mode) |
