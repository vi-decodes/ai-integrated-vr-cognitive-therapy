"""
ai/fusion/model.py — FusionModel: exact architecture matching fusion_model.pth

Reverse-engineered from state_dict:
  net.0  Linear(192→128)   ← input_dim=192 = audio_emb(128) + physio_emb(64)
  net.1  BatchNorm1d(128)
  net.4  Linear(128→64)
  net.7  Linear(64→32)
  net.9  Linear(32→3)
  (net.2=ReLU, net.3=Dropout, net.5=ReLU, net.6=Dropout, net.8=ReLU — inferred)

Input  : (batch, 192) = concat[ audio_embedding(128), physio_embedding(64) ]
Output : logits (batch, 3)
"""

import torch
import torch.nn as nn


class FusionModel(nn.Module):
    def __init__(self, input_dim: int = 192, num_classes: int = 3):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),   # 0   net.0.weight [128,192]
            nn.BatchNorm1d(128),         # 1   net.1.weight [128]
            nn.ReLU(),                   # 2
            nn.Dropout(0.3),             # 3
            nn.Linear(128, 64),          # 4   net.4.weight [64,128]
            nn.ReLU(),                   # 5
            nn.Dropout(0.3),             # 6
            nn.Linear(64, 32),           # 7   net.7.weight [32,64]
            nn.ReLU(),                   # 8
            nn.Linear(32, num_classes),  # 9   net.9.weight [3,32]
        )

    def forward(self, x: torch.Tensor):
        """
        Args:
            x: (batch, 192)  — concat of audio_emb(128) and physio_emb(64)
        Returns:
            logits: (batch, num_classes)
        """
        return self.net(x)
