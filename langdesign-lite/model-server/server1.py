from flask import Flask, request, jsonify, send_file
from PIL import Image
import io
from flask_cors import CORS
from diffusers import StableDiffusionInstructPix2PixPipeline
from diffusers.utils import load_image
from datasets import load_dataset
import torchvision.transforms as transforms
import torch

app = Flask(__name__)
CORS(app)

model_id = "victorzarzu/ip2p-interior-design-ft"
pipeline = StableDiffusionInstructPix2PixPipeline.from_pretrained(
    model_id, torch_dtype=torch.float16, use_auth_token=True
).to("mps")

@app.route('/design', methods=['POST'])
def design():
    if request.method != 'POST':
        return jsonify({'error': 'Only POST requests are allowed'}), 400
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image = request.files['image']
    
    prompt = request.form.get('prompt')
    print(prompt)
    
    image_pil = Image.open(image)
    image_pil = image_pil.convert('RGB')
    transposed_image = image_pil.transpose(Image.TRANSPOSE)

    image = transforms.ToTensor()(transposed_image)
    print(image.shape)
    with torch.no_grad():
        designed_image = pipeline(prompt, image = image_pil).images[0]
    
    #designed_image = transforms.ToPILImage()(designed_image)

    designed_image_bytes = io.BytesIO()
    designed_image.save(designed_image_bytes, format='JPEG')
    designed_image_bytes.seek(0)
    #filepath = './da.jpeg'
    
    # Save the image
    #transposed_image.save(filepath, format='JPEG')

    
    return send_file(designed_image_bytes, mimetype='image/jpeg')

if __name__ == '__main__':
    app.run(debug=True)