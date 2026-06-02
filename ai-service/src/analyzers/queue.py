"""Queue depth analyser — counts persons in a defined zone."""
import time


class QueueAnalyzer:
    EMIT_INTERVAL = 15  # emit queue depth every N seconds

    def __init__(self, queue_zone: tuple = (0.0, 0.5, 1.0, 1.0), threshold: int = 5):
        """
        :param queue_zone: (x1, y1, x2, y2) normalised ROI for queue counting
        :param threshold:  person count that triggers an alert
        """
        self.zone = queue_zone
        self.threshold = threshold
        self._last_emit = 0.0

    def _in_zone(self, bbox: list) -> bool:
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        return (self.zone[0] <= cx <= self.zone[2] and
                self.zone[1] <= cy <= self.zone[3])

    def analyze(self, tracks: list, timestamp: str, camera_id: str) -> list[dict]:
        now = time.time()
        if now - self._last_emit < self.EMIT_INTERVAL:
            return []

        depth = sum(1 for t in tracks if self._in_zone(t.bbox))
        self._last_emit = now

        return [{
            "event_type": "QUEUE_ALERT",
            "camera_id": camera_id,
            "timestamp": timestamp,
            "payload": {
                "depth": depth,
                "wait_time_estimate_seconds": depth * 45,
            },
            "ai_meta": {"model_version": "yolov8n"},
        }]


class CrowdAnalyzer:
    """
    Emits CROWD_ALERT when track count exceeds threshold.
    Cooldown prevents alert spam.
    """
    COOLDOWN = 60  # seconds

    def __init__(self, threshold: int = 10):
        self.threshold = threshold
        self._last_alert = 0.0

    def analyze(self, tracks: list, timestamp: str, camera_id: str) -> list[dict]:
        now = time.time()
        if len(tracks) < self.threshold:
            return []
        if now - self._last_alert < self.COOLDOWN:
            return []

        self._last_alert = now
        severity = "HIGH" if len(tracks) >= self.threshold * 1.5 else "MEDIUM"
        return [{
            "event_type": "CROWD_ALERT",
            "camera_id": camera_id,
            "timestamp": timestamp,
            "payload": {
                "current_count": len(tracks),
                "threshold": self.threshold,
                "severity": severity,
            },
            "ai_meta": {"model_version": "yolov8n"},
        }]
