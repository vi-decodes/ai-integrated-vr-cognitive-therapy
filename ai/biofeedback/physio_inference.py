import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

# Load trained RF model
model = joblib.load(os.path.join(BASE_DIR, "rf_5subject_deployment.pkl"))

# Label → stress mapping
CLASS_TO_STRESS = {
    0: 0.2,  # Calm
    1: 0.5,  # Mild
    2: 0.8   # Escalated
}

CLASS_NAMES = {
    0: "Calm",
    1: "Mild",
    2: "Escalated"
}


def predict_physio_stress(feature_vector) -> float:
    """
    Input:
        feature_vector: list or np.ndarray (HRV / EDA / ACC features)

    Output:
        physio_stress_score: float (0–1)
    """

    # ✅ SAFETY: convert list → numpy array
    X = np.array(feature_vector).reshape(1, -1)

    pred_class = model.predict(X)[0]
    stress_score = CLASS_TO_STRESS.get(pred_class, 0.5)

    return round(float(stress_score), 3)
