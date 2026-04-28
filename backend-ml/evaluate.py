# evaluate_model.py
import os, json, traceback
import pandas as pd
import joblib
import re
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_fscore_support

def clean_text(s):
    s = str(s).lower()
    s = re.sub(r"http\S+|www\S+", " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

# paths
VECT_PATH = os.path.join("models", "vectorizer.joblib")
MODEL_PATH = os.path.join("models", "model.joblib")
TEST_CSV = os.path.join("data", "test.csv")
TRAIN_SPLIT_CSV = os.path.join("data", "train_split.csv")

print("Starting evaluation script...")

try:
    # load artifacts
    vect = joblib.load(VECT_PATH)
    model = joblib.load(MODEL_PATH)
    print(f"Loaded vectorizer and model from {VECT_PATH}, {MODEL_PATH}")
except Exception:
    print("ERROR loading model/vectorizer:")
    traceback.print_exc()
    raise SystemExit(1)

def load_and_prepare(path):
    df = pd.read_csv(path)
    if "comment_text" not in df.columns:
        raise SystemExit(f"{path} missing 'comment_text' column")
    df = df.dropna(subset=["comment_text"])
    # label columns present?
    label_cols = [c for c in ["toxic","severe_toxic","obscene","threat","insult","identity_hate"] if c in df.columns]
    if not label_cols:
        raise SystemExit(f"{path} has no label columns")
    df[label_cols] = df[label_cols].fillna(0).astype(int)
    df["label"] = df[label_cols].sum(axis=1).apply(lambda x: 1 if x>0 else 0)
    df["text_clean"] = df["comment_text"].map(clean_text)
    return df

def evaluate_on_df(df, name="TEST"):
    X = df["text_clean"].values
    y = df["label"].values
    X_t = vect.transform(X)
    y_pred = model.predict(X_t)
    y_proba = model.predict_proba(X_t)[:,1] if hasattr(model, "predict_proba") else None

    print(f"\n=== {name} classification report ===")
    print(classification_report(y, y_pred, digits=4))
    print(f"{name} Confusion matrix:\n", confusion_matrix(y, y_pred))
    if y_proba is not None:
        try:
            auc = roc_auc_score(y, y_proba)
            print(f"{name} ROC AUC: {auc:.4f}")
        except Exception as e:
            print("ROC AUC error:", e)
    return y, y_pred, y_proba

# Evaluate on train_split if exists
if os.path.exists(TRAIN_SPLIT_CSV):
    print("Evaluating on train split:", TRAIN_SPLIT_CSV)
    df_train = load_and_prepare(TRAIN_SPLIT_CSV)
    y_train, y_train_pred, y_train_proba = evaluate_on_df(df_train, name="TRAIN_SPLIT")
else:
    print("train_split.csv not found; skipping train split evaluation")

# Evaluate on test.csv (required)
if os.path.exists(TEST_CSV):
    print("Evaluating on test set:", TEST_CSV)
    df_test = load_and_prepare(TEST_CSV)
    y_test, y_test_pred, y_test_proba = evaluate_on_df(df_test, name="TEST")
else:
    raise SystemExit("ERROR: data/test.csv not found. Run create_test.py or provide test.csv")

# Threshold analysis for TEST if probabilities available
if 'y_test_proba' in locals() and y_test_proba is not None:
    print("\nThreshold tuning (TEST set):")
    for t in [0.5, 0.6, 0.7, 0.8, 0.9]:
        y_hat = (y_test_proba >= t).astype(int)
        p, r, f, _ = precision_recall_fscore_support(y_test, y_hat, average='binary')
        print(f" threshold {t:.2f} -> precision {p:.3f}, recall {r:.3f}, f1 {f:.3f}")
