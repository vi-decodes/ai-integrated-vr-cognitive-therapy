from ai.biofeedback.physio_inference import predict_physio_stress
from ai.audio.audio_inference import predict_audio_stress
from ai.fusion.fusion_inference import fuse_scores, stress_state_from_score


def run_inference(
    physio_features,
    audio_mfcc=None,
    face_score=None
):
    """
    Central inference orchestrator.
    All modality functions must return FLOAT scores (0–1).
    """

    # 1️⃣ Physio (mandatory)
    physio_score = predict_physio_stress(physio_features)

    # 2️⃣ Audio (optional)
    audio_score = None
    if audio_mfcc is not None:
        audio_score = predict_audio_stress(audio_mfcc)

    # 3️⃣ Fusion
    fused_score = fuse_scores(
        physio=physio_score,
        audio=audio_score,
        face=face_score
    )

    # 4️⃣ State + VR action
    stress_state, action = stress_state_from_score(fused_score)

    return {
        "physio_score": physio_score,
        "audio_score": audio_score,
        "face_score": face_score,
        "fused_score": fused_score,
        "stress_state": stress_state,
        "environment_action": action
    }
