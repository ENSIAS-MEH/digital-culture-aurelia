# Aurelia — Implementation Status

This document tracks every feature that has been built and tested, plus the planned next steps. Update it as work progresses.

---

## Implemented & Working

### Authentication
- JWT-based auth (HS256, 32-byte key derived from `JWT_SECRET`)
- Register / Login endpoints (`POST /api/auth/register`, `POST /api/auth/login`)
- All protected routes validated via `JwtFilter` on the backend
- Frontend `AuthContext` persists token to `localStorage`, injects it into every API call
- Token shared between backend (Java/jjwt) and AI service (Python/python-jose) — key derivation is identical on both sides

### Document Processing
- Upload PDF or CSV via drag-and-drop or file picker (`POST /api/documents/upload`)
- File stored to DB, status set to `pending`
- Async EJB (`@Asynchronous`) triggers AI service parse pipeline immediately after upload
- AI service (`POST /parse/`) extracts transactions via LangChain + Ollama (llama3.2)
- Transactions written to PostgreSQL with description, amount, date, merchant, raw category
- Fields sanitised before insert: HTML stripped, max lengths enforced
- Processing status visible in real time — frontend polls every 4 s while any doc is `pending`/`processing`
- Stuck-document timeout: `@Singleton @Schedule` job marks documents failed after 15 min
- Delete document cascades to all its transactions

### Transaction Categorization
- Batch LLM prompt: all transactions in one call → numbered list response → parsed back
- In-memory cache avoids re-classifying duplicates within a session
- Result: ~6 s for 46 transactions (previously ~2 min with sequential calls)
- Category stored as FK to `categories` table; color stored on transaction row
- Manual re-categorization from Transactions page (`PATCH /api/transactions/{id}/category`)
- Optimistic UI: category badge updates immediately, spinner shown while saving

### Chat (RAG)
- Session management: create / list / select sessions (`/api/chat/sessions`)
- Messages persisted to `chat_messages` table — full history survives page reload
- Backend proxies to AI service (`POST /chat/{session_id}`) and stores both user + AI messages
- AI service builds RAG context from user's uploaded documents (ChromaDB per-user collection)
- LLM response via Ollama (configurable model via `OLLAMA_MODEL` env var)
- Session title auto-set from first user message
- Suggested questions work correctly: session is created first, then message is sent with real session ID (race condition fixed)
- Sources (RAG document excerpts) shown collapsibly under each AI response

### Dashboard
- Summary stats: Total Expenses, Total Income, Net Balance — last 90 days
- Spending by Category: donut chart (Recharts PieChart) with color-coded legend badges
- Daily Spending: area chart with violet→fuchsia gradient stroke + fill
- Recent Transactions: last 5, with category color dot and "View all" link
- Empty states with CTAs to upload documents when no data exists
- All data from `GET /api/transactions/summary` and `GET /api/transactions`

### Transactions Page
- Full transaction table with date, description, merchant, category badge, amount
- Sticky table header (visible while scrolling)
- Filters: date range + category — applied to backend query
- Inline category editor: click badge → dropdown → auto-saves with loading indicator
- Confirmed transactions show a checkmark
- Export to CSV (client-side Blob download)
- Empty state with CTA when no transactions exist

### Documents Page
- List of uploaded documents with status icons (Pending / Processing / Processed / Failed)
- Auto-polls every 4 s when any document is active; stops when all are settled
- "Processing N files…" live indicator in card header
- Upload progress bar with gradient fill
- Delete with cascade confirmation

### Insights Page (Forecast + Anomaly Detection)
- Fetches from `GET /api/insights/forecast` → backend proxies to AI service `POST /forecast/`
- **Forecast algorithm** (per category, 6-month lookback):
  - Partial-month correction: if the latest month is the current incomplete month, spending is scaled to a full-month projection before regression
  - 3+ months: weighted linear regression (recent months 3× heavier) + 40% mean-damp
  - 2 months: linear trend extrapolation damped 50% toward the mean
  - 1 month: full-month normalised baseline (no trend assumption)
  - Clamped to [0, 3× weighted mean] to prevent explosion
