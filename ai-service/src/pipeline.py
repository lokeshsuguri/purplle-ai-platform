"""
CameraProcessor — orchestrates the full per-camera inference pipeline.

Design decisions:
- Frame sampling (every Nth frame) trades temporal resolution for throughput.
  At 30fps with N=3, we process 10 fps — sufficient for dwell/queue analytics.
- ByteTrack (via supervision library) provides stable track IDs across frames
  without GPU, unlike DeepSORT which needs Re-ID features.
- Business rule analysers run on the track set, not individual detections,
  to avoid duplicate events.
- Simulation mode generates realistic synthetic data when no video is available,
  allowing frontend/backend dev without a real camera feed.
"""
import asyncio
import time
import random
from datetime import datetime, timezone

import httpx

from src.detectors.person_detector import PersonDetector
from src.trackers.byte_tracker import TrackerManager
from src.analyzers.entry_exit import EntryExitAnalyzer
from src.analyzers.dwell import DwellAnalyzer
from src.analyzers.queue import QueueAnalyzer
from src.analyzers.crowd import CrowdAnalyzer


class CameraProcessor:
    CAMERA_ROLES = {
        "CAM1": "browsing",
        "CAM2": "browsing",
        "CAM3": "entry_exit",
        "CAM4": "billing",
        "CAM5": "operations",
    }

    def __init__(self, camera_id: str, backend_url: str, frame_skip: int = 3, simulate: bool = False):
        self.camera_id = camera_id
        self.backend_url = backend_url
        self.frame_skip = frame_skip
        self.simulate = simulate
        self.role = self.CAMERA_ROLES.get(camera_id, "browsing")

        self.detector = PersonDetector() if not simulate else None
        self.tracker = TrackerManager() if not simulate else None
        self.entry_exit = EntryExitAnalyzer(entry_line_y=0.5)
        self.dwell = DwellAnalyzer(min_dwell_seconds=5)
        self.queue = QueueAnalyzer(queue_zone=(0.0, 0.3, 1.0, 1.0))  # bottom 70% of frame
        self.crowd = CrowdAnalyzer(threshold=10)

        self._event_buffer: list = []
        self._flush_interval = 5   # send batch every 5 seconds

    async def run(self, video_path: str):
        """Main entry point. Dispatches to real or simulated pipeline."""
        print(f"[{self.camera_id}] Starting {'simulation' if self.simulate else video_path}")
        try:
            if self.simulate:
                await self._run_simulation()
            else:
                await self._run_real(video_path)
        except Exception as e:
            print(f"[{self.camera_id}] Pipeline error: {e}")
        finally:
            await self._flush_events()
            print(f"[{self.camera_id}] Done. Flushed {len(self._event_buffer)} remaining events.")

    async def _run_real(self, video_path: str):
        """Process an actual video file."""
        import cv2
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_idx = 0
        last_flush = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            if frame_idx % self.frame_skip != 0:
                continue

            timestamp = datetime.now(timezone.utc).isoformat()
            h, w = frame.shape[:2]

            # Detect & track
            detections = self.detector.detect(frame)
            tracks = self.tracker.update(detections, frame)

            # Run business analysers
            events = self._run_analysers(tracks, timestamp, w, h)
            self._event_buffer.extend(events)

            # Periodic flush
            if time.time() - last_flush >= self._flush_interval:
                await self._flush_events()
                last_flush = time.time()

            # Small async yield so other tasks can run
            await asyncio.sleep(0)

        cap.release()

    async def _run_simulation(self):
        """
        Generates realistic synthetic events for demo purposes.
        Simulates a ~3-minute store session.
        """
        print(f"[{self.camera_id}] Running synthetic simulation (180s)")
        sim_start = time.time()
        duration = 180  # seconds

        occupant_count = 0
        active_tracks: dict = {}  # track_id → entry_time
        next_track_id = 1

        while time.time() - sim_start < duration:
            elapsed = time.time() - sim_start
            timestamp = datetime.now(timezone.utc).isoformat()

            if self.role == "entry_exit":
                # Random arrivals / departures
                if random.random() < 0.4:
                    track_id = next_track_id
                    next_track_id += 1
                    active_tracks[track_id] = time.time()
                    self._event_buffer.append(self._make_event(
                        "ENTRY", timestamp,
                        person={"track_id": track_id, "bbox": [0.3, 0.0, 0.7, 0.5], "confidence": round(random.uniform(0.75, 0.99), 2)},
                    ))

                if active_tracks and random.random() < 0.25:
                    tid = random.choice(list(active_tracks.keys()))
                    del active_tracks[tid]
                    self._event_buffer.append(self._make_event(
                        "EXIT", timestamp,
                        person={"track_id": tid, "bbox": [0.3, 0.5, 0.7, 1.0], "confidence": round(random.uniform(0.75, 0.99), 2)},
                    ))

            elif self.role in ("browsing",):
                dwell_secs = random.randint(15, 240)
                zone = random.choice(["aisle_skincare", "aisle_makeup", "aisle_haircare"])
                if random.random() < 0.3:
                    self._event_buffer.append(self._make_event(
                        "DWELL_TIME", timestamp,
                        dwell={"duration_seconds": dwell_secs, "zone": zone},
                        person={"track_id": next_track_id, "bbox": [random.uniform(0,0.8), random.uniform(0,0.8), random.uniform(0.2,1), random.uniform(0.2,1)]},
                    ))
                    next_track_id += 1

            elif self.role in ("billing", "operations"):
                depth = random.randint(0, 8)
                self._event_buffer.append(self._make_event(
                    "QUEUE_ALERT", timestamp,
                    queue={"depth": depth, "wait_time_estimate_seconds": depth * 45},
                ))

            # Flush every 5 events
            if len(self._event_buffer) >= 5:
                await self._flush_events()

            await asyncio.sleep(random.uniform(1.5, 4.0))

    def _run_analysers(self, tracks, timestamp: str, w: int, h: int) -> list:
        events = []

        if self.role == "entry_exit":
            events += self.entry_exit.analyze(tracks, timestamp, self.camera_id)
        elif self.role == "browsing":
            events += self.dwell.analyze(tracks, timestamp, self.camera_id)
        elif self.role in ("billing", "operations"):
            events += self.queue.analyze(tracks, timestamp, self.camera_id)

        events += self.crowd.analyze(tracks, timestamp, self.camera_id)
        return events

    def _make_event(self, event_type: str, timestamp: str, **payload) -> dict:
        merged_payload = {}

        for value in payload.values():
            if isinstance(value, dict):
                merged_payload.update(value)

        return {
            "event_type": event_type,
            "camera_id": self.camera_id,
            "timestamp": timestamp,
            "ai_meta": {
                "model_version": "simulation-v1",
                "inference_ms": random.randint(8, 25),
            },
            "payload": merged_payload,
        }

    async def _flush_events(self):
        if not self._event_buffer:
            return
        batch = list(self._event_buffer)
        self._event_buffer.clear()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.backend_url}/api/events/ingest",
                    json=batch,
                )
                if resp.status_code not in (200, 201):
                    print(f"[{self.camera_id}] Backend rejected batch: {resp.status_code} {resp.text[:200]}")
                else:
                    print(f"[{self.camera_id}] Flushed {len(batch)} events → backend")
        except Exception as e:
            print(f"[{self.camera_id}] Flush error: {e}")
