"""
ai/biofeedback/model.py — PhysioModel: exact architecture matching physio_model.pth

Reverse-engineered from state_dict shapes (verified):
  net.0  Flatten
  net.1  Linear(10→128)
  net.2  BatchNorm1d(128)
  net.3  ReLU
  net.4  Dropout(0.3)
  net.5  Linear(128→64)    ← get_embedding() returns output here (64-dim)
  net.6  ReLU
  net.7  Linear(64→32)
  net.8  ReLU
  net.9  Linear(32→3)

Input : (batch, 10)  — flat physiological feature vector
Output: logits (batch, 3),  embedding (batch, 64)
"""

import torch
import torch.nn as nn


class PhysioModel(nn.Module):
    def __init__(self, input_dim: int = 10, num_classes: int = 3):
        super().__init__()

        self.net = nn.Sequential(
            nn.Flatten(),                    # 0
            nn.Linear(input_dim, 128),       # 1   net.1.weight [128,10]
            nn.BatchNorm1d(128),             # 2   net.2.weight [128]
            nn.ReLU(),                       # 3
            nn.Dropout(0.3),                 # 4
            nn.Linear(128, 64),              # 5   net.5.weight [64,128]  ← embedding
            nn.ReLU(),                       # 6
            nn.Linear(64, 32),               # 7   net.7.weight [32,64]
            nn.ReLU(),                       # 8
            nn.Linear(32, num_classes),      # 9   net.9.weight [3,32]
        )

    # ── Core forward ──────────────────────────────────────────────────────────

    def forward(self, x: torch.Tensor):
        """
        Args:
            x: (batch, 10)

        Returns:
            logits   : (batch, num_classes)
            embedding: (batch, 64)  — Linear(128→64) output, tapped at net[5]
        """
        embedding = None
        h = x
        for idx, layer in enumerate(self.net):
            h = layer(h)
            if idx == 5:                    # Linear(128→64) output
                embedding = h.detach().clone()

        logits = h
        return logits, embedding

    # ── Dedicated embedding API ───────────────────────────────────────────────

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """
        Return the 64-dim embedding WITHOUT computing the full classifier head.

        Args:
            x: (batch, 10)

        Returns:
            embedding: (batch, 64)
        """
        h = x
        for idx, layer in enumerate(self.net):
            h = layer(h)
            if idx == 5:
                return h        # (batch, 64)  — still in the graph for grad if needed
        raise RuntimeError("PhysioModel: layer 5 not reached — check net definition.")
