from pydantic import BaseModel
from typing import List, Optional


class PredictionInput(BaseModel):
    physio_features: List[float]
    audio_mfcc: Optional[List[float]] = None


class PredictionOutput(BaseModel):
    fused_score: float
    stress_state: str
    confidence: float
    environment_action: str
