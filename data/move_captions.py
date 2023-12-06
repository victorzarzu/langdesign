import os


with open(os.path.join('captions_pairs', 'gpt4_prompts.jsonl'), 'w') as gpt_file:
    for filename in [filename for filename in os.listdir(os.path.join('captions_pairs')) if 'gpt4' in filename and not 'gpt4_prompts.jsonl' == filename]:
        with open(os.path.join('captions_pairs', filename), 'r') as file:
            for line in file:
                gpt_file.write(line)