"""
inference.py — REST Path Inference Orchestrator (2-modality)

Serves the POST /predict endpoint. Calls the same fuse() function used by
the streaming orchestrator so weights, thresholds, and class mappings are
always consistent across both paths.

Modalities: physio (LSTM) + audio (CNN+LSTM)

Both unimodal models return embeddings in addition to scalar scores so fuse()
can perform deep embedding concatenation when the fusion model is loaded, OR
fall back to a weighted scalar average when it is not.
"""

import numpy as np

from ai.audio.audio_inference   import predict_audio,  AUDIO_SEQ_LEN,  NUM_MFCC_COEFFS
from ai.biofeedback.physio_inference import predict_physio, PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES
from ai.fusion.fusion_inference import fuse, DEFAULT_SCORE


def run_inference(physio_features: list, audio_mfcc: list | None) -> dict:
    """
    Execute the complete 2-modality stress inference pipeline for the REST path.

    Args:
        physio_features (list): Flat list of floats.
                                Accepts either:
                                  • PHYSIO_SEQ_LEN × NUM_PHYSIO_FEATURES values
                                    (full sequence, preferred)
                                  • NUM_PHYSIO_FEATURES values (single sample —
                                    will be tiled to form a full window)
        audio_mfcc (list | None): Flat list of floats.
                                  Accepts either:
                                  • AUDIO_SEQ_LEN × NUM_MFCC_COEFFS values
                                    (full sequence, preferred)
                                  • Legacy 164-element flat vector
                                  • None — uses neutral default

    Returns:
        dict:
            physio_score       (float) — unimodal physio stress score [0-1]
            audio_score        (float) — unimodal audio stress score  [0-1]
            fusion_score       (float) — deep-fused stress score      [0-1]
            stress_state       (str)   — "calm" | "mild" | "escalated"
            confidence         (float) — fusion confidence            [0-1]
            environment_action (str)   — recommended VR adaptation
    """
    # ── Physio ────────────────────────────────────────────────────────────────
    physio_seq = _to_physio_sequence(physio_features)
    physio_result = predict_physio(physio_seq)

    # ── Audio ─────────────────────────────────────────────────────────────────
    if audio_mfcc is not None:
        audio_seq = _to_audio_sequence(audio_mfcc)
        audio_result = predict_audio(audio_seq)
    else:
        # No audio provided — neutral default
        audio_result = {
            "stress_score":    DEFAULT_SCORE,
            "predicted_class": 1,
            "probabilities":   [0.0, 1.0, 0.0],
            "embedding":       [0.0] * 64,
        }

    # ── Fusion ────────────────────────────────────────────────────────────────
    fused_score, stress_state, confidence = fuse(
        audio_result  = audio_result,
        physio_result = physio_result,
    )

    # ── VR environment action ─────────────────────────────────────────────────
    action_map = {
        "calm":      "Maintain relaxing environment",
        "mild":      "Introduce mild challenges",
        "escalated": "Reduce intensity and provide support",
    }

    return {
        "physio_score":       physio_result["stress_score"],
        "audio_score":        audio_result["stress_score"],
        "fusion_score":       fused_score,
        "stress_state":       stress_state,
        "confidence":         confidence,
        "environment_action": action_map.get(stress_state, "Maintain relaxing environment"),
    }


# ─── Shape-coercion helpers ───────────────────────────────────────────────────

def _to_physio_sequence(features: list) -> np.ndarray:
    """
    Convert flat physio feature list to a (PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES) array.

    Handles:
      - Full sequence: len == PHYSIO_SEQ_LEN × NUM_PHYSIO_FEATURES  → reshape
      - Single sample: len == NUM_PHYSIO_FEATURES                    → tile
      - Anything else: returns a zero array (safe fallback)
    """
    arr = np.array(features, dtype=np.float32)
    full_len = PHYSIO_SEQ_LEN * NUM_PHYSIO_FEATURES

    if arr.shape == (PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES):
        return arr

    if arr.size == full_len:
        return arr.reshape(PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES)

    if arr.size == NUM_PHYSIO_FEATURES:
        # Single sample — tile to a full sequence (stateless approximation)
        return np.tile(arr, (PHYSIO_SEQ_LEN, 1))

    # Fallback
    print(
        f"[INFERENCE]   physio_features size={arr.size} unexpected "
        f"(expected {full_len} or {NUM_PHYSIO_FEATURES}) — using zeros."
    )
    return np.zeros((PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES), dtype=np.float32)


def _to_audio_sequence(mfcc: list) -> np.ndarray:
    """
    Convert flat MFCC feature list to a (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS) array.

    Handles:
      - Full sequence: len == AUDIO_SEQ_LEN × NUM_MFCC_COEFFS → reshape
      - Legacy 164-element vector                              → reshape best-fit
      - Anything else: returns a zero array (safe fallback)
    """
    arr = np.array(mfcc, dtype=np.float32)
    full_len = AUDIO_SEQ_LEN * NUM_MFCC_COEFFS   # 32 × 40 = 1280

    if arr.shape == (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS):
        return arr

    if arr.size == full_len:
        return arr.reshape(AUDIO_SEQ_LEN, NUM_MFCC_COEFFS)

    # Legacy 164-element vector → reshape into ⌊164/40⌋=4 frames, zero-pad rest
    if arr.size > 0:
        n_frames = arr.size // NUM_MFCC_COEFFS
        if n_frames > 0:
            clipped = arr[:n_frames * NUM_MFCC_COEFFS].reshape(n_frames, NUM_MFCC_COEFFS)
            pad = np.zeros((AUDIO_SEQ_LEN - n_frames, NUM_MFCC_COEFFS), dtype=np.float32)
            return np.vstack([clipped, pad]) if n_frames < AUDIO_SEQ_LEN else clipped[:AUDIO_SEQ_LEN]

    # Fallback
    print(
        f"[INFERENCE]   audio_mfcc size={arr.size} unexpected "
        f"(expected {full_len}) — using zeros."
    )
    return np.zeros((AUDIO_SEQ_LEN, NUM_MFCC_COEFFS), dtype=np.float32)