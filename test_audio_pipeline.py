import sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, ".")

import numpy as np
from collections import deque

# 1. Buffer module
from backend.app.streaming.audio_buffer import (
    set_audio_sequence, get_audio_sequence,
    set_audio_features, get_audio_features,
)

seq = np.random.normal(0, 10, (32, 40)).tolist()
set_audio_sequence(seq)
result, is_real = get_audio_sequence()
assert is_real and len(result) == 32 and len(result[0]) == 40, "Buffer get_audio_sequence failed"
print("PASS: audio_buffer set/get sequence")

# 2. Pipeline window assembly - prefers sequence buffer
from backend.app.streaming.audio_pipeline import _get_window
legacy_buf = deque(maxlen=32)
window, source = _get_window(legacy_buf)
assert window.shape == (32, 40), f"Bad window shape: {window.shape}"
assert source == "mic_sequence", f"Expected mic_sequence, got {source}"
print(f"PASS: _get_window shape={window.shape}  source={source}")

# 3. Simulate empty buffer (no sequence posted) — should fall to simulation
import backend.app.streaming.audio_buffer as ab
ab._latest_sequence = None
window2, source2 = _get_window(legacy_buf)
assert window2.shape == (32, 40)
assert source2 == "simulated"
print(f"PASS: fallback to simulation  source={source2}")

# 4. End-to-end inference
from ai.audio.audio_inference import predict_audio, AUDIO_MODEL_READY
print(f"AUDIO_MODEL_READY = {AUDIO_MODEL_READY}")

window3 = np.random.normal(0, 10, (32, 40)).astype("float32")
pred = predict_audio(window3)
assert pred["model_used"] == "CNN+LSTM", "Expected CNN+LSTM model"
assert len(pred["embedding"]) == 128, "Expected 128-dim embedding"
assert abs(sum(pred["probabilities"]) - 1.0) < 1e-4
print(f"PASS: predict_audio model_used={pred['model_used']}  emb_dim={len(pred['embedding'])}")

print()
print("ALL PIPELINE TESTS PASSED")
