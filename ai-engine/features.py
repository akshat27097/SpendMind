"""
features.py — Feature engineering for SpendMind anomaly detection.

Key design decisions:
- budget_ratio: amount / (monthly_budget / 30). Makes model financially aware.
  A ₹5000 expense is normal for ₹1L/month earner, anomalous for ₹20k/month.
- income_ratio: amount / (monthly_income / 30). Second financial anchor.
- Both ratios clipped at [0, 20] to prevent outliers from breaking scaling.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from typing import List, Dict, Any, Tuple, Optional


CATEGORIES = [
    "food", "transport", "shopping", "entertainment",
    "health", "utilities", "education", "other",
]

FEATURE_COLS = [
    "amount",
    "day_of_week",
    "is_weekend",
    "day_of_month",
    "rolling_7d_avg",
    "zscore",
    "category_encoded",
    "budget_ratio",   
    "income_ratio",  
]


def build_features(
    expenses: List[Dict[str, Any]],
    label_encoder: Optional[LabelEncoder] = None,
    fit_encoder: bool = True,
    monthly_budget: float = 30_000.0,
    monthly_income: float = 60_000.0,
) -> Tuple[pd.DataFrame, LabelEncoder]:
    df = pd.DataFrame(expenses)

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.sort_values("date").reset_index(drop=True)
    df["day_of_week"]  = df["date"].dt.dayofweek
    df["is_weekend"]   = (df["day_of_week"] >= 5).astype(int)
    df["day_of_month"] = df["date"].dt.day

    df["rolling_7d_avg"] = df["amount"].rolling(window=7, min_periods=1).mean()

    mean_amt = df["amount"].mean()
    std_amt  = df["amount"].std()
    if pd.isna(std_amt) or std_amt == 0:
        df["zscore"] = 0.0
    else:
        df["zscore"] = (df["amount"] - mean_amt) / std_amt

    daily_budget = max(monthly_budget / 30.0, 1.0)
    daily_income = max(monthly_income / 30.0, 1.0)
    df["budget_ratio"] = (df["amount"] / daily_budget).clip(0, 20).round(4)
    df["income_ratio"] = (df["amount"] / daily_income).clip(0, 20).round(4)

    df["category_clean"] = df["category"].str.lower().str.strip()

    if label_encoder is None:
        label_encoder = LabelEncoder()

    if fit_encoder:
        all_cats = sorted(set(CATEGORIES) | set(df["category_clean"].unique()))
        label_encoder.fit(all_cats)

    known = set(label_encoder.classes_)
    df["category_clean"] = df["category_clean"].apply(
        lambda c: c if c in known else "other"
    )
    df["category_encoded"] = np.asarray(label_encoder.transform(df["category_clean"])).tolist()

    return df[FEATURE_COLS].copy(), label_encoder


def expense_to_dict(expense) -> Dict[str, Any]:
    if hasattr(expense, "model_dump"):
        return expense.model_dump()
    if hasattr(expense, "dict"):
        return expense.dict()
    return {"amount": expense.amount, "category": expense.category, "date": expense.date}