import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "audio_stress_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "audio_scaler.pkl"))
label_encoder = joblib.load(os.path.join(BASE_DIR, "audio_label_encoder.pkl"))

# Map emotion → stress score
EMOTION_TO_STRESS = {
    "calm": 0.2,
    "neutral": 0.3,
    "happy": 0.2,
    "sad": 0.6,
    "fear": 0.8,
    "angry": 0.9
}


def predict_audio_stress(mfcc_features) -> float:
    """
    Input:
        mfcc_features: list[float] (length = 80)

    Output:
        audio_stress_score: float (0–1)
    """

    mfcc_features = list(mfcc_features)

    if len(mfcc_features) != scaler.n_features_in_:
        raise ValueError(
            f"Expected {scaler.n_features_in_} MFCC features, got {len(mfcc_features)}"
        )

    X = np.array(mfcc_features).reshape(1, -1)
    X_scaled = scaler.transform(X)

    pred_label = model.predict(X_scaled)[0]
    emotion = label_encoder.inverse_transform([pred_label])[0]

    stress_score = EMOTION_TO_STRESS.get(emotion, 0.5)
    return round(float(stress_score), 3)
