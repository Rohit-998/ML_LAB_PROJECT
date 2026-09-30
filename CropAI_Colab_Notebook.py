import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from collections import OrderedDict

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, f1_score,
    ConfusionMatrixDisplay
)
from sklearn.inspection import permutation_importance

from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

warnings.filterwarnings("ignore")
sns.set_style("darkgrid")
plt.rcParams.update({"figure.figsize": (12, 6), "font.size": 12})

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv("Crop_recommendation.csv")
print(f"Shape: {df.shape}")
print(f"Crops ({df['label'].nunique()}): {sorted(df['label'].unique())}")
df.head()

df.describe().round(2)

plt.figure(figsize=(14, 5))
df['label'].value_counts().plot(kind='bar', color=sns.color_palette("viridis", 22))
plt.title("Crop Distribution (100 samples each)")
plt.xlabel("Crop")
plt.ylabel("Count")
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()

plt.figure(figsize=(8, 6))
sns.heatmap(df.drop('label', axis=1).corr(), annot=True, cmap='coolwarm', center=0, fmt='.2f')
plt.title("Feature Correlation Matrix")
plt.tight_layout()
plt.show()

features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
X = df[features].values
y_raw = df["label"].values

le = LabelEncoder()
y = le.fit_transform(y_raw)
joblib.dump(le, os.path.join(MODEL_DIR, "label_encoder.pkl"))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc = scaler.transform(X_test)
joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))

print(f"Train: {X_train_sc.shape}, Test: {X_test_sc.shape}")

def build_models():
    return OrderedDict([
        ("Naive Bayes", GaussianNB()),
        ("Decision Tree", DecisionTreeClassifier(random_state=42)),
        ("KNN", KNeighborsClassifier(n_neighbors=5)),
    ])

models = build_models()
results = {}
best_acc, best_model_name = 0, ""

for name, model in models.items():
    model.fit(X_train_sc, y_train)
    y_pred = model.predict(X_test_sc)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    cv = cross_val_score(model, X_train_sc, y_train, cv=5, scoring="accuracy")
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
        "cv_mean": round(cv.mean(), 4),
        "cv_std": round(cv.std(), 4),
        "confusion_matrix": cm,
        "per_class": per_class,
    }

    joblib.dump(model, os.path.join(MODEL_DIR, f"model_{name.replace(' ', '_').lower()}.pkl"))

    print(f"  {name:20s}  Acc={acc:.4f}  F1={f1:.4f}  CV={cv.mean():.4f}+/-{cv.std():.4f}")
    if acc > best_acc:
        best_acc, best_model_name = acc, name

print(f"\nBest: {best_model_name} ({best_acc:.4f})")

plt.figure(figsize=(10, 5))
model_names = list(results.keys())
accs = [results[n]["accuracy"] * 100 for n in model_names]
colors = sns.color_palette("viridis", len(model_names))
bars = plt.bar(model_names, accs, color=colors, edgecolor='white', linewidth=0.5)
plt.ylabel("Accuracy (%)")
plt.title("Model Accuracy Comparison")
plt.ylim(min(accs) - 2, 100.5)
for bar, acc in zip(bars, accs):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2,
             f'{acc:.2f}%', ha='center', va='bottom', fontweight='bold', fontsize=10)
plt.xticks(rotation=20)
plt.tight_layout()
plt.show()

fig, ax = plt.subplots(figsize=(14, 12))
cm_best = confusion_matrix(y_test, models[best_model_name].predict(X_test_sc))
sns.heatmap(cm_best, annot=True, fmt='d', cmap='YlGnBu',
            xticklabels=le.classes_, yticklabels=le.classes_, ax=ax)
ax.set_title(f'Confusion Matrix - {best_model_name}')
ax.set_xlabel('Predicted')
ax.set_ylabel('Actual')
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()

ablation_results = {}
for name, _ in build_models().items():
    model_template = build_models()[name]
    ablation_results[name] = {"full_accuracy": results[name]["accuracy"]}
    drops = {}
    for feat in features:
        remaining = [f for f in features if f != feat]
        idx = [features.index(f) for f in remaining]
        X_tr_abl = X_train_sc[:, idx]
        X_te_abl = X_test_sc[:, idx]

        m = type(model_template)(**model_template.get_params())
        m.fit(X_tr_abl, y_train)
        acc_abl = accuracy_score(y_test, m.predict(X_te_abl))
        drops[feat] = {
            "accuracy_without": round(acc_abl, 4),
            "accuracy_drop": round(results[name]["accuracy"] - acc_abl, 4),
        }
    ablation_results[name]["feature_drops"] = drops

fig, ax = plt.subplots(figsize=(12, 6))
model_list = list(ablation_results.keys())
drop_matrix = np.array([
    [ablation_results[m]["feature_drops"][f]["accuracy_drop"] * 100 for f in features]
    for m in model_list
])
sns.heatmap(drop_matrix, annot=True, fmt='.2f', cmap='YlOrRd',
            xticklabels=features, yticklabels=model_list, ax=ax,
            cbar_kws={'label': 'Accuracy Drop (%)'})
ax.set_title('Ablation Study - Accuracy Drop When Feature Removed (%)')
plt.tight_layout()
plt.show()

