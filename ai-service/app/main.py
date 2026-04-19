import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import categorize, chat, forecast, parse
from app.ml.categorizer import init_categorizer
from app.rag.pipeline import init_rag

limiter = Limiter(key_func=get_remote_address)


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Aurelia AI service starting — warming up models…")
    init_rag()          # loads sentence-transformers + connects ChromaDB
    init_categorizer()  # creates Anthropic client
    print("AI service ready.")
    yield
    print("Aurelia AI service shutting down.")


app = FastAPI(
    title="Aurelia AI Service",
    description="RAG pipeline, document parsing, and ML for Aurelia.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router,      prefix="/parse",      tags=["parse"])
app.include_router(chat.router,       prefix="/chat",        tags=["chat"])
app.include_router(categorize.router, prefix="/categorize",  tags=["categorize"])
app.include_router(forecast.router,   prefix="/forecast",    tags=["forecast"])


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "service": "aurelia-ai"}
