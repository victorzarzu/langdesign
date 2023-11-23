import os
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    pipeline,
    logging,
)
from peft import LoraConfig
from trl import SFTTrainer

base_model = "hg/llama13b"
tokenizer = AutoTokenizer.from_pretrained(base_model)

interion_design_dataset = "victorzarzu/interior-design-editing-prompts"

new_model = "llama-2-7b-chat-interior-design"

dataset = load_dataset(interion_design_dataset, split="train")
print(f'Number of prompts: {len(dataset)}')
print(f'Column names are: {dataset.column_names}')

compute_dtype = getattr(torch, "float16")

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=compute_dtype,
    bnb_4bit_use_double_quant=False,
)

model = AutoModelForCausalLM.from_pretrained(
    base_model,
    quantization_config=quant_config,
    device_map={"": 0}
)
model.config.use_cache = False
model.config.pretraining_tp = 1

tokenizer.padding_side = "right"

peft_params = LoraConfig(
    lora_alpha=16,
    lora_dropout=0.1,
    r=64,
    bias="none",
    task_type="CAUSAL_LM",
)

training_params = TrainingArguments(
    output_dir="./results",
    num_train_epochs=1,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=1,
    optim="paged_adamw_32bit",
    save_steps=25,
    logging_steps=25,
    learning_rate=2e-4,
    weight_decay=0.001,
    fp16=False,
    bf16=False,
    max_grad_norm=0.3,
    max_steps=-1,
    warmup_ratio=0.03,
    group_by_length=True,
    lr_scheduler_type="constant",
    report_to="tensorboard"
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    peft_config=peft_params,
    dataset_text_field="text",
    max_seq_length=None,
    tokenizer=tokenizer,
    args=training_params,
    packing=False,
)

trainer.model.save_pretrained(new_model)
trainer.tokenizer.save_pretrained(new_model)

prompt = """generate another such JSON object, different than the previous ones, but with for bedroom for interior design editing, but with just 1 feature change at a time (change, addition or removal), different from the previous answers. Respect the most succint format like this: json is on a single line in format {"input:", "edit:", "output:"}, with one json per line, without other text between jsons and without any other message"""
pipe = pipeline(task="text-generation", model=model, tokenizer=tokenizer, max_length=1000)
result = pipe(f"<s>[INST] {prompt} [/INST]")
print(result[0]['generated_text'])