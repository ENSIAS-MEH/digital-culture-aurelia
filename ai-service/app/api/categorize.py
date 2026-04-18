"""Batch transaction categorization endpoint."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import verify_token
from app.ml.categorizer import categorize_batch, CATEGORIES

router = APIRouter()


class CategorizeRequest(BaseModel):
    transactions: list[dict]


class CategorizeResponse(BaseModel):
    categorized: list[dict]
    categories_available: list[str] = CATEGORIES


@router.post("/", response_model=CategorizeResponse)
async def categorize(
    req: CategorizeRequest,
    current_user: dict = Depends(verify_token),
):
    """Classify a batch of transactions. Each item must have 'description' and 'amount'."""
    categorized = await categorize_batch(req.transactions)
    return CategorizeResponse(categorized=categorized)
