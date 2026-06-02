"""
TrackerManager — wraps supervision's ByteTrack implementation.

ByteTrack chosen over DeepSORT because:
- No Re-ID feature extractor needed (no GPU requirement)
- Handles partial occlusions well (uses low-confidence detections in second pass)
- Stable IDs across frame gaps — important for dwell time calculation

Output: list of Track objects with .track_id and .bbox
"""
import numpy as np

try:
    import supervision as sv
    _SV_AVAILABLE = True
except ImportError:
    _SV_AVAILABLE = False
    print("⚠  supervision not installed — TrackerManager in stub mode")


class Track:
    __slots__ = ("track_id", "bbox", "confidence")

    def __init__(self, track_id: int, bbox: list[float], confidence: float = 1.0):
        self.track_id = track_id
        self.bbox = bbox   # [x1, y1, x2, y2] normalised
        self.confidence = confidence


class TrackerManager:
    def __init__(self):
        self._tracker = None
        if _SV_AVAILABLE:
            self._tracker = sv.ByteTrack(
                track_activation_threshold=0.3,
                lost_track_buffer=30,
                minimum_matching_threshold=0.8,
                frame_rate=10,   # matches our processing fps after frame_skip
            )

    def update(self, detections, frame=None) -> list[Track]:
        """
        Updates the tracker with new detections.
        Returns list of Track objects with stable IDs.
        """
        if not detections:
            return []

        if self._tracker is None:
            return self._stub_tracks(detections)

        try:
            # Convert our Detection objects → supervision Detections format
            bboxes = np.array([[d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3]] for d in detections])
            confs = np.array([d.confidence for d in detections])
            class_ids = np.zeros(len(detections), dtype=int)

            sv_dets = sv.Detections(
                xyxy=bboxes,
                confidence=confs,
                class_id=class_ids,
            )
            tracked = self._tracker.update_with_detections(sv_dets)

            tracks = []
            for i, (bbox, tid) in enumerate(zip(tracked.xyxy, tracked.tracker_id)):
                tracks.append(Track(
                    track_id=int(tid),
                    bbox=bbox.tolist(),
                    confidence=float(tracked.confidence[i]) if tracked.confidence is not None else 1.0,
                ))
            return tracks
        except Exception as e:
            print(f"Tracker update error: {e}")
            return self._stub_tracks(detections)

    def _stub_tracks(self, detections) -> list[Track]:
        return [
            Track(track_id=i + 1, bbox=d.bbox, confidence=d.confidence)
            for i, d in enumerate(detections)
        ]
