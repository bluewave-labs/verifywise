from pydantic import BaseModel, Field
from typing import Optional, List


class WatermarkSettings(BaseModel):
    """Settings for watermark embedding."""
    strength: float = Field(default=0.2, ge=0.1, le=0.5, description="Watermark strength (0.1-0.5)")
    message: Optional[str] = Field(default=None, description="Optional custom message to embed")
    model_identifier: Optional[str] = Field(default=None, description="AI model identifier for provenance")


class EmbedResponse(BaseModel):
    """Response from watermark embedding."""
    success: bool
    output_bytes: str  # Base64 encoded
    format: str
    width: int
    height: int
    processing_time_ms: int


class DetectResult(BaseModel):
    """Result of watermark detection."""
    has_watermark: bool
    confidence: float = Field(ge=0.0, le=1.0)
    message_bits: Optional[List[float]] = None


class DetectResponse(BaseModel):
    """Response from watermark detection."""
    success: bool
    result: DetectResult
    processing_time_ms: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
