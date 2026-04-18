"""Zero-shot transaction categorizer using Claude."""
from __future__ import annotations

import re
from anthropic import AsyncAnthropic
from app.config import settings

CATEGORIES = [
    "Food", "Transport", "Housing", "Entertainment",
    "Healthcare", "Shopping", "Income", "Other",
]

_cache: dict[str, str] = {}

_client: AsyncAnthropic | None = None


def init_categorizer() -> None:
    global _client
    _client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def categorize_one(description: str, amount: float) -> str:
    """Return the category name for a single transaction."""
    cache_key = description.lower().strip()
    if cache_key in _cache:
        return _cache[cache_key]

    category = await _classify(description, amount)
    _cache[cache_key] = category
    return category


async def categorize_batch(
    transactions: list[dict],
) -> list[dict]:
    """Categorize a list of {description, amount} dicts. Returns dicts with 'category' added."""
    results = []
    for txn in transactions:
        desc = txn.get("description", "")
        amount = float(txn.get("amount", 0))
        category = await categorize_one(desc, amount)
        results.append({**txn, "category": category})
    return results


async def _classify(description: str, amount: float) -> str:
    assert _client is not None, "Categorizer not initialised"

    sign = "income/credit" if amount > 0 else "expense/debit"
    prompt = (
        f"Classify this bank transaction into exactly one category.\n"
        f"Categories: {', '.join(CATEGORIES)}\n"
        f"Transaction: \"{description}\" ({sign}, amount: {amount:.2f})\n"
        f"Reply with only the category name, nothing else."
    )

    message = await _client.messages.create(
        model=settings.claude_model,
        max_tokens=20,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()

    # Match to a known category (case-insensitive)
    for cat in CATEGORIES:
        if cat.lower() in raw.lower():
            return cat

    return "Other"
