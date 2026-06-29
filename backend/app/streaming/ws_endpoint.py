"""
ws_endpoint.py — WebSocket Stress Stream for Unity

WHY THIS FILE EXISTS:
    Unity needs to receive real-time stress updates over WebSocket.
    This file defines the handler for /ws/stress and exposes an APIRouter
    so main.py can register it with a single app.include_router() call.

UNITY SIDE:
    Connect to:  ws://localhost:8000/ws/stress
    Each message is a JSON string. Example:
    {
        "timestamp": 1710000002.0,
        "physio_score": 0.55,
        "audio_score":  0.62,
        "face_score":   0.40,
        "body_score":   0.30,
        "fused_score":  0.52,
        "stress_state": "mild"
    }

SIMPLIFICATION:
    Only ONE consumer at a time (Unity). No broadcast/fan-out needed.
    If Unity disconnects, the endpoint exits cleanly and queued items
    remain for the next connection.
"""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Import the shared vr_queue — orchestrator pushes here, we consume here
from .queues import vr_queue

# ─── Router ───────────────────────────────────────────────────────────────────
# main.py does: from .streaming.ws_endpoint import router
#               app.include_router(router)
# That's the standard, reliable FastAPI way to attach routes from sub-modules.
router = APIRouter()


@router.websocket("/ws/stress")
async def websocket_endpoint(websocket: WebSocket):
    """
    FastAPI WebSocket route registered via APIRouter.

    WHY APIRouter INSTEAD OF app.add_api_websocket_route():
        include_router() resolves at app startup and is the canonical FastAPI
        pattern for routes defined outside main.py. It avoids the ordering /
        decoration-timing issues that caused the 404.
    """
    print("[WS]  /ws/stress route HIT — client connecting...")
    await stress_ws(websocket)


# ─── Handler ──────────────────────────────────────────────────────────────────

async def stress_ws(websocket: WebSocket):
    """
    Core WebSocket handler — streams fused stress events to Unity.

    WHAT IT DOES:
        1. Accept the WebSocket connection
        2. Loop: wait for the next fused event on vr_queue
        3. Serialize to JSON and send as a text message
        4. On disconnect, exit cleanly

    WHY AWAIT vr_queue.get():
        Suspends the coroutine (not the thread!) until the orchestrator
        pushes a fused event — perfectly async, zero CPU spin while waiting.
    """
    print("[WS] Unity client connected.")
    await websocket.accept()

    try:
        while True:
            # Block (async) until orchestrator pushes the next fused result
            event = await vr_queue.get()
            print(f"[WS] Sending: fused={event.get('fused_score')}  state={event.get('stress_state')}")

            # Send as JSON text frame
            await websocket.send_text(json.dumps(event))

    except WebSocketDisconnect:
        # Unity closed the tab / connection — expected, not an error
        print("[WS] Unity client disconnected.")

    except Exception as e:
        # Unexpected error — log and close to avoid a zombie connection
        print(f"[WS]   Unexpected error: {e}")
        await websocket.close()
