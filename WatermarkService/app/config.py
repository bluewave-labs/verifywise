import os

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

# Watermark settings
DEFAULT_WATERMARK_STRENGTH = float(os.getenv("DEFAULT_WATERMARK_STRENGTH", "0.2"))
WATERMARK_MODEL = os.getenv("WATERMARK_MODEL", "pixelseal")  # pixelseal, chunkyseal, videoseal

# File settings
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "100"))
TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/watermarked")

# Ensure temp directory exists
os.makedirs(TEMP_DIR, exist_ok=True)
