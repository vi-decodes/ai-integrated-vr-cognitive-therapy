"""
physio_inference.py — MLP Physiological Stress Inference (PyTorch)

MODEL FILE : models/physio_model.pth     (state_dict format)
SCALER FILE: models/physio_scaler.pkl    (optional sklearn StandardScaler)
FALLBACK   : uniform probabilities + zero embedding — only when model missing/broken.

MODEL:
    Pure MLP (NOT LSTM). Trained on a flat 10-feature physiological vector.
    Input shape: (batch, 10)

INPUT ADAPTER:
    Pipeline provides: (PHYSIO_SEQ_LEN=10, NUM_PHYSIO_FEATURES=19) window.
    Adapter takes:     last_frame = window[-1][:10]  → shape (10,)

EMBEDDING:
    physio_model.get_embedding(x) → (1, 64)   [output of Linear(128→64) at net[5]]

OUTPUT CONTRACT:
    {
        "embedding"       : list[float],  len=64    (from get_embedding)
        "probabilities"   : list[float],  len=3     (softmax of logits)
        "stress_score"    : float,
        "predicted_class" : int,
        "model_used"      : "MLP" | "fallback"
    }
"""

import os
import torch
import numpy as np

from .model import PhysioModel

# ─── Pipeline buffer constants (unchanged — pipeline still sends (10, 19)) ────
PHYSIO_SEQ_LEN      = 10   # samples in the rolling buffer window
NUM_PHYSIO_FEATURES = 19   # features per raw sample (WESAD-compatible)

# ─── MLP model constants (must match training) ────────────────────────────────
NUM_MLP_FEATURES = 10   # features the MLP expects (first 10 of the 19 raw features)
EMBEDDING_DIM    = 64   # output of Linear(128→64) at net[5]

# ─── Stress class → scalar score ─────────────────────────────────────────────
CLASS_TO_SCORE = {0: 0.2, 1: 0.5, 2: 0.8}
DEFAULT_SCORE  = 0.5

# =============================================================================
# MODEL + SCALER LOADING
# =============================================================================

PHYSIO_MODEL_PATH  = os.path.join("models", "physio_model.pth")
PHYSIO_SCALER_PATH = os.path.join("models", "physio_scaler.pkl")

PHYSIO_MODEL_READY = False
physio_model: PhysioModel | None = None
physio_scaler = None

_abs_model_path = os.path.abspath(PHYSIO_MODEL_PATH)
print(f"[PHYSIO INFERENCE] Looking for model at: {_abs_model_path}")

# ── Load model ────────────────────────────────────────────────────────────────
try:
    physio_model = PhysioModel(input_dim=NUM_MLP_FEATURES, num_classes=3)

    if os.path.exists(PHYSIO_MODEL_PATH):
        state = torch.load(PHYSIO_MODEL_PATH, map_location=torch.device("cpu"),
                           weights_only=True)
        missing, unexpected = physio_model.load_state_dict(state, strict=False)
        if missing:
            print(f"[PHYSIO INFERENCE] WARNING: Missing keys: {missing}")
        if unexpected:
            print(f"[PHYSIO INFERENCE] WARNING: Unexpected keys: {unexpected}")
        physio_model.eval()
        PHYSIO_MODEL_READY = True
        print(f"[PHYSIO INFERENCE] PyTorch MLP model loaded from {_abs_model_path}")
    else:
        print(
            f"[PHYSIO INFERENCE] Model NOT found at {_abs_model_path}\n"
            f"  -> Running in FALLBACK mode."
        )
except Exception as exc:
    print(f"[PHYSIO INFERENCE] Model load FAILED: {exc!r}\n  -> FALLBACK mode.")
    PHYSIO_MODEL_READY = False

# ── Load scaler (optional) ────────────────────────────────────────────────────
try:
    if os.path.exists(PHYSIO_SCALER_PATH):
        import pickle
        with open(PHYSIO_SCALER_PATH, "rb") as f:
            physio_scaler = pickle.load(f)
        print(f"[PHYSIO INFERENCE] Scaler loaded from {PHYSIO_SCALER_PATH}")
    else:
        print(f"[PHYSIO INFERENCE] No scaler at {PHYSIO_SCALER_PATH} — skipping.")
except Exception as exc:
    print(f"[PHYSIO INFERENCE] Scaler load failed: {exc!r} — skipping.")
    physio_scaler = None


# =============================================================================
# PUBLIC API
# =============================================================================

