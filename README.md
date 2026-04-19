# Aurelia — AI-Powered Personal Finance Advisor

Aurelia lets you upload bank statements, automatically categorizes every transaction using a local LLM, and gives you spending forecasts, anomaly alerts, and a RAG-powered chat interface — all running on your own machine with no external AI API costs.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · Recharts |
| Backend | Jakarta EE 10 · WildFly 31 · Java 17 · JAX-RS · JPA (Hibernate) |
| AI Service | Python 3.12 · FastAPI · LangChain · ChromaDB · HuggingFace Embeddings |
| Database | PostgreSQL 16 · ChromaDB 0.5.20 (vector store) |
| LLM | Ollama (local) — default model: `llama3.2` |
| Android | Kotlin · Jetpack Compose · MVVM · Retrofit · Room *(in progress)* |

---

## Prerequisites

You need three things installed on the host machine before running Aurelia.

### 1. Docker Desktop (or Docker Engine + Compose)

- **Windows / macOS:** https://www.docker.com/products/docker-desktop
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # log out and back in after this
  ```
- Verify: `docker --version` and `docker compose version`

### 2. Ollama (local LLM runtime)

- **macOS / Linux:**
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```
- **Windows:** download the installer from https://ollama.com/download

Pull the default model once (~2 GB):
```bash
ollama pull llama3.2
```

Ollama must be **running** before starting the stack. It usually auto-starts after install. To start it manually:
```bash
ollama serve        # macOS / Linux
# Windows: Ollama runs as a system tray app automatically
```

### 3. Git

- **macOS:** `xcode-select --install`
- **Windows:** https://git-scm.com/download/win
- **Linux:** `sudo apt install git`

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Nasrouhg24/digital-culture-aurelia.git
cd digital-culture-aurelia
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

Open `.env` and set real values:

```env
# Strong random password for PostgreSQL
DB_PASSWORD=your_strong_db_password

# At least 32 characters — generate with: openssl rand -hex 32
JWT_SECRET=your_32_char_minimum_secret

# LLM model to use via Ollama
OLLAMA_MODEL=llama3.2

# Frontend origin allowed by CORS (comma-separated for multiple)
CORS_ORIGIN=http://localhost:5173

# Leave these for local dev
VITE_BACKEND_URL=http://localhost:8080
VITE_AI_SERVICE_URL=http://localhost:8000
```

> **Never commit `.env`** — it is in `.gitignore`. Use `.env.example` to document new variables.

### 3. Start everything

```bash
docker compose up --build
```

First run builds all images and downloads base layers (~5–10 min). Subsequent starts are fast.

Wait until all services are healthy:
```
aurelia-postgres   healthy
aurelia-chromadb   healthy
aurelia-ai         healthy
aurelia-backend    Deployed "aurelia.war"
aurelia-frontend   ready in X ms
```

### 4. Open the app

| Service | URL |
|---|---|
| App (frontend) | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| AI Service | http://localhost:8000 |
| ChromaDB | http://localhost:8002 |

Register an account, upload a bank statement (PDF or CSV), and explore.

---

## Stopping & Resetting

```bash
# Stop containers, keep data
docker compose down

# Stop containers AND delete all database data (full reset)
docker compose down -v

# Restart without rebuilding images
docker compose up
```

---

## Deploying to a Public Server (One URL)

This section covers getting Aurelia live at a single public URL like `https://aurelia.example.com`.

### Architecture

```
Internet
    │  HTTPS :443 / HTTP :80
    ▼
 Caddy  ── /api/* ──► WildFly backend  (internal)
    │
    └──── /* ────────► Nginx frontend  (static build, internal)

Internal only — never exposed to internet:
  PostgreSQL · ChromaDB · AI service
  Ollama runs on the host (not in Docker)
```

### Step 1 — Choose a VPS

You need at least **4 GB RAM** to run llama3.2. Recommended providers:

| Provider | Plan | RAM | Cost |
|---|---|---|---|
| **Hetzner** | CX22 | 4 GB | ~€4/mo |
| **Hetzner** | CX32 | 8 GB | ~€9/mo ← recommended |
| **DigitalOcean** | Basic Droplet | 4 GB | $18/mo |

Pick **Ubuntu 22.04 or 24.04** as the OS.

### Step 2 — Point a domain at your server IP

In your DNS provider add an **A record**:
```
aurelia.example.com  →  YOUR_SERVER_IP
```
DNS propagation takes 1–30 min. You can skip this and use the raw IP (HTTP only, no TLS).

### Step 3 — Provision the server

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Ollama and pull the model (~2 GB)
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama3.2

# Install Git
apt install -y git
```

### Step 4 — Clone and configure

```bash
git clone https://github.com/Nasrouhg24/digital-culture-aurelia.git
cd digital-culture-aurelia
cp .env.example .env
nano .env
```

Set these values:
```env
DB_PASSWORD=<strong random password>
JWT_SECRET=<run: openssl rand -hex 32>
OLLAMA_MODEL=llama3.2
CORS_ORIGIN=https://aurelia.example.com
DOMAIN=aurelia.example.com

