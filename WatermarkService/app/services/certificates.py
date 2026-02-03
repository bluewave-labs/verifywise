"""
Certificate Management Service

Handles X.509 certificate generation and management for C2PA signing.
Supports both development (self-signed) and production (CA-signed) modes.
"""

import os
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple
from dataclasses import dataclass

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend


# Certificate storage directory
CERT_DIR = Path(os.environ.get("C2PA_CERT_DIR", "/app/certs"))
CERT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class CertificateInfo:
    """Certificate and key pair information."""
    cert_pem: bytes
    key_pem: bytes
    cert_chain_pem: bytes
    fingerprint: str
    subject: str
    issuer: str
    not_before: datetime
    not_after: datetime
    serial_number: int


@dataclass
class OrganizationInfo:
    """Organization information for certificate generation."""
    name: str
    country: str = "EU"
    state: str = "Brussels"
    locality: str = "Brussels"
    org_unit: str = "AI Governance"


def generate_private_key(key_size: int = 2048) -> rsa.RSAPrivateKey:
    """Generate RSA private key for signing."""
    return rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )


def generate_root_ca(
    org_info: OrganizationInfo,
    validity_days: int = 3650,  # 10 years
    key_size: int = 4096
) -> Tuple[x509.Certificate, rsa.RSAPrivateKey]:
    """
    Generate a self-signed Root CA certificate.

    In production, this should be replaced with a real CA certificate
    from a trusted Certificate Authority.
    """
    private_key = generate_private_key(key_size)

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, org_info.country),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, org_info.state),
        x509.NameAttribute(NameOID.LOCALITY_NAME, org_info.locality),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org_info.name),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Certificate Authority"),
        x509.NameAttribute(NameOID.COMMON_NAME, f"{org_info.name} Root CA"),
    ])

    now = datetime.utcnow()

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=validity_days))
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=1),
            critical=True,
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(private_key.public_key()),
            critical=False,
        )
        .sign(private_key, hashes.SHA256(), default_backend())
    )

    return cert, private_key


def generate_signing_certificate(
    org_info: OrganizationInfo,
    ca_cert: x509.Certificate,
    ca_key: rsa.RSAPrivateKey,
    validity_days: int = 365,
    key_size: int = 2048
) -> Tuple[x509.Certificate, rsa.RSAPrivateKey]:
    """
    Generate a signing certificate for C2PA manifests.

    This certificate is used to sign Content Credentials and must be
    issued by a trusted CA (or our self-signed CA in development).
    """
    private_key = generate_private_key(key_size)

    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, org_info.country),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, org_info.state),
        x509.NameAttribute(NameOID.LOCALITY_NAME, org_info.locality),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org_info.name),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, org_info.org_unit),
        x509.NameAttribute(NameOID.COMMON_NAME, f"{org_info.name} C2PA Signer"),
    ])

    now = datetime.utcnow()

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=validity_days))
        .add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=True,  # Non-repudiation
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.CODE_SIGNING,
                ExtendedKeyUsageOID.TIME_STAMPING,
            ]),
            critical=False,
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(private_key.public_key()),
            critical=False,
        )
        .add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(
                ca_cert.extensions.get_extension_for_class(x509.SubjectKeyIdentifier).value
            ),
            critical=False,
        )
        .sign(ca_key, hashes.SHA256(), default_backend())
    )

    return cert, private_key


def cert_to_pem(cert: x509.Certificate) -> bytes:
    """Convert certificate to PEM format."""
    return cert.public_bytes(serialization.Encoding.PEM)


def key_to_pem(key: rsa.RSAPrivateKey, password: Optional[bytes] = None) -> bytes:
    """Convert private key to PEM format."""
    encryption = (
        serialization.BestAvailableEncryption(password)
        if password
        else serialization.NoEncryption()
    )
    return key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=encryption,
    )


def get_cert_fingerprint(cert: x509.Certificate) -> str:
    """Get SHA-256 fingerprint of certificate."""
    return hashlib.sha256(
        cert.public_bytes(serialization.Encoding.DER)
    ).hexdigest()