def predict_physio(physio_window: np.ndarray) -> dict:
    """
    Run MLP inference on the latest physiological sample.

    Args:
        physio_window: np.ndarray, shape (10, 19)  — rolling buffer window.
                       The LAST row's first 10 features are passed to the MLP.

    Returns dict with keys:
        stress_score, predicted_class, probabilities, embedding (64-dim), model_used
    """
    # ── Input guard ───────────────────────────────────────────────────────────
    if physio_window is None:
        print("[PHYSIO INFERENCE] None input -> fallback")
        return _fallback_result()

    arr = np.asarray(physio_window, dtype=np.float32)

    if arr.ndim == 2:
        last_frame = arr[-1]           # (19,) — most recent sample
    elif arr.ndim == 1:
        last_frame = arr               # already flat
    else:
        print(f"[PHYSIO INFERENCE] Unexpected ndim={arr.ndim} -> fallback")
        return _fallback_result()

    if last_frame.shape[0] < NUM_MLP_FEATURES:
        print(
            f"[PHYSIO INFERENCE] Frame has {last_frame.shape[0]} features, "
            f"need {NUM_MLP_FEATURES} -> fallback"
        )
        return _fallback_result()

    mlp_input = last_frame[:NUM_MLP_FEATURES]   # (10,)

    # ── Model branch ──────────────────────────────────────────────────────────
    if PHYSIO_MODEL_READY:
        print(f"[PHYSIO INFERENCE] -> Entering _run_model() | input shape=(1, {NUM_MLP_FEATURES})")
        try:
            res   = _run_model(mlp_input)
            probs = res["probabilities"]   # np.ndarray (3,)
            pred  = int(np.argmax(probs))
            emb   = res["embedding"]       # np.ndarray (64,)

            norm = float(np.linalg.norm(emb))
            print(
                f"[PHYSIO INFERENCE] _run_model() OK | pred={pred} "
                f"probs={probs.round(3).tolist()} emb_norm={norm:.4f}"
            )
            if norm < 1e-6:
                print("[PHYSIO INFERENCE] WARNING: Embedding norm ~0 — check model weights.")

            return {
                "stress_score":    CLASS_TO_SCORE.get(pred, DEFAULT_SCORE),
                "predicted_class": pred,
                "probabilities":   probs.tolist(),
                "embedding":       emb.tolist(),
                "model_used":      "MLP",
            }
        except Exception as exc:
            print(f"[PHYSIO INFERENCE] _run_model() raised: {exc!r} -> fallback")
            return _fallback_result()
    else:
        print("[PHYSIO INFERENCE] Model not ready -> fallback (uniform output).")
        return _fallback_result()


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

def _run_model(mlp_input: np.ndarray) -> dict:
    """
    Forward pass: numpy (10,) → embedding (64,) + probabilities (3,).

    Uses get_embedding() for the embedding and forward() for logits — matching
    exactly how the training pipeline extracted features for the fusion model.
    """
    print("[PHYSIO INFERENCE] Forward pass start | device=cpu")

    # Optional: apply scaler before inference
    inp = mlp_input.copy()
    if physio_scaler is not None:
        inp = physio_scaler.transform(inp.reshape(1, -1)).reshape(-1).astype(np.float32)

    # (10,) → (1, 10)
    x = torch.tensor(inp, dtype=torch.float32).unsqueeze(0)

    if x.shape != (1, NUM_MLP_FEATURES):
        raise ValueError(
            f"[PHYSIO INFERENCE] Shape mismatch: got {x.shape}, "
            f"expected (1, {NUM_MLP_FEATURES})"
        )

    with torch.no_grad():
        # get_embedding: tap the 64-dim representation at net[5]
        emb    = physio_model.get_embedding(x)      # (1, 64)
        # full forward for logits
        logits, _ = physio_model(x)                 # (1, 3), (1, 64)

    probs  = torch.softmax(logits[0], dim=-1).detach().cpu().numpy()   # (3,)
    emb_np = emb[0].detach().cpu().numpy()                             # (64,)

    print(f"[PHYSIO INFERENCE] Forward pass done | logits={logits[0].round().tolist()}")

    # Numerical safety checks
    if np.any(np.isnan(probs)) or np.any(np.isinf(probs)):
        raise ValueError("[PHYSIO INFERENCE] NaN/Inf in probabilities")
    if np.any(np.isnan(emb_np)) or np.any(np.isinf(emb_np)):
        raise ValueError("[PHYSIO INFERENCE] NaN/Inf in embedding")

    if emb_np.shape != (EMBEDDING_DIM,):
        print(f"[PHYSIO INFERENCE] WARNING: Unexpected emb shape: {emb_np.shape}")

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