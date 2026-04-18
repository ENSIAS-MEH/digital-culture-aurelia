"""Spending forecast (3-month moving average) + anomaly detection (2-sigma)."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Transaction, Category


async def build_forecast(user_id: str, db: AsyncSession) -> dict[str, Any]:
    """Return per-category 3-month spending forecast and flagged anomalies."""
    today = date.today()
    window_start = today.replace(day=1) - timedelta(days=90)  # ~3 months back

    result = await db.execute(
        select(Transaction, Category)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            and_(
                Transaction.user_id == user_id,
                Transaction.txn_date >= window_start,
                Transaction.amount < 0,  # expenses only
            )
        )
    )
    rows = result.all()

    if not rows:
        return {"forecast_by_category": [], "anomalies": []}

    records = [
        {
            "date": txn.txn_date,
            "amount": float(txn.amount),
            "category": cat.name if cat else "Other",
            "description": txn.description,
            "txn_id": str(txn.id),
        }
        for txn, cat in rows
    ]

    df = pd.DataFrame(records)
    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")
    df["abs_amount"] = df["amount"].abs()

    # ── Per-category monthly totals ────────────────────────────────────────────
    monthly = (
        df.groupby(["category", "month"])["abs_amount"]
        .sum()
        .reset_index()
        .sort_values("month")
    )

    forecast_by_category = []
    for category, group in monthly.groupby("category"):
        totals = group["abs_amount"].tolist()
        if len(totals) >= 2:
            forecast = float(np.mean(totals[-3:]))  # 3-month rolling mean
        else:
            forecast = float(totals[-1])

        forecast_by_category.append({
            "category": category,
            "monthly_totals": [
                {"month": str(row["month"]), "total": float(row["abs_amount"])}
                for _, row in group.iterrows()
            ],
            "forecast_next_month": round(forecast, 2),
        })

    # ── Anomaly detection (2 std deviations per category) ─────────────────────
    anomalies = []
    for category, group in df.groupby("category"):
        mean = group["abs_amount"].mean()
        std = group["abs_amount"].std()
        if std == 0 or np.isnan(std):
            continue
        threshold = mean + 2 * std
        outliers = group[group["abs_amount"] > threshold]
        for _, row in outliers.iterrows():
            anomalies.append({
                "txn_id": row["txn_id"],
                "date": str(row["date"]),
                "amount": row["amount"],
                "description": row["description"],
                "category": category,
                "category_mean": round(mean, 2),
                "deviation": round((row["abs_amount"] - mean) / std, 2),
            })

    return {
        "forecast_by_category": forecast_by_category,
        "anomalies": sorted(anomalies, key=lambda x: x["deviation"], reverse=True),
    }
