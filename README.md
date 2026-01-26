# 🧠 AI-Integrated VR Cognitive Therapy
### Internal Developer README

---

## ⚙️ SYSTEM REQUIREMENTS

- **Python:** `3.10 – 3.12` (recommended: **3.11**)
- **Node.js:** `18+`
- **npm:** Comes with Node.js
- **OS:** Windows / Linux / macOS

---

## 🐍 PYTHON SETUP (Backend + AI)

### 1️⃣ Check Python Installation
```bash
py --version
```

---

### 2️⃣ Create Virtual Environment
```bash
py -m venv venv
```

---

### 3️⃣ Activate Virtual Environment

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

---

### 4️⃣ Upgrade pip
```bash
py -m pip install --upgrade pip
```

---

### 5️⃣ Install Python Dependencies
```bash
py -m pip install fastapi uvicorn sqlalchemy numpy joblib scikit-learn deepface opencv-python pydantic
```

⚠️ **Note**  
You may see `InconsistentVersionWarning` from `scikit-learn`.  
This is **expected** because models were trained on an earlier version and is **safe for development**.

---

## 🚀 RUNNING THE PROJECT

---

### ▶️ Backend (FastAPI)
```bash
cd backend
py -m uvicorn app.main:app --reload
```

**Backend URLs**
- API Root → `http://127.0.0.1:8000`
- Swagger Docs → `http://127.0.0.1:8000/docs`

---

### ▶️ Frontend (React)
```bash
cd soft-vr-zen-main/soft-vr-zen-main
npm install
npm run dev
```

**Frontend URL**
- UI → `http://localhost:5173`

---

## 📁 FOLDER GUIDE (IMPORTANT)

---

### 🤖 `ai/` — Models & Inference Only
| Folder | Purpose |
|------|--------|
| `audio/` | Audio stress inference (MFCC → score) |
| `biofeedback/` | Physiological stress (WESAD RF model) |
| `face/` | Face emotion → stress score |
| `fusion/` | Multimodal score fusion logic |

🚫 No FastAPI  
🚫 No database code

---

### ⚙️ `backend/` — API & Orchestration
| File | Role |
|----|----|
| `app/main.py` | API routes |
| `app/inference.py` | End-to-end inference pipeline |
| `app/database.py` | Database setup |
| `app/schemas.py` | Request / response models |
| `app/models.py` | DB tables |

---

### 🖥️ `soft-vr-zen-main/` — Frontend UI
| File | Role |
|----|----|
| `pages/Dashboard.tsx` | Calls `/predict` |
| `services/api.ts` | Backend API wrapper |
| `App.tsx` | Routing |
| `main.tsx` | React bootstrap |

---

### 📊 `notebooks/` — Reference Only
- Training experiments  
- Feature exploration  
- Model validation  

❌ Not used at runtime  
❌ Safe to modify freely

---

## 🧪 CURRENT WORKING FLOW

```
Frontend → /predict
        → Physio Model
        → Audio Model
        → Face Model (optional)
        → Fusion
        → Stress State + Action
```

---

## 👥 NOTES FOR TEAMMATES

- Backend expects **processed features**, not raw sensor streams
- Frontend currently uses **placeholder inputs**
- Authentication & real-time capture are **future work**
- VR will consume **fused stress output only**

---

## ✅ CURRENT STATUS

- ✔ Backend inference working
- ✔ Frontend ↔ Backend connected
- ✔ Ready for Git commit
- ⏳ Real-time input & VR integration next
