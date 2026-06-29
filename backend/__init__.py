"""
Backend API Server for AI-Integrated VR Cognitive Therapy

This package provides the FastAPI-based REST API server that serves multimodal
stress inference predictions to the VR therapy frontend. It handles real-time
data from physiological sensors, audio capture, and facial analysis.

Key Components:
- FastAPI server with CORS support for frontend integration
- RESTful /predict endpoint for stress inference
- SQLAlchemy database integration for session logging
- Pydantic schemas for request/response validation

API Endpoints:
- POST /predict: Multimodal stress prediction
  - Input: physio_features (19), audio_mfcc (164), face_score (optional)
  - Output: Individual scores, fusion score, stress state, environment action

Database Models:
- SessionLog: Stores prediction results and therapeutic actions
- User/Patient management for therapy session tracking

Impact:
- Serves as the API bridge between VR frontend and AI inference engine
- Enables real-time therapeutic decision-making
- Critical for data persistence and therapy session analysis
- Foundation for scalable VR cognitive therapy platform
"""