"""
EntryExitAnalyzer
Detects when a tracked person crosses a horizontal virtual line.

Implementation: centroid crossing detection.
- A track's centroid is computed from its bbox.
- We maintain per-track the last known side of the line (above/below).
- A crossing is detected when the side flips.
- Entry = top → bottom crossing (person enters store from street side).
- Exit  = bottom → top crossing.

Trade-off: Virtual line in Y-axis only. Works for a single camera with the
entrance perpendicular to the camera. Real deployments would use
perspective-corrected 3D homography lines.
"""
import time


class EntryExitAnalyzer:
    def __init__(self, entry_line_y: float = 0.5):
        """
        :param entry_line_y: normalised Y coordinate of the entry line (0=top, 1=bottom)
        """
        self.entry_line_y = entry_line_y
        self._track_sides: dict[int, str] = {}   # track_id → 'above' | 'below'
        self._track_first_seen: dict[int, float] = {}

    def analyze(self, tracks: list, timestamp: str, camera_id: str) -> list[dict]:
        events = []

        for track in tracks:
            tid = track.track_id
            cx = (track.bbox[0] + track.bbox[2]) / 2
            cy = (track.bbox[1] + track.bbox[3]) / 2

            current_side = 'below' if cy >= self.entry_line_y else 'above'

            if tid not in self._track_sides:
                self._track_sides[tid] = current_side
                self._track_first_seen[tid] = time.time()
                continue

            prev_side = self._track_sides[tid]
            if prev_side != current_side:
                event_type = 'ENTRY' if prev_side == 'above' else 'EXIT'
                events.append({
                    "event_type": event_type,
                    "camera_id": camera_id,
                    "timestamp": timestamp,
                    "payload": {
                        "track_id": tid,
                        "bbox": track.bbox,
                        "confidence": track.confidence,
                    },
                    "ai_meta": {"model_version": "yolov8n", "inference_ms": 0},
                })
                self._track_sides[tid] = current_side

        # Prune stale tracks (not seen for >30s)
        current_time = time.time()
        stale = [t for t, ts in self._track_first_seen.items()
                 if current_time - ts > 30 and t not in {tr.track_id for tr in tracks}]
        for t in stale:
            self._track_sides.pop(t, None)
            self._track_first_seen.pop(t, None)

        return events
