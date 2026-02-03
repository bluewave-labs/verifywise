from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import time
import json
import base64

from app.config import HOST, PORT, MAX_IMAGE_SIZE_MB

# Try to import real watermarker, fall back to mock for local testing
try:
    from app.services.image_watermark import get_image_watermarker
    USE_MOCK = False
except ImportError as e:
    print(f"videoseal not available ({e}), using mock watermarker for testing")
    from app.services.mock_watermark import get_mock_watermarker as get_image_watermarker
    USE_MOCK = True

# C2PA service for Content Credentials
from app.services.c2pa_service import (
    create_and_embed_manifest,
    verify_manifest,
    extract_manifest,
    C2PAManifestOptions,
    LegacyAIProvenance as AIProvenance,
    # New real C2PA service
    get_c2pa_service,
    create_content_credentials,
    verify_content_credentials,
    C2PA_AVAILABLE,
)

# Robustness testing service
from app.services.robustness_service import (
    run_robustness_test,
    run_quick_robustness_test,
    TransformationResult,
    RobustnessTestResult,
    DETECTION_THRESHOLD,
    MIN_ROBUSTNESS_SCORE,
)

from app.models.schemas import (
    EmbedResponse,
    DetectResponse,
    DetectResult,
    HealthResponse,
    ErrorResponse,
    WatermarkSettings,
)

# ============================================================================
# C2PA Request/Response Models
# ============================================================================

class C2PAManifestOptionsModel(BaseModel):
    """Options for C2PA manifest creation."""
    digital_source_type: str = Field(
        default="http://c2pa.org/digitalsourcetype/trainedAlgorithmicData"
    )
    allow_training: bool = False
    allow_mining: bool = False
    custom_assertions: List[Dict[str, Any]] = []


class AIProvenanceModel(BaseModel):
    """AI provenance metadata."""
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    provider: Optional[str] = None
    generation_prompt_hash: Optional[str] = None
    generation_timestamp: Optional[str] = None


class C2PACreateRequest(BaseModel):
    """Request for creating C2PA manifest."""
    image_base64: str
    file_name: str
    file_type: str
    options: C2PAManifestOptionsModel = C2PAManifestOptionsModel()
    provenance: AIProvenanceModel = AIProvenanceModel()


class C2PACreateResponse(BaseModel):
    """Response from C2PA manifest creation."""
    manifest_id: str
    instance_id: str
    content_hash: str
    signed_image_base64: str
    manifest_json: Dict[str, Any]


class C2PAVerifyRequest(BaseModel):
    """Request for verifying C2PA manifest."""
    image_base64: str


class C2PAVerifyResponse(BaseModel):
    """Response from C2PA manifest verification."""
    manifest_found: bool
    signature_valid: bool = False
    chain_verified: bool = False
    manifest_data: Optional[Dict[str, Any]] = None
    validation_errors: List[str] = []


class C2PAExtractRequest(BaseModel):
    """Request for extracting C2PA manifest."""
    image_base64: str


class C2PAExtractResponse(BaseModel):
    """Response from C2PA manifest extraction."""
    manifest: Optional[Dict[str, Any]] = None

