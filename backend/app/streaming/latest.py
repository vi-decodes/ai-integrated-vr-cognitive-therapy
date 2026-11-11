"""
latest.py — Shared latest fused prediction (thread-safe, module-level dict).

Written by the orchestrator after every successful fusion cycle.
Read by GET /latest-stress in main.py.
No locks needed: dict assignment is atomic in CPython.
"""

# Default: calm baseline returned before any session produces a real prediction.
prediction: dict = {
    "fused_score":        0.2,
    "stress_state":       "calm",
    "confidence":         1.0,
    "environment_action": "None",
}
