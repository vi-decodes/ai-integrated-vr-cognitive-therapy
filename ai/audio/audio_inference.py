"""
audio_inference.py — CNN + LSTM Audio Stress Inference (PyTorch)

MODEL FILE : models/audio_model.pth      (state_dict, extracted from audio_model_full.pth)
SCALER FILE: models/audio_scaler.pkl     (optional sklearn StandardScaler)
FALLBACK   : uniform probabilities + zero embedding — only when model missing/broken.

INPUT TRANSFORM (pipeline → model):
    Pipeline sends: np.ndarray (32, 40)     [frames × MFCC coefficients]
    Model expects : torch.Tensor (1, 120, 32) [batch × channels × seq_len]

    Transform steps:
      1. Transpose (40, 32) → channel-first.
      2. Zero-pad channels 40 → 120  (replicates training's MFCC+delta+delta2 stack).
      3. Add batch dim → (1, 120, 32).

EMBEDDING:
    audio_model.get_embedding(x) → (1, 128)   [CNN last-timestep features]
    This is what the FusionModel was trained on.

OUTPUT CONTRACT:
    {
        "embedding"       : list[float],  len=128   (from get_embedding)
        "probabilities"   : list[float],  len=3     (softmax of logits)
        "stress_score"    : float,
        "predicted_class" : int,
        "model_used"      : "CNN+LSTM" | "fallback"
    }
"""

import os
import torch
import numpy as np

from .model import AudioModel

# ─── Pipeline buffer constants ────────────────────────────────────────────────
AUDIO_SEQ_LEN   = 32   # MFCC frames per window (pipeline dimension)
NUM_MFCC_COEFFS = 40   # MFCC coefficients per frame (pipeline dimension)

# ─── Model constants (must match training) ────────────────────────────────────
AUDIO_IN_CHANNELS = 120   # CNN in_channels = MFCC + delta + delta-delta (3×40)
EMBEDDING_DIM     = 128   # CNN last-timestep features — what FusionModel expects
AUDIO_HIDDEN_DIM  = 64    # LSTM hidden size (used only for classification head)

# ─── Stress class → scalar score ─────────────────────────────────────────────
CLASS_TO_SCORE = {0: 0.2, 1: 0.5, 2: 0.8}
DEFAULT_SCORE  = 0.5

# =============================================================================
# MODEL + SCALER LOADING
# =============================================================================

AUDIO_MODEL_PATH  = os.path.join("models", "audio_model.pth")
AUDIO_SCALER_PATH = os.path.join("models", "audio_scaler.pkl")

AUDIO_MODEL_READY = False
audio_model: AudioModel | None = None
audio_scaler = None

_abs_model_path = os.path.abspath(AUDIO_MODEL_PATH)
print(f"[AUDIO INFERENCE] Looking for model at: {_abs_model_path}")

# ── Load model ────────────────────────────────────────────────────────────────
try:
    audio_model = AudioModel(in_channels=AUDIO_IN_CHANNELS, hidden_dim=AUDIO_HIDDEN_DIM,
                             num_classes=3)

    if os.path.exists(AUDIO_MODEL_PATH):
        state = torch.load(AUDIO_MODEL_PATH, map_location=torch.device("cpu"),
                           weights_only=True)
        missing, unexpected = audio_model.load_state_dict(state, strict=False)
        if missing:
            print(f"[AUDIO INFERENCE] WARNING: Missing keys: {missing}")
        if unexpected:
            print(f"[AUDIO INFERENCE] WARNING: Unexpected keys: {unexpected}")
        audio_model.eval()
        AUDIO_MODEL_READY = True
        print(f"[AUDIO INFERENCE] PyTorch CNN+LSTM model loaded from {_abs_model_path}")
    else:
        print(
            f"[AUDIO INFERENCE] Model NOT found at {_abs_model_path}\n"
            f"  Run: py save_audio_model.py  to extract from audio_model_full.pth\n"
            f"  -> Running in FALLBACK mode."
        )
except Exception as exc:
    print(f"[AUDIO INFERENCE] Model load FAILED: {exc!r}\n  -> FALLBACK mode.")
    AUDIO_MODEL_READY = False

# ── Load scaler (optional) ────────────────────────────────────────────────────
try:
    if os.path.exists(AUDIO_SCALER_PATH):
        import pickle
        with open(AUDIO_SCALER_PATH, "rb") as f:
            audio_scaler = pickle.load(f)
        print(f"[AUDIO INFERENCE] Scaler loaded from {AUDIO_SCALER_PATH}")
    else:
        print(f"[AUDIO INFERENCE] No scaler found at {AUDIO_SCALER_PATH} — skipping.")
except Exception as exc:
    print(f"[AUDIO INFERENCE] Scaler load failed: {exc!r} — skipping.")
    audio_scaler = None


# =============================================================================
# PUBLIC API
# =============================================================================

