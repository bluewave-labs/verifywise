"""
Mock Image Watermarker for local testing.

This provides a mock implementation that simulates watermark embedding and detection
without requiring videoseal/decord dependencies that may not be available on all platforms.
"""

import base64
from io import BytesIO
from PIL import Image
import hashlib
import random


class MockImageWatermarker:
    """Mock watermarker for local testing."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        """Simulate model loading."""
        if self._model is None:
            print("Loading mock watermark model...")
            self._model = {"name": "mock-model", "loaded": True}
            print("Mock model loaded successfully")
        return self._model

    @property
    def model(self):
        return self._load_model()

    def embed(self, image_bytes: bytes, settings: dict = None) -> dict:
        """
        Mock embed - returns the same image with simulated watermark.

        In production, this would use videoseal to embed an invisible watermark.
        For testing, we just pass through the image with slight modification.
        """
        settings = settings or {}

        # Load image
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        original_size = img.size

        # Simulate watermark by slightly modifying pixel values (imperceptible)
        # This is just for testing - real watermark uses ML model
        pixels = img.load()
        strength = settings.get("strength", 0.2)

        # Add a very subtle modification to prove the image was processed
        # Real watermark would be embedded in frequency domain
        for i in range(min(10, img.width)):
            for j in range(min(10, img.height)):
                r, g, b = pixels[i, j]
                # XOR with a pattern based on strength (virtually invisible)
                pixels[i, j] = (r ^ 1, g, b)

        # Convert to bytes
        output_buffer = BytesIO()
        img.save(output_buffer, format="PNG")
        output_bytes = output_buffer.getvalue()

        return {
            "success": True,
            "output_bytes": base64.b64encode(output_bytes).decode("utf-8"),
            "format": "png",
            "width": original_size[0],
            "height": original_size[1],
        }

    def detect(self, image_bytes: bytes) -> dict:
        """
        Mock detect - simulates watermark detection.

        In production, this would use videoseal to detect embedded watermarks.
        For testing, we return a deterministic result based on image hash.
        """
        # Load image to verify it's valid
        img = Image.open(BytesIO(image_bytes)).convert("RGB")

        # Create a deterministic "detection" based on image content
        # This simulates detection - images that were "watermarked" by our mock
        # will have the XOR pattern we applied
        pixels = img.load()

        # Check for our mock watermark pattern
        has_pattern = False
        if img.width >= 10 and img.height >= 10:
            # Check if first few pixels have our XOR pattern (odd values in R channel)
            odd_count = sum(1 for i in range(10) for j in range(10) if pixels[i, j][0] % 2 == 1)
            has_pattern = odd_count > 50  # If most pixels have odd R values

        # Generate a plausible confidence based on the pattern
        if has_pattern:
            confidence = random.uniform(0.85, 0.98)
            has_watermark = True
        else:
            confidence = random.uniform(0.05, 0.25)
            has_watermark = False

        result = {
            "has_watermark": has_watermark,
            "confidence": round(confidence, 4),
        }

        return result


# Singleton instance
_watermarker = None


def get_mock_watermarker() -> MockImageWatermarker:
    """Get the singleton MockImageWatermarker instance."""
    global _watermarker
    if _watermarker is None:
        _watermarker = MockImageWatermarker()
    return _watermarker
