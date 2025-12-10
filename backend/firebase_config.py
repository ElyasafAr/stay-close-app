# -*- coding: utf-8 -*-
"""
הגדרת Firebase Admin SDK לאפליקציית Stay Close
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

# בדיקה אם Firebase כבר אותחל
if not firebase_admin._apps:
    # ניסיון לטעון service account key
    service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
    
    if service_account_key_path:
        # טעינה מקובץ
        if os.path.exists(service_account_key_path):
            cred = credentials.Certificate(service_account_key_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin אותחל מקובץ")
        else:
            print(f"⚠️ קובץ service account לא נמצא: {service_account_key_path}")
    elif service_account_key_json:
        # טעינה מ-JSON string
        try:
            service_account_info = json.loads(service_account_key_json)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin אותחל מ-JSON string")
        except json.JSONDecodeError:
            print("⚠️ שגיאה בפענוח JSON של service account")
    else:
        print("⚠️ Firebase Service Account לא מוגדר - Firebase authentication לא יעבוד")
        print("   הגדר FIREBASE_SERVICE_ACCOUNT_KEY_PATH או FIREBASE_SERVICE_ACCOUNT_KEY_JSON")

def verify_firebase_token(token: str) -> dict:
    """
    מאמת Firebase ID token ומחזיר user info
    
    Args:
        token: Firebase ID token
        
    Returns:
        dict עם user_id, email, name
        
    Raises:
        HTTPException: אם ה-token לא תקין
    """
    try:
        decoded_token = auth.verify_id_token(token)
        
        return {
            'user_id': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name'),
            'picture': decoded_token.get('picture'),
            'firebase_uid': decoded_token['uid']
        }
    except ValueError as e:
        # Token לא תקין
        raise HTTPException(status_code=401, detail=f"Firebase token לא תקין: {str(e)}")
    except Exception as e:
        # שגיאה כללית
        raise HTTPException(status_code=401, detail=f"שגיאה באימות Firebase token: {str(e)}")