def predict_audio(mfcc_sequence: np.ndarray) -> dict:
    """
    Run CNN+LSTM inference on one MFCC window.

    Args:
        mfcc_sequence: np.ndarray, shape (32, 40)  — frames × coefficients

    Returns dict with keys:
        stress_score, predicted_class, probabilities, embedding (128-dim), model_used
    """
    # ── Input guard ───────────────────────────────────────────────────────────
    if mfcc_sequence is None:
        print("[AUDIO INFERENCE] None input -> fallback")
        return _fallback_result()

    arr = np.asarray(mfcc_sequence, dtype=np.float32)

    if arr.shape != (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS):
        print(
            f"[AUDIO INFERENCE] Bad input shape {arr.shape} "
            f"(expected ({AUDIO_SEQ_LEN}, {NUM_MFCC_COEFFS})) -> fallback"
        )
        return _fallback_result()

    # ── Model branch ──────────────────────────────────────────────────────────
    if AUDIO_MODEL_READY:
        print(f"[AUDIO INFERENCE] -> Entering _run_model() | raw input shape={arr.shape}")
        try:
            res   = _run_model(arr)
            probs = res["probabilities"]   # np.ndarray (3,)
            pred  = int(np.argmax(probs))
            emb   = res["embedding"]       # np.ndarray (128,)

            norm = float(np.linalg.norm(emb))
            print(
                f"[AUDIO INFERENCE] _run_model() OK | pred={pred} "
                f"probs={probs.round(3).tolist()} emb_norm={norm:.4f}"
            )
            if norm < 1e-6:
                print("[AUDIO INFERENCE] WARNING: Embedding norm ~0 — check model weights.")

            return {
                "stress_score":    CLASS_TO_SCORE.get(pred, DEFAULT_SCORE),
                "predicted_class": pred,
                "probabilities":   probs.tolist(),
                "embedding":       emb.tolist(),
                "model_used":      "CNN+LSTM",
            }
        except Exception as exc:
            print(f"[AUDIO INFERENCE] _run_model() raised: {exc!r} -> fallback")
            return _fallback_result()
    else:
        print("[AUDIO INFERENCE] Model not ready -> fallback (uniform output).")
        return _fallback_result()


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

def _run_model(mfcc_sequence: np.ndarray) -> dict:
    """
    Transform pipeline array → model tensor, run forward pass, return results.

    Transform:
        (32, 40) → transpose → (40, 32) → zero-pad channels → (120, 32)
                 → add batch dim → (1, 120, 32)
    """
    # Optional: apply scaler to the flat MFCC frame values
    flat = mfcc_sequence.reshape(-1)  # (1280,)
    if audio_scaler is not None:
        flat = audio_scaler.transform(flat.reshape(1, -1)).reshape(-1).astype(np.float32)
        mfcc_sequence = flat.reshape(AUDIO_SEQ_LEN, NUM_MFCC_COEFFS)

    # Step 1: Transpose to channel-first  (32, 40) → (40, 32)
    ch_first = mfcc_sequence.T                         # (40, 32)

    # Step 2: Zero-pad channels 40 → 120  (replicates MFCC+delta+delta2 stacking)
    padded = np.zeros((AUDIO_IN_CHANNELS, AUDIO_SEQ_LEN), dtype=np.float32)
    padded[:NUM_MFCC_COEFFS, :] = ch_first             # fill first 40 channels

    # Step 3: Tensor + batch dim  → (1, 120, 32)
    x = torch.tensor(padded, dtype=torch.float32).unsqueeze(0)

    if x.shape != (1, AUDIO_IN_CHANNELS, AUDIO_SEQ_LEN):
        raise ValueError(f"[AUDIO INFERENCE] Unexpected tensor shape: {x.shape}")

    print(f"[AUDIO INFERENCE] Forward pass start | tensor shape={x.shape}")

    with torch.no_grad():
        # get_embedding: (1, 128) — CNN last-timestep (what fusion was trained on)
        emb    = audio_model.get_embedding(x)          # (1, 128)
        # logits: (1, 3) — from LSTM hidden → fc head
        logits, _ = audio_model(x)                     # (1, 3), (1, 128)

    probs  = torch.softmax(logits[0], dim=-1).detach().cpu().numpy()   # (3,)
    emb_np = emb[0].detach().cpu().numpy()                             # (128,)

    print(f"[AUDIO INFERENCE] Forward pass done | logits={logits[0].round(decimals=2).tolist()}")

    # Numerical safety checks
    if np.any(np.isnan(probs)) or np.any(np.isinf(probs)):
        raise ValueError("[AUDIO INFERENCE] NaN/Inf in probabilities")
    if np.any(np.isnan(emb_np)) or np.any(np.isinf(emb_np)):
        raise ValueError("[AUDIO INFERENCE] NaN/Inf in embedding")

    if emb_np.shape != (EMBEDDING_DIM,):
        print(f"[AUDIO INFERENCE] WARNING: Unexpected emb shape: {emb_np.shape}")

    return {"embedding": emb_np, "probabilities": probs}


def _fallback_result() -> dict:
    """Neutral uniform output — returned ONLY when model is absent or broken."""
    return {
        "stress_score":    DEFAULT_SCORE,
        "predicted_class": 1,
        "probabilities":   [1/3, 1/3, 1/3],
        "embedding":       [0.0] * EMBEDDING_DIM,
        "model_used":      "fallback",
    }