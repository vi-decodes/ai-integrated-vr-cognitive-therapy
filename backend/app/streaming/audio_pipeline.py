"""
audio_pipeline.py — Audio Stress Pipeline (CNN + LSTM) — Production Mode

DATA FLOW:
    Frontend sends POST /audio_sequence with a full (32×40) MFCC window
    every STRIDE frames. This pipeline polls the buffer every AUDIO_POLL_INTERVAL
    seconds, runs inference, applies stabilization filters, and pushes to audio_queue.

STABILIZATION PIPELINE (in order):
    1. WARMUP GATE      — skip output for the first WARMUP_SECONDS after start
    2. INFERENCE        — CNN+LSTM forward pass on (32,40) → (1,120,32) tensor
    3. SMOOTHING        — 5-prediction moving average on score + probabilities
    4. STABILITY FILTER — require 4/5 matching class predictions before output
    5. STALE DATA CHECK — skip if last sequence is > STALE_DATA_THRESHOLD_S old

PACKET FORMAT (pushed to audio_queue):
    {
        "modality":        "audio",
        "timestamp":       float,
        "stress_score":    float,        # smoothed
        "predicted_class": int,
        "probabilities":   list[float],  # smoothed, len=3
        "embedding":       list[float],  # 128-dim raw CNN features
        "confidence":      float,
        "source":          str,          # "CNN+LSTM" | "fallback"
        "data_source":     str,          # "mic_sequence" | "simulated"
    }
"""

import asyncio
import time
import numpy as np
from collections import deque

import ai.audio.audio_inference as _audio_inf
from ai.audio.audio_inference import predict_audio, AUDIO_SEQ_LEN, NUM_MFCC_COEFFS

# ─── Timing ───────────────────────────────────────────────────────────────────
AUDIO_POLL_INTERVAL    = 2.0   # seconds between inference attempts
WARMUP_SECONDS         = 3.0   # skip output during pipeline warmup
STALE_DATA_THRESHOLD_S = 5.0   # max age of sequence buffer data

# ─── Stabilization ────────────────────────────────────────────────────────────
SMOOTH_N               = 5     # moving average window
STABILITY_MIN_VOTES    = 4     # require 4/5 identical class predictions


