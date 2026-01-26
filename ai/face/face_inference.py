
from deepface import DeepFace
import json

with open("face_emotion_mapper.json") as f:
    EMOTION_TO_STRESS = json.load(f)

def extract_face_emotions(image_path: str):
    result = DeepFace.analyze(
        img_path=image_path,
        actions=["emotion"],
        enforce_detection=False
    )
    emotions = result[0]["emotion"]
    dominant_emotion = result[0]["dominant_emotion"]
    face_confidence = result[0].get("face_confidence", 0.0)
    return emotions, dominant_emotion, face_confidence

def compute_face_stress_score(emotion_probs: dict) -> float:
    stress_score = 0.0
    for emotion, prob in emotion_probs.items():
        stress_score += (prob / 100.0) * EMOTION_TO_STRESS.get(emotion, 0.5)
    stress_score = max(0.0, min(1.0, stress_score))
    return round(stress_score, 3)

def predict_face_stress(image_path: str) -> dict:
    emotion_probs, dominant_emotion, face_confidence = extract_face_emotions(image_path)
    face_stress_score = compute_face_stress_score(emotion_probs)
    return {
        "face_stress_score": face_stress_score,
        "dominant_emotion": dominant_emotion,
        "face_confidence": round(float(face_confidence), 3)
    }
