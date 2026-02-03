import videoseal
import torch
import torchvision.transforms as T
from PIL import Image
import tempfile
import os
import base64
from io import BytesIO

from app.config import TEMP_DIR, WATERMARK_MODEL


class ImageWatermarker:
    """Handles image watermark embedding and detection using PixelSeal."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        """Lazy load the model on first use."""
        if self._model is None:
            print(f"Loading watermark model: {WATERMARK_MODEL}")
            self._model = videoseal.load(WATERMARK_MODEL)
            print("Model loaded successfully")
        return self._model

    @property
    def model(self):
        return self._load_model()

    def embed(self, image_bytes: bytes, settings: dict = None) -> dict:
        """
        Embed an invisible watermark into an image.

        Args:
            image_bytes: Raw image bytes
            settings: Optional dict with:
                - strength: float (0.1-0.5, default 0.2)
                - message: str (optional custom message)

        Returns:
            dict with:
                - success: bool
                - output_bytes: base64 encoded watermarked image
                - format: output format (PNG)
        """
        settings = settings or {}

        # Load image
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        original_size = img.size
        img_tensor = T.ToTensor()(img).unsqueeze(0)

        # Apply watermark strength if specified
        strength = settings.get("strength", 0.2)
        self.model.blender.scaling_w = strength

        # Embed watermark
        with torch.no_grad():
            outputs = self.model.embed(img_tensor)

        # Convert back to image
        watermarked_tensor = outputs["imgs_w"][0]
        watermarked_img = T.ToPILImage()(watermarked_tensor)

        # Resize back to original if needed
        if watermarked_img.size != original_size:
            watermarked_img = watermarked_img.resize(original_size, Image.LANCZOS)

        # Convert to bytes
        output_buffer = BytesIO()
        watermarked_img.save(output_buffer, format="PNG")
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
        Detect if an image contains a watermark.

        Args:
            image_bytes: Raw image bytes

        Returns:
            dict with:
                - has_watermark: bool
                - confidence: float (0-1)
                - message_bits: list of floats if watermark detected
        """
        # Load image
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_tensor = T.ToTensor()(img).unsqueeze(0)

        # Detect watermark
        with torch.no_grad():
            detected = self.model.detect(img_tensor)

        # Extract results
        preds = detected["preds"][0]
        confidence = preds[0].item()
        has_watermark = confidence > 0.5

        result = {
            "has_watermark": has_watermark,
            "confidence": round(confidence, 4),
        }

        # Extract message bits if watermark detected
        if has_watermark and len(preds) > 1:
            message_bits = (preds[1:] > 0).float().tolist()
            result["message_bits"] = message_bits

        return result


# Singleton instance
_watermarker = None

def get_image_watermarker() -> ImageWatermarker:
    """Get the singleton ImageWatermarker instance."""
    global _watermarker
    if _watermarker is None:
        _watermarker = ImageWatermarker()
    return _watermarker
