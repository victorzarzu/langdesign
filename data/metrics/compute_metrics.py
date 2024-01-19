from __future__ import annotations

import math
import random
import sys
from argparse import ArgumentParser
import os

import einops
import k_diffusion as K
import numpy as np
import torch
import torch.nn as nn
from tqdm.auto import tqdm
from einops import rearrange
from omegaconf import OmegaConf
from PIL import Image, ImageOps
from torch import autocast

import json
import matplotlib.pyplot as plt
import seaborn
from pathlib import Path

sys.path.append("./")

from clip_similarity import ClipSimilarity
from dino_similarity import DinoSimilarity
from edit_dataset import EditDatasetEval
from l1_norm import L1Norm

sys.path.append("./stable_diffusion")

from ldm.util import instantiate_from_config


class CFGDenoiser(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.inner_model = model

    def forward(self, z, sigma, cond, uncond, text_cfg_scale, image_cfg_scale):
        cfg_z = einops.repeat(z, "1 ... -> n ...", n=3)
        cfg_sigma = einops.repeat(sigma, "1 ... -> n ...", n=3)
        cfg_cond = {
            "c_crossattn": [torch.cat([cond["c_crossattn"][0], uncond["c_crossattn"][0], uncond["c_crossattn"][0]])],
            "c_concat": [torch.cat([cond["c_concat"][0], cond["c_concat"][0], uncond["c_concat"][0]])],
        }
        out_cond, out_img_cond, out_uncond = self.inner_model(cfg_z, cfg_sigma, cond=cfg_cond).chunk(3)
        return out_uncond + text_cfg_scale * (out_cond - out_img_cond) + image_cfg_scale * (out_img_cond - out_uncond)


def load_model_from_config(config, ckpt, vae_ckpt=None, verbose=False):
    print(f"Loading model from {ckpt}")
    pl_sd = torch.load(ckpt, map_location="cpu")
    if "global_step" in pl_sd:
        print(f"Global Step: {pl_sd['global_step']}")
    sd = pl_sd["state_dict"]
    if vae_ckpt is not None:
        print(f"Loading VAE from {vae_ckpt}")
        vae_sd = torch.load(vae_ckpt, map_location="cpu")["state_dict"]
        sd = {
            k: vae_sd[k[len("first_stage_model.") :]] if k.startswith("first_stage_model.") else v
            for k, v in sd.items()
        }
    model = instantiate_from_config(config.model)
    m, u = model.load_state_dict(sd, strict=False)
    if len(m) > 0 and verbose:
        print("missing keys:")
        print(m)
    if len(u) > 0 and verbose:
        print("unexpected keys:")
        print(u)
    return model

class ImageEditor(nn.Module):
    def __init__(self, config, ckpt, vae_ckpt=None):
        super().__init__()
        
        config = OmegaConf.load(config)
        self.model = load_model_from_config(config, ckpt, vae_ckpt)
        self.model.eval().cuda()
        self.model_wrap = K.external.CompVisDenoiser(self.model)
        self.model_wrap_cfg = CFGDenoiser(self.model_wrap)
        self.null_token = self.model.get_learned_conditioning([""])

    def forward(
        self,
        image: torch.Tensor,
        edit: str,
        scale_txt: float = 7.5,
        scale_img: float = 1.0,
        steps: int = 15,
    ) -> torch.Tensor:
        assert image.dim() == 3
        assert image.size(1) % 64 == 0
        assert image.size(2) % 64 == 0
        with torch.no_grad(), autocast("cuda"), self.model.ema_scope():
            cond = {
                "c_crossattn": [self.model.get_learned_conditioning([edit])],
                "c_concat": [self.model.encode_first_stage(image[None]).mode()],
            }
            uncond = {
                "c_crossattn": [self.model.get_learned_conditioning([""])],
                "c_concat": [torch.zeros_like(cond["c_concat"][0])],
            }
            extra_args = {
                "uncond": uncond,
                "cond": cond,
                "image_cfg_scale": scale_img,
                "text_cfg_scale": scale_txt,
            }
            sigmas = self.model_wrap.get_sigmas(steps)
            x = torch.randn_like(cond["c_concat"][0]) * sigmas[0]
            x = K.sampling.sample_euler_ancestral(self.model_wrap_cfg, x, sigmas, extra_args=extra_args)
            x = self.model.decode_first_stage(x)[0]
            return x


def run_metrics(dataset, seed, editor, scale_txt, scale_img, clip_similarity, dino_similarity, l1_norm, filename, steps = 100, res = 512):
        print(len(dataset))
        print(f'Processing t={scale_txt}, i={scale_img}')
        torch.manual_seed(seed)
        perm = torch.randperm(len(dataset))
        count = 0
        i = 0

        sim_0_avg = 0
        sim_1_avg = 0
        sim_direction_avg = 0
        sim_image_avg = 0
        dino_sim_avg = 0
        l1_norm_avg = 0
        count = 0

        pbar = tqdm(total=len(dataset))
        while count < len(dataset):

            idx = perm[i].item()
            sample = dataset[idx]
            i += 1

            #gen = torch.load('img_tensor.pt')
            gen = editor(sample["image_0"].cuda(), sample["edit"], scale_txt=scale_txt, scale_img=scale_img, steps=steps)
            torch.save(gen[None], os.path.join(f'generated_tensors/{sample["seed"]}.pt'))
            #print(sample["image_0"][None].shape, sample["image_1"][None].shape)

            l1_norm_val = l1_norm(gen[None].cuda(), sample["image_1"][None].cuda())
            dino_sim = dino_similarity(sample["image_0"][None].cuda(), gen[None].cuda())

            #save the tensor after generation to be computational cheaper afterwards for new metrics
            sim_0, sim_1, sim_direction, sim_image = clip_similarity(
                sample["image_0"][None].cuda(), gen[None].cuda(), [sample["input_prompt"]], [sample["output_prompt"]]
            )
            sim_0_avg += sim_0.item()
            sim_1_avg += sim_1.item()
            sim_direction_avg += sim_direction.item()
            sim_image_avg += sim_image.item()
            dino_sim_avg += dino_sim.item()
            l1_norm_avg += l1_norm_val.item()

            print(dino_sim.item(), sim_image.item(), l1_norm_val.item())
            count += 1

            write_metrics(dino_sim=dino_sim_avg/count, sim_0=sim_0_avg/count, 
                            sim_1=sim_1_avg/count, sim_direction=sim_direction_avg/count,
                            sim_image=sim_image_avg/count, l1_norm=l1_norm_avg/count, count=count)
            pbar.update(count)
        pbar.close()

        dino_sim_avg /= count
        sim_0_avg /= count
        sim_1_avg /= count
        sim_image_avg /= count
        sim_direction_avg /= count

 
def compute_metrics(config,
                    model_path, 
                    vae_ckpt,
                    data_path,
                    output_path, 
                    scales_img, 
                    scales_txt, 
                    split = "test", 
                    steps = 100, 
                    res = 512, 
                    seed = 0):
    editor = ImageEditor(config, model_path, vae_ckpt).cuda()
    clip_similarity = ClipSimilarity().cuda()
    dino_similarity = DinoSimilarity().cuda()
    l1_norm = L1Norm().cuda()


    for scale_txt in scales_txt:
        for scale_img in scales_img:
            train_dataset = EditDatasetEval(
                    path=data_path, 
                    split='train', 
                    res=res
                    )
            test_dataset = EditDatasetEval(
                    path=data_path, 
                    split='test', 
                    res=res
                    )
            run_metrics(dataset=train_dataset, seed=seed, editor=editor, 
                        scale_txt=scale_txt, scale_img=scale_img, clip_similarity=clip_similarity,
                        dino_similarity=dino_similarity, l1_norm=l1_norm, filename='./train_metrics.txt', 
                        steps=steps, res=res)
            run_metrics(dataset=test_dataset, seed=seed, editor=editor, 
                        scale_txt=scale_txt, scale_img=scale_img, clip_similarity=clip_similarity,
                        dino_similarity=dino_similarity, l1_norm=l1_norm, filename='./test_metrics.txt', 
                        steps=steps, res=res)

def write_metrics(dino_sim, sim_0, sim_1, sim_direction, sim_image, l1_norm, count, filename='metrics.txt'):
    with open(filename, "w") as file:
        file.write(f"Dino Similarity: {dino_sim}\n")
        file.write(f"L1 Norm: {l1_norm}\n")
        file.write(f"Clip Similarity 0: {sim_0}\n")
        file.write(f"Clip Similarity 1: {sim_1}\n")
        file.write(f"Clip Directional Similarity: {sim_direction}\n")
        file.write(f"Clip Image Similarity: {sim_image}\n")
        file.write(f"Number of samples: {count}\n")

def plot_metrics(metrics_file, output_path):
    
    with open(metrics_file, 'r') as f:
        data = [json.loads(line) for line in f]
        
    plt.rcParams.update({'font.size': 11.5})
    seaborn.set_style("darkgrid")
    plt.figure(figsize=(20.5* 0.7, 10.8* 0.7), dpi=200)

    x = [d["sim_direction"] for d in data]
    y = [d["sim_image"] for d in data]

    plt.plot(x, y, marker='o', linewidth=2, markersize=4)

    plt.xlabel("CLIP Text-Image Direction Similarity", labelpad=10)
    plt.ylabel("CLIP Image Similarity", labelpad=10)

    plt.savefig(Path(output_path) / Path("plot.pdf"), bbox_inches="tight")

def main():
    parser = ArgumentParser()
    parser.add_argument("--resolution", default=512, type=int)
    parser.add_argument("--steps", default=100, type=int)
    parser.add_argument("--config", default="configs/generate.yaml", type=str)
    parser.add_argument("--output_path", default="analysis/", type=str)
    parser.add_argument("--ckpt", default="checkpoints/instruct-pix2pix-00-22000.ckpt", type=str)
    parser.add_argument("--dataset", default="data/clip-filtered-dataset/", type=str)
    parser.add_argument("--vae-ckpt", default=None, type=str)
    args = parser.parse_args()

    #scales_img = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2]
    scales_img = [1.5] #paper value
    scales_txt = [7.5] #paper value
    
    compute_metrics(
            args.config,
            args.ckpt, 
            args.vae_ckpt,
            args.dataset, 
            args.output_path, 
            scales_img, 
            scales_txt,
            steps = args.steps,
            )
    
    #plot_metrics(metrics_file, args.output_path)
        


if __name__ == "__main__":
    main()
