# -*- coding: utf-8 -*-
"""
Push Notifications service - שליחת התראות דרך Firebase Cloud Messaging (FCM)
"""

import os
import json
from typing import Optional, Dict, Any, List

# Firebase Admin SDK
import firebase_admin
from firebase_admin import messaging

def send_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    שולח Push Notification למשתמש דרך FCM
    
    Args:
        push_token: FCM token או Web Push subscription JSON
        title: כותרת ההתראה
        body: תוכן ההתראה
        data: נתונים נוספים (אופציונלי)
    
    Returns:
        True אם הצליח, False אחרת
    """
    if not push_token:
        print("⚠️ [FCM] No push token provided")
        return False
    
    # בדיקה שFirebase מאותחל
    if not firebase_admin._apps:
        print("⚠️ [FCM] Firebase Admin not initialized - skipping push notification")
        return False
    
    try:
        # ננסה לפרסר כ-JSON (Web Push subscription format)
        # אם זה JSON, נחלץ את ה-endpoint ונשתמש בו כ-FCM token
        token = push_token
        
        try:
            subscription_data = json.loads(push_token)
            # אם יש endpoint, זה Web Push subscription - צריך FCM token במקום
            if 'endpoint' in subscription_data:
                # Web Push subscription - לא יכולים להשתמש בזה עם FCM
                # צריך FCM token
                print("⚠️ [FCM] Received Web Push subscription instead of FCM token")
                print("⚠️ [FCM] Web Push endpoint:", subscription_data.get('endpoint', '')[:50] + '...')
                # ננסה לחלץ FCM token אם זה Firebase endpoint
                endpoint = subscription_data.get('endpoint', '')
                if 'fcm.googleapis.com' in endpoint or 'firebase' in endpoint.lower():
                    # חלץ את ה-token מה-endpoint
                    # Format: https://fcm.googleapis.com/fcm/send/TOKEN
                    parts = endpoint.split('/')
                    if parts:
                        token = parts[-1]
                        print(f"✅ [FCM] Extracted FCM token from endpoint: {token[:20]}...")
                else:
                    print("❌ [FCM] Not a Firebase endpoint - cannot send FCM message")
                    return False
        except json.JSONDecodeError:
            # לא JSON - כנראה FCM token ישירות
            token = push_token
        
        # יצירת ההודעה
        # Data payload - עובד גם ב-background
        data_payload = {
            'title': title,
            'body': body,
            'click_action': '/',
            'icon': '/icon-192x192.png',
        }
        
        # הוספת נתונים נוספים אם יש
        if data:
            for key, value in data.items():
                # FCM data values must be strings
                data_payload[key] = str(value) if not isinstance(value, str) else value
        
        # יצירת Message object
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data_payload,
            token=token,
            # הגדרות ל-Web
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon='/icon-192x192.png',
                    badge='/icon-192x192.png',
                    tag='reminder',
                    require_interaction=False,
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link='/'
                )
            ),
            # הגדרות ל-Android
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    title=title,
                    body=body,
                    icon='ic_notification',
                    color='#a8d5e2',
                    default_vibrate_timings=True,
                    default_sound=True,
                )
            ),
        )
        
        # שליחת ההודעה
        response = messaging.send(message)
        print(f"✅ [FCM] Push notification sent successfully!")
        print(f"   Title: {title}")
        print(f"   Response ID: {response}")
        return True
        
    except messaging.UnregisteredError:
        print(f"⚠️ [FCM] Token is unregistered (user unsubscribed) - should delete token")
        return False
    except messaging.SenderIdMismatchError:
        print(f"❌ [FCM] Sender ID mismatch - check Firebase configuration")
        return False
    except Exception as e:
        print(f"❌ [FCM] Error sending push notification: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_push_notification_batch(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, int]:
    """
    שולח Push Notification למספר משתמשים בבת אחת
    
    Args:
        tokens: רשימת FCM tokens
        title: כותרת ההתראה
        body: תוכן ההתראה
        data: נתונים נוספים (אופציונלי)
    
    Returns:
        dict עם success_count ו-failure_count
    """
    if not tokens:
        print("⚠️ [FCM] No tokens provided for batch send")
        return {'success_count': 0, 'failure_count': 0}
    
    if not firebase_admin._apps:
        print("⚠️ [FCM] Firebase Admin not initialized - skipping batch push")
        return {'success_count': 0, 'failure_count': len(tokens)}
    
    try:
        # Data payload
        data_payload = {
            'title': title,
            'body': body,
            'click_action': '/',
            'icon': '/icon-192x192.png',
        }
        
        if data:
            for key, value in data.items():
                data_payload[key] = str(value) if not isinstance(value, str) else value
        
        # יצירת MulticastMessage
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data_payload,
            tokens=tokens,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon='/icon-192x192.png',
                )
            ),
        )
        
        # שליחה
        response = messaging.send_each_for_multicast(message)
        
        print(f"✅ [FCM] Batch send complete:")
        print(f"   Success: {response.success_count}")
        print(f"   Failure: {response.failure_count}")
        
        return {
            'success_count': response.success_count,
            'failure_count': response.failure_count
        }
        
    except Exception as e:
        print(f"❌ [FCM] Error in batch send: {e}")
        return {'success_count': 0, 'failure_count': len(tokens)}
