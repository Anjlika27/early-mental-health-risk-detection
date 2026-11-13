
import torch
import torch.nn.functional as F

from pathlib import Path
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification
)


# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "mentalbert256best"

MAX_LENGTH = 256

CLASS_LABELS = [
    "Anxiety",
    "Bipolar",
    "Depression",
    "Normal",
    "Personality disorder",
    "Stress",
    "Suicidal"
]

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ==========================================
# 2. MENTALBERT MODEL CLASS
# ==========================================

class MentalBERTPredictor:

    def __init__(self):

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"MentalBERT model not found at: {MODEL_PATH}"
            )

        print("Loading MentalBERT tokenizer...")

        self.tokenizer = AutoTokenizer.from_pretrained(
            str(MODEL_PATH),
            local_files_only=True
        )

        print("Loading MentalBERT model...")

        self.model = AutoModelForSequenceClassification.from_pretrained(
            str(MODEL_PATH),
            local_files_only=True
        )

        # Verify model label mapping
        assert self.model.config.id2label == {
            i: label for i, label in enumerate(CLASS_LABELS)
        }, "Model label mapping does not match CLASS_LABELS!"

        # Verify number of output classes
        if self.model.config.num_labels != len(CLASS_LABELS):
            raise ValueError(
                "Model output count does not match the seven class labels."
            )

        self.model.to(DEVICE)
        self.model.eval()

        print(f"MentalBERT loaded successfully on {DEVICE}")

    # ======================================
    # 3. TEXT PREPROCESSING
    # ======================================

    def preprocess(self, text):

        if not isinstance(text, str):
            raise ValueError("Input must be a text string.")

        text = text.strip()

        if not text:
            raise ValueError("Input text cannot be empty.")

        return self.tokenizer(
            text,
            max_length=MAX_LENGTH,
            truncation=True,
            padding=True,
            return_tensors="pt"
        )

    # ======================================
    # 4. TEXT EMBEDDING EXTRACTION
    # ======================================

    def extract_embedding(self, text):

        inputs = self.preprocess(text)

        inputs = {
            key: value.to(DEVICE)
            for key, value in inputs.items()
        }

        with torch.inference_mode():

            outputs = self.model.bert(
                **inputs,
                return_dict=True
            )

            # Mean pooling over non-padding tokens
            hidden_states = outputs.last_hidden_state

            attention_mask = inputs["attention_mask"].unsqueeze(-1)

            masked_embeddings = (
                hidden_states * attention_mask
            )

            embedding = (
                masked_embeddings.sum(dim=1)
                / attention_mask.sum(dim=1).clamp(min=1)
            )

        return embedding.squeeze(0).cpu().numpy()

    # ======================================
    # 5. SEVEN-CLASS PREDICTION
    # ======================================

    def predict(self, text):

        inputs = self.preprocess(text)

        inputs = {
            key: value.to(DEVICE)
            for key, value in inputs.items()
        }

        with torch.inference_mode():

            outputs = self.model(**inputs)

            probabilities = F.softmax(
                outputs.logits,
                dim=-1
            )

            predicted_index = torch.argmax(
                probabilities,
                dim=-1
            ).item()

        probability_values = probabilities[0].cpu().tolist()

        predicted_label = CLASS_LABELS[predicted_index]

        class_probabilities = {
            CLASS_LABELS[i]: round(
                float(probability_values[i]), 6
            )
            for i in range(len(CLASS_LABELS))
        }

        return {
            "predicted_class": predicted_label,
            "confidence": round(
                float(probability_values[predicted_index]), 6
            ),
            "class_probabilities": class_probabilities,
            "model": "MentalBERT",
            "disclaimer": (
                "This model provides experimental text classification "
                "results and is not a clinical diagnosis."
            )
        }


# ==========================================
# 6. CREATE MODEL INSTANCE
# ==========================================

mentalbert_predictor = MentalBERTPredictor()


# ==========================================
# 7. STANDALONE TESTING
# ==========================================

if __name__ == "__main__":

    sample_text = (
        "I have been feeling overwhelmed and "
        "struggling with my thoughts lately."
    )

    result = mentalbert_predictor.predict(sample_text)

    print("\nPrediction Result:")
    print(result)

    embedding = mentalbert_predictor.extract_embedding(
        sample_text
    )

    print("\nEmbedding shape:", embedding.shape)
