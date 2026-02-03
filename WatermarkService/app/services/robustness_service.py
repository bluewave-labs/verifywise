"""
Robustness Testing Service

Tests watermark survival against various image transformations
to verify EU AI Act Article 50 compliance robustness requirements.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from PIL import Image
import io
import base64


@dataclass
class TransformationResult:
    """Result of a single transformation test."""
    transformation_type: str
    parameters: Dict[str, Any]
    watermark_detected: bool
    confidence: float
    confidence_loss: float  # Percentage loss from original
    passed: bool  # True if confidence still above threshold


@dataclass
class RobustnessTestResult:
    """Complete robustness test result."""
    original_confidence: float
    transformations_tested: int
    transformations_passed: int
    overall_robustness_score: float  # 0-1 score
    results: List[TransformationResult]
    is_robust: bool  # True if passes minimum requirements


# Minimum confidence threshold for a watermark to be considered "detected"
DETECTION_THRESHOLD = 0.5

# Minimum robustness score for Article 50 compliance
MIN_ROBUSTNESS_SCORE = 0.7


def apply_jpeg_compression(image_bytes: bytes, quality: int) -> bytes:
    """Apply JPEG compression to image."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode == "RGBA":
        img = img.convert("RGB")

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=quality)
    return output.getvalue()


