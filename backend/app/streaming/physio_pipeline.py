"""
physio_pipeline.py — Physiological Stress Pipeline (MLP)

DATA FLOW:
    1. A wearable sensor (Empatica E4 / custom BLE) pushes one physiological
       sample (19 features) every ~0.5 s.
       -> FUTURE: connect real hardware in _get_new_physio_sample().
       -> NOW:    _generate_physio_sample() simulates realistic sensor values
                 based on WESAD dataset distributions.
    2. Each new sample is appended to the rolling sequence buffer.
    3. Every PHYSIO_POLL_INTERVAL seconds the buffer is passed to predict_physio()
       which internally extracts the last sample's first 10 features for the MLP.
       (The model is a pure MLP, NOT an LSTM — it processes one flat vector.)

SEQUENCE BUFFER:
    PHYSIO_SEQ_LEN (10) samples × NUM_PHYSIO_FEATURES (19) = one window.
    The buffer is a deque of fixed length.

ADDING REAL HARDWARE:
    Replace the body of _get_new_physio_sample() with your serial/BLE/LSL read.
    The rest of the pipeline (buffer management, inference, queue push) is unchanged.

PACKET FORMAT (pushed to physio_queue):
    {
        "modality":        "physio",
        "timestamp":       float,         # Unix time of inference
        "stress_score":    float,         # {0.2, 0.5, 0.8}
        "predicted_class": int,           # {0, 1, 2}
        "probabilities":   list[float],   # [p_calm, p_mild, p_escalated]
        "embedding":       list[float],   # 64-dim embedding for fusion
        "confidence":      float,         # max softmax prob
        "source":          str            # "real" | "simulated"
    }
"""

import asyncio
import time
import numpy as np
from collections import deque

import ai.biofeedback.physio_inference as _physio_inf
from ai.biofeedback.physio_inference import (
    predict_physio,
    PHYSIO_SEQ_LEN,
    NUM_PHYSIO_FEATURES,
    NUM_MLP_FEATURES,
)

# How often to attempt an inference (seconds)
PHYSIO_POLL_INTERVAL = 2.0

# How often a new sensor sample arrives (seconds) — controls fill rate
PHYSIO_SAMPLE_INTERVAL = 0.5


async def run_physio_pipeline(out_q: asyncio.Queue) -> None:
    """
    Infinite loop — accumulates physiological samples and runs LSTM inference.

    Two timers co-exist:
        sample_task — appends one new sample to seq_buffer every PHYSIO_SAMPLE_INTERVAL
        inference   — every PHYSIO_POLL_INTERVAL runs inference when buffer is full
    Both are managed as asyncio tasks so neither blocks the other.
    """
    print("[PHYSIO] Pipeline started.")

    # Rolling buffer: stores individual physio samples, shape (NUM_PHYSIO_FEATURES,) each
    seq_buffer: deque = deque(maxlen=PHYSIO_SEQ_LEN)

    # Kick off the background sample-collector task
    sample_task = asyncio.create_task(
        _sample_collector(seq_buffer),
        name="physio_sample_collector",
    )

    try:
        while True:
            try:
                await asyncio.sleep(PHYSIO_POLL_INTERVAL)

                # Step 1: Build inference window
                model_ready = _physio_inf.PHYSIO_MODEL_READY   # live read — not stale import
                if len(seq_buffer) == PHYSIO_SEQ_LEN:
                    window = np.array(seq_buffer, dtype=np.float32)  # (10, 19)
                    data_source = "hardware" if _hardware_connected() else "simulated"
                    print(
                        f"[PHYSIO] Window ready ({PHYSIO_SEQ_LEN}x{NUM_PHYSIO_FEATURES})  "
                        f"data={data_source}  model={'MLP' if model_ready else 'NOT LOADED'}  "
                        f"(will use last_frame[:{NUM_MLP_FEATURES}] for inference)"
                    )
                else:
                    # Buffer warming up — use a simulated window so inference still runs
                    window = _simulate_window()
                    data_source = "simulated"
                    print(
                        f"[PHYSIO] Buffer warming up ({len(seq_buffer)}/{PHYSIO_SEQ_LEN} samples)"
                        f" — using simulated window  model={'MLP' if model_ready else 'NOT LOADED'}"
                    )

                # Step 2: Inference (thread-pool — blocking model call)
                loop   = asyncio.get_running_loop()
                result = await loop.run_in_executor(None, predict_physio, window)

                confidence = max(result["probabilities"]) if result["probabilities"] else 0.5

                # Step 3: Build packet and push
                # source reflects the INFERENCE engine, not the data origin
                source = result.get("model_used", "fallback")  # "MLP" | "fallback"
                packet = {
                    "modality":        "physio",
                    "timestamp":       time.time(),
                    "stress_score":    result["stress_score"],
                    "predicted_class": result["predicted_class"],
                    "probabilities":   result["probabilities"],
                    "embedding":       result["embedding"],
                    "confidence":      round(confidence, 4),
                    "source":          source,
                    "data_source":     data_source,
                }
                await _safe_put(out_q, packet, "physio")
                print(
                    f"[PHYSIO]  score={result['stress_score']:.3f}  "
                    f"class={result['predicted_class']}  "
                    f"model={source}  data={data_source}"
                )

            except Exception as exc:
                print(f"[PHYSIO]   Error: {exc}")
    finally:
        sample_task.cancel()


