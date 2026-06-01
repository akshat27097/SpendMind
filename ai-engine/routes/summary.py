"""
routes/summary.py — Statistical summary + smart insights.

New fields vs v1:
  savings_rate:       (income - total) / income × 100
  budget_utilization: total / budget × 100
  insights:           Up to 5 data-driven SummaryInsight bullets for Gemini context
"""

from collections import Counter
from currency import fmt
from fastapi import APIRouter, HTTPException
from models import SummaryRequest, SummaryResponse, SummaryInsight

router = APIRouter()
SAVINGS_EXCELLENT, SAVINGS_GOOD, SAVINGS_LOW = 30.0, 20.0, 10.0


@router.post("", response_model=SummaryResponse)
def get_summary(request: SummaryRequest) -> SummaryResponse:
    currency = request.currency or "₹"
    expenses = request.expenses
    if not expenses:
        raise HTTPException(status_code=400, detail="No expenses provided")

    total_by_category: dict[str, float] = {}
    category_counts = Counter()
    for e in expenses:
        cat = e.category.lower().strip()
        total_by_category[cat] = total_by_category.get(cat, 0.0) + e.amount
        category_counts[cat] += 1

    monthly_total     = sum(total_by_category.values())
    highest_expense   = max(e.amount for e in expenses)
    most_frequent_cat = category_counts.most_common(1)[0][0]
    anomaly_count     = request.anomaly_count or 0
    unique_dates      = {e.date for e in expenses}
    daily_average     = round(monthly_total / max(len(unique_dates), 1), 2)

    savings_rate = (
        round((request.monthly_income - monthly_total) / request.monthly_income * 100, 1)
        if request.monthly_income > 0 else None
    )
    budget_utilization = (
        round(monthly_total / request.monthly_budget * 100, 1)
        if request.monthly_budget > 0 else None
    )

    insights = _generate_insights(
        total_by_category, monthly_total, request.monthly_budget,
        request.monthly_income, savings_rate, budget_utilization,
        anomaly_count, daily_average, category_counts, currency=currency,
    )

    return SummaryResponse(
        total_by_category={k: round(v, 2) for k, v in total_by_category.items()},
        monthly_total=round(monthly_total, 2),
        highest_expense=round(highest_expense, 2),
        most_frequent_category=most_frequent_cat,
        anomaly_count=anomaly_count,
        daily_average=daily_average,
        savings_rate=savings_rate,
        budget_utilization=budget_utilization,
        insights=insights,
        over_budget_categories=[],
    )


def _generate_insights(total_by_category, monthly_total, monthly_budget,
                       monthly_income, savings_rate, budget_utilization,
                       anomaly_count, daily_average, category_counts, currency="₹"):
    insights = []

    if budget_utilization is not None:
        if budget_utilization > 100:
            insights.append(SummaryInsight(type="over_budget",
                message=f"You've exceeded your budget by {round(budget_utilization - 100, 1)}% this month.",
                severity="danger"))
        elif budget_utilization > 85:
            insights.append(SummaryInsight(type="over_budget",
                message=f"You've used {budget_utilization}% of your budget — {fmt(monthly_budget - monthly_total, currency)} left.",
                severity="warning"))
        else:
            insights.append(SummaryInsight(type="pattern",
                message=f"Budget on track — {budget_utilization}% used so far.",
                severity="info"))

    if savings_rate is not None:
        if savings_rate >= SAVINGS_EXCELLENT:
            insights.append(SummaryInsight(type="savings_opportunity",
                message=f"Excellent savings rate of {savings_rate}% — above the 30% benchmark.",
                severity="info"))
        elif savings_rate >= SAVINGS_GOOD:
            insights.append(SummaryInsight(type="savings_opportunity",
                message=f"Good savings rate of {savings_rate}% — on track with the 20% rule.",
                severity="info"))
        elif savings_rate < 0:
            insights.append(SummaryInsight(type="over_budget",
                message=f"Spending exceeds income this month by {fmt(abs(round(monthly_income * savings_rate / -100, 0)), currency)}.",
                severity="danger"))
        else:
            insights.append(SummaryInsight(type="savings_opportunity",
                message=f"Savings rate is {savings_rate}% — consider targeting 20% for security.",
                severity="warning"))

    if anomaly_count > 0:
        insights.append(SummaryInsight(type="streak",
            message=f"{anomaly_count} unusual expense{'s' if anomaly_count > 1 else ''} flagged — review for errors or fraud.",
            severity="warning" if anomaly_count <= 3 else "danger"))

    if total_by_category:
        top_cat = max(total_by_category, key=total_by_category.get)
        top_pct = round(total_by_category[top_cat] / monthly_total * 100, 1) if monthly_total > 0 else 0
        if top_pct > 40:
            insights.append(SummaryInsight(type="pattern",
                message=f"{top_cat.title()} is {top_pct}% of your spend — check if this aligns with your priorities.",
                severity="warning"))

    if category_counts:
        most_freq = category_counts.most_common(1)[0][0]
        freq      = category_counts[most_freq]
        avg_txn   = round(total_by_category.get(most_freq, 0) / max(freq, 1), 0)
        if freq >= 15:
            insights.append(SummaryInsight(type="pattern",
                message=f"{freq} transactions in {most_freq.title()} averaging {fmt(avg_txn, currency)} each — small spends add up.",
                severity="info"))

    return insights[:5]