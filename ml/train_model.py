
from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "raw" / "Processed.csv"
MODEL_DIR = ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "mindful_path_model.joblib"

TARGET = "Depression Label"

CATEGORICAL_FEATURES = [
    "Age",
    "Gender",
    "University",
    "Department",
    "Academic_Year",
    "Current_CGPA",
    "waiver_or_scholarship",
]

NUMERIC_FEATURES = (
    [f"PSS{i}" for i in range(1, 11)]
    + [f"GAD{i}" for i in range(1, 8)]
)

FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    df = pd.read_csv(DATA_PATH)

    required = FEATURES + [TARGET]
    missing = [c for c in required if c not in df.columns]

    if missing:
        raise ValueError(
            f"Required columns are missing: {missing}"
        )

    # Remove exact duplicate records.
    df = df.drop_duplicates().copy()

    # Keep only rows with a valid target and required inputs.
    df = df.dropna(subset=required)

    X = df[FEATURES].copy()
    y = df[TARGET].astype(str)

    print("=" * 60)
    print("MINDFUL PATH - FIRST ML MODEL")
    print("=" * 60)
    print(f"Rows after cleaning: {len(df)}")
    print(f"Input features: {len(FEATURES)}")
    print("\nTarget distribution:")
    print(y.value_counts().to_string())

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])

    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
    ])

    preprocessing = ColumnTransformer([
        ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ("numeric", numeric_pipeline, NUMERIC_FEATURES),
    ])

    model = Pipeline([
        ("preprocessing", preprocessing),
        ("classifier", RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    print("\n--- Evaluation on held-out test data ---")
    print(f"Test records: {len(X_test)}")
    print(f"Accuracy: {accuracy_score(y_test, predictions):.3f}")
    print(
        "Macro F1: "
        f"{f1_score(y_test, predictions, average='macro'):.3f}"
    )

    print("\n--- Classification report ---")
    print(classification_report(
        y_test,
        predictions,
        zero_division=0,
    ))

    labels = sorted(y.unique())
    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=labels,
    )

    print("--- Confusion matrix ---")
    print("Label order:", labels)
    print(matrix)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump({
        "model": model,
        "features": FEATURES,
        "target": TARGET,
        "classes": labels,
        "excluded_features": [
            f"PHQ{i}" for i in range(1, 10)
        ] + ["Depression Value", "DepressionValue"],
        "dataset": "MHP student survey",
    }, MODEL_PATH)

    print(f"\nModel saved to: {MODEL_PATH}")
    print("\nTraining and evaluation complete.")


if __name__ == "__main__":
    main()
