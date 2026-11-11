export interface PredictResponse {
  fused_score: number;
  stress_state: string;
  environment_action: string;
}

export async function predictStress(payload: {
  physio_features: number[]; // 19 features
  audio_mfcc?: number[]; // 164 features
  face_score?: number;
}): Promise<PredictResponse> {

  console.log('Sending payload:', payload);

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

/**
 * Push real MFCC features from the browser microphone to the backend.
 *
 * The backend audio_pipeline.py reads from this buffer on its next poll
 * cycle, replacing simulated MFCC features with real microphone data.
 *
 * @param features - 164 MFCC feature values from useAudioMFCC.ts
 */
export async function pushAudioFeatures(features: number[]): Promise<void> {
  try {
    const res = await fetch("http://127.0.0.1:8000/audio_features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });
    if (res.ok) {
      console.log("[Audio] ✅ REAL AUDIO FEATURES pushed to backend:", features.length, "values");
    } else {
      console.warn("[Audio] ⚠️ Failed to push audio features:", res.status);
    }
  } catch (err) {
    // Non-fatal — backend may be starting up
    console.warn("[Audio] Could not reach /audio_features:", err);
  }
}

/**
 * Push a complete (32, 40) MFCC sequence to POST /audio_sequence.
 *
 * Called by useRealtimeAudio every STRIDE frames when the sliding
 * window is full.  The backend runs CNN+LSTM inference immediately.
 *
 * @param sequence - 2-D array, shape [32][40]
 * @returns parsed JSON response from backend
 * @throws Error on non-2xx HTTP status or network failure
 */
export interface AudioSequenceResult {
  status: string;
  frames?: number;
  coeffs?: number;
  stress_score?: number;
  predicted_class?: number;
  probabilities?: number[];
  confidence?: number;
}

export const pushAudioSequence = async (sequence: number[][]) => {
  console.log("📡 Sending to backend:", sequence.length);

  const res = await fetch("http://127.0.0.1:8000/audio_sequence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sequence }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  return res.json();
};
