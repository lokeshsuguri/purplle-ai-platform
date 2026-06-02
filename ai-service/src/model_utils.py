"""
Model Download Utility
Downloads YOLOv8n model on first run if not present.
"""

import os
from pathlib import Path
import sys

def ensure_yolov8_model(model_path: str = "yolov8n.pt") -> str:
    """
    Ensure YOLOv8n model is available.
    Downloads from Ultralytics if not present.
    
    Args:
        model_path: Path where model should be stored
        
    Returns:
        Path to the model file
    """
    model_file = Path(model_path)
    
    # If model exists, use it
    if model_file.exists():
        print(f"✅ Model found: {model_path}")
        return str(model_file)
    
    # Download model
    print(f"📦 Model not found. Downloading YOLOv8n...")
    try:
        from ultralytics import YOLO
        
        # Download and cache model
        model = YOLO("yolov8n.pt")
        
        print(f"✅ Model downloaded successfully")
        return str(model_file)
    except Exception as e:
        print(f"❌ Failed to download model: {e}")
        print("\nManual Download:")
        print("  wget https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt")
        print("  or")
        print("  curl -L https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt -o yolov8n.pt")
        sys.exit(1)

if __name__ == "__main__":
    # Test model availability
    model_path = ensure_yolov8_model()
    print(f"Model ready at: {model_path}")
