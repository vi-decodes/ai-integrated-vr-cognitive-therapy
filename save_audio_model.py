"""
save_audio_model.py
Extracts the state_dict from audio_model_full.pth and saves it as audio_model.pth.

Run once from project root:
    py save_audio_model.py
"""
import sys, os, torch
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath("."))

from ai.audio.model import AudioModel

SRC = os.path.join("models", "audio_model_full.pth")
DST = os.path.join("models", "audio_model.pth")

print(f"[SAVE] Source: {os.path.abspath(SRC)}")
print(f"[SAVE] Target: {os.path.abspath(DST)}")

checkpoint = torch.load(SRC, map_location="cpu", weights_only=False)
print(f"[SAVE] Checkpoint type : {type(checkpoint)}")

if isinstance(checkpoint, dict):
    print(f"[SAVE] Checkpoint keys : {list(checkpoint.keys())}")

# Extract state dict
if isinstance(checkpoint, torch.nn.Module):
    state_dict = checkpoint.state_dict()
    print("[SAVE] Full nn.Module -> extracting state_dict")
elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
    state_dict = checkpoint["model_state_dict"]
    print("[SAVE] Using key: model_state_dict")
elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
    state_dict = checkpoint["state_dict"]
    print("[SAVE] Using key: state_dict")
else:
    state_dict = checkpoint
    print("[SAVE] Treating entire dict as state_dict")

print(f"[SAVE] State_dict keys: {list(state_dict.keys())}")

# Load into architecture
model = AudioModel(in_channels=120, hidden_dim=64, num_classes=3)
print(f"[SAVE] Model expected keys: {list(model.state_dict().keys())}")

missing, unexpected = model.load_state_dict(state_dict, strict=False)
if missing:
    print(f"[SAVE] WARNING - Missing  keys (will be random): {missing}")
if unexpected:
    print(f"[SAVE] INFO    - Ignored  keys: {unexpected}")
if not missing and not unexpected:
    print("[SAVE] Perfect key match.")

model.eval()

# Quick forward-pass smoke test
import numpy as np
dummy = torch.zeros(1, 120, 32)
logits, emb = model(dummy)
print(f"[SAVE] Smoke test: logits={logits.shape}  emb={emb.shape}")
assert logits.shape == (1, 3),   f"Bad logits shape: {logits.shape}"
assert emb.shape   == (1, 128),  f"Bad emb shape: {emb.shape}"

torch.save(model.state_dict(), DST)
print(f"[SAVE] Saved -> {os.path.abspath(DST)}")
print("[SAVE] Done. Restart uvicorn.")
