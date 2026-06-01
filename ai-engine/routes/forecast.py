"""
routes/forecast.py — Personalised spending forecast (zero hardcoded benchmarks).

  0-3 days  → BUDGET:    daily = monthlyBudget / days_in_month
  4-13 days → BAYESIAN:  blended_daily = (1-w) * budget_daily + w * actual_daily
                         w = n_real_days / 14
  14+ days  → PROPHET:   real data only (no benchmark blending)

Every response includes budget_remaining and on_track.
"""

import calendar
from datetime import date, timedelta
from fastapi import APIRouter
from typing import Any

from models import ForecastRequest, ForecastResponse, ForecastDay

router = APIRouter()

try:
    from prophet import Prophet
    _PROPHET_AVAILABLE = True
except ImportError:
    _PROPHET_AVAILABLE = False


def _current_month_data(request: ForecastRequest) -> list:
    if not request.daily_totals:
        return []
    latest_month = max(d.ds[:7] for d in request.daily_totals)
    return [d for d in request.daily_totals if d.ds.startswith(latest_month)]


def _month_params(today: date) -> tuple:
    days_in_month  = calendar.monthrange(today.year, today.month)[1]
    days_remaining = days_in_month - today.day
    return days_in_month, days_remaining


def _build_response(forecast_days, actual_so_far, predicted_remaining,
                    lower_remaining, upper_remaining, monthly_budget,
                    method, days_of_data) -> ForecastResponse:
    predicted_month_end = round(actual_so_far + predicted_remaining, 2)
    return ForecastResponse(
        forecast=forecast_days,
        predicted_month_end=predicted_month_end,
        lower_bound=round(actual_so_far + lower_remaining, 2),
        upper_bound=round(actual_so_far + upper_remaining, 2),
        method=method,
        days_of_data=days_of_data,
        budget_remaining=round(monthly_budget - predicted_month_end, 2),
        on_track=predicted_month_end <= monthly_budget,
    )


@router.post("", response_model=ForecastResponse)
def forecast_spending(request: ForecastRequest) -> ForecastResponse:
    month_data = _current_month_data(request)
    n = len(month_data)
    if n >= 14:
        return _prophet_forecast(request, month_data)
    elif n >= 4:
        return _bayesian_forecast(request, month_data)
    else:
        return _budget_forecast(request, month_data)


def _budget_forecast(request, month_data) -> ForecastResponse:
    today = date.today()
    days_in_month, days_remaining = _month_params(today)
    daily_budget  = request.monthly_budget / days_in_month
    actual_so_far = sum(d.y for d in month_data)
    forecast_days = [
        ForecastDay(ds=str(today + timedelta(days=i)),
                    yhat=round(daily_budget, 2),
                    yhat_lower=round(daily_budget * 0.7, 2),
                    yhat_upper=round(daily_budget * 1.3, 2))
        for i in range(1, 8)
    ]
    predicted_remaining = daily_budget * days_remaining
    return _build_response(forecast_days, actual_so_far, predicted_remaining,
                           predicted_remaining * 0.7, predicted_remaining * 1.3,
                           request.monthly_budget, "budget", len(month_data))


def _bayesian_forecast(request, month_data) -> ForecastResponse:
    today = date.today()
    days_in_month, days_remaining = _month_params(today)
    n             = len(month_data)
    actual_so_far = sum(d.y for d in month_data)
    actual_daily  = actual_so_far / max(n, 1)
    budget_daily  = request.monthly_budget / days_in_month

    weight        = n / 14.0
    blended_daily = (1 - weight) * budget_daily + weight * actual_daily
    lower_factor  = 0.85 - 0.10 * (1 - weight)
    upper_factor  = 1.15 + 0.10 * (1 - weight)

    forecast_days = [
        ForecastDay(ds=str(today + timedelta(days=i)),
                    yhat=round(blended_daily, 2),
                    yhat_lower=round(blended_daily * lower_factor, 2),
                    yhat_upper=round(blended_daily * upper_factor, 2))
        for i in range(1, 8)
    ]
    predicted_remaining = blended_daily * days_remaining
    return _build_response(forecast_days, actual_so_far, predicted_remaining,
                           predicted_remaining * lower_factor,
                           predicted_remaining * upper_factor,
                           request.monthly_budget, "bayesian", n)


def _prophet_forecast(request, month_data) -> ForecastResponse:
    if not _PROPHET_AVAILABLE:
        return _bayesian_forecast(request, month_data)

    import pandas as pd
    today         = date.today()
    days_in_month = calendar.monthrange(today.year, today.month)[1]

    df = pd.DataFrame([{"ds": d.ds, "y": d.y} for d in month_data])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"]  = df["y"].astype(float).clip(lower=0)
    grouped_df: Any = df.groupby("ds", as_index=False)["y"].sum()
    df = grouped_df.sort_values("ds").reset_index(drop=True)
    actual_so_far = float(df["y"].sum())
    last_observed = df["ds"].max()

    FlexProphet: Any = Prophet

    model = FlexProphet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False,
        uncertainty_samples=300,
        changepoint_prior_scale=0.05,
    )
    model.fit(df)

    future      = model.make_future_dataframe(periods=7, freq="D")
    forecast    = model.predict(future)
    future_only = forecast[forecast["ds"] > last_observed].head(7).copy()
    future_only["yhat"]       = future_only["yhat"].clip(lower=0).round(2)
    future_only["yhat_lower"] = future_only["yhat_lower"].clip(lower=0).round(2)
    future_only["yhat_upper"] = future_only["yhat_upper"].clip(lower=0).round(2)

    forecast_days = [
        ForecastDay(ds=str(row["ds"].date()), yhat=float(row["yhat"]),
                    yhat_lower=float(row["yhat_lower"]),
                    yhat_upper=float(row["yhat_upper"]))
        for _, row in future_only.iterrows()
    ]
    return _build_response(
        forecast_days, actual_so_far,
        float(future_only["yhat"].sum()),
        float(future_only["yhat_lower"].sum()),
        float(future_only["yhat_upper"].sum()),
        request.monthly_budget, "prophet", len(month_data),
    )