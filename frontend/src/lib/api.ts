import type { Analysis, FieldInput, ModelName, Prediction } from "@/types";

// Origin of the Flask API, e.g. https://cropai-api.onrender.com (set in .env.local / Vercel env vars).
// NEXT_PUBLIC_ values are inlined at build time, so redeploy after changing it.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000").replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("Can't reach the model server. If it was asleep, give it a minute and try again.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body.error === "string" ? body.error : `Model server replied ${response.status}. Please try again shortly.`;
    throw new Error(message);
  }
  return body as T;
}

export const getAnalysis = () => request<Analysis>("/api/analysis");

export const predict = (input: FieldInput, model: ModelName) =>
  request<Prediction>("/api/predict", { method: "POST", body: JSON.stringify({ ...input, model }) });
