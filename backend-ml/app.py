# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import joblib
import os
import json
import bcrypt # For password hashing

# --- Local Imports ---
from database import get_db_connection # Import our new function
from fastapi.middleware.cors import CORSMiddleware

# (Your ML model loading and classify_text function remain the same)
# ...
VECT_PATH = os.path.join("models", "vectorizer.joblib")
MODEL_PATH = os.path.join("models", "model.joblib")
vectorizer = joblib.load(VECT_PATH)
model = joblib.load(MODEL_PATH)
def classify_text(text):
    vect_text = vectorizer.transform([text])
    prob = model.predict_proba(vect_text)[0][1]
    label = "toxic" if prob >= 0.7 else "clean"
    return label, prob
# ...


app = FastAPI(title="SafeChat Backend")

# --- CORS Middleware ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- NEW PYDANTIC MODELS FOR AUTHENTICATION ---
class UserSignUp(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    status: str
    message: str
    username: str = None


# --- NEW AUTHENTICATION ENDPOINTS ---

@app.post("/signup", response_model=AuthResponse)
def signup(user: UserSignUp):
    """Handles new user registration."""
    db = get_db_connection()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = db.cursor()
    # Hash the password before storing it
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    try:
        query = "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)"
        cursor.execute(query, (user.username, user.email, hashed_password))
        db.commit()
        return {"status": "success", "message": "User created successfully!"}
    except db.IntegrityError: # This error occurs if username or email is a duplicate
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        cursor.close()
        db.close()


@app.post("/login", response_model=AuthResponse)
def login(user: UserLogin):
    """Handles user login verification."""
    db = get_db_connection()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = db.cursor(dictionary=True) # dictionary=True makes result a dict
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (user.username,))
    db_user = cursor.fetchone()

    cursor.close()
    db.close()

    if db_user and bcrypt.checkpw(user.password.encode('utf-8'), db_user['password'].encode('utf-8')):
        return {"status": "success", "message": "Login successful!", "username": db_user['username']}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")


# --- YOUR EXISTING MESSAGE AND COMMENT ENDPOINTS ---
# (The rest of your code for messages and comments goes here, unchanged for now)
# ...