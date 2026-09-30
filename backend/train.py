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


if __name__ == "__main__":
    df = load_data()
    print("Data loaded successfully.")