fig, axes = plt.subplots(1, 3, figsize=(16, 5))
for idx, (name, data) in enumerate(ablation_results.items()):
    ax = axes[idx]
    sorted_feats = sorted(data["feature_drops"].items(), key=lambda x: x[1]["accuracy_drop"], reverse=True)
    feat_names = [f[0] for f in sorted_feats]
    drop_vals = [f[1]["accuracy_drop"] * 100 for f in sorted_feats]
    colors_bar = ['#ef4444' if d > 2 else '#f59e0b' if d > 0.5 else '#10b981' for d in drop_vals]
    ax.barh(feat_names, drop_vals, color=colors_bar)
    ax.set_title(name, fontsize=11, fontweight='bold')
    ax.set_xlabel("Accuracy Drop (%)")
    ax.invert_yaxis()
fig.suptitle("Ablation: Feature Removal Impact per Model", fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

importance_data = {}
fig, ax = plt.subplots(figsize=(10, 5))
imp = models["Decision Tree"].feature_importances_
importance_data["Decision Tree"] = {f: round(float(v), 4) for f, v in zip(features, imp)}
sorted_idx = np.argsort(imp)
ax.barh([features[i] for i in sorted_idx], imp[sorted_idx], color=sns.color_palette("viridis", 7))
ax.set_title("Decision Tree Feature Importance", fontweight='bold')
ax.set_xlabel("Importance")
plt.tight_layout()
plt.show()

perm_importance_data = {}
for name, model in models.items():
    perm = permutation_importance(model, X_test_sc, y_test, n_repeats=10, random_state=42, n_jobs=-1)
    perm_importance_data[name] = {
        f: round(float(v), 4) for f, v in zip(features, perm.importances_mean)
    }

fig, ax = plt.subplots(figsize=(12, 6))
perm_matrix = np.array([
    [perm_importance_data[m][f] for f in features]
    for m in models.keys()
])
sns.heatmap(perm_matrix, annot=True, fmt='.4f', cmap='YlGnBu',
            xticklabels=features, yticklabels=list(models.keys()), ax=ax)
ax.set_title('Permutation Importance (All Models)')
plt.tight_layout()
plt.show()

pca_full = PCA()
pca_full.fit(X_train_sc)
explained_var = pca_full.explained_variance_ratio_
cumulative_var = np.cumsum(explained_var)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.bar(range(1, 8), explained_var * 100, color='#3b82f6', alpha=0.8, label='Individual')
ax1.plot(range(1, 8), cumulative_var * 100, 'o-', color='#10b981', linewidth=2, label='Cumulative')
ax1.set_xlabel("Principal Component")
ax1.set_ylabel("Variance Explained (%)")
ax1.set_title("PCA Explained Variance")
ax1.legend()
ax1.axhline(y=95, color='red', linestyle='--', alpha=0.5, label='95% threshold')

pca_accuracy = {}
for n_comp in range(1, 8):
    pca_n = PCA(n_components=n_comp)
    X_tr_pca = pca_n.fit_transform(X_train_sc)
    X_te_pca = pca_n.transform(X_test_sc)
    dt = DecisionTreeClassifier(random_state=42)
    dt.fit(X_tr_pca, y_train)
    pca_accuracy[n_comp] = round(accuracy_score(y_test, dt.predict(X_te_pca)), 4)

ax2.plot(list(pca_accuracy.keys()), [v * 100 for v in pca_accuracy.values()],
         'o-', color='#8b5cf6', linewidth=2, markersize=8)
ax2.set_xlabel("Number of PCA Components")
ax2.set_ylabel("Accuracy (%)")
ax2.set_title("DT Accuracy vs. PCA Components")
ax2.set_xticks(range(1, 8))
plt.tight_layout()
plt.show()

pca_2d = PCA(n_components=2)
X_pca_2d = pca_2d.fit_transform(X_train_sc)

plt.figure(figsize=(12, 10))
for i, crop in enumerate(le.classes_):
    mask = y_train == i
    plt.scatter(X_pca_2d[mask, 0], X_pca_2d[mask, 1], label=crop, alpha=0.6, s=20)
plt.xlabel(f"PC1 ({pca_2d.explained_variance_ratio_[0]*100:.1f}%)")
plt.ylabel(f"PC2 ({pca_2d.explained_variance_ratio_[1]*100:.1f}%)")
plt.title("PCA 2D Visualization of Training Data")
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9)
plt.tight_layout()
plt.show()

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
    "feature_stats": {
        feat: {
            "mean": round(float(df[feat].mean()), 2),
            "std": round(float(df[feat].std()), 2),
            "min": round(float(df[feat].min()), 2),
            "max": round(float(df[feat].max()), 2),
        }
        for feat in features
    },
}

analysis = {
    "model_results": results,
    "feature_importance": importance_data,
    "permutation_importance": perm_importance_data,
    "ablation_study": ablation_results,
    "pca": {
        "explained_variance": [round(float(v), 4) for v in explained_var],
        "cumulative_variance": [round(float(v), 4) for v in cumulative_var],
        "accuracy_by_components": pca_accuracy,
        "scatter_2d": pca_scatter,
    },
    "dataset_stats": dataset_stats,
    "best_model": best_model_name,
}

with open(os.path.join(MODEL_DIR, "analysis.json"), "w") as f:
    json.dump(analysis, f, indent=2)

print("All models saved to:", MODEL_DIR)
print(f"Best model: {best_model_name} ({best_acc:.4f})")
print("\nFiles saved:")
for f in os.listdir(MODEL_DIR):
    size = os.path.getsize(os.path.join(MODEL_DIR, f))
    print(f"  {f:40s} {size:>10,} bytes")
