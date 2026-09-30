import type { Analysis, FieldInput, ModelName, Prediction } from "@/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("Can't reach the model server. Start it with: python backend/app.py");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body.error === "string" ? body.error : `Server replied ${response.status}. Is python backend/app.py running?`;
    throw new Error(message);
  }
  return body as T;
}

export const getAnalysis = () => request<Analysis>("/api/analysis");

export const predict = (input: FieldInput, model: ModelName) =>
  request<Prediction>("/api/predict", { method: "POST", body: JSON.stringify({ ...input, model }) });
