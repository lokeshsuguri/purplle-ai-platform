"""Dwell time analyser."""
import time


class DwellAnalyzer:
    def __init__(self, min_dwell_seconds: int = 5, zone_map: dict | None = None):
        self.min_dwell = min_dwell_seconds
        self._track_entry: dict[int, float] = {}   # track_id → entry timestamp
        self._track_zone: dict[int, str] = {}
        # Default zone map — maps Y position to store zone
        self.zone_map = zone_map or {
            "top_third": "aisle_haircare",
            "mid_third": "aisle_skincare",
            "bot_third": "aisle_makeup",
        }

    def _bbox_to_zone(self, bbox: list) -> str:
        cy = (bbox[1] + bbox[3]) / 2
        if cy < 0.33:
            return self.zone_map["top_third"]
        elif cy < 0.67:
            return self.zone_map["mid_third"]
        return self.zone_map["bot_third"]

    def analyze(self, tracks: list, timestamp: str, camera_id: str) -> list[dict]:
        events = []
        now = time.time()
        current_ids = {t.track_id for t in tracks}

        # New tracks — record entry time
        for track in tracks:
            if track.track_id not in self._track_entry:
                self._track_entry[track.track_id] = now
                self._track_zone[track.track_id] = self._bbox_to_zone(track.bbox)

        # Tracks that left — compute dwell
        departed = set(self._track_entry.keys()) - current_ids
        for tid in departed:
            dwell = now - self._track_entry[tid]
            if dwell >= self.min_dwell:
                events.append({
                    "event_type": "DWELL_TIME",
                    "camera_id": camera_id,
                    "timestamp": timestamp,
                    "payload": {
                        "track_id": tid,
                        "duration_seconds": round(dwell),
                        "zone": self._track_zone.get(tid, "general"),
                        "bbox": [],
                    },
                    "ai_meta": {"model_version": "yolov8n"},
                })
            del self._track_entry[tid]
            self._track_zone.pop(tid, None)

        return events
