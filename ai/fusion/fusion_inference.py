"""
fusion_inference.py — Deep-Learning Multimodal Stress Fusion (PyTorch)

MODEL FILE: models/fusion_model.pth  (state_dict format)

FUSION PATHS:
    1. Neural  — both embeddings non-zero → concat(128) → MLP → softmax → class
    2. Fallback — model missing, error, or zero embeddings → weighted scalar avg
"""
import os
import torch
import numpy as np

from .model import FusionModel

# ─── Embedding dimensions (must match what each modality model outputs) ──────
AUDIO_EMBEDDING_DIM  = 128   # AudioModel.get_embedding() → CNN last-timestep (128-dim)
PHYSIO_EMBEDDING_DIM = 64    # PhysioModel.get_embedding() → Linear(128→64) (64-dim)
FUSION_INPUT_DIM     = AUDIO_EMBEDDING_DIM + PHYSIO_EMBEDDING_DIM   # 192

# ─── Stress state thresholds (shared with Unity) ──────────────────────────────
CALM_THRESHOLD      = 0.40
ESCALATED_THRESHOLD = 0.70

# ─── Class → score mapping ────────────────────────────────────────────────────
CLASS_TO_SCORE = {0: 0.2, 1: 0.5, 2: 0.8}
DEFAULT_SCORE  = 0.5

# ─── Fallback weights ─────────────────────────────────────────────────────────
FALLBACK_WEIGHTS = {"physio": 0.60, "audio": 0.40}

# =============================================================================
# MODEL LOADING
# =============================================================================

FUSION_MODEL_PATH = os.path.join("models", "fusion_model.pth")

FUSION_MODEL_READY = False
fusion_model: FusionModel | None = None

_abs_path = os.path.abspath(FUSION_MODEL_PATH)
print(f"[FUSION] Looking for fusion model at: {_abs_path}")

try:
    fusion_model = FusionModel(input_dim=FUSION_INPUT_DIM, num_classes=3)
    if os.path.exists(FUSION_MODEL_PATH):
        state = torch.load(FUSION_MODEL_PATH, map_location=torch.device("cpu"), weights_only=True)
        fusion_model.load_state_dict(state)
        fusion_model.eval()
        FUSION_MODEL_READY = True
        print(f"[FUSION] PyTorch Fusion MLP loaded from {_abs_path}")
    else:
        print(
            f"[FUSION] Fusion model NOT found at {_abs_path}\n"
            f"  -> Using weighted-average fallback until model is placed."
        )
except Exception as exc:
    print(f"[FUSION] Fusion model load FAILED: {exc!r}\n  -> Using weighted-average fallback.")
    FUSION_MODEL_READY = False


# =============================================================================
# PUBLIC API
# =============================================================================

def fuse(audio_result: dict, physio_result: dict) -> tuple:
    """
    Fuse audio + physio inference results into a single stress prediction.

    Path 1 (preferred): both embeddings are valid → neural MLP fusion.
    Path 2 (fallback):  model missing, error, or zero embeddings → weighted avg.

    Returns: (fused_score: float, stress_state: str, confidence: float)
    """
    audio_emb  = np.array(
        audio_result.get("embedding",  [0.0] * AUDIO_EMBEDDING_DIM), dtype=np.float32
    )
    physio_emb = np.array(
        physio_result.get("embedding", [0.0] * PHYSIO_EMBEDDING_DIM), dtype=np.float32
    )

    audio_norm  = float(np.linalg.norm(audio_emb))
    physio_norm = float(np.linalg.norm(physio_emb))
    print(
        f"[FUSION] Embedding norms: audio={audio_norm:.4f}  physio={physio_norm:.4f}  "
        f"model_ready={FUSION_MODEL_READY}"
    )

    if FUSION_MODEL_READY:
        # Zero-embedding guard: at least one modality is still in fallback mode
        if audio_norm < 1e-6 or physio_norm < 1e-6:
            print(
                "[FUSION] WARNING: Zero embedding detected "
                f"(audio_norm={audio_norm:.4f}, physio_norm={physio_norm:.4f}) "
                "-> triggering weighted-average fallback."
            )
            return _fallback_fusion(
                audio_result.get("stress_score",  DEFAULT_SCORE),
                physio_result.get("stress_score", DEFAULT_SCORE),
            )

        try:
            result = _run_fusion_model(audio_emb, physio_emb)
            return result
        except Exception as exc:
            print(f"[FUSION] Neural fusion raised: {exc!r} -> weighted-average fallback.")
            return _fallback_fusion(
                audio_result.get("stress_score",  DEFAULT_SCORE),
                physio_result.get("stress_score", DEFAULT_SCORE),
            )
    else:
        return _fallback_fusion(
            audio_result.get("stress_score",  DEFAULT_SCORE),
            physio_result.get("stress_score", DEFAULT_SCORE),
        )


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

def _run_fusion_model(audio_emb: np.ndarray, physio_emb: np.ndarray) -> tuple:
    """
    Neural forward pass: concat embeddings (128,) → MLP → softmax → class/score.
    """
    concat = np.concatenate([audio_emb, physio_emb])              # (128,)
    x = torch.tensor(concat, dtype=torch.float32).unsqueeze(0)    # (1,128)

    if x.shape != (1, FUSION_INPUT_DIM):
        print(f"[FUSION] WARNING: Unexpected fusion input shape: {x.shape} (expected (1,{FUSION_INPUT_DIM}))"
              " -> proceeding but results may be incorrect")

    print(f"[FUSION] Forward pass start | input_shape={x.shape}")
    with torch.no_grad():
        logits = fusion_model(x)                                   # (1,3)

    probs = torch.softmax(logits[0], dim=-1).detach().cpu().numpy()  # (3,)
    pred  = int(np.argmax(probs))
    score = CLASS_TO_SCORE.get(pred, DEFAULT_SCORE)
    state = _classify(score)
    conf  = float(probs[pred])

    print(
        f"[FUSION] Neural fusion OK | logits={logits[0].tolist()}  "
        f"probs={probs.round(3).tolist()}  pred={pred}  score={score}  conf={conf:.4f}"
    )
    return score, state, conf


def _fallback_fusion(audio_score: float, physio_score: float) -> tuple:
    """Weighted scalar average — used ONLY when neural path is unavailable."""
    fused = (
        FALLBACK_WEIGHTS["physio"] * physio_score +
        FALLBACK_WEIGHTS["audio"]  * audio_score
    )
    fused      = round(min(1.0, max(0.0, fused)), 4)
    state      = _classify(fused)
    confidence = round(0.5 + abs(fused - 0.5), 4)

    print(
        f"[FUSION] 🔧 FALLBACK weighted avg | "
        f"physio={physio_score:.3f}  audio={audio_score:.3f}  "
        f"→ fused={fused:.4f}  state={state}  confidence={confidence:.3f}"
    )
    return fused, state, confidence


def _classify(score: float) -> str:
    if score < CALM_THRESHOLD:
        return "calm"
    elif score < ESCALATED_THRESHOLD:
        return "mild"
    return "escalated"