# LangDesign

[Short paper](https://github.com/user-attachments/files/17021268/11.pdf)

The goal of the project is to explore the task of prompt based image editing in a context-specific environment. The general problem is tackled by well-known models such as [InstructPix2Pix](https://arxiv.org/abs/2211.09800) and [Emu Edit](https://emu-edit.metademolab.com). However, while these models perform well on average, there is no method of specializing them in a context-specific environment. The project is provides a cheap, fast and reliable way of producing a context-specific dataset for the intruction-based image editing for supervised learning, proving the method's efficiency through a fine-tune round on the InstructPix2Pix model. The chosen context for the analysis was interior-design due to the poor performance of the currently existing models in such a setting.
Moreover, a strech goal of the project is to improve the edit localization through cross-attention map regularization based on a segmentation mask computed by a Referring Segmentation Model (here [ReLA](https://arxiv.org/abs/2306.00968)), method extended based on the work in [LIME](https://enis.dev/LIME/).

# How is the data generated?

The context-specific dataset is generate in 2 steps.

## Text editing instructions generation.

To address the absence of initial descriptions and knowing that different rooms have different objects that characterize them, GPT-4 room-specific agents were created via in-context learning for generating the image captions and edit prompts. Additionally, this approach has the advantage of enabling the creation of data in a hierarchical way of difficulty for the editing model: it first creates paired captions for single objects followed by the ones with a description of rooms with more objects. Compared to [InstructPix2Pix](https://arxiv.org/abs/2211.09800), the presented method can be extended to any other special case of prompt-based image editing, without the prior need for data, hence independence on the existent datasets.

## Generating images from the paired editing instructions.

Starting from the paired editing instructions generated with the previous method, the Prompt-to-Prompt approach is used for generating the paired images based on their captions, generating 30 pairs for single object images and 50 for rooms, followed by CLIP filtering. The choice for fewer pairs for single object images comes from the idea that the fewer objects in the image, the less image diversity for the same caption pair will be, thus reducing the generation time. Furthermore, to increase the dataset size, and force the model to correctly identify the RoI for the edit by also providing misleading prompts, samples with an edit instruction that does not alter the initial image are introduced (e.g. removing an object that does not exist in the original image). 

## Example of generated instances

![compare_ip2p_our-1](https://github.com/user-attachments/assets/929be8fa-3a13-4453-9deb-2363b6909b15)

## Results

As shown in the table below, the proposed approach improves the performance of the model considerably after fine-tuning across different metrics computed as the cosine similarity between the features extracted using [CLIP](https://github.com/openai/CLIP) and [DINOv2](https://github.com/facebookresearch/dinov2). The various CLIP metrics presented in the table compute different types of similarities consisting of the similarity between the input and output images CLIP<sub>im</sub> the similarity between the edited image and its textual description CLIP<sub>out</sub>, and the similarity between the changes in the captions and the images CLIP<sub>dir</sub>, while DINO only computes the similarity between the initial and edited image.

| Model   | $\text{CLIP}_{\text{im}} \uparrow$ | $\text{CLIP}_{\text{dir}} \uparrow$ | $\text{CLIP}_{\text{out}} \uparrow$ | $\text{DINO} \uparrow$ |
|---------|-----------------------------------|------------------------------------|------------------------------------|------------------------|
| IP2P    | 84.25                             | 0.025                              | 26.16                              | 87.67                  |
| IP2P-FT | **92.21**                         | **0.063**                          | **29.17**                          | **94.54**              |

Comparisons between the initial model and the fine-tuned one on the generated data.
![new_model_edits-2-1](https://github.com/user-attachments/assets/76ac5c00-3d1a-4fbb-8156-7a897c2b4592)

# Enhancing RoI detection using a Referring Expression Segmentation model

I proposed an alternative approach to the one introduced in LIME by leveraging the overwhelming performance of the recent state-of-the-art text-based segmentation model, ReLA. The use of ReLA for computing the RoI has the advantage of allowing context-dependent references like *"The right blue chair."*, thus enabling a better and more general localization.

![gres_enhance-1](https://github.com/user-attachments/assets/f06a9958-14e7-4174-a89a-71374ee08842)

To be able to integrate ReLA in the editing pipeline, we propose the solution showcased in the figure below. For extracting the object(s) reference out of the edit prompt, we create an LLM agent via in-context learning using the 8B version of the most recent [Llama3](https://github.com/meta-llama/llama3) model. Afterward, we compute the text-based segmentation map determined by ReLA and feed it along with the initial image and the edit prompt in the modified version of InstructPix2Pix that applies cross-attention map regularization. We use the same approach of negatively regularizing the unrelated tokens to the edit (e.g. padding tokens) which also offers the model more freedom in the edit application compared to the positive regularization of the related tokens.

## Results

![gres_enhance_results-2-1](https://github.com/user-attachments/assets/be69683b-3f5a-411b-a644-3d338c20dad4)

# LanDesign platform

<img width="1800" alt="design_image" src="https://github.com/user-attachments/assets/097462ec-b009-4479-89eb-0eb3ca2a8cb2">

## Tree-like organization

Every design is organized as a tree, the user being able to navigate through the tree based on the desired prompts.

![licenta-7-1](https://github.com/user-attachments/assets/cfdd6d44-c2a1-410f-9211-850201554b10)


This repo is based on the [InstructPix2Pix](https://github.com/timothybrooks/instruct-pix2pix) and [ReLA](https://github.com/henghuiding/ReLA).
