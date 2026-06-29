import sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, ".")

import numpy as np

# Simulate what the pipeline sends: (10, 19) window
window = np.random.rand(10, 19).astype("float32")

from ai.biofeedback.physio_inference import predict_physio, PHYSIO_MODEL_READY
print("PHYSIO_MODEL_READY =", PHYSIO_MODEL_READY)

result = predict_physio(window)
print()
print("--- predict_physio() result ---")
for k, v in result.items():
    if k == "embedding":
        arr = np.array(v)
        print(f"  {k}: shape={arr.shape}  norm={np.linalg.norm(arr):.4f}")
    elif k == "probabilities":
        print(f"  {k}: {[round(p,4) for p in v]}  sum={sum(v):.4f}")
    else:
        print(f"  {k}: {v}")

assert result["model_used"] == "MLP", "Expected model_used=MLP, got " + result["model_used"]
assert len(result["embedding"]) == 64, "Embedding must be 64-dim"
assert abs(sum(result["probabilities"]) - 1.0) < 1e-4, "Probabilities must sum to 1"
print()
print("ALL ASSERTIONS PASSED - physio MLP inference is working correctly")
