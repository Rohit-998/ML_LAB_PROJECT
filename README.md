# CropAI — Crop Recommendation System

A machine learning system that recommends the best crop to grow based on soil nutrients (N, P, K, pH) and climate conditions (temperature, humidity, rainfall).

## Dataset

- **Source:** Crop_recommendation.csv
- **Samples:** 2,200 (100 per crop, perfectly balanced)
- **Features:** Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall
- **Classes:** 22 crops

## Models

| Model | Accuracy | F1 Score | CV Mean |
|-------|----------|----------|---------|
| Naive Bayes | 99.55% | 99.54% | 99.43% |
| Decision Tree | 97.95% | 97.94% | 98.47% |
| KNN | 97.95% | 97.93% | 96.53% |

## Project Structure

```
ML_LAB_PROJECT/
├── Crop_recommendation.csv
├── CropAI_Colab_Notebook.py
├── backend/
│   ├── requirements.txt
│   ├── train.py
│   ├── app.py
│   └── models/
│       ├── analysis.json
│       ├── scaler.pkl
│       ├── label_encoder.pkl
│       ├── model_naive_bayes.pkl
│       ├── model_decision_tree.pkl
│       └── model_knn.pkl
└── frontend/
    ├── package.json
    ├── next.config.ts
    └── src/
        ├── app/
        ├── components/
        ├── lib/
        └── types.ts
```

## Setup

### Backend
```bash
pip install -r backend/requirements.txt
python backend/train.py
python backend/app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Environment variables

| Where | File (local) | Key | Value |
|-------|--------------|-----|-------|
| Backend | `backend/.env` | `ALLOWED_ORIGINS` | Frontend origins allowed to call the API, comma-separated |
| Backend | `backend/.env` | `FLASK_DEBUG` | `1` locally, unset in production |
| Frontend | `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Origin of the Flask API, no trailing slash |

Copy each `.env.example` to get started. The real `.env` files are git-ignored.

## Deployment

### Backend on Render (Web Service)
- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app` (Render sets `PORT` automatically and gunicorn binds to it; don't add it yourself)
- **Environment:** `ALLOWED_ORIGINS=https://<your-app>.vercel.app`
- Python version comes from `backend/.python-version`. The trained models in `backend/models/` are committed, so no training step is needed on deploy.

### Frontend on Vercel
- **Root directory:** `frontend` (framework preset: Next.js)
- **Environment:** `NEXT_PUBLIC_API_URL=https://<your-service>.onrender.com`
- This value is baked in at build time, so redeploy after changing it.

Deploy the backend first, put its URL into Vercel, then put the Vercel URL back into Render's `ALLOWED_ORIGINS`.

## API Endpoints

- `GET /api/health` — health check
- `GET /api/analysis` — full analysis JSON
- `GET /api/models` — model list with metrics
- `POST /api/predict` — predict crop (body: `{N, P, K, temperature, humidity, ph, rainfall, model}`)

## Key Analysis

**Ablation Study:** Removing rainfall causes the biggest accuracy drop across all models. Temperature is the most redundant feature.

**PCA:** Two principal components capture only ~46% of variance, meaning all 7 features carry meaningful information. Full 7 features needed for 99%+ accuracy.

## Team

- Rohit Agrawal (A4-B3-46)
- Ninad Vande (A4-B3-40)
- Bhuvisha Nagrecha (A4-B4-61)

**Mentors:** Dr. Chithraja Rajan, Prof. Ashwini Agashe
