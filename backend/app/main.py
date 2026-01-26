from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from .database import get_db
from .models import SessionLog
from .schemas import PredictionInput, PredictionOutput
from .inference import run_inference
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title="AI-Integrated VR Cognitive Therapy API",
    description="Multimodal stress inference backend (Physio + Audio + Face)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/", include_in_schema=False)
def root():
    # Redirect root → Swagger
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@app.post("/predict", response_model=PredictionOutput)
def predict(
    input: PredictionInput,
    db: Session = Depends(get_db)
):
    # 1️⃣ Run multimodal inference
    result = run_inference(
        physio_features=input.physio_features,
        audio_mfcc=input.audio_mfcc,
        face_score=input.face_score
    )

    # 2️⃣ Persist session
    log = SessionLog(
        session_id=str(uuid4()),
        physio_score=result["physio_score"],
        audio_score=result["audio_score"] or 0.0,
        face_score=result["face_score"] or 0.0,
        fused_score=result["fused_score"],
        stress_state=result["stress_state"],
        environment_action=result["environment_action"]
    )

    db.add(log)
    db.commit()

    # 3️⃣ API response
    return PredictionOutput(
        fused_score=result["fused_score"],
        stress_state=result["stress_state"],
        environment_action=result["environment_action"]
    )
