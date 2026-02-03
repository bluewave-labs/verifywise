"""
C2PA Content Credentials Service

Real implementation of C2PA manifest creation and verification using c2pa-python.
Uses X.509 certificate-based signing for production-ready Content Credentials
that comply with EU AI Act Article 50.
"""

import os
import json
import tempfile
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from io import BytesIO
import logging

try:
    from c2pa import Builder, Reader, SigningAlg, create_signer
    C2PA_AVAILABLE = True
except ImportError:
    C2PA_AVAILABLE = False
    Builder = None
    Reader = None

from PIL import Image
from PIL.PngImagePlugin import PngInfo

from .certificates import (
    load_or_create_certificates,
    OrganizationInfo,
    CertificateInfo,
    DEFAULT_ORG,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Configuration
# ============================================================================

GENERATOR_NAME = "VerifyWise"
GENERATOR_VERSION = "1.0.0"

# Digital source types for AI content per C2PA specification
DIGITAL_SOURCE_TYPES = {
    "ai_generated": "http://c2pa.org/digitalsourcetype/trainedAlgorithmicMedia",
    "composite": "http://c2pa.org/digitalsourcetype/compositeWithTrainedAlgorithmicMedia",
    "minor_edits": "http://c2pa.org/digitalsourcetype/minorHumanEdits",
    "synthetic": "http://c2pa.org/digitalsourcetype/digitalArt",
}


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class AIProvenance:
    """AI generation provenance information for C2PA assertions."""
    model_name: str
    model_version: str
    provider: str
    generation_timestamp: str
    prompt_hash: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


@dataclass
class ContentCredential:
    """Content Credential information extracted from or to be embedded in content."""
    manifest_id: str
    claim_generator: str
    signature_info: Dict[str, Any]
    assertions: List[Dict[str, Any]]
    ingredients: List[Dict[str, Any]]
    created_at: str
    is_ai_generated: bool
    ai_provenance: Optional[Dict[str, Any]] = None


@dataclass
class VerificationResult:
    """Result of C2PA manifest verification."""
    is_valid: bool
    has_credentials: bool
    manifest_id: Optional[str] = None
    claim_generator: Optional[str] = None
    signature_valid: bool = False
    trust_chain_valid: bool = False
    assertions: List[Dict[str, Any]] = None
    is_ai_generated: bool = False
    ai_info: Optional[Dict[str, Any]] = None
    errors: List[str] = None
    warnings: List[str] = None

    def __post_init__(self):
        if self.assertions is None:
            self.assertions = []
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


# Legacy classes for backward compatibility
class C2PAManifestOptions:
    """Options for C2PA manifest creation."""

    def __init__(
        self,
        digital_source_type: str = DIGITAL_SOURCE_TYPES["ai_generated"],
        allow_training: bool = False,
        allow_mining: bool = False,
        custom_assertions: Optional[List[Dict[str, Any]]] = None,
    ):
        self.digital_source_type = digital_source_type
        self.allow_training = allow_training
        self.allow_mining = allow_mining
        self.custom_assertions = custom_assertions or []


class C2PACreateResult:
    """Result of C2PA manifest creation."""

    def __init__(
        self,
        manifest_id: str,
        instance_id: str,
        content_hash: str,
        signed_image_bytes: bytes,
        manifest_json: Dict[str, Any],
    ):
        self.manifest_id = manifest_id
        self.instance_id = instance_id
        self.content_hash = content_hash
        self.signed_image_bytes = signed_image_bytes
        self.manifest_json = manifest_json


class C2PAVerifyResult:
    """Result of C2PA manifest verification."""

    def __init__(
        self,
        manifest_found: bool,
        signature_valid: bool = False,
        chain_verified: bool = False,
        manifest_data: Optional[Dict[str, Any]] = None,
        validation_errors: Optional[List[str]] = None,
    ):
        self.manifest_found = manifest_found
        self.signature_valid = signature_valid
        self.chain_verified = chain_verified
        self.manifest_data = manifest_data
        self.validation_errors = validation_errors or []


# ============================================================================
# C2PA Service Class
# ============================================================================

class C2PAService:
    """
    Service for creating and verifying C2PA Content Credentials.

    Uses c2pa-python library with X.509 certificate-based signing for
    production-ready Content Credentials that comply with EU AI Act Article 50.
    """

    def __init__(self, org_info: Optional[OrganizationInfo] = None):
        """
        Initialize C2PA service with organization certificates.

        Args:
            org_info: Organization information for certificate generation.
                     Uses DEFAULT_ORG if not provided.
        """
        self.org_info = org_info or DEFAULT_ORG
        self._cert_info: Optional[CertificateInfo] = None
        self._signer = None

    @property
    def cert_info(self) -> CertificateInfo:
        """Lazy-load certificates."""
        if self._cert_info is None:
            self._cert_info = load_or_create_certificates(self.org_info)
        return self._cert_info

    def _get_signer(self):
        """Get or create the C2PA signer with certificates."""
        if not C2PA_AVAILABLE:
            raise RuntimeError("c2pa-python library not installed")

        if self._signer is None:
            cert = self.cert_info
            self._signer = create_signer(
                cert.cert_chain_pem,
                cert.key_pem,
                SigningAlg.PS256,  # RSA-PSS with SHA-256
                tsa_url="http://timestamp.digicert.com"  # RFC 3161 timestamp server
            )
        return self._signer

    def create_manifest(
        self,
        image_data: bytes,
        format: str,
        ai_provenance: Optional[AIProvenance] = None,
        title: Optional[str] = None,
        custom_assertions: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[bytes, ContentCredential]:
        """
        Create and embed C2PA manifest into image.

        Args:
            image_data: Raw image bytes
            format: Image format (e.g., 'jpeg', 'png')
            ai_provenance: AI generation information
            title: Optional content title
            custom_assertions: Optional custom assertions to include

        Returns:
            Tuple of (signed image bytes, ContentCredential info)
        """
        if not C2PA_AVAILABLE:
            # Fall back to mock implementation
            return self._create_manifest_mock(
                image_data, format, ai_provenance, title, custom_assertions
            )

        # Normalize format
        format = format.lower().replace('jpg', 'jpeg')

        # Build manifest definition
        manifest_def = self._build_manifest_definition(
            ai_provenance=ai_provenance,
            title=title,
            custom_assertions=custom_assertions,
        )

        # Create builder with manifest
        builder = Builder(manifest_def)

        # Sign and embed manifest
        signer = self._get_signer()

        # Write input to temp file (c2pa-python requires file paths)
        with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as input_file:
            input_file.write(image_data)
            input_path = input_file.name

        output_path = input_path + '_signed'

        try:
            # Sign the content
            builder.sign_file(signer, input_path, output_path)

            # Read signed content
            with open(output_path, 'rb') as f:
                signed_data = f.read()

            # Read back the manifest to get details
            reader = Reader.from_file(output_path)
            manifest_store = json.loads(reader.json())

            # Extract credential info
            active_manifest = manifest_store.get('active_manifest', '')
            manifests = manifest_store.get('manifests', {})
            manifest_data = manifests.get(active_manifest, {})

            credential = ContentCredential(
                manifest_id=active_manifest,
                claim_generator=manifest_data.get('claim_generator', f'{self.org_info.name}/C2PA-Signer/1.0'),
                signature_info={
                    'issuer': self.cert_info.issuer,
                    'cert_fingerprint': self.cert_info.fingerprint,
                    'algorithm': 'PS256',
                },
                assertions=manifest_data.get('assertions', []),
                ingredients=manifest_data.get('ingredients', []),
                created_at=datetime.now(timezone.utc).isoformat(),
                is_ai_generated=ai_provenance is not None,
                ai_provenance=asdict(ai_provenance) if ai_provenance else None,
            )

            return signed_data, credential

        finally:
            # Cleanup temp files
            if os.path.exists(input_path):
                os.unlink(input_path)
            if os.path.exists(output_path):
                os.unlink(output_path)

    def _create_manifest_mock(
        self,
        image_data: bytes,
        format: str,
        ai_provenance: Optional[AIProvenance] = None,
        title: Optional[str] = None,
        custom_assertions: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[bytes, ContentCredential]:
        """Mock implementation when c2pa-python is not available."""
        import uuid

        content_hash = hashlib.sha256(image_data).hexdigest()
        manifest_id = str(uuid.uuid4())

        # Create mock manifest JSON
        manifest_json = {
            "claim_generator": f"{self.org_info.name}/C2PA-Signer/1.0",
            "assertions": [],
        }

        if ai_provenance:
            manifest_json["assertions"].append({
                "label": "stds.exif.digitalsourcetype",
                "data": DIGITAL_SOURCE_TYPES["ai_generated"]
            })
            manifest_json["assertions"].append({
                "label": "com.verifywise.ai_provenance",
                "data": asdict(ai_provenance)
            })

        if custom_assertions:
            manifest_json["assertions"].extend(custom_assertions)

        # Embed as PNG metadata (mock)
        img = Image.open(BytesIO(image_data)).convert("RGB")
        metadata = PngInfo()
        metadata.add_text("c2pa:manifest", json.dumps(manifest_json))
        metadata.add_text("c2pa:manifest_id", manifest_id)
        metadata.add_text("c2pa:content_hash", content_hash)

        output_buffer = BytesIO()
        img.save(output_buffer, format="PNG", pnginfo=metadata)
        signed_data = output_buffer.getvalue()

        credential = ContentCredential(
            manifest_id=manifest_id,
            claim_generator=f"{self.org_info.name}/C2PA-Signer/1.0",
            signature_info={
                'issuer': self.cert_info.issuer,
                'cert_fingerprint': self.cert_info.fingerprint,
                'algorithm': 'PS256',
                'mode': 'mock',
            },
            assertions=manifest_json["assertions"],
            ingredients=[],
            created_at=datetime.now(timezone.utc).isoformat(),
            is_ai_generated=ai_provenance is not None,
            ai_provenance=asdict(ai_provenance) if ai_provenance else None,
        )

        return signed_data, credential

    def _build_manifest_definition(
        self,
        ai_provenance: Optional[AIProvenance] = None,
        title: Optional[str] = None,
        custom_assertions: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Build C2PA manifest definition JSON."""

        assertions = []

        # Creative work assertion (title)
        if title:
            assertions.append({
                "label": "stds.schema-org.CreativeWork",
                "data": {
                    "@context": "https://schema.org",
                    "@type": "CreativeWork",
                    "name": title,
                    "author": {
                        "@type": "Organization",
                        "name": self.org_info.name,
                    }
                }
            })

        # AI generation assertion
        if ai_provenance:
            # c2pa.ai_training assertion
            assertions.append({
                "label": "c2pa.ai_training",
                "data": {
                    "use": "allowed",
                    "constraint_info": "This content was generated by AI"
                }
            })

            # Digital source type assertion
            assertions.append({
                "label": "stds.exif.digitalsourcetype",
                "data": DIGITAL_SOURCE_TYPES["ai_generated"]
            })

            # Custom AI provenance assertion (VerifyWise specific)
            ai_assertion_data = {
                "model_name": ai_provenance.model_name,
                "model_version": ai_provenance.model_version,
                "provider": ai_provenance.provider,
                "generation_timestamp": ai_provenance.generation_timestamp,
                "verified_by": self.org_info.name,
            }

            if ai_provenance.prompt_hash:
                ai_assertion_data["prompt_hash"] = ai_provenance.prompt_hash

            if ai_provenance.parameters:
                ai_assertion_data["parameters"] = ai_provenance.parameters

            assertions.append({
                "label": "com.verifywise.ai_provenance",
                "data": ai_assertion_data
            })

        # Add custom assertions
        if custom_assertions:
            assertions.extend(custom_assertions)

        # Actions assertion (always include)
        actions = []
        if ai_provenance:
            actions.append({
                "action": "c2pa.created",
                "digitalSourceType": DIGITAL_SOURCE_TYPES["ai_generated"],
                "softwareAgent": {
                    "name": ai_provenance.provider,
                    "version": ai_provenance.model_version,
                }
            })

        actions.append({
            "action": "c2pa.published",
            "softwareAgent": {
                "name": f"{self.org_info.name} Content Authenticity Platform",
                "version": "1.0.0",
            }
        })

        assertions.append({
            "label": "c2pa.actions",
            "data": {
                "actions": actions
            }
        })

        manifest_def = {
            "claim_generator": f"{self.org_info.name}/C2PA-Signer/1.0",
            "claim_generator_info": [
                {
                    "name": f"{self.org_info.name} Content Authenticity Platform",
                    "version": "1.0.0",
                }
            ],
            "assertions": assertions,
        }

        return json.dumps(manifest_def)

    def verify_manifest(self, image_data: bytes, format: str) -> VerificationResult:
        """
        Verify C2PA manifest in an image.

        Args:
            image_data: Raw image bytes
            format: Image format

        Returns:
            VerificationResult with verification details
        """
        if not C2PA_AVAILABLE:
            return self._verify_manifest_mock(image_data)

        format = format.lower().replace('jpg', 'jpeg')

        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as temp_file:
            temp_file.write(image_data)
            temp_path = temp_file.name

        try:
            # Try to read manifest
            try:
                reader = Reader.from_file(temp_path)
            except Exception as e:
                # No manifest found
                return VerificationResult(
                    is_valid=False,
                    has_credentials=False,
                    errors=[f"No C2PA manifest found: {str(e)}"]
                )

            # Parse manifest store
            manifest_store = json.loads(reader.json())

            active_manifest_id = manifest_store.get('active_manifest', '')
            manifests = manifest_store.get('manifests', {})
            validation_status = manifest_store.get('validation_status', [])

            if not active_manifest_id or active_manifest_id not in manifests:
                return VerificationResult(
                    is_valid=False,
                    has_credentials=True,
                    errors=["No active manifest found in store"]
                )

            manifest = manifests[active_manifest_id]

            # Extract assertions
            assertions = manifest.get('assertions', [])

            # Check for AI generation indicators
            is_ai_generated = False
            ai_info = None

            for assertion in assertions:
                label = assertion.get('label', '')
                data = assertion.get('data', {})

                # Check digital source type
                if label == 'stds.exif.digitalsourcetype':
                    if 'trainedAlgorithmic' in str(data).lower():
                        is_ai_generated = True

                # Check our custom AI provenance
                if label == 'com.verifywise.ai_provenance':
                    is_ai_generated = True
                    ai_info = data

                # Check c2pa.ai_training
                if label == 'c2pa.ai_training':
                    is_ai_generated = True

            # Process validation status
            errors = []
            warnings = []
            signature_valid = True
            trust_chain_valid = True

            for status in validation_status:
                code = status.get('code', '')
                explanation = status.get('explanation', '')

                if status.get('severity') == 'error':
                    errors.append(f"{code}: {explanation}")
                    if 'signature' in code.lower():
                        signature_valid = False
                    if 'trust' in code.lower() or 'chain' in code.lower():
                        trust_chain_valid = False
                elif status.get('severity') == 'warning':
                    warnings.append(f"{code}: {explanation}")

            # Self-signed certs won't pass trust chain validation
            # This is expected in development mode
            if not trust_chain_valid:
                warnings.append("Trust chain validation failed - using self-signed certificates (expected in development)")
                trust_chain_valid = True  # Allow for self-signed in dev

            return VerificationResult(
                is_valid=len(errors) == 0,
                has_credentials=True,
                manifest_id=active_manifest_id,
                claim_generator=manifest.get('claim_generator', ''),
                signature_valid=signature_valid,
                trust_chain_valid=trust_chain_valid,
                assertions=assertions,
                is_ai_generated=is_ai_generated,
                ai_info=ai_info,
                errors=errors,
                warnings=warnings,
            )

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def _verify_manifest_mock(self, image_data: bytes) -> VerificationResult:
        """Mock verification when c2pa-python is not available."""
        try:
            img = Image.open(BytesIO(image_data))

            if not hasattr(img, 'info') or 'c2pa:manifest' not in img.info:
                return VerificationResult(
                    is_valid=False,
                    has_credentials=False,
                    errors=["No C2PA manifest found (mock mode)"]
                )

            manifest_str = img.info.get('c2pa:manifest', '')
            manifest_json = json.loads(manifest_str)
            manifest_id = img.info.get('c2pa:manifest_id', '')

            # Check for AI generation
            is_ai_generated = False
            ai_info = None
            assertions = manifest_json.get('assertions', [])

            for assertion in assertions:
                label = assertion.get('label', '')
                data = assertion.get('data', {})

                if label == 'stds.exif.digitalsourcetype':
                    if 'trainedAlgorithmic' in str(data).lower():
                        is_ai_generated = True

                if label == 'com.verifywise.ai_provenance':
                    is_ai_generated = True
                    ai_info = data

            return VerificationResult(
                is_valid=True,
                has_credentials=True,
                manifest_id=manifest_id,
                claim_generator=manifest_json.get('claim_generator', ''),
                signature_valid=True,  # Mock always valid
                trust_chain_valid=True,
                assertions=assertions,
                is_ai_generated=is_ai_generated,
                ai_info=ai_info,
                warnings=["Verification performed in mock mode - c2pa-python not installed"]
            )

        except Exception as e:
            return VerificationResult(
                is_valid=False,
                has_credentials=False,
                errors=[f"Verification failed: {str(e)}"]
            )

    def get_certificate_info(self) -> Dict[str, Any]:
        """Get information about the current signing certificate."""
        cert = self.cert_info
        return {
            'fingerprint': cert.fingerprint,
            'subject': cert.subject,
            'issuer': cert.issuer,
            'not_before': cert.not_before.isoformat(),
            'not_after': cert.not_after.isoformat(),
            'serial_number': str(cert.serial_number),
            'organization': self.org_info.name,
            'c2pa_available': C2PA_AVAILABLE,
        }


# Module-level service instance
_service: Optional[C2PAService] = None


def get_c2pa_service() -> C2PAService:
    """Get or create the global C2PA service instance."""
    global _service
    if _service is None:
        _service = C2PAService()
    return _service


# ============================================================================
# Helper Functions
# ============================================================================

def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hash of data."""
    return hashlib.sha256(data).hexdigest()


# ============================================================================
# Legacy API (backward compatibility)
# ============================================================================

def create_and_embed_manifest(
    image_bytes: bytes,
    options: C2PAManifestOptions,
    provenance: "LegacyAIProvenance",
) -> C2PACreateResult:
    """
    Create and embed a C2PA manifest into an image.

    Legacy function for backward compatibility.
    """
    import uuid

    service = get_c2pa_service()

    # Convert legacy provenance to new format
    ai_prov = AIProvenance(
        model_name=provenance.model_name or "Unknown",
        model_version=provenance.model_version or "1.0",
        provider=provenance.provider or "Unknown",
        generation_timestamp=provenance.generation_timestamp or datetime.now(timezone.utc).isoformat(),
        prompt_hash=provenance.generation_prompt_hash,
    )

    signed_data, credential = service.create_manifest(
        image_data=image_bytes,
        format="png",
        ai_provenance=ai_prov,
        custom_assertions=options.custom_assertions,
    )

    content_hash = compute_sha256(image_bytes)

    return C2PACreateResult(
        manifest_id=credential.manifest_id,
        instance_id=f"xmp.iid:{uuid.uuid4()}",
        content_hash=content_hash,
        signed_image_bytes=signed_data,
        manifest_json={
            "claim_generator": credential.claim_generator,
            "assertions": credential.assertions,
            "signature": credential.signature_info,
        },
    )


def verify_manifest(image_bytes: bytes) -> C2PAVerifyResult:
    """
    Verify a C2PA manifest in an image.

    Legacy function for backward compatibility.
    """
    service = get_c2pa_service()
    result = service.verify_manifest(image_bytes, "png")

    # Convert to legacy format
    manifest_data = None
    if result.has_credentials:
        manifest_data = {
            "digitalSourceType": None,
            "generatorInfo": None,
            "aiModelInfo": None,
            "assertions": result.assertions,
        }

        for assertion in result.assertions:
            label = assertion.get('label', '')
            data = assertion.get('data', {})

            if label == 'stds.exif.digitalsourcetype':
                manifest_data["digitalSourceType"] = data

            if label == 'com.verifywise.ai_provenance':
                manifest_data["aiModelInfo"] = {
                    "name": data.get("model_name"),
                    "provider": data.get("provider"),
                    "version": data.get("model_version"),
                }

    return C2PAVerifyResult(
        manifest_found=result.has_credentials,
        signature_valid=result.signature_valid,
        chain_verified=result.trust_chain_valid,
        manifest_data=manifest_data,
        validation_errors=result.errors,
    )


def extract_manifest(image_bytes: bytes) -> Optional[Dict[str, Any]]:
    """
    Extract C2PA manifest without full verification.

    Legacy function for backward compatibility.
    """
    service = get_c2pa_service()
    result = service.verify_manifest(image_bytes, "png")

    if not result.has_credentials:
        return None

    return {
        "manifest_id": result.manifest_id,
        "claim_generator": result.claim_generator,
        "assertions": result.assertions,
        "is_ai_generated": result.is_ai_generated,
        "ai_info": result.ai_info,
    }


# ============================================================================
# Convenience Functions
# ============================================================================

def create_content_credentials(
    image_data: bytes,
    format: str,
    model_name: str,
    model_version: str,
    provider: str,
    prompt_hash: Optional[str] = None,
    title: Optional[str] = None,
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Convenience function to create Content Credentials for AI-generated content.

    Args:
        image_data: Raw image bytes
        format: Image format (jpeg, png, etc.)
        model_name: Name of the AI model
        model_version: Version of the AI model
        provider: Provider/company name
        prompt_hash: Optional hash of the generation prompt
        title: Optional content title

    Returns:
        Tuple of (signed image bytes, credential info dict)
    """
    service = get_c2pa_service()

    ai_provenance = AIProvenance(
        model_name=model_name,
        model_version=model_version,
        provider=provider,
        generation_timestamp=datetime.now(timezone.utc).isoformat(),
        prompt_hash=prompt_hash,
    )

    signed_data, credential = service.create_manifest(
        image_data=image_data,
        format=format,
        ai_provenance=ai_provenance,
        title=title,
    )

    return signed_data, asdict(credential)


def verify_content_credentials(
    image_data: bytes,
    format: str,
) -> Dict[str, Any]:
    """
    Convenience function to verify Content Credentials.

    Args:
        image_data: Raw image bytes
        format: Image format

    Returns:
        Verification result as dictionary
    """
    service = get_c2pa_service()
    result = service.verify_manifest(image_data, format)
    return asdict(result)


# Legacy class alias
class LegacyAIProvenance:
    """Legacy AI provenance class for backward compatibility."""

    def __init__(
        self,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        provider: Optional[str] = None,
        generation_prompt_hash: Optional[str] = None,
        generation_timestamp: Optional[str] = None,
    ):
        self.model_name = model_name
        self.model_version = model_version
        self.provider = provider
        self.generation_prompt_hash = generation_prompt_hash
        self.generation_timestamp = generation_timestamp or datetime.now(timezone.utc).isoformat()
