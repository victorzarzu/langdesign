import json
import sys

if not len(sys.argv) == 3:
    print("Parameters error: <input_prompts_filename> <output_prompts_filename>")
    exit()

input_filename = sys.argv[1]
output_filename = sys.argv[2]

with open(input_filename, "r") as input_file:
    with open(output_filename, "w") as output_file:
        for line in input_file:
            try:
                json_line = json.loads(line)
                if not 'image' in json_line:
                    output_file.write(line)
            except:
                pass
