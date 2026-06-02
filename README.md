# 🟣 Purplle AI Store Intelligence Platform

> Real-time CCTV analytics for beauty retail — YOLOv8 + Node.js + React

A production-ready AI platform that converts raw CCTV footage into actionable store intelligence: footfall counts, dwell time analytics, queue monitoring, and crowd alerts — all delivered live to a React dashboard via Socket.IO.

---

## Architecture Overview

```
5 CCTV Cameras
  └── Python AI Engine (YOLOv8 + OpenCV + ByteTrack)
        └── POST /api/events/ingest  ──→  Node.js/Express Backend
                                              ├── MongoDB (events, analytics, occupancy)
                                              ├── Socket.IO  ──→  React Dashboard
                                              └── REST APIs ──→  React Dashboard
```

### Camera Roles
| Camera | Location | Analytics Generated |
|--------|----------|---------------------|
| CAM1 | Browsing Zone A | Dwell time, zone heatmap |
| CAM2 | Browsing Zone B | Dwell time, zone heatmap |
| CAM3 | Store Entrance/Exit | ENTRY/EXIT events, footfall count |
| CAM4 | Billing Counter | Queue depth, wait time estimate |
| CAM5 | Counter/Operations | Queue depth, staff utilisation proxy |

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| AI Inference | YOLOv8n (Ultralytics) | Best speed/accuracy on CPU; nano model runs ~25fps |
| Object Tracking | ByteTrack (supervision) | Stable IDs without GPU Re-ID; handles occlusions |
| AI Server | FastAPI + uvicorn | Async, auto-docs, easy background tasks |
| Backend | Node.js + Express | Fast JSON APIs; large ecosystem |
| Database | MongoDB + Mongoose | Schema-flexible for varied event payloads |
| Real-time | Socket.IO | Bi-directional; handles reconnects gracefully |
| Frontend | React 18 + Vite | Fast HMR; JSX familiarity |
| Styling | Tailwind CSS | Utility-first; rapid iteration |
| Charts | Recharts | React-native; composable |
| State | Zustand | Minimal boilerplate for socket state |

---

## Quick Start

