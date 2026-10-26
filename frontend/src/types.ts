export type FeatureKey = "N" | "P" | "K" | "temperature" | "humidity" | "ph" | "rainfall";
export type ModelName = "Naive Bayes" | "Decision Tree" | "KNN" | "Random Forest";
export type FieldInput = Record<FeatureKey, number>;

export interface ModelResult {
  accuracy: number;
  f1_weighted: number;
  cv_mean: number;
  cv_std: number;
  confusion_matrix: number[][];
  per_class: Record<string, { precision: number; recall: number; f1: number; support: number }>;
}

export interface Analysis {
  model_results: Record<ModelName, ModelResult>;
  feature_importance: Partial<Record<ModelName, Record<FeatureKey, number>>>;
  permutation_importance: Record<ModelName, Record<FeatureKey, number>>;
  ablation_study: Record<ModelName, {
    full_accuracy: number;
    feature_drops: Record<FeatureKey, { accuracy_without: number; accuracy_drop: number }>;
  }>;
  pca: {
    explained_variance: number[];
    cumulative_variance: number[];
    accuracy_by_components: Record<string, number>;
    scatter_2d: { x: number[]; y: number[]; labels: string[] };
  };
  dataset_stats: {
    feature_names: FeatureKey[];
    crop_names: string[];
    n_samples: number;
    n_features: number;
    n_crops: number;
    feature_stats: Record<FeatureKey, { mean: number; std: number; min: number; max: number }>;
  };
  best_model: ModelName;
}

export interface Prediction {
  crop: string;
  model_used: ModelName;
  probabilities: Record<string, number>;
  all_model_predictions: Record<ModelName, string>;
}
