import torch
from diffusers import StableDiffusionInstructPix2PixPipeline
from diffusers.utils import load_image
from datasets import load_dataset
import torchvision.transforms as transforms

model_id = "victorzarzu/ip2p-interior-design-ft"
pipeline = StableDiffusionInstructPix2PixPipeline.from_pretrained(
    model_id, torch_dtype=torch.float16, use_auth_token=True
).to("mps")

dataset = load_dataset(
    "victorzarzu/interior-design-prompt-editing-dataset-test",
    None, 
    cache_dir=None,
    use_auth_token=True,
)

print(dataset['train'][0]['edit_prompt'])
print(dataset['train'][0]['original_image'])
image = pipeline("Replace the brightly colored bathmat with a neutral-toned one.", image=dataset['train'][0]["original_image"]).images[0]
transform = transforms.ToTensor()
image.save("image1.png")
tensor_result = transform(image)
print(tensor_result.dtype)
print(tensor_result.to("mps").device)
#dataset['train'][3897]['original_image'].save("image.png")