def load_or_create_certificates(
    org_info: OrganizationInfo,
    force_regenerate: bool = False
) -> CertificateInfo:
    """
    Load existing certificates or create new ones.

    Certificates are stored in the CERT_DIR directory.
    In production, these should be provisioned through proper PKI.
    """
    ca_cert_path = CERT_DIR / "ca_cert.pem"
    ca_key_path = CERT_DIR / "ca_key.pem"
    signing_cert_path = CERT_DIR / "signing_cert.pem"
    signing_key_path = CERT_DIR / "signing_key.pem"
    chain_path = CERT_DIR / "cert_chain.pem"

    # Check if certificates exist and are valid
    if not force_regenerate and all(p.exists() for p in [
        ca_cert_path, ca_key_path, signing_cert_path, signing_key_path
    ]):
        # Load existing certificates
        with open(signing_cert_path, "rb") as f:
            signing_cert = x509.load_pem_x509_certificate(f.read())

        # Check if certificate is still valid (with 30 day buffer)
        if signing_cert.not_valid_after_utc > datetime.utcnow() + timedelta(days=30):
            with open(signing_key_path, "rb") as f:
                signing_key_pem = f.read()
            with open(chain_path, "rb") as f:
                chain_pem = f.read()

            return CertificateInfo(
                cert_pem=cert_to_pem(signing_cert),
                key_pem=signing_key_pem,
                cert_chain_pem=chain_pem,
                fingerprint=get_cert_fingerprint(signing_cert),
                subject=signing_cert.subject.rfc4514_string(),
                issuer=signing_cert.issuer.rfc4514_string(),
                not_before=signing_cert.not_valid_before_utc,
                not_after=signing_cert.not_valid_after_utc,
                serial_number=signing_cert.serial_number,
            )

    # Generate new certificates
    print("Generating new C2PA signing certificates...")

    # Generate Root CA
    ca_cert, ca_key = generate_root_ca(org_info)

    # Generate signing certificate
    signing_cert, signing_key = generate_signing_certificate(
        org_info, ca_cert, ca_key
    )

    # Create certificate chain (signing cert + CA cert)
    chain_pem = cert_to_pem(signing_cert) + cert_to_pem(ca_cert)

    # Save certificates
    with open(ca_cert_path, "wb") as f:
        f.write(cert_to_pem(ca_cert))

    with open(ca_key_path, "wb") as f:
        f.write(key_to_pem(ca_key))

    with open(signing_cert_path, "wb") as f:
        f.write(cert_to_pem(signing_cert))

    signing_key_pem = key_to_pem(signing_key)
    with open(signing_key_path, "wb") as f:
        f.write(signing_key_pem)

    with open(chain_path, "wb") as f:
        f.write(chain_pem)

    print(f"Certificates saved to {CERT_DIR}")

    return CertificateInfo(
        cert_pem=cert_to_pem(signing_cert),
        key_pem=signing_key_pem,
        cert_chain_pem=chain_pem,
        fingerprint=get_cert_fingerprint(signing_cert),
        subject=signing_cert.subject.rfc4514_string(),
        issuer=signing_cert.issuer.rfc4514_string(),
        not_before=signing_cert.not_valid_before_utc,
        not_after=signing_cert.not_valid_after_utc,
        serial_number=signing_cert.serial_number,
    )


def get_certificate_info(cert_pem: bytes) -> CertificateInfo:
    """Parse certificate PEM and return info."""
    cert = x509.load_pem_x509_certificate(cert_pem)
    return CertificateInfo(
        cert_pem=cert_pem,
        key_pem=b"",  # Not available
        cert_chain_pem=cert_pem,
        fingerprint=get_cert_fingerprint(cert),
        subject=cert.subject.rfc4514_string(),
        issuer=cert.issuer.rfc4514_string(),
        not_before=cert.not_valid_before_utc,
        not_after=cert.not_valid_after_utc,
        serial_number=cert.serial_number,
    )


# Default organization for development
DEFAULT_ORG = OrganizationInfo(
    name="VerifyWise",
    country="EU",
    state="Brussels",
    locality="Brussels",
    org_unit="AI Governance Platform"
)
