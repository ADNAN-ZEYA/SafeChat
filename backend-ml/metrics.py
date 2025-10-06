# run_locally_metrics.py
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer

# load model & vectorizer
vect = joblib.load("models/vectorizer.joblib")
model = joblib.load("models/model.joblib")

# load data (same preprocessing as training)
df = pd.read_csv("data/train.csv")
df = df.dropna(subset=["comment_text"])
label_cols = ["toxic","severe_toxic","obscene","threat","insult","identity_hate"]
df[label_cols] = df[label_cols].fillna(0).astype(int)
df["label"] = df[label_cols].sum(axis=1).apply(lambda x: 1 if x>0 else 0)

# optional: same cleaning function as training if used
def clean_text(s):
    import re
    s = str(s).lower()
    s = re.sub(r"http\S+|www\S+", " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

df["text_clean"] = df["comment_text"].map(clean_text)

# use same balanced sampling as training to create comparable split
from sklearn.utils import resample
toxic = df[df['label']==1]
clean = df[df['label']==0]
if len(toxic) < len(clean):
    toxic_oversampled = resample(toxic, replace=True, n_samples=len(clean), random_state=42)
    df_bal = pd.concat([clean, toxic_oversampled]).sample(frac=1, random_state=42)
else:
    df_bal = df.sample(frac=1, random_state=42)

X = df_bal['text_clean']
y = df_bal['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

X_train_t = vect.transform(X_train)
X_test_t = vect.transform(X_test)

y_pred_train = model.predict(X_train_t)
y_pred_test  = model.predict(X_test_t)

y_proba_test = model.predict_proba(X_test_t)[:,1]

print("TRAIN classification report")
print(classification_report(y_train, y_pred_train))
print("TEST classification report")
print(classification_report(y_test, y_pred_test))

print("Confusion matrix (test):")
print(confusion_matrix(y_test, y_pred_test))

try:
    auc = roc_auc_score(y_test, y_proba_test)
    print("ROC AUC (test):", auc)
except Exception as e:
    print("ROC AUC error:", e)
