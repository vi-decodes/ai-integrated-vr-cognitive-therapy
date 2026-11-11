"""
ai/audio/model.py — AudioModel: exact architecture matching audio_model_full.pth

Reverse-engineered from state_dict shapes (verified):
  cnn.0  Conv1d(120→64, k=3, padding=1)
  cnn.1  BatchNorm1d(64)
  cnn.4  Conv1d(64→128, k=3, padding=1)
  cnn.5  BatchNorm1d(128)
  lstm   LSTM(input=128, hidden=64)   [weight_ih_l0: 256×128]
  fc.0   Linear(64→32)
  fc.3   Linear(32→3)

Input  : (batch, 120, seq_len=32)  — channels-first
         120 = MFCC(40) + delta(40) + delta-delta(40), stacked as CNN channels.
         If only 40 MFCCs are available, inference zero-pads to 120.

Embedding for fusion (128-dim):
    The TRAINING pipeline used the CNN output at the last time-step as the
    embedding fed into the FusionModel (net.0.weight is [128, 192] →
    audio contributes 128 dims, physio contributes 64 dims).
    get_embedding() returns this 128-dim vector.

Logits (3-class):
    Derived from the LSTM hidden state → fc head.
"""

import torch
import torch.nn as nn


class AudioModel(nn.Module):
    def __init__(self, in_channels: int = 120, hidden_dim: int = 64,
                 num_classes: int = 3):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv1d(in_channels, 64,  kernel_size=3, padding=1),  # 0
            nn.BatchNorm1d(64),                                       # 1
            nn.ReLU(),                                                # 2
            nn.MaxPool1d(kernel_size=2, stride=2),                    # 3  32→16
            nn.Conv1d(64, 128, kernel_size=3, padding=1),             # 4
            nn.BatchNorm1d(128),                                      # 5
            nn.ReLU(),                                                # 6
            nn.MaxPool1d(kernel_size=2, stride=2),                    # 7  16→8
        )

        # LSTM: time-steps come from CNN output channels over reduced time axis
        self.lstm = nn.LSTM(input_size=128, hidden_size=hidden_dim,
                            batch_first=True)

        # Classifier head: hidden(64) → 32 → num_classes
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),   # 0
            nn.ReLU(),                   # 1
            nn.Dropout(0.3),             # 2
            nn.Linear(32, num_classes),  # 3
        )

    # ── Core forward ──────────────────────────────────────────────────────────

    def forward(self, x: torch.Tensor):
        """
        Args:
            x: (batch, 120, 32)  — channels-first MFCC input

        Returns:
            logits   : (batch, num_classes)
            embedding: (batch, 128)  — CNN last-timestep features (for fusion)
        """
        cnn_out   = self.cnn(x)                   # (batch, 128, T)  T=8 after 2×pool

        # Embedding = CNN channels at the final reduced time-step
        embedding = cnn_out[:, :, -1]             # (batch, 128)

        # LSTM classification path
        lstm_in   = cnn_out.permute(0, 2, 1)      # (batch, T, 128)
        lstm_out, _ = self.lstm(lstm_in)
        h         = lstm_out[:, -1, :]            # (batch, 64)
        logits    = self.fc(h)                    # (batch, num_classes)

        return logits, embedding

    # ── Dedicated embedding API ───────────────────────────────────────────────

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """
        Return the 128-dim CNN embedding WITHOUT computing logits.

        Args:
            x: (batch, 120, 32)

        Returns:
            embedding: (batch, 128)
        """
        cnn_out = self.cnn(x)       # (batch, 128, T)
        return cnn_out[:, :, -1]    # (batch, 128)
