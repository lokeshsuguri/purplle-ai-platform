# 🟣 Purplle AI Store Intelligence Platform

> Real-time CCTV analytics for beauty retail — YOLOv8 + Node.js + React

A full-stack store analytics platform that transforms CCTV feeds into live retail intelligence: occupancy, footfall, dwell times, queue monitoring, and crowd alerts.

---

## What this project includes

- **AI inference engine** using YOLOv8n + ByteTrack in `ai-service`
- **Express backend** with REST APIs, Socket.IO, and MongoDB persistence in `backend`
- **React + Vite dashboard** with live charts and alert feed in `frontend`
- **Demo seeding scripts** for camera registry, occupancy snapshot, and dashboard metrics
- Support for **local development** and **Vercel/Render deployment**

---

## Architecture

```
[AI service]  -> POST /api/events/ingest -> [Backend Express + MongoDB]
                                        -> Socket.IO -> [React dashboard]
```

- `ai-service`: analyzes camera video or simulated camera streams
- `backend`: stores events, computes analytics, publishes real-time updates
- `frontend`: renders live dashboard, charts, alerts, and camera health

---

## Tech stack

- AI: `YOLOv8n`, `OpenCV`, `ByteTrack`
- Backend: `Node.js`, `Express`, `Socket.IO`, `MongoDB`, `Mongoose`
- Frontend: `React 18`, `Vite`, `Tailwind CSS`, `Recharts`, `Zustand`
- AI service: `FastAPI`, `uvicorn`

---

## Prerequisites

- **Node.js** 20+
- **Python** 3.10+
- **MongoDB** 6+ (local or Atlas)
- **Git**

Optional system packages for AI service:

```bash
# Ubuntu / Debian
sudo apt-get install python3-dev libopencv-dev libgl1 libglib2.0-0
```

---

## Setup

### 1. Install dependencies

```bash
git clone <repo>
cd purplle-ai-platform
npm run install:all
```

### 2. Copy environment templates

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
```

### 3. Configure your environment

- `backend/.env`: MongoDB URI, allowed origins, AI service URL, analytics thresholds
- `frontend/.env`: `VITE_API_URL` for the backend
- `ai-service/.env`: `BACKEND_URL` and `AI_PORT`

### 4. Seed the database

```bash
cd backend
npm run seed
npm run seed:dashboard
```

`npm run seed` creates camera registry and initial occupancy snapshot.
`npm run seed:dashboard` populates hourly analytics rollups and dashboard metrics.

---

## Run locally

Open three terminals:

**Backend**
```bash
npm run dev:backend
```

**Frontend**
```bash
npm run dev:frontend
```

**AI service**
```bash
npm run dev:ai
```

Then open:

```bash
http://localhost:5173
```

---

## Demo flow

Trigger a full simulated camera run:

```bash
curl -X POST http://localhost:8000/analyze/all-cameras
```

Expected behavior:

- 5 simulated cameras start processing
- events are posted to backend
- frontend dashboard updates in real time
- alert feed populates with crowd/queue events

---

## Environment variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/purplle_ai
ALLOWED_ORIGINS=http://localhost:5173,https://<your-vercel-url>.vercel.app,https://<your-render-url>.onrender.com
AI_SERVICE_URL=http://localhost:8000
OCCUPANCY_THRESHOLD=50
QUEUE_ALERT_THRESHOLD=5
CROWD_ALERT_COOLDOWN_MS=60000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://<your-render-backend>.onrender.com
```

### AI Service (`ai-service/.env`)

```env
BACKEND_URL=http://localhost:5000
AI_PORT=8000
```

Notes:
- The backend connection supports `MONGO_URI`, `MONGODB_URI`, or `DATABASE_URL`.
- `frontend` and socket clients use `VITE_API_URL` with a fallback to the Render backend.
- `ALLOWED_ORIGINS` must include any deployed frontend origin and local development origins.

---

## Verified deployment pattern

### Vercel frontend
- Set `VITE_API_URL` to the Render backend URL
- Build and deploy with the Vite app

### Render backend
- Set `MONGO_URI` / `DATABASE_URL`
- Set `ALLOWED_ORIGINS` to include the deployed Vercel URL
- Set `NODE_ENV=production`

The backend already permits `*.vercel.app` Socket.IO origins for deployed React clients.

---

## API reference

### Events

- `POST /api/events/ingest` — ingest AI event batches
- `GET /api/events` — query events
- `GET /api/events/occupancy` — current occupancy snapshot

### Analytics

- `GET /api/analytics/kpi`
- `GET /api/analytics/footfall`
- `GET /api/analytics/dwell`
- `GET /api/analytics/queue`
- `GET /api/analytics/peak-hours`

### Cameras

- `GET /api/cameras`
- `PATCH /api/cameras/:id/status`
- `GET /api/cameras/:id/stats`

### Health

- `GET /health`

### Socket.IO events

- Server → Client: `live:event`, `occupancy:update`, `alert:crowd`
- Client → Server: `join:camera`, `alert:ack`

---

## Troubleshooting

- `Connection refused` on port 5000: backend not running or wrong `VITE_API_URL`
- `WebSocket error`: CORS/origin mismatch; verify `ALLOWED_ORIGINS`
- `MongoDB connection failed`: confirm MongoDB is reachable and `MONGO_URI` is correct
- `Model initialization` warning: first run may download the YOLOv8n model
- Dashboard empty: run `npm run seed:dashboard` or `curl -X POST http://localhost:8000/analyze/all-cameras`

---

## Notes for judges

- This project is designed for a hackathon demo: live streaming analytics, real-time alerts, and easy demo seeding.
- The backend uses precomputed `AnalyticsRollup` and `OccupancySnapshot` collections for fast dashboard reads.
- The AI service is CPU-friendly and auto-downloads the YOLOv8n model if missing.
- The frontend is built with Vite and can be deployed to Vercel with `VITE_API_URL` configured.

---

## Helpful commands

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
npm run dev:ai
cd backend && npm run seed
cd backend && npm run seed:dashboard
cd frontend && npm run build
```

---

## Submission readiness

This project is ready for hackathon submission if:

- backend starts successfully with MongoDB
- frontend loads at `http://localhost:5173`
- AI service responds at `http://localhost:8000`
- socket live updates appear on the dashboard
- seed scripts populate analytics and occupancy data