app = FastAPI(
    title="VerifyWise Watermark Service",
    description="Content authenticity watermarking for EU AI Act compliance",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported image types
SUPPORTED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file."""
    if file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported: {', '.join(SUPPORTED_IMAGE_TYPES)}",
        )


@app.post("/embed", response_model=EmbedResponse)
async def embed_watermark(
    file: UploadFile = File(..., description="Image file to watermark"),
    settings: str = Form(default="{}", description="JSON settings: {strength, message, model_identifier}"),
):
    """
    Embed an invisible watermark into an image.

    The watermark is imperceptible to humans but can be detected algorithmically.
    This helps comply with EU AI Act Article 50 transparency requirements.
    """
    start_time = time.time()

    # Validate file type
    validate_image_file(file)

    # Parse settings
    try:
        settings_dict = json.loads(settings)
        parsed_settings = WatermarkSettings(**settings_dict)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid settings: {str(e)}")

    # Read file content
    content = await file.read()

    # Check file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: {MAX_IMAGE_SIZE_MB}MB",
        )

    try:
        # Get watermarker and embed
        watermarker = get_image_watermarker()
        result = watermarker.embed(content, parsed_settings.model_dump())

        processing_time = int((time.time() - start_time) * 1000)

        return EmbedResponse(
            success=True,
            output_bytes=result["output_bytes"],
            format=result["format"],
            width=result["width"],
            height=result["height"],
            processing_time_ms=processing_time,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark embedding failed: {str(e)}")


@app.post("/detect", response_model=DetectResponse)
async def detect_watermark(
    file: UploadFile = File(..., description="Image file to check for watermark"),
):
    """
    Detect if an image contains a watermark.

    Returns confidence score (0-1) indicating likelihood of watermark presence.
    """
    start_time = time.time()

    # Validate file type
    validate_image_file(file)

    # Read file content
    content = await file.read()

    # Check file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: {MAX_IMAGE_SIZE_MB}MB",
        )

    try:
        # Get watermarker and detect
        watermarker = get_image_watermarker()
        result = watermarker.detect(content)

        processing_time = int((time.time() - start_time) * 1000)

        return DetectResponse(
            success=True,
            result=DetectResult(
                has_watermark=result["has_watermark"],
                confidence=result["confidence"],
                message_bits=result.get("message_bits"),
            ),
            processing_time_ms=processing_time,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark detection failed: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status and whether the model is loaded.
    """
    try:
        watermarker = get_image_watermarker()
        model_loaded = watermarker._model is not None
    except Exception:
        model_loaded = False

    return HealthResponse(
        status="healthy",
        model_loaded=model_loaded,
        version="1.0.0" + ("-mock" if USE_MOCK else ""),
    )


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "VerifyWise Watermark Service",
        "version": "1.0.0",
        "eu_ai_act_compliant": True,
        "c2pa_library_available": C2PA_AVAILABLE,
        "endpoints": {
            "embed": "POST /embed - Embed watermark into image",
            "detect": "POST /detect - Detect watermark in image",
            "embed_article50": "POST /embed/article50 - Full Article 50 compliant embedding",
            "c2pa_create": "POST /c2pa/create - Create C2PA manifest (legacy)",
            "c2pa_verify": "POST /c2pa/verify - Verify C2PA manifest (legacy)",
            "c2pa_extract": "POST /c2pa/extract - Extract C2PA manifest",
            "c2pa_v2_create": "POST /c2pa/v2/create - Create real C2PA Content Credentials",
            "c2pa_v2_verify": "POST /c2pa/v2/verify - Verify real C2PA Content Credentials",
            "c2pa_certificate": "GET /c2pa/certificate - Get signing certificate info",
            "c2pa_status": "GET /c2pa/status - Get C2PA service status",
            "robustness_test": "POST /robustness/test - Test watermark robustness",
            "robustness_transform": "POST /robustness/transform - Test single transformation",
            "health": "GET /health - Service health check",
        },
    }


# ============================================================================
# C2PA Endpoints for EU AI Act Article 50 Compliance
# ============================================================================

@app.post("/c2pa/create", response_model=C2PACreateResponse)
async def create_c2pa_manifest(request: C2PACreateRequest):
    """
    Create and embed a C2PA Content Credentials manifest into an image.

    This adds machine-readable provenance metadata required by EU AI Act
    Article 50 for AI-generated content transparency.
    """
    start_time = time.time()

    try:
        # Decode image
        image_bytes = base64.b64decode(request.image_base64)

        # Create options and provenance objects
        options = C2PAManifestOptions(
            digital_source_type=request.options.digital_source_type,
            allow_training=request.options.allow_training,
            allow_mining=request.options.allow_mining,
            custom_assertions=request.options.custom_assertions,
        )

        provenance = AIProvenance(
            model_name=request.provenance.model_name,
            model_version=request.provenance.model_version,
            provider=request.provenance.provider,
            generation_prompt_hash=request.provenance.generation_prompt_hash,
            generation_timestamp=request.provenance.generation_timestamp,
        )

        # Create and embed manifest
        result = create_and_embed_manifest(image_bytes, options, provenance)

        return C2PACreateResponse(
            manifest_id=result.manifest_id,
            instance_id=result.instance_id,
            content_hash=result.content_hash,
            signed_image_base64=base64.b64encode(result.signed_image_bytes).decode("utf-8"),
            manifest_json=result.manifest_json,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"C2PA manifest creation failed: {str(e)}")


