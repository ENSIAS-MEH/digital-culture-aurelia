"""Parse PDF bank statements and CSV transaction exports into structured rows."""
import io
import re
from datetime import date
from typing import Any

import pandas as pd
import pdfplumber


# Date patterns (day-first and year-first variants)
_DATE_PATTERNS = [
    (re.compile(r"\b(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})\b"), "dmy"),
    (re.compile(r"\b(\d{4})[/\-\.](\d{2})[/\-\.](\d{2})\b"), "ymd"),
    (re.compile(r"\b(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})\b"),  "dmy_short"),
]
# Amount pattern: optional sign, digits, optional thousands sep, decimal part
_AMOUNT_RE = re.compile(r"([+-]?\s*[\d\s,\.]+(?:[.,]\d{2}))")


def parse_pdf(data: bytes) -> list[dict[str, Any]]:
    transactions: list[dict[str, Any]] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    _process_table(table, transactions)
            else:
                text = page.extract_text() or ""
                _process_text_lines(text.splitlines(), transactions)
    return transactions


def parse_csv(data: bytes) -> list[dict[str, Any]]:
    try:
        df = pd.read_csv(io.BytesIO(data), sep=None, engine="python", dtype=str)
    except Exception:
        df = pd.read_csv(io.BytesIO(data), sep=";", dtype=str)

    df.columns = [c.strip().lower() for c in df.columns]
    transactions: list[dict[str, Any]] = []

    date_col = _find_col(df, ["date", "date_op", "operation date", "transaction date", "datum"])
    amount_col = _find_col(df, ["amount", "montant", "betrag", "credit/debit", "debit", "credit"])
    desc_col = _find_col(df, ["description", "label", "libelle", "memo", "details", "operation"])

    for _, row in df.iterrows():
        txn_date = _parse_date_str(str(row.get(date_col, ""))) if date_col else None
        amount = _parse_amount_str(str(row.get(amount_col, ""))) if amount_col else None
        desc = str(row.get(desc_col, "")).strip() if desc_col else ""
        if txn_date and amount is not None and desc:
            transactions.append({
                "date": txn_date.isoformat(),
                "amount": amount,
                "description": desc,
                "merchant": _extract_merchant(desc),
            })
    return transactions


# ── Helpers ───────────────────────────────────────────────────────────────────

def _process_table(table: list[list[str | None]], out: list) -> None:
    if not table or len(table) < 2:
        return
    headers = [str(c).strip().lower() if c else "" for c in table[0]]
    for row in table[1:]:
        cells = [str(c).strip() if c else "" for c in row]
        row_dict = dict(zip(headers, cells))
        date_val = _row_date(row_dict)
        amount_val = _row_amount(cells)
        desc_val = _row_desc(row_dict, cells)
        if date_val and amount_val is not None and desc_val:
            out.append({
                "date": date_val.isoformat(),
                "amount": amount_val,
                "description": desc_val,
                "merchant": _extract_merchant(desc_val),
            })


def _process_text_lines(lines: list[str], out: list) -> None:
    for line in lines:
        txn_date = _parse_date_from_text(line)
        if not txn_date:
            continue
        amount = _parse_amount_from_text(line)
        if amount is None:
            continue
        desc = re.sub(r"[\d/\-\.,]+", "", line).strip()
        if len(desc) > 3:
            out.append({
                "date": txn_date.isoformat(),
                "amount": amount,
                "description": desc,
                "merchant": _extract_merchant(desc),
            })


def _find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in df.columns:
        for cand in candidates:
            if cand in c:
                return c
    return None


def _row_date(row: dict) -> date | None:
    for key in ("date", "date_op", "operation date", "transaction date", "datum"):
        if key in row:
            return _parse_date_str(row[key])
    return None


def _row_amount(cells: list[str]) -> float | None:
    for cell in reversed(cells):
        amt = _parse_amount_str(cell)
        if amt is not None:
            return amt
    return None


def _row_desc(row: dict, cells: list[str]) -> str:
    for key in ("description", "label", "libelle", "memo", "details", "operation"):
        if key in row and row[key]:
            return row[key]
    # Take the longest non-numeric cell
    return max((c for c in cells if not re.fullmatch(r"[\d\s,\.\-+/]+", c)), default="", key=len)


def _parse_date_str(s: str) -> date | None:
    s = s.strip()
    for pattern, fmt in _DATE_PATTERNS:
        m = pattern.match(s)
        if m:
            try:
                g = m.groups()
                if fmt == "ymd":
                    return date(int(g[0]), int(g[1]), int(g[2]))
                elif fmt == "dmy_short":
                    year = 2000 + int(g[2])
                    return date(year, int(g[1]), int(g[0]))
                else:
                    return date(int(g[2]), int(g[1]), int(g[0]))
            except ValueError:
                continue
    return None


def _parse_date_from_text(text: str) -> date | None:
    for pattern, fmt in _DATE_PATTERNS:
        m = pattern.search(text)
        if m:
            try:
                g = m.groups()
                if fmt == "ymd":
                    return date(int(g[0]), int(g[1]), int(g[2]))
                elif fmt == "dmy_short":
                    return date(2000 + int(g[2]), int(g[1]), int(g[0]))
                else:
                    return date(int(g[2]), int(g[1]), int(g[0]))
            except ValueError:
                continue
    return None


def _parse_amount_str(s: str) -> float | None:
    s = s.strip().replace(" ", "")
    if not s or s in ("-", "+"):
        return None
    # Normalise European format: 1.234,56 → 1234.56
    if re.search(r"\d,\d{2}$", s) and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif re.search(r"\d,\d{2}$", s):
        s = s.replace(",", ".")
    else:
        s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def _parse_amount_from_text(text: str) -> float | None:
    for m in _AMOUNT_RE.finditer(text):
        val = _parse_amount_str(m.group(1))
        if val is not None and abs(val) > 0.01:
            return val
    return None


def _extract_merchant(desc: str) -> str:
    """Best-effort merchant name from a transaction description."""
    parts = re.split(r"[*#|/\\]", desc)
    merchant = parts[0].strip()
    # Remove date/ref artefacts
    merchant = re.sub(r"\b\d{4,}\b", "", merchant).strip()
    return merchant[:100] if merchant else desc[:100]
