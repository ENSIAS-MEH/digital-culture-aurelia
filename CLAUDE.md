# Aurelia — Project Rules for Claude Code

## Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Jakarta EE 10 · WildFly 31 · Java 17 · JAX-RS · JPA (Hibernate)
- AI Service: Python 3.12 · FastAPI · LangChain · ChromaDB
- Database: PostgreSQL 16 · ChromaDB (vector store)
- Android: Kotlin · Jetpack Compose · MVVM · Retrofit · Room

## Theme — Aurelia Design Language
- Primary palette: Deep indigo `#1a1040` → violet `#7c3aed` → gold accent `#f59e0b`
- Style: Glassmorphism cards, subtle grain texture, aurora gradient backgrounds
- Font: Inter (body), Sora (headings)
- Dark-first design. Light mode is secondary.
- Animations: subtle, purposeful (Framer Motion on web, Compose animations on Android)

## Non-Negotiable Rules
- NEVER hardcode API keys — use .env files only
- All Python functions must have type hints
- All Java endpoints must have OpenAPI annotations (@Operation, @Tag)
- React components: functional only, no class components
- Android: MVVM strictly — no business logic in Composables
- All DB access goes through JPA repositories on the backend, Room DAOs on Android
- Migrations via Flyway (backend) — never alter schema manually
- Docker Compose must start the full stack: `docker compose up`

## Git Rules
- NEVER run `git push` under any circumstances
- NEVER run `git commit` — only stage changes with `git add`
- All commits and pushes are done manually by the developer

## Services & Ports
- Frontend dev server: http://localhost:5173
- Jakarta EE backend (WildFly): http://localhost:8080
- AI/Python service: http://localhost:8000
- PostgreSQL: localhost:5432
- ChromaDB: http://localhost:8002

## Key Commands
- Start all: `docker compose up --build`
- Backend only: `cd backend && mvn package && (deploy WAR to local WildFly)`
- AI service: `cd ai-service && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Android: Open `android/` in Android Studio → Run

## Known Constraints
- ChromaDB collections are per-user: `user_{id}_documents`
- Backend is the single source of truth for user auth (JWT)
- AI service trusts JWT passed in Authorization header — verify on every route
- Android minimum SDK: 26 (Android 8)
- Backend uses WildFly (not Quarkus) — datasource JNDI: `java:jboss/datasources/AureliaDS`
- PostgreSQL driver included as compile dependency (in WEB-INF/lib)
- Flyway migrations in `backend/src/main/resources/db/migration/`
