# train_model.py
import os
import re
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils import resample
import joblib

# Clean text function
def clean_text(s):
    s = str(s).lower()
    s = re.sub(r"http\S+|www\S+", " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

# Load data and create single label
def load_data(csv_path, text_col, label_cols):
    df = pd.read_csv(csv_path)
    
    # Drop rows with missing comment text
    df = df.dropna(subset=[text_col])
    
    # Clean the comment text
    df['text_clean'] = df[text_col].map(clean_text)

    # Combine multiple toxic columns into single label
    label_list = [c.strip() for c in label_cols.split(',')]
    
    # Fill NaNs with 0 (treat missing label as non-toxic)
    df[label_list] = df[label_list].fillna(0)
    
    # Ensure numeric
    df[label_list] = df[label_list].astype(int)
    
    # Create combined label
    df['label'] = df[label_list].sum(axis=1).apply(lambda x: 1 if x > 0 else 0)
    
    return df[['text_clean','label']]

# Balance dataset by oversampling minority class
def balance_dataset(df):
    toxic = df[df['label'] == 1]
    clean = df[df['label'] == 0]

    if len(toxic) < len(clean):
        toxic_oversampled = resample(toxic,
                                     replace=True,
                                     n_samples=len(clean),
                                     random_state=42)
        df_balanced = pd.concat([clean, toxic_oversampled])
    else:
        df_balanced = df

    # Shuffle
    return df_balanced.sample(frac=1, random_state=42)

def main():
    csv_path = "data/train.csv"
    text_col = "comment_text"
    label_cols = "toxic,severe_toxic,obscene,threat,insult,identity_hate"

    df = load_data(csv_path, text_col, label_cols)
    df_balanced = balance_dataset(df)

    X = df_balanced['text_clean']
    y = df_balanced['label']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # TF-IDF vectorizer
    vect = TfidfVectorizer(max_features=20000, ngram_range=(1,2))
    X_train_t = vect.fit_transform(X_train)
    X_test_t = vect.transform(X_test)

    # Logistic Regression
    model = LogisticRegression(max_iter=1000, class_weight='balanced')
    model.fit(X_train_t, y_train)

    # Evaluation
    preds = model.predict(X_test_t)
    print("=== Classification Report ===")
    print(classification_report(y_test, preds))
    print("Accuracy:", accuracy_score(y_test, preds))

    # Save artifacts
    os.makedirs("models", exist_ok=True)
    joblib.dump(vect, "models/vectorizer.joblib")
    joblib.dump(model, "models/model.joblib")
    print("Saved vectorizer & model in 'models/' folder.")

if __name__ == "__main__":
    main()
