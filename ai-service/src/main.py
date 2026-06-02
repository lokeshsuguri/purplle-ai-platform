"""
Purplle AI Engine — FastAPI entry point.

Architecture decision:
- FastAPI (not Flask) for async compatibility and auto-docs.
- One endpoint: POST /analyze  — accepts a video file path + camera metadata.
  The backend calls this after receiving a video upload or on a schedule.
- Video is processed frame-by-frame; results batched and POSTed to backend.
- YOLOv8n (nano) chosen for speed on CPU; swap to yolov8s/m for GPU.

Processing pipeline per camera:
  VideoCapture → frame sampling (every Nth frame) → YOLO inference
  → ByteTrack ID assignment → business rule analysers → event batch
  → POST /api/events/ingest on backend
"""
import asyncio
import os
from contextlib import asynccontextmanager

import uvicorn
import dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel

from src.pipeline import CameraProcessor
from src.model_utils import ensure_yolov8_model

dotenv.load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🟣 Purplle AI Engine starting up")
    # Ensure YOLOv8 model is available
    try:
        ensure_yolov8_model()
        print("✅ YOLOv8n model ready")
    except Exception as e:
        print(f"⚠️  Model initialization: {e}")
    yield
    print("AI Engine shutting down")


app = FastAPI(
    title="Purplle AI Engine",
    description="YOLOv8 + OpenCV store intelligence service",
    version="1.0.0",
    lifespan=lifespan,
)


class AnalyzeRequest(BaseModel):
    video_path: str
    camera_id: str
    frame_skip: int = 3      # process every Nth frame (speed vs accuracy)
    simulate: bool = False   # generate synthetic events when no video available


@app.get("/health")
def health():
    return {"status": "healthy", "model": "yolov8n", "backend": BACKEND_URL}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Kicks off video analysis in the background.
    Returns immediately with a job_id; the job posts events to the backend as it goes.
    """
    processor = CameraProcessor(
        camera_id=request.camera_id,
        backend_url=BACKEND_URL,
        frame_skip=request.frame_skip,
        simulate=request.simulate,
    )
    background_tasks.add_task(processor.run, request.video_path)
    return {"status": "processing", "camera_id": request.camera_id}


@app.post("/analyze/all-cameras")
async def analyze_all(background_tasks: BackgroundTasks):
    """
    Convenience endpoint: spawn simulated analysis for all 5 cameras.
    Useful for demo / hackathon judges.
    """
    CAMERAS = ["CAM1", "CAM2", "CAM3", "CAM4", "CAM5"]
    for cam in CAMERAS:
        proc = CameraProcessor(camera_id=cam, backend_url=BACKEND_URL, simulate=True)
        background_tasks.add_task(proc.run, "")
    return {"status": "started", "cameras": CAMERAS}


if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "8000"))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=False)
