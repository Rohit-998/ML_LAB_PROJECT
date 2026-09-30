import type { FeatureKey, FieldInput, ModelName } from "@/types";

export const MODELS: ModelName[] = ["Naive Bayes", "Decision Tree", "KNN"];

export const MODEL_COLOR: Record<ModelName, string> = {
  "Naive Bayes": "var(--model-nb)",
  "Decision Tree": "var(--model-dt)",
  KNN: "var(--model-knn)",
};

export const MODEL_BLURB: Record<ModelName, string> = {
  "Naive Bayes": "Treats each reading as independent evidence and weighs the odds per crop.",
  "Decision Tree": "Asks a chain of yes/no questions about the field, like a seasoned agronomist.",
  KNN: "Finds the most similar fields in the dataset and goes with the neighbours.",
};

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: "soil" | "climate";
}

export const FEATURES: FeatureMeta[] = [
  { key: "N", label: "Nitrogen", short: "N", unit: "kg/ha", min: 0, max: 140, step: 1, group: "soil" },
  { key: "P", label: "Phosphorus", short: "P", unit: "kg/ha", min: 5, max: 145, step: 1, group: "soil" },
  { key: "K", label: "Potassium", short: "K", unit: "kg/ha", min: 5, max: 205, step: 1, group: "soil" },
  { key: "ph", label: "Soil pH", short: "pH", unit: "", min: 3.5, max: 9.9, step: .1, group: "soil" },
  { key: "temperature", label: "Temperature", short: "Temp", unit: "°C", min: 8.8, max: 43.7, step: .1, group: "climate" },
  { key: "humidity", label: "Humidity", short: "Humidity", unit: "%", min: 14, max: 100, step: .1, group: "climate" },
  { key: "rainfall", label: "Rainfall", short: "Rain", unit: "mm", min: 20, max: 299, step: 1, group: "climate" },
];

export const FEATURE_LABEL = Object.fromEntries(FEATURES.map(f => [f.key, f.label])) as Record<FeatureKey, string>;

export const PRESETS: { name: string; values: FieldInput }[] = [
  { name: "Monsoon paddy", values: { N: 80, P: 47, K: 40, temperature: 23.7, humidity: 82.2, ph: 6.4, rainfall: 233 } },
  { name: "Hill estate", values: { N: 103, P: 29, K: 30, temperature: 25.7, humidity: 57.6, ph: 6.8, rainfall: 158 } },
  { name: "Dry rabi plot", values: { N: 39, P: 68, K: 79, temperature: 18.9, humidity: 16.7, ph: 7.4, rainfall: 80 } },
  { name: "Orchard slope", values: { N: 24, P: 137, K: 200, temperature: 22.6, humidity: 92.4, ph: 5.9, rainfall: 113 } },
];

export const DEFAULT_INPUT: FieldInput = PRESETS[0].values;

interface CropInfo { name: string; kind: string; season: string; note: string }

export const CROPS: Record<string, CropInfo> = {
  apple: { name: "Apple", kind: "Fruit", season: "Perennial", note: "Cool, humid slopes with potassium-rich soil." },
  banana: { name: "Banana", kind: "Fruit", season: "Perennial", note: "Warm and humid, hungry for nitrogen." },
  blackgram: { name: "Black gram", kind: "Pulse", season: "Kharif", note: "Warm, moderately dry fields with neutral soil." },
  chickpea: { name: "Chickpea", kind: "Pulse", season: "Rabi", note: "Cool, dry air and slightly alkaline soil." },
  coconut: { name: "Coconut", kind: "Plantation", season: "Perennial", note: "Coastal humidity and generous rain." },
  coffee: { name: "Coffee", kind: "Plantation", season: "Perennial", note: "Mild hills, steady rain, rich in nitrogen." },
  cotton: { name: "Cotton", kind: "Fibre", season: "Kharif", note: "Warm and humid with nitrogen-heavy soil." },
  grapes: { name: "Grapes", kind: "Fruit", season: "Perennial", note: "Very high phosphorus and potassium, modest rain." },
  jute: { name: "Jute", kind: "Fibre", season: "Kharif", note: "Humid lowlands with heavy monsoon rain." },
  kidneybeans: { name: "Kidney beans", kind: "Pulse", season: "Rabi", note: "Cool and dry with slightly acidic soil." },
  lentil: { name: "Lentil", kind: "Pulse", season: "Rabi", note: "Low rain and low nitrogen suit it well." },
  maize: { name: "Maize", kind: "Cereal", season: "Kharif", note: "Moderate warmth, rain and nitrogen." },
  mango: { name: "Mango", kind: "Fruit", season: "Perennial", note: "Hot, fairly dry air and acidic soil." },
  mothbeans: { name: "Moth beans", kind: "Pulse", season: "Kharif", note: "Tough and drought-tolerant for arid land." },
  mungbean: { name: "Mung bean", kind: "Pulse", season: "Kharif", note: "Warm, humid, and happy with little rain." },
  muskmelon: { name: "Muskmelon", kind: "Fruit", season: "Zaid", note: "Hot, humid and very low rainfall." },
  orange: { name: "Orange", kind: "Fruit", season: "Perennial", note: "Humid air with low nutrient demand." },
  papaya: { name: "Papaya", kind: "Fruit", season: "Perennial", note: "Heat, humidity and good rain." },
  pigeonpeas: { name: "Pigeon peas", kind: "Pulse", season: "Kharif", note: "Warm and fairly dry, rain-fed fields." },
  pomegranate: { name: "Pomegranate", kind: "Fruit", season: "Perennial", note: "Humid air and low phosphorus." },
  rice: { name: "Rice", kind: "Cereal", season: "Kharif", note: "Standing water, high humidity and heavy rain." },
  watermelon: { name: "Watermelon", kind: "Fruit", season: "Zaid", note: "Warm, humid and nitrogen-rich, low rain." },
};

export const cropName = (id: string) => CROPS[id]?.name ?? id;
