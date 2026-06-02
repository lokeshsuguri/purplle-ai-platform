"""
PersonDetector — wraps YOLOv8 inference.

Model: yolov8n (nano) — best speed/accuracy for CPU.
Only class 0 (person) is returned.
Results normalised to [0,1] bounding boxes for camera-resolution independence.
"""
import numpy as np

try:
    from ultralytics import YOLO
    _YOLO_AVAILABLE = True
except ImportError:
    _YOLO_AVAILABLE = False
    print("⚠  ultralytics not installed — PersonDetector in stub mode")


class Detection:
    __slots__ = ("bbox", "confidence", "class_id")

    def __init__(self, bbox: list[float], confidence: float, class_id: int = 0):
        self.bbox = bbox              # [x1, y1, x2, y2] normalised 0-1
        self.confidence = confidence
        self.class_id = class_id


class PersonDetector:
    PERSON_CLASS = 0
    CONF_THRESHOLD = 0.4
    IOU_THRESHOLD = 0.45

    def __init__(self, model_path: str = "yolov8n.pt"):
        self.model = None
        if _YOLO_AVAILABLE:
            try:
                self.model = YOLO(model_path)
                self.model.fuse()  # fuse Conv+BN for 10-15% speed-up
                print(f"✅ YOLOv8 model loaded: {model_path}")
            except Exception as e:
                print(f"⚠  YOLO load failed: {e} — running in stub mode")

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """
        Run inference on a BGR frame. Returns list of Detection objects.
        Falls back to empty list if model unavailable.
        """
        if self.model is None:
            return self._stub_detections()

        h, w = frame.shape[:2]
        results = self.model(
            frame,
            conf=self.CONF_THRESHOLD,
            iou=self.IOU_THRESHOLD,
            classes=[self.PERSON_CLASS],
            verbose=False,
        )

        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                detections.append(Detection(
                    bbox=[x1 / w, y1 / h, x2 / w, y2 / h],
                    confidence=conf,
                ))
        return detections

    def _stub_detections(self) -> list[Detection]:
        """Return 1-3 fake detections for testing without a model."""
        import random
        n = random.randint(0, 3)
        return [
            Detection(
                bbox=[random.uniform(0, 0.7), random.uniform(0, 0.7),
                      random.uniform(0.3, 1.0), random.uniform(0.3, 1.0)],
                confidence=random.uniform(0.5, 0.98),
            )
            for _ in range(n)
        ]
