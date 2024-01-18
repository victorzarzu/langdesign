
from __future__ import annotations

import clip
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import hub
from einops import rearrange
from transformers import AutoImageProcessor, AutoModel

class L1Norm(nn.Module):
    def __init__(self):
        super().__init__()

        self.device = torch.device('cuda' if torch.cuda.is_available() else "cpu") 
        self.processor = AutoImageProcessor.from_pretrained('facebook/dinov2-base')
        self.model = AutoModel.from_pretrained('facebook/dinov2-base').to(self.device)
        self.size = 768

        self.register_buffer("mean", torch.tensor((0.48145466, 0.4578275, 0.40821073)).to(self.device))
        self.register_buffer("std", torch.tensor((0.26862954, 0.26130258, 0.27577711)).to(self.device))
    
    def normalize(self, image: torch.Tensor) -> torch.Tensor:
        image = F.interpolate(image.float(), size=self.size, mode="bicubic", align_corners=False)
        image = image - rearrange(self.mean, "c -> 1 c 1 1")
        image = image / rearrange(self.std, "c -> 1 c 1 1")

        return image

    def forward(self, image_0: torch.Tensor, image_1: torch.Tensor) -> torch.Tensor:
        image_0 = self.normalize(image_0)
        image_1 = self.normalize(image_1)

        return torch.mean(torch.abs(image_0 - image_1))
