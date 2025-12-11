# -*- coding: utf-8 -*-
"""
Push Notifications service - שליחת התראות דרך Web Push API
"""

import os
import json
import requests
from typing import Optional, Dict, Any
from pywebpush import webpush, WebPushException
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

# VAPID keys - צריך ליצור או להשתמש ב-Firebase
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_RAW = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {
    "sub": "mailto:admin@stayclose.app"  # Email של בעל המפתח
}

def _load_vapid_private_key():
    """ממיר את ה-VAPID private key מ-base64url ל-PEM string"""
    if not VAPID_PRIVATE_KEY_RAW:
        return None
    
    try:
        # הוספת padding אם חסר
        key_str = VAPID_PRIVATE_KEY_RAW
        padding = len(key_str) % 4
        if padding:
            key_str += '=' * (4 - padding)
        
        # המרה מ-base64url ל-bytes (DER format)
        key_bytes = base64.urlsafe_b64decode(key_str)
        
        # טעינת המפתח הפרטי מ-DER
        private_key = serialization.load_der_private_key(
            key_bytes,
            password=None,
            backend=default_backend()
        )
        
        # המרה ל-PEM string - pywebpush מצפה ל-PEM string, לא object
        pem_string = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        print(f"✅ [PUSH] VAPID private key converted to PEM (length: {len(pem_string)})")
        return pem_string
    except Exception as e:
        print(f"❌ [PUSH] Error loading VAPID private key: {e}")
        import traceback
        traceback.print_exc()
        return None

# המרת המפתח ל-PEM string (pywebpush מצפה ל-PEM string)
VAPID_PRIVATE_KEY = _load_vapid_private_key()

def send_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    שולח Push Notification למשתמש
    
    Args:
        push_token: Push subscription token (JSON string)
        title: כותרת ההתראה
        body: תוכן ההתראה
        data: נתונים נוספים (אופציונלי)
    
    Returns:
        True אם הצליח, False אחרת
    """
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        print("⚠️ [PUSH] VAPID keys not configured - skipping push notification")
        return False
    
    if not push_token:
        print("⚠️ [PUSH] No push token provided")
        return False
    
    try:
        # Parse push token (JSON string)
        subscription = json.loads(push_token)
        
        # Send push notification
        # pywebpush expects the private key as a PEM string
        webpush(
            subscription_info=subscription,
            data=json.dumps({
                "title": title,
                "body": body,
                "data": data or {}
            }),
            vapid_private_key=VAPID_PRIVATE_KEY,  # PEM string format
            vapid_claims=VAPID_CLAIMS
        )
        
        print(f"✅ [PUSH] Push notification sent: {title}")
        return True
        
    except WebPushException as e:
        print(f"❌ [PUSH] WebPush error: {e}")
        # אם ה-token לא תקין, אפשר למחוק אותו
        if e.response and e.response.status_code == 410:  # Gone
            print(f"⚠️ [PUSH] Push token expired - should be deleted")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ [PUSH] Invalid push token JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ [PUSH] Error sending push notification: {e}")
        return False

