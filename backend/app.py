from pathlib import Path
from typing import Any

import numpy as np
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "mindfulpath_xgboost.json"
METADATA_PATH = BASE_DIR / "models" / "metadata.json"

FEATURES = [
    "daily_screen_time_hours",
    "phone_usage_before_sleep_minutes",
    "sleep_duration_hours",
    "sleep_quality_score",
    "caffeine_intake_cups",
    "physical_activity_minutes",
]

# Physical input limits protect the API from impossible values. The narrower
# training ranges below are used for warnings, not hard rejection.
TRAINING_RANGES = {
    "daily_screen_time_hours": (1.0, 10.0),
    "phone_usage_before_sleep_minutes": (0.0, 119.0),
    "sleep_duration_hours": (4.0, 9.0),
    "sleep_quality_score": (1.0, 10.0),
    "caffeine_intake_cups": (0.0, 4.0),
    "physical_activity_minutes": (0.0, 119.0),
}

app = FastAPI(
    title="MindCare XGBoost Lifestyle API",
    description=(
        "Experimental lifestyle-based stress-level regression endpoint. "
        "This model is research software, not a clinical assessment."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class LifestylePredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    daily_screen_time_hours: float = Field(ge=0, le=24)
    phone_usage_before_sleep_minutes: float = Field(ge=0, le=1440)
    sleep_duration_hours: float = Field(gt=0, le=24)
    sleep_quality_score: float = Field(ge=1, le=10)
    caffeine_intake_cups: float = Field(ge=0, le=30)
    physical_activity_minutes: float = Field(ge=0, le=1440)


booster = xgb.Booster()
model_loaded = False
model_load_error: str | None = None

try:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    booster.load_model(str(MODEL_PATH))

    if booster.feature_names != FEATURES:
        raise RuntimeError(
            "Model feature names/order do not match the API contract. "
            f"Expected {FEATURES}, received {booster.feature_names}."
        )

    model_loaded = True
except Exception as exc:  # Keep the API importable so /health can explain the issue.
    model_load_error = str(exc)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "MindCare XGBoost Lifestyle API", "docs": "/docs"}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "healthy" if model_loaded else "model_not_loaded",
        "model_loaded": model_loaded,
        "model_file": MODEL_PATH.name,
        "model_load_error": model_load_error,
    }


@app.get("/model-info")
def model_info() -> dict[str, Any]:
    return {
        "model_name": "XGBoost Lifestyle Stress Regressor",
        "model_type": "regression",
        "target": "stress_level",
        "features": FEATURES,
        "training_ranges": TRAINING_RANGES,
        "training_data_note": "The training dataset is synthetic; external validation is required.",
    }


@app.post("/predict-lifestyle")
def predict_lifestyle(request: LifestylePredictionRequest) -> dict[str, Any]:
    if not model_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"XGBoost model is not loaded: {model_load_error}",
        )

    # Construct values in precisely the order used during model training.
    values = [getattr(request, feature) for feature in FEATURES]
    matrix = xgb.DMatrix(
        np.asarray([values], dtype=np.float32),
        feature_names=FEATURES,
    )

    try:
        prediction = float(booster.predict(matrix)[0])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    outside_training_range = []
    for feature, value in zip(FEATURES, values):
        low, high = TRAINING_RANGES[feature]
        if value < low or value > high:
            outside_training_range.append(feature)

    # Do not silently clip the regression result. Return the actual model output.
    return {
        "predicted_stress_level": round(prediction, 2),
        "scale": "1-10 training target scale; experimental estimate",
        "model": "XGBoost Lifestyle Stress Regressor",
        "features_used": dict(zip(FEATURES, values)),
        "outside_training_range": outside_training_range,
        "warning": (
            "Research estimate only. The model was trained on synthetic data, "
            "has not been validated on real MindCare users, and is not a diagnosis."
        ),
    }
