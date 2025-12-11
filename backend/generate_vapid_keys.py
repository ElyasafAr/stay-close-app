# -*- coding: utf-8 -*-
"""
סקריפט ליצירת VAPID keys ל-Push Notifications
"""

from pywebpush import WebPusher
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
    
    # Serialize keys
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Convert to base64 URL-safe format for VAPID
    private_key_bytes = private_pem.split(b'-----BEGIN PRIVATE KEY-----')[1].split(b'-----END PRIVATE KEY-----')[0].replace(b'\n', b'')
    public_key_bytes = public_pem.split(b'-----BEGIN PUBLIC KEY-----')[1].split(b'-----END PUBLIC KEY-----')[0].replace(b'\n', b'')
    
    private_key_base64 = base64.urlsafe_b64encode(base64.b64decode(private_key_bytes)).decode('utf-8').rstrip('=')
    public_key_base64 = base64.urlsafe_b64encode(base64.b64decode(public_key_bytes)).decode('utf-8').rstrip('=')
    
    print("=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print("\nAdd these to your .env file or Railway environment variables:\n")
    print(f"VAPID_PUBLIC_KEY={public_key_base64}")
    print(f"VAPID_PRIVATE_KEY={private_key_base64}")
    print("\n" + "=" * 60)
    
    return {
        'public_key': public_key_base64,
        'private_key': private_key_base64
    }

if __name__ == '__main__':
    generate_vapid_keys()

