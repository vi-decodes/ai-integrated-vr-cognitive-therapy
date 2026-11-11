# /models — Trained Deep Learning Model Files

Place your trained model files in this directory before starting the server.

## Required Files

| File | Model | Framework | Input Shape | Output |
|---|---|---|---|---|
| `audio_model.h5` | CNN + LSTM (audio) | Keras/TF | `(1, 32, 40)` | logits `(3,)` + embedding `(64,)` |
| `physio_model.h5` | LSTM (physio) | Keras/TF | `(1, 10, 19)` | logits `(3,)` + embedding `(64,)` |
| `fusion_model.h5` | MLP (fusion) | Keras/TF | `(1, 128)` | softmax `(3,)` |

> If using **PyTorch**, name your files `audio_model.pt`, `physio_model.pt`, `fusion_model.pt`
> and update the loader block in each inference module accordingly.

## Enabling a Model

For each model:
1. Place the file here.
2. Open the corresponding inference module.
3. Uncomment the `load_model(...)` line.
4. Set `*_MODEL_READY = True`.

## Modules

```
ai/audio/audio_inference.py        — AUDIO_MODEL_READY
ai/biofeedback/physio_inference.py — PHYSIO_MODEL_READY
ai/fusion/fusion_inference.py      — FUSION_MODEL_READY
```

## Stub / Fallback Behaviour

When a model is NOT loaded the system operates in **stub mode**:
- Audio: heuristic based on mean MFCC energy
- Physio: heuristic based on HR and EDA values
- Fusion: weighted scalar average (physio 60%, audio 40%)

This keeps the full pipeline functional for integration testing
and Unity connectivity verification without model files.

## Input / Output Shapes (Reference)

### Audio Model
```
Input:  MFCC sequence  (batch=1, seq=32, coeffs=40)
Output: (logits, embedding)
        logits    shape (1, 3)   — softmax → [p_calm, p_mild, p_escalated]
        embedding shape (1, 64)  — passed to fusion model
```

### Physio Model
```
Input:  Physio window  (batch=1, seq=10, features=19)
Output: (logits, embedding)
        logits    shape (1, 3)
        embedding shape (1, 64)
```

### Fusion Model
```
Input:  Concatenated embeddings  (batch=1, features=128)
        = [audio_embedding(64) | physio_embedding(64)]
Output: softmax  shape (1, 3)   → [p_calm, p_mild, p_escalated]
```
