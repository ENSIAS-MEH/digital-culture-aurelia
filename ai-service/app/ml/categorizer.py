"""Zero-shot transaction categorizer using a local Ollama model."""
from __future__ import annotations

from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama

from app.config import settings

CATEGORIES = [
    "Food", "Transport", "Housing", "Entertainment",
    "Healthcare", "Shopping", "Income", "Other",
]

_cache: dict[str, str] = {}
_llm: ChatOllama | None = None


def init_categorizer() -> None:
    global _llm
    _llm = ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        num_predict=256,
        temperature=0,
    )


async def categorize_batch(transactions: list[dict]) -> list[dict]:
    """Categorize all transactions in a single LLM call."""
    if not transactions:
        return []

    # Deduplicate by description to minimise prompt size; cache hits skip LLM entirely
    uncached: list[tuple[int, str, float]] = []
    for i, txn in enumerate(transactions):
        key = txn.get("description", "").lower().strip()
        if key not in _cache:
            uncached.append((i, txn.get("description", ""), float(txn.get("amount", 0))))

    if uncached:
        await _classify_batch(uncached)

    return [
        {**txn, "category": _cache.get(txn.get("description", "").lower().strip(), "Other")}
        for txn in transactions
    ]


async def _classify_batch(items: list[tuple[int, str, float]]) -> None:
    """Send all uncached transactions in one prompt and parse the numbered response."""
    assert _llm is not None, "Categorizer not initialised"

    cats = ", ".join(CATEGORIES)
    lines = [
        f"Classify each bank transaction below into exactly one of these categories: {cats}.",
        "Reply with ONLY a numbered list in the exact format: '1. CategoryName'",
        "No explanations, no extra text.\n",
    ]
    for idx, (_, desc, amount) in enumerate(items, 1):
        sign = "credit" if amount > 0 else "debit"
        lines.append(f"{idx}. \"{desc}\" ({sign} {abs(amount):.2f})")

    response = await _llm.ainvoke([HumanMessage(content="\n".join(lines))])
    raw = response.content.strip()

    # Parse "1. CategoryName" lines
    parsed: dict[int, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        for cat in CATEGORIES:
            if cat.lower() in line.lower():
                # Extract the leading number
                num_part = line.split(".")[0].strip()
                if num_part.isdigit():
                    parsed[int(num_part)] = cat
                break

    for idx, (_, desc, _) in enumerate(items, 1):
        key = desc.lower().strip()
        _cache[key] = parsed.get(idx, "Other")
