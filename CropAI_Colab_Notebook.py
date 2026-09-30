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
