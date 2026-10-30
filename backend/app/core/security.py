from __future__ import annotations
import secrets
import base64
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import TOKEN_ENCRYPTION_KEY, SESSION_SECRET


def generate_session_id() -> str:
    """Generate a high-entropy, cryptographically secure session ID."""
    return secrets.token_urlsafe(32)


def generate_oauth_state() -> str:
    """Generate a secure, unpredictable OAuth state token."""
    return secrets.token_urlsafe(32)


def _get_encryption_key() -> bytes:
    """Derive or load a 32-byte key for AES-GCM."""
    raw = (TOKEN_ENCRYPTION_KEY or SESSION_SECRET).encode("utf-8")
    if len(raw) < 32:
        raw = raw.ljust(32, b"0")
    return raw[:32]


def encrypt_token(plain_token: str) -> str:
    """Encrypt a secret token using AES-GCM."""
    if not plain_token:
        return ""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)
    ciphertext = aesgcm.encrypt(nonce, plain_token.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_token(encrypted_payload: str) -> Optional[str]:
    """Decrypt an AES-GCM encrypted token."""
    if not encrypted_payload:
        return None
    try:
        raw = base64.b64decode(encrypted_payload.encode("utf-8"))
        if len(raw) < 13:
            return None
        nonce, ciphertext = raw[:12], raw[12:]
        key = _get_encryption_key()
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")
    except Exception:
        return None

