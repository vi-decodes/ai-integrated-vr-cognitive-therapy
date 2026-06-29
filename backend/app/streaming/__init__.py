"""
streaming/__init__.py

Makes `streaming` a Python package AND exposes a single
`start_all_pipelines()` function that the FastAPI lifespan startup calls.
Keeps main.py clean — it only needs one import and one call.

PIPELINES STARTED:
    audio_pipeline  → CNN + LSTM, polls every 2 s, reads from audio_buffer
    physio_pipeline → LSTM, polls every 2 s, samples internally every 0.5 s
    orchestrator    → fuses both modalities every 1 s using deep fusion model
    logger          → consumes log_queue, appends to sessions/{session_id}.jsonl
"""

import asyncio

from .audio_pipeline  import run_audio_pipeline
from .physio_pipeline import run_physio_pipeline
from .orchestrator    import run_orchestrator
from .logger          import run_logger
from .               import queues


_pipeline_tasks = []

async def start_all_pipelines() -> None:
    """
    Schedule all pipeline coroutines as concurrent asyncio tasks.
    """
    global _pipeline_tasks
    if _pipeline_tasks:
        print("[STREAMING]  Pipelines already running. Skipping start.")
        return

    print("[STREAMING]  Starting 2-modality pipelines (audio + physio)...")

    # Clear old queues to prevent stale data
    while not queues.audio_queue.empty(): queues.audio_queue.get_nowait()
    while not queues.physio_queue.empty(): queues.physio_queue.get_nowait()
    while not queues.log_queue.empty(): queues.log_queue.get_nowait()
    while not queues.vr_queue.empty(): queues.vr_queue.get_nowait()

    _pipeline_tasks = [
        asyncio.create_task(run_audio_pipeline(queues.audio_queue), name="audio_pipeline"),
        asyncio.create_task(run_physio_pipeline(queues.physio_queue), name="physio_pipeline"),
        asyncio.create_task(
            run_orchestrator(
                audio_q=queues.audio_queue,
                physio_q=queues.physio_queue,
                vr_q=queues.vr_queue,
                log_q=queues.log_queue,
            ),
            name="orchestrator",
        ),
        asyncio.create_task(run_logger(queues.log_queue), name="logger"),
    ]

    print("[STREAMING]  All pipeline tasks created.")

async def stop_all_pipelines() -> None:
    """
    Cancel all running pipeline tasks and clear the list.
    """
    global _pipeline_tasks
    if not _pipeline_tasks:
        return
        
    print(f"[STREAMING]  Cancelling {len(_pipeline_tasks)} pipeline tasks...")
    for task in _pipeline_tasks:
        task.cancel()
    
    # Wait for cancellation to propagate
    await asyncio.gather(*_pipeline_tasks, return_exceptions=True)
    _pipeline_tasks.clear()

    # Drain vr_queue so no stale fused predictions reach the next session
    while not queues.vr_queue.empty():
        try: queues.vr_queue.get_nowait()
        except Exception: break

    print("[STREAMING]  All pipeline tasks cancelled.")
