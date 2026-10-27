import os

import torch
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer

load_dotenv()

MODEL_ID = "Anjlika27/mentalbert-dreaddit-stress"
HF_TOKEN = os.getenv("HF_TOKEN") or None

app = FastAPI(title="MindfulPath Stress Prediction API")

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

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN,
)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN,
)

model.eval()


class PredictionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "MindfulPath Stress Prediction API"}


@app.get("/health")
def health():
    return {"status": "healthy", "model": MODEL_ID}


@app.post("/predict")
def predict_stress(request: PredictionRequest):
    text = request.text.strip()

    if not text:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="Please enter some text.",
        )

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=256,
    )

    with torch.inference_mode():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=-1)[0]

    predicted_id = int(probabilities.argmax().item())

    # Verify these labels against the model's actual training labels.
    labels = {0: "Non-stress", 1: "Stress"}

    if predicted_id not in labels:
        return {
            "error": "The model returned an unexpected class.",
        }

    return {
        "label": labels[predicted_id],
        "confidence": round(float(probabilities[predicted_id].item()), 4),
        "model": MODEL_ID,
        "disclaimer": (
            "Research estimate only; this is not a clinical diagnosis."
        ),
    }