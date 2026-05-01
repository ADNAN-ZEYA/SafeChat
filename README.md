# SafeChat — AI-Powered Real-time Cyberbullying Detection System

SafeChat is a full-stack social chat platform with an integrated multi-tier AI moderation engine. It detects and suppresses toxic content in real time across private messages, posts, and comments — powered by a hybrid of keyword filtering, a large language model fallback, and a locally-trained scikit-learn classifier.

---

## Screenshots

| Login | Home Feed | Post Flagged |
|---|---|---|
| ![Login](docs/screenshots/login%20page.png) | ![Home 1](docs/screenshots/home1.png) | ![Home 3](docs/screenshots/home3.png) |

| Chat (Normal) | Chat (Blocked) | Admin Panel |
|---|---|---|
| ![Chat 1](docs/screenshots/Chat1.png) | ![Chat 2](docs/screenshots/Chat2.png) | ![Admin](docs/screenshots/Admin%20portal.png) |

---

## Features

### Core Social Features
- **Authentication** — Sign up / login with bcrypt-hashed passwords
- **Feed & Posts** — Create posts with nested comment threads
- **Private Chat** — Real-time polling-based DM system with typing indicators and online presence
- **User Profiles** — Bio, profile picture upload, post history
- **Find Friends** — Discover and connect with other users
- **Notifications** — In-app alerts for new messages and events

### AI Moderation Engine (3-Tier Fallback)
1. **Hindi/Hinglish Keyword Detection** — Instant blocking of known abusive terms
2. **LLM Fallback** — OpenRouter API (Llama 3.1 8B) for nuanced classification
3. **Local ML Model** — TF-IDF + Logistic Regression trained on `data/train.csv`

### Moderation Behavior
- **Private Chat** — Toxic messages are blocked silently; sender is notified, message is never stored
- **Posts & Comments** — Toxic content is marked `pending` for admin review rather than published
- **Reporting System** — Users can report messages (spam, harassment, hate speech, scam)

### Admin Panel
- Review and resolve reported messages
- Approve or block flagged posts
- Report status tracking with reviewer attribution

### Deployment-Ready
- Docker & Docker Compose support
- Kubernetes manifests (deployments, HPA, ingress, secrets)
- Terraform infrastructure configs
- Nginx reverse proxy with gzip and cache headers
- Mobile-responsive UI with bottom navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3 |
| **Icons** | @heroicons/react |
| **Backend** | Python, FastAPI, uvicorn |
| **ML** | scikit-learn (TF-IDF + Logistic Regression), joblib |
| **LLM** | OpenRouter API (Llama 3.1 8B) |
| **Database** | PostgreSQL via Supabase |
| **DB Driver** | psycopg2 |
| **Auth** | bcrypt password hashing |
| **Realtime (optional)** | Supabase JS client (disabled by default, polling used) |
| **Container** | Docker, Docker Compose |
| **Orchestration** | Kubernetes |
| **Infra** | Terraform, Nginx |

---

## Project Structure

```
SafeChat-main/
├── backend-ml/
│   ├── app.py                  # FastAPI app — all API routes
│   ├── database.py             # DB connection & table creation
│   ├── train_model.py          # ML model training script
│   ├── evaluate.py             # Model evaluation & metrics
│   ├── requirements.txt
│   ├── supabase_schema.sql     # Full DB schema with indexes & views
│   ├── .env.example
│   ├── data/
│   │   └── train.csv           # Training dataset
│   └── models/
│       ├── vectorizer.joblib   # Fitted TF-IDF vectorizer
│       └── model.joblib        # Fitted Logistic Regression model
├── safechat-react/
│   ├── src/
│   │   ├── App.jsx             # Root router & global state
│   │   ├── AuthPage.jsx        # Sign up / Login
│   │   ├── HomePage.jsx        # Feed, post creation, notifications
│   │   ├── ChatPanel.jsx       # Private messaging UI
│   │   ├── AdminPanel.jsx      # Moderation dashboard
│   │   ├── AdminLogin.jsx      # Admin authentication
│   │   ├── ProfilePage.jsx     # User profile editing
│   │   ├── FindFriendsPage.jsx # User discovery
│   │   ├── Sidebar.jsx         # Mobile bottom navigation
│   │   ├── NotificationsPanel.jsx
│   │   ├── hooks/
│   │   │   └── usePresence.js  # Online presence tracking
│   │   └── lib/
│   │       └── supabaseClient.js
│   ├── .env.example
│   └── package.json
├── kubernetes/
│   ├── backend-deployment.yml
│   ├── frontend-deployment.yml
│   ├── hpa.yml
│   ├── ingress.yml
│   └── secrets.yml
├── nginx/
│   └── frontend.conf
├── terraform/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── docs/screenshots/
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL (local) **or** a [Supabase](https://supabase.com) free-tier project

---

### 1. Backend Setup

```bash
cd backend-ml
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy and configure the environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
# Supabase (recommended)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DB_SSLMODE=require

