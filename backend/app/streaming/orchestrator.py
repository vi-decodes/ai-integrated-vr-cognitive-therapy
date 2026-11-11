"""
orchestrator.py — Central Fusion Orchestrator (2-modality: audio + physio)

WHAT IT DOES:
    Runs two concurrent async tasks:
        drain()     — reads from each modality queue, stores latest packet
        fuse_loop() — every FUSE_INTERVAL seconds, waits until BOTH modalities
                      have produced at least one packet, then calls the deep
                      learning fusion model and broadcasts the result.

FUSION LOGIC (lives in ai/fusion/fusion_inference.py):
    [audio_embedding (128,)] ─┬
                              ├─→ fuse() ─→ (fused_score, stress_state, confidence)
    [physio_embedding (64,)] ─┘
    concat → (192,) → FusionModel MLP

OUTPUT (pushed to vr_queue AND log_queue):
    {
        "timestamp":       float,   # Unix time
        "physio_score":    float,   # unimodal physio stress score
        "audio_score":     float,   # unimodal audio stress score
        "fused_score":     float,   # deep fusion output [0, 1]
        "stress_state":    str,     # "calm" | "mild" | "escalated"
        "confidence":      float    # fusion model confidence [0, 1]
    }
"""

import asyncioimport time
from ai.fusion.fusion_inference import fuse, DEFAULT_SCOREfrom . import latest as _latestfrom .audio_buffer import get_sequence_age as _get_audio_buffer_age

# How often the orchestrator fuses and broadcasts (seconds)
FUSE_INTERVAL = 1.0

# Sentinel value used before any real data arrives
_EMPTY_RESULT = {
    "stress_score":    DEFAULT_SCORE,
    "embedding":       [],
    "probabilities":   [0.0, 1.0, 0.0],
    "predicted_class": 1,
}


