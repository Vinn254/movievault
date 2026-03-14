import base64
import requests
import os
from datetime import datetime
from dotenv import load_dotenv
import hashlib

load_dotenv()

class MpesaClient:
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        self.passkey = os.getenv("MPESA_PASSKEY")
        self.env = os.getenv("MPESA_ENV", "sandbox")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL")
        
        # Set base URLs based on environment
        if self.env == "sandbox":
            self.base_url = "https://sandbox.safaricom.co.ke"
        else:
            self.base_url = "https://api.safaricom.co.ke"
        
        self.access_token = None
        self.token_expiry = None
    
    def get_access_token(self) -> str:
        """Get OAuth access token"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        auth_bytes = auth_string.encode("utf-8")
        auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")
        
        headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            # Set expiry with 1 minute buffer
            self.token_expiry = datetime.now() + timedelta(seconds=data.get("expires_in", 3600) - 60)
            return self.access_token
        else:
            raise Exception(f"Failed to get access token: {response.text}")
    
    def generate_password(self) -> str:
        """Generate password for STK push"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_string = f"{self.business_short_code}{self.passkey}{timestamp}"
        password_bytes = password_string.encode("utf-8")
        return base64.b64encode(password_bytes).decode("utf-8")
    
    def initiate_stk_push(self, phone_number: str, amount: float, transaction_id: str) -> dict:
        """Initiate STK push payment"""
        access_token = self.get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        payload = {
            "BusinessShortCode": self.business_short_code,
            "Password": self.generate_password(),
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.business_short_code,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": transaction_id,
            "TransactionDesc": f"MovieVault Payment - {transaction_id}"
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{self.base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"STK push failed: {response.text}")
    
    def check_payment_status(self, checkout_request_id: str) -> dict:
        """Check payment status"""
        access_token = self.get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        payload = {
            "BusinessShortCode": self.business_short_code,
            "Password": self.generate_password(),
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{self.base_url}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Status check failed: {response.text}")

# Create singleton instance
mpesa_client = MpesaClient()

from datetime import timedelta
