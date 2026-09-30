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


MODEL_KEY_MAP = {
    "Naive Bayes": "naive_bayes",
    "Decision Tree": "decision_tree",
    "KNN": "knn",
}


@app.route("/api/predict", methods=["POST"])
def predict():
    arts = get_artifacts()
    data = request.get_json()

    required = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        features = np.array([[
            float(data["N"]),
            float(data["P"]),
            float(data["K"]),
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["ph"]),
            float(data["rainfall"]),
        ]])
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400

    features_sc = arts["scaler"].transform(features)

    model_name = data.get("model", "Naive Bayes")
    model_key = MODEL_KEY_MAP.get(model_name)
    if not model_key or model_key not in arts["models"]:
        return jsonify({"error": f"Unknown model: {model_name}"}), 400

    model = arts["models"][model_key]
    pred = model.predict(features_sc)[0]
    crop = arts["label_encoder"].inverse_transform([pred])[0]

    probabilities = {}
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features_sc)[0]
        classes = arts["label_encoder"].classes_
        prob_dict = {c: round(float(p), 4) for c, p in zip(classes, probs)}
        sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)[:5]
        probabilities = dict(sorted_probs)

    all_predictions = {}
    for display_name, key in MODEL_KEY_MAP.items():
        if key in arts["models"]:
            m = arts["models"][key]
            p = m.predict(features_sc)[0]
            all_predictions[display_name] = arts["label_encoder"].inverse_transform([p])[0]

    return jsonify({
        "crop": crop,
        "model_used": model_name,
        "probabilities": probabilities,
        "all_model_predictions": all_predictions,
    })


if __name__ == "__main__":
    print("Loading artifacts...")
    get_artifacts()
    print(f"Loaded {len(ARTIFACTS['models'])} models.")
    app.run(debug=True, port=5000)
