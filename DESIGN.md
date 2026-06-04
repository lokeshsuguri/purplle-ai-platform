# DESIGN — Purplle AI Platform

## System overview
The platform ingests detection+tracking output from an AI pipeline, normalizes and stores events in MongoDB, produces time-windowed rollups (AnalyticsRollup), and exposes REST endpoints and socket streams for dashboards, alerts, and downstream consumers.

### Components
- **AI Service (`ai-service/`)**: the architecture is designed to support YOLOv8 integration alongside a ByteTrack-based detector+tracker pipeline. Emits events (`ENTRY`, `EXIT`, `DWELL_TIME`, `QUEUE_ALERT`).
- **Ingest API (`backend/`)**: validates and stores `Event` documents.
- **Rollup worker**: aggregates raw events into `AnalyticsRollup` documents at minute/hour/day resolutions.
- **Frontend**: dashboard components subscribe to socket streams and call REST endpoints for historical analytics.

## Event flow
1. Frame processed by AI service: detector -> tracker -> business rules identify ENTRY/EXIT/DWELL/QUEUE.
2. AI service posts event JSON to `POST /api/events`.
3. Backend validates, persists, and forwards alerts via `socketManager`.
4. Rollup jobs aggregate events for analytics queries.

## Analytics pipeline
- Raw events retained for 30 days (TTL). Rollups keep longer-term metrics.
- Aggregations:
  - Minute-level: counts, mean dwell per zone
  - Hour-level: peak hours, queue trends
  - Day-level: aggregated KPIs

## Deployment
- Backend: containerized Node.js app, horizontal scaling behind LB.
- AI service: GPU-backed nodes or inference cluster (Kubernetes with device plugin).
- DB: MongoDB replica set or Atlas managed cluster.

## Testing strategy
- Unit tests for controllers and helpers.
- Integration tests: POST `events.jsonl` to `/api/events` and assert DB writes and socket pushes.
- E2E: simulate camera feed pipeline and validate rollups.

## AI-Assisted Decisions
- **Dwell detection**: AI provides per-track presence and bbox; dwell is computed by measuring continuous presence in a zone and emitting `DWELL_TIME` when threshold exceeded. Thresholds are configurable per zone.
- **Queue estimation**: AI counts people inside a defined queue ROI and estimates wait time based on depth and historical throughput; `QUEUE_ALERT` is raised when estimated wait time or depth exceeds configured thresholds.
- **Model metadata**: `ai_meta.model_version` and `ai_meta.inference_ms` are recorded to detect regressions and enable model rollbacks or A/B tests.

## Operational considerations
- Validate incoming events and rate-limit ingest.
- Monitor `ai_meta.inference_ms` for latency spikes.
- Version `model_version` to associate performance and accuracy changes.
