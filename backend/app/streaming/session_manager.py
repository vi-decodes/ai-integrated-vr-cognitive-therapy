"""
session_manager.py — Therapy Session Lifecycle Manager

SINGLE SOURCE OF TRUTH for session state.

A "session" is one continuous VR therapy run — from the moment the therapist
clicks Start until they click Stop. Every log entry during that window carries
the same session_id so research analysts can group events by session.

API:
    start_session(patient_id=None)  → session_id (str UUID)
    end_session()                   → summary dict (or None if no active session)
    get_active_session_id()         → str | None
    get_active_session()            → dict | None  (full session metadata)

Thread safety:
    A threading.Lock guards all state mutations.
    Safe to call from both sync endpoints and async pipeline tasks.
"""

import threading
import time
from uuid import uuid4
from typing import Optional


# ─── Internal state ───────────────────────────────────────────────────────────
_lock             = threading.Lock()
_active_session: Optional[dict] = None   # None = no session running


# ─── Public API ───────────────────────────────────────────────────────────────

def start_session(patient_id: Optional[str] = None) -> str:
    """
    Start a new therapy session.

    Generates a UUID session_id, records the start timestamp, and stores
    optional patient_id metadata. If a session is already active it is
    ended automatically before the new one begins.

    Args:
        patient_id (str | None): Optional patient identifier for log linkage.

    Returns:
        str: The new session_id (UUID4 string).
    """
    global _active_session
    with _lock:
        if _active_session is not None:
            # Auto-close any previous session to avoid orphaned records
            print(f"[SESSION]   Previous session {_active_session['session_id']} "
                  f"was not ended — closing automatically.")

        session_id = str(uuid4())
        _active_session = {
            "session_id":  session_id,
            "patient_id":  patient_id,
            "started_at":  round(time.time(), 3),
            "ended_at":    None,
            "event_count": 0,
        }
        print(f"[SESSION]  Session STARTED — id={session_id}  patient={patient_id}")
        return session_id


def end_session() -> Optional[dict]:
    """
    End the currently active therapy session.

    Records the end timestamp and event count, then clears the active session.

    Returns:
        dict: Session summary with session_id, start/end timestamps, event_count.
        None: If no session was active.
    """
    global _active_session
    with _lock:
        if _active_session is None:
            print("[SESSION]   end_session() called but no session is active.")
            return None

        _active_session["ended_at"] = round(time.time(), 3)
        summary = dict(_active_session)
        duration = summary["ended_at"] - summary["started_at"]
        print(
            f"[SESSION]  Session ENDED — id={summary['session_id']}  "
            f"duration={duration:.1f}s  events={summary['event_count']}"
        )
        _active_session = None
        return summary


def get_active_session_id() -> Optional[str]:
    """
    Return the current session_id, or None if no session is running.
    Used by the orchestrator to stamp every fused packet.
    """
    with _lock:
        return _active_session["session_id"] if _active_session else None


def get_active_session() -> Optional[dict]:
    """Return a copy of the full active session metadata dict, or None."""
    with _lock:
        return dict(_active_session) if _active_session else None


def increment_event_count() -> None:
    """Increment the running event counter for the active session (called by logger)."""
    with _lock:
        if _active_session is not None:
            _active_session["event_count"] += 1
