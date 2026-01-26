AI-Integrated VR Cognitive Therapy – Developer Instructions

This README is only for running, understanding, and modifying the project.

System Requirements

Python: 3.10 – 3.12 (recommended: 3.11)

Node.js: 18+

npm: comes with Node

OS: Windows / Linux / macOS

Python Setup (IMPORTANT)

Check Python:

py --version


Create a virtual environment (recommended):

py -m venv venv


Activate it:

Windows

venv\Scripts\activate


Linux / macOS

source venv/bin/activate


Upgrade pip:

py -m pip install --upgrade pip

Python Dependencies (Backend + AI)

Install all required packages:

py -m pip install fastapi uvicorn sqlalchemy numpy joblib scikit-learn deepface opencv-python pydantic


⚠️ Ignore sklearn version warnings for now — models were trained earlier and still work correctly.

How to Run the Project (Local)
1️⃣ Backend (FastAPI)
cd backend
py -m uvicorn app.main:app --reload


Backend URL: http://127.0.0.1:8000

API docs: http://127.0.0.1:8000/docs

2️⃣ Frontend (React)
cd soft-vr-zen-main/soft-vr-zen-main
npm install
npm run dev


Frontend URL: http://localhost:5173

Dashboard button calls backend /predict

Folder Purpose (Short & Direct)
ai/

Contains trained models + inference code only

audio/ → Audio stress inference (MFCC based)

biofeedback/ → Physiological stress inference (WESAD RF model)

face/ → Face emotion → stress score

fusion/ → Multimodal score fusion

backend/

FastAPI service

Important files:

app/main.py → API routes

app/inference.py → Multimodal inference pipeline

app/database.py → DB setup

app/schemas.py → API input/output models

soft-vr-zen-main/

Frontend UI (React + TypeScript)

Important files:

pages/Dashboard.tsx → Calls backend /predict

services/api.ts → API wrapper

notebooks/

Reference notebooks only (training & experiments)

Not used during runtime.

Notes for Contributors

Backend expects processed features, not raw signals

AI models are loaded from ai/ folder

Frontend currently uses placeholder data

VR integration will consume backend output only