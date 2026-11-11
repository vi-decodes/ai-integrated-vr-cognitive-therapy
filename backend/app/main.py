from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from uuid import uuid4
import asyncio
import json
from contextlib import asynccontextmanager

from .database import get_db
from .models import SessionLog
from .schemas import PredictionInput, PredictionOutput
from .inference import run_inference

import subprocess
from pathlib import Path

# Streaming subsystem
from .streaming import start_all_pipelines, stop_all_pipelines
from .streaming.queues import vr_queue
from .streaming import latest as _latest
from .streaming.audio_buffer import set_audio_sequence
from .streaming.session_manager import (
    start_session, end_session,
    get_active_session_id, get_active_session,
)

print("MAIN.PY RUNNING")

latest_prediction = {
    "fused_score": 0.2,
    "stress_state": "calm",
    "confidence": 1.0,
    "environment_action": "None"
}
VR_PROCESS = None
# ─────────────────────────────────────────────────────────────
# Lifespan (startup background tasks)
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[MAIN] FastAPI startup — ready to receive connections.")

    print("[MAIN] Registered routes:")
    for route in app.routes:
        print(f"  {getattr(route, 'path', '?')}")

    yield
    print("[MAIN] FastAPI shutdown.")


# ─────────────────────────────────────────────────────────────
# App init
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-Integrated VR Cognitive Therapy API",
    version="2.0.0",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────────────────────
# ✅ FIXED CORS (CRITICAL)
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",      # ✅ ADD THIS
    "http://127.0.0.1:8081",      # ✅ ADD THIS
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


# ─────────────────────────────────────────────────────────────
# Prediction
# ─────────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionOutput)
def predict(input: PredictionInput, db: Session = Depends(get_db)):
    result = run_inference(
        physio_features=input.physio_features,
        audio_mfcc=input.audio_mfcc,
    )

    session_id = get_active_session_id() or str(uuid4())

    log = SessionLog(
        session_id=session_id,
        physio_score=result["physio_score"],
        audio_score=result["audio_score"],
        fused_score=result["fusion_score"],
        stress_state=result["stress_state"],
        environment_action=result["environment_action"],
    )

    db.add(log)
    db.commit()

    return PredictionOutput(
        fused_score=result["fusion_score"],
        stress_state=result["stress_state"],
        confidence=result["confidence"],
        environment_action=result["environment_action"],
    )


# ─────────────────────────────────────────────────────────────
# Session APIs
# ─────────────────────────────────────────────────────────────
@app.post("/session/start")
async def session_start(body: dict = {}):
    patient_id = body.get("patient_id") if body else None
    
    # If a session is already active, stop it cleanly
    active_session_id = get_active_session_id()
    if active_session_id:
        await stop_all_pipelines()

    session_id = start_session(patient_id=patient_id)
    session = get_active_session()

    # Start the background tasks for this session
    await start_all_pipelines()

    print(f"[MAIN] Session started: {session_id}")

    return {
        "status": "started",
        "session_id": session_id,
        "started_at": session["started_at"],
        "patient_id": patient_id,
    }


@app.post("/session/end")
async def session_end():
    summary = end_session()

    if summary is None:
        return {"status": "error", "message": "No active session"}

    # Stop all background pipelines immediately
    await stop_all_pipelines()

    duration = summary["ended_at"] - summary["started_at"]

    print(f"[MAIN] Session ended: {summary['session_id']}")

    return {
        "status": "ended",
        "session_id": summary["session_id"],
        "duration_s": round(duration, 1),
        "event_count": summary["event_count"],
    }


@app.get("/session/status")
async def session_status():
    session = get_active_session()
    return {"active": bool(session), "session": session}


@app.get("/latest-stress")
async def latest_stress():
    return _latest.prediction
# ─────────────────────────────────────────────────────────────
# Audio Sequence Endpoint (REAL-TIME)
# ─────────────────────────────────────────────────────────────
@app.post("/audio_sequence")
async def receive_audio_sequence(request: dict):
    try:
        print("[MAIN] Received audio sequence")

        sequence = request.get("sequence", [])

        if len(sequence) != 32:
            return {"status": "error", "message": "Expected 32 frames"}

        if any(len(f) != 40 for f in sequence):
            return {"status": "error", "message": "Invalid MFCC size"}

        set_audio_sequence(sequence)

        print("[MAIN] Audio stored -> 32x40")

        return {"status": "ok"}

    except Exception as e:
        print("[ERROR]", e)
        return {"status": "error", "message": str(e)}


@app.post("/launch-vr")
async def launch_vr():
    global VR_PROCESS

    exe_path = Path(
        r"D:\ai-integrated-vr-cognitive-therapy\vr\Build\Simuverse-VR.exe"
    )

    if not exe_path.exists():
        return {
            "success": False,
            "message": "VR executable not found."
        }

    if VR_PROCESS is None or VR_PROCESS.poll() is not None:
        VR_PROCESS = subprocess.Popen([str(exe_path)])

        return {
            "success": True,
            "message": "VR launched successfully."
        }

    return {
        "success": True,
        "message": "VR is already running."
    }

@app.post("/close-vr")
async def close_vr():
    global VR_PROCESS

    if VR_PROCESS is not None and VR_PROCESS.poll() is None:
        VR_PROCESS.terminate()
        VR_PROCESS = None

    return {
        "success": True,
        "message": "VR closed."
    }
# ─────────────────────────────────────────────────────────────
# WebSocket (Unity)
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/stress")
async def ws_stress(websocket: WebSocket):
    print("[WS] Client connected")
    await websocket.accept()

    try:
        while True:
            try:
                # Use a timeout so we don't block forever if pipelines stop
                event = await asyncio.wait_for(vr_queue.get(), timeout=1.0)
                if get_active_session_id():
                    await websocket.send_text(json.dumps(event))
            except asyncio.TimeoutError:
                continue

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print("[WS ERROR]", e)