### Prerequisites
- **Node.js** 20+ ([download](https://nodejs.org/))
- **Python** 3.10+ ([download](https://www.python.org/))
- **MongoDB** 6+ ([local install](https://docs.mongodb.com/manual/installation/) or [free Atlas cluster](https://www.mongodb.com/cloud/atlas))
- **Git** for version control

**System libraries (Linux/macOS):**
```bash
# macOS
brew install cmake libopencv

# Ubuntu/Debian  
sudo apt-get install python3-dev libopencv-dev libgl1 libglib2.0-0
```

### 1. Clone & Install

```bash
git clone <repo>
cd purplle-ai-platform

# Install all dependencies (root level)
npm run install:all

# Or manually:
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-service && pip install -r requirements.txt && cd ..
```

### 2. Configure Environment

**Backend** — copy example to `.env`:
```bash
cd backend
cp .env.example .env
```

**AI Service** — copy example to `.env`:
```bash
cd ai-service
cp .env.example .env
```

**Frontend** — copy example to `.env`:
```bash
cd frontend
cp .env.example .env
```

**MongoDB Setup:**
```bash
# Option A: Local MongoDB (must be running)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB

# Option B: MongoDB Atlas (free cloud)
# Edit backend/.env:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/purplle_ai
```

### 3. Seed Database (Optional)

```bash
cd backend && node scripts/seed.js && cd ..
```

### 4. Start Services

**Open 3 terminal windows:**

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Expected: 🟣 Purplle AI Backend running on port 5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Expected: ➜  Local:   http://localhost:5173/
```

**Terminal 3 — AI Engine:**
```bash
npm run dev:ai
# Expected: INFO:     Uvicorn running on http://127.0.0.1:8000
# Note: First run will download YOLOv8n model (~6 MB)
```

### 5. Verify Everything Works

Open http://localhost:5173 in your browser.

You should see:
- ✅ Occupancy dashboard with stats
- ✅ Real-time updates via Socket.IO
- ✅ Empty event log (until AI processes data)

### 6. Trigger Demo (No Real Cameras Needed)

In any terminal, run:
```bash
curl -X POST http://localhost:8000/analyze/all-cameras
```

**Expected behavior:**
- All 5 cameras start simulating data
- Events stream to backend
- Dashboard updates with live metrics (footfall, dwell time, queue depth)
- Event log fills with ENTRY, EXIT, DWELL_TIME, QUEUE_ALERT events

**Output example:**
```json
{
  "current_count": 15,
  "today_entries": 32,
  "today_exits": 17,
  "peak_today": { "count": 28, "at": "2026-06-02T10:15:00Z" }
}
```

---

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'cv2'` | Run `cd ai-service && pip install -r requirements.txt` |
| `Connection refused` on port 5000 | Backend not running; check Terminal 1 |
| `WebSocket error` in browser | Frontend can't reach backend; check CORS in `backend/.env` |
| `MongoDB connection failed` | Ensure MongoDB is running; update `MONGO_URI` in `backend/.env` |
| `YOLOv8 model not found` | First run auto-downloads (~6 MB); may take 30 seconds |

---

## API Reference

### Events
```
POST /api/events/ingest     AI service → backend (batch ingestion)
GET  /api/events            Query event log (?event_type=ENTRY&camera_id=CAM3&limit=50)
GET  /api/events/occupancy  Current occupancy snapshot
```

### Analytics
```
GET /api/analytics/kpi           KPI summary (occupancy, footfall, dwell, alerts)
GET /api/analytics/footfall      Hourly footfall chart (?hours=24)
GET /api/analytics/dwell         Dwell time by zone
GET /api/analytics/queue         Queue depth trend (?hours=8)
GET /api/analytics/peak-hours    Peak hour analysis (?days=7)
```

### Cameras
```
GET   /api/cameras              Camera registry
PATCH /api/cameras/:id/status   Update camera status
GET   /api/cameras/:id/stats    24h stats per camera
```

### Health
```
GET /health    Service health + DB status
```

### Socket.IO Events
```
# Server → Client (subscribe)
live:event          Every new AI event
occupancy:update    Store occupancy change
alert:crowd         Crowd threshold crossed

# Client → Server
join:camera  <cameraId>   Subscribe to camera-specific events
alert:ack    <eventId>    Acknowledge an alert
```

---

## Engineering Decisions & Trade-offs

### 1. Frame Sampling (every Nth frame)
**Decision:** Process 1 in every 3 frames by default.  
**Reason:** At 30fps, this yields ~10fps inference — sufficient for dwell/queue analytics while cutting CPU load 66%.  
**Trade-off:** Entry/exit events at CAM3 may miss very fast crossings. Mitigated by tight entry-line placement.

### 2. ByteTrack over DeepSORT
**Decision:** Use ByteTrack (no GPU Re-ID) for person tracking.  
**Reason:** DeepSORT requires appearance feature extraction — impossible on CPU in real-time. ByteTrack achieves ~80% MOTA on MOT17 without a Re-ID model.  
**Trade-off:** ID switches are more frequent across occlusions. Acceptable for dwell/queue; would need improvement for individual journey tracking.

### 3. Materialised Occupancy Snapshot
**Decision:** A single `OccupancySnapshot` document updated on every ENTRY/EXIT.  
**Reason:** Calculating live count from event history requires O(n) scan. The snapshot is O(1) read.  
**Trade-off:** Snapshot can drift from truth if events are missed (e.g. person enters before recording starts). Reset at store open via a daily cron job.

### 4. Write-time Aggregation for Analytics
**Decision:** `AnalyticsRollup` documents updated when events arrive.  
**Reason:** Dashboard chart queries are O(1) lookup rather than O(n) aggregation pipeline on the full events collection.  
**Trade-off:** Slightly higher write cost. Acceptable given low event volume (~1000/hr).

### 5. Single Events Collection
**Decision:** All 5 event types in one `events` collection, discriminated by `event_type`.  
**Reason:** Simplifies time-range queries and alerting queries that span types. Compound indexes cover the access patterns.  
**Trade-off:** Documents have sparse fields (most events only fill 1-2 payload sub-documents). MongoDB handles this efficiently.

---

## Project Structure

```
purplle-ai-platform/
├── backend/
│   ├── config/database.js          MongoDB connection
│   ├── scripts/seed.js             Camera & occupancy seeding
│   └── src/
│       ├── app.js                  Express entry point
│       ├── controllers/            Thin HTTP handlers
│       ├── services/
│       │   ├── eventService.js     Core business logic
│       │   └── analyticsService.js Aggregation queries
│       ├── models/
│       │   ├── Event.js            Event schema + TTL
│       │   ├── OccupancySnapshot.js Live occupancy
│       │   ├── AnalyticsRollup.js  Pre-computed aggregates
│       │   └── Camera.js           Camera registry
│       ├── routes/                 Express routers
│       ├── socket/socketManager.js Socket.IO singleton
│       └── utils/logger.js         Winston logger
│
├── ai-service/
│   ├── requirements.txt
│   └── src/
│       ├── main.py                 FastAPI server
│       ├── pipeline.py             CameraProcessor orchestrator
│       ├── detectors/
│       │   └── person_detector.py  YOLOv8 wrapper
│       ├── trackers/
│       │   └── byte_tracker.py     ByteTrack wrapper
│       └── analyzers/
│           ├── entry_exit.py       Line-crossing detection
│           ├── dwell.py            Dwell time accumulator
│           ├── queue.py            Queue depth + crowd
│           └── crowd.py            Crowd alert
│
└── frontend/
    └── src/
        ├── App.jsx                 Router + Socket.IO init
        ├── store/socketStore.js    Zustand real-time state
        ├── services/api.js         REST API client
        ├── hooks/useApi.js         Data-fetching hook
        ├── components/
        │   ├── common/             Sidebar, Header
        │   ├── dashboard/          KPI cards, gauges, charts
        │   ├── analytics/          Deep analytics charts
        │   ├── cameras/            Camera grid
        │   └── alerts/             Alert panel
        └── pages/                  Dashboard, Analytics, Cameras, Alerts
```

---

## Deployment

See `docs/DEPLOYMENT.md` for Docker + production deployment guide.

---

## Hackathon Notes

This project demonstrates:
1. **End-to-end AI pipeline** — raw video → business events → dashboard
2. **Production patterns** — service layer, compound indexes, TTL, rate limiting, health checks
3. **Real-time architecture** — Socket.IO with reconnection, room-based subscriptions, alert acknowledgement
4. **Business focus** — events translate directly to retail KPIs (footfall, dwell, conversion proxy, capacity)
5. **Simulation mode** — full demo without physical cameras; judges can test immediately