@app.post("/c2pa/verify", response_model=C2PAVerifyResponse)
async def verify_c2pa_manifest(request: C2PAVerifyRequest):
    """
    Verify a C2PA Content Credentials manifest in an image.

    Checks signature validity, chain verification, and extracts
    provenance metadata for Article 50 compliance verification.
    """
    try:
        image_bytes = base64.b64decode(request.image_base64)
        result = verify_manifest(image_bytes)

        return C2PAVerifyResponse(
            manifest_found=result.manifest_found,
            signature_valid=result.signature_valid,
            chain_verified=result.chain_verified,
            manifest_data=result.manifest_data,
            validation_errors=result.validation_errors,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"C2PA verification failed: {str(e)}")


@app.post("/c2pa/extract", response_model=C2PAExtractResponse)
async def extract_c2pa_manifest(request: C2PAExtractRequest):
    """
    Extract C2PA manifest without full verification.

    Faster than full verification, useful for quick manifest inspection.
    """
    try:
        image_bytes = base64.b64decode(request.image_base64)
        manifest = extract_manifest(image_bytes)

        return C2PAExtractResponse(manifest=manifest)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"C2PA extraction failed: {str(e)}")


# ============================================================================
# Certificate Management Endpoints
# ============================================================================

class CertificateInfoResponse(BaseModel):
    """Response containing certificate information."""
    fingerprint: str
    subject: str
    issuer: str
    not_before: str
    not_after: str
    serial_number: str
    organization: str
    c2pa_available: bool


