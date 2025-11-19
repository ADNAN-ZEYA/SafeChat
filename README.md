SafeChat: AI-Powered Toxic Content Moderation Platform

SafeChat is a full-stack social media application designed to foster a safer online community. It uses a Machine Learning model to detect and moderate toxic content in real-time across posts, comments, and private chats.

🚀 Key Features

Real-Time Toxicity Detection: Instantly analyzes text to detect toxic language using a trained ML model.

Smart Moderation System:

Public Posts/Comments: Toxic content is flagged as "Pending" for moderator approval.

Private Chat: Toxic messages are blocked instantly before they are sent.

Secure User Authentication: Complete Sign Up and Login system with hashed passwords (Bcrypt).

Profile Customization: Users can update their bio and upload profile pictures.

Interactive UI: Modern, 3-column layout with a dark theme ("Vibrant Dark") and responsive design.

Live Notifications: Real-time updates for likes, comments, and moderation actions.

🛠️ Tech Stack

Frontend:

React (Vite)

Tailwind CSS

Heroicons

Backend:

Python (FastAPI)

MySQL (Database)

Scikit-learn (Machine Learning)

Uvicorn (ASGI Server)

# Project Structure
SAFECHAT-MINI/
│
├── backend-ml/ # Python backend (FastAPI/Flask + ML)
│ ├── app.py # Main API server
│ ├── train_model.py # Model training script
│ ├── evaluate.py # Evaluation script
│ ├── database.py # Message storage helper
│ ├── metrics.py # Evaluation metrics
│ ├── messages.json # Stored messages (sample)
│ ├── comments.json # Sample dataset
│ ├── data/ # Training/testing datasets
│ ├── models/ # Saved ML models
│ ├── uploads/ # Uploaded test files
│ └── venv/ # Python environment (ignored)
│
├── safechat-react/ # React frontend
│ ├── src/
│ ├── public/
│ └── package.json
│
├── .gitignore
└── README.md 


---

###🔧 Backend Setup (backend-ml)

```bash
cd backend-ml

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn app:app --reload --host 127.0.0.1 --port 8000

#Backend now runs at:
👉 http://127.0.0.1:8000

2. Database Setup

Open MySQL Workbench.

Create the database: CREATE DATABASE safechat_db;

The backend will automatically create the necessary tables (users, posts, chat_messages, user_profiles) on the first run.

# Frontend Setup (safechat-react)
cd safechat-react
npm install
npm run dev


# Frontend runs at:
👉 http://localhost:5173

## ML Training & Evaluation
#Train model
cd backend-ml
source venv/bin/activate
python train_model.py

#Evaluate model
python evaluate.py


# Saved models are stored inside:
backend-ml/models/