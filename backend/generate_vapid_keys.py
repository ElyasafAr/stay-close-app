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
    
    # Serialize private key to PEM format
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key to DER format (needed for VAPID)
    public_der = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Convert to base64 URL-safe format for VAPID
    # Public key: DER format -> base64url
    public_key_base64 = base64.urlsafe_b64encode(public_der).decode('utf-8').rstrip('=')
    
    # Private key: PEM format -> extract key bytes -> base64url
    # Extract the key from PEM
    private_key_der = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_key_base64 = base64.urlsafe_b64encode(private_key_der).decode('utf-8').rstrip('=')
    
    print("=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print("\nAdd these to your .env file or Railway environment variables:\n")
    print(f"VAPID_PUBLIC_KEY={public_key_base64}")
    print(f"VAPID_PRIVATE_KEY={private_key_base64}")
    print("\n" + "=" * 60)
    print("\n⚠️  Keep the PRIVATE KEY secret! Never share it publicly.")
    print("=" * 60)
    
    return {
        'public_key': public_key_base64,
        'private_key': private_key_base64
    }

if __name__ == '__main__':
    generate_vapid_keys()

