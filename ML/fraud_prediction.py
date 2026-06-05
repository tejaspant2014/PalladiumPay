from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, computed_field
from typing import Literal, Annotated
import pandas as pd
import numpy as np
import joblib
from catboost import CatBoostClassifier

app = FastAPI()


# Load using native CatBoost method
model = CatBoostClassifier()
model.load_model("financial_fraud_model.cbm")
#pydantic model to validate incoming data
class UserInput(BaseModel):
    amount: Annotated[float, Field(..., gt=0)]
    account_balance_before: Annotated[float, Field(..., ge=0)]
    account_balance_after: Annotated[float, Field(..., gt=-0.000001)]
    distance_from_home_km: Annotated[float, Field(..., gt=-0.000001)]
    device_trusted: Annotated[bool, Field(...)]
    new_payee: Annotated[bool, Field(...)]
    international_transaction: Annotated[bool, Field(...)]
    transactions_last_24h: Annotated[int, Field(..., ge=0)]
    failed_logins_last_week: Annotated[int, Field(..., ge=0)]
    
    merchant_category: Annotated[
        Literal["ATM", "Apparel", "Dining", "Electronics", "Entertainment", "Financial", "Grocery", "Luxury"], 
        Field(...)
    ]
    transaction_type: Annotated[
        Literal["purchase", "transfer", "withdrawal"], 
        Field(...)
    ]

# Precise column ordering tracking the exact behavior of pd.get_dummies(..., drop_first=True)
ALL_TRAINING_COLUMNS = [
    'amount', 
    'account_balance_before', 
    'account_balance_after', 
    'distance_from_home_km', 
    'device_trusted', 
    'new_payee', 
    'international_transaction', 
    'transactions_last_24h', 
    'failed_logins_last_week', 
    'velocity_amount_risk',             
    'amount_balance_ratio',      
    'merchant_category_Apparel', 
    'merchant_category_Dining', 
    'merchant_category_Electronics', 
    'merchant_category_Entertainment', 
    'merchant_category_Financial', 
    'merchant_category_Grocery', 
    'merchant_category_Luxury', 
    'transaction_type_transfer', 
    'transaction_type_withdrawal'
]

@app.post("/api/v1/predict-risk")
def predict_risk(payload: UserInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model weights not available.")
    
    payload_dict = payload.model_dump()
    
    selected_merchant = payload_dict.pop('merchant_category')
    selected_type = payload_dict.pop('transaction_type')
    
    #  Secure Server-Side Feature Engineering
    # Feature 1: Velocity Risk
    payload_dict['velocity_amount_risk'] = payload_dict['transactions_last_24h'] * payload_dict['amount']
    
    # Feature 2: Amount to Balance Ratio
    # Zero-division safety: checks if account_balance_before is greater than 0
    if payload_dict['account_balance_before'] > 0:
        payload_dict['amount_balance_ratio'] = payload_dict['amount'] / payload_dict['account_balance_before']
    else:
        payload_dict['amount_balance_ratio'] = 0.0  # Adjust this value to match your training default if different
    
    # Initialize all missing dummy tracking positions to 0
    for col in ALL_TRAINING_COLUMNS:
        if col not in payload_dict:
            payload_dict[col] = 0
            
    # Flip active categorical flags to 1 
    target_merchant_column = f"merchant_category_{selected_merchant}"
    if target_merchant_column in ALL_TRAINING_COLUMNS:
        payload_dict[target_merchant_column] = 1
        
    target_type_column = f"transaction_type_{selected_type}"
    if target_type_column in ALL_TRAINING_COLUMNS:
        payload_dict[target_type_column] = 1
        
    input_data = pd.DataFrame([payload_dict])[ALL_TRAINING_COLUMNS]

    try:
        # Generate raw math probability scalar
        fraud_prob = model.predict_proba(input_data)[0][1]
        return JSONResponse(status_code=200, content={"fraud_probability": float(fraud_prob)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")