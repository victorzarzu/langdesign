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

# Create the model's pipeline using HuggingFace
model_id = "victorzarzu/ip2p-interior-design-ft"
pipeline = StableDiffusionInstructPix2PixPipeline.from_pretrained(
    model_id, torch_dtype=torch.float16, use_auth_token=True
).to("mps") # Loading the model to mps for accessing the performance of the GPU

@app.route('/design', methods=['POST'])
def design():
    # Check if the request is a POST request
    if request.method != 'POST':
        return jsonify({'error': 'Only POST requests are allowed'}), 400
    
    # Check if the image is provided
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image = request.files['image'] # Extract the image from the request
    prompt = request.form.get('prompt') # Extract the prompt from the request

    print('fdsalkfhsdakjfhdsjkafhjdsjkalhfdjskahfdajskfhajdklfhdajks')
    print(prompt)
    
    # Convert the image to a tensor for the model
    image_pil = Image.open(image)
    image_pil = image_pil.convert('RGB')
    image = transforms.ToTensor()(image_pil)

    # Design the image using the model
    with torch.no_grad():
        designed_image = pipeline(prompt = prompt, image = image).images[0]
    
    # Convert the designed image to bytes
    designed_image_bytes = io.BytesIO()
    designed_image.save(designed_image_bytes, format='JPEG')
    designed_image_bytes.seek(0)
    
    # Return the designed image as a jpeg one
    return send_file(designed_image_bytes, mimetype='image/jpeg')

if __name__ == '__main__':
    app.run(debug=True)