# OR local Postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=safechat_db
DB_PORT=5432

# Optional — enable LLM-based classification
OPENROUTER_API_KEY=your_key_here

SECRET_KEY=change_this_in_production
```

Start the API server:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

API available at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

> Tables are created automatically on first startup via `create_tables()` in `app.py`.

---

### 2. Frontend Setup

```bash
cd safechat-react
cp .env.example .env
```

Edit `.env`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000

# Optional — leave blank to use backend polling instead
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENABLE_SUPABASE_REALTIME=false
```

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

### 3. (Optional) Retrain the ML Model

The repo ships with pre-trained model artifacts. To retrain from `data/train.csv`:

```bash
cd backend-ml
python train_model.py
```

Artifacts are written to `models/vectorizer.joblib` and `models/model.joblib`.

To evaluate:

```bash
python evaluate.py
```

> If model files are missing, the server still runs but treats all text as `clean`.

---

## Docker Compose

```bash
docker-compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

Set environment variables in `docker-compose.yml` or via a `.env` file in the project root before building.

---

## Kubernetes Deployment

Manifests are in `kubernetes/`. Apply in order:

```bash
kubectl apply -f kubernetes/secrets.yml
kubectl apply -f kubernetes/backend-deployment.yml
kubectl apply -f kubernetes/frontend-deployment.yml
kubectl apply -f kubernetes/hpa.yml
kubectl apply -f kubernetes/ingress.yml
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Register new user |
| `POST` | `/login` | Authenticate user |
| `POST` | `/send_message` | Send a private message (toxic messages are blocked) |
| `GET` | `/get_feed/{username}` | Fetch chat history for a user |
| `GET` | `/chat_notifications/{username}` | Incoming message alerts |
| `POST` | `/typing_status` | Broadcast typing indicator |
| `GET` | `/typing_status/{username}` | Poll typing status |
| `GET` | `/online_users` | List online users |
| `POST` | `/create_post` | Create post or comment (toxic → pending) |
| `GET` | `/get_posts` | Get posts with nested comments |
| `POST` | `/approve_post/{id}` | Admin: approve a pending post |
| `POST` | `/block_post/{id}` | Admin: block a post |
| `POST` | `/report_message` | Report a message |
| `GET` | `/message_reports/pending` | Admin: list pending reports |
| `POST` | `/message_reports/{id}/resolve` | Admin: resolve a report |
| `POST` | `/message_reports/{id}/dismiss` | Admin: dismiss a report |
| `POST` | `/upload_image/{username}` | Upload profile picture |
| `GET` | `/get_profile/{username}` | Get user profile |
| `POST` | `/update_profile/{username}` | Update bio / profile image |

---

## Database Schema

```
users              — id, username, email, password_hash, created_at
posts              — id, user_id, text, status, parent_id, created_at
user_profiles      — id, user_id, bio, profile_image_url, updated_at
chat_messages      — id, sender_id, receiver_id, text, status, created_at
message_reports    — id, message_id, reporter_id, reported_user_id, reason,
                     description, status, reviewed_by, reviewed_at, created_at
```

Full schema with indexes and views is in `backend-ml/supabase_schema.sql`.

---

## AI Moderation Architecture

```
Incoming text
     │
     ▼
[1] Hindi/Hinglish keyword list  ──► TOXIC (instant block)
     │ not matched
     ▼
[2] OpenRouter LLM (Llama 3.1 8B)  ──► TOXIC / CLEAN
     │ API unavailable / timeout
     ▼
[3] Local TF-IDF + Logistic Regression  ──► TOXIC / CLEAN
     │
     ▼
 Result applied:
   Chat message → blocked if TOXIC, stored if CLEAN
   Post/Comment → status: "pending" if TOXIC, "approved" if CLEAN
```

---

## Contributing

Issues and pull requests are welcome. Please open an issue first for significant changes.

---

## License

This project is for educational and demonstration purposes.
