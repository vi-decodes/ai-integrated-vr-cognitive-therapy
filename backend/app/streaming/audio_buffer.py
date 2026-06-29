"""
audio_buffer.py — Shared Real-Time Audio Sequence Buffer

HOW IT WORKS (new per-frame streaming protocol):
    1. Frontend calls POST /audio_sequence with a ready 32×40 MFCC window.
       The frontend maintains its own FIFO and only sends when it has 32 frames
       AND stride gate fires (every STRIDE=5 frames).
    2. main.py handler calls set_audio_sequence(sequence).
    3. audio_pipeline.py calls get_audio_sequence() on each poll cycle.
    4. If a fresh sequence exists (< MAX_AGE_SECONDS), it is used directly.
    5. Otherwise pipeline falls back to simulation.

BACKWARDS COMPAT:
    set_audio_features() / get_audio_features() are kept for the legacy
    /audio_features (164-flat) endpoint so old frontend code doesn't break.
"""

import threading
import time
from typing import Optional

# ─── Config ───────────────────────────────────────────────────────────────────
MAX_AGE_SECONDS  = 10.0   # after this, data is considered stale
EXPECTED_FRAMES  = 32     # MFCC sequence length
EXPECTED_COEFFS  = 40     # MFCC coefficients per frame

# Legacy flat-vector config (kept for backward compat)
EXPECTED_FEATURES = 164

# ─── Internal state ───────────────────────────────────────────────────────────
_lock = threading.Lock()

# New: full (32, 40) sequence sent directly from frontend
_latest_sequence: Optional[list] = None    # list[list[float]], shape (32, 40)
_sequence_timestamp: float = 0.0

# Legacy: flat 164-feature blob
_latest_features: Optional[list] = None
_features_timestamp: float = 0.0


# =============================================================================
# NEW API — per-sequence (32×40)
# =============================================================================

def set_audio_sequence(sequence: list) -> None:
    """
    Store a complete (32, 40) MFCC sequence received from the frontend.

    Called by POST /audio_sequence handler in main.py.
    Thread-safe via a lock.

    Args:
        sequence: list[list[float]] of shape (32, 40).
    """
    global _latest_sequence, _sequence_timestamp
    with _lock:
        _latest_sequence   = [row[:] for row in sequence]  # defensive copy
        _sequence_timestamp = time.time()
    print(
        f"[AUDIO BUFFER] Sequence received: {len(sequence)}x"
        f"{len(sequence[0]) if sequence else 0} frames"
    )
    print("[BUFFER] Audio sequence stored")


def get_audio_sequence() -> tuple[Optional[list], bool]:
    """
    Retrieve the latest complete MFCC sequence if fresh.

    Returns:
        (sequence, is_real):
            sequence — list[list[float]] of shape (32, 40), or None
            is_real  — True if from real mic, False if caller should simulate
    """
    with _lock:
        if _latest_sequence is None:
            return None, False

        age = time.time() - _sequence_timestamp
        if age > MAX_AGE_SECONDS:
            print(f"[AUDIO BUFFER] Sequence stale (age={age:.1f}s) — will simulate.")
            return None, False

        return [row[:] for row in _latest_sequence], True


def get_sequence_age() -> Optional[float]:
    """Seconds since last sequence was received, or None if never."""
    with _lock:
        if _sequence_timestamp == 0.0:
            return None
        return time.time() - _sequence_timestamp


# =============================================================================
# LEGACY API — flat 164-feature blob (kept for backward compatibility)
# =============================================================================

def set_audio_features(features: list) -> None:
    """Store the latest 164-flat MFCC features from the legacy frontend path."""
    global _latest_features, _features_timestamp
    with _lock:
        _latest_features   = features[:]
        _features_timestamp = time.time()
    print(f"[AUDIO BUFFER] Legacy features received: {len(features)} values")


def get_audio_features() -> tuple[Optional[list], bool]:
    """Retrieve legacy flat features if fresh."""
    with _lock:
        if _latest_features is None:
            return None, False
        age = time.time() - _features_timestamp
        if age > MAX_AGE_SECONDS:
            return None, False
        return _latest_features[:], True


def get_feature_age() -> Optional[float]:
    """Seconds since last legacy features were received, or None if never."""
    with _lock:
        if _features_timestamp == 0.0:
            return None
        return time.time() - _features_timestamp
