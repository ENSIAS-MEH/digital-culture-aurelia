"""Spending forecast and anomaly detection endpoint."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_token
from app.db import get_db
from app.ml.forecaster import build_forecast

router = APIRouter()


class ForecastResponse(BaseModel):
    forecast_by_category: list[dict]
    anomalies: list[dict]


@router.post("/", response_model=ForecastResponse)
async def forecast(
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """3-month moving-average forecast + 2-sigma anomaly detection for the current user."""
    result = await build_forecast(current_user["user_id"], db)
    return ForecastResponse(**result)
