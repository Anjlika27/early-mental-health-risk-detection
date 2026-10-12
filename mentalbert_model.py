
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_ID = "Anjlika27/mentalbert-dreaddit-stress"
HF_TOKEN = os.getenv("HF_TOKEN")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN
)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_ID,
    token=HF_TOKEN
)

model.eval()


def predict_stress(text):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Please enter some text.")

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=256
    )

    with torch.inference_mode():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=-1)[0]

    predicted_id = int(probabilities.argmax().item())

    # Confirm these mappings against your training labels.
    labels = {0: "Non-stress", 1: "Stress"}

    return {
        "label": labels[predicted_id],
        "confidence": float(probabilities[predicted_id].item())
    }
