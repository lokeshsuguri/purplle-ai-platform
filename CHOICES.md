# CHOICES — rationale and trade-offs

## Model selection
- The architecture is designed to support YOLOv8 integration.
- Rationale: this enables use of lightweight models (for example `yolov8n`) for CPU testing and the option to upgrade to larger YOLOv8 variants when GPU resources are available.

## Tracker selection
- **Chosen**: ByteTrack (`trackers/byte_tracker.py`). Robust ID assignment and low ID switching.

## Schema design
- **Single `Event` collection** with `event_type` discriminator and embedded payloads (`person`, `dwell`, `queue`, `crowd`).
- **Why**: optimizes write-heavy ingest, simplifies time-series queries and rollups. TTL index used to bound raw storage.

## API architecture
- **REST** for ingest and historical queries; **socket.io** for realtime alerts.
- **Why**: REST is simple for AI service to call; socket.io provides low-latency push for dashboards.

## Database decisions
- **MongoDB (Mongoose)** chosen for schema flexibility, TTL support, and ease of development. Time-series collections considered for high-volume deployments.

## Deployment
- **Frontend**: static hosting (Vercel/Netlify);
- **Backend**: containerized Node.js behind load balancer;
- **AI**: GPU hosts or inference cluster.
