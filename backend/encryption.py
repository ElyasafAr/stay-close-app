# -*- coding: utf-8 -*-
"""
Encryption utilities for sensitive data
Uses AES encryption for reversible encryption and SHA256 for hashing
"""

import os
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Get encryption key from environment
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'default-dev-key-change-in-production')

def _get_fernet_key() -> bytes:
    """
    Derive a Fernet-compatible key from the ENCRYPTION_KEY.
    Fernet requires a 32-byte base64-encoded key.
    """
    # Use PBKDF2 to derive a consistent key from our secret
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'stay-close-app-salt',  # Fixed salt for consistent key derivation
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return key

# Initialize Fernet cipher
_fernet = None

def _get_fernet():
    """Get or create Fernet instance (lazy initialization)"""
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_fernet_key())
    return _fernet


def encrypt(plaintext: str) -> str:
    """
    Encrypt a string using AES (Fernet).
    Returns base64-encoded encrypted string.
    
    Args:
        plaintext: The string to encrypt
        
    Returns:
        Encrypted string (base64 encoded)
    """
    if not plaintext:
        return ""
    
    fernet = _get_fernet()
    encrypted = fernet.encrypt(plaintext.encode('utf-8'))
    return encrypted.decode('utf-8')


def decrypt(ciphertext: str) -> str:
    """
    Decrypt a string that was encrypted with encrypt().
    
    Args:
        ciphertext: The encrypted string (base64 encoded)
        
    Returns:
        Decrypted plaintext string
    """
    if not ciphertext:
        return ""
    
    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(ciphertext.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"❌ [ENCRYPTION] Decryption error: {e}")
        return "[שגיאת פענוח]"


def hash_for_lookup(value: str) -> str:
    """
    Create a deterministic hash for searching/lookup.
    Uses SHA256 - one-way, cannot be reversed.
    
    Args:
        value: The string to hash (e.g., email, username)
        
    Returns:
        SHA256 hash as hex string
    """
    if not value:
        return ""
    
    # Normalize: lowercase and strip whitespace
    normalized = value.lower().strip()
    
    # Create SHA256 hash
    hash_obj = hashlib.sha256(normalized.encode('utf-8'))
    return hash_obj.hexdigest()


def encrypt_for_storage(value: str) -> tuple[str, str]:
    """
    Encrypt a value for storage with both hash (for lookup) and encrypted (for display).
    
    Args:
        value: The string to encrypt (e.g., email, username)
        
    Returns:
        Tuple of (hash_value, encrypted_value)
    """
    hash_value = hash_for_lookup(value)
    encrypted_value = encrypt(value)
    return hash_value, encrypted_value


# Test the encryption
if __name__ == "__main__":
    test_email = "test@example.com"
    
    print(f"Original: {test_email}")
    
    hash_val, encrypted_val = encrypt_for_storage(test_email)
    print(f"Hash: {hash_val}")
    print(f"Encrypted: {encrypted_val}")
    
    decrypted = decrypt(encrypted_val)
    print(f"Decrypted: {decrypted}")
    
    # Verify hash consistency
    hash_val2 = hash_for_lookup(test_email)
    print(f"Hash consistent: {hash_val == hash_val2}")

