"""Document parsing endpoint: PDF → structured transactions + RAG ingestion."""
from __future__ import annotations

import uuid as _uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.db import get_db
from app.ml.categorizer import categorize_batch
from app.models import Category, Document, Transaction
from app.rag import parser as doc_parser
from app.rag.pipeline import ingest_text

router = APIRouter()


class ParseResponse(BaseModel):
    doc_id: str
    transactions_parsed: int
    chunks_ingested: int
    transactions: list[dict]


@router.post("/", response_model=ParseResponse)
async def parse_document(
    doc_id: Annotated[str, Form()],
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Parse an uploaded document, categorize transactions, and ingest into RAG."""
    user_id = current_user["user_id"]

    # Validate document ownership
    doc_row = await db.get(Document, _uuid.UUID(doc_id))
    if doc_row is None or str(doc_row.user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    data = await file.read()
    mime = file.content_type or ""

    # ── Parse ──────────────────────────────────────────────────────────────────
    try:
        if "pdf" in mime or file.filename.lower().endswith(".pdf"):
            raw_txns = doc_parser.parse_pdf(data)
            full_text = _transactions_to_text(raw_txns, file.filename)
        elif "csv" in mime or file.filename.lower().endswith(".csv"):
            raw_txns = doc_parser.parse_csv(data)
            full_text = _transactions_to_text(raw_txns, file.filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except HTTPException:
        raise
    except Exception as exc:
        await _mark_failed(db, doc_row, str(exc))
        raise HTTPException(status_code=422, detail=f"Parse error: {exc}")

    # ── Categorize ─────────────────────────────────────────────────────────────
    categorized = await categorize_batch(raw_txns)

    # Load category name → id map
    cats = (await db.execute(select(Category))).scalars().all()
    cat_map = {c.name.lower(): c.id for c in cats}

    # ── Persist transactions ───────────────────────────────────────────────────
    import datetime
    for txn in categorized:
        try:
            txn_date = datetime.date.fromisoformat(txn["date"])
        except (ValueError, KeyError):
            continue
        row = Transaction(
            id=_uuid.uuid4(),
            user_id=_uuid.UUID(user_id),
            document_id=_uuid.UUID(doc_id),
            txn_date=txn_date,
            amount=txn["amount"],
            description=txn["description"],
            merchant=txn.get("merchant"),
            raw_category=txn.get("category"),
            category_id=cat_map.get(txn.get("category", "").lower()),
            is_confirmed=False,
        )
        db.add(row)

    # ── Ingest into vector store ───────────────────────────────────────────────
    chunks = ingest_text(user_id, doc_id, full_text, file.filename)

    # ── Update document status ─────────────────────────────────────────────────
    doc_row.status = "processed"
    import datetime as dt
    doc_row.processed_at = dt.datetime.now(dt.timezone.utc)
    await db.commit()

    return ParseResponse(
        doc_id=doc_id,
        transactions_parsed=len(categorized),
        chunks_ingested=chunks,
        transactions=categorized,
    )


async def _mark_failed(db: AsyncSession, doc: Document, msg: str) -> None:
    doc.status = "failed"
    doc.error_msg = msg
    await db.commit()


def _transactions_to_text(txns: list[dict], filename: str) -> str:
    lines = [f"Financial document: {filename}\n"]
    for t in txns:
        lines.append(
            f"Date: {t.get('date')} | Amount: {t.get('amount')} | "
            f"Description: {t.get('description')} | Merchant: {t.get('merchant', '')}"
        )
    return "\n".join(lines)
