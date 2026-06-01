"""
cold_start.py — Bayesian cold-start anomaly detection.

Three tiers (no hardcoded benchmarks — all priors come from the user):

  TIER 0 (≥3 same-category history): use real category average × 3
  TIER 1 (category cap exists):       use cap / 20 days × 3
  TIER 2 (monthly budget only):       use budget / 30 days × 3

SPIKE_MULTIPLIER = 3.0: forgiving enough to avoid false positives on day 1.
"""

from typing import Dict, List, Optional, Any
from models import AnalyzeResponse
from currency import fmt

SPIKE_MULTIPLIER = 3.0


def _safe_score(amount: float, threshold: float) -> float:
    """Ratio of amount to threshold, capped at 5.0. Safe against zero threshold."""
    if threshold <= 0:
        return 5.0 if amount > 0 else 0.0
    return round(min(amount / threshold, 5.0), 2)


def cold_start_analyze(
    amount: float,
    category: str,
    monthly_budget: float,
    monthly_income: float,
    category_budgets: Dict[str, float],
    history: List[Any],
    currency: str = "₹",
) -> AnalyzeResponse:
    cat = category.lower().strip()

    # Tier 0: ≥3 same-category history points
    same_cat = [e for e in history if e.category.lower().strip() == cat]
    if len(same_cat) >= 3:
        cat_avg    = sum(e.amount for e in same_cat) / len(same_cat)
        threshold  = cat_avg * SPIKE_MULTIPLIER
        is_anomaly = amount > threshold
        return AnalyzeResponse(
            is_anomaly=is_anomaly,
            score=_safe_score(amount, threshold),
            message=_build_message(amount, category, is_anomaly, cat_avg, "history", currency),
            method="cold_start_history",
            confidence="medium",
        )

    # Tier 1: per-category budget cap
    if category_budgets and cat in {k.lower() for k in category_budgets}:
        cap_key    = next(k for k in category_budgets if k.lower() == cat)
        daily_cap  = category_budgets[cap_key] / 20.0
        threshold  = daily_cap * SPIKE_MULTIPLIER
        is_anomaly = amount > threshold
        return AnalyzeResponse(
            is_anomaly=is_anomaly,
            score=_safe_score(amount, threshold),
            message=_build_message(amount, category, is_anomaly, daily_cap, "category_budget", currency),
            method="cold_start_category",
            confidence="medium",
        )

    # Tier 2: monthly budget
    daily_budget = monthly_budget / 30.0
    threshold    = daily_budget * SPIKE_MULTIPLIER
    is_anomaly   = amount > threshold
    return AnalyzeResponse(
        is_anomaly=is_anomaly,
        score=_safe_score(amount, threshold),
        message=_build_message(amount, category, is_anomaly, daily_budget, "monthly_budget", currency),
        method="cold_start_budget",
        confidence="low",
    )


def _build_message(amount, category, is_anomaly, reference, ref_type, currency="₹") -> str:
    cat_title = category.title()
    if not is_anomaly:
        return f"{fmt(amount, currency)} on {cat_title} looks normal based on your budget."
    if ref_type == "history":
        multiplier = round(amount / reference, 1) if reference > 0 else "—"
        return (f"{fmt(amount, currency)} on {cat_title} is {multiplier}× your usual "
                f"{fmt(reference, currency)} spend in this category.")
    if ref_type == "category_budget":
        return (f"{fmt(amount, currency)} on {cat_title} is unusually high — "
                f"you've budgeted {fmt(reference * 20, currency)}/month for this category.")
    return (f"{fmt(amount, currency)} on {cat_title} is a large single spend "
            f"relative to your {fmt(reference * 30, currency)} monthly budget.")