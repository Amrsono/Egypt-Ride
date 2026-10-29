# 🚗 Egypt Ride (إيجيبت رايد) — Modern Ride-Hailing Platform

A full-stack, real-time ride-hailing web platform tailored for the Egyptian market (Cairo). Features full **Arabic & English (Bilingual + RTL)** support, interactive **Google Maps & Leaflet** location selection, a real-time **First-Come, First-Served Dispatch Radar queue**, **Driver 2-step trip execution**, **Driver profile/car management with photo uploads**, and an **Owner / Admin Analytics Command Center**.

---

## 🌟 Key Features

### 👤 1. Customer Experience
- **Interactive Map Pinning**: Search Cairo landmarks or click on the interactive map to pin pickup and destination locations.
- **Dynamic Fare & Distance**: Automatic real-time fare calculation based on base fare ($20\text{ EGP}$) + rate per kilometer ($6.5\text{ EGP/km}$).
- **Trip Notes**: Add special instructions for the driver.
- **Live Status Tracking**: Real-time status updates (*Requested* $\rightarrow$ *Accepted* $\rightarrow$ *Picked Up* $\rightarrow$ *Dropped Off*).
- **Driver Rating & Confetti Celebration**: 5-star rating feedback system.
- **Full Customer Registration**: Seamless self-serve sign-up and instant login.

### 🚗 2. Driver Portal
- **Online / Offline Duty Toggle**: Easily toggle availability to start/stop receiving trip dispatches.
- **Real-Time Dispatch Radar**: Instant WebSocket broadcast for incoming ride requests.
- **First-Come, First-Served Pickup**: Race-condition protected pickup lock ensuring fairness.
- **2-Step Trip Workflow**:
  - `Step 1`: **Customer Picked Up** (تم ركوب العميل)
  - `Step 2`: **Customer Dropped Off** (تم إنزال العميل) $\rightarrow$ Enter collected cash fare.
- **Driver Profile & Vehicle Management**:
  - Update car model, year, plate number, and car color.
  - Upload profile photos directly from phone/device storage with client-side canvas compression.

### 👑 3. Owner / Admin Command Center
- **Financial & Operational KPIs**: Live revenue tracker (`EGP` / `ج.م`), completed trip tallies, active trips, and fleet count.
- **Live GPS Fleet Map**: Real-time visual tracking of active drivers across Cairo.
- **Trips Management Log**: Searchable and filterable master table of all dispatch records.
- **Driver Fleet Performance**: Ratings, earnings, vehicle specs, and duty statuses.
- **System & Google Maps API Settings**: Live configuration for Google Maps API keys and pricing rates.

---

## 🔑 Demo & Default Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@egyptride.com` | `admin123` | Full Admin Dashboard & Fleet Analytics |
| **🚗 Driver** | `driver@egyptride.com` | `driver123` | Toyota Corolla (`7777 VIP`) |
| **👤 User (Customer)** | `user@egyptride.com` | `user123` | Customer Account |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet, Canvas Confetti.
- **Localization**: `i18next`, `react-i18next` (Arabic `RTL` + English `LTR`).
- **Backend**: Node.js, Express, TypeScript, Socket.IO, JWT Authentication, bcryptjs.
- **Database**: Lightweight persistent JSON datastore with seed migration engine.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
npm run install:all
```

### 2. Run Locally (Development)
```bash
# Start both client and server concurrently
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000`

### 3. Production Build
```bash
npm run build
npm start
```
Open: `http://localhost:5000`

---

## ☁️ Deployment (Vercel / Cloud)

### Deploying Frontend to Vercel:
1. Connect this GitHub repository to [Vercel](https://vercel.com).
2. Set **Framework Preset**: `Vite`.
3. Set **Root Directory**: `./` (or `client`).
4. Set **Build Command**: `npm run build:client` (or `npm run build` inside `client`).
5. Set **Output Directory**: `client/dist` (or `dist` inside `client`).
6. Set Environment Variable: `VITE_API_URL` pointing to your deployed backend URL (e.g. on Railway, Render, Fly.io, or VPS).

---

## 📹 Video Walkthroughs
- **Arabic Walkthrough**: [`app_walkthrough_arabic.mp4`](./app_walkthrough_arabic.mp4)
- **English Walkthrough**: [`app_walkthrough_demo.mp4`](./app_walkthrough_demo.mp4)
