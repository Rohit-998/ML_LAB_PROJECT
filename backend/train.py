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

    print("\n" + "=" * 60)
    print("ABLATION STUDY")
    print("=" * 60)

    ablation_results = {}
    for name, model_template in build_models().items():
        ablation_results[name] = {"full_accuracy": results[name]["accuracy"]}
        drops = {}
        for feat_to_remove in features:
            remaining = [f for f in features if f != feat_to_remove]
            idx = [features.index(f) for f in remaining]

            X_train_abl = X_train_sc[:, idx]
            X_test_abl = X_test_sc[:, idx]

            m = type(model_template)(**model_template.get_params())
            m.fit(X_train_abl, y_train)
            y_pred_abl = m.predict(X_test_abl)
            acc_abl = accuracy_score(y_test, y_pred_abl)
            drop = results[name]["accuracy"] - acc_abl
            drops[feat_to_remove] = {
                "accuracy_without": round(acc_abl, 4),
                "accuracy_drop": round(drop, 4),
            }
        ablation_results[name]["feature_drops"] = drops

        print(f"\n  {name} (full acc = {results[name]['accuracy']:.4f}):")
        sorted_drops = sorted(drops.items(), key=lambda x: x[1]["accuracy_drop"], reverse=True)
        for feat, d in sorted_drops:
            arrow = "v" if d["accuracy_drop"] > 0 else "^"
            print(f"    Remove {feat:15s} -> {d['accuracy_without']:.4f}  ({arrow} {abs(d['accuracy_drop']):.4f})")

    print("\n" + "=" * 60)
    print("PCA ANALYSIS")
    print("=" * 60)

    pca_full = PCA()
    pca_full.fit(X_train_sc)
    explained_var = pca_full.explained_variance_ratio_.tolist()
    cumulative_var = np.cumsum(explained_var).tolist()

    print(f"  Explained variance ratios: {[round(v, 4) for v in explained_var]}")
    print(f"  Cumulative:                {[round(v, 4) for v in cumulative_var]}")

    pca_2d = PCA(n_components=2)
    X_pca_2d = pca_2d.fit_transform(X_train_sc)

    pca_accuracy = {}
    for n_comp in range(1, 8):
        pca_n = PCA(n_components=n_comp)
        X_tr_pca = pca_n.fit_transform(X_train_sc)
        X_te_pca = pca_n.transform(X_test_sc)

        dt = DecisionTreeClassifier(random_state=42)
        dt.fit(X_tr_pca, y_train)
        acc_pca = accuracy_score(y_test, dt.predict(X_te_pca))
        pca_accuracy[n_comp] = round(acc_pca, 4)
        print(f"  PCA n_components={n_comp}  DT Accuracy={acc_pca:.4f}")

    rng = np.random.RandomState(42)
    sample_idx = rng.choice(len(X_pca_2d), size=min(500, len(X_pca_2d)), replace=False)
    pca_scatter = {
        "x": [round(float(X_pca_2d[i, 0]), 4) for i in sample_idx],
        "y": [round(float(X_pca_2d[i, 1]), 4) for i in sample_idx],
        "labels": [le.classes_[y_train[i]] for i in sample_idx],
    }

    dataset_stats = {
        "feature_names": features,
        "crop_names": le.classes_.tolist(),
        "n_samples": len(df),
        "n_features": len(features),
        "n_crops": len(le.classes_),
        "feature_stats": {},
    }
    for feat in features:
        dataset_stats["feature_stats"][feat] = {
            "mean": round(float(df[feat].mean()), 2),
            "std": round(float(df[feat].std()), 2),
            "min": round(float(df[feat].min()), 2),
            "max": round(float(df[feat].max()), 2),
        }

    analysis = {
        "model_results": results,
        "feature_importance": importance_data,
        "permutation_importance": perm_importance_data,
        "ablation_study": ablation_results,
        "pca": {
            "explained_variance": [round(v, 4) for v in explained_var],
            "cumulative_variance": [round(v, 4) for v in cumulative_var],
            "accuracy_by_components": pca_accuracy,
            "scatter_2d": pca_scatter,
        },
        "dataset_stats": dataset_stats,
        "best_model": best_model_name,
    }

    with open(os.path.join(ARTIFACT_DIR, "analysis.json"), "w") as f:
        json.dump(analysis, f, indent=2)

    print("\n[OK] All models and analysis saved to:", ARTIFACT_DIR)
    print(f"[BEST] Best model: {best_model_name} ({best_acc:.4f})")


if __name__ == "__main__":
    main()
