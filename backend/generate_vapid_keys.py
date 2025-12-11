# -*- coding: utf-8 -*-
"""
סקריפט ליצירת VAPID keys ל-Push Notifications
"""

import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

def generate_vapid_keys():
    """יוצר VAPID keys חדשים"""
    # Generate private key
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    # Get public key
    public_key = private_key.public_key()
    
    # Serialize public key to uncompressed point format (needed for VAPID)
    # VAPID requires the raw public key point (65 bytes: 0x04 + 32 bytes X + 32 bytes Y)
    public_numbers = public_key.public_numbers()
    
    # Convert X and Y coordinates to bytes (32 bytes each)
    x_bytes = public_numbers.x.to_bytes(32, byteorder='big')
    y_bytes = public_numbers.y.to_bytes(32, byteorder='big')
    
    # Uncompressed point format: 0x04 + X + Y (65 bytes total)
    public_key_bytes = b'\x04' + x_bytes + y_bytes
    
    # Convert to base64 URL-safe format for VAPID
    public_key_base64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')
    
    # Private key: Convert to DER format, then to base64url
    # This is the format that pywebpush expects when loading from base64url
    private_key_der = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_key_base64 = base64.urlsafe_b64encode(private_key_der).decode('utf-8').rstrip('=')
    
    # Also generate PEM format for reference (but we'll use base64url in Railway)
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    print("=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print("\n📋 Add these to your Railway environment variables:\n")
    print(f"VAPID_PUBLIC_KEY={public_key_base64}")
    print(f"VAPID_PRIVATE_KEY={private_key_base64}")
    print("\n" + "=" * 60)
    print("\n📝 PEM Format (for reference only, NOT for Railway):")
    print("=" * 60)
    print(private_key_pem)
    print("=" * 60)
    print("\n⚠️  Keep the PRIVATE KEY secret! Never share it publicly.")
    print("=" * 60)
    
    return {
        'public_key': public_key_base64,
        'private_key': private_key_base64,
        'private_key_pem': private_key_pem
    }

if __name__ == '__main__':
    generate_vapid_keys()