async def run_audio_pipeline(out_q: asyncio.Queue) -> None:
    """
    Infinite loop — receives MFCC sequences and runs stabilized CNN+LSTM inference.
    """
    print("[AUDIO] Pipeline started.")

    session_start = time.time()

    # Smoothing + stability state
    score_history: deque  = deque(maxlen=SMOOTH_N)
    probs_history: deque  = deque(maxlen=SMOOTH_N)
    class_history: deque  = deque(maxlen=SMOOTH_N)

    while True:
        try:
            # ── WARMUP GATE ───────────────────────────────────────────────────
            elapsed = time.time() - session_start
            if elapsed < WARMUP_SECONDS:
                print(f"[AUDIO] Warmup... ({elapsed:.1f}s / {WARMUP_SECONDS}s) — skipping output")
                await asyncio.sleep(AUDIO_POLL_INTERVAL)
                continue

            # ── GET WINDOW ────────────────────────────────────────────────────
            window, data_source = _get_window()

            # ── STALE DATA CHECK ─────────────────────────────────────────────
            seq_age = _get_sequence_age()
            if seq_age is not None and seq_age > STALE_DATA_THRESHOLD_S:
                print(f"[AUDIO] Stale data (age={seq_age:.1f}s > {STALE_DATA_THRESHOLD_S}s) — skipping")
                await asyncio.sleep(AUDIO_POLL_INTERVAL)
                continue

            model_ready = _audio_inf.AUDIO_MODEL_READY
            print(
                f"[AUDIO] Window ({AUDIO_SEQ_LEN}x{NUM_MFCC_COEFFS}) "
                f"data={data_source}  model={'CNN+LSTM' if model_ready else 'NOT LOADED'}"
            )
            print(f"[AUDIO PIPELINE] source={data_source}")

            # ── INFERENCE ─────────────────────────────────────────────────────
            loop   = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, predict_audio, window)

            source = result.get("model_used", "fallback")

            # ── SMOOTHING ─────────────────────────────────────────────────────
            raw_pred  = result["predicted_class"]
            score_history.append(result["stress_score"])
            probs_history.append(result["probabilities"])
            class_history.append(raw_pred)

            smoothed_score = float(np.mean(score_history))
            smoothed_probs = np.mean(probs_history, axis=0).tolist()
            smoothed_pred  = int(np.argmax(smoothed_probs))
            confidence     = round(max(smoothed_probs), 4)

            # ── STABILITY FILTER ──────────────────────────────────────────────
            votes = list(class_history).count(smoothed_pred)
            if len(class_history) == SMOOTH_N and votes < STABILITY_MIN_VOTES:
                print(
                    f"[AUDIO] Unstable prediction (class={smoothed_pred} "
                    f"votes={votes}/{SMOOTH_N}) — skipping output"
                )
                await asyncio.sleep(AUDIO_POLL_INTERVAL)
                continue

            # ── EMBEDDING DIAGNOSTIC ──────────────────────────────────────────
            emb  = np.array(result["embedding"])
            norm = float(np.linalg.norm(emb))

            packet = {
                "modality":        "audio",
                "timestamp":       time.time(),
                "stress_score":    round(smoothed_score, 4),
                "predicted_class": smoothed_pred,
                "probabilities":   [round(p, 4) for p in smoothed_probs],
                "embedding":       result["embedding"],   # 128-dim raw CNN embedding
                "confidence":      confidence,
                "source":          source,
                "data_source":     data_source,
            }
            await _safe_put(out_q, packet, "audio")
            print(
                f"[AUDIO] score={smoothed_score:.3f}  class={smoothed_pred}  "
                f"conf={confidence:.3f}  emb_norm={norm:.2f}  "
                f"votes={votes}/{SMOOTH_N}  model={source}  data={data_source}"
            )

        except Exception as exc:
            print(f"[AUDIO] Error: {exc}")

        await asyncio.sleep(AUDIO_POLL_INTERVAL)


# =============================================================================
# WINDOW ASSEMBLY  (sequence buffer only — no legacy path)
# =============================================================================

def _get_window() -> tuple[np.ndarray, str]:
    """
    Return a (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS) window + data source label.

    Priority:
        1. POST /audio_sequence buffer  → "mic_sequence"
        2. Simulated window             → "simulated"
    """
    try:
        from .audio_buffer import get_audio_sequence
        seq, is_real = get_audio_sequence()
        if is_real and seq is not None:
            window = np.array(seq, dtype=np.float32)
            if window.shape == (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS):
                return window, "mic_sequence"
    except Exception as exc:
        print(f"[AUDIO] get_audio_sequence error: {exc}")

    # Fallback simulation (keeps pipeline alive during dev/testing)
    return _simulate_window(), "simulated"


def _get_sequence_age() -> float | None:
    """Return seconds since last sequence was stored, or None if never."""
    try:
        from .audio_buffer import get_sequence_age
        return get_sequence_age()
    except Exception:
        return None


def _simulate_window() -> np.ndarray:
    """Random (AUDIO_SEQ_LEN, NUM_MFCC_COEFFS) window for fallback."""
    return np.random.normal(0.0, 10.0,
                            size=(AUDIO_SEQ_LEN, NUM_MFCC_COEFFS)).astype(np.float32)


# =============================================================================
# QUEUE HELPER
# =============================================================================

async def _safe_put(q: asyncio.Queue, item: dict, label: str) -> None:
    """Drop-safe queue put — discards oldest item if queue is full."""
    if q.full():
        try:
            q.get_nowait()
            print(f"[{label.upper()}] Queue full — dropped oldest item.")
        except asyncio.QueueEmpty:
            pass
    await q.put(item)
