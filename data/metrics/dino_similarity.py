from __future__ import annotations

import clip
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import hub
from einops import rearrange
from transformers import AutoImageProcessor, AutoModel

class DinoSimilarity(nn.Module):
    def __init__(self):
        super().__init__()

        self.device = torch.device('cuda' if torch.cuda.is_available() else "cpu") 
        self.processor = AutoImageProcessor.from_pretrained('facebook/dinov2-base')
        self.model = AutoModel.from_pretrained('facebook/dinov2-base').to(self.device)
        self.size = 768

        self.register_buffer("mean", torch.tensor((0.48145466, 0.4578275, 0.40821073)).to(self.device))
        self.register_buffer("std", torch.tensor((0.26862954, 0.26130258, 0.27577711)).to(self.device))
    
    def encode_image(self, image: torch.Tensor) -> torch.Tensor:
        maxVal = torch.max(image)
        minVal = torch.min(image)
        image = (image - minVal) / (maxVal - minVal)
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        output = self.model(**inputs)
        image_features = output.last_hidden_state.squeeze(0)
        image_features = image_features / image_features.norm(dim=1, keepdim=True)
        return image_features

    def forward(self, image_0: torch.Tensor, image_1: torch.Tensor) -> torch.Tensor:
        image_features_0 = self.encode_image(image_0)
        image_features_1 = self.encode_image(image_1)
        dino_sim = F.cosine_similarity(image_features_0, image_features_1)
        return (torch.mean(dino_sim) + 1) / 2
