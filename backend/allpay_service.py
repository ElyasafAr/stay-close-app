# -*- coding: utf-8 -*-
"""
Allpay Service - Handles Allpay payment integration
"""

import os
import hashlib
import hmac
import json
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from models import User, Subscription


def utc_now():
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


def generate_allpay_signature(params: dict, api_key: str) -> str:
    """
    Generate SHA256 HMAC signature for Allpay API requests
    
    Steps:
    1. Remove 'sign' parameter if present
    2. Exclude empty values
    3. Sort parameters alphabetically
    4. Concatenate values with ':'
    5. Append API key
    6. Generate SHA256 HMAC
    """
    # Remove sign parameter
    params = {k: v for k, v in params.items() if k != 'sign' and v}
    
    # Sort alphabetically
    sorted_params = sorted(params.items())
    
    # Concatenate values
    concatenated = ':'.join(str(v) for _, v in sorted_params)
    
    # Append API key
    string_to_sign = f"{concatenated}:{api_key}"
    
    # Generate SHA256 HMAC
    signature = hmac.new(
        api_key.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature


def verify_webhook_signature(data: dict, signature: str, secret: str) -> bool:
    """Verify Allpay webhook signature"""
    expected_signature = generate_allpay_signature(data, secret)
    return hmac.compare_digest(expected_signature, signature)


def create_payment_link(
    db: Session,
    user_id: str,
    plan_type: str,  # 'monthly' or 'yearly'
    amount: float
) -> Dict[str, Any]:
    """
    Create a payment link in Allpay
    
    Returns:
        {
            'success': bool,
            'payment_url': str,
            'order_id': str,
            'error': str
        }
    """
    login = os.getenv('ALLPAY_LOGIN')
    api_key = os.getenv('ALLPAY_API_KEY')
    success_url = os.getenv('ALLPAY_SUCCESS_URL')
    cancel_url = os.getenv('ALLPAY_CANCEL_URL')
    api_url = os.getenv('API_URL', os.getenv('RAILWAY_PUBLIC_DOMAIN', ''))
    
    if not all([login, api_key, success_url]):
        return {
            'success': False,
            'error': 'Allpay credentials not configured'
        }
    
    # Generate order ID
    order_id = f"stayclose_{user_id}_{int(utc_now().timestamp())}"
    
    # Prepare description
    description_map = {
        'monthly': 'תרומה חודשית - Stay Close (5₪/חודש)',
        'yearly': 'תרומה שנתית - Stay Close (50₪/שנה - 12 חודשים, 2 במתנה!)'
    }
    
    # Prepare request
    params = {
        'login': login,
        'order_id': order_id,
        'amount': str(amount),
        'currency': 'ILS',
        'description': description_map.get(plan_type, f'תרומה - Stay Close ({plan_type})'),
        'success_url': success_url,
        'cancel_url': cancel_url or success_url,
        'notifications_url': f"{api_url}/api/allpay/webhook" if api_url else None,
        'recurring': '1' if plan_type == 'monthly' else '0',  # Enable recurring for monthly
    }
    
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}
    
    # Generate signature
    params['sign'] = generate_allpay_signature(params, api_key)
    
    # Send request to Allpay
    try:
        # Note: This is a placeholder - need to check Allpay API endpoint
        # For now, we'll return a mock response structure
        response = requests.post(
            'https://secure.allpay.co.il/api/v1/payments',
            json=params,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success' or 'payment_url' in data:
                return {
                    'success': True,
                    'payment_url': data.get('payment_url') or data.get('url'),
                    'order_id': order_id
                }
        
        return {
            'success': False,
            'error': f"Allpay API error: {response.text}"
        }
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f"Error connecting to Allpay: {str(e)}"
        }
    except Exception as e:
        return {
            'success': False,
            'error': f"Error creating payment link: {str(e)}"
        }


def process_allpay_payment(
    db: Session,
    webhook_data: dict
) -> Dict[str, Any]:
    """
    Process Allpay webhook payment
    
    Webhook data structure (example):
    {
        'order_id': str,
        'payment_id': str,
        'amount': str,
        'status': int,  # 1 = success
        'buyer_name': str,
        'sign': str
    }
    """
    # Verify signature
    secret = os.getenv('ALLPAY_WEBHOOK_SECRET')
    if not secret:
        return {'success': False, 'error': 'Webhook secret not configured'}
    
    received_signature = webhook_data.get('sign')
    if not received_signature:
        return {'success': False, 'error': 'No signature in webhook'}
    
    # Verify signature
    if not verify_webhook_signature(webhook_data, received_signature, secret):
        return {'success': False, 'error': 'Invalid webhook signature'}
    
    # Check payment status (1 = success in Allpay)
    if webhook_data.get('status') != 1:
        return {'success': False, 'error': 'Payment not successful'}
    
    # Extract order_id (format: stayclose_{user_id}_{timestamp})
    order_id = webhook_data.get('order_id', '')
    if not order_id.startswith('stayclose_'):
        return {'success': False, 'error': 'Invalid order ID format'}
    
    # Extract user_id from order_id
    parts = order_id.split('_')
    if len(parts) < 2:
        return {'success': False, 'error': 'Cannot extract user_id from order_id'}
    
    user_id = parts[1]
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {'success': False, 'error': 'User not found'}
    
    # Check if subscription already exists for this order
    existing = db.query(Subscription).filter(
        Subscription.allpay_order_id == order_id
    ).first()
    
    if existing:
        # Update existing subscription
        existing.status = 'active'
        existing.allpay_payment_id = webhook_data.get('payment_id')
        if not existing.allpay_recurring_id and webhook_data.get('recurring_id'):
            existing.allpay_recurring_id = webhook_data.get('recurring_id')
        db.commit()
        return {
            'success': True,
            'message': 'Subscription updated',
            'subscription_id': existing.id
        }
    
    # Determine plan type from order_id or amount
    amount = float(webhook_data.get('amount', 0))
    # 5₪ = monthly, 50₪ = yearly
    if amount >= 50:
        plan_type = 'yearly'
    else:
        plan_type = 'monthly'
    
    # Create subscription
    from subscription_service import create_allpay_subscription
    
    subscription = create_allpay_subscription(
        db=db,
        user_id=user_id,
        plan_type=plan_type,
        allpay_order_id=order_id,
        allpay_payment_id=webhook_data.get('payment_id'),
        price_paid=amount,
        allpay_recurring_id=webhook_data.get('recurring_id')
    )
    
    return {
        'success': True,
        'message': 'Subscription created',
        'subscription_id': subscription.id
    }
