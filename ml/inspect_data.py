
from pathlib import Path

import pandas as pd

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "Processed.csv"


def main():
    print("=" * 60)
    print("MINDFUL PATH - DATASET INSPECTION")
    print("=" * 60)

    if not DATA_PATH.exists():
        print(f"\nDataset not found: {DATA_PATH}")
        print("Check that Processed.csv is inside data/raw/")
        return

    df = pd.read_csv(DATA_PATH)

    print(f"\nDataset shape: {df.shape[0]} rows, {df.shape[1]} columns")

    print("\n--- Column names ---")
    for column in df.columns:
        print(column)

    print("\n--- First 5 rows ---")
    print(df.head().to_string())

    print("\n--- Data types ---")
    print(df.dtypes.to_string())

    print("\n--- Missing values ---")
    missing = df.isnull().sum()
    print(missing[missing > 0].to_string() if missing.any() else "No missing values found.")

    print("\n--- Duplicate rows ---")
    print(df.duplicated().sum())

    # Inspect possible target columns
    for column in df.columns:
        if any(word in column.lower() for word in ["depression label", "anxiety label", "stress label"]):
            print(f"\n--- Distribution: {column} ---")
            print(df[column].value_counts(dropna=False).to_string())

    print("\n--- Inspection complete ---")


if __name__ == "__main__":
    main()