- Forecast bar chart: last actual vs next-month forecast, per category
- Per-category cards: forecast amount, % change vs last month (green/red)
- **Anomaly detection**: 2-sigma z-score per category on individual transactions
- Anomaly table: description, category, date, category average, σ-deviation bar
- "No anomalies" success state; graceful empty state if no data; error state if AI service is offline

### Infrastructure & Deployment
- Full stack via `docker compose up --build` — Postgres, ChromaDB, AI service, backend, frontend
- CORS driven by `CORS_ORIGIN` env var (comma-separated origins) — no hardcoded localhost
- ChromaDB collection names are `sha256(user_id)[:24]` — no namespace collisions between users
- Backend gracefully handles AI service being offline (returns empty safe payloads)
- HTTP/1.1 forced on all Java HttpClient calls (Uvicorn does not support HTTP/2)
- JWT key derived identically in Java (jjwt) and Python (python-jose): UTF-8 bytes truncated/padded to 32 bytes
- `sources` column migrated from JSONB → TEXT via Flyway V2 to fix Hibernate type mismatch
- ChromaDB pinned to `0.5.20` to match client library version

### UI / Design System
- Color palette "Midnight Bloom": OLED-black base (`#06060F`), violet primary, fuchsia secondary (`#D946EF`), champagne gold accent
- Font pairing: Plus Jakarta Sans (headings) + IBM Plex Sans (body)
- Glassmorphism cards with gradient-masked borders, inset highlight, backdrop blur
- Gradient buttons (violet → fuchsia) with multi-stop glow on hover
- Icon containers with type-matched gradient backgrounds (danger/success/gold/info)
- Sidebar: gradient logo icon, gradient active nav state, gradient dividers
- Login/Register: ambient radial glow blobs, animated logo, gradient card border
- Responsive sidebar: mobile drawer with overlay
- Accessible focus rings, `prefers-reduced-motion` respected, gradient scrollbar

---

## Next Steps

### High Priority
- **Budget goals** — let users set a monthly spending limit per category; show progress bars and alert when approaching the limit
- **Recurring transaction detection** — identify subscriptions and regular payments (same merchant, similar amount, ~monthly interval); surface them in a dedicated view
- **PDF report export** — generate a monthly summary PDF (spending breakdown, anomalies, forecast) downloadable from the Dashboard

### Medium Priority
- **Android app** — the Kotlin/Compose skeleton in `android/` exists but is not connected to the backend; implement login, document upload, dashboard, and chat screens using Retrofit + Room
- **Push / email notifications** — alert users when an anomaly is detected or a budget limit is exceeded; requires adding an email service (e.g. SMTP/SendGrid) and/or Firebase Cloud Messaging for Android
- **Multi-currency support** — store a `currency` field on transactions; convert to a base currency for summaries using an exchange-rate API (e.g. Open Exchange Rates)
- **OAuth login** — add Google / GitHub sign-in as an alternative to email/password; backend needs an OAuth callback endpoint and the frontend needs provider buttons on the login page

### Lower Priority
- **Open Banking integration** — connect to a bank API (Plaid, TrueLayer, or Nordigen for EU) to import transactions automatically without file uploads
- **Shared accounts / family mode** — allow multiple users to share a document workspace with role-based access (owner, viewer)
- **Richer LLM options** — add an optional OpenAI / Anthropic backend next to Ollama so users with API keys can get faster/better responses; controlled by an env var
- **Dark/light mode toggle** — the design system is dark-first but the token layer already exists; add a theme toggle and implement `light` variants of all glass-card and surface tokens
- **Test coverage** — add JUnit 5 integration tests for backend services; add pytest tests for AI service endpoints (`/parse/`, `/forecast/`, `/chat/`); add Playwright e2e tests for critical frontend flows (login → upload → chat → insights)