def apply_resize(image_bytes: bytes, scale: float) -> bytes:
    """Resize image by scale factor."""
    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    new_width = int(img.width * scale)
    new_height = int(img.height * scale)

    resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Resize back to original size
    resized = resized.resize((img.width, img.height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    if resized.mode == "RGBA" and original_format == "JPEG":
        resized = resized.convert("RGB")
    resized.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_crop(image_bytes: bytes, crop_percent: float) -> bytes:
    """Crop image by percentage from each edge."""
    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    margin_x = int(img.width * crop_percent / 2)
    margin_y = int(img.height * crop_percent / 2)

    cropped = img.crop((
        margin_x,
        margin_y,
        img.width - margin_x,
        img.height - margin_y
    ))

    # Resize back to original size
    cropped = cropped.resize((img.width, img.height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    if cropped.mode == "RGBA" and original_format == "JPEG":
        cropped = cropped.convert("RGB")
    cropped.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_rotation(image_bytes: bytes, degrees: float) -> bytes:
    """Rotate image and rotate back."""
    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    # Rotate and rotate back (simulates screenshot/re-encoding)
    rotated = img.rotate(degrees, expand=False, fillcolor=(255, 255, 255))
    rotated = rotated.rotate(-degrees, expand=False, fillcolor=(255, 255, 255))

    output = io.BytesIO()
    if rotated.mode == "RGBA" and original_format == "JPEG":
        rotated = rotated.convert("RGB")
    rotated.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_brightness(image_bytes: bytes, factor: float) -> bytes:
    """Adjust image brightness."""
    from PIL import ImageEnhance

    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    enhancer = ImageEnhance.Brightness(img)
    adjusted = enhancer.enhance(factor)

    output = io.BytesIO()
    if adjusted.mode == "RGBA" and original_format == "JPEG":
        adjusted = adjusted.convert("RGB")
    adjusted.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_contrast(image_bytes: bytes, factor: float) -> bytes:
    """Adjust image contrast."""
    from PIL import ImageEnhance

    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    enhancer = ImageEnhance.Contrast(img)
    adjusted = enhancer.enhance(factor)

    output = io.BytesIO()
    if adjusted.mode == "RGBA" and original_format == "JPEG":
        adjusted = adjusted.convert("RGB")
    adjusted.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_gaussian_noise(image_bytes: bytes, intensity: float) -> bytes:
    """Add Gaussian noise to image."""
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    # Convert to numpy array
    img_array = np.array(img, dtype=np.float32)

    # Add noise
    noise = np.random.normal(0, intensity * 255, img_array.shape)
    noisy = np.clip(img_array + noise, 0, 255).astype(np.uint8)

    # Convert back to PIL Image
    noisy_img = Image.fromarray(noisy)

    output = io.BytesIO()
    if noisy_img.mode == "RGBA" and original_format == "JPEG":
        noisy_img = noisy_img.convert("RGB")
    noisy_img.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_blur(image_bytes: bytes, radius: float) -> bytes:
    """Apply Gaussian blur to image."""
    from PIL import ImageFilter

    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))

    output = io.BytesIO()
    if blurred.mode == "RGBA" and original_format == "JPEG":
        blurred = blurred.convert("RGB")
    blurred.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


def apply_format_conversion(image_bytes: bytes, target_format: str) -> bytes:
    """Convert image to different format and back."""
    img = Image.open(io.BytesIO(image_bytes))
    original_format = img.format or "PNG"

    # Convert to target format
    temp = io.BytesIO()
    if img.mode == "RGBA" and target_format in ["JPEG", "WEBP"]:
        img = img.convert("RGB")
    img.save(temp, format=target_format, quality=95 if target_format == "JPEG" else 100)

    # Convert back to original format
    temp.seek(0)
    converted = Image.open(temp)

    output = io.BytesIO()
    if converted.mode == "RGBA" and original_format == "JPEG":
        converted = converted.convert("RGB")
    converted.save(output, format=original_format if original_format in ["PNG", "JPEG"] else "PNG")
    return output.getvalue()


# Standard transformation test suite
TRANSFORMATION_TESTS = [
    # JPEG compression (most common attack)
    {"type": "jpeg_compression", "func": apply_jpeg_compression, "params": {"quality": 90}, "name": "JPEG Q90"},
    {"type": "jpeg_compression", "func": apply_jpeg_compression, "params": {"quality": 75}, "name": "JPEG Q75"},
    {"type": "jpeg_compression", "func": apply_jpeg_compression, "params": {"quality": 50}, "name": "JPEG Q50"},

    # Resizing
    {"type": "resize", "func": apply_resize, "params": {"scale": 0.75}, "name": "Resize 75%"},
    {"type": "resize", "func": apply_resize, "params": {"scale": 0.5}, "name": "Resize 50%"},

    # Cropping
    {"type": "crop", "func": apply_crop, "params": {"crop_percent": 0.1}, "name": "Crop 10%"},
    {"type": "crop", "func": apply_crop, "params": {"crop_percent": 0.2}, "name": "Crop 20%"},

    # Rotation
    {"type": "rotation", "func": apply_rotation, "params": {"degrees": 5}, "name": "Rotate 5°"},

    # Color adjustments
    {"type": "brightness", "func": apply_brightness, "params": {"factor": 1.2}, "name": "Brightness +20%"},
    {"type": "brightness", "func": apply_brightness, "params": {"factor": 0.8}, "name": "Brightness -20%"},
    {"type": "contrast", "func": apply_contrast, "params": {"factor": 1.2}, "name": "Contrast +20%"},

    # Noise
    {"type": "noise", "func": apply_gaussian_noise, "params": {"intensity": 0.02}, "name": "Light Noise"},

    # Blur
    {"type": "blur", "func": apply_blur, "params": {"radius": 1.0}, "name": "Light Blur"},

    # Format conversion
    {"type": "format", "func": apply_format_conversion, "params": {"target_format": "WEBP"}, "name": "PNG→WebP→PNG"},
]


def run_robustness_test(
    watermarked_image_bytes: bytes,
    detect_func,
    test_suite: Optional[List[Dict]] = None
) -> RobustnessTestResult:
    """
    Run comprehensive robustness tests on a watermarked image.

    Args:
        watermarked_image_bytes: The watermarked image to test
        detect_func: Function to detect watermark, returns {"has_watermark": bool, "confidence": float}
        test_suite: Optional custom test suite, defaults to TRANSFORMATION_TESTS

    Returns:
        RobustnessTestResult with detailed test results
    """
    if test_suite is None:
        test_suite = TRANSFORMATION_TESTS

    # First, detect watermark in original image
    original_result = detect_func(watermarked_image_bytes)
    original_confidence = original_result.get("confidence", 0.0)

    results = []
    passed_count = 0

    for test in test_suite:
        try:
            # Apply transformation
            transformed_bytes = test["func"](watermarked_image_bytes, **test["params"])

            # Detect watermark in transformed image
            detect_result = detect_func(transformed_bytes)
            confidence = detect_result.get("confidence", 0.0)
            has_watermark = detect_result.get("has_watermark", False)

            # Calculate confidence loss
            confidence_loss = ((original_confidence - confidence) / original_confidence * 100) if original_confidence > 0 else 100

            # Check if passed (still detectable above threshold)
            passed = confidence >= DETECTION_THRESHOLD and has_watermark
            if passed:
                passed_count += 1

            results.append(TransformationResult(
                transformation_type=test["type"],
                parameters={"name": test["name"], **test["params"]},
                watermark_detected=has_watermark,
                confidence=confidence,
                confidence_loss=max(0, confidence_loss),
                passed=passed,
            ))

        except Exception as e:
            # If transformation fails, consider it failed
            results.append(TransformationResult(
                transformation_type=test["type"],
                parameters={"name": test["name"], **test["params"], "error": str(e)},
                watermark_detected=False,
                confidence=0.0,
                confidence_loss=100.0,
                passed=False,
            ))

    # Calculate overall robustness score
    total_tests = len(results)
    robustness_score = passed_count / total_tests if total_tests > 0 else 0.0

    return RobustnessTestResult(
        original_confidence=original_confidence,
        transformations_tested=total_tests,
        transformations_passed=passed_count,
        overall_robustness_score=robustness_score,
        results=results,
        is_robust=robustness_score >= MIN_ROBUSTNESS_SCORE,
    )


def run_quick_robustness_test(
    watermarked_image_bytes: bytes,
    detect_func
) -> RobustnessTestResult:
    """
    Run a quick robustness test with essential transformations only.

    Tests: JPEG Q75, Resize 75%, Crop 10%, Brightness adjustment
    """
    quick_tests = [
        {"type": "jpeg_compression", "func": apply_jpeg_compression, "params": {"quality": 75}, "name": "JPEG Q75"},
        {"type": "resize", "func": apply_resize, "params": {"scale": 0.75}, "name": "Resize 75%"},
        {"type": "crop", "func": apply_crop, "params": {"crop_percent": 0.1}, "name": "Crop 10%"},
        {"type": "brightness", "func": apply_brightness, "params": {"factor": 1.2}, "name": "Brightness +20%"},
    ]
    return run_robustness_test(watermarked_image_bytes, detect_func, quick_tests)