async def run_orchestrator(
    audio_q:  asyncio.Queue,
    physio_q: asyncio.Queue,
    vr_q:     asyncio.Queue,
    log_q:    asyncio.Queue,
) -> None:
    """
    Main orchestrator loop.

    Two concurrent tasks share a 'latest' dict that stores the most recent
    inference result from each modality.  fuse_loop() waits until both
    modalities have produced at least one real packet before enabling fusion,
    preventing false readings during the warmup period.
    """
    print("[ORCHESTRATOR] Started — 2-modality deep fusion (audio + physio).")

    # latest holds the most recent full inference result from each modality.
    # Initialised with DEFAULT_SCORE so early fuse calls don't crash.
    latest: dict = {
        "audio":  dict(_EMPTY_RESULT),
        "physio": dict(_EMPTY_RESULT),
    }

    # Track whether each modality has provided at least one real packet
    ready: dict = {"audio": False, "physio": False}

    # ── Inner coroutines ──────────────────────────────────────────────────────

    async def drain(q: asyncio.Queue, label: str) -> None:
        """Continuously consume a modality queue and update latest."""
        while True:
            try:
                packet = await q.get()
                latest[label] = packet
                ready[label]  = True
                print(
                    f"[ORCHESTRATOR] <- {label}  "
                    f"score={packet['stress_score']:.3f}  "
                    f"class={packet.get('predicted_class', '?')}  "
                    f"source={packet.get('source', '?')}"
                )
            except Exception as exc:
                print(f"[ORCHESTRATOR]   drain({label}) error: {exc}")

    async def fuse_loop() -> None:
        """Every FUSE_INTERVAL seconds, run deep fusion and broadcast."""
        while True:
            await asyncio.sleep(FUSE_INTERVAL)
            try:
                if not (ready["audio"] and ready["physio"]):
                    print(
                        "[ORCHESTRATOR] ⏳ Waiting for both modalities — "
                        f"audio={'' if ready['audio'] else '⏳'}  "
                        f"physio={'' if ready['physio'] else '⏳'}"
                    )
                    continue

                # ── Staleness Guard ───────────────────────────────────────────
                # AUDIO: use the buffer's own sequence timestamp, not the last
                # emitted packet's timestamp.  The stability filter and warmup
                # gate both suppress pipeline output without pushing a packet,
                # so latest["audio"]["timestamp"] goes stale even while the
                # frontend is sending audio every ~200 ms.  The buffer timestamp
                # is updated on every POST /audio_sequence regardless of gating.
                now = time.time()
                audio_buf_age = _get_audio_buffer_age()   # None if never received
                audio_age     = audio_buf_age if audio_buf_age is not None \
                                else (now - latest["audio"].get("timestamp", 0))
                physio_age    = now - latest["physio"].get("timestamp", 0)
                
                MAX_PACKET_AGE_S = 5.0
                if audio_age > MAX_PACKET_AGE_S or physio_age > MAX_PACKET_AGE_S:
                    print(
                        f"[ORCHESTRATOR]  Stale data detected: "
                        f"audio_age={audio_age:.1f}s physio_age={physio_age:.1f}s. Skipping fusion."
                    )
                    continue

                result = _build_fused_packet(latest)

                # Confidence gate: suppress low-certainty predictions from
                # reaching Unity to avoid distracting micro-fluctuations.
                CONFIDENCE_THRESHOLD = 0.7
                if result["confidence"] < CONFIDENCE_THRESHOLD:
                    print(
                        f"[FUSION] Low confidence ({result['confidence']:.3f} < "
                        f"{CONFIDENCE_THRESHOLD}) — skipping broadcast"
                    )
                    continue

                print(
                    f"[ORCHESTRATOR] Fused: "
                    f"physio={result['physio_score']:.3f}  "
                    f"audio={result['audio_score']:.3f}  "
                    f"-> fused={result['fused_score']:.4f}  "
                    f"[{result['stress_state']}]  "
                    f"conf={result['confidence']:.3f}"
                )

                # Store latest result for GET /latest-stress (Unity polling)
                _latest.prediction = {
                    "fused_score":        result["fused_score"],
                    "stress_state":       result["stress_state"],
                    "confidence":         result["confidence"],
                    "environment_action": "Reduce intensity" if result["stress_state"] == "escalated"
                                          else "Monitor" if result["stress_state"] == "mild"
                                          else "None",
                }

                await _safe_put(vr_q,  result,        "vr_queue")
                await _safe_put(log_q, dict(result),  "log_queue")

            except Exception as exc:
                print(f"[ORCHESTRATOR]   fuse_loop error: {exc}")

    # Run drain for each modality + fuse_loop concurrently
    await asyncio.gather(
        drain(audio_q,  "audio"),
        drain(physio_q, "physio"),
        fuse_loop(),
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_fused_packet(latest: dict) -> dict:
    """
    Extract embeddings and scalar scores from both modalities, then call fuse().

    The fusion function receives the full inference result dicts (which contain
    the embedding vectors) so it can perform deep embedding-level fusion.
    """
    audio_result  = latest["audio"]
    physio_result = latest["physio"]

    fused_score, stress_state, confidence = fuse(
        audio_result  = audio_result,
        physio_result = physio_result,
    )

    return {
        "timestamp":    round(time.time(), 3),
        "physio_score": round(physio_result.get("stress_score", DEFAULT_SCORE), 4),
        "audio_score":  round(audio_result.get("stress_score",  DEFAULT_SCORE), 4),
        "fused_score":  fused_score,
        "stress_state": stress_state,
        "confidence":   confidence,
    }


async def _safe_put(q: asyncio.Queue, item: dict, label: str) -> None:
    """Drop-safe queue put — discards oldest item if queue is full."""
    if q.full():
        try:
            q.get_nowait()
            print(f"[ORCHESTRATOR] {label} full — dropped oldest item.")
        except asyncio.QueueEmpty:
            pass
    await q.put(item)