# Leave empty for production — frontend calls /api/ via Caddy on the same domain
VITE_BACKEND_URL=
VITE_AI_SERVICE_URL=
```

> Using a raw IP instead of a domain? Set `DOMAIN=YOUR_IP` — Caddy serves HTTP only (no auto-TLS).

### Step 5 — Build and start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

What happens:
1. PostgreSQL and ChromaDB start first
2. AI service loads the HuggingFace embedding model (~60 s on first run)
3. Backend WAR is compiled and deployed to WildFly
4. Frontend is built as a static bundle and served by Nginx
5. **Caddy obtains a Let's Encrypt TLS certificate automatically** (requires port 80/443 open and DNS pointing at this server)

Watch the startup:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6 — Open the app

Navigate to `https://aurelia.example.com` — the login screen should appear.

### Updating

```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

### Recommended firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy auto-redirects to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw allow 443/udp   # HTTP/3 QUIC
ufw enable
```

No other ports need to be public. PostgreSQL, ChromaDB, and the AI service are internal.

### Reset

```bash
docker compose -f docker-compose.prod.yml down      # stop (keep data)
docker compose -f docker-compose.prod.yml down -v   # stop and wipe all data
```

---

## Development Without Docker

Run services individually for faster iteration.

### Database + ChromaDB only (Docker)

```bash
docker compose up postgres chromadb
```

### Backend (Java / WildFly)

Requirements: Java 17+, Maven 3.9+, WildFly 31.

```bash
cd backend
mvn package -DskipTests
cp target/aurelia.war /path/to/wildfly/standalone/deployments/
```

Required env vars before starting WildFly:
```
DB_HOST=localhost  DB_PORT=5432  DB_NAME=aurelia  DB_USER=aurelia
DB_PASSWORD=...    JWT_SECRET=...    AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
```

### AI Service (Python 3.12)

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Required env vars:
```
DATABASE_URL=postgresql+asyncpg://aurelia:PASSWORD@localhost:5432/aurelia
CHROMA_HOST=localhost   CHROMA_PORT=8002
OLLAMA_BASE_URL=http://localhost:11434   OLLAMA_MODEL=llama3.2
JWT_SECRET=...   CORS_ORIGIN=http://localhost:5173
```

### Frontend (Node 20+)

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```env
VITE_BACKEND_URL=http://localhost:8080
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## Project Structure

```
aurelia/
├── backend/                    # Jakarta EE 10 WAR (Java 17)
│   └── src/main/java/com/aurelia/
│       ├── config/             # CORS, JWT filter, JAX-RS, Flyway startup
│       ├── dto/                # Request / response transfer objects
│       ├── model/              # JPA entities
│       ├── repository/         # EJB @Stateless repositories
│       ├── resource/           # JAX-RS endpoints
│       └── service/            # Business logic EJBs
├── ai-service/                 # FastAPI Python service
│   └── app/
│       ├── api/                # Route handlers (parse, chat, forecast, categorize)
│       ├── ml/                 # Batch categorizer + trend forecaster
│       └── rag/                # LangChain pipeline + ChromaDB client
├── frontend/                   # React 18 + Vite + TailwindCSS
│   └── src/
│       ├── components/         # GlassCard, Button, Input, Sidebar…
│       ├── pages/              # Dashboard, Transactions, Documents, Chat, Insights
│       └── types/              # TypeScript interfaces
├── db/
│   └── init.sql                # PostgreSQL schema
├── android/                    # Kotlin / Jetpack Compose (in progress)
├── docker-compose.yml
├── .env.example                # Copy to .env and fill in — never commit .env
├── IMPLEMENTED.md              # Full feature log and next steps
└── README.md
```

---

## Contributor Guide

- All configuration via environment variables — no hardcoded secrets, passwords, or URLs ever
- Add new backend env vars in `docker-compose.yml` and document them in `.env.example`
- Java endpoints need `@Operation` and `@Tag` OpenAPI annotations
- Python functions need full type hints
- React components are functional only — no class components
- Database schema changes go through Flyway migrations in `backend/src/main/resources/db/migration/`
- Android follows strict MVVM — no business logic in Composables

See `IMPLEMENTED.md` for what is already built and what is planned next.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `aurelia-ai` keeps restarting | Ollama is not running — run `ollama serve` on the host |
| Document stuck in "Processing" | Check `docker logs aurelia-ai`; stuck docs auto-fail after 15 min |
| `401 Invalid token` from AI service | `JWT_SECRET` differs between `.env` copies — both services must use the same value |
| Frontend blank page | Check `docker logs aurelia-frontend` for Vite build errors |
| ChromaDB connection refused | Port 8002 may be in use; check `docker ps` and `docker logs aurelia-chromadb` |
| `host.docker.internal` not resolved | Already handled via `extra_hosts: host.docker.internal:host-gateway` in `docker-compose.yml`; requires Docker 20.10+ |
| Slow first startup | The AI service loads a HuggingFace embedding model on first run (~30–60 s); subsequent starts use the cached model |
