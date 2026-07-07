"""
currency.py — Central currency formatting utility.

All message-building functions across cold_start.py, analyze.py, and
summary.py import fmt() from here. Changing display logic only needs
to happen in one place.
"""

COMMON_CURRENCIES = {
    "INR": "₹", "USD": "$", "EUR": "€", "GBP": "£",
    "JPY": "¥", "CNY": "¥", "AED": "د.إ", "SGD": "S$",
    "CAD": "CA$", "AUD": "A$",
}


def resolve_symbol(currency: str) -> str:
    """
    Accepts either a symbol directly ("₹", "$") or an ISO code ("INR", "USD").
    Falls back to the raw string if unrecognised, so custom symbols just work.
    """
    if not currency:
        return "₹"
    upper = currency.strip().upper()
    return COMMON_CURRENCIES.get(upper, currency.strip())


def fmt(amount: float, currency: str = "₹") -> str:
    """Format an amount with currency symbol and comma separation."""
    symbol = resolve_symbol(currency)
    return f"{symbol}{amount:,.0f}"