# ─── Sample collector ─────────────────────────────────────────────────────────

async def _sample_collector(seq_buffer: deque) -> None:
    """
    Background task: appends one physiological sample to seq_buffer
    every PHYSIO_SAMPLE_INTERVAL seconds.

    Replace _get_new_physio_sample() with real sensor I/O when hardware arrives.
    This task runs forever alongside the inference loop.
    """
    while True:
        try:
            sample, is_real = _get_new_physio_sample()
            seq_buffer.append(sample)
        except Exception as exc:
            print(f"[PHYSIO SAMPLER]   {exc}")
        await asyncio.sleep(PHYSIO_SAMPLE_INTERVAL)


def _get_new_physio_sample() -> tuple:
    """
    Return one physiological sample of shape (NUM_PHYSIO_FEATURES,).

    Returns:
        (sample, is_real):
            sample  — np.ndarray of shape (19,)
            is_real — True when reading from real hardware
    """
    # ── REAL HARDWARE PATH ────────────────────────────────────────────────────
    # TODO: replace this block with your actual sensor read.
    #
    # Lab Streaming Layer (LSL) example:
    #     from pylsl import StreamInlet, resolve_stream
    #     streams = resolve_stream('name', 'EmpaticaE4')
    #     inlet = StreamInlet(streams[0])  # (initialise once, not here)
    #     sample, timestamp = inlet.pull_sample()
    #     return np.array(sample, dtype=np.float32), True
    #
    # Serial / BLE example:
    #     raw = serial_port.readline().decode().split(',')
    #     return np.array(raw, dtype=np.float32), True
    #
    # Set _hardware_connected() to return True once hardware is wired up.

    return _generate_physio_sample(), False


def _hardware_connected() -> bool:
    """
    Return True when real physiological hardware is connected and reading.
    Flip this to True (or replace with a live check) when hardware is integrated.
    """
    return False


# ─── Feature generators ───────────────────────────────────────────────────────

def _generate_physio_sample() -> np.ndarray:
    """
    Generate ONE simulated physiological sample (19 features).

    Distributions are based on WESAD dataset norms for a resting/baseline state.
    This provides realistic-looking data for pipeline testing.

    Feature layout (must match LSTM training):
        [0]  HR      — heart rate (bpm) ~ N(75, 10)
        [1]  HRV     — HRV (ms)         ~ N(50, 15)
        [2]  EDA     — EDA (µS)         ~ U(0.1, 5.0)
        [3]  ACC_x   — accel x          ~ N(0, 0.5)
        [4]  ACC_y   — accel y          ~ N(0, 0.5)
        [5]  ACC_z   — accel z          ~ N(1, 0.3)
        [6-18]       — derived metrics  ~ N(0, 1) each
    """
    hr    = np.random.normal(75, 10)
    hrv   = np.random.normal(50, 15)
    eda   = np.random.uniform(0.1, 5.0)
    acc_x = np.random.normal(0, 0.5)
    acc_y = np.random.normal(0, 0.5)
    acc_z = np.random.normal(1, 0.3)
    rest  = np.random.normal(0, 1, 13)

    sample = np.array([hr, hrv, eda, acc_x, acc_y, acc_z, *rest], dtype=np.float32)
    return sample   # shape: (19,)


def _simulate_window() -> np.ndarray:
    """Return a complete simulated window of shape (PHYSIO_SEQ_LEN, NUM_PHYSIO_FEATURES)."""
    return np.stack([_generate_physio_sample() for _ in range(PHYSIO_SEQ_LEN)])


# ─── Queue helper ─────────────────────────────────────────────────────────────

async def _safe_put(q: asyncio.Queue, item: dict, label: str) -> None:
    """Drop-safe queue put — discards oldest item if queue is full."""
    if q.full():
        try:
            q.get_nowait()
            print(f"[{label.upper()}] Queue full — dropped oldest item.")
        except asyncio.QueueEmpty:
            pass
    await q.put(item)
