"""
queues.py — Shared asyncio Queue Definitions (2-modality system)

QUEUE ROLES:
    audio_queue  → audio_pipeline puts packets; orchestrator reads
    physio_queue → physio_pipeline puts packets; orchestrator reads
    vr_queue     → orchestrator puts fused results; ws_endpoint reads
    log_queue    → orchestrator puts fused results; logger reads

NOTE:
    asyncio.Queue() is created at module-import time.  In Python 3.10+ this
    is safe when the module is first imported inside an async context
    (FastAPI lifespan startup hook).
    maxsize prevents unbounded growth if consumers fall behind.
"""

import asyncio

# ─── Input queues (one per sensing modality) ──────────────────────────────────

# Audio CNN+LSTM pipeline → orchestrator
audio_queue: asyncio.Queue = asyncio.Queue(maxsize=10)

# Physio LSTM pipeline → orchestrator
physio_queue: asyncio.Queue = asyncio.Queue(maxsize=10)

# ─── Output queues (orchestrator → consumers) ─────────────────────────────────

# Fused stress result → WebSocket endpoint (Unity)
vr_queue: asyncio.Queue = asyncio.Queue(maxsize=20)

# Fused stress result → file logger
log_queue: asyncio.Queue = asyncio.Queue(maxsize=20)
