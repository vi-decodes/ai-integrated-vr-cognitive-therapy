"""
logger.py — Unified Session Logger

Every fused event from the orchestrator gets ONE canonical log entry:

    sessions/{session_id}.jsonl  — if a session is active
    sessions/unlinked.jsonl      — if no session is running (safety net)

FORMAT — NDJSON (one JSON object per line):
    {
        "session_id":   str,
        "timestamp":    float,
        "fused_score":  float,
        "stress_state": str,     # "calm" | "mild" | "escalated"
        "confidence":   float,
        "physio_score": float,
        "audio_score":  float
    }

WHY NDJSON:
    Trivially parseable: pd.read_json("sessions/X.jsonl", lines=True)
    Append-safe, one entry per line, one file per session.
"""

import asyncio
import json
from pathlib import Path

from .session_manager import get_active_session_id, increment_event_count

# Root directory for session log files
SESSIONS_DIR = Path("sessions")

# Safety-net file for events when no session is active
UNLINKED_LOG = SESSIONS_DIR / "unlinked.jsonl"


async def run_logger(log_q: asyncio.Queue):
    """
    Main logger loop — the unified logging consumer.

    Waits for fused events on log_q (pushed by orchestrator), stamps them
    with the current session_id, then appends to the per-session NDJSON file.

    If no session is active the event goes to unlinked.jsonl as a safety net
    so data is never silently dropped.
    """
    print("[LOGGER] Unified session logger started.")
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[LOGGER] Session logs directory: {SESSIONS_DIR.resolve()}")

    while True:
        try:
            event = await log_q.get()
            _write_event(event)
        except Exception as e:
            print(f"[LOGGER]   Error: {e}")


def _write_event(event: dict) -> None:
    """
    Stamp event with session_id and append to the correct NDJSON file.
    """
    session_id = get_active_session_id()

    if session_id:
        log_path = SESSIONS_DIR / f"{session_id}.jsonl"
        increment_event_count()
    else:
        log_path = UNLINKED_LOG
        session_id = "unlinked"

    record = {
        "session_id":   session_id,
        "timestamp":    event.get("timestamp"),
        "fused_score":  event.get("fused_score"),
        "stress_state": event.get("stress_state"),
        "confidence":   event.get("confidence", 0.0),
        "physio_score": event.get("physio_score"),
        "audio_score":  event.get("audio_score"),
    }

    line = json.dumps(record, ensure_ascii=False)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")

    print(
        f"[LOGGER]  Logged -> session={session_id[:8]}...  "
        f"fused={record['fused_score']}  state={record['stress_state']}"
    )
