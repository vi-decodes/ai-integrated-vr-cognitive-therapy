from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    physio_score = Column(Float)
    audio_score = Column(Float, nullable=True)
    face_score = Column(Float, nullable=True)
    fused_score = Column(Float)

    stress_state = Column(String)
    environment_action = Column(String)
