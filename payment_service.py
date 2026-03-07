import os
import stripe
from typing import Optional
from models import Payment, PaymentStatus

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

def create_payment_intent(amount: float, currency: str = "usd", metadata: Optional[dict] = None) -> dict:
    """
    Create a Stripe payment intent for escrow.
    Returns payment intent object.
    """
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency,
            metadata=metadata or {},
            payment_method_types=["card"],
            capture_method="manual"  # Hold payment until event completion
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "status": intent.status
        }
    except Exception as e:
        raise Exception(f"Payment intent creation failed: {str(e)}")

def confirm_payment(payment_intent_id: str) -> bool:
    """
    Confirm and capture the payment (move from pending to paid).
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == "requires_capture":
            intent.capture()
            return True
        return False
    except Exception as e:
        raise Exception(f"Payment confirmation failed: {str(e)}")

def release_payment(payment_intent_id: str) -> bool:
    """
    Release payment to artist (after event completion).
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == "succeeded":
            # Payment already captured, create transfer to artist account
            # In production, you'd transfer to connected account
            return True
        return False
    except Exception as e:
        raise Exception(f"Payment release failed: {str(e)}")

def refund_payment(payment_intent_id: str, amount: Optional[float] = None) -> dict:
    """
    Refund payment (full or partial).
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        refund_params = {
            "payment_intent": payment_intent_id
        }
        if amount:
            refund_params["amount"] = int(amount * 100)
        
        refund = stripe.Refund.create(**refund_params)
        return {
            "refund_id": refund.id,
            "status": refund.status,
            "amount": refund.amount / 100
        }
    except Exception as e:
        raise Exception(f"Refund failed: {str(e)}")

def get_payment_status(payment_intent_id: str) -> str:
    """
    Get current status of payment intent.
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return intent.status
    except Exception as e:
        raise Exception(f"Failed to retrieve payment status: {str(e)}")

# For development/testing without Stripe
def create_mock_payment_intent(amount: float, metadata: Optional[dict] = None) -> dict:
    """Mock payment for development"""
    return {
        "client_secret": f"mock_secret_{metadata.get('gig_id', 'test')}",
        "payment_intent_id": f"pi_mock_{metadata.get('gig_id', 'test')}",
        "status": "requires_payment_method"
    }

