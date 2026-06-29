"""
AI Package — 2-modality Multimodal Stress Inference

Components:
    audio/       CNN + LSTM — stress from MFCC sequences
    biofeedback/ LSTM — stress from physiological time-series (WESAD-compatible)
    fusion/      Deep fusion MLP — stress from concatenated embeddings

Usage:
    from ai.audio.audio_inference        import predict_audio
    from ai.biofeedback.physio_inference import predict_physio
    from ai.fusion.fusion_inference      import fuse
"""