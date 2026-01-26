import json
import os

BASE_DIR = os.path.dirname(__file__)

with open(os.path.join(BASE_DIR, "fusion_config.json")) as f:
    CONFIG = json.load(f)

BASE_WEIGHTS = CONFIG["base_weights"]
FACE_CONF_MIN = CONFIG["confidence_thresholds"]["face_min"]

# ai/fusion/fusion_inference.py

def fuse_scores(physio, audio=None, face=None):
    """
    Weighted multimodal fusion
    All inputs are stress scores in range [0, 1]
    """

    weights = {
        "physio": 0.5,
        "audio": 0.25,
        "face": 0.25
    }

    score = weights["physio"] * physio

    if audio is not None:
        score += weights["audio"] * audio

    if face is not None:
        score += weights["face"] * face

    return round(score, 3)


def stress_state_from_score(score):
    """
    Converts fused stress score to discrete state + VR action
    """

    if score < 0.4:
        return "Calm", "Increase exposure slightly"
    elif score < 0.7:
        return "Mild", "Maintain current level"
    else:
        return "Escalated", "Reduce intensity / pause"
