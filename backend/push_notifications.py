# -*- coding: utf-8 -*-
"""
שירות לשליחת Push Notifications באמצעות Firebase Cloud Messaging (FCM)
"""

import os
import firebase_admin
from firebase_admin import messaging
from typing import Optional, Dict, Any
import json

def send_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    push_token_param: Optional[str] = None,
    title_param: Optional[str] = None,
    body_param: Optional[str] = None,
    data_param: Optional[Dict[str, Any]] = None
):
    """
    שולח Push Notification באמצעות FCM
    
    Args:
        push_token: FCM token של המכשיר
        title: כותרת ההתראה
        body: תוכן ההתראה
        data: נתונים נוספים (dict)
        
    Note:
        תומך גם ב-keyword arguments וגם ב-positional arguments
        כדי לתמוך בשתי הדרכים שהפונקציה נקראת
    """
    # תמיכה בשתי דרכים לקריאה
    token = push_token or push_token_param
    notification_title = title or title_param
    notification_body = body or body_param
    notification_data = data or data_param or {}
    
    if not token:
        print("⚠️ [PUSH] No push token provided, skipping notification")
        return
    
    # בדיקה ש-Firebase אותחל
    if not firebase_admin._apps:
        print("⚠️ [PUSH] Firebase Admin not initialized, skipping notification")
        return
    
    try:
        # בניית הודעת FCM
        message = messaging.Message(
            token=token,
            notification=messaging.Notification(
                title=notification_title,
                body=notification_body
            ),
            data={
                # המרת כל הערכים ל-strings (FCM דורש strings)
                str(k): str(v) if not isinstance(v, str) else v
                for k, v in notification_data.items()
            }
        )
        
        # שליחת ההודעה
        response = messaging.send(message)
        print(f"✅ [PUSH] Successfully sent notification: {response}")
        
    except messaging.UnregisteredError:
        print(f"⚠️ [PUSH] Token is unregistered: {token[:20]}...")
        # אפשר למחוק את ה-token מהמסד נתונים כאן
    except messaging.InvalidArgumentError as e:
        print(f"❌ [PUSH] Invalid argument: {e}")
    except Exception as e:
        print(f"❌ [PUSH] Failed to send notification: {e}")
        import traceback
        print(traceback.format_exc())
