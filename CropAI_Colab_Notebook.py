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
