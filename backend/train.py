import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from collections import OrderedDict

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, f1_score
)

from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "Crop_recommendation.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(ARTIFACT_DIR, exist_ok=True)


def load_data():
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset shape: {df.shape}")
    print(f"Crops: {df['label'].nunique()} -> {sorted(df['label'].unique())}")
    return df


def build_models():
    return OrderedDict([
        ("Naive Bayes", GaussianNB()),
        ("Decision Tree", DecisionTreeClassifier(random_state=42)),
        ("KNN", KNeighborsClassifier(n_neighbors=5)),
    ])


def main():
    df = load_data()

    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    X = df[features].values
    y_raw = df["label"].values

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    joblib.dump(le, os.path.join(ARTIFACT_DIR, "label_encoder.pkl"))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(ARTIFACT_DIR, "scaler.pkl"))

    models = build_models()
    results = {}
    best_acc = 0
    best_model_name = ""

    print("\n" + "=" * 60)
    print("MODEL TRAINING & EVALUATION")
    print("=" * 60)

    for name, model in models.items():
        model.fit(X_train_sc, y_train)
        y_pred = model.predict(X_test_sc)

        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted")
        cv_scores = cross_val_score(model, X_train_sc, y_train, cv=5, scoring="accuracy")

        cm = confusion_matrix(y_test, y_pred).tolist()

        report = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True)
        per_class = {
            crop: {
                "precision": round(report[crop]["precision"], 4),
                "recall": round(report[crop]["recall"], 4),
                "f1": round(report[crop]["f1-score"], 4),
                "support": int(report[crop]["support"]),
            }
            for crop in le.classes_
        }

        results[name] = {
            "accuracy": round(acc, 4),
            "f1_weighted": round(f1, 4),
            "cv_mean": round(cv_scores.mean(), 4),
            "cv_std": round(cv_scores.std(), 4),
            "confusion_matrix": cm,
            "per_class": per_class,
        }

        print(f"  {name:20s}  Acc={acc:.4f}  F1={f1:.4f}  CV={cv_scores.mean():.4f}+/-{cv_scores.std():.4f}")

        joblib.dump(model, os.path.join(ARTIFACT_DIR, f"model_{name.replace(' ', '_').lower()}.pkl"))

        if acc > best_acc:
            best_acc = acc
            best_model_name = name

    print("\n" + "=" * 60)
    print("FEATURE IMPORTANCE ANALYSIS")
    print("=" * 60)

    importance_data = {}

    for name in ["Decision Tree"]:
        model = models[name]
        imp = model.feature_importances_
        importance_data[name] = {f: round(float(v), 4) for f, v in zip(features, imp)}
        ranked = sorted(zip(features, imp), key=lambda x: x[1], reverse=True)
        print(f"\n  {name}:")
        for feat, val in ranked:
            bar = "#" * int(val * 40)
            print(f"    {feat:15s} {val:.4f} {bar}")

    from sklearn.inspection import permutation_importance
    perm_importance_data = {}
    for name, model in models.items():
        perm = permutation_importance(model, X_test_sc, y_test, n_repeats=10, random_state=42, n_jobs=-1)
        perm_importance_data[name] = {
            f: round(float(v), 4) for f, v in zip(features, perm.importances_mean)
        }

    print(f"\n[BEST] {best_model_name} ({best_acc:.4f})")


if __name__ == "__main__":
    main()
