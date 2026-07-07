"""
routes/analyze.py — Score a single expense for anomaly.

Dispatch logic:
  total_expense_count < 10  →  cold_start_analyze()
  ≥ 10 + model files exist  →  IsolationForest ML path
  ≥ 10 + files missing      →  cold_start_analyze() (safe fallback)
"""

import os
import joblib
from fastapi import APIRouter
from currency import fmt

from models import AnalyzeRequest, AnalyzeResponse
from features import build_features, expense_to_dict
from cold_start import cold_start_analyze

router = APIRouter()
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")
_model_cache: dict = {}
ML_THRESHOLD = 10


def _load_artefacts(user_id: str):
    if user_id in _model_cache:
        return _model_cache[user_id]
    paths = {
        "iso":     os.path.join(MODELS_DIR, f"iso_{user_id}.pkl"),
        "scaler":  os.path.join(MODELS_DIR, f"scaler_{user_id}.pkl"),
        "encoder": os.path.join(MODELS_DIR, f"encoder_{user_id}.pkl"),
        "meta":    os.path.join(MODELS_DIR, f"meta_{user_id}.pkl"),
    }
    if not all(os.path.exists(p) for p in paths.values()):
        return None
    artefacts = (
        joblib.load(paths["iso"]),
        joblib.load(paths["scaler"]),
        joblib.load(paths["encoder"]),
        joblib.load(paths["meta"]),
    )
    _model_cache[user_id] = artefacts
    return artefacts


def invalidate_cache(user_id: str) -> None:
    _model_cache.pop(user_id, None)


@router.post("", response_model=AnalyzeResponse)
def analyze_expense(request: AnalyzeRequest) -> AnalyzeResponse:
    count = request.total_expense_count or 0

    # Path 1: Rule-based cold start
    if count < ML_THRESHOLD:
        return cold_start_analyze(
            amount=request.expense.amount,
            category=request.expense.category,
            monthly_budget=request.monthly_budget,
            monthly_income=request.monthly_income,
            category_budgets=request.category_budgets or {},
            history=request.history or [],
            currency=request.currency or "₹",
        )

    # Path 2: Safe fallback
    artefacts = _load_artefacts(request.user_id)
    if artefacts is None:
        return cold_start_analyze(
            amount=request.expense.amount,
            category=request.expense.category,
            monthly_budget=request.monthly_budget,
            monthly_income=request.monthly_income,
            category_budgets=request.category_budgets or {},
            history=request.history or [],
            currency=request.currency or "₹",
        )

    # Path 3: full ML path
    model, scaler, label_encoder, meta = artefacts
    currency = meta.get("currency", request.currency or "₹")

    feat_df, _ = build_features(
        [expense_to_dict(request.expense)],
        label_encoder=label_encoder,
        fit_encoder=False,
        monthly_budget=meta.get("monthly_budget", request.monthly_budget),
        monthly_income=meta.get("monthly_income", request.monthly_income),
    )
    X_scaled   = scaler.transform(feat_df)
    prediction = model.predict(X_scaled)[0]
    raw_score  = -float(model.decision_function(X_scaled)[0])
    is_anomaly = bool(prediction == -1)

    return AnalyzeResponse(
        is_anomaly=is_anomaly,
        score=round(raw_score, 4),
        # BUG FIX: currency was not being passed — message always showed ₹
        message=_build_ml_message(request.expense, request.history or [], is_anomaly, currency),
        method="ml",
        confidence=_ml_confidence(raw_score, count),
    )


def _build_ml_message(expense, history, is_anomaly, currency="₹") -> str:
    if not is_anomaly:
        return f"{fmt(expense.amount, currency)} on {expense.category.title()} looks normal."
    cat      = expense.category.lower().strip()
    same_cat = [e for e in history if e.category.lower().strip() == cat]
    if len(same_cat) >= 3:
        avg        = sum(e.amount for e in same_cat) / len(same_cat)
        multiplier = round(expense.amount / avg, 1) if avg > 0 else "—"
        return (f"{fmt(expense.amount, currency)} on {expense.category.title()} is "
                f"{multiplier}× your usual {fmt(avg, currency)} in this category.")
    return (f"{fmt(expense.amount, currency)} on {expense.category.title()} is "
            f"unusually high compared to your spending patterns.")


def _ml_confidence(raw_score, n_expenses) -> str:
    if n_expenses >= 50 and raw_score > 0.15:
        return "high"
    if n_expenses >= 20 and raw_score > 0.08:
        return "medium"
    return "low"