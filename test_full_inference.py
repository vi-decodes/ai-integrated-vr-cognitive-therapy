"""
test_full_inference.py
End-to-end integration test: audio -> physio -> fusion
Verifies that all three models load and produce correct output shapes.
"""
import sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath("."))

import numpy as np

print("=" * 60)
print("1. AUDIO INFERENCE")
print("=" * 60)
from ai.audio.audio_inference import predict_audio, AUDIO_MODEL_READY, EMBEDDING_DIM as AUDIO_EMB_DIM

print(f"AUDIO_MODEL_READY = {AUDIO_MODEL_READY}")
audio_window = np.random.normal(0, 10, (32, 40)).astype("float32")
audio_result = predict_audio(audio_window)

print()
print("--- predict_audio() result ---")
for k, v in audio_result.items():
    if k == "embedding":
        arr = np.array(v)
        print(f"  {k}: shape={arr.shape}  norm={np.linalg.norm(arr):.4f}")
    elif k == "probabilities":
        print(f"  {k}: {[round(p,4) for p in v]}  sum={sum(v):.4f}")
    else:
        print(f"  {k}: {v}")

assert audio_result["model_used"] == "CNN+LSTM", f"Expected CNN+LSTM, got {audio_result['model_used']}"
assert len(audio_result["embedding"]) == 128, f"Audio embedding must be 128-dim, got {len(audio_result['embedding'])}"
assert abs(sum(audio_result["probabilities"]) - 1.0) < 1e-4

print()
print("=" * 60)
print("2. PHYSIO INFERENCE")
print("=" * 60)
from ai.biofeedback.physio_inference import predict_physio, PHYSIO_MODEL_READY, EMBEDDING_DIM as PHYSIO_EMB_DIM

print(f"PHYSIO_MODEL_READY = {PHYSIO_MODEL_READY}")
physio_window = np.random.rand(10, 19).astype("float32")
physio_result = predict_physio(physio_window)

print()
print("--- predict_physio() result ---")
for k, v in physio_result.items():
    if k == "embedding":
        arr = np.array(v)
        print(f"  {k}: shape={arr.shape}  norm={np.linalg.norm(arr):.4f}")
    elif k == "probabilities":
        print(f"  {k}: {[round(p,4) for p in v]}  sum={sum(v):.4f}")
    else:
        print(f"  {k}: {v}")

assert physio_result["model_used"] == "MLP", f"Expected MLP, got {physio_result['model_used']}"
assert len(physio_result["embedding"]) == 64, f"Physio embedding must be 64-dim, got {len(physio_result['embedding'])}"
assert abs(sum(physio_result["probabilities"]) - 1.0) < 1e-4

print()
print("=" * 60)
print("3. FUSION INFERENCE")
print("=" * 60)
from ai.fusion.fusion_inference import fuse, FUSION_MODEL_READY, FUSION_INPUT_DIM

print(f"FUSION_MODEL_READY = {FUSION_MODEL_READY}")
print(f"FUSION_INPUT_DIM   = {FUSION_INPUT_DIM}  (expected 192)")

fused_score, stress_state, confidence = fuse(audio_result, physio_result)
print()
print("--- fuse() result ---")
print(f"  fused_score  : {fused_score}")
print(f"  stress_state : {stress_state}")
print(f"  confidence   : {confidence}")

assert stress_state in ("calm", "mild", "escalated")
assert 0.0 <= fused_score <= 1.0
assert 0.0 <= confidence <= 1.0

print()
print("=" * 60)
print("EMBEDDING CONCAT SHAPE CHECK")
print("=" * 60)
audio_emb  = np.array(audio_result["embedding"])
physio_emb = np.array(physio_result["embedding"])
concat = np.concatenate([audio_emb, physio_emb])
print(f"  audio_emb  : {audio_emb.shape}")
print(f"  physio_emb : {physio_emb.shape}")
print(f"  concat     : {concat.shape}  (must be ({FUSION_INPUT_DIM},))")
assert concat.shape == (FUSION_INPUT_DIM,), f"Concat shape mismatch: {concat.shape} != ({FUSION_INPUT_DIM},)"

print()
print("=" * 60)
print("ALL ASSERTIONS PASSED")
print(f"  [AUDIO ] model_used={audio_result['model_used']}  emb_dim={len(audio_result['embedding'])}")
print(f"  [PHYSIO] model_used={physio_result['model_used']}  emb_dim={len(physio_result['embedding'])}")
print(f"  [FUSION] input_dim={FUSION_INPUT_DIM}  ready={FUSION_MODEL_READY}")
print("=" * 60)
