import os
import json
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_DIR = os.path.join(BASE_DIR, "models")


def load_artifacts():
    artifacts = {}

    analysis_path = os.path.join(ARTIFACT_DIR, "analysis.json")
    if os.path.exists(analysis_path):
        with open(analysis_path, "r") as f:
            artifacts["analysis"] = json.load(f)
    else:
        artifacts["analysis"] = None

    artifacts["scaler"] = joblib.load(os.path.join(ARTIFACT_DIR, "scaler.pkl"))
    artifacts["label_encoder"] = joblib.load(os.path.join(ARTIFACT_DIR, "label_encoder.pkl"))

    model_names = ["naive_bayes", "decision_tree", "knn"]
    artifacts["models"] = {}
    for mname in model_names:
        path = os.path.join(ARTIFACT_DIR, f"model_{mname}.pkl")
        if os.path.exists(path):
            artifacts["models"][mname] = joblib.load(path)

    return artifacts


ARTIFACTS = None


def get_artifacts():
    global ARTIFACTS
    if ARTIFACTS is None:
        ARTIFACTS = load_artifacts()
    return ARTIFACTS


@app.route("/")
def index():
    return jsonify({"service": "CropAI API", "ui": "run npm run dev in frontend/ and open http://localhost:3000"})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "models_loaded": len(get_artifacts()["models"])})


@app.route("/api/analysis")
def analysis():
    arts = get_artifacts()
    if arts["analysis"] is None:
        return jsonify({"error": "Run train.py first!"}), 400
    return jsonify(arts["analysis"])


@app.route("/api/models")
def list_models():
    arts = get_artifacts()
    if arts["analysis"] is None:
        return jsonify({"error": "Run train.py first!"}), 400

    model_list = []
    for name, res in arts["analysis"]["model_results"].items():
        model_list.append({
            "name": name,
            "accuracy": res["accuracy"],
            "f1_weighted": res["f1_weighted"],
            "cv_mean": res["cv_mean"],
            "cv_std": res["cv_std"],
        })
    return jsonify({"models": model_list, "best": arts["analysis"]["best_model"]})
