"""
routes/train.py — Train a personalised IsolationForest per user.

Features:
1. budget_ratio + income_ratio features → model is financially personalised.
2. Adaptive contamination: decreases as dataset grows (10→0.12, 200→0.025).
3. Saves meta_{uid}.pkl with budget/income so /analyze never needs re-passing.
4. Cache invalidation after retraining.

When to call from Node.js:
  - Signup: once user has ≥10 expenses (background job).
  - Settings change: user updates budget/income/category caps.
  - Every 50 new expenses: rolling retrain for drift correction.
"""

import os
import joblib
from fastapi import APIRouter, HTTPException
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from models import TrainRequest, TrainResponse
from features import build_features, expense_to_dict
from routes.analyze import invalidate_cache

router = APIRouter()
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")

MIN_CONTAMINATION = 0.01
MAX_CONTAMINATION = 0.15


def _adaptive_contamination(n: int) -> float:
    rate = max(MIN_CONTAMINATION, 0.10 * (10 / max(n, 10)) + 0.02)
    return round(min(rate, MAX_CONTAMINATION), 4)


@router.post("", response_model=TrainResponse)
def train_model(request: TrainRequest):
    n = len(request.expenses)
    if n < 10:
        raise HTTPException(status_code=400,
                            detail=f"Need at least 10 expenses to train. Have {n}.")

    expense_dicts = [expense_to_dict(e) for e in request.expenses]
    feature_df, label_encoder = build_features(
        expense_dicts, fit_encoder=True,
        monthly_budget=request.monthly_budget,
        monthly_income=request.monthly_income,
    )

    scaler        = StandardScaler()
    X_scaled      = scaler.fit_transform(feature_df)
    contamination = _adaptive_contamination(n)

    model = IsolationForest(
        n_estimators=150,
        contamination=contamination,
        max_features=0.8,
        bootstrap=True,
        random_state=42,
    )
    model.fit(X_scaled)

    os.makedirs(MODELS_DIR, exist_ok=True)
    uid = request.user_id
    joblib.dump(model,         os.path.join(MODELS_DIR, f"iso_{uid}.pkl"))
    joblib.dump(scaler,        os.path.join(MODELS_DIR, f"scaler_{uid}.pkl"))
    joblib.dump(label_encoder, os.path.join(MODELS_DIR, f"encoder_{uid}.pkl"))
    joblib.dump({
        "monthly_budget":   request.monthly_budget,
        "monthly_income":   request.monthly_income,
        "category_budgets": request.category_budgets or {},
        "currency":         request.currency or "₹",
    }, os.path.join(MODELS_DIR, f"meta_{uid}.pkl"))

    invalidate_cache(uid)

    return TrainResponse(status="trained", n_samples=n, contamination_used=contamination)