import logging
import os
from pathlib import Path
from typing import Any

import numpy as np
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mindcare")

# --------------------------------------------------
# Paths and configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
XGBOOST_MODEL_PATH = BASE_DIR / "models" / "mindfulpath_xgboost.json"

FEATURES = [
    "daily_screen_time_hours",
    "phone_usage_before_sleep_minutes",
    "sleep_duration_hours",
    "sleep_quality_score",
    "caffeine_intake_cups",
    "physical_activity_minutes",
]

TRAINING_RANGES = {
    "daily_screen_time_hours": (1.0, 10.0),
    "phone_usage_before_sleep_minutes": (0.0, 119.0),
    "sleep_duration_hours": (4.0, 9.0),
    "sleep_quality_score": (1.0, 10.0),
    "caffeine_intake_cups": (0.0, 4.0),
    "physical_activity_minutes": (0.0, 119.0),
}

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

extra_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

ALLOWED_ORIGINS = list(dict.fromkeys(
    DEFAULT_CORS_ORIGINS + extra_origins
))

app = FastAPI(
    title="MindCare Combined Prediction API",
    description=(
        "Separate MentalBERT journal classification and "
        "XGBoost lifestyle prediction endpoints. "
        "Both models provide experimental, non-diagnostic outputs."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# --------------------------------------------------
# MentalBERT model initialization
# --------------------------------------------------

mentalbert_predictor = None
mentalbert_loaded = False
mentalbert_load_error: str | None = None

try:
    from backend.mentalbert_model import mentalbert_predictor

    mentalbert_loaded = True
    logger.info("MentalBERT loaded successfully.")

except Exception as exc:
    mentalbert_load_error = str(exc)
    logger.exception("MentalBERT failed to load.")

# --------------------------------------------------
# XGBoost model initialization
# --------------------------------------------------

booster = xgb.Booster()
xgboost_loaded = False
xgboost_load_error: str | None = None

try:
    if not XGBOOST_MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"XGBoost model not found: {XGBOOST_MODEL_PATH}"
        )

    booster.load_model(str(XGBOOST_MODEL_PATH))

    if booster.feature_names != FEATURES:
        raise RuntimeError(
            "XGBoost model feature names/order do not match "
            f"the API contract. Expected {FEATURES}, "
            f"received {booster.feature_names}."
        )

    xgboost_loaded = True
    logger.info("XGBoost loaded successfully.")

except Exception as exc:
    xgboost_load_error = str(exc)
    logger.exception("XGBoost failed to load.")

# --------------------------------------------------
# Request schemas
# --------------------------------------------------

class PredictionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


class LifestylePredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    daily_screen_time_hours: float = Field(ge=0, le=24)
    phone_usage_before_sleep_minutes: float = Field(ge=0, le=1440)
    sleep_duration_hours: float = Field(gt=0, le=24)
    sleep_quality_score: float = Field(ge=1, le=10)
    caffeine_intake_cups: float = Field(ge=0, le=30)
    physical_activity_minutes: float = Field(ge=0, le=1440)

# --------------------------------------------------
# Common endpoints
# --------------------------------------------------

@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": "MindCare Combined Prediction API",
        "status": "running",
        "docs": "/docs",
        "endpoints": [
            "/health",
            "/predict",
            "/predict-lifestyle",
            "/model-info",
        ],
    }


@app.get("/health")
def health() -> dict[str, Any]:
    both_loaded = mentalbert_loaded and xgboost_loaded

    return {
        "status": "healthy" if both_loaded else "degraded",
        "models": {
            "mentalbert": {
                "loaded": mentalbert_loaded,
                "error": mentalbert_load_error,
                "classes": [
                    "Anxiety",
                    "Bipolar",
                    "Depression",
                    "Normal",
                    "Personality disorder",
                    "Stress",
                    "Suicidal",
                ],
            },
            "xgboost": {
                "loaded": xgboost_loaded,
                "model_file": XGBOOST_MODEL_PATH.name,
                "error": xgboost_load_error,
            },
        },
    }


# --------------------------------------------------
# MentalBERT journal prediction
# --------------------------------------------------

@app.post("/predict")
def predict_text(request: PredictionRequest) -> dict[str, Any]:
    if not mentalbert_loaded or mentalbert_predictor is None:
        raise HTTPException(
            status_code=503,
            detail=f"MentalBERT is unavailable: {mentalbert_load_error}",
        )

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Please enter some text.",
        )

    try:
        return mentalbert_predictor.predict(text)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("MentalBERT prediction failed.")
        raise HTTPException(
            status_code=500,
            detail="MentalBERT prediction failed. Please try again.",
        ) from exc


# --------------------------------------------------
# XGBoost lifestyle prediction
# --------------------------------------------------

@app.get("/model-info")
def model_info() -> dict[str, Any]:
    return {
        "model_name": "XGBoost Lifestyle Stress Regressor",
        "model_type": "regression",
        "target": "stress_level",
        "features": FEATURES,
        "training_ranges": TRAINING_RANGES,
        "training_data_note": (
            "The training dataset is synthetic. "
            "External validation is required."
        ),
    }


@app.post("/predict-lifestyle")
def predict_lifestyle(
    request: LifestylePredictionRequest,
) -> dict[str, Any]:

    if not xgboost_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"XGBoost model is unavailable: {xgboost_load_error}",
        )

    values = [getattr(request, feature) for feature in FEATURES]

    matrix = xgb.DMatrix(
        np.asarray([values], dtype=np.float32),
        feature_names=FEATURES,
    )

    try:
        prediction = float(booster.predict(matrix)[0])

    except Exception as exc:
        logger.exception("XGBoost prediction failed.")
        raise HTTPException(
            status_code=500,
            detail="XGBoost prediction failed.",
        ) from exc

    outside_training_range = []

    for feature, value in zip(FEATURES, values):
        low, high = TRAINING_RANGES[feature]

        if value < low or value > high:
            outside_training_range.append(feature)

    return {
        "predicted_stress_level": round(prediction, 2),
        "scale": "1-10 training target scale; experimental estimate",
        "model": "XGBoost Lifestyle Stress Regressor",
        "features_used": dict(zip(FEATURES, values)),
        "outside_training_range": outside_training_range,
        "warning": (
            "Research estimate only. The model was trained on "
            "synthetic data, has not been validated on real "
            "MindCare users, and is not a diagnosis."
        ),
    }
