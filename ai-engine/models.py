"""
models.py — All Pydantic request/response schemas for SpendMind AI Engine.

Design principles:
- monthlyBudget and monthlyIncome are ALWAYS present (set at signup).
- categoryBudgets (per-category caps) are set in Settings; used for cold-start
  anomaly detection before IsolationForest has enough training data.
- Every field has a sensible default so Node.js callers can add fields
  incrementally without breaking the API.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional


# Shared sub-models

class ExpenseItem(BaseModel):
    amount: float
    category: str
    date: str  # ISO date string "YYYY-MM-DD"


class DailyTotal(BaseModel):
    """Used by /forecast. ds = date string, y = total spend that day."""
    ds: str
    y: float


# Request models

class TrainRequest(BaseModel):
    user_id: str
    expenses: List[ExpenseItem]
    monthly_budget: float
    monthly_income: float
    category_budgets: Optional[Dict[str, float]] = Field(default_factory=dict)
    currency: Optional[str] = "₹"

class AnalyzeRequest(BaseModel):
    user_id: str
    expense: ExpenseItem
    history: Optional[List[ExpenseItem]] = Field(default_factory=list)
    monthly_budget: float
    monthly_income: float
    category_budgets: Optional[Dict[str, float]] = Field(default_factory=dict)
    total_expense_count: Optional[int] = 0
    currency: Optional[str] = "₹"

class ForecastRequest(BaseModel):
    user_id: str
    daily_totals: List[DailyTotal]
    monthly_budget: float
    monthly_income: float
    monthly_expenses_cap: Optional[float] = None

class SummaryRequest(BaseModel):
    user_id: str
    expenses: List[ExpenseItem]
    anomaly_count: Optional[int] = 0
    monthly_budget: float
    monthly_income: float
    currency: Optional[str] = "₹"

# Response models 

class TrainResponse(BaseModel):
    status: str
    n_samples: int
    contamination_used: float


class AnalyzeResponse(BaseModel):
    is_anomaly: bool
    score: Optional[float] = None
    message: str
    method: str  # "ml" | "cold_start_budget" | "cold_start_category" | "cold_start_history"
    confidence: str  # "high" | "medium" | "low"


class ForecastDay(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ForecastResponse(BaseModel):
    forecast: List[ForecastDay]
    predicted_month_end: float
    lower_bound: float
    upper_bound: float
    method: str          # "budget" | "bayesian" | "prophet"
    days_of_data: int
    budget_remaining: Optional[float] = None
    on_track: Optional[bool] = None


class SummaryInsight(BaseModel):
    type: str    # "over_budget" | "savings_opportunity" | "streak" | "pattern"
    message: str
    severity: str  # "info" | "warning" | "danger"


class SummaryResponse(BaseModel):
    total_by_category: Dict[str, float]
    monthly_total: float
    highest_expense: float
    most_frequent_category: str
    anomaly_count: int
    daily_average: float
    savings_rate: Optional[float] = None
    budget_utilization: Optional[float] = None
    insights: List[SummaryInsight] = Field(default_factory=list)
    over_budget_categories: List[str] = Field(default_factory=list)