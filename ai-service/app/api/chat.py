"""Chat endpoints: regular JSON response + SSE streaming."""
from __future__ import annotations

import json
import uuid as _uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.db import get_db
from app.models import ChatMessage, ChatSession
from app.rag.pipeline import query, stream_query

router = APIRouter()


class ChatRequest(BaseModel):
    content: str
    session_id: str
    user_id: str | None = None


class ChatResponse(BaseModel):
    content: str
    sources: list[dict] | None = None


@router.post("/{session_id}", response_model=ChatResponse)
async def chat(
    session_id: str,
    req: ChatRequest,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """RAG chat — returns full answer as JSON. Used by the backend proxy."""
    user_id = current_user["user_id"]
    await _assert_session_owner(db, session_id, user_id)

    history = await _load_history(db, session_id)
    answer, sources = await query(user_id, req.content, history)
    return ChatResponse(content=answer, sources=sources)


@router.get("/{session_id}/stream")
async def chat_stream(
    session_id: str,
    question: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """SSE streaming endpoint — frontend connects directly for real-time tokens."""
    user_id = current_user["user_id"]
    await _assert_session_owner(db, session_id, user_id)

    history = await _load_history(db, session_id)

    async def event_generator():
        async for payload in stream_query(user_id, question, history):
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _assert_session_owner(db: AsyncSession, session_id: str, user_id: str) -> ChatSession:
    session = await db.get(ChatSession, _uuid.UUID(session_id))
    if session is None or str(session.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _load_history(db: AsyncSession, session_id: str) -> list[tuple[str, str]]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == _uuid.UUID(session_id))
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    history: list[tuple[str, str]] = []
    i = 0
    while i < len(messages) - 1:
        if messages[i].role == "user" and messages[i + 1].role == "assistant":
            history.append((messages[i].content, messages[i + 1].content))
            i += 2
        else:
            i += 1
    return history