@app.get("/c2pa/certificate", response_model=CertificateInfoResponse)
async def get_certificate_info():
    """
    Get information about the current C2PA signing certificate.

    Returns certificate details including fingerprint, validity period,
    and whether the real c2pa-python library is available.
    """
    try:
        service = get_c2pa_service()
        info = service.get_certificate_info()

        return CertificateInfoResponse(
            fingerprint=info['fingerprint'],
            subject=info['subject'],
            issuer=info['issuer'],
            not_before=info['not_before'],
            not_after=info['not_after'],
            serial_number=info['serial_number'],
            organization=info['organization'],
            c2pa_available=info['c2pa_available'],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get certificate info: {str(e)}")


class C2PAStatusResponse(BaseModel):
    """Response containing C2PA service status."""
    c2pa_library_available: bool
    certificate_loaded: bool
    certificate_fingerprint: Optional[str] = None
    certificate_expires: Optional[str] = None
    signing_algorithm: str = "PS256"
    timestamp_server: str = "http://timestamp.digicert.com"


@app.get("/c2pa/status", response_model=C2PAStatusResponse)
async def get_c2pa_status():
    """
    Get C2PA service status including library availability and certificate status.
    """
    try:
        service = get_c2pa_service()
        cert_info = service.get_certificate_info()

        return C2PAStatusResponse(
            c2pa_library_available=C2PA_AVAILABLE,
            certificate_loaded=True,
            certificate_fingerprint=cert_info['fingerprint'],
            certificate_expires=cert_info['not_after'],
            signing_algorithm="PS256",
            timestamp_server="http://timestamp.digicert.com",
        )
    except Exception as e:
        return C2PAStatusResponse(
            c2pa_library_available=C2PA_AVAILABLE,
            certificate_loaded=False,
            signing_algorithm="PS256",
            timestamp_server="http://timestamp.digicert.com",
        )


# ============================================================================
# New Real C2PA Endpoints (using c2pa-python when available)
# ============================================================================

class RealC2PACreateRequest(BaseModel):
    """Request for creating real C2PA Content Credentials."""
    image_base64: str
    format: str = "png"  # png, jpeg, webp
    model_name: str
    model_version: str
    provider: str
    prompt_hash: Optional[str] = None
    title: Optional[str] = None


class RealC2PACreateResponse(BaseModel):
    """Response from real C2PA manifest creation."""
    manifest_id: str
    claim_generator: str
    signature_info: Dict[str, Any]
    assertions: List[Dict[str, Any]]
    is_ai_generated: bool
    created_at: str
    signed_image_base64: str
    using_real_c2pa: bool


@app.post("/c2pa/v2/create", response_model=RealC2PACreateResponse)
async def create_real_c2pa_manifest(request: RealC2PACreateRequest):
    """
    Create and embed C2PA Content Credentials using the real c2pa-python library.

    This endpoint uses proper X.509 certificate-based signing for production-ready
    Content Credentials that comply with EU AI Act Article 50.

    Falls back to mock implementation if c2pa-python is not installed.
    """
    start_time = time.time()

    try:
        # Decode image
        image_bytes = base64.b64decode(request.image_base64)

        # Create Content Credentials
        signed_data, credential_info = create_content_credentials(
            image_data=image_bytes,
            format=request.format,
            model_name=request.model_name,
            model_version=request.model_version,
            provider=request.provider,
            prompt_hash=request.prompt_hash,
            title=request.title,
        )

        return RealC2PACreateResponse(
            manifest_id=credential_info['manifest_id'],
            claim_generator=credential_info['claim_generator'],
            signature_info=credential_info['signature_info'],
            assertions=credential_info['assertions'],
            is_ai_generated=credential_info['is_ai_generated'],
            created_at=credential_info['created_at'],
            signed_image_base64=base64.b64encode(signed_data).decode('utf-8'),
            using_real_c2pa=C2PA_AVAILABLE,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"C2PA v2 creation failed: {str(e)}")


class RealC2PAVerifyRequest(BaseModel):
    """Request for verifying real C2PA Content Credentials."""
    image_base64: str
    format: str = "png"


class RealC2PAVerifyResponse(BaseModel):
    """Response from real C2PA verification."""
    is_valid: bool
    has_credentials: bool
    manifest_id: Optional[str] = None
    claim_generator: Optional[str] = None
    signature_valid: bool = False
    trust_chain_valid: bool = False
    assertions: List[Dict[str, Any]] = []
    is_ai_generated: bool = False
    ai_info: Optional[Dict[str, Any]] = None
    errors: List[str] = []
    warnings: List[str] = []
    using_real_c2pa: bool


@app.post("/c2pa/v2/verify", response_model=RealC2PAVerifyResponse)
async def verify_real_c2pa_manifest(request: RealC2PAVerifyRequest):
    """
    Verify C2PA Content Credentials using the real c2pa-python library.

    Returns detailed verification results including signature validation,
    trust chain verification, and AI generation detection.
    """
    try:
        image_bytes = base64.b64decode(request.image_base64)

        result = verify_content_credentials(image_bytes, request.format)

        return RealC2PAVerifyResponse(
            is_valid=result['is_valid'],
            has_credentials=result['has_credentials'],
            manifest_id=result.get('manifest_id'),
            claim_generator=result.get('claim_generator'),
            signature_valid=result.get('signature_valid', False),
            trust_chain_valid=result.get('trust_chain_valid', False),
            assertions=result.get('assertions', []),
            is_ai_generated=result.get('is_ai_generated', False),
            ai_info=result.get('ai_info'),
            errors=result.get('errors', []),
            warnings=result.get('warnings', []),
            using_real_c2pa=C2PA_AVAILABLE,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"C2PA v2 verification failed: {str(e)}")


# ============================================================================
# Enhanced Embed with Article 50 Compliance
# ============================================================================

class Article50EmbedRequest(BaseModel):
    """Request for Article 50 compliant embedding."""
    image_base64: str
    file_name: str
    file_type: str
    strength: float = Field(default=1.0, ge=0.1, le=2.0)
    # C2PA options
    enable_c2pa: bool = True
    c2pa_options: C2PAManifestOptionsModel = C2PAManifestOptionsModel()
    provenance: AIProvenanceModel = AIProvenanceModel()


class Article50EmbedResponse(BaseModel):
    """Response from Article 50 compliant embedding."""
    success: bool
    watermarked_image_base64: str
    watermark_applied: bool
    c2pa_manifest_id: Optional[str] = None
    c2pa_manifest_applied: bool = False
    content_hash: str
    processing_time_ms: int
    eu_ai_act_compliant: bool


@app.post("/embed/article50", response_model=Article50EmbedResponse)
async def embed_article50_compliant(request: Article50EmbedRequest):
    """
    Embed both invisible watermark and C2PA manifest for full Article 50 compliance.

    This is the recommended endpoint for EU AI Act compliance as it provides:
    1. Invisible watermark for robust detection
    2. C2PA Content Credentials for machine-readable provenance
    """
    start_time = time.time()

    try:
        # Decode image
        image_bytes = base64.b64decode(request.image_base64)

        # Step 1: Embed invisible watermark
        watermarker = get_image_watermarker()
        watermark_result = watermarker.embed(
            image_bytes,
            {"strength": request.strength}
        )

        # Get watermarked image bytes
        watermarked_bytes = base64.b64decode(watermark_result["output_bytes"])

        # Step 2: Embed C2PA manifest (if enabled)
        c2pa_manifest_id = None
        c2pa_applied = False
        final_bytes = watermarked_bytes

        if request.enable_c2pa:
            options = C2PAManifestOptions(
                digital_source_type=request.c2pa_options.digital_source_type,
                allow_training=request.c2pa_options.allow_training,
                allow_mining=request.c2pa_options.allow_mining,
                custom_assertions=request.c2pa_options.custom_assertions,
            )

            provenance = AIProvenance(
                model_name=request.provenance.model_name,
                model_version=request.provenance.model_version,
                provider=request.provenance.provider,
                generation_prompt_hash=request.provenance.generation_prompt_hash,
                generation_timestamp=request.provenance.generation_timestamp,
            )

            c2pa_result = create_and_embed_manifest(watermarked_bytes, options, provenance)
            final_bytes = c2pa_result.signed_image_bytes
            c2pa_manifest_id = c2pa_result.manifest_id
            c2pa_applied = True

        import hashlib
        content_hash = hashlib.sha256(final_bytes).hexdigest()

        processing_time = int((time.time() - start_time) * 1000)

        return Article50EmbedResponse(
            success=True,
            watermarked_image_base64=base64.b64encode(final_bytes).decode("utf-8"),
            watermark_applied=True,
            c2pa_manifest_id=c2pa_manifest_id,
            c2pa_manifest_applied=c2pa_applied,
            content_hash=content_hash,
            processing_time_ms=processing_time,
            eu_ai_act_compliant=c2pa_applied,  # Full compliance requires both
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Article 50 compliant embedding failed: {str(e)}"
        )


# ============================================================================
# Robustness Testing Endpoints
# ============================================================================

class TransformationResultModel(BaseModel):
    """Result of a single transformation test."""
    transformation_type: str
    parameters: Dict[str, Any]
    watermark_detected: bool
    confidence: float
    confidence_loss: float
    passed: bool


class RobustnessTestResponse(BaseModel):
    """Response from robustness test."""
    original_confidence: float
    transformations_tested: int
    transformations_passed: int
    overall_robustness_score: float
    results: List[TransformationResultModel]
    is_robust: bool
    detection_threshold: float
    min_robustness_score: float


class RobustnessTestRequest(BaseModel):
    """Request for robustness test."""
    image_base64: str
    quick_test: bool = False  # If true, run only essential tests


@app.post("/robustness/test", response_model=RobustnessTestResponse)
async def test_watermark_robustness(request: RobustnessTestRequest):
    """
    Test watermark robustness against various image transformations.

    This verifies that the watermark survives common image processing
    operations like compression, resizing, cropping, and color adjustments.

    Essential for EU AI Act Article 50 compliance verification.
    """
    try:
        # Decode image
        image_bytes = base64.b64decode(request.image_base64)

        # Get watermarker for detection
        watermarker = get_image_watermarker()

        # Define detection function
        def detect_func(img_bytes: bytes) -> Dict[str, Any]:
            return watermarker.detect(img_bytes)

        # Run appropriate test
        if request.quick_test:
            result = run_quick_robustness_test(image_bytes, detect_func)
        else:
            result = run_robustness_test(image_bytes, detect_func)

        # Convert results to response model
        transformation_results = [
            TransformationResultModel(
                transformation_type=r.transformation_type,
                parameters=r.parameters,
                watermark_detected=r.watermark_detected,
                confidence=r.confidence,
                confidence_loss=r.confidence_loss,
                passed=r.passed,
            )
            for r in result.results
        ]

        return RobustnessTestResponse(
            original_confidence=result.original_confidence,
            transformations_tested=result.transformations_tested,
            transformations_passed=result.transformations_passed,
            overall_robustness_score=result.overall_robustness_score,
            results=transformation_results,
            is_robust=result.is_robust,
            detection_threshold=DETECTION_THRESHOLD,
            min_robustness_score=MIN_ROBUSTNESS_SCORE,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Robustness test failed: {str(e)}"
        )


class SingleTransformationRequest(BaseModel):
    """Request for single transformation test."""
    image_base64: str
    transformation_type: str  # jpeg_compression, resize, crop, rotation, brightness, contrast, noise, blur, format
    parameters: Dict[str, Any] = {}


class SingleTransformationResponse(BaseModel):
    """Response from single transformation test."""
    original_confidence: float
    transformed_confidence: float
    confidence_loss: float
    watermark_detected: bool
    passed: bool
    transformed_image_base64: str


@app.post("/robustness/transform", response_model=SingleTransformationResponse)
async def test_single_transformation(request: SingleTransformationRequest):
    """
    Test watermark survival against a single transformation.

    Useful for debugging or testing specific attack vectors.
    """
    from app.services.robustness_service import (
        apply_jpeg_compression,
        apply_resize,
        apply_crop,
        apply_rotation,
        apply_brightness,
        apply_contrast,
        apply_gaussian_noise,
        apply_blur,
        apply_format_conversion,
    )

    transformation_funcs = {
        "jpeg_compression": apply_jpeg_compression,
        "resize": apply_resize,
        "crop": apply_crop,
        "rotation": apply_rotation,
        "brightness": apply_brightness,
        "contrast": apply_contrast,
        "noise": apply_gaussian_noise,
        "blur": apply_blur,
        "format": apply_format_conversion,
    }

    if request.transformation_type not in transformation_funcs:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown transformation type: {request.transformation_type}. "
                   f"Valid types: {', '.join(transformation_funcs.keys())}"
        )

    try:
        # Decode image
        image_bytes = base64.b64decode(request.image_base64)

        # Get watermarker
        watermarker = get_image_watermarker()

        # Detect in original
        original_result = watermarker.detect(image_bytes)
        original_confidence = original_result.get("confidence", 0.0)

        # Apply transformation
        transform_func = transformation_funcs[request.transformation_type]
        transformed_bytes = transform_func(image_bytes, **request.parameters)

        # Detect in transformed
        transformed_result = watermarker.detect(transformed_bytes)
        transformed_confidence = transformed_result.get("confidence", 0.0)
        has_watermark = transformed_result.get("has_watermark", False)

        # Calculate confidence loss
        confidence_loss = ((original_confidence - transformed_confidence) / original_confidence * 100) if original_confidence > 0 else 100

        return SingleTransformationResponse(
            original_confidence=original_confidence,
            transformed_confidence=transformed_confidence,
            confidence_loss=max(0, confidence_loss),
            watermark_detected=has_watermark,
            passed=transformed_confidence >= DETECTION_THRESHOLD and has_watermark,
            transformed_image_base64=base64.b64encode(transformed_bytes).decode("utf-8"),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transformation test failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
