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

# VAPID keys - צריך ליצור או להשתמש ב-Firebase
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {
    "sub": "mailto:admin@stayclose.app"  # Email של בעל המפתח
}

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
        webpush(
            subscription_info=subscription,
            data=json.dumps({
                "title": title,
                "body": body,
                "data": data or {}
            }),
            vapid_private_key=VAPID_PRIVATE_KEY,
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

