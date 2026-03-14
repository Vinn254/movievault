from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import Optional
import uuid

from app.database import Database, PAYMENTS_COLLECTION, PURCHASES_COLLECTION, MOVIES_COLLECTION
from app.schemas import PaymentInitiate, PaymentResponse, PaymentStatus
from app.mpesa import mpesa_client
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Purchase validity period (48 hours from payment)
PURCHASE_VALIDITY_HOURS = 48

@router.post("/initiate", response_model=PaymentResponse)
async def initiate_payment(payment: PaymentInitiate, current_user: dict = Depends(get_current_user)):
    """Initiate M-Pesa STK push payment"""
    db = Database.get_db()
    
    # Validate phone number format
    phone = payment.phone_number.replace("+", "")
    if not phone.startswith("254"):
        # Add country code if missing
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("7") or phone.startswith("1"):
            phone = "254" + phone
    
    # Validate it's 12 digits
    if len(phone) != 12 or not phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Use format: 254XXXXXXXXX"
        )
    
    # Get movie details
    movie = await db[MOVIES_COLLECTION].find_one({"_id": payment.movie_id, "is_active": True})
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
    # Check if this is a free movie - if so, grant access directly
    is_free = movie.get("is_free", False)
    
    if is_free:
        # For free movies, create a purchase record directly without payment
        purchase_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=PURCHASE_VALIDITY_HOURS)
        
        purchase = {
            "_id": purchase_id,
            "user_id": current_user["_id"],
            "movie_id": payment.movie_id,
            "payment_id": None,  # No payment needed for free movies
            "is_free": True,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        await db[PURCHASES_COLLECTION].insert_one(purchase)
        
        return {
            "checkout_request_id": f"free_{purchase_id}",
            "customer_message": "Free movie! You can now watch it."
        }
    
    # Check if user already has valid purchase
    existing_purchase = await db[PURCHASES_COLLECTION].find_one({
        "user_id": current_user["_id"],
        "movie_id": payment.movie_id,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if existing_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have access to this movie"
        )
    
    # Generate transaction ID
    transaction_id = str(uuid.uuid4())
    
    try:
        # Initiate STK push
        response = mpesa_client.initiate_stk_push(
            phone_number=phone,
            amount=movie["price"],
            transaction_id=transaction_id
        )
        
        # Store payment record
        payment_record = {
            "_id": transaction_id,
            "user_id": current_user["_id"],
            "movie_id": payment.movie_id,
            "phone_number": phone,
            "amount": movie["price"],
            "checkout_request_id": response.get("CheckoutRequestID"),
            "status": "pending",
            "mpesa_receipt_number": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db[PAYMENTS_COLLECTION].insert_one(payment_record)
        
        return {
            "checkout_request_id": response.get("CheckoutRequestID"),
            "customer_message": response.get("CustomerMessage", "Payment initiated. Please check your phone.")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate payment: {str(e)}"
        )

@router.post("/callback")
async def payment_callback(callback_data: dict):
    """Handle M-Pesa payment callback"""
    db = Database.get_db()
    
    try:
        # Extract callback data
        body = callback_data.get("Body", {})
        stk_callback = body.get("stkCallback", {})
        
        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc")
        
        # Find payment record
        payment = await db[PAYMENTS_COLLECTION].find_one({
            "checkout_request_id": checkout_request_id
        })
        
        if not payment:
            return {"status": "error", "message": "Payment not found"}
        
        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get("CallbackMetadata", {})
            items = callback_metadata.get("Item", [])
            
            mpesa_receipt = None
            amount = payment["amount"]
            
            for item in items:
                if item.get("Name") == "MpesaReceiptNumber":
                    mpesa_receipt = item.get("Value")
                elif item.get("Name") == "Amount":
                    amount = item.get("Value")
            
            # Update payment status
            await db[PAYMENTS_COLLECTION].update_one(
                {"_id": payment["_id"]},
                {
                    "$set": {
                        "status": "completed",
                        "mpesa_receipt_number": mpesa_receipt,
                        "result_code": result_code,
                        "result_desc": result_desc,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Create purchase record
            purchase_id = str(uuid.uuid4())
            expires_at = datetime.utcnow() + timedelta(hours=PURCHASE_VALIDITY_HOURS)
            
            purchase = {
                "_id": purchase_id,
                "user_id": payment["user_id"],
                "movie_id": payment["movie_id"],
                "payment_id": payment["_id"],
                "created_at": datetime.utcnow(),
                "expires_at": expires_at
            }
            
            await db[PURCHASES_COLLECTION].insert_one(purchase)
            
            return {"status": "success", "message": "Payment processed successfully"}
            
        else:
            # Payment failed
            await db[PAYMENTS_COLLECTION].update_one(
                {"_id": payment["_id"]},
                {
                    "$set": {
                        "status": "failed",
                        "result_code": result_code,
                        "result_desc": result_desc,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {"status": "failed", "message": result_desc}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/status/{checkout_request_id}", response_model=PaymentStatus)
async def check_payment_status(checkout_request_id: str, current_user: dict = Depends(get_current_user)):
    """Check payment status"""
    db = Database.get_db()
    
    payment = await db[PAYMENTS_COLLECTION].find_one({
        "checkout_request_id": checkout_request_id,
        "user_id": current_user["_id"]
    })
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # If payment is still pending, check with M-Pesa
    if payment["status"] == "pending":
        try:
            status_response = mpesa_client.check_payment_status(checkout_request_id)
            
            result_code = status_response.get("ResultCode")
            
            if result_code == 0:
                # Payment successful - update our records
                callback_metadata = status_response.get("CallbackMetadata", {})
                items = callback_metadata.get("Item", [])
                
                mpesa_receipt = None
                for item in items:
                    if item.get("Name") == "MpesaReceiptNumber":
                        mpesa_receipt = item.get("Value")
                
                await db[PAYMENTS_COLLECTION].update_one(
                    {"_id": payment["_id"]},
                    {
                        "$set": {
                            "status": "completed",
                            "mpesa_receipt_number": mpesa_receipt,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Create purchase record
                purchase_id = str(uuid.uuid4())
                expires_at = datetime.utcnow() + timedelta(hours=PURCHASE_VALIDITY_HOURS)
                
                purchase = {
                    "_id": purchase_id,
                    "user_id": payment["user_id"],
                    "movie_id": payment["movie_id"],
                    "payment_id": payment["_id"],
                    "created_at": datetime.utcnow(),
                    "expires_at": expires_at
                }
                
                await db[PURCHASES_COLLECTION].insert_one(purchase)
                
                payment["status"] = "completed"
                
        except Exception as e:
            # Keep existing status if M-Pesa check fails
            pass
    
    return {
        "checkout_request_id": payment["checkout_request_id"],
        "amount": payment["amount"],
        "status": payment["status"],
        "mpesa_receipt_number": payment.get("mpesa_receipt_number"),
        "phone_number": payment.get("phone_number"),
        "created_at": payment["created_at"]
    }
