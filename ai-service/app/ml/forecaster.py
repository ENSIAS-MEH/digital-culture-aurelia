"""Spending forecast + anomaly detection.

Forecast method (per category):
  - Lookback: 6 months of expenses
  - Partial-month correction: if the latest month is the current calendar month
    and it is not yet complete, the running total is scaled to a full month
    before being used in regression.
  - 3+ months of data  → weighted linear regression (recent months 3× heavier),
    result damped 40 % toward the weighted mean to avoid over-extrapolation.
  - 2 months of data   → trend extrapolation damped 50 % toward the mean.
  - 1 month of data    → previous month (full-month normalised) as baseline,
    with no trend assumption.
  - All forecasts are clamped to [0, 3× weighted mean].

Anomaly detection: 2-sigma per-category z-score on individual transactions.
"""
from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Transaction, Category

# Lookback window — 6 months gives enough points for meaningful regression
_LOOKBACK_DAYS = 183


def _days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def _scale_to_full_month(total: float, period: pd.Period, today: date) -> float:
    """If *period* is the current (incomplete) calendar month, scale spending
    to a full-month estimate based on the fraction of days elapsed."""
    if period.year == today.year and period.month == today.month:
        elapsed = today.day
        full = _days_in_month(today.year, today.month)
        if elapsed < full and elapsed > 0:
            return total * full / elapsed
    return total


def _forecast_from_totals(totals: list[float]) -> float:
    """Return next-month forecast given a list of full-month totals (oldest first)."""
    n = len(totals)
    arr = np.array(totals, dtype=float)

    # Recency weights: most recent month gets weight n, oldest gets weight 1
    weights = np.arange(1, n + 1, dtype=float)
    w_mean = float(np.average(arr, weights=weights))

    if n >= 3:
        x = np.arange(n, dtype=float)
        # Weighted least-squares trend line
        coeffs = np.polyfit(x, arr, 1, w=weights)
        raw = float(np.polyval(coeffs, n))   # project one step ahead
        # Damp 40 % toward the weighted mean to avoid over-extrapolation
        forecast = 0.6 * raw + 0.4 * w_mean

    elif n == 2:
        trend = arr[1] - arr[0]
        # Damp 50 % — a single delta is noisy
        forecast = arr[1] + 0.5 * trend

    else:
        # Single data point: use it as-is (already full-month normalised)
        forecast = arr[0]

    # Clamp to a sensible range: [0, 3× weighted mean]
    upper = max(w_mean * 3.0, arr.max() * 1.5)
    return float(np.clip(forecast, 0.0, upper))


async def build_forecast(user_id: str, db: AsyncSession) -> dict[str, Any]:
    """Return per-category forecast and flagged anomalies."""
    today = date.today()
    window_start = today - timedelta(days=_LOOKBACK_DAYS)

    result = await db.execute(
        select(Transaction, Category)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            and_(
                Transaction.user_id == user_id,
                Transaction.txn_date >= window_start,
                Transaction.amount < 0,          # expenses only
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
        periods = group["month"].tolist()
        raw_totals = group["abs_amount"].tolist()

        # Normalise the current (potentially incomplete) month
        normalised = [
            _scale_to_full_month(total, period, today)
            for total, period in zip(raw_totals, periods)
        ]

        forecast = _forecast_from_totals(normalised)

        forecast_by_category.append({
            "category": category,
            "monthly_totals": [
                {"month": str(p), "total": round(t, 2)}
                for p, t in zip(periods, normalised)
            ],
            "forecast_next_month": round(forecast, 2),
        })

    # ── Anomaly detection (2-sigma z-score per category) ──────────────────────
    anomalies: list[dict] = []
    for category, group in df.groupby("category"):
        mean = group["abs_amount"].mean()
        std  = group["abs_amount"].std()
        if std == 0 or np.isnan(std):
            continue
        threshold = mean + 2 * std
        for _, row in group[group["abs_amount"] > threshold].iterrows():
            anomalies.append({
                "txn_id":        row["txn_id"],
                "date":          str(row["date"]),
                "amount":        row["amount"],
                "description":   row["description"],
                "category":      category,
                "category_mean": round(float(mean), 2),
                "deviation":     round(float((row["abs_amount"] - mean) / std), 2),
            })

    return {
        "forecast_by_category": forecast_by_category,
        "anomalies": sorted(anomalies, key=lambda x: x["deviation"], reverse=True),
    }
