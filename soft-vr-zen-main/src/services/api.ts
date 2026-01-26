export interface PredictResponse {
  fused_score: number;
  stress_state: string;
  environment_action: string;
}

export async function predictStress(payload: {
  physio_features: number[];
  audio_mfcc?: number[];
  face_score?: number;
}): Promise<PredictResponse> {

  const res = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Backend error");
  }

  return res.json